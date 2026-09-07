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
          style: const TextStyle(fontFamily: 'HindSiliguri', fontSize: 13),
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
    final paper = (widget.subject['paper'] as String?) ?? '';
    final paperClean = paper.isNotEmpty ? paper.split(' ')[0] : '';
    return paperClean.isNotEmpty ? '$name $paperClean' : name;
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

      return Question(
        id: q.id,
        subject: q.subject,
        subjectLabel: q.subjectLabel,
        chapter: q.chapter,
        question: q.question,
        explanation: q.explanation,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        correctAnswerIndices: q.correctAnswerIndices,
        points: q.points,
        examHistory: [ExamHistory(code: code, institute: institute, year: year)],
        institutes: [code],
        years: [year],
        examType: q.examType ?? _sectionTitle,
        difficulty: q.difficulty,
      );
    }

    return q;
  }

  bool _filterQuestion(Question q) {
    if (_sectionId == 'cq') {
      final type = (q.examType ?? '').toLowerCase();
      return type.contains('cq');
    }
    if (_sectionId == 'ka_bhandar') {
      final text = q.question.toLowerCase();
      final type = (q.examType ?? '').toLowerCase();
      return type.contains('ka') || type.contains('knowledge') || text.contains('(ক)') || text.startsWith('ক.');
    }
    if (_sectionId == 'kha_bhandar') {
      final text = q.question.toLowerCase();
      final type = (q.examType ?? '').toLowerCase();
      return type.contains('kha') || type.contains('comprehension') || text.contains('(খ)') || text.startsWith('খ.');
    }

    // MCQ sections must have options
    if (q.options.isEmpty) return false;

    final type = (q.examType ?? '').toLowerCase();
    final institutes = q.institutes.map((e) => e.toString().toLowerCase()).join(' ');

    if (_sectionId == 'engineering') {
      // Must be Engineering, reject any pure Medical or Academic-only questions
      if (type.contains('medical') || type.contains('mat') || type.contains('mbbs') || type.contains('bds')) {
        return false;
      }
      return type.contains('eng') ||
          type.contains('buet') ||
          type.contains('ckruet') ||
          type.contains('ruet') ||
          type.contains('kuet') ||
          type.contains('cuet') ||
          institutes.contains('buet') ||
          institutes.contains('ckruet');
    }

    if (_sectionId == 'medical') {
      // Must be Medical, reject any pure Engineering questions
      if (type.contains('engineering') || type.contains('buet') || type.contains('ckruet') || type.contains('kuet') || type.contains('ruet')) {
        return false;
      }
      return type.contains('med') ||
          type.contains('mat') ||
          type.contains('dmat') ||
          type.contains('mbbs') ||
          type.contains('bds') ||
          institutes.contains('mat') ||
          institutes.contains('dmc');
    }

    if (_sectionId == 'varsity_ka' || _sectionId == 'varsity_kha' || _sectionId == 'varsity') {
      // Reject pure Engineering or pure Medical
      if (type == 'engineering' || type == 'medical' || type.contains('buet')) {
        return false;
      }
      return type.contains('varsity') || type.contains('admission') || institutes.contains('du') || institutes.contains('ju') || institutes.contains('ru');
    }

    if (_sectionId == 'textbook') {
      if (type == 'engineering' ||
          type == 'medical' ||
          type.contains('buet') ||
          type.contains('mat') ||
          type.contains('ckruet')) {
        return false;
      }

      final bool isBookType = type.contains('book') || type.contains('textbook');
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
      if (type == 'engineering' || type == 'medical' || type.contains('buet') || type.contains('mat')) {
        return false;
      }
      return type.contains('academic') || type.contains('board') || type.isEmpty;
    }

    return true;
  }

  // ── Questions Query Builder ──
  dynamic _buildQuestionsQuery({
    bool ignoreChapter = false,
    bool ignoreTopic = false,
  }) {
    final supabase = Supabase.instance.client;
    final rawSubjectId = _subjectId;
    final cleanId = rawSubjectId.replaceAll('hsc_', '').replaceAll('ssc_', '');
    final fullHscId = rawSubjectId.startsWith('hsc_') ? rawSubjectId : 'hsc_$rawSubjectId';

    // Collect all valid subject_ids for this subject
    final subjectIds = <String>{fullHscId, cleanId, rawSubjectId};
    if (cleanId.contains('math')) {
      final num = cleanId.contains('2') ? '2' : '1';
      subjectIds.addAll(['hsc_higher_math_$num', 'higher_math_$num', 'math_$num', 'hsc_math_$num']);
    } else if (cleanId.contains('physics')) {
      final num = cleanId.contains('2') ? '2' : '1';
      subjectIds.addAll(['hsc_physics_$num', 'physics_$num']);
    } else if (cleanId.contains('chemistry')) {
      final num = cleanId.contains('2') ? '2' : '1';
      subjectIds.addAll(['hsc_chemistry_$num', 'chemistry_$num']);
    } else if (cleanId.contains('biology')) {
      final num = cleanId.contains('2') ? '2' : '1';
      subjectIds.addAll(['hsc_biology_$num', 'biology_$num']);
    } else if (cleanId.contains('ict')) {
      subjectIds.addAll(['hsc_ict', 'ict']);
    } else if (cleanId.contains('bangla')) {
      final num = cleanId.contains('2') ? '2' : '1';
      subjectIds.addAll(['hsc_bangla_$num', 'bangla_$num']);
    } else if (cleanId.contains('english')) {
      final num = cleanId.contains('2') ? '2' : '1';
      subjectIds.addAll(['hsc_english_$num', 'english_$num']);
    }

    var query = supabase.from('questions').select('*');

    // 1. Filter by subject_id using inFilter
    query = query.inFilter('subject_id', subjectIds.toList());

    // 2. Filter by chapter if chosen and not ignored
    if (!ignoreChapter && _selectedChapter != null && _selectedChapter!.name.isNotEmpty) {
      final chVars = BanglaNameHelper.getSearchVariations(_selectedChapter!.name);
      if (chVars.isNotEmpty) {
        if (chVars.length == 1) {
          query = query.ilike('chapter', '%${chVars.first}%');
        } else {
          final conds = chVars.map((v) => 'chapter.ilike.*$v*').join(',');
          query = query.or(conds);
        }
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
      query = query.or('type.eq.cq,exam_type.ilike.*cq*');
    } else if (_sectionId == 'ka_bhandar') {
      query = query.or('type.eq.ka,type.eq.knowledge,question.ilike.*ক*');
    } else if (_sectionId == 'kha_bhandar') {
      query = query.or('type.eq.kha,type.eq.comprehension,question.ilike.*খ*');
    } else if (_sectionId == 'engineering') {
      query = query.or('exam_type.ilike.*engineering*,exam_type.ilike.*buet*,exam_type.ilike.*ckruet*,exam_type.ilike.*ruet*,exam_type.ilike.*kuet*,exam_type.ilike.*cuet*');
    } else if (_sectionId == 'medical') {
      query = query.or('exam_type.ilike.*medical*,exam_type.ilike.*mat*,exam_type.ilike.*dmat*,exam_type.ilike.*mbbs*,exam_type.ilike.*bds*');
    } else if (_sectionId == 'varsity_ka' || _sectionId == 'varsity_kha' || _sectionId == 'varsity') {
      query = query.or('exam_type.ilike.*varsity*,exam_type.ilike.*admission*');
    } else if (_sectionId == 'iba_bup') {
      query = query.or('exam_type.ilike.*iba*,exam_type.ilike.*bup*,exam_type.ilike.*admission*');
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
      final data = await query.range(0, _pageSize - 1);
      List<Question> questions = [];
      if (data.isNotEmpty) {
        questions = (data as List)
            .map((row) => _processQuestionRow(row as Map<String, dynamic>))
            .where((q) => _filterQuestion(q))
            .toList();
      }

      // Only if DB has 0 questions for the whole category (no filter selected), generate curated demo questions
      if (questions.isEmpty && _selectedChapter == null && _selectedTopic == null) {
        questions = _generateCuratedQuestions(
          _subjectId,
          _sectionId,
          _selectedChapter?.name ?? '১ম অধ্যায়',
          _selectedTopic?.name,
        );
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
      final questions = _generateCuratedQuestions(
        _subjectId,
        _sectionId,
        _selectedChapter?.name ?? '১ম অধ্যায়',
        _selectedTopic?.name,
      );
      if (mounted) {
        setState(() {
          _questions = questions;
          _currentOffset = questions.length;
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
      final query = _buildQuestionsQuery();
      final from = _currentOffset;
      final to = _currentOffset + _pageSize - 1;
      final data = await query.range(from, to);

      List<Question> newQuestions = [];
      if (data.isNotEmpty) {
        newQuestions = (data as List)
            .map((row) => _processQuestionRow(row as Map<String, dynamic>))
            .where((q) => _filterQuestion(q))
            .toList();
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
            fontFamily: 'HindSiliguri',
            fontSize: 18,
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
                        fontFamily: 'HindSiliguri',
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
                fontFamily: 'HindSiliguri',
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
                  fontFamily: 'HindSiliguri',
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
                  fontFamily: 'HindSiliguri',
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
                  style: TextStyle(fontFamily: 'HindSiliguri', fontWeight: FontWeight.w600),
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
                  fontFamily: 'HindSiliguri',
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
                  fontFamily: 'HindSiliguri',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── CQ (Creative Question) Card ──
  Widget _buildCqCard(Question q, int number, bool isDark) {
    final banglaNum = BanglaNameHelper.toBanglaNumeral(number);
    final boardName = q.examHistory.isNotEmpty
        ? '${q.examHistory.first.institute} \'${(q.examHistory.first.year % 100).toString().padLeft(2, '0')}'
        : (q.institutes.isNotEmpty
            ? '${q.institutes.first}${q.years.isNotEmpty ? " '${(q.years.first % 100).toString().padLeft(2, '0')}" : ''}'
            : 'বোর্ড প্রশ্ন');

    final subQuestions = q.options.isNotEmpty && q.options.length >= 4
        ? [
            q.options[0],
            q.options[1],
            q.options[2],
            q.options[3],
          ]
        : [
            'জ্ঞানমূলক প্রশ্ন',
            'অনুধাবনমূলক প্রশ্ন',
            'প্রয়োগমূলক গাণিতিক সমস্যা',
            'উচ্চতর দক্ষতামূলক বিশ্লেষণ',
          ];

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
                      fontFamily: 'HindSiliguri',
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
              text: '$banglaNum. ${q.question}',
              style: TextStyle(
                fontFamily: 'HindSiliguri',
                fontSize: 15.5,
                fontWeight: FontWeight.w500,
                height: 1.55,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 12),

            // 4 sub-questions (no markings)
            _buildSubQuestionItem('(ক) ${subQuestions[0]}', isDark),
            _buildSubQuestionItem('(খ) ${subQuestions[1]}', isDark),
            _buildSubQuestionItem('(গ) ${subQuestions[2]}', isDark),
            _buildSubQuestionItem('(ঘ) ${subQuestions[3]}', isDark),

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
                          fontFamily: 'HindSiliguri',
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
      child: Text(
        title,
        style: TextStyle(
          fontFamily: 'HindSiliguri',
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
                      fontFamily: 'HindSiliguri',
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
                        fontFamily: 'HindSiliguri',
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
                fontFamily: 'HindSiliguri',
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
                      fontFamily: 'HindSiliguri',
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
                text: q.explanation ?? 'এই প্রশ্নের উত্তর শীঘ্রই হালনাগাদ করা হবে।',
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
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

  List<Question> _generateCuratedQuestions(
    String subject,
    String sectionId,
    String chapterName,
    String? topicName,
  ) {
    final cleanChapter = chapterName.replaceAll(RegExp(r'^\d+[ম্থয়]\s*অধ্যায়[:\s]*'), '');
    final topicSnippet = topicName != null && topicName.isNotEmpty ? ' [$topicName]' : '';

    if (sectionId == 'cq') {
      return [
        Question(
          id: 'cq_${subject}_1',
          subject: subject,
          chapter: cleanChapter,
          question:
              '$cleanChapter সংক্রান্ত একটি ব্যবহারিক পরীক্ষায় একটি বস্তুর গতি ও শক্তি পরিমাপ করা হলো। উদ্দীপক অনুসারে $cleanChapter সম্পর্কিত বিভিন্ন তথ্যাদি সংগৃহীত হয়েছে।$topicSnippet',
          options: const [],
          correctAnswerIndex: 0,
          points: 10,
          examHistory: const [ExamHistory(institute: 'ঢাকা বোর্ড', year: 2023)],
          explanation:
              '(ক) জ্ঞানমূলক উত্তর: পাঠ্যবই অনুযায়ী সূত্র ও সংজ্ঞা সুস্পষ্টভাবে সংজ্ঞায়িত।\n\n(খ) অনুধাবনমূলক ব্যাখ্যা: কারণ ও প্রভাবের সম্পর্ক যুক্তিসহ তুলে ধরতে হবে।\n\n(গ) প্রয়োগমূলক সমাধান: সূত্র প্রয়োগ করে প্রয়োজনীয় মান নির্ণয় করা হয়েছে। মান: ১০.৫ একক।\n\n(ঘ) উচ্চতর দক্ষতা: উদ্দীপকের শর্ত সাপেক্ষে গাণিতিক ও তুলনামূলক বিশ্লেষণ নিখুঁতভাবে প্রমাণিত।',
        ),
        Question(
          id: 'cq_${subject}_2',
          subject: subject,
          chapter: cleanChapter,
          question:
              'ল্যাবরেটরিতে $cleanChapter সংশ্লিষ্ট পরীক্ষণ সম্পন্নকালে পর্যবেক্ষণ থেকে প্রাপ্ত ফলাফল ছকভুক্ত করা হলো।$topicSnippet',
          options: const [],
          correctAnswerIndex: 0,
          points: 10,
          examHistory: const [ExamHistory(institute: 'চট্টগ্রাম বোর্ড', year: 2023)],
          explanation:
              '(ক) মৌলিক রাশি/সংজ্ঞা যথাযথভাবে লেখা হয়েছে।\n(খ) বৈজ্ঞানিক নীতির ভিত্তিতে ব্যাখ্যাকরণ।\n(গ) প্রদত্ত সমীকরণ ব্যবহার করে সমাধান সম্পন্ন হয়েছে।\n(ঘ) বাস্তব পরিবেশের সাথে তত্ত্বের যথার্থতা বিশ্লেষণ।',
        ),
      ];
    } else if (sectionId == 'ka_bhandar') {
      return [
        Question(
          id: 'ka_${subject}_1',
          subject: subject,
          chapter: cleanChapter,
          question: '$cleanChapter অধ্যায়ের মূল ভিত্তি বা মৌলিক নীতিটির সংজ্ঞা দাও।$topicSnippet',
          options: const [],
          correctAnswerIndex: 0,
          points: 1,
          examHistory: const [ExamHistory(institute: 'ঢাকা বোর্ড', year: 2023)],
          explanation:
              'উত্তর: পাঠ্যবই অনুযায়ী—যে প্রাকৃতিক নিয়মের অধীনে উক্ত প্রক্রিয়াটি অপরিবর্তিত থাকে এবং নির্দিষ্ট শর্তাধীনে কার্যকারিতা প্রদর্শন করে, তাকেই উক্ত মূল নীতি বলা হয়।',
        ),
        Question(
          id: 'ka_${subject}_2',
          subject: subject,
          chapter: cleanChapter,
          question: '$cleanChapter সম্পর্কিত প্রধান একক বা ধ্রুবকের মান কত?$topicSnippet',
          options: const [],
          correctAnswerIndex: 0,
          points: 1,
          examHistory: const [ExamHistory(institute: 'রাজশাহী বোর্ড', year: 2022)],
          explanation:
              'উত্তর: এস.আই (SI) পদ্ধতিতে এর প্রমিত একক এবং ধ্রুবকটির আন্তর্জাতিক মান নির্ধারিত সূত্রে সংজ্ঞায়িত।',
        ),
        Question(
          id: 'ka_${subject}_3',
          subject: subject,
          chapter: cleanChapter,
          question: '$cleanChapter অধ্যায়ে উল্লেখিত প্রধান সূত্রটি বিবৃতি করো।$topicSnippet',
          options: const [],
          correctAnswerIndex: 0,
          points: 1,
          examHistory: const [ExamHistory(institute: 'যশোর বোর্ড', year: 2023)],
          explanation:
              'উত্তর: নির্দিষ্ট তাপমাত্রা ও চাপে কোনো নির্দিষ্ট ব্যবস্থার ফলাফল সর্বদা তার কার্যকরী প্রভাবকের সমানুপাতিক।',
        ),
      ];
    } else if (sectionId == 'kha_bhandar') {
      return [
        Question(
          id: 'kha_${subject}_1',
          subject: subject,
          chapter: cleanChapter,
          question:
              '$cleanChapter অধ্যায়ের ঘটনাটি দৈনন্দিন জীবনে কীভাবে কার্যকর ব্যাখ্যা করো।$topicSnippet',
          options: const [],
          correctAnswerIndex: 0,
          points: 2,
          examHistory: const [ExamHistory(institute: 'ঢাকা বোর্ড', year: 2023)],
          explanation:
              'মূল বক্তব্য: এটি মূলত পারস্পরিক মিথস্ক্রিয়া এবং শক্তির রূপান্তরের ফলেই সংঘটিত হয়।\n\nব্যাখ্যা: কারণ যখন বাহ্যিক প্রভাবক কাজ করে, তখন অভ্যন্তরীণ প্রতিরোধ বল বিপরীতমুখী প্রতিক্রিয়া সৃষ্টি করে সাম্যাবস্থা রক্ষা করে।',
        ),
        Question(
          id: 'kha_${subject}_2',
          subject: subject,
          chapter: cleanChapter,
          question:
              'উষ্ণতা বৃদ্ধিতে $cleanChapter সংশ্লিষ্ট মানটির পরিবর্তন ঘটে কেন? ব্যাখ্যা করো।$topicSnippet',
          options: const [],
          correctAnswerIndex: 0,
          points: 2,
          examHistory: const [ExamHistory(institute: 'দিনাজপুর বোর্ড', year: 2022)],
          explanation:
              'মূল বক্তব্য: তাপশক্তি বৃদ্ধির সাথে সাথে কণাগুলোর গতিশক্তি বৃদ্ধি পায়।\n\nব্যাখ্যা: তাপমাত্রা বৃদ্ধি পেলে আন্তঃআণবিক আকর্ষণ বল হ্রাস পায় এবং কণাগুলোর স্পন্দন বৃদ্ধি পেয়ে সামগ্রিক রোধ বা ঘনত্ব হ্রাস পায়।',
        ),
      ];
    } else {
      // MCQ (Academic, Engineering, Medical, Varsity, etc.)
      final String fallbackInstitute;
      final String fallbackExamType;
      if (sectionId == 'engineering') {
        fallbackInstitute = 'বুয়েট ভর্তি পরীক্ষা';
        fallbackExamType = 'Engineering';
      } else if (sectionId == 'medical') {
        fallbackInstitute = 'মেডিকেল ভর্তি পরীক্ষা (MAT)';
        fallbackExamType = 'Medical';
      } else if (sectionId == 'varsity_ka' || sectionId == 'varsity_kha' || sectionId == 'varsity') {
        fallbackInstitute = 'ঢাকা বিশ্ববিদ্যালয় (ক ইউনিট)';
        fallbackExamType = 'Varsity';
      } else if (sectionId == 'gst') {
        fallbackInstitute = 'গুচ্ছ জিএসটি ভর্তি পরীক্ষা';
        fallbackExamType = 'Varsity';
      } else if (sectionId == 'iba_bup') {
        fallbackInstitute = 'আইবিএ / বিইউপি ভর্তি পরীক্ষা';
        fallbackExamType = 'Admission';
      } else if (sectionId == 'textbook') {
        final cleanSubj = _subjectId.toLowerCase();
        if (cleanSubj.contains('physic')) {
          fallbackInstitute = 'ইসহাক স্যার';
        } else if (cleanSubj.contains('chem')) {
          fallbackInstitute = 'হাজারী ও নাগ';
        } else if (cleanSubj.contains('math')) {
          fallbackInstitute = 'কেতাব স্যার';
        } else if (cleanSubj.contains('bio')) {
          fallbackInstitute = 'হাসান স্যার';
        } else {
          fallbackInstitute = 'পাঠ্যবই অনুশীলন';
        }
        fallbackExamType = 'Book';
      } else {
        fallbackInstitute = 'ঢাকা বোর্ড';
        fallbackExamType = 'Academic';
      }

      return [
        Question(
          id: '${sectionId}_${subject}_1',
          subject: subject,
          chapter: cleanChapter,
          examType: fallbackExamType,
          question: '$cleanChapter সম্পর্কিত নিচের কোন বিবৃতিটি সঠিক?$topicSnippet',
          options: const [
            'এটি একটি মৌলিক ভেক্টর রাশি',
            'এর মান সর্বদা ধনাত্মক ও অপরিবর্তনীয়',
            'প্রযুক্ত বলের সাথে এর সম্পর্ক সরলরেখিক',
            'উপরের সবগুলোই সঠিক',
          ],
          correctAnswerIndex: 2,
          points: 1,
          examHistory: [ExamHistory(institute: fallbackInstitute, year: 2023)],
          explanation:
              'সঠিক উত্তর (গ)। কারণ পাঠ্যবই অনুযায়ী বলের প্রয়োগে নির্দিষ্ট শর্ত সাপেক্ষে সম্পর্কটি সরাসরি সরলরেখিক বৃদ্ধি নির্দেশ করে।',
        ),
        Question(
          id: '${sectionId}_${subject}_2',
          subject: subject,
          chapter: cleanChapter,
          examType: fallbackExamType,
          question: '$cleanChapter অধ্যায়ে এস.আই (SI) একক নিচের কোনটি?$topicSnippet',
          options: const [
            'kg m s⁻¹',
            'N m⁻²',
            'J s⁻¹',
            'W m⁻¹ K⁻¹',
          ],
          correctAnswerIndex: 1,
          points: 1,
          examHistory: [ExamHistory(institute: fallbackInstitute, year: 2022)],
          explanation:
              'সঠিক উত্তর (খ)। প্রতি একক ক্ষেত্রফলে লম্বভাবে প্রযুক্ত বলের জন্য প্রমিত এস.আই একক হলো N m⁻² (প্যাসকেল)।',
        ),
      ];
    }
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
                    fontFamily: 'HindSiliguri',
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
                        fontFamily: 'HindSiliguri',
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
                        fontFamily: 'HindSiliguri',
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
                          fontFamily: 'HindSiliguri',
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
                          fontFamily: 'HindSiliguri',
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
                        fontFamily: 'HindSiliguri',
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
  final bool isBookmarked;
  final VoidCallback? onToggleBookmark;

  const CqSolutionPageView({
    super.key,
    required this.question,
    required this.serialNumber,
    required this.boardName,
    required this.subQuestions,
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
            fontFamily: 'HindSiliguri',
            fontSize: 17.5,
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
                              fontFamily: 'HindSiliguri',
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
                      text: '$banglaNum. ${widget.question.question}',
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 15.5,
                        fontWeight: FontWeight.w500,
                        height: 1.55,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // 4 sub-questions (no markings)
                    _buildSubQuestionItem('(ক) ${widget.subQuestions[0]}', isDark),
                    _buildSubQuestionItem('(খ) ${widget.subQuestions[1]}', isDark),
                    _buildSubQuestionItem('(গ) ${widget.subQuestions[2]}', isDark),
                    _buildSubQuestionItem('(ঘ) ${widget.subQuestions[3]}', isDark),
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
                            fontFamily: 'HindSiliguri',
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
                    child: (widget.question.explanation != null && widget.question.explanation!.trim().isNotEmpty)
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
                              text: widget.question.explanation!,
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
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
                                    fontFamily: 'HindSiliguri',
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
      child: Text(
        title,
        style: TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 14.5,
          fontWeight: FontWeight.w500,
          color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF334155),
          height: 1.4,
        ),
      ),
    );
  }
}

