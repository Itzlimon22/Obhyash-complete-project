import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connection();
    const { id } = await params;
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const updatePayload: Record<string, any> = {};

    if (body.is_active !== undefined) updatePayload.is_active = Boolean(body.is_active);
    if (body.name !== undefined) updatePayload.name = body.name.trim();
    if (body.discount_percentage !== undefined)
      updatePayload.discount_percentage = Number(body.discount_percentage);
    if (body.fixed_prices !== undefined) updatePayload.fixed_prices = body.fixed_prices;
    if (body.ambassador_id !== undefined) updatePayload.ambassador_id = body.ambassador_id || null;
    if (body.max_uses !== undefined)
      updatePayload.max_uses = body.max_uses ? Number(body.max_uses) : null;
    if (body.expires_at !== undefined) updatePayload.expires_at = body.expires_at || null;

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('coupons')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, coupon: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update coupon' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connection();
    const { id } = await params;
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    const { error: delErr } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', id);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'কুপন সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to delete coupon' },
      { status: 500 },
    );
  }
}
