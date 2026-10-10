const fs = require('fs');
const path = require('path');
const katex = require('katex');

const questionsFile = path.join(__dirname, '../lib/data/public-mock-questions.json');
const questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));

console.log('Fixing aligned blocks and protecting text commands...');

function repairAlignedAndKaTeX(str) {
  if (!str) return str;
  let text = str;

  // 1. Fix set notation where \text was broken by conjunction splitting
  text = text.replace(/\{x\s*:\s*x\s*\\text\{\s*হলো মৌলিক সংখ্যা\s*\$\s*এবং\s*\$\s*\}\s*x\s*<\s*10\s*\}/g, '{x : x \\text{ হলো মৌলিক সংখ্যা এবং } x < 10}');
  text = text.replace(/A\s*=\s*\\\{x\s*:\s*x\s*\\text\{\s*হলো মৌলিক সংখ্যা\s*\$\s*এবং\s*\$\s*\}\s*x\s*<\s*10\\\}/g, 'A = \\{x : x \\text{ হলো মৌলিক সংখ্যা এবং } x < 10\\}');
  text = text.replace(/\\\{x\s*:\s*x\s*\\text\{\s*হলো ১০\s*\$\s*এর\s*\$\s*গুণনীয়ক\}\\\}/g, '\\{x : x \\text{ হলো ১০ এর গুণনীয়ক}\\}');
  text = text.replace(/\\\{x\s*:\s*x\s*\\text\{\s*হলো ১০\s*\n*\s*গুণনীয়ক\}\\\}/g, '\\{x : x \\text{ হলো ১০ এর গুণনীয়ক}\\}');
  text = text.replace(/A\s*=\s*\\\{x\s*:\s*x\s*\\text\{\s*হলো মৌলিক সংখ্যা/g, 'A = \\{x : x \\text{ হলো মৌলিক সংখ্যা এবং } x < 10\\}');
  text = text.replace(/\\text\{\s*হলো ১০/g, '\\text{ হলো ১০ এর গুণনীয়ক}');
  text = text.replace(/\}\s*x\s*<\s*10\\\}/g, '');
  text = text.replace(/গুণনীয়ক\}\\\}/g, '');

  // 2. Fix all \begin{aligned} ... \end{aligned}
  // Replace ANY \begin{aligned} that is not preceded by $$
  text = text.replace(/(?<!\$)\\begin\{aligned\}/g, '$$\\begin{aligned}');
  text = text.replace(/\$\\begin\{aligned\}/g, '$$\\begin{aligned}');

  // Replace ANY \end{aligned} followed by single $ or no $
  text = text.replace(/\\end\{aligned\}\$(?!\$)/g, '\\end{aligned}$$');
  text = text.replace(/\\end\{aligned\}(?!\$)/g, '\\end{aligned}$$');
  // Avoid triple/quadruple dollars
  text = text.replace(/\$\$\$\$/g, '$$');
  text = text.replace(/\$\$\$/g, '$$');

  // 3. Fix trailing author notes in question 29ed098d
  text = text.replace(/Let's check:[^\$]*\$/g, '');
  text = text.replace(/\\text\{Wait, let's recalculate\}[^\$]*\$/g, '');
  text = text.replace(/Let me check options:[^\$]*\$/g, '');
  text = text.replace(/Let me adjust the question[^\$]*\$/g, '');
  text = text.replace(/Directrix for[^\$]*\$/g, '');
  text = text.replace(/\$নিয়ামক রেখা:/g, 'নিয়ামক রেখা:');

  // 4. Question 473428d9
  text = text.replace(/\\text\{\s*\\end\{aligned\}\$\$/g, '\\end{aligned}$$');
  text = text.replace(/\\text\{\s*লম্ব\} = 5/g, '\\text{লম্ব} = 5');
  text = text.replace(/\\text\{লম্ব\} = 5,\s*\\text\{অতিভুজ\s*ভূমি\} = \s*\\sqrt\{13\^2 - 5\^2\} = 12/g, '\\text{লম্ব} = 5, \\text{অতিভুজ} = 13, \\text{ভূমি} = \\sqrt{13^2 - 5^2} = 12');
  text = text.replace(/২\)\s*ধরি,\s*\$\s*\\text\{ভূমি\} = 3,\s*\\text\{অতিভুজ\s*\\text\{লম্ব\} = \\sqrt\{5\^2 - 3\^2\} = 4\$/g, '২) ধরি, $\\text{ভূমি} = 3, \\text{অতিভুজ} = 5, \\text{লম্ব} = \\sqrt{5^2 - 3^2} = 4$');

  // 5. Question 2849783b
  text = text.replace(/উভয়পক্ষকে\s*x\$দিয়ে ভাগ করে:/g, 'উভয়পক্ষকে $x$ দিয়ে ভাগ করে:');

  // 6. Question a9151912
  text = text.replace(/তাহলে লম্ব\s*=\s*\$\\sqrt\{5\^2 - 4\^2\} = 3,\s*এবং \$ভূমি =\$\s*4\$/g, 'তাহলে লম্ব = $\\sqrt{5^2 - 4^2} = 3$, এবং ভূমি = $4$');

  // 7. Question 7ad2c067
  text = text.replace(/\(এখানে একটু সংশোধন:[^\)]*\)\$।/g, '');

  // 8. Question 5d319582
  text = text.replace(/\(আরেকটি মান: যদি লব্ধি[^\)]*\)/g, '');

  // 9. Remove stray isolated '$' on lines
  text = text.replace(/\n\s*\$\s*\n/g, '\n');

  // 10. Balance dollars
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
  q.question = repairAlignedAndKaTeX(q.question);
  if (Array.isArray(q.options)) {
    q.options = q.options.map(repairAlignedAndKaTeX);
  }
  q.explanation = repairAlignedAndKaTeX(q.explanation);

  if (q.correctAnswerIndex !== undefined && q.options && q.options[q.correctAnswerIndex] !== undefined) {
    q.correctAnswer = q.options[q.correctAnswerIndex];
  }
});

fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2), 'utf8');
console.log('Saved repair to public-mock-questions.json.');
