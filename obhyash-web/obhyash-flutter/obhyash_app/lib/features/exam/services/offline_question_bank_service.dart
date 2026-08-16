import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/exam_models.dart';

class OfflineQuestionBankService {
  static const String _kOfflineBankKey = 'obhyash_offline_question_bank_v1';
  static const int _kMaxQuestionsPerSubject = 200; // ~200 KB per subject

  /// Store a list of questions into the local offline question bank
  static Future<void> cacheQuestions(List<Question> questions) async {
    if (questions.isEmpty) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final existingJson = prefs.getString(_kOfflineBankKey);

      Map<String, dynamic> bank = {};
      if (existingJson != null && existingJson.isNotEmpty) {
        bank = jsonDecode(existingJson) as Map<String, dynamic>;
      }

      for (final q in questions) {
        final subjectKey = q.subject.toLowerCase().trim();
        List<dynamic> subjectQuestions = bank[subjectKey] is List ? bank[subjectKey] : [];

        // Check if question already exists by id
        final existingIdx = subjectQuestions.indexWhere((item) => item['id'] == q.id);
        if (existingIdx != -1) {
          subjectQuestions[existingIdx] = q.toJson();
        } else {
          subjectQuestions.add(q.toJson());
        }

        // Limit per subject to maintain ultra-lightweight storage (~200 questions max)
        if (subjectQuestions.length > _kMaxQuestionsPerSubject) {
          subjectQuestions = subjectQuestions.sublist(subjectQuestions.length - _kMaxQuestionsPerSubject);
        }

        bank[subjectKey] = subjectQuestions;
      }

      await prefs.setString(_kOfflineBankKey, jsonEncode(bank));
      debugPrint('[OfflineQuestionBankService] Cached ${questions.length} questions offline.');
    } catch (e) {
      debugPrint('[OfflineQuestionBankService] Error caching questions: $e');
    }
  }

  /// Get random questions from offline cache for an exam/practice
  static Future<List<Question>> getQuestions({
    required String subject,
    List<String>? chapters,
    int count = 25,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final existingJson = prefs.getString(_kOfflineBankKey);
      if (existingJson == null || existingJson.isEmpty) return [];

      final bank = jsonDecode(existingJson) as Map<String, dynamic>;
      final subjectKey = subject.toLowerCase().trim();
      final subjectQuestions = bank[subjectKey] is List ? (bank[subjectKey] as List) : [];

      if (subjectQuestions.isEmpty) {
        // Fallback: check other subjects or all questions if specific subject is empty
        final all = <dynamic>[];
        bank.forEach((k, v) {
          if (v is List) all.addAll(v);
        });
        if (all.isEmpty) return [];
        all.shuffle();
        return all
            .take(count)
            .map((e) => Question.fromJson(e as Map<String, dynamic>))
            .toList();
      }

      List<Question> parsed = subjectQuestions
          .map((e) => Question.fromJson(e as Map<String, dynamic>))
          .toList();

      // Filter and balance by chapter if provided
      if (chapters != null && chapters.isNotEmpty) {
        final chapterMatches = parsed.where((q) {
          final qCh = q.chapter.toLowerCase().trim();
          return chapters.any(
            (c) => qCh == c.toLowerCase().trim() ||
                   qCh.contains(c.toLowerCase().trim()) ||
                   c.toLowerCase().trim().contains(qCh),
          );
        }).toList();

        if (chapterMatches.isNotEmpty) {
          return balanceQuestionsByChapter(chapterMatches, count, chapters);
        }
      }

      parsed.shuffle();
      return parsed.take(count).toList();
    } catch (e) {
      debugPrint('[OfflineQuestionBankService] Error getting offline questions: $e');
      return [];
    }
  }

  /// Balanced Stratified Question Sampler across chapters
  static List<Question> balanceQuestionsByChapter(
    List<Question> questions,
    int targetCount,
    List<String>? targetChapters,
  ) {
    if (questions.isEmpty) return [];
    if (targetChapters == null || targetChapters.length <= 1 || questions.length <= targetCount) {
      final list = List<Question>.from(questions)..shuffle();
      return list.take(targetCount).toList();
    }

    final Map<String, List<Question>> buckets = {};
    for (final ch in targetChapters) {
      buckets[ch.trim()] = [];
    }
    final List<Question> generalPool = [];

    for (final q in questions) {
      final qCh = q.chapter.trim().toLowerCase();
      String? matchedChapter;
      for (final c in targetChapters) {
        if (c.trim().toLowerCase() == qCh || qCh.contains(c.trim().toLowerCase())) {
          matchedChapter = c.trim();
          break;
        }
      }
      if (matchedChapter != null) {
        buckets[matchedChapter]!.add(q);
      } else {
        generalPool.add(q);
      }
    }

    final numCh = targetChapters.length;
    final baseQuota = targetCount ~/ numCh;
    int remainder = targetCount % numCh;

    final List<Question> selected = [];
    final List<Question> overflowPool = List.from(generalPool);

    buckets.forEach((chName, chapterQs) {
      final quota = baseQuota + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      final shuffled = List<Question>.from(chapterQs)..shuffle();
      final takeCount = quota < shuffled.length ? quota : shuffled.length;

      selected.addAll(shuffled.take(takeCount));
      if (shuffled.length > takeCount) {
        overflowPool.addAll(shuffled.skip(takeCount));
      }
    });

    if (selected.length < targetCount && overflowPool.isNotEmpty) {
      final needed = targetCount - selected.length;
      final extra = List<Question>.from(overflowPool)..shuffle();
      selected.addAll(extra.take(needed));
    }

    selected.shuffle();
    return selected.take(targetCount).toList();
  }

  /// Silently pre-fetch 30-50 questions in background when internet is available
  static Future<void> prefetchQuestionsInBackground(String subject) async {
    try {
      final sb = Supabase.instance.client;
      final data = await sb
          .from('questions')
          .select('*')
          .ilike('subject', '%$subject%')
          .limit(40);

      if (data.isNotEmpty) {
        final questions = data.map((e) => Question.fromJson(e)).toList();
        await cacheQuestions(questions);
      }
    } catch (e) {
      // Non-fatal background task
      debugPrint('[OfflineQuestionBankService] Background prefetch: $e');
    }
  }

  /// Get total count of offline cached questions across all subjects
  static Future<int> getTotalCachedQuestionCount() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final existingJson = prefs.getString(_kOfflineBankKey);
      if (existingJson == null) return 0;
      final bank = jsonDecode(existingJson) as Map<String, dynamic>;
      int total = 0;
      bank.forEach((k, v) {
        if (v is List) total += v.length;
      });
      return total;
    } catch (_) {
      return 0;
    }
  }
}
