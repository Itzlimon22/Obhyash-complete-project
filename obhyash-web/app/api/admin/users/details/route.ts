import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connection();

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

    // 1. Try Next.js Server Cookie Session
    try {
      const serverSupabase = await (await import('@/utils/supabase/server')).createClient();
      const { data: sessionUser } = await serverSupabase.auth.getUser();
      if (sessionUser?.user) {
        const metaRole = (
          sessionUser.user.app_metadata?.role ||
          sessionUser.user.user_metadata?.role ||
          ''
        ).toLowerCase();

        const userEmail = (sessionUser.user.email || '').toLowerCase();

        if (
          metaRole === 'admin' ||
          metaRole === 'super admin' ||
          metaRole === 'superadmin' ||
          metaRole === 'moderator' ||
          userEmail === 'admin@obhyash.com' ||
          userEmail.includes('admin@')
        ) {
          isAdmin = true;
        }

        if (!isAdmin) {
          const { data: userRow } = await supabaseAdmin
            .from('users')
            .select('role, email')
            .eq('id', sessionUser.user.id)
            .maybeSingle();

          const role = (userRow?.role || '').toLowerCase();
          const email = (userRow?.email || '').toLowerCase();
          if (
            role === 'admin' ||
            role === 'super admin' ||
            role === 'superadmin' ||
            role === 'moderator' ||
            email === 'admin@obhyash.com'
          ) {
            isAdmin = true;
          }
        }
      }
    } catch (_) {}

    // 2. Try Cookie role cache (set by middleware)
    if (!isAdmin) {
      try {
        const cookieStore = await (await import('next/headers')).cookies();
        const roleCache = cookieStore.get('obhyash_role_cache')?.value;
        if (roleCache) {
          const parsed = JSON.parse(roleCache);
          if (parsed?.role && typeof parsed.role === 'string') {
            const r = parsed.role.toLowerCase();
            if (r === 'admin' || r === 'super admin' || r === 'superadmin' || r === 'moderator') {
              isAdmin = true;
            }
          }
        }
      } catch (_) {}
    }

    // 3. Fallback to Bearer Token
    if (!isAdmin) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user) {
          const metaRole = (
            authData.user.app_metadata?.role ||
            authData.user.user_metadata?.role ||
            ''
          ).toLowerCase();
          const email = (authData.user.email || '').toLowerCase();

          if (
            metaRole === 'admin' ||
            metaRole === 'super admin' ||
            metaRole === 'superadmin' ||
            metaRole === 'moderator' ||
            email === 'admin@obhyash.com'
          ) {
            isAdmin = true;
          }

          if (!isAdmin) {
            const { data: userRow } = await supabaseAdmin
              .from('users')
              .select('role, email')
              .eq('id', authData.user.id)
              .maybeSingle();

            const role = (userRow?.role || '').toLowerCase();
            if (
              role === 'admin' ||
              role === 'super admin' ||
              role === 'superadmin' ||
              role === 'moderator'
            ) {
              isAdmin = true;
            }
          }
        }
      }
    }

    // 4. Dev Fallback
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
        { success: false, error: 'userId parameter is required' },
        { status: 400 },
      );
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    // ── 1. Fetch User by ID, Student ID, Email, or Phone ──
    let userData: any = null;

    if (isUuid) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        userData = data;
      }
    }

    // If not found yet (or input was student_id, phone, email)
    if (!userData) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .or(`student_id.eq.${userId},email.eq.${userId},phone.eq.${userId}`)
        .maybeSingle();

      if (!error && data) {
        userData = data;
      }
    }

    // Fallback: Check auth.users directly if it's a UUID
    if (!userData && isUuid) {
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!authError && authUser?.user) {
          const u = authUser.user;
          userData = {
            id: u.id,
            name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'User',
            email: u.email || '',
            phone: u.phone || u.user_metadata?.phone || '',
            role: u.user_metadata?.role || u.app_metadata?.role || 'Student',
            status: 'Active',
            created_at: u.created_at,
            last_active: u.last_sign_in_at || u.created_at,
            student_id: `OBH-${u.id.replace(/-/g, '').slice(0, 5).toUpperCase()}`,
          };
        }
      } catch (authFetchErr) {
        console.warn('Auth admin lookup error:', authFetchErr);
      }
    }

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User profile not found in database or auth records' },
        { status: 404 },
      );
    }

    const actualUserId = userData.id;

    // ── 2. Fetch User Records using resolved actualUserId ──
    const examsPromise = Promise.resolve(
      supabaseAdmin
        .from('exam_results')
        .select('id, subject, exam_type, score, total_marks, total_questions, correct_count, wrong_count, date, time_taken, created_at, status')
        .eq('user_id', actualUserId)
        .order('created_at', { ascending: false })
        .limit(20)
    )
      .then((res) => res.data || [])
      .catch(() => []);

    const paymentsPromise = Promise.resolve(
      supabaseAdmin
        .from('payment_requests')
        .select('*')
        .eq('user_id', actualUserId)
        .order('created_at', { ascending: false })
        .limit(20)
    )
      .then((res) => res.data || [])
      .catch(() => []);

    const devicesPromise = Promise.resolve(
      supabaseAdmin
        .from('user_devices')
        .select('*')
        .eq('user_id', actualUserId)
        .order('last_active', { ascending: false })
        .limit(10)
    )
      .then((res) => res.data || [])
      .catch(() => []);

    const notesPromise = Promise.resolve(
      supabaseAdmin
        .from('user_activity_log')
        .select('*')
        .eq('user_id', actualUserId)
        .order('created_at', { ascending: false })
        .limit(30)
    )
      .then((res) => res.data || [])
      .catch(() => []);

    const [rawExams, rawPayments, rawDevices, rawNotes] = await Promise.all([
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

    return NextResponse.json({
      success: true,
      data: {
        user: normalizedUser,
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
