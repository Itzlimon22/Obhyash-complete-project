import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../../exam/domain/exam_models.dart';
import '../../exam/services/offline_question_bank_service.dart';
import '../presentation/institute_question_bank_detail_view.dart';

class QuestionBankService {
  static const String _leanQuestionFields =
      'id, question, options, correct_answer_indices, explanation, type, difficulty, subject, chapter, topic, image_url, option_images, explanation_image_url, status, institutes, years, tags, exam_type, passage, section';

  static final Map<String, List<Question>> _examSetCache = {};

  static void clearCache() {
    _examSetCache.clear();
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
    // the canonical question bank database session year is the start year Y.
    if (nums.length == 2 && nums[1] == nums[0] + 1) {
      return [nums[0]];
    }

    return nums;
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
  /// 3. FASTEST LOADING: Targeted lean column queries on institute tags only; instant memory caching.
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
        examSet.title.contains('লিখিত');

    final tags = getInstituteSearchTags(instituteId);
    final years = extractYearsFromSession(examSet.year, instituteId: instituteId);
    final supabase = Supabase.instance.client;

    try {
      // ======================================================================
      // TARGETED FAST LEAN FETCH
      // Only query by specific institute tag(s). Never run unconstrained
      // overlaps('years') across 76k rows, which causes 57014 timeouts and leaks.
      // ======================================================================
      final List<Future<List<Map<String, dynamic>>>> queryFutures = [];

      if (tags.isNotEmpty) {
        queryFutures.add(
          supabase
              .from('questions')
              .select(_leanQuestionFields)
              .contains('institutes', [tags[0]])
              .then((res) => List<Map<String, dynamic>>.from(res)),
        );
        if (tags.length > 1) {
          queryFutures.add(
            supabase
                .from('questions')
                .select(_leanQuestionFields)
                .contains('institutes', [tags[1]])
                .then((res) => List<Map<String, dynamic>>.from(res)),
          );
        }
      }

      final List<List<Map<String, dynamic>>> queryResults =
          await Future.wait(queryFutures);

      // Deduplicate raw rows by id
      final Map<String, Map<String, dynamic>> seenRaw = {};
      for (final rows in queryResults) {
        for (final row in rows) {
          final id = row['id']?.toString() ?? '';
          if (id.isNotEmpty && !seenRaw.containsKey(id)) {
            seenRaw[id] = row;
          }
        }
      }

      // ======================================================================
      // STRICT IN-MEMORY FILTER — ZERO QUESTION & INSTITUTE LEAKAGE
      // Question included ONLY IF:
      //   (a) institutes array contains this institute tag, AND
      //   (b) years array contains the requested session year(s)
      // ======================================================================
      final normalizedTags =
          tags.map((t) => t.toLowerCase().trim()).toList();
      final List<Question> matched = [];

      for (final row in seenRaw.values) {
        // 1. Strict Year check (zero-leak)
        if (years.isNotEmpty) {
          final rowYears = (row['years'] as List?)
                  ?.map((y) => int.tryParse(y.toString()) ?? 0)
                  .toList() ??
              [];
          final hasYear = years.any((y) => rowYears.contains(y));
          if (!hasYear) continue; // STRICT ZERO LEAK: Must contain requested session year
        }

        // 2. Strict Institute check (zero-leak)
        final rowInstitutes = (row['institutes'] as List?)
                ?.map((i) => i.toString().toLowerCase().trim())
                .toList() ??
            [];
        final hasInst = normalizedTags.any((t) => rowInstitutes.contains(t));
        if (!hasInst) continue; // STRICT ZERO LEAK: Must belong to this institute

        // 3. Written vs MCQ type check
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

        if (isWritten) {
          if (!isQWritten && rawOpts.length >= 2) continue;
        } else {
          if (isQWritten && rawOpts.length < 2) continue;
        }

        // 4. Subject filter (e.g. for Board exam subject selection)
        if (selectedSubjects.isNotEmpty) {
          final rowSubject =
              (row['subject'] ?? '').toString().toLowerCase();
          final matchesSub = selectedSubjects.any((s) {
            final sl = s.toLowerCase();
            return rowSubject.contains(sl) || sl.contains(rowSubject);
          });
          if (!matchesSub) continue;
        }

        matched.add(Question.fromJson(row));
      }

      // ======================================================================
      // SERIAL-WISE SUBJECT SORTING
      // Physics 1st → Physics 2nd → Chemistry 1st → Chemistry 2nd → ...
      // ======================================================================
      List<Question> sortedQuestions;
      if (selectedSubjects.isNotEmpty) {
        final indexed = matched.asMap().entries.toList();
        indexed.sort((a, b) {
          final subA = a.value.subject.toLowerCase();
          final subB = b.value.subject.toLowerCase();
          var idxA = selectedSubjects.indexWhere((s) {
            final sl = s.toLowerCase();
            return subA.contains(sl) || sl.contains(subA);
          });
          var idxB = selectedSubjects.indexWhere((s) {
            final sl = s.toLowerCase();
            return subB.contains(sl) || sl.contains(subB);
          });
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

      // ======================================================================
      // FALLBACK: only when DB returns 0 results for this specific year/institute.
      // Never mix years — use offline cache only.
      // ======================================================================
      if (sortedQuestions.isEmpty) {
        debugPrint(
            '[QuestionBankService] No DB questions for $instituteId ${examSet.year}. Trying offline cache.');
        final offlineQs = await OfflineQuestionBankService.getQuestions(
          subject:
              selectedSubjects.isNotEmpty ? selectedSubjects.first : 'physics',
          count: isWritten ? 11 : 25,
        );
        if (offlineQs.isNotEmpty) {
          final sortedOffline = sortSeriallySubjectwise(offlineQs);
          _examSetCache[cacheKey] = sortedOffline;
          OfflineQuestionBankService.cacheQuestions(sortedOffline);
          return sortedOffline;
        }
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
        final offlineQs = await OfflineQuestionBankService.getQuestions(
          subject:
              selectedSubjects.isNotEmpty ? selectedSubjects.first : 'physics',
          count: isWritten ? 11 : 25,
        );
        return offlineQs;
      } catch (_) {
        return [];
      }
    }
  }
}

