import { createClient } from '@supabase/supabase-js';
import katex from 'katex';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface LatexIssue {
  id: string;
  field: 'question' | 'option' | 'explanation';
  rawSnippet: string;
  mathExpression: string;
  errorMessage: string;
}

// Extract math blocks: $$...$$ or $...$
function extractMathBlocks(text: string): { expression: string; isDisplay: boolean }[] {
  const blocks: { expression: string; isDisplay: boolean }[] = [];
  if (!text) return blocks;

  // Match $$...$$
  let remaining = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    blocks.push({ expression: math.trim(), isDisplay: true });
    return ' ';
  });

  // Match $...$
  remaining.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    blocks.push({ expression: math.trim(), isDisplay: false });
    return ' ';
  });

  // Also check unwrapped LaTeX commands like \frac, \sqrt, \times
  if (blocks.length === 0) {
    if (/\\(?:frac|sqrt|times|cdot|vec|hat|bar|begin|circ|pm|rightarrow|to|alpha|beta|theta|lambda|mu|pi|omega|sum|int)\b/.test(text)) {
      blocks.push({ expression: text.trim(), isDisplay: false });
    }
  }

  return blocks;
}

function testLatex(expr: string): string | null {
  try {
    katex.renderToString(expr, {
      throwOnError: true,
      strict: false,
    });
    return null;
  } catch (err: any) {
    return err?.message || 'Unknown LaTeX error';
  }
}

async function auditLatex() {
  console.log('🔍 Starting comprehensive KaTeX audit on questions and options...');

  let from = 0;
  let totalChecked = 0;
  const issues: LatexIssue[] = [];
  const errorTypeCounts: Record<string, number> = {};

  while (true) {
    const { data: rows, error } = await supabase
      .from('questions')
      .select('id, question, options, explanation')
      .eq('status', 'Approved')
      .range(from, from + 999);

    if (error || !rows || rows.length === 0) break;

    for (const row of rows) {
      totalChecked++;

      // Check Question
      if (row.question) {
        const blocks = extractMathBlocks(row.question);
        for (const b of blocks) {
          const err = testLatex(b.expression);
          if (err) {
            issues.push({
              id: row.id,
              field: 'question',
              rawSnippet: row.question.slice(0, 100),
              mathExpression: b.expression,
              errorMessage: err,
            });
            const key = err.split(':')[0] || 'Unknown';
            errorTypeCounts[key] = (errorTypeCounts[key] || 0) + 1;
          }
        }
      }

      // Check Options
      if (Array.isArray(row.options)) {
        row.options.forEach((opt: any) => {
          if (typeof opt === 'string' && opt.trim()) {
            const blocks = extractMathBlocks(opt);
            for (const b of blocks) {
              const err = testLatex(b.expression);
              if (err) {
                issues.push({
                  id: row.id,
                  field: 'option',
                  rawSnippet: opt,
                  mathExpression: b.expression,
                  errorMessage: err,
                });
                const key = err.split(':')[0] || 'Unknown';
                errorTypeCounts[key] = (errorTypeCounts[key] || 0) + 1;
              }
            }
          }
        });
      }
    }

    from += 1000;
    if (from % 10000 === 0) {
      console.log(`Audited ${from} questions... Found ${issues.length} LaTeX issues so far.`);
    }
  }

  console.log(`\n📊 KaTeX Audit Complete! Checked: ${totalChecked} approved questions.`);
  console.log(`Total LaTeX issues found: ${issues.length}`);
  console.log('\nTop Error Types:');
  console.log(JSON.stringify(errorTypeCounts, null, 2));

  console.log('\nSample Issues (first 10):');
  console.log(JSON.stringify(issues.slice(0, 10), null, 2));
}

auditLatex().catch(console.error);
