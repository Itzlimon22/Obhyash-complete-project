import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 1. Fetch All Referrals (Master list of referral codes)
    const { data: allReferrals, error: refErr } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false });

    const referralList = allReferrals || [];

    // 2. Fetch All Referral History (Redemptions)
    const { data: allHistory, error: historyErr } = await supabaseAdmin
      .from('referral_history')
      .select('*')
      .order('redeemed_at', { ascending: false });

    const historyItems = allHistory || [];

    // 3. Collect all user IDs (owners + redeemers)
    const allUserIds = new Set<string>();
    referralList.forEach((r) => {
      if (r.owner_id) allUserIds.add(r.owner_id);
    });
    historyItems.forEach((h) => {
      if (h.redeemed_by) allUserIds.add(h.redeemed_by);
    });

    const userMap: Record<
      string,
      { id: string; name: string; email: string; phone?: string; role?: string }
    > = {};

    if (allUserIds.size > 0) {
      try {
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, name, email, phone, role')
          .in('id', Array.from(allUserIds));

        if (users) {
          users.forEach((u) => {
            userMap[u.id] = {
              id: u.id,
              name: u.name || 'User',
              email: u.email || '',
              phone: u.phone || '',
              role: u.role || 'Student',
            };
          });
        }
      } catch (e) {
        console.warn('Error fetching users for referrals:', e);
      }
    }

    const referralMap: Record<string, any> = {};
    referralList.forEach((r) => {
      referralMap[r.id] = r;
    });

    // 4. Build Aggregated User Referral Master List
    // Group redemptions by referral_id
    const redemptionsByRefId: Record<string, any[]> = {};
    let pendingApprovalsCount = 0;
    let approvedRewardsCount = 0;

    historyItems.forEach((h) => {
      if (!redemptionsByRefId[h.referral_id]) {
        redemptionsByRefId[h.referral_id] = [];
      }
      const redeemerUser = userMap[h.redeemed_by] || {
        id: h.redeemed_by,
        name: 'শিক্ষার্থী',
        email: '',
      };

      const redemptionRecord = {
        id: h.id,
        redeemed_at: h.redeemed_at || h.created_at,
        admin_status: h.admin_status || 'Pending',
        reward_given: h.reward_given ?? false,
        student: redeemerUser,
      };

      redemptionsByRefId[h.referral_id].push(redemptionRecord);

      if (h.admin_status === 'Pending' || !h.admin_status) pendingApprovalsCount++;
      if (h.admin_status === 'Approved') approvedRewardsCount++;
    });

    const userReferrals = referralList.map((ref) => {
      const owner = userMap[ref.owner_id] || {
        id: ref.owner_id,
        name: 'অজানা ব্যবহারকারী',
        email: '',
      };
      const referees = redemptionsByRefId[ref.id] || [];
      const totalUses = referees.length;
      const approvedUses = referees.filter((r) => r.admin_status === 'Approved').length;
      const pendingUses = referees.filter((r) => r.admin_status === 'Pending' || !r.admin_status).length;
      const rejectedUses = referees.filter((r) => r.admin_status === 'Rejected').length;
      const isBlocked = ref.expires_at ? new Date(ref.expires_at) < new Date() : false;

      return {
        id: ref.id,
        code: ref.code,
        created_at: ref.created_at,
        expires_at: ref.expires_at,
        isBlocked,
        owner,
        totalUses,
        approvedUses,
        pendingUses,
        rejectedUses,
        referees,
      };
    });

    // 5. Build Enriched History Flat List
    const enrichedHistory = historyItems.map((h) => {
      const ref = referralMap[h.referral_id];
      const owner = ref?.owner_id ? userMap[ref.owner_id] : null;
      const redeemer = h.redeemed_by ? userMap[h.redeemed_by] : null;

      return {
        id: h.id,
        redeemed_at: h.redeemed_at || h.created_at,
        reward_given: h.reward_given ?? false,
        admin_status: h.admin_status || 'Pending',
        reward_claimed: h.reward_claimed ?? false,
        reward_paid_at: h.reward_paid_at,
        reward_transaction_id: h.reward_transaction_id,
        redeemed_by_user: redeemer || {
          id: h.redeemed_by || '',
          name: 'ব্যবহারকারী',
          email: '',
        },
        referral: {
          id: h.referral_id || '',
          code: ref?.code || 'N/A',
          owner: owner || {
            id: ref?.owner_id || '',
            name: 'ব্যবহারকারী',
            email: '',
          },
        },
      };
    });

    // 6. Search Filter
    let filteredUserReferrals = userReferrals;
    let filteredHistory = enrichedHistory;

    if (search) {
      filteredUserReferrals = userReferrals.filter(
        (u) =>
          u.code.toLowerCase().includes(search) ||
          u.owner.name.toLowerCase().includes(search) ||
          u.owner.email.toLowerCase().includes(search) ||
          u.referees.some(
            (r: any) =>
              r.student?.name?.toLowerCase().includes(search) ||
              r.student?.email?.toLowerCase().includes(search),
          ),
      );

      filteredHistory = enrichedHistory.filter(
        (h) =>
          h.referral?.code?.toLowerCase().includes(search) ||
          h.referral?.owner?.name?.toLowerCase().includes(search) ||
          h.referral?.owner?.email?.toLowerCase().includes(search) ||
          h.redeemed_by_user?.name?.toLowerCase().includes(search) ||
          h.redeemed_by_user?.email?.toLowerCase().includes(search),
      );
    }

    const paginatedHistory = filteredHistory.slice(from, to + 1);

    return NextResponse.json({
      success: true,
      userReferrals: filteredUserReferrals,
      history: paginatedHistory,
      totalCount: filteredHistory.length,
      stats: {
        totalCodes: referralList.length,
        totalRedemptions: historyItems.length,
        uniqueReferrers: userReferrals.filter((u) => u.totalUses > 0).length,
        pendingApprovals: pendingApprovalsCount,
        approvedRewards: approvedRewardsCount,
      },
    });
  } catch (error: any) {
    console.error('Admin referrals API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', data: [], totalCount: 0 },
      { status: 500 },
    );
  }
}

// Update or Create referral code
export async function PATCH(request: NextRequest) {
  try {
    await connection();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { action, referralId, userId, newCode } = body;

    if (action === 'update_code') {
      if (!referralId || !newCode) {
        return NextResponse.json({ error: 'Referral ID and new code required' }, { status: 400 });
      }

      const cleanCode = newCode.trim().toUpperCase();

      // Check if code already taken by someone else
      const { data: existing } = await supabaseAdmin
        .from('referrals')
        .select('id')
        .eq('code', cleanCode)
        .neq('id', referralId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'এই রেফারেল কোডটি ইতিমধ্যে অন্য ইউজারের রয়েছে।' }, { status: 400 });
      }

      const { error: updateErr } = await supabaseAdmin
        .from('referrals')
        .update({ code: cleanCode })
        .eq('id', referralId);

      if (updateErr) throw updateErr;

      return NextResponse.json({ success: true, message: 'রেফারেল কোড সফলভাবে আপডেট হয়েছে!' });
    }

    if (action === 'create_code') {
      if (!userId || !newCode) {
        return NextResponse.json({ error: 'User ID and code required' }, { status: 400 });
      }

      const cleanCode = newCode.trim().toUpperCase();

      const { error: insertErr } = await supabaseAdmin.from('referrals').insert({
        owner_id: userId,
        code: cleanCode,
      });

      if (insertErr) throw insertErr;

      return NextResponse.json({ success: true, message: 'নতুন রেফারেল কোড সফলভাবে তৈরি হয়েছে!' });
    }

    if (action === 'toggle_block') {
      if (!referralId) {
        return NextResponse.json({ error: 'Referral ID required' }, { status: 400 });
      }

      // 1. Fetch current referral
      const { data: ref, error: refFetchErr } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('id', referralId)
        .single();

      if (refFetchErr || !ref) {
        return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
      }

      const isCurrentlyBlocked = ref.expires_at ? new Date(ref.expires_at) < new Date() : false;
      const willBlock = !isCurrentlyBlocked;
      const newExpiresAt = willBlock ? '1970-01-01T00:00:00.000Z' : null;

      const { error: updateRefErr } = await supabaseAdmin
        .from('referrals')
        .update({ expires_at: newExpiresAt })
        .eq('id', referralId);

      if (updateRefErr) throw updateRefErr;

      // 2. Also update user profile subscription JSON
      if (ref.owner_id) {
        try {
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('subscription')
            .eq('id', ref.owner_id)
            .single();

          const sub = userData?.subscription || {};
          await supabaseAdmin
            .from('users')
            .update({
              subscription: {
                ...sub,
                is_referral_blocked: willBlock,
              },
            })
            .eq('id', ref.owner_id);
        } catch (e) {
          console.warn('Could not sync user subscription block flag:', e);
        }
      }

      return NextResponse.json({
        success: true,
        isBlocked: willBlock,
        message: willBlock
          ? 'ইউজারের রেফারেল সুবিধা সফলভাবে ব্লক করা হয়েছে।'
          : 'ইউজারের রেফারেল সুবিধা সফলভাবে আনব্লক করা হয়েছে।',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Referral code patch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update code' }, { status: 500 });
  }
}
