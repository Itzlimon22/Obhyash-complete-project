const fs = require('fs');
const path = require('path');
const katex = require('katex');

const questionsPath = path.join(__dirname, '../lib/data/public-mock-questions.json');
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

function cleanText(input) {
  if (!input || typeof input !== 'string') return input;
  let text = input;

  // 1. Un-escape backslash n
  text = text.replace(/\\\\n/g, '\n');
  text = text.replace(/\\n(?!(?:eq|e\b|ot\b|abla\b|eg\b|u\b|atural\b|earrow\b|warrow\b|i\b|ormalsize\b|ull\b|prec\b|succ\b))/g, '\n');

  // 2. Fix stripped macros from carriage return / tabs
  text = text.replace(/(?<![a-zA-Z\\])ightarrow\b/g, '\\rightarrow');
  text = text.replace(/(?<![a-zA-Z\\])imes\b/g, '\\times');
  text = text.replace(/(?<![a-zA-Z\\])ext\{/g, '\\text{');
  text = text.replace(/\\1\\text\{/g, '1\\text{');

  // 3. Remove trailing pipes
  text = text.replace(/\$\s*\|\s*$/gm, '$');
  text = text.replace(/\$\s*\|\s*/g, '$ ');

  // 4. Over-escaped symbols
  text = text.replace(/\^\\\\circ/g, '^{\\circ}');
  text = text.replace(/\^\\circ/g, '^{\\circ}');
  text = text.replace(/\\\\(ge|le|neq|times|pm|cdot|circ|theta|alpha|beta|gamma|delta|lambda|mu|pi|omega|Delta|approx)\b/g, '\\$1');
  text = text.replace(/\\\\%/g, '\\%');

  // 5. Incompatible macros inside \text{...}
  text = text.replace(/\\text\{\s*\\(pi|theta|alpha|beta|gamma|lambda|mu|omega|sigma|Delta|phi)\s*\}/g, '\\$1');
  text = text.replace(/\\text\{\s*\\hat\{([a-zA-Z])\}\s*\}/g, '\\hat{$1}');
  text = text.replace(/\\text\{\s*\\vec\{([a-zA-Z])\}\s*\}/g, '\\vec{$1}');
  text = text.replace(/\\text\{([A-Za-z]+)\^([-\d]+)\}/g, '\\text{$1}^{$2}');

  // 6. Fix unwrapped / broken \begin{aligned}
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

  text = text.replace(/(?<!\$)\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}(?!\$)/g, (_m, inner) => {
    return `\n\n$$\\begin{aligned}${inner}\\end{aligned}$$\n\n`;
  });

  // Clean inside aligned blocks
  text = text.replace(/\$\$\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}\$\$/g, (_m, inner) => {
    let cleanedInner = inner
      .replace(/\n\s*\\n([a-zA-Z0-9\(\-\+])/g, '\n$1')
      .replace(/\\n([a-zA-Z0-9\(\-\+])/g, '\n$1');
    return `$$\\begin{aligned}${cleanedInner}\\end{aligned}$$`;
  });

  // 7. Remove accidental dollars around pure Bengali conjunctions/words
  text = text.replace(/\$\s+(এবং|বা|ও|হলে|এর)\s+\$/g, ' $1 ');
  text = text.replace(/\$(এবং|বা|ও|হলে|এর)\$/g, ' $1 ');

  // 8. Fix unclosed math before Dari on lines with odd dollars
  const lines = text.split('\n');
  text = lines.map(line => {
    let l = line;
    const dollars = (l.match(/(?<!\\)\$/g) || []).length;
    if (dollars % 2 !== 0) {
      // Check if there is an unclosed math block ending with Dari: e.g. $v_x = v \cos \theta ।
      l = l.replace(/(^|[^\$])\$([a-zA-Z0-9\\_\^\{\}\(\)\/\+\-\=\s\.\,\*]+?)\s*।/g, (_m, prefix, math) => {
        return `${prefix}$${math.trim()}$।`;
      });
    }
    return l;
  }).join('\n');

  // 9. Un-trap pure Bengali text blocks enclosed in dollars
  text = text.replace(/\$([^\$\n]+?)\$/g, (match, inner) => {
    const withoutAscii = inner.replace(/[\s\d\.\,\:\;\!\?\"\'\(\)\-\_]/g, '');
    // If it contains only Bengali letters and NO Latin/math
    if (/^[\u0980-\u09FF]+$/.test(withoutAscii)) {
      return inner;
    }
    return match;
  });

  return text;
}

let remainingKatexErrors = 0;
let remainingUnbalanced = 0;
let sampleErrors = [];

questions.forEach(q => {
  const fields = [
    { name: 'question', text: cleanText(q.question) },
    ...(q.options || []).map((o, idx) => ({ name: 'options[' + idx + ']', text: cleanText(o) })),
    { name: 'explanation', text: cleanText(q.explanation) }
  ];

  fields.forEach(f => {
    if (!f.text) return;
    const dollars = (f.text.match(/(?<!\\)\$/g) || []).length;
    if (dollars % 2 !== 0) {
      remainingUnbalanced++;
    }
    const matches = [...f.text.matchAll(/\$\$([\s\S]*?)\$\$|\$([^\$\n]+?)\$/g)];
    for (const m of matches) {
      const math = (m[1] || m[2]).trim();
      if (!math) continue;
      try {
        katex.renderToString(math, { throwOnError: true });
      } catch (err) {
        remainingKatexErrors++;
        sampleErrors.push({ id: q.id, field: f.name, math, err: err.message });
      }
    }
  });
});

console.log('Remaining KaTeX parse errors:', remainingKatexErrors);
console.log('Remaining unbalanced dollars:', remainingUnbalanced);
console.log('ALL remaining errors:', sampleErrors.length);

const unbalancedSamples = [];
questions.forEach(q => {
  ['question', ...(q.options || []).map((o, idx) => 'options[' + idx + ']'), 'explanation'].forEach(f => {
    let raw = f.startsWith('options[') ? q.options[parseInt(f.replace('options[', '').replace(']', ''))] : q[f];
    if (!raw) return;
    const cleaned = cleanText(raw);
    const count = (cleaned.match(/(?<!\\)\$/g) || []).length;
    if (count % 2 !== 0) {
      unbalancedSamples.push({ id: q.id, field: f, subject: q.subject, text: cleaned });
    }
  });
});

console.log('Unbalanced samples count:', unbalancedSamples.length);
unbalancedSamples.slice(0, 15).forEach((u, idx) => {
  console.log(`[${idx + 1}] ID: ${u.id} [${u.field}] (${u.subject})`);
  console.log(u.text.slice(0, 180));
  console.log('---');
});
