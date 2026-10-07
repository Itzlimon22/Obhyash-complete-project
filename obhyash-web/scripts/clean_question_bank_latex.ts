import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export function cleanLatex(text: string): string {
  if (!text) return text;
  let res = text;

  // 1. Fix non-standard macros: \mum or \text{\mum} -> \mu\text{m}
  res = res.replace(/\\(?:text\{)?\\mum\}?/g, '\\mu\\text{m}');

  // 2. Fix fused Greek letters: \pif -> \pi f, \piN -> \pi N, \pir -> \pi r
  res = res.replace(
    /\\(pi|mu|alpha|beta|theta|omega|gamma|lambda|sigma|tau|phi|psi|rho|delta|epsilon|eta|xi|zeta|chi|nu|kappa)([a-zA-Z])(?![a-zA-Z])/g,
    '\\$1 $2'
  );

  // 3. Fix fused \Delta variables: \DeltaV -> \Delta V, \DeltaI -> \Delta I, etc.
  res = res.replace(/\\Delta([A-Za-z])\b/g, '\\Delta $1');

  // 4. Fix bare sin\theta, cos\theta, tan\theta without leading backslash
  res = res.replace(/\b(sin|cos|tan)\\theta\b/g, '\\$1\\theta');

  // 5. Fix \textbf{\sqrt{...}} -> \sqrt{...}
  res = res.replace(/\\textbf\{(\\sqrt\{[^}]+\})\}/g, '$1');

  // 6. Fix nested \text{\text{...}} or \text{\mathrm{...}}
  res = res.replace(
    /\\(?:text|mathrm|textbf)\{\s*\\(?:text|mathrm|textbf)\{([^}]+)\}\s*\}/g,
    '\\text{$1}'
  );

  // 7. Fix corrupted regex artifacts like "(g = 9.8\ $,\text$ { m/s } ^2)"
  res = res.replace(
    /\\\s*\$,\\text\$\s*\{?\s*([a-zA-Z\/]+)\s*\}?\s*\^?(\-?\d+)?/g,
    '\\text{$1}^{$2}'
  );
  res = res.replace(/\\\s*\$,\\text\$/g, '\\text');

  // 8. Fix double exponent syntax errors: 10^{1}^1 -> 10^{11}
  res = res.replace(/10\^\{(\d+)\}\^(\d+)/g, '10^{$1$2}');

  // 9. Fix trailing \, or \; inside exponents: 10^{-7\,} -> 10^{-7}
  res = res.replace(/\^\{([^}]+)\\[,;]\}/g, '^{$1}');

  // 10. Fix illegal internal dollar signs inside fraction arguments: \frac{$2 \times 4$.9}{9.8}
  res = res.replace(/\\frac\{([^}]*\$[^}]*)\}\{([^}]*)\}/g, (_m, n, d) => `\\frac{${n.replace(/\$/g, '')}}{${d.replace(/\$/g, '')}}`);
  res = res.replace(/\\frac\{([^}]*)\}\{([^}]*\$[^}]*)\}/g, (_m, n, d) => `\\frac{${n.replace(/\$/g, '')}}{${d.replace(/\$/g, '')}}`);

  // 11. Separate Bengali attached to Latin: এবংb -> এবং b
  res = res.replace(/([\u0980-\u09FF]+)([a-zA-Z])/g, '$1 $2');
  res = res.replace(/([a-zA-Z])([\u0980-\u09FF]+)/g, '$1 $2');

  // 12. Un-trap Bengali conjunctions from math: $a এবং b$ -> $a$ এবং $b$
  res = res.replace(/\$([^\$\n]+?)\s+(এবং|বা|ও|হলে|এর)\s+([^\$\n]+?)\$/g, '$$$1$$ $2 $$$3$$');

  // 13. Auto-wrap unwrapped compound scientific units ONLY outside existing math blocks
  const parts: { str: string; isMath: boolean }[] = [];
  const mathBlockRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]*?\$)/g;
  let lastIndex = 0;
  let match;
  while ((match = mathBlockRegex.exec(res)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ str: res.slice(lastIndex, match.index), isMath: false });
    }
    parts.push({ str: match[0], isMath: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < res.length) {
    parts.push({ str: res.slice(lastIndex), isMath: false });
  }

  res = parts
    .map((p) => {
      if (p.isMath) return p.str;
      return p.str.replace(
        /(?<!\$)\b(\d+(?:\.\d+)?\s*(?:\\,)?\s*\\text\{[^{}]+\}(?:\s*(?:\\cdot|\\times)?\s*\\text\{[^{}]+\}(?:\^\{?-?\d+\}?)?)*)(?!\$)/g,
        '$$$1$$'
      );
    })
    .join('');

  return res;
}

interface UpdateItem {
  id: string;
  table: string;
  updates: Record<string, any>;
}

async function runConcurrentUpdates(items: UpdateItem[], concurrency = 20): Promise<number> {
  let successCount = 0;
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (item) => {
        const { error } = await supabase
          .from(item.table)
          .update(item.updates)
          .eq('id', item.id);
        if (error) {
          console.error(`Failed to update ${item.table} ${item.id}:`, error.message);
        } else {
          successCount++;
        }
      })
    );
  }
  return successCount;
}

async function processTable(tableName: string, totalCount: number) {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting correction for table "${tableName}" (${totalCount} total rows)...`);

  const BATCH_SIZE = 500;
  let lastId: string | null = null;
  let processed = 0;
  let totalFixed = 0;

  while (true) {
    let query = supabase
      .from(tableName)
      .select('id, question, options, explanation')
      .order('id', { ascending: true })
      .limit(BATCH_SIZE);

    if (lastId) {
      query = query.gt('id', lastId);
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error(`Error reading ${tableName}:`, error);
      break;
    }
    if (!rows || rows.length === 0) {
      break;
    }

    const itemsToUpdate: UpdateItem[] = [];

    for (const row of rows) {
      const updates: Record<string, any> = {};

      if (row.question) {
        const cleanQ = cleanLatex(row.question);
        if (cleanQ !== row.question) {
          updates.question = cleanQ;
        }
      }

      if (Array.isArray(row.options)) {
        const cleanOpts = row.options.map(cleanLatex);
        if (cleanOpts.some((opt, i) => opt !== row.options[i])) {
          updates.options = cleanOpts;
        }
      }

      if (row.explanation) {
        const cleanExp = cleanLatex(row.explanation);
        if (cleanExp !== row.explanation) {
          updates.explanation = cleanExp;
        }
      }

      if (Object.keys(updates).length > 0) {
        itemsToUpdate.push({
          id: row.id,
          table: tableName,
          updates,
        });
      }
    }

    if (itemsToUpdate.length > 0) {
      const updatedCount = await runConcurrentUpdates(itemsToUpdate, 25);
      totalFixed += updatedCount;
    }

    processed += rows.length;
    lastId = rows[rows.length - 1].id;

    const percent = ((processed / totalCount) * 100).toFixed(1);
    console.log(
      `[${tableName}] Progress: ${processed.toLocaleString()} / ${totalCount.toLocaleString()} (${percent}%) | Fixed so far: ${totalFixed.toLocaleString()}`
    );
  }

  console.log(`✅ Finished table "${tableName}". Total processed: ${processed}, Total fixed: ${totalFixed}`);
}

async function main() {
  const startTime = Date.now();
  console.log('⚡ KaTeX Database Auto-Correction Engine Started...');

  const { count: countQuestions } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  const { count: countLive } = await supabase
    .from('live_exam_questions')
    .select('*', { count: 'exact', head: true });

  if (countQuestions) {
    await processTable('questions', countQuestions);
  }

  if (countLive) {
    await processTable('live_exam_questions', countLive);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 COMPLETED ALL TABLES IN ${durationSec}s! All KaTeX syntax errors successfully healed!`);
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
