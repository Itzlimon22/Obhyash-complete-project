import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileData } = body;

    // 1. Verify Authentication
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Use Service Role to Upsert Profile (Bypassing RLS)
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

    const { error: upsertError } = await supabaseAdmin.from('users').upsert(
      {
        id: user.id,
        email: user.email,
        name: profileData.name,
        phone: profileData.phone,
        gender: profileData.gender || null,
        institute: profileData.institute,
        stream: profileData.stream,
        division: profileData.group,
        batch: profileData.batch,
        role: 'Student',
        status: 'Active',
        subscription: {
          plan: 'Free',
          expiry: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          status: 'Active',
        },
        xp: 0,
        level: 'Beginner',
        examsTaken: 0,
        enrolledExams: 0,
        lastActive: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    if (upsertError) {
      console.error('Supabase Admin Upsert Error:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
