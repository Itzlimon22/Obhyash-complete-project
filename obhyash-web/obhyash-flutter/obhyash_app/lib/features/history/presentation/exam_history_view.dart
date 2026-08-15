import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/utils/app_popups.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../../exam/domain/exam_models.dart';
import '../../exam/presentation/result_view.dart';
import '../../exam/presentation/widgets/question_card.dart';
import '../../exam/presentation/widgets/question_report_dialog.dart';
import '../../exam/services/local_exam_cache_service.dart';

// ─── Models ────────────────────────────────────────────────────────────────────
class _ExamRecord {
  final String id;
  final String subject;
  final String subjectLabel;
  final int correctCount;
  final int wrongCount;
  final int totalQuestions;
  final int? timeTaken;
  final double score; // 0-100
  final DateTime createdAt;
  final String examType;

  const _ExamRecord({
    required this.id,
    required this.subject,
    required this.subjectLabel,
    required this.correctCount,
    required this.wrongCount,
    required this.totalQuestions,
    this.timeTaken,
    required this.score,
    required this.createdAt,
    required this.examType,
  });

  factory _ExamRecord.fromJson(Map<String, dynamic> j) {
    int toInt(dynamic v) {
      if (v == null) return 0;
      if (v is num) return v.toInt();
      if (v is String) return int.tryParse(v) ?? 0;
      return 0;
    }

    final total = toInt(j['total_questions']);
    final correct = toInt(j['correct_count']);
    final wrong = toInt(j['wrong_count']);
    final score = total > 0 ? (correct / total * 100) : 0.0;

    final dateStr = j['date']?.toString() ?? j['created_at']?.toString() ?? '';
    final createdAt = DateTime.tryParse(dateStr) ?? DateTime.now();

    return _ExamRecord(
      id: j['id']?.toString() ?? '',
      subject: j['subject']?.toString() ?? 'general',
      subjectLabel:
          j['subject_label']?.toString() ??
          j['subject']?.toString() ??
          'পরীক্ষা',
      correctCount: correct,
      wrongCount: wrong,
      totalQuestions: total,
      timeTaken: j['time_taken'] != null ? toInt(j['time_taken']) : null,
      score: score,
      createdAt: createdAt,
      examType: j['exam_type']?.toString() ?? 'mock',
    );
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
String _subjectDisplay(String key, [String? label]) {
  return BanglaNameHelper.formatSubject(key, label);
}

String _formatDur(int secs) {
  final m = secs ~/ 60;
  final s = secs % 60;
  return '$mমি $sসে';
}

Color _scoreColor(double s) {
  if (s >= 70) return const Color(0xFF004633);
  if (s >= 40) return const Color(0xFF1E3A8A);
  return const Color(0xFFEF4444);
}

enum _SortMode { date, scoreDesc, scoreAsc }

// ─── Main View ─────────────────────────────────────────────────────────────────
class ExamHistoryView extends ConsumerStatefulWidget {
  const ExamHistoryView({super.key});

  @override
  ConsumerState<ExamHistoryView> createState() => _ExamHistoryViewState();
}

class _ExamHistoryViewState extends ConsumerState<ExamHistoryView>
    with SingleTickerProviderStateMixin {
  late TabController _tab;

  // Filter state (shared across tabs)
  String _filterSubject = '';
  String _filterChapter = '';
  DateTime? _filterDate;

  // Subjects & Chapters metadata
  List<MapEntry<String, String>> _subjectList = [];
  List<String> _chapterList = [];

  // Exams Tab state
  List<_ExamRecord> _history = [];
  bool _isLoadingExams = true;
  bool _isClearing = false;
  bool _hasErrorExams = false;
  _SortMode _sortBy = _SortMode.date;

  // Questions Tab state (Server-side paginated)
  List<Question> _questions = [];
  Set<String> _bookmarkedIds = {};
  bool _isLoadingQuestions = true;
  bool _isLoadingMoreQuestions = false;
  bool _hasMoreQuestions = true;
  bool _hasErrorQuestions = false;
  static const int _qPageSize = 15;
  int _qOffset = 0;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _tab.addListener(() {
      if (!_tab.indexIsChanging) {
        setState(() {});
      }
    });

    _fetchMetadata();
    _fetchBookmarks();
    _fetchExams();
    _fetchQuestions(refresh: true);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  Future<void> _fetchMetadata() async {
    try {
      final sb = Supabase.instance.client;
      final subData = await sb.from('subjects').select('id, name, name_en').limit(100);
      final seen = <String, String>{};
      for (final s in (subData as List)) {
        final id = s['id']?.toString() ?? '';
        final name = (s['name'] ?? s['name_en'] ?? '').toString();
        if (id.isNotEmpty && name.isNotEmpty) {
          seen[id] = name;
        }
      }

      if (mounted) {
        setState(() {
          _subjectList = seen.entries.toList()
            ..sort((a, b) => a.value.compareTo(b.value));
        });
      }
    } catch (e) {
      debugPrint('[ExamHistoryView] _fetchMetadata error: $e');
    }
  }

  Future<void> _fetchBookmarks() async {
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) return;
      final data = await sb.from('bookmarks').select('question_id').eq('user_id', uid);
      if (mounted) {
        setState(() {
          _bookmarkedIds = (data as List)
              .map((e) => e['question_id'].toString())
              .toSet();
        });
      }
    } catch (e) {
      debugPrint('[ExamHistoryView] _fetchBookmarks error: $e');
    }
  }

  Future<void> _toggleBookmark(String questionId) async {
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) return;

      final isBookmarked = _bookmarkedIds.contains(questionId);
      setState(() {
        if (isBookmarked) {
          _bookmarkedIds.remove(questionId);
        } else {
          _bookmarkedIds.add(questionId);
        }
      });

      if (isBookmarked) {
        await sb
            .from('bookmarks')
            .delete()
            .eq('user_id', uid)
            .eq('question_id', questionId);
      } else {
        await sb.from('bookmarks').insert({
          'user_id': uid,
          'question_id': questionId,
        });
      }
    } catch (e) {
      debugPrint('[ExamHistoryView] _toggleBookmark error: $e');
    }
  }

  void _showReportDialog(String questionId) {
    QuestionReportDialog.show(context, questionId);
  }

  Future<void> _fetchChaptersForSubject(String subjectId) async {
    if (subjectId.isEmpty) {
      setState(() {
        _chapterList = [];
        _filterChapter = '';
      });
      return;
    }
    try {
      final sb = Supabase.instance.client;
      final chData = await sb
          .from('chapters')
          .select('name')
          .eq('subject_id', subjectId)
          .limit(100);

      final chSet = <String>{};
      for (final c in (chData as List)) {
        final n = c['name']?.toString() ?? '';
        if (n.isNotEmpty) chSet.add(n);
      }

      if (mounted) {
        setState(() {
          _chapterList = chSet.toList()..sort();
          _filterChapter = '';
        });
      }
    } catch (e) {
      debugPrint('[ExamHistoryView] _fetchChaptersForSubject error: $e');
    }
  }

  Future<void> _fetchExams() async {
    setState(() {
      _isLoadingExams = true;
      _hasErrorExams = false;
    });
    try {
      final sb = Supabase.instance.client;
      final authResponse = await sb.auth.getSession();
      final uid = sb.auth.currentUser?.id ?? authResponse?.user.id;
      if (uid == null) {
        setState(() => _isLoadingExams = false);
        return;
      }

      final data = await sb
          .from('exam_results')
          .select(
            'id, subject, subject_label, correct_count, wrong_count, total_questions, time_taken, created_at, date, exam_type',
          )
          .eq('user_id', uid)
          .order('date', ascending: false)
          .limit(200);

      if (mounted) {
        final records = (data as List)
            .map((r) => _ExamRecord.fromJson(r as Map<String, dynamic>))
            .toList();

        // Cache history list for offline usage
        await LocalExamCacheService.cacheHistoryList(
          (data as List).map((e) => e as Map<String, dynamic>).toList(),
        );

        // If subject list was empty, extract from history
        if (_subjectList.isEmpty) {
          final seen = <String, String>{};
          for (final h in records) {
            if (!seen.containsKey(h.subject)) {
              seen[h.subject] = h.subjectLabel.isNotEmpty
                  ? h.subjectLabel
                  : _subjectDisplay(h.subject);
            }
          }
          _subjectList = seen.entries.toList()
            ..sort((a, b) => a.value.compareTo(b.value));
        }

        setState(() {
          _history = records;
          _isLoadingExams = false;
        });
      }
    } catch (e) {
      debugPrint('[ExamHistoryView] _fetchExams error: $e');
      final cached = await LocalExamCacheService.getCachedHistoryList();
      if (cached != null && cached.isNotEmpty && mounted) {
        final records = cached
            .map((r) => _ExamRecord.fromJson(r))
            .toList();
        setState(() {
          _history = records;
          _isLoadingExams = false;
          _hasErrorExams = false;
        });
        return;
      }
      if (mounted) {
        setState(() {
          _isLoadingExams = false;
          _hasErrorExams = true;
        });
      }
    }
  }

  Future<void> _fetchQuestions({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _isLoadingQuestions = true;
        _hasErrorQuestions = false;
        _qOffset = 0;
        _hasMoreQuestions = true;
      });
    } else {
      if (_isLoadingMoreQuestions || !_hasMoreQuestions) return;
      setState(() {
        _isLoadingMoreQuestions = true;
      });
    }

    try {
      final sb = Supabase.instance.client;
      final currentOffset = refresh ? 0 : _qOffset;

      var query = sb.from('questions').select();

      if (_filterSubject.isNotEmpty) {
        query = query.or('subject.eq.$_filterSubject,subject.ilike.%$_filterSubject%');
      }

      if (_filterChapter.isNotEmpty) {
        query = query.or('chapter.eq.$_filterChapter,chapter.ilike.%$_filterChapter%');
      }

      if (_filterDate != null) {
        final start = DateTime(
          _filterDate!.year,
          _filterDate!.month,
          _filterDate!.day,
        ).toUtc().toIso8601String();
        final end = DateTime(
          _filterDate!.year,
          _filterDate!.month,
          _filterDate!.day,
          23,
          59,
          59,
          999,
        ).toUtc().toIso8601String();
        query = query.gte('created_at', start).lte('created_at', end);
      }

      final data = await query
          .order('created_at', ascending: false)
          .range(currentOffset, currentOffset + _qPageSize - 1);

      final fetched = (data as List)
          .map((q) => Question.fromJson(q as Map<String, dynamic>))
          .toList();

      if (mounted) {
        setState(() {
          if (refresh) {
            _questions = fetched;
            _isLoadingQuestions = false;
          } else {
            _questions.addAll(fetched);
            _isLoadingMoreQuestions = false;
          }
          _qOffset = currentOffset + fetched.length;
          _hasMoreQuestions = fetched.length >= _qPageSize;
        });
      }
    } catch (e) {
      debugPrint('[ExamHistoryView] _fetchQuestions error: $e');
      if (mounted) {
        setState(() {
          if (refresh) {
            _isLoadingQuestions = false;
            _hasErrorQuestions = true;
          } else {
            _isLoadingMoreQuestions = false;
          }
        });
      }
    }
  }

  void _onFilterChanged() {
    _fetchQuestions(refresh: true);
    setState(() {});
  }

  List<_ExamRecord> get _filteredExams {
    return _history.where((h) {
      if (_filterSubject.isNotEmpty &&
          h.subject.toLowerCase() != _filterSubject.toLowerCase()) {
        return false;
      }
      if (_filterDate != null) {
        final d = h.createdAt;
        if (d.year != _filterDate!.year ||
            d.month != _filterDate!.month ||
            d.day != _filterDate!.day) {
          return false;
        }
      }
      return true;
    }).toList();
  }

  List<_ExamRecord> get _sortedFilteredExams {
    final list = List<_ExamRecord>.from(_filteredExams);
    switch (_sortBy) {
      case _SortMode.scoreDesc:
        list.sort((a, b) => b.score.compareTo(a.score));
      case _SortMode.scoreAsc:
        list.sort((a, b) => a.score.compareTo(b.score));
      case _SortMode.date:
        break;
    }
    return list;
  }

  Future<void> _clearHistory() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('ইতিহাস মুছবেন?'),
        content: const Text('এই অ্যাকশনটি ফিরিয়ে আনা যাবে না।'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('বাতিল'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('মুছুন', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _isClearing = true);
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid != null) {
        await sb.from('exam_results').delete().eq('user_id', uid);
        setState(() {
          _history = [];
        });
        if (mounted) {
          AppPopups.show(
            context,
            message: 'ইতিহাস মুছে ফেলা হয়েছে',
            isError: false,
          );
        }
      }
    } catch (e) {
      if (mounted) {
        AppPopups.show(
          context,
          message: 'ইতিহাস মুছতে সমস্যা হয়েছে',
          isError: true,
        );
      }
      debugPrint('[ExamHistoryView] _clearHistory error: $e');
    } finally {
      if (mounted) setState(() => _isClearing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) {
        _fetchExams();
        _fetchQuestions(refresh: true);
      }
    });

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ── Top Bar: Right Aligned Smaller Tabs ─────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Container(
                height: 36,
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF1E1E1E)
                      : const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF2E2E2E)
                        : const Color(0xFFE5E7EB),
                  ),
                ),
                child: TabBar(
                  controller: _tab,
                  isScrollable: true,
                  tabAlignment: TabAlignment.start,
                  indicator: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF004633), Color(0xFF00664B)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(9),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF10B981).withValues(alpha: 0.25),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  labelColor: Colors.white,
                  unselectedLabelColor: isDark
                      ? const Color(0xFFA3A3A3)
                      : const Color(0xFF6B7280),
                  labelStyle: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    fontFamily: 'HindSiliguri',
                  ),
                  labelPadding: const EdgeInsets.symmetric(horizontal: 14),
                  dividerColor: Colors.transparent,
                  tabs: const [
                    Tab(
                      height: 30,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.barChart2, size: 14),
                          SizedBox(width: 5),
                          Text('পরীক্ষা'),
                        ],
                      ),
                    ),
                    Tab(
                      height: 30,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.helpCircle, size: 14),
                          SizedBox(width: 5),
                          Text('প্রশ্ন'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // ── Single Row Filter: Subject | Chapter | Date ─────────────────────
        // Guaranteed to stay in a single row for all mobile screen sizes
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Row(
            children: [
              // 1. Subject Dropdown
              Expanded(
                flex: 5,
                child: Container(
                  height: 38,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _filterSubject.isNotEmpty
                          ? const Color(0xFF10B981)
                          : (isDark
                                ? const Color(0xFF2E2E2E)
                                : const Color(0xFFE5E7EB)),
                    ),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _filterSubject.isEmpty ? null : _filterSubject,
                      hint: Text(
                        'বিষয়',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          fontFamily: 'HindSiliguri',
                          color: isDark
                              ? const Color(0xFFA3A3A3)
                              : const Color(0xFF6B7280),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      isExpanded: true,
                      icon: Icon(
                        LucideIcons.chevronDown,
                        size: 14,
                        color: isDark
                            ? const Color(0xFFA3A3A3)
                            : const Color(0xFF6B7280),
                      ),
                      dropdownColor: isDark
                          ? const Color(0xFF1E1E1E)
                          : Colors.white,
                      items: [
                        const DropdownMenuItem<String>(
                          value: '',
                          child: Text(
                            'সকল বিষয়',
                            style: TextStyle(
                              fontSize: 13,
                              fontFamily: 'HindSiliguri',
                            ),
                          ),
                        ),
                        ..._subjectList.map(
                          (s) => DropdownMenuItem<String>(
                            value: s.key,
                            child: Text(
                              s.value,
                              style: const TextStyle(
                                fontSize: 13,
                                fontFamily: 'HindSiliguri',
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ),
                      ],
                      onChanged: (v) {
                        setState(() {
                          _filterSubject = v ?? '';
                        });
                        _fetchChaptersForSubject(_filterSubject);
                        _onFilterChanged();
                      },
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 6),

              // 2. Chapter Dropdown
              Expanded(
                flex: 5,
                child: Container(
                  height: 38,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _filterChapter.isNotEmpty
                          ? const Color(0xFF10B981)
                          : (isDark
                                ? const Color(0xFF2E2E2E)
                                : const Color(0xFFE5E7EB)),
                    ),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _filterChapter.isEmpty ? null : _filterChapter,
                      hint: Text(
                        'অধ্যায়',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          fontFamily: 'HindSiliguri',
                          color: isDark
                              ? const Color(0xFFA3A3A3)
                              : const Color(0xFF6B7280),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      isExpanded: true,
                      icon: Icon(
                        LucideIcons.chevronDown,
                        size: 14,
                        color: isDark
                            ? const Color(0xFFA3A3A3)
                            : const Color(0xFF6B7280),
                      ),
                      dropdownColor: isDark
                          ? const Color(0xFF1E1E1E)
                          : Colors.white,
                      items: [
                        const DropdownMenuItem<String>(
                          value: '',
                          child: Text(
                            'সকল অধ্যায়',
                            style: TextStyle(
                              fontSize: 13,
                              fontFamily: 'HindSiliguri',
                            ),
                          ),
                        ),
                        ..._chapterList.map(
                          (c) => DropdownMenuItem<String>(
                            value: c,
                            child: Text(
                              c,
                              style: const TextStyle(
                                fontSize: 13,
                                fontFamily: 'HindSiliguri',
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ),
                      ],
                      onChanged: (v) {
                        setState(() {
                          _filterChapter = v ?? '';
                        });
                        _onFilterChanged();
                      },
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 6),

              // 3. Date Filter Chip
              GestureDetector(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _filterDate ?? DateTime.now(),
                    firstDate: DateTime(2023),
                    lastDate: DateTime.now(),
                  );
                  if (picked != null) {
                    setState(() => _filterDate = picked);
                    _onFilterChanged();
                  }
                },
                child: Container(
                  height: 38,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: _filterDate != null
                        ? (isDark
                              ? const Color(0xFF064E3B)
                              : const Color(0xFFECFDF5))
                        : (isDark ? const Color(0xFF1E1E1E) : Colors.white),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _filterDate != null
                          ? const Color(0xFF10B981)
                          : (isDark
                                ? const Color(0xFF2E2E2E)
                                : const Color(0xFFE5E7EB)),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        LucideIcons.calendar,
                        size: 14,
                        color: _filterDate != null
                            ? (isDark
                                  ? const Color(0xFF34D399)
                                  : const Color(0xFF004633))
                            : (isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF6B7280)),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        _filterDate != null
                            ? DateFormat('d/M').format(_filterDate!)
                            : 'তারিখ',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                          color: _filterDate != null
                              ? (isDark
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFF004633))
                              : (isDark
                                    ? const Color(0xFFA3A3A3)
                                    : const Color(0xFF6B7280)),
                        ),
                      ),
                      if (_filterDate != null) ...[
                        const SizedBox(width: 4),
                        GestureDetector(
                          onTap: () {
                            setState(() => _filterDate = null);
                            _onFilterChanged();
                          },
                          child: Icon(
                            LucideIcons.x,
                            size: 13,
                            color: isDark
                                ? const Color(0xFF34D399)
                                : const Color(0xFF004633),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 6),

        // ── Tab Views ───────────────────────────────────────────────────────
        Expanded(
          child: TabBarView(
            controller: _tab,
            children: [
              // Tab 1: Exams
              _isLoadingExams
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: Color(0xFF10B981),
                        strokeWidth: 2.5,
                      ),
                    )
                  : _hasErrorExams
                  ? _errorState(isDark, _fetchExams)
                  : _ExamsTab(
                      records: _sortedFilteredExams,
                      isDark: isDark,
                      onClear: _history.isEmpty ? null : _clearHistory,
                      isClearing: _isClearing,
                      sortBy: _sortBy,
                      onSortChange: (s) => setState(() => _sortBy = s),
                      onRefresh: _fetchExams,
                    ),

              // Tab 2: Questions (Paginated with Load More using standard QuestionCard)
              _isLoadingQuestions
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: Color(0xFF10B981),
                        strokeWidth: 2.5,
                      ),
                    )
                  : _hasErrorQuestions
                  ? _errorState(isDark, () => _fetchQuestions(refresh: true))
                  : _QuestionsTab(
                      questions: _questions,
                      bookmarkedIds: _bookmarkedIds,
                      onToggleBookmark: _toggleBookmark,
                      onReport: _showReportDialog,
                      isDark: isDark,
                      hasMore: _hasMoreQuestions,
                      isLoadingMore: _isLoadingMoreQuestions,
                      onLoadMore: () => _fetchQuestions(refresh: false),
                      onRefresh: () => _fetchQuestions(refresh: true),
                    ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Exams Tab ─────────────────────────────────────────────────────────────────
class _ExamsTab extends StatelessWidget {
  final List<_ExamRecord> records;
  final bool isDark;
  final VoidCallback? onClear;
  final bool isClearing;
  final _SortMode sortBy;
  final void Function(_SortMode) onSortChange;
  final Future<void> Function() onRefresh;

  const _ExamsTab({
    required this.records,
    required this.isDark,
    this.onClear,
    required this.isClearing,
    required this.sortBy,
    required this.onSortChange,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (records.isEmpty) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        color: const Color(0xFF10B981),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(
              height: MediaQuery.of(context).size.height * 0.45,
              child: _emptyState(
                isDark,
                'কোনো পরীক্ষা দেওয়া হয়নি',
                'একটি পরীক্ষা দাও এবং তোমার অগ্রগতি এখানে দেখো।',
              ),
            ),
          ],
        ),
      );
    }

    int totalQuestions = 0;
    int totalCorrect = 0;
    int totalWrong = 0;

    for (final r in records) {
      totalQuestions += r.totalQuestions;
      totalCorrect += r.correctCount;
      totalWrong += r.wrongCount;
    }

    final avgScore = records.isEmpty
        ? 0.0
        : records.map((r) => r.score).reduce((a, b) => a + b) / records.length;

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: const Color(0xFF10B981),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        children: [
          // Sort & Clear Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Compact Sort Dropdown
              Container(
                height: 34,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                  borderRadius: BorderRadius.circular(9),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF2E2E2E)
                        : const Color(0xFFE5E7EB),
                  ),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<_SortMode>(
                    value: sortBy,
                    isDense: true,
                    icon: Icon(
                      LucideIcons.chevronDown,
                      size: 13,
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF6B7280),
                    ),
                    dropdownColor: isDark
                        ? const Color(0xFF1E1E1E)
                        : Colors.white,
                    items: const [
                      DropdownMenuItem(
                        value: _SortMode.date,
                        child: Text(
                          'তারিখ অনুযায়ী',
                          style: TextStyle(
                            fontSize: 12,
                            fontFamily: 'HindSiliguri',
                          ),
                        ),
                      ),
                      DropdownMenuItem(
                        value: _SortMode.scoreDesc,
                        child: Text(
                          'স্কোর: বেশি আগে',
                          style: TextStyle(
                            fontSize: 12,
                            fontFamily: 'HindSiliguri',
                          ),
                        ),
                      ),
                      DropdownMenuItem(
                        value: _SortMode.scoreAsc,
                        child: Text(
                          'স্কোর: কম আগে',
                          style: TextStyle(
                            fontSize: 12,
                            fontFamily: 'HindSiliguri',
                          ),
                        ),
                      ),
                    ],
                    onChanged: (v) {
                      if (v != null) onSortChange(v);
                    },
                  ),
                ),
              ),

              // Compact Clear Button
              if (onClear != null)
                GestureDetector(
                  onTap: isClearing ? null : onClear,
                  child: Container(
                    height: 34,
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(9),
                      border: Border.all(
                        color: const Color(0xFFEF4444).withValues(alpha: 0.2),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isClearing)
                          const SizedBox(
                            width: 12,
                            height: 12,
                            child: CircularProgressIndicator(
                              strokeWidth: 1.5,
                              color: Color(0xFFEF4444),
                            ),
                          )
                        else
                          const Icon(
                            LucideIcons.trash2,
                            size: 13,
                            color: Color(0xFFEF4444),
                          ),
                        const SizedBox(width: 5),
                        const Text(
                          'মুছুন',
                          style: TextStyle(
                            color: Color(0xFFEF4444),
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            fontFamily: 'HindSiliguri',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),

          // ── Compact Center-Aligned Stats Grid ─────────────────────────────
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 2.15,
            children: [
              _buildStatCard(
                title: 'মোট প্রশ্ন',
                value: '$totalQuestions',
                icon: LucideIcons.layers,
                gradient: const [Color(0xFF004633), Color(0xFF00664B)],
                textColor: Colors.white,
                isDark: isDark,
              ),
              _buildStatCard(
                title: 'সঠিক',
                value: '$totalCorrect',
                icon: LucideIcons.checkCircle2,
                gradient: isDark
                    ? const [Color(0xFF064E3B), Color(0xFF065F46)]
                    : const [Color(0xFFECFDF5), Color(0xFFD1FAE5)],
                textColor: isDark
                    ? const Color(0xFF34D399)
                    : const Color(0xFF004633),
                isDark: isDark,
              ),
              _buildStatCard(
                title: 'ভুল',
                value: '$totalWrong',
                icon: LucideIcons.xCircle,
                gradient: isDark
                    ? const [Color(0xFF450A0A), Color(0xFF7F1D1D)]
                    : const [Color(0xFFFEF2F2), Color(0xFFFEE2E2)],
                textColor: isDark
                    ? const Color(0xFFF87171)
                    : const Color(0xFFDC2626),
                isDark: isDark,
              ),
              _buildStatCard(
                title: 'গড় নম্বর',
                value: '${avgScore.round()}%',
                icon: LucideIcons.target,
                gradient: isDark
                    ? const [Color(0xFF1C1C1E), Color(0xFF2E2E2E)]
                    : const [Color(0xFFF3F4F6), Color(0xFFE5E7EB)],
                textColor: isDark ? Colors.white : const Color(0xFF111827),
                isDark: isDark,
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Section Header
          Text(
            'সাম্প্রতিক পরীক্ষাসমূহ',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : const Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 8),

          // Compact Exam Cards
          ...records.map((r) => _ExamCard(record: r, isDark: isDark)),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required List<Color> gradient,
    required Color textColor,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.05)
              : Colors.transparent,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 13, color: textColor.withValues(alpha: 0.85)),
              const SizedBox(width: 4),
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: textColor.withValues(alpha: 0.9),
                  fontFamily: 'HindSiliguri',
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w900,
              color: textColor,
              height: 1.1,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Compact Clickable Exam Card ───────────────────────────────────────────────
class _ExamCard extends StatefulWidget {
  final _ExamRecord record;
  final bool isDark;

  const _ExamCard({required this.record, required this.isDark});

  @override
  State<_ExamCard> createState() => _ExamCardState();
}

class _ExamCardState extends State<_ExamCard> {
  bool _isLoading = false;

  Future<void> _handleTap() async {
    if (_isLoading) return;
    setState(() => _isLoading = true);

    try {
      // 1. Try loading from local cache first (instant offline response)
      final cached = await LocalExamCacheService.getExamResult(widget.record.id);
      if (cached != null && cached.questions.isNotEmpty) {
        if (mounted) {
          setState(() => _isLoading = false);
          Navigator.of(context, rootNavigator: true).push(
            MaterialPageRoute(
              builder: (_) => ResultView(
                result: cached,
                isHistoryMode: true,
                onRestart: () => Navigator.pop(context),
              ),
            ),
          );
        }
        return;
      }

      // 2. Fetch full evaluated record from Supabase
      final sb = Supabase.instance.client;
      final row = await sb
          .from('exam_results')
          .select('*')
          .eq('id', widget.record.id)
          .maybeSingle();

      if (row != null) {
        final examResult = ExamResult.fromJson(row);
        // Cache locally for future instant offline access
        await LocalExamCacheService.saveExamResult(examResult);

        if (mounted) {
          setState(() => _isLoading = false);
          Navigator.of(context, rootNavigator: true).push(
            MaterialPageRoute(
              builder: (_) => ResultView(
                result: examResult,
                isHistoryMode: true,
                onRestart: () => Navigator.pop(context),
              ),
            ),
          );
        }
        return;
      }
    } catch (e) {
      debugPrint('[ExamCard] Error fetching exam details: $e');
    }

    if (mounted) {
      setState(() => _isLoading = false);
      AppPopups.show(
        context,
        message: 'এই পরীক্ষার বিস্তারিত ডাটা লোড করা সম্ভব হয়নি। ইন্টারনেট সংযোগ চেক করুন।',
        isError: true,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final record = widget.record;
    final isDark = widget.isDark;
    final color = _scoreColor(record.score);
    final dateStr = DateFormat('d MMM yyyy, h:mm a').format(record.createdAt);
    final label = record.subjectLabel.isNotEmpty
        ? record.subjectLabel
        : _subjectDisplay(record.subject);
    final timeStr = record.timeTaken != null
        ? _formatDur(record.timeTaken!)
        : '--';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? const Color(0xFF2E2E2E) : const Color(0xFFF3F4F6),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.15 : 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _handleTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Compact Score Ring
                SizedBox(
                  width: 42,
                  height: 42,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      CircularProgressIndicator(
                        value: 1.0,
                        strokeWidth: 3.5,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          isDark ? const Color(0xFF2E2E2E) : const Color(0xFFF3F4F6),
                        ),
                      ),
                      CircularProgressIndicator(
                        value: record.score / 100,
                        strokeWidth: 3.5,
                        strokeCap: StrokeCap.round,
                        backgroundColor: Colors.transparent,
                        valueColor: AlwaysStoppedAnimation<Color>(color),
                      ),
                      Center(
                        child: Text(
                          '${record.score.round()}%',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? Colors.white : const Color(0xFF111827),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),

                // Details Center Aligned vertically
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        label,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          fontFamily: 'HindSiliguri',
                          color: isDark ? Colors.white : const Color(0xFF111827),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Icon(
                            LucideIcons.calendar,
                            size: 11,
                            color: isDark
                                ? const Color(0xFFA3A3A3)
                                : const Color(0xFF6B7280),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            dateStr,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              fontFamily: 'HindSiliguri',
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF2A2A2A)
                                  : const Color(0xFFF3F4F6),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '${record.correctCount} সঠিক, ${record.wrongCount} ভুল',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'HindSiliguri',
                                color: isDark
                                    ? const Color(0xFFD4D4D4)
                                    : const Color(0xFF4B5563),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF2A2A2A)
                                  : const Color(0xFFF3F4F6),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  LucideIcons.timer,
                                  size: 10,
                                  color: isDark
                                      ? const Color(0xFFD4D4D4)
                                      : const Color(0xFF4B5563),
                                ),
                                const SizedBox(width: 3),
                                Text(
                                  timeStr,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark
                                        ? const Color(0xFFD4D4D4)
                                        : const Color(0xFF4B5563),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 8),

                // Right Action / Loading indicator
                if (_isLoading)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF004633)),
                    ),
                  )
                else
                  Icon(
                    LucideIcons.chevronRight,
                    size: 16,
                    color: isDark
                        ? const Color(0xFF525252)
                        : const Color(0xFFD1D5DB),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Questions Tab (Paginated Server Data with QuestionCard) ───────────────────
class _QuestionsTab extends StatelessWidget {
  final List<Question> questions;
  final Set<String> bookmarkedIds;
  final ValueChanged<String> onToggleBookmark;
  final ValueChanged<String> onReport;
  final bool isDark;
  final bool hasMore;
  final bool isLoadingMore;
  final VoidCallback onLoadMore;
  final Future<void> Function() onRefresh;

  const _QuestionsTab({
    required this.questions,
    required this.bookmarkedIds,
    required this.onToggleBookmark,
    required this.onReport,
    required this.isDark,
    required this.hasMore,
    required this.isLoadingMore,
    required this.onLoadMore,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (questions.isEmpty) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        color: const Color(0xFF10B981),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(
              height: MediaQuery.of(context).size.height * 0.45,
              child: _emptyState(
                isDark,
                'কোনো প্রশ্ন পাওয়া যায়নি',
                'অন্য ফিল্টার নির্বাচন করে আবার চেষ্টা করুন।',
              ),
            ),
          ],
        ),
      );
    }

    final itemCount = questions.length + (hasMore ? 1 : 0);

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: const Color(0xFF10B981),
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: itemCount,
        itemBuilder: (context, index) {
          if (index == questions.length) {
            // Load More Button
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Center(
                child: GestureDetector(
                  onTap: isLoadingMore ? null : onLoadMore,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF1E1E1E)
                          : const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF2E2E2E)
                            : const Color(0xFFE5E7EB),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isLoadingMore)
                          const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Color(0xFF10B981),
                            ),
                          )
                        else
                          const Icon(
                            LucideIcons.chevronDown,
                            size: 15,
                            color: Color(0xFF10B981),
                          ),
                        const SizedBox(width: 6),
                        Text(
                          isLoadingMore ? 'লোড হচ্ছে...' : 'আরও লোড করুন (১৫টি)',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? Colors.white : const Color(0xFF111827),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }

          final q = questions[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: QuestionCard(
              question: q,
              serialNumber: index + 1,
              selectedOptionIndex: q.correctAnswerIndex,
              isFlagged: false,
              readOnly: true,
              showAnswer: true,
              showFeedback: true,
              initiallyExpanded: false,
              isBookmarked: bookmarkedIds.contains(q.id),
              onSelectOption: (_) {},
              onToggleFlag: () {},
              onReport: () => onReport(q.id),
              onToggleBookmark: () => onToggleBookmark(q.id),
            ),
          );
        },
      ),
    );
  }
}

// ─── Shared Centered States ───────────────────────────────────────────────────
Widget _emptyState(bool isDark, String title, String subtitle) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF34D399), Color(0xFF10B981)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF10B981).withValues(alpha: 0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: const Icon(
              LucideIcons.flaskConical,
              size: 28,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : const Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              fontFamily: 'HindSiliguri',
              color: Color(0xFFA3A3A3),
            ),
          ),
        ],
      ),
    ),
  );
}

Widget _errorState(bool isDark, VoidCallback onRetry) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFF87171), Color(0xFFEF4444)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: const Icon(
              LucideIcons.wifiOff,
              size: 28,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'ডেটা লোড হয়নি',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : const Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontFamily: 'HindSiliguri',
              color: Color(0xFFA3A3A3),
            ),
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: onRetry,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 9),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF004633), Color(0xFF00664B)],
                ),
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF10B981).withValues(alpha: 0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Text(
                'আবার চেষ্টা করুন',
                style: TextStyle(
                  fontSize: 13,
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
