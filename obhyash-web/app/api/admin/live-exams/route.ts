import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { findHscSubject } from '@/lib/data/hsc-helpers';

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
      const { data, error } = await supabaseAdmin
        .from('live_exam_questions')
        .select(`
          id,
          serial,
          points,
          question_id,
          questions (*)
        `)
        .eq('live_exam_id', questionsForExam)
        .order('serial', { ascending: true });

      if (error) throw error;
      const mapped = (data || []).map((item: any) => ({
        mapping_id: item.id,
        serial: item.serial,
        points: item.points,
        question: item.questions,
      }));
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
            avatarUrl:avatar_url,
            avatarColor:avatar_color,
            institute
          )
        `)
        .eq('live_exam_id', leaderboardForExam)
        .eq('status', 'submitted')
        .order('score', { ascending: false })
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
      .select('*, total_questions:live_exam_questions(count)')
      .order('start_time', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    let data: any[] | null = null;

    try {
      const res = await query;
      if (res.error) throw res.error;
      data = res.data;
    } catch (joinErr) {
      console.warn('live_exams join query failed, falling back to plain select:', joinErr);
      let plainQuery = supabaseAdmin
        .from('live_exams')
        .select('*')
        .order('start_time', { ascending: false });

      if (category && category !== 'all') {
        plainQuery = plainQuery.eq('category', category);
      }
      if (status && status !== 'all') {
        plainQuery = plainQuery.eq('status', status);
      }

      const plainRes = await plainQuery;
      if (plainRes.error) throw plainRes.error;
      data = plainRes.data;
    }

    const mapped = (data || []).map((exam: any) => ({
      ...exam,
      total_questions: exam.total_questions?.[0]?.count || 0,
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
    if (action === 'add_question' && body.examId && body.questionId) {
      const { examId, questionId, serial, points = 1 } = body;
      const { error: insErr } = await supabaseAdmin
        .from('live_exam_questions')
        .insert([{
          live_exam_id: examId,
          question_id: questionId,
          serial: serial || 1,
          points,
        }]);

      if (insErr) throw insErr;

      // Sync total_questions count
      const { count } = await supabaseAdmin
        .from('live_exam_questions')
        .select('*', { count: 'exact', head: true })
        .eq('live_exam_id', examId);

      await supabaseAdmin
        .from('live_exams')
        .update({ total_questions: count || 0, updated_at: new Date().toISOString() })
        .eq('id', examId);

      return NextResponse.json({ success: true, count });
    }

    if (action === 'add_questions_batch' && body.examId && Array.isArray(body.questionIds)) {
      const { examId, questionIds, points = 1 } = body;
      if (questionIds.length === 0) {
        return NextResponse.json({ success: true, count: 0 });
      }

      // 1. Fetch existing mappings to avoid duplicates & calculate serial
      const { data: existing } = await supabaseAdmin
        .from('live_exam_questions')
        .select('question_id')
        .eq('live_exam_id', examId);

      const existingSet = new Set((existing || []).map((e: any) => e.question_id));
      const toAdd = questionIds.filter((qId: string) => !existingSet.has(qId));

      if (toAdd.length > 0) {
        let currentSerial = (existing?.length || 0) + 1;
        const inserts = toAdd.map((qId: string) => ({
          live_exam_id: examId,
          question_id: qId,
          serial: currentSerial++,
          points,
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
        .update({ total_questions: count || 0, updated_at: new Date().toISOString() })
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
          .update({ total_questions: count || 0, updated_at: new Date().toISOString() })
          .eq('id', examId);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'swap_question' && body.mappingId && body.newQuestionId) {
      const { mappingId, newQuestionId } = body;
      const { error: swapErr } = await supabaseAdmin
        .from('live_exam_questions')
        .update({ question_id: newQuestionId })
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
        .select('question_id')
        .eq('live_exam_id', examId);

      const existingSet = new Set((existing || []).map((e: any) => e.question_id));
      const candidateIdsToAdd: string[] = [];

      for (const rule of rules) {
        if (!rule.subject || rule.count <= 0) continue;

        let query = supabaseAdmin
          .from('questions')
          .select('id')
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
          const filtered = candidates
            .map((c: any) => c.id)
            .filter((id: string) => !existingSet.has(id) && !candidateIdsToAdd.includes(id));

          const picked = filtered.slice(0, rule.count);
          picked.forEach((id: string) => candidateIdsToAdd.push(id));
        }
      }

      if (candidateIdsToAdd.length > 0) {
        let currentSerial = (existing?.length || 0) + 1;
        const inserts = candidateIdsToAdd.map((qId: string) => ({
          live_exam_id: examId,
          question_id: qId,
          serial: currentSerial++,
          points: 1,
        }));

        await supabaseAdmin.from('live_exam_questions').insert(inserts);

        // Sync total_questions count
        const { count } = await supabaseAdmin
          .from('live_exam_questions')
          .select('*', { count: 'exact', head: true })
          .eq('live_exam_id', examId);

        await supabaseAdmin
          .from('live_exams')
          .update({ total_questions: count || 0, updated_at: new Date().toISOString() })
          .eq('id', examId);
      }

      return NextResponse.json({ success: true, count: candidateIdsToAdd.length });
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
