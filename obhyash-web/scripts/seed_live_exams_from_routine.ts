import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

const SPREADSHEET_ID = '1b9YeiVz89q0dSisDg1kpK8peO-FA6G9Y4K4UVQ7Tvug';

interface SheetConfig {
  sheetName: string;
  category: 'medical' | 'engineering' | 'varsity';
  prefix: string;
  nameLabel: string;
}

const TRACKS: SheetConfig[] = [
  {
    sheetName: 'Medical',
    category: 'medical',
    prefix: 'med',
    nameLabel: 'Medical',
  },
  {
    sheetName: 'Engineering',
    category: 'engineering',
    prefix: 'engg',
    nameLabel: 'Engineering',
  },
  {
    sheetName: 'Varsity_A',
    category: 'varsity',
    prefix: 'varsity',
    nameLabel: 'Varsity',
  },
];

function toEnglishDigits(str: string): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(bn[i], i.toString());
  }
  return result;
}

function parseDateToIso(rawFormatted: string, rawVal: any, timeHour: number = 20, timeMinute: number = 0): string {
  // If rawVal is Date(2026,9,4)
  if (typeof rawVal === 'string' && rawVal.startsWith('Date(')) {
    const parts = rawVal.replace('Date(', '').replace(')', '').split(',').map((x) => parseInt(x.trim(), 10));
    // parts[0]=year, parts[1]=month(0-indexed), parts[2]=day
    return new Date(Date.UTC(parts[0], parts[1], parts[2], timeHour - 6, timeMinute, 0)).toISOString();
  }
  // If month names like "04 Oct 2026"
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  const m = rawFormatted.match(/(\d+)\s+([A-Za-z]+)\s+(\d{4})/);
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = months[m[2].toLowerCase().substring(0, 3)] ?? 9;
    const yr = parseInt(m[3], 10);
    return new Date(Date.UTC(yr, mon, day, timeHour - 6, timeMinute, 0)).toISOString();
  }
  return new Date().toISOString();
}

function formatExamTitle(rawExamName: string, nameLabel: string): { title: string; examCode: string } {
  // rawExamName: "Med Live 01", "Med Weekly Mega 01", "Med Final Mock 01"
  // "Engg Live 01", "Engg Weekly Mega 01"
  // "DU-A Live 01", "DU-A Weekly Mega 01", "DU-A Mega Mock 01"
  const clean = rawExamName.trim();
  const numMatch = clean.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 1;
  const numStr = num.toString();

  let typePrefix = 'Daily Exam';
  let codeType = 'live';

  if (clean.toLowerCase().includes('weekly') || clean.toLowerCase().includes('mega 0') || clean.toLowerCase().includes('mega 1')) {
    typePrefix = 'Weekly Exam';
    codeType = 'weekly';
  } else if (clean.toLowerCase().includes('mock') || clean.toLowerCase().includes('final')) {
    typePrefix = nameLabel === 'Varsity' ? 'Mega Exam' : 'Final Mock';
    codeType = nameLabel === 'Varsity' ? 'mega' : 'mock';
  }

  const title = `${nameLabel} ${typePrefix} - ${numStr}`;
  const examCode = `${nameLabel.toLowerCase()}_${codeType}_${num.toString().padStart(2, '0')}`;

  return { title, examCode };
}

async function fetchGoogleSheetRows(sheetName: string) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const text = await res.text();
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  const jsonStr = text.substring(startIdx, endIdx + 1);
  const data = JSON.parse(jsonStr);
  return data?.table?.rows || [];
}

async function seedExams() {
  console.log('🚀 Starting Automated Live Exam Routine Seeder...\n');

  let totalInserted = 0;

  for (const track of TRACKS) {
    console.log(`\n📂 Fetching ${track.sheetName} (${track.category})...`);
    const rows = await fetchGoogleSheetRows(track.sheetName);
    console.log(`   Found ${rows.length} rows.`);

    for (let i = 0; i < rows.length; i++) {
      const c = rows[i]?.c;
      if (!Array.isArray(c) || c.length === 0) continue;

      const rawDate = (c[0]?.f ?? c[0]?.v ?? '').toString().trim();
      const rawDay = (c[1]?.v ?? '').toString().trim();
      const rawExamName = (c[2]?.v ?? '').toString().trim();
      const rawSubject = (c[3]?.v ?? '').toString().trim();
      let rawSyllabus = (c[4]?.v ?? '').toString().trim();
      const rawMarksTime = (c[5]?.v ?? '').toString().trim();

      if (!rawDate && !rawExamName) continue;

      // Auto-enrich Medical GK & English
      if (rawExamName.includes('Med Live 02') && !rawSyllabus.includes('Articles')) {
        rawSyllabus = rawSyllabus.replace('English: Noun, Pronoun', 'English: Noun, Pronoun, Articles & Determiners');
      } else if (rawExamName.includes('Med Live 05') && !rawSyllabus.includes('Group Verbs')) {
        rawSyllabus = rawSyllabus.replace('English: Preposition', 'English: Appropriate Preposition, Group Verbs');
      } else if (rawExamName.includes('Med Live 10') && !rawSyllabus.includes('ক্ষুদ্র নৃগোষ্ঠী')) {
        rawSyllabus = rawSyllabus.replace('ভৌগোলিক পরিচিতি ও নদ-নদী', 'ভৌগোলিক পরিচিতি, ক্ষুদ্র নৃগোষ্ঠী ও নদ-নদী');
      }

      // Parse marks & time
      let totalMarks = 50;
      let durationMinutes = 30;

      const marksMatch = rawMarksTime.match(/(\d+|[০-৯]+)\s*(?:মার্কস|নম্বর)/);
      if (marksMatch) {
        totalMarks = parseInt(toEnglishDigits(marksMatch[1]), 10) || 50;
      }
      const timeMatch = rawMarksTime.match(/(\d+|[০-৯]+)\s*(?:মিনিট|ঘণ্টা)/);
      if (timeMatch) {
        if (rawMarksTime.includes('ঘণ্টা')) {
          durationMinutes = 60;
        } else {
          durationMinutes = parseInt(toEnglishDigits(timeMatch[1]), 10) || 30;
        }
      }

      const { title, examCode } = formatExamTitle(rawExamName, track.nameLabel);

      // Start Time: 8:00 PM BST (14:00 UTC)
      // End Time: 11:00 PM BST (17:00 UTC)
      const rawDateVal = c[0]?.v;
      const startTimeIso = parseDateToIso(rawDate, rawDateVal, 20, 0);
      const endTimeIso = parseDateToIso(rawDate, rawDateVal, 23, 0);

      const description = `বিষয়: ${rawSubject}\nসিলেবাস: ${rawSyllabus}`;

      const examPayload = {
        exam_id: examCode,
        category: track.category,
        title,
        description,
        start_time: startTimeIso,
        end_time: endTimeIso,
        duration_minutes: durationMinutes,
        total_marks: totalMarks,
        negative_marking: 0.25,
        status: 'published',
        is_leaderboard_published: true,
        is_answer_published: false,
      };

      const { data, error } = await supabase
        .from('live_exams')
        .upsert(examPayload, { onConflict: 'exam_id' })
        .select('id, title, exam_id');

      if (error) {
        console.error(`   ❌ Failed to insert [${examCode}]:`, error.message);
      } else {
        totalInserted++;
        console.log(`   ✅ [${data[0]?.exam_id}] ${data[0]?.title} (${rawDate})`);
      }
    }
  }

  console.log(`\n🎉 DONE! Total ${totalInserted} live exams created and ready in database.`);
}

seedExams().catch((err) => {
  console.error('Fatal error running seeder:', err);
  process.exit(1);
});
