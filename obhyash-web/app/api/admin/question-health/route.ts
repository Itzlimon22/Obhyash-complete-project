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
    const subject = (searchParams.get('subject') || '').trim();
    const chapter = (searchParams.get('chapter') || '').trim();
    const tier = (searchParams.get('tier') || 'all').trim(); // 'all' | 'critical' | 'high_error' | 'top_bookmarked' | 'healthy'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(10, parseInt(searchParams.get('pageSize') || '20', 10)));

    // 1. Fetch Bookmarks counts grouped by question_id
    const { data: bookmarksData, error: bErr } = await supabaseAdmin
      .from('bookmarks')
      .select('question_id');

    const bookmarkCountMap: Record<string, number> = {};
    (bookmarksData || []).forEach((b: any) => {
      if (b.question_id) {
        bookmarkCountMap[b.question_id] = (bookmarkCountMap[b.question_id] || 0) + 1;
      }
    });

    // 2. Fetch Reports counts & reasons grouped by question_id
    const { data: reportsData, error: rErr } = await supabaseAdmin
      .from('reports')
      .select('id, question_id, reason, status, created_at')
      .order('created_at', { ascending: false });

    const reportMap: Record<
      string,
      { total: number; pending: number; reasons: string[] }
    > = {};

    (reportsData || []).forEach((r: any) => {
      if (!r.question_id) return;
      if (!reportMap[r.question_id]) {
        reportMap[r.question_id] = { total: 0, pending: 0, reasons: [] };
      }
      reportMap[r.question_id].total++;
      if (r.status === 'Pending' || !r.status) {
        reportMap[r.question_id].pending++;
      }
      if (r.reason && !reportMap[r.question_id].reasons.includes(r.reason)) {
        reportMap[r.question_id].reasons.push(r.reason);
      }
    });

    // 3. Fetch Exam Results to calculate live Error Rates
    const { data: examResultsData } = await supabaseAdmin
      .from('exam_results')
      .select('questions, user_answers')
      .order('created_at', { ascending: false })
      .limit(500);

    const questionAttemptMap: Record<
      string,
      { totalAttempts: number; wrongAttempts: number; correctAttempts: number }
    > = {};

    (examResultsData || []).forEach((exam: any) => {
      const qList = Array.isArray(exam.questions) ? exam.questions : [];
      const userAnswers = exam.user_answers || {};

      qList.forEach((q: any) => {
        const qId = q.id || q.question_id;
        if (!qId) return;

        if (!questionAttemptMap[qId]) {
          questionAttemptMap[qId] = {
            totalAttempts: 0,
            wrongAttempts: 0,
            correctAttempts: 0,
          };
        }

        const stats = questionAttemptMap[qId];
        stats.totalAttempts++;

        const userAns = userAnswers[qId];
        const correctIndices = Array.isArray(q.correct_answer_indices)
          ? q.correct_answer_indices
          : typeof q.correct_answer_index === 'number'
          ? [q.correct_answer_index]
          : [0];

        let isCorrect = false;
        if (typeof userAns === 'number') {
          isCorrect = correctIndices.includes(userAns);
        } else if (typeof userAns === 'string' && q.options) {
          const matchedIdx = q.options.findIndex((opt: string) => opt?.trim() === userAns?.trim());
          if (matchedIdx !== -1) {
            isCorrect = correctIndices.includes(matchedIdx);
          }
        }

        if (isCorrect) {
          stats.correctAttempts++;
        } else if (userAns !== undefined && userAns !== null) {
          stats.wrongAttempts++;
        }
      });
    });

    // 4. Query Questions from DB
    let query = supabaseAdmin
      .from('questions')
      .select('*', { count: 'exact' });

    if (subject && subject !== 'all') {
      query = query.eq('subject', subject);
    }
    if (chapter && chapter !== 'all') {
      query = query.eq('chapter', chapter);
    }
    if (search) {
      query = query.or(`question.ilike.%${search}%,explanation.ilike.%${search}%`);
    }

    const { data: questionsList, count: totalCount, error: qErr } = await query
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (qErr) {
      console.error('Error fetching questions for health:', qErr);
      return NextResponse.json({ success: false, error: qErr.message }, { status: 500 });
    }

    // 5. Enrich Questions with Health Intelligence
    const enrichedQuestions = (questionsList || []).map((q: any) => {
      const qId = q.id;
      const bCount = bookmarkCountMap[qId] || 0;
      const rInfo = reportMap[qId] || { total: 0, pending: 0, reasons: [] };
      const attemptsInfo = questionAttemptMap[qId] || {
        totalAttempts: 0,
        wrongAttempts: 0,
        correctAttempts: 0,
      };

      const attempts = attemptsInfo.totalAttempts;
      const wrong = attemptsInfo.wrongAttempts;
      const errorRate = attempts > 0 ? Math.round((wrong / attempts) * 100) : 0;
      const accuracyRate = attempts > 0 ? Math.round((attemptsInfo.correctAttempts / attempts) * 100) : 100;

      // Classify Health Status Tier
      let healthTier: 'critical' | 'high_error' | 'top_bookmarked' | 'healthy' = 'healthy';
      if (rInfo.total > 0 || rInfo.pending > 0) {
        healthTier = 'critical';
      } else if (errorRate >= 60 && attempts >= 2) {
        healthTier = 'high_error';
      } else if (bCount >= 1) {
        healthTier = 'top_bookmarked';
      } else {
        healthTier = 'healthy';
      }

      return {
        id: q.id,
        question: q.question,
        options: q.options || [],
        correct_answer_indices: q.correct_answer_indices || [0],
        explanation: q.explanation || '',
        subject: q.subject || '',
        chapter: q.chapter || '',
        topic: q.topic || '',
        difficulty: q.difficulty || 'Medium',
        status: q.status || 'Approved',
        author: q.author || q.author_name || 'Admin',
        updated_at: q.updated_at || q.created_at,
        // Health metrics
        bookmarksCount: bCount,
        reportsCount: rInfo.total,
        pendingReportsCount: rInfo.pending,
        reportReasons: rInfo.reasons,
        totalAttempts: attempts,
        wrongAttempts: wrong,
        errorRate,
        accuracyRate,
        healthTier,
      };
    });

    // 6. Calculate Summary Metrics (KPIs)
    let criticalTotal = 0;
    let highErrorTotal = 0;
    let bookmarkedTotal = 0;
    let healthyTotal = 0;

    enrichedQuestions.forEach((q) => {
      if (q.healthTier === 'critical') criticalTotal++;
      else if (q.healthTier === 'high_error') highErrorTotal++;
      else if (q.healthTier === 'top_bookmarked') bookmarkedTotal++;
      else healthyTotal++;
    });

    const totalQuestions = enrichedQuestions.length;
    const platformHealthScore =
      totalQuestions > 0
        ? Math.max(0, Math.round(((totalQuestions - criticalTotal * 2 - highErrorTotal) / totalQuestions) * 100))
        : 100;

    // 7. Filter by Tier if selected
    let filteredQuestions = enrichedQuestions;
    if (tier && tier !== 'all') {
      filteredQuestions = enrichedQuestions.filter((q) => q.healthTier === tier);
    }

    // 8. Sort: Prioritize critical > high error > bookmarked > healthy
    filteredQuestions.sort((a, b) => {
      if (a.healthTier === 'critical' && b.healthTier !== 'critical') return -1;
      if (b.healthTier === 'critical' && a.healthTier !== 'critical') return 1;
      if (b.pendingReportsCount !== a.pendingReportsCount) return b.pendingReportsCount - a.pendingReportsCount;
      if (b.errorRate !== a.errorRate) return b.errorRate - a.errorRate;
      return b.bookmarksCount - a.bookmarksCount;
    });

    // 9. Paginate Results
    const totalFiltered = filteredQuestions.length;
    const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + pageSize);

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
          criticalCount: criticalTotal,
          highErrorCount: highErrorTotal,
          bookmarkedCount: bookmarkedTotal,
          healthyCount: healthyTotal,
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

// Quick action endpoint to fix correct answer or explanation or resolve reports
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, correctAnswerIndices, explanation, status, resolveReports } = body;

    if (!questionId) {
      return NextResponse.json({ success: false, error: 'Question ID required' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (Array.isArray(correctAnswerIndices)) {
      updates.correct_answer_indices = correctAnswerIndices;
    }
    if (explanation !== undefined) {
      updates.explanation = explanation;
    }
    if (status) {
      updates.status = status;
    }

    const { error: updateErr } = await supabaseAdmin
      .from('questions')
      .update(updates)
      .eq('id', questionId);

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // If resolveReports is true, mark all pending reports for this question as Resolved
    if (resolveReports) {
      await supabaseAdmin
        .from('reports')
        .update({ status: 'Resolved' })
        .eq('question_id', questionId);
    }

    return NextResponse.json({
      success: true,
      message: 'প্রশ্ন স্বাস্থ্য ও সমাধান সফলভাবে আপডেট হয়েছে!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update question' },
      { status: 500 },
    );
  }
}
