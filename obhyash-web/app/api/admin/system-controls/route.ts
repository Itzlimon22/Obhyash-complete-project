import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    await connection();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabaseAdmin
      .from('app_config')
      .select('*')
      .eq('id', 'global_config')
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || {
        maintenance_mode: false,
        live_exams_enabled: true,
        registration_enabled: true,
        free_trial_enabled: true,
        min_app_version: '1.0.0',
        latest_app_version: '1.0.0',
        force_update: false,
        global_announcement_enabled: false,
        global_announcement_text: '',
        global_announcement_type: 'info',
        global_announcement_target: 'all',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch config' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connection();
    const body = await request.json();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    const payload = {
      ...body,
      id: 'global_config',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('app_config')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'System controls updated successfully',
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update config' },
      { status: 500 },
    );
  }
}
