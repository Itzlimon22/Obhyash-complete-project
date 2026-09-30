import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

export interface MCQ {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subject: string;
  chapter: string;
  source: string;
}

function parseMarkdownDirectory(dirPath: string): MCQ[] {
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    return [];
  }
  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.md')).sort();
  const questions: MCQ[] = [];

  for (const fileName of files) {
    const fullPath = path.join(dirPath, fileName);
    const content = fs.readFileSync(fullPath, 'utf8');
    const rawBlocks = content.split(/\n(?=### Question \d+)/);

    for (const block of rawBlocks) {
      if (!block.includes('[MCQ]')) continue;

      const subMatch = block.match(/- \*\*Subject:\*\*\s*(.+)/);
      const chapMatch = block.match(/- \*\*Chapter:\*\*\s*(.+)/);

      const subject = subMatch ? subMatch[1].trim() : '';
      const chapter = chapMatch ? chapMatch[1].trim() : '';

      // Question
      const qStart = block.indexOf('**Question:**');
      if (qStart === -1) continue;
      const afterQ = block.substring(qStart + '**Question:**'.length);
      let qEnd = afterQ.search(/\n\s*-\s*\([A-E]\)/);
      if (qEnd === -1) qEnd = afterQ.indexOf('> **Answer:**');
      const questionText = (qEnd !== -1 ? afterQ.substring(0, qEnd) : afterQ).trim();
      if (!questionText || questionText.length < 5) continue;

      // Options
      const options: string[] = [];
      const optionMatches = [...block.matchAll(/\n\s*-\s*\(([A-E])\)\s*([^\n]+)/g)];
      for (const om of optionMatches) {
        options.push(om[2].trim());
      }
      if (options.length < 4) continue;

      // Answer
      const ansMatch = block.match(/> \*\*Answer:\*\*\s*\(([A-E])\)/i);
      if (!ansMatch) continue;
      const letter = ansMatch[1].toUpperCase();
      const correctIndex = letter.charCodeAt(0) - 'A'.charCodeAt(0);
      if (correctIndex < 0 || correctIndex >= options.length) continue;

      // Explanation
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
        chapter,
        source: fileName,
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

// Map keywords to exam ID
const ENG_KEYWORD_MAP: Record<string, string[]> = {
  engineering_live_01: ['ভেক্টর', 'গতিবিদ্যা', 'বলবিদ্যা'],
  engineering_live_02: ['গুণগত', 'বর্ণালী', 'দ্রাব্যতা', 'কোয়ান্টাম'],
  engineering_live_03: ['ম্যাট্রিক্স', 'নির্ণায়ক', 'সরলরেখা'],
  engineering_live_04: ['কাজ', 'ক্ষমতা', 'মহাকর্ষ', 'অভিকর্ষ'],
  engineering_live_05: ['পর্যায়বৃত্ত ধর্ম', 'রাসায়নিক বন্ধন', 'হাইব্রিডাইজেশন'],
  engineering_live_06: ['বৃত্ত', 'ত্রিকোণমিতি'],
  engineering_live_07: ['পর্যায়বৃত্ত গতি', 'আদর্শ গ্যাস', 'গতিতত্ত্ব'],
  engineering_live_08: ['রাসায়নিক পরিবর্তন', 'বাফার', 'সাম্যাবস্থা', 'kp'],
  engineering_live_09: ['অন্তরীকরণ', 'লিমিট', 'স্পর্শক'],
  engineering_live_10: ['তাপগতিবিদ্যা', 'স্থির তড়িৎ', 'স্থির তড়িৎ'],
  engineering_live_11: ['পরিবেশ রসায়ন', 'তড়িৎ রসায়ন', 'পরিবেশ রসায়ন'],
  engineering_live_12: ['যোগজীকরণ', 'সমাকলন', 'ক্ষেত্রফল'],
  engineering_live_13: ['চল তড়িৎ', 'চল তড়িৎ', 'চৌম্বক'],
  engineering_live_14: ['জৈব রসায়ন', 'জৈব রসায়ন', 'হাইড্রোকার্বন', 'বেনজিন'],
  engineering_live_15: ['জটিল সংখ্যা', 'বহুপদী'],
  engineering_live_16: ['তাড়িতচৌম্বক', 'আলোকবিজ্ঞান', 'আবেশ'],
  engineering_live_17: ['অ্যালকোহল', 'অ্যালডিহাইড', 'কিটোন', 'জৈব অ্যাসিড', 'জৈব'],
  engineering_live_18: ['কণিক', 'কনিক', 'উপবৃত্ত', 'অধিবৃত্ত', 'পরাবৃত্ত'],
  engineering_live_19: ['ভৌত আলোকবিজ্ঞান', 'পরমাণু মডেল', 'আধুনিক পদার্থবিজ্ঞান'],
  engineering_live_20: ['পরিমাণগত রসায়ন', 'মোলারিটি', 'টাইট্রেশন', 'পরিমাণগত'],
  engineering_live_21: ['বিপরীত ত্রিকোণমিতিক', 'দ্বিপদী'],
  engineering_live_22: ['সেমিকন্ডাক্টর', 'ইলেকট্রনিক্স', 'লজিক'],
  engineering_live_23: ['কর্মমুখী রসায়ন', 'অর্থনৈতিক রসায়ন', 'রসায়ন'],
  engineering_live_24: ['স্থিতিবিদ্যা', 'গতিবিদ্যা', 'বলবিদ্যা'],
};

const VARSITY_KEYWORD_MAP: Record<string, string[]> = {
  varsity_live_01: ['ভেক্টর', 'গতিবিদ্যা', 'সরলরেখা', 'ম্যাট্রিক্স'],
  varsity_live_02: ['গুণগত', 'কোষ'],
  varsity_live_03: ['সরলরেখা', 'ভেক্টর', 'দ্রাব্যতা'],
  varsity_live_04: ['বলবিদ্যা', 'কাজ', 'ক্ষমতা', 'বৃত্ত', 'ত্রিকোণমিতি'],
  varsity_live_05: ['পর্যায়বৃত্ত ধর্ম', 'পর্যায়বৃত্ত', 'প্রাণী', 'পরিপাক'],
  varsity_live_06: ['ত্রিকোণমিতি', 'ঘর্ষণ', 'কোণ'],
  varsity_live_07: ['মহাকর্ষ', 'পর্যায়বৃত্ত গতি', 'অন্তরীকরণ'],
  varsity_live_08: ['রাসায়নিক পরিবর্তন', 'রক্ত', 'শ্বসন'],
  varsity_live_09: ['অন্তরীকরণ', 'ph', 'অম্ল'],
  varsity_live_10: ['আদর্শ গ্যাস', 'তাপগতিবিদ্যা', 'স্থির তড়িৎ', 'যোগজীকরণ'],
  varsity_live_11: ['পরিবেশ রসায়ন', 'তড়িৎ রসায়ন', 'উদ্ভিদ', 'অণুজীব'],
  varsity_live_12: ['যোগজ', 'গ্যাস', 'গ্রাফ'],
  varsity_live_13: ['চল তড়িৎ', 'চৌম্বক', 'জটিল সংখ্যা', 'বহুপদী'],
  varsity_live_14: ['জৈব যৌগ', 'হাইড্রোকার্বন', 'উদ্ভিদ শারীরতত্ত্ব', 'সালোকসংশ্লেষণ'],
  varsity_live_15: ['জৈব', 'ওমেগা', 'শনাক্তকরণ'],
  varsity_live_16: ['আলোকবিজ্ঞান', 'আধুনিক পদ', 'কণিক', 'কনিক'],
  varsity_live_17: ['অ্যালকোহল', 'অ্যালডিহাইড', 'মানব শারীরতত্ত্ব', 'জিনতত্ত্ব'],
  varsity_live_18: ['কণিক', 'উৎকেন্দ্রিকতা', 'বিকারক'],
  varsity_live_19: ['পরমাণু', 'সেমিকন্ডাক্টর', 'বিপরীত ত্রিকোণমিতি', 'দ্বিপদী'],
  varsity_live_20: ['পরিমাণগত', 'টাইট্রেশন', 'জীবপ্রযুক্তি', 'বাস্তুতন্ত্র'],
  varsity_live_21: ['লজিক গেট', 'টাইট্রেশন'],
};

async function fetchSupplementalQuestions(keywords: string[], limit: number): Promise<MCQ[]> {
  try {
    const orClauses = keywords.map((k) => `chapter.ilike.%${k}%,question.ilike.%${k}%`).join(',');
    const { data } = await supabase
      .from('questions')
      .select('question, options, correct_answer_indices, explanation, subject, chapter')
      .or(orClauses)
      .limit(limit * 2);

    if (!data) return [];
    return data
      .filter((q: any) => Array.isArray(q.options) && q.options.length >= 4 && q.correct_answer_indices?.length > 0 && q.question?.length > 5)
      .map((q: any) => ({
        question: q.question,
        options: q.options.slice(0, 4),
        correctIndex: Math.min(q.correct_answer_indices[0], 3),
        explanation: q.explanation || '',
        subject: q.subject || 'সাধারণ',
        chapter: q.chapter || 'সাধারণ',
        source: 'Supabase_Question_Bank',
      }));
  } catch (err) {
    return [];
  }
}

async function run() {
  console.log('🚀 Starting Full Engineering & Varsity Live Exam Questions Population...\n');

  // 1. Parse both directories
  const engDir = '/Volumes/LimonSSD/PDF_Question_Extractor/Weekly_Solutions_Extracted_MD/Engineering';
  const varDir = '/Volumes/LimonSSD/PDF_Question_Extractor/Weekly_Solutions_Extracted_MD/Varsity A unit';

  console.log('📂 Parsing Engineering MD files...');
  const engPool = parseMarkdownDirectory(engDir);
  console.log(`✅ Parsed ${engPool.length} Engineering MCQs.`);

  console.log('📂 Parsing Varsity A Unit MD files...');
  const varPool = parseMarkdownDirectory(varDir);
  console.log(`✅ Parsed ${varPool.length} Varsity MCQs.`);

  // 2. Fetch all Engineering and Varsity exams from DB
  const { data: exams, error: examErr } = await supabase
    .from('live_exams')
    .select('id, exam_id, title, category, description, total_marks')
    .in('category', ['engineering', 'varsity'])
    .order('exam_id');

  if (examErr || !exams) {
    console.error('❌ Failed to fetch live exams:', examErr?.message);
    return;
  }
  console.log(`\n📋 Found ${exams.length} exams across Engineering & Varsity.\n`);

  // Cache to store questions for daily exams so weekly exams can combine them
  const examQuestionsCache: Record<string, MCQ[]> = {};

  let totalQuestionsInserted = 0;

  for (const exam of exams) {
    const isWeekly = exam.exam_id.includes('weekly') || exam.exam_id.includes('mega');
    const targetCount = exam.total_marks || (isWeekly ? 100 : 50);
    const category = exam.category; // 'engineering' or 'varsity'
    const pool = category === 'engineering' ? engPool : varPool;

    console.log(`--------------------------------------------------`);
    console.log(`📝 Processing [${exam.exam_id}] ${exam.title} (Target: ${targetCount} MCQs)`);

    let selected: MCQ[] = [];

    if (isWeekly) {
      // Find corresponding daily exams
      // e.g. engineering_weekly_01 -> engineering_live_01, 02, 03
      const numMatch = exam.exam_id.match(/(\d+)/);
      const weekNum = numMatch ? parseInt(numMatch[1], 10) : 1;

      if (exam.exam_id.includes('mega')) {
        // Grand mock: pool from all previous daily exams
        const allCached = Object.values(examQuestionsCache).flat();
        selected = shuffle(allCached).slice(0, targetCount);
      } else {
        const d1 = `${category}_live_${String((weekNum - 1) * 3 + 1).padStart(2, '0')}`;
        const d2 = `${category}_live_${String((weekNum - 1) * 3 + 2).padStart(2, '0')}`;
        const d3 = `${category}_live_${String((weekNum - 1) * 3 + 3).padStart(2, '0')}`;

        const combined = [
          ...(examQuestionsCache[d1] || []),
          ...(examQuestionsCache[d2] || []),
          ...(examQuestionsCache[d3] || []),
        ];
        selected = shuffle(combined).slice(0, targetCount);
      }
    } else {
      // Daily Exam
      const keywordMap = category === 'engineering' ? ENG_KEYWORD_MAP : VARSITY_KEYWORD_MAP;
      const keywords = keywordMap[exam.exam_id] || [exam.title];

      // Filter from extracted pool
      const matched = pool.filter((q) => {
        const text = `${q.chapter} ${q.subject} ${q.question}`.toLowerCase();
        return keywords.some((k) => text.includes(k.toLowerCase()));
      });

      selected = shuffle(matched);
      console.log(`   Found ${matched.length} matched MCQs in extracted pool for keywords: [${keywords.join(', ')}]`);
    }

    // If still need more questions, supplement from Supabase Question Bank
    if (selected.length < targetCount) {
      const needed = targetCount - selected.length;
      console.log(`   Supplementing ${needed} questions from Supabase questions table...`);
      const keywordMap = category === 'engineering' ? ENG_KEYWORD_MAP : VARSITY_KEYWORD_MAP;
      const keywords = keywordMap[exam.exam_id] || ['পদার্থবিজ্ঞান', 'রসায়ন'];
      const supplemental = await fetchSupplementalQuestions(keywords, needed);
      selected = [...selected, ...supplemental];
    }

    // Final slice to targetCount
    selected = shuffle(selected).slice(0, targetCount);

    // Save in cache
    examQuestionsCache[exam.exam_id] = selected;

    if (selected.length === 0) {
      console.warn(`   ⚠️ Warning: 0 questions found for ${exam.exam_id}`);
      continue;
    }

    // Clear existing questions for this exam
    await supabase.from('live_exam_questions').delete().eq('live_exam_id', exam.id);

    // Prepare payload
    const payload = selected.map((q, idx) => ({
      live_exam_id: exam.id,
      question_id: null,
      serial: idx + 1,
      points: 1,
      question: q.question,
      options: q.options,
      correct_answer_index: q.correctIndex,
      explanation: q.explanation,
      batch: category,
      subject: q.subject || (category === 'engineering' ? 'ইঞ্জিনিয়ারিং' : 'ভার্সিটি ক'),
    }));

    // Batch insert in chunks of 50
    const chunkSize = 50;
    for (let c = 0; c < payload.length; c += chunkSize) {
      const chunk = payload.slice(c, c + chunkSize);
      const { error: insErr } = await supabase.from('live_exam_questions').insert(chunk);
      if (insErr) {
        console.error(`   ❌ Failed chunk insert for ${exam.exam_id}:`, insErr.message);
      }
    }

    totalQuestionsInserted += payload.length;
    console.log(`   ✅ Successfully inserted ${payload.length} questions for [${exam.exam_id}] (Serial 1 - ${payload.length})`);
  }

  console.log(`\n==================================================`);
  console.log(`🎉 ALL DONE!`);
  console.log(`Total Live Exam Questions Populated: ${totalQuestionsInserted}`);
  console.log(`==================================================`);
}

run();
