import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function generateCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const POST = async (req: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let customCode = null;
  try {
    const body = await req.json();
    customCode = body?.customCode?.trim().toUpperCase();
  } catch (e) {
    // Ignore cases where body is empty
  }

  // Fetch user profile to check admin status
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'Admin';

  // Check if user already has a code
  const { data: existing } = await supabase
    .from('referrals')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (existing) {
    if (customCode && customCode !== existing.code) {
      if (!isAdmin) {
        return NextResponse.json(
          {
            error:
              'You have already set your referral code and cannot change it.',
          },
          { status: 403 },
        );
      }
      // Update existing code to custom code
      const { data: updated, error: updateErr } = await supabase
        .from('referrals')
        .update({ code: customCode })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateErr)
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      return NextResponse.json({ referral: updated });
    }
    return NextResponse.json({ referral: existing });
  }

  // If no code exists, verify custom code uniqueness if provided
  if (customCode) {
    const { data: conflict } = await supabase
      .from('referrals')
      .select('id')
      .eq('code', customCode)
      .single();

    if (conflict) {
      return NextResponse.json(
        { error: 'This custom code is already taken' },
        { status: 400 },
      );
    }
  }

  // Generate a unique code if custom is not provided
  let code = customCode || generateCode();
  let attempts = 0;
  while (!customCode && attempts < 5) {
    const { data: conflict } = await supabase
      .from('referrals')
      .select('id')
      .eq('code', code)
      .single();
    if (!conflict) break;
    code = generateCode();
    attempts++;
  }

  const { data: referral, error } = await supabase
    .from('referrals')
    .insert({ owner_id: user.id, code, created_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ referral });
};
