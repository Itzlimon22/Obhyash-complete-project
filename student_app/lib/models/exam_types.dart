// File: lib/models/exam_types.dart

/// Enum for Difficulty Levels
enum Difficulty {
  easy,
  medium,
  hard,
  mixed;

  // Helper to convert from String (DB) to Enum
  static Difficulty fromString(String val) {
    return Difficulty.values.firstWhere(
      (e) => e.name.toLowerCase() == val.toLowerCase(),
      orElse: () => Difficulty.mixed,
    );
  }

  // Helper to convert Enum to String (for DB)
  String toShortString() => name[0].toUpperCase() + name.substring(1);
}

/// App State Management
enum AppState {
  idle,
  loading,
  instructions,
  active,
  gracePeriod,
  completed,
  history,
  admin,
  error;

  static AppState fromString(String val) {
    // Handling cases like 'GRACE_PERIOD' -> gracePeriod
    final normalized = val.toLowerCase().replaceAll('_', '');
    return AppState.values.firstWhere(
      (e) => e.name.toLowerCase() == normalized,
      orElse: () => AppState.idle,
    );
  }
}

/// Configuration for starting an Exam
class ExamConfig {
  final String subject;
  final String examType; // Daily, Weekly, etc.
  final String chapters; // Comma separated
  final String topics;
  final String difficulty;
  final int questionCount;
  final int durationMinutes;
  final double negativeMarking; // Changed to double for precision

  ExamConfig({
    required this.subject,
    required this.examType,
    required this.chapters,
    required this.topics,
    required this.difficulty,
    required this.questionCount,
    required this.durationMinutes,
    required this.negativeMarking,
  });

  Map<String, dynamic> toJson() {
    return {
      'subject': subject,
      'examType': examType,
      'chapters': chapters,
      'topics': topics,
      'difficulty': difficulty,
      'questionCount': questionCount,
      'durationMinutes': durationMinutes,
      'negativeMarking': negativeMarking,
    };
  }

  factory ExamConfig.fromJson(Map<String, dynamic> json) {
    return ExamConfig(
      subject: json['subject'] ?? '',
      examType: json['examType'] ?? 'Daily',
      chapters: json['chapters'] ?? 'All',
      topics: json['topics'] ?? '',
      difficulty: json['difficulty'] ?? 'Mixed',
      questionCount: json['questionCount'] ?? 0,
      durationMinutes: json['durationMinutes'] ?? 0,
      negativeMarking: (json['negativeMarking'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

/// A Single Question Model
class Question {
  final int id;
  final String text;
  final List<String> options;
  final int correctAnswerIndex; // 0-3
  final double points;
  final String explanation;

  Question({
    required this.id,
    required this.text,
    required this.options,
    required this.correctAnswerIndex,
    required this.points,
    required this.explanation,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: json['id'] ?? 0,
      text: json['text'] ?? '',
      options: List<String>.from(json['options'] ?? []),
      correctAnswerIndex: json['correctAnswerIndex'] ?? 0,
      points: (json['points'] as num?)?.toDouble() ?? 1.0,
      explanation: json['explanation'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'options': options,
      'correctAnswerIndex': correctAnswerIndex,
      'points': points,
      'explanation': explanation,
    };
  }
}

/// Details for displaying Exam Info
class ExamDetails {
  final String subject;
  final String examType;
  final String chapters;
  final String topics;
  final int totalQuestions;
  final int durationMinutes;
  final double totalMarks;
  final double negativeMarking;

  ExamDetails({
    required this.subject,
    required this.examType,
    required this.chapters,
    required this.topics,
    required this.totalQuestions,
    required this.durationMinutes,
    required this.totalMarks,
    required this.negativeMarking,
  });

  factory ExamDetails.fromJson(Map<String, dynamic> json) {
    return ExamDetails(
      subject: json['subject'] ?? '',
      examType: json['examType'] ?? '',
      chapters: json['chapters'] ?? '',
      topics: json['topics'] ?? '',
      totalQuestions: json['totalQuestions'] ?? 0,
      durationMinutes: json['durationMinutes'] ?? 0,
      totalMarks: (json['totalMarks'] as num?)?.toDouble() ?? 0.0,
      negativeMarking: (json['negativeMarking'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

/// Stores the final result of an exam
class ExamResult {
  final String id;
  final String subject;
  final String? examType;
  final DateTime date;
  final double score;
  final double totalMarks;
  final int totalQuestions;
  final int correctCount;
  final int wrongCount;
  final int timeTaken; // in seconds
  final double negativeMarking;

  // Optional detailed fields
  final List<Question>? questions;
  final Map<int, int>? userAnswers; // {questionId: selectedOptionIndex}

  // Submission Status
  final String submissionType; // 'digital' or 'script'
  final String? scriptFile;
  final String? scriptImageData;
  final String status; // 'pending', 'evaluated', 'rejected'
  final String? rejectionReason;

  ExamResult({
    required this.id,
    required this.subject,
    this.examType,
    required this.date,
    required this.score,
    required this.totalMarks,
    required this.totalQuestions,
    required this.correctCount,
    required this.wrongCount,
    required this.timeTaken,
    required this.negativeMarking,
    this.questions,
    this.userAnswers,
    this.submissionType = 'digital',
    this.scriptFile,
    this.scriptImageData,
    this.status = 'evaluated',
    this.rejectionReason,
  });

  ExamResult copyWith({
    String? id,
    String? subject,
    String? examType,
    DateTime? date,
    double? score,
    double? totalMarks,
    int? totalQuestions,
    int? correctCount,
    int? wrongCount,
    int? timeTaken,
    double? negativeMarking,
    List<Question>? questions,
    Map<int, int>? userAnswers,
    String? submissionType,
    String? scriptFile,
    String? scriptImageData,
    String? status,
    String? rejectionReason,
  }) {
    return ExamResult(
      id: id ?? this.id,
      subject: subject ?? this.subject,
      examType: examType ?? this.examType,
      date: date ?? this.date,
      score: score ?? this.score,
      totalMarks: totalMarks ?? this.totalMarks,
      totalQuestions: totalQuestions ?? this.totalQuestions,
      correctCount: correctCount ?? this.correctCount,
      wrongCount: wrongCount ?? this.wrongCount,
      timeTaken: timeTaken ?? this.timeTaken,
      negativeMarking: negativeMarking ?? this.negativeMarking,
      questions: questions ?? this.questions,
      userAnswers: userAnswers ?? this.userAnswers,
      submissionType: submissionType ?? this.submissionType,
      scriptFile: scriptFile ?? this.scriptFile,
      scriptImageData: scriptImageData ?? this.scriptImageData,
      status: status ?? this.status,
      rejectionReason: rejectionReason ?? this.rejectionReason,
    );
  }

  factory ExamResult.fromJson(Map<String, dynamic> json) {
    // Handle 'userAnswers' map conversion safely (JSON keys are always Strings)
    Map<int, int>? parsedAnswers;
    if (json['userAnswers'] != null) {
      parsedAnswers = {};
      (json['userAnswers'] as Map).forEach((key, value) {
        parsedAnswers![int.parse(key.toString())] = value as int;
      });
    }

    return ExamResult(
      id: json['id'] ?? '',
      subject: json['subject'] ?? '',
      examType: json['examType'],
      date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      totalMarks: (json['totalMarks'] as num?)?.toDouble() ?? 0.0,
      totalQuestions: json['totalQuestions'] ?? 0,
      correctCount: json['correctCount'] ?? 0,
      wrongCount: json['wrongCount'] ?? 0,
      timeTaken: json['timeTaken'] ?? 0,
      negativeMarking: (json['negativeMarking'] as num?)?.toDouble() ?? 0.0,

      // Parse List<Question> if it exists
      questions: json['questions'] != null
          ? (json['questions'] as List)
                .map((i) => Question.fromJson(i))
                .toList()
          : null,

      userAnswers: parsedAnswers,
      submissionType: json['submissionType'] ?? 'digital',
      scriptFile: json['scriptFile'],
      scriptImageData: json['scriptImageData'],
      status: json['status'] ?? 'evaluated',
      rejectionReason: json['rejectionReason'],
    );
  }

  Map<String, dynamic> toJson() {
    // Convert Int-key map to String-key map for JSON
    Map<String, int>? serializedAnswers;
    if (userAnswers != null) {
      serializedAnswers = userAnswers!.map((k, v) => MapEntry(k.toString(), v));
    }

    return {
      'id': id,
      'subject': subject,
      'examType': examType,
      'date': date.toIso8601String(),
      'score': score,
      'totalMarks': totalMarks,
      'totalQuestions': totalQuestions,
      'correctCount': correctCount,
      'wrongCount': wrongCount,
      'timeTaken': timeTaken,
      'negativeMarking': negativeMarking,
      'questions': questions?.map((q) => q.toJson()).toList(),
      'userAnswers': serializedAnswers,
      'submissionType': submissionType,
      'scriptFile': scriptFile,
      'scriptImageData': scriptImageData,
      'status': status,
      'rejectionReason': rejectionReason,
    };
  }
}
