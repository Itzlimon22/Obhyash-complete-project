import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../domain/exam_models.dart';
import '../services/local_exam_cache_service.dart';
import '../services/offline_question_bank_service.dart';
import '../services/offline_exam_sync_queue.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import '../../dashboard/services/streak_service.dart';
import '../../gamification/services/exam_xp_calculator.dart';

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
  final Set<String> bookmarkedQuestions;
  final int timeLeft;
  final int graceTimeLeft;
  final String? dbSessionId;
  final ExamResult? completedResult;

  const ExamEngineState({
    this.appState = AppState.idle,
    this.errorDetails = '',
    this.pendingConfig,
    this.examDetails,
    this.questions = const [],
    this.userAnswers = const {},
    this.flaggedQuestions = const {},
    this.bookmarkedQuestions = const {},
    this.timeLeft = 0,
    this.graceTimeLeft = 0,
    this.dbSessionId,
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
    Set<String>? bookmarkedQuestions,
    int? timeLeft,
    int? graceTimeLeft,
    String? dbSessionId,
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
      bookmarkedQuestions: bookmarkedQuestions ?? this.bookmarkedQuestions,
      timeLeft: timeLeft ?? this.timeLeft,
      graceTimeLeft: graceTimeLeft ?? this.graceTimeLeft,
      dbSessionId: dbSessionId ?? this.dbSessionId,
      completedResult: completedResult ?? this.completedResult,
    );
  }
}

// Migrated from StateNotifier to Notifier (required for flutter_riverpod ^3.x)
class ExamEngineNotifier extends Notifier<ExamEngineState> {
  Timer? _timer;
  DateTime? _examStartTime;
  int _totalDurationSeconds = 0;

  @override
  ExamEngineState build() {
    ref.onDispose(() => _timer?.cancel());
    // Auto-restore active draft if app crashed or was killed mid-exam
    Future.microtask(() => _restoreActiveDraftIfExists());
    return const ExamEngineState();
  }

  Future<bool> startExam(ExamConfig config) async {
    state = state.copyWith(
      appState: AppState.loading,
      errorDetails: '',
    );
    try {
      final supabase = Supabase.instance.client;

      final chaptersList = (config.chapters == 'All' || config.chapters.isEmpty)
          ? null
          : config.chapters.split(',').map((c) => c.trim()).toList();

      final topicsList =
          (config.topics == 'General' ||
              config.topics == 'All' ||
              config.topics.isEmpty)
          ? null
          : config.topics.split(',').map((t) => t.trim()).toList();

      final difficultiesList =
          (config.difficulty == 'Mixed' ||
              config.difficulty == 'All' ||
              config.difficulty.isEmpty)
          ? null
          : config.difficulty.split('+').map((d) => d.trim()).toList();

      final examTypesList =
          (config.examType == 'Mixed' ||
              config.examType == 'All' ||
              config.examType.isEmpty)
          ? null
          : config.examType.split('+').map((e) => e.trim()).toList();

      // Generate all possible subject spellings/encodings (e.g. য় vs য+়, slug, label)
      final subjectVariants = <String>{};
      subjectVariants.add(config.subject);
      if (config.subjectLabel.isNotEmpty) {
        subjectVariants.add(config.subjectLabel);
      }
      for (final s in subjectVariants.toList()) {
        subjectVariants.add(s.replaceAll('\u09df', '\u09af\u09bc')); // য় -> য+়
        subjectVariants.add(s.replaceAll('\u09af\u09bc', '\u09df')); // য+় -> য়
        subjectVariants.add(s.replaceAll('২য়', '২য়'));
        subjectVariants.add(s.replaceAll('২য়', '২য়'));
        subjectVariants.add(s.replaceAll('১ম', '১ম'));
      }

      List<Question> generatedQuestions = [];

      // 1. Try Adaptive Mock Exam RPC (75% New + 25% Spaced Repetition Weakness Mix)
      for (final sVar in subjectVariants) {
        if (generatedQuestions.isNotEmpty) break;
        try {
          final data = await supabase.rpc(
            'get_adaptive_mock_exam_questions',
            params: {
              'p_user_id': supabase.auth.currentUser?.id,
              'p_subject': sVar,
              'p_subject_name': sVar,
              'p_total': config.questionCount,
              'p_chapters': chaptersList,
              'p_topics': topicsList,
              'p_difficulties': difficultiesList,
              'p_exam_types': examTypesList,
            },
          );
          final qList = (data as List<dynamic>?) ?? [];
          if (qList.isNotEmpty) {
            final parsed = qList
                .map((e) => Question.fromJson(e as Map<String, dynamic>))
                .toList();
            generatedQuestions = OfflineQuestionBankService.balanceQuestionsByChapter(
              parsed,
              config.questionCount,
              chaptersList,
            );
            debugPrint('[ExamProvider] Adaptive Smart Mock returned ${generatedQuestions.length} questions');
          }
        } catch (rpcErr) {
          debugPrint(
            '[ExamProvider] RPC get_adaptive_mock_exam_questions error for $sVar: $rpcErr',
          );
        }

        // Secondary Distributed RPC Fallback
        if (generatedQuestions.isEmpty) {
          try {
            final data = await supabase.rpc(
              'get_distributed_exam_questions',
              params: {
                'p_user_id': supabase.auth.currentUser?.id,
                'p_subject': sVar,
                'p_subject_name': sVar,
                'p_total': config.questionCount,
                'p_chapters': chaptersList,
                'p_topics': topicsList,
                'p_difficulties': difficultiesList,
                'p_exam_types': examTypesList,
              },
            );
            final qList = (data as List<dynamic>?) ?? [];
            if (qList.isNotEmpty) {
              final parsed = qList
                  .map((e) => Question.fromJson(e as Map<String, dynamic>))
                  .toList();
              generatedQuestions = OfflineQuestionBankService.balanceQuestionsByChapter(
                parsed,
                config.questionCount,
                chaptersList,
              );
            }
          } catch (rpcErr) {
            debugPrint(
              '[ExamProvider] RPC get_distributed_exam_questions error for $sVar: $rpcErr',
            );
          }
        }
      }

      // 2. Fallback: Direct query from questions table
      if (generatedQuestions.isEmpty) {
        try {
          debugPrint(
            '[ExamProvider] RPC failed, falling back to direct questions query with balanced sampling',
          );
          var query = supabase
              .from('questions')
              .select('*')
              .inFilter('subject', subjectVariants.toList());

          if (chaptersList != null && chaptersList.isNotEmpty) {
            final allChapterVariants = <String>{};
            for (final ch in chaptersList) {
              allChapterVariants.addAll(BanglaNameHelper.getChapterSearchVariants(ch));
            }
            query = query.inFilter('chapter', allChapterVariants.toList());
          }
          if (topicsList != null && topicsList.isNotEmpty) {
            query = query.inFilter('topic', topicsList);
          }
          if (difficultiesList != null && difficultiesList.isNotEmpty) {
            query = query.inFilter('difficulty', difficultiesList);
          }
          if (examTypesList != null && examTypesList.isNotEmpty) {
            query = query.inFilter('exam_type', examTypesList);
          }

          final fallbackData = await query.limit(config.questionCount * 3);
          final allQuestions = List<dynamic>.from(fallbackData as List)
              .map((e) => Question.fromJson(e as Map<String, dynamic>))
              .toList();
          generatedQuestions = OfflineQuestionBankService.balanceQuestionsByChapter(
            allQuestions,
            config.questionCount,
            chaptersList,
          );
        } catch (directErr) {
          debugPrint('[ExamProvider] Direct questions query error (likely offline): $directErr');
        }
      }

      // 3. Fallback: Load from local offline question bank
      if (generatedQuestions.isEmpty) {
        debugPrint('[ExamProvider] Trying offline question bank fallback...');
        generatedQuestions = await OfflineQuestionBankService.getQuestions(
          subject: config.subject,
          chapters: chaptersList,
          count: config.questionCount,
        );
      } else {
        // Automatically cache successfully fetched questions for future offline availability
        OfflineQuestionBankService.cacheQuestions(generatedQuestions);
      }

      if (generatedQuestions.isEmpty) {
        state = state.copyWith(appState: AppState.idle);
        throw Exception('কোনো প্রশ্ন পাওয়া যায়নি। ইন্টারনেট সংযোগ অথবা অফলাইন ডাটা চেক করুন।');
      }

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

      // Create session in DB (non-fatal — exam continues even if this fails)
      final authId = supabase.auth.currentUser?.id;
      String? sessionId;
      if (authId != null) {
        try {
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
        } catch (sessionErr) {
          debugPrint(
            '[ExamProvider] exam_sessions insert error (non-fatal): $sessionErr',
          );
        }
      }

      // Fetch bookmarks for the generated questions
      Set<String> initialBookmarks = {};
      if (authId != null && generatedQuestions.isNotEmpty) {
        try {
          final bRes = await supabase
              .from('bookmarks')
              .select('question_id')
              .eq('user_id', authId)
              .inFilter(
                'question_id',
                generatedQuestions.map((q) => q.id).toList(),
              );
          initialBookmarks = (bRes as List)
              .map((row) => row['question_id'].toString())
              .toSet();
        } catch (e) {
          debugPrint('[ExamProvider] Bookmark fetch error: $e');
        }
      }

      state = state.copyWith(
        appState: AppState.instructions,
        questions: generatedQuestions,
        examDetails: details,
        userAnswers: {},
        flaggedQuestions: {},
        bookmarkedQuestions: initialBookmarks,
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
      _examStartTime = DateTime.now();
      _totalDurationSeconds = duration;
      state = state.copyWith(timeLeft: duration, appState: AppState.active);
      _persistActiveDraft();
      _timer?.cancel();
      _timer = Timer.periodic(const Duration(seconds: 1), (t) {
        if (_examStartTime == null) return;
        final elapsed = DateTime.now().difference(_examStartTime!).inSeconds;
        final newTimeLeft = _totalDurationSeconds - elapsed;

        if (newTimeLeft <= 0) {
          t.cancel();
          submitExam();
        } else {
          state = state.copyWith(timeLeft: newTimeLeft);
        }
      });
    }
  }

  void syncTimerOnResume() {
    if (_examStartTime != null && state.appState == AppState.active) {
      final elapsed = DateTime.now().difference(_examStartTime!).inSeconds;
      final newTimeLeft = _totalDurationSeconds - elapsed;
      if (newTimeLeft <= 0) {
        _timer?.cancel();
        submitExam();
      } else {
        state = state.copyWith(timeLeft: newTimeLeft);
        _persistActiveDraft();
      }
    }
  }

  void _persistActiveDraft() {
    if (state.appState == AppState.active && state.questions.isNotEmpty && _examStartTime != null) {
      final targetEndTimeMs = _examStartTime!.millisecondsSinceEpoch + (_totalDurationSeconds * 1000);
      LocalExamCacheService.saveActiveExamDraft({
        'questions': state.questions.map((q) => q.toJson()).toList(),
        'examDetails': state.examDetails != null
            ? {
                'subject': state.examDetails!.subject,
                'subjectLabel': state.examDetails!.subjectLabel,
                'examType': state.examDetails!.examType,
                'chapters': state.examDetails!.chapters,
                'topics': state.examDetails!.topics,
                'totalQuestions': state.examDetails!.totalQuestions,
                'durationMinutes': state.examDetails!.durationMinutes,
                'totalMarks': state.examDetails!.totalMarks,
                'negativeMarking': state.examDetails!.negativeMarking,
              }
            : null,
        'userAnswers': state.userAnswers,
        'flaggedQuestions': state.flaggedQuestions.toList(),
        'bookmarkedQuestions': state.bookmarkedQuestions.toList(),
        'dbSessionId': state.dbSessionId,
        'targetEndTimeMs': targetEndTimeMs,
        'totalDurationSeconds': _totalDurationSeconds,
        'savedAt': DateTime.now().millisecondsSinceEpoch,
      });
    }
  }

  Future<void> _restoreActiveDraftIfExists() async {
    try {
      final draft = await LocalExamCacheService.getActiveExamDraft();
      if (draft == null) return;

      final targetEndTimeMs = draft['targetEndTimeMs'] as int?;
      if (targetEndTimeMs == null) return;

      final nowMs = DateTime.now().millisecondsSinceEpoch;
      final rawQuestions = draft['questions'] as List<dynamic>? ?? [];
      final questions = rawQuestions
          .map((e) => Question.fromJson(e as Map<String, dynamic>))
          .toList();
      if (questions.isEmpty) return;

      final rawDetails = draft['examDetails'] as Map<String, dynamic>?;
      final details = rawDetails != null
          ? ExamDetails(
              subject: rawDetails['subject'] ?? '',
              subjectLabel: rawDetails['subjectLabel'],
              examType: rawDetails['examType'],
              chapters: rawDetails['chapters'],
              topics: rawDetails['topics'],
              totalQuestions: rawDetails['totalQuestions'] ?? questions.length,
              durationMinutes: rawDetails['durationMinutes'] ?? 0,
              totalMarks: rawDetails['totalMarks'] ??
                  questions.fold(0, (s, q) => s + q.points),
              negativeMarking:
                  (rawDetails['negativeMarking'] as num?)?.toDouble() ?? 0.25,
            )
          : null;

      final rawAnswers = draft['userAnswers'] as Map<String, dynamic>? ?? {};
      final userAnswers = rawAnswers
          .map((k, v) => MapEntry(k, (v as num).toInt()));
      final flagged = (draft['flaggedQuestions'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toSet();
      final bookmarked = (draft['bookmarkedQuestions'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toSet();
      final dbSessionId = draft['dbSessionId']?.toString();
      final totalDuration = draft['totalDurationSeconds'] as int? ??
          ((details?.durationMinutes ?? 0) * 60);

      final remainingSeconds = ((targetEndTimeMs - nowMs) / 1000).round();

      if (remainingSeconds <= 0) {
        // Expired while app was closed / battery dead — auto-evaluate & submit saved answers
        state = state.copyWith(
          appState: AppState.active,
          questions: questions,
          examDetails: details,
          userAnswers: userAnswers,
          flaggedQuestions: flagged,
          bookmarkedQuestions: bookmarked,
          dbSessionId: dbSessionId,
          timeLeft: 0,
        );
        await submitExam();
      } else {
        // Active — seamlessly restore answers and resume countdown
        _totalDurationSeconds = totalDuration;
        _examStartTime = DateTime.fromMillisecondsSinceEpoch(
            targetEndTimeMs - (totalDuration * 1000));
        state = state.copyWith(
          appState: AppState.active,
          questions: questions,
          examDetails: details,
          userAnswers: userAnswers,
          flaggedQuestions: flagged,
          bookmarkedQuestions: bookmarked,
          dbSessionId: dbSessionId,
          timeLeft: remainingSeconds,
        );
        beginTimer(remainingSeconds);
      }
    } catch (e) {
      debugPrint('[ExamProvider] Failed to restore active draft: $e');
    }
  }

  void setAnswer(String questionId, int optionIndex) {
    final updated = Map<String, int>.from(state.userAnswers);
    updated[questionId] = optionIndex;
    state = state.copyWith(userAnswers: updated);
    _persistActiveDraft();
  }

  void toggleFlag(String questionId) {
    final updated = Set<String>.from(state.flaggedQuestions);
    if (updated.contains(questionId)) {
      updated.remove(questionId);
    } else {
      updated.add(questionId);
    }
    state = state.copyWith(flaggedQuestions: updated);
    _persistActiveDraft();
  }

  void toggleBookmark(String questionId) {
    final updated = Set<String>.from(state.bookmarkedQuestions);
    final wasBookmarked = updated.contains(questionId);
    if (wasBookmarked) {
      updated.remove(questionId);
    } else {
      updated.add(questionId);
    }
    state = state.copyWith(bookmarkedQuestions: updated);
    _persistActiveDraft();

    // Persist to Supabase bookmarks table
    final supabase = Supabase.instance.client;
    final uid = supabase.auth.currentUser?.id;
    if (uid != null) {
      if (wasBookmarked) {
        supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', uid)
            .eq('question_id', questionId)
            .then((_) {})
            .catchError((_) {});
      } else {
        supabase
            .from('bookmarks')
            .insert({'user_id': uid, 'question_id': questionId})
            .then((_) {})
            .catchError((_) {});
      }
    }
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

    var result = ExamResult(
      id: state.dbSessionId ?? DateTime.now().millisecondsSinceEpoch.toString(),
      subject: state.examDetails?.subject ?? 'Unknown',
      subjectLabel: state.examDetails?.subjectLabel,
      examType: state.examDetails?.examType,
      date: DateTime.now().toUtc().toIso8601String(),
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
      submissionType: 'digital',
      userAnswers: state.userAnswers,
      status: 'evaluated',
    );

    // 1. Immediately cache result locally for 100% offline access
    await LocalExamCacheService.saveExamResult(result);

    // 2. Save to DB
    final supabase = Supabase.instance.client;
    final session = await supabase.auth.getSession();
    final authId =
        ref.read(authProvider)?.id ??
        supabase.auth.currentUser?.id ??
      session?.user.id;
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

        final nowIso = DateTime.now().toUtc().toIso8601String();
        final insertRes = await supabase.from('exam_results').insert({
          'user_id': authId,
          'subject': result.subject,
          'subject_label': result.subjectLabel,
          'exam_type': result.examType,
          'date': nowIso,
          'created_at': nowIso,
          'score': result.score,
          'total_marks': result.totalMarks,
          'correct_count': result.correctCount,
          'wrong_count': result.wrongCount,
          'time_taken': result.timeTaken,
          'total_questions': result.totalQuestions,
          'questions': questionsJson,
          'user_answers': userAnswersJson,
          'negative_marking': result.negativeMarking,
          'status': 'evaluated',
        }).select('id').maybeSingle();

        if (insertRes != null && insertRes['id'] != null) {
          final serverId = insertRes['id'].toString();
          result = result.copyWith(id: serverId);
          await LocalExamCacheService.saveExamResult(result);
        }

        // Instantly sync streak so the UI is immediately correct
        final streakData = await StreakService.syncStreak(authId);
        ref.read(userProfileProvider.notifier).updateStreak(streakData.streakCount);

        // Calculate comprehensive production-grade XP
        final xpBreakdown = ExamXpCalculator.calculateExamXp(
          totalQuestions: result.totalQuestions,
          correctCount: result.correctCount,
          wrongCount: result.wrongCount,
          timeTakenSeconds: result.timeTaken,
          durationMinutes: state.examDetails?.durationMinutes ?? 25,
          currentStreak: streakData.streakCount,
          isLiveExam: false,
        );
        final xpEarned = xpBreakdown.totalXpEarned;

        if (xpEarned > 0) {
          bool rpcSuccess = false;
          // Atomic RPC call with retry (prevents race conditions)
          for (int attempt = 0; attempt < 2; attempt++) {
            try {
              await supabase.rpc(
                'increment_user_xp',
                params: {'uid': authId, 'amount': xpEarned},
              );
              rpcSuccess = true;
              break;
            } catch (xpRpcErr) {
              debugPrint(
                '[ExamProvider] increment_user_xp RPC attempt ${attempt + 1} failed: $xpRpcErr',
              );
              if (attempt < 1) {
                await Future.delayed(const Duration(milliseconds: 300));
              }
            }
          }

          if (!rpcSuccess) {
            debugPrint(
              '[ExamProvider] Atomic XP update failed after retries. Will sync on next connection.',
            );
          }
        }

        // Sync Spaced Repetition (Leitner 5-Box Mistake & Weakness Tracker)
        try {
          final answeredQuestions = state.questions.where((q) => state.userAnswers.containsKey(q.id)).toList();
          if (answeredQuestions.isNotEmpty) {
            final qIds = answeredQuestions.map((q) => q.id).toList();
            final areCorrect = answeredQuestions.map((q) => state.userAnswers[q.id] == q.correctAnswerIndex).toList();
            await supabase.rpc('record_exam_spaced_repetition', params: {
              'p_user_id': authId,
              'p_question_ids': qIds,
              'p_are_correct': areCorrect,
            });
          }
        } catch (srErr) {
          debugPrint('[ExamProvider] record_exam_spaced_repetition error: $srErr');
        }
      } catch (e) {
        debugPrint('[ExamProvider] submitExam DB error (offline): $e. Queuing for auto-sync...');
        await OfflineExamSyncQueueService.queueOfflineExam(
          result: result,
          userId: authId,
        );
      }

      // Sync any queued offline exams in background
      unawaited(OfflineExamSyncQueueService.syncPendingExams());

      // Invalidate dashboard and profile providers so updated stats show immediately
      ref.invalidate(dashboardSubjectStatsProvider);
      ref.invalidate(userProfileProvider);
      ref.read(examHistoryRefreshTriggerProvider.notifier).trigger();
      // Clear SharedPreferences stats cache so next build() re-fetches from DB
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('subject_stats_$authId');
        await prefs.remove('profile_$authId');
        await prefs.remove('cached_history_list');
      } catch (_) {}
    }

    // Clear active ongoing draft once evaluated
    await LocalExamCacheService.clearActiveExamDraft();

    state = state.copyWith(
      appState: AppState.completed,
      completedResult: result,
    );
  }

  void resetExam() {
    _timer?.cancel();
    LocalExamCacheService.clearActiveExamDraft();
    state = const ExamEngineState();
  }
}

final examEngineProvider =
    NotifierProvider<ExamEngineNotifier, ExamEngineState>(() {
      return ExamEngineNotifier();
    });
