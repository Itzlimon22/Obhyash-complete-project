import { NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/utils/admin-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BUTTON_CONFIG: Record<
  string,
  { nameBn: string; nameEn: string; category: string }
> = {
  mobile_sticky: {
    nameBn: 'মোবাইল স্টিকি বটম বার',
    nameEn: 'Mobile Sticky Bottom Bar',
    category: 'Sticky Bar',
  },
  quick_action: {
    nameBn: 'মোবাইল স্টিকি বটম বার',
    nameEn: 'Mobile Sticky Bottom Bar',
    category: 'Sticky Bar',
  },
  header: {
    nameBn: 'ওয়েবসাইট হেডার ন্যাভ বার',
    nameEn: 'Website Header Navbar',
    category: 'Navigation',
  },
  drawer: {
    nameBn: 'মোবাইল স্লাইড ড্রয়ার মেনু',
    nameEn: 'Mobile Navigation Drawer',
    category: 'Navigation',
  },
  in_article: {
    nameBn: 'আর্টিকেলের ভেতরে CTA ব্যানার',
    nameEn: 'In-Article Content CTA',
    category: 'In-Article',
  },
  scholarship_card: {
    nameBn: 'এসএসসি বৃত্তি এলার্ট কার্ড',
    nameEn: 'SSC Scholarship Alert Card',
    category: 'In-Article',
  },
  demo_ssc_start: {
    nameBn: 'এসএসসি ডেমো এক্সাম স্টার্ট',
    nameEn: 'SSC Demo Exam Start Action',
    category: 'Exam Engine',
  },
  demo_hsc_start: {
    nameBn: 'এইচএসসি ডেমো এক্সাম স্টার্ট',
    nameEn: 'HSC Demo Exam Start Action',
    category: 'Exam Engine',
  },
  demo_exam_completed: {
    nameBn: 'ডেমো টেস্ট সাবমিট/কমপ্লিট',
    nameEn: 'Demo Exam Completed Action',
    category: 'Exam Engine',
  },
  demo_gate_modal: {
    nameBn: 'ডেমো ফ্রি লিমিট গেট মডাল',
    nameEn: 'Demo Exam Limit Gate Modal',
    category: 'Popup Modal',
  },
  sidebar: {
    nameBn: 'ব্লগ সাইডবার উইজেট',
    nameEn: 'Blog Sidebar App Widget',
    category: 'Widget',
  },
  footer: {
    nameBn: 'ফুটার লিংক সেকশন',
    nameEn: 'Website Footer Links',
    category: 'Footer',
  },
  floating_next: {
    nameBn: 'ফ্লোটিং নেক্সট আর্টিকেল',
    nameEn: 'Floating Next Article Box',
    category: 'Widget',
  },
};

function getSegment(
  sourceSlug?: string | null,
  sourceCategory?: string | null,
  buttonLocation?: string | null,
): 'SSC' | 'HSC' | 'General' {
  const combined = (
    (sourceSlug || '') +
    ' ' +
    (sourceCategory || '') +
    ' ' +
    (buttonLocation || '')
  ).toLowerCase();

  if (combined.includes('ssc')) return 'SSC';
  if (combined.includes('hsc')) return 'HSC';
  return 'General';
}

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

    // 2. Fetch Blog Conversions (App Downloads, Signups, Demo Exams, etc.)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayIso = startOfToday.toISOString();

    let totalAppDownloads = 0;
    let todayAppDownloads = 0;
    let totalSignups = 0;
    let todaySignups = 0;
    let totalPracticeClicks = 0;
    let todayPracticeClicks = 0;
    let totalConversions = 0;
    let todayConversions = 0;

    const sscStats = {
      total: 0,
      today: 0,
      appDownloads: 0,
      signups: 0,
      demoExams: 0,
      todayDemoExams: 0,
    };

    const hscStats = {
      total: 0,
      today: 0,
      appDownloads: 0,
      signups: 0,
      demoExams: 0,
      todayDemoExams: 0,
    };

    const generalStats = {
      total: 0,
      today: 0,
      appDownloads: 0,
      signups: 0,
      demoExams: 0,
      todayDemoExams: 0,
    };

    let topConvertingPosts: {
      slug: string;
      segment: 'SSC' | 'HSC' | 'General';
      appDownloads: number;
      signups: number;
      demoExams: number;
      total: number;
      today: number;
      lastActivity: string;
    }[] = [];

    let recentConversions: {
      id: string;
      event_type: string;
      source_slug: string;
      source_category?: string;
      button_location: string;
      created_at: string;
      segment: 'SSC' | 'HSC' | 'General';
      buttonNameBn: string;
    }[] = [];

    let buttonBreakdown: {
      location: string;
      nameBn: string;
      nameEn: string;
      category: string;
      totalClicks: number;
      todayClicks: number;
      appDownloads: number;
      signups: number;
      sscExams: number;
      hscExams: number;
      practiceClicks: number;
      percentage: number;
      lastClickedAt: string | null;
    }[] = [];

    // 24-hour activity distribution for today
    const hourlyActivity: {
      hour: number;
      total: number;
      app: number;
      signup: number;
      exam: number;
    }[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      total: 0,
      app: 0,
      signup: 0,
      exam: 0,
    }));

    let tableExists = true;

    try {
      const [
        { count: allApps },
        { count: todayApps },
        { count: allSignups },
        { count: todaySgnps },
        { count: allPractice },
        { count: todayPractice },
        { count: allConv },
        { count: todayConv },
        { data: allRows, error: rowsError },
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
          .select('*', { count: 'exact', head: true })
          .in('event_type', ['practice_click', 'demo_exam_start']),
        supabaseAdmin
          .from('blog_conversions')
          .select('*', { count: 'exact', head: true })
          .in('event_type', ['practice_click', 'demo_exam_start'])
          .gte('created_at', todayIso),
        supabaseAdmin
          .from('blog_conversions')
          .select('*', { count: 'exact', head: true }),
        supabaseAdmin
          .from('blog_conversions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayIso),
        supabaseAdmin
          .from('blog_conversions')
          .select(
            'id, event_type, source_slug, source_category, button_location, created_at',
          )
          .order('created_at', { ascending: false })
          .limit(3000),
      ]);

      if (rowsError && rowsError.code === '42P01') {
        tableExists = false;
      } else {
        totalAppDownloads = allApps || 0;
        todayAppDownloads = todayApps || 0;
        totalSignups = allSignups || 0;
        todaySignups = todaySgnps || 0;
        totalPracticeClicks = allPractice || 0;
        todayPracticeClicks = todayPractice || 0;
        totalConversions = allConv || 0;
        todayConversions = todayConv || 0;

        const rows = allRows || [];
        const buttonMap: Record<string, any> = {};
        const postMap: Record<string, any> = {};

        // Pre-populate prominent buttons so monitor hub always tracks them cleanly
        const coreKeys = [
          'mobile_sticky',
          'header',
          'drawer',
          'in_article',
          'scholarship_card',
          'demo_ssc_start',
          'demo_hsc_start',
          'demo_gate_modal',
          'footer',
          'sidebar',
        ];

        coreKeys.forEach((k) => {
          const cfg = BUTTON_CONFIG[k] || {
            nameBn: k,
            nameEn: k,
            category: 'Other',
          };
          buttonMap[k] = {
            location: k,
            nameBn: cfg.nameBn,
            nameEn: cfg.nameEn,
            category: cfg.category,
            totalClicks: 0,
            todayClicks: 0,
            appDownloads: 0,
            signups: 0,
            sscExams: 0,
            hscExams: 0,
            practiceClicks: 0,
            lastClickedAt: null,
          };
        });

        rows.forEach((row) => {
          const isToday = row.created_at >= todayIso;
          const seg = getSegment(
            row.source_slug,
            row.source_category,
            row.button_location,
          );
          const targetStats =
            seg === 'SSC' ? sscStats : seg === 'HSC' ? hscStats : generalStats;

          targetStats.total++;
          if (isToday) targetStats.today++;

          const isApp = row.event_type === 'app_download';
          const isSignup = row.event_type === 'signup_click';
          const isExam =
            row.event_type === 'practice_click' ||
            row.event_type === 'demo_exam_start' ||
            row.event_type === 'demo_exam_complete';

          if (isApp) targetStats.appDownloads++;
          else if (isSignup) targetStats.signups++;
          else if (isExam) {
            targetStats.demoExams++;
            if (isToday) targetStats.todayDemoExams++;
          }

          // Hourly distribution for today
          if (isToday) {
            const dateObj = new Date(row.created_at);
            const hour = dateObj.getHours();
            if (hourlyActivity[hour]) {
              hourlyActivity[hour].total++;
              if (isApp) hourlyActivity[hour].app++;
              else if (isSignup) hourlyActivity[hour].signup++;
              else if (isExam) hourlyActivity[hour].exam++;
            }
          }

          // Button aggregation
          let loc = row.button_location || 'other';
          if (loc === 'quick_action') loc = 'mobile_sticky';

          if (!buttonMap[loc]) {
            const cfg = BUTTON_CONFIG[loc] || {
              nameBn: loc,
              nameEn: loc,
              category: 'Other',
            };
            buttonMap[loc] = {
              location: loc,
              nameBn: cfg.nameBn,
              nameEn: cfg.nameEn,
              category: cfg.category,
              totalClicks: 0,
              todayClicks: 0,
              appDownloads: 0,
              signups: 0,
              sscExams: 0,
              hscExams: 0,
              practiceClicks: 0,
              lastClickedAt: null,
            };
          }

          const b = buttonMap[loc];
          b.totalClicks++;
          if (isToday) b.todayClicks++;
          if (!b.lastClickedAt || row.created_at > b.lastClickedAt) {
            b.lastClickedAt = row.created_at;
          }

          if (isApp) b.appDownloads++;
          else if (isSignup) b.signups++;
          else if (isExam) {
            b.practiceClicks++;
            if (seg === 'SSC') b.sscExams++;
            else if (seg === 'HSC') b.hscExams++;
          }

          // Top converting post aggregation
          const slug = row.source_slug || 'blog_home';
          if (!postMap[slug]) {
            postMap[slug] = {
              slug,
              segment: seg,
              total: 0,
              today: 0,
              appDownloads: 0,
              signups: 0,
              demoExams: 0,
              lastActivity: row.created_at,
            };
          }
          const p = postMap[slug];
          p.total++;
          if (isToday) p.today++;
          if (row.created_at > p.lastActivity) p.lastActivity = row.created_at;
          if (isApp) p.appDownloads++;
          else if (isSignup) p.signups++;
          else if (isExam) p.demoExams++;
        });

        // Compute button percentage share
        const totalRowsCount = rows.length || 1;
        buttonBreakdown = Object.values(buttonMap)
          .map((item) => ({
            ...item,
            percentage:
              totalRowsCount > 0
                ? Math.round((item.totalClicks / totalRowsCount) * 100)
                : 0,
          }))
          .sort((a, b) => b.totalClicks - a.totalClicks);

        // Top converting posts
        topConvertingPosts = Object.values(postMap)
          .sort((a, b) => b.total - a.total)
          .slice(0, 15);

        // Recent 200 conversions for live feed
        recentConversions = rows.slice(0, 200).map((r) => {
          let loc = r.button_location || 'other';
          if (loc === 'quick_action') loc = 'mobile_sticky';
          return {
            id: r.id,
            event_type: r.event_type,
            source_slug: r.source_slug,
            source_category: r.source_category,
            button_location: r.button_location,
            created_at: r.created_at,
            segment: getSegment(
              r.source_slug,
              r.source_category,
              r.button_location,
            ),
            buttonNameBn:
              BUTTON_CONFIG[loc]?.nameBn ||
              r.button_location ||
              'অন্যান্য বাটন',
          };
        });
      }
    } catch (e: any) {
      console.warn('Could not query blog_conversions:', e?.message);
      tableExists = false;
    }

    return NextResponse.json({
      subscribers: subscriberCount || 0,
      totalConversions,
      todayConversions,
      totalAppDownloads,
      todayAppDownloads,
      totalSignups,
      todaySignups,
      totalPracticeClicks,
      todayPracticeClicks,
      sscStats,
      hscStats,
      generalStats,
      topConvertingPosts,
      buttonBreakdown,
      recentConversions,
      hourlyActivity,
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
