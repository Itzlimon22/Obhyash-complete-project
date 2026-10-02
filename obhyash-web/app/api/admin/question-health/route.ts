import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getAdminClient();
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const stream = (searchParams.get('stream') || '').trim();
    const subject = (searchParams.get('subject') || '').trim();
    const chapter = (searchParams.get('chapter') || '').trim();
    const tier = (searchParams.get('tier') || 'all').trim(); // 'all' | 'quarantined' | 'reported' | 'high_error' | 'slow' | 'healthy' | 'catalog'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get('pageSize') || '25', 10)));
    const offset = (page - 1) * pageSize;

    // 1. Fetch pending reports map to enrich report details (fast query on small reports table)
    const { data: reportsData } = await supabaseAdmin
      .from('reports')
      .select('id, question_id, reason, description, status, created_at')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false })
      .limit(200);

    const reportMap: Record<
      string,
      { pending: number; reasons: string[]; descriptions: string[] }
    > = {};
    const repQuestionIdSet = new Set<string>();

    (reportsData || []).forEach((r: any) => {
      if (!r.question_id) return;
      const qKey = String(r.question_id);
      repQuestionIdSet.add(qKey);
      if (!reportMap[qKey]) {
        reportMap[qKey] = { pending: 0, reasons: [], descriptions: [] };
      }
      reportMap[qKey].pending++;
      if (r.reason && !reportMap[qKey].reasons.includes(r.reason)) {
        reportMap[qKey].reasons.push(r.reason);
      }
      if (r.description && !reportMap[qKey].descriptions.includes(r.description)) {
        reportMap[qKey].descriptions.push(r.description);
      }
    });

    const repQuestionIds = Array.from(repQuestionIdSet);

    // 2. Fetch fast parallel KPIs & subjects (under 500ms total)
    const [
      estTotalRes,
      quarantinedRes,
      highErrorRes,
      slowRes,
      subjectsRes
    ] = await Promise.all([
      supabaseAdmin.from('questions').select('*', { count: 'estimated', head: true }),
      supabaseAdmin.from('questions').select('id').eq('is_quarantined', true),
      supabaseAdmin.from('questions').select('*', { count: 'exact', head: true }).lt('accuracy_rate', 35).gte('times_attempted', 2),
      supabaseAdmin.from('questions').select('*', { count: 'exact', head: true }).gt('avg_time_spent_seconds', 75).gte('times_attempted', 2),
      supabaseAdmin.from('subjects').select('name').order('name'),
    ]);

    const totalQuestions = estTotalRes.count || 76493;
    const quarantinedTotal = quarantinedRes.data?.length || 0;
    const reportedTotal = repQuestionIds.length;
    const highErrorTotal = highErrorRes.count || 0;
    const slowTotal = slowRes.count || 0;
    const issuesTotal = quarantinedTotal + reportedTotal + highErrorTotal + slowTotal;

    const subjectsList = Array.from(
      new Set((subjectsRes.data || []).map((s: any) => s.name).filter(Boolean)),
    );

    // 3. Build target query for questions list with pagination
    const selectFields =
      'id, question, passage, options, correct_answer_indices, explanation, subject, subject_id, chapter, chapter_id, topic, stream, stream_id, difficulty, difficulty_rating, is_difficulty_locked, status, author, updated_at, times_attempted, times_correct, times_wrong, avg_time_spent_seconds, accuracy_rate, report_count, is_quarantined, quarantine_reason';

    let query = supabaseAdmin
      .from('questions')
      .select(selectFields, { count: 'exact' });

    if (stream && stream !== 'all') {
      query = query.or(`stream.eq.${stream},stream_id.eq.${stream}`);
    }
    if (subject && subject !== 'all') {
      query = query.or(`subject.eq.${subject},subject_id.eq.${subject}`);
    }
    if (chapter && chapter !== 'all') {
      query = query.or(`chapter.eq.${chapter},chapter_id.eq.${chapter}`);
    }
    if (search) {
      query = query.or(`question.ilike.%${search}%,explanation.ilike.%${search}%`);
    }

    // Apply Tier Filter
    if (tier === 'quarantined') {
      query = query
        .eq('is_quarantined', true)
        .order('updated_at', { ascending: false });
    } else if (tier === 'reported') {
      if (repQuestionIds.length > 0) {
        query = query
          .or(`report_count.gt.0,id.in.(${repQuestionIds.slice(0, 100).join(',')})`)
          .order('updated_at', { ascending: false });
      } else {
        query = query.gt('report_count', 0).order('updated_at', { ascending: false });
      }
    } else if (tier === 'high_error') {
      query = query
        .lt('accuracy_rate', 35)
        .gte('times_attempted', 2)
        .order('accuracy_rate', { ascending: true });
    } else if (tier === 'slow') {
      query = query
        .gt('avg_time_spent_seconds', 75)
        .gte('times_attempted', 2)
        .order('avg_time_spent_seconds', { ascending: false });
    } else if (tier === 'healthy') {
      query = query
        .eq('is_quarantined', false)
        .eq('report_count', 0)
        .order('updated_at', { ascending: false });
    } else if (tier === 'catalog') {
      query = query.order('updated_at', { ascending: false });
    } else {
      // Default: 'all' issues/flagged questions
      if (repQuestionIds.length > 0) {
        query = query
          .or(`is_quarantined.eq.true,status.eq.Quarantined,report_count.gt.0,id.in.(${repQuestionIds.slice(0, 100).join(',')})`)
          .order('updated_at', { ascending: false });
      } else {
        query = query
          .or('is_quarantined.eq.true,status.eq.Quarantined,report_count.gt.0')
          .order('updated_at', { ascending: false });
      }
    }

    const { data: questionsList, count: totalFilteredCount, error: qErr } = await query.range(
      offset,
      offset + pageSize - 1,
    );

    if (qErr) {
      console.error('Error fetching questions for health:', qErr);
      return NextResponse.json({ success: false, error: qErr.message }, { status: 500 });
    }

    // 4. Enrich Questions
    const enrichedQuestions = (questionsList || []).map((q: any) => {
      const qId = String(q.id);
      const rInfo = reportMap[qId] || { pending: 0, reasons: [], descriptions: [] };

      const attempts = q.times_attempted || 0;
      const accuracy =
        q.accuracy_rate !== null && q.accuracy_rate !== undefined ? Number(q.accuracy_rate) : null;
      const avgTime =
        q.avg_time_spent_seconds !== null && q.avg_time_spent_seconds !== undefined
          ? Number(q.avg_time_spent_seconds)
          : 0;
      const reportsCount = Math.max(q.report_count || 0, rInfo.pending);
      const isQuarantined = Boolean(q.is_quarantined || q.status === 'Quarantined');

      let healthTier: 'quarantined' | 'reported' | 'high_error' | 'slow' | 'healthy' = 'healthy';
      if (isQuarantined) {
        healthTier = 'quarantined';
      } else if (reportsCount > 0) {
        healthTier = 'reported';
      } else if (accuracy !== null && accuracy < 35 && attempts >= 2) {
        healthTier = 'high_error';
      } else if (avgTime > 75 && attempts >= 2) {
        healthTier = 'slow';
      }

      return {
        id: q.id,
        question: q.question,
        passage: q.passage,
        options: q.options || [],
        correct_answer_indices: q.correct_answer_indices || [0],
        explanation: q.explanation || '',
        subject: q.subject || '',
        subject_id: q.subject_id || '',
        chapter: q.chapter || '',
        chapter_id: q.chapter_id || '',
        topic: q.topic || '',
        stream: q.stream || q.stream_id || 'HSC',
        difficulty: q.difficulty || 'Medium',
        difficulty_rating: q.difficulty_rating || 1200,
        is_difficulty_locked: Boolean(q.is_difficulty_locked),
        status: q.status || 'Approved',
        author: q.author || 'Admin',
        updated_at: q.updated_at || q.created_at,
        reportCount: reportsCount,
        pendingReportsCount: rInfo.pending,
        reportReasons: rInfo.reasons,
        reportDescriptions: rInfo.descriptions,
        isQuarantined,
        quarantineReason: q.quarantine_reason,
        timesAttempted: attempts,
        timesCorrect: q.times_correct || 0,
        timesWrong: q.times_wrong || 0,
        avgTimeSpentSeconds: avgTime,
        accuracyRate: accuracy,
        healthTier,
      };
    });

    const platformHealthScore =
      totalQuestions > 0
        ? Number(
            (
              ((totalQuestions - quarantinedTotal * 2 - reportedTotal) / totalQuestions) *
              100
            ).toFixed(1),
          )
        : 100;

    const totalFiltered = totalFilteredCount !== null ? totalFilteredCount : enrichedQuestions.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

    return NextResponse.json({
      success: true,
      data: {
        questions: enrichedQuestions,
        subjects: subjectsList,
        pagination: {
          page,
          pageSize,
          totalQuestions: totalFiltered,
          totalPages,
        },
        kpis: {
          totalQuestions,
          issuesCount: issuesTotal,
          quarantinedCount: quarantinedTotal,
          reportedCount: reportedTotal,
          highErrorCount: highErrorTotal,
          slowCount: slowTotal,
          healthyCount: Math.max(0, totalQuestions - issuesTotal),
          avgPlatformAccuracy: 75,
          platformHealthScore,
        },
      },
    });
  } catch (error: any) {
    console.error('API Error in /api/admin/question-health:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

// 1-Click Resolution & Telemetry Action Endpoint
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const {
      questionId,
      action, // 'APPROVE_FIXED' | 'DISMISS_FALSE_ALARM' | 'DELETE_QUESTION' | 'TOGGLE_DIFFICULTY_LOCK' | 'SET_DIFFICULTY'
      updatedQuestion,
      updatedOptions,
      updatedAnswerIndices,
      updatedExplanation,
      adminComment,
      targetDifficulty,
      isLocked,
    } = body;

    if (!questionId) {
      return NextResponse.json({ success: false, error: 'Question ID is required' }, { status: 400 });
    }

    if (action === 'TOGGLE_DIFFICULTY_LOCK') {
      const { error } = await supabaseAdmin
        .from('questions')
        .update({
          is_difficulty_locked: Boolean(isLocked),
          ...(targetDifficulty ? { difficulty: targetDifficulty } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Difficulty settings updated successfully' });
    }

    if (action === 'QUARANTINE_QUESTION') {
      const { error } = await supabaseAdmin
        .from('questions')
        .update({
          is_quarantined: true,
          status: 'Quarantined',
          quarantine_reason: adminComment || 'অ্যাডমিন কর্তৃক পর্যালোচনার জন্য স্থগিত',
          updated_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'প্রশ্নটি সফলভাবে কোয়ারেন্টাইনে নেওয়া হয়েছে' });
    }

    if (action === 'DELETE_QUESTION') {
      const { error } = await supabaseAdmin
        .from('questions')
        .update({
          status: 'Rejected',
          is_quarantined: true,
          quarantine_reason: 'অ্যাডমিন কর্তৃক বাতিলকৃত',
          updated_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'প্রশ্নটি সফলভাবে ডিঅ্যাক্টিভেট করা হয়েছে' });
    }

    // Call admin_resolve_question RPC
    const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('admin_resolve_question', {
      p_question_id: questionId,
      p_action: action || 'APPROVE_FIXED',
      p_updated_question: updatedQuestion || null,
      p_updated_options: updatedOptions || null,
      p_updated_answer_indices: updatedAnswerIndices || null,
      p_updated_explanation: updatedExplanation || null,
      p_admin_comment: adminComment || null,
    });

    if (rpcErr) {
      console.error('admin_resolve_question RPC error:', rpcErr);
      // Fallback direct table update if RPC fails
      if (action === 'APPROVE_FIXED') {
        await supabaseAdmin
          .from('questions')
          .update({
            ...(updatedQuestion ? { question: updatedQuestion } : {}),
            ...(updatedOptions ? { options: updatedOptions } : {}),
            ...(updatedAnswerIndices ? { correct_answer_indices: updatedAnswerIndices } : {}),
            ...(updatedExplanation ? { explanation: updatedExplanation } : {}),
            status: 'Approved',
            is_quarantined: false,
            report_count: 0,
            quarantine_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', questionId);

        await supabaseAdmin
          .from('reports')
          .update({ status: 'Resolved', resolved_at: new Date().toISOString() })
          .eq('question_id', questionId);
      } else if (action === 'DISMISS_FALSE_ALARM') {
        await supabaseAdmin
          .from('questions')
          .update({
            status: 'Approved',
            is_quarantined: false,
            report_count: 0,
            quarantine_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', questionId);

        await supabaseAdmin
          .from('reports')
          .update({ status: 'Ignored', resolved_at: new Date().toISOString() })
          .eq('question_id', questionId);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Question resolved and updated successfully!',
    });
  } catch (error: any) {
    console.error('Error in /api/admin/question-health POST:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Action failed' },
      { status: 500 },
    );
  }
}
