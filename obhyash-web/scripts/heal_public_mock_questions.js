const fs = require('fs');
const path = require('path');
const katex = require('katex');

const questionsFile = path.join(__dirname, '../lib/data/public-mock-questions.json');
const questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));

console.log(`Starting healing process for ${questions.length} questions...`);

function cleanLatexAndFormatting(input, isOption = false) {
  if (!input || typeof input !== 'string') return input;
  let text = input;

  // 1. Literal \\n to actual \n
  text = text.replace(/\\\\n/g, '\n');
  text = text.replace(/\\n(?!(?:eq|e\b|ot\b|abla\b|eg\b|u\b|atural\b|earrow\b|warrow\b|i\b|ormalsize\b|ull\b|prec\b|succ\b))/g, '\n');

  // 2. Control characters (e.g. \b \x08 -> \theta, \v \x0b -> \vec, \f \x0c -> \frac)
  text = text.replace(/\x08/g, '\\theta');
  text = text.replace(/\x0b/g, '\\vec');
  text = text.replace(/\x0c/g, '\\frac');

  // 3. Stripped macros
  text = text.replace(/(?<![a-zA-Z\\])ightarrow\b/g, '\\rightarrow');
  text = text.replace(/(?<![a-zA-Z\\])imes\b/g, '\\times');
  text = text.replace(/(?<![a-zA-Z\\])ext\{/g, '\\text{');
  text = text.replace(/\\1\\text\{/g, '1\\text{');
  text = text.replace(/\\xr\\rightarrow/g, '\\xrightarrow');
  text = text.replace(/\\R\\rightarrow/g, '\\implies');

  // 4. Trailing pipe artifacts from regex/table exports
  text = text.replace(/\$\s*\|\s*$/gm, '$');
  text = text.replace(/\$\s*\|\s*/g, '$ ');

  // 5. Over-escaped backslashes and superscript formatting
  text = text.replace(/\^\\\\circ/g, '^{\\circ}');
  text = text.replace(/\^\\circ/g, '^{\\circ}');
  text = text.replace(/\\\\(ge|le|neq|times|pm|cdot|circ|theta|alpha|beta|gamma|delta|lambda|mu|pi|omega|Delta|approx)\b/g, '\\$1');
  text = text.replace(/\\\\%/g, '\\%');

  // 6. Fix invalid macros inside \text{...}
  text = text.replace(/\\text\{\s*\\(pi|theta|alpha|beta|gamma|lambda|mu|omega|sigma|Delta|phi)\s*\}/g, '\\$1');
  text = text.replace(/\\text\{\s*\\hat\{([a-zA-Z])\}\s*\}/g, '\\hat{$1}');
  text = text.replace(/\\text\{\s*\\vec\{([a-zA-Z])\}\s*\}/g, '\\vec{$1}');
  text = text.replace(/\\text\{\s*\\mu\s+([A-Za-z]+)\s*\}/g, '\\mu\\text{$1}');
  text = text.replace(/\\text\{\s*\\Omega\s*\}/g, '\\Omega');
  text = text.replace(/\\text\{\s*\^\{\\circ\}\s*([A-Za-z]*)\s*\}/g, '^{\\circ}\\text{$1}');
  text = text.replace(/\\text\{\s*\^\\circ\s*([A-Za-z]*)\s*\}/g, '^{\\circ}\\text{$1}');
  text = text.replace(/\\text\{([A-Za-z]+)\^([-\d]+)\}/g, '\\text{$1}^{$2}');
  text = text.replace(/\\text\{([A-Za-z]+)\^-\}/g, '\\text{$1}^{-}');

  // 7. Fix aligned environments
  // Case A: \begin{aligned} ... \end{aligned}$ [Bengali text] [Formula]$
  text = text.replace(/(?<!\$)\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}\$([\s\S]*?)\$/g, (_match, alignedBody, after) => {
    const bengaliMatch = after.match(/^([\s\u0980-\u09FF\:\,\।\-\(\)]+)(.*)$/);
    if (bengaliMatch) {
      const bengaliPart = bengaliMatch[1].trim();
      const mathPart = bengaliMatch[2].trim();
      if (mathPart) {
        return `\n\n$$\\begin{aligned}${alignedBody}\\end{aligned}$$\n\n${bengaliPart} $${mathPart}$`;
      } else {
        return `\n\n$$\\begin{aligned}${alignedBody}\\end{aligned}$$\n\n${bengaliPart}`;
      }
    }
    return `\n\n$$\\begin{aligned}${alignedBody}\\end{aligned}$$\n\n$${after.trim()}$`;
  });

  // Case B: \begin{aligned} ... \end{aligned}$ with stray trailing $
  text = text.replace(/(?<!\$)\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}\$/g, (_m, inner) => {
    return `\n\n$$\\begin{aligned}${inner}\\end{aligned}$$\n\n`;
  });

  // Case C: bare \begin{aligned} ... \end{aligned} without any dollars
  text = text.replace(/(?<!\$)\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}(?!\$)/g, (_m, inner) => {
    return `\n\n$$\\begin{aligned}${inner}\\end{aligned}$$\n\n`;
  });

  // Clean contents of all $$\begin{aligned} ... \end{aligned}$$ blocks
  text = text.replace(/\$\$\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}\$\$/g, (_m, inner) => {
    let cleanedInner = inner
      .replace(/\n\s*\\n([a-zA-Z0-9\(\-\+])/g, '\n$1')
      .replace(/\\n([a-zA-Z0-9\(\-\+])/g, '\n$1')
      .replace(/।\s*([a-zA-Z0-9\-\+])/g, ' \\\\\n  $1');
    return `$$\\begin{aligned}${cleanedInner}\\end{aligned}$$`;
  });

  // 8. Fix inverted Bengali conjunctions:
  text = text.replace(/\$\s+(এবং|বা|ও|হলে|এর)\s+\$/g, ' $1 ');
  text = text.replace(/\$(এবং|বা|ও|হলে|এর)\$/g, ' $1 ');

  // 9. Un-trap pure Bengali text blocks enclosed in dollars
  text = text.replace(/\$([^\$\n]+?)\$/g, (match, inner) => {
    const withoutAscii = inner.replace(/[\s\d\.\,\:\;\!\?\"\'\(\)\-\_]/g, '');
    if (/^[\u0980-\u09FF]+$/.test(withoutAscii)) {
      return inner;
    }
    return match;
  });

  // 10. Fix unclosed math before Dari on lines with odd dollars
  const lines = text.split('\n');
  text = lines.map(line => {
    let l = line;
    const dollars = (l.match(/(?<!\\)\$/g) || []).length;
    if (dollars % 2 !== 0) {
      l = l.replace(/(^|[^\$])\$([a-zA-Z0-9\\_\^\{\}\(\)\/\+\-\=\s\.\,\*]+?)\s*।/g, (_m, prefix, math) => {
        return `${prefix}$${math.trim()}$।`;
      });
      // Also check unclosed math before newline or comma: e.g. $m=2m_0, সুতরাং
      l = l.replace(/(^|[^\$])\$([a-zA-Z0-9\\_\^\{\}\(\)\/\+\-\=\s\.\*]+?)\s*,\s*সুতরাং/g, (_m, prefix, math) => {
        return `${prefix}$${math.trim()}$, সুতরাং`;
      });
    }
    return l;
  }).join('\n');

  // 11. Fix Dari inside existing math blocks: $MATH । BENGALI$
  text = text.replace(/\$([^\$\n]+?)\$/g, (match, inner) => {
    if (!inner.includes('।')) return match;
    const parts = inner.split('।');
    if (parts.length > 1) {
      const fixedParts = parts.map((part) => {
        const trimmed = part.trim();
        if (!trimmed) return '';
        const hasMath = /[\\^_=+\-*\/<>]|[a-zA-Z]{1,}/.test(trimmed.replace(/\\text\{[^\}]*\}/g, ''));
        const hasBengali = /[\u0980-\u09FF]/.test(trimmed.replace(/\\text\{[^\}]*\}/g, ''));
        if (!hasMath && hasBengali) return trimmed;
        if (hasMath && !hasBengali) return `$${trimmed}$`;
        // Mixed: separate Bengali at end or beginning
        const bengaliEndMatch = trimmed.match(/^(.*?)(\s+[\u0980-\u09FF\s\(\)\:\,]+)$/);
        if (bengaliEndMatch && /[\\^_=+\-*\/<>]|[a-zA-Z]/.test(bengaliEndMatch[1])) {
          return `$${bengaliEndMatch[1].trim()}$${bengaliEndMatch[2]}`;
        }
        return `$${trimmed}$`;
      });
      return fixedParts.join('। ');
    }
    return match;
  });

  // 12. Fix specific known broken formulas in database
  // E = \frac{L^2}{2I}
  text = text.replace(/E\s*=\s*\\frac\{\s*\}\s*\{\s*2I\s*\}/g, 'E = \\frac{L^2}{2I}');
  text = text.replace(/E\s*=\s*\\frac\{\s*\$\[\\text\{L\}\^\{2\}\]\$\}\{\s*2I\s*\}/g, 'E = \\frac{L^2}{2I}');
  text = text.replace(/\\frac\{\s*\$\[\\text\{L\}\^\{2\}\]\$\}\{\s*2I\s*\}/g, '\\frac{L^2}{2I}');
  // F = m(4\pi^2 / T^2)r
  text = text.replace(/m\(\\frac\{4\\pi\^2\}\{\[\\text\{T\}\^\{2\}\]\s*\}\s*\}/g, 'm\\left(\\frac{4\\pi^2}{T^2}\\right)r');
  // I = \frac{MH}{4\pi^2}
  text = text.replace(/MH\}\{4\\pi\^2\}\s*=/g, 'I = \\frac{MH}{4\\pi^2} =');
  // [ML^2T^-2]\theta^-1
  text = text.replace(/\$\[\\text\{M\}\\text\{L\}\^\{2\}\\text\{T\}\^\{-2\}\]\$\\theta\^-1/g, '$[\\text{ML}^2\\text{T}^{-2}]\\theta^{-1}$');
  text = text.replace(/\[\\text\{M\}\\text\{L\}\^\{2\}\\text\{T\}\^\{-2\}\]\\theta\^-1/g, '$[\\text{ML}^2\\text{T}^{-2}]\\theta^{-1}$');
  // \alpha = \sqrt{\frac{K_b}{C}}
  text = text.replace(/\\alpha\s*=\s*\\sqrt\{\\frac\{K_b\}\{C\}(?!\})/g, '\\alpha = \\sqrt{\\frac{K_b}{C}}');
  // 25^\circ C
  text = text.replace(/25\^\{\\circ\}\\text\{C\}/g, '$25^{\\circ}\\text{C}$');
  text = text.replace(/\\circ\}\\text\{C\}\s*তাপমাত্রায়/g, '$25^{\\circ}\\text{C}$ তাপমাত্রায়');

  // 13. Auto-wrap unwrapped options that have scientific notation, units, or math
  if (isOption) {
    const trimmed = text.trim();
    if (!trimmed.startsWith('$') || !trimmed.endsWith('$')) {
      // If it contains math commands like \times, \frac, \sqrt, \mu, \Omega, ^, or dimensions
      if (/\\(?:times|frac|sqrt|mu|Omega|Delta|pi|theta|pm)\b|\b\d+(?:\.\d+)?\s*\\times\s*10\^|\[\\text\{[A-Z]/.test(trimmed)) {
        // If it ends with Bengali words, wrap the math part
        const matchBengali = trimmed.match(/^(.*?)\s*([\u0980-\u09FF]+)$/);
        if (matchBengali && /[\\^_=+\-*\/<>]/.test(matchBengali[1])) {
          text = `$${matchBengali[1].trim()}$ ${matchBengali[2]}`;
        } else {
          text = `$${trimmed}$`;
        }
      }
    }
  }

  // 14. Final pass: clean any doubled $$ inside single $
  text = text.replace(/(?<!\$)\$\$(?!\$)/g, (match, offset, str) => {
    // If it is on its own line or surrounded by newlines, keep as display math $$
    const prevChar = str[offset - 1];
    const nextChar = str[offset + 2];
    if (prevChar === '\n' || nextChar === '\n' || !prevChar || !nextChar) {
      return '$$';
    }
    return '$$';
  });

  // Ensure balanced dollars in the string
  const totalDollars = (text.match(/(?<!\\)\$/g) || []).length;
  if (totalDollars % 2 !== 0) {
    // Try to fix trailing or misplaced single dollar
    if (text.endsWith('$') && !text.endsWith('$$')) {
      text = text.slice(0, -1);
    } else if (text.startsWith('$') && !text.startsWith('$$') && (text.match(/(?<!\\)\$/g) || []).length === 1) {
      text = text.slice(1);
    } else {
      // Append closing dollar if last formula wasn't closed
      text = text + '$';
    }
  }

  return text;
}

// Process and update every question
let totalUpdated = 0;
questions.forEach((q, idx) => {
  const origQ = q.question;
  const newQ = cleanLatexAndFormatting(origQ, false);

  const origOpts = [...(q.options || [])];
  const newOpts = origOpts.map(opt => cleanLatexAndFormatting(opt, true));

  const origExp = q.explanation;
  const newExp = cleanLatexAndFormatting(origExp, false);

  if (origQ !== newQ || JSON.stringify(origOpts) !== JSON.stringify(newOpts) || origExp !== newExp) {
    totalUpdated++;
    q.question = newQ;
    q.options = newOpts;
    q.explanation = newExp;
  }

  // Keep correctAnswer synchronized with options[correctAnswerIndex]
  if (q.correctAnswerIndex !== undefined && q.options && q.options[q.correctAnswerIndex] !== undefined) {
    q.correctAnswer = q.options[q.correctAnswerIndex];
  }
});

console.log(`Updated ${totalUpdated} questions out of ${questions.length}.`);

// Save back to public-mock-questions.json
fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2), 'utf8');
console.log('Saved healed questions to public-mock-questions.json successfully!');
