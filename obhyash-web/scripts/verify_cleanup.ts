import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function verify() {
  console.log('🔍 Running Post-Cleanup Database Verification...');

  // 1. Quarantined count
  const { count: qCount } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'Quarantined');
  console.log('Total questions with status = Quarantined:', qCount);

  // 2. Active OCR failures
  const { data: ocr1 } = await supabase
    .from('questions')
    .select('id, question, options, status')
    .eq('status', 'Approved')
    .ilike('question', '%কোনো প্রশ্ন নেই%');
  console.log('Active OCR failure questions ("কোনো প্রশ্ন নেই"):', ocr1?.length ?? 0);

  const { data: ocr2 } = await supabase
    .from('questions')
    .select('id, question, options, status')
    .eq('status', 'Approved')
    .ilike('question', '%প্রদত্ত পৃষ্ঠায়%');
  console.log('Active OCR failure questions ("প্রদত্ত পৃষ্ঠায়"):', ocr2?.length ?? 0);

  // 3. Active syllabus cards
  let from = 0;
  let remainingSyllabus = 0;
  while (true) {
    const { data } = await supabase
      .from('questions')
      .select('id, options, status')
      .eq('status', 'Approved')
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    for (const r of data) {
      if (Array.isArray(r.options) && r.options.some((o: any) => /MAT:|DAT:/i.test(String(o)))) {
        remainingSyllabus++;
        console.log('Remaining active syllabus card:', r.id, r.options);
      }
    }
    from += 1000;
  }
  console.log('Remaining active syllabus cards with MAT/DAT:', remainingSyllabus);

  // 4. Duplicate option penalty check
  from = 0;
  let remainingDupPenalties = 0;
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
          if (correctTexts.includes(String(opt ?? '').trim())) {
            allCorrectIndices.add(idx);
          }
        });
        if (allCorrectIndices.size > q.correct_answer_indices.length) {
          remainingDupPenalties++;
        }
      }
    }
    from += 1000;
  }
  console.log('Remaining active questions with duplicate option penalty:', remainingDupPenalties);

  // 5. Empty explanations check
  const { count: emptyExpCount } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'Approved')
    .or('explanation.is.null,explanation.eq.""');
  console.log('Active questions with null or empty explanation:', emptyExpCount);
}

verify().catch(console.error);
