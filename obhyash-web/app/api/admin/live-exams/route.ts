import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { findHscSubject } from '@/lib/data/hsc-helpers';
import { runLiveExamLifecycleAutomation } from '@/lib/live-exam-lifecycle-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const id = searchParams.get('id');
    const questionsForExam = searchParams.get('questions_for_exam');
    const leaderboardForExam = searchParams.get('leaderboard_for_exam');
    const ongoingForExam = searchParams.get('ongoing_for_exam');

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    if (questionsForExam) {
      const { data: rows, error: junctionError } = await supabaseAdmin
        .from('live_exam_questions')
        .select('*')
        .eq('live_exam_id', questionsForExam)
        .order('serial', { ascending: true });

      if (junctionError) throw junctionError;

      const refQuestionIds = (rows || [])
        .map((r: any) => r.question_id)
        .filter(Boolean);

      const qMap = new Map<string, any>();
      if (refQuestionIds.length > 0) {
        const { data: qData, error: qErr } = await supabaseAdmin
          .from('questions')
          .select('*')
          .in('id', refQuestionIds);

        if (!qErr && qData) {
          qData.forEach((q: any) => qMap.set(q.id, q));
        }
      }

      const mapped = (rows || []).map((item: any) => {
        let questionObj: any = null;
        if (item.question_id && qMap.has(item.question_id)) {
          const q = qMap.get(item.question_id);
          questionObj = {
            ...q,
            points: Number(item.points) || q.points || 1,
          };
        } else if (item.question && item.question.trim().length > 0) {
          const correctIdx = item.correct_answer_index ?? 0;
          const opts = Array.isArray(item.options) ? item.options : [];
          questionObj = {
            id: item.question_id || item.id,
            question: item.question,
            options: opts,
            correctAnswer: opts[correctIdx] || '',
            correctAnswerIndex: correctIdx,
            correct_answer_index: correctIdx,
            correctAnswerIndices: [correctIdx],
            correct_answer_indices: [correctIdx],
            explanation: item.explanation || '',
            subject: item.subject || '',
            chapter: item.chapter || '',
            difficulty: item.difficulty || 'Medium',
            points: Number(item.points) || 1,
            type: 'MCQ',
            status: 'Approved',
            author: 'System',
            createdAt: item.created_at || new Date().toISOString(),
            version: 1,
            tags: [],
          };
        }

        return {
          mapping_id: item.id,
          serial: item.serial,
          points: item.points,
          question: questionObj,
        };
      });

      return NextResponse.json({ success: true, data: mapped });
    }

    if (leaderboardForExam) {
      const { data, error } = await supabaseAdmin
        .from('live_exam_attempts')
        .select(`
          *,
          users (
            id,
            name,
            email,
            phone,
            avatar_url,
            avatarUrl:avatar_url,
            avatar_color,
            avatarColor:avatar_color,
            institute
          )
        `)
        .eq('live_exam_id', leaderboardForExam)
        .eq('status', 'submitted')
        .order('score', { ascending: false })
        .order('wrong_count', { ascending: true })
        .order('submit_time', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ success: true, data: data || [] });
    }

    if (ongoingForExam) {
      const { count, error } = await supabaseAdmin
        .from('live_exam_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('live_exam_id', ongoingForExam)
        .eq('status', 'ongoing');

      if (error) throw error;
      return NextResponse.json({ success: true, count: count || 0 });
    }

    if (id) {
      let data: any = null;
      let error: any = null;

      try {
        const res = await supabaseAdmin
          .from('live_exams')
          .select('*, total_questions:live_exam_questions(count)')
          .eq('id', id)
          .single();
        if (res.error) throw res.error;
        data = res.data;
      } catch (idJoinErr) {
        console.warn('ID join query failed, trying plain select:', idJoinErr);
        const res = await supabaseAdmin
          .from('live_exams')
          .select('*')
          .eq('id', id)
          .single();
        if (res.error) throw res.error;
        data = res.data;
      }

      return NextResponse.json({
        success: true,
        data: {
          ...data,
          total_questions: data.total_questions?.[0]?.count || 0,
        },
      });
    }

    let query = supabaseAdmin
      .from('live_exams')
      .select('*')
      .order('start_time', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: exams, error } = await query;
    if (error) throw error;

    const examList = exams || [];
    const examIds = examList.map((e: any) => e.id).filter(Boolean);
    const countMap: Record<string, number> = {};

    if (examIds.length > 0) {
      try {
        const { data: qRows, error: qErr } = await supabaseAdmin
          .from('live_exam_questions')
          .select('live_exam_id')
          .in('live_exam_id', examIds);

        if (!qErr && qRows) {
          for (const row of qRows) {
            if (row.live_exam_id) {
              countMap[row.live_exam_id] = (countMap[row.live_exam_id] || 0) + 1;
            }
          }
        }
      } catch (countErr) {
        console.warn('Failed to fetch live_exam_questions counts:', countErr);
      }
    }

    const mapped = examList.map((exam: any) => ({
      ...exam,
      total_questions: countMap[exam.id] ?? 0,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (err: any) {
    console.error('Error in /api/admin/live-exams GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch live exams' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connection();
    const body = await request.json();
    const { action, exam, id, updates, minutes } = body;

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    if (action === 'create') {
      const { data, error } = await supabaseAdmin
        .from('live_exams')
        .insert([exam])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'update' && id) {
      const { data, error } = await supabaseAdmin
        .from('live_exams')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'delete' && id) {
      const { error } = await supabaseAdmin
        .from('live_exams')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'extend' && id && minutes) {
      const { data: currentExam, error: fetchErr } = await supabaseAdmin
        .from('live_exams')
        .select('duration_minutes, end_time')
        .eq('id', id)
        .single();

      if (fetchErr || !currentExam) throw fetchErr || new Error('Exam not found');

      const currentEnd = new Date(currentExam.end_time);
      const newEnd = new Date(currentEnd.getTime() + minutes * 60 * 1000);
      const newDuration = (currentExam.duration_minutes || 0) + minutes;

      const { data, error } = await supabaseAdmin
        .from('live_exams')
        .update({
          duration_minutes: newDuration,
          end_time: newEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    // --- QUESTION MANAGEMENT ACTIONS ---
    if (action === 'add_question' && body.examId) {
      const { examId, questionId, serial, points = 1, question: inlineQuestion } = body;
      
      let payload: any = {
        live_exam_id: examId,
        question_id: null,
        serial: serial || 1,
        points,
      };

      if (inlineQuestion) {
        payload = {
          ...payload,
          question: inlineQuestion.question,
          options: inlineQuestion.options || [],
          correct_answer_index: inlineQuestion.correct_answer_index ?? inlineQuestion.correctAnswerIndex ?? 0,
          explanation: inlineQuestion.explanation || '',
          subject: inlineQuestion.subject || '',
        };
      } else if (questionId) {
        const { data: qData } = await supabaseAdmin
          .from('questions')
          .select('*')
          .eq('id', questionId)
          .single();

        if (qData) {
          payload = {
            ...payload,
            question: qData.question,
            options: qData.options || [],
            correct_answer_index: qData.correct_answer_index ?? qData.correctAnswerIndex ?? (qData.correct_answer_indices?.[0] ?? 0),
            explanation: qData.explanation || '',
            subject: qData.subject || '',
          };
        }
      }

      const { error: insErr } = await supabaseAdmin
        .from('live_exam_questions')
        .insert([payload]);

      if (insErr) throw insErr;

      // Sync total_questions count
      const { count } = await supabaseAdmin
        .from('live_exam_questions')
        .select('*', { count: 'exact', head: true })
        .eq('live_exam_id', examId);

      await supabaseAdmin
        .from('live_exams')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', examId);

      return NextResponse.json({ success: true, count });
    }

    if (action === 'add_questions_batch' && body.examId && Array.isArray(body.questionIds)) {
      const { examId, questionIds, points = 1 } = body;
      if (questionIds.length === 0) {
        return NextResponse.json({ success: true, count: 0 });
      }

      // 1. Fetch existing mappings to avoid duplicate questions & calculate serial
      const { data: existing } = await supabaseAdmin
        .from('live_exam_questions')
        .select('id, serial, question')
        .eq('live_exam_id', examId);

      const existingQuestionSet = new Set((existing || []).map((e: any) => e.question?.trim()).filter(Boolean));

      // 2. Fetch full question objects from questions table
      const { data: qList } = await supabaseAdmin
        .from('questions')
        .select('*')
        .in('id', questionIds);

      const toAdd = (qList || []).filter((q: any) => !existingQuestionSet.has(q.question?.trim()));

      if (toAdd.length > 0) {
        let currentSerial = (existing?.length || 0) + 1;
        const inserts = toAdd.map((q: any) => ({
          live_exam_id: examId,
          question_id: null,
          serial: currentSerial++,
          points,
          question: q.question,
          options: q.options || [],
          correct_answer_index: q.correct_answer_index ?? q.correctAnswerIndex ?? (q.correct_answer_indices?.[0] ?? 0),
          explanation: q.explanation || '',
          subject: q.subject || '',
        }));

        const { error: insErr } = await supabaseAdmin
          .from('live_exam_questions')
          .insert(inserts);

        if (insErr) throw insErr;
      }

      // Sync total_questions count
      const { count } = await supabaseAdmin
        .from('live_exam_questions')
        .select('*', { count: 'exact', head: true })
        .eq('live_exam_id', examId);

      await supabaseAdmin
        .from('live_exams')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', examId);

      return NextResponse.json({ success: true, count: toAdd.length, total: count });
    }

    if (action === 'remove_question' && body.mappingId) {
      const { mappingId, examId } = body;
      const { error: delErr } = await supabaseAdmin
        .from('live_exam_questions')
        .delete()
        .eq('id', mappingId);

      if (delErr) throw delErr;

      if (examId) {
        // Sync total_questions count
        const { count } = await supabaseAdmin
          .from('live_exam_questions')
          .select('*', { count: 'exact', head: true })
          .eq('live_exam_id', examId);

        await supabaseAdmin
          .from('live_exams')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', examId);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'swap_question' && body.mappingId && body.newQuestionId) {
      const { mappingId, newQuestionId } = body;
      const { data: newQ } = await supabaseAdmin
        .from('questions')
        .select('*')
        .eq('id', newQuestionId)
        .single();

      if (!newQ) throw new Error('New question not found');

      const { error: swapErr } = await supabaseAdmin
        .from('live_exam_questions')
        .update({
          question_id: null,
          question: newQ.question,
          options: newQ.options || [],
          correct_answer_index: newQ.correct_answer_index ?? newQ.correctAnswerIndex ?? (newQ.correct_answer_indices?.[0] ?? 0),
          explanation: newQ.explanation || '',
          subject: newQ.subject || '',
        })
        .eq('id', mappingId);

      if (swapErr) throw swapErr;
      return NextResponse.json({ success: true });
    }

    if (action === 'reorder_questions' && Array.isArray(body.updates)) {
      const { updates } = body;
      const promises = updates.map((u: { id: string; serial: number }) =>
        supabaseAdmin
          .from('live_exam_questions')
          .update({ serial: u.serial })
          .eq('id', u.id)
      );

      await Promise.all(promises);
      return NextResponse.json({ success: true });
    }

    if (action === 'auto_assign_blueprint' && body.examId && Array.isArray(body.rules)) {
      const { examId, rules } = body;

      const { data: existing } = await supabaseAdmin
        .from('live_exam_questions')
        .select('id, serial, question')
        .eq('live_exam_id', examId);

      const existingQuestionSet = new Set((existing || []).map((e: any) => e.question?.trim()).filter(Boolean));
      const candidateQuestionsToAdd: any[] = [];

      for (const rule of rules) {
        if (!rule.subject || rule.count <= 0) continue;

        let query = supabaseAdmin
          .from('questions')
          .select('*')
          .or('status.eq.Approved,status.eq.published,status.is.null');

        const subObj = findHscSubject(rule.subject);
        if (subObj) {
          query = query.or(`subject.eq."${subObj.name}",subject.eq."${subObj.id}",subject_id.eq."${subObj.id}",subject.ilike."%${subObj.name}%"`);
        } else {
          query = query.or(`subject.eq."${rule.subject}",subject.ilike."%${rule.subject}%"`);
        }

        if (rule.chapter && rule.chapter !== 'all') {
          query = query.ilike('chapter', `%${rule.chapter}%`);
        }
        if (rule.difficulty && rule.difficulty !== 'all') {
          query = query.eq('difficulty', rule.difficulty);
        }

        const { data: candidates } = await query.limit(rule.count * 4);
        if (candidates && candidates.length > 0) {
          const filtered = candidates.filter((c: any) =>
            !existingQuestionSet.has(c.question?.trim()) &&
            !candidateQuestionsToAdd.some((picked) => picked.id === c.id)
          );

          const picked = filtered.slice(0, rule.count);
          picked.forEach((c: any) => candidateQuestionsToAdd.push(c));
        }
      }

      if (candidateQuestionsToAdd.length > 0) {
        let currentSerial = (existing?.length || 0) + 1;
        const inserts = candidateQuestionsToAdd.map((q: any) => ({
          live_exam_id: examId,
          question_id: null,
          serial: currentSerial++,
          points: 1,
          question: q.question,
          options: q.options || [],
          correct_answer_index: q.correct_answer_index ?? q.correctAnswerIndex ?? (q.correct_answer_indices?.[0] ?? 0),
          explanation: q.explanation || '',
          subject: q.subject || '',
        }));

        await supabaseAdmin.from('live_exam_questions').insert(inserts);

        // Sync total_questions count
        const { count } = await supabaseAdmin
          .from('live_exam_questions')
          .select('*', { count: 'exact', head: true })
          .eq('live_exam_id', examId);

        await supabaseAdmin
          .from('live_exams')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', examId);
      }

      return NextResponse.json({ success: true, count: candidateQuestionsToAdd.length });
    }

    if (action === 'reset_attempt' && body.attemptId) {
      const { attemptId } = body;
      const { error: delErr } = await supabaseAdmin
        .from('live_exam_attempts')
        .delete()
        .eq('id', attemptId);

      if (delErr) throw delErr;
      return NextResponse.json({ success: true });
    }

    if (action === 'run_lifecycle_automation') {
      const result = await runLiveExamLifecycleAutomation(supabaseAdmin);
      return NextResponse.json({ ...result });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action specified' },
      { status: 400 },
    );
  } catch (err: any) {
    console.error('Error in /api/admin/live-exams POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Database execution error' },
      { status: 500 },
    );
  }
}
