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

      if (division != null && division.isNotEmpty && division != 'General') {
        query = query.or('division.eq.$division,division.eq.General,division.is.null');
      }

      final response = await query;

      final rawSubjects = (response as List)
          .map((json) => Subject.fromJson(json))
          .toList();

      final streamUpper = stream?.toUpperCase() ?? '';

      // Client side filtering for stream, level & optional logic
      final filtered = rawSubjects.where((sub) {
        final subName = sub.name.toLowerCase();
        final subId = sub.id.toLowerCase();

        // Level / Stream safety check (HSC vs SSC)
        if (streamUpper.contains('SSC')) {
          if (subId.startsWith('hsc_') || subName.contains('hsc')) return false;
        } else if (streamUpper.contains('HSC')) {
          if (subId.startsWith('ssc_') || subName.contains('ssc')) return false;
        }

        final isBiology =
            subName.contains('biology') || subId.contains('biology') || subName.contains('জীববিজ্ঞান');
        final isStatistics =
            subName.contains('statistics') || subId.contains('statistics') || subName.contains('পরিসংখ্যান');

        if (optionalSubject != null && optionalSubject.isNotEmpty) {
          if (optionalSubject.toLowerCase().contains('stat')) {
            if (isBiology) return false;
          } else if (optionalSubject.toLowerCase().contains('bio')) {
            if (isStatistics) return false;
          }
        }
        return true;
      }).toList();

      // Sort by sortOrder from DB if available
      filtered.sort((a, b) {
        if (a.sortOrder != null && b.sortOrder != null && a.sortOrder != b.sortOrder) {
          return a.sortOrder!.compareTo(b.sortOrder!);
        }
        return a.name.compareTo(b.name);
      });

      return filtered;
    } catch (e) {
      debugPrint('DashboardRepository: getSubjects Error: $e');
      return [];
    }
  }

  // Fetching history required for SubjectStats calculation (capped with limit for 10k+ scalability)
  Future<List<ExamResult>> getUserHistory(String userId, {int limit = 150}) async {
    try {
      final response = await _supabase
          .from('exam_results')
          .select('id, subject, total_questions, correct_count, wrong_count, date')
          .eq('user_id', userId)
          .eq('status', 'evaluated')
          .order('created_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => ExamResult.fromJson(json))
          .toList();
    } catch (e) {
      debugPrint('DashboardRepository: getUserHistory Error: $e');
      return [];
    }
  }
}
