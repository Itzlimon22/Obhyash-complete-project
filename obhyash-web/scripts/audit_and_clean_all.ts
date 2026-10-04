import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function auditAndCleanAll() {
  console.log('Fetching all live_exam_questions from Supabase...');
  const { data: questions, error } = await supabase
    .from('live_exam_questions')
    .select('id, live_exam_id, serial, question, explanation, options');

  if (error || !questions) {
    console.error('Failed to fetch questions:', error);
    return;
  }

  console.log(`Auditing ${questions.length} questions across all exams...`);
  let fixedCount = 0;

  for (const q of questions) {
    let changed = false;
    let newQ = q.question || '';
    let newExp = q.explanation || '';
    let newOpts = Array.isArray(q.options) ? [...q.options] : q.options;

    // 1. Clean control chars: \t, \f, \r, \b in question
    if (/\t(imes|ext|au|heta|infty)/.test(newQ) || /\f(rac)/.test(newQ) || /\r(ight)/.test(newQ) || /\bzsh\./.test(newQ)) {
      newQ = newQ
        .replace(/\t(imes|ext|au|heta|infty)/g, '\\$1')
        .replace(/\f(rac)/g, '\\$1')
        .replace(/\r(ight)/g, '\\$1')
        .replace(/\bzsh\./g, '0.');
      changed = true;
    }

    // 2. Clean control chars & trailing separators in explanation
    if (
      /\t(imes|ext|au|heta|infty)/.test(newExp) ||
      /\f(rac)/.test(newExp) ||
      /\r(ight)/.test(newExp) ||
      /\bzsh\./.test(newExp) ||
      /---+[ \t]*$/.test(newExp.trim()) ||
      /9029/.test(newExp)
    ) {
      newExp = newExp
        .replace(/\t(imes|ext|au|heta|infty)/g, '\\$1')
        .replace(/\f(rac)/g, '\\$1')
        .replace(/\r(ight)/g, '\\$1')
        .replace(/\bzsh\./g, '0.')
        .replace(/9029/g, '')
        .replace(/\n*---+[ \t]*\n*$/g, '')
        .trim();
      changed = true;
    }

    // 3. Clean options if string array
    if (Array.isArray(newOpts)) {
      for (let i = 0; i < newOpts.length; i++) {
        if (typeof newOpts[i] === 'string') {
          let opt = newOpts[i];
          if (/\t(imes|ext|au|heta|infty)/.test(opt) || /\f(rac)/.test(opt) || /\r(ight)/.test(opt) || /\bzsh\./.test(opt)) {
            newOpts[i] = opt
              .replace(/\t(imes|ext|au|heta|infty)/g, '\\$1')
              .replace(/\f(rac)/g, '\\$1')
              .replace(/\r(ight)/g, '\\$1')
              .replace(/\bzsh\./g, '0.');
            changed = true;
          }
        }
      }
    }

    if (changed) {
      const { error: updErr } = await supabase
        .from('live_exam_questions')
        .update({
          question: newQ,
          explanation: newExp,
          options: newOpts
        })
        .eq('id', q.id);

      if (updErr) {
        console.error(`Error updating Q ID ${q.id}:`, updErr.message);
      } else {
        fixedCount++;
      }
    }
  }

  console.log(`✅ Audit complete! Total questions sanitized and updated: ${fixedCount}`);
}

auditAndCleanAll().catch(console.error);
