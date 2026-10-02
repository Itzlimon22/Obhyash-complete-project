import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function heal() {
  console.log('🩹 Healing the 4 minor LaTeX typos in DB...');

  // 1. [R = \text{পৃথিবীর ব্যাসার্ধ] -> [R = \text{পৃথিবীর ব্যাসার্ধ}]
  const target1 = '[R = \\text{পৃথিবীর ব্যাসার্ধ]';
  const repl1 = '[R = \\text{পৃথিবীর ব্যাসার্ধ}]';

  const { data: rows1 } = await supabase
    .from('live_exam_questions')
    .select('id, question')
    .ilike('question', '%পৃথিবীর ব্যাসার্ধ]%');

  for (const r of rows1 || []) {
    if (r.question.includes(target1)) {
      const fixed = r.question.replaceAll(target1, repl1);
      await supabase.from('live_exam_questions').update({ question: fixed }).eq('id', r.id);
      console.log('✅ Fixed row 1:', r.id);
    }
  }

  // 2. \text{Ne, Ar, Kr, Xe, Rn$ -> \text{Ne, Ar, Kr, Xe, Rn}$
  const target2 = '\\text{Ne, Ar, Kr, Xe, Rn$';
  const repl2 = '\\text{Ne, Ar, Kr, Xe, Rn}$';

  const { data: rows2 } = await supabase
    .from('live_exam_questions')
    .select('id, explanation')
    .ilike('explanation', '%Ne, Ar, Kr, Xe, Rn%');

  for (const r of rows2 || []) {
    if (r.explanation.includes(target2)) {
      const fixed = r.explanation.replaceAll(target2, repl2);
      await supabase.from('live_exam_questions').update({ explanation: fixed }).eq('id', r.id);
      console.log('✅ Fixed row 2:', r.id);
    }
  }

  // 3. \text{CH}_4:} & -> \text{CH}_4: &
  const target3 = '\\text{CH}_4:} &';
  const repl3 = '\\text{CH}_4: &';

  const { data: rows3 } = await supabase
    .from('live_exam_questions')
    .select('id, explanation')
    .ilike('explanation', '%স্ফুটনাঙ্ক নির্ভর করে%');

  for (const r of rows3 || []) {
    if (r.explanation.includes(target3)) {
      const fixed = r.explanation.replaceAll(target3, repl3);
      await supabase.from('live_exam_questions').update({ explanation: fixed }).eq('id', r.id);
      console.log('✅ Fixed row 3:', r.id);
    }
  }

  console.log('🎉 Done healing LaTeX typos.');
}

heal();
