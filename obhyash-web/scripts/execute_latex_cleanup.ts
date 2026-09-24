import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export function sanitizeLatexString(text: string): string {
  if (!text) return text;
  let s = text;

  // 1. Fix nested dollars inside equations e.g. $f \propto \sqrt{$[\text{M}\text{L}]$}$
  s = s.replace(/(\$(?:[^\$\n]+))\$([^\$\n]+)\$((?:[^\$\n]+)\$)/g, '$1$2$3');

  // 2. Fix over-escaped double backslashes in common math commands e.g. ^\\circ -> ^\circ, \\Delta -> \Delta
  s = s.replace(
    /\\\\(circ|Delta|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|times|cdot|frac|sqrt|text|mathrm|pm|to|rightarrow|leftarrow|rightleftharpoons|approx|ne|leq|geq|infty|sum|int|partial|sim|propto|perp|parallel)\b/g,
    '\\$1',
  );

  // 3. Unpack Greek and math symbols incorrectly enclosed in \text{...}
  s = s.replace(
    /\\text\{\s*\\(Omega|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi)\s*\}/g,
    '\\$1',
  );

  // 4. Unpack math expressions inside \text{...} that contain \pi, \frac or math operators e.g. \text{\pi r/v} -> \pi r/v, \text{f\frac{M}{L}} -> f\frac{M}{L}
  s = s.replace(/\\text\{\s*([^}]*\\(?:pi|frac|sqrt|times|cdot|pm)[^}]*)\}/g, '$1');

  // 5. Fix units with exponents inside \text{...} e.g. \text{L^-1}, \text{s^-1}, \text{m s^-2}, \text{L^-}
  s = s.replace(/\\text\{([A-Za-z]+)\^([-\d]+)\}/g, '\\text{$1}^{$2}');
  s = s.replace(/\\text\{([A-Za-z]+)\^-\}/g, '\\text{$1}^{-}');
  s = s.replace(/\\text\{([A-Za-z\s]+)\^([-\d]+)\}/g, '\\text{$1}^{$2}');

  // 6. Fix subscript inside \text{} e.g. \text{y_m} -> y_m, \text{N_A} -> N_A
  s = s.replace(/\\text\{([A-Za-z]+)_([A-Za-z0-9]+)\}/g, '$1_{$2}');

  // 7. Fix \text{^\circ...} -> ^{\circ...}
  s = s.replace(/\\text\{\s*\^\\circ\s*([A-Za-z]*)\s*\}/g, '^{\\circ}\\text{$1}');
  s = s.replace(/\\text\{\s*\^([^{}]+)\s*\}/g, '^{$1}');
  s = s.replace(/\\text\{\s*_([^{}]+)\s*\}/g, '_{$1}');

  // 8. Typo in physics questions e.g. \pier -> \pi r
  s = s.replace(/\\pier\b/g, '\\pi r');

  // 9. Stray carriage returns in chemical reactions e.g. \r\rightleftharpoons or \r\rightarrow
  s = s.replace(/\\r\\(rightleftharpoons|rightarrow|leftarrow|leftrightharpoons)/g, '\\$1');

  // 10. Fix stray \&& -> \&\&
  s = s.replace(/\\&&/g, '\\&\\&');

  // 11. Fix \text{B^-}1 -> B^{-1}
  s = s.replace(/\\text\{([A-Za-z]+)\^-\}([0-9]+)/g, '$1^{-$2}');

  // 12. Fix $14 x $1.66 -> $14 \times 1.66
  s = s.replace(/\$([0-9\.]+)\s*x\s*\$/gi, '$1 \\times ');

  // 13. Fix degree Celsius e.g. ^\circC -> ^\circ \text{C}
  s = s.replace(/\^\\circ([A-Z])/g, '^{\\circ}\\text{$1}');

  // 14. Fix empty \text{}
  s = s.replace(/\\text\{\s*\}/g, '');

  return s;
}

async function executeLatexCleanup() {
  console.log('🚀 Starting Database LaTeX Normalization across all questions...');

  let from = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;
  const updatesQueue: { id: string; question?: string; options?: any[]; explanation?: string }[] = [];

  while (true) {
    const { data: rows, error } = await supabase
      .from('questions')
      .select('id, question, options, explanation')
      .range(from, from + 999);

    if (error) {
      console.error('Error fetching questions:', error);
      break;
    }
    if (!rows || rows.length === 0) break;

    for (const r of rows) {
      totalProcessed++;
      let changed = false;
      const updatePayload: { id: string; question?: string; options?: any[]; explanation?: string } = {
        id: r.id,
      };

      // 1. Sanitize Question Text
      if (r.question) {
        const cleanQ = sanitizeLatexString(r.question);
        if (cleanQ !== r.question) {
          updatePayload.question = cleanQ;
          changed = true;
        }
      }

      // 2. Sanitize Options
      if (Array.isArray(r.options)) {
        let optsChanged = false;
        const cleanOpts = r.options.map((opt: any) => {
          if (typeof opt === 'string') {
            const sanitized = sanitizeLatexString(opt);
            if (sanitized !== opt) {
              optsChanged = true;
              return sanitized;
            }
          }
          return opt;
        });

        if (optsChanged) {
          updatePayload.options = cleanOpts;
          changed = true;
        }
      }

      // 3. Sanitize Explanation
      if (r.explanation) {
        const cleanExp = sanitizeLatexString(r.explanation);
        if (cleanExp !== r.explanation) {
          updatePayload.explanation = cleanExp;
          changed = true;
        }
      }

      if (changed) {
        updatesQueue.push(updatePayload);
      }
    }

    from += 1000;
    if (from % 10000 === 0) {
      console.log(`Scanned ${from} questions... Found ${updatesQueue.length} questions to clean so far.`);
    }
  }

  console.log(`\n📋 Total questions scanned: ${totalProcessed}`);
  console.log(`Total questions requiring LaTeX updates: ${updatesQueue.length}`);

  // Batch execute updates in concurrency chunks of 25
  const concurrency = 25;
  for (let i = 0; i < updatesQueue.length; i += concurrency) {
    const chunk = updatesQueue.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (u) => {
        const { id, ...dataToUpdate } = u;
        const { error } = await supabase.from('questions').update(dataToUpdate).eq('id', id);
        if (!error) {
          totalUpdated++;
        } else {
          console.error(`Error updating question ${id}:`, error);
        }
      }),
    );

    if ((i + concurrency) % 500 === 0 || i + concurrency >= updatesQueue.length) {
      console.log(`Updated ${totalUpdated} / ${updatesQueue.length} questions...`);
    }
  }

  console.log(`\n🎉 LaTeX Cleanup Execution Complete! Successfully updated ${totalUpdated} questions.`);
}

executeLatexCleanup().catch(console.error);
