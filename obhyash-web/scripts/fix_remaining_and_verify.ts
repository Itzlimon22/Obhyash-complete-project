import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function cleanRemaining() {
  console.log('🧹 Cleaning Remaining Questions...');

  // 1. Quarantine all remaining OCR errors and syllabus cards and empty questions
  const bogusIdsToQuarantine = [
    '58a7f9da-1b9c-4eb7-9e13-155b66af8387', // Empty question demo upload
    '64f79aec-d5e0-4dbc-80f4-41696c07964c', // OCR failure
    'f9acf5f7-2ecf-4e8f-ab83-47cf5a6c66c8', // OCR failure
    '1cb0946a-87e0-41da-a2d1-f62ec90592e4', // OCR failure
    '5b64ddd9-2c31-4bd8-8df5-bd4031067dbf', // OCR failure
    '2ba34aac-17d3-472d-a32e-24dc728e2024', // Syllabus card
    '5d7afe1e-5260-4014-99a0-bbfa8b7df9fe', // Syllabus card
  ];

  const { error: qErr } = await supabase
    .from('questions')
    .update({
      status: 'Quarantined',
      is_quarantined: true,
      quarantine_reason: 'Invalid question text / OCR error / Demo upload / Syllabus card',
    })
    .in('id', bogusIdsToQuarantine);

  if (qErr) {
    console.error('Error quarantining targeted bogus rows:', qErr);
  } else {
    console.log(`✅ Quarantined ${bogusIdsToQuarantine.length} remaining bogus/OCR/syllabus rows.`);
  }

  // 2. Fill empty explanations for legitimate questions
  const emptyExpFixes = [
    {
      id: '37bf18f0-b690-41a2-9305-531e86ef8dda',
      explanation: 'একটি নিবেশনের ভেদাঙ্ক নির্ণয়ের সংক্ষিপ্ত পদ্ধতির সূত্র: $\\sigma^2 = \\frac{\\sum f_i d_i^2}{N} - \\left(\\frac{\\sum f_i d_i}{N}\\right)^2 \\times c^2$। সঠিক উত্তর পাঠ্যবই অনুযায়ী নিশ্চিত করা হয়েছে।',
    },
    {
      id: 'c36cdae0-da88-49e4-a5a5-f495dead1798',
      explanation: 'প্রোটিন অণুতে অ্যামিনো এসিডসমূহ পেপটাইড বন্ধন (-CO-NH-) সমযোজী গ্রুপের মাধ্যমে পরস্পর যুক্ত হয়ে প্রধান ব্যাকবোন তৈরি করে।',
    },
  ];

  for (const item of emptyExpFixes) {
    const { error: expErr } = await supabase
      .from('questions')
      .update({ explanation: item.explanation })
      .eq('id', item.id);
    if (!expErr) {
      console.log(`✅ Filled accurate explanation for question ${item.id}`);
    } else {
      console.error(`Error updating explanation for ${item.id}:`, expErr);
    }
  }

  // 3. Fix all remaining questions with duplicate option penalty
  console.log('\nScanning for remaining questions with duplicate options penalty...');
  let from = 0;
  const dupFixes: { id: string; correct_answer_indices: number[] }[] = [];

  while (true) {
    const { data } = await supabase
      .from('questions')
      .select('id, options, correct_answer_indices')
      .eq('status', 'Approved')
      .range(from, from + 999);

    if (!data || data.length === 0) break;

    for (const q of data) {
      const opts = q.options;
      if (Array.isArray(opts) && Array.isArray(q.correct_answer_indices) && q.correct_answer_indices.length > 0) {
        const correctTexts = q.correct_answer_indices.map((idx: number) => String(opts[idx] ?? '').trim());
        const allCorrectIndices = new Set<number>(q.correct_answer_indices);

        opts.forEach((opt: any, idx: number) => {
          const optStr = String(opt ?? '').trim();
          if (correctTexts.includes(optStr)) {
            allCorrectIndices.add(idx);
          }
        });

        if (allCorrectIndices.size > q.correct_answer_indices.length) {
          dupFixes.push({
            id: q.id,
            correct_answer_indices: Array.from(allCorrectIndices).sort((a, b) => a - b),
          });
        }
      }
    }
    from += 1000;
  }

  console.log(`Found ${dupFixes.length} questions needing duplicate correct option index update.`);
  for (const item of dupFixes) {
    await supabase
      .from('questions')
      .update({ correct_answer_indices: item.correct_answer_indices })
      .eq('id', item.id);
  }
  console.log(`✅ Updated all ${dupFixes.length} remaining questions with multi-correct duplicate indices.`);
}

cleanRemaining().catch(console.error);
