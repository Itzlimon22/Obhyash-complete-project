import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const stream = (searchParams.get('stream') || '').trim();
    const subject = (searchParams.get('subject') || '').trim();
    const chapter = (searchParams.get('chapter') || '').trim();
    const tier = (searchParams.get('tier') || 'all').trim(); // 'all' | 'quarantined' | 'reported' | 'high_error' | 'slow' | 'healthy'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get('pageSize') || '25', 10)));

    // 1. Fetch pending reports map to enrich report details
    const { data: reportsData } = await supabaseAdmin
      .from('reports')
      .select('id, question_id, reason, description, status, created_at')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });

    const reportMap: Record<
      string,
      { pending: number; reasons: string[]; descriptions: string[] }
    > = {};

    (reportsData || []).forEach((r: any) => {
      if (!r.question_id) return;
      const qKey = String(r.question_id);
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

    // 2. Query questions directly from Partitioned Database using Telemetry & Quarantine Columns
    let query = supabaseAdmin
      .from('questions')
      .select('*', { count: 'exact' });

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

    // Apply Tier Filter in Query if directly indexed
    if (tier === 'quarantined') {
      query = query.or('is_quarantined.eq.true,status.eq.Quarantined');
    } else if (tier === 'reported') {
      query = query.gt('report_count', 0);
    } else if (tier === 'high_error') {
      query = query.lt('accuracy_rate', 35).gte('times_attempted', 2);
    } else if (tier === 'slow') {
      query = query.gt('avg_time_spent_seconds', 75).gte('times_attempted', 2);
    } else if (tier === 'healthy') {
      query = query.eq('is_quarantined', false).eq('report_count', 0).gte('accuracy_rate', 60);
    }

    const { data: questionsList, count: totalCount, error: qErr } = await query
      .order('is_quarantined', { ascending: false })
      .order('report_count', { ascending: false })
      .order('times_attempted', { ascending: false })
      .limit(1000);

    if (qErr) {
      console.error('Error fetching questions for health:', qErr);
      return NextResponse.json({ success: false, error: qErr.message }, { status: 500 });
    }

    // 3. Process & Classify Health Status
    let quarantinedTotal = 0;
    let reportedTotal = 0;
    let highErrorTotal = 0;
    let slowTotal = 0;
    let healthyTotal = 0;
    let totalAttemptsSum = 0;
    let totalAccuracySum = 0;
    let attemptedQuestionsCount = 0;

    const enrichedQuestions = (questionsList || []).map((q: any) => {
      const qId = String(q.id);
      const rInfo = reportMap[qId] || { pending: 0, reasons: [], descriptions: [] };

      const attempts = q.times_attempted || 0;
      const accuracy = q.accuracy_rate !== null && q.accuracy_rate !== undefined ? Number(q.accuracy_rate) : null;
      const avgTime = q.avg_time_spent_seconds !== null && q.avg_time_spent_seconds !== undefined ? Number(q.avg_time_spent_seconds) : 0;
      const reportsCount = Math.max(q.report_count || 0, rInfo.pending);
      const isQuarantined = Boolean(q.is_quarantined || q.status === 'Quarantined');

      if (attempts > 0 && accuracy !== null) {
        totalAttemptsSum += attempts;
        totalAccuracySum += accuracy;
        attemptedQuestionsCount++;
      }

      // Classification
      let healthTier: 'quarantined' | 'reported' | 'high_error' | 'slow' | 'healthy' = 'healthy';
      if (isQuarantined) {
        healthTier = 'quarantined';
        quarantinedTotal++;
      } else if (reportsCount > 0) {
        healthTier = 'reported';
        reportedTotal++;
      } else if (accuracy !== null && accuracy < 35 && attempts >= 2) {
        healthTier = 'high_error';
        highErrorTotal++;
      } else if (avgTime > 75 && attempts >= 2) {
        healthTier = 'slow';
        slowTotal++;
      } else {
        healthTier = 'healthy';
        healthyTotal++;
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
        // Health & Telemetry Metrics (Phase D & E)
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

    const totalQuestions = enrichedQuestions.length;
    const avgPlatformAccuracy =
      attemptedQuestionsCount > 0 ? Math.round(totalAccuracySum / attemptedQuestionsCount) : 75;

    const platformHealthScore =
      totalQuestions > 0
        ? Math.max(0, Math.round(((totalQuestions - quarantinedTotal * 3 - reportedTotal * 1.5 - highErrorTotal) / totalQuestions) * 100))
        : 100;

    // 4. Paginate Results
    const totalFiltered = enrichedQuestions.length;
    const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedQuestions = enrichedQuestions.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      success: true,
      data: {
        questions: paginatedQuestions,
        pagination: {
          page,
          pageSize,
          totalQuestions: totalFiltered,
          totalPages,
        },
        kpis: {
          totalQuestions,
          quarantinedCount: quarantinedTotal,
          reportedCount: reportedTotal,
          highErrorCount: highErrorTotal,
          slowCount: slowTotal,
          healthyCount: healthyTotal,
          avgPlatformAccuracy,
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
