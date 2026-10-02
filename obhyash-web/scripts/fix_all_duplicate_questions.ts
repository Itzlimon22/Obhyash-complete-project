import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

interface MCQ {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subject: string;
}

function normalize(q: string): string {
  return q.toLowerCase().replace(/[\s\$\\\{\}\(\)\_\-\,\.\?\:\;\'\"]+/g, '');
}

function parseMarkdownDir(dirPath: string): MCQ[] {
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.md')).sort();
  const questions: MCQ[] = [];

  for (const fileName of files) {
    const fullPath = path.join(dirPath, fileName);
    const content = fs.readFileSync(fullPath, 'utf8');
    const rawBlocks = content.split(/\n(?=### Question \d+)/);

    for (const block of rawBlocks) {
      if (!block.includes('**Question:**')) continue;

      const subMatch = block.match(/- \*\*Subject:\*\*\s*(.+)/);
      const subject = subMatch ? subMatch[1].trim() : '';

      const qStart = block.indexOf('**Question:**');
      if (qStart === -1) continue;
      const afterQ = block.substring(qStart + '**Question:**'.length);
      let qEnd = afterQ.search(/\n\s*-\s*\([A-E]\)/);
      if (qEnd === -1) qEnd = afterQ.indexOf('> **Answer:**');
      const questionText = (qEnd !== -1 ? afterQ.substring(0, qEnd) : afterQ).trim();
      if (!questionText || questionText.length < 5) continue;

      const options: string[] = [];
      const optionMatches = [...block.matchAll(/\n\s*-\s*\(([A-E])\)\s*([^\n]+)/g)];
      for (const om of optionMatches) {
        options.push(om[2].trim());
      }
      if (options.length < 4) continue;

      const ansMatch = block.match(/> \*\*Answer:\*\*\s*\(([A-E])\)/i);
      if (!ansMatch) continue;
      const letter = ansMatch[1].toUpperCase();
      const correctIndex = letter.charCodeAt(0) - 'A'.charCodeAt(0);
      if (correctIndex < 0 || correctIndex >= options.length) continue;

      const explStart = block.indexOf('> **Solve / Explanation:**');
      let explanation = '';
      if (explStart !== -1) {
        explanation = block
          .substring(explStart + '> **Solve / Explanation:**'.length)
          .split('\n')
          .map((l) => l.replace(/^>\s?/, ''))
          .join('\n')
          .replace(/\n---+\s*$/g, '')
          .trim();
      }

      questions.push({
        question: questionText,
        options: options.slice(0, 4),
        correctIndex: Math.min(correctIndex, 3),
        explanation,
        subject,
      });
    }
  }
  return questions;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function fixDuplicates() {
  console.log('🚀 Starting Automatic Duplicate Resolution for all Live Exams...\n');

  // Load pools
  console.log('📂 Loading Engineering pool...');
  const engPool = shuffle(parseMarkdownDir('/Volumes/LimonSSD/PDF_Question_Extractor/Weekly_Solutions_Extracted_MD/Engineering'));
  console.log(`   Found ${engPool.length} Engineering MCQs.`);

  console.log('📂 Loading Varsity pool...');
  const varPool = shuffle(parseMarkdownDir('/Volumes/LimonSSD/PDF_Question_Extractor/Weekly_Solutions_Extracted_MD/Varsity A unit'));
  console.log(`   Found ${varPool.length} Varsity MCQs.`);

  console.log('📂 Loading Medical pool...');
  const medPool = shuffle(parseMarkdownDir('/Volumes/LimonSSD/PDF_Question_Extractor/Weekly_Solutions_Extracted_MD/Unmesh Medical'));
  console.log(`   Found ${medPool.length} Medical MCQs.\n`);

  const { data: exams, error: exErr } = await supabase
    .from('live_exams')
    .select('id, exam_id, title, category')
    .order('exam_id');

  if (exErr || !exams) {
    console.error('Failed to fetch exams:', exErr);
    return;
  }

  let totalReplaced = 0;

  for (const ex of exams) {
    const { data: questions, error: qErr } = await supabase
      .from('live_exam_questions')
      .select('id, serial, question, options, correct_answer_index, explanation, subject')
      .eq('live_exam_id', ex.id)
      .order('serial');

    if (qErr || !questions || questions.length === 0) continue;

    const seenNorms = new Set<string>();
    const dupRows: typeof questions = [];

    // Register all initial unique questions
    for (const q of questions) {
      const norm = normalize(q.question);
      if (seenNorms.has(norm)) {
        dupRows.push(q);
      } else {
        seenNorms.add(norm);
      }
    }

    if (dupRows.length === 0) continue;

    console.log(`⚠️ Exam [${ex.exam_id}] has ${dupRows.length} duplicates. Replacing with unique questions...`);

    const pool = ex.category === 'engineering' ? engPool : ex.category === 'varsity' ? varPool : medPool;

    for (const dup of dupRows) {
      // Find a replacement question not already in seenNorms
      const rep = pool.find((p) => {
        const norm = normalize(p.question);
        if (seenNorms.has(norm)) return false;
        // If subject is specified, try to match or keep flexible
        return true;
      });

      if (!rep) {
        console.warn(`   Could not find replacement for serial ${dup.serial}`);
        continue;
      }

      const repNorm = normalize(rep.question);
      seenNorms.add(repNorm);

      // Update in Supabase
      const { error: upErr } = await supabase
        .from('live_exam_questions')
        .update({
          question: rep.question,
          options: rep.options,
          correct_answer_index: rep.correctIndex,
          explanation: rep.explanation,
          subject: rep.subject || dup.subject,
        })
        .eq('id', dup.id);

      if (upErr) {
        console.error(`   Failed to update row ${dup.id}:`, upErr.message);
      } else {
        totalReplaced++;
        console.log(`   ✅ Replaced Q#${dup.serial} with: "${rep.question.substring(0, 50)}..."`);
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`🎉 ALL DUPLICATES REPLACED! Total: ${totalReplaced}`);
  console.log(`==================================================\n`);
}

fixDuplicates();
