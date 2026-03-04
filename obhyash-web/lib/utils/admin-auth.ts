import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

type AdminCheckResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Verifies the caller is authenticated AND has role === 'Admin'.
 * Usage:
 *   const check = await requireAdmin();
 *   if (!check.ok) return check.response;
 */
export async function requireAdmin(): Promise<AdminCheckResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (profile.role !== 'Admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id };
}
