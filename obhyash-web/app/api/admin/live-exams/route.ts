import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const id = searchParams.get('id');

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

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
