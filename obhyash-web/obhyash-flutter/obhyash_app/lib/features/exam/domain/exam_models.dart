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

class ExamHistory {
  final String institute;
  final String code;
  final int year;

  const ExamHistory({
    required this.institute,
    this.code = '',
    required this.year,
  });

  factory ExamHistory.fromJson(Map<String, dynamic> j) {
    return ExamHistory(
      institute: j['institute']?.toString().trim() ?? '',
      code: j['code']?.toString().trim() ?? '',
      year: (j['year'] is num)
          ? (j['year'] as num).toInt()
          : (int.tryParse(j['year']?.toString().replaceAll(RegExp(r'[^0-9]'), '') ?? '') ?? 0),
    );
  }

  Map<String, dynamic> toJson() => {
    'institute': institute,
    'code': code,
    'year': year,
  };
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
  final List<ExamHistory> examHistory;
  final List<String> institutes;
  final List<int> years;
  final String? examType;
  final String difficulty; // 'easy', 'medium', 'hard'

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
    this.examHistory = const [],
    this.institutes = const [],
    this.years = const [],
    this.examType,
    this.difficulty = 'medium',
  });

  factory Question.fromJson(Map<String, dynamic> j) {
    List<String> validOptions = [];
    if (j['options'] is List) {
      validOptions = (j['options'] as List)
          .map((e) => QuestionFormatter.format(e.toString()))
          .toList();
    }

    // 1. Parse structured exam_history if present
    List<ExamHistory> validExamHistory = [];
    final rawHistory = j['exam_history'] ?? j['examHistory'];
    if (rawHistory is List) {
      for (final item in rawHistory) {
        if (item is Map<String, dynamic>) {
          validExamHistory.add(ExamHistory.fromJson(item));
        } else if (item is Map) {
          validExamHistory.add(ExamHistory.fromJson(Map<String, dynamic>.from(item)));
        }
      }
    }

    // 2. Parse legacy institutes
    List<String> validInstitutes = [];
    if (j['institutes'] is List) {
      validInstitutes = (j['institutes'] as List)
          .map((e) => e.toString().trim())
          .where((s) => s.isNotEmpty)
          .toList();
    } else {
      final raw = j['institute'] ?? j['institution'] ?? j['board'];
      if (raw != null && raw.toString().trim().isNotEmpty) {
        validInstitutes = raw
            .toString()
            .split(',')
            .map((e) => e.trim())
            .where((s) => s.isNotEmpty)
            .toList();
      }
    }
    
    // 3. Parse legacy years
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
      final parts = j['year'].toString().split(',');
      for (final p in parts) {
        final digits = p.replaceAll(RegExp(r'[^0-9]'), '');
        final y = int.tryParse(digits);
        if (y != null) validYears.add(y);
      }
    }

    // Two-way synchronization for backward compatibility
    if (validExamHistory.isNotEmpty) {
      if (validInstitutes.isEmpty) {
        validInstitutes = validExamHistory
            .map((h) => h.institute.isNotEmpty ? h.institute : h.code)
            .where((s) => s.isNotEmpty)
            .toList();
      }
      if (validYears.isEmpty) {
        validYears = validExamHistory
            .map((h) => h.year)
            .where((y) => y > 0)
            .toList();
      }
    } else if (validInstitutes.isNotEmpty || validYears.isNotEmpty) {
      final maxLen = validInstitutes.length > validYears.length
          ? validInstitutes.length
          : validYears.length;
      for (int i = 0; i < maxLen; i++) {
        final inst = i < validInstitutes.length ? validInstitutes[i] : (validInstitutes.isNotEmpty ? validInstitutes[0] : '');
        final yr = i < validYears.length ? validYears[i] : (validYears.isNotEmpty ? validYears[0] : 0);
        validExamHistory.add(ExamHistory(
          institute: inst,
          year: yr,
        ));
      }
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
      examHistory: validExamHistory,
      institutes: validInstitutes,
      years: validYears,
      examType: j['exam_type']?.toString() ?? j['examType']?.toString(),
      difficulty: j['difficulty']?.toString().toLowerCase() ??
          j['difficulty_level']?.toString().toLowerCase() ??
          'medium',
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
    'exam_history': examHistory.map((e) => e.toJson()).toList(),
    'institutes': institutes,
    'years': years,
    'exam_type': examType,
    'difficulty': difficulty,
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
    List<ExamHistory>? examHistory,
    List<String>? institutes,
    List<int>? years,
    String? examType,
    String? difficulty,
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
      examHistory: examHistory ?? this.examHistory,
      institutes: institutes ?? this.institutes,
      years: years ?? this.years,
      examType: examType ?? this.examType,
      difficulty: difficulty ?? this.difficulty,
    );
  }

  /// Returns true if this question is strictly a Multiple Choice Question (MCQ).
  /// Rejects questions with fewer than 2 options, missing choices, or written/CQ stems.
  bool get isStrictMcq {
    // 1. Must have at least 2 options (standard MCQ)
    if (options.length < 2) return false;

    // 2. Options must not be all empty
    final nonEmptyOptions = options.where((opt) => opt.trim().isNotEmpty).toList();
    if (nonEmptyOptions.length < 2) return false;

    // 3. Exclude written/CQ types
    final type = (examType ?? '').toLowerCase();
    if (type.contains('written') ||
        type.contains('cq') ||
        type.contains('creative') ||
        type.contains('descriptive') ||
        type.contains('সৃজনশীল') ||
        type.contains('রচনামূলক') ||
        type.contains('লিখিত')) {
      return false;
    }

    // 4. Reject stems that are typical standalone CQ sub-questions (e.g. "ক. কাকে বলে?", "(খ) ব্যাখ্যা করো")
    final trimmedQ = question.trim();
    if (trimmedQ.startsWith(RegExp(r'^(ক|খ|গ|ঘ)\.\s*|^(\(ক\)|\(খ\)|\(গ\)|\(ঘ\))\s*')) &&
        options.length < 4) {
      return false;
    }

    // 5. Valid correct answer index
    if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
      return false;
    }

    return true;
  }

  /// Returns true if this question is a Board-style multiple-completion MCQ (বহুপদী সমাপ্তিসূচক)
  /// e.g. stem with i, ii, iii statements and options like "i ও ii", "ii ও iii", "i, ii ও iii".
  bool get isMultipleCompletionMcq {
    final qLower = question.toLowerCase();

    // 1. Check if stem contains roman numeral statements + "নিচের কোনটি সঠিক?"
    final hasRomanNumerals = RegExp(
      r'(?:^|\s|\n)(?:i|ii|iii|\(i\)|\(ii\)|\(iii\))[\.\)]\s+',
      caseSensitive: false,
    ).hasMatch(question);
    final hasConclusion = qLower.contains('কোনটি সঠিক') ||
        qLower.contains('নিচের কোনটি') ||
        qLower.contains('কোনটি সত্য') ||
        qLower.contains('কোন তথ্যটি');

    if (hasRomanNumerals && hasConclusion) return true;

    // 2. Check if options are combinations of roman numerals (e.g. "i ও ii", "i, ii ও iii")
    int romanComboCount = 0;
    for (final opt in options) {
      final optTrim = opt.trim().toLowerCase();
      if (RegExp(
            r'^(?:\(?i\)?|\(?ii\)?|\(?iii\)?|\(?iv\)?)\s*(?:ও|এবং|,|\&|\+)\s*(?:\(?i\)?|\(?ii\)?|\(?iii\)?|\(?iv\)?)(?:\s*(?:ও|এবং|,|\&|\+)\s*(?:\(?i\)?|\(?ii\)?|\(?iii\)?|\(?iv\)?))?$',
          ).hasMatch(optTrim) ||
          (RegExp(r'^[ivx123\s,ওএবং\(\)\.\-]+$', caseSensitive: false)
                  .hasMatch(optTrim) &&
              (optTrim.contains('ও') ||
                  optTrim.contains('এবং') ||
                  optTrim.contains(',')))) {
        romanComboCount++;
      }
    }

    if (romanComboCount >= 2) return true;

    return false;
  }

  /// Returns true if this question is a direct standard admission MCQ
  /// (strictly excludes Board-style বহুপদী সমাপ্তিসূচক / multiple-completion questions).
  bool get isAdmissionStandardMcq {
    return isStrictMcq && !isMultipleCompletionMcq;
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

class PresetSubjectDistribution {
  final String subject;
  final int count;

  const PresetSubjectDistribution(this.subject, this.count);
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

  ExamResult copyWith({
    String? id,
    String? subject,
    String? subjectLabel,
    String? examType,
    String? date,
    double? score,
    double? totalMarks,
    int? totalQuestions,
    int? correctCount,
    int? wrongCount,
    int? timeTaken,
    double? negativeMarking,
    List<Question>? questions,
    List<String>? flaggedQuestions,
    String? submissionType,
    Map<String, int>? userAnswers,
    String? status,
  }) {
    return ExamResult(
      id: id ?? this.id,
      subject: subject ?? this.subject,
      subjectLabel: subjectLabel ?? this.subjectLabel,
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
      flaggedQuestions: flaggedQuestions ?? this.flaggedQuestions,
      submissionType: submissionType ?? this.submissionType,
      userAnswers: userAnswers ?? this.userAnswers,
      status: status ?? this.status,
    );
  }

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

