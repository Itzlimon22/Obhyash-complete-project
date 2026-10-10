const fs = require('fs');
const path = require('path');
const katex = require('katex');

const questionsFile = path.join(__dirname, '../lib/data/public-mock-questions.json');
const questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));

let katexErrors = [];
let unbalanced = [];
let bengaliInMath = [];
let answerMismatches = 0;

questions.forEach((q, idx) => {
  // Check answer consistency
  if (q.options && q.correctAnswerIndex !== undefined) {
    if (q.options[q.correctAnswerIndex] !== q.correctAnswer) {
      answerMismatches++;
    }
  }

  const fields = [
    { name: 'question', text: q.question },
    ...(q.options || []).map((opt, oIdx) => ({ name: 'options[' + oIdx + ']', text: opt })),
    { name: 'explanation', text: q.explanation }
  ];

  fields.forEach(f => {
    if (!f.text || typeof f.text !== 'string') return;
    const text = f.text;

    // Unbalanced dollars
    const dollars = (text.match(/(?<!\\)\$/g) || []).length;
    if (dollars % 2 !== 0) {
      unbalanced.push({ id: q.id, field: f.name, text });
    }

    // KaTeX parsing
    const matches = [...text.matchAll(/\$\$([\s\S]*?)\$\$|\$([^\$\n]+?)\$/g)];
    for (const m of matches) {
      const math = (m[1] || m[2]).trim();
      if (!math) continue;
      try {
        katex.renderToString(math, { throwOnError: true });
      } catch (err) {
        katexErrors.push({ id: q.id, field: f.name, math, err: err.message });
      }

      // Trapped Bengali
      const withoutText = math.replace(/\\text\{[^\}]*\}/g, '');
      if (/[\u0980-\u09FF]/.test(withoutText)) {
        bengaliInMath.push({ id: q.id, field: f.name, math });
      }
    }
  });
});

console.log('=== AUDIT RESULTS AFTER FIRST PASS ===');
console.log('Total questions:', questions.length);
console.log('Answer mismatches:', answerMismatches);
console.log('Unbalanced dollar fields:', unbalanced.length);
console.log('KaTeX parse errors:', katexErrors.length);
console.log('Bengali trapped in math:', bengaliInMath.length);

if (katexErrors.length > 0) {
  console.log('\n--- ALL KaTeX Errors (' + katexErrors.length + ') ---');
  katexErrors.forEach((e, i) => {
    console.log(`[${i+1}] ID: ${e.id} [${e.field}] -> ${e.err}`);
    console.log(`    Math: "${e.math.replace(/\n/g, ' ')}"`);
  });
}

if (unbalanced.length > 0) {
  console.log('\n--- Unbalanced Dollar Samples ---');
  unbalanced.slice(0, 10).forEach((u, i) => {
    console.log(`[${i+1}] ID: ${u.id} [${u.field}]`);
    console.log(`    Snippet: "${u.text.slice(0, 100)}"`);
  });
}
