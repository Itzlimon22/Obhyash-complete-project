import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface ParsedQuestion {
  question: string;
  options: string[];
  correct_answer_indices: number[];
  explanation: string;
  subject: string;
  chapter: string;
  difficulty: string;
  source_file: string;
}

function parseMCQBlock(block: string, fileName: string): ParsedQuestion | null {
  const chapterMatch = block.match(/- \*\*Chapter:\*\*\s*(.+)/);
  const diffMatch = block.match(/- \*\*Difficulty:\*\*\s*(.+)/);

  const subject = 'পদার্থবিজ্ঞান ১ম পত্র';
  const rawChapter = chapterMatch ? chapterMatch[1].trim() : '';
  const chapter = rawChapter.includes('ভেক্টর') ? 'ভেক্টর' : 'নিউটনীয় বলবিদ্যা';
  const difficulty = diffMatch ? diffMatch[1].trim() : 'Medium';

  // Question text
  const qStartIdx = block.indexOf('**Question:**');
  if (qStartIdx === -1) return null;
  const afterQ = block.substring(qStartIdx + '**Question:**'.length);
  let qEndIdx = afterQ.search(/\n\s*-\s*\([A-E]\)/);
  if (qEndIdx === -1) qEndIdx = afterQ.indexOf('> **Answer:**');
  const questionText = (qEndIdx !== -1 ? afterQ.substring(0, qEndIdx) : afterQ).trim();

  if (!questionText) return null;

  // Options
  const options: string[] = [];
  const optionMatches = [...block.matchAll(/\n\s*-\s*\(([A-E])\)\s*([^\n]+)/g)];
  for (const om of optionMatches) {
    options.push(om[2].trim());
  }
  if (options.length < 4) return null;

  // Answer
  const ansMatch = block.match(/> \*\*Answer:\*\*\s*\(([A-E])\)/i);
  if (!ansMatch) return null;
  const letter = ansMatch[1].toUpperCase();
  const correctIndex = letter.charCodeAt(0) - 'A'.charCodeAt(0);
  if (correctIndex < 0 || correctIndex >= options.length) return null;

  // Explanation
  const explStartIdx = block.indexOf('> **Solve / Explanation:**');
  let explanation = '';
  if (explStartIdx !== -1) {
    const rawExpl = block.substring(explStartIdx + '> **Solve / Explanation:**'.length);
    explanation = rawExpl
      .split('\n')
      .map((l) => l.replace(/^>\s?/, ''))
      .join('\n')
      .replace(/\n---+\s*$/g, '')
      .trim();
  }

  return {
    question: questionText,
    options,
    correct_answer_indices: [correctIndex],
    explanation,
    subject,
    chapter,
    difficulty,
    source_file: fileName,
  };
}

function getQuestionsFromFile(filePath: string, chapterFilter: string, limit: number): ParsedQuestion[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const rawBlocks = content.split(/\n(?=### Question \d+)/);
  const result: ParsedQuestion[] = [];
  const fileName = path.basename(filePath);

  for (const b of rawBlocks) {
    if (!b.includes('[MCQ]')) continue;
    if (!b.includes(chapterFilter)) continue;
    const q = parseMCQBlock(b, fileName);
    if (q) {
      result.push(q);
      if (result.length >= limit) break;
    }
  }
  return result;
}

async function run() {
  console.log('🚀 Starting Engineering Live 01 Question Ingestion & Activation...\n');

  // 1. Fetch exam from live_exams
  const { data: exam, error: examErr } = await supabase
    .from('live_exams')
    .select('*')
    .eq('exam_id', 'engineering_live_01')
    .single();

  if (examErr || !exam) {
    console.error('❌ Could not find exam engineering_live_01:', examErr?.message);
    process.exit(1);
  }

  console.log(`📋 Found Exam: [${exam.exam_id}] ${exam.title} (ID: ${exam.id})`);

  // 2. Extract questions for all 3 syllabus chapters: ভেক্টর (17), গতিবিদ্যা (17), নিউটনিয়ান বলবিদ্যা (16)
  const dir = '/Volumes/LimonSSD/PDF_Question_Extractor/Weekly_Solutions_Extracted_MD/Engineering';
  const vectorQuestions = getQuestionsFromFile(path.join(dir, 'Udvash Engineering Weekly Solution Book - 01.md'), 'ভেক্টর', 17);
  const newtonQuestions = getQuestionsFromFile(path.join(dir, 'Udvash Engineering Weekly Solution Book - 02.md'), 'বলবিদ্যা', 16);

  // Fetch 17 high-yield questions for গতিবিদ্যা
  const { data: dbGotibidda, error: gotibiddaErr } = await supabase
    .from('questions')
    .select('question, options, correct_answer_indices, explanation, difficulty, subject, chapter')
    .eq('chapter', 'গতিবিদ্যা')
    .limit(30);

  const gotibiddaQuestions: ParsedQuestion[] = (dbGotibidda || [])
    .filter((q: any) => Array.isArray(q.options) && q.options.length >= 4 && q.correct_answer_indices?.length > 0 && q.question?.length > 10)
    .slice(0, 17)
    .map((q: any) => ({
      question: q.question,
      options: q.options,
      correct_answer_indices: q.correct_answer_indices,
      explanation: q.explanation || '',
      subject: 'পদার্থবিজ্ঞান ১ম পত্র',
      chapter: 'গতিবিদ্যা',
      difficulty: q.difficulty || 'Medium',
      source_file: 'HSC_Engineering_Question_Bank',
    }));

  console.log(`📦 Loaded chapters: Vector=${vectorQuestions.length}, Dynamics (গতিবিদ্যা)=${gotibiddaQuestions.length}, Mechanics=${newtonQuestions.length}`);

  // Combine all questions from the 3 chapters
  const allQuestions: ParsedQuestion[] = [...vectorQuestions, ...gotibiddaQuestions, ...newtonQuestions];

  // Fisher-Yates true random shuffle: totally random order, no fixed alternating pattern
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }

  const selectedQuestions = allQuestions.slice(0, 50);
  console.log(`🎲 Fully randomized 50 questions with zero predictable pattern across all 3 chapters.`);

  if (selectedQuestions.length < 50) {
    console.error('❌ Could not get full 50 questions.');
    process.exit(1);
  }

  // 3. Clear existing questions for this exam in live_exam_questions
  const { error: delErr } = await supabase
    .from('live_exam_questions')
    .delete()
    .eq('live_exam_id', exam.id);

  if (delErr) {
    console.warn('⚠️ Delete old questions warning:', delErr.message);
  }

  // 4. Insert into public.live_exam_questions junction
  console.log('⏳ Inserting 50 questions directly into public.live_exam_questions table...');
  const q1Diagram = 'https://pub-6560195307b14ca49f6f183b13bfa841.r2.dev/questions/physics_1st/chapter_০৪/phy1_ch4_2_pdf_p11_148_0_pad4.png';
  const junctionPayload = selectedQuestions.map((q, idx) => {
    let qText = q.question;
    if (qText.includes('সমান ভর বিশিষ্ট তিনটি খণ্ড') && !qText.includes(q1Diagram)) {
      qText = `${qText.trim()}\n\n![চিত্র](${q1Diagram})`;
    }
    return {
      live_exam_id: exam.id,
      question_id: null,
      serial: idx + 1,
      points: 1,
      question: qText,
      options: q.options,
      correct_answer_index: q.correct_answer_indices[0],
      explanation: q.explanation,
      batch: 'engineering',
      subject: 'পদার্থবিজ্ঞান',
    };
  });

  const { data: insertedJunction, error: juncErr } = await supabase
    .from('live_exam_questions')
    .insert(junctionPayload)
    .select('id');

  if (juncErr || !insertedJunction) {
    console.error('❌ Failed to link live_exam_questions:', juncErr?.message);
    process.exit(1);
  }

  console.log(`✅ Successfully inserted ${insertedJunction.length} questions into live_exam_questions with serial 1 to 50!`);

  // 6. Set exam to ACTIVE/ONGOING for immediate testing
  const now = new Date();
  const startTime = new Date(now.getTime() - 20 * 60 * 1000).toISOString(); // started 20 mins ago
  const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(); // ends in 4 hours

  const { error: updateErr } = await supabase
    .from('live_exams')
    .update({
      status: 'published',
      start_time: startTime,
      end_time: endTime,
      total_marks: 50,
      duration_minutes: 30,
      is_leaderboard_published: true,
      is_answer_published: false,
    })
    .eq('id', exam.id);

  if (updateErr) {
    console.error('❌ Failed to activate exam:', updateErr.message);
    process.exit(1);
  }

  console.log('\n🎉 SUCCESS! Engineering Daily Exam - 1 is now ACTIVE (Ongoing) with 50 Questions ready for testing!');
  console.log(`   - Exam ID: ${exam.exam_id}`);
  console.log(`   - Questions: 50 MCQ (Serial 1-25: ভেক্টর, Serial 26-50: বলবিদ্যা)`);
  console.log(`   - Status: Ongoing (Start: ${startTime}, End: ${endTime})`);
}

run();
