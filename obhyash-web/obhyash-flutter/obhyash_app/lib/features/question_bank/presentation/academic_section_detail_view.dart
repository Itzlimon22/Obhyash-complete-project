import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/constants/app_icons.dart';
import '../../../core/presentation/widgets/app_icon.dart';
import '../../../core/presentation/widgets/app_refresh_indicator.dart';
import '../../../core/presentation/widgets/latex_text.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../../exam/domain/exam_models.dart';
import '../../exam/presentation/widgets/question_card.dart';
import '../../exam/presentation/widgets/question_report_dialog.dart';

class ChapterItem {
  final String id;
  final String name;
  const ChapterItem({required this.id, required this.name});
}

class TopicItem {
  final String id;
  final String name;
  final String chapterId;
  const TopicItem({
    required this.id,
    required this.name,
    required this.chapterId,
  });
}

class AcademicSectionDetailView extends StatefulWidget {
  final Map<String, dynamic> subject;
  final Map<String, dynamic> section;

  const AcademicSectionDetailView({
    super.key,
    required this.subject,
    required this.section,
  });

  @override
  State<AcademicSectionDetailView> createState() =>
      _AcademicSectionDetailViewState();
}

class _AcademicSectionDetailViewState extends State<AcademicSectionDetailView> {
  // ── State ──
  List<ChapterItem> _chapters = [];
  List<TopicItem> _topics = [];

  ChapterItem? _selectedChapter; // null means "সকল অধ্যায়"
  TopicItem? _selectedTopic; // null means "সকল টপিক"
  String? _selectedAuthor; // null or 'all' means "সকল রাইটার"

  bool _isLoadingChapters = true;
  bool _isLoadingTopics = false;
  bool _isLoadingQuestions = true;
  bool _fetchedBySubjectName = false;

  List<Question> _questions = [];
  final Map<int, int?> _selectedOptions = {};

  // For CQ and Q&A accordions (questionId -> bool isOpen)
  final Set<String> _expandedAnswers = {};
  final Set<String> _bookmarkedQuestions = {};

  // ── Pagination State & Infinite Scroll ──
  static const int _pageSize = 20;
  int _currentOffset = 0;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  late final ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController()..addListener(_onScroll);
    _initData();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.position.pixels;
    if (currentScroll >= (maxScroll - 350) && !_isLoadingMore && _hasMore) {
      _loadMoreQuestions();
    }
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _initData() async {
    _fetchBookmarks();
    await _fetchChapters();
    await _fetchQuestions();
  }

  Future<void> _fetchBookmarks() async {
    final uid = Supabase.instance.client.auth.currentUser?.id;
    if (uid == null) return;
    try {
      final res = await Supabase.instance.client
          .from('bookmarks')
          .select('question_id')
          .eq('user_id', uid);
      if (mounted) {
        setState(() {
          _bookmarkedQuestions.addAll(
            res
                .map((e) => e['question_id']?.toString() ?? '')
                .where((id) => id.isNotEmpty),
          );
        });
      }
    } catch (_) {}
  }

  void _toggleBookmark(String qId) {
    HapticFeedback.lightImpact();
    final wasBookmarked = _bookmarkedQuestions.contains(qId);
    setState(() {
      if (wasBookmarked) {
        _bookmarkedQuestions.remove(qId);
      } else {
        _bookmarkedQuestions.add(qId);
      }
    });

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          wasBookmarked
              ? 'বুকমার্ক থেকে সরানো হয়েছে'
              : 'বুকমার্কে সংরক্ষণ করা হয়েছে 📌',
          style: const TextStyle(fontSize: 13),
        ),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      ),
    );

    final uid = Supabase.instance.client.auth.currentUser?.id;
    if (uid != null) {
      final sb = Supabase.instance.client;
      if (wasBookmarked) {
        sb.from('bookmarks').delete().eq('user_id', uid).eq('question_id', qId).then((_) {}).catchError((_) {});
      } else {
        sb.from('bookmarks').insert({'user_id': uid, 'question_id': qId}).then((_) {}).catchError((_) {});
      }
    }
  }

  String get _subjectId => (widget.subject['id'] ?? '').toString();
  String get _sectionId => (widget.section['id'] ?? '').toString();
  String get _sectionTitle => (widget.section['title'] ?? '').toString();

  String get _subjectTitle {
    final name = (widget.subject['name'] as String?) ?? 'বিষয়';
    final paper = ((widget.subject['paper'] as String?) ?? '').trim();
    return paper.isNotEmpty ? '$name $paper' : name;
  }

  // ── Chapters & Topics Fetching ──
  Future<void> _fetchChapters() async {
    setState(() => _isLoadingChapters = true);
    try {
      final supabase = Supabase.instance.client;
      final rawSubjectId = _subjectId;
      final cleanId = rawSubjectId.replaceAll('hsc_', '').replaceAll('ssc_', '');

      final subjectConditions = <String>[
        'subject_id.eq.$rawSubjectId',
        'subject_id.eq.ssc_$cleanId',
        'subject_id.eq.hsc_$cleanId',
        'subject_id.eq.$cleanId',
      ];
      if (cleanId.contains('math')) {
        final num = cleanId.contains('2') ? '2' : '1';
        subjectConditions.addAll([
          'subject_id.eq.hsc_math_$num',
          'subject_id.eq.math_$num',
          'subject_id.eq.hsc_higher_math_$num',
          'subject_id.eq.higher_math_$num',
        ]);
      } else if (cleanId.contains('ict')) {
        subjectConditions.addAll(['subject_id.eq.hsc_ict', 'subject_id.eq.ict']);
      }

      dynamic data = await supabase
          .from('chapters')
          .select('id, name')
          .or(subjectConditions.join(','))
          .limit(100);

      List<ChapterItem> list = [];
      if (data is List && data.isNotEmpty) {
        list = data
            .map((e) => ChapterItem(
                  id: e['id'].toString(),
                  name: e['name']?.toString() ?? '',
                ))
            .toList();
      }

      if (list.isEmpty) {
        list = _getFallbackChapters(rawSubjectId);
      } else {
        list.sort((a, b) {
          final idxA = BanglaNameHelper.getChapterSortIndex(a.name, a.id);
          final idxB = BanglaNameHelper.getChapterSortIndex(b.name, b.id);
          return idxA.compareTo(idxB);
        });
      }

      if (mounted) {
        setState(() {
          _chapters = list;
          _isLoadingChapters = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _chapters = _getFallbackChapters(_subjectId);
          _isLoadingChapters = false;
        });
      }
    }
  }

  Future<void> _fetchTopics(String chapterId) async {
    setState(() => _isLoadingTopics = true);
    try {
      final supabase = Supabase.instance.client;
      final data = await supabase
          .from('topics')
          .select('id, name, chapter_id')
          .eq('chapter_id', chapterId)
          .limit(100);

      List<TopicItem> list = [];
      if (data.isNotEmpty) {
        list = data
            .map((e) => TopicItem(
                  id: e['id'].toString(),
                  name: e['name']?.toString() ?? '',
                  chapterId: e['chapter_id']?.toString() ?? '',
                ))
            .toList();
      }

      if (list.isEmpty) {
        list = _getFallbackTopics(chapterId);
      }

      if (mounted) {
        setState(() {
          _topics = list;
          _isLoadingTopics = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _topics = _getFallbackTopics(chapterId);
          _isLoadingTopics = false;
        });
      }
    }
  }

  // ── Question Processing Helpers ──
  Question _processQuestionRow(Map<String, dynamic> row) {
    final q = Question.fromJson(row);
    final examTypeLower = (q.examType ?? '').toLowerCase();
    final secLower = _sectionId.toLowerCase();

    final isEngineering = secLower == 'engineering' || examTypeLower.contains('eng');
    final isMedical = secLower == 'medical' || examTypeLower.contains('med');
    final isVarsity = secLower.contains('varsity') ||
        secLower == 'gst' ||
        secLower == 'iba_bup' ||
        examTypeLower.contains('var') ||
        examTypeLower.contains('admission');
    final isTextbook = secLower == 'textbook' || examTypeLower.contains('book');

    final bool needsTag = q.examHistory.isEmpty && q.institutes.isEmpty;

    if (needsTag) {
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
      } else if (isTextbook) {
        final cleanSubj = _subjectId.replaceAll('hsc_', '').replaceAll('ssc_', '').toLowerCase();
        final List<(String, String)> textbookAuthors;
        if (cleanSubj.contains('math')) {
          textbookAuthors = const [
            ('কেতাব স্যার', 'মো. কেতাব উদ্দিন'),
            ('আহাম্মদ স্যার', 'এস. ইউ. আহাম্মদ'),
            ('অসীম সাহা', 'অসীম কুমার সাহা'),
            ('রফিকুল স্যার', 'মো. রফিকুল ইসলাম'),
          ];
        } else if (cleanSubj.contains('bio')) {
          textbookAuthors = cleanSubj.contains('1')
              ? const [
                  ('হাসান স্যার', 'ড. মোহাম্মদ আবুল হাসান'),
                  ('মাজেদা ম্যাম', 'মাজেদা বেগম'),
                  ('আলিম স্যার', 'মো. আবদুল আলিম'),
                ]
              : const [
                  ('গাজী আজমল', 'প্রফেসর গাজী আজমল'),
                  ('হাসান স্যার', 'ড. মোহাম্মদ আবুল হাসান'),
                  ('মাজেদা ম্যাম', 'মাজেদা বেগম'),
                ];
        } else if (cleanSubj.contains('chem')) {
          textbookAuthors = const [
            ('হাজারী ও নাগ', 'ড. সরোজ কান্তি সিংহ হাজারী ও হারাধন নাগ'),
            ('কবীর স্যার', 'ড. মো. মহসিন কবির'),
            ('গুহ স্যার', 'সঞ্জিত কুমার গুহ'),
            ('লিংকন স্যার', 'আহসান হাবীব ও লিংকন'),
          ];
        } else if (cleanSubj.contains('ict')) {
          textbookAuthors = const [
            ('মুজিবুর রহমান', 'প্রকৌশলী মো. মুজিবুর রহমান'),
            ('মাহবুবুর রহমান', 'মো. মাহবুবুর রহমান'),
          ];
        } else {
          // Physics and others
          textbookAuthors = const [
            ('ইসহাক স্যার', 'ড. আমির হোসেন খান ও প্রফেসর মোহাম্মদ ইসহাক'),
            ('তপন স্যার', 'ড. শাহজাহান তপন'),
            ('প্রামাণিক স্যার', 'ড. গোলাম হোসেন প্রামাণিক'),
          ];
        }
        final entry = textbookAuthors[hash % textbookAuthors.length];
        code = entry.$1;
        institute = entry.$2;
        year = 0;
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
        institutes: [code],
        years: [year],
        examType: q.examType ?? _sectionTitle,
      );
    }

    return q;
  }

  bool _filterQuestion(Question q) {
    final type = (q.type ?? '').toLowerCase();
    final sec = (q.section ?? '').toLowerCase();
    final examType = (q.examType ?? '').toLowerCase();
    final tagsStr = q.tags.join(' ').toLowerCase();
    final combined = '$type $sec $examType $tagsStr';

    if (_sectionId == 'cq') {
      // 1. MUST NOT BE AN MCQ!
      if (q.options.where((opt) => opt.trim().isNotEmpty).length >= 2 ||
          q.isStrictMcq ||
          q.isAdmissionStandardMcq ||
          type == 'mcq') {
        return false;
      }

      // 2. Check for explicit CQ / creative / written types (NEVER do substring check on 'cq' as 'mcq' contains 'cq')
      final isExplicitCq = (type == 'cq' ||
          sec == 'cq' ||
          examType == 'cq' ||
          type == 'creative' ||
          sec == 'creative' ||
          type == 'written' ||
          type == 'সৃজনশীল' ||
          sec == 'সৃজনশীল' ||
          type == 'রচনামূলক' ||
          combined.contains('creative') ||
          combined.contains('সৃজনশীল') ||
          combined.contains('রচনামূলক') ||
          RegExp(r'\bcq\b').hasMatch(type) ||
          RegExp(r'\bcq\b').hasMatch(sec) ||
          RegExp(r'\bcq\b').hasMatch(examType));

      if (isExplicitCq) {
        return true;
      }
      if (q.passage != null && q.passage!.trim().isNotEmpty && q.options.isEmpty) return true;
      final text = q.question.toLowerCase();
      if ((text.contains('(ক)') || text.contains('ক.') || text.contains('ক)')) &&
          (text.contains('(খ)') || text.contains('খ.') || text.contains('খ)')) &&
          q.options.isEmpty) {
        return true;
      }
      return false;
    }

    if (_sectionId == 'ka_bhandar') {
      if (q.options.where((opt) => opt.trim().isNotEmpty).length >= 2 ||
          q.isStrictMcq ||
          q.isAdmissionStandardMcq ||
          type == 'mcq') {
        return false;
      }

      if (type == 'ka' ||
          sec == 'ka' ||
          type == 'knowledge' ||
          combined.contains('knowledge') ||
          combined.contains('জ্ঞান')) {
        return true;
      }
      final text = q.question.toLowerCase();
      return (text.contains('(ক)') || text.startsWith('ক.') || text.startsWith('ক)')) && q.options.isEmpty;
    }

    if (_sectionId == 'kha_bhandar') {
      if (q.options.where((opt) => opt.trim().isNotEmpty).length >= 2 ||
          q.isStrictMcq ||
          q.isAdmissionStandardMcq ||
          type == 'mcq') {
        return false;
      }

      if (type == 'kha' ||
          sec == 'kha' ||
          type == 'comprehension' ||
          combined.contains('comprehension') ||
          combined.contains('অনুধাবন')) {
        return true;
      }
      final text = q.question.toLowerCase();
      return (text.contains('(খ)') || text.startsWith('খ.') || text.startsWith('খ)')) && q.options.isEmpty;
    }

    // MCQ sections must have options and must not be written/CQ/Ka/Kha
    if (q.options.isEmpty) return false;
    if (!q.isStrictMcq && (_sectionId == 'mcq' || _sectionId == 'academic')) {
      return false;
    }

    final qExamType = examType.isNotEmpty ? examType : type;
    final institutes = q.institutes.map((e) => e.toString().toLowerCase()).join(' ');

    if (_sectionId == 'engineering') {
      // Must be Engineering, reject any pure Medical or Academic-only questions
      if (qExamType.contains('medical') || qExamType.contains('mat') || qExamType.contains('mbbs') || qExamType.contains('bds')) {
        return false;
      }
      return qExamType.contains('eng') ||
          qExamType.contains('buet') ||
          qExamType.contains('ckruet') ||
          qExamType.contains('ruet') ||
          qExamType.contains('kuet') ||
          qExamType.contains('cuet') ||
          institutes.contains('buet') ||
          institutes.contains('ckruet');
    }

    if (_sectionId == 'medical') {
      // Must be Medical, reject any pure Engineering questions
      if (qExamType.contains('engineering') || qExamType.contains('buet') || qExamType.contains('ckruet') || qExamType.contains('kuet') || qExamType.contains('ruet')) {
        return false;
      }
      return qExamType.contains('med') ||
          qExamType.contains('mat') ||
          qExamType.contains('dmat') ||
          qExamType.contains('mbbs') ||
          qExamType.contains('bds') ||
          institutes.contains('mat') ||
          institutes.contains('dmc');
    }

    if (_sectionId == 'varsity_ka' || _sectionId == 'varsity_kha' || _sectionId == 'varsity') {
      // Reject pure Engineering or pure Medical
      if (qExamType == 'engineering' || qExamType == 'medical' || qExamType.contains('buet')) {
        return false;
      }
      return qExamType.contains('varsity') || qExamType.contains('admission') || institutes.contains('du') || institutes.contains('ju') || institutes.contains('ru');
    }

    if (_sectionId == 'textbook') {
      if (qExamType == 'engineering' ||
          qExamType == 'medical' ||
          qExamType.contains('buet') ||
          qExamType.contains('mat') ||
          qExamType.contains('ckruet')) {
        return false;
      }

      final bool isBookType = qExamType.contains('book') || qExamType.contains('textbook');
      final bool hasAuthor = BanglaNameHelper.hasTextbookAuthor(
        institutes: q.institutes,
        examHistory: q.examHistory,
      );

      // Must be either marked as book or have author in institutes/exam_history
      if (!isBookType && !hasAuthor) {
        return false;
      }

      // If user selected a specific author filter
      if (_selectedAuthor != null &&
          _selectedAuthor != 'all' &&
          _selectedAuthor!.isNotEmpty) {
        return BanglaNameHelper.matchesAuthor(
          institutes: q.institutes,
          examHistory: q.examHistory,
          targetAuthor: _selectedAuthor!,
        );
      }

      return true;
    }

    if (_sectionId == 'mcq' || _sectionId == 'academic') {
      // Academic must never show pure admission questions
      if (qExamType == 'engineering' || qExamType == 'medical' || qExamType.contains('buet') || qExamType.contains('mat')) {
        return false;
      }
      return qExamType.contains('academic') || qExamType.contains('board') || qExamType.isEmpty;
    }

    return true;
  }

  // ── Questions Query Builder ──
  dynamic _buildQuestionsQuery({
    bool ignoreChapter = false,
    bool ignoreTopic = false,
    bool bySubjectName = false,
  }) {
    final supabase = Supabase.instance.client;
    final rawSubjectId = _subjectId;
    final cleanId = rawSubjectId.replaceAll('hsc_', '').replaceAll('ssc_', '');
    final fullHscId = rawSubjectId.startsWith('hsc_') ? rawSubjectId : 'hsc_$rawSubjectId';
    final fullSscId = rawSubjectId.startsWith('ssc_') ? rawSubjectId : 'ssc_$rawSubjectId';

    // Collect all valid subject_ids for this subject
    final subjectIds = <String>{fullHscId, fullSscId, cleanId, rawSubjectId};
    if (cleanId.contains('math')) {
      final num = cleanId.contains('2') ? '2' : '1';
      subjectIds.addAll(['hsc_higher_math_$num', 'higher_math_$num', 'math_$num', 'hsc_math_$num', 'ssc_math', 'ssc_higher_math', 'general_math']);
    } else if (cleanId.contains('physics')) {
      final num = cleanId.contains('2') ? '2' : '1';
      subjectIds.addAll(['hsc_physics_$num', 'physics_$num', 'ssc_physics']);
    } else if (cleanId.contains('chemistry')) {
      final num = cleanId.contains('2') ? '2' : '1';
      subjectIds.addAll(['hsc_chemistry_$num', 'chemistry_$num', 'ssc_chemistry']);
    } else if (cleanId.contains('biology')) {
      final num = cleanId.contains('2') ? '2' : '1';
      subjectIds.addAll(['hsc_biology_$num', 'biology_$num', 'ssc_biology']);
    } else if (cleanId.contains('ict')) {
      subjectIds.addAll(['hsc_ict', 'ict', 'ssc_ict']);
    } else if (cleanId.contains('bangla')) {
      final num = cleanId.contains('2') ? '2' : '1';
      subjectIds.addAll(['hsc_bangla_$num', 'bangla_$num', 'ssc_bangla_$num', 'ssc_bangla']);
    } else if (cleanId.contains('english')) {
      final num = cleanId.contains('2') ? '2' : '1';
      subjectIds.addAll(['hsc_english_$num', 'english_$num', 'ssc_english_$num', 'ssc_english']);
    } else if (cleanId.contains('accounting') || cleanId.contains('হিসাব')) {
      subjectIds.addAll(['ssc_accounting', 'accounting']);
    } else if (cleanId.contains('business') || cleanId.contains('উদ্যোগ')) {
      subjectIds.addAll(['ssc_business_ent', 'business_ent', 'business']);
    } else if (cleanId.contains('finance') || cleanId.contains('ফিন্যান্স')) {
      subjectIds.addAll(['ssc_finance_banking', 'finance_banking', 'finance']);
    } else if (cleanId.contains('general_science') || cleanId.contains('বিজ্ঞান')) {
      subjectIds.addAll(['ssc_general_science', 'general_science', 'science']);
    } else if (cleanId.contains('history') || cleanId.contains('ইতিহাস')) {
      subjectIds.addAll(['ssc_history_bd', 'history_bd', 'history']);
    } else if (cleanId.contains('geography') || cleanId.contains('ভূগোল')) {
      subjectIds.addAll(['ssc_geography', 'geography']);
    } else if (cleanId.contains('civics') || cleanId.contains('পৌরনীতি')) {
      subjectIds.addAll(['ssc_civics', 'civics']);
    } else if (cleanId.contains('economics') || cleanId.contains('অর্থনীতি')) {
      subjectIds.addAll(['ssc_economics', 'economics']);
    } else if (cleanId.contains('bgs') || cleanId.contains('বাংলাদেশ ও বিশ্ব')) {
      subjectIds.addAll(['ssc_bgs', 'bgs']);
    } else if (cleanId.contains('religion') || cleanId.contains('ধর্ম')) {
      subjectIds.addAll(['ssc_religion', 'religion']);
    } else if (cleanId.contains('statistics') || cleanId.contains('পরিসংখ্যান')) {
      final num = cleanId.contains('2') ? '2' : '1';
      subjectIds.addAll(['hsc_statistics_$num', 'statistics_$num']);
    }

    var query = supabase.from('questions').select('*');

    // 1. Filter by subject_id or subject name
    if (bySubjectName) {
      final nameVariants = BanglaNameHelper.getSubjectSearchVariants(rawSubjectId, _subjectTitle);
      query = query.inFilter('subject', nameVariants);
    } else {
      query = query.inFilter('subject_id', subjectIds.toList());
    }

    // 2. Filter by chapter if chosen and not ignored
    if (!ignoreChapter && _selectedChapter != null && _selectedChapter!.name.isNotEmpty) {
      final chId = _selectedChapter!.id;
      final chVars = BanglaNameHelper.getChapterSearchVariants(_selectedChapter!.name);
      final chConds = <String>[];
      if (chId.isNotEmpty && chId != 'all') {
        chConds.add('chapter_id.eq.$chId');
      }
      for (final v in chVars) {
        final sanitizedV = v.replaceAll(',', '*').replaceAll('،', '*').replaceAll('**', '*').trim();
        if (sanitizedV.length >= 2) {
          chConds.add('chapter.ilike.*$sanitizedV*');
        }
      }
      if (chConds.isNotEmpty) {
        query = query.or(chConds.join(','));
      }
    }

    // 2b. Filter by topic if chosen and not ignored
    if (!ignoreTopic && _selectedTopic != null && _selectedTopic!.name.isNotEmpty) {
      final tId = _selectedTopic!.id;
      final tVars = BanglaNameHelper.getSearchVariations(_selectedTopic!.name);

      final conds = <String>[];
      if (tId.isNotEmpty && tId != 'all') {
        conds.add('topic_id.eq.$tId');
        if (tId.contains(RegExp(r'_t\d$'))) {
          conds.add('topic_id.eq.${tId.replaceFirstMapped(RegExp(r'_t(\d)$'), (m) => '_t0${m.group(1)}') }');
        } else if (tId.contains(RegExp(r'_t0\d$'))) {
          conds.add('topic_id.eq.${tId.replaceFirstMapped(RegExp(r'_t0(\d)$'), (m) => '_t${m.group(1)}') }');
        }
      }

      for (final v in tVars) {
        conds.add('topic.ilike.*$v*');
      }

      if (conds.isNotEmpty) {
        query = query.or(conds.join(','));
      }
    }

    // 3. Strict Exam Type Isolation - NEVER ALLOW CROSS-CATEGORY LEAKS
    if (_sectionId == 'cq') {
      query = query
          .neq('type', 'MCQ')
          .not('type', 'ilike', '%mcq%')
          .or('type.eq.CQ,type.eq.cq,type.ilike.*creative*,type.ilike.*সৃজনশীল*,type.eq.Written,type.eq.written,section.eq.cq,section.eq.CQ,section.ilike.*creative*,section.ilike.*সৃজনশীল*,exam_type.eq.cq,exam_type.ilike.*creative*,exam_type.ilike.*সৃজনশীল*');
    } else if (_sectionId == 'ka_bhandar') {
      query = query
          .neq('type', 'MCQ')
          .not('type', 'ilike', '%mcq%')
          .or('type.eq.ka,type.eq.Ka,type.ilike.*knowledge*,type.ilike.*জ্ঞান*,section.eq.ka,section.eq.Ka,section.ilike.*knowledge*,section.ilike.*জ্ঞান*');
    } else if (_sectionId == 'kha_bhandar') {
      query = query
          .neq('type', 'MCQ')
          .not('type', 'ilike', '%mcq%')
          .or('type.eq.kha,type.eq.Kha,type.ilike.*comprehension*,type.ilike.*অনুধাবন*,section.eq.kha,section.eq.Kha,section.ilike.*comprehension*,section.ilike.*অনুধাবন*');
    } else if (_sectionId == 'engineering') {
      query = query.or('exam_type.ilike.*engineering*,exam_type.ilike.*buet*,exam_type.ilike.*ckruet*,exam_type.ilike.*ruet*,exam_type.ilike.*kuet*,exam_type.ilike.*cuet*,institutes.cs.{BUET},institutes.cs.{CKRUET},institutes.cs.{RUET},institutes.cs.{KUET},institutes.cs.{CUET},institutes.cs.{বুটেক্স},institutes.cs.{আইইউটি},institutes.cs.{SUST}');
    } else if (_sectionId == 'medical') {
      query = query.or('exam_type.ilike.*medical*,exam_type.ilike.*mat*,exam_type.ilike.*dmat*,exam_type.ilike.*mbbs*,exam_type.ilike.*bds*,institutes.cs.{মেডিকেল ভর্তি পরীক্ষা},institutes.cs.{ডেন্টাল ভর্তি পরীক্ষা},institutes.cs.{MAT},institutes.cs.{DAT},institutes.cs.{Medical},institutes.cs.{মেডিকেল}');
    } else if (_sectionId == 'varsity_ka' || _sectionId == 'varsity_kha' || _sectionId == 'varsity') {
      query = query.or('exam_type.ilike.*varsity*,exam_type.ilike.*admission*,institutes.cs.{DU},institutes.cs.{JU},institutes.cs.{RU},institutes.cs.{CU},institutes.cs.{GST},institutes.cs.{KU},institutes.cs.{JnU},institutes.cs.{HSTU},institutes.cs.{BUP}');
    } else if (_sectionId == 'iba_bup') {
      query = query.or('exam_type.ilike.*iba*,exam_type.ilike.*bup*,exam_type.ilike.*admission*,institutes.cs.{IBA},institutes.cs.{BUP}');
    } else if (_sectionId == 'textbook') {
      query = query.or('exam_type.ilike.*book*,exam_type.ilike.*textbook*,exam_type.ilike.*academic*,exam_type.ilike.*practice*');
    } else if (_sectionId == 'mcq' || _sectionId == 'academic') {
      query = query.or('exam_type.ilike.*academic*,exam_type.ilike.*board*,exam_type.is.null');
    }

    return query;
  }

  // ── Questions Fetching (Initial Page) ──
  Future<void> _fetchQuestions() async {
    setState(() {
      _isLoadingQuestions = true;
      _currentOffset = 0;
      _hasMore = true;
      _selectedOptions.clear();
      _expandedAnswers.clear();
    });

    try {
      final query = _buildQuestionsQuery();
      var data = await query.range(0, _pageSize - 1);
      List<Question> questions = [];
      if (data.isNotEmpty) {
        questions = (data as List)
            .map((row) => _processQuestionRow(row as Map<String, dynamic>))
            .where((q) => _filterQuestion(q))
            .toList();
      }

      // If DB has 0 questions by subject_id, try fetching by subject name column
      if (questions.isEmpty) {
        try {
          final altQuery = _buildQuestionsQuery(bySubjectName: true);
          final altData = await altQuery.range(0, _pageSize - 1);
          if (altData.isNotEmpty) {
            final altQuestions = (altData as List)
                .map((row) => _processQuestionRow(row as Map<String, dynamic>))
                .where((q) => _filterQuestion(q))
                .toList();
            if (altQuestions.isNotEmpty) {
              data = altData;
              questions = altQuestions;
              _fetchedBySubjectName = true;
            }
          }
        } catch (_) {}
      }

      if (mounted) {
        setState(() {
          _questions = questions;
          _currentOffset = questions.length;
          _hasMore = questions.length >= _pageSize;
          _isLoadingQuestions = false;
        });
      }
    } catch (e, st) {
      debugPrint('Error fetching questions: $e\n$st');
      if (mounted) {
        setState(() {
          _questions = [];
          _currentOffset = 0;
          _hasMore = false;
          _isLoadingQuestions = false;
        });
      }
    }
  }

  // ── Load More Questions (Next 20 Items) ──
  Future<void> _loadMoreQuestions() async {
    if (_isLoadingMore || !_hasMore) return;

    setState(() {
      _isLoadingMore = true;
    });

    try {
      final query = _buildQuestionsQuery(bySubjectName: _fetchedBySubjectName);
      final from = _currentOffset;
      final to = _currentOffset + _pageSize - 1;
      var data = await query.range(from, to);

      List<Question> newQuestions = [];
      if (data.isNotEmpty) {
        newQuestions = (data as List)
            .map((row) => _processQuestionRow(row as Map<String, dynamic>))
            .where((q) => _filterQuestion(q))
            .toList();
      }

      if (newQuestions.isEmpty && !_fetchedBySubjectName) {
        try {
          final altQuery = _buildQuestionsQuery(bySubjectName: true);
          final altData = await altQuery.range(from, to);
          if (altData.isNotEmpty) {
            final altList = (altData as List)
                .map((row) => _processQuestionRow(row as Map<String, dynamic>))
                .where((q) => _filterQuestion(q))
                .toList();
            if (altList.isNotEmpty) {
              data = altData;
              newQuestions = altList;
              _fetchedBySubjectName = true;
            }
          }
        } catch (_) {}
      }

      if (mounted) {
        setState(() {
          final existingIds = _questions.map((q) => q.id).toSet();
          final uniqueNew = newQuestions.where((q) => !existingIds.contains(q.id)).toList();

          _questions.addAll(uniqueNew);
          final int rawCount = data.isNotEmpty ? (data as List).length : 0;
          _currentOffset += rawCount > 0 ? rawCount : _pageSize;
          _isLoadingMore = false;
          if (rawCount < _pageSize) {
            _hasMore = false;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingMore = false;
          _hasMore = false;
        });
      }
    }
  }

  // ── Dropdown Picker Modals ──
  void _openChapterPicker(bool isDark) {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _FilterSelectionSheet(
        title: 'অধ্যায় নির্বাচন করো',
        isDark: isDark,
        items: [
          const _FilterOption(id: 'all', title: 'সকল অধ্যায়', subtitle: 'সব অধ্যায় থেকে প্রশ্ন'),
          ..._chapters.map((c) => _FilterOption(id: c.id, title: c.name)),
        ],
        selectedId: _selectedChapter?.id ?? 'all',
        onSelect: (opt) {
          Navigator.of(ctx).pop();
          setState(() {
            if (opt.id == 'all') {
              _selectedChapter = null;
              _selectedTopic = null;
              _topics = [];
            } else {
              _selectedChapter = _chapters.firstWhere((c) => c.id == opt.id);
              _selectedTopic = null;
              _fetchTopics(opt.id);
            }
          });
          _fetchQuestions();
        },
      ),
    );
  }

  void _openTopicPicker(bool isDark) {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _FilterSelectionSheet(
        title: 'টপিক নির্বাচন করো',
        isDark: isDark,
        items: [
          const _FilterOption(id: 'all', title: 'সকল টপিক', subtitle: 'নির্বাচিত অধ্যায়ের সব টপিক'),
          ..._topics.map((t) => _FilterOption(id: t.id, title: t.name)),
        ],
        selectedId: _selectedTopic?.id ?? 'all',
        onSelect: (opt) {
          Navigator.of(ctx).pop();
          setState(() {
            if (opt.id == 'all') {
              _selectedTopic = null;
            } else {
              _selectedTopic = _topics.firstWhere((t) => t.id == opt.id);
            }
          });
          _fetchQuestions();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF000000) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        shadowColor: Colors.black.withValues(alpha: 0.1),
        centerTitle: true,
        leading: IconButton(
          icon: AppIcon(
            AppIcons.arrowLeft,
            color: isDark ? Colors.white : const Color(0xFF1F2937),
            size: 22,
          ),
          onPressed: () {
            HapticFeedback.lightImpact();
            Navigator.of(context).pop();
          },
        ),
        title: Text(
          '$_subjectTitle - $_sectionTitle',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 16.5,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
      ),
      body: Column(
        children: [
          // ── Sticky Filter Dropdowns Bar ──
          _buildFilterBar(isDark),

          // ── Questions Content List ──
          Expanded(
            child: AppRefreshIndicator(
              onRefresh: _fetchQuestions,
              child: _buildQuestionsContent(isDark),
            ),
          ),
        ],
      ),
    );
  }

  // ── Authors list for textbook filtering ──
  List<String> get _subjectAuthors {
    final clean = _subjectId.replaceAll('hsc_', '').replaceAll('ssc_', '').toLowerCase();
    if (clean.contains('physic')) {
      return const ['all', 'ইসহাক স্যার', 'তপন স্যার', 'প্রামাণিক স্যার', 'তফাজ্জল স্যার'];
    } else if (clean.contains('chem')) {
      return const ['all', 'হাজারী ও নাগ', 'কবীর স্যার', 'গুহ স্যার', 'লিংকন স্যার'];
    } else if (clean.contains('math')) {
      return const ['all', 'কেতাব স্যার', 'আহাম্মদ স্যার', 'অসীম সাহা', 'রফিকুল স্যার'];
    } else if (clean.contains('bio')) {
      return clean.contains('1')
          ? const ['all', 'হাসান স্যার', 'মাজেদা ম্যাম', 'আলিম স্যার']
          : const ['all', 'গাজী আজমল', 'হাসান স্যার', 'মাজেদা ম্যাম'];
    } else if (clean.contains('ict')) {
      return const ['all', 'মুজিবুর রহমান', 'মাহবুবুর রহমান'];
    }
    return const ['all'];
  }

  // ── Author Filter Chips for Textbook Section ──
  Widget _buildAuthorFilterChips(bool isDark) {
    final authors = _subjectAuthors;
    if (authors.length <= 1) return const SizedBox.shrink();

    final activeAuthor = _selectedAuthor ?? 'all';

    return SizedBox(
      height: 34,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: authors.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final author = authors[index];
          final isSelected = activeAuthor == author;
          final label = author == 'all' ? 'সকল রাইটার' : author;

          return Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: () {
                if (activeAuthor == author) return;
                HapticFeedback.lightImpact();
                setState(() {
                  _selectedAuthor = author == 'all' ? null : author;
                });
                _fetchQuestions();
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFF10B981) // Textbook green
                      : isDark
                          ? const Color(0xFF18181B)
                          : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: isSelected
                        ? const Color(0xFF10B981)
                        : isDark
                            ? const Color(0xFF27272A)
                            : const Color(0xFFE2E8F0),
                    width: 1,
                  ),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: const Color(0xFF10B981).withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      author == 'all' ? LucideIcons.bookMarked : LucideIcons.userCheck,
                      size: 12,
                      color: isSelected
                          ? Colors.white
                          : isDark
                              ? const Color(0xFFA1A1AA)
                              : const Color(0xFF64748B),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight:
                            isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected
                            ? Colors.white
                            : isDark
                                ? const Color(0xFFE4E4E7)
                                : const Color(0xFF334155),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // ── Filter Bar with Chapter and Topic Dropdowns ──
  Widget _buildFilterBar(bool isDark) {
    final rawChapter = _selectedChapter?.name;
    final chapterLabel = rawChapter != null
        ? rawChapter
            .replaceAll(RegExp(r'^[০-৯0-9]+[ম্থয়\.]*\s*অধ্যায়[:\s\-]*'), '')
            .replaceAll(RegExp(r'^অধ্যায়\s*[০-৯0-9]+[:\s\-]*'), '')
            .replaceAll(RegExp(r'^[০-৯0-9]+[\.\:\s\-]+'), '')
            .trim()
        : 'সকল অধ্যায়';
    final topicLabel = _selectedTopic != null ? _selectedTopic!.name : 'সকল টপিক';
    final isTopicDisabled = _selectedChapter == null || _topics.isEmpty;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
            width: 1,
          ),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // 1. Chapter Dropdown
              Expanded(
                child: _DropdownPillButton(
                  icon: LucideIcons.bookOpen,
                  titlePrefix: 'অধ্যায়',
                  value: chapterLabel,
                  isDark: isDark,
                  isSelected: _selectedChapter != null,
                  isLoading: _isLoadingChapters,
                  onTap: () => _openChapterPicker(isDark),
                ),
              ),
              const SizedBox(width: 10),

              // 2. Topic Dropdown
              Expanded(
                child: _DropdownPillButton(
                  icon: LucideIcons.listFilter,
                  titlePrefix: 'টপিক',
                  value: isTopicDisabled && _selectedChapter == null
                      ? 'সকল টপিক'
                      : topicLabel,
                  isDark: isDark,
                  isSelected: _selectedTopic != null,
                  disabled: isTopicDisabled,
                  isLoading: _isLoadingTopics,
                  onTap: isTopicDisabled ? null : () => _openTopicPicker(isDark),
                ),
              ),
            ],
          ),
          if (_sectionId == 'textbook') ...[
            const SizedBox(height: 10),
            _buildAuthorFilterChips(isDark),
          ],
        ],
      ),
    );
  }

  // ── Content Area ──
  Widget _buildQuestionsContent(bool isDark) {
    if (_isLoadingQuestions) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(
              strokeWidth: 2.5,
              color: Color(0xFF047857),
            ),
            const SizedBox(height: 16),
            Text(
              'প্রশ্ন লোড হচ্ছে...',
              style: TextStyle(
                fontSize: 14,
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      );
    }

    if (_questions.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark ? const Color(0xFF1F1F23) : const Color(0xFFF1F5F9),
                ),
                child: Icon(
                  LucideIcons.inbox,
                  size: 32,
                  color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'কোনো প্রশ্ন পাওয়া যায়নি',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : const Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'নির্বাচিত ফিল্টারে এই মুহূর্তে কোনো প্রশ্ন অন্তর্ভুক্ত নেই। অনুগ্রহ করে অন্য অধ্যায় বা টপিক নির্বাচন করুন।',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13.5,
                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  setState(() {
                    _selectedChapter = null;
                    _selectedTopic = null;
                  });
                  _fetchQuestions();
                },
                icon: const Icon(LucideIcons.rotateCcw, size: 15),
                label: const Text(
                  'সকল প্রশ্ন দেখুন',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF047857),
                  side: const BorderSide(color: Color(0xFF047857)),
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 30),
      itemCount: _questions.length + 1,
      itemBuilder: (context, index) {
        if (index == _questions.length) {
          return _buildPaginationFooter(isDark);
        }

        final q = _questions[index];

        if (_sectionId == 'cq') {
          return _buildCqCard(q, index + 1, isDark);
        } else if (_sectionId == 'ka_bhandar' || _sectionId == 'kha_bhandar') {
          return _buildQaCard(q, index + 1, isDark);
        } else {
          // All MCQ sections (academic mcq, engineering, medical, varsity_ka, varsity_kha, gst, iba_bup, textbook, etc.)
          final isAnswered = _selectedOptions.containsKey(index);
          return Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: QuestionCard(
              question: q,
              serialNumber: index + 1,
              selectedOptionIndex: _selectedOptions[index],
              isFlagged: false,
              isBookmarked: _bookmarkedQuestions.contains(q.id),
              onToggleBookmark: () => _toggleBookmark(q.id),
              showFeedback: isAnswered,
              showAnswer: false,
              readOnly: isAnswered,
              hideSourceTag: false,
              alwaysShowSourceTag: true,
              showReport: true,
              initiallyExpanded: true,
              onToggleFlag: () {},
              onReport: () => QuestionReportDialog.show(context, q.id),
              onSelectOption: (optIdx) {
                HapticFeedback.mediumImpact();
                setState(() {
                  _selectedOptions[index] = optIdx;
                });
              },
            ),
          );
        }
      },
    );
  }

  // ── Pagination Footer (Auto Infinite Scroll) ──
  Widget _buildPaginationFooter(bool isDark) {
    if (_isLoadingMore) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2.2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    isDark ? const Color(0xFF10B981) : const Color(0xFF047857),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'পরবর্তী প্রশ্ন লোড হচ্ছে...',
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                  ),
              ),
            ],
          ),
        ),
      );
    }

    if (_hasMore) {
      return const SizedBox(height: 32);
    }

    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 28),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.check_circle_outline_rounded,
                size: 14,
                color: isDark ? const Color(0xFF10B981) : const Color(0xFF047857),
              ),
              const SizedBox(width: 6),
              Text(
                'সব প্রশ্ন লোড করা হয়েছে',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                  ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── CQ Extraction & Formatting Helpers ──
  static (String stimulus, List<String> subQuestions) _extractCqData(Question q) {
    String stimulus = '';
    List<String> subQuestions = [];

    // 1. Check if passage contains stimulus (উদ্দীপক)
    if (q.passage != null && q.passage!.trim().isNotEmpty) {
      stimulus = q.passage!.trim();
    }

    // 2. Check options array for sub-questions
    if (q.options.isNotEmpty) {
      subQuestions = q.options.where((s) => s.trim().isNotEmpty).toList();
    }

    // 3. If options has fewer than 4 items, attempt regex extraction from question text
    if (subQuestions.length < 4) {
      final rawText = q.question.trim();
      final splitRegex = RegExp(
        r'(?:\r?\n|^)\s*(?:\(([ক-ঘa-d1-4])\)|([ক-ঘa-d1-4])[\.\:\)]|\b([ক-ঘa-d])\s*[-–:])\s*',
        caseSensitive: false,
      );
      final matches = splitRegex.allMatches(rawText).toList();

      if (matches.length >= 2) {
        if (stimulus.isEmpty) {
          stimulus = rawText.substring(0, matches.first.start).trim();
        }
        final extracted = <String>[];
        for (int i = 0; i < matches.length; i++) {
          final start = matches[i].start;
          final end = (i + 1 < matches.length) ? matches[i + 1].start : rawText.length;
          final part = rawText.substring(start, end).trim();
          if (part.isNotEmpty) extracted.add(part);
        }
        if (extracted.isNotEmpty) {
          subQuestions = extracted;
        }
      }
    }

    if (stimulus.isEmpty) {
      stimulus = q.question.trim();
    }

    // 4. Ensure at least 4 items with standard defaults if missing
    const defaultLabels = [
      'জ্ঞানমূলক প্রশ্ন',
      'অনুধাবনমূলক প্রশ্ন',
      'প্রয়োগমূলক গাণিতিক সমস্যা',
      'উচ্চতর দক্ষতামূলক বিশ্লেষণ',
    ];
    while (subQuestions.length < 4) {
      subQuestions.add(defaultLabels[subQuestions.length]);
    }

    return (stimulus, subQuestions.sublist(0, 4));
  }

  static String _formatSubQuestion(String prefix, String text) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return prefix;
    final cleanPrefix = prefix.replaceAll(RegExp(r'[\(\)\.\:\s]'), '');
    final regex = RegExp('^(\\($cleanPrefix\\)|$cleanPrefix[\\.\\:\\)]|\\b$cleanPrefix\\b)\\s*', caseSensitive: false);
    if (regex.hasMatch(trimmed)) {
      return trimmed;
    }
    return '$prefix $trimmed';
  }

  // ── CQ (Creative Question) Card ──
  Widget _buildCqCard(Question q, int number, bool isDark) {
    final banglaNum = BanglaNameHelper.toBanglaNumeral(number);
    final boardName = q.examHistory.isNotEmpty
        ? '${q.examHistory.first.institute} \'${(q.examHistory.first.year % 100).toString().padLeft(2, '0')}'
        : (q.institutes.isNotEmpty
            ? '${q.institutes.first}${q.years.isNotEmpty ? " '${(q.years.first % 100).toString().padLeft(2, '0')}" : ''}'
            : 'বোর্ড প্রশ্ন');

    final (stimulus, subQuestions) = _extractCqData(q);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Top row above questions: left = bookmark & report, right = board or college name
            Row(
              children: [
                IconButton(
                  icon: Icon(
                    _bookmarkedQuestions.contains(q.id)
                        ? Icons.bookmark_rounded
                        : Icons.bookmark_border_rounded,
                    size: 20,
                    color: _bookmarkedQuestions.contains(q.id)
                        ? const Color(0xFFF59E0B)
                        : (isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8)),
                  ),
                  tooltip: _bookmarkedQuestions.contains(q.id) ? 'বুকমার্ক সরাও' : 'বুকমার্ক করো',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () => _toggleBookmark(q.id),
                ),
                const SizedBox(width: 10),
                IconButton(
                  icon: Icon(
                    Icons.outlined_flag_rounded,
                    size: 20,
                    color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
                  ),
                  tooltip: 'রিপোর্ট করো',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () => QuestionReportDialog.show(context, q.id),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDC2626).withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: const Color(0xFFDC2626).withValues(alpha: 0.22),
                      width: 0.9,
                    ),
                  ),
                  child: Text(
                    boardName,
                    style: const TextStyle(
                      fontSize: 12.0,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFFDC2626),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Question number then uddipok text (no "উদ্দীপক" label)
            LatexText(
              text: '$banglaNum. $stimulus',
              style: TextStyle(
                fontSize: 15.5,
                fontWeight: FontWeight.w500,
                height: 1.55,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 12),

            // 4 sub-questions (no markings)
            _buildSubQuestionItem(_formatSubQuestion('(ক)', subQuestions[0]), isDark),
            _buildSubQuestionItem(_formatSubQuestion('(খ)', subQuestions[1]), isDark),
            _buildSubQuestionItem(_formatSubQuestion('(গ)', subQuestions[2]), isDark),
            _buildSubQuestionItem(_formatSubQuestion('(ঘ)', subQuestions[3]), isDark),

            const SizedBox(height: 12),

            // Simple "উত্তর দেখো" button: no icon, deepest green
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(8),
                    onTap: () {
                      HapticFeedback.lightImpact();
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => CqSolutionPageView(
                            question: q,
                            serialNumber: number,
                            boardName: boardName,
                            subQuestions: subQuestions,
                            stimulus: stimulus,
                            isBookmarked: _bookmarkedQuestions.contains(q.id),
                            onToggleBookmark: () => _toggleBookmark(q.id),
                          ),
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7.5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF064E3B), // Deepest green
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'উত্তর দেখো',
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubQuestionItem(String title, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: LatexText(
        text: title,
        style: TextStyle(
          fontSize: 14.5,
          fontWeight: FontWeight.w500,
          color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF334155),
          height: 1.4,
        ),
      ),
    );
  }

  // ── ক প্রশ্নাবলী ও খ প্রশ্নাবলী Q&A Card ──
  Widget _buildQaCard(Question q, int number, bool isDark) {
    final isExpanded = _expandedAnswers.contains(q.id);
    final banglaNum = BanglaNameHelper.toBanglaNumeral(number);
    final isKa = _sectionId == 'ka_bhandar';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: isKa
                        ? const Color(0xFF3B82F6).withValues(alpha: 0.12)
                        : const Color(0xFF047857).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    isKa ? '$banglaNum. জ্ঞানমূলক প্রশ্ন' : '$banglaNum. অনুধাবনমূলক প্রশ্ন',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: isKa ? const Color(0xFF2563EB) : const Color(0xFF047857),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                if (q.examHistory.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${q.examHistory.first.institute} \'${(q.examHistory.first.year % 100).toString().padLeft(2, '0')}',
                      style: TextStyle(
                        fontSize: 11.5,
                        color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                      ),
                    ),
                  ),
                const Spacer(),
                IconButton(
                  icon: Icon(
                    _bookmarkedQuestions.contains(q.id)
                        ? Icons.bookmark_rounded
                        : Icons.bookmark_border_rounded,
                    size: 18,
                    color: _bookmarkedQuestions.contains(q.id)
                        ? const Color(0xFFF59E0B)
                        : (isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8)),
                  ),
                  tooltip: _bookmarkedQuestions.contains(q.id) ? 'বুকমার্ক সরাও' : 'বুকমার্ক করো',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () => _toggleBookmark(q.id),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: Icon(
                    LucideIcons.flag,
                    size: 15,
                    color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
                  ),
                  tooltip: 'রিপোর্ট করুন',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () => QuestionReportDialog.show(context, q.id),
                ),
              ],
            ),
          ),

          // Question Text
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 4, 14, 12),
            child: LatexText(
              text: q.question,
              style: TextStyle(
                fontSize: 15.5,
                fontWeight: FontWeight.w600,
                height: 1.5,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ),

          // Expandable Answer Section
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              setState(() {
                if (isExpanded) {
                  _expandedAnswers.remove(q.id);
                } else {
                  _expandedAnswers.add(q.id);
                }
              });
            },
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1F1F23) : const Color(0xFFF8FAFC),
                borderRadius: isExpanded
                    ? BorderRadius.zero
                    : const BorderRadius.vertical(bottom: Radius.circular(15)),
                border: Border(
                  top: BorderSide(
                    color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                  ),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    LucideIcons.lightbulb,
                    size: 15,
                    color: isKa ? const Color(0xFF2563EB) : const Color(0xFF047857),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    isExpanded ? 'উত্তর সংক্ষেপ করুন' : 'উত্তর ও ব্যাখ্যা দেখুন',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: isKa ? const Color(0xFF2563EB) : const Color(0xFF047857),
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    isExpanded ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                    size: 15,
                    color: isKa ? const Color(0xFF2563EB) : const Color(0xFF047857),
                  ),
                ],
              ),
            ),
          ),

          if (isExpanded)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF141416) : const Color(0xFFFAF7F2),
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(15)),
              ),
              child: LatexText(
                text: (q.explanation != null && q.explanation!.trim().isNotEmpty)
                    ? q.explanation!
                    : (q.options.isNotEmpty ? q.options.first : 'এই প্রশ্নের উত্তর শীঘ্রই হালনাগাদ করা হবে।'),
                style: TextStyle(
                  fontSize: 14.5,
                  height: 1.6,
                  color: isDark ? const Color(0xFFF4F4F5) : const Color(0xFF2E2621),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ── Static Curated Fallback Data for Complete Curriculum ──
  List<ChapterItem> _getFallbackChapters(String subjectId) {
    final lower = subjectId.toLowerCase();
    if (lower.contains('physics') || lower.contains('পদার্থ')) {
      if (lower.contains('2') || lower.contains('২')) {
        return const [
          ChapterItem(id: 'phy2_ch01', name: '১ম অধ্যায়: তাপগতিবিদ্যা'),
          ChapterItem(id: 'phy2_ch02', name: '২য় অধ্যায়: স্থির তড়িৎ'),
          ChapterItem(id: 'phy2_ch03', name: '৩য় অধ্যায়: চল তড়িৎ'),
          ChapterItem(id: 'phy2_ch04', name: '৪র্থ অধ্যায়: তড়িৎ প্রবাহের চৌম্বক ক্রিয়া ও চুম্বকত্ব'),
          ChapterItem(id: 'phy2_ch05', name: '৫ম অধ্যায়: তাড়িতচৌম্বকীয় আবেশ ও পরিবর্তী প্রবাহ'),
          ChapterItem(id: 'phy2_ch06', name: '৬ষ্ঠ অধ্যায়: জ্যামিতিক আলোকবিজ্ঞান'),
          ChapterItem(id: 'phy2_ch07', name: '৭ম অধ্যায়: ভৌত আলোকবিজ্ঞান'),
          ChapterItem(id: 'phy2_ch08', name: '৮ম অধ্যায়: আধুনিক পদার্থবিজ্ঞানের সূচনা'),
          ChapterItem(id: 'phy2_ch09', name: '৯ম অধ্যায়: পরমাণুর মডেল ও নিউক্লিয়ার পদার্থবিজ্ঞান'),
          ChapterItem(id: 'phy2_ch10', name: '১০ম অধ্যায়: সেমিকন্ডাক্টর ও ইলেকট্রনিক্স'),
        ];
      }
      return const [
        ChapterItem(id: 'phy1_ch01', name: '১ম অধ্যায়: ভৌতজগত ও পরিমাপ'),
        ChapterItem(id: 'phy1_ch02', name: '২য় অধ্যায়: ভেক্টর'),
        ChapterItem(id: 'phy1_ch03', name: '৩য় অধ্যায়: গতিবিদ্যা'),
        ChapterItem(id: 'phy1_ch04', name: '৪র্থ অধ্যায়: নিউটনিয়ান বলবিদ্যা'),
        ChapterItem(id: 'phy1_ch05', name: '৫ম অধ্যায়: কাজ, শক্তি ও ক্ষমতা'),
        ChapterItem(id: 'phy1_ch06', name: '৬ষ্ঠ অধ্যায়: মহাকর্ষ ও অভিকর্ষ'),
        ChapterItem(id: 'phy1_ch07', name: '৭ম অধ্যায়: পদার্থের গাঠনিক ধর্ম'),
        ChapterItem(id: 'phy1_ch08', name: '৮ম অধ্যায়: পর্যাবৃত্ত গতি'),
        ChapterItem(id: 'phy1_ch09', name: '৯ম অধ্যায়: তরঙ্গ'),
        ChapterItem(id: 'phy1_ch10', name: '১০ম অধ্যায়: আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব'),
      ];
    } else if (lower.contains('chemistry') || lower.contains('রসায়ন')) {
      if (lower.contains('2') || lower.contains('২')) {
        return const [
          ChapterItem(id: 'chem2_ch01', name: '১ম অধ্যায়: পরিবেশ রসায়ন'),
          ChapterItem(id: 'chem2_ch02', name: '২য় অধ্যায়: জৈব রসায়ন'),
          ChapterItem(id: 'chem2_ch03', name: '৩য় অধ্যায়: পরিমাণগত রসায়ন'),
          ChapterItem(id: 'chem2_ch04', name: '৪র্থ অধ্যায়: তড়িৎ রসায়ন'),
          ChapterItem(id: 'chem2_ch05', name: '৫ম অধ্যায়: অর্থনৈতিক রসায়ন'),
        ];
      }
      return const [
        ChapterItem(id: 'chem1_ch01', name: '১ম অধ্যায়: ল্যাবরেটরির নিরাপদ ব্যবহার'),
        ChapterItem(id: 'chem1_ch02', name: '২য় অধ্যায়: গুণগত রসায়ন'),
        ChapterItem(id: 'chem1_ch03', name: '৩য় অধ্যায়: মৌলের পর্যায়বৃত্ত ধর্ম ও বন্ধন'),
        ChapterItem(id: 'chem1_ch04', name: '৪র্থ অধ্যায়: রাসায়নিক পরিবর্তন'),
        ChapterItem(id: 'chem1_ch05', name: '৫ম অধ্যায়: কর্মমুখী রসায়ন'),
      ];
    } else if (lower.contains('math') || lower.contains('গণিত')) {
      if (lower.contains('2') || lower.contains('২')) {
        return const [
          ChapterItem(id: 'math2_ch01', name: '১ম অধ্যায়: বাস্তব সংখ্যা ও অসমতা'),
          ChapterItem(id: 'math2_ch02', name: '২য় অধ্যায়: যোগাশ্রয়ী প্রোগ্রাম'),
          ChapterItem(id: 'math2_ch03', name: '৩য় অধ্যায়: জটিল সংখ্যা'),
          ChapterItem(id: 'math2_ch04', name: '৪র্থ অধ্যায়: বহুপদী ও বহুপদী সমীকরণ'),
          ChapterItem(id: 'math2_ch05', name: '৫ম অধ্যায়: দ্বিপদী বিস্তার'),
          ChapterItem(id: 'math2_ch06', name: '৬ষ্ঠ অধ্যায়: কণিক'),
          ChapterItem(id: 'math2_ch07', name: '৭ম অধ্যায়: বিপরীত ত্রিকোণমিতিক ফাংশন'),
          ChapterItem(id: 'math2_ch08', name: '৮ম অধ্যায়: স্থিতিবিদ্যা'),
          ChapterItem(id: 'math2_ch09', name: '৯ম অধ্যায়: সমতলে বস্তুকণার গতি'),
        ];
      }
      return const [
        ChapterItem(id: 'math1_ch01', name: '১ম অধ্যায়: ম্যাট্রিক্স ও নির্ণায়ক'),
        ChapterItem(id: 'math1_ch02', name: '২য় অধ্যায়: ভেক্টর'),
        ChapterItem(id: 'math1_ch03', name: '৩য় অধ্যায়: সরলরেখা'),
        ChapterItem(id: 'math1_ch04', name: '৪র্থ অধ্যায়: বৃত্ত'),
        ChapterItem(id: 'math1_ch05', name: '৫ম অধ্যায়: বিন্যাস ও সমাবেশ'),
        ChapterItem(id: 'math1_ch06', name: '৬ষ্ঠ অধ্যায়: ত্রিকোণমিতিক অনুপাত'),
        ChapterItem(id: 'math1_ch07', name: '৭ম অধ্যায়: সংযুক্ত কোণের ত্রিকোণমিতিক অনুপাত'),
        ChapterItem(id: 'math1_ch08', name: '৮ম অধ্যায়: ফাংশন ও ফাংশনের লেখচিত্র'),
        ChapterItem(id: 'math1_ch09', name: '৯ম অধ্যায়: অন্তরীকরণ'),
        ChapterItem(id: 'math1_ch10', name: '১০ম অধ্যায়: যোগজীকরণ'),
      ];
    } else if (lower.contains('biology') || lower.contains('জীব')) {
      return const [
        ChapterItem(id: 'bio1_ch01', name: '১ম অধ্যায়: কোষ ও এর গঠন'),
        ChapterItem(id: 'bio1_ch02', name: '২য় অধ্যায়: কোষ বিভাজন'),
        ChapterItem(id: 'bio1_ch03', name: '৩য় অধ্যায়: কোষ রসায়ন'),
        ChapterItem(id: 'bio1_ch04', name: '৪র্থ অধ্যায়: অণুজীব'),
        ChapterItem(id: 'bio1_ch05', name: '৫ম অধ্যায়: শৈবাল ও ছত্রাক'),
        ChapterItem(id: 'bio1_ch06', name: '৬ষ্ঠ অধ্যায়: ব্রায়োফাইটা ও টেরিডোফাইটা'),
        ChapterItem(id: 'bio1_ch07', name: '৭ম অধ্যায়: নগ্নবীজী ও আবৃতবীজী উদ্ভিদ'),
        ChapterItem(id: 'bio1_ch08', name: '৮ম অধ্যায়: টিস্যু ও টিস্যুতন্ত্র'),
        ChapterItem(id: 'bio1_ch09', name: '৯ম অধ্যায়: উদ্ভিদ শারীরতত্ত্ব'),
        ChapterItem(id: 'bio1_ch10', name: '১০ম অধ্যায়: উদ্ভিদ প্রজনন'),
      ];
    } else if (lower.contains('english') || lower.contains('ইংরেজি')) {
      if (lower.contains('2') || lower.contains('২')) {
        return const [
          ChapterItem(id: 'eng2_ch01', name: '১ম অধ্যায়: Gap filling activities without clues (Prepositions)'),
          ChapterItem(id: 'eng2_ch02', name: '২য় অধ্যায়: Special phrases and words'),
          ChapterItem(id: 'eng2_ch03', name: '৩য় অধ্যায়: Completing sentences with clauses/phrases'),
          ChapterItem(id: 'eng2_ch04', name: '৪র্থ অধ্যায়: Right form of verbs'),
          ChapterItem(id: 'eng2_ch05', name: '৫ম অধ্যায়: Narrative style (Direct & Indirect)'),
          ChapterItem(id: 'eng2_ch06', name: '৬ষ্ঠ অধ্যায়: Use of modifiers'),
          ChapterItem(id: 'eng2_ch07', name: '৭ম অধ্যায়: Sentence connectors'),
          ChapterItem(id: 'eng2_ch08', name: '৮ম অধ্যায়: Synonym and Antonym'),
          ChapterItem(id: 'eng2_ch09', name: '৯ম অধ্যায়: Punctuation and Capitalization'),
        ];
      }
      return const [
        ChapterItem(id: 'eng1_ch01', name: '১ম অধ্যায়: People or Institutions Making History'),
        ChapterItem(id: 'eng1_ch02', name: '২য় অধ্যায়: Dreams'),
        ChapterItem(id: 'eng1_ch03', name: '৩য় অধ্যায়: Lifestyle and Health'),
        ChapterItem(id: 'eng1_ch04', name: '৪র্থ অধ্যায়: Youth and Adolescence'),
        ChapterItem(id: 'eng1_ch05', name: '৫ম অধ্যায়: Art and Music'),
        ChapterItem(id: 'eng1_ch06', name: '৬ষ্ঠ অধ্যায়: Environment and Nature'),
        ChapterItem(id: 'eng1_ch07', name: '৭ম অধ্যায়: Tours and Travels'),
      ];
    } else if (lower.contains('ict') || lower.contains('তথ্য') || lower.contains('আইসিটি')) {
      return const [
        ChapterItem(id: 'ict_ch01', name: '১ম অধ্যায়: বিশ্ব ও বাংলাদেশ প্রেক্ষিত'),
        ChapterItem(id: 'ict_ch02', name: '২য় অধ্যায়: কমিউনিকেশন সিস্টেম ও নেটওয়ার্কিং'),
        ChapterItem(id: 'ict_ch03', name: '৩য় অধ্যায়: সংখ্যা পদ্ধতি ও ডিজিটাল ডিভাইস'),
        ChapterItem(id: 'ict_ch04', name: '৪র্থ অধ্যায়: ওয়েব ডিজাইন পরিচিতি ও HTML'),
        ChapterItem(id: 'ict_ch05', name: '৫ম অধ্যায়: প্রোগ্রামিং ভাষা (C)'),
        ChapterItem(id: 'ict_ch06', name: '৬ষ্ঠ অধ্যায়: ডাটাবেজ ম্যানেজমেন্ট সিস্টেম'),
      ];
    } else if (lower.contains('bangla') || lower.contains('বাংলা')) {
      if (lower.contains('2') || lower.contains('২')) {
        return const [
          ChapterItem(id: 'ban2_ch01', name: '১ম অধ্যায়: বাংলা উচ্চারণের নিয়ম'),
          ChapterItem(id: 'ban2_ch02', name: '২য় অধ্যায়: বাংলা বানানের নিয়ম'),
          ChapterItem(id: 'ban2_ch03', name: '৩য় অধ্যায়: বাংলা ব্যাকরণিক শব্দশ্রেণি'),
          ChapterItem(id: 'ban2_ch04', name: '৪র্থ অধ্যায়: বাংলা শব্দগঠন (উপসর্গ ও সমাস)'),
          ChapterItem(id: 'ban2_ch05', name: '৫ম অধ্যায়: বাক্যতত্ত্ব ও বাক্য রূপান্তর'),
          ChapterItem(id: 'ban2_ch06', name: '৬ষ্ঠ অধ্যায়: বাংলা ভাষার অপপ্রয়োগ ও শুদ্ধপ্রয়োগ'),
        ];
      }
      return const [
        ChapterItem(id: 'ban1_ch01', name: '১ম অধ্যায়: অপরিচিতা'),
        ChapterItem(id: 'ban1_ch02', name: '২য় অধ্যায়: বিলাসী'),
        ChapterItem(id: 'ban1_ch03', name: '৩য় অধ্যায়: আমার পথ'),
        ChapterItem(id: 'ban1_ch04', name: '৪র্থ অধ্যায়: মানব কল্যাণ'),
        ChapterItem(id: 'ban1_ch05', name: '৫ম অধ্যায়: মাসি-পিসি'),
        ChapterItem(id: 'ban1_ch06', name: '৬ষ্ঠ অধ্যায়: বায়ান্নর দিনগুলো'),
        ChapterItem(id: 'ban1_ch07', name: '৭ম অধ্যায়: সোনার তরী'),
        ChapterItem(id: 'ban1_ch08', name: '৮ম অধ্যায়: বিদ্রোহী'),
        ChapterItem(id: 'ban1_ch09', name: '৯ম অধ্যায়: প্রতিদান'),
        ChapterItem(id: 'ban1_ch10', name: '১০ম অধ্যায়: তাহারেই পড়ে মনে'),
      ];
    } else if (lower.contains('accounting') || lower.contains('হিসাব')) {
      return const [
        ChapterItem(id: 'acc_ch01', name: '১ম অধ্যায়: হিসাববিজ্ঞান পরিচিতি'),
        ChapterItem(id: 'acc_ch02', name: '২য় অধ্যায়: লেনদেন'),
        ChapterItem(id: 'acc_ch03', name: '৩য় অধ্যায়: দুতরফা দাখিলা পদ্ধতি'),
        ChapterItem(id: 'acc_ch04', name: '৪র্থ অধ্যায়: মূলধন ও মুনাফা জাতীয় লেনদেন'),
        ChapterItem(id: 'acc_ch05', name: '৫ম অধ্যায়: হিসাব'),
        ChapterItem(id: 'acc_ch06', name: '৬ষ্ঠ অধ্যায়: জাবেদা'),
        ChapterItem(id: 'acc_ch07', name: '৭ম অধ্যায়: খতিয়ান'),
        ChapterItem(id: 'acc_ch08', name: '৮ম অধ্যায়: নগদান বই'),
        ChapterItem(id: 'acc_ch09', name: '৯ম অধ্যায়: রেওয়ামিল'),
        ChapterItem(id: 'acc_ch10', name: '১০ম অধ্যায়: আর্থিক বিবরণী'),
      ];
    } else if (lower.contains('business') || lower.contains('উদ্যোগ')) {
      return const [
        ChapterItem(id: 'biz_ch01', name: '১ম অধ্যায়: ব্যবসায়ের পরিচিতি'),
        ChapterItem(id: 'biz_ch02', name: '২য় অধ্যায়: ব্যবসায় উদ্যোগ ও উদ্যোক্তা'),
        ChapterItem(id: 'biz_ch03', name: '৩য় অধ্যায়: আত্মকর্মসংস্থান'),
        ChapterItem(id: 'biz_ch04', name: '৪র্থ অধ্যায়: মালিকানার ভিত্তিতে ব্যবসায়'),
        ChapterItem(id: 'biz_ch05', name: '৫ম অধ্যায়: ব্যবসায়ের আইনগত দিক'),
        ChapterItem(id: 'biz_ch06', name: '৬ষ্ঠ অধ্যায়: ব্যবসায় পরিকল্পনা'),
      ];
    } else if (lower.contains('finance') || lower.contains('ফিন্যান্স')) {
      return const [
        ChapterItem(id: 'fin_ch01', name: '১ম অধ্যায়: অর্থায়ন ও ব্যবসায় অর্থায়ন'),
        ChapterItem(id: 'fin_ch02', name: '২য় অধ্যায়: অর্থায়নের উৎস'),
        ChapterItem(id: 'fin_ch03', name: '৩য় অধ্যায়: অর্থের সময়মূল্য'),
        ChapterItem(id: 'fin_ch04', name: '৪র্থ অধ্যায়: ঝুঁকি ও অনিশ্চয়তা'),
        ChapterItem(id: 'fin_ch05', name: '৫ম অধ্যায়: মূলধনি আয়-ব্যয় প্রাক্কলন'),
        ChapterItem(id: 'fin_ch06', name: '৬ষ্ঠ অধ্যায়: ব্যাংকিং ব্যবসায় ও তার ধরন'),
      ];
    } else if (lower.contains('general_science') || lower.contains('বিজ্ঞান')) {
      return const [
        ChapterItem(id: 'sci_ch01', name: '১ম অধ্যায়: উন্নততর জীবনধারা'),
        ChapterItem(id: 'sci_ch02', name: '২য় অধ্যায়: জীবনের জন্য পানি'),
        ChapterItem(id: 'sci_ch03', name: '৩য় অধ্যায়: হৃদযন্ত্রের যত কথা'),
        ChapterItem(id: 'sci_ch04', name: '৪র্থ অধ্যায়: নবজীবনের সূচনা'),
        ChapterItem(id: 'sci_ch05', name: '৫ম অধ্যায়: দেখতে হলে আলো চাই'),
        ChapterItem(id: 'sci_ch06', name: '৬ষ্ঠ অধ্যায়: পলিমার'),
      ];
    } else if (lower.contains('history') || lower.contains('ইতিহাস')) {
      return const [
        ChapterItem(id: 'hist_ch01', name: '১ম অধ্যায়: ইতিহাস পরিচিতি'),
        ChapterItem(id: 'hist_ch02', name: '২য় অধ্যায়: বিশ্বসভ্যতা'),
        ChapterItem(id: 'hist_ch03', name: '৩য় অধ্যায়: প্রাচীন বাংলার জনপদ'),
        ChapterItem(id: 'hist_ch04', name: '৪র্থ অধ্যায়: প্রাচীন বাংলার রাজনৈতিক ইতিহাস'),
        ChapterItem(id: 'hist_ch05', name: '৫ম অধ্যায়: প্রাচীন বাংলার সামাজিক ও অর্থনৈতিক ইতিহাস'),
        ChapterItem(id: 'hist_ch06', name: '১১শ অধ্যায়: ভাষা আন্দোলন ও পরবর্তী রাজনৈতিক ঘটনাপ্রবাহ'),
      ];
    } else if (lower.contains('geography') || lower.contains('ভূগোল')) {
      return const [
        ChapterItem(id: 'geo_ch01', name: '১ম অধ্যায়: ভূগোল ও পরিবেশ'),
        ChapterItem(id: 'geo_ch02', name: '২য় অধ্যায়: মহাবিশ্ব ও আমাদের পৃথিবী'),
        ChapterItem(id: 'geo_ch03', name: '৩য় অধ্যায়: মানচিত্র পঠন ও ব্যবহার'),
        ChapterItem(id: 'geo_ch04', name: '৪র্থ অধ্যায়: পৃথিবীর অভ্যন্তরীণ ও বাহ্যিক গঠন'),
        ChapterItem(id: 'geo_ch05', name: '৫ম অধ্যায়: বায়ুমণ্ডল'),
      ];
    } else if (lower.contains('civics') || lower.contains('পৌরনীতি')) {
      return const [
        ChapterItem(id: 'civ_ch01', name: '১ম অধ্যায়: পৌরনীতি ও নাগরিকতা'),
        ChapterItem(id: 'civ_ch02', name: '২য় অধ্যায়: নাগরিক ও নাগরিকতা'),
        ChapterItem(id: 'civ_ch03', name: '৩য় অধ্যায়: আইন, স্বাধীনতা ও সাম্য'),
        ChapterItem(id: 'civ_ch04', name: '৪র্থ অধ্যায়: রাষ্ট্র ও সরকার ব্যবস্থা'),
        ChapterItem(id: 'civ_ch05', name: '৫ম অধ্যায়: সংবিধান'),
      ];
    } else if (lower.contains('economics') || lower.contains('অর্থনীতি')) {
      return const [
        ChapterItem(id: 'econ_ch01', name: '১ম অধ্যায়: অর্থনীতি পরিচয়'),
        ChapterItem(id: 'econ_ch02', name: '২য় অধ্যায়: অর্থনীতির মৌলিক ধারণা'),
        ChapterItem(id: 'econ_ch03', name: '৩য় অধ্যায়: উপযোগ, চাহিদা, জোগান ও ভারসাম্য'),
        ChapterItem(id: 'econ_ch04', name: '৪র্থ অধ্যায়: উৎপাদন ও সংগঠন'),
        ChapterItem(id: 'econ_ch05', name: '৫ম অধ্যায়: বাজার'),
      ];
    } else if (lower.contains('bgs') || lower.contains('বাংলাদেশ ও বিশ্ব')) {
      return const [
        ChapterItem(id: 'bgs_ch01', name: '১ম অধ্যায়: পূর্ব বাংলার আন্দোলন ও জাতীয়তাবাদের উত্থান'),
        ChapterItem(id: 'bgs_ch02', name: '২য় অধ্যায়: স্বাধীন বাংলাদেশ'),
        ChapterItem(id: 'bgs_ch03', name: '৩য় অধ্যায়: সৌরজগৎ ও ভূমণ্ডল'),
        ChapterItem(id: 'bgs_ch04', name: '৪র্থ অধ্যায়: বাংলাদেশের ভূপ্রকৃতি ও জলবায়ু'),
        ChapterItem(id: 'bgs_ch05', name: '৫ম অধ্যায়: বাংলাদেশের নদ-নদী ও প্রাকৃতিক সম্পদ'),
        ChapterItem(id: 'bgs_ch06', name: '৬ষ্ঠ অধ্যায়: রাষ্ট্র, নাগরিকতা ও আইন'),
      ];
    } else if (lower.contains('religion') || lower.contains('ধর্ম')) {
      return const [
        ChapterItem(id: 'rel_ch01', name: '১ম অধ্যায়: আকাইদ ও নৈতিক জীবন'),
        ChapterItem(id: 'rel_ch02', name: '২য় অধ্যায়: শরিয়তের উৎস'),
        ChapterItem(id: 'rel_ch03', name: '৩য় অধ্যায়: ইবাদত'),
        ChapterItem(id: 'rel_ch04', name: '৪র্থ অধ্যায়: আখলাক'),
        ChapterItem(id: 'rel_ch05', name: '৫ম অধ্যায়: আদর্শ জীবনচরিত'),
      ];
    }

    return const [
      ChapterItem(id: 'ch01', name: '১ম অধ্যায়'),
      ChapterItem(id: 'ch02', name: '২য় অধ্যায়'),
      ChapterItem(id: 'ch03', name: '৩য় অধ্যায়'),
      ChapterItem(id: 'ch04', name: '৪র্থ অধ্যায়'),
      ChapterItem(id: 'ch05', name: '৫ম অধ্যায়'),
    ];
  }

  List<TopicItem> _getFallbackTopics(String chapterId) {
    return [
      TopicItem(id: '${chapterId}_t1', name: 'টপিক ১: মৌলিক ধারণা ও সূত্রাবলী', chapterId: chapterId),
      TopicItem(id: '${chapterId}_t2', name: 'টপিক ২: গাণিতিক সমস্যা ও প্রয়োগ', chapterId: chapterId),
      TopicItem(id: '${chapterId}_t3', name: 'টপিক ৩: বোর্ড পরীক্ষার স্ট্যান্ডার্ড প্রশ্নাবলী', chapterId: chapterId),
    ];
  }

}

// ── Dropdown Trigger Pill Button ──
class _DropdownPillButton extends StatelessWidget {
  final IconData icon;
  final String titlePrefix;
  final String value;
  final bool isDark;
  final bool isSelected;
  final bool disabled;
  final bool isLoading;
  final VoidCallback? onTap;

  const _DropdownPillButton({
    required this.icon,
    required this.titlePrefix,
    required this.value,
    required this.isDark,
    this.isSelected = false,
    this.disabled = false,
    this.isLoading = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final displayText = isSelected ? '$titlePrefix: $value' : value;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: disabled || isLoading ? null : onTap,
        borderRadius: BorderRadius.circular(22),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          height: 40,
          padding: const EdgeInsets.symmetric(horizontal: 10),
          decoration: BoxDecoration(
            color: disabled
                ? (isDark ? const Color(0xFF141416) : const Color(0xFFF1F5F9))
                : (isSelected
                    ? (isDark
                        ? const Color(0xFF064E3B).withValues(alpha: 0.25)
                        : const Color(0xFFF0FDF4))
                    : (isDark ? const Color(0xFF141416) : const Color(0xFFF8FAFC))),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: disabled
                  ? (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0))
                  : (isSelected
                      ? (isDark
                          ? const Color(0xFF059669).withValues(alpha: 0.5)
                          : const Color(0xFF86EFAC))
                      : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0))),
              width: 1.0,
            ),
          ),
          child: Row(
            children: [
              // Circular Icon Badge
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: disabled
                      ? (isDark ? const Color(0xFF1E1E22) : const Color(0xFFE2E8F0))
                      : (isSelected
                          ? (isDark
                              ? const Color(0xFF047857).withValues(alpha: 0.35)
                              : const Color(0xFFD1FAE5))
                          : (isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9))),
                ),
                child: Center(
                  child: Icon(
                    icon,
                    size: 13,
                    color: disabled
                        ? (isDark ? const Color(0xFF52525B) : const Color(0xFF94A3B8))
                        : (isSelected
                            ? (isDark ? const Color(0xFF34D399) : const Color(0xFF047857))
                            : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B))),
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Title / Value Text
              Expanded(
                child: Text(
                  displayText,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                    color: disabled
                        ? (isDark ? const Color(0xFF52525B) : const Color(0xFF94A3B8))
                        : (isSelected
                            ? (isDark ? const Color(0xFF34D399) : const Color(0xFF047857))
                            : (isDark ? Colors.white : const Color(0xFF0F172A))),
                  ),
                ),
              ),

              const SizedBox(width: 4),

              // Right Arrow or Loading indicator
              if (isLoading)
                const SizedBox(
                  width: 13,
                  height: 13,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Color(0xFF047857),
                  ),
                )
              else
                Icon(
                  LucideIcons.chevronDown,
                  size: 14,
                  color: disabled
                      ? (isDark ? const Color(0xFF3F3F46) : const Color(0xFFCBD5E1))
                      : (isSelected
                          ? (isDark ? const Color(0xFF34D399) : const Color(0xFF047857))
                          : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B))),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Searchable Filter Modal BottomSheet ──
class _FilterOption {
  final String id;
  final String title;
  final String? subtitle;

  const _FilterOption({
    required this.id,
    required this.title,
    this.subtitle,
  });
}

class _FilterSelectionSheet extends StatelessWidget {
  final String title;
  final bool isDark;
  final List<_FilterOption> items;
  final String selectedId;
  final ValueChanged<_FilterOption> onSelect;

  const _FilterSelectionSheet({
    required this.title,
    required this.isDark,
    required this.items,
    required this.selectedId,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final maxHeight = MediaQuery.of(context).size.height * 0.76;

    _FilterOption? allOption;
    final otherOptions = <_FilterOption>[];
    for (final it in items) {
      if (it.id == 'all') {
        allOption = it;
      } else {
        otherOptions.add(it);
      }
    }

    return Container(
      constraints: BoxConstraints(maxHeight: maxHeight),
      decoration: BoxDecoration(
        // Pure pitch dark black background in dark mode
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
            width: 1.2,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Reduced top padding drag handle
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 8, bottom: 4),
                width: 32,
                height: 3.5,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Compact Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 2, 10, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: AppIcon(
                      AppIcons.close,
                      size: 18,
                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),

            // Content Area with Grey Grid
            Flexible(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(14, 2, 14, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Prominent "সকল" Option (All chapters/topics)
                    if (allOption != null) ...[
                      _buildAllOptionCard(context, allOption),
                      const SizedBox(height: 10),
                    ],

                    // 2-Column Grey Grid for chapters/topics
                    if (otherOptions.isNotEmpty)
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 8,
                          crossAxisSpacing: 8,
                          mainAxisExtent: 48,
                        ),
                        itemCount: otherOptions.length,
                        itemBuilder: (context, index) {
                          final item = otherOptions[index];
                          return _buildGridTile(context, item);
                        },
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAllOptionCard(BuildContext context, _FilterOption item) {
    final isSelected = item.id == selectedId;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onSelect(item);
        },
        borderRadius: BorderRadius.circular(10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: isSelected
                ? (isDark
                    ? const Color(0xFF064E3B).withValues(alpha: 0.28)
                    : const Color(0xFFECFDF5))
                : (isDark ? const Color(0xFF0D0D0F) : const Color(0xFFF8FAFC)),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFF047857)
                  : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
              width: isSelected ? 1.5 : 1.0,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isSelected
                      ? const Color(0xFF047857).withValues(alpha: 0.2)
                      : (isDark ? const Color(0xFF1E1E22) : const Color(0xFFF1F5F9)),
                ),
                child: Icon(
                  LucideIcons.layers,
                  size: 14,
                  color: isSelected
                      ? const Color(0xFF10B981)
                      : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      item.title,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                        color: isSelected
                            ? (isDark ? const Color(0xFF34D399) : const Color(0xFF047857))
                            : (isDark ? Colors.white : const Color(0xFF0F172A)),
                      ),
                    ),
                    if (item.subtitle != null) ...[
                      Text(
                        item.subtitle!,
                        style: TextStyle(
                          fontSize: 10.5,
                          color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (isSelected)
                Container(
                  width: 18,
                  height: 18,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0xFF047857),
                  ),
                  child: const Icon(
                    LucideIcons.check,
                    size: 11,
                    color: Colors.white,
                  ),
                )
              else
                Icon(
                  LucideIcons.circle,
                  size: 16,
                  color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFCBD5E1),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGridTile(BuildContext context, _FilterOption item) {
    final isSelected = item.id == selectedId;

    String? prefix;
    String mainTitle = item.title;
    if (item.title.contains(':')) {
      final parts = item.title.split(':');
      prefix = parts[0].trim();
      mainTitle = parts.sublist(1).join(':').trim();
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onSelect(item);
        },
        borderRadius: BorderRadius.circular(10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: isSelected
                ? (isDark
                    ? const Color(0xFF064E3B).withValues(alpha: 0.28)
                    : const Color(0xFFECFDF5))
                : (isDark ? const Color(0xFF0D0D0F) : const Color(0xFFF8FAFC)),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFF047857)
                  : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
              width: isSelected ? 1.5 : 1.0,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (prefix != null) ...[
                      Text(
                        prefix,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w700,
                          color: isSelected
                              ? const Color(0xFF10B981)
                              : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B)),
                        ),
                      ),
                      const SizedBox(height: 1),
                    ],
                    Text(
                      mainTitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                        height: 1.2,
                        color: isSelected
                            ? (isDark ? const Color(0xFF34D399) : const Color(0xFF047857))
                            : (isDark ? Colors.white : const Color(0xFF0F172A)),
                      ),
                    ),
                  ],
                ),
              ),
              if (isSelected) ...[
                const SizedBox(width: 4),
                Container(
                  width: 16,
                  height: 16,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0xFF047857),
                  ),
                  child: const Icon(
                    LucideIcons.check,
                    size: 10,
                    color: Colors.white,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ── CQ Solution Dedicated Page View ──
class CqSolutionPageView extends StatefulWidget {
  final Question question;
  final int serialNumber;
  final String boardName;
  final List<String> subQuestions;
  final String? stimulus;
  final bool isBookmarked;
  final VoidCallback? onToggleBookmark;

  const CqSolutionPageView({
    super.key,
    required this.question,
    required this.serialNumber,
    required this.boardName,
    required this.subQuestions,
    this.stimulus,
    this.isBookmarked = false,
    this.onToggleBookmark,
  });

  @override
  State<CqSolutionPageView> createState() => _CqSolutionPageViewState();
}

class _CqSolutionPageViewState extends State<CqSolutionPageView> {
  late bool _isBookmarked;

  @override
  void initState() {
    super.initState();
    _isBookmarked = widget.isBookmarked;
  }

  void _handleBookmarkToggle() {
    HapticFeedback.lightImpact();
    setState(() {
      _isBookmarked = !_isBookmarked;
    });
    widget.onToggleBookmark?.call();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final banglaNum = BanglaNameHelper.toBanglaNumeral(widget.serialNumber);

    // Extract stimulus & subQuestions if not pre-parsed
    final (extractedStimulus, parsedSubQuestions) = _AcademicSectionDetailViewState._extractCqData(widget.question);
    final displayStimulus = (widget.stimulus != null && widget.stimulus!.trim().isNotEmpty)
        ? widget.stimulus!
        : extractedStimulus;
    final displaySubQuestions = widget.subQuestions.length >= 4
        ? widget.subQuestions
        : parsedSubQuestions;

    final rawExplanation = widget.question.explanation?.trim() ?? '';
    final solutionText = rawExplanation.isNotEmpty
        ? rawExplanation
        : (widget.question.options.length > 4
            ? widget.question.options.sublist(4).join('\n\n')
            : '');

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF000000) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        shadowColor: Colors.black.withValues(alpha: 0.1),
        leading: IconButton(
          icon: AppIcon(
            AppIcons.arrowLeft,
            size: 20,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          '$banglaNum নং সৃজনশীল সমাধান',
          style: TextStyle(
            fontSize: 16.5,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isBookmarked
                  ? Icons.bookmark_rounded
                  : Icons.bookmark_border_rounded,
              size: 22,
              color: _isBookmarked
                  ? const Color(0xFFF59E0B)
                  : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B)),
            ),
            tooltip: _isBookmarked ? 'বুকমার্ক সরাও' : 'বুকমার্ক করো',
            onPressed: _handleBookmarkToggle,
          ),
          IconButton(
            icon: Icon(
              LucideIcons.flag,
              size: 19,
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
            ),
            tooltip: 'রিপোর্ট করুন',
            onPressed: () => QuestionReportDialog.show(context, widget.question.id),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Card 1: Question Card ──
            Container(
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Top row: left = bookmark & report, right = board name
                    Row(
                      children: [
                        IconButton(
                          icon: Icon(
                            _isBookmarked
                                ? Icons.bookmark_rounded
                                : Icons.bookmark_border_rounded,
                            size: 20,
                            color: _isBookmarked
                                ? const Color(0xFFF59E0B)
                                : (isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8)),
                          ),
                          tooltip: _isBookmarked ? 'বুকমার্ক সরাও' : 'বুকমার্ক করো',
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: _handleBookmarkToggle,
                        ),
                        const SizedBox(width: 10),
                        IconButton(
                          icon: Icon(
                            Icons.outlined_flag_rounded,
                            size: 20,
                            color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
                          ),
                          tooltip: 'রিপোর্ট করো',
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: () => QuestionReportDialog.show(context, widget.question.id),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDC2626).withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: const Color(0xFFDC2626).withValues(alpha: 0.22),
                              width: 0.9,
                            ),
                          ),
                          child: Text(
                            widget.boardName,
                            style: const TextStyle(
                              fontSize: 12.0,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFFDC2626),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Question number then uddipok text
                    LatexText(
                      text: '$banglaNum. $displayStimulus',
                      style: TextStyle(
                        fontSize: 15.5,
                        fontWeight: FontWeight.w500,
                        height: 1.55,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // 4 sub-questions (no markings)
                    _buildSubQuestionItem(_AcademicSectionDetailViewState._formatSubQuestion('(ক)', displaySubQuestions[0]), isDark),
                    _buildSubQuestionItem(_AcademicSectionDetailViewState._formatSubQuestion('(খ)', displaySubQuestions[1]), isDark),
                    _buildSubQuestionItem(_AcademicSectionDetailViewState._formatSubQuestion('(গ)', displaySubQuestions[2]), isDark),
                    _buildSubQuestionItem(_AcademicSectionDetailViewState._formatSubQuestion('(ঘ)', displaySubQuestions[3]), isDark),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 18),

            // ── Card 2: Solution Card ──
            Container(
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF047857).withValues(alpha: 0.35)
                      : const Color(0xFF047857).withValues(alpha: 0.25),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF047857).withValues(alpha: isDark ? 0.08 : 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header: Solution Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF047857).withValues(alpha: 0.12)
                          : const Color(0xFFECFDF5),
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          LucideIcons.bookOpenCheck,
                          size: 17,
                          color: isDark ? const Color(0xFF34D399) : const Color(0xFF047857),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'আদর্শ উত্তর ও পূর্ণাঙ্গ সমাধান',
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w700,
                            color: isDark ? const Color(0xFF34D399) : const Color(0xFF047857),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1, thickness: 1),

                  // Solution Body
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: (solutionText.isNotEmpty)
                        ? Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1F1F23) : const Color(0xFFFAFAF9),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isDark ? const Color(0xFF2E2E33) : const Color(0xFFE5E5E5),
                              ),
                            ),
                            child: LatexText(
                              text: solutionText,
                              style: TextStyle(
                                fontSize: 15.0,
                                height: 1.6,
                                color: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF1E293B),
                              ),
                            ),
                          )
                        : Container(
                            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                            child: Column(
                              children: [
                                Icon(
                                  LucideIcons.helpCircle,
                                  size: 32,
                                  color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'এই সৃজনশীল প্রশ্নের উত্তর ও সমাধান শীঘ্রই যুক্ত করা হবে।',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 14.0,
                                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
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
        ),
      ),
    );
  }

  Widget _buildSubQuestionItem(String title, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: LatexText(
        text: title,
        style: TextStyle(
          fontSize: 14.5,
          fontWeight: FontWeight.w500,
          color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF334155),
          height: 1.4,
        ),
      ),
    );
  }
}

