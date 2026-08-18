import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../domain/gamification_models.dart';
import '../../../core/presentation/widgets/celebration_dialog.dart';

class GamificationService {
  static final SupabaseClient _supabase = Supabase.instance.client;

  /// ─── 1. Daily Quests ───────────────────────────────────────────────────────
  static Future<List<DailyQuest>> getDailyQuests(String userId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final todayStr = DateTime.now().toIso8601String().substring(0, 10);
      final todayStart = DateTime.parse('$todayStr 00:00:00Z');

      // Fetch today's exams for this user
      final examRes = await _supabase
          .from('exam_results')
          .select('correct_count, wrong_count, total_questions')
          .eq('user_id', userId)
          .gte('created_at', todayStart.toIso8601String());

      int examsToday = 0;
      int correctAnswersToday = 0;

      for (final r in (examRes as List)) {
        examsToday++;
        correctAnswersToday += (r['correct_count'] as num?)?.toInt() ?? 0;
      }

      // Check live exams today
      try {
        final liveRes = await _supabase
            .from('live_exam_attempts')
            .select('score')
            .eq('user_id', userId)
            .eq('status', 'submitted')
            .gte('submit_time', todayStart.toIso8601String());
        examsToday += (liveRes as List).length;
      } catch (_) {}

      // Check claimed quests today from DB or Local
      final claimedList = prefs.getStringList('claimed_quests_$todayStr') ?? [];

      return [
        DailyQuest(
          id: 'quest_exam',
          title: 'লক্ষ্যভেদ',
          description: 'আজকের যেকোনো ১টি পূর্ণাঙ্গ পরীক্ষা সম্পন্ন করো',
          target: 1,
          current: examsToday,
          xpReward: 30,
          icon: LucideIcons.target,
          color: const Color(0xFF059669),
          isClaimed: claimedList.contains('quest_exam'),
        ),
        DailyQuest(
          id: 'quest_correct',
          title: 'সূক্ষ্ম লক্ষ্য',
          description: 'আজ কমপক্ষে ১৫টি প্রশ্নের সঠিক উত্তর দাও',
          target: 15,
          current: correctAnswersToday,
          xpReward: 20,
          icon: LucideIcons.zap,
          color: const Color(0xFF0284C7),
          isClaimed: claimedList.contains('quest_correct'),
        ),
        DailyQuest(
          id: 'quest_streak',
          title: 'ধারাবাহিকতা',
          description: 'আজকের স্ট্রিক বজায় রাখো',
          target: 1,
          current: examsToday > 0 ? 1 : 0,
          xpReward: 20,
          icon: LucideIcons.flame,
          color: const Color(0xFFEA580C),
          isClaimed: claimedList.contains('quest_streak'),
        ),
      ];
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
          'uid': userId,
          'amount': xpReward,
        });
      }

      // 2. Mark local claimed
      claimedList.add(questId);
      await prefs.setStringList('claimed_quests_$todayStr', claimedList);
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

  /// Evaluates and unlocks badges after completing an exam
  static Future<BadgeItem?> checkAndUnlockBadges({
    required BuildContext? context,
    required String userId,
    required int correctCount,
    required int wrongCount,
    required int totalQuestions,
    required int currentStreak,
    required int currentXp,
  }) async {
    try {
      final unlockedBadges = await getUserBadges(userId);
      final existingUnlockedIds = unlockedBadges
          .where((b) => b.isUnlocked)
          .map((b) => b.id)
          .toSet();

      final now = DateTime.now();
      String? newlyUnlockedBadgeId;

      // 1. Inception (first_step)
      if (!existingUnlockedIds.contains('first_step')) {
        newlyUnlockedBadgeId = 'first_step';
      }
      // 2. Precision Master (100% correct with at least 5 questions)
      else if (!existingUnlockedIds.contains('precision_master') &&
          totalQuestions >= 5 &&
          correctCount == totalQuestions) {
        newlyUnlockedBadgeId = 'precision_master';
      }
      // 3. Night Owl (after 11 PM or before 4 AM)
      else if (!existingUnlockedIds.contains('night_owl') &&
          (now.hour >= 23 || now.hour < 4)) {
        newlyUnlockedBadgeId = 'night_owl';
      }
      // 4. Unbroken Flame (streak >= 7)
      else if (!existingUnlockedIds.contains('streak_7') && currentStreak >= 7) {
        newlyUnlockedBadgeId = 'streak_7';
      }
      // 5. Knowledge Sage (correct >= 50 in current or lifetime)
      else if (!existingUnlockedIds.contains('knowledge_sage') &&
          correctCount >= 25) {
        newlyUnlockedBadgeId = 'knowledge_sage';
      }
      // 6. Apex Legend (XP >= 5000)
      else if (!existingUnlockedIds.contains('apex_legend') && currentXp >= 5000) {
        newlyUnlockedBadgeId = 'apex_legend';
      }

      if (newlyUnlockedBadgeId != null) {
        // Save to DB
        try {
          await _supabase.from('user_badges').insert({
            'user_id': userId,
            'badge_id': newlyUnlockedBadgeId,
            'unlocked_at': DateTime.now().toUtc().toIso8601String(),
          });
        } catch (_) {}

        final badge = ObhyashBadges.allBadges.firstWhere(
          (b) => b.id == newlyUnlockedBadgeId,
        );

        // Show celebration popup if context is available
        if (context != null && context.mounted) {
          CelebrationDialog.show(
            context,
            title: 'নতুন ব্যাজ আনলক!',
            badgeLabel: badge.titleBangla,
            subtitle: badge.description,
            icon: badge.icon,
            primaryColor: badge.gradientStart,
            secondaryColor: badge.gradientEnd,
            xpAwarded: 50,
          );
        }

        return badge;
      }
    } catch (_) {}
    return null;
  }

  /// Detect level up
  static String calculateLevel(int xp) {
    if (xp >= 5000) return 'Legend';
    if (xp >= 3500) return 'Titan';
    if (xp >= 2000) return 'Warrior';
    if (xp >= 800) return 'Scout';
    return 'Rookie';
  }
}
