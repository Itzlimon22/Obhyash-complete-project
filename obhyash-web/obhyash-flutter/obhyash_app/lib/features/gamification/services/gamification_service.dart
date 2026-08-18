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
        {'id': 'mission_speed_correct_10', 'title': 'কুইক স্প্রিন্টার', 'desc': 'যেকোনো পরীক্ষায় কমপক্ষে ১০টি সঠিক উত্তর দিয়ে সাবমিট করো', 'target': 10, 'xp': 20, 'icon': LucideIcons.sparkles, 'color': const Color(0xFF059669), 'type': 'correct'},
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

        return DailyQuest(
          id: id,
          title: m['title'] as String,
          description: m['desc'] as String,
          target: target,
          current: current.clamp(0, target),
          xpReward: m['xp'] as int,
          icon: m['icon'] as IconData,
          color: m['color'] as Color,
          isClaimed: claimedList.contains(id) || (prefs.getBool('quest_claimed_${userId}_${todayStr}_$id') ?? false),
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
        });
      } catch (_) {
        // Fallback: direct update
        await _supabase.rpc('increment_user_xp', params: {
          'p_user_id': userId,
          'p_xp': xpReward,
        });
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
    required int totalExamsCompleted,
    required int userStreak,
    required int latestScore,
    required int totalQuestions,
  }) async {
    final newUnlocked = <BadgeItem>[];

    try {
      final currentBadges = await getUserBadges(userId);
      final unlockedIds = currentBadges.where((b) => b.isUnlocked).map((b) => b.id).toSet();

      // Check conditions
      final toUnlock = <String>[];

      // First Step (1 exam)
      if (totalExamsCompleted >= 1 && !unlockedIds.contains('first_step')) {
        toUnlock.add('first_step');
      }

      // Perfect 100% Score
      if (totalQuestions > 0 && latestScore == totalQuestions && !unlockedIds.contains('centurion')) {
        toUnlock.add('centurion');
      }

      // Streak 3 Days
      if (userStreak >= 3 && !unlockedIds.contains('streak_3')) {
        toUnlock.add('streak_3');
      }

      // Streak 7 Days
      if (userStreak >= 7 && !unlockedIds.contains('streak_7')) {
        toUnlock.add('streak_7');
      }

      // 10 Exams Completed
      if (totalExamsCompleted >= 10 && !unlockedIds.contains('veteran_10')) {
        toUnlock.add('veteran_10');
      }

      // 50 Exams Completed
      if (totalExamsCompleted >= 50 && !unlockedIds.contains('master_50')) {
        toUnlock.add('master_50');
      }

      for (final badgeId in toUnlock) {
        try {
          await _supabase.from('user_badges').insert({
            'user_id': userId,
            'badge_id': badgeId,
          });

          final badgeItem = ObhyashBadges.allBadges.firstWhere((b) => b.id == badgeId);
          newUnlocked.add(badgeItem);

          // Trigger Celebration Dialog if context is mounted
          if (context.mounted) {
            CelebrationDialog.show(
              context,
              title: 'নতুন ব্যাজ অর্জিত! 🎉',
              subtitle: '${badgeItem.titleBangla} (${badgeItem.name}) - ${badgeItem.description}',
              badgeLabel: badgeItem.titleBangla,
              icon: badgeItem.icon,
              primaryColor: badgeItem.gradientStart,
              secondaryColor: badgeItem.gradientEnd,
              xpAwarded: 50,
            );
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
