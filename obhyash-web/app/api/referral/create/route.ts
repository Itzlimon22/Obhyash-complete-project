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

  if (customCode) {
    // Verify admin status
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Only admins can create custom referral codes' },
        { status: 403 },
      );
    }

    // Check if custom code already exists
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

  // Check if user already has a code
  const { data: existing } = await supabase
    .from('referrals')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (existing) {
    if (customCode) {
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
