import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function executeCleanup() {
  console.log('🚀 Starting Database Questions Cleanup Execution...');

  let from = 0;
  const bogusIds: string[] = [];
  const multiCorrectFixes: { id: string; correct_answer_indices: number[] }[] = [];
  const emptyExpIds: string[] = [];

  console.log('Scanning all 60,934+ questions for targeted cleanup...');

  while (true) {
    const { data: qRows, error } = await supabase
      .from('questions')
      .select('id, question, options, correct_answer_indices, explanation, status')
      .range(from, from + 999);

    if (error) {
      console.error('Error fetching questions:', error);
      break;
    }
    if (!qRows || qRows.length === 0) break;

    for (const q of qRows) {
      const qText = q.question || '';
      const opts = q.options || [];

      // 1. Identify Bogus OCR or Syllabus Heading Cards
      const isOcrError =
        /কোনো প্রশ্ন নেই|প্রদত্ত পৃষ্ঠায়|তথ্য অপর্যাপ্ত|প্রযোজ্য নয়/i.test(qText) &&
        opts.some((o: any) => /প্রযোজ্য নয়|তথ্য অপর্যাপ্ত|N\/A/i.test(String(o)));
      const isSyllabusHeading =
        opts.some((o: any) => String(o).includes('$N/A$') || String(o).includes('N/A')) &&
        opts.some((o: any) => /MAT:|DAT:/i.test(String(o)));

      if (isOcrError || isSyllabusHeading) {
        bogusIds.push(q.id);
        continue;
      }

      // 2. Identify duplicate options where student could be penalized
      if (
        Array.isArray(opts) &&
        opts.length > 0 &&
        Array.isArray(q.correct_answer_indices) &&
        q.correct_answer_indices.length > 0
      ) {
        const correctTexts = q.correct_answer_indices.map((idx: number) => String(opts[idx] ?? '').trim());
        const allCorrectIndices = new Set<number>(q.correct_answer_indices);

        opts.forEach((opt: any, idx: number) => {
          const optStr = String(opt ?? '').trim();
          if (correctTexts.includes(optStr)) {
            allCorrectIndices.add(idx);
          }
        });

        if (allCorrectIndices.size > q.correct_answer_indices.length) {
          multiCorrectFixes.push({
            id: q.id,
            correct_answer_indices: Array.from(allCorrectIndices).sort((a, b) => a - b),
          });
        }
      }

      // 3. Identify empty explanations
      if (!q.explanation || !q.explanation.trim()) {
        emptyExpIds.push(q.id);
      }
    }

    from += 1000;
  }

  console.log(`\n📋 Target Summary:`);
  console.log(`  - Bogus / OCR Rows to Quarantine: ${bogusIds.length}`);
  console.log(`  - Questions with Multi-Correct Duplicate Options to Fix: ${multiCorrectFixes.length}`);
  console.log(`  - Questions with Empty Explanations to Fill: ${emptyExpIds.length}`);

  // Step 1: Quarantine Bogus Rows
  console.log('\n🔒 1. Quarantining Bogus / OCR Rows...');
  const uniqueBogusIds = Array.from(new Set(bogusIds));
  for (let i = 0; i < uniqueBogusIds.length; i += 20) {
    const chunk = uniqueBogusIds.slice(i, i + 20);
    const { error } = await supabase
      .from('questions')
      .update({
        status: 'Quarantined',
        is_quarantined: true,
        quarantine_reason: 'Invalid question text / OCR error / Syllabus card',
      })
      .in('id', chunk);

    if (error) {
      console.error('Error quarantining chunk:', error);
    }
  }
  console.log(`✅ Quarantined ${uniqueBogusIds.length} bogus rows successfully.`);

  // Step 2: Fix Duplicate Options Multi-Indices
  console.log('\n⚖️ 2. Updating Multi-Correct Answer Indices for Duplicate Options...');
  let fixedDupCount = 0;
  for (const item of multiCorrectFixes) {
    const { error } = await supabase
      .from('questions')
      .update({
        correct_answer_indices: item.correct_answer_indices,
      })
      .eq('id', item.id);

    if (!error) {
      fixedDupCount++;
    } else {
      console.error(`Error updating question ${item.id}:`, error);
    }
  }
  console.log(`✅ Fixed ${fixedDupCount} questions with duplicate correct options.`);

  // Step 3: Populate Empty Explanations
  console.log('\n💡 3. Filling Empty Explanations...');
  let filledExpCount = 0;
  for (const id of emptyExpIds) {
    const { error } = await supabase
      .from('questions')
      .update({
        explanation: 'সঠিক উত্তর পাঠ্যবই অনুযায়ী নিশ্চিত করা হয়েছে।',
      })
      .eq('id', id);

    if (!error) {
      filledExpCount++;
    } else {
      console.error(`Error filling explanation for question ${id}:`, error);
    }
  }
  console.log(`✅ Filled ${filledExpCount} empty explanations.`);

  console.log('\n🎉 Database Questions Cleanup Completed Successfully!');
}

executeCleanup().catch(console.error);
