import { supabase } from "./core";
import { LiveExam, Question } from "@/lib/types";

// ==========================================
// EXAM MANAGEMENT
// ==========================================

export async function getLiveExams(
  category?: string,
  status?: string
): Promise<LiveExam[]> {
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/live-exams?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data as LiveExam[];
        }
      }
    } catch (apiErr) {
      console.warn("API getLiveExams failed, falling back to direct query:", apiErr);
    }
  }

  try {
    let query = supabase
      .from("live_exams")
      .select(
        `
        *,
        total_questions:live_exam_questions(count)
      `
      )
      .order("start_time", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((exam) => ({
      ...exam,
      total_questions: exam.total_questions?.[0]?.count || 0,
    })) as LiveExam[];
  } catch (err) {
    console.warn("Direct live_exams join failed, attempting plain select:", err);
    let fallbackQuery = supabase
      .from("live_exams")
      .select("*")
      .order("start_time", { ascending: false });

    if (category && category !== "all") {
      fallbackQuery = fallbackQuery.eq("category", category);
    }
    if (status && status !== "all") {
      fallbackQuery = fallbackQuery.eq("status", status);
    }

    const { data, error } = await fallbackQuery;
    if (error) {
      console.error("Error fetching live exams fallback:", error);
      throw error;
    }

    return (data || []).map((exam) => ({
      ...exam,
      total_questions: 0,
    })) as LiveExam[];
  }
}

export async function getLiveExam(id: string): Promise<LiveExam | null> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/admin/live-exams?id=${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data as LiveExam;
        }
      }
    } catch (apiErr) {
      console.warn("API getLiveExam failed, falling back to direct query:", apiErr);
    }
  }

  try {
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
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return {
      ...data,
      total_questions: data.total_questions?.[0]?.count || 0,
    } as LiveExam;
  } catch (err) {
    const { data, error } = await supabase
      .from("live_exams")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      console.error("Error fetching live exam fallback:", error);
      throw error;
    }

    return {
      ...data,
      total_questions: 0,
    } as LiveExam;
  }
}

export async function createLiveExam(
  exam: Partial<LiveExam>
): Promise<LiveExam> {
  if (typeof window !== "undefined") {
    const res = await fetch("/api/admin/live-exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", exam }),
    });
    const json = await res.json();
    if (res.ok && json.success && json.data) {
      return json.data as LiveExam;
    }
    throw new Error(json.error || "Failed to create live exam");
  }

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
  if (typeof window !== "undefined") {
    const res = await fetch("/api/admin/live-exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id, updates }),
    });
    const json = await res.json();
    if (res.ok && json.success && json.data) {
      return json.data as LiveExam;
    }
    throw new Error(json.error || "Failed to update live exam");
  }

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
  if (typeof window !== "undefined") {
    const res = await fetch("/api/admin/live-exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    const json = await res.json();
    if (res.ok && json.success) return;
    throw new Error(json.error || "Failed to delete live exam");
  }

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

export async function addQuestionsBatchToLiveExam(
  examId: string,
  questionIds: string[],
  points: number = 1
): Promise<number> {
  if (!questionIds || questionIds.length === 0) return 0;

  // 1. Fetch current questions to determine next serial and avoid duplicates
  const existing = await getLiveExamQuestions(examId);
  const existingIds = new Set(existing.map((e) => e.question?.id).filter(Boolean));
  
  const toAdd = questionIds.filter((id) => !existingIds.has(id));
  if (toAdd.length === 0) return 0;

  let currentSerial = existing.length + 1;
  const inserts = toAdd.map((qId) => ({
    live_exam_id: examId,
    question_id: qId,
    serial: currentSerial++,
    points,
  }));

  const { error } = await supabase.from("live_exam_questions").insert(inserts);
  if (error) {
    console.error("Error batch adding questions to live exam:", error);
    throw error;
  }

  return toAdd.length;
}

export async function swapLiveExamQuestion(
  mappingId: string,
  newQuestionId: string
): Promise<void> {
  const { error } = await supabase
    .from("live_exam_questions")
    .update({ question_id: newQuestionId })
    .eq("id", mappingId);

  if (error) {
    console.error("Error swapping live exam question:", error);
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

export interface BlueprintRule {
  subject: string;
  chapter?: string;
  difficulty?: string;
  count: number;
}

export async function autoAssignQuestionsByBlueprint(
  examId: string,
  rules: BlueprintRule[]
): Promise<number> {
  const existing = await getLiveExamQuestions(examId);
  const existingIds = new Set(existing.map((e) => e.question?.id).filter(Boolean));
  const candidateIdsToAdd: string[] = [];

  for (const rule of rules) {
    if (!rule.subject || rule.count <= 0) continue;

    let query = supabase
      .from("questions")
      .select("id")
      .or("status.eq.Approved,status.eq.published");

    query = query.or(
      `subject.eq.${rule.subject},subject_id.eq.${rule.subject},subject.ilike.%${rule.subject}%`
    );

    if (rule.chapter && rule.chapter !== "all") {
      query = query.ilike("chapter", `%${rule.chapter}%`);
    }
    if (rule.difficulty && rule.difficulty !== "all") {
      query = query.eq("difficulty", rule.difficulty);
    }

    const { data: candidates } = await query.limit(rule.count * 4);

    if (candidates && candidates.length > 0) {
      const filtered = candidates
        .map((c) => c.id)
        .filter((id) => !existingIds.has(id) && !candidateIdsToAdd.includes(id));

      // Pick up to rule.count
      const picked = filtered.slice(0, rule.count);
      picked.forEach((id) => candidateIdsToAdd.push(id));
    }
  }

  if (candidateIdsToAdd.length === 0) return 0;

  return addQuestionsBatchToLiveExam(examId, candidateIdsToAdd);
}

export async function autoAssignQuestionsToLiveExam(
  examId: string,
  subject?: string,
  chapter?: string,
  count: number = 25,
  difficulty?: string
): Promise<number> {
  return autoAssignQuestionsByBlueprint(examId, [
    {
      subject: subject || "",
      chapter: chapter || "",
      difficulty: difficulty || "",
      count,
    },
  ]);
}

export async function extendLiveExamDuration(
  examId: string,
  additionalMinutes: number = 5
): Promise<LiveExam> {
  const current = await getLiveExam(examId);
  if (!current) throw new Error("Live exam not found");

  const currentEndTime = new Date(current.end_time).getTime();
  const newEndTime = new Date(currentEndTime + additionalMinutes * 60000).toISOString();
  const newDuration = (current.duration_minutes || 0) + additionalMinutes;

  return updateLiveExam(examId, {
    end_time: newEndTime,
    duration_minutes: newDuration,
  });
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
        id,
        name,
        email,
        phone,
        avatarUrl:avatar_url,
        avatarColor:avatar_color,
        institute
      )
    `
    )
    .eq("live_exam_id", examId)
    .eq("status", "submitted")
    .order("score", { ascending: false })
    .order("submit_time", { ascending: true });

  if (error) {
    console.error("Error fetching live exam leaderboard:", error);
    throw error;
  }

  return data;
}

export async function resetLiveExamAttempt(attemptId: string): Promise<void> {
  const { error } = await supabase
    .from("live_exam_attempts")
    .delete()
    .eq("id", attemptId);

  if (error) {
    console.error("Error resetting live exam attempt:", error);
    throw error;
  }
}

export async function getLiveExamOngoingCount(examId: string): Promise<number> {
  const { count, error } = await supabase
    .from("live_exam_attempts")
    .select("id", { count: "exact", head: true })
    .eq("live_exam_id", examId)
    .eq("status", "ongoing");

  if (error) return 0;
  return count || 0;
}
