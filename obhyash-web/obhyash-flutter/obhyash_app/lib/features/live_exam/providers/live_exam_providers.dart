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

// The category being viewed (e.g., engineering, medical, varsity, hsc, all)
class LiveExamCategoryNotifier extends Notifier<String> {
  @override
  String build() => 'all';

  void updateCategory(String newCategory) {
    state = newCategory;
  }
}

final liveExamCategoryProvider =
    NotifierProvider<LiveExamCategoryNotifier, String>(
      () => LiveExamCategoryNotifier(),
    );

/// Checks if an exam belongs to the target category
bool matchesLiveExamCategory(LiveExam exam, String targetCategory) {
  final target = targetCategory.toLowerCase().trim();
  if (target.isEmpty || target == 'all') return true;

  final examCat = (exam.category).toLowerCase().trim();
  final title = exam.title.toLowerCase().trim();

  if (target == 'engineering') {
    if (examCat == 'engineering' || examCat == 'buet' || examCat == 'ckruet') return true;
    if (examCat == 'all' || examCat.isEmpty || examCat == 'general') {
      if (title.contains('medical') || title.contains('মেডিকেল') || title.contains('dermatology') || title.contains('mbbs')) return false;
      if (title.contains('varsity') || title.contains('ভার্সিটি') || title.contains('গুচ্ছ')) return false;
      if (title.contains('hsc') || title.contains('এইচএসসি')) return false;
      if (title.contains('engineering') || title.contains('ইঞ্জিনিয়ারিং') || title.contains('ইঞ্জিনিয়ারিং') || title.contains('buet') || title.contains('ruet') || title.contains('kuet') || title.contains('cuet')) return true;
    }
    return false;
  }

  if (target == 'medical') {
    if (examCat == 'medical' || examCat == 'dental' || examCat == 'afmc') return true;
    if (examCat == 'all' || examCat.isEmpty || examCat == 'general') {
      if (title.contains('engineering') || title.contains('ইঞ্জিনিয়ারিং') || title.contains('ইঞ্জিনিয়ারিং') || title.contains('buet')) return false;
      if (title.contains('varsity') || title.contains('ভার্সিটি')) return false;
      if (title.contains('hsc') || title.contains('এইচএসসি')) return false;
      if (title.contains('medical') || title.contains('মেডিকেল') || title.contains('dermatology') || title.contains('mbbs') || title.contains('dental')) return true;
    }
    return false;
  }

  if (target == 'varsity' || target == 'varsity_a') {
    if (examCat == 'varsity' || examCat == 'varsity_a' || examCat == 'du' || examCat == 'gst') return true;
    if (examCat == 'all' || examCat.isEmpty || examCat == 'general') {
      if (title.contains('engineering') || title.contains('medical') || title.contains('মেডিকেল') || title.contains('ইঞ্জিনিয়ারিং') || title.contains('ইঞ্জিনিয়ারিং')) return false;
      if (title.contains('varsity') || title.contains('ভার্সিটি') || title.contains('গুচ্ছ') || title.contains('ক-ইউনিট') || title.contains('a-unit')) return true;
    }
    return false;
  }

  if (target == 'hsc') {
    if (examCat == 'hsc' || examCat == 'hsc_science') return true;
    if (examCat == 'all' || examCat.isEmpty || examCat == 'general') {
      if (title.contains('engineering') || title.contains('medical') || title.contains('varsity') || title.contains('মেডিকেল') || title.contains('ইঞ্জিনিয়ারিং') || title.contains('ভার্সিটি')) return false;
      if (title.contains('hsc') || title.contains('এইচএসসি') || title.contains('১ম পত্র') || title.contains('২য় পত্র') || title.contains('অধ্যায়')) return true;
    }
    return false;
  }

  return examCat == target;
}

// Fetches live exams from Supabase based on category parameter
final liveExamsCategoryProvider = FutureProvider.autoDispose.family<List<LiveExam>, String>((
  ref,
  category,
) async {
  final rawCategory = category.trim().toLowerCase();
  final supabase = Supabase.instance.client;
  final user = supabase.auth.currentUser;

  var filterBuilder = supabase
      .from('live_exams')
      .select()
      .inFilter('status', ['published', 'active', 'ongoing', 'upcoming', 'Published']);

  if (rawCategory.isNotEmpty && rawCategory != 'all') {
    if (rawCategory == 'varsity' || rawCategory == 'varsity_a') {
      filterBuilder = filterBuilder.or('category.ilike.varsity,category.ilike.varsity_a,category.ilike.all,category.ilike.general');
    } else {
      filterBuilder = filterBuilder.or('category.ilike.$rawCategory,category.ilike.all,category.ilike.general');
    }
  }

  final examsResponse = await filterBuilder.order('start_time', ascending: false);

  final List<LiveExam> allExams = (examsResponse as List)
      .map((e) => LiveExam.fromJson(e as Map<String, dynamic>))
      .toList();

  // Strict category isolation
  final exams = rawCategory.isEmpty || rawCategory == 'all'
      ? allExams
      : allExams.where((e) => matchesLiveExamCategory(e, rawCategory)).toList();

  // 2. Fetch attempts for the current user if logged in
  if (user != null && exams.isNotEmpty) {
    final examIds = exams.map((e) => e.id).toList();
    final attemptsResponse = await supabase
        .from('live_exam_attempts')
        .select('live_exam_id, status')
        .eq('user_id', user.id)
        .inFilter('live_exam_id', examIds);

    final attempts = (attemptsResponse as List).cast<Map<String, dynamic>>();

    for (int i = 0; i < exams.length; i++) {
      final attempt = attempts
          .where((a) => a['live_exam_id'] == exams[i].id)
          .firstOrNull;
      if (attempt != null) {
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

// Category-aware filtered exams provider
final filteredLiveExamsCategoryProvider = Provider.autoDispose.family<List<LiveExam>, String>((
  ref,
  category,
) {
  final examsAsync = ref.watch(liveExamsCategoryProvider(category));
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

// Legacy providers for backward compatibility
final liveExamsProvider = FutureProvider.autoDispose<List<LiveExam>>((ref) {
  final cat = ref.watch(liveExamCategoryProvider);
  return ref.watch(liveExamsCategoryProvider(cat).future);
});

final filteredLiveExamsProvider = Provider.autoDispose<List<LiveExam>>((ref) {
  final cat = ref.watch(liveExamCategoryProvider);
  return ref.watch(filteredLiveExamsCategoryProvider(cat));
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

  // 1. Fetch junction rows with serial, points, question_id
  final junctionRes = await supabase
      .from('live_exam_questions')
      .select('serial, points, question_id')
      .eq('live_exam_id', examId)
      .order('serial', ascending: true);

  final junctionList = (junctionRes as List).cast<Map<String, dynamic>>();
  if (junctionList.isEmpty) return [];

  final questionIds = junctionList
      .map((j) => j['question_id']?.toString())
      .where((id) => id != null && id.isNotEmpty)
      .cast<String>()
      .toList();

  if (questionIds.isEmpty) return [];

  // 2. Fetch actual question details from questions table
  final questionsRes = await supabase
      .from('questions')
      .select()
      .inFilter('id', questionIds);

  final Map<String, Map<String, dynamic>> questionMap = {
    for (final q in (questionsRes as List)) q['id'].toString(): q as Map<String, dynamic>
  };

  final List<Question> questions = [];
  for (final j in junctionList) {
    final qId = j['question_id']?.toString();
    if (qId != null && questionMap.containsKey(qId)) {
      final rawQ = questionMap[qId]!;
      final parsed = Question.fromJson(rawQ);
      final points = (j['points'] as num?)?.toInt() ?? parsed.points;
      questions.add(parsed.copyWith(points: points));
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
      .select('id, user_id, score, correct_count, wrong_count, start_time, submit_time, users(id, name, institute, avatar_color, avatar_url, role)')
      .eq('live_exam_id', examId)
      .eq('status', 'submitted')
      .order('score', ascending: false)
      .order('wrong_count', ascending: true)
      .order('submit_time', ascending: true)
      .limit(200);

  return (data as List)
      .where((e) {
        final u = e['users'] as Map<String, dynamic>?;
        final role = (u?['role'] ?? 'student').toString().toLowerCase();
        return role == 'student';
      })
      .take(100)
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


