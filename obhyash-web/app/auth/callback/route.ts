import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const AUTH_TIMEOUT_MS = 20000;

async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMessage: string,
  timeoutMs = AUTH_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam =
    searchParams.get('next') ||
    searchParams.get('redirect_to') ||
    searchParams.get('redirect_uri') ||
    '';

  const isMobileApp =
    nextParam.startsWith('io.supabase.obhyash') ||
    nextParam.startsWith('obhyash://') ||
    nextParam.startsWith('com.example.obhyash_app') ||
    searchParams.get('source') === 'app' ||
    searchParams.get('client') === 'mobile';

  const getMobileRedirectUrl = (params: Record<string, string> = {}) => {
    const base =
      nextParam.startsWith('io.supabase.obhyash') || nextParam.startsWith('obhyash://')
        ? nextParam
        : 'io.supabase.obhyash://login-callback/';
    const url = new URL(base);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  };

  if (code) {
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
              // Ignored if called from Server Component
            }
          },
        },
      },
    );

    const { error } = await withTimeout(
      supabase.auth.exchangeCodeForSession(code),
      'Auth callback exchange timed out',
    );

    if (!error) {
      const {
        data: { user },
      } = await withTimeout(
        supabase.auth.getUser(),
        'Auth user fetch timed out',
      );

      let redirectPath = nextParam || '/dashboard';

      if (user) {
        // Verify if user is registered in public.users
        let isRegistered = false;
        try {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('check_user_registered', {
            p_user_id: user.id,
            p_email: user.email || null,
          });
          if (!rpcErr && typeof rpcRes === 'boolean') {
            isRegistered = rpcRes;
          } else {
            const { data: directProfile } = await supabase
              .from('users')
              .select('id, role')
              .or(`id.eq.${user.id},email.ilike.${user.email || ''}`)
              .maybeSingle();
            isRegistered = !!directProfile;
          }
        } catch {
          const { data: directProfile } = await supabase
            .from('users')
            .select('id, role')
            .or(`id.eq.${user.id},email.ilike.${user.email || ''}`)
            .maybeSingle();
          isRegistered = !!directProfile;
        }

        // Deny Google login if user has no profile (not registered)
        if (!isRegistered) {
          await supabase.auth.signOut();

          // If request was initiated from Flutter mobile app, redirect back to mobile app
          if (isMobileApp) {
            return NextResponse.redirect(
              getMobileRedirectUrl({
                error: 'unregistered_google',
                error_description: 'এই গুগল ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। দয়া করে আগে নতুন অ্যাকাউন্ট খুলুন।',
              }),
            );
          }

          const redirectUrl = new URL('/login', origin);
          redirectUrl.searchParams.set('error', 'unregistered_google');
          const res = NextResponse.redirect(redirectUrl);

          // Clear auth cookies on redirect response
          cookieStore.getAll().forEach((c) => {
            if (c.name.startsWith('sb-') || c.name.startsWith('sb:') || c.name.startsWith('obhyash_')) {
              res.cookies.delete(c.name);
            }
          });
          res.cookies.delete('obhyash_role_cache');
          res.cookies.delete('obhyash_user_profile');
          return res;
        }

        // If registered from mobile app, redirect back to app
        if (isMobileApp) {
          return NextResponse.redirect(getMobileRedirectUrl({ code }));
        }

        // If registered, sync Google OAuth user if needed
        if (user.email) {
          try {
            await supabase.rpc('sync_google_login_user', {
              p_auth_id: user.id,
              p_email: user.email,
            });
          } catch {
            // non-fatal
          }
        }

        const { data: profile } = await withTimeout(
          supabase
            .from('users')
            .select('role')
            .or(`id.eq.${user.id},email.ilike.${user.email || ''}`)
            .maybeSingle(),
          'Auth profile lookup timed out',
        );

        const role = profile?.role?.toLowerCase() || 'student';
        if (role === 'admin') redirectPath = '/admin/dashboard';
        else if (role === 'teacher') redirectPath = '/teacher/dashboard';
        else redirectPath = '/dashboard';
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`);
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
    }
  }

  // Return user to login page with error
  if (isMobileApp) {
    return NextResponse.redirect(getMobileRedirectUrl({ error: 'oauth_cancelled' }));
  }

  const redirectUrl = new URL('/login', origin);
  redirectUrl.searchParams.set('error', 'oauth_cancelled');
  return NextResponse.redirect(redirectUrl);
}
