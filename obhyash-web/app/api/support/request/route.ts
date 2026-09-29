import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, contactInfo, issueType, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'তোমার নাম উল্লেখ করা আবশ্যক।' },
        { status: 400 },
      );
    }

    if (!contactInfo || typeof contactInfo !== 'string' || !contactInfo.trim()) {
      return NextResponse.json(
        { success: false, error: 'মোবাইল নম্বর বা ইমেইল উল্লেখ করা আবশ্যক।' },
        { status: 400 },
      );
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json(
        { success: false, error: 'সমস্যার বিবরণ দেওয়া আবশ্যক।' },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // Insert into login_support_requests
    const { data, error } = await supabaseAdmin
      .from('login_support_requests')
      .insert({
        name: name.trim(),
        contact_info: contactInfo.trim(),
        issue_type: (issueType || 'Login Issue').trim(),
        description: description.trim(),
        status: 'Pending',
        metadata: {
          submitted_at: new Date().toISOString(),
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving login support request:', error);
      return NextResponse.json(
        { success: false, error: 'অনুরোধটি জমা দেওয়া যায়নি। আবার চেষ্টা করুন।' },
        { status: 500 },
      );
    }

    // Attempt to notify admins via notifications table
    try {
      const { data: admins } = await supabaseAdmin
        .from('users')
        .select('id')
        .in('role', ['admin', 'super_admin']);

      if (admins && admins.length > 0) {
        const notifications = admins.map((adm) => ({
          user_id: adm.id,
          title: `নতুন সাপোর্ট রিকোয়েস্ট: ${name.trim()}`,
          message: `[${issueType || 'লগইন সমস্যা'}] ${description.trim().slice(0, 100)}... যোগাযোগ: ${contactInfo.trim()}`,
          type: 'support_alert',
          link: '/admin/complaints?tab=support',
        }));

        await supabaseAdmin.from('notifications').insert(notifications);
      }
    } catch (notifErr) {
      console.warn('Failed to insert admin notifications:', notifErr);
    }

    // Pre-composed WhatsApp URL for fast user-to-support messaging
    const encodedText = encodeURIComponent(
      `হ্যালো অভ্যাশ সাপোর্ট টিম,\n\nআমি লগইন/রেজিস্ট্রেশনে সমস্যায় পড়েছি।\nআমার নাম: ${name.trim()}\nযোগাযোগ: ${contactInfo.trim()}\nসমস্যার বিষয়: ${issueType || 'লগইন সমস্যা'}\nবিবরণ: ${description.trim()}\n(টিকিট আইডি: #${data.id.slice(0, 8)})`,
    );
    const whatsappUrl = `https://wa.me/8801409583992?text=${encodedText}`;

    return NextResponse.json({
      success: true,
      ticketId: data.id,
      whatsappUrl,
      message: 'তোমার সাপোর্ট অনুরোধটি সফলভাবে জমা নেওয়া হয়েছে। টিম শীঘ্রই যোগাযোগ করবে।',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('API Error in /api/support/request:', err);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
