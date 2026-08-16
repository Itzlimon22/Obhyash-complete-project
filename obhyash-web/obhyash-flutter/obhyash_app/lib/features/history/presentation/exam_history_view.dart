import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/utils/app_popups.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../../dashboard/providers/dashboard_providers.dart';
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
    final parsed = DateTime.tryParse(dateStr);
    final createdAt = parsed != null ? parsed.toLocal() : DateTime.now();

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
int _getSubjectSortPriority(String name, String id) {
  final l = '$name $id'.toLowerCase();
  int base = 100;

  if (l.contains('bangla') || l.contains('বাংলা')) {
    base = 10;
  } else if (l.contains('english') || l.contains('ইংরেজি')) {
    base = 20;
  } else if (l.contains('ict') ||
      l.contains('তথ্য') ||
      l.contains('information')) {
    base = 30;
  } else if (l.contains('physics') || l.contains('পদার্থ')) {
    base = 40;
  } else if (l.contains('chemistry') ||
      l.contains('রসায়ন') ||
      l.contains('রসায়ন')) {
    base = 50;
  } else if (l.contains('math') || l.contains('গণিত')) {
    base = 60;
  } else if (l.contains('biology') ||
      l.contains('botany') ||
      l.contains('zoology') ||
      l.contains('জীববিজ্ঞান')) {
    base = 70;
  } else if (l.contains('accounting') || l.contains('হিসাব')) {
    base = 80;
  } else if (l.contains('finance') ||
      l.contains('ফিন্যান্স') ||
      l.contains('ব্যাংকিং')) {
    base = 82;
  } else if (l.contains('management') ||
      l.contains('ব্যবসায়') ||
      l.contains('ব্যবস্থাপনা')) {
    base = 84;
  } else if (l.contains('marketing') || l.contains('বিপণন')) {
    base = 86;
  } else if (l.contains('economics') || l.contains('অর্থনীতি')) {
    base = 88;
  } else if (l.contains('statistics') || l.contains('পরিসংখ্যান')) {
    base = 90;
  } else if (l.contains('civics') || l.contains('পৌরনীতি')) {
    base = 92;
  } else if (l.contains('history') || l.contains('ইতিহাস')) {
    base = 94;
  }

  // 1st paper comes before 2nd paper
  if (l.contains('2nd') ||
      l.contains('_2') ||
      l.contains('২য়') ||
      l.contains('২য়') ||
      l.contains('zoology') ||
      l.contains('প্রাণি')) {
    return base + 1;
  }
  return base;
}

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

  // Exams Tab state (Server-side paginated)
  List<_ExamRecord> _history = [];
  bool _isLoadingExams = true;
  bool _isLoadingMoreExams = false;
  bool _hasMoreExams = true;
  bool _hasErrorExams = false;
  _SortMode _sortBy = _SortMode.date;
  static const int _examPageSize = 20;
  int _examOffset = 0;

  // Questions Tab state (Server-side paginated)
  List<Question> _questions = [];
  Set<String> _bookmarkedIds = {};
  bool _isLoadingQuestions = true;
  bool _isLoadingMoreQuestions = false;
  bool _hasMoreQuestions = true;
  bool _hasErrorQuestions = false;
  static const int _qPageSize = 20;
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
    _fetchExams(refresh: true);
    _fetchQuestions(refresh: true);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  Future<void> _fetchMetadata() async {
    try {
      final profile = ref.read(userProfileProvider).value;
      final level = profile?.level?.trim() ?? profile?.stream?.trim();
      final division = profile?.division?.trim();
      final optionalSubject = profile?.optionalSubject?.trim();

      final sb = Supabase.instance.client;
      dynamic data;
      try {
        var query = sb.from('subjects').select('*');
        if (division != null && division.isNotEmpty && division != 'General') {
          query = query.or(
            'division.eq.$division,division.eq.General,division.is.null',
          );
        }
        data = await query.limit(150);
      } catch (e) {
        data = await sb.from('subjects').select('*').limit(150);
      }

      if (data == null || (data is List && data.isEmpty)) {
        data = await sb.from('subjects').select('*').limit(150);
      }

      final List rawList = data is List ? data : [];
      var filteredData = rawList.where((e) {
        final subName =
            (e['name'] ?? e['name_en'] ?? '').toString().toLowerCase();
        final subId = e['id'].toString().toLowerCase();
        final subLevel = (e['level'] ?? '').toString().toUpperCase();

        // Level safety check (HSC vs SSC)
        if (level != null && level.toUpperCase().contains('SSC')) {
          if (subId.startsWith('hsc_') ||
              subName.contains('hsc') ||
              subLevel == 'HSC') {
            return false;
          }
        } else if (level != null && level.toUpperCase().contains('HSC')) {
          if (subId.startsWith('ssc_') ||
              subName.contains('ssc') ||
              subLevel == 'SSC') {
            return false;
          }
        }

        // Optional Subject filtering
        final isBiology = subName.contains('biology') ||
            subId.contains('biology') ||
            subName.contains('জীববিজ্ঞান');
        final isStatistics = subName.contains('statistics') ||
            subId.contains('statistics') ||
            subName.contains('পরিসংখ্যান');

        if (optionalSubject != null && optionalSubject.isNotEmpty) {
          if (optionalSubject.toLowerCase().contains('stat')) {
            if (isBiology) return false;
          } else if (optionalSubject.toLowerCase().contains('bio')) {
            if (isStatistics) return false;
          }
        }
        return true;
      }).toList();

      if (filteredData.isEmpty) {
        filteredData = rawList;
      }

      final sortOrderMap = <String, int>{};
      final seen = <String, String>{};
      for (final s in filteredData) {
        final id = s['id']?.toString() ?? '';
        final rawName = (s['name'] ?? s['name_en'] ?? '').toString();
        final rawNameEn = (s['name_en'] ?? '').toString();
        final formattedName = BanglaNameHelper.formatSubject(
          rawNameEn.isNotEmpty ? rawNameEn : rawName,
          rawName,
        );
        if (id.isNotEmpty && formattedName.isNotEmpty) {
          seen[id] = formattedName;
          if (s['sort_order'] is int) {
            sortOrderMap[id] = s['sort_order'] as int;
          }
        }
      }

      final entries = seen.entries.toList();
      entries.sort((a, b) {
        final soA = sortOrderMap[a.key];
        final soB = sortOrderMap[b.key];
        if (soA != null && soB != null && soA != soB) {
          return soA.compareTo(soB);
        }
        final prioA = _getSubjectSortPriority(a.value, a.key);
        final prioB = _getSubjectSortPriority(b.value, b.key);
        if (prioA != prioB) return prioA.compareTo(prioB);
        return a.value.compareTo(b.value);
      });

      if (mounted) {
        setState(() {
          _subjectList = entries;
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

  Future<void> _fetchExams({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _isLoadingExams = true;
        _hasErrorExams = false;
        _examOffset = 0;
        _hasMoreExams = true;
      });
    } else {
      if (_isLoadingMoreExams || !_hasMoreExams) return;
      setState(() {
        _isLoadingMoreExams = true;
      });
    }

    try {
      final sb = Supabase.instance.client;
      final authResponse = await sb.auth.getSession();
      final uid = sb.auth.currentUser?.id ?? authResponse?.user.id;
      if (uid == null) {
        setState(() {
          _isLoadingExams = false;
          _isLoadingMoreExams = false;
        });
        return;
      }

      final currentOffset = refresh ? 0 : _examOffset;

      var query = sb
          .from('exam_results')
          .select(
            'id, subject, subject_label, correct_count, wrong_count, total_questions, time_taken, created_at, date, exam_type',
          )
          .eq('user_id', uid);

      if (_filterSubject.isNotEmpty) {
        query = query.or('subject.eq.$_filterSubject,subject.ilike.%$_filterSubject%');
      }

      if (_filterDate != null) {
        final startUtc = DateTime(
          _filterDate!.year,
          _filterDate!.month,
          _filterDate!.day,
          0,
          0,
          0,
        ).toUtc().toIso8601String();
        final endUtc = DateTime(
          _filterDate!.year,
          _filterDate!.month,
          _filterDate!.day,
          23,
          59,
          59,
          999,
        ).toUtc().toIso8601String();
        query = query.or(
          'and(created_at.gte.$startUtc,created_at.lte.$endUtc),and(date.gte.$startUtc,date.lte.$endUtc)',
        );
      }

      final data = await query
          .order('date', ascending: false)
          .range(currentOffset, currentOffset + _examPageSize - 1);

      if (mounted) {
        final records = (data as List)
            .map((r) => _ExamRecord.fromJson(r as Map<String, dynamic>))
            .toList();

        // Cache history list for offline usage (on first page)
        if (refresh) {
          await LocalExamCacheService.cacheHistoryList(
            (data as List).map((e) => e as Map<String, dynamic>).toList(),
          );
        }

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
          if (refresh) {
            _history = records;
            _isLoadingExams = false;
          } else {
            _history.addAll(records);
            _isLoadingMoreExams = false;
          }
          _examOffset = currentOffset + records.length;
          _hasMoreExams = records.length >= _examPageSize;
        });
      }
    } catch (e) {
      debugPrint('[ExamHistoryView] _fetchExams error: $e');
      if (refresh) {
        final cached = await LocalExamCacheService.getCachedHistoryList();
        if (cached != null && cached.isNotEmpty && mounted) {
          final records = cached
              .map((r) => _ExamRecord.fromJson(r))
              .toList();
          setState(() {
            _history = records;
            _isLoadingExams = false;
            _hasErrorExams = false;
            _hasMoreExams = false;
          });
          return;
        }
      }
      if (mounted) {
        setState(() {
          if (refresh) {
            _isLoadingExams = false;
            _hasErrorExams = true;
          } else {
            _isLoadingMoreExams = false;
          }
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
        final startUtc = DateTime(
          _filterDate!.year,
          _filterDate!.month,
          _filterDate!.day,
          0,
          0,
          0,
        ).toUtc().toIso8601String();
        final endUtc = DateTime(
          _filterDate!.year,
          _filterDate!.month,
          _filterDate!.day,
          23,
          59,
          59,
          999,
        ).toUtc().toIso8601String();
        query = query.gte('created_at', startUtc).lte('created_at', endUtc);
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
    _fetchExams(refresh: true);
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



  void _openPremiumDatePicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _PremiumDatePickerModal(
        selectedDate: _filterDate,
        onDateSelected: (date) {
          setState(() {
            _filterDate = date;
          });
          _onFilterChanged();
        },
      ),
    );
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
                      child: Text('পরীক্ষা'),
                    ),
                    Tab(
                      height: 30,
                      child: Text('প্রশ্ন'),
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
                          (s) {
                            final emoji = BanglaNameHelper.getSubjectEmoji(s.key, s.value);
                            return DropdownMenuItem<String>(
                              value: s.key,
                              child: Text(
                                '$emoji ${s.value}',
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontFamily: 'HindSiliguri',
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          },
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
                onTap: () => _openPremiumDatePicker(context),
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
                      sortBy: _sortBy,
                      onSortChange: (s) => setState(() => _sortBy = s),
                      onRefresh: () => _fetchExams(refresh: true),
                      hasMore: _hasMoreExams,
                      isLoadingMore: _isLoadingMoreExams,
                      onLoadMore: () => _fetchExams(refresh: false),
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
  final _SortMode sortBy;
  final void Function(_SortMode) onSortChange;
  final Future<void> Function() onRefresh;
  final bool hasMore;
  final bool isLoadingMore;
  final VoidCallback onLoadMore;

  const _ExamsTab({
    required this.records,
    required this.isDark,
    required this.sortBy,
    required this.onSortChange,
    required this.onRefresh,
    required this.hasMore,
    required this.isLoadingMore,
    required this.onLoadMore,
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

    for (final r in records) {
      totalQuestions += r.totalQuestions;
      totalCorrect += r.correctCount;
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
          // Sort Header Row
          Align(
            alignment: Alignment.centerLeft,
            child: Container(
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
          ),
          const SizedBox(height: 10),

          // ── Compact Center-Aligned 3-Card Stat Row ─────────────────────────────
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  title: 'মোট প্রশ্ন',
                  value: '$totalQuestions',
                  icon: LucideIcons.layers,
                  accentColor: const Color(0xFF059669),
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildStatCard(
                  title: 'সঠিক উত্তর',
                  value: '$totalCorrect',
                  icon: LucideIcons.checkCircle2,
                  accentColor: const Color(0xFF10B981),
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildStatCard(
                  title: 'গড় নম্বর',
                  value: '${avgScore.round()}%',
                  icon: LucideIcons.target,
                  accentColor: const Color(0xFF3B82F6),
                  isDark: isDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Section Header
          Text(
            'সাম্প্রতিক পরীক্ষাসমূহ',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : const Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 10),

          // Compact Exam Cards
          ...records.map((r) => _ExamCard(record: r, isDark: isDark)),
          if (hasMore) ...[
            const SizedBox(height: 12),
            Center(
              child: SizedBox(
                width: 220,
                height: 46,
                child: ElevatedButton.icon(
                  onPressed: isLoadingMore ? null : onLoadMore,
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        isDark ? const Color(0xFF18181B) : Colors.white,
                    foregroundColor:
                        isDark ? Colors.white : const Color(0xFF0F172A),
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
                    isLoadingMore ? 'লোড হচ্ছে...' : 'আরও ২০টি পরীক্ষা লোড করো',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      fontFamily: 'HindSiliguri',
                    ),
                  ),
                ),
              ),
            ),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color accentColor,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: accentColor.withValues(alpha: isDark ? 0.15 : 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            alignment: Alignment.center,
            child: Icon(icon, size: 15, color: accentColor),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
              height: 1.1,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 3),
          Text(
            title,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: isDark
                  ? const Color(0xFFA1A1AA)
                  : const Color(0xFF71717A),
              fontFamily: 'HindSiliguri',
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
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
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _handleTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Score Ring
                SizedBox(
                  width: 46,
                  height: 46,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      CircularProgressIndicator(
                        value: 1.0,
                        strokeWidth: 3.5,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6),
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
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? Colors.white : const Color(0xFF111827),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),

                // Details Center Aligned vertically
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        label,
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
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
                            size: 12,
                            color: isDark
                                ? const Color(0xFFA1A1AA)
                                : const Color(0xFF71717A),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            dateStr,
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w500,
                              fontFamily: 'HindSiliguri',
                              color: isDark
                                  ? const Color(0xFFA1A1AA)
                                  : const Color(0xFF71717A),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF27272A)
                                  : const Color(0xFFF4F4F5),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '${record.correctCount} সঠিক, ${record.wrongCount} ভুল',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'HindSiliguri',
                                color: isDark
                                    ? const Color(0xFFE4E4E7)
                                    : const Color(0xFF3F3F46),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF27272A)
                                  : const Color(0xFFF4F4F5),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  LucideIcons.timer,
                                  size: 11,
                                  color: isDark
                                      ? const Color(0xFFE4E4E7)
                                      : const Color(0xFF3F3F46),
                                ),
                                const SizedBox(width: 3),
                                Text(
                                  timeStr,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark
                                        ? const Color(0xFFE4E4E7)
                                        : const Color(0xFF3F3F46),
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
                Icon(
                  LucideIcons.chevronRight,
                  size: 18,
                  color: isDark ? const Color(0xFF52525B) : const Color(0xFFA1A1AA),
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
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: SizedBox(
                  width: 220,
                  height: 46,
                  child: ElevatedButton.icon(
                    onPressed: isLoadingMore ? null : onLoadMore,
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          isDark ? const Color(0xFF18181B) : Colors.white,
                      foregroundColor:
                          isDark ? Colors.white : const Color(0xFF0F172A),
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

// ─── Premium Calendar Modal ──────────────────────────────────────────────────
class _PremiumDatePickerModal extends StatefulWidget {
  final DateTime? selectedDate;
  final ValueChanged<DateTime?> onDateSelected;

  const _PremiumDatePickerModal({
    required this.selectedDate,
    required this.onDateSelected,
  });

  @override
  State<_PremiumDatePickerModal> createState() =>
      _PremiumDatePickerModalState();
}

class _PremiumDatePickerModalState extends State<_PremiumDatePickerModal> {
  late DateTime _displayedMonth;
  DateTime? _tempSelected;

  static const List<String> _banglaMonths = [
    'জানুয়ারি',
    'ফেব্রুয়ারি',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর'
  ];

  static const List<String> _banglaWeekdays = [
    'রবি',
    'সোম',
    'মঙ্গল',
    'বুধ',
    'বৃহঃ',
    'শুক্র',
    'শনি'
  ];

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _displayedMonth = widget.selectedDate != null
        ? DateTime(widget.selectedDate!.year, widget.selectedDate!.month)
        : DateTime(now.year, now.month);
    _tempSelected = widget.selectedDate;
  }

  String _toBanglaNumber(int n) {
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return n
        .toString()
        .split('')
        .map((char) {
          final digit = int.tryParse(char);
          return digit != null ? bn[digit] : char;
        })
        .join('');
  }

  void _previousMonth() {
    setState(() {
      _displayedMonth = DateTime(
        _displayedMonth.year,
        _displayedMonth.month - 1,
      );
    });
  }

  void _nextMonth() {
    final now = DateTime.now();
    if (_displayedMonth.year > now.year ||
        (_displayedMonth.year == now.year &&
            _displayedMonth.month >= now.month)) {
      return;
    }
    setState(() {
      _displayedMonth = DateTime(
        _displayedMonth.year,
        _displayedMonth.month + 1,
      );
    });
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    final isNextDisabled = _displayedMonth.year > now.year ||
        (_displayedMonth.year == now.year &&
            _displayedMonth.month >= now.month);

    final firstDayOfMonth = DateTime(
      _displayedMonth.year,
      _displayedMonth.month,
      1,
    );
    final daysInMonth = DateTime(
      _displayedMonth.year,
      _displayedMonth.month + 1,
      0,
    ).day;

    // Sunday = 0, Monday = 1, ..., Saturday = 6
    final startOffset = firstDayOfMonth.weekday % 7;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF3F3F46)
                        : const Color(0xFFD1D5DB),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Title & Close
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      LucideIcons.calendar,
                      size: 18,
                      color: Color(0xFF10B981),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'তারিখ নির্বাচন করুন',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF111827),
                          ),
                        ),
                        Text(
                          'নির্দিষ্ট দিনের পরীক্ষার ফলাফল ও প্রশ্নসমূহ দেখুন',
                          style: TextStyle(
                            fontSize: 12,
                            fontFamily: 'HindSiliguri',
                            color: isDark
                                ? const Color(0xFFA1A1AA)
                                : const Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(LucideIcons.x, size: 20),
                    color: isDark
                        ? const Color(0xFFA1A1AA)
                        : const Color(0xFF6B7280),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Quick Preset Chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildPresetChip(
                      label: 'আজ',
                      isSelected: _tempSelected != null &&
                          _isSameDay(_tempSelected!, today),
                      isDark: isDark,
                      onTap: () {
                        setState(() {
                          _tempSelected = today;
                          _displayedMonth =
                              DateTime(today.year, today.month);
                        });
                      },
                    ),
                    const SizedBox(width: 8),
                    _buildPresetChip(
                      label: 'গতকাল',
                      isSelected: _tempSelected != null &&
                          _isSameDay(
                            _tempSelected!,
                            today.subtract(const Duration(days: 1)),
                          ),
                      isDark: isDark,
                      onTap: () {
                        final yest = today.subtract(const Duration(days: 1));
                        setState(() {
                          _tempSelected = yest;
                          _displayedMonth =
                              DateTime(yest.year, yest.month);
                        });
                      },
                    ),
                    const SizedBox(width: 8),
                    _buildPresetChip(
                      label: 'গত ৭ দিন',
                      isSelected: false,
                      isDark: isDark,
                      onTap: () {
                        final past7 = today.subtract(const Duration(days: 7));
                        setState(() {
                          _tempSelected = past7;
                          _displayedMonth =
                              DateTime(past7.year, past7.month);
                        });
                      },
                    ),
                    const SizedBox(width: 8),
                    _buildPresetChip(
                      label: 'সকল তারিখ (Clear)',
                      isSelected: _tempSelected == null,
                      isDark: isDark,
                      isClear: true,
                      onTap: () {
                        setState(() {
                          _tempSelected = null;
                        });
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Calendar Card Container
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF09090B)
                      : const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFE5E7EB),
                  ),
                ),
                child: Column(
                  children: [
                    // Month & Navigation Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          onPressed: _previousMonth,
                          icon: const Icon(
                            LucideIcons.chevronLeft,
                            size: 18,
                          ),
                          color: isDark
                              ? Colors.white70
                              : const Color(0xFF374151),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(
                            minWidth: 32,
                            minHeight: 32,
                          ),
                        ),
                        Text(
                          '${_banglaMonths[_displayedMonth.month - 1]} ${_toBanglaNumber(_displayedMonth.year)}',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF111827),
                          ),
                        ),
                        IconButton(
                          onPressed: isNextDisabled ? null : _nextMonth,
                          icon: const Icon(
                            LucideIcons.chevronRight,
                            size: 18,
                          ),
                          color: isNextDisabled
                              ? (isDark
                                    ? const Color(0xFF3F3F46)
                                    : const Color(0xFFD1D5DB))
                              : (isDark
                                    ? Colors.white70
                                    : const Color(0xFF374151)),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(
                            minWidth: 32,
                            minHeight: 32,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Weekdays Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: _banglaWeekdays
                          .map(
                            (day) => SizedBox(
                              width: 38,
                              child: Text(
                                day,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'HindSiliguri',
                                  color: isDark
                                      ? const Color(0xFFA1A1AA)
                                      : const Color(0xFF9CA3AF),
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                    const SizedBox(height: 8),

                    // Days Grid
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: startOffset + daysInMonth,
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 7,
                        mainAxisSpacing: 6,
                        crossAxisSpacing: 4,
                        childAspectRatio: 1.05,
                      ),
                      itemBuilder: (context, index) {
                        if (index < startOffset) {
                          return const SizedBox.shrink();
                        }
                        final dayNum = index - startOffset + 1;
                        final currentDay = DateTime(
                          _displayedMonth.year,
                          _displayedMonth.month,
                          dayNum,
                        );
                        final isFuture = currentDay.isAfter(today);
                        final isSelected = _tempSelected != null &&
                            _isSameDay(_tempSelected!, currentDay);
                        final isCurrentToday = _isSameDay(currentDay, today);

                        Color? cellBg;
                        Color textCol = isDark
                            ? Colors.white
                            : const Color(0xFF1F2937);
                        BoxBorder? cellBorder;
                        List<BoxShadow> cellShadow = [];

                        if (isSelected) {
                          cellBg = const Color(0xFF004633);
                          textCol = Colors.white;
                          cellShadow = [
                            BoxShadow(
                              color: const Color(
                                0xFF10B981,
                              ).withValues(alpha: 0.3),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ];
                        } else if (isCurrentToday) {
                          cellBorder = Border.all(
                            color: const Color(0xFF10B981),
                            width: 1.5,
                          );
                          textCol = const Color(0xFF10B981);
                        }

                        if (isFuture) {
                          textCol = isDark
                              ? const Color(0xFF3F3F46)
                              : const Color(0xFFD1D5DB);
                        }

                        return GestureDetector(
                          onTap: isFuture
                              ? null
                              : () {
                                  setState(() {
                                    _tempSelected = currentDay;
                                  });
                                },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            decoration: BoxDecoration(
                              color: cellBg,
                              borderRadius: BorderRadius.circular(10),
                              border: cellBorder,
                              boxShadow: cellShadow,
                            ),
                            alignment: Alignment.center,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  _toBanglaNumber(dayNum),
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: (isSelected || isCurrentToday)
                                        ? FontWeight.bold
                                        : FontWeight.normal,
                                    fontFamily: 'HindSiliguri',
                                    color: textCol,
                                  ),
                                ),
                                if (isCurrentToday && !isSelected)
                                  Container(
                                    width: 4,
                                    height: 4,
                                    margin: const EdgeInsets.only(top: 2),
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF10B981),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Bottom Actions
              Row(
                children: [
                  Expanded(
                    flex: 4,
                    child: OutlinedButton(
                      onPressed: () {
                        widget.onDateSelected(null);
                        Navigator.pop(context);
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        side: BorderSide(
                          color: isDark
                              ? const Color(0xFF3F3F46)
                              : const Color(0xFFD1D5DB),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'মুছুন',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                          color: isDark
                              ? const Color(0xFFA1A1AA)
                              : const Color(0xFF6B7280),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 6,
                    child: ElevatedButton(
                      onPressed: () {
                        widget.onDateSelected(_tempSelected);
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF004633),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        shadowColor: const Color(
                          0xFF10B981,
                        ).withValues(alpha: 0.3),
                      ),
                      child: const Text(
                        'ফিল্টার প্রয়োগ করুন',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPresetChip({
    required String label,
    required bool isSelected,
    required bool isDark,
    required VoidCallback onTap,
    bool isClear = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? (isClear
                    ? (isDark
                          ? const Color(0xFF27272A)
                          : const Color(0xFFF3F4F6))
                    : const Color(0xFF004633))
              : (isDark
                    ? const Color(0xFF1E1E1E)
                    : const Color(0xFFF9FAFB)),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? (isClear
                      ? (isDark
                            ? const Color(0xFF3F3F46)
                            : const Color(0xFFD1D5DB))
                      : const Color(0xFF10B981))
                : (isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFE5E7EB)),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            fontFamily: 'HindSiliguri',
            color: isSelected
                ? (isClear
                      ? (isDark ? Colors.white : Colors.black87)
                      : Colors.white)
                : (isDark
                      ? const Color(0xFFA1A1AA)
                      : const Color(0xFF6B7280)),
          ),
        ),
      ),
    );
  }
}
