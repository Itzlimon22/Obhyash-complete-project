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

  if (category && category !== 'All') {
    query = query.eq("category", category.toLowerCase());
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
  if (examId.startsWith("mock-")) {
    const isTaken = examId.includes("mock-taken");
    const categoryTitle = examId.replace("mock-untaken-", "").replace("mock-taken-", "");
    const now = Date.now();
    return {
      exam: {
        id: examId,
        category: categoryTitle,
        title: `[Mock] ${categoryTitle} - ${isTaken ? 'Taken' : 'Untaken'}`,
        description: "This is a mock exam for testing.",
        start_time: new Date(now - 1000 * 60 * 60 * (isTaken ? 48 : 24)).toISOString(),
        end_time: new Date(now + 1000 * 60 * 60 * 24 * 7).toISOString(),
        duration_minutes: isTaken ? 60 : 45,
        total_marks: isTaken ? 100 : 50,
        negative_marking: 0.25,
        status: "published",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: "system",
        total_questions: isTaken ? 100 : 50,
      },
      attempt: isTaken ? {
        id: "mock-attempt-1",
        live_exam_id: examId,
        user_id: userId,
        status: "submitted",
        score: 85,
        correct_count: 85,
        wrong_count: 0,
        user_answers: {},
        start_time: new Date(now - 1000 * 60 * 60).toISOString(),
        submit_time: new Date(now - 1000 * 60 * 30).toISOString(),
      } as LiveExamAttempt : null
    };
  }

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
  if (examId.startsWith("mock-")) {
    const mockQuestions: Question[] = Array(5).fill(0).map((_, i) => ({
      id: `mock-q-${i}`,
      question: `<p>Mock question ${i + 1} for this exam</p>`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswerIndex: 0,
      points: 10,
      subject: "Mock Subject",
      chapter: "Mock Chapter",
      topic: "Mock Topic",
      difficulty: "medium",
      examType: "live",
      status: "published",
    } as unknown as Question));
    return { attemptId: `mock-attempt-${Date.now()}`, questions: mockQuestions };
  }

  // 1. Create or get existing "ongoing" attempt
  const { data: attemptData, error: attemptError } = await supabase
    .from("live_exam_attempts")
    .select("id, status")
    .eq("live_exam_id", examId)
    .eq("user_id", userId)
    .maybeSingle();

  if (attemptError) throw attemptError;

  if (attemptData && attemptData.status === "submitted") {
    throw new Error("You have already submitted this exam.");
  }

  let attemptId = attemptData?.id;

  if (!attemptData) {
    // Insert new attempt
    const { data: newAttempt, error: insertError } = await supabase
      .from("live_exam_attempts")
      .insert([
        {
          live_exam_id: examId,
          user_id: userId,
          status: "ongoing",
        },
      ])
      .select("id")
      .single();

    if (insertError) throw insertError;
    attemptId = newAttempt.id;
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
  score: number
): Promise<void> {
  if (attemptId.startsWith("mock-")) {
    return;
  }

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

// ==========================================
// LEADERBOARD (PUBLIC)
// ==========================================

export async function getPublicLeaderboard(examId: string, limit: number = 100): Promise<any[]> {
  if (examId.startsWith("mock-")) {
    return [
      { id: "mock-lb-1", score: 95, users: { name: "John Doe", avatarColor: "#f59e0b" } },
      { id: "mock-lb-2", score: 85, users: { name: "Current User", avatarColor: "#10b981" } },
      { id: "mock-lb-3", score: 70, users: { name: "Jane Smith", avatarColor: "#3b82f6" } }
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
    .order("submit_time", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching public leaderboard:", error);
    throw error;
  }

  return data;
}
