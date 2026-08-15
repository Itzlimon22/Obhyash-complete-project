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

      // Filter by chapter if provided
      if (chapters != null && chapters.isNotEmpty) {
        final chapterMatches = parsed.where((q) {
          return chapters.any(
            (c) => q.chapter.toLowerCase().contains(c.toLowerCase()) ||
                   c.toLowerCase().contains(q.chapter.toLowerCase()),
          );
        }).toList();

        if (chapterMatches.isNotEmpty) {
          parsed = chapterMatches;
        }
      }

      parsed.shuffle();
      return parsed.take(count).toList();
    } catch (e) {
      debugPrint('[OfflineQuestionBankService] Error getting offline questions: $e');
      return [];
    }
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
