import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch Payment Requests with User details
    const { data: requestsData, error: requestsError } = await supabaseAdmin
      .from('payment_requests')
      .select('*, user:users!payment_requests_user_id_fkey(name, email, phone)')
      .order('requested_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching payment requests:', requestsError);
      throw requestsError;
    }

    // 2. Fetch Users with active/paid Subscriptions
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, phone, subscription, is_subscribed, subscription_expires_at, created_at, updated_at')
      .or('subscription.is.not.null,is_subscribed.eq.true,subscription_expires_at.is.not.null')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users subscription:', usersError);
      throw usersError;
    }

    // Map users to subscription history format expected by Admin UI
    const mappedSubscriptions = (usersData || [])
      .filter((u) => {
        const plan = u.subscription?.plan || u.subscription?.plan_name;
        const isSubscribed = u.is_subscribed === true;
        return (plan && plan !== 'Free') || isSubscribed;
      })
      .map((u) => {
        const sub = u.subscription || {};
        const expiry = sub.expiry || sub.expires_at || u.subscription_expires_at || '';
        const isExpired = expiry ? new Date(expiry) < new Date() : false;
        const isActive = (sub.status === 'Active' || u.is_subscribed === true) && !isExpired;
        const planName = sub.plan || sub.plan_name || (u.is_subscribed ? 'Premium' : 'Free');

        return {
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
          started_at: u.updated_at || u.created_at,
          expires_at: expiry,
          is_active: isActive,
          status: isExpired ? 'Expired' : (isActive ? 'Active' : (sub.status || 'Inactive')),
        };
      });

    // 3. Fetch Subscription Plans
    const { data: plansData, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .order('price', { ascending: true });

    if (plansError) {
      console.error('Error fetching plans:', plansError);
      throw plansError;
    }

    // 4. Calculate Stats
    const paymentRequests = requestsData || [];
    const approvedRequests = paymentRequests.filter(
      (r) => r.status === 'Approved',
    );
    const pendingRequests = paymentRequests.filter(
      (r) => r.status === 'Pending',
    );
    const rejectedRequests = paymentRequests.filter(
      (r) => r.status === 'Rejected',
    );
    const totalRevenue = approvedRequests.reduce(
      (sum, r) => sum + (Number(r.amount) || 0),
      0,
    );
    const totalRequestsCount = paymentRequests.length;
    const approvalRate =
      totalRequestsCount > 0
        ? Math.round((approvedRequests.length / totalRequestsCount) * 100)
        : 0;
    const activeSubscribersCount = mappedSubscriptions.filter((s) => s.is_active).length;

    return NextResponse.json({
      success: true,
      data: {
        paymentRequests,
        subscriptions: mappedSubscriptions,
        plans: plansData || [],
        stats: {
          totalRevenue,
          pendingRequests: pendingRequests.length,
          activeSubscriptions: activeSubscribersCount,
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

        const expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + durationDays);

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

    // ── Action: Extend Subscription ──
    if (action === 'extend_subscription') {
      const { userId, extensionDays = 30 } = body;

      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'userId is required' },
          { status: 400 },
        );
      }

      const { data: userData, error: uErr } = await supabaseAdmin
        .from('users')
        .select('subscription, subscription_expires_at')
        .eq('id', userId)
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
        currentExpiry && new Date(currentExpiry) > new Date()
          ? new Date(currentExpiry)
          : new Date();

      const newExpiry = new Date(baseDate);
      newExpiry.setDate(newExpiry.getDate() + Number(extensionDays));
      const planTitle = currentSub.plan && currentSub.plan !== 'Free' ? currentSub.plan : 'Premium';

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
        .eq('id', userId);

      if (updateErr) throw updateErr;

      // Update subscription_history
      try {
        await supabaseAdmin
          .from('subscription_history')
          .update({ expires_at: newExpiry.toISOString(), is_active: true })
          .eq('user_id', userId)
          .eq('is_active', true);
      } catch (histErr) {
        console.error('Error updating subscription_history on extend:', histErr);
      }

      return NextResponse.json({ success: true, newExpiry: newExpiry.toISOString() });
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

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + Number(durationDays));

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
