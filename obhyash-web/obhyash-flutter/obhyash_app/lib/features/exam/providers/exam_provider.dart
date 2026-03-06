import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/exam_models.dart';

enum AppState {
  idle,
  loading,
  instructions,
  active,
  gracePeriod,
  submitted,
  completed,
  error,
  timeout,
}

class ExamEngineState {
  final AppState appState;
  final String errorDetails;
  final ExamConfig? pendingConfig;
  final ExamDetails? examDetails;
  final List<Question> questions;
  final Map<String, int> userAnswers;
  final Set<String> flaggedQuestions;
  final int timeLeft;
  final int graceTimeLeft;
  final bool isOmrMode;
  final String? dbSessionId;
  final String? selectedScriptPath;
  final ExamResult? completedResult;

  const ExamEngineState({
    this.appState = AppState.idle,
    this.errorDetails = '',
    this.pendingConfig,
    this.examDetails,
    this.questions = const [],
    this.userAnswers = const {},
    this.flaggedQuestions = const {},
    this.timeLeft = 0,
    this.graceTimeLeft = 0,
    this.isOmrMode = false,
    this.dbSessionId,
    this.selectedScriptPath,
    this.completedResult,
  });

  ExamEngineState copyWith({
    AppState? appState,
    String? errorDetails,
    ExamConfig? pendingConfig,
    ExamDetails? examDetails,
    List<Question>? questions,
    Map<String, int>? userAnswers,
    Set<String>? flaggedQuestions,
    int? timeLeft,
    int? graceTimeLeft,
    bool? isOmrMode,
    String? dbSessionId,
    String? selectedScriptPath,
    ExamResult? completedResult,
  }) {
    return ExamEngineState(
      appState: appState ?? this.appState,
      errorDetails: errorDetails ?? this.errorDetails,
      pendingConfig: pendingConfig ?? this.pendingConfig,
      examDetails: examDetails ?? this.examDetails,
      questions: questions ?? this.questions,
      userAnswers: userAnswers ?? this.userAnswers,
      flaggedQuestions: flaggedQuestions ?? this.flaggedQuestions,
      timeLeft: timeLeft ?? this.timeLeft,
      graceTimeLeft: graceTimeLeft ?? this.graceTimeLeft,
      isOmrMode: isOmrMode ?? this.isOmrMode,
      dbSessionId: dbSessionId ?? this.dbSessionId,
      selectedScriptPath: selectedScriptPath ?? this.selectedScriptPath,
      completedResult: completedResult ?? this.completedResult,
    );
  }
}

// Migrated from StateNotifier to Notifier (required for flutter_riverpod ^3.x)
class ExamEngineNotifier extends Notifier<ExamEngineState> {
  Timer? _timer;

  @override
  ExamEngineState build() {
    // Cancel timer when provider is disposed
    ref.onDispose(() => _timer?.cancel());
    return const ExamEngineState();
  }

  Future<bool> startExam(ExamConfig config) async {
    state = state.copyWith(
      appState: AppState.loading,
      errorDetails: '',
      isOmrMode: false,
    );
    try {
      final supabase = Supabase.instance.client;
      final data = await supabase.rpc(
        'get_random_questions',
        params: {
          'p_subject': config.subject,
          'p_chapters': config.chapters == 'All'
              ? null
              : config.chapters.split(','),
          'p_limit': config.questionCount,
        },
      );

      final List<dynamic> qList = data as List<dynamic>;
      if (qList.isEmpty) {
        state = state.copyWith(appState: AppState.idle);
        throw Exception('No questions found for the selected criteria.');
      }

      final generatedQuestions = qList
          .map((e) => Question.fromJson(e))
          .toList();

      final details = ExamDetails(
        subject: config.subject,
        subjectLabel: config.subjectLabel,
        examType: config.examType,
        chapters: config.chapters,
        topics: config.topics,
        totalQuestions: generatedQuestions.length,
        durationMinutes: config.durationMinutes,
        totalMarks: generatedQuestions.fold(0, (sum, q) => sum + q.points),
        negativeMarking: config.negativeMarking,
      );

      // Create session in DB
      final authId = supabase.auth.currentUser?.id;
      String? sessionId;
      if (authId != null) {
        final sessionRes = await supabase
            .from('exam_sessions')
            .insert({
              'user_id': authId,
              'status': 'active',
              'subject': config.subject,
            })
            .select('id')
            .maybeSingle();
        if (sessionRes != null) sessionId = sessionRes['id'].toString();
      }

      state = state.copyWith(
        appState: AppState.instructions,
        questions: generatedQuestions,
        examDetails: details,
        userAnswers: {},
        flaggedQuestions: {},
        dbSessionId: sessionId,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        appState: AppState.error,
        errorDetails: e.toString(),
      );
      return false;
    }
  }

  void beginTimer([int? durationOverride]) {
    final duration =
        durationOverride ?? (state.examDetails?.durationMinutes ?? 0) * 60;
    if (duration > 0) {
      state = state.copyWith(timeLeft: duration, appState: AppState.active);
      _timer?.cancel();
      _timer = Timer.periodic(const Duration(seconds: 1), (t) {
        if (state.timeLeft <= 1) {
          t.cancel();
          submitExam();
        } else {
          state = state.copyWith(timeLeft: state.timeLeft - 1);
        }
      });
    }
  }

  void setAnswer(String questionId, int optionIndex) {
    final updated = Map<String, int>.from(state.userAnswers);
    updated[questionId] = optionIndex;
    state = state.copyWith(userAnswers: updated);
  }

  void toggleFlag(String questionId) {
    final updated = Set<String>.from(state.flaggedQuestions);
    if (updated.contains(questionId)) {
      updated.remove(questionId);
    } else {
      updated.add(questionId);
    }
    state = state.copyWith(flaggedQuestions: updated);
  }

  void toggleOmrMode(bool isOmr) {
    state = state.copyWith(isOmrMode: isOmr);
  }

  Future<void> submitExam() async {
    if (state.appState == AppState.completed ||
        state.appState == AppState.submitted) {
      return;
    }

    _timer?.cancel();

    int correct = 0;
    int wrong = 0;
    double rawScore = 0.0;
    double negativeMarks = 0.0;

    for (final q in state.questions) {
      final ua = state.userAnswers[q.id];
      if (ua != null) {
        if (ua == q.correctAnswerIndex) {
          correct++;
          rawScore += q.points;
        } else {
          wrong++;
          negativeMarks +=
              q.points * (state.examDetails?.negativeMarking ?? 0.25);
        }
      }
    }

    final finalScore = (rawScore - negativeMarks).clamp(0, double.infinity);

    final result = ExamResult(
      id: state.dbSessionId ?? DateTime.now().millisecondsSinceEpoch.toString(),
      subject: state.examDetails?.subject ?? 'Unknown',
      subjectLabel: state.examDetails?.subjectLabel,
      examType: state.examDetails?.examType,
      date: DateTime.now().toIso8601String(),
      score: finalScore,
      totalMarks: state.examDetails?.totalMarks ?? 0,
      totalQuestions: state.questions.length,
      correctCount: correct,
      wrongCount: wrong,
      timeTaken:
          ((state.examDetails?.durationMinutes ?? 0) * 60) - state.timeLeft,
      negativeMarking: state.examDetails?.negativeMarking ?? 0.25,
      questions: state.questions,
      flaggedQuestions: state.flaggedQuestions.toList(),
      submissionType: state.isOmrMode ? 'script' : 'digital',
      userAnswers: state.userAnswers,
      status: 'evaluated',
    );

    // Save to DB
    final supabase = Supabase.instance.client;
    final authId = supabase.auth.currentUser?.id;
    if (authId != null) {
      try {
        // Build JSONB payloads for practice dashboard (mistakes tab)
        final questionsJson = state.questions
            .map(
              (q) => {
                'id': q.id,
                'question': q.question,
                'options': q.options,
                'correct_answer_index': q.correctAnswerIndex,
                'subject': q.subject,
                'subject_label': q.subjectLabel,
                'explanation': q.explanation,
                'points': q.points,
              },
            )
            .toList();
        final userAnswersJson = Map<String, dynamic>.fromEntries(
          state.userAnswers.entries.map((e) => MapEntry(e.key, e.value)),
        );

        await supabase.from('exam_results').insert({
          'user_id': authId,
          'subject': result.subject,
          'subject_label': result.subjectLabel,
          'exam_type': result.examType,
          'score': result.score,
          'total_marks': result.totalMarks,
          'correct_count': result.correctCount,
          'wrong_count': result.wrongCount,
          'time_taken': result.timeTaken,
          'total_questions': result.totalQuestions,
          'questions': questionsJson,
          'user_answers': userAnswersJson,
          'status': 'evaluated',
        });

        // Award XP: 10 per correct, -2 per wrong (min 0)
        final xpEarned = (result.correctCount * 10 - result.wrongCount * 2)
            .clamp(0, 9999);
        if (xpEarned > 0) {
          await supabase.rpc(
            'increment_user_xp',
            params: {'uid': authId, 'amount': xpEarned},
          );
        }

        // Increment streak
        await supabase.rpc('increment_user_streak', params: {'uid': authId});
      } catch (e) {
        debugPrint('[ExamProvider] submitExam DB error: $e');
      }
    }

    state = state.copyWith(
      appState: AppState.completed,
      completedResult: result,
    );
  }
}

final examEngineProvider =
    NotifierProvider<ExamEngineNotifier, ExamEngineState>(() {
      return ExamEngineNotifier();
    });
