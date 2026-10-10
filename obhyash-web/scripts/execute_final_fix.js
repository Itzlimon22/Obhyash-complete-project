const fs = require('fs');
const path = require('path');
const katex = require('katex');

const questionsFile = path.join(__dirname, '../lib/data/public-mock-questions.json');
let questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));

console.log('Executing final fix on all questions...');

function cleanField(str) {
  if (!str || typeof str !== 'string') return str;
  let text = str;

  // 1. Aligned environments - ensure strictly $$ at both ends using callback functions
  text = text.replace(/\\end\{aligned\}\$(?!\$)/g, () => '\\end{aligned}$$');
  text = text.replace(/(?<!\$)\\begin\{aligned\}/g, () => '$$\\begin{aligned}');
  text = text.replace(/(?<!\$)\$\\begin\{aligned\}/g, () => '$$\\begin{aligned}');
  text = text.replace(/\\end\{aligned\}\${3,}/g, () => '\\end{aligned}$$');
  text = text.replace(/\${3,}\\begin\{aligned\}/g, () => '$$\\begin{aligned}');

  // 2. Fix Double Superscripts: 10^{-2}^1 -> 10^{-21}
  text = text.replace(/10\^\{([-\d]+)\}\^(\d+)/g, '10^{$1$2}');
  text = text.replace(/\^\{([-\d]+)\}\^(\d+)/g, '^{$1$2}');

  // 3. Fix Fused Macros
  text = text.replace(/\\pimr\^2/g, '\\pi m r^2');
  text = text.replace(/\\pimr/g, '\\pi m r');
  text = text.replace(/\\pier/g, '\\pi r');
  text = text.replace(/\\pir\b/g, '\\pi r');
  text = text.replace(/\\pif\b/g, '\\pi f');
  text = text.replace(/\\piN\b/g, '\\pi N');
  text = text.replace(/\\text\{\\mum\}/g, '\\mu\\text{m}');
  text = text.replace(/\\mum\b/g, '\\mu\\text{m}');
  text = text.replace(/\\Delta([A-Za-z])\b/g, '\\Delta $1');
  text = text.replace(/\b(sin|cos|tan)\\theta\b/g, '\\$1\\theta');

  // 4. Broken fractions and syntax errors
  text = text.replace(/\\frac\{\}\\{\[A\]\} =/g, '\\frac{-\\Delta[A]}{\\Delta t} =');
  text = text.replace(/\\frac\{\s*\}\s*\{\s*2I\s*\}/g, '\\frac{L^2}{2I}');
  text = text.replace(/E = \\frac\{\s*\n?\s*\}\{2I\}/g, 'E = \\frac{L^2}{2I}');
  text = text.replace(/4\\pimr\^2\//g, '4\\pi^2 m r / T^2');
  text = text.replace(/m\(\\frac\{4\\pi\^2\}\{\[\\text\{T\}\^\{2\}\]\s*\}\s*\}/g, 'm\\left(\\frac{4\\pi^2}{T^2}\\right)r');
  text = text.replace(/T &= 2\\pi \\sqrt\{\\frac\{I\}\{MH\}\} \\\\\n\s*I &= \\frac\{\n\\end\{aligned\}\$\$/g, 'T &= 2\\pi \\sqrt{\\frac{I}{MH}} \\\\\n  I &= \\frac{T^2 MH}{4\\pi^2}\n\\end{aligned}$$');
  text = text.replace(/MH\}\{4\\pi\^2\}\s*=/g, 'I = \\frac{MH}{4\\pi^2} =');
  text = text.replace(/\\alpha\s*=\s*\\sqrt\{\\frac\{K_b\}\{C\}(?!\})/g, '\\alpha = \\sqrt{\\frac{K_b}{C}}');
  text = text.replace(/\\cos\^\{-1\}\\left\(-\\frac\{2\}\{3\}\\end\{right\)/g, '\\cos^{-1}\\left(-\\frac{2}{3}\\right)');
  text = text.replace(/\\text\{Wait, let's recalculate\}[^\$]*\$/g, '');
  text = text.replace(/Let's check:[^\$]*\$/g, '');
  text = text.replace(/Let me check options:[^\$]*\$/g, '');
  text = text.replace(/Let me adjust the question[^\$]*\$/g, '');
  text = text.replace(/Directrix for[^\$]*\$/g, '');
  text = text.replace(/\$নিয়ামক রেখা:/g, 'নিয়ামক রেখা:');

  // 5. Clean up corrupted notes in question 473428d9
  text = text.replace(/\\begin\{aligned\}\s*\\sin\^\{-1\}\\left\(\\frac\{5\}\{13\}\\right\) &= \\theta_1 \\\\\s*& \\text\{\s*\\end\{aligned\}\$\$/g, '$$\\sin^{-1}\\left(\\frac{5}{13}\\right) = \\theta_1$$');
  text = text.replace(/\\text\{লম্ব\} = 5,\s*\\text\{অতিভুজ[^\$]*\$/g, 'লম্ব = $5$, অতিভুজ = $13$, ভূমি = $\\sqrt{13^2 - 5^2} = 12$');
  text = text.replace(/২\)\s*ধরি,\s*\$\s*\\text\{ভূমি\}[^\$]*\$/g, '২) ধরি, ভূমি = $3$, অতিভুজ = $5$, লম্ব = $\\sqrt{5^2 - 3^2} = 4$');
  text = text.replace(/ভূমি\} = \\sqrt\{13\^2 - 5\^2\} = 12\$/g, 'ভূমি = $\\sqrt{13^2 - 5^2} = 12$');

  // 6. Clean set notation for ssc-ssc_m_c2-66 and ssc-ssc_m_c2-80
  text = text.replace(/A\s*=\s*\\\{x\s*:\s*x\s*\\text\{\s*হলো মৌলিক সংখ্যা[^\}]*\}\s*x\s*<\s*10\\\}/g, 'A = \\{x : x \\text{ হলো মৌলিক সংখ্যা এবং } x < 10\\}');
  text = text.replace(/A = \\\{x : x \\text\{ হলো মৌলিক সংখ্যা এবং  এবং/g, 'A = \\{x : x \\text{ হলো মৌলিক সংখ্যা এবং } x < 10\\}');
  text = text.replace(/\\\{x\s*:\s*x\s*\\text\{\s*হলো ১০[^\}]*\}\\\}/g, '\\{x : x \\text{ হলো ১০ এর গুণনীয়ক}\\}');

  // 7. Clean up author notes in 5d319582, 7ad2c067, aecf13d0
  text = text.replace(/\(আরেকটি মান: যদি লব্ধি[^\)]*\)/g, '');
  text = text.replace(/\(এখানে একটু সংশোধন: মূল শর্ত হলো Q[^\)]*\)/g, '');
  text = text.replace(/\(ভুল হিসাব\)\s*সঠিক হিসাব:/g, 'সঠিক হিসাব:');
  text = text.replace(/Let's re-verify options[^\$]*\$/g, '');
  text = text.replace(/Let's rewrite the explanation[^\$]*\$/g, '');

  // 8. Clean isolated math $ on empty lines
  text = text.replace(/\n\s*\$\s*\n/g, '\n');

  // 9. Balance dollars if odd
  const count = (text.match(/(?<!\\)\$/g) || []).length;
  if (count % 2 !== 0) {
    if (text.endsWith('$') && !text.endsWith('$$')) {
      text = text.slice(0, -1);
    } else {
      text = text + '$';
    }
  }

  return text;
}

questions.forEach(q => {
  q.question = cleanField(q.question);
  if (Array.isArray(q.options)) {
    q.options = q.options.map(cleanField);
  }
  q.explanation = cleanField(q.explanation);

  if (q.correctAnswerIndex !== undefined && q.options && q.options[q.correctAnswerIndex] !== undefined) {
    q.correctAnswer = q.options[q.correctAnswerIndex];
  }
});

fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2), 'utf8');
console.log('Saved to public-mock-questions.json.');
