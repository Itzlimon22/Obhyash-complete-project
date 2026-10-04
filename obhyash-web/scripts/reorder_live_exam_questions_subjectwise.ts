import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { BanglaNameHelper } from '../lib/bangla-name-helper';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('🚀 Starting subject-wise reordering for all live exams...');

  // 1. Fix missing diagram for "সমান ভর বিশিষ্ট তিনটি খণ্ড"
  const q1Diagram = 'https://pub-6560195307b14ca49f6f183b13bfa841.r2.dev/questions/physics_1st/chapter_০৪/phy1_ch4_2_pdf_p11_148_0_pad4.png';
  const { data: q1Matches } = await supabase
    .from('live_exam_questions')
    .select('id, question')
    .ilike('question', '%সমান ভর বিশিষ্ট তিনটি খণ্ড%');

  for (const row of q1Matches || []) {
    if (!row.question.includes(q1Diagram) && !row.question.includes('![চিত্র]')) {
      const updatedQ = `${row.question.trim()}\n\n![চিত্র](${q1Diagram})`;
      await supabase
        .from('live_exam_questions')
        .update({ question: updatedQ })
        .eq('id', row.id);
      console.log(`✅ Appended diagram to question id: ${row.id}`);
    }
  }

  // 2. Fetch all live exams
  const { data: exams, error: examsErr } = await supabase
    .from('live_exams')
    .select('id, exam_id, title')
    .order('created_at', { ascending: false });

  if (examsErr || !exams) {
    console.error('Failed to fetch exams:', examsErr);
    return;
  }

  console.log(`📋 Found ${exams.length} live exams to process.`);

  let updatedExamsCount = 0;

  for (const exam of exams) {
    const { data: qList, error: qErr } = await supabase
      .from('live_exam_questions')
      .select('id, serial, subject, question')
      .eq('live_exam_id', exam.id)
      .order('serial', { ascending: true });

    if (qErr || !qList || qList.length === 0) continue;

    // Check if reordering is needed
    const subjectGroups = new Map<string, typeof qList>();
    const subjectOrder: string[] = [];

    for (const q of qList) {
      const subKey = BanglaNameHelper.getMainSubjectName(q.subject || 'সাধারণ');
      if (!subjectGroups.has(subKey)) {
        subjectOrder.push(subKey);
        subjectGroups.set(subKey, []);
      }
      subjectGroups.get(subKey)!.push(q);
    }

    if (subjectOrder.length <= 1) {
      // Only 1 subject, nothing to interleave/reorder
      continue;
    }

    // Check if there was any interleaving
    let hasInterleaving = false;
    for (let i = 1; i < qList.length; i++) {
      const prevSub = BanglaNameHelper.getMainSubjectName(qList[i - 1].subject || 'সাধারণ');
      const currSub = BanglaNameHelper.getMainSubjectName(qList[i].subject || 'সাধারণ');
      if (prevSub !== currSub) {
        // If we switch to currSub, ensure prevSub never appears again later
        for (let j = i + 1; j < qList.length; j++) {
          if (BanglaNameHelper.getMainSubjectName(qList[j].subject || 'সাধারণ') === prevSub) {
            hasInterleaving = true;
            break;
          }
        }
      }
      if (hasInterleaving) break;
    }

    if (!hasInterleaving) {
      // Already clean blocks per subject
      continue;
    }

    // Re-order questions so each subject is contiguous
    const reordered: typeof qList = [];
    for (const subKey of subjectOrder) {
      reordered.push(...subjectGroups.get(subKey)!);
    }

    // Update serial numbers in DB
    const updates = reordered.map((q, idx) => ({
      id: q.id,
      serial: idx + 1,
    }));

    for (const u of updates) {
      await supabase
        .from('live_exam_questions')
        .update({ serial: u.serial })
        .eq('id', u.id);
    }

    updatedExamsCount++;
    console.log(`✅ Exam [${exam.exam_id || exam.id.slice(0, 8)}] "${exam.title}": Reordered ${reordered.length} questions into ${subjectOrder.length} clean subject groups (${subjectOrder.join(', ')}).`);
  }

  console.log(`\n🎉 Successfully completed! Updated ${updatedExamsCount} exams to be grouped subject-wise.`);
}

run();
