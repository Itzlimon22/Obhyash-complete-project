import { supabase } from "./core";
import { LiveExam, LiveExamAttempt, Question } from "@/lib/types";

// ==========================================
// FETCHING EXAMS
// ==========================================

export async function getPublishedLiveExams(category?: string, userId?: string): Promise<(LiveExam & { userAttemptStatus?: string })[]> {
  let query = supabase
    .from("live_exams")
    .select(`
      *,
      total_questions:live_exam_questions(count)
    `)
    .eq("status", "published")
    .order("start_time", { ascending: true });

  if (category && category !== 'All' && category !== 'all') {
    query = query.or(`category.ilike.${category},category.ilike.all,category.ilike.general`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching student live exams:", error);
    throw error;
  }

  const attemptsMap: Record<string, string> = {};

  if (userId && data.length > 0) {
    const examIds = data.map(e => e.id);
    const { data: attemptsData } = await supabase
      .from("live_exam_attempts")
      .select("live_exam_id, status")
      .eq("user_id", userId)
      .in("live_exam_id", examIds);

    if (attemptsData) {
      attemptsData.forEach(a => {
        attemptsMap[a.live_exam_id] = a.status;
      });
    }
  }

  return data.map((exam) => ({
    ...exam,
    total_questions: exam.total_questions?.[0]?.count || 0,
    userAttemptStatus: attemptsMap[exam.id]
  })) as (LiveExam & { userAttemptStatus?: string })[];
}

export async function getStudentLiveExamDetails(
  examId: string,
  userId: string
): Promise<{ exam: LiveExam; attempt: LiveExamAttempt | null }> {
  // Fetch exam
  const { data: examData, error: examError } = await supabase
    .from("live_exams")
    .select(`*, total_questions:live_exam_questions(count)`)
    .eq("id", examId)
    .single();

  if (examError) {
    console.error("Error fetching live exam details:", examError);
    throw examError;
  }

  // Fetch attempt
  const { data: attemptData, error: attemptError } = await supabase
    .from("live_exam_attempts")
    .select(`*`)
    .eq("live_exam_id", examId)
    .eq("user_id", userId)
    .maybeSingle();

  if (attemptError && attemptError.code !== "PGRST116") {
    console.error("Error fetching user attempt:", attemptError);
  }

  return {
    exam: {
      ...examData,
      total_questions: examData.total_questions?.[0]?.count || 0,
    } as LiveExam,
    attempt: attemptData as LiveExamAttempt | null,
  };
}

// ==========================================
// EXAM TAKING FLOW
// ==========================================

export async function startLiveExam(
  examId: string,
  userId: string
): Promise<{ attemptId: string; questions: Question[] }> {

  // 1. Create or get existing "ongoing" attempt
  const { data: attemptData, error: attemptError } = await supabase
    .from("live_exam_attempts")
    .select("id, status")
    .eq("live_exam_id", examId)
    .eq("user_id", userId)
    .maybeSingle();

  if (attemptError) throw attemptError;

  let attemptId: string;

  if (attemptData && attemptData.status === "submitted") {
    // Already submitted official attempt -> Enter practice re-attempt mode!
    attemptId = `practice-${Date.now()}`;
  } else if (!attemptData) {
    // Insert new official attempt
    const { data: newAttempt, error: insertError } = await supabase
      .from("live_exam_attempts")
      .insert([
        {
          live_exam_id: examId,
          user_id: userId,
          status: "ongoing",
          start_time: new Date().toISOString(),
        },
      ])
      .select("id")
      .single();

    if (insertError) throw insertError;
    attemptId = newAttempt.id;
  } else {
    attemptId = attemptData.id;
  }

  // 2. Fetch the questions for this exam
  const { data: questionsData, error: questionsError } = await supabase
    .from("live_exam_questions")
    .select(`
      serial,
      points,
      questions (*)
    `)
    .eq("live_exam_id", examId)
    .order("serial", { ascending: true });

  if (questionsError) throw questionsError;

  const questions = questionsData.map((q: any) => ({
    ...(Array.isArray(q.questions) ? q.questions[0] : q.questions),
    points: q.points,
  }));

  return { attemptId: attemptId!, questions };
}

export async function submitLiveExam(
  attemptId: string,
  userAnswers: Record<string, number>,
  correctCount: number,
  wrongCount: number,
  score: number,
  examId?: string,
  userId?: string,
  timeTakenSeconds?: number
): Promise<void> {
  if (attemptId.startsWith("mock-")) {
    return;
  }

  if (attemptId.startsWith("practice-") && examId && userId) {
    // Practice Attempt -> Persist in practice history table
    try {
      await supabase.from("live_exam_practice_history").insert([
        {
          live_exam_id: examId,
          user_id: userId,
          score,
          correct_count: correctCount,
          wrong_count: wrongCount,
          user_answers: userAnswers,
          time_taken_seconds: timeTakenSeconds || 0,
          submit_time: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.warn("Failed to insert into live_exam_practice_history:", err);
    }
    return;
  }

  // Official First-Time Attempt -> Updates live_exam_attempts for official Leaderboard
  const { error } = await supabase
    .from("live_exam_attempts")
    .update({
      user_answers: userAnswers,
      correct_count: correctCount,
      wrong_count: wrongCount,
      score: score,
      submit_time: new Date().toISOString(),
      status: "submitted",
    })
    .eq("id", attemptId);

  if (error) {
    console.error("Error submitting live exam:", error);
    throw error;
  }
}

export async function getStudentLiveExamPracticeHistory(
  examId: string,
  userId: string
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("live_exam_practice_history")
      .select("*")
      .eq("live_exam_id", examId)
      .eq("user_id", userId)
      .order("submit_time", { ascending: false });

    if (error) return [];
    return data || [];
  } catch (_) {
    return [];
  }
}

// ==========================================
// SOLUTIONS & EXPLANATIONS
// ==========================================

export async function getLiveExamSolutions(
  examId: string,
  userId?: string
): Promise<{ questions: Question[]; userAnswers: Record<string, number> }> {
  if (examId.startsWith("mock-")) {
    const mockQuestions: Question[] = [
      {
        id: "mock-q-0",
        question: "নিচের কোন বলটি প্রকৃতির সবচেয়ে শক্তিশালী মৌলিক বল?",
        options: [
          "সবল নিউক্লীয় বল (Strong Nuclear Force)",
          "তড়িৎ চৌম্বক বল (Electromagnetic Force)",
          "দুর্বল নিউক্লীয় বল (Weak Nuclear Force)",
          "মহাকর্ষ বল (Gravitational Force)"
        ],
        correctAnswerIndex: 0,
        explanation: "প্রকৃতির চারটি মৌলিক বলের মধ্যে সবল নিউক্লীয় বল সবচেয়ে শক্তিশালী। এর আপেক্ষিক তীব্রতা ১০৩৮ গুণ (মহাকর্ষ বলের সাপেক্ষে)।",
        points: 1,
        subject: "পদার্থবিজ্ঞান",
        chapter: "ভৌত জগত ও পরিমাপ",
        topic: "মৌলিক বল",
        difficulty: "easy",
        examType: "live",
        status: "published",
      } as unknown as Question,
      {
        id: "mock-q-1",
        question: "একটি বস্তুকে খাড়া উপরের দিকে 49 m/s বেগে নিক্ষেপ করলে এটি সর্বোচ্চ কত উচ্চতায় পৌঁছাবে?",
        options: [
          "122.5 m",
          "245 m",
          "98 m",
          "49 m"
        ],
        correctAnswerIndex: 0,
        explanation: "সর্বোচ্চ উচ্চতা $H = \\frac{u^2}{2g} = \\frac{(49)^2}{2 \\times 9.8} = \\frac{2401}{19.6} = 122.5\\text{ m}$।",
        points: 1,
        subject: "পদার্থবিজ্ঞান",
        chapter: "গতিবিদ্যা",
        topic: "নিক্ষিপ্ত বস্তু",
        difficulty: "medium",
        examType: "live",
        status: "published",
      } as unknown as Question,
      {
        id: "mock-q-2",
        question: "মানবদেহের স্বাভাবিক রক্তচাপ (Blood Pressure) কত?",
        options: [
          "120/80 mmHg",
          "140/90 mmHg",
          "100/70 mmHg",
          "130/85 mmHg"
        ],
        correctAnswerIndex: 0,
        explanation: "একজন সুস্থ পূর্ণবয়স্ক মানুষের আদর্শ সিস্টোলিক রক্তচাপ ১২০ মিমি পারদ এবং ডায়াস্টোলিক রক্তচাপ ৮০ মিমি পারদ (120/80 mmHg)।",
        points: 1,
        subject: "জীববিজ্ঞান",
        chapter: "রক্ত ও সংবহন",
        topic: "রক্তচাপ",
        difficulty: "easy",
        examType: "live",
        status: "published",
      } as unknown as Question,
      {
        id: "mock-q-3",
        question: "$\\lim_{x \\to 0} \\frac{\\sin 5x}{x}$ এর মান কত?",
        options: [
          "5",
          "1",
          "0",
          "অসীম"
        ],
        correctAnswerIndex: 0,
        explanation: "আমরা জানি $\\lim_{x \\to 0} \\frac{\\sin ax}{ax} = 1$, অতএব $\\lim_{x \\to 0} \\frac{\\sin 5x}{5x} \\times 5 = 1 \\times 5 = 5$।",
        points: 1,
        subject: "উচ্চতর গণিত",
        chapter: "অন্তরীকরণ",
        topic: "লিমিট",
        difficulty: "medium",
        examType: "live",
        status: "published",
      } as unknown as Question,
      {
        id: "mock-q-4",
        question: "নিচের কোন যৌগে sp² সংকরায়ণ (Hybridization) বিদ্যমান?",
        options: [
          "C₂H₄ (ইথিন)",
          "CH₄ (মিথেন)",
          "C₂H₂ (ইথাইন)",
          "C₂H₆ (ইথেন)"
        ],
        correctAnswerIndex: 0,
        explanation: "ইথিন (C₂H₄) অণুতে প্রতিটি কার্বন পরমাণু ৩টি সিগমা ও ১টি পাই বন্ধন তৈরি করে, তাই এখানে $sp^2$ সংকরায়ণ ঘটে।",
        points: 1,
        subject: "রসায়ন",
        chapter: "পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন",
        topic: "সংকরায়ণ",
        difficulty: "medium",
        examType: "live",
        status: "published",
      } as unknown as Question,
    ];

    const mockAnswers: Record<string, number> = {
      "mock-q-0": 0,
      "mock-q-1": 0,
      "mock-q-2": 1, // deliberately wrong for demonstration
      "mock-q-3": 0,
    };

    return { questions: mockQuestions, userAnswers: mockAnswers };
  }

  // 1. Fetch questions
  const { data: questionsData, error: qErr } = await supabase
    .from("live_exam_questions")
    .select(`
      serial,
      points,
      questions (*)
    `)
    .eq("live_exam_id", examId)
    .order("serial", { ascending: true });

  if (qErr) {
    console.error("Error fetching exam solution questions:", qErr);
    throw qErr;
  }

  const questions: Question[] = questionsData.map((item: any) => {
    const q = Array.isArray(item.questions) ? item.questions[0] : item.questions;
    return {
      ...q,
      points: item.points ?? q.points ?? 1,
    };
  });

  // 2. Fetch user's answers if user is provided
  let userAnswers: Record<string, number> = {};
  if (userId) {
    const { data: attemptData } = await supabase
      .from("live_exam_attempts")
      .select("user_answers")
      .eq("live_exam_id", examId)
      .eq("user_id", userId)
      .maybeSingle();

    if (attemptData?.user_answers) {
      userAnswers = attemptData.user_answers;
    }
  }

  return { questions, userAnswers };
}

// ==========================================
// LEADERBOARD (PUBLIC)
// ==========================================

export async function getPublicLeaderboard(examId: string, limit: number = 100): Promise<any[]> {
  if (examId.startsWith("mock-")) {
    return [
      { id: "mock-lb-1", score: 95, correct_count: 95, wrong_count: 0, users: { name: "রাকিবুল হাসান", institute: "ঢাকা কলেজ", avatarColor: "#f59e0b" } },
      { id: "mock-lb-2", score: 85, correct_count: 85, wrong_count: 0, users: { name: "সাদিয়া আক্তার", institute: "ভিকারুননিসা নূন স্কুল ও কলেজ", avatarColor: "#10b981" } },
      { id: "mock-lb-3", score: 80, correct_count: 82, wrong_count: 8, users: { name: "তানভীর আহমেদ", institute: "নটর ডেম কলেজ", avatarColor: "#3b82f6" } },
      { id: "mock-lb-4", score: 76.25, correct_count: 78, wrong_count: 7, users: { name: "মেহজাবিন চৌধুরী", institute: "রাজউক উত্তরা মডেল কলেজ", avatarColor: "#8b5cf6" } },
      { id: "mock-lb-5", score: 72.5, correct_count: 75, wrong_count: 10, users: { name: "আহনাফ রহমান", institute: "আইডিয়াল কলেজ", avatarColor: "#ec4899" } }
    ];
  }
  const { data, error } = await supabase
    .from("live_exam_attempts")
    .select(`
      id,
      score,
      correct_count,
      wrong_count,
      start_time,
      submit_time,
      users (
        name,
        avatarUrl:avatar_url,
        avatarColor:avatar_color,
        institute
      )
    `)
    .eq("live_exam_id", examId)
    .eq("status", "submitted")
    .order("score", { ascending: false })
    .order("wrong_count", { ascending: true })
    .order("submit_time", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching public leaderboard:", error);
    throw error;
  }

  return data;
}
