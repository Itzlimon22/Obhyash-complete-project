import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../domain/gamification_models.dart';
import '../../../core/presentation/widgets/celebration_dialog.dart';

class GamificationService {
  static final SupabaseClient _supabase = Supabase.instance.client;

  /// ─── 1. Daily Quests (2 Random Missions from 10 Master Missions Pool) ─────
  static Future<List<DailyQuest>> getDailyQuests(String userId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final now = DateTime.now();
      final todayStr = now.toIso8601String().substring(0, 10);
      final todayStart = DateTime.parse('$todayStr 00:00:00Z');

      // Fetch today's exams for this user
      final examRes = await _supabase
          .from('exam_results')
          .select('correct_count, wrong_count, total_questions, created_at')
          .eq('user_id', userId)
          .gte('created_at', todayStart.toIso8601String());

      int examsToday = 0;
      int correctAnswersToday = 0;
      int totalMcqsToday = 0;
      int accuracy80Count = 0;

      for (final r in (examRes as List)) {
        examsToday++;
        final c = (r['correct_count'] as num?)?.toInt() ?? 0;
        final w = (r['wrong_count'] as num?)?.toInt() ?? 0;
        final t = (r['total_questions'] as num?)?.toInt() ?? (c + w);
        correctAnswersToday += c;
        totalMcqsToday += (c + w);
        if (t > 0 && (c / t) >= 0.8) {
          accuracy80Count++;
        }
      }

      int liveAttemptsToday = 0;
      try {
        final liveRes = await _supabase
            .from('live_exam_attempts')
            .select('score, correct_count, wrong_count, submit_time')
            .eq('user_id', userId)
            .gte('submit_time', todayStart.toIso8601String());
        liveAttemptsToday = (liveRes as List).length;
        examsToday += liveAttemptsToday;
        for (final l in liveRes) {
          final c = (l['correct_count'] as num?)?.toInt() ?? 0;
          final w = (l['wrong_count'] as num?)?.toInt() ?? 0;
          correctAnswersToday += c;
          totalMcqsToday += (c + w);
        }
      } catch (_) {}

      // 10 Master Mission Pool Definitions
      final pool = [
        {'id': 'mission_exam_1', 'title': 'মডেল টেস্ট চ্যাম্পিয়ন', 'desc': 'আজকের যেকোনো ১টি পূর্ণাঙ্গ মডেল টেস্ট বা পরীক্ষা সম্পন্ন করো', 'target': 1, 'xp': 30, 'icon': LucideIcons.target, 'color': const Color(0xFF004633), 'type': 'exams'},
        {'id': 'mission_correct_15', 'title': 'নির্ভুল নিশানাবাজ', 'desc': 'আজ কমপক্ষে ১৫টি প্রশ্নের সঠিক উত্তর দাও', 'target': 15, 'xp': 25, 'icon': LucideIcons.zap, 'color': const Color(0xFFB91C1C), 'type': 'correct'},
        {'id': 'mission_correct_30', 'title': 'মাস্টার ব্রেইন', 'desc': 'আজ কমপক্ষে ৩০টি প্রশ্নের সঠিক উত্তর দিয়ে পারদর্শী হও', 'target': 30, 'xp': 40, 'icon': LucideIcons.award, 'color': const Color(0xFF4F46E5), 'type': 'correct'},
        {'id': 'mission_streak_1', 'title': 'অবিচল অনুশীলন', 'desc': 'আজকের ডেইলি পড়ার স্ট্রিক বজায় রাখো', 'target': 1, 'xp': 20, 'icon': LucideIcons.flame, 'color': const Color(0xFFD97706), 'type': 'streak'},
        {'id': 'mission_exam_2', 'title': 'ডাবল চ্যালেঞ্জ', 'desc': 'আজ যেকোনো ২টি ভিন্ন বিষয়ে পরীক্ষা সম্পন্ন করো', 'target': 2, 'xp': 45, 'icon': LucideIcons.layers, 'color': const Color(0xFF0F766E), 'type': 'exams'},
        {'id': 'mission_accuracy_80', 'title': 'পারফেকশনিস্ট', 'desc': 'যেকোনো একটি পরীক্ষায় ৮০% বা তার বেশি নির্ভুল স্কোর অর্জন করো', 'target': 1, 'xp': 35, 'icon': LucideIcons.checkCircle, 'color': const Color(0xFF7C3AED), 'type': 'acc80'},
        {'id': 'mission_live_practice', 'title': 'প্রতিযোগিতার মাঠে', 'desc': 'আজকের লাইভ এক্সাম বা কোনো অনুশীলনী পরীক্ষায় অংশগ্রহণ করো', 'target': 1, 'xp': 30, 'icon': LucideIcons.trophy, 'color': const Color(0xFFE11D48), 'type': 'live'},
        {'id': 'mission_speed_correct_10', 'title': 'কুইক স্প্রিন্টার', 'desc': 'যেকোনো পরীক্ষায় কমপক্ষে ১০টি সঠিক উত্তর দিয়ে সাবমিট করো', 'target': 10, 'xp': 20, 'icon': LucideIcons.zap, 'color': const Color(0xFF059669), 'type': 'correct'},
        {'id': 'mission_solve_40_mcqs', 'title': 'এমসিকিউ ম্যারাথন', 'desc': 'আজ সব মিলিয়ে মোট ৪০টি প্রশ্ন সমাধান করো', 'target': 40, 'xp': 40, 'icon': LucideIcons.bookOpen, 'color': const Color(0xFFEA580C), 'type': 'mcqs'},
        {'id': 'mission_correct_20', 'title': 'লক্ষ্য পূরণ', 'desc': 'আজ বিভিন্ন পরীক্ষায় মোট ২০টি প্রশ্নের সঠিক উত্তর দাও', 'target': 20, 'xp': 30, 'icon': LucideIcons.compass, 'color': const Color(0xFF2563EB), 'type': 'correct'},
      ];

      // Deterministic hash to pick 2 daily missions
      final combinedKey = "$userId-$todayStr";
      int hash = 0x811c9dc5;
      for (int i = 0; i < combinedKey.length; i++) {
        hash ^= combinedKey.codeUnitAt(i);
        hash = (hash * 0x01000193) & 0x7FFFFFFF;
      }
      final idx1 = hash % pool.length;
      int idx2 = ((hash ~/ pool.length) + 3) % pool.length;
      if (idx2 == idx1) {
        idx2 = (idx1 + 1) % pool.length;
      }

      final assigned = [pool[idx1], pool[idx2]];
      final claimedList = prefs.getStringList('claimed_quests_$todayStr') ?? [];

      // Fetch server claimed state
      final serverClaimed = <String>{};
      try {
        final stateRes = await _supabase
            .from('daily_quests_state')
            .select('claimed_ids, quest_date')
            .eq('user_id', userId)
            .order('quest_date', ascending: false)
            .limit(3);

        for (final row in stateRes) {
          final qDate = row['quest_date']?.toString();
          if (qDate == todayStr) {
            final claimed = row['claimed_ids'];
            if (claimed is List) {
              for (final c in claimed) {
                serverClaimed.add(c.toString());
              }
            }
          }
        }
      } catch (_) {}

      return assigned.map((m) {
        final id = m['id'] as String;
        final type = m['type'] as String;
        final target = m['target'] as int;
        int current = 0;

        if (type == 'exams') {
          current = examsToday;
        } else if (type == 'correct') {
          current = correctAnswersToday;
        } else if (type == 'streak') {
          current = examsToday > 0 ? 1 : 0;
        } else if (type == 'acc80') {
          current = accuracy80Count;
        } else if (type == 'live') {
          current = liveAttemptsToday;
        } else if (type == 'mcqs') {
          current = totalMcqsToday;
        }

        final isServerClaimed = serverClaimed.contains(id);
        final isLocalClaimed = claimedList.contains(id) || (prefs.getBool('quest_claimed_${userId}_${todayStr}_$id') ?? false);
        final isClaimed = isServerClaimed || isLocalClaimed;

        if (isServerClaimed && !isLocalClaimed) {
          prefs.setBool('quest_claimed_${userId}_${todayStr}_$id', true);
        }

        return DailyQuest(
          id: id,
          title: m['title'] as String,
          description: m['desc'] as String,
          target: target,
          current: current.clamp(0, target),
          xpReward: m['xp'] as int,
          icon: m['icon'] as IconData,
          color: m['color'] as Color,
          isClaimed: isClaimed,
        );
      }).toList();
    } catch (_) {
      return [];
    }
  }

  /// Claim a completed daily quest
  static Future<bool> claimDailyQuest({
    required String userId,
    required String questId,
    required int xpReward,
  }) async {
    try {
      final todayStr = DateTime.now().toIso8601String().substring(0, 10);
      final prefs = await SharedPreferences.getInstance();
      final claimedList = prefs.getStringList('claimed_quests_$todayStr') ?? [];

      if (claimedList.contains(questId)) return false;

      // 1. Try atomic RPC on Supabase
      try {
        await _supabase.rpc('claim_daily_quest', params: {
          'p_user_id': userId,
          'p_quest_id': questId,
          'p_xp_reward': xpReward,
          'p_quest_date': todayStr,
        });
      } catch (_) {
        try {
          await _supabase.rpc('claim_daily_quest', params: {
            'p_user_id': userId,
            'p_quest_id': questId,
            'p_xp_reward': xpReward,
          });
        } catch (_) {
          // Fallback: direct update
          await _supabase.rpc('increment_user_xp', params: {
            'p_user_id': userId,
            'p_xp': xpReward,
          });
        }
      }

      // 2. Mark local claimed
      claimedList.add(questId);
      await prefs.setStringList('claimed_quests_$todayStr', claimedList);
      await prefs.setBool('quest_claimed_${userId}_${todayStr}_$questId', true);
      return true;
    } catch (_) {
      return false;
    }
  }

  /// ─── 2. Milestone Badges ───────────────────────────────────────────────────
  static Future<List<BadgeItem>> getUserBadges(String userId) async {
    try {
      final data = await _supabase
          .from('user_badges')
          .select('badge_id, unlocked_at')
          .eq('user_id', userId);

      final unlockedMap = <String, DateTime>{};
      for (final r in (data as List)) {
        final bId = r['badge_id'] as String;
        final unAt = DateTime.tryParse(r['unlocked_at']?.toString() ?? '') ?? DateTime.now();
        unlockedMap[bId] = unAt;
      }

      // If user has no explicit user_badges rows, check public_profiles stats as fallback
      if (unlockedMap.isEmpty) {
        try {
          final prof = await _supabase
              .from('public_profiles')
              .select('xp, exams_taken, streak')
              .eq('id', userId)
              .maybeSingle();
          if (prof != null) {
            final xp = (prof['xp'] as num?)?.toInt() ?? 0;
            final exams = (prof['exams_taken'] as num?)?.toInt() ?? 0;
            final streak = (prof['streak'] as num?)?.toInt() ?? 0;

            final now = DateTime.now();
            if (exams >= 1) unlockedMap['first_step'] = now;
            if (streak >= 3) unlockedMap['streak_3'] = now;
            if (streak >= 7) unlockedMap['streak_7'] = now;
            if (exams >= 5) unlockedMap['precision_master'] = now;
            if (exams >= 10 || xp >= 1000) unlockedMap['knowledge_sage'] = now;
            if (exams >= 15) unlockedMap['speed_demon'] = now;
            if (exams >= 20) unlockedMap['night_owl'] = now;
            if (xp >= 5000) unlockedMap['apex_legend'] = now;
            if (xp >= 10000) unlockedMap['live_champion'] = now;
          }
        } catch (_) {}
      }

      return ObhyashBadges.allBadges.map((badge) {
        final isUnlocked = unlockedMap.containsKey(badge.id);
        return badge.copyWith(
          isUnlocked: isUnlocked,
          unlockedAt: unlockedMap[badge.id],
        );
      }).toList();
    } catch (_) {
      return ObhyashBadges.allBadges;
    }
  }

  /// Check and unlock new milestone badges after an exam submission
  static Future<List<BadgeItem>> checkAndUnlockBadges({
    required BuildContext context,
    required String userId,
    int? totalExamsCompleted,
    int? userStreak,
    int? latestScore,
    int? totalQuestions,
    int? timeTakenSeconds,
    String? examType,
    bool? isLiveExamTopper,
  }) async {
    final newUnlocked = <BadgeItem>[];

    try {
      final currentBadges = await getUserBadges(userId);
      final unlockedIds =
          currentBadges.where((b) => b.isUnlocked).map((b) => b.id).toSet();

      // Fetch accurate user stats from DB
      int totalExams = totalExamsCompleted ?? 0;
      int streak = userStreak ?? 0;
      int userXp = 0;
      int totalCorrectAnswers = 0;

      try {
        final userRow = await _supabase
            .from('users')
            .select('xp, streak_count')
            .eq('id', userId)
            .maybeSingle();
        if (userRow != null) {
          userXp = (userRow['xp'] as num?)?.toInt() ?? 0;
          final dbStreak = (userRow['streak_count'] as num?)?.toInt() ?? 0;
          if (dbStreak > streak) streak = dbStreak;
        }

        final examCountRes = await _supabase
            .from('exam_results')
            .select('correct_count')
            .eq('user_id', userId);
        final list = examCountRes as List;
        if (list.length > totalExams) totalExams = list.length;
        for (final r in list) {
          totalCorrectAnswers += (r['correct_count'] as num?)?.toInt() ?? 0;
        }
      } catch (_) {}

      final now = DateTime.now();
      final isNightTime = now.hour >= 23 || now.hour < 5;

      final toUnlock = <String>[];

      // 1. First Step (1 exam completed)
      if (totalExams >= 1 && !unlockedIds.contains('first_step')) {
        toUnlock.add('first_step');
      }

      // 2. Perfect Score (100% accuracy on >= 5 questions)
      if ((totalQuestions ?? 0) >= 5 &&
          (latestScore ?? 0) == totalQuestions &&
          !unlockedIds.contains('precision_master')) {
        toUnlock.add('precision_master');
      }

      // 3. Streak 3 Days
      if (streak >= 3 && !unlockedIds.contains('streak_3')) {
        toUnlock.add('streak_3');
      }

      // 4. Streak 7 Days
      if (streak >= 7 && !unlockedIds.contains('streak_7')) {
        toUnlock.add('streak_7');
      }

      // 5. Speed Demon (<= 60s and >= 80% accuracy)
      if ((timeTakenSeconds ?? 999) <= 60 &&
          (totalQuestions ?? 0) >= 5 &&
          ((latestScore ?? 0) / (totalQuestions ?? 1)) >= 0.8 &&
          !unlockedIds.contains('speed_demon')) {
        toUnlock.add('speed_demon');
      }

      // 6. Night Owl (Late night exam)
      if (isNightTime && !unlockedIds.contains('night_owl')) {
        toUnlock.add('night_owl');
      }

      // 7. Century Scholar (100+ correct questions)
      if (totalCorrectAnswers >= 100 &&
          !unlockedIds.contains('knowledge_sage')) {
        toUnlock.add('knowledge_sage');
      }

      // 8. Legend Trophy (5000+ XP)
      if (userXp >= 5000 && !unlockedIds.contains('apex_legend')) {
        toUnlock.add('apex_legend');
      }

      // 9. Live Exam Champion (Live exam participation & topper)
      if ((isLiveExamTopper == true || examType == 'live') &&
          !unlockedIds.contains('live_champion')) {
        toUnlock.add('live_champion');
      }

      for (final badgeId in toUnlock) {
        try {
          await _supabase.from('user_badges').upsert({
            'user_id': userId,
            'badge_id': badgeId,
            'unlocked_at': DateTime.now().toIso8601String(),
          });

          final badgeItem =
              ObhyashBadges.allBadges.firstWhere((b) => b.id == badgeId);
          newUnlocked.add(badgeItem);

          // Trigger Celebration Dialog with haptic feedback
          if (context.mounted) {
            await Future.delayed(const Duration(milliseconds: 300));
            if (context.mounted) {
              CelebrationDialog.show(
                context,
                title: 'নতুন ব্যাজ অর্জিত! 🏆',
                subtitle:
                    '${badgeItem.titleBangla} (${badgeItem.name})\n${badgeItem.description}',
                badgeLabel: badgeItem.titleBangla,
                icon: badgeItem.icon,
                primaryColor: badgeItem.gradientStart,
                secondaryColor: badgeItem.gradientEnd,
                xpAwarded: 50,
              );
            }
          }
        } catch (_) {}
      }
    } catch (_) {}

    return newUnlocked;
  }

  /// ─── 3. Weekly League Standings ─────────────────────────────────────────────
  static Future<List<LeagueUser>> getWeeklyLeague({
    String tier = 'all',
    int limit = 50,
  }) async {
    try {
      final res = await _supabase.rpc('get_weekly_league_standings', params: {
        'p_tier': tier,
        'p_limit': limit,
      });

      final list = <LeagueUser>[];
      int rank = 1;
      for (final r in (res as List)) {
        list.add(LeagueUser(
          userId: r['user_id'] ?? '',
          name: r['name'] ?? 'শিক্ষার্থী',
          avatarUrl: r['avatar_url'],
          avatarColor: r['avatar_color'] ?? '#004633',
          weeklyXp: (r['weekly_xp'] as num?)?.toInt() ?? 0,
          rank: rank++,
          leagueTier: r['league_tier'] ?? 'Gold',
        ));
      }
      return list;
    } catch (_) {
      return [];
    }
  }
}
