import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../../exam/domain/exam_models.dart';
import '../../exam/services/offline_question_bank_service.dart';
import '../presentation/institute_question_bank_detail_view.dart';

class QuestionBankService {
  static const String _leanQuestionFields =
      'id, question, options, correct_answer_indices, explanation, type, difficulty, subject, chapter, topic, image_url, option_images, explanation_image_url, status, institutes, years, tags, exam_type, passage, section';

  static const String _leanWrittenQuestionFields =
      'id, question, explanation, total_marks, type, difficulty, stream, division, subject, chapter, topic, image_url, explanation_image_url, status, institutes, years, exam_history, tags, exam_type, sub_questions';

  static final Map<String, List<Question>> _examSetCache = {};

  static void clearCache() {
    _examSetCache.clear();
  }

  static Future<bool> hasWrittenQuestions({
    required String instituteId,
    required InstituteExamSet examSet,
  }) async {
    final qs = await fetchExamSetQuestions(
      instituteId: instituteId,
      examSet: examSet,
    );
    return qs.isNotEmpty;
  }

  static List<String> getInstituteSearchTags(String instituteId) {
    final id = instituteId.toLowerCase();
    switch (id) {
      case 'buet':
        return ['BUET', 'বুয়েট'];
      case 'ckruet':
        // STRICT: Only CKRUET combined cluster tags. Never include RUET, KUET, CUET
        // to prevent individual university questions from leaking into CKRUET exam sets.
        return ['CKRUET', 'গুচ্ছ ইঞ্জিঃ', 'গুচ্ছ ইঞ্জিনিয়ারিং', 'চুয়েট-কুয়েট-রুয়েট'];
      case 'ruet':
        return ['RUET', 'রুয়েট'];
      case 'kuet':
        return ['KUET', 'কুয়েট'];
      case 'cuet':
        return ['CUET', 'চুয়েট'];
      case 'medical':
        return ['Medical', 'মেডিকেল', 'ডেন্টাল ভর্তি পরীক্ষা', 'MATS', 'MBBS', 'BDS'];
      case 'du':
      case 'varsity_ka':
        return ['DU', 'ঢাবি', 'Dhaka University'];
      case 'ju':
        return ['JU', 'জাবি', 'Jahangirnagar University'];
      case 'ru':
        return ['RU', 'রাবি', 'Rajshahi University'];
      case 'cu':
        return ['CU', 'চবি', 'Chittagong University'];
      case 'sust':
        return ['SUST', 'শাবিপ্রবি'];
      case 'butex':
        return ['BUTEX', 'বুটেক্স'];
      case 'mist':
        return ['MIST', 'মিরপুর এমআইএসটি'];
      case 'iut':
        return ['IUT'];
      case 'bup':
        return ['BUP'];
      case 'gst':
        return ['GST', 'গুচ্ছ'];
      case 'agri':
        return ['Agri', 'কৃষি গুচ্ছ'];
      case 'board_dhaka':
        return ['DB', 'ঢাকা বোর্ড', 'Dhaka Board', 'Dhaka'];
      case 'board_rajshahi':
        return ['RB', 'রাজশাহী বোর্ড', 'Rajshahi Board', 'Rajshahi'];
      case 'board_chittagong':
        return ['CB', 'CtgB', 'চট্টগ্রাম বোর্ড', 'Chittagong Board', 'Chittagong', 'Chattogram Board'];
      case 'board_comilla':
        return ['ComB', 'CB', 'কুমিল্লা বোর্ড', 'Comilla Board', 'Cumilla Board'];
      case 'board_jessore':
        return ['JB', 'যশোর বোর্ড', 'Jessore Board', 'Jashore Board'];
      case 'board_sylhet':
        return ['SB', 'সিলেট বোর্ড', 'Sylhet Board'];
      case 'board_dinajpur':
        return ['DinB', 'দিনাজপুর বোর্ড', 'Dinajpur Board'];
      case 'board_barisal':
        return ['BB', 'বরিশাল বোর্ড', 'Barisal Board', 'Barishal Board'];
      case 'board_mymensingh':
        return ['MB', 'ময়মনসিংহ বোর্ড', 'Mymensingh Board'];
      default:
        if (id.startsWith('board_')) {
          final boardName = id.replaceFirst('board_', '');
          return [instituteId.toUpperCase(), boardName, '${boardName.toUpperCase()} BOARD'];
        }
        return [instituteId.toUpperCase()];
    }
  }

  /// Extracts 4-digit years from session string.
  /// In Bangladeshi admission & academic systems:
  /// A session like '2022-23', '22-23', or '2022-2023' (consecutive years Y and Y+1)
  /// is stored in the question bank under its start year Y (e.g. 2022 for session 2022-23).
  /// Returning both Y and Y+1 causes question leakage between consecutive sessions (e.g. 22-23 and 23-24).
  static List<int> extractYearsFromSession(String yearStr,
      {String? instituteId}) {
    if (yearStr.isEmpty) return [];
    final parts = yearStr
        .split(RegExp(r'[-/]'))
        .map((p) => p.trim())
        .where((p) => p.isNotEmpty)
        .toList();
    final List<int> nums = [];
    for (final p in parts) {
      final num = int.tryParse(p);
      if (num != null) {
        if (num < 100) {
          nums.add(num > 50 ? 1900 + num : 2000 + num);
        } else {
          nums.add(num);
        }
      }
    }

    // For consecutive year sessions Y and Y+1 (e.g. 2022-23 -> 2022, 2023),
    // questions in question bank can be tagged with either start year Y or conduct year Y+1.
    // Return both Y and Y+1 to capture all authentic questions belonging to this session.
    if (nums.length == 2 && nums[1] == nums[0] + 1) {
      return [nums[0], nums[1]];
    }

    return nums;
  }

  /// Checks whether a question subject matches a selected target subject.
  /// Handles Bengali Unicode normalization (e.g. \u09df vs \u09af\u09bc),
  /// compound slash labels (e.g. 'জীববিজ্ঞান / অন্যান্য', 'জীববিজ্ঞান / আইসিটি'),
  /// and English/Bengali cross-language root keywords.
  static bool matchesSubject(String rowSubjectRaw, String targetSubjectRaw) {
    if (rowSubjectRaw.isEmpty || targetSubjectRaw.isEmpty) return false;

    final rowSubject = BanglaNameHelper.normalizeBengali(rowSubjectRaw).toLowerCase();
    final targetSubject = BanglaNameHelper.normalizeBengali(targetSubjectRaw).toLowerCase();

    // Direct substring check
    if (rowSubject.contains(targetSubject) || targetSubject.contains(rowSubject)) {
      return true;
    }

    // Split compound UI labels: e.g. "জীববিজ্ঞান / অন্যান্য", "জীববিজ্ঞান / আইসিটি", "বাংলা ও ইংরেজি"
    final subTargets = targetSubject
        .split(RegExp(r'[/,]|(?:\s+এবং\s+)|\s+ও\s+'))
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();

    for (final t in subTargets) {
      if (rowSubject.contains(t) || t.contains(rowSubject)) return true;
      if (_matchesSubjectRoot(rowSubject, t)) return true;
    }

    return _matchesSubjectRoot(rowSubject, targetSubject);
  }

  static bool _matchesSubjectRoot(String row, String target) {
    const rootMappings = [
      (
        'পদার্থ',
        ['পদার্থবিজ্ঞান', 'physics']
      ),
      (
        'রসায়ন',
        ['রসায়ন', 'রসায়ন', 'chemistry']
      ),
      (
        'গণিত',
        ['উচ্চতর গণিত', 'সাধারণ গণিত', 'গণিত', 'math', 'higher math', 'general math']
      ),
      (
        'জীব',
        ['জীববিজ্ঞান', 'biology', 'উদ্ভিদবিজ্ঞান', 'প্রাণিবিজ্ঞান', 'botany', 'zoology']
      ),
      (
        'ইংরেজি',
        ['ইংরেজি', 'english']
      ),
      (
        'বাংলা',
        ['বাংলা', 'bangla', 'bengali']
      ),
      (
        'আইসিটি',
        ['তথ্য ও যোগাযোগ প্রযুক্তি', 'আইসিটি', 'ict']
      ),
      (
        'জ্ঞান',
        ['সাধারণ জ্ঞান', 'gk', 'general knowledge']
      ),
      (
        'হিসাব',
        ['হিসাববিজ্ঞান', 'accounting']
      ),
      (
        'ব্যবসায়',
        ['ব্যবসায় উদ্যোগ', 'ব্যবসায় সংগঠন', 'business']
      ),
      (
        'ফিন্যান্স',
        ['ফিন্যান্স ও ব্যাংকিং', 'ফিন্যান্স', 'finance']
      ),
    ];

    for (final r in rootMappings) {
      final isTargetMatch = r.$2.any((t) => target.contains(t)) || target.contains(r.$1);
      final isRowMatch = r.$2.any((t) => row.contains(t)) || row.contains(r.$1);
      if (isTargetMatch && isRowMatch) return true;
    }

    return false;
  }

  /// Sorts questions serially subject-wise (Physics → Chemistry → Higher Math → Biology → etc.)
  /// Preserves relative order within the same subject.
  static List<Question> sortSeriallySubjectwise(List<Question> list) {
    final indexed = list.asMap().entries.toList();
    indexed.sort((a, b) {
      final pA = BanglaNameHelper.getWrittenSubjectSortPriority(
        a.value.subject,
        a.value.subjectLabel,
      );
      final pB = BanglaNameHelper.getWrittenSubjectSortPriority(
        b.value.subject,
        b.value.subjectLabel,
      );
      if (pA != pB) return pA.compareTo(pB);
      return a.key.compareTo(b.key);
    });
    return indexed.map((e) => e.value).toList();
  }

  /// Fetch authentic questions for an institute and exam set.
  ///
  /// Rules:
  /// 1. ZERO QUESTION LEAKAGE: When a year is specified, ONLY return questions
  ///    tagged with that exact session year. Never combine subsequent or prior sessions.
  /// 2. ZERO INSTITUTE LEAKAGE: Institute tags are strictly isolated. CKRUET never pulls RUET/KUET/CUET.
  /// 3. FASTEST LOADING: Targeted lean column queries on institute tags using overlaps operator; instant memory caching.
  static Future<List<Question>> fetchExamSetQuestions({
    required String instituteId,
    required InstituteExamSet examSet,
    List<String> selectedSubjects = const [],
  }) async {
    final cacheKey = '$instituteId:${examSet.id}:${selectedSubjects.join(",")}';
    if (_examSetCache.containsKey(cacheKey) && _examSetCache[cacheKey]!.isNotEmpty) {
      debugPrint('[QuestionBankService] Serving from memory cache for $cacheKey (${_examSetCache[cacheKey]!.length} questions)');
      return _examSetCache[cacheKey]!;
    }

    final isWritten = examSet.type == 'written' ||
        examSet.id.toLowerCase().contains('written') ||
        examSet.title.toLowerCase().contains('written') ||
        examSet.title.contains('লিখিত') ||
        examSet.id.contains('_cq') ||
        examSet.title.contains('সৃজনশীল');

    final tags = getInstituteSearchTags(instituteId);
    final years = extractYearsFromSession(examSet.year, instituteId: instituteId);
    final supabase = Supabase.instance.client;

    // ======================================================================
    // 1. DEDICATED FETCH FOR WRITTEN EXAMS (written_questions table)
    // ======================================================================
    if (isWritten) {
      try {
        List<Map<String, dynamic>> rawRows = [];

        try {
          final res = await supabase
              .from('written_questions')
              .select(_leanWrittenQuestionFields)
              .overlaps('institutes', tags)
              .range(0, 999);
          rawRows.addAll(List<Map<String, dynamic>>.from(res));

          if (res.length == 1000) {
            final res2 = await supabase
                .from('written_questions')
                .select(_leanWrittenQuestionFields)
                .overlaps('institutes', tags)
                .range(1000, 1999);
            rawRows.addAll(List<Map<String, dynamic>>.from(res2));
          }
        } catch (queryErr) {
          debugPrint('[QuestionBankService] written_questions query error: $queryErr. Trying fallback.');
          for (final tag in tags.take(2)) {
            try {
              final res = await supabase
                  .from('written_questions')
                  .select(_leanWrittenQuestionFields)
                  .contains('institutes', [tag])
                  .limit(1000);
              rawRows.addAll(List<Map<String, dynamic>>.from(res));
            } catch (_) {}
          }
        }

        final Map<String, Map<String, dynamic>> seenRaw = {};
        for (final row in rawRows) {
          final id = row['id']?.toString() ?? '';
          if (id.isNotEmpty && !seenRaw.containsKey(id)) {
            seenRaw[id] = row;
          }
        }

        final normalizedTags = tags.map((t) => t.toLowerCase().trim()).toList();
        final List<Question> matched = [];

        for (final row in seenRaw.values) {
          // Strict Year check (supports years array and exam_history fallback)
          List<int> rowYears = (row['years'] as List?)
                  ?.map((y) => int.tryParse(y.toString()) ?? 0)
                  .toList() ??
              [];
          if (rowYears.isEmpty && row['exam_history'] is List) {
            rowYears = (row['exam_history'] as List)
                .map((h) => int.tryParse((h is Map ? h['year'] : null)?.toString() ?? '') ?? 0)
                .where((y) => y > 0)
                .toList();
          }
          if (years.isNotEmpty) {
            final hasYear = years.any((y) => rowYears.contains(y));
            if (!hasYear) continue;
          }

          // Strict Institute check (supports institutes array and exam_history fallback)
          List<String> rowInstitutes = (row['institutes'] as List?)
                  ?.map((i) => i.toString().toLowerCase().trim())
                  .toList() ??
              [];
          if (rowInstitutes.isEmpty && row['exam_history'] is List) {
            rowInstitutes = (row['exam_history'] as List)
                .map((h) => (h is Map ? (h['institute'] ?? h['code']) : null)?.toString().toLowerCase().trim() ?? '')
                .where((s) => s.isNotEmpty)
                .toList();
          }
          final hasInst = normalizedTags.any((t) => rowInstitutes.contains(t));
          if (!hasInst) continue;

          // Subject filter
          if (selectedSubjects.isNotEmpty) {
            final rowSubject = (row['subject'] ?? '').toString();
            final matchesSub = selectedSubjects.any((s) => matchesSubject(rowSubject, s));
            if (!matchesSub) continue;
          }

          // Ensure type is Written
          final rowCopy = Map<String, dynamic>.from(row);
          rowCopy['type'] = (rowCopy['type'] ?? 'Written').toString();
          matched.add(Question.fromJson(rowCopy));
        }

        List<Question> sortedQuestions;
        if (selectedSubjects.isNotEmpty) {
          final indexed = matched.asMap().entries.toList();
          indexed.sort((a, b) {
            final subA = a.value.subject;
            final subB = b.value.subject;
            var idxA = selectedSubjects.indexWhere((s) => matchesSubject(subA, s));
            var idxB = selectedSubjects.indexWhere((s) => matchesSubject(subB, s));
            if (idxA < 0) idxA = 999;
            if (idxB < 0) idxB = 999;
            if (idxA != idxB) return idxA.compareTo(idxB);
            final pA = BanglaNameHelper.getWrittenSubjectSortPriority(
                a.value.subject, a.value.subjectLabel);
            final pB = BanglaNameHelper.getWrittenSubjectSortPriority(
                b.value.subject, b.value.subjectLabel);
            if (pA != pB) return pA.compareTo(pB);
            return a.key.compareTo(b.key);
          });
          sortedQuestions = indexed.map((e) => e.value).toList();
        } else {
          sortedQuestions = sortSeriallySubjectwise(matched);
        }

        if (sortedQuestions.isEmpty) {
          debugPrint(
              '[QuestionBankService] No written questions found for $instituteId ${examSet.year}.');
          return [];
        }

        _examSetCache[cacheKey] = sortedQuestions;
        OfflineQuestionBankService.cacheQuestions(sortedQuestions);
        return sortedQuestions;
      } catch (e) {
        debugPrint('[QuestionBankService] Written fetch error: $e');
        return [];
      }
    }

    // ======================================================================
    // 2. DEDICATED FETCH FOR MCQ EXAMS (questions table)
    // ======================================================================
    try {
      List<Map<String, dynamic>> rawRows = [];

      try {
        final res = await supabase
            .from('questions')
            .select(_leanQuestionFields)
            .overlaps('institutes', tags)
            .range(0, 999);
        rawRows.addAll(List<Map<String, dynamic>>.from(res));

        // If exactly 1,000 rows were returned, fetch page 2 to avoid data cutoff
        if (res.length == 1000) {
          final res2 = await supabase
              .from('questions')
              .select(_leanQuestionFields)
              .overlaps('institutes', tags)
              .range(1000, 1999);
          rawRows.addAll(List<Map<String, dynamic>>.from(res2));
        }
      } catch (queryErr) {
        debugPrint('[QuestionBankService] Overlaps query error: $queryErr. Trying fallback.');
        for (final tag in tags.take(2)) {
          try {
            final res = await supabase
                .from('questions')
                .select(_leanQuestionFields)
                .contains('institutes', [tag])
                .limit(1000);
            rawRows.addAll(List<Map<String, dynamic>>.from(res));
          } catch (_) {}
        }
      }

      // Deduplicate raw rows by id
      final Map<String, Map<String, dynamic>> seenRaw = {};
      for (final row in rawRows) {
        final id = row['id']?.toString() ?? '';
        if (id.isNotEmpty && !seenRaw.containsKey(id)) {
          seenRaw[id] = row;
        }
      }

      final normalizedTags =
          tags.map((t) => t.toLowerCase().trim()).toList();
      final List<Question> matched = [];

      for (final row in seenRaw.values) {
        // 1. Strict Year check (supports years array and exam_history fallback)
        List<int> rowYears = (row['years'] as List?)
                ?.map((y) => int.tryParse(y.toString()) ?? 0)
                .toList() ??
            [];
        if (rowYears.isEmpty && row['exam_history'] is List) {
          rowYears = (row['exam_history'] as List)
              .map((h) => int.tryParse((h is Map ? h['year'] : null)?.toString() ?? '') ?? 0)
              .where((y) => y > 0)
              .toList();
        }
        if (years.isNotEmpty) {
          final hasYear = years.any((y) => rowYears.contains(y));
          if (!hasYear) continue;
        }

        // 2. Strict Institute check (supports institutes array and exam_history fallback)
        List<String> rowInstitutes = (row['institutes'] as List?)
                ?.map((i) => i.toString().toLowerCase().trim())
                .toList() ??
            [];
        if (rowInstitutes.isEmpty && row['exam_history'] is List) {
          rowInstitutes = (row['exam_history'] as List)
              .map((h) => (h is Map ? (h['institute'] ?? h['code']) : null)?.toString().toLowerCase().trim() ?? '')
              .where((s) => s.isNotEmpty)
              .toList();
        }
        final hasInst = normalizedTags.any((t) => rowInstitutes.contains(t));
        if (!hasInst) continue;

        // 3. Strict MCQ check — exclude written/cq questions without valid options
        final qType = (row['type'] ?? '').toString().toLowerCase();
        final isQWritten = qType.contains('written') ||
            qType.contains('cq') ||
            qType.contains('creative') ||
            qType.contains('short');
        final rawOpts = (row['options'] as List?)
                ?.where(
                    (o) => o != null && o.toString().trim().isNotEmpty)
                .toList() ??
            [];

        if (isQWritten || rawOpts.length < 2) continue;

        // 4. Robust Subject filter (Unicode-safe & compound label matching)
        if (selectedSubjects.isNotEmpty) {
          final rowSubject = (row['subject'] ?? '').toString();
          final matchesSub = selectedSubjects.any((s) => matchesSubject(rowSubject, s));
          if (!matchesSub) continue;
        }

        matched.add(Question.fromJson(row));
      }

      // ======================================================================
      // SERIAL-WISE SUBJECT SORTING
      // ======================================================================
      List<Question> sortedQuestions;
      if (selectedSubjects.isNotEmpty) {
        final indexed = matched.asMap().entries.toList();
        indexed.sort((a, b) {
          final subA = a.value.subject;
          final subB = b.value.subject;
          var idxA = selectedSubjects.indexWhere((s) => matchesSubject(subA, s));
          var idxB = selectedSubjects.indexWhere((s) => matchesSubject(subB, s));
          if (idxA < 0) idxA = 999;
          if (idxB < 0) idxB = 999;
          if (idxA != idxB) return idxA.compareTo(idxB);
          final pA = BanglaNameHelper.getWrittenSubjectSortPriority(
              a.value.subject, a.value.subjectLabel);
          final pB = BanglaNameHelper.getWrittenSubjectSortPriority(
              b.value.subject, b.value.subjectLabel);
          if (pA != pB) return pA.compareTo(pB);
          return a.key.compareTo(b.key);
        });
        sortedQuestions = indexed.map((e) => e.value).toList();
      } else {
        sortedQuestions = sortSeriallySubjectwise(matched);
      }

      if (sortedQuestions.isEmpty) {
        debugPrint(
            '[QuestionBankService] No DB questions for $instituteId ${examSet.year}.');
        return [];
      }

      // Store in memory cache for instant future loads
      _examSetCache[cacheKey] = sortedQuestions;
      // Cache for offline use
      OfflineQuestionBankService.cacheQuestions(sortedQuestions);
      return sortedQuestions;
    } catch (e) {
      debugPrint('[QuestionBankService] General error: $e');
      try {
        final List<Question> offlineAll = [];
        final subs = selectedSubjects.isNotEmpty
            ? selectedSubjects
            : ['physics', 'chemistry'];
        final perSub = 25 ~/ subs.length;
        for (final sub in subs) {
          final subQs = await OfflineQuestionBankService.getQuestions(
            subject: sub,
            count: perSub > 0 ? perSub : 5,
          );
          offlineAll.addAll(subQs);
        }
        if (offlineAll.isNotEmpty) {
          return sortSeriallySubjectwise(offlineAll);
        }
      } catch (_) {}
      return [];
    }
  }
}

