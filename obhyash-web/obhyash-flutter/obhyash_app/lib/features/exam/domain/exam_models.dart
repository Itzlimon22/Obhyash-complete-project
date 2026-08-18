import 'package:obhyash_app/core/utils/question_formatter.dart';

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
      validOptions = (j['options'] as List)
          .map((e) => QuestionFormatter.format(e.toString()))
          .toList();
    }
    List<String> validInstitutes = [];
    if (j['institutes'] is List) {
      validInstitutes = (j['institutes'] as List)
          .map((e) => e.toString().trim())
          .where((s) => s.isNotEmpty)
          .toList();
    } else if (j['institute'] != null && j['institute'].toString().trim().isNotEmpty) {
      validInstitutes = [j['institute'].toString().trim()];
    } else if (j['institution'] != null && j['institution'].toString().trim().isNotEmpty) {
      validInstitutes = [j['institution'].toString().trim()];
    } else if (j['board'] != null && j['board'].toString().trim().isNotEmpty) {
      validInstitutes = [j['board'].toString().trim()];
    }
    
    List<int> validYears = [];
    if (j['years'] is List) {
      for (final e in j['years'] as List) {
        if (e is num) {
          validYears.add(e.toInt());
        } else if (e != null) {
          final digits = e.toString().replaceAll(RegExp(r'[^0-9]'), '');
          final parsed = int.tryParse(digits);
          if (parsed != null) validYears.add(parsed);
        }
      }
    } else if (j['year'] != null && j['year'].toString().trim().isNotEmpty) {
      final digits = j['year'].toString().replaceAll(RegExp(r'[^0-9]'), '');
      final y = int.tryParse(digits);
      if (y != null) validYears = [y];
    }
    return Question(
      id: j['id']?.toString() ?? '',
      subject: j['subject']?.toString() ?? 'general',
      subjectLabel: j['subject_label']?.toString() ?? j['subject']?.toString(),
      chapter: j['chapter']?.toString() ?? '',
      question: QuestionFormatter.format(j['question']?.toString() ?? ''),
      explanation: j['explanation'] != null
          ? QuestionFormatter.format(j['explanation'].toString())
          : null,
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

  Question copyWith({
    String? id,
    String? subject,
    String? subjectLabel,
    String? chapter,
    String? question,
    String? explanation,
    List<String>? options,
    int? correctAnswerIndex,
    int? points,
    List<String>? institutes,
    List<int>? years,
  }) {
    return Question(
      id: id ?? this.id,
      subject: subject ?? this.subject,
      subjectLabel: subjectLabel ?? this.subjectLabel,
      chapter: chapter ?? this.chapter,
      question: question ?? this.question,
      explanation: explanation ?? this.explanation,
      options: options ?? this.options,
      correctAnswerIndex: correctAnswerIndex ?? this.correctAnswerIndex,
      points: points ?? this.points,
      institutes: institutes ?? this.institutes,
      years: years ?? this.years,
    );
  }
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

  Map<String, dynamic> toJson() => {
    'id': id,
    'subject': subject,
    'subject_label': subjectLabel,
    'exam_type': examType,
    'date': date,
    'score': score,
    'total_marks': totalMarks,
    'total_questions': totalQuestions,
    'correct_count': correctCount,
    'wrong_count': wrongCount,
    'time_taken': timeTaken,
    'negative_marking': negativeMarking,
    'questions': questions.map((q) => q.toJson()).toList(),
    'flagged_questions': flaggedQuestions,
    'submission_type': submissionType,
    'user_answers': userAnswers,
    'status': status,
  };

  factory ExamResult.fromJson(Map<String, dynamic> j) {
    List<Question> qList = [];
    if (j['questions'] is List) {
      qList = (j['questions'] as List)
          .map((e) => Question.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    Map<String, int> answers = {};
    if (j['user_answers'] is Map) {
      (j['user_answers'] as Map).forEach((k, v) {
        if (v != null) {
          final intVal = int.tryParse(v.toString());
          if (intVal != null) answers[k.toString()] = intVal;
        }
      });
    }
    List<String> flagged = [];
    if (j['flagged_questions'] is List) {
      flagged = (j['flagged_questions'] as List).map((e) => e.toString()).toList();
    }
    return ExamResult(
      id: j['id']?.toString() ?? '',
      subject: j['subject']?.toString() ?? '',
      subjectLabel: j['subject_label']?.toString() ?? j['subject']?.toString(),
      examType: j['exam_type']?.toString(),
      date: j['date']?.toString() ?? j['created_at']?.toString() ?? DateTime.now().toIso8601String(),
      score: (j['score'] as num?) ?? 0,
      totalMarks: (j['total_marks'] as num?) ?? (j['total_questions'] as num?) ?? 0,
      totalQuestions: (j['total_questions'] as num?)?.toInt() ?? qList.length,
      correctCount: (j['correct_count'] as num?)?.toInt() ?? 0,
      wrongCount: (j['wrong_count'] as num?)?.toInt() ?? 0,
      timeTaken: (j['time_taken'] as num?)?.toInt() ?? 0,
      negativeMarking: (j['negative_marking'] as num?)?.toDouble() ?? 0.25,
      questions: qList,
      flaggedQuestions: flagged,
      submissionType: j['submission_type']?.toString() ?? 'digital',
      userAnswers: answers,
      status: j['status']?.toString() ?? 'evaluated',
    );
  }
}

