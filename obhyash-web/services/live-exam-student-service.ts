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
