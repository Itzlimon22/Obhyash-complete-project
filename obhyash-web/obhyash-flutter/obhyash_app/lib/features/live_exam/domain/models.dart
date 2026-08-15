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
          ? DateTime.parse(json['start_time'].toString())
          : DateTime.now(),
      endTime: json['end_time'] != null
          ? DateTime.parse(json['end_time'].toString())
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
