import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getCanonicalCollegeName } from '@/lib/college-mapping';
import { getRandomAvatar } from '@/lib/avatar-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileData, password } = body;

    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 },
      );
    }

    // 1. Verify Authentication via cookies or Bearer Authorization header
    let user: { id: string; email?: string } | null = null;
    const authHeader = request.headers.get('Authorization');

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

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: authUserData, error: tokenErr } =
        await supabaseAdmin.auth.getUser(token);
      if (!tokenErr && authUserData.user) {
        user = authUserData.user;
      }
    }

    if (!user) {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options),
                );
              } catch {
                // Ignored in route handler
              }
            },
          },
        },
      );

      const {
        data: { user: cookieUser },
      } = await supabase.auth.getUser();
      user = cookieUser;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate essential fields
    const phone = profileData.phone?.trim();
    if (!phone) {
      return NextResponse.json(
        { error: 'মোবাইল নম্বর আবশ্যক।' },
        { status: 400 },
      );
    }

    const name = profileData.name?.trim() || user.email?.split('@')[0] || 'Student';
    const institute = profileData.institute?.trim()
      ? getCanonicalCollegeName(profileData.institute.trim())
      : 'অন্যান্য প্রতিষ্ঠান';
    const stream = profileData.stream?.trim() || 'HSC';
    const division = profileData.group?.trim() || 'Science';
    const batch = profileData.batch?.trim() || 'HSC 2026';
    const examTarget = profileData.examTarget?.trim() || profileData.exam_target?.trim() || 'Engineering';
    const gender = profileData.gender || null;

    // Pick a random avatar from the curated pool
    const avatarUrl = getRandomAvatar(gender, user.id);

    // 3. Upsert into public.users using Service Role
    const { error: upsertError } = await supabaseAdmin.from('users').upsert(
      {
        id: user.id,
        email: user.email,
        name: name,
        phone: phone,
        gender: gender,
        institute: institute,
        stream: stream,
        division: division,
        batch: batch,
        exam_target: examTarget,
        optional_subject: profileData.optional_subject || 'Biology',
        role: 'Student',
        status: 'Active',
        avatar_url: avatarUrl,
        is_subscribed: false,
        subscription_status: 'Inactive',
        subscription_expires_at: null,
        subscription: {
          plan: 'Free',
          expiry: null,
          status: 'Inactive',
        },
        xp: 0,
        level: 'Beginner',
        exams_taken: 0,
        enrolled_exams: 0,
        last_active: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    if (upsertError) {
      console.error('Supabase Admin Upsert Error:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // 4. If an optional password was provided, set it via Supabase Admin
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: password.trim(),
        });
      } catch (pwdErr) {
        console.warn('Could not set initial password:', pwdErr);
      }
    }

    // 5. Handle referral code if provided
    if (profileData.referralCode && typeof profileData.referralCode === 'string') {
      const cleanRef = profileData.referralCode.trim().toUpperCase();
      try {
        await supabaseAdmin.rpc('process_referral_signup', {
          p_new_user_id: user.id,
          p_referral_code: cleanRef,
        });
      } catch (refErr) {
        console.warn('Non-fatal referral processing error:', refErr);
      }
    }

    // 6. Return response and set role cache cookie for fast Next.js navigation
    const res = NextResponse.json({
      success: true,
      message: 'প্রোফাইল সফলভাবে তৈরি হয়েছে!',
    });

    res.cookies.set(
      'obhyash_role_cache',
      JSON.stringify({
        userId: user.id,
        role: 'student',
        status: 'Active',
      }),
      { maxAge: 180, path: '/' },
    );

    return res;
  } catch (error: unknown) {
    console.error('API Error in complete-profile:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 },
    );
  }
}
