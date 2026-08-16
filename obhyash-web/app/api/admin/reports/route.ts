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
    const search = searchParams.get('search');

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // Build query for reports
    let query = supabaseAdmin.from('reports').select('*', { count: 'exact' });

    if (status && status !== 'All') {
      query = query.eq('status', status);
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
              'id, question, options, correct_answer_indices, explanation, subject, chapter, topic',
            )
            .in('id', questionIds)
        : Promise.resolve({ data: [] }),
      reporterIds.length > 0
        ? supabaseAdmin
            .from('users')
            .select('id, name, email, phone')
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
        reporter: u || {
          name: report.reporter_name || 'Student',
          email: '',
          phone: '',
        },
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
      { success: false, error: err.message || 'Failed to fetch reports' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connection();
    const body = await request.json();
    const { action, reportId, resolution, adminComment } = body;
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    if (action === 'resolve') {
      if (!reportId || !resolution) {
        return NextResponse.json(
          { success: false, error: 'reportId and resolution are required' },
          { status: 400 },
        );
      }

      const status = resolution === 'Accept' ? 'Resolved' : 'Ignored';
      const now = new Date();

      // Fetch report details
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

      // Update Report Status
      const { error: updateErr } = await supabaseAdmin
        .from('reports')
        .update({
          status,
          admin_comment: adminComment || '',
          resolved_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', reportId);

      if (updateErr) throw updateErr;

      // If accepted, reward student with +1 day subscription bonus
      if (resolution === 'Accept' && reportData.reporter_id) {
        try {
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('subscription')
            .eq('id', reportData.reporter_id)
            .single();

          if (userData) {
            const currentSub = userData.subscription || {};
            const currentExpiry = currentSub.expiry || currentSub.expires_at;
            const baseDate =
              currentExpiry && new Date(currentExpiry) > now
                ? new Date(currentExpiry)
                : now;

            const newExpiry = new Date(baseDate);
            newExpiry.setDate(newExpiry.getDate() + 1);

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
                updated_at: now.toISOString(),
              })
              .eq('id', reportData.reporter_id);

            // Send notification
            await supabaseAdmin.from('notifications').insert({
              user_id: reportData.reporter_id,
              title: 'রিপোর্ট গৃহীত ও রিওয়ার্ড প্রদান! 🎁',
              message:
                'আপনার পাঠানো প্রশ্নের রিপোর্টটি সঠিক হিসেবে গৃহীত হয়েছে। আপনাকে ১ দিনের প্রিমিয়াম সাবস্ক্রিপশন রিওয়ার্ড দেওয়া হয়েছে!',
              type: 'success',
              read: false,
              created_at: now.toISOString(),
            });
          }
        } catch (subErr) {
          console.warn('Failed to extend subscription for report:', subErr);
        }
      }

      return NextResponse.json({ success: true, status });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action specified' },
      { status: 400 },
    );
  } catch (err: any) {
    console.error('Error in /api/admin/reports POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process report' },
      { status: 500 },
    );
  }
}
