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

export const POST = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user already has a code
  const { data: existing } = await supabase
    .from('referrals')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (existing) {
    return NextResponse.json({ referral: existing });
  }

  // Generate a unique code
  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
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
