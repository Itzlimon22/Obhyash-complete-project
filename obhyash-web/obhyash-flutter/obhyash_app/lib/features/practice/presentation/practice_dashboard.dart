import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../../../core/presentation/widgets/latex_text.dart';
import '../../../core/providers/auth_provider.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import '../../../core/presentation/widgets/pro_upgrade_modal.dart';
import '../../exam/domain/exam_models.dart';
import '../../exam/services/local_exam_cache_service.dart';
import '../providers/practice_providers.dart';
import 'flashcard_mode.dart';
import 'practice_summary.dart';
import '../../../core/presentation/widgets/skeleton_loading.dart';

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
  final List<ExamHistory> examHistory;
  final List<String> institutes;
  final List<int> years;

  const PracticeQuestion({
    required this.id,
    required this.subject,
    required this.subjectLabel,
    required this.questionText,
    required this.options,
    required this.correctAnswerIndex,
    this.explanation,
    this.points = 1,
    this.examHistory = const [],
    this.institutes = const [],
    this.years = const [],
  });

  factory PracticeQuestion.fromJson(Map<String, dynamic> j) {
    List<String> opts = [];
    if (j['options'] is List) {
      opts = (j['options'] as List).map((e) => e.toString()).toList();
    }

    // 1. Parse exam_history
    List<ExamHistory> validExamHistory = [];
    final rawHistory = j['exam_history'] ?? j['examHistory'];
    if (rawHistory is List) {
      for (final item in rawHistory) {
        if (item is Map<String, dynamic>) {
          validExamHistory.add(ExamHistory.fromJson(item));
        } else if (item is Map) {
          validExamHistory.add(ExamHistory.fromJson(Map<String, dynamic>.from(item)));
        }
      }
    }

    List<String> inst = [];
    if (j['institutes'] is List) {
      inst = (j['institutes'] as List).map((e) => e.toString().trim()).where((s) => s.isNotEmpty).toList();
    } else {
      final raw = j['institute'] ?? j['institution'] ?? j['board'];
      if (raw != null && raw.toString().trim().isNotEmpty) {
        inst = raw
            .toString()
            .split(',')
            .map((e) => e.trim())
            .where((s) => s.isNotEmpty)
            .toList();
      }
    }

    List<int> yrs = [];
    if (j['years'] is List) {
      for (final y in (j['years'] as List)) {
        if (y is num) {
          yrs.add(y.toInt());
        } else if (y != null) {
          final digits = y.toString().replaceAll(RegExp(r'[^0-9]'), '');
          final parsed = int.tryParse(digits);
          if (parsed != null) yrs.add(parsed);
        }
      }
    } else if (j['year'] != null && j['year'].toString().trim().isNotEmpty) {
      final parts = j['year'].toString().split(',');
      for (final p in parts) {
        final digits = p.replaceAll(RegExp(r'[^0-9]'), '');
        final parsed = int.tryParse(digits);
        if (parsed != null) yrs.add(parsed);
      }
    }

    // Backward compatibility sync
    if (validExamHistory.isNotEmpty) {
      if (inst.isEmpty) {
        inst = validExamHistory.map((h) => h.institute.isNotEmpty ? h.institute : h.code).where((s) => s.isNotEmpty).toList();
      }
      if (yrs.isEmpty) {
        yrs = validExamHistory.map((h) => h.year).where((y) => y > 0).toList();
      }
    }

    int correctIdx = 0;
    if (j['correct_answer_index'] != null) {
      correctIdx = (j['correct_answer_index'] as num).toInt();
    } else if (j['correct_answer_indices'] is List &&
        (j['correct_answer_indices'] as List).isNotEmpty) {
      correctIdx = ((j['correct_answer_indices'] as List)[0] as num).toInt();
    } else if (j['correct_answer'] != null) {
      final ca = j['correct_answer'].toString();
      final idx = opts.indexOf(ca);
      if (idx != -1) correctIdx = idx;
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
      correctAnswerIndex: correctIdx,
      explanation: j['explanation']?.toString(),
      points: (j['points'] as num?)?.toInt() ?? 1,
      examHistory: validExamHistory,
      institutes: inst,
      years: yrs,
    );
  }

  Question toQuestion() {
    return Question(
      id: id,
      subject: subject,
      subjectLabel: subjectLabel,
      chapter: '',
      question: questionText,
      explanation: explanation,
      options: options,
      correctAnswerIndex: correctAnswerIndex,
      points: points,
      examHistory: examHistory,
      institutes: institutes,
      years: years,
    );
  }
}

// ─── View ─────────────────────────────────────────────────────────────────────

class PracticeDashboard extends ConsumerStatefulWidget {
  const PracticeDashboard({super.key});

  @override
  ConsumerState<PracticeDashboard> createState() => _PracticeDashboardState();
}

class _PracticeDashboardState extends ConsumerState<PracticeDashboard> {
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

  // Internal maps used by paginated mistakes fetch
  final Map<String, PracticeQuestion> _mistakeMap = {};

  final ScrollController _scrollController = ScrollController();

  // Bookmarks Pagination
  bool _bHasMore = false;
  bool _bIsLoadingMore = false;
  int _displayedBookmarksCount = 20;

  // Mistakes Pagination
  int _mOffset = 0;
  bool _mHasMore = true;
  bool _mIsLoadingMore = false;
  int _displayedMistakesCount = 20;
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
      _bHasMore = true;
    }

    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) return;

      // 1. Fetch bookmark records
      final bData = await sb
          .from('bookmarks')
          .select('question_id, created_at')
          .eq('user_id', uid)
          .order('created_at', ascending: false);

      final rawBookmarks = (bData as List);
      if (mounted) {
        setState(() => _totalBookmarks = rawBookmarks.length);
      }

      if (rawBookmarks.isEmpty) {
        if (mounted) {
          setState(() {
            _bookmarks = [];
            _bookmarkedIds = {};
          });
        }
        return;
      }

      final allBookmarkIds = rawBookmarks
          .map((b) => b['question_id']?.toString() ?? '')
          .where((id) => id.isNotEmpty)
          .toList();

      final bIdsSet = allBookmarkIds.toSet();
      final Map<String, PracticeQuestion> questionMap = {};

      // 2. Fetch from 'questions' table in safe chunks
      for (var i = 0; i < allBookmarkIds.length; i += 50) {
        final end = (i + 50 > allBookmarkIds.length) ? allBookmarkIds.length : i + 50;
        final chunk = allBookmarkIds.sublist(i, end);
        try {
          final qData = await sb.from('questions').select().inFilter('id', chunk);
          for (final row in (qData as List)) {
            final q = PracticeQuestion.fromJson(row as Map<String, dynamic>);
            if (q.id.isNotEmpty) questionMap[q.id] = q;
          }
        } catch (err) {
          debugPrint('[PracticeDashboard] chunk fetch from questions table error: $err');
        }
      }

      // 3. Fallback: For any question IDs not found in 'questions', search in user's exam_results
      final missingIds = allBookmarkIds.where((id) => !questionMap.containsKey(id)).toSet();
      if (missingIds.isNotEmpty) {
        try {
          final examRes = await sb
              .from('exam_results')
              .select('questions')
              .eq('user_id', uid)
              .not('questions', 'is', null)
              .order('created_at', ascending: false)
              .limit(50);

          for (final row in (examRes as List)) {
            final qListRaw = row['questions'];
            if (qListRaw is List) {
              for (final item in qListRaw) {
                if (item is Map<String, dynamic>) {
                  final q = PracticeQuestion.fromJson(item);
                  if (missingIds.contains(q.id)) {
                    questionMap[q.id] = q;
                  }
                }
              }
            }
          }
        } catch (err) {
          debugPrint('[PracticeDashboard] missing bookmark fallback error: $err');
        }
      }

      // 4. Fallback: check local cached questions
      final stillMissing = allBookmarkIds.where((id) => !questionMap.containsKey(id)).toSet();
      if (stillMissing.isNotEmpty) {
        try {
          final cachedList = await LocalExamCacheService.getCachedQuestionsList();
          if (cachedList != null) {
            for (final item in cachedList) {
              final q = PracticeQuestion.fromJson(item);
              if (stillMissing.contains(q.id)) {
                questionMap[q.id] = q;
              }
            }
          }
        } catch (_) {}
      }

      // 5. Build ordered bookmark list matching user's bookmarks
      final List<PracticeQuestion> finalBookmarks = [];
      for (final id in allBookmarkIds) {
        if (questionMap.containsKey(id)) {
          finalBookmarks.add(questionMap[id]!);
        }
      }

      if (mounted) {
        setState(() {
          _bookmarks = finalBookmarks;
          _bookmarkedIds = bIdsSet;
          _totalBookmarks = finalBookmarks.isNotEmpty ? finalBookmarks.length : rawBookmarks.length;
          _bHasMore = false;
        });
      }
    } catch (e) {
      debugPrint('[PracticeDashboard] _fetchBookmarks global error: $e');
    }
  }

  Future<void> _loadMoreBookmarks() async {
    final filtered = _subjectFilter == 'all'
        ? _bookmarks
        : _bookmarks.where((q) => q.subject == _subjectFilter).toList();

    if (_displayedBookmarksCount < filtered.length) {
      setState(() {
        _displayedBookmarksCount += _limit;
      });
      return;
    }

    if (_bIsLoadingMore || !_bHasMore) return;
    setState(() => _bIsLoadingMore = true);
    await _fetchBookmarks();
    if (mounted) {
      setState(() {
        _displayedBookmarksCount += _limit;
        _bIsLoadingMore = false;
      });
    }
  }

  Future<void> _fetchMistakes({bool isRefresh = false}) async {
    if (isRefresh) {
      _mOffset = 0;
      _mHasMore = true;
      _displayedMistakesCount = _limit;
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
    final filtered = _subjectFilter == 'all'
        ? _mistakes
        : _mistakes.where((q) => q.subject == _subjectFilter).toList();

    if (_displayedMistakesCount < filtered.length) {
      setState(() {
        _displayedMistakesCount += _limit;
      });
      return;
    }

    if (_mIsLoadingMore || !_mHasMore) return;
    setState(() => _mIsLoadingMore = true);
    await _fetchMistakes();
    if (mounted) {
      setState(() {
        _displayedMistakesCount += _limit;
        _mIsLoadingMore = false;
      });
    }
  }

  // ── Bookmark toggle ─────────────────────────────────────────────────────────

  Future<void> _toggleBookmark(PracticeQuestion q) async {
    final qid = q.id;
    final sb = Supabase.instance.client;
    final uid = sb.auth.currentUser?.id;
    if (uid == null) return;

    final isMarked = _bookmarkedIds.contains(qid);

    if (!isMarked) {
      final profile = ref.read(userProfileProvider).value;
      final isPro = profile?.isPro ?? false;
      if (!isPro && _totalBookmarks >= 25) {
        ProUpgradeModal.show(
          context,
          title: 'বুকমার্ক লিমিট শেষ 📌',
          message: 'ফ্রি অ্যাকাউন্টে সর্বোচ্চ ২৫টি প্রশ্ন বুকমার্ক করা যাবে। আনলিমিটেড বুকমার্ক ও স্টাডি নোটের জন্য প্রো সাবস্ক্রিপশন নাও।',
          featurePill: 'বুকমার্ক লিমিট: ২৫/২৫',
          icon: LucideIcons.bookmark,
        );
        return;
      }
    }

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
    final filtered = _subjectFilter == 'all'
        ? base
        : base.where((q) => q.subject == _subjectFilter).toList();
    final count = _activeTab == 'mistakes'
        ? _displayedMistakesCount
        : _displayedBookmarksCount;
    return filtered.take(count).toList();
  }

  List<MapEntry<String, String>> get _availableSubjects {
    final base = _activeTab == 'mistakes' ? _mistakes : _bookmarks;
    final map = <String, String>{};
    for (final q in base) {
      if (!map.containsKey(q.subject)) {
        map[q.subject] = BanglaNameHelper.formatSubject(q.subject, q.subjectLabel);
      }
    }
    final entries = map.entries.toList()
      ..sort((a, b) {
        final pA = BanglaNameHelper.getSubjectSortPriority(a.value, a.key);
        final pB = BanglaNameHelper.getSubjectSortPriority(b.value, b.key);
        if (pA != pB) return pA.compareTo(pB);
        return a.value.compareTo(b.value);
      });
    return entries;
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

  Future<void> _launchFlashcard() async {
    final list = _currentList;
    var qs = list.where((q) => _selectedIds.contains(q.id)).toList();
    if (qs.isEmpty) return;
    if (_shuffle) qs = (qs..shuffle());

    // Daily 1 practice session quota for free users
    final profile = ref.read(userProfileProvider).value;
    final isPro = profile?.isPro ?? false;

    if (!isPro) {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        final prefs = await SharedPreferences.getInstance();
        final now = DateTime.now();
        final todayStr = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
        final key = 'daily_practice_${user.id}_$todayStr';
        final alreadyPracticed = prefs.getBool(key) ?? false;

        if (alreadyPracticed) {
          if (mounted) {
            ProUpgradeModal.show(
              context,
              title: 'আজকের প্র্যাকটিস কোটা শেষ 🎯',
              message: 'ফ্রি অ্যাকাউন্টে দিনে মাত্র ১ বার প্র্যাকটিস সেশন করা যায়। প্রতিদিন সীমাহীন প্র্যাকটিস করতে প্রো সাবস্ক্রিপশন নাও।',
              featurePill: 'দৈনিক প্র্যাকটিস কোটা: ১/১',
              icon: LucideIcons.flame,
            );
          }
          return;
        }

        // Mark as practiced for today
        await prefs.setBool(key, true);
      }
    }

    _markReviewed(qs.map((q) => q.id).toList());
    HapticFeedback.mediumImpact();

    if (!mounted) return;

    await Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute(
        builder: (ctx) => _FlashcardSessionWrapper(
          initialQuestions: qs,
        ),
      ),
    );

    if (mounted) {
      setState(() {
        _selectedIds.clear();
      });
      _fetchData();
    }
  }

  // ── Build ───────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    // Re-fetch if auth becomes available after cold-start session restoration
    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _fetchData();
    });

    // Synchronize tab with header toggle
    final currentTabFromHeader = ref.watch(practiceTabProvider);
    if (_activeTab != currentTabFromHeader) {
      _activeTab = currentTabFromHeader;
      _subjectFilter = 'all';
      _selectedIds.clear();
    }

    return _buildListView();
  }

  Widget _buildListView() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final list = _currentList;

    return _isLoading
        ? const BookmarksListSkeleton()
        : CustomScrollView(
            controller: _scrollController,
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(10, 14, 10, 8),
                  child: Row(
                    children: [
                      _StatBox(
                        label: 'মোট ভুল',
                        value: _mistakes.length,
                        color: const Color(0xFFDC2626),
                        isDark: isDark,
                        icon: LucideIcons.xOctagon,
                        svgAsset: 'assets/dashboard-icons/mistake_review.svg',
                      ),
                      const SizedBox(width: 8),
                      _StatBox(
                        label: 'বুকমার্ক',
                        value: _totalBookmarks,
                        color: const Color(0xFF16A34A),
                        isDark: isDark,
                        icon: LucideIcons.bookmark,
                        svgAsset: 'assets/dashboard-icons/bookmarks.svg',
                      ),
                      const SizedBox(width: 8),
                      _StatBox(
                        label: 'রিভিউ বাকি',
                        value: _dueCount,
                        color: const Color(0xFF4F46E5),
                        isDark: isDark,
                        icon: LucideIcons.rotateCcw,
                        svgAsset: 'assets/dashboard-icons/spaced_repetition.svg',
                      ),
                    ],
                  ),
                ),
              ),
              if (_availableSubjects.isNotEmpty || list.isNotEmpty)
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _StickyHeaderDelegate(
                    isDark: isDark,
                    height: (_availableSubjects.isNotEmpty ? 48.0 : 0.0) +
                        (list.isNotEmpty ? 44.0 : 0.0),
                    child: SizedBox(
                      height: (_availableSubjects.isNotEmpty ? 48.0 : 0.0) +
                          (list.isNotEmpty ? 44.0 : 0.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (_availableSubjects.isNotEmpty)
                            SizedBox(
                              height: 48,
                              child: ListView(
                                scrollDirection: Axis.horizontal,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 6,
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
                            SizedBox(
                              height: 44,
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16.0,
                                  vertical: 4.0,
                                ),
                                child: _buildToolbar(list, isDark),
                              ),
                            ),
                        ],
                      ),
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
                  padding: const EdgeInsets.fromLTRB(10, 8, 10, 16),
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
    final base = _activeTab == 'mistakes' ? _mistakes : _bookmarks;
    final filtered = _subjectFilter == 'all'
        ? base
        : base.where((q) => q.subject == _subjectFilter).toList();
    final displayedCount = _activeTab == 'mistakes'
        ? _displayedMistakesCount
        : _displayedBookmarksCount;
    final serverHasMore =
        _activeTab == 'mistakes' ? _mHasMore : _bHasMore;

    final hasMore = displayedCount < filtered.length || serverHasMore;
    final isLoadingMore =
        _activeTab == 'mistakes' ? _mIsLoadingMore : _bIsLoadingMore;

    if (!hasMore || filtered.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 12, 10, 36),
      child: Center(
        child: SizedBox(
          width: 220,
          height: 46,
          child: ElevatedButton.icon(
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
              backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
              foregroundColor: isDark ? Colors.white : const Color(0xFF0F172A),
              elevation: 0,
              side: BorderSide(
                color: isDark
                    ? const Color(0xFF27272A)
                    : const Color(0xFFE2E8F0),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: isLoadingMore
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Color(0xFF059669),
                    ),
                  )
                : const Icon(
                    LucideIcons.arrowDown,
                    size: 16,
                    color: Color(0xFF059669),
                  ),
            label: Text(
              isLoadingMore ? 'লোড হচ্ছে...' : 'আরও ২০টি প্রশ্ন লোড করো',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                fontFamily: 'HindSiliguri',
              ),
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

    return Row(
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
              fontSize: 16,
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
                    : (isDark ? const Color(0xFF1C1C1E) : Colors.white),
                border: Border.all(
                  color: _shuffle
                      ? const Color(0xFF059669).withValues(alpha: 0.3)
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
                        ? const Color(0xFF059669)
                        : const Color(0xFFA3A3A3),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _shuffle
                        ? 'র‍্যান্ডম অন'
                        : 'র‍্যান্ডম',
                    style: TextStyle(
                      fontSize: 16,
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
              backgroundColor: const Color(0xFF059669),
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
              'শুরু',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontFamily: 'HindSiliguri',
                fontSize: 16,
              ),
            ),
          ),
        ],
      );
  }

  // ── Question card ───────────────────────────────────────────────────────────

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
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF18181B) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSel
                ? const Color(0xFFEF4444)
                : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
            width: isSel ? 1.5 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    color: isSel ? const Color(0xFFEF4444) : Colors.transparent,
                    borderRadius: BorderRadius.circular(5),
                    border: Border.all(
                      color: isSel
                          ? const Color(0xFFEF4444)
                          : (isDark
                              ? const Color(0xFF52525B)
                              : const Color(0xFFCBD5E1)),
                      width: 1.5,
                    ),
                  ),
                  child: isSel
                      ? const Icon(Icons.check, size: 14, color: Colors.white)
                      : null,
                ),
                if (freq != null &&
                    freq > 0 &&
                    _activeTab == 'mistakes') ...[
                  const SizedBox(width: 8),
                  _FreqBadge(count: freq),
                ],
                const Spacer(),
                IconButton(
                  onPressed: () => _toggleBookmark(q),
                  iconSize: 18,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  icon: Icon(
                    isBookmarked
                        ? LucideIcons.bookmarkMinus
                        : LucideIcons.bookmark,
                    color: isBookmarked
                        ? const Color(0xFF10B981)
                        : (isDark
                            ? const Color(0xFF71717A)
                            : const Color(0xFF94A3B8)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            LatexText(
              text: '**${BanglaNameHelper.toBanglaNumeral(i + 1)}.** ${q.questionText}',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                fontFamily: 'HindSiliguri',
                color: isDark ? const Color(0xFFF4F4F5) : const Color(0xFF0F172A),
                height: 1.45,
              ),
            ),
            if (q.options.isNotEmpty &&
                q.correctAnswerIndex < q.options.length) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF064E3B).withValues(alpha: 0.3)
                      : const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF059669).withValues(alpha: 0.35)
                        : const Color(0xFFA7F3D0),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.check_circle_rounded,
                      size: 15,
                      color: isDark
                          ? const Color(0xFF34D399)
                          : const Color(0xFF059669),
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: LatexText(
                        text: q.options[q.correctAnswerIndex],
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                          color: isDark
                              ? const Color(0xFF34D399)
                              : const Color(0xFF065F46),
                        ),
                      ),
                    ),
                  ],
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
              'কোনো তথ্য পাওয়া যায়নি',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white : const Color(0xFF000000),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _activeTab == 'mistakes'
                  ? 'তুমি এখনো কোনো পরীক্ষায় ভুল করোনি।'
                  : 'তুমি এখনো কোনো প্রশ্ন বুকমার্ক করোনি।',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                fontFamily: 'HindSiliguri',
                color: Color(0xFFA3A3A3),
              ),
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
                  color: const Color(0xFF059669),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'নতুন পরীক্ষা দাও',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'HindSiliguri',
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
  final String? svgAsset;

  const _StatBox({
    required this.label,
    required this.value,
    required this.color,
    required this.isDark,
    required this.icon,
    this.svgAsset,
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
            if (svgAsset != null)
              SizedBox(
                width: 32,
                height: 32,
                child: SvgPicture.asset(svgAsset!, fit: BoxFit.contain),
              )
            else
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
            const Color(0xFF059669).withValues(alpha: 0.15),
            const Color(0xFF059669).withValues(alpha: 0.4),
            const Color(0xFF059669),
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
      color: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
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

// ── Fullscreen Flashcard Session Wrapper (Root Navigator) ──────────────────────

class _FlashcardSessionWrapper extends StatefulWidget {
  final List<PracticeQuestion> initialQuestions;

  const _FlashcardSessionWrapper({required this.initialQuestions});

  @override
  State<_FlashcardSessionWrapper> createState() =>
      _FlashcardSessionWrapperState();
}

class _FlashcardSessionWrapperState extends State<_FlashcardSessionWrapper> {
  late List<PracticeQuestion> _questions;
  List<FlashcardResult> _results = [];
  bool _isSummary = false;

  @override
  void initState() {
    super.initState();
    _questions = widget.initialQuestions;
  }

  void _onFlashcardComplete(List<FlashcardResult> results) {
    setState(() {
      _results = results;
      _isSummary = true;
    });
  }

  void _onPracticeStruggling(List<PracticeQuestion> qs) {
    setState(() {
      _questions = qs;
      _results = [];
      _isSummary = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isSummary) {
      return PracticeSummary(
        results: _results,
        onPracticeStruggling: _onPracticeStruggling,
        onBack: () => Navigator.of(context).pop(),
      );
    }

    return FlashcardMode(
      questions: _questions,
      onComplete: _onFlashcardComplete,
      onExit: () => Navigator.of(context).pop(),
    );
  }
}
