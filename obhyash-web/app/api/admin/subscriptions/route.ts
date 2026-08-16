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
      .select('id, name, email, phone, subscription, created_at, updated_at')
      .not('subscription', 'is', null)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users subscription:', usersError);
      throw usersError;
    }

    // Map users to subscription history format expected by Admin UI
    const mappedSubscriptions = (usersData || [])
      .filter((u) => {
        const plan = u.subscription?.plan;
        return plan && plan !== 'Free';
      })
      .map((u) => {
        const sub = u.subscription || {};
        const expiry = sub.expiry || sub.expires_at || '';
        const isExpired = expiry ? new Date(expiry) < new Date() : false;

        return {
          id: u.id,
          user_id: u.id,
          user: {
            name: u.name || 'Student',
            email: u.email || '',
            phone: u.phone || '',
          },
          plan_name: sub.plan || 'Premium',
          started_at: u.updated_at || u.created_at,
          expires_at: expiry,
          is_active: sub.status === 'Active' && !isExpired,
          status: isExpired ? 'Expired' : (sub.status || 'Active'),
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
    const totalRevenue = approvedRequests.reduce(
      (sum, r) => sum + (Number(r.amount) || 0),
      0,
    );

    return NextResponse.json({
      success: true,
      data: {
        paymentRequests,
        subscriptions: mappedSubscriptions,
        plans: plansData || [],
        stats: {
          totalRevenue,
          pendingCount: pendingRequests.length,
          activeSubscribersCount: mappedSubscriptions.filter((s) => s.is_active)
            .length,
          approvedRequestsCount: approvedRequests.length,
          totalRequestsCount: paymentRequests.length,
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
    const body = await request.json();
    const { action } = body;
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

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
        // Find plan duration
        let durationDays = 30;
        const { data: planData } = await supabaseAdmin
          .from('subscription_plans')
          .select('*')
          .ilike('display_name', `%${reqData.plan_name}%`)
          .single();

        if (planData?.duration_days) {
          durationDays = planData.duration_days;
        } else if (reqData.plan_name.toLowerCase().includes('year') || reqData.plan_name.toLowerCase().includes('বছর')) {
          durationDays = 365;
        } else if (reqData.plan_name.toLowerCase().includes('pro') || reqData.plan_name.toLowerCase().includes('ত্রৈমাসিক') || reqData.plan_name.toLowerCase().includes('quarter')) {
          durationDays = 90;
        }

        const expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + durationDays);

        // Update user subscription
        const { error: userErr } = await supabaseAdmin
          .from('users')
          .update({
            subscription: {
              plan: reqData.plan_name,
              expiry: expiryDate.toISOString(),
              expires_at: expiryDate.toISOString(),
              status: 'Active',
            },
            updated_at: now.toISOString(),
          })
          .eq('id', reqData.user_id);

        if (userErr) throw userErr;

        // Send Notification
        await supabaseAdmin.from('notifications').insert({
          user_id: reqData.user_id,
          title: 'পেমেন্ট সফল ও প্ল্যান সক্রিয়!',
          message: `আপনার ${reqData.plan_name} প্ল্যানের পেমেন্ট অনুমোদিত হয়েছে। মেয়াদ: ${expiryDate.toLocaleDateString('bn-BD')} পর্যন্ত।`,
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
        .select('subscription')
        .eq('id', userId)
        .single();

      if (uErr || !userData) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 },
        );
      }

      const currentSub = userData.subscription || {};
      const currentExpiry = currentSub.expiry || currentSub.expires_at;
      const baseDate = currentExpiry && new Date(currentExpiry) > new Date()
        ? new Date(currentExpiry)
        : new Date();

      const newExpiry = new Date(baseDate);
      newExpiry.setDate(newExpiry.getDate() + Number(extensionDays));

      const { error: updateErr } = await supabaseAdmin
        .from('users')
        .update({
          subscription: {
            ...currentSub,
            plan: currentSub.plan && currentSub.plan !== 'Free' ? currentSub.plan : 'Premium',
            expiry: newExpiry.toISOString(),
            expires_at: newExpiry.toISOString(),
            status: 'Active',
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateErr) throw updateErr;

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

      const { error: grantErr } = await supabaseAdmin
        .from('users')
        .update({
          subscription: {
            plan: planName,
            expiry: expiryDate.toISOString(),
            expires_at: expiryDate.toISOString(),
            status: 'Active',
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);

      if (grantErr) throw grantErr;

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
