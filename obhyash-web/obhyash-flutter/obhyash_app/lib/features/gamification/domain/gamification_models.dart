import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// ─── Daily Quest Model ────────────────────────────────────────────────────────
class DailyQuest {
  final String id;
  final String title;
  final String description;
  final int target;
  final int current;
  final int xpReward;
  final IconData icon;
  final Color color;
  final bool isClaimed;

  const DailyQuest({
    required this.id,
    required this.title,
    required this.description,
    required this.target,
    required this.current,
    required this.xpReward,
    required this.icon,
    required this.color,
    this.isClaimed = false,
  });

  bool get isCompleted => current >= target;
  double get progress => target > 0 ? (current / target).clamp(0.0, 1.0) : 0.0;

  DailyQuest copyWith({
    int? current,
    bool? isClaimed,
  }) {
    return DailyQuest(
      id: id,
      title: title,
      description: description,
      target: target,
      current: current ?? this.current,
      xpReward: xpReward,
      icon: icon,
      color: color,
      isClaimed: isClaimed ?? this.isClaimed,
    );
  }
}

/// ─── Badge Item Model ─────────────────────────────────────────────────────────
class BadgeItem {
  final String id;
  final String name;
  final String titleBangla;
  final String description;
  final IconData icon;
  final String? svgAsset;
  final Color gradientStart;
  final Color gradientEnd;
  final bool isUnlocked;
  final DateTime? unlockedAt;

  const BadgeItem({
    required this.id,
    required this.name,
    required this.titleBangla,
    required this.description,
    required this.icon,
    this.svgAsset,
    required this.gradientStart,
    required this.gradientEnd,
    this.isUnlocked = false,
    this.unlockedAt,
  });

  BadgeItem copyWith({
    bool? isUnlocked,
    DateTime? unlockedAt,
  }) {
    return BadgeItem(
      id: id,
      name: name,
      titleBangla: titleBangla,
      description: description,
      icon: icon,
      svgAsset: svgAsset,
      gradientStart: gradientStart,
      gradientEnd: gradientEnd,
      isUnlocked: isUnlocked ?? this.isUnlocked,
      unlockedAt: unlockedAt ?? this.unlockedAt,
    );
  }
}

/// Predefined Badges in Obhyash (Conventional standard naming)
class ObhyashBadges {
  static const List<BadgeItem> allBadges = [
    BadgeItem(
      id: 'first_step',
      name: 'First Step',
      titleBangla: 'প্রথম পদক্ষেপ',
      description: 'প্রথম পরীক্ষা সফলভাবে সম্পন্ন করেছো',
      icon: LucideIcons.rocket,
      svgAsset: 'assets/dashboard-icons/badge_first_step.svg',
      gradientStart: Color(0xFF0284C7),
      gradientEnd: Color(0xFF0EA5E9),
    ),
    BadgeItem(
      id: 'precision_master',
      name: 'Perfect Score',
      titleBangla: 'পারফেক্ট স্কোর',
      description: 'যেকোনো পরীক্ষায় শতভাগ (১০০%) নির্ভুল স্কোর অর্জন',
      icon: LucideIcons.target,
      svgAsset: 'assets/dashboard-icons/badge_precision_master.svg',
      gradientStart: Color(0xFF059669),
      gradientEnd: Color(0xFF10B981),
    ),
    BadgeItem(
      id: 'streak_3',
      name: 'Habit Builder',
      titleBangla: '৩ দিনের স্ট্রিক',
      description: 'টানা ৩ দিন নিয়মিত পড়ার অভ্যাস বজায় রেখেছো',
      icon: LucideIcons.zap,
      svgAsset: 'assets/dashboard-icons/badge_streak_3.svg',
      gradientStart: Color(0xFFD97706),
      gradientEnd: Color(0xFFF59E0B),
    ),
    BadgeItem(
      id: 'streak_7',
      name: 'Streak Master',
      titleBangla: 'স্ট্রিক মাস্টার',
      description: 'টানা ৭ দিনের ধারাবাহিক পড়ার স্ট্রিক ধরে রেখেছো',
      icon: LucideIcons.flame,
      svgAsset: 'assets/dashboard-icons/badge_streak_7.svg',
      gradientStart: Color(0xFFEA580C),
      gradientEnd: Color(0xFFF97316),
    ),
    BadgeItem(
      id: 'speed_demon',
      name: 'Speed Star',
      titleBangla: 'স্পিড স্টার',
      description: '৬০ সেকেন্ডের মধ্যে ৮০%+ স্কোরে পরীক্ষা সম্পন্ন',
      icon: LucideIcons.timer,
      svgAsset: 'assets/dashboard-icons/badge_speed_demon.svg',
      gradientStart: Color(0xFF0891B2),
      gradientEnd: Color(0xFF06B6D4),
    ),
    BadgeItem(
      id: 'night_owl',
      name: 'Night Owl',
      titleBangla: 'নাইট আউল',
      description: 'রাত ১১টার পর গভীর মনোযোগে পরীক্ষা সম্পন্ন',
      icon: LucideIcons.moon,
      svgAsset: 'assets/dashboard-icons/badge_night_owl.svg',
      gradientStart: Color(0xFF7C3AED),
      gradientEnd: Color(0xFF8B5CF6),
    ),
    BadgeItem(
      id: 'knowledge_sage',
      name: 'Century Scholar',
      titleBangla: 'সেঞ্চুরি স্কলার',
      description: '১০০টির বেশি প্রশ্নের সঠিক উত্তর প্রদান করেছো',
      icon: LucideIcons.brain,
      svgAsset: 'assets/dashboard-icons/badge_knowledge_sage.svg',
      gradientStart: Color(0xFF9333EA),
      gradientEnd: Color(0xFFA855F7),
    ),
    BadgeItem(
      id: 'apex_legend',
      name: 'Legend Trophy',
      titleBangla: 'লিজেন্ড ট্রফি',
      description: '৫,০০০+ মোট XP অর্জন করে শীর্ষ স্তরে পৌঁছেছো',
      icon: LucideIcons.crown,
      svgAsset: 'assets/dashboard-icons/badge_apex_legend.svg',
      gradientStart: Color(0xFFE11D48),
      gradientEnd: Color(0xFFF43F5E),
    ),
    BadgeItem(
      id: 'live_champion',
      name: 'Live Arena Champion',
      titleBangla: 'লাইভ চ্যাম্পিয়ন',
      description: 'অফিসিয়াল লাইভ পরীক্ষায় অংশ নিয়ে শীর্ষস্থান ও বিজয় অর্জন',
      icon: LucideIcons.swords,
      svgAsset: 'assets/dashboard-icons/badge_live_champion.svg',
      gradientStart: Color(0xFFEAB308),
      gradientEnd: Color(0xFFEA580C),
    ),
  ];
}

/// ─── Unique Weekly League Tier Model ───────────────────────────────────────────
enum WeeklyLeagueTier {
  seeker(
    id: 'seeker',
    nameBangla: 'অনুসন্ধিৎসু',
    nameEnglish: 'Seeker',
    icon: LucideIcons.sprout,
    minXp: 0,
    color: Color(0xFF10B981),
  ),
  pioneer(
    id: 'pioneer',
    nameBangla: 'অগ্রপথিক',
    nameEnglish: 'Pioneer',
    icon: LucideIcons.zap,
    minXp: 800,
    color: Color(0xFF0284C7),
  ),
  conqueror(
    id: 'conqueror',
    nameBangla: 'দিগ্বিজয়ী',
    nameEnglish: 'Conqueror',
    icon: LucideIcons.shield,
    minXp: 2000,
    color: Color(0xFF8B5CF6),
  ),
  luminary(
    id: 'luminary',
    nameBangla: 'মেধাবী',
    nameEnglish: 'Luminary',
    icon: LucideIcons.award,
    minXp: 3500,
    color: Color(0xFFF59E0B),
  ),
  apex(
    id: 'apex',
    nameBangla: 'শীর্ষসেনা',
    nameEnglish: 'Apex',
    icon: LucideIcons.crown,
    minXp: 5000,
    color: Color(0xFFEF4444),
  );

  final String id;
  final String nameBangla;
  final String nameEnglish;
  final IconData icon;
  final int minXp;
  final Color color;

  const WeeklyLeagueTier({
    required this.id,
    required this.nameBangla,
    required this.nameEnglish,
    required this.icon,
    required this.minXp,
    required this.color,
  });

  static WeeklyLeagueTier fromXp(int xp) {
    if (xp >= 5000) return WeeklyLeagueTier.apex;
    if (xp >= 3500) return WeeklyLeagueTier.luminary;
    if (xp >= 2000) return WeeklyLeagueTier.conqueror;
    if (xp >= 800) return WeeklyLeagueTier.pioneer;
    return WeeklyLeagueTier.seeker;
  }
}

/// ─── Celebration Type ─────────────────────────────────────────────────────────
enum CelebrationType {
  levelUp,
  badgeUnlock,
  questClaim,
  perfectScore,
}

/// ─── League User Model ───────────────────────────────────────────────────────
class LeagueUser {
  final String userId;
  final String name;
  final String? avatarUrl;
  final String avatarColor;
  final int weeklyXp;
  final int rank;
  final String leagueTier;

  const LeagueUser({
    required this.userId,
    required this.name,
    this.avatarUrl,
    required this.avatarColor,
    required this.weeklyXp,
    required this.rank,
    required this.leagueTier,
  });
}
