class SpacedRepetitionStats {
  final int box1Count;
  final int box2Count;
  final int box3Count;
  final int box4Count;
  final int box5Count;
  final int dueTodayCount;
  final int totalTracked;
  final int masteredCount;

  SpacedRepetitionStats({
    this.box1Count = 0,
    this.box2Count = 0,
    this.box3Count = 0,
    this.box4Count = 0,
    this.box5Count = 0,
    this.dueTodayCount = 0,
    this.totalTracked = 0,
    this.masteredCount = 0,
  });

  factory SpacedRepetitionStats.fromJson(Map<String, dynamic> json) {
    return SpacedRepetitionStats(
      box1Count: json['box1_count'] ?? 0,
      box2Count: json['box2_count'] ?? 0,
      box3Count: json['box3_count'] ?? 0,
      box4Count: json['box4_count'] ?? 0,
      box5Count: json['box5_count'] ?? 0,
      dueTodayCount: json['due_today_count'] ?? 0,
      totalTracked: json['total_tracked'] ?? 0,
      masteredCount: json['mastered_count'] ?? 0,
    );
  }
}

class SpacedRepetitionSessionResult {
  final bool success;
  final int totalAnswered;
  final int correctCount;
  final double accuracy;
  final int xpEarned;
  final bool isPerfectScore;
  final String? mysteryGift;
  final int promotedCount;
  final int demotedCount;
  final SpacedRepetitionStats? statsAfter;

  SpacedRepetitionSessionResult({
    required this.success,
    this.totalAnswered = 0,
    this.correctCount = 0,
    this.accuracy = 0.0,
    this.xpEarned = 0,
    this.isPerfectScore = false,
    this.mysteryGift,
    this.promotedCount = 0,
    this.demotedCount = 0,
    this.statsAfter,
  });

  factory SpacedRepetitionSessionResult.fromJson(Map<String, dynamic> json) {
    return SpacedRepetitionSessionResult(
      success: json['success'] == true,
      totalAnswered: json['total_answered'] ?? 0,
      correctCount: json['correct_count'] ?? 0,
      accuracy: (json['accuracy'] != null) ? (json['accuracy'] as num).toDouble() : 0.0,
      xpEarned: json['xp_earned'] ?? 0,
      isPerfectScore: json['is_perfect_score'] == true,
      mysteryGift: json['mystery_gift'],
      promotedCount: json['promoted_count'] ?? 0,
      demotedCount: json['demoted_count'] ?? 0,
      statsAfter: json['stats_after'] != null
          ? SpacedRepetitionStats.fromJson(json['stats_after'])
          : null,
    );
  }
}
