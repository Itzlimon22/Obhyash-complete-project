import { supabase } from "./core";
import { LiveExam, Question } from "@/lib/types";

// ==========================================
// EXAM MANAGEMENT
// ==========================================

export async function getLiveExams(
  category?: string,
  status?: string
): Promise<LiveExam[]> {
  let query = supabase
    .from("live_exams")
    .select(
      `
      *,
      total_questions:live_exam_questions(count)
    `
    )
    .order("start_time", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching live exams:", error);
    throw error;
  }

  return data.map((exam) => ({
    ...exam,
    total_questions: exam.total_questions?.[0]?.count || 0,
  })) as LiveExam[];
}

export async function getLiveExam(id: string): Promise<LiveExam | null> {
  const { data, error } = await supabase
    .from("live_exams")
    .select(
      `
      *,
      total_questions:live_exam_questions(count)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Error fetching live exam:", error);
    throw error;
  }

  return {
    ...data,
    total_questions: data.total_questions?.[0]?.count || 0,
  } as LiveExam;
}

export async function createLiveExam(
  exam: Partial<LiveExam>
): Promise<LiveExam> {
  const { data, error } = await supabase
    .from("live_exams")
    .insert([exam])
    .select()
    .single();

  if (error) {
    console.error("Error creating live exam:", error);
    throw error;
  }

  return data as LiveExam;
}

export async function updateLiveExam(
  id: string,
  updates: Partial<LiveExam>
): Promise<LiveExam> {
  const { data, error } = await supabase
    .from("live_exams")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating live exam:", error);
    throw error;
  }

  return data as LiveExam;
}

export async function deleteLiveExam(id: string): Promise<void> {
  const { error } = await supabase.from("live_exams").delete().eq("id", id);

  if (error) {
    console.error("Error deleting live exam:", error);
    throw error;
  }
}

// ==========================================
// QUESTION MANAGEMENT (BUILDER)
// ==========================================

export async function getLiveExamQuestions(examId: string): Promise<
  {
    mapping_id: string;
    serial: number;
    points: number;
    question: Question;
  }[]
> {
  const { data, error } = await supabase
    .from("live_exam_questions")
    .select(
      `
      id,
      serial,
      points,
      question_id,
      questions (*)
    `
    )
    .eq("live_exam_id", examId)
    .order("serial", { ascending: true });

  if (error) {
    console.error("Error fetching live exam questions:", error);
    throw error;
  }

  return data.map((item: any) => ({
    mapping_id: item.id,
    serial: item.serial,
    points: item.points,
    question: item.questions,
  }));
}

export async function addQuestionToLiveExam(
  examId: string,
  questionId: string,
  serial: number,
  points: number = 1
): Promise<void> {
  const { error } = await supabase.from("live_exam_questions").insert([
    {
      live_exam_id: examId,
      question_id: questionId,
      serial,
      points,
    },
  ]);

  if (error) {
    console.error("Error adding question to live exam:", error);
    throw error;
  }
}

export async function removeQuestionFromLiveExam(
  mappingId: string
): Promise<void> {
  const { error } = await supabase
    .from("live_exam_questions")
    .delete()
    .eq("id", mappingId);

  if (error) {
    console.error("Error removing question from live exam:", error);
    throw error;
  }
}

export async function reorderLiveExamQuestions(
  updates: { id: string; serial: number }[]
): Promise<void> {
  // Supabase doesn't easily support bulk upsert based on id with simple JS objects in the way we might want here.
  // Instead, we can do parallel updates or a postgres function. For simplicity, we use parallel promises.
  const promises = updates.map((update) =>
    supabase
      .from("live_exam_questions")
      .update({ serial: update.serial })
      .eq("id", update.id)
  );

  const results = await Promise.all(promises);
  const errors = results.filter((r) => r.error).map((r) => r.error);

  if (errors.length > 0) {
    console.error("Error reordering live exam questions:", errors);
    throw new Error("Failed to reorder some questions");
  }
}

// ==========================================
// ATTEMPTS & LEADERBOARD
// ==========================================

export async function getLiveExamLeaderboard(examId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("live_exam_attempts")
    .select(
      `
      *,
      users (
        name,
        avatarUrl,
        avatarColor,
        institute
      )
    `
    )
    .eq("live_exam_id", examId)
    .eq("status", "submitted")
    .order("score", { ascending: false })
    .order("submit_time", { ascending: true }); // Tie-breaker: who submitted faster

  if (error) {
    console.error("Error fetching live exam leaderboard:", error);
    throw error;
  }

  return data;
}
