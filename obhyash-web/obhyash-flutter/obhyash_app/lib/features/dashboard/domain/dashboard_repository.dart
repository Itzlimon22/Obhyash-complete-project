import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supa;
import 'models.dart';

class DashboardRepository {
  final supa.SupabaseClient _supabase;

  DashboardRepository(this._supabase);

  // Replicating `getLeaderboardUsers`
  Future<List<LeaderboardUser>> getLeaderboardUsers(String level) async {
    try {
      final response = await _supabase
          .from('public_profiles')
          .select('id, name, xp, level, avatar_url, avatar_color')
          .eq('level', level)
          //.ilike('role', 'student') // If your view requires 'role' mapping
          .order('xp', ascending: false)
          .limit(10); // Limited to 10 for dashboard widget

      return (response as List)
          .map((json) => LeaderboardUser.fromJson(json))
          .toList();
    } catch (e) {
      debugPrint('DashboardRepository: getLeaderboardUsers Error: $e');
      return [];
    }
  }

  // Replicating `getSubjects`
  Future<List<Subject>> getSubjects({
    String? division,
    String? stream,
    String? optionalSubject,
  }) async {
    try {
      var query = _supabase.from('subjects').select('*');

      if (division != null && division != 'General') {
        query = query.or('division.eq.$division,division.eq.General');
      }

      if (stream != null) {
        // stream.ilike.%stream%,stream.is.null
        query = query.or('stream.ilike.%$stream%,stream.is.null');
      }

      final response = await query;

      final subjects = (response as List)
          .map((json) => Subject.fromJson(json))
          .toList();

      // Client side filtering for optional logic
      return subjects.where((sub) {
        final subName = sub.name.toLowerCase();
        final subId = sub.id.toLowerCase();

        final isBiology =
            subName.contains('biology') || subId.contains('biology');
        final isStatistics =
            subName.contains('statistics') || subId.contains('statistics');

        if (optionalSubject == 'Statistics') {
          if (isBiology) return false;
        } else {
          if (isStatistics) return false;
        }
        return true;
      }).toList();
    } catch (e) {
      debugPrint('DashboardRepository: getSubjects Error: $e');
      return [];
    }
  }

  // Fetching history required for SubjectStats calculation
  Future<List<ExamResult>> getUserHistory(String userId) async {
    try {
      final response = await _supabase
          .from('exam_results')
          .select(
            'id, subject, total_questions, correct_count, wrong_count, subject_label',
          )
          .eq('user_id', userId)
          .eq('status', 'evaluated');

      return (response as List)
          .map((json) => ExamResult.fromJson(json))
          .toList();
    } catch (e) {
      debugPrint('DashboardRepository: getUserHistory Error: $e');
      return [];
    }
  }
}
