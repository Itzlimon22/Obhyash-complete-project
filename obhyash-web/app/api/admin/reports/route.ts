import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '20'));
    const status = searchParams.get('status');
    const reason = searchParams.get('reason');
    const search = searchParams.get('search');

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // Build query for reports
    let query = supabaseAdmin.from('reports').select('*', { count: 'exact' });

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    if (reason && reason !== 'All') {
      query = query.ilike('reason', `%${reason}%`);
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.or(
        `reporter_name.ilike.%${searchTerm}%,reason.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`,
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.order('created_at', { ascending: false }).range(from, to);

    // Run paginated query and status counts in parallel
    const [reportsRes, totalAllRes, pendingRes, resolvedRes, ignoredRes] =
      await Promise.all([
        query,
        supabaseAdmin.from('reports').select('*', { count: 'exact', head: true }),
        supabaseAdmin
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending'),
        supabaseAdmin
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Resolved'),
        supabaseAdmin
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Ignored'),
      ]);

    if (reportsRes.error) {
      console.error('Error fetching reports:', reportsRes.error);
      throw reportsRes.error;
    }

    const rawReports = reportsRes.data || [];
    const totalCount = reportsRes.count || 0;

    // Fetch related questions and users
    const questionIds = Array.from(
      new Set(rawReports.map((r) => r.question_id).filter(Boolean)),
    );
    const reporterIds = Array.from(
      new Set(rawReports.map((r) => r.reporter_id).filter(Boolean)),
    );

    const [questionsRes, usersRes] = await Promise.all([
      questionIds.length > 0
        ? supabaseAdmin
            .from('questions')
            .select(
              'id, question, options, correct_answer_indices, explanation, subject, chapter, topic, difficulty',
            )
            .in('id', questionIds)
        : Promise.resolve({ data: [] }),
      reporterIds.length > 0
        ? supabaseAdmin
            .from('users')
            .select('id, name, email, phone, institute, avatar_url, avatar_color')
            .in('id', reporterIds)
        : Promise.resolve({ data: [] }),
    ]);

    const questionMap = new Map(
      (questionsRes.data || []).map((q: any) => [String(q.id), q]),
    );
    const userMap = new Map(
      (usersRes.data || []).map((u: any) => [String(u.id), u]),
    );

    const mappedReports = rawReports.map((report) => {
      const q = report.question_id ? questionMap.get(String(report.question_id)) : null;
      const u = report.reporter_id ? userMap.get(String(report.reporter_id)) : null;

      return {
        ...report,
        question: q || null,
        reporter: u || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        reports: mappedReports,
        count: totalCount,
        stats: {
          total: totalAllRes.count || 0,
          pending: pendingRes.count || 0,
          resolved: resolvedRes.count || 0,
          ignored: ignoredRes.count || 0,
        },
      },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/reports GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connection();
    const body = await request.json();
    const { action, reportId, resolution, adminComment, questionFix, reportIds } = body;
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();

    // 1. In-line Fix & Resolve Action
    if (action === 'fix_and_resolve' && reportId) {
      // If questionFix is provided, update the question
      if (questionFix && questionFix.questionId) {
        const updatePayload: any = {};
        if (questionFix.correctAnswerIndex !== undefined) {
          updatePayload.correct_answer_indices = [questionFix.correctAnswerIndex];
        }
        if (questionFix.questionText) {
          updatePayload.question = questionFix.questionText;
        }
        if (questionFix.explanation !== undefined) {
          updatePayload.explanation = questionFix.explanation;
        }
        if (questionFix.options) {
          updatePayload.options = questionFix.options;
        }

        if (Object.keys(updatePayload).length > 0) {
          await supabaseAdmin
            .from('questions')
            .update(updatePayload)
            .eq('id', questionFix.questionId);
        }
      }

      // Fetch report for reward
      const { data: reportData } = await supabaseAdmin
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      // Resolve the report
      await supabaseAdmin
        .from('reports')
        .update({
          status: 'Resolved',
          admin_comment: adminComment || 'ত্রুটি সংশোধন করা হয়েছে। ধন্যবাদ!',
          resolved_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', reportId);

      // Reward student with 1 day bonus
      if (reportData?.reporter_id) {
        await rewardReporter(supabaseAdmin, reportData.reporter_id, now);
      }

      return NextResponse.json({ success: true, status: 'Resolved' });
    }

    // 2. Simple Resolve Action (Accept or Reject)
    if (action === 'resolve') {
      if (!reportId || !resolution) {
        return NextResponse.json(
          { success: false, error: 'reportId and resolution are required' },
          { status: 400 },
        );
      }

      const status = resolution === 'Accept' ? 'Resolved' : 'Ignored';

      const { data: reportData, error: fetchErr } = await supabaseAdmin
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (fetchErr || !reportData) {
        return NextResponse.json(
          { success: false, error: 'Report not found' },
          { status: 404 },
        );
      }

      await supabaseAdmin
        .from('reports')
        .update({
          status,
          admin_comment: adminComment || '',
          resolved_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', reportId);

      if (resolution === 'Accept' && reportData.reporter_id) {
        await rewardReporter(supabaseAdmin, reportData.reporter_id, now);
      }

      return NextResponse.json({ success: true, status });
    }

    // 3. Mass Bulk Action (Bulk Resolve or Bulk Ignore)
    if (action === 'bulk_update' && Array.isArray(reportIds) && reportIds.length > 0) {
      const status = resolution === 'Accept' ? 'Resolved' : 'Ignored';

      await supabaseAdmin
        .from('reports')
        .update({
          status,
          admin_comment: adminComment || 'বাল্ক প্রসেস করা হয়েছে।',
          resolved_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .in('id', reportIds);

      return NextResponse.json({ success: true, count: reportIds.length, status });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action specified' },
      { status: 400 },
    );
  } catch (err: any) {
    console.error('Error in /api/admin/reports POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

async function rewardReporter(supabaseAdmin: any, reporterId: string, now: Date) {
  try {
    // 1. Get latest active subscription from subscription_history
    const { data: sub } = await supabaseAdmin
      .from('subscription_history')
      .select('*')
      .eq('user_id', reporterId)
      .eq('is_active', true)
      .gt('expires_at', now.toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Fetch User Profile
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('subscription, subscription_expires_at')
      .eq('id', reporterId)
      .maybeSingle();

    const currentSub = userData?.subscription || {};
    let baseDate = now;

    if (sub && sub.expires_at) {
      const exp = new Date(sub.expires_at);
      if (exp > now) baseDate = exp;
    } else if (currentSub.expiry || userData?.subscription_expires_at) {
      const exp = new Date(currentSub.expiry || userData?.subscription_expires_at);
      if (exp > now) baseDate = exp;
    }

    const newExpiry = new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000);

    // 3. Update 'users' table (Web & Profile queries)
    await supabaseAdmin
      .from('users')
      .update({
        subscription: {
          ...currentSub,
          plan:
            currentSub.plan && currentSub.plan !== 'Free'
              ? currentSub.plan
              : 'Premium (Reward)',
          expiry: newExpiry.toISOString(),
          expires_at: newExpiry.toISOString(),
          status: 'Active',
        },
        subscription_status: 'Active',
        subscription_expires_at: newExpiry.toISOString(),
        is_subscribed: true,
        updated_at: now.toISOString(),
      })
      .eq('id', reporterId);

    // 4. Update 'subscription_history' table (Flutter & Invoices queries)
    if (sub) {
      await supabaseAdmin
        .from('subscription_history')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', sub.id);
    } else {
      const { data: planData } = await supabaseAdmin
        .from('subscription_plans')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      await supabaseAdmin
        .from('subscription_history')
        .update({ is_active: false })
        .eq('user_id', reporterId);

      await supabaseAdmin.from('subscription_history').insert({
        user_id: reporterId,
        plan_id: planData?.id || null,
        started_at: now.toISOString(),
        expires_at: newExpiry.toISOString(),
        is_active: true,
      });
    }

    // 5. Send Notification (is_read matches schema)
    await supabaseAdmin.from('notifications').insert({
      user_id: reporterId,
      title: 'রিপোর্ট গৃহীত ও ১ দিনের প্রো রিওয়ার্ড! 🎁',
      message:
        'আপনার পাঠানো প্রশ্নের ত্রুটি রিপোর্টটি ভেরিফাই করে সমাধান করা হয়েছে। সহযোগিতার জন্য আপনাকে ১ দিনের প্রো সাবস্ক্রিপশন রিওয়ার্ড দেওয়া হয়েছে!',
      type: 'reward',
      is_read: false,
      created_at: now.toISOString(),
    });
  } catch (subErr) {
    console.warn('Failed to reward subscription:', subErr);
  }
}
