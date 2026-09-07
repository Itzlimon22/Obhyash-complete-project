import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../../exam/domain/exam_models.dart';
import '../../exam/services/offline_question_bank_service.dart';
import '../presentation/institute_question_bank_detail_view.dart';

class QuestionBankService {
  static List<String> getInstituteSearchTags(String instituteId) {
    final id = instituteId.toLowerCase();
    switch (id) {
      case 'buet':
        return ['BUET', 'বুয়েট'];
      case 'ckruet':
        return ['CKRUET', 'RUET', 'KUET', 'CUET', 'গুচ্ছ ইঞ্জিঃ'];
      case 'ruet':
        return ['RUET', 'রুয়েট'];
      case 'kuet':
        return ['KUET', 'কুয়েট'];
      case 'cuet':
        return ['CUET', 'চুয়েট'];
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
      case 'agri':
        return ['GST', 'গুচ্ছ', 'কৃষি গুচ্ছ', 'Agri'];
      default:
        return [instituteId.toUpperCase()];
    }
  }

  static List<int> extractYearsFromSession(String yearStr) {
    final Set<int> years = {};
    final parts = yearStr.split(RegExp(r'[-/]'));
    for (final p in parts) {
      final num = int.tryParse(p.trim());
      if (num != null) {
        if (num < 100) {
          years.add(num > 50 ? 1900 + num : 2000 + num);
        } else {
          years.add(num);
        }
      }
    }
    return years.toList();
  }

  /// Sorts questions serially subject-wise (Physics -> Chemistry -> Higher Math -> Biology -> etc.)
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

  /// Fetch authentic questions for an institute and exam set
  static Future<List<Question>> fetchExamSetQuestions({
    required String instituteId,
    required InstituteExamSet examSet,
  }) async {
    final isWritten = examSet.type == 'written' ||
        examSet.id.toLowerCase().contains('written') ||
        examSet.title.toLowerCase().contains('written') ||
        examSet.title.contains('লিখিত');

    final targetCount = examSet.questionCount > 0 ? examSet.questionCount : 25;
    final tags = getInstituteSearchTags(instituteId);
    final years = extractYearsFromSession(examSet.year);

    final List<Question> collected = [];
    final Set<String> seenIds = {};

    try {
      final supabase = Supabase.instance.client;

      // ======================================================================
      // 1. WRITTEN EXAM PIPELINE (BUET / QB Written Exams)
      // Strictly filter type == 'written' FIRST, then apply other filters.
      // NO MCQs allowed under any circumstances.
      // Serially grouped subject-wise (Physics -> Chemistry -> Math).
      // If a subject has fewer questions, keep as is without mixing.
      // ======================================================================
      if (isWritten) {
        final writtenTypes = ['written', 'Written', 'WRITTEN', 'লিখিত'];

        // Tier 1: type == 'written' FIRST, then institute tags + exact years
        if (years.isNotEmpty) {
          try {
            final res = await supabase
                .from('questions')
                .select('*')
                .inFilter('type', writtenTypes)
                .overlaps('institutes', tags)
                .overlaps('years', years)
                .limit(targetCount * 2);

            if (res.isNotEmpty) {
              for (final row in res) {
                final q = Question.fromJson(row);
                if (q.isStrictWritten && !seenIds.contains(q.id)) {
                  seenIds.add(q.id);
                  collected.add(q);
                }
              }
            }
          } catch (e) {
            debugPrint('[QuestionBankService] Written Tier 1 error: $e');
          }
        }

        // Tier 2: type == 'written' FIRST, then general institute questions
        if (collected.length < targetCount) {
          final needed = targetCount - collected.length;
          try {
            final res = await supabase
                .from('questions')
                .select('*')
                .inFilter('type', writtenTypes)
                .overlaps('institutes', tags)
                .limit(needed * 3);

            if (res.isNotEmpty) {
              for (final row in res) {
                final q = Question.fromJson(row);
                if (q.isStrictWritten && !seenIds.contains(q.id)) {
                  seenIds.add(q.id);
                  collected.add(q);
                }
                if (collected.length >= targetCount) break;
              }
            }
          } catch (e) {
            debugPrint('[QuestionBankService] Written Tier 2 error: $e');
          }
        }

        // Tier 2b: Search questions where type is written in general engineering pool if institute empty
        if (collected.length < targetCount) {
          final needed = targetCount - collected.length;
          try {
            final res = await supabase
                .from('questions')
                .select('*')
                .inFilter('type', writtenTypes)
                .ilike('exam_type', '%Engineering%')
                .limit(needed * 2);

            if (res.isNotEmpty) {
              for (final row in res) {
                final q = Question.fromJson(row);
                if (q.isStrictWritten && !seenIds.contains(q.id)) {
                  seenIds.add(q.id);
                  collected.add(q);
                }
                if (collected.length >= targetCount) break;
              }
            }
          } catch (e) {
            debugPrint('[QuestionBankService] Written Tier 2b error: $e');
          }
        }

        // STRICT SAFETY CHECK: Discard ANY question that has MCQ options or is an MCQ
        final strictlyWritten = collected.where((q) {
          if (!q.isStrictWritten) return false;
          if (q.isAdmissionStandardMcq || q.isStrictMcq) return false;
          final nonEmptyOptions = q.options.where((opt) => opt.trim().isNotEmpty).toList();
          if (nonEmptyOptions.length >= 2) return false;
          return true;
        }).toList();

        // Sort serially subject-wise (Physics -> Chemistry -> Higher Math -> Biology -> etc.)
        final sortedWritten = sortSeriallySubjectwise(strictlyWritten);

        // Cache for offline use
        if (sortedWritten.isNotEmpty) {
          OfflineQuestionBankService.cacheQuestions(sortedWritten);
        }

        // Return strictly written questions sorted serially subject-wise.
        // No mixing of other subjects or MCQs even if count is less than target.
        return sortedWritten.take(targetCount).toList();
      }

      // ======================================================================
      // 2. MCQ / ADMISSION EXAM PIPELINE
      // ======================================================================
      // 1. Tier 1: Institute tags + exact years
      if (years.isNotEmpty) {
        try {
          final res = await supabase
              .from('questions')
              .select('*')
              .overlaps('institutes', tags)
              .overlaps('years', years)
              .limit(targetCount * 2);

          if (res.isNotEmpty) {
            for (final row in res) {
              final q = Question.fromJson(row);
              if (q.isAdmissionStandardMcq && !seenIds.contains(q.id)) {
                seenIds.add(q.id);
                collected.add(q);
              }
            }
          }
        } catch (e) {
          debugPrint('[QuestionBankService] Tier 1 query error: $e');
        }
      }

      // 2. Tier 2: General institute questions
      if (collected.length < targetCount) {
        final needed = targetCount - collected.length;
        try {
          final res = await supabase
              .from('questions')
              .select('*')
              .overlaps('institutes', tags)
              .limit(needed * 3);

          if (res.isNotEmpty) {
            for (final row in res) {
              final q = Question.fromJson(row);
              if (q.isAdmissionStandardMcq && !seenIds.contains(q.id)) {
                seenIds.add(q.id);
                collected.add(q);
              }
              if (collected.length >= targetCount) break;
            }
          }
        } catch (e) {
          debugPrint('[QuestionBankService] Tier 2 query error: $e');
        }
      }

      // 3. Tier 3: Admission standard questions pool
      if (collected.length < targetCount) {
        final needed = targetCount - collected.length;
        try {
          final res = await supabase
              .from('questions')
              .select('*')
              .ilike('exam_type', '%Admission%')
              .limit(needed * 2);

          if (res.isNotEmpty) {
            for (final row in res) {
              final q = Question.fromJson(row);
              if (q.isAdmissionStandardMcq && !seenIds.contains(q.id)) {
                seenIds.add(q.id);
                collected.add(q);
              }
              if (collected.length >= targetCount) break;
            }
          }
        } catch (e) {
          debugPrint('[QuestionBankService] Tier 3 query error: $e');
        }
      }

      // 4. Tier 4: Offline question bank cache
      if (collected.length < targetCount) {
        final needed = targetCount - collected.length;
        for (final sub in ['physics', 'chemistry', 'higher_math', 'biology']) {
          if (collected.length >= targetCount) break;
          final offlineQs = await OfflineQuestionBankService.getQuestions(
            subject: sub,
            count: needed,
          );
          for (final q in offlineQs) {
            if (q.isAdmissionStandardMcq && !seenIds.contains(q.id)) {
              seenIds.add(q.id);
              collected.add(q);
            }
            if (collected.length >= targetCount) break;
          }
        }
      }

      // 5. Cache fetched questions for future offline availability
      if (collected.isNotEmpty) {
        OfflineQuestionBankService.cacheQuestions(collected);
      }

      return collected.take(targetCount).toList();
    } catch (e) {
      debugPrint('[QuestionBankService] General error: $e');
      return collected;
    }
  }
}
