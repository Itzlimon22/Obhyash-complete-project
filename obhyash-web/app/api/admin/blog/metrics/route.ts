import { NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/utils/admin-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    await connection();

    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch Subscriber Count
    const { count: subscriberCount } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true });

    // 2. Fetch Blog Conversions (App Downloads, Signups, etc.)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayIso = startOfToday.toISOString();

    let totalAppDownloads = 0;
    let todayAppDownloads = 0;
    let totalSignups = 0;
    let todaySignups = 0;
    let totalConversions = 0;
    let topConvertingPosts: { slug: string; appDownloads: number; signups: number; total: number }[] = [];
    let recentConversions: any[] = [];
    let buttonBreakdown: {
      location: string;
      nameBn: string;
      nameEn: string;
      totalClicks: number;
      appDownloads: number;
      signups: number;
      percentage: number;
    }[] = [];
    let tableExists = true;

    try {
      // Fetch conversion counts
      const [
        { count: allApps },
        { count: todayApps },
        { count: allSignups },
        { count: todaySgnps },
        { count: allConv },
        { data: recentList, error: listError },
        { data: allButtonsList },
      ] = await Promise.all([
        supabaseAdmin
          .from('blog_conversions')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'app_download'),
        supabaseAdmin
          .from('blog_conversions')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'app_download')
          .gte('created_at', todayIso),
        supabaseAdmin
          .from('blog_conversions')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'signup_click'),
        supabaseAdmin
          .from('blog_conversions')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'signup_click')
          .gte('created_at', todayIso),
        supabaseAdmin
          .from('blog_conversions')
          .select('*', { count: 'exact', head: true }),
        supabaseAdmin
          .from('blog_conversions')
          .select('id, event_type, source_slug, source_category, button_location, created_at')
          .order('created_at', { ascending: false })
          .limit(100),
        supabaseAdmin
          .from('blog_conversions')
          .select('event_type, button_location')
          .limit(5000),
      ]);

      if (listError && listError.code === '42P01') {
        tableExists = false;
      } else {
        totalAppDownloads = allApps || 0;
        todayAppDownloads = todayApps || 0;
        totalSignups = allSignups || 0;
        todaySignups = todaySgnps || 0;
        totalConversions = allConv || 0;
        recentConversions = (recentList || []).slice(0, 15);

        // Aggregate top converting posts from recent list
        const postMap: Record<string, { appDownloads: number; signups: number; total: number }> = {};
        (recentList || []).forEach((item) => {
          const s = item.source_slug || 'blog_home';
          if (!postMap[s]) postMap[s] = { appDownloads: 0, signups: 0, total: 0 };
          if (item.event_type === 'app_download') postMap[s].appDownloads++;
          if (item.event_type === 'signup_click') postMap[s].signups++;
          postMap[s].total++;
        });

        topConvertingPosts = Object.entries(postMap)
          .map(([slug, stats]) => ({ slug, ...stats }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);

        // Aggregate Button Breakdown
        const LOCATION_CONFIG: Record<string, { nameBn: string; nameEn: string }> = {
          mobile_sticky: { nameBn: 'মোবাইল স্টিকি বার', nameEn: 'Mobile Sticky Bar' },
          quick_action: { nameBn: 'মোবাইল স্টিকি বার', nameEn: 'Mobile Sticky Bar' },
          header: { nameBn: 'হেডার ন্যাভ বার', nameEn: 'Header Navbar' },
          drawer: { nameBn: 'মোবাইল স্লাইড ড্রয়ার', nameEn: 'Mobile Drawer' },
          in_article: { nameBn: 'আর্টিকেলের ভেতরে', nameEn: 'In-Article CTA' },
          sidebar: { nameBn: 'ব্লগ সাইডবার', nameEn: 'Sidebar Widget' },
          footer: { nameBn: 'ফুটার সেকশন', nameEn: 'Footer' },
          floating_next: { nameBn: 'ফ্লোটিং নেক্সট বক্স', nameEn: 'Floating Next Box' },
        };

        const bMap: Record<string, {
          location: string;
          nameBn: string;
          nameEn: string;
          totalClicks: number;
          appDownloads: number;
          signups: number;
        }> = {};

        // Pre-populate core locations so admin can monitor all active buttons
        const coreKeys = ['mobile_sticky', 'header', 'in_article', 'drawer', 'footer'];
        coreKeys.forEach((k) => {
          bMap[k] = {
            location: k,
            nameBn: LOCATION_CONFIG[k].nameBn,
            nameEn: LOCATION_CONFIG[k].nameEn,
            totalClicks: 0,
            appDownloads: 0,
            signups: 0,
          };
        });

        const allRows = allButtonsList || [];
        const totalRowsCount = allRows.length;

        allRows.forEach((row) => {
          // Normalize quick_action to mobile_sticky
          let loc = row.button_location || 'other';
          if (loc === 'quick_action') loc = 'mobile_sticky';

          if (!bMap[loc]) {
            const cfg = LOCATION_CONFIG[loc] || { nameBn: loc, nameEn: loc };
            bMap[loc] = {
              location: loc,
              nameBn: cfg.nameBn,
              nameEn: cfg.nameEn,
              totalClicks: 0,
              appDownloads: 0,
              signups: 0,
            };
          }

          bMap[loc].totalClicks++;
          if (row.event_type === 'app_download') bMap[loc].appDownloads++;
          if (row.event_type === 'signup_click') bMap[loc].signups++;
        });

        buttonBreakdown = Object.values(bMap)
          .map((item) => ({
            ...item,
            percentage: totalRowsCount > 0 ? Math.round((item.totalClicks / totalRowsCount) * 100) : 0,
          }))
          .sort((a, b) => b.totalClicks - a.totalClicks);
      }
    } catch (e: any) {
      console.warn('Could not query blog_conversions:', e?.message);
      tableExists = false;
    }

    return NextResponse.json({
      subscribers: subscriberCount || 0,
      totalAppDownloads,
      todayAppDownloads,
      totalSignups,
      todaySignups,
      totalConversions,
      topConvertingPosts,
      recentConversions,
      buttonBreakdown,
      tableExists,
    });
  } catch (error: any) {
    console.error('Error fetching blog metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
