import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/providers/auth_provider.dart';
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
  Map<String, int> _mistakeFreq = {};
  List<PracticeQuestion> _bookmarks = [];
  Set<String> _bookmarkedIds = {};

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

  @override
  void initState() {
    super.initState();
    _loadReviewedDates().then((_) => _fetchData());
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
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) {
        debugPrint('[PracticeDashboard] userId is null — skipping fetch');
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      // 1. Bookmarks via bookmarks table -> questions join
      final bData = await sb
          .from('bookmarks')
          .select('question_id, questions(*)')
          .eq('user_id', uid);
      final bList = <PracticeQuestion>[];
      final bIds = <String>{};
      for (final row in (bData as List)) {
        final qRow = row['questions'] as Map<String, dynamic>?;
        if (qRow != null) {
          final q = PracticeQuestion.fromJson(qRow);
          bList.add(q);
          bIds.add(q.id);
        }
      }

      // 2. Mistakes derived from exam_results JSONB
      //    questions  = List of question objects stored at exam time
      //    user_answers = Map<questionId, answerIndex>
      final mData = await sb
          .from('exam_results')
          .select('questions, user_answers')
          .eq('user_id', uid)
          .not('questions', 'is', null)
          .not('user_answers', 'is', null);

      final mListMap = <String, PracticeQuestion>{};
      final mFreq = <String, int>{};

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
          if (userAnswer == -1) continue; // skipped
          if (userAnswer != q.correctAnswerIndex) {
            mListMap[q.id] = q;
            mFreq[q.id] = (mFreq[q.id] ?? 0) + 1;
          }
        }
      }

      final sortedMistakes = mListMap.values.toList()
        ..sort((a, b) => (mFreq[b.id] ?? 0).compareTo(mFreq[a.id] ?? 0));

      if (mounted) {
        setState(() {
          _bookmarks = bList;
          _bookmarkedIds = bIds;
          _mistakes = sortedMistakes;
          _mistakeFreq = mFreq;
          _dueCount = sortedMistakes.where((q) => _isDue(q.id)).length;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('[PracticeDashboard] _fetchData error: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ── Bookmark toggle ─────────────────────────────────────────────────────────

  Future<void> _toggleBookmark(String qid) async {
    final sb = Supabase.instance.client;
    final uid = sb.auth.currentUser?.id;
    if (uid == null) return;

    final isMarked = _bookmarkedIds.contains(qid);
    setState(() {
      if (isMarked) {
        _bookmarkedIds.remove(qid);
        _bookmarks.removeWhere((q) => q.id == qid);
      } else {
        _bookmarkedIds.add(qid);
        final q = _mistakes.firstWhere(
          (q) => q.id == qid,
          orElse: () => _bookmarks.firstWhere((b) => b.id == qid),
        );
        if (!_bookmarks.any((b) => b.id == qid)) _bookmarks.add(q);
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

    return Column(
      children: [
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : Column(
                  children: [
                    // ── Stats bar ─────────────────────────────────────────
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
                      child: Row(
                        children: [
                          _StatBox(
                            label: 'মোট ভুল',
                            value: _mistakes.length,
                            color: const Color(0xFFF43F5E),
                            isDark: isDark,
                          ),
                          const SizedBox(width: 8),
                          _StatBox(
                            label: 'বুকমার্ক',
                            value: _bookmarks.length,
                            color: const Color(0xFF10B981),
                            isDark: isDark,
                          ),
                          const SizedBox(width: 8),
                          _StatBox(
                            label: 'রিভিউ বাকি',
                            value: _dueCount,
                            color: const Color(0xFF818CF8),
                            isDark: isDark,
                          ),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: _fetchData,
                            child: Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0xFF1C1C1C)
                                    : const Color(0xFFF5F5F5),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: isDark
                                      ? const Color(0xFF333333)
                                      : const Color(0xFFE5E5E5),
                                ),
                              ),
                              child: Icon(
                                LucideIcons.refreshCw,
                                size: 16,
                                color: isDark
                                    ? const Color(0xFF737373)
                                    : const Color(0xFFA3A3A3),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // ── Tab switcher ──────────────────────────────────────
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF171717)
                                : const Color(0xFFF5F5F5),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF262626)
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
                                label: 'বুকমার্ক (${_bookmarks.length})',
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

                    // ── Subject filter pills ──────────────────────────────
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
                              onTap: () =>
                                  setState(() => _subjectFilter = 'all'),
                            ),
                            ..._availableSubjects.map(
                              (s) => _Pill(
                                label: s.value,
                                active: _subjectFilter == s.key,
                                isDark: isDark,
                                onTap: () =>
                                    setState(() => _subjectFilter = s.key),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // ── Main content card ─────────────────────────────────
                    Expanded(
                      child: Container(
                        margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF171717)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isDark
                                ? const Color(0xFF262626)
                                : const Color(0xFFE5E5E5),
                          ),
                          boxShadow: isDark
                              ? []
                              : [
                                  const BoxShadow(
                                    color: Color(0x08000000),
                                    blurRadius: 4,
                                  ),
                                ],
                        ),
                        child: list.isEmpty
                            ? _emptyState(isDark)
                            : Column(
                                children: [
                                  _buildToolbar(list, isDark),
                                  Expanded(
                                    child: ListView.separated(
                                      padding: const EdgeInsets.all(12),
                                      itemCount: list.length,
                                      separatorBuilder: (_, _) =>
                                          const SizedBox(height: 10),
                                      itemBuilder: (ctx, i) =>
                                          _buildQuestionCard(
                                            list[i],
                                            i,
                                            isDark,
                                          ),
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ],
                ),
        ),
      ],
    );
  }

  // ── Toolbar ──────────────────────────────────────────────────────────────────

  Widget _buildToolbar(List<PracticeQuestion> list, bool isDark) {
    final allSelected =
        list.isNotEmpty && list.every((q) => _selectedIds.contains(q.id));

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF262626).withValues(alpha: 0.5)
            : const Color(0xFFFAFAFA),
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
          ),
        ),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: _toggleSelectAll,
            child: Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: allSelected
                    ? const Color(0xFFE11D48)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: allSelected
                      ? const Color(0xFFE11D48)
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
              fontSize: 13,
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
                    ? const Color(0xFF059669).withValues(alpha: 0.1)
                    : (isDark ? const Color(0xFF262626) : Colors.white),
                border: Border.all(
                  color: _shuffle
                      ? const Color(0xFF059669).withValues(alpha: 0.3)
                      : (isDark
                            ? const Color(0xFF404040)
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
                        ? const Color(0xFF059669)
                        : const Color(0xFFA3A3A3),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _shuffle
                        ? 'র\u200d\u09cd\u09af\u09be\u09a8\u09cd\u09a1\u09ae \u0985\u09a8'
                        : '\u09b0\u09cd\u200d\u09af\u09be\u09a8\u09cd\u09a1\u09ae',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: _shuffle
                          ? const Color(0xFF059669)
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
                  ? const Color(0xFF262626)
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
                fontSize: 13,
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
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1C1C1C) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSel
                ? const Color(0xFFE11D48)
                : (isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5)),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 2, right: 12),
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: isSel ? const Color(0xFFE11D48) : Colors.transparent,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: isSel
                      ? const Color(0xFFE11D48)
                      : const Color(0xFFA3A3A3),
                ),
              ),
              child: isSel
                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                  : null,
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF262626)
                              : const Color(0xFFF5F5F5),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          q.subjectLabel.toUpperCase(),
                          style: const TextStyle(
                            fontSize: 9,
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
                      GestureDetector(
                        onTap: () => _toggleBookmark(q.id),
                        behavior: HitTestBehavior.opaque,
                        child: Padding(
                          padding: const EdgeInsets.all(4),
                          child: Icon(
                            isBookmarked
                                ? LucideIcons.bookmarkMinus
                                : LucideIcons.bookmark,
                            size: 16,
                            color: isBookmarked
                                ? const Color(0xFF10B981)
                                : const Color(0xFFA3A3A3),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${i + 1}. ${q.questionText}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white : const Color(0xFF171717),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (q.options.isNotEmpty &&
                      q.correctAnswerIndex < q.options.length) ...[
                    const SizedBox(height: 4),
                    Text(
                      '\u2713 ${q.options[q.correctAnswerIndex]}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF059669),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
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
                    ? const Color(0xFF262626)
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
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : const Color(0xFF171717),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _activeTab == 'mistakes'
                  ? '\u0986\u09aa\u09a8\u09bf \u098f\u0996\u09a8\u09cb \u06a4\u09cb\u09a8\u09cb \u09aa\u09b0\u09c0\u0995\u09cd\u09b7\u09be\u09af\u09bc \u09ad\u09c1\u09b2 \u06a4\u09b0\u09c7\u09a8\u09a8\u09bf\u0964'
                  : '\u0986\u09aa\u09a8\u09bf \u098f\u0996\u09a8\u09cb \u06a4\u09cb\u09a8\u09cb \u09aa\u09cd\u09b0\u09b6\u09cd\u09a8 \u09ac\u09c1\u06a4\u09ae\u09be\u09b0\u09cd\u06a4 \u06a4\u09b0\u09c7\u09a8\u09a8\u09bf\u0964',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: Color(0xFFA3A3A3)),
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
                  color: const Color(0xFFDC2626),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  '\u09a8\u09a4\u09c1\u09a8 \u09aa\u09b0\u09c0\u0995\u09cd\u09b7\u09be \u09a6\u09be\u0993',
                  style: TextStyle(
                    fontSize: 13,
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

  const _StatBox({
    required this.label,
    required this.value,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF171717) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
          ),
        ),
        child: Column(
          children: [
            Text(
              '$value',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFFA3A3A3),
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: active
              ? (isDark ? const Color(0xFF262626) : Colors.white)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: active && !isDark
              ? [
                  const BoxShadow(
                    color: Color(0x10000000),
                    blurRadius: 2,
                    offset: Offset(0, 1),
                  ),
                ]
              : [],
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
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
              ? const Color(0xFFE11D48)
              : (isDark ? const Color(0xFF171717) : Colors.white),
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: active
                ? const Color(0xFFE11D48)
                : (isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5)),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
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
            const Color(0xFF059669).withValues(alpha: 0.15),
            const Color(0xFF059669).withValues(alpha: 0.4),
            const Color(0xFF059669),
          )
        : count == 2
        ? (
            const Color(0xFFDC2626).withValues(alpha: 0.15),
            const Color(0xFFDC2626).withValues(alpha: 0.4),
            const Color(0xFFDC2626),
          )
        : (
            const Color(0xFF404040).withValues(alpha: 0.3),
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
        '${count}x \u09ad\u09c1\u09b2',
        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: text),
      ),
    );
  }
}
