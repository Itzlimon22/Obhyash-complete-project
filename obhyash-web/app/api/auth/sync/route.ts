import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const next = searchParams.get('next') || '/';

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  const supabase = await createClient();

  // setSession automatically updates the server cookies
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.error('API /auth/sync error setting session:', error);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
