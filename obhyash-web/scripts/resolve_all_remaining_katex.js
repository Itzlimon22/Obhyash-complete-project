const fs = require('fs');
const path = require('path');
const katex = require('katex');

const questionsFile = path.join(__dirname, '../lib/data/public-mock-questions.json');
const questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));

console.log('Running deep KaTeX & formatting resolver on all questions...');

function fixDoubleSuperscripts(str) {
  if (!str) return str;
  return str
    .replace(/10\^\{([-\d]+)\}\^(\d+)/g, '10^{$1$2}')
    .replace(/\^\{([-\d]+)\}\^(\d+)/g, '^{$1$2}')
    .replace(/10\^([-\d]+)\^(\d+)/g, '10^{$1$2}');
}

function fixFusedMacros(str) {
  if (!str) return str;
  return str
    .replace(/\\pimr\^2/g, '\\pi m r^2')
    .replace(/\\pimr/g, '\\pi m r')
    .replace(/\\pier/g, '\\pi r')
    .replace(/\\pir\b/g, '\\pi r')
    .replace(/\\pif\b/g, '\\pi f')
    .replace(/\\piN\b/g, '\\pi N')
    .replace(/\\text\{\\mum\}/g, '\\mu\\text{m}')
    .replace(/\\mum\b/g, '\\mu\\text{m}');
}

function fixSpecificBrokenEquations(str) {
  if (!str) return str;
  let text = str;

  // Question a67e86fc
  text = text.replace(
    /\$\$Y = \\overline\{A \\oplus B\} = A \\cdot B \+ \\overline\{A\} \\cdot \\overline\{B\}\$\nআবার/g,
    '$$Y = \\overline{A \\oplus B} = A \\cdot B + \\overline{A} \\cdot \\overline{B}$$\nআবার'
  );

  // Question 61c53205
  text = text.replace(/4\\pimr\^2\//g, '4\\pi^2 m r / T^2');
  text = text.replace(/m\(\\frac\{4\\pi\^2\}\{\[\\text\{T\}\^\{2\}\]/g, 'm\\left(\\frac{4\\pi^2}{T^2}\\right)');

  // Question 3a12577e
  text = text.replace(/v_i\^2 &= 16 \\\\\n\s*t=2\n\\end\{aligned\}\$\n\nতে\n\n\$\$\\begin\{aligned\}/g, 'v_i^2 &= 16\n\\end{aligned}$$\n\n$t=2$ তে:\n\n$$\\begin{aligned}');

  // Question 8115df83
  text = text.replace(/।\n\nদেওয়া আছে, \$M_e = 81 M_m এবং \\frac\{R_e\}\{R_m\} = 4\$।/g, '।\n\nদেওয়া আছে, $M_e = 81 M_m$ এবং $\\frac{R_e}{R_m} = 4$।');

  // Question 8cc504c0
  text = text.replace(/\\frac\{\\text\{পথ পার্থক্য\}\}\{\\lambda\} = \\frac\{\\text\{দশা পার্থক্য\n\n\$\$\\begin\{aligned\}\n\s*& \}\}\{2\\pi\}/g, '\\frac{\\text{পথ পার্থক্য}}{\\lambda} = \\frac{\\text{দশা পার্থক্য}}{2\\pi}');

  // Question 22133607
  text = text.replace(/T &= 2\\pi \\sqrt\{\\frac\{I\}\{MH\}\} \\\\\n\s*I &= \\frac\{\n\\end\{aligned\}\$\$/g, 'T &= 2\\pi \\sqrt{\\frac{I}{MH}} \\\\\n  I &= \\frac{T^2 MH}{4\\pi^2}\n\\end{aligned}$$');

  // Question de1482e3
  text = text.replace(/\\frac\{\}\\{\[A\]\} =/g, '\\frac{-\\Delta[A]}{\\Delta t} =');

  // Question f3ad455f
  text = text.replace(/\\text\{N\}_2 \\text\{O\}_4 \\rightleftharpoons 2\\text\{NO\}_2। K_p = \\frac\{\(P_\{/g, '\\text{N}_2\\text{O}_4 \\rightleftharpoons 2\\text{NO}_2$। $K_p = \\frac{(P_{');

  // Question f91ad95c
  text = text.replace(/\\text\{ইনভারটেজ\}\} \\text\{C\}_6/g, '\\text{ইনভারটেজ}} \\text{C}_6');

  // Question cab14e53
  text = text.replace(/\\xrightarrow\{\\text\{জাইমেজ\}\$/g, '\\xrightarrow{\\text{জাইমেজ}}$');

  // Question 98340813
  text = text.replace(/\(-1\)\^\n\$\$/g, '(-1)^r\n$$');
  text = text.replace(/\\text\{Wait, let's recalculate \} 126 \\times 16 = 2016[^\$]*\)/g, '');

  // Question 473428d9
  text = text.replace(/& \\text\{\s*\n\\end\{aligned\}/g, '\\end{aligned}');
  text = text.replace(/লম্ব\} = 5/g, '\\text{লম্ব} = 5');
  text = text.replace(/\$ভূমি\} = 3/g, '$\\text{ভূমি} = 3');
  text = text.replace(/লম্ব \$\} = \\sqrt\{5\^2 - 3\^2\} = 4\$/g, '$\\text{লম্ব} = \\sqrt{5^2 - 3^2} = 4$');

  // Question a9151912
  text = text.replace(/\\end\{aligned\} তাহলে লম্ব  = \$\\sqrt\{5\^2 - 4\^2\} = 3\$/g, '\\end{aligned}$$\n\nতাহলে লম্ব = $\\sqrt{5^2 - 4^2} = 3$');

  // Question 69a69fb8
  text = text.replace(/\\begin\{aligned\}\s*\}\} &=/g, '\\begin{aligned}\n  \\tan\\theta &=');

  // Question 83305eab
  text = text.replace(/\\end\{aligned\}\$ উভয়পক্ষ থেকে  \\tan\^\{-1\}\$বাদ দিয়ে পাই:/g, '\\end{aligned}$$\n\nউভয়পক্ষ থেকে $\\tan^{-1}$ বাদ দিয়ে পাই:');

  // Question 829cfdf8
  text = text.replace(/& \\text\{\s*\n\\end\{aligned\}/g, '\\end{aligned}');

  // Question 5d319582
  text = text.replace(/\\end\{aligned\}\$\s*\(ভুল হিসাব\) সঠিক হিসাব:/g, '\\end{aligned}$$\n\n(ভুল হিসাব) সঠিক হিসাব:');
  text = text.replace(/\\cos\^\{-1\}\\left\(-\\frac\{2\}\{3\}\\end\{right\)/g, '\\cos^{-1}\\left(-\\frac{2}{3}\\right)');

  // Question 7ad2c067
  text = text.replace(/\\end\{aligned\}\$ শর্ত ২: বেগ দুটি এখন সমকোণে ক্রিয়া করছে।\s*সুতরাং লব্ধি  R = \\sqrt\{P\^2 \+ Q\^2\}\$।/g, '\\end{aligned}$$\n\nশর্ত ২: বেগ দুটি এখন সমকোণে ক্রিয়া করছে। সুতরাং লব্ধি $R = \\sqrt{P^2 + Q^2}$।');
  text = text.replace(/\$এর সাপেক্ষে সমাধান ভিন্ন হবে।/g, 'এর সাপেক্ষে সমাধান ভিন্ন হবে।');

  // Question aecf13d0
  text = text.replace(/\\end\{aligned\}\$ আবার, লব্ধির মান  R = \\sqrt\{u\^2 \+ v\^2 \+ 2uv \\cos \\alpha\}\$।/g, '\\end{aligned}$$\n\nআবার, লব্ধির মান $R = \\sqrt{u^2 + v^2 + 2uv \\cos \\alpha}$।');

  // Question edf5f1e3
  text = text.replace(/\\\\therefore \\\\text\{\s*\n\\end\{aligned\}/g, '\\end{aligned}');

  // Question 29ed098d
  text = text.replace(/\\end\{aligned\}\$ আদর্শ পরাবৃত্ত  Y\^2 = 4aX\$এর নিয়ামক রেখার সমীকরণ হলো:X = -a/g, '\\end{aligned}$$\n\nআদর্শ পরাবৃত্ত $Y^2 = 4aX$-এর নিয়ামক রেখার সমীকরণ হলো: $X = -a$');
  text = text.replace(/Let me check options:[^\$]*\$/g, '');
  text = text.replace(/\$\s*Directrix for\$ Y\^2 = 4aX \$is/g, 'Directrix for $Y^2 = 4aX$ is');
  text = text.replace(/Let me adjust the question or options[^\$]*\$/g, '');

  // Remaining instances of \end{aligned}$ followed by Bengali
  text = text.replace(/\\end\{aligned\}\$([\s\u0980-\u09FF\:\,\।\-\(\)]+)/g, '\\end{aligned}$$\n\n$1');

  // Stray $ at beginning or end of lines with no math
  text = text.replace(/^\$\s*([\u0980-\u09FF\s\:\,\।]+)\$$/gm, '$1');

  return text;
}

function untrapBengaliConjunctions(str) {
  if (!str) return str;
  // Un-trap conjunctions inside math e.g. $a এবং b$ -> $a$ এবং $b$
  let text = str;

  // Split $MATH এবং MATH$
  text = text.replace(/\$([^\$\n]+?)\s+(এবং|বা|ও|হলে|এর|থেকে|দ্বারা|হতে)\s+([^\$\n]+?)\$/g, (_m, m1, conj, m2) => {
    // Only split if both m1 and m2 contain math symbols
    const hasMath1 = /[\\^_=+\-*\/<>]|[a-zA-Z]/.test(m1);
    const hasMath2 = /[\\^_=+\-*\/<>]|[a-zA-Z]/.test(m2);
    if (hasMath1 && hasMath2) {
      return `$${m1.trim()}$ ${conj} $${m2.trim()}$`;
    } else if (hasMath1 && !hasMath2) {
      return `$${m1.trim()}$ ${conj} ${m2.trim()}`;
    } else if (!hasMath1 && hasMath2) {
      return `${m1.trim()} ${conj} $${m2.trim()}$`;
    }
    return `${m1.trim()} ${conj} ${m2.trim()}`;
  });

  return text;
}

function ensureBalanced(str) {
  if (!str) return str;
  const count = (str.match(/(?<!\\)\$/g) || []).length;
  if (count % 2 !== 0) {
    if (str.endsWith('$') && !str.endsWith('$$')) {
      return str.slice(0, -1);
    }
    return str + '$';
  }
  return str;
}

let healedCount = 0;
questions.forEach(q => {
  const fields = ['question', 'explanation'];
  fields.forEach(f => {
    let t = q[f];
    if (!t) return;
    t = fixDoubleSuperscripts(t);
    t = fixFusedMacros(t);
    t = fixSpecificBrokenEquations(t);
    t = untrapBengaliConjunctions(t);
    t = ensureBalanced(t);
    if (t !== q[f]) {
      q[f] = t;
      healedCount++;
    }
  });

  if (Array.isArray(q.options)) {
    q.options = q.options.map(opt => {
      let o = opt;
      if (!o) return o;
      o = fixDoubleSuperscripts(o);
      o = fixFusedMacros(o);
      o = fixSpecificBrokenEquations(o);
      o = untrapBengaliConjunctions(o);
      o = ensureBalanced(o);
      return o;
    });
  }

  // Sync correct answer
  if (q.correctAnswerIndex !== undefined && q.options && q.options[q.correctAnswerIndex] !== undefined) {
    q.correctAnswer = q.options[q.correctAnswerIndex];
  }
});

console.log(`Deep healing applied. Changes in ${healedCount} fields.`);
fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2), 'utf8');
console.log('Saved to public-mock-questions.json.');
