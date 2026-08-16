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
  final category = ref.watch(liveExamCategoryProvider);
  if (category.isEmpty) return [];

  final supabase = Supabase.instance.client;
  final user = supabase.auth.currentUser;

  // 1. Fetch all published exams for this category
  final examsResponse = await supabase
      .from('live_exams')
      .select()
      .eq('category', category)
      .eq('status', 'published')
      .order('start_time', ascending: false);

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

  // Adding mock exams for visual testing just like the web app
  final now = DateTime.now();
  final isHSC = category.toLowerCase().contains('hsc') || category.contains('এইচএসসি');

  exams.addAll([
    LiveExam(
      id: 'mock-untaken-$category',
      category: category,
      title: isHSC
          ? 'পদার্থবিজ্ঞান ১ম পত্র: অধ্যায় ২ (ভেক্টর) ও অধ্যায় ৩ (গতিবিদ্যা)'
          : 'পদার্থবিজ্ঞান: অধ্যায় ২ (গতি) ও অধ্যায় ৩ (বল)',
      description: isHSC
          ? 'HSC বোর্ড পরীক্ষার স্ট্যান্ডার্ড অধ্যায়ভিত্তিক পূর্ণাঙ্গ লাইভ মডেল টেস্ট।'
          : 'SSC বোর্ড পরীক্ষার পূর্ণাঙ্গ প্রস্তুতিমূলক বিশেষ লাইভ টেস্ট।',
      startTime: now.subtract(const Duration(days: 1)),
      endTime: now.add(const Duration(days: 7)),
      durationMinutes: 45,
      totalQuestions: 50,
      totalMarks: 50,
      negativeMarking: 0.25,
      status: 'published',
      userAttemptStatus: null,
    ),
    LiveExam(
      id: 'mock-taken-$category',
      category: category,
      title: isHSC
          ? 'রসায়ন ১ম পত্র: গুণগত রসায়ন ও পর্যায়বৃত্ত ধর্ম'
          : 'সাধারণ গণিত: অধ্যায় ২ (সেট ও ফাংশন) ও অধ্যায় ৩',
      description: isHSC
          ? 'HSC বোর্ড ভিত্তিক গুণগত রসায়ন ও পর্যায়বৃত্ত ধর্ম স্পেশাল মডেল টেস্ট।'
          : 'SSC বোর্ড স্ট্যান্ডার্ড বীজগাণিতিক রাশি ও ফাংশন লাইভ টেস্ট।',
      startTime: now.subtract(const Duration(days: 2)),
      endTime: now.add(const Duration(days: 7)),
      durationMinutes: 60,
      totalQuestions: 100,
      totalMarks: 100,
      negativeMarking: 0.25,
      status: 'published',
      userAttemptStatus: 'submitted',
    ),
  ]);

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
    error: (_, __) => [],
  );
});

// Single Exam Details Provider
final liveExamDetailsProvider = FutureProvider.autoDispose.family<
    ({LiveExam exam, LiveExamAttempt? attempt}), String>((ref, examId) async {
  final supabase = Supabase.instance.client;
  final user = supabase.auth.currentUser;

  if (examId.startsWith('mock-')) {
    final isTaken = examId.contains('mock-taken');
    final category = examId.replaceAll('mock-untaken-', '').replaceAll('mock-taken-', '');
    final now = DateTime.now();

    final mockExam = LiveExam(
      id: examId,
      category: category,
      title: '[Mock] $category - ${isTaken ? 'Taken' : 'Untaken'}',
      description: 'This is a mock exam for testing.',
      startTime: now.subtract(Duration(hours: isTaken ? 48 : 24)),
      endTime: now.add(const Duration(days: 7)),
      durationMinutes: isTaken ? 60 : 45,
      totalQuestions: isTaken ? 100 : 50,
      totalMarks: isTaken ? 100 : 50,
      negativeMarking: 0.25,
      status: 'published',
      userAttemptStatus: isTaken ? 'submitted' : null,
    );

    final mockAttempt = isTaken
        ? LiveExamAttempt(
            id: 'mock-attempt-1',
            liveExamId: examId,
            userId: user?.id ?? 'mock-user',
            status: 'submitted',
            score: 85,
            correctCount: 85,
            wrongCount: 0,
            userAnswers: {},
            startTime: now.subtract(const Duration(hours: 1)),
            submitTime: now.subtract(const Duration(minutes: 30)),
          )
        : null;

    return (exam: mockExam, attempt: mockAttempt);
  }

  // 1. Fetch Exam
  final examData = await supabase
      .from('live_exams')
      .select('*, total_questions:live_exam_questions(count)')
      .eq('id', examId)
      .single();

  final exam = LiveExam.fromJson(examData);

  // 2. Fetch User Attempt
  LiveExamAttempt? attempt;
  if (user != null) {
    final attemptData = await supabase
        .from('live_exam_attempts')
        .select()
        .eq('live_exam_id', examId)
        .eq('user_id', user.id)
        .maybeSingle();

    if (attemptData != null) {
      attempt = LiveExamAttempt.fromJson(attemptData);
    }
  }

  return (exam: exam, attempt: attempt);
});

// Questions for Live Exam Engine
final liveExamQuestionsProvider =
    FutureProvider.autoDispose.family<List<Question>, String>((ref, examId) async {
  if (examId.startsWith('mock-')) {
    return [
      Question(
        id: 'mock-q-0',
        subject: 'পদার্থবিজ্ঞান',
        chapter: 'ভৌত জগত ও পরিমাপ',
        question: 'নিচের কোন বলটি প্রকৃতির সবচেয়ে শক্তিশালী মৌলিক বল?',
        explanation: 'প্রকৃতির চারটি মৌলিক বলের মধ্যে সবল নিউক্লীয় বল সবচেয়ে শক্তিশালী।',
        options: [
          'সবল নিউক্লীয় বল',
          'তড়িৎ চৌম্বক বল',
          'দুর্বল নিউক্লীয় বল',
          'মহাকর্ষ বল'
        ],
        correctAnswerIndex: 0,
        points: 1,
      ),
      Question(
        id: 'mock-q-1',
        subject: 'পদার্থবিজ্ঞান',
        chapter: 'গতিবিদ্যা',
        question: 'একটি বস্তুকে খাড়া উপরের দিকে 49 m/s বেগে নিক্ষেপ করলে এটি সর্বোচ্চ কত উচ্চতায় পৌঁছাবে?',
        explanation: 'সর্বোচ্চ উচ্চতা H = u² / (2g) = 122.5 m।',
        options: ['122.5 m', '245 m', '98 m', '49 m'],
        correctAnswerIndex: 0,
        points: 1,
      ),
      Question(
        id: 'mock-q-2',
        subject: 'জীববিজ্ঞান',
        chapter: 'রক্ত ও সংবহন',
        question: 'মানবদেহের স্বাভাবিক রক্তচাপ কত?',
        explanation: 'স্বাভাবিক সিস্টোলিক ১২০ ও ডায়াস্টোলিক ৮০ mmHg।',
        options: ['120/80 mmHg', '140/90 mmHg', '100/70 mmHg', '130/85 mmHg'],
        correctAnswerIndex: 0,
        points: 1,
      ),
      Question(
        id: 'mock-q-3',
        subject: 'উচ্চতর গণিত',
        chapter: 'অন্তরীকরণ',
        question: 'lim (x->0) (sin 5x / x) এর মান কত?',
        explanation: 'মান হবে 5।',
        options: ['5', '1', '0', 'অসীম'],
        correctAnswerIndex: 0,
        points: 1,
      ),
      Question(
        id: 'mock-q-4',
        subject: 'রসায়ন',
        chapter: 'পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন',
        question: 'নিচের কোন যৌগে sp² সংকরায়ণ বিদ্যমান?',
        explanation: 'ইথিন (C₂H₄) অণুতে sp² সংকরায়ণ ঘটে।',
        options: ['C₂H₄ (ইথিন)', 'CH₄ (মিথেন)', 'C₂H₂ (ইথাইন)', 'C₂H₆ (ইথেন)'],
        correctAnswerIndex: 0,
        points: 1,
      ),
    ];
  }

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
  if (examId.startsWith('mock-')) {
    return [
      LiveExamLeaderboardEntry(
        id: 'lb-1',
        score: 95,
        correctCount: 95,
        wrongCount: 0,
        userName: 'রাকিবুল হাসান',
        userInstitute: 'ঢাকা কলেজ',
        avatarColor: '#f59e0b',
        submitTime: DateTime.now().subtract(const Duration(minutes: 20)),
      ),
      LiveExamLeaderboardEntry(
        id: 'lb-2',
        score: 85,
        correctCount: 85,
        wrongCount: 0,
        userName: 'সাদিয়া আক্তার',
        userInstitute: 'ভিকারুননিসা নূন স্কুল ও কলেজ',
        avatarColor: '#10b981',
        submitTime: DateTime.now().subtract(const Duration(minutes: 30)),
      ),
      LiveExamLeaderboardEntry(
        id: 'lb-3',
        score: 80,
        correctCount: 82,
        wrongCount: 8,
        userName: 'তানভীর আহমেদ',
        userInstitute: 'নটর ডেম কলেজ',
        avatarColor: '#3b82f6',
        submitTime: DateTime.now().subtract(const Duration(minutes: 40)),
      ),
      LiveExamLeaderboardEntry(
        id: 'lb-4',
        score: 76.25,
        correctCount: 78,
        wrongCount: 7,
        userName: 'মেহজাবিন চৌধুরী',
        userInstitute: 'রাজউক উত্তরা মডেল কলেজ',
        avatarColor: '#8b5cf6',
        submitTime: DateTime.now().subtract(const Duration(minutes: 45)),
      ),
      LiveExamLeaderboardEntry(
        id: 'lb-5',
        score: 72.5,
        correctCount: 75,
        wrongCount: 10,
        userName: 'আহনাফ রহমান',
        userInstitute: 'আইডিয়াল কলেজ',
        avatarColor: '#ec4899',
        submitTime: DateTime.now().subtract(const Duration(minutes: 50)),
      ),
    ];
  }

  final supabase = Supabase.instance.client;
  final data = await supabase
      .from('live_exam_attempts')
      .select('id, score, correct_count, wrong_count, submit_time, users(name, institute, avatar_color, avatar_url)')
      .eq('live_exam_id', examId)
      .eq('status', 'submitted')
      .order('score', ascending: false)
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

  final userAnswers = details.attempt?.userAnswers ?? {
    'mock-q-0': 0,
    'mock-q-1': 0,
    'mock-q-2': 1,
    'mock-q-3': 0,
  };

  return (questions: questions, userAnswers: userAnswers);
});

