import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Service role key not configured on server' },
        { status: 500 },
      );
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ── Security Check: Verify Caller is Admin ──
    let isAdmin = false;

    // 1. Try Cookie Session
    try {
      const serverSupabase = await (await import('@/utils/supabase/server')).createClient();
      const { data: sessionUser } = await serverSupabase.auth.getUser();
      if (sessionUser?.user) {
        const { data: userRow } = await supabaseAdmin
          .from('users')
          .select('role, email')
          .eq('id', sessionUser.user.id)
          .single();

        const role = (userRow?.role || '').toLowerCase();
        const email = (userRow?.email || sessionUser.user.email || '').toLowerCase();
        if (
          role === 'admin' ||
          role === 'super admin' ||
          role === 'superadmin' ||
          role === 'moderator' ||
          email === 'admin@obhyash.com' ||
          sessionUser.user.user_metadata?.role === 'Admin' ||
          sessionUser.user.user_metadata?.role === 'admin'
        ) {
          isAdmin = true;
        }
      }
    } catch (_) {}

    // 2. Fallback to Bearer Token
    if (!isAdmin) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user) {
          const { data: userRow } = await supabaseAdmin
            .from('users')
            .select('role, email')
            .eq('id', authData.user.id)
            .single();

          const role = (userRow?.role || '').toLowerCase();
          const email = (userRow?.email || authData.user.email || '').toLowerCase();
          if (
            role === 'admin' ||
            role === 'super admin' ||
            role === 'superadmin' ||
            role === 'moderator' ||
            email === 'admin@obhyash.com' ||
            authData.user.user_metadata?.role === 'Admin' ||
            authData.user.user_metadata?.role === 'admin'
          ) {
            isAdmin = true;
          }
        }
      }
    }

    // 3. Dev Fallback
    if (!isAdmin && process.env.NODE_ENV === 'development') {
      isAdmin = true;
    }

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId')?.trim();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 },
      );
    }

    // ── Fetch Full User Data with isolated fallbacks ──
    const userPromise = Promise.resolve(
      supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
    )
      .then((res) => res.data)
      .catch(() => null);

    const examsPromise = Promise.resolve(
      supabaseAdmin
        .from('exam_results')
        .select('id, subject, exam_type, score, total_marks, total_questions, correct_count, wrong_count, date, time_taken, created_at, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
    )
      .then((res) => res.data || [])
      .catch(() => []);

    const paymentsPromise = Promise.resolve(
      supabaseAdmin
        .from('payment_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
    )
      .then((res) => res.data || [])
      .catch(() => []);

    const devicesPromise = Promise.resolve(
      supabaseAdmin
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active', { ascending: false })
        .limit(10)
    )
      .then((res) => res.data || [])
      .catch(() => []);

    const notesPromise = Promise.resolve(
      supabaseAdmin
        .from('user_activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)
    )
      .then((res) => res.data || [])
      .catch(() => []);

    const [userData, rawExams, rawPayments, rawDevices, rawNotes] = await Promise.all([
      userPromise,
      examsPromise,
      paymentsPromise,
      devicesPromise,
      notesPromise,
    ]);

    // Map payments safely
    const payments = rawPayments.map((p: any) => ({
      id: p.id,
      plan_name: p.plan_name || 'Premium Plan',
      amount: Number(p.amount || 0),
      payment_method: p.payment_method || 'bKash',
      trx_id: p.transaction_id || p.trx_id || 'N/A',
      sender_number: p.sender_number || '',
      status: p.status || 'Pending',
      requested_at: p.requested_at || p.created_at || new Date().toISOString(),
    }));

    // Map exams safely
    const exams = rawExams.map((e: any) => ({
      id: e.id,
      subject: e.subject || 'Practice Exam',
      score: Number(e.score || 0),
      total_marks: Number(e.total_marks || 0),
      correct_count: Number(e.correct_count || 0),
      wrong_count: Number(e.wrong_count || 0),
      date: e.date || e.created_at || new Date().toISOString(),
      time_taken: Number(e.time_taken || 0),
    }));

    // Map devices safely
    const devices = rawDevices.map((d: any) => ({
      id: d.id,
      device_name: d.device_name || 'Active Session',
      device_type: d.device_type || 'web',
      ip_address: d.ip_address || 'Hidden',
      last_active: d.last_active || d.created_at || new Date().toISOString(),
    }));

    // Filter notes to relevant admin notes / support logs
    const notes = rawNotes
      .filter((n: any) => {
        const type = (n.activity_type || n.action_type || '').toUpperCase();
        return type.includes('NOTE') || type.includes('ADMIN') || type.includes('SUPPORT');
      })
      .map((n: any) => ({
        id: n.id,
        description: n.description || n.details || '',
        created_at: n.created_at || new Date().toISOString(),
        metadata: n.metadata || {},
      }));

    // Normalize user subscription status based on actual expiration
    let normalizedUser = userData;
    if (userData) {
      const now = new Date();
      const rawExp = userData.subscription_expires_at || userData.subscription?.expiry || userData.subscription?.expires_at;
      const expDate = rawExp ? new Date(rawExp) : null;
      const hasValidExpiry = !!expDate && !isNaN(expDate.getTime());
      const isNotExpired = hasValidExpiry && expDate > now;

      const rawStatus = (userData.subscription?.status || userData.subscription_status || '').toString().toLowerCase();
      const isSubActive = (userData.is_subscribed === true || rawStatus === 'active') && isNotExpired;

      const rawPlan = (userData.subscription?.plan || userData.plan || '').toString().toLowerCase().trim();
      const isFree = !rawPlan || rawPlan === 'free' || rawPlan === 'inactive';

      const computedPlan = isSubActive && !isFree ? (userData.subscription?.plan || userData.plan || 'Pro') : 'Free';
      const computedStatus = isSubActive && !isFree ? 'Active' : (hasValidExpiry && expDate <= now ? 'Expired' : 'Free');

      normalizedUser = {
        ...userData,
        subscription: {
          ...(typeof userData.subscription === 'object' ? userData.subscription : {}),
          plan: computedPlan,
          status: computedStatus,
          expiry: rawExp || '',
        },
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        user: normalizedUser || null,
        exams,
        payments,
        devices,
        notes,
      },
    });
  } catch (err: any) {
    console.error('Error fetching admin user details:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
