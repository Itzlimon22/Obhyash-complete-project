import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/presentation/widgets/latex_text.dart';
import 'flashcard_mode.dart';
import 'practice_summary.dart';

// ─── Domain Model ────────────────────────────────────────────────────────────

class PracticeQuestion {
  final String id;
  final String subject;
  final String subjectLabel;
  final String questionText;
  final List<String> options;
  final int correctAnswerIndex;
  final String? explanation;
  final int points;

  const PracticeQuestion({
    required this.id,
    required this.subject,
    required this.subjectLabel,
    required this.questionText,
    required this.options,
    required this.correctAnswerIndex,
    this.explanation,
    this.points = 1,
  });

  factory PracticeQuestion.fromJson(Map<String, dynamic> j) {
    List<String> opts = [];
    if (j['options'] is List) {
      opts = (j['options'] as List).map((e) => e.toString()).toList();
    }
    return PracticeQuestion(
      id: j['id']?.toString() ?? '',
      subject: j['subject']?.toString() ?? 'general',
      subjectLabel:
          j['subject_label']?.toString() ??
          j['subject']?.toString() ??
          'General',
      questionText: j['question']?.toString() ?? '',
      options: opts,
      correctAnswerIndex: (j['correct_answer_index'] as num?)?.toInt() ?? 0,
      explanation: j['explanation']?.toString(),
      points: (j['points'] as num?)?.toInt() ?? 1,
    );
  }
}

// ─── View State ───────────────────────────────────────────────────────────────

enum _PracticeView { list, flashcard, summary }

// ─── View ─────────────────────────────────────────────────────────────────────

class PracticeDashboard extends ConsumerStatefulWidget {
  const PracticeDashboard({super.key});

  @override
  ConsumerState<PracticeDashboard> createState() => _PracticeDashboardState();
}

class _PracticeDashboardState extends ConsumerState<PracticeDashboard> {
  _PracticeView _view = _PracticeView.list;

  // List state
  String _activeTab = 'mistakes';
  String _subjectFilter = 'all';

  List<PracticeQuestion> _mistakes = [];
  final Map<String, int> _mistakeFreq = {};
  List<PracticeQuestion> _bookmarks = [];
  Set<String> _bookmarkedIds = {};
  int _totalBookmarks = 0;

  final Set<String> _selectedIds = {};
  bool _isLoading = true;
  bool _shuffle = false;

  // Spaced repetition
  static const int _reviewIntervalDays = 3;
  Map<String, DateTime> _reviewedAt = {};
  int _dueCount = 0;

  // Flashcard / summary state
  List<PracticeQuestion> _flashcardQuestions = [];
  List<FlashcardResult> _flashcardResults = [];

  // Internal maps used by paginated mistakes fetch
  final Map<String, PracticeQuestion> _mistakeMap = {};

  final ScrollController _scrollController = ScrollController();

  // Bookmarks Pagination
  int _bOffset = 0;
  bool _bHasMore = true;
  bool _bIsLoadingMore = false;

  // Mistakes Pagination
  int _mOffset = 0;
  bool _mHasMore = true;
  bool _mIsLoadingMore = false;
  static const int _limit = 20;

  @override
  void initState() {
    super.initState();
    _loadReviewedDates().then((_) => _fetchData());
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  // ── Spaced repetition helpers ───────────────────────────────────────────────

  Future<void> _loadReviewedDates() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('practice_reviewed_at') ?? '{}';
      final map = jsonDecode(raw) as Map<String, dynamic>;
      _reviewedAt = {
        for (final e in map.entries)
          e.key: DateTime.tryParse(e.value.toString()) ?? DateTime(2000),
      };
    } catch (e) {
      debugPrint('[PracticeDashboard] _loadReviewedDates error: $e');
    }
  }

  bool _isDue(String qid) {
    final last = _reviewedAt[qid];
    if (last == null) return true;
    return DateTime.now().difference(last).inDays >= _reviewIntervalDays;
  }

  int _computeDueCount() {
    return _mistakes.where((q) => _isDue(q.id)).length;
  }

  Future<void> _markReviewed(List<String> qids) async {
    final now = DateTime.now();
    for (final qid in qids) {
      _reviewedAt[qid] = now;
    }
    if (mounted) setState(() => _dueCount = _computeDueCount());
    try {
      final prefs = await SharedPreferences.getInstance();
      final payload = jsonEncode({
        for (final e in _reviewedAt.entries) e.key: e.value.toIso8601String(),
      });
      await prefs.setString('practice_reviewed_at', payload);
    } catch (e) {
      debugPrint('[PracticeDashboard] _markReviewed error: $e');
    }
  }

  // ── Data fetching ───────────────────────────────────────────────────────────

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    await Future.wait([
      _fetchBookmarks(isRefresh: true),
      _fetchMistakes(isRefresh: true),
    ]);
    if (mounted) {
      setState(() {
        _isLoading = false;
        _dueCount = _computeDueCount();
      });
    }
  }

  Future<void> _fetchBookmarks({bool isRefresh = false}) async {
    if (isRefresh) {
      _bOffset = 0;
      _bHasMore = true;
    }

    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) return;

      // Fetch total count first (only on refresh)
      if (isRefresh) {
        final countResponse = await sb
            .from('bookmarks')
            .select('question_id')
            .eq('user_id', uid)
            .count(CountOption.exact);
        if (mounted) {
          setState(() => _totalBookmarks = countResponse.count ?? 0);
        }
      }

      final bList = <PracticeQuestion>[];
      final bIds = <String>{};
      int orphanedCount = 0;

      while (bList.length < _limit && _bHasMore) {
        final bData = await sb
            .from('bookmarks')
            .select('question_id')
            .eq('user_id', uid)
            .range(_bOffset, _bOffset + _limit - 1);

        if ((bData as List).isNotEmpty) {
          final questionIds = bData
              .map((b) => b['question_id'] as String)
              .toList();
          final qData = await sb
              .from('questions')
              .select('*')
              .inFilter('id', questionIds);

          final qList = (qData as List).map((row) => PracticeQuestion.fromJson(row as Map<String, dynamic>)).toList();
          final qMap = {for (final q in qList) q.id: q};

          for (final qid in questionIds) {
            final q = qMap[qid];
            if (q != null) {
              bList.add(q);
              bIds.add(q.id);
            } else {
              orphanedCount++;
            }
          }
        }

        if (bData.length < _limit) {
          _bHasMore = false;
        }
        _bOffset += bData.length;
      }

      if (mounted) {
        setState(() {
          if (orphanedCount > 0) {
             _totalBookmarks = (_totalBookmarks - orphanedCount).clamp(0, 999999);
          }
          if (isRefresh) {
            _bookmarks = bList;
            _bookmarkedIds = bIds;
          } else {
            _bookmarks.addAll(bList);
            _bookmarkedIds.addAll(bIds);
          }
        });
      }
    } catch (e) {
      debugPrint('[PracticeDashboard] _fetchBookmarks error: $e');
    }
  }

  Future<void> _loadMoreBookmarks() async {
    if (_bIsLoadingMore || !_bHasMore) return;
    setState(() => _bIsLoadingMore = true);
    await _fetchBookmarks();
    if (mounted) setState(() => _bIsLoadingMore = false);
  }

  Future<void> _fetchMistakes({bool isRefresh = false}) async {
    if (isRefresh) {
      _mOffset = 0;
      _mHasMore = true;
      _mistakeMap.clear();
      _mistakeFreq.clear();
    }

    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) return;

      int initialCount = _mistakeMap.length;

      while ((_mistakeMap.length - initialCount) < _limit && _mHasMore) {
        final mData = await sb
            .from('exam_results')
            .select('questions, user_answers')
            .eq('user_id', uid)
            .not('questions', 'is', null)
            .not('user_answers', 'is', null)
            .order('created_at', ascending: false)
            .range(_mOffset, _mOffset + _limit - 1);

        for (final result in (mData as List)) {
          final questionsRaw = result['questions'];
          final userAnswersRaw = result['user_answers'];
          if (questionsRaw is! List || userAnswersRaw is! Map) continue;

          final userAnswers = Map<String, dynamic>.from(userAnswersRaw);

          for (final qData in questionsRaw) {
            if (qData is! Map<String, dynamic>) continue;
            final q = PracticeQuestion.fromJson(qData);
            if (q.id.isEmpty) continue;

            final raw = userAnswers[q.id];
            if (raw == null) continue;
            final userAnswer = (raw as num).toInt();
            if (userAnswer == -1) continue;
            if (userAnswer != q.correctAnswerIndex) {
              _mistakeMap[q.id] = q;
              _mistakeFreq[q.id] = (_mistakeFreq[q.id] ?? 0) + 1;
            }
          }
        }

        if (mData.length < _limit) _mHasMore = false;
        _mOffset += mData.length;
      }

      final sortedMistakes = _mistakeMap.values.toList()
        ..sort(
          (a, b) =>
              (_mistakeFreq[b.id] ?? 0).compareTo(_mistakeFreq[a.id] ?? 0),
        );

      if (mounted) {
        setState(() {
          _mistakes = sortedMistakes;
          _dueCount = _computeDueCount();
        });
      }
    } catch (e) {
      debugPrint('[PracticeDashboard] _fetchMistakes error: $e');
    }
  }

  Future<void> _loadMoreMistakes() async {
    if (_mIsLoadingMore || !_mHasMore) return;
    setState(() => _mIsLoadingMore = true);
    await _fetchMistakes();
    if (mounted) setState(() => _mIsLoadingMore = false);
  }

  // ── Bookmark toggle ─────────────────────────────────────────────────────────

  Future<void> _toggleBookmark(PracticeQuestion q) async {
    final qid = q.id;
    final sb = Supabase.instance.client;
    final uid = sb.auth.currentUser?.id;
    if (uid == null) return;

    final isMarked = _bookmarkedIds.contains(qid);
    setState(() {
      if (isMarked) {
        _bookmarkedIds.remove(qid);
        _bookmarks.removeWhere((b) => b.id == qid);
        _totalBookmarks = (_totalBookmarks - 1).clamp(0, _totalBookmarks);
      } else {
        _bookmarkedIds.add(qid);
        if (!_bookmarks.any((b) => b.id == qid)) _bookmarks.add(q);
        _totalBookmarks++;
      }
    });

    try {
      if (isMarked) {
        await sb
            .from('bookmarks')
            .delete()
            .eq('user_id', uid)
            .eq('question_id', qid);
      } else {
        await sb.from('bookmarks').insert({'user_id': uid, 'question_id': qid});
      }
    } catch (_) {
      // Revert silently
    }
  }

  // ── Derived getters ─────────────────────────────────────────────────────────

  List<PracticeQuestion> get _currentList {
    final base = _activeTab == 'mistakes' ? _mistakes : _bookmarks;
    if (_subjectFilter == 'all') return base;
    return base.where((q) => q.subject == _subjectFilter).toList();
  }

  List<MapEntry<String, String>> get _availableSubjects {
    final base = _activeTab == 'mistakes' ? _mistakes : _bookmarks;
    final map = <String, String>{};
    for (final q in base) {
      if (!map.containsKey(q.subject)) map[q.subject] = q.subjectLabel;
    }
    return map.entries.toList();
  }

  void _toggleSelectAll() {
    final list = _currentList;
    final allSelected = list.every((q) => _selectedIds.contains(q.id));
    setState(() {
      if (allSelected) {
        for (final q in list) {
          _selectedIds.remove(q.id);
        }
      } else {
        for (final q in list) {
          _selectedIds.add(q.id);
        }
      }
    });
  }

  void _launchFlashcard() {
    final list = _currentList;
    var qs = list.where((q) => _selectedIds.contains(q.id)).toList();
    if (qs.isEmpty) return;
    if (_shuffle) qs = (qs..shuffle());

    _markReviewed(qs.map((q) => q.id).toList());
    HapticFeedback.mediumImpact();
    setState(() {
      _flashcardQuestions = qs;
      _flashcardResults = [];
      _view = _PracticeView.flashcard;
    });
  }

  void _onFlashcardComplete(List<FlashcardResult> results) {
    setState(() {
      _flashcardResults = results;
      _view = _PracticeView.summary;
    });
  }

  void _onPracticeStruggling(List<PracticeQuestion> qs) {
    setState(() {
      _flashcardQuestions = qs;
      _flashcardResults = [];
      _view = _PracticeView.flashcard;
    });
  }

  void _onSummaryBack() {
    setState(() => _view = _PracticeView.list);
  }

  // ── Build ───────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    // Re-fetch if auth becomes available after cold-start session restoration
    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _fetchData();
    });

    if (_view == _PracticeView.flashcard) {
      return FlashcardMode(
        questions: _flashcardQuestions,
        onComplete: _onFlashcardComplete,
        onExit: () => setState(() => _view = _PracticeView.list),
      );
    }
    if (_view == _PracticeView.summary) {
      return PracticeSummary(
        results: _flashcardResults,
        onPracticeStruggling: _onPracticeStruggling,
        onBack: _onSummaryBack,
      );
    }

    return _buildListView();
  }

  Widget _buildListView() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final list = _currentList;

    return _isLoading
        ? const Center(child: CircularProgressIndicator())
        : CustomScrollView(
            controller: _scrollController,
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
                  child: Row(
                    children: [
                      _StatBox(
                        label: 'মোট ভুল',
                        value: _mistakes.length,
                        color: const Color(0xFFDC2626),
                        isDark: isDark,
                        icon: LucideIcons.xOctagon,
                      ),
                      const SizedBox(width: 8),
                      _StatBox(
                        label: 'বুকমার্ক',
                        value: _totalBookmarks,
                        color: const Color(0xFF16A34A),
                        isDark: isDark,
                        icon: LucideIcons.bookmark,
                      ),
                      const SizedBox(width: 8),
                      _StatBox(
                        label: 'রিভিউ বাকি',
                        value: _dueCount,
                        color: const Color(0xFF4F46E5),
                        isDark: isDark,
                        icon: LucideIcons.rotateCcw,
                      ),
                    ],
                  ),
                ),
              ),
              SliverPersistentHeader(
                pinned: true,
                delegate: _StickyHeaderDelegate(
                  isDark: isDark,
                  height: 82.0 +
                      (_availableSubjects.isNotEmpty ? 48.0 : 0.0) +
                      (list.isNotEmpty ? 44.0 : 8.0),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: Align(
                          alignment: Alignment.center,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF000000)
                                  : const Color(0xFFF5F5F5),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isDark
                                    ? const Color(0xFF1C1C1E)
                                    : const Color(0xFFE5E5E5),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _TabBtn(
                                  label: 'ভুল সমূহ (${_mistakes.length})',
                                  active: _activeTab == 'mistakes',
                                  isDark: isDark,
                                  onTap: () => setState(() {
                                    _activeTab = 'mistakes';
                                    _subjectFilter = 'all';
                                    _selectedIds.clear();
                                  }),
                                ),
                                _TabBtn(
                                  label: 'বুকমার্ক ($_totalBookmarks)',
                                  active: _activeTab == 'bookmarks',
                                  isDark: isDark,
                                  onTap: () => setState(() {
                                    _activeTab = 'bookmarks';
                                    _subjectFilter = 'all';
                                    _selectedIds.clear();
                                  }),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      if (_availableSubjects.isNotEmpty)
                        SizedBox(
                          height: 48,
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            children: [
                              _Pill(
                                label: 'সব বিষয়',
                                active: _subjectFilter == 'all',
                                isDark: isDark,
                                onTap: () => setState(() {
                                  _subjectFilter = 'all';
                                }),
                              ),
                              ..._availableSubjects.map(
                                (s) => _Pill(
                                  label: s.value,
                                  active: _subjectFilter == s.key,
                                  isDark: isDark,
                                  onTap: () => setState(() {
                                    _subjectFilter = s.key;
                                  }),
                                ),
                              ),
                            ],
                          ),
                        ),
                      if (list.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0),
                          child: _buildToolbar(list, isDark),
                        )
                      else
                        const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
              if (list.isEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: _emptyState(isDark),
                  ),
                )
              else ...[
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _buildQuestionCard(list[index], index, isDark),
                        );
                      },
                      childCount: list.length,
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: _buildLoadMoreButton(isDark),
                ),
              ],
            ],
          );
  }

  Widget _buildLoadMoreButton(bool isDark) {
    final hasMore = _activeTab == 'mistakes' ? _mHasMore : _bHasMore;
    final isLoadingMore = _activeTab == 'mistakes' ? _mIsLoadingMore : _bIsLoadingMore;

    if (!hasMore) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      child: Center(
        child: SizedBox(
          width: 200,
          child: ElevatedButton(
            onPressed: isLoadingMore
                ? null
                : () {
                    if (_activeTab == 'mistakes') {
                      _loadMoreMistakes();
                    } else {
                      _loadMoreBookmarks();
                    }
                  },
            style: ElevatedButton.styleFrom(
              backgroundColor: isDark ? const Color(0xFF1C1C1E) : Colors.white,
              foregroundColor: isDark ? Colors.white : const Color(0xFF000000),
              side: BorderSide(
                color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5),
              ),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: isLoadingMore
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text(
                    'Load More',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
          ),
        ),
      ),
    );
  }

  // ── Toolbar ──────────────────────────────────────────────────────────────────

  Widget _buildToolbar(List<PracticeQuestion> list, bool isDark) {
    final allSelected =
        list.isNotEmpty && list.every((q) => _selectedIds.contains(q.id));

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          GestureDetector(
            onTap: _toggleSelectAll,
            child: Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: allSelected
                    ? const Color(0xFFB91C1C)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: allSelected
                      ? const Color(0xFFB91C1C)
                      : const Color(0xFFA3A3A3),
                ),
              ),
              child: allSelected
                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                  : null,
            ),
          ),
          const SizedBox(width: 10),
          Text(
            '${_selectedIds.length} নির্বাচিত',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF525252),
            ),
          ),
          const Spacer(),
          // Shuffle toggle
          GestureDetector(
            onTap: () => setState(() => _shuffle = !_shuffle),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: _shuffle
                    ? const Color(0xFF047857).withValues(alpha: 0.1)
                    : (isDark ? const Color(0xFF1C1C1E) : Colors.white),
                border: Border.all(
                  color: _shuffle
                      ? const Color(0xFF047857).withValues(alpha: 0.3)
                      : (isDark
                            ? const Color(0xFF27272A)
                            : const Color(0xFFE5E5E5)),
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    LucideIcons.shuffle,
                    size: 14,
                    color: _shuffle
                        ? const Color(0xFF047857)
                        : const Color(0xFFA3A3A3),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _shuffle
                        ? 'র‍্যান্ডম অন'
                        : 'র‍্যান্ডম',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: _shuffle
                          ? const Color(0xFF047857)
                          : const Color(0xFFA3A3A3),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Start button
          ElevatedButton.icon(
            onPressed: _selectedIds.isEmpty ? null : _launchFlashcard,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF047857),
              disabledBackgroundColor: isDark
                  ? const Color(0xFF1C1C1E)
                  : const Color(0xFFE5E5E5),
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 0),
              minimumSize: const Size(0, 36),
            ),
            icon: const Icon(
              LucideIcons.playCircle,
              size: 16,
              color: Colors.white,
            ),
            label: const Text(
              '\u09b6\u09c1\u09b0\u09c1',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Question card ─────────────────────────────────────────────────────────

  Widget _buildQuestionCard(PracticeQuestion q, int i, bool isDark) {
    final isSel = _selectedIds.contains(q.id);
    final freq = _mistakeFreq[q.id];
    final isBookmarked = _bookmarkedIds.contains(q.id);

    return GestureDetector(
      onTap: () => setState(() {
        if (isSel) {
          _selectedIds.remove(q.id);
        } else {
          _selectedIds.add(q.id);
        }
      }),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSel
                ? const Color(0xFFB91C1C)
                : (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF4F4F5)),
            width: isSel ? 2 : 1,
          ),
          boxShadow: isDark
              ? []
              : [
                  const BoxShadow(
                    color: Color(0x0A000000),
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  margin: const EdgeInsets.only(right: 12),
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: isSel ? const Color(0xFFB91C1C) : Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: isSel
                          ? const Color(0xFFB91C1C)
                          : const Color(0xFFA3A3A3),
                      width: 1.5,
                    ),
                  ),
                  child: isSel
                      ? const Icon(Icons.check, size: 16, color: Colors.white)
                      : null,
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF1C1C1E)
                        : const Color(0xFFF5F5F5),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    q.subjectLabel.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFA3A3A3),
                    ),
                  ),
                ),
                if (freq != null &&
                    freq > 0 &&
                    _activeTab == 'mistakes') ...[
                  const SizedBox(width: 6),
                  _FreqBadge(count: freq),
                ],
                const Spacer(),
                IconButton(
                  onPressed: () => _toggleBookmark(q),
                  iconSize: 16,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  icon: Icon(
                    isBookmarked
                        ? LucideIcons.bookmarkMinus
                        : LucideIcons.bookmark,
                    color: isBookmarked
                        ? const Color(0xFF047857)
                        : const Color(0xFFA3A3A3),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            LatexText(
              text: '${i + 1}. ${q.questionText}',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                fontFamily: 'Anek Bangla',
                color: isDark ? Colors.white : const Color(0xFF000000),
              ),
            ),
            if (q.options.isNotEmpty &&
                q.correctAnswerIndex < q.options.length) ...[
              const SizedBox(height: 6),
              LatexText(
                text: '✓ ${q.options[q.correctAnswerIndex]}',
                style: const TextStyle(
                  fontSize: 14,
                  fontFamily: 'Anek Bangla',
                  color: Color(0xFF047857),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  Widget _emptyState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF1C1C1E)
                    : const Color(0xFFF5F5F5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.inbox,
                size: 32,
                color: Color(0xFFA3A3A3),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '\u06a4\u09cb\u09a8\u09cb \u09a4\u09a5\u09cd\u09af \u09aa\u09be\u0993\u09af\u09bc\u09be \u09af\u09be\u09af\u09bc\u09a8\u09bf',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : const Color(0xFF000000),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _activeTab == 'mistakes'
                  ? '\u0986\u09aa\u09a8\u09bf \u098f\u0996\u09a8\u09cb \u06a4\u09cb\u09a8\u09cb \u09aa\u09b0\u09c0\u0995\u09cd\u09b7\u09be\u09af\u09bc \u09ad\u09c1\u09b2 \u06a4\u09b0\u09c7\u09a8\u09a8\u09bf\u0964'
                  : '\u0986\u09aa\u09a8\u09bf \u098f\u0996\u09a8\u09cb \u06a4\u09cb\u09a8\u09cb \u09aa\u09cd\u09b0\u09b6\u09cd\u09a8 \u09ac\u09c1\u06a4\u09ae\u09be\u09b0\u09cd\u06a4 \u06a4\u09b0\u09c7\u09a8\u09a8\u09bf\u0964',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 15, color: Color(0xFFA3A3A3)),
            ),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: () => context.go('/setup'),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFB91C1C),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  '\u09a8\u09a4\u09c1\u09a8 \u09aa\u09b0\u09c0\u0995\u09cd\u09b7\u09be \u09a6\u09be\u0993',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Reusable widgets ─────────────────────────────────────────────────────────

class _StatBox extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  final bool isDark;
  final IconData icon;

  const _StatBox({
    required this.label,
    required this.value,
    required this.color,
    required this.isDark,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF4F4F5),
          ),
          boxShadow: isDark
              ? []
              : [
                  const BoxShadow(
                    color: Color(0x0A000000),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF4F4F5),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(height: 8),
            Text(
              '$value',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : const Color(0xFF000000),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TabBtn extends StatelessWidget {
  final String label;
  final bool active;
  final bool isDark;
  final VoidCallback onTap;

  const _TabBtn({
    required this.label,
    required this.active,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: active
              ? (isDark ? const Color(0xFF1C1C1E) : Colors.white)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: active && !isDark
              ? [
                  const BoxShadow(
                    color: Color(0x0F000000),
                    blurRadius: 10,
                    offset: Offset(0, 2),
                  ),
                ]
              : [],
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: active ? const Color(0xFF047857) : const Color(0xFFA3A3A3),
          ),
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final String label;
  final bool active;
  final bool isDark;
  final VoidCallback onTap;

  const _Pill({
    required this.label,
    required this.active,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: active
              ? const Color(0xFFB91C1C)
              : (isDark ? const Color(0xFF000000) : Colors.white),
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: active
                ? const Color(0xFFB91C1C)
                : (isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5)),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: active
                ? Colors.white
                : (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF525252)),
          ),
        ),
      ),
    );
  }
}

class _FreqBadge extends StatelessWidget {
  final int count;
  const _FreqBadge({required this.count});

  @override
  Widget build(BuildContext context) {
    final (bg, border, text) = count >= 3
        ? (
            const Color(0xFF047857).withValues(alpha: 0.15),
            const Color(0xFF047857).withValues(alpha: 0.4),
            const Color(0xFF047857),
          )
        : count == 2
        ? (
            const Color(0xFFB91C1C).withValues(alpha: 0.15),
            const Color(0xFFB91C1C).withValues(alpha: 0.4),
            const Color(0xFFB91C1C),
          )
        : (
            const Color(0xFF27272A).withValues(alpha: 0.3),
            const Color(0xFF525252).withValues(alpha: 0.4),
            const Color(0xFFA3A3A3),
          );

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        border: Border.all(color: border),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        '${count}x ভুল',
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: text),
      ),
    );
  }
}

// ── Sticky Header Delegate ────────────────────────────────────────────────────

class _StickyHeaderDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;
  final double height;
  final bool isDark;

  _StickyHeaderDelegate({
    required this.child,
    required this.height,
    required this.isDark,
  });

  @override
  double get minExtent => height;

  @override
  double get maxExtent => height;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      color: isDark ? const Color(0xFF000000) : const Color(0xFFFAFAFA),
      child: child,
    );
  }

  @override
  bool shouldRebuild(covariant _StickyHeaderDelegate oldDelegate) {
    return oldDelegate.child != child ||
        oldDelegate.height != height ||
        oldDelegate.isDark != isDark;
  }
}
