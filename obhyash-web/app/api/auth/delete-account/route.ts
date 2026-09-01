import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    // 1. Identify and verify authenticated user from request session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'অননুমোদিত অনুরোধ। অনুগ্রহ করে পুনরায় লগইন করুন।' },
        { status: 401 },
      );
    }

    const userId = user.id;

    // 2. Initialize Service Role Supabase Client for admin-level purge
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // 3. Safety Check: Protect Admin and Teacher accounts from self-deletion
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('role, status, student_id')
      .eq('id', userId)
      .maybeSingle();

    if (userProfile?.role === 'Admin' || userProfile?.role === 'Teacher') {
      return NextResponse.json(
        { error: 'অ্যাডমিন বা শিক্ষক অ্যাকাউন্ট মুছে ফেলা সম্ভব নয়।' },
        { status: 403 },
      );
    }

    // 4. Try executing database RPC delete_user_account first
    let rpcSucceeded = false;
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc(
        'delete_user_account',
        { p_reason: 'User requested deletion from web API' },
      );
      if (!rpcErr && rpcRes?.success) {
        rpcSucceeded = true;
      }
    } catch {
      // Fall through to manual service-role cascade deletion
    }

    // 5. Fallback manual cascade purge if RPC didn't run
    if (!rpcSucceeded) {
      const tablesToClean = [
        'user_answers',
        'exam_results',
        'live_exam_attempts',
        'bookmarks',
        'notes',
        'scratch_cards',
        'user_badges',
        'daily_quests_state',
        'device_sessions',
        'push_subscriptions',
        'activity_logs',
        'complaints',
        'feature_requests',
        'blog_bookmarks',
        'blog_likes',
        'blog_comments',
      ];

      for (const table of tablesToClean) {
        try {
          await supabaseAdmin.from(table).delete().eq('user_id', userId);
        } catch {
          // ignore table if it doesn't exist
        }
      }

      // Log to audit table if available
      try {
        await supabaseAdmin.from('deleted_accounts_audit').insert({
          user_id: userId,
          student_id: userProfile?.student_id || null,
          reason: 'User requested deletion from web API (fallback)',
          deleted_at: new Date().toISOString(),
        });
      } catch {
        // ignore if audit table not present
      }

      // Delete from public.users table
      try {
        await supabaseAdmin.from('users').delete().eq('id', userId);
      } catch {
        // ignore
      }

      // Delete from auth.users via Supabase Admin Auth API
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch {
        // ignore
      }
    }

    // 6. Wipe all auth and session cookies from response
    const response = NextResponse.json({
      success: true,
      message: 'Account successfully and permanently deleted',
    });

    const allCookies = cookieStore.getAll();
    allCookies.forEach((c) => {
      if (
        c.name.startsWith('sb-') ||
        c.name.startsWith('sb:') ||
        c.name.includes('supabase') ||
        c.name.includes('auth') ||
        c.name.startsWith('obhyash')
      ) {
        response.cookies.delete(c.name);
        response.cookies.set(c.name, '', {
          path: '/',
          maxAge: 0,
          expires: new Date(0),
        });
      }
    });

    response.cookies.delete('obhyash_role_cache');
    response.cookies.set('obhyash_role_cache', '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    response.cookies.delete('obhyash_user_profile');
    response.cookies.set('obhyash_user_profile', '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error: any) {
    console.error('Delete account API error:', error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          'অ্যাকাউন্ট মুছতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      },
      { status: 500 },
    );
  }
}
