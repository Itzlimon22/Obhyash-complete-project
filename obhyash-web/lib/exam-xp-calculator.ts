/**
 * Detailed breakdown of XP earned in an exam for celebration & analytics UI.
 */
export interface ExamXpBreakdown {
  participationXp: number;
  accuracyXp: number;
  perfectScoreBonus: number;
  speedBonus: number;
  streakMultiplier: number;
  streakBonusXp: number;
  totalXpEarned: number;
  isExploitProtected: boolean;
}

export class ExamXpCalculator {
  /**
   * Calculates balanced production XP across mock and live exams:
   * - Base Participation: +5 XP (Mock) / +10 XP (Live)
   * - Accuracy: +2 XP per correct, -1 XP per wrong (min 0)
   * - Clean Sheet: +10 XP if 100% correct (with >= 5 questions)
   * - Speed Bonus: +1 XP per remaining minute (up to +5 XP) if accuracy >= 80%
   * - Streak Booster: 3-6 days = 1.1x, 7-13 days = 1.2x, 14+ days = 1.3x
   * - Anti-Exploit: If < 3 questions and < 5s total time, awards minimal 2 XP
   */
  static calculateExamXp({
    totalQuestions,
    correctCount,
    wrongCount,
    timeTakenSeconds,
    durationMinutes = 25,
    currentStreak = 0,
    isLiveExam = false,
  }: {
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    timeTakenSeconds: number;
    durationMinutes?: number;
    currentStreak?: number;
    isLiveExam?: boolean;
  }): ExamXpBreakdown {
    if (totalQuestions <= 0) {
      return {
        participationXp: 0,
        accuracyXp: 0,
        perfectScoreBonus: 0,
        speedBonus: 0,
        streakMultiplier: 1.0,
        streakBonusXp: 0,
        totalXpEarned: 0,
        isExploitProtected: false,
      };
    }

    // 1. Anti-Exploit Check
    const isTooShort = timeTakenSeconds < 5 && totalQuestions <= 2;
    const isInstantSkip =
      totalQuestions >= 5 &&
      timeTakenSeconds < 10 &&
      correctCount + wrongCount < 2;

    if (isTooShort || isInstantSkip) {
      return {
        participationXp: 2,
        accuracyXp: 0,
        perfectScoreBonus: 0,
        speedBonus: 0,
        streakMultiplier: 1.0,
        streakBonusXp: 0,
        totalXpEarned: 2,
        isExploitProtected: true,
      };
    }

    // 2. Base Participation
    const participationXp = isLiveExam ? 10 : 5;

    // 3. Accuracy XP (+2 correct, -1 wrong)
    const rawAccuracy = correctCount * 2 - wrongCount * 1;
    const accuracyXp = Math.max(0, rawAccuracy);

    // 4. Perfect Score (Clean Sheet) Bonus
    let perfectScoreBonus = 0;
    if (
      totalQuestions >= 5 &&
      correctCount === totalQuestions &&
      wrongCount === 0
    ) {
      perfectScoreBonus = 10;
    }

    // 5. Speed Bonus
    let speedBonus = 0;
    const allocatedSeconds = durationMinutes * 60;
    const remainingSeconds = allocatedSeconds - timeTakenSeconds;
    const accuracyRate = totalQuestions > 0 ? correctCount / totalQuestions : 0;

    if (accuracyRate >= 0.8 && remainingSeconds >= 60 && allocatedSeconds > 0) {
      const leftoverMinutes = Math.floor(remainingSeconds / 60);
      speedBonus = Math.min(5, Math.max(0, leftoverMinutes));
    }

    const subtotalXp =
      participationXp + accuracyXp + perfectScoreBonus + speedBonus;

    // 6. Streak Booster
    let streakMultiplier = 1.0;
    if (currentStreak >= 14) {
      streakMultiplier = 1.3;
    } else if (currentStreak >= 7) {
      streakMultiplier = 1.2;
    } else if (currentStreak >= 3) {
      streakMultiplier = 1.1;
    }

    const totalWithStreak = Math.round(subtotalXp * streakMultiplier);
    const streakBonusXp = totalWithStreak - subtotalXp;
    const finalXp = Math.min(9999, Math.max(0, totalWithStreak));

    return {
      participationXp,
      accuracyXp,
      perfectScoreBonus,
      speedBonus,
      streakMultiplier,
      streakBonusXp,
      totalXpEarned: finalXp,
      isExploitProtected: false,
    };
  }

  static getLiveExamRankBonus(rank: number): number {
    if (rank === 1) return 50;
    if (rank >= 2 && rank <= 3) return 30;
    if (rank >= 4 && rank <= 10) return 20;
    if (rank >= 11 && rank <= 25) return 10;
    return 0;
  }
}
