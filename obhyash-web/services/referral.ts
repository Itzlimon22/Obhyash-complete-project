import { supabase } from '@/services/database';
import { v4 as uuidv4 } from 'uuid';

/** Generate a short alphanumeric code */
function generateReferralCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/** Create a referral entry for the current user */
export async function createReferral(ownerId: string) {
  const code = generateReferralCode();
  const { data, error } = await supabase
    .from('referrals')
    .insert({
      id: uuidv4(),
      owner_id: ownerId,
      code,
      created_at: new Date().toISOString(),
    })
    .single();
  if (error) throw error;
  return data;
}

/** Redeem a referral code */
export async function redeemReferral(code: string, redeemerId: string) {
  // Fetch referral
  const { data: referral, error: fetchErr } = await supabase
    .from('referrals')
    .select('*')
    .eq('code', code)
    .single();
  if (fetchErr) throw fetchErr;
  if (!referral) throw new Error('Invalid referral code');
  if (referral.owner_id === redeemerId)
    throw new Error('Cannot use own referral code');

  // Check if already redeemed
  const { data: existing, error: histErr } = await supabase
    .from('referral_history')
    .select('*')
    .eq('referral_id', referral.id)
    .eq('redeemed_by', redeemerId)
    .single();
  if (histErr && histErr.code !== 'PGRST116') throw histErr; // ignore not found
  if (existing) throw new Error('Referral code already used by this user');

  // Transaction: extend subscriptions and insert history
  const { error: txnError } = await supabase.rpc('redeem_referral', {
    p_referral_id: referral.id,
    p_redeemer_id: redeemerId,
  });
  if (txnError) throw txnError;
  return { referral, message: 'Referral redeemed successfully' };
}

/** Get current user's referral info and history */
export async function getMyReferralInfo(userId: string) {
  const { data: referral, error: refErr } = await supabase
    .from('referrals')
    .select('*')
    .eq('owner_id', userId)
    .single();
  if (refErr && refErr.code !== 'PGRST116') throw refErr;

  const { data: history, error: histErr } = await supabase
    .from('referral_history')
    .select('id, redeemed_at, redeemed_by:user_id(email, name)')
    .eq('referral_id', referral?.id || '');
  if (histErr) throw histErr;

  return { referral, history };
}
