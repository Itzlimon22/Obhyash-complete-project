import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const POST = async (req: Request) => {
  const supabase = await createClient();

  // 1.Verify Authentication & Role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure user is an admin
  const { data: profile, error: profileErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileErr || profile?.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { historyId, action } = await req.json(); // action: 'approve' | 'reject'

  if (!historyId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 2. Look up the history record
  const { data: history, error: historyErr } = await supabaseAdmin
    .from('referral_history')
    .select('*, referral:referrals(owner_id)')
    .eq('id', historyId)
    .single();

  if (historyErr || !history) {
    return NextResponse.json(
      { error: 'History record not found' },
      { status: 404 },
    );
  }

  if (history.admin_status !== 'Pending') {
    return NextResponse.json(
      { error: `Record is already ${history.admin_status}` },
      { status: 400 },
    );
  }

  if (action === 'reject') {
    await supabaseAdmin
      .from('referral_history')
      .update({ admin_status: 'Rejected' })
      .eq('id', historyId);

    // Insert notification for the referrer about the rejection
    await supabaseAdmin.from('notifications').insert({
      user_id: (history.referral as any).owner_id,
      title: 'রেফারেল বাতিল!',
      message: 'আপনার একটি রেফারেল অ্যাডমিন কর্তৃক বাতিল করা হয়েছে।',
      type: 'warning',
      is_read: false,
    });

    // Insert notification for the referee about the rejection
    await supabaseAdmin.from('notifications').insert({
      user_id: history.redeemed_by,
      title: 'রেফারেল বাতিল!',
      message:
        'দুঃখিত, আপনার রেফারেল বোনাস রিকোয়েস্টটি অ্যাডমিন কর্তৃক বাতিল করা হয়েছে।',
      type: 'error',
      is_read: false,
    });

    return NextResponse.json({ success: true, message: 'Referral rejected.' });
  }

  // Action is approve
  // Helper: extend subscription by 1 month
  const extendSubscription = async (userId: string) => {
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('subscription')
      .eq('id', userId)
      .single();
    const sub = userProfile?.subscription || {};
    const currentExpiry = sub.expiry ? new Date(sub.expiry) : new Date();
    if (currentExpiry < new Date()) currentExpiry.setTime(new Date().getTime());
    currentExpiry.setMonth(currentExpiry.getMonth() + 1);
    await supabaseAdmin
      .from('users')
      .update({
        subscription: {
          ...sub,
          plan: 'Premium',
          status: 'Active',
          expiry: currentExpiry.toISOString(),
        },
      })
      .eq('id', userId);
  };

  // Extend both users
  await extendSubscription(history.redeemed_by);
  await extendSubscription((history.referral as any).owner_id);

  // Update history status
  await supabaseAdmin
    .from('referral_history')
    .update({ admin_status: 'Approved', reward_given: true })
    .eq('id', historyId);

  // Insert notification for the referrer
  await supabaseAdmin.from('notifications').insert({
    user_id: (history.referral as any).owner_id,
    title: 'রেফারেল সফল!',
    message:
      'আপনার রেফারেল কোড ব্যবহার করে একজন নতুন ইউজার যুক্ত হয়েছে। আপনি ১ মাসের ফ্রি প্রিমিয়াম পেয়েছেন!',
    type: 'success',
    is_read: false,
  });

  // Insert notification for the new user
  await supabaseAdmin.from('notifications').insert({
    user_id: history.redeemed_by,
    title: 'রেফারেল বোনাস!',
    message:
      'রেফারেল কোড ব্যবহারের জন্য আপনার অ্যাকাউন্টে ১ মাসের ফ্রি প্রিমিয়াম যোগ করা হয়েছে।',
    type: 'success',
    is_read: false,
  });

  return NextResponse.json({
    success: true,
    message: 'Referral approved and rewards distributed.',
  });
};
