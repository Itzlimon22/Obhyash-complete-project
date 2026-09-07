import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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

  /// Fetch authentic questions for an institute and exam set
  static Future<List<Question>> fetchExamSetQuestions({
    required String instituteId,
    required InstituteExamSet examSet,
  }) async {
    final targetCount = examSet.questionCount > 0 ? examSet.questionCount : 25;
    final tags = getInstituteSearchTags(instituteId);
    final years = extractYearsFromSession(examSet.year);

    final List<Question> collected = [];
    final Set<String> seenIds = {};

    try {
      final supabase = Supabase.instance.client;

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
              if (!seenIds.contains(q.id)) {
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
              if (!seenIds.contains(q.id)) {
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
              if (!seenIds.contains(q.id)) {
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
            if (!seenIds.contains(q.id)) {
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
