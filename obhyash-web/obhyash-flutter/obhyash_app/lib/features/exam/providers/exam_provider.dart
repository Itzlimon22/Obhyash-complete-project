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
      final subjectVariants = BanglaNameHelper.getSubjectSearchVariants(
        config.subject,
        config.subjectLabel,
      );

      final expandedChapters = chaptersList != null && chaptersList.isNotEmpty
          ? chaptersList.expand((c) => BanglaNameHelper.getChapterSearchVariants(c)).toSet().toList()
          : null;

      final expandedTopics = topicsList != null && topicsList.isNotEmpty
          ? topicsList.expand((t) => BanglaNameHelper.getTopicSearchVariants(t)).toSet().toList()
          : null;

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
              'p_chapters': expandedChapters,
              'p_topics': expandedTopics,
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

        // Try chapter level if specific topic returned 0
        if (generatedQuestions.isEmpty && expandedTopics != null && expandedTopics.isNotEmpty) {
          try {
            final data = await supabase.rpc(
              'get_adaptive_mock_exam_questions',
              params: {
                'p_user_id': supabase.auth.currentUser?.id,
                'p_subject': sVar,
                'p_subject_name': sVar,
                'p_total': config.questionCount,
                'p_chapters': expandedChapters,
                'p_topics': null,
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
          } catch (_) {}
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
                'p_chapters': expandedChapters,
                'p_topics': expandedTopics,
                'p_difficulties': difficultiesList,
                'p_exam_types': examTypesList,
              },
            );
            final qList = (data as List<dynamic>?) ?? [];
            if (qList.isNotEmpty) {
              final parsed = qList
                  .map((e) => Question.fromJson(e as Map<String, dynamic>))
                  .where((q) => q.isStrictMcq)
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
              .inFilter('subject', subjectVariants)
              .not('options', 'is', null);

          if (expandedChapters != null && expandedChapters.isNotEmpty) {
            query = query.inFilter('chapter', expandedChapters);
          }
          if (expandedTopics != null && expandedTopics.isNotEmpty) {
            query = query.inFilter('topic', expandedTopics);
          }
          if (difficultiesList != null && difficultiesList.isNotEmpty) {
            query = query.inFilter('difficulty', difficultiesList);
          }
          if (examTypesList != null && examTypesList.isNotEmpty) {
            final orConditions = examTypesList.map((t) => 'exam_type.ilike.%$t%').join(',');
            query = query.or(orConditions);
          }

          var fallbackData = await query.limit(config.questionCount * 4);
          var qList = List<dynamic>.from(fallbackData as List);

          // If topic query yielded 0, retry without topic filter to get chapter questions
          if (qList.isEmpty && expandedTopics != null && expandedTopics.isNotEmpty) {
            var retryQuery = supabase
                .from('questions')
                .select('*')
                .inFilter('subject', subjectVariants)
                .not('options', 'is', null);

            if (expandedChapters != null && expandedChapters.isNotEmpty) {
              retryQuery = retryQuery.inFilter('chapter', expandedChapters);
            }
            if (difficultiesList != null && difficultiesList.isNotEmpty) {
              retryQuery = retryQuery.inFilter('difficulty', difficultiesList);
            }
            if (examTypesList != null && examTypesList.isNotEmpty) {
              final orConditions = examTypesList.map((t) => 'exam_type.ilike.%$t%').join(',');
              retryQuery = retryQuery.or(orConditions);
            }
            final retryData = await retryQuery.limit(config.questionCount * 4);
            qList = List<dynamic>.from(retryData as List);
          }

          var allQuestions = qList
              .map((e) => Question.fromJson(e as Map<String, dynamic>))
              .where((q) => q.isStrictMcq)
              .toList();

          // Target specific exclusion filter (e.g. Medical students should not get pure Engineering questions)
          if (examTypesList != null && examTypesList.isNotEmpty) {
            final isMedicalTarget = examTypesList.any((e) => e.toLowerCase() == 'medical');
            final isEngineeringRequested = examTypesList.any((e) => e.toLowerCase() == 'engineering');

            if (isMedicalTarget && !isEngineeringRequested) {
              allQuestions = allQuestions.where((q) {
                final qType = (q.examType ?? '').toLowerCase();
                // If it contains engineering and NOT medical, exclude it
                if (qType.contains('engineering') && !qType.contains('medical')) {
                  return false;
                }
                return true;
              }).toList();
            }
          }

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

  Future<bool> startMultiSubjectPresetExam({
    required String examTitle,
    required String examLabel,
    required String examType,
    required int durationMinutes,
    required double negativeMarking,
    required List<PresetSubjectDistribution> subjectDistribution,
  }) async {
    state = state.copyWith(
      appState: AppState.loading,
      errorDetails: '',
    );
    try {
      final supabase = Supabase.instance.client;
      List<Question> allPresetQuestions = [];

      // 1. Fetch each subject in parallel with 1st/2nd paper & chapter/difficulty balancing
      final subjectFutures = subjectDistribution.map((item) async {
        final split = BanglaNameHelper.getSubjectPaperSplitVariants(
          item.subject,
          item.subject,
        );

        List<Question> subQuestions = [];
        final hasPapers = split.paper2.isNotEmpty;

        // Helper to query question pool for given variants
        Future<List<Question>> fetchCandidatePool(List<String> variants, int countNeeded) async {
          if (variants.isEmpty || countNeeded <= 0) return [];
          final candidates = <Question>[];

          // 1. Target examType priority
          try {
            var query = supabase
                .from('questions')
                .select('*')
                .inFilter('subject', variants)
                .not('options', 'is', null);

            if (examType.isNotEmpty && examType != 'All' && examType != 'Mixed') {
              query = query.ilike('exam_type', '%$examType%');
            }

            final List<dynamic> res = await query.limit(countNeeded * 8);
            if (res.isNotEmpty) {
              final parsed = res
                  .map((e) => Question.fromJson(e as Map<String, dynamic>))
                  .where((q) => q.isAdmissionStandardMcq)
                  .toList();
              candidates.addAll(parsed);
            }
          } catch (e) {
            debugPrint('[ExamProvider] Query pool error for $variants: $e');
          }

          // 2. Fallback general pool for these variants if needed
          if (candidates.length < countNeeded * 2) {
            try {
              final List<dynamic> res = await supabase
                  .from('questions')
                  .select('*')
                  .inFilter('subject', variants)
                  .not('options', 'is', null)
                  .limit(countNeeded * 8);

              if (res.isNotEmpty) {
                final parsed = res
                    .map((e) => Question.fromJson(e as Map<String, dynamic>))
                    .where((q) => q.isAdmissionStandardMcq)
                    .toList();
                for (final q in parsed) {
                  if (!candidates.any((c) => c.id == q.id)) {
                    candidates.add(q);
                  }
                }
              }
            } catch (_) {}
          }

          // 3. Fallback: all search variants of THIS subject (strictly within this subject)
          if (candidates.length < countNeeded * 2) {
            try {
              final allSubjectSlugs = BanglaNameHelper.getSubjectSearchVariants(
                item.subject,
                item.subject,
              );
              final List<dynamic> res = await supabase
                  .from('questions')
                  .select('*')
                  .inFilter('subject', allSubjectSlugs)
                  .not('options', 'is', null)
                  .limit(countNeeded * 8);

              if (res.isNotEmpty) {
                final parsed = res
                    .map((e) => Question.fromJson(e as Map<String, dynamic>))
                    .where((q) => q.isAdmissionStandardMcq)
                    .toList();
                for (final q in parsed) {
                  if (!candidates.any((c) => c.id == q.id)) {
                    candidates.add(q);
                  }
                }
              }
            } catch (_) {}
          }

          return candidates;
        }

        if (hasPapers) {
          // Equal 50/50 target between Paper 1 and Paper 2
          final p1Target = (item.count / 2).ceil();
          final p2Target = item.count - p1Target;

          final p1PoolFuture = fetchCandidatePool(split.paper1, p1Target);
          final p2PoolFuture = fetchCandidatePool(split.paper2, p2Target);
          final poolResults = await Future.wait([p1PoolFuture, p2PoolFuture]);

          final p1Candidates = poolResults[0];
          final p2Candidates = poolResults[1];

          final p1Sampled = _sampleUniformByChapterAndDifficulty(p1Candidates, p1Target);
          final p2Sampled = _sampleUniformByChapterAndDifficulty(p2Candidates, p2Target);

          subQuestions.addAll(p1Sampled);
          subQuestions.addAll(p2Sampled);

          // If Paper 1 or Paper 2 fell short, let the other paper fill the gap
          if (subQuestions.length < item.count) {
            final remainingNeeded = item.count - subQuestions.length;
            final combinedExtraPool = [...p1Candidates, ...p2Candidates]
                .where((q) => !subQuestions.any((sq) => sq.id == q.id))
                .toList();
            final extraSampled = _sampleUniformByChapterAndDifficulty(
              combinedExtraPool,
              remainingNeeded,
            );
            subQuestions.addAll(extraSampled);
          }
        } else {
          // Single paper subject (e.g. ICT, General Math, GK)
          final candidates = await fetchCandidatePool(split.paper1, item.count);
          subQuestions = _sampleUniformByChapterAndDifficulty(candidates, item.count);
        }

        // Try RPC if direct query gave fewer questions
        if (subQuestions.length < item.count) {
          final allVariants = BanglaNameHelper.getSubjectSearchVariants(item.subject, item.subject);
          for (final sVar in allVariants) {
            if (subQuestions.length >= item.count) break;
            try {
              final data = await supabase.rpc(
                'get_adaptive_mock_exam_questions',
                params: {
                  'p_user_id': supabase.auth.currentUser?.id,
                  'p_subject': sVar,
                  'p_subject_name': sVar,
                  'p_total': item.count,
                },
              );
              if (data is List && data.isNotEmpty) {
                final parsed = data
                    .map((e) => Question.fromJson(e as Map<String, dynamic>))
                    .where((q) => q.isAdmissionStandardMcq)
                    .toList();
                for (final q in parsed) {
                  if (subQuestions.length >= item.count) break;
                  if (!subQuestions.any((existing) => existing.id == q.id)) {
                    subQuestions.add(q);
                  }
                }
              }
            } catch (_) {}
          }
        }

        // Fallback to offline/cached question bank for this subject only
        if (subQuestions.length < item.count) {
          try {
            final offline = await OfflineQuestionBankService.getQuestions(
              subject: item.subject,
              count: item.count - subQuestions.length,
            );
            for (final q in offline) {
              if (!q.isMultipleCompletionMcq && !subQuestions.any((existing) => existing.id == q.id)) {
                subQuestions.add(q);
              }
            }
          } catch (_) {}
        }

        // Normalize subject name to main subject name (e.g. "রসায়ন") and shuffle 1st and 2nd paper questions within this subject
        final mainSubjectName = BanglaNameHelper.getMainSubjectName(item.subject, item.subject);
        subQuestions = subQuestions
            .map((q) => q.copyWith(subject: mainSubjectName))
            .toList()
          ..shuffle();

        return subQuestions;
      }).toList();

      final results = await Future.wait(subjectFutures);
      for (final subList in results) {
        allPresetQuestions.addAll(subList);
      }

      // Cache all fetched questions for offline availability
      if (allPresetQuestions.isNotEmpty) {
        OfflineQuestionBankService.cacheQuestions(allPresetQuestions);
      }

      if (allPresetQuestions.isEmpty) {
        state = state.copyWith(appState: AppState.idle);
        throw Exception('কোনো প্রশ্ন লোড করা সম্ভব হয়নি। ইন্টারনেট সংযোগ চেক করো।');
      }

      final details = ExamDetails(
        subject: examTitle,
        subjectLabel: examLabel,
        examType: examType,
        chapters: 'All',
        topics: 'All',
        totalQuestions: allPresetQuestions.length,
        durationMinutes: durationMinutes,
        totalMarks: allPresetQuestions.fold(0, (sum, q) => sum + q.points),
        negativeMarking: negativeMarking,
      );

      final authId = supabase.auth.currentUser?.id;
      String? sessionId;
      if (authId != null) {
        try {
          final sessionRes = await supabase
              .from('exam_sessions')
              .insert({
                'user_id': authId,
                'status': 'active',
                'subject': examTitle,
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

      Set<String> initialBookmarks = {};
      if (authId != null && allPresetQuestions.isNotEmpty) {
        try {
          final bRes = await supabase
              .from('bookmarks')
              .select('question_id')
              .eq('user_id', authId)
              .inFilter(
                'question_id',
                allPresetQuestions.map((q) => q.id).toList(),
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
        questions: allPresetQuestions,
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

  /// Uniformly samples questions across all available chapters and difficulty buckets (easy, medium, hard).
  static List<Question> _sampleUniformByChapterAndDifficulty(
    List<Question> pool,
    int targetCount,
  ) {
    if (pool.isEmpty || targetCount <= 0) return [];
    if (pool.length <= targetCount) {
      final res = List<Question>.from(pool)..shuffle();
      return res;
    }

    // 1. Group questions by Chapter
    final Map<String, List<Question>> byChapter = {};
    for (final q in pool) {
      final ch = q.chapter.trim().isEmpty ? 'General' : q.chapter.trim();
      byChapter.putIfAbsent(ch, () => []).add(q);
    }

    // 2. Separate each chapter into difficulty buckets
    final Map<String, Map<String, List<Question>>> chapterDiffMap = {};
    for (final entry in byChapter.entries) {
      final ch = entry.key;
      final qList = List<Question>.from(entry.value)..shuffle();
      chapterDiffMap[ch] = {
        'easy': qList.where((q) => q.difficulty == 'easy').toList(),
        'medium': qList.where((q) => q.difficulty == 'medium').toList(),
        'hard': qList.where((q) => q.difficulty == 'hard').toList(),
        'other': qList
            .where((q) =>
                q.difficulty != 'easy' &&
                q.difficulty != 'medium' &&
                q.difficulty != 'hard')
            .toList(),
      };
    }

    final selected = <Question>[];
    final selectedIds = <String>{};
    final chapters = chapterDiffMap.keys.toList()..shuffle();

    // Priority difficulty sequence for balanced admission distribution (approx 35% easy, 45% medium, 20% hard)
    final diffSequence = [
      'medium',
      'easy',
      'medium',
      'hard',
      'easy',
      'medium',
      'easy',
      'hard',
      'medium',
      'medium',
    ];
    int step = 0;

    // Round-robin selection across chapters to guarantee uniform coverage
    while (selected.length < targetCount && chapters.isNotEmpty) {
      bool addedInThisRound = false;
      for (final ch in List<String>.from(chapters)) {
        if (selected.length >= targetCount) break;
        final diffBuckets = chapterDiffMap[ch]!;
        final desiredDiff = diffSequence[step % diffSequence.length];

        Question? chosen;
        if (diffBuckets[desiredDiff] != null &&
            diffBuckets[desiredDiff]!.isNotEmpty) {
          chosen = diffBuckets[desiredDiff]!.removeLast();
        } else {
          // Fallback to any available question in this chapter
          for (final bucket in diffBuckets.values) {
            if (bucket.isNotEmpty) {
              chosen = bucket.removeLast();
              break;
            }
          }
        }

        if (chosen != null && !selectedIds.contains(chosen.id)) {
          selected.add(chosen);
          selectedIds.add(chosen.id);
          addedInThisRound = true;
          step++;
        }

        if (diffBuckets.values.every((b) => b.isEmpty)) {
          chapters.remove(ch);
        }
      }

      if (!addedInThisRound) break;
    }

    // Fallback fill if still under target count
    if (selected.length < targetCount) {
      final remainingPool = List<Question>.from(pool)..shuffle();
      for (final q in remainingPool) {
        if (selected.length >= targetCount) break;
        if (!selectedIds.contains(q.id)) {
          selected.add(q);
          selectedIds.add(q.id);
        }
      }
    }

    selected.shuffle();
    return selected;
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
    if (state.userAnswers.containsKey(questionId)) return; // Locked once selected
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

  void toggleBookmark(String questionId, {bool isPro = false, VoidCallback? onLimitReached}) {
    final updated = Set<String>.from(state.bookmarkedQuestions);
    final wasBookmarked = updated.contains(questionId);

    if (!wasBookmarked && !isPro && updated.length >= 25) {
      onLimitReached?.call();
      return;
    }

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
        if (q.isCorrectAnswer(ua)) {
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
                'correct_answer_indices': q.correctAnswerIndices,
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

          if (rpcSuccess) {
            ref.read(userProfileProvider.notifier).addXpLocally(xpEarned);
          }
        }

        // Sync Spaced Repetition (Leitner 5-Box Mistake & Weakness Tracker)
        try {
          final answeredQuestions = state.questions.where((q) => state.userAnswers.containsKey(q.id)).toList();
          if (answeredQuestions.isNotEmpty) {
            final qIds = answeredQuestions.map((q) => q.id).toList();
            final areCorrect = answeredQuestions.map((q) => q.isCorrectAnswer(state.userAnswers[q.id])).toList();
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

class ExamSetupTabNotifier extends Notifier<String> {
  @override
  String build() => 'mock';

  void setTab(String tab) {
    state = tab;
  }
}

final examSetupTabProvider =
    NotifierProvider<ExamSetupTabNotifier, String>(ExamSetupTabNotifier.new);
