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
  });

  factory LiveExam.fromJson(Map<String, dynamic> json) {
    return LiveExam(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      startTime: json['start_time'] != null
          ? DateTime.parse(json['start_time'].toString()).toLocal()
          : DateTime.now(),
      endTime: json['end_time'] != null
          ? DateTime.parse(json['end_time'].toString()).toLocal()
          : DateTime.now(),
      durationMinutes: json['duration_minutes'] as int? ?? 0,
      totalQuestions: json['total_questions'] as int? ?? 0,
      totalMarks: json['total_marks'] as num? ?? 0,
      negativeMarking: json['negative_marking'] as num? ?? 0,
      status: json['status'] as String? ?? '',
      category: json['category'] as String? ?? '',
      userAttemptStatus: json['userAttemptStatus'] as String?,
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
  final num score;
  final int correctCount;
  final int wrongCount;
  final String userName;
  final String userInstitute;
  final String avatarColor;
  final DateTime? submitTime;

  LiveExamLeaderboardEntry({
    required this.id,
    required this.score,
    required this.correctCount,
    required this.wrongCount,
    required this.userName,
    required this.userInstitute,
    required this.avatarColor,
    this.submitTime,
  });

  factory LiveExamLeaderboardEntry.fromJson(Map<String, dynamic> json) {
    final userData = json['users'] as Map<String, dynamic>?;

    return LiveExamLeaderboardEntry(
      id: json['id'] as String? ?? '',
      score: json['score'] as num? ?? 0,
      correctCount: json['correct_count'] as int? ?? 0,
      wrongCount: json['wrong_count'] as int? ?? 0,
      userName: userData?['name'] as String? ?? 'শিক্ষার্থী',
      userInstitute: userData?['institute'] as String? ?? 'প্রতিষ্ঠান নেই',
      avatarColor: userData?['avatar_color'] as String? ?? userData?['avatarColor'] as String? ?? '#10b981',
      submitTime: json['submit_time'] != null ? DateTime.parse(json['submit_time'].toString()) : null,
    );
  }
}

