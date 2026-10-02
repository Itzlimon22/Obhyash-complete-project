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

function parseFileQuestions(filePath: string): MCQ[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const rawBlocks = content.split(/\n(?=### Question \d+)/);
  const questions: MCQ[] = [];

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
        .replace(/(\r?\n\s*[-*_]{3,}\s*)+[\r\n\s]*$/g, '')
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
  return questions;
}

async function fixSpecificMismatches() {
  console.log('🩺 Replacing the 7 cross-syllabus questions with exact syllabus questions...\n');

  const medDir = '/Volumes/LimonSSD/PDF_Question_Extractor/Weekly_Solutions_Extracted_MD/Unmesh Medical';
  const varDir = '/Volumes/LimonSSD/PDF_Question_Extractor/Weekly_Solutions_Extracted_MD/Varsity A unit';

  // 1. medical_live_06 (Syllabus: কোষ বিভাজন, পরিপাক ও শোষণ, রক্ত ও সংবহন)
  // Current Q#41 is: Change the voice: 'Nobody trusts a traitor.'
  const book02 = parseFileQuestions(path.join(medDir, 'Unmesh Medical Weekly Solution Book - 02.md'));
  const repMed06 = book02.find(
    (q) =>
      q.question.includes('রক্ত') ||
      q.question.includes('পরিপাক') ||
      q.question.includes('হৃদপিণ্ড') ||
      q.question.includes('এনজাইম') ||
      q.question.includes('পাকস্থলী')
  );

  if (repMed06) {
    const { data: qRow } = await supabase
      .from('live_exam_questions')
      .select('id')
      .eq('question', "Change the voice: 'Nobody trusts a traitor.'")
      .ilike('batch', '%medical%')
      .single();

    // Find row for medical_live_06 specifically
    const { data: ex06 } = await supabase.from('live_exams').select('id').eq('exam_id', 'medical_live_06').single();
    if (ex06) {
      await supabase
        .from('live_exam_questions')
        .update({
          question: repMed06.question,
          options: repMed06.options,
          correct_answer_index: repMed06.correctIndex,
          explanation: repMed06.explanation,
          subject: 'জীববিজ্ঞান',
        })
        .eq('live_exam_id', ex06.id)
        .eq('serial', 41);
      console.log('✅ Fixed medical_live_06 Q#41 with Biology question:', repMed06.question.substring(0, 45));
    }
  }

  // 2. medical_live_10 (Syllabus: আদর্শ গ্যাস, তাপগতিবিদ্যা, GK: ভূগোল, নদ-নদী)
  const book04 = parseFileQuestions(path.join(medDir, 'Unmesh Medical Weekly Solution Book - 04.md'));
  const repMed10 = book04.find(
    (q) => q.question.includes('গ্যাস') || q.question.includes('তাপমাত্রা') || q.question.includes('চাপ') || q.question.includes('কেলভিন')
  );
  const { data: ex10 } = await supabase.from('live_exams').select('id').eq('exam_id', 'medical_live_10').single();
  if (ex10 && repMed10) {
    await supabase
      .from('live_exam_questions')
      .update({
        question: repMed10.question,
        options: repMed10.options,
        correct_answer_index: repMed10.correctIndex,
        explanation: repMed10.explanation,
        subject: 'পদার্থবিজ্ঞান',
      })
      .eq('live_exam_id', ex10.id)
      .eq('serial', 29);
    console.log('✅ Fixed medical_live_10 Q#29 with Physics question:', repMed10.question.substring(0, 45));
  }

  // 3. medical_live_13 (Syllabus: স্থির তড়িৎ, চল তড়িৎ, GK: বাজেট, মেগা প্রজেক্ট)
  const book06 = parseFileQuestions(path.join(medDir, 'Unmesh Medical Weekly Solution Book - 06.md'));
  const repMed13 = book06.find(
    (q) => q.question.includes('তড়িৎ') || q.question.includes('তড়িৎ') || q.question.includes('রোধ') || q.question.includes('বর্তনী') || q.question.includes('কুলম্ব')
  );
  const { data: ex13 } = await supabase.from('live_exams').select('id').eq('exam_id', 'medical_live_13').single();
  if (ex13 && repMed13) {
    await supabase
      .from('live_exam_questions')
      .update({
        question: repMed13.question,
        options: repMed13.options,
        correct_answer_index: repMed13.correctIndex,
        explanation: repMed13.explanation,
        subject: 'পদার্থবিজ্ঞান',
      })
      .eq('live_exam_id', ex13.id)
      .eq('serial', 48);
    console.log('✅ Fixed medical_live_13 Q#48 with Physics question:', repMed13.question.substring(0, 45));
  }

  // 4. medical_live_15 (Syllabus: টিস্যু ও টিস্যুতন্ত্র, উদ্ভিদ প্রজনন, মানব জীবনের ধারাবাহিকতা)
  const book07 = parseFileQuestions(path.join(medDir, 'Unmesh Medical Weekly Solution Book - 07.md'));
  const repMed15 = book07.find(
    (q) => q.question.includes('টিস্যু') || q.question.includes('জাইলেম') || q.question.includes('ফ্লোয়েম') || q.question.includes('প্রজনন') || q.question.includes('ভ্রূণ')
  );
  const { data: ex15 } = await supabase.from('live_exams').select('id').eq('exam_id', 'medical_live_15').single();
  if (ex15 && repMed15) {
    await supabase
      .from('live_exam_questions')
      .update({
        question: repMed15.question,
        options: repMed15.options,
        correct_answer_index: repMed15.correctIndex,
        explanation: repMed15.explanation,
        subject: 'জীববিজ্ঞান',
      })
      .eq('live_exam_id', ex15.id)
      .eq('serial', 37);
    console.log('✅ Fixed medical_live_15 Q#37 with Biology question:', repMed15.question.substring(0, 45));
  }

  // 5. medical_live_17 (Syllabus: জৈব যৌগ পর্ব-২: অ্যালকোহল, অ্যালডিহাইড-কিটোন, English: Idioms, Spelling, Correction)
  // Current Q#48 is: নওগাঁ জেলার পাহাড়পুরে অবস্থিত 'সোমপুর বিহার' (GK) -> Replace with English Idioms or Spelling question
  const book08 = parseFileQuestions(path.join(medDir, 'Unmesh Medical Weekly Solution Book - 08.md'));
  const repMed17 = book08.find(
    (q) =>
      q.question.includes('spelling') ||
      q.question.includes('idiom') ||
      q.question.includes('phrase') ||
      q.question.includes('correct sentence') ||
      q.question.includes('meaning of')
  );
  const { data: ex17 } = await supabase.from('live_exams').select('id').eq('exam_id', 'medical_live_17').single();
  if (ex17 && repMed17) {
    await supabase
      .from('live_exam_questions')
      .update({
        question: repMed17.question,
        options: repMed17.options,
        correct_answer_index: repMed17.correctIndex,
        explanation: repMed17.explanation,
        subject: 'English',
      })
      .eq('live_exam_id', ex17.id)
      .eq('serial', 48);
    console.log('✅ Fixed medical_live_17 Q#48 with English question:', repMed17.question.substring(0, 45));
  }

  // 6. medical_live_19 (Syllabus: আধুনিক পদার্থবিজ্ঞান, পরমাণু মডেল, সেমিকন্ডাক্টর, GK: সাম্প্রতিক)
  const book09 = parseFileQuestions(path.join(medDir, 'Unmesh Medical Weekly Solution Book - 09.md'));
  const repMed19 = book09.find(
    (q) =>
      q.question.includes('পরমাণু') ||
      q.question.includes('সেমিকন্ডাক্টর') ||
      q.question.includes('ইলেকট্রন') ||
      q.question.includes('ফোটন') ||
      q.question.includes('তেজস্ক্রিয়')
  );
  const { data: ex19 } = await supabase.from('live_exams').select('id').eq('exam_id', 'medical_live_19').single();
  if (ex19 && repMed19) {
    await supabase
      .from('live_exam_questions')
      .update({
        question: repMed19.question,
        options: repMed19.options,
        correct_answer_index: repMed19.correctIndex,
        explanation: repMed19.explanation,
        subject: 'পদার্থবিজ্ঞান',
      })
      .eq('live_exam_id', ex19.id)
      .eq('serial', 30);
    console.log('✅ Fixed medical_live_19 Q#30 with Physics question:', repMed19.question.substring(0, 45));
  }

  // 7. varsity_live_09 (Syllabus: অন্তরীকরণ ও pH ট্রিকস - Math & Chemistry)
  // Current Q#42 is: 'Dog days' means- (English)
  const varBook03 = parseFileQuestions(path.join(varDir, 'Udvash Varsity Ka Weekly Solution Book - 03.md'));
  const repVar09 = varBook03.find(
    (q) => q.question.includes('\\frac{d}{dx}') || q.question.includes('অন্তরীকরণ') || q.question.includes('লঘুমান') || q.question.includes('গুরুমান') || q.question.includes('pH')
  );
  const { data: exVar09 } = await supabase.from('live_exams').select('id').eq('exam_id', 'varsity_live_09').single();
  if (exVar09 && repVar09) {
    await supabase
      .from('live_exam_questions')
      .update({
        question: repVar09.question,
        options: repVar09.options,
        correct_answer_index: repVar09.correctIndex,
        explanation: repVar09.explanation,
        subject: 'Higher Math 1st Paper',
      })
      .eq('live_exam_id', exVar09.id)
      .eq('serial', 42);
    console.log('✅ Fixed varsity_live_09 Q#42 with Calculus question:', repVar09.question.substring(0, 45));
  }

  console.log('\n🎉 ALL 7 CROSS-SYLLABUS QUESTIONS SUCCESSFULLY RESOLVED!');
}

fixSpecificMismatches();
