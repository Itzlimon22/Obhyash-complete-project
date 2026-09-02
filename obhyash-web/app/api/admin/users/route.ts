import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured on server');
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ── Admin Authorization Helper ──
async function verifyAdminCaller(request: NextRequest, supabaseAdmin: any): Promise<boolean> {
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
        return true;
      }
    }
  } catch (_) {}

  // 2. Try Bearer Token
  try {
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
          return true;
        }
      }
    }
  } catch (_) {}

  return false;
}

// ── GET: Fetch Paginated Users with Filters and Global Stats ──
export async function GET(request: NextRequest) {
  try {
    await connection();
    const supabaseAdmin = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = (searchParams.get('search') || '').trim();
    const role = searchParams.get('role') || 'all';
    const status = searchParams.get('status') || 'all';
    const minExams = parseInt(searchParams.get('minExams') || '0', 10);
    const maxExams = parseInt(searchParams.get('maxExams') || '10000', 10);
    const institute = searchParams.get('institute');
    const batch = searchParams.get('batch');
    const subscriptionStatus = searchParams.get('subscriptionStatus') || 'all';

    let query = supabaseAdmin.from('users').select('*', { count: 'exact' });

    // Search filter
    if (search) {
      query = query.or(
        `student_id.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
      );
    }

    // Role filter
    if (role !== 'all') {
      query = query.eq('role', role);
    }

    // Status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Exams taken
    if (minExams > 0) {
      query = query.gte('exams_taken', minExams);
    }
    if (maxExams < 10000) {
      query = query.lte('exams_taken', maxExams);
    }

    // Institute filter
    if (institute) {
      const instList = institute.split(',').filter(Boolean);
      if (instList.length > 0) {
        query = query.in('institute', instList);
      }
    }

    // Batch filter
    if (batch) {
      const batchList = batch.split(',').filter(Boolean);
      if (batchList.length > 0) {
        query = query.in('batch', batchList);
      }
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: rawUsers, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error querying users in admin API:', error);
      throw error;
    }

    // Map to User type
    const now = new Date();
    const mappedUsers = (rawUsers || []).map((u: any) => {
      const rawExp = u.subscription_expires_at || u.subscription?.expiry || u.subscription?.expires_at;
      const expDate = rawExp ? new Date(rawExp) : null;
      const hasValidExpiry = !!expDate && !isNaN(expDate.getTime());
      const isNotExpired = hasValidExpiry && expDate > now;

      const rawStatus = (u.subscription?.status || u.subscription_status || '').toString().toLowerCase();
      const isSubActive = (u.is_subscribed === true || rawStatus === 'active') && isNotExpired;

      const rawPlan = (u.subscription?.plan || u.plan || '').toString().toLowerCase().trim();
      const isFree = !rawPlan || rawPlan === 'free' || rawPlan === 'inactive';

      const computedPlan = isSubActive && !isFree ? (u.subscription?.plan || u.plan || 'Pro') : 'Free';
      const computedStatus = isSubActive && !isFree ? 'Active' : (hasValidExpiry && expDate <= now ? 'Expired' : 'Free');

      return {
        id: u.id,
        student_id: u.student_id,
        name: u.name || '',
        email: u.email || '',
        phone: u.phone,
        role: u.role || 'Student',
        status: u.status || 'Active',
        avatarUrl: u.avatar_url,
        institute: u.institute,
        division: u.division,
        batch: u.batch,
        batch_change_count: u.batch_change_count ?? 0,
        enrolledExams: u.exams_taken || 0,
        lastActive: u.last_active || u.updated_at || u.created_at,
        subscription: {
          plan: computedPlan,
          status: computedStatus,
          expiry: rawExp || '',
        },
        recentExams: [],
        goal: u.goal,
        target: u.target,
        stream: u.stream,
        exam_target: u.exam_target,
        daily_exams_goal: u.daily_exams_goal ?? 3,
        ssc_roll: u.ssc_roll,
        ssc_reg: u.ssc_reg,
        ssc_board: u.ssc_board,
        ssc_passing_year: u.ssc_passing_year,
        optional_subject: u.optional_subject,
        gender: u.gender,
        dob: u.dob,
        address: u.address,
        bio: u.bio,
        streakCount: u.streak || 0,
        level: u.level,
        xp: u.xp || 0,
        monthlyXp: u.monthly_xp || 0,
        avatarColor: u.avatar_color,
      };
    });

    // Post-filter subscription if needed
    let filteredList = mappedUsers;
    if (subscriptionStatus !== 'all') {
      filteredList = mappedUsers.filter((u: any) =>
        subscriptionStatus === 'Expired'
          ? u.subscription?.status !== 'Active'
          : u.subscription?.status === subscriptionStatus,
      );
    }

    // Compute global stats
    let totalCount = count || mappedUsers.length;
    let activeCount = 0;
    let studentsCount = 0;
    let premiumCount = 0;

    try {
      const [totalRes, activeRes, studentsRes, allSubsRes] = await Promise.all([
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'Student'),
        supabaseAdmin.from('users').select('subscription, is_subscribed, subscription_status, subscription_expires_at, plan'),
      ]);

      totalCount = totalRes.count ?? totalCount;
      activeCount = activeRes.count ?? 0;
      studentsCount = studentsRes.count ?? 0;

      if (allSubsRes.data) {
        const checkNow = new Date();
        premiumCount = allSubsRes.data.filter((u: any) => {
          const rawExp = u.subscription_expires_at || u.subscription?.expiry || u.subscription?.expires_at;
          const exp = rawExp ? new Date(rawExp) : null;
          if (!exp || isNaN(exp.getTime()) || exp <= checkNow) return false;

          const rawStatus = (u.subscription?.status || u.subscription_status || '').toString().toLowerCase();
          const isSub = u.is_subscribed === true || rawStatus === 'active';
          if (!isSub) return false;

          const plan = (u.subscription?.plan || u.plan || '').toString().toLowerCase().trim();
          if (!plan || plan === 'free' || plan === 'inactive') return false;

          return true;
        }).length;
      }
    } catch (statsErr) {
      console.warn('Failed to calculate exact global user stats:', statsErr);
    }

    const totalUsers = count ?? totalCount;
    const totalPages = Math.ceil(totalUsers / pageSize) || 1;

    return NextResponse.json({
      success: true,
      users: filteredList,
      totalUsers,
      totalPages,
      page,
      pageSize,
      stats: {
        total: totalCount,
        active: activeCount,
        students: studentsCount,
        premium: premiumCount,
      },
    });
  } catch (err: any) {
    console.error('Failed to get admin users:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

// ── PATCH: Update User(s) Status, Role, Subscription ──
export async function PATCH(request: NextRequest) {
  try {
    await connection();
    const supabaseAdmin = getSupabaseAdmin();

    const body = await request.json();
    const { action, userId, userIds, status, role, plan, expiry } = body;

    if (action === 'update_status') {
      if (!userId || !status) {
        return NextResponse.json({ success: false, error: 'Missing userId or status' }, { status: 400 });
      }
      const { error } = await supabaseAdmin.from('users').update({ status }).eq('id', userId);
      if (error) throw error;
      return NextResponse.json({ success: true, message: `Status updated to ${status}` });
    }

    if (action === 'update_role') {
      if (!userId || !role) {
        return NextResponse.json({ success: false, error: 'Missing userId or role' }, { status: 400 });
      }
      const { error } = await supabaseAdmin.from('users').update({ role }).eq('id', userId);
      if (error) throw error;
      return NextResponse.json({ success: true, message: `Role updated to ${role}` });
    }

    if (action === 'update_subscription') {
      if (!userId || !plan) {
        return NextResponse.json({ success: false, error: 'Missing userId or plan' }, { status: 400 });
      }
      const expiryIso = expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabaseAdmin.from('users').update({
        subscription: { plan, status: 'Active', expiry: expiryIso },
        is_subscribed: true,
        subscription_status: 'active',
        subscription_expires_at: expiryIso,
        plan,
      }).eq('id', userId);
      if (error) throw error;
      return NextResponse.json({ success: true, message: `Subscription updated to ${plan}` });
    }

    if (action === 'bulk_status') {
      if (!Array.isArray(userIds) || userIds.length === 0 || !status) {
        return NextResponse.json({ success: false, error: 'Missing userIds or status' }, { status: 400 });
      }
      const { error } = await supabaseAdmin.from('users').update({ status }).in('id', userIds);
      if (error) throw error;
      return NextResponse.json({ success: true, message: `${userIds.length} users updated to ${status}` });
    }

    if (action === 'bulk_role') {
      if (!Array.isArray(userIds) || userIds.length === 0 || !role) {
        return NextResponse.json({ success: false, error: 'Missing userIds or role' }, { status: 400 });
      }
      const { error } = await supabaseAdmin.from('users').update({ role }).in('id', userIds);
      if (error) throw error;
      return NextResponse.json({ success: true, message: `${userIds.length} users role updated to ${role}` });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Failed to patch user(s):', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE: Delete User(s) ──
export async function DELETE(request: NextRequest) {
  try {
    await connection();
    const supabaseAdmin = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userIdsParam = searchParams.get('userIds');

    const idsToDelete: string[] = [];
    if (userId) idsToDelete.push(userId);
    if (userIdsParam) {
      idsToDelete.push(...userIdsParam.split(',').filter(Boolean));
    }

    if (idsToDelete.length === 0) {
      // Check body
      try {
        const body = await request.json();
        if (body.userId) idsToDelete.push(body.userId);
        if (Array.isArray(body.userIds)) idsToDelete.push(...body.userIds);
      } catch (_) {}
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ success: false, error: 'No user ID provided for deletion' }, { status: 400 });
    }

    // Delete from users table
    const { error } = await supabaseAdmin.from('users').delete().in('id', idsToDelete);
    if (error) throw error;

    // Best-effort delete from Supabase auth
    for (const id of idsToDelete) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(id);
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${idsToDelete.length} user(s)`,
    });
  } catch (err: any) {
    console.error('Failed to delete user(s):', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
