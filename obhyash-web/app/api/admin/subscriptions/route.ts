import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // 1. Safely Fetch Payment Requests (Manual & Gateway requests)
    let paymentRequestsRaw: any[] = [];
    try {
      const { data: reqs, error: reqsError } = await supabaseAdmin
        .from('payment_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (!reqsError && reqs) {
        paymentRequestsRaw = reqs;
      }
    } catch (e) {
      console.warn('Error fetching payment_requests:', e);
    }

    // 2. Safely Fetch UddoktaPay & Online Payment Transactions
    let paymentTransactionsRaw: any[] = [];
    try {
      const { data: txs, error: txsError } = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!txsError && txs) {
        paymentTransactionsRaw = txs;
      }
    } catch (e) {
      console.warn('Error fetching payment_transactions:', e);
    }

    // Collect all user IDs involved in payments
    const userIdsSet = new Set<string>();
    paymentRequestsRaw.forEach((r) => {
      if (r.user_id) userIdsSet.add(r.user_id);
    });
    paymentTransactionsRaw.forEach((t) => {
      if (t.user_id) userIdsSet.add(t.user_id);
    });

    // 3. Batch Fetch Users for all payments
    const userMap: Record<string, { name: string; email: string; phone?: string }> = {};
    if (userIdsSet.size > 0) {
      try {
        const { data: usersInfo } = await supabaseAdmin
          .from('users')
          .select('id, name, email, phone')
          .in('id', Array.from(userIdsSet));

        if (usersInfo) {
          usersInfo.forEach((u) => {
            userMap[u.id] = {
              name: u.name || 'Student',
              email: u.email || '',
              phone: u.phone || '',
            };
          });
        }
      } catch (e) {
        console.warn('Error batch fetching users for payments:', e);
      }
    }

    // Existing transaction IDs in paymentRequests to prevent duplicate display
    const existingTrxIds = new Set<string>();
    paymentRequestsRaw.forEach((r) => {
      if (r.transaction_id) existingTrxIds.add(String(r.transaction_id).trim().toLowerCase());
    });

    // Map Payment Requests with User details
    const mappedRequests: any[] = paymentRequestsRaw.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      user: userMap[r.user_id] || { name: 'Student', email: '', phone: '' },
      plan_name: r.plan_name || 'Premium',
      plan_id: r.plan_id,
      amount: Number(r.amount) || 0,
      currency: r.currency || 'BDT',
      payment_method: r.payment_method || 'Manual',
      transaction_id: r.transaction_id,
      payment_proof_url: r.payment_proof_url,
      status: r.status || 'Pending',
      admin_notes: r.admin_notes,
      requested_at: r.requested_at || r.created_at || new Date().toISOString(),
      reviewed_at: r.reviewed_at,
      reviewed_by: r.reviewed_by,
    }));

    // Map UddoktaPay Transactions and merge if not already present
    paymentTransactionsRaw.forEach((tx) => {
      const txId = (tx.transaction_id || tx.invoice_id || '').toString().trim().toLowerCase();
      if (txId && existingTrxIds.has(txId)) return;

      const metadata = tx.metadata || {};
      const planName =
        metadata.plan_name ||
        metadata.plan_title ||
        metadata.plan_id ||
        'Pro Subscription';

      const isCompleted =
        tx.status === 'COMPLETED' ||
        tx.status === 'completed' ||
        tx.status === 'SUCCESS' ||
        tx.status === 'Approved';

      const isPending =
        tx.status === 'PENDING' ||
        tx.status === 'pending' ||
        tx.status === 'Pending';

      const displayMethod = tx.payment_method
        ? (tx.payment_method.toLowerCase().includes('uddokta') ? tx.payment_method : `UddoktaPay (${tx.payment_method})`)
        : 'UddoktaPay';

      mappedRequests.push({
        id: tx.id || tx.invoice_id || `tx_${Math.random()}`,
        user_id: tx.user_id,
        user: userMap[tx.user_id] || { name: 'Student', email: '', phone: '' },
        plan_name: planName,
        amount: Number(tx.amount) || 0,
        currency: tx.currency || 'BDT',
        payment_method: displayMethod,
        transaction_id: tx.transaction_id || tx.invoice_id,
        payment_proof_url: null,
        status: isCompleted ? 'Approved' : isPending ? 'Pending' : 'Rejected',
        admin_notes: tx.invoice_id ? `Invoice ID: ${tx.invoice_id}` : 'UddoktaPay Automated',
        requested_at: tx.created_at || new Date().toISOString(),
        reviewed_at: isCompleted ? (tx.created_at || new Date().toISOString()) : null,
        reviewed_by: 'UddoktaPay Gateway',
      });
    });

    // Sort all payment requests newest first
    mappedRequests.sort(
      (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime(),
    );

    // 4. Fetch Users with active/paid Subscriptions (including is_pro, is_subscribed, subscription, subscription_tier)
    // 4. Fetch Users with active/paid Subscriptions
    let usersData: any[] = [];
    try {
      const { data: uData, error: uErr } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!uErr && uData) {
        usersData = uData;
      } else if (uErr) {
        console.warn('Error fetching users for subscriptions:', uErr);
      }
    } catch (e) {
      console.warn('Error fetching subscribed users:', e);
    }

    // Map users to subscription history format expected by Admin UI
    const mappedSubscriptions: any[] = [];
    const seenUserSubIds = new Set<string>();

    (usersData || []).forEach((u) => {
      const sub = u.subscription || {};
      const subTier = u.subscription_tier;
      const uPlan = u.plan;
      const uLevel = u.level;

      const rawPlan =
        sub.plan ||
        sub.plan_name ||
        subTier ||
        uPlan ||
        (uLevel && String(uLevel).toLowerCase() === 'pro' ? 'Pro' : '');

      const isExplicitlyFree =
        !rawPlan ||
        String(rawPlan).toLowerCase() === 'free' ||
        String(rawPlan).toLowerCase() === 'rookie' ||
        String(rawPlan).toLowerCase() === 'basic' ||
        String(rawPlan).toLowerCase() === 'explorer';

      const hasProFlag =
        u.is_subscribed === true ||
        u.is_pro === true ||
        (uLevel && String(uLevel).toLowerCase() === 'pro') ||
        (uPlan && String(uPlan).toLowerCase() === 'pro') ||
        (subTier && String(subTier).toLowerCase().includes('pro')) ||
        (rawPlan && !isExplicitlyFree);

      // If user is clearly on Free plan or has no Pro flag, skip immediately!
      if (!hasProFlag || isExplicitlyFree) {
        return;
      }

      const expiry =
        sub.expiry ||
        sub.expires_at ||
        u.subscription_expires_at ||
        u.subscription_end_date ||
        '';

      const isExpired = expiry ? new Date(expiry).getTime() < Date.now() : false;
      const isExplicitlyExpired = u.subscription_status === 'Expired' || sub.status === 'Expired';

      seenUserSubIds.add(u.id);
      const isActive = !isExpired && !isExplicitlyExpired;

      const planName =
        rawPlan && !isExplicitlyFree
          ? String(rawPlan)
          : 'Pro Premium';

      mappedSubscriptions.push({
        id: u.id,
        user_id: u.id,
        user: {
          name: u.name || 'Student',
          email: u.email || '',
          phone: u.phone || '',
        },
        plan_name: planName,
        plan: {
          display_name: planName,
          price: Number(sub.amount) || Number(sub.price) || 0,
        },
        started_at: u.updated_at || u.created_at || new Date().toISOString(),
        expires_at: expiry || (isActive ? new Date(Date.now() + 30 * 86400000).toISOString() : ''),
        is_active: isActive,
        status: isActive ? 'Active' : 'Expired',
      });
    });

    // Also include any approved payment request users who may not have been flagged in users
    mappedRequests
      .filter((r) => r.status === 'Approved')
      .forEach((req) => {
        if (req.user_id && !seenUserSubIds.has(req.user_id)) {
          seenUserSubIds.add(req.user_id);
          const reqDate = req.reviewed_at || req.requested_at || new Date().toISOString();
          const expiryDate = new Date(new Date(reqDate).getTime() + 30 * 86400000).toISOString();
          const isExpired = new Date(expiryDate).getTime() < Date.now();
          const isActive = !isExpired;

          mappedSubscriptions.push({
            id: req.user_id,
            user_id: req.user_id,
            user: req.user || { name: 'Student', email: '', phone: '' },
            plan_name: req.plan_name || 'Pro Premium',
            plan: {
              display_name: req.plan_name || 'Pro Premium',
              price: Number(req.amount) || 0,
            },
            started_at: reqDate,
            expires_at: expiryDate,
            is_active: isActive,
            status: isActive ? 'Active' : 'Expired',
          });
        }
      });

    // 5. Fetch Subscription Plans
    let plansData: any[] = [];
    try {
      const { data: pData } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });
      if (pData) plansData = pData;
    } catch (e) {
      console.warn('Error fetching subscription plans:', e);
    }

    // 6. Calculate Aggregated Stats
    const approvedRequests = mappedRequests.filter((r) => r.status === 'Approved');
    const pendingRequests = mappedRequests.filter((r) => r.status === 'Pending');
    const rejectedRequests = mappedRequests.filter((r) => r.status === 'Rejected');
    const totalRevenue = approvedRequests.reduce(
      (sum, r) => sum + (Number(r.amount) || 0),
      0,
    );
    const totalRequestsCount = mappedRequests.length;
    const approvalRate =
      totalRequestsCount > 0
        ? Math.round((approvedRequests.length / totalRequestsCount) * 100)
        : 0;
    const activeSubscribersCount = mappedSubscriptions.filter((s) => s.is_active).length;
    const expiredSubscribersCount = mappedSubscriptions.filter((s) => !s.is_active).length;

    return NextResponse.json({
      success: true,
      data: {
        paymentRequests: mappedRequests,
        subscriptions: mappedSubscriptions,
        plans: plansData,
        stats: {
          totalRevenue,
          pendingRequests: pendingRequests.length,
          activeSubscriptions: activeSubscribersCount,
          expiredSubscriptions: expiredSubscribersCount,
          approvalRate,
          approvedRequests: approvedRequests.length,
          rejectedRequests: rejectedRequests.length,
          totalRequests: totalRequestsCount,
        },
      },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/subscriptions GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch subscription data' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connection();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // ── Security Check: Verify Caller Admin Role ──
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: authData } = await supabaseAdmin.auth.getUser(token);
      if (authData?.user) {
        const { data: userRow } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (userRow?.role !== 'Admin') {
          return NextResponse.json(
            { success: false, error: 'Unauthorized: Admin role required' },
            { status: 403 },
          );
        }
      }
    }

    const body = await request.json();
    const { action } = body;

    // ── Action: Review Payment Request (Approve / Reject) ──
    if (action === 'review_payment') {
      const { requestId, status, adminNotes, reviewedBy } = body;

      if (!requestId || !status) {
        return NextResponse.json(
          { success: false, error: 'requestId and status are required' },
          { status: 400 },
        );
      }

      // Fetch request details
      const { data: reqData, error: fetchErr } = await supabaseAdmin
        .from('payment_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchErr || !reqData) {
        return NextResponse.json(
          { success: false, error: 'Payment request not found' },
          { status: 404 },
        );
      }

      const now = new Date();

      // Update payment request status
      const { error: updateReqErr } = await supabaseAdmin
        .from('payment_requests')
        .update({
          status,
          admin_notes: adminNotes || '',
          reviewed_at: now.toISOString(),
          reviewed_by: reviewedBy || null,
          updated_at: now.toISOString(),
        })
        .eq('id', requestId);

      if (updateReqErr) throw updateReqErr;

      // If approved, update user's subscription
      if (status === 'Approved') {
        // Find plan duration & matching plan from subscription_plans
        let durationDays = 30;
        let matchedPlanId: string | null = null;
        let planDisplayName = reqData.plan_name || 'Premium';

        const { data: allPlans } = await supabaseAdmin
          .from('subscription_plans')
          .select('*');

        if (allPlans && allPlans.length > 0) {
          const reqPlanLower = (reqData.plan_name || '').toLowerCase().trim();
          const matched = allPlans.find(
            (p) =>
              p.id === reqData.plan_id ||
              p.name.toLowerCase() === reqPlanLower ||
              p.display_name.toLowerCase() === reqPlanLower ||
              reqPlanLower.includes(p.name.toLowerCase()) ||
              reqPlanLower.includes(p.display_name.toLowerCase()) ||
              p.display_name.toLowerCase().includes(reqPlanLower),
          );

          if (matched) {
            matchedPlanId = matched.id;
            durationDays = matched.duration_days || 30;
            planDisplayName = matched.display_name;
          }
        }

        if (!matchedPlanId) {
          if (
            reqData.plan_name.toLowerCase().includes('year') ||
            reqData.plan_name.toLowerCase().includes('বছর')
          ) {
            durationDays = 365;
          } else if (
            reqData.plan_name.toLowerCase().includes('pro') ||
            reqData.plan_name.toLowerCase().includes('ত্রৈমাসিক') ||
            reqData.plan_name.toLowerCase().includes('quarter')
          ) {
            durationDays = 90;
          }
        }

        // Fetch existing subscription to stack validity on top of remaining days
        const { data: currentUser } = await supabaseAdmin
          .from('users')
          .select('subscription, subscription_expires_at')
          .eq('id', reqData.user_id)
          .maybeSingle();

        const currentExp = currentUser?.subscription_expires_at
          ? new Date(currentUser.subscription_expires_at)
          : (currentUser?.subscription?.expiry ? new Date(currentUser.subscription.expiry) : null);

        let baseDate = now;
        if (currentExp && currentExp > now) {
          baseDate = currentExp;
        }

        const expiryDate = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

        // 1. Update all subscription & access fields on users table
        const { error: userErr } = await supabaseAdmin
          .from('users')
          .update({
            subscription: {
              plan: planDisplayName,
              expiry: expiryDate.toISOString(),
              expires_at: expiryDate.toISOString(),
              status: 'Active',
            },
            subscription_status: 'Active',
            subscription_expires_at: expiryDate.toISOString(),
            is_subscribed: true,
            level: 'Pro',
            status: 'Active',
            updated_at: now.toISOString(),
          })
          .eq('id', reqData.user_id);

        if (userErr) throw userErr;

        // 2. Deactivate previous active records and insert new record into subscription_history
        try {
          await supabaseAdmin
            .from('subscription_history')
            .update({ is_active: false })
            .eq('user_id', reqData.user_id);

          await supabaseAdmin.from('subscription_history').insert({
            user_id: reqData.user_id,
            plan_id: matchedPlanId,
            payment_request_id: reqData.id,
            started_at: now.toISOString(),
            expires_at: expiryDate.toISOString(),
            is_active: true,
            created_at: now.toISOString(),
          });
        } catch (histErr) {
          console.error('Error inserting subscription_history (non-fatal):', histErr);
        }

        // 3. Send in-app notification
        await supabaseAdmin.from('notifications').insert({
          user_id: reqData.user_id,
          title: 'পেমেন্ট সফল ও প্ল্যান সক্রিয়!',
          message: `আপনার ${planDisplayName} প্ল্যানের পেমেন্ট অনুমোদিত হয়েছে। মেয়াদ: ${expiryDate.toLocaleDateString('bn-BD')} পর্যন্ত।`,
          type: 'success',
          read: false,
          created_at: now.toISOString(),
        });
      } else if (status === 'Rejected') {
        // Send rejection notification
        await supabaseAdmin.from('notifications').insert({
          user_id: reqData.user_id,
          title: 'পেমেন্ট রিকোয়েস্ট প্রত্যাখ্যাত',
          message: adminNotes
            ? `আপনার পেমেন্ট রিকোয়েস্টটি প্রত্যাখ্যাত হয়েছে। কারণ: ${adminNotes}`
            : 'আপনার পেমেন্ট রিকোয়েস্টটি প্রত্যাখ্যাত হয়েছে। সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।',
          type: 'warning',
          read: false,
          created_at: now.toISOString(),
        });
      }

      return NextResponse.json({ success: true });
    }

    // ── Action: Extend / Reactivate Subscription ──
    if (action === 'extend_subscription') {
      const { userId, subscriptionId, days, extensionDays = 30, planName } = body;
      const targetUserId = userId || subscriptionId;
      const numDays = Number(days || extensionDays) || 30;

      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: 'userId is required' },
          { status: 400 },
        );
      }

      const { data: userData, error: uErr } = await supabaseAdmin
        .from('users')
        .select('subscription, subscription_expires_at')
        .eq('id', targetUserId)
        .single();

      if (uErr || !userData) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 },
        );
      }

      const currentSub = userData.subscription || {};
      const currentExpiry =
        currentSub.expiry || currentSub.expires_at || userData.subscription_expires_at;
      const baseDate =
        currentExpiry && new Date(currentExpiry).getTime() > Date.now()
          ? new Date(currentExpiry)
          : new Date();

      const newExpiry = new Date(baseDate.getTime() + numDays * 86400000);
      const planTitle = planName || (currentSub.plan && currentSub.plan !== 'Free' ? currentSub.plan : 'Pro Premium');

      const { error: updateErr } = await supabaseAdmin
        .from('users')
        .update({
          subscription: {
            ...currentSub,
            plan: planTitle,
            expiry: newExpiry.toISOString(),
            expires_at: newExpiry.toISOString(),
            status: 'Active',
          },
          subscription_status: 'Active',
          subscription_expires_at: newExpiry.toISOString(),
          is_subscribed: true,
          level: 'Pro',
          status: 'Active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);

      if (updateErr) throw updateErr;

      // Update subscription_history
      try {
        await supabaseAdmin
          .from('subscription_history')
          .update({ expires_at: newExpiry.toISOString(), is_active: true })
          .eq('user_id', targetUserId);
      } catch (histErr) {
        console.error('Error updating subscription_history on extend:', histErr);
      }

      // Notify User
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: targetUserId,
          title: 'প্রিমিয়াম সাবস্ক্রিপশন আপডেট 🎉',
          message: `আপনার ${planTitle} সাবস্ক্রিপশন সফলভাবে ${numDays} দিনের জন্য বাড়ানো হয়েছে। নতুন মেয়াদ: ${newExpiry.toLocaleDateString('bn-BD')}।`,
          type: 'success',
          read: false,
          created_at: new Date().toISOString(),
        });
      } catch (_) {}

      return NextResponse.json({ success: true, newExpiry: newExpiry.toISOString() });
    }

    // ── Action: Cancel / Revoke Subscription ──
    if (action === 'cancel_subscription') {
      const { userId, reason = 'অ্যাডমিন কর্তৃক সাবস্ক্রিপশন বাতিল করা হয়েছে' } = body;

      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'userId is required' },
          { status: 400 },
        );
      }

      const { error: cancelErr } = await supabaseAdmin
        .from('users')
        .update({
          subscription: {
            plan: 'Free',
            expiry: new Date().toISOString(),
            expires_at: new Date().toISOString(),
            status: 'Expired',
          },
          subscription_status: 'Expired',
          subscription_expires_at: new Date().toISOString(),
          is_subscribed: false,
          level: 'Rookie',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (cancelErr) throw cancelErr;

      // Update subscription_history
      try {
        await supabaseAdmin
          .from('subscription_history')
          .update({ is_active: false })
          .eq('user_id', userId);
      } catch (_) {}

      // Notify User
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: userId,
          title: 'সাবস্ক্রিপশন স্ট্যাটাস আপডেট ⚠️',
          message: reason,
          type: 'warning',
          read: false,
          created_at: new Date().toISOString(),
        });
      } catch (_) {}

      return NextResponse.json({ success: true });
    }

    // ── Action: Send Custom In-App Notification ──
    if (action === 'send_notification') {
      const { userId, title, message, type = 'info' } = body;

      if (!userId || !title || !message) {
        return NextResponse.json(
          { success: false, error: 'userId, title, and message are required' },
          { status: 400 },
        );
      }

      const { error: notifErr } = await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        title,
        message,
        type,
        read: false,
        created_at: new Date().toISOString(),
      });

      if (notifErr) throw notifErr;
      return NextResponse.json({ success: true });
    }

    // ── Action: Grant Manual Subscription ──
    if (action === 'grant_subscription') {
      const { userId, userEmail, planName = 'Premium', durationDays = 30 } = body;

      let targetUserId = userId;
      if (!targetUserId && userEmail) {
        const { data: foundUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', userEmail.trim())
          .single();
        targetUserId = foundUser?.id;
      }

      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: 'User could not be found' },
          { status: 404 },
        );
      }

      const { data: targetUser } = await supabaseAdmin
        .from('users')
        .select('subscription, subscription_expires_at')
        .eq('id', targetUserId)
        .maybeSingle();

      const now = new Date();
      const currentExp = targetUser?.subscription_expires_at
        ? new Date(targetUser.subscription_expires_at)
        : (targetUser?.subscription?.expiry ? new Date(targetUser.subscription.expiry) : null);

      let baseDate = now;
      if (currentExp && currentExp > now) {
        baseDate = currentExp;
      }

      const expiryDate = new Date(baseDate.getTime() + Number(durationDays) * 24 * 60 * 60 * 1000);

      let matchedPlanId: string | null = null;
      try {
        const { data: allPlans } = await supabaseAdmin
          .from('subscription_plans')
          .select('*');
        const matched = allPlans?.find(
          (p) =>
            p.name.toLowerCase() === planName.toLowerCase() ||
            p.display_name.toLowerCase() === planName.toLowerCase(),
        );
        if (matched) matchedPlanId = matched.id;
      } catch (_) {}

      const { error: grantErr } = await supabaseAdmin
        .from('users')
        .update({
          subscription: {
            plan: planName,
            expiry: expiryDate.toISOString(),
            expires_at: expiryDate.toISOString(),
            status: 'Active',
          },
          subscription_status: 'Active',
          subscription_expires_at: expiryDate.toISOString(),
          is_subscribed: true,
          level: 'Pro',
          status: 'Active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);

      if (grantErr) throw grantErr;

      try {
        await supabaseAdmin
          .from('subscription_history')
          .update({ is_active: false })
          .eq('user_id', targetUserId);

        await supabaseAdmin.from('subscription_history').insert({
          user_id: targetUserId,
          plan_id: matchedPlanId,
          started_at: new Date().toISOString(),
          expires_at: expiryDate.toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
        });
      } catch (histErr) {
        console.error('Error recording subscription_history on grant:', histErr);
      }

      return NextResponse.json({ success: true, expiryDate: expiryDate.toISOString() });
    }

    // ── Action: Create / Update Plan ──
    if (action === 'save_plan') {
      const { plan } = body;
      if (!plan || !plan.name || !plan.display_name) {
        return NextResponse.json(
          { success: false, error: 'Plan name and display name are required' },
          { status: 400 },
        );
      }

      const planPayload = {
        name: plan.name,
        display_name: plan.display_name,
        price: Number(plan.price) || 0,
        currency: plan.currency || 'BDT',
        duration_days: Number(plan.duration_days) || 30,
        features: Array.isArray(plan.features) ? plan.features : [],
        is_active: plan.is_active ?? true,
        is_popular: plan.is_popular ?? false,
        color_theme: plan.color_theme || 'border-indigo-500',
        updated_at: new Date().toISOString(),
      };

      if (plan.id) {
        const { data, error } = await supabaseAdmin
          .from('subscription_plans')
          .update(planPayload)
          .eq('id', plan.id)
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
      } else {
        const { data, error } = await supabaseAdmin
          .from('subscription_plans')
          .insert([planPayload])
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }
    }

    // ── Action: Delete Plan ──
    if (action === 'delete_plan') {
      const { planId } = body;
      if (!planId) {
        return NextResponse.json(
          { success: false, error: 'planId is required' },
          { status: 400 },
        );
      }

      const { error } = await supabaseAdmin
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action specified' },
      { status: 400 },
    );
  } catch (err: any) {
    console.error('Error in /api/admin/subscriptions POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to perform subscription action' },
      { status: 500 },
    );
  }
}
