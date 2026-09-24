import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function audit() {
  console.log('🔍 Starting comprehensive database audit of questions table...');

  let page = 0;
  const pageSize = 1000;
  let totalScanned = 0;

  const stats = {
    emptyQuestion: 0,
    htmlInQuestion: 0,
    nullOptions: 0,
    optionsLengthNot4: 0,
    emptyOptionsInside: 0,
    duplicateOptions: 0,
    optionPrefixes: 0,
    invalidCorrectIndices: 0,
    outOfBoundsIndices: 0,
    emptyExplanation: 0,
    placeholderExplanation: 0,
    htmlInExplanation: 0,
    corruptedCharacters: 0,
    controlCharacters: 0,
  };

  const sampleIssues: Record<string, any[]> = {};
  function addSample(key: string, item: any) {
    if (!sampleIssues[key]) sampleIssues[key] = [];
    if (sampleIssues[key].length < 3) sampleIssues[key].push(item);
  }

  while (true) {
    const { data: qRows } = await supabase
      .from('questions')
      .select('id, question, options, correct_answer_indices, explanation, subject, chapter, topic')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (!qRows || qRows.length === 0) break;

    for (const q of qRows) {
      totalScanned++;

      // 1. Question text checks
      const qText = q.question?.trim() || '';
      if (!qText) {
        stats.emptyQuestion++;
        addSample('emptyQuestion', { id: q.id, subject: q.subject });
      }
      if (/&nbsp;|&amp;|&lt;|&gt;|&#39;|&quot;|<[a-z][\s\S]*>/i.test(qText)) {
        stats.htmlInQuestion++;
        addSample('htmlInQuestion', { id: q.id, question: qText.slice(0, 80) });
      }

      // Check corrupted control characters like \u0008, \u000b, \u0007
      if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(qText)) {
        stats.controlCharacters++;
        addSample('controlCharacters', { id: q.id, question: qText.slice(0, 80) });
      }

      // Check corrupted Bengali characters (e.g. 'অ্যাও', 'ম্যাও', 'ইনহেরিট্যাও্স')
      if (/[অআইঈউঊঋএঐওঔক-হ]্যাও/.test(qText)) {
        stats.corruptedCharacters++;
        addSample('corruptedCharacters', { id: q.id, question: qText.slice(0, 80) });
      }

      // 2. Options checks
      const opts = q.options;
      if (!Array.isArray(opts) || opts.length === 0) {
        stats.nullOptions++;
        addSample('nullOptions', { id: q.id, subject: q.subject });
      } else {
        if (opts.length !== 4) {
          stats.optionsLengthNot4++;
          addSample('optionsLengthNot4', { id: q.id, len: opts.length, opts });
        }
        const strOpts = opts.map((o) => String(o ?? '').trim());
        if (strOpts.some((o) => !o || o === 'null' || o === 'undefined')) {
          stats.emptyOptionsInside++;
          addSample('emptyOptionsInside', { id: q.id, opts });
        }
        const uniqueSet = new Set(strOpts);
        if (uniqueSet.size < strOpts.length) {
          stats.duplicateOptions++;
          addSample('duplicateOptions', { id: q.id, opts });
        }
        if (strOpts.some((o) => /^(?:\([ক-ঘa-dA-D1-4]\)|[ক-ঘa-dA-D1-4][\.\:\-\)])\s+/.test(o))) {
          stats.optionPrefixes++;
          addSample('optionPrefixes', { id: q.id, opts });
        }

        // 3. Correct Answer Indices checks
        const cIdxs = q.correct_answer_indices;
        if (!Array.isArray(cIdxs) || cIdxs.length === 0) {
          stats.invalidCorrectIndices++;
          addSample('invalidCorrectIndices', { id: q.id, cIdxs });
        } else {
          for (const idx of cIdxs) {
            if (typeof idx !== 'number' || idx < 0 || idx >= opts.length) {
              stats.outOfBoundsIndices++;
              addSample('outOfBoundsIndices', { id: q.id, idx, optsLen: opts.length, opts });
              break;
            }
          }
        }
      }

      // 4. Explanation checks
      const exp = q.explanation?.trim() || '';
      if (!exp) {
        stats.emptyExplanation++;
      } else if (
        ['null', 'undefined', 'n/a', 'none', 'no explanation', 'সঠিক উত্তর পাঠ্যবই অনুযায়ী নিশ্চিত করা হয়েছে।'].includes(
          exp.toLowerCase(),
        )
      ) {
        stats.placeholderExplanation++;
      }
      if (/&nbsp;|&amp;|&lt;|&gt;|&#39;|&quot;|<[a-z][\s\S]*>/i.test(exp)) {
        stats.htmlInExplanation++;
        addSample('htmlInExplanation', { id: q.id, exp: exp.slice(0, 80) });
      }
    }
    page++;
    if (page % 10 === 0) {
      console.log('Audited ' + totalScanned + ' questions...');
    }
  }

  console.log('\n📊 AUDIT SUMMARY (Scanned: ' + totalScanned + ' questions):');
  console.log(JSON.stringify(stats, null, 2));

  console.log('\n🔍 SAMPLE ISSUES:');
  for (const [k, v] of Object.entries(sampleIssues)) {
    console.log('\n--- ' + k + ' (' + stats[k as keyof typeof stats] + ' occurrences) ---');
    console.log(JSON.stringify(v, null, 2));
  }
}

audit().catch(console.error);
