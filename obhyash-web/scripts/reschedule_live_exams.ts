import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

function getExamSchedule(category: string, title: string) {
  // Base date: Saturday, Oct 03, 2026
  const baseSat = new Date(Date.UTC(2026, 9, 3)); // Oct 3, 2026

  const clean = title.trim();
  const numMatch = clean.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 1;

  const isWeekly = clean.toLowerCase().includes('weekly');
  const isMock = clean.toLowerCase().includes('mock') || clean.toLowerCase().includes('mega');

  let dayOffset = 0;
  let startHourBst = 18; // 6 PM
  const startMinuteBst = 0;
  const endHourBst = 22; // 10 PM
  const endMinuteBst = 0;

  if (category === 'medical') {
    // Sat (day 0), Mon (day 2), Wed (day 4), Fri (day 6)
    if (isWeekly) {
      const week = num - 1;
      dayOffset = week * 7 + 6; // Friday
      startHourBst = 7; // 7 AM
    } else if (isMock) {
      dayOffset = 7 * 7 + (num === 1 ? 0 : 2); // Sat / Mon
    } else {
      const week = Math.floor((num - 1) / 3);
      const dayInWeek = (num - 1) % 3;
      const days = [0, 2, 4]; // Sat, Mon, Wed
      dayOffset = week * 7 + days[dayInWeek];
    }
  } else {
    // Engineering & Varsity: Sun (day 1), Tue (day 3), Thu (day 5), Fri (day 6)
    if (isWeekly) {
      const week = num - 1;
      dayOffset = week * 7 + 6; // Friday
      startHourBst = 7; // 7 AM
    } else if (isMock) {
      const week = category === 'engineering' ? 8 : 7;
      dayOffset = week * 7 + (num === 1 ? 1 : 3); // Sun / Tue
    } else {
      const week = Math.floor((num - 1) / 3);
      const dayInWeek = (num - 1) % 3;
      const days = [1, 3, 5]; // Sun, Tue, Thu
      dayOffset = week * 7 + days[dayInWeek];
    }
  }

  // BST is UTC+6
  const examDate = new Date(baseSat.getTime() + dayOffset * 24 * 60 * 60 * 1000);
  const yr = examDate.getUTCFullYear();
  const mon = examDate.getUTCMonth();
  const dt = examDate.getUTCDate();

  const startUtc = new Date(Date.UTC(yr, mon, dt, startHourBst - 6, startMinuteBst, 0));
  const endUtc = new Date(Date.UTC(yr, mon, dt, endHourBst - 6, endMinuteBst, 0));

  return {
    start_time: startUtc.toISOString(),
    end_time: endUtc.toISOString(),
  };
}

async function run() {
  console.log('🔄 Starting Live Exam Rescheduling according to new Weekly Batch Plan...');

  const { data: exams, error } = await supabase
    .from('live_exams')
    .select('id, title, category, exam_id')
    .in('category', ['medical', 'engineering', 'varsity']);

  if (error || !exams) {
    console.error('Error fetching exams:', error);
    return;
  }

  console.log(`Found ${exams.length} exams across Medical, Engineering, and Varsity.`);

  let updatedCount = 0;
  for (const exam of exams) {
    const { start_time, end_time } = getExamSchedule(exam.category, exam.title);

    const { error: updateErr } = await supabase
      .from('live_exams')
      .update({
        start_time,
        end_time,
        is_leaderboard_published: false,
        is_answer_published: false,
        status: 'published',
      })
      .eq('id', exam.id);

    if (updateErr) {
      console.error(`❌ Failed to update ${exam.title}:`, updateErr.message);
    } else {
      updatedCount++;
    }
  }

  console.log(`\n✅ Successfully rescheduled ${updatedCount} live exams!`);
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
