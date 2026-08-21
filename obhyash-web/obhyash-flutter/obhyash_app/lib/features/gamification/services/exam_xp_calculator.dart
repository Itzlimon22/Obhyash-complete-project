import 'package:flutter/foundation.dart';

/// Detailed breakdown of XP earned in an exam for celebration & analytics UI.
class ExamXpBreakdown {
  /// Base XP earned just for attending and completing the exam
  final int participationXp;

  /// XP earned from question accuracy (+10 correct, -2 wrong)
  final int accuracyXp;

  /// Bonus XP for 100% perfect accuracy (Clean Sheet)
  final int perfectScoreBonus;

  /// Bonus XP for fast & accurate completion
  final int speedBonus;

  /// Multiplier from continuous daily streak (e.g. 1.1x, 1.2x, 1.3x)
  final double streakMultiplier;

  /// Bonus XP added specifically by the streak multiplier
  final int streakBonusXp;

  /// Total final XP awarded
  final int totalXpEarned;

  /// Whether the attempt was flagged as too brief / anti-exploit
  final bool isExploitProtected;

  const ExamXpBreakdown({
    required this.participationXp,
    required this.accuracyXp,
    required this.perfectScoreBonus,
    required this.speedBonus,
    required this.streakMultiplier,
    required this.streakBonusXp,
    required this.totalXpEarned,
    this.isExploitProtected = false,
  });

  static const ExamXpBreakdown zero = ExamXpBreakdown(
    participationXp: 0,
    accuracyXp: 0,
    perfectScoreBonus: 0,
    speedBonus: 0,
    streakMultiplier: 1.0,
    streakBonusXp: 0,
    totalXpEarned: 0,
  );
}

/// Production Gamification Engine for calculating XP across standard mock & live exams.
class ExamXpCalculator {
  /// ─── 1. Standard Mock / Practice Exam XP Calculation ──────────────────────
  ///
  /// Rules:
  /// - Base Participation: +15 XP for completing an exam.
  /// - Accuracy: +10 XP per correct, -2 XP per wrong (min 0).
  /// - Perfect Score Bonus: +30 XP if 100% correct (with >= 5 questions).
  /// - Speed Bonus: +1 XP per remaining minute (up to +15 XP) if accuracy >= 80%.
  /// - Streak Booster: 3-6 days = 1.1x, 7-13 days = 1.2x, 14+ days = 1.3x.
  /// - Anti-Exploit: If < 3 questions and < 5s total time, awards minimal XP.
  static ExamXpBreakdown calculateExamXp({
    required int totalQuestions,
    required int correctCount,
    required int wrongCount,
    required int timeTakenSeconds,
    required int durationMinutes,
    required int currentStreak,
    bool isLiveExam = false,
  }) {
    if (totalQuestions <= 0) return ExamXpBreakdown.zero;

    // 1. Anti-Exploit Check (prevents bot/spamming 1-question tests in 1s)
    final bool isTooShort = timeTakenSeconds < 5 && totalQuestions <= 2;
    final bool isInstantSkip = totalQuestions >= 5 && timeTakenSeconds < 10 && (correctCount + wrongCount) < 2;

    if (isTooShort || isInstantSkip) {
      debugPrint('[ExamXpCalculator] Anti-exploit triggered for brief test ($timeTakenSeconds s)');
      return const ExamXpBreakdown(
        participationXp: 2,
        accuracyXp: 0,
        perfectScoreBonus: 0,
        speedBonus: 0,
        streakMultiplier: 1.0,
        streakBonusXp: 0,
        totalXpEarned: 2,
        isExploitProtected: true,
      );
    }

    // 2. Base Participation XP
    final int participationXp = isLiveExam ? 10 : 5;

    // 3. Accuracy XP (+2 correct, -1 wrong)
    final int rawAccuracy = (correctCount * 2) - (wrongCount * 1);
    final int accuracyXp = rawAccuracy.clamp(0, 9999);

    // 4. Perfect Score (Clean Sheet) Bonus: +10 XP if 100% accurate (>= 5 questions)
    int perfectScoreBonus = 0;
    if (totalQuestions >= 5 && correctCount == totalQuestions && wrongCount == 0) {
      perfectScoreBonus = 10;
    }

    // 5. Speed / Time Efficiency Bonus
    // If accuracy is >= 80% and finished with remaining time
    int speedBonus = 0;
    final int allocatedSeconds = durationMinutes * 60;
    final int remainingSeconds = allocatedSeconds - timeTakenSeconds;
    final double accuracyRate = totalQuestions > 0 ? (correctCount / totalQuestions) : 0.0;

    if (accuracyRate >= 0.8 && remainingSeconds >= 60 && allocatedSeconds > 0) {
      final int leftoverMinutes = (remainingSeconds / 60).floor();
      speedBonus = leftoverMinutes.clamp(0, 5); // Max 5 speed bonus XP
    }

    // Subtotal before streak multiplier
    final int subtotalXp = participationXp + accuracyXp + perfectScoreBonus + speedBonus;

    // 6. Streak Booster Multiplier
    double streakMultiplier = 1.0;
    if (currentStreak >= 14) {
      streakMultiplier = 1.3; // +30% booster
    } else if (currentStreak >= 7) {
      streakMultiplier = 1.2; // +20% booster
    } else if (currentStreak >= 3) {
      streakMultiplier = 1.1; // +10% booster
    }

    final int totalWithStreak = (subtotalXp * streakMultiplier).round();
    final int streakBonusXp = totalWithStreak - subtotalXp;
    final int finalXp = totalWithStreak.clamp(0, 9999);

    return ExamXpBreakdown(
      participationXp: participationXp,
      accuracyXp: accuracyXp,
      perfectScoreBonus: perfectScoreBonus,
      speedBonus: speedBonus,
      streakMultiplier: streakMultiplier,
      streakBonusXp: streakBonusXp,
      totalXpEarned: finalXp,
    );
  }

  /// ─── 2. Live Exam Ranking Bonus XP ─────────────────────────────────────────
  ///
  /// Bonus XP for placing at top positions on the Live Exam Leaderboard:
  /// - 1st Place: +50 XP
  /// - 2nd - 3rd Place: +30 XP
  /// - 4th - 10th Place: +20 XP
  /// - 11th - 25th Place: +10 XP
  static int getLiveExamRankBonus(int rank) {
    if (rank == 1) return 50;
    if (rank >= 2 && rank <= 3) return 30;
    if (rank >= 4 && rank <= 10) return 20;
    if (rank >= 11 && rank <= 25) return 10;
    return 0;
  }
}
