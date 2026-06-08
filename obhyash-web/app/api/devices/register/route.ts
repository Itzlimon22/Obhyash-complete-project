import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/devices/register
 * Body: { device_token, device_name, device_type }
 *
 * 1. Verifies the session is authenticated.
 * 2. Upserts the device row with the real IP from request headers.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    device_token: string;
    device_name: string;
    device_type: string;
  };

  if (!body.device_token || !body.device_name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Get real client IP (Vercel / Cloudflare sets x-forwarded-for)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    null;

  // Register / refresh the device
  const { data: device, error: upsertError } = await supabase
    .from("user_devices")
    .upsert(
      {
        user_id: user.id,
        device_token: body.device_token,
        device_name: body.device_name,
        device_type: body.device_type || "web",
        ip_address: ip,
        last_active: new Date().toISOString(),
      },
      { onConflict: "user_id,device_token" },
    )
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ device });
}
