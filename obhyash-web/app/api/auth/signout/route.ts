import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();
    
    // Server-side auth signout
    await supabase.auth.signOut().catch(() => {});

    const response = NextResponse.json({ success: true, message: 'Signed out successfully' });

    // Explicitly delete all Supabase and Obhyash session cookies
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
    response.cookies.set('obhyash_role_cache', '', { path: '/', maxAge: 0, expires: new Date(0) });
    response.cookies.delete('obhyash_user_profile');
    response.cookies.set('obhyash_user_profile', '', { path: '/', maxAge: 0, expires: new Date(0) });

    return response;
  } catch (error) {
    console.error('Error during signout:', error);
    const response = NextResponse.json({ success: true, message: 'Signed out with fallback' });
    response.cookies.delete('obhyash_role_cache');
    response.cookies.set('obhyash_role_cache', '', { path: '/', maxAge: 0, expires: new Date(0) });
    return response;
  }
}

export async function GET(request: Request) {
  // Support GET request for direct browser navigation logout
  const { origin } = new URL(request.url);
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();
    await supabase.auth.signOut().catch(() => {});

    const response = NextResponse.redirect(new URL('/login?logout=true', origin));
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
    return response;
  } catch {
    return NextResponse.redirect(new URL('/login?logout=true', origin));
  }
}
