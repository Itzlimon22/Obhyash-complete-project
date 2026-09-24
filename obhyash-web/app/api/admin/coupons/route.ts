import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();

    // 1. Fetch all coupons
    const { data: coupons, error: couponErr } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (couponErr) {
      return NextResponse.json({ error: couponErr.message }, { status: 500 });
    }

    const couponList = coupons || [];

    // 2. Fetch ambassador users if any are linked
    const ambassadorIds = Array.from(
      new Set(couponList.map((c) => c.ambassador_id).filter(Boolean)),
    );

    let userMap: Record<string, { id: string; name: string; email: string; phone?: string }> = {};

    if (ambassadorIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name, email, phone')
        .in('id', ambassadorIds);

      if (users) {
        users.forEach((u) => {
          userMap[u.id] = u;
        });
      }
    }

    // 3. Assemble enriched coupon list
    let enriched = couponList.map((c) => ({
      ...c,
      ambassador: c.ambassador_id ? userMap[c.ambassador_id] || null : null,
    }));

    if (search) {
      enriched = enriched.filter(
        (c) =>
          c.code.toLowerCase().includes(search) ||
          c.name.toLowerCase().includes(search) ||
          (c.ambassador &&
            (c.ambassador.name?.toLowerCase().includes(search) ||
              c.ambassador.email?.toLowerCase().includes(search) ||
              c.ambassador.phone?.includes(search))),
      );
    }

    // Summary stats
    const totalCoupons = couponList.length;
    const activeCoupons = couponList.filter((c) => c.is_active).length;
    const totalUses = couponList.reduce((sum, c) => sum + (c.used_count || 0), 0);
    const activeAmbassadors = new Set(
      couponList.filter((c) => c.is_active && c.ambassador_id).map((c) => c.ambassador_id),
    ).size;

    return NextResponse.json({
      coupons: enriched,
      stats: {
        totalCoupons,
        activeCoupons,
        totalUses,
        activeAmbassadors,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch coupons' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connection();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const {
      code,
      name,
      discount_percentage = 33.56,
      fixed_prices = { '149': 99, '349': 249, '599': 399 },
      is_active = true,
      ambassador_id = null,
      max_uses = null,
      expires_at = null,
    } = body;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { error: 'কুপন কোড দেয়া আবশ্যক' },
        { status: 400 },
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Check duplicate
    const { data: existing } = await supabaseAdmin
      .from('coupons')
      .select('id')
      .eq('code', cleanCode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `কুপন কোড '${cleanCode}' ইতোমধ্যে ব্যবহৃত হয়েছে!` },
        { status: 400 },
      );
    }

    const { data: newCoupon, error: insertErr } = await supabaseAdmin
      .from('coupons')
      .insert({
        code: cleanCode,
        name: name ? name.trim() : `অফার কোড (${cleanCode})`,
        discount_percentage: Number(discount_percentage) || 33.56,
        fixed_prices,
        is_active: Boolean(is_active),
        ambassador_id: ambassador_id || null,
        max_uses: max_uses ? Number(max_uses) : null,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to create coupon' },
      { status: 500 },
    );
  }
}
