import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../exam/domain/exam_models.dart';
import '../domain/spaced_repetition_model.dart';

class SpacedRepetitionService {
  static final SupabaseClient _supabase = Supabase.instance.client;

  /// Fetches 10 due questions for daily Leitner revision
  static Future<List<Question>> getDueQuestions({int limit = 10}) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return [];

      final res = await _supabase.rpc(
        'get_due_spaced_repetition_questions',
        params: {
          'p_user_id': user.id,
          'p_limit': limit,
        },
      );

      if (res is List) {
        return res.map((item) => Question.fromJson(Map<String, dynamic>.from(item))).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching spaced repetition due questions: $e');
      return [];
    }
  }

  /// Fetches 5-box Leitner statistics
  static Future<SpacedRepetitionStats> getStats([String? targetUserId]) async {
    try {
      final userId = targetUserId ?? _supabase.auth.currentUser?.id;
      if (userId == null) return SpacedRepetitionStats();

      final res = await _supabase.rpc(
        'get_user_spaced_repetition_stats',
        params: {'p_user_id': userId},
      );

      if (res is Map) {
        return SpacedRepetitionStats.fromJson(Map<String, dynamic>.from(res));
      }
      return SpacedRepetitionStats();
    } catch (e) {
      debugPrint('Error fetching spaced repetition stats: $e');
      return SpacedRepetitionStats();
    }
  }

  /// Submits completed 10-question session
  static Future<SpacedRepetitionSessionResult?> submitSession({
    required List<Map<String, dynamic>> answers,
  }) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return null;

      final res = await _supabase.rpc(
        'submit_spaced_repetition_session',
        params: {
          'p_user_id': user.id,
          'p_answers': answers,
        },
      );

      if (res is Map) {
        return SpacedRepetitionSessionResult.fromJson(Map<String, dynamic>.from(res));
      }
      return null;
    } catch (e) {
      debugPrint('Error submitting spaced repetition session: $e');
      return null;
    }
  }
}
