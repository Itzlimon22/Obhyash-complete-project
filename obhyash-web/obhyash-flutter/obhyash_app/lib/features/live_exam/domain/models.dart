class LiveExam {
  final String id;
  final String title;
  final String description;
  final DateTime startTime;
  final DateTime endTime;
  final int durationMinutes;
  final int totalQuestions;
  final num totalMarks;
  final num negativeMarking;
  final String status;
  final String category;
  final String? userAttemptStatus;
  final bool isLeaderboardPublished;

  LiveExam({
    required this.id,
    required this.title,
    required this.description,
    required this.startTime,
    required this.endTime,
    required this.durationMinutes,
    required this.totalQuestions,
    required this.totalMarks,
    required this.negativeMarking,
    required this.status,
    required this.category,
    this.userAttemptStatus,
    this.isLeaderboardPublished = true,
  });

  factory LiveExam.fromJson(Map<String, dynamic> json) {
    int parseTotalQuestions(dynamic val) {
      if (val is int) return val;
      if (val is num) return val.toInt();
      if (val is String) return int.tryParse(val) ?? 0;
      if (val is List && val.isNotEmpty) {
        final first = val.first;
        if (first is Map && first.containsKey('count')) {
          final countVal = first['count'];
          if (countVal is int) return countVal;
          if (countVal is num) return countVal.toInt();
          if (countVal is String) return int.tryParse(countVal) ?? 0;
        }
      }
      return 0;
    }

    num parseNum(dynamic val) {
      if (val is num) return val;
      if (val is String) return num.tryParse(val) ?? 0;
      return 0;
    }

    return LiveExam(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      startTime: json['start_time'] != null
          ? (DateTime.tryParse(json['start_time'].toString())?.toLocal() ?? DateTime.now())
          : DateTime.now(),
      endTime: json['end_time'] != null
          ? (DateTime.tryParse(json['end_time'].toString())?.toLocal() ?? DateTime.now())
          : DateTime.now(),
      durationMinutes: json['duration_minutes'] is num
          ? (json['duration_minutes'] as num).toInt()
          : int.tryParse(json['duration_minutes']?.toString() ?? '') ?? 0,
      totalQuestions: parseTotalQuestions(json['total_questions']),
      totalMarks: parseNum(json['total_marks']),
      negativeMarking: parseNum(json['negative_marking']),
      status: json['status'] as String? ?? '',
      category: json['category'] as String? ?? '',
      userAttemptStatus: json['userAttemptStatus'] as String?,
      isLeaderboardPublished: json['is_leaderboard_published'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'start_time': startTime.toIso8601String(),
      'end_time': endTime.toIso8601String(),
      'duration_minutes': durationMinutes,
      'total_questions': totalQuestions,
      'total_marks': totalMarks,
      'negative_marking': negativeMarking,
      'status': status,
      'category': category,
      'userAttemptStatus': userAttemptStatus,
      'is_leaderboard_published': isLeaderboardPublished,
    };
  }

  bool get isOngoing {
    final now = DateTime.now();
    return now.isAfter(startTime) && now.isBefore(endTime);
  }

  bool get isUpcoming {
    final now = DateTime.now();
    return now.isBefore(startTime);
  }

  bool get isPast {
    final now = DateTime.now();
    return now.isAfter(endTime);
  }
}

class LiveExamAttempt {
  final String id;
  final String liveExamId;
  final String userId;
  final String status;
  final num score;
  final int correctCount;
  final int wrongCount;
  final Map<String, int> userAnswers;
  final DateTime? startTime;
  final DateTime? submitTime;

  LiveExamAttempt({
    required this.id,
    required this.liveExamId,
    required this.userId,
    required this.status,
    required this.score,
    required this.correctCount,
    required this.wrongCount,
    required this.userAnswers,
    this.startTime,
    this.submitTime,
  });

  factory LiveExamAttempt.fromJson(Map<String, dynamic> json) {
    Map<String, int> answers = {};
    if (json['user_answers'] is Map) {
      (json['user_answers'] as Map).forEach((k, v) {
        if (v is num) {
          answers[k.toString()] = v.toInt();
        }
      });
    }

    return LiveExamAttempt(
      id: json['id'] as String? ?? '',
      liveExamId: json['live_exam_id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      status: json['status'] as String? ?? 'ongoing',
      score: json['score'] as num? ?? 0,
      correctCount: json['correct_count'] as int? ?? 0,
      wrongCount: json['wrong_count'] as int? ?? 0,
      userAnswers: answers,
      startTime: json['start_time'] != null ? DateTime.parse(json['start_time'].toString()) : null,
      submitTime: json['submit_time'] != null ? DateTime.parse(json['submit_time'].toString()) : null,
    );
  }
}

class LiveExamLeaderboardEntry {
  final String id;
  final String? userId;
  final num score;
  final int correctCount;
  final int wrongCount;
  final String userName;
  final String userInstitute;
  final String avatarColor;
  final String? avatarUrl;
  final DateTime? startTime;
  final DateTime? submitTime;
  final int? timeTakenSeconds;

  LiveExamLeaderboardEntry({
    required this.id,
    this.userId,
    required this.score,
    required this.correctCount,
    required this.wrongCount,
    required this.userName,
    required this.userInstitute,
    required this.avatarColor,
    this.avatarUrl,
    this.startTime,
    this.submitTime,
    this.timeTakenSeconds,
  });

  factory LiveExamLeaderboardEntry.fromJson(Map<String, dynamic> json) {
    final userData = json['users'] as Map<String, dynamic>?;
    final start = json['start_time'] != null ? DateTime.tryParse(json['start_time'].toString()) : null;
    final submit = json['submit_time'] != null ? DateTime.tryParse(json['submit_time'].toString()) : null;
    int? timeTaken;
    if (json['time_taken_seconds'] != null) {
      timeTaken = (json['time_taken_seconds'] as num?)?.toInt();
    } else if (start != null && submit != null) {
      final diff = submit.difference(start).inSeconds;
      if (diff >= 0 && diff <= 86400) {
        timeTaken = diff;
      }
    }

    return LiveExamLeaderboardEntry(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? userData?['id'] as String?,
      score: json['score'] as num? ?? 0,
      correctCount: json['correct_count'] as int? ?? 0,
      wrongCount: json['wrong_count'] as int? ?? 0,
      userName: userData?['name'] as String? ?? 'শিক্ষার্থী',
      userInstitute: userData?['institute'] as String? ?? 'প্রতিষ্ঠান নেই',
      avatarColor: userData?['avatar_color'] as String? ?? userData?['avatarColor'] as String? ?? '#10b981',
      avatarUrl: userData?['avatar_url'] as String?,
      startTime: start,
      submitTime: submit,
      timeTakenSeconds: timeTaken,
    );
  }
}

class LiveExamPracticeAttempt {
  final String id;
  final String liveExamId;
  final String userId;
  final num score;
  final int correctCount;
  final int wrongCount;
  final int unansweredCount;
  final int timeTakenSeconds;
  final DateTime submitTime;

  LiveExamPracticeAttempt({
    required this.id,
    required this.liveExamId,
    required this.userId,
    required this.score,
    required this.correctCount,
    required this.wrongCount,
    required this.unansweredCount,
    required this.timeTakenSeconds,
    required this.submitTime,
  });

  factory LiveExamPracticeAttempt.fromJson(Map<String, dynamic> json) {
    return LiveExamPracticeAttempt(
      id: json['id'] as String? ?? '',
      liveExamId: json['live_exam_id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      score: json['score'] as num? ?? 0,
      correctCount: json['correct_count'] as int? ?? 0,
      wrongCount: json['wrong_count'] as int? ?? 0,
      unansweredCount: json['unanswered_count'] as int? ?? 0,
      timeTakenSeconds: json['time_taken_seconds'] as int? ?? 0,
      submitTime: json['submit_time'] != null
          ? DateTime.parse(json['submit_time'].toString()).toLocal()
          : DateTime.now(),
    );
  }
}


