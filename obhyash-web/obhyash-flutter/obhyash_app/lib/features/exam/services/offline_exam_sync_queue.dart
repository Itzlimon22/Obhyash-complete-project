import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/exam_models.dart';
import '../../dashboard/services/streak_service.dart';
import '../../gamification/services/exam_xp_calculator.dart';

class OfflineExamSyncQueueService {
  static const String _kSyncQueueKey = 'obhyash_offline_exam_sync_queue_v1';

  /// Queue an offline evaluated exam to be synced when internet reconnects
  static Future<void> queueOfflineExam({
    required ExamResult result,
    required String userId,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final existingJson = prefs.getString(_kSyncQueueKey);

      List<dynamic> queue = [];
      if (existingJson != null && existingJson.isNotEmpty) {
        queue = jsonDecode(existingJson) as List<dynamic>;
      }

      final payload = {
        'user_id': userId,
        'result': result.toJson(),
        'queued_at': DateTime.now().toIso8601String(),
      };

      queue.add(payload);
      await prefs.setString(_kSyncQueueKey, jsonEncode(queue));
      debugPrint('[OfflineExamSyncQueue] Queued exam ${result.id} for sync.');
    } catch (e) {
      debugPrint('[OfflineExamSyncQueue] Error queuing offline exam: $e');
    }
  }

  /// Sync all pending offline exam attempts to Supabase
  static Future<int> syncPendingExams() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final existingJson = prefs.getString(_kSyncQueueKey);
      if (existingJson == null || existingJson.isEmpty) return 0;

      final queue = jsonDecode(existingJson) as List<dynamic>;
      if (queue.isEmpty) return 0;

      final sb = Supabase.instance.client;
      final session = await sb.auth.getSession();
      final currentUserId = sb.auth.currentUser?.id ?? session?.user.id;
      if (currentUserId == null) return 0;

      List<dynamic> remainingQueue = [];
      int syncedCount = 0;

      for (final item in queue) {
        try {
          final payload = item as Map<String, dynamic>;
          final uid = payload['user_id']?.toString() ?? currentUserId;
          final resultJson = payload['result'] as Map<String, dynamic>;
          final result = ExamResult.fromJson(resultJson);

          final questionsJson = result.questions.map((q) => q.toJson()).toList();
          final userAnswersJson = Map<String, dynamic>.fromEntries(
            result.userAnswers.entries.map((e) => MapEntry(e.key, e.value)),
          );

          await sb.from('exam_results').insert({
            'user_id': uid,
            'subject': result.subject,
            'subject_label': result.subjectLabel,
            'exam_type': result.examType,
            'date': result.date,
            'score': result.score,
            'total_marks': result.totalMarks,
            'correct_count': result.correctCount,
            'wrong_count': result.wrongCount,
            'time_taken': result.timeTaken,
            'total_questions': result.totalQuestions,
            'questions': questionsJson,
            'user_answers': userAnswersJson,
            'negative_marking': result.negativeMarking,
            'status': 'evaluated',
          });

          // Sync streak
          final streakData = await StreakService.syncStreak(uid);

          // Calculate and award comprehensive production XP
          final xpBreakdown = ExamXpCalculator.calculateExamXp(
            totalQuestions: result.totalQuestions,
            correctCount: result.correctCount,
            wrongCount: result.wrongCount,
            timeTakenSeconds: result.timeTaken,
            durationMinutes: 25,
            currentStreak: streakData.streakCount,
            isLiveExam: false,
          );
          final xpEarned = xpBreakdown.totalXpEarned;

          if (xpEarned > 0) {
            try {
              await sb.rpc('increment_user_xp', params: {
                'uid': uid,
                'amount': xpEarned,
              });
            } catch (_) {}
          }

          syncedCount++;
          debugPrint('[OfflineExamSyncQueue] Successfully synced offline exam ${result.id}');
        } catch (syncError) {
          debugPrint('[OfflineExamSyncQueue] Sync failed for item: $syncError');
          remainingQueue.add(item); // keep in queue to retry later
        }
      }

      await prefs.setString(_kSyncQueueKey, jsonEncode(remainingQueue));
      return syncedCount;
    } catch (e) {
      debugPrint('[OfflineExamSyncQueue] syncPendingExams error: $e');
      return 0;
    }
  }

  /// Alias for syncPendingExams
  static Future<int> syncOfflineExams() => syncPendingExams();

  /// Get pending sync count
  static Future<int> getPendingSyncCount() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final existingJson = prefs.getString(_kSyncQueueKey);
      if (existingJson == null) return 0;
      final queue = jsonDecode(existingJson) as List<dynamic>;
      return queue.length;
    } catch (_) {
      return 0;
    }
  }
}
