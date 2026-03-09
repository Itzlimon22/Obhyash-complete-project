import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET  /api/devices        — list all devices for the current user
 * DELETE /api/devices      — remove a specific device by { device_id }
 */

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_devices')
    .select(
      'id, device_name, device_type, ip_address, last_active, created_at, device_token',
    )
    .eq('user_id', user.id)
    .order('last_active', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ devices: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { device_id } = (await req.json()) as { device_id: string };

  if (!device_id) {
    return NextResponse.json({ error: 'Missing device_id' }, { status: 400 });
  }

  // RLS ensures users can only delete their own devices — safe
  const { error } = await supabase
    .from('user_devices')
    .delete()
    .eq('id', device_id)
    .eq('user_id', user.id); // belt-and-suspenders check

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
