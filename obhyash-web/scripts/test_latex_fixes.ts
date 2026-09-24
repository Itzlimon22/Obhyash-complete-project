import { createClient } from '@supabase/supabase-js';
import katex from 'katex';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function testLatex(expr: string): boolean {
  try {
    katex.renderToString(expr, { throwOnError: true, strict: false });
    return true;
  } catch {
    return false;
  }
}

// Comprehensive LaTeX Sanitizer Pipeline
export function sanitizeLatex(input: string): string {
  let s = input;

  // 1. Fix over-escaped double backslashes in math commands e.g. ^\\circ -> ^\circ, \\Delta -> \Delta
  s = s.replace(/\\\\(circ|Delta|alpha|beta|gamma|theta|mu|pi|times|frac|sqrt|text|pm|to|rightarrow|approx|ne|leq|geq|infty)/g, '\\$1');

  // 2. Unpack Greek and math symbols incorrectly enclosed in \text{...}
  s = s.replace(/\\text\{\s*\\(Omega|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi)\s*\}/g, '\\$1');

  // 3. Unpack math expressions inside \text{...} that contain \pi or math operators e.g. \text{\pi r/v} -> \pi r/v
  s = s.replace(/\\text\{\s*\\pi\s*([^}]*)\}/g, '\\pi $1');

  // 4. Fix units with exponents inside \text{...} e.g. \text{L^-}, \text{L^-1}, \text{s^-1}, \text{m s^-2}
  s = s.replace(/\\text\{([A-Za-z]+)\^([-\d]+)\}/g, '\\text{$1}^{$2}');
  s = s.replace(/\\text\{([A-Za-z]+)\^-\}/g, '\\text{$1}^{-}');
  s = s.replace(/\\text\{([A-Za-z\s]+)\^([-\d]+)\}/g, '\\text{$1}^{$2}');

  // 5. Fix \text{^\circ...} -> ^{\circ...}
  s = s.replace(/\\text\{\s*\^\\circ\s*([A-Za-z]*)\s*\}/g, '^{\\circ}\\text{$1}');
  s = s.replace(/\\text\{\s*\^([^{}]+)\s*\}/g, '^{$1}');
  s = s.replace(/\\text\{\s*_([^{}]+)\s*\}/g, '_{$1}');

  // 6. Typo in physics/math questions e.g. \pier -> \pi r
  s = s.replace(/\\pier\b/g, '\\pi r');

  // 7. Stray carriage returns e.g. \r\rightleftharpoons or \r\rightarrow
  s = s.replace(/\\r\\(rightleftharpoons|rightarrow|leftarrow|leftrightharpoons)/g, '\\$1');

  // 8. Fix stray \&& -> \& or &&
  s = s.replace(/\\&&/g, '\\&\\&');

  // 9. Fix \text{B^-}1 -> B^{-1}
  s = s.replace(/\\text\{([A-Za-z]+)\^-\}([0-9]+)/g, '$1^{-$2}');

  // 10. Fix $14 x $1.66 -> $14 \times 1.66
  s = s.replace(/\$([0-9\.]+)\s*x\s*\$/gi, '$1 \\times ');

  // 11. Fix degree Celsius e.g. ^\circC -> ^\circ \text{C}
  s = s.replace(/\^\\circ([A-Z])/g, '^{\\circ}\\text{$1}');

  // 12. Fix empty \text{}
  s = s.replace(/\\text\{\s*\}/g, '');

  return s;
}

async function testFixes() {
  console.log('Testing Enhanced LaTeX fixes on sample of database...');
  let from = 0;
  let totalTested = 0;
  let brokenBefore = 0;
  let fixedAfter = 0;
  let stillBroken = 0;

  const stillBrokenSamples: any[] = [];

  while (from < 20000) {
    const { data: rows } = await supabase
      .from('questions')
      .select('id, question, options')
      .eq('status', 'Approved')
      .range(from, from + 999);

    if (!rows || rows.length === 0) break;

    for (const r of rows) {
      const items = [
        { field: 'question', val: r.question },
        ...(Array.isArray(r.options) ? r.options.map((o: any) => ({ field: 'option', val: String(o ?? '') })) : [])
      ];

      for (const item of items) {
        if (!item.val) continue;
        const matches = item.val.match(/\$([^\$\n]+?)\$/g) || [];
        for (const m of matches) {
          const rawExpr = m.slice(1, -1).trim();
          totalTested++;
          if (!testLatex(rawExpr)) {
            brokenBefore++;
            const sanitized = sanitizeLatex(rawExpr);
            if (testLatex(sanitized)) {
              fixedAfter++;
            } else {
              stillBroken++;
              if (stillBrokenSamples.length < 8) {
                stillBrokenSamples.push({ id: r.id, raw: rawExpr, sanitized });
              }
            }
          }
        }
      }
    }
    from += 1000;
  }

  console.log({
    totalMathTested: totalTested,
    brokenBefore,
    fixedAfter,
    recoveryRate: `${((fixedAfter / (brokenBefore || 1)) * 100).toFixed(1)}%`,
    stillBroken,
  });

  if (stillBrokenSamples.length > 0) {
    console.log('Sample still broken expressions:');
    console.log(JSON.stringify(stillBrokenSamples, null, 2));
  }
}

testFixes().catch(console.error);
