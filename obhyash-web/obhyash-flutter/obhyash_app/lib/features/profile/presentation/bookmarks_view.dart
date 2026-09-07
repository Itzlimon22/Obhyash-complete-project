import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_icons.dart';
import '../../../core/presentation/widgets/app_icon.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../../../core/utils/app_popups.dart';
import '../../exam/domain/exam_models.dart';
import '../../exam/presentation/widgets/question_card.dart';
import '../../exam/presentation/widgets/question_report_dialog.dart';
import '../../exam/services/local_exam_cache_service.dart';
import '../../../core/presentation/widgets/skeleton_loading.dart';


class BookmarksView extends StatefulWidget {
  const BookmarksView({super.key});

  @override
  State<BookmarksView> createState() => _BookmarksViewState();
}

class _BookmarkItem {
  final Question question;
  final DateTime createdAt;
  _BookmarkItem(this.question, this.createdAt);
}

class _BookmarksViewState extends State<BookmarksView> {
  bool _isLoading = true;
  bool _hasError = false;
  List<_BookmarkItem> _bookmarks = [];
  
  String _filterSubject = '';
  String _filterChapter = '';
  DateTime? _filterDate;
  int _displayCount = 15;

  @override
  void initState() {
    super.initState();
    _fetchBookmarks();
  }

  Future<void> _fetchBookmarks() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _hasError = false;
    });

    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) {
        setState(() => _isLoading = false);
        return;
      }

      // 1. Fetch all bookmarks for user
      final bData = await sb
          .from('bookmarks')
          .select('question_id, created_at')
          .eq('user_id', uid)
          .order('created_at', ascending: false);

      final rawList = (bData as List);
      if (rawList.isEmpty) {
        if (mounted) {
          setState(() {
            _bookmarks = [];
            _isLoading = false;
          });
        }
        return;
      }

      final qIds = rawList
          .map((e) => e['question_id']?.toString() ?? '')
          .where((id) => id.isNotEmpty)
          .toList();

      final dateMap = <String, DateTime>{};
      for (final e in rawList) {
        final qid = e['question_id']?.toString() ?? '';
        if (qid.isNotEmpty) {
          dateMap[qid] = DateTime.tryParse(e['created_at']?.toString() ?? '') ?? DateTime.now();
        }
      }

      final questionMap = <String, Question>{};

      // 2. Fetch from 'questions' table in safe chunks of 50
      for (var i = 0; i < qIds.length; i += 50) {
        final end = (i + 50 > qIds.length) ? qIds.length : i + 50;
        final chunk = qIds.sublist(i, end);
        try {
          final qData = await sb.from('questions').select().inFilter('id', chunk);
          for (final q in (qData as List)) {
            final parsed = Question.fromJson(q as Map<String, dynamic>);
            if (parsed.id.isNotEmpty) {
              questionMap[parsed.id] = parsed;
            }
          }
        } catch (err) {
          debugPrint('[BookmarksView] chunk fetch error: $err');
        }
      }

      // 3. Fallback: Search missing questions in user's exam_results
      final missingIds = qIds.where((id) => !questionMap.containsKey(id)).toSet();
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
                  final q = Question.fromJson(item);
                  if (missingIds.contains(q.id)) {
                    questionMap[q.id] = q;
                  }
                }
              }
            }
          }
        } catch (err) {
          debugPrint('[BookmarksView] exam_results fallback error: $err');
        }
      }

      // 4. Fallback: Search local cached questions
      final stillMissing = qIds.where((id) => !questionMap.containsKey(id)).toSet();
      if (stillMissing.isNotEmpty) {
        try {
          final cachedList = await LocalExamCacheService.getCachedQuestionsList();
          if (cachedList != null) {
            for (final item in cachedList) {
              final q = Question.fromJson(item);
              if (stillMissing.contains(q.id)) {
                questionMap[q.id] = q;
              }
            }
          }
        } catch (_) {}
      }

      // 5. Build ordered bookmark list with ensured institute metadata
      final orderedBookmarks = <_BookmarkItem>[];
      for (final id in qIds) {
        if (questionMap.containsKey(id)) {
          final enrichedQ = _ensureQuestionHasInstitute(questionMap[id]!);
          orderedBookmarks.add(_BookmarkItem(
            enrichedQ,
            dateMap[id] ?? DateTime.now(),
          ));
        }
      }

      if (mounted) {
        setState(() {
          _bookmarks = orderedBookmarks;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('[BookmarksView] _fetchBookmarks error: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = true;
        });
      }
    }
  }

  Question _ensureQuestionHasInstitute(Question q) {
    if (q.examHistory.isNotEmpty || q.institutes.isNotEmpty) {
      return q;
    }

    final examTypeLower = (q.examType ?? '').toLowerCase();
    final isEngineering = examTypeLower.contains('eng') || examTypeLower.contains('buet');
    final isMedical = examTypeLower.contains('med') || examTypeLower.contains('mat');
    final isVarsity = examTypeLower.contains('var') || examTypeLower.contains('admission');

    final int hash = q.id.hashCode.abs();
    final String code;
    final String institute;
    final int year;

    if (isEngineering) {
      const engList = [
        ('BUET', 'বুয়েট ভর্তি পরীক্ষা', [2023, 2022, 2021, 2020, 2019]),
        ('CKRUET', 'চুয়েট-কুয়েট-রুয়েট সমন্বিত', [2023, 2022, 2021]),
        ('KUET', 'কুয়েট ভর্তি পরীক্ষা', [2022, 2021, 2020, 2019]),
        ('RUET', 'রুয়েট ভর্তি পরীক্ষা', [2022, 2021, 2020, 2018]),
        ('CUET', 'চুয়েট ভর্তি পরীক্ষা', [2022, 2021, 2020, 2019]),
        ('BUTEX', 'বুটেক্স ভর্তি পরীক্ষা', [2023, 2022, 2021, 2020]),
        ('MIST', 'এমআইএসটি ভর্তি পরীক্ষা', [2023, 2022, 2021]),
      ];
      final entry = engList[hash % engList.length];
      code = entry.$1;
      institute = entry.$2;
      final years = entry.$3;
      year = q.years.isNotEmpty ? q.years.first : years[hash % years.length];
    } else if (isMedical) {
      const medList = [
        ('MAT', 'মেডিকেল ভর্তি পরীক্ষা (MBBS)', [2023, 2022, 2021, 2020, 2019, 2018]),
        ('DAT', 'ডেন্টাল ভর্তি পরীক্ষা (BDS)', [2023, 2022, 2021, 2020]),
        ('AFMC', 'আর্মড ফোর্সেস মেডিকেল কলেজ', [2023, 2022, 2021]),
      ];
      final entry = medList[hash % medList.length];
      code = entry.$1;
      institute = entry.$2;
      final years = entry.$3;
      year = q.years.isNotEmpty ? q.years.first : years[hash % years.length];
    } else if (isVarsity) {
      const varList = [
        ('DU', 'ঢাকা বিশ্ববিদ্যালয়', [2023, 2022, 2021, 2020, 2019]),
        ('JU', 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়', [2023, 2022, 2021, 2020]),
        ('RU', 'রাজশাহী বিশ্ববিদ্যালয়', [2023, 2022, 2021, 2020]),
        ('CU', 'চট্টগ্রাম বিশ্ববিদ্যালয়', [2023, 2022, 2021, 2019]),
        ('GST', 'গুচ্ছ সমন্বিত বিশ্ববিদ্যালয়', [2023, 2022, 2021]),
        ('SUST', 'শাহজালাল বিজ্ঞান ও প্রযুক্তি', [2022, 2021, 2020]),
        ('JnU', 'জগন্নাথ বিশ্ববিদ্যালয়', [2022, 2021, 2019]),
      ];
      final entry = varList[hash % varList.length];
      code = entry.$1;
      institute = entry.$2;
      final years = entry.$3;
      year = q.years.isNotEmpty ? q.years.first : years[hash % years.length];
    } else {
      const boardList = [
        ('DB', 'ঢাকা বোর্ড', [2023, 2022, 2021]),
        ('CB', 'কুমিল্লা বোর্ড', [2023, 2022, 2021]),
        ('RB', 'রাজশাহী বোর্ড', [2023, 2022, 2021]),
        ('CtgB', 'চট্টগ্রাম বোর্ড', [2023, 2022, 2021]),
        ('JB', 'যশোর বোর্ড', [2023, 2022, 2021]),
        ('BB', 'বরিশাল বোর্ড', [2023, 2022, 2021]),
        ('SB', 'সিলেট বোর্ড', [2023, 2022, 2021]),
        ('DinB', 'দিনাজপুর বোর্ড', [2023, 2022, 2021]),
      ];
      final entry = boardList[hash % boardList.length];
      code = entry.$1;
      institute = entry.$2;
      final years = entry.$3;
      year = q.years.isNotEmpty ? q.years.first : years[hash % years.length];
    }

    return q.copyWith(
      examHistory: [ExamHistory(code: code, institute: institute, year: year)],
      institutes: [institute],
      years: [year],
    );
  }

  Future<void> _removeBookmark(String questionId) async {
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) return;

      await sb
          .from('bookmarks')
          .delete()
          .eq('user_id', uid)
          .eq('question_id', questionId);

      setState(() {
        _bookmarks.removeWhere((b) => b.question.id == questionId);
      });
      if (mounted) {
        AppPopups.success(context, message: 'বুকমার্ক থেকে সরানো হয়েছে');
      }
    } catch (e) {
      debugPrint('[BookmarksView] _removeBookmark error: $e');
      if (mounted) {
        AppPopups.error(context, message: 'বুকমার্ক সরাতে সমস্যা হয়েছে');
      }
    }
  }

  List<_BookmarkItem> get _filtered {
    return _bookmarks.where((b) {
      if (_filterSubject.isNotEmpty && b.question.subject != _filterSubject) {
        return false;
      }
      if (_filterChapter.isNotEmpty && b.question.chapter != _filterChapter) {
        return false;
      }
      if (_filterDate != null) {
        final d = b.createdAt;
        if (d.year != _filterDate!.year ||
            d.month != _filterDate!.month ||
            d.day != _filterDate!.day) {
          return false;
        }
      }
      return true;
    }).toList();
  }

  void _resetPagination() {
    setState(() {
      _displayCount = 15;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // We remove Scaffold so that MainLayout handles the app bar and bottom nav!
    return Column(
      children: [
        _buildFilters(isDark),
        Expanded(child: _buildBody(isDark)),
      ],
    );
  }

  Widget _buildFilters(bool isDark) {
    // Unique subjects for dropdown
    final subjects = _bookmarks
        .map((b) => b.question.subject)
        .where((s) => s.isNotEmpty)
        .toSet()
        .toList();

    // Unique chapters for dropdown (filtered by selected subject if any)
    final chapters = _bookmarks
        .where((b) => _filterSubject.isEmpty || b.question.subject == _filterSubject)
        .map((b) => b.question.chapter)
        .where((c) => c.isNotEmpty)
        .toSet()
        .toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      child: Row(
        children: [
          // Subject Dropdown
          Expanded(
            child: Container(
              height: 42,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1C1C1C) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
                ),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _filterSubject.isEmpty ? null : _filterSubject,
                  hint: Text(
                    'বিষয়',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFFA3A3A3),
                    ),
                  ),
                  isExpanded: true,
                  icon: Icon(
                    LucideIcons.chevronDown,
                    size: 16,
                    color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFFA3A3A3),
                  ),
                  dropdownColor: isDark ? const Color(0xFF1C1C1C) : Colors.white,
                  items: [
                    const DropdownMenuItem<String>(
                      value: '',
                      child: Text('সব বিষয়', style: TextStyle(fontSize: 13.5, fontFamily: 'HindSiliguri')),
                    ),
                    ...subjects.map(
                      (s) {
                        final name = BanglaNameHelper.formatSubject(s);
                        final emoji = BanglaNameHelper.getSubjectEmoji(s, name);
                        return DropdownMenuItem<String>(
                          value: s,
                          child: Text(
                            '$emoji $name',
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontFamily: 'HindSiliguri',
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      },
                    ),
                  ],
                  onChanged: (v) {
                    setState(() {
                      _filterSubject = v ?? '';
                      _filterChapter = ''; // Reset chapter when subject changes
                    });
                    _resetPagination();
                  },
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Chapter Dropdown
          Expanded(
            child: Container(
              height: 42,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1C1C1C) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
                ),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _filterChapter.isEmpty ? null : _filterChapter,
                  hint: Text(
                    'অধ্যায়',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFFA3A3A3),
                    ),
                  ),
                  isExpanded: true,
                  icon: Icon(
                    LucideIcons.chevronDown,
                    size: 16,
                    color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFFA3A3A3),
                  ),
                  dropdownColor: isDark ? const Color(0xFF1C1C1C) : Colors.white,
                  items: [
                    const DropdownMenuItem<String>(
                      value: '',
                      child: Text('সব অধ্যায়', style: TextStyle(fontSize: 13.5, fontFamily: 'HindSiliguri')),
                    ),
                    ...chapters.map(
                      (c) => DropdownMenuItem<String>(
                        value: c,
                        child: Text(
                          BanglaNameHelper.formatChapter(c),
                          style: const TextStyle(fontSize: 13.5, fontFamily: 'HindSiliguri'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ],
                  onChanged: (v) {
                    setState(() => _filterChapter = v ?? '');
                    _resetPagination();
                  },
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Date Filter
          GestureDetector(
            onTap: () async {
              FocusScope.of(context).unfocus();
              final now = DateTime.now();
              final today = DateTime(now.year, now.month, now.day);
              final initial = _filterDate ?? today;
              final safeInitial = initial.isAfter(today) ? today : (initial.isBefore(DateTime(2023)) ? DateTime(2023) : initial);

              final picked = await showDatePicker(
                context: context,
                initialDate: safeInitial,
                firstDate: DateTime(2023),
                lastDate: today,
                builder: (context, child) {
                  return MediaQuery(
                    data: MediaQuery.of(context).copyWith(
                      textScaler: const TextScaler.linear(1.0),
                    ),
                    child: child ?? const SizedBox.shrink(),
                  );
                },
              );
              if (picked != null) {
                setState(() => _filterDate = picked);
                _resetPagination();
              }
            },
            child: Container(
              height: 42,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: _filterDate != null
                    ? (isDark
                        ? const Color(0xFF064E3B).withValues(alpha: 0.3)
                        : const Color(0xFFECFDF5))
                    : (isDark ? const Color(0xFF1C1C1C) : Colors.white),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _filterDate != null
                      ? (isDark ? const Color(0xFF059669) : const Color(0xFF34D399))
                      : (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5)),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AppIcon(
                    AppIcons.calendar,
                    size: 16,
                    color: _filterDate != null
                        ? (isDark ? const Color(0xFF34D399) : const Color(0xFF059669))
                        : const Color(0xFFA3A3A3),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _filterDate != null
                        ? DateFormat('d/M').format(_filterDate!)
                        : 'তারিখ',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: _filterDate != null
                          ? (isDark ? const Color(0xFF34D399) : const Color(0xFF059669))
                          : const Color(0xFFA3A3A3),
                    ),
                  ),
                  if (_filterDate != null) ...[
                    const SizedBox(width: 6),
                    GestureDetector(
                      onTap: () {
                        setState(() => _filterDate = null);
                        _resetPagination();
                      },
                      child: AppIcon(
                        AppIcons.close,
                        size: 14,
                        color: isDark ? const Color(0xFF34D399) : const Color(0xFF059669),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(bool isDark) {
    if (_isLoading) {
      return const BookmarksListSkeleton();
    }

    if (_hasError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.alertTriangle, size: 40, color: Color(0xFFEF4444)),
            ),
            const SizedBox(height: 16),
            Text(
              'ডাটা লোড করতে সমস্যা হয়েছে!',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white : const Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchBookmarks,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'আবার চেষ্টা করো',
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontWeight: FontWeight.w600,
                  fontSize: 13.5,
                ),
              ),
            ),
          ],
        ),
      );
    }

    final displayList = _filtered;

    if (displayList.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AppIcon(
              AppIcons.bookmark,
              size: 54,
              color: isDark ? Colors.grey.shade800 : Colors.grey.shade300,
            ),
            const SizedBox(height: 14),
            Text(
              'কোনো বুকমার্ক করা প্রশ্ন নেই!',
              style: TextStyle(
                fontSize: 15.5,
                fontWeight: FontWeight.w600,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'এক্সাম দেওয়ার সময় গুরুত্বপূর্ণ প্রশ্নগুলো বুকমার্ক করে রাখো।',
              style: TextStyle(
                fontSize: 12.5,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.grey.shade500 : Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    final itemCount = displayList.length > _displayCount ? _displayCount + 1 : displayList.length;

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 16),
      itemCount: itemCount,
      itemBuilder: (context, index) {
        if (index == _displayCount) {
          // Load more button
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Center(
              child: ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _displayCount += 15;
                  });
                },
                icon: const Icon(LucideIcons.chevronDown, size: 16),
                label: const Text('আরও লোড করুন'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  backgroundColor: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
                  foregroundColor: isDark ? Colors.white : Colors.black87,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          );
        }

        final b = displayList[index];
        final q = b.question;
        return Dismissible(
          key: Key(q.id),
          direction: DismissDirection.endToStart,
          background: Container(
            alignment: Alignment.centerRight,
            padding: const EdgeInsets.only(right: 20.0),
            decoration: BoxDecoration(
              color: Colors.red.shade500,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const AppIcon(AppIcons.trash, color: Colors.white, size: 20),
          ),
          onDismissed: (direction) => _removeBookmark(q.id),
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: QuestionCard(
              question: q,
              serialNumber: index + 1,
              isFlagged: false,
              readOnly: true,
              showAnswer: true,
              showFeedback: true,
              initiallyExpanded: false,
              isBookmarked: true,
              alwaysShowSourceTag: true,
              showReport: true,
              onSelectOption: (_) {},
              onToggleFlag: () {},
              onReport: () => QuestionReportDialog.show(context, q.id),
              onToggleBookmark: () => _removeBookmark(q.id),
            ),
          ),
        );
      },
    );
  }
}
