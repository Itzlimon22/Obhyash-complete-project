import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/models.dart';
import '../../exam/domain/exam_models.dart';

// Provides the active filter (All, Ongoing, Upcoming)
class LiveExamFilterNotifier extends Notifier<String> {
  @override
  String build() => 'All';

  void updateFilter(String newFilter) {
    state = newFilter;
  }
}

final liveExamFilterProvider = NotifierProvider<LiveExamFilterNotifier, String>(
  () => LiveExamFilterNotifier(),
);

// Provides the search query
class LiveExamSearchNotifier extends Notifier<String> {
  @override
  String build() => '';

  void updateSearch(String newSearch) {
    state = newSearch;
  }
}

final liveExamSearchProvider = NotifierProvider<LiveExamSearchNotifier, String>(
  () => LiveExamSearchNotifier(),
);

// The category being viewed (e.g., BCS, Bank, Primary)
class LiveExamCategoryNotifier extends Notifier<String> {
  @override
  String build() => '';

  void updateCategory(String newCategory) {
    state = newCategory;
  }
}

final liveExamCategoryProvider =
    NotifierProvider<LiveExamCategoryNotifier, String>(
      () => LiveExamCategoryNotifier(),
    );

// Fetches the live exams from Supabase based on the category
final liveExamsProvider = FutureProvider.autoDispose<List<LiveExam>>((
  ref,
) async {
  final rawCategory = ref.watch(liveExamCategoryProvider).trim();

  final supabase = Supabase.instance.client;
  final user = supabase.auth.currentUser;

  // 1. Fetch exams from Supabase
  var filterBuilder = supabase
      .from('live_exams')
      .select()
      .inFilter('status', ['published', 'active', 'ongoing', 'upcoming', 'Published']);

  if (rawCategory.isEmpty || rawCategory.toLowerCase() == 'all' || rawCategory.toLowerCase() == 'hsc') {
    // Show all HSC & Admission tracks (HSC Science, Medical, Engineering, Varsity A-Unit, All)
    filterBuilder = filterBuilder.or('category.ilike.hsc,category.ilike.medical,category.ilike.engineering,category.ilike.varsity_a,category.ilike.varsity,category.ilike.all,category.ilike.general');
  } else {
    filterBuilder = filterBuilder.or('category.ilike.$rawCategory,category.ilike.all,category.ilike.general');
  }

  final examsResponse = await filterBuilder.order('start_time', ascending: false);

  final List<LiveExam> exams = (examsResponse as List)
      .map((e) => LiveExam.fromJson(e as Map<String, dynamic>))
      .toList();

  // 2. Fetch attempts for the current user if logged in
  if (user != null && exams.isNotEmpty) {
    final examIds = exams.map((e) => e.id).toList();
    final attemptsResponse = await supabase
        .from('live_exam_attempts')
        .select('live_exam_id, status')
        .eq('user_id', user.id)
        .inFilter('live_exam_id', examIds);

    final attempts = (attemptsResponse as List).cast<Map<String, dynamic>>();

    // Map status back to the exams
    for (int i = 0; i < exams.length; i++) {
      final attempt = attempts
          .where((a) => a['live_exam_id'] == exams[i].id)
          .firstOrNull;
      if (attempt != null) {
        // Recreate the model with userAttemptStatus
        exams[i] = LiveExam(
          id: exams[i].id,
          title: exams[i].title,
          description: exams[i].description,
          startTime: exams[i].startTime,
          endTime: exams[i].endTime,
          durationMinutes: exams[i].durationMinutes,
          totalQuestions: exams[i].totalQuestions,
          totalMarks: exams[i].totalMarks,
          negativeMarking: exams[i].negativeMarking,
          status: exams[i].status,
          category: exams[i].category,
          userAttemptStatus: attempt['status'] as String?,
        );
      }
    }
  }

  return exams;
});

// Provides the filtered list of exams based on search query and active filter
final filteredLiveExamsProvider = Provider.autoDispose<List<LiveExam>>((ref) {
  final examsAsync = ref.watch(liveExamsProvider);
  final filter = ref.watch(liveExamFilterProvider);
  final search = ref.watch(liveExamSearchProvider).toLowerCase();

  return examsAsync.when(
    data: (exams) {
      return exams.where((exam) {
        // Apply search filter
        if (search.isNotEmpty && !exam.title.toLowerCase().contains(search)) {
          return false;
        }

        // Apply tab filter
        if (filter == 'Ongoing' && !exam.isOngoing) return false;
        if (filter == 'Upcoming' && !exam.isUpcoming) return false;

        return true;
      }).toList();
    },
    loading: () => [],
    error: (_, _) => [],
  );
});

// Single Exam Details Provider
final liveExamDetailsProvider = FutureProvider.autoDispose.family<
    ({LiveExam exam, LiveExamAttempt? attempt}), String>((ref, examId) async {
  final supabase = Supabase.instance.client;
  final user = supabase.auth.currentUser;

  // 1. Fetch Exam with fallback
  Map<String, dynamic> examData;
  try {
    examData = await supabase
        .from('live_exams')
        .select('*, total_questions:live_exam_questions(count)')
        .eq('id', examId)
        .single();
  } catch (_) {
    examData = await supabase
        .from('live_exams')
        .select()
        .eq('id', examId)
        .single();
  }

  final exam = LiveExam.fromJson(examData);

  // 2. Fetch User Attempt safely
  LiveExamAttempt? attempt;
  if (user != null) {
    try {
      final attemptData = await supabase
          .from('live_exam_attempts')
          .select()
          .eq('live_exam_id', examId)
          .eq('user_id', user.id)
          .maybeSingle();

      if (attemptData != null) {
        attempt = LiveExamAttempt.fromJson(attemptData);
      }
    } catch (_) {}
  }

  return (exam: exam, attempt: attempt);
});

// Questions for Live Exam Engine
final liveExamQuestionsProvider =
    FutureProvider.autoDispose.family<List<Question>, String>((ref, examId) async {
  final supabase = Supabase.instance.client;
  final res = await supabase
      .from('live_exam_questions')
      .select('serial, points, questions(*)')
      .eq('live_exam_id', examId)
      .order('serial', ascending: true);

  final List<Question> questions = [];
  for (final item in res as List) {
    final qMap = item['questions'] as Map<String, dynamic>?;
    if (qMap != null) {
      questions.add(Question.fromJson(qMap));
    }
  }
  return questions;
});

// Leaderboard Provider
final liveExamLeaderboardProvider = FutureProvider.autoDispose
    .family<List<LiveExamLeaderboardEntry>, String>((ref, examId) async {
  final supabase = Supabase.instance.client;
  final data = await supabase
      .from('live_exam_attempts')
      .select('id, score, correct_count, wrong_count, submit_time, users(name, institute, avatar_color, avatar_url)')
      .eq('live_exam_id', examId)
      .eq('status', 'submitted')
      .order('score', ascending: false)
      .order('wrong_count', ascending: true)
      .order('submit_time', ascending: true)
      .limit(100);

  return (data as List)
      .map((e) => LiveExamLeaderboardEntry.fromJson(e as Map<String, dynamic>))
      .toList();
});

// Solution Provider (Questions + User Answers)
final liveExamSolutionProvider = FutureProvider.autoDispose.family<
    ({List<Question> questions, Map<String, int> userAnswers}), String>(
    (ref, examId) async {
  final questions = await ref.watch(liveExamQuestionsProvider(examId).future);
  final details = await ref.watch(liveExamDetailsProvider(examId).future);

  final userAnswers = details.attempt?.userAnswers ?? {};

  return (questions: questions, userAnswers: userAnswers);
});

// Practice History Provider
final liveExamPracticeHistoryProvider = FutureProvider.autoDispose
    .family<List<LiveExamPracticeAttempt>, String>((ref, examId) async {
  final supabase = Supabase.instance.client;
  final user = supabase.auth.currentUser;
  if (user == null) return [];

  try {
    final res = await supabase
        .from('live_exam_practice_history')
        .select()
        .eq('live_exam_id', examId)
        .eq('user_id', user.id)
        .order('submit_time', ascending: false);

    return (res as List)
        .map((e) => LiveExamPracticeAttempt.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    return [];
  }
});


