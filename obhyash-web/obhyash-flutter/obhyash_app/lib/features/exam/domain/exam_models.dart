class ExamDetails {
  final String subject;
  final String? subjectLabel;
  final String? examType;
  final String? chapters;
  final String? topics;
  final int totalQuestions;
  final int durationMinutes;
  final int totalMarks;
  final double negativeMarking;

  const ExamDetails({
    required this.subject,
    this.subjectLabel,
    this.examType,
    this.chapters,
    this.topics,
    required this.totalQuestions,
    required this.durationMinutes,
    required this.totalMarks,
    required this.negativeMarking,
  });
}

class Question {
  final String id;
  final String subject;
  final String? subjectLabel;
  final String chapter;
  final String question;
  final String? explanation;
  final List<String> options;
  final int correctAnswerIndex;
  final int points;
  final List<String> institutes;
  final List<int> years;

  const Question({
    required this.id,
    required this.subject,
    this.subjectLabel,
    this.chapter = '',
    required this.question,
    this.explanation,
    required this.options,
    required this.correctAnswerIndex,
    required this.points,
    this.institutes = const [],
    this.years = const [],
  });

  factory Question.fromJson(Map<String, dynamic> j) {
    List<String> validOptions = [];
    if (j['options'] is List) {
      validOptions = (j['options'] as List).map((e) => e.toString()).toList();
    }
    List<String> validInstitutes = [];
    if (j['institutes'] is List) {
      validInstitutes = (j['institutes'] as List).map((e) => e.toString()).toList();
    } else if (j['institute'] != null && j['institute'].toString().isNotEmpty) {
      validInstitutes = [j['institute'].toString()];
    }
    
    List<int> validYears = [];
    if (j['years'] is List) {
      validYears = (j['years'] as List).map((e) => (e as num).toInt()).toList();
    } else if (j['year'] != null && j['year'].toString().isNotEmpty) {
      final y = int.tryParse(j['year'].toString());
      if (y != null) validYears = [y];
    }
    return Question(
      id: j['id']?.toString() ?? '',
      subject: j['subject']?.toString() ?? 'general',
      subjectLabel: j['subject_label']?.toString() ?? j['subject']?.toString(),
      chapter: j['chapter']?.toString() ?? '',
      question: j['question']?.toString() ?? '',
      explanation: j['explanation']?.toString(),
      options: validOptions,
      correctAnswerIndex: (j['correct_answer_index'] as num?)?.toInt() ?? 0,
      points: (j['points'] as num?)?.toInt() ?? 1,
      institutes: validInstitutes,
      years: validYears,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'subject': subject,
    'subject_label': subjectLabel,
    'chapter': chapter,
    'question': question,
    'explanation': explanation,
    'options': options,
    'correct_answer_index': correctAnswerIndex,
    'points': points,
    'institutes': institutes,
    'years': years,
  };
}

class ExamConfig {
  final String subject;
  final String subjectLabel;
  final String examType;
  final String chapters;
  final String topics;
  final String difficulty;
  final int questionCount;
  final int durationMinutes;
  final double negativeMarking;

  const ExamConfig({
    required this.subject,
    required this.subjectLabel,
    required this.examType,
    required this.chapters,
    required this.topics,
    required this.difficulty,
    required this.questionCount,
    required this.durationMinutes,
    required this.negativeMarking,
  });
}

class ExamResult {
  final String id;
  final String subject;
  final String? subjectLabel;
  final String? examType;
  final String date;
  final num score;
  final num totalMarks;
  final int totalQuestions;
  final int correctCount;
  final int wrongCount;
  final int timeTaken;
  final double negativeMarking;
  final List<Question> questions;
  final List<String> flaggedQuestions;
  final String submissionType;
  final Map<String, int> userAnswers;
  final String status;

  const ExamResult({
    required this.id,
    required this.subject,
    this.subjectLabel,
    this.examType,
    required this.date,
    required this.score,
    required this.totalMarks,
    required this.totalQuestions,
    required this.correctCount,
    required this.wrongCount,
    required this.timeTaken,
    required this.negativeMarking,
    required this.questions,
    required this.flaggedQuestions,
    required this.submissionType,
    required this.userAnswers,
    required this.status,
  });
}
