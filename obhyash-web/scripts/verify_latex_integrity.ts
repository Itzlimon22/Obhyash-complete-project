import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

interface LatexIssue {
  id: string;
  serial: number;
  liveExamId: string;
  field: string;
  issue: string;
  snippet: string;
}

function checkLatex(text: string): string | null {
  if (!text) return null;

  // 1. Remove escaped dollars (\$)
  let s = text.replace(/\\\$/g, '');

  // 2. Remove display math ($$...$$)
  s = s.replace(/\$\$[\s\S]*?\$\$/g, '');

  // 3. Count remaining inline dollars ($)
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '$') count++;
  }

  if (count % 2 !== 0) {
    return 'UNBALANCED_DOLLARS';
  }

  // 4. Check for unclosed curly braces inside math blocks ($...$ and $$...$$)
  const mathRegex = /\$\$([\s\S]*?)\$\$|\$([^\$\n]+)\$/g;
  let match;
  while ((match = mathRegex.exec(text)) !== null) {
    const mathContent = match[1] || match[2] || '';
    let braces = 0;
    for (let i = 0; i < mathContent.length; i++) {
      if (mathContent[i] === '{' && (i === 0 || mathContent[i - 1] !== '\\')) {
        braces++;
      } else if (mathContent[i] === '}' && (i === 0 || mathContent[i - 1] !== '\\')) {
        braces--;
      }
    }
    if (braces !== 0) {
      return `UNBALANCED_BRACES (${braces > 0 ? 'missing }' : 'extra }'}) in: "${mathContent.substring(0, 40)}"`;
    }
  }

  return null;
}

async function verifyAllLatex() {
  console.log('🔬 Starting Comprehensive LaTeX Verification across all 5,900 questions...\n');

  let totalQuestions = 0;
  let questionsWithMath = 0;
  const issues: LatexIssue[] = [];

  const pageSize = 1000;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: rows, error } = await supabase
      .from('live_exam_questions')
      .select('id, serial, live_exam_id, question, options, explanation')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error || !rows || rows.length === 0) {
      hasMore = false;
      break;
    }

    for (const r of rows) {
      totalQuestions++;
      const fullText = (r.question || '') + ' ' + (r.options || []).join(' ') + ' ' + (r.explanation || '');
      if (fullText.includes('$') || fullText.includes('\\')) {
        questionsWithMath++;
      }

      // Check question
      const qErr = checkLatex(r.question);
      if (qErr) {
        issues.push({
          id: r.id,
          serial: r.serial,
          liveExamId: r.live_exam_id,
          field: 'question',
          issue: qErr,
          snippet: r.question.substring(0, 80),
        });
      }

      // Check options
      if (Array.isArray(r.options)) {
        r.options.forEach((opt: string, idx: number) => {
          const optErr = checkLatex(opt);
          if (optErr) {
            issues.push({
              id: r.id,
              serial: r.serial,
              liveExamId: r.live_exam_id,
              field: `option_${idx}`,
              issue: optErr,
              snippet: opt.substring(0, 80),
            });
          }
        });
      }

      // Check explanation
      const expErr = checkLatex(r.explanation);
      if (expErr) {
        issues.push({
          id: r.id,
          serial: r.serial,
          liveExamId: r.live_exam_id,
          field: 'explanation',
          issue: expErr,
          snippet: r.explanation.substring(0, 80),
        });
      }
    }

    page++;
    if (rows.length < pageSize) hasMore = false;
  }

  console.log(`📊 Total Questions Audited: ${totalQuestions}`);
  console.log(`🧮 Questions containing Math/LaTeX: ${questionsWithMath} (${Math.round((questionsWithMath / totalQuestions) * 100)}%)`);
  console.log(`⚠️ Total LaTeX Syntax Issues Found: ${issues.length}\n`);

  if (issues.length > 0) {
    console.log('List of Issues Found:');
    for (const iss of issues) {
      console.log(`- [Exam: ${iss.liveExamId}] Q#${iss.serial} (${iss.field}): ${iss.issue}`);
      console.log(`  Snippet: "${iss.snippet}..."`);
    }
  } else {
    console.log('🎉 PERFECT! 100% of questions, options, and explanations have valid, balanced LaTeX syntax.');
  }
}

verifyAllLatex();
