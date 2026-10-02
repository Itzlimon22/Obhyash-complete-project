import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

export interface MedicalMCQ {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subject: string;
  header: string;
  source: string;
}

function parseMedicalMarkdown(content: string, fileName: string): MedicalMCQ[] {
  const sections = content.split(/\n(?=## Exam:\s*)/);
  const questions: MedicalMCQ[] = [];

  for (const sec of sections) {
    const headerMatch = sec.match(/## Exam:\s*([^\n]+)/);
    const header = headerMatch ? headerMatch[1].trim() : '';

    let defaultSubject = '';
    const hLower = header.toLowerCase();
    if (hLower.includes('bio') || hLower.includes('biology') || hLower.includes('botany') || hLower.includes('zoology')) defaultSubject = 'জীববিজ্ঞান';
    else if (hLower.includes('phy') || hLower.includes('physics')) defaultSubject = 'পদার্থবিজ্ঞান';
    else if (hLower.includes('chem') || hLower.includes('chemistry')) defaultSubject = 'রসায়ন';
    else if (hLower.includes('eng') || hLower.includes('english')) defaultSubject = 'English';
    else if (hLower.includes('gk') || hLower.includes('general knowledge')) defaultSubject = 'সাধারণ জ্ঞান';

    const rawBlocks = sec.split(/\n(?=### Question \d+)/);
    for (const block of rawBlocks) {
      if (!block.includes('**Question:**')) continue;

      const qStart = block.indexOf('**Question:**');
      if (qStart === -1) continue;
      const afterQ = block.substring(qStart + '**Question:**'.length);
      let qEnd = afterQ.search(/\n\s*-\s*\([A-E]\)/);
      if (qEnd === -1) qEnd = afterQ.indexOf('> **Answer:**');
      const questionText = (qEnd !== -1 ? afterQ.substring(0, qEnd) : afterQ).trim();
      if (!questionText || questionText.length < 4) continue;

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

      let subject = defaultSubject;
      const fullText = (questionText + ' ' + explanation).toLowerCase();
      if (!subject) {
        if (fullText.includes('আজমল') || fullText.includes('হাসান') || fullText.includes('প্রাণী') || fullText.includes('উদ্ভিদ') || fullText.includes('রক্ত') || fullText.includes('কোষ') || fullText.includes('মাইটোকন্ড্রিয়া') || fullText.includes('ডিএনএ')) {
          subject = 'জীববিজ্ঞান';
        } else if (fullText.includes('ইসহাক') || fullText.includes('হিসহাক') || fullText.includes('ভেক্টর') || fullText.includes('বেগ') || fullText.includes('বলবিদ্যা') || fullText.includes('তাপগতি')) {
          subject = 'পদার্থবিজ্ঞান';
        } else if (fullText.includes('হাজারী') || fullText.includes('রসায়ন') || fullText.includes('মোল') || fullText.includes('অ্যাসিড') || fullText.includes('জৈব যৌগ') || fullText.includes('দ্রাব্যতা')) {
          subject = 'রসায়ন';
        } else if (/[a-zA-Z]{5,}/.test(questionText) && (fullText.includes('verb') || fullText.includes('noun') || fullText.includes('sentence') || fullText.includes('synonym') || fullText.includes('spelling') || fullText.includes('preposition') || fullText.includes('antonym'))) {
          subject = 'English';
        } else if (fullText.includes('মুক্তিযুদ্ধ') || fullText.includes('সংবিধান') || fullText.includes('বাংলাদেশ') || fullText.includes('বঙ্গবন্ধু') || fullText.includes('উপজাতি') || fullText.includes('নদ-নদী') || fullText.includes('১৯৭১')) {
          subject = 'সাধারণ জ্ঞান';
        } else {
          subject = 'জীববিজ্ঞান'; // Medical primary subject fallback
        }
      }

      questions.push({
        question: questionText,
        options: options.slice(0, 4),
        correctIndex: Math.min(correctIndex, 3),
        explanation,
        subject,
        header,
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

// Syllabus keywords mapping for Medical Daily Exams
const MED_SYLLABUS_MAP: Record<
  string,
  {
    sub1: { name: string; target: number; keywords: string[] };
    sub2?: { name: string; target: number; keywords: string[] };
  }
> = {
  medical_live_01: {
    sub1: { name: 'পদার্থবিজ্ঞান', target: 35, keywords: ['ভেক্টর', 'গতিবিদ্যা', 'বলবিদ্যা', 'নিউটনীয় বলবিদ্যা', 'বেগ', 'ত্বরণ', 'বল'] },
    sub2: { name: 'সাধারণ জ্ঞান', target: 15, keywords: ['মুক্তিযুদ্ধ', 'ইতিহাস', '১৯৪৭', '১৯৫২', '১৯৭১', 'ভাষা আন্দোলন', 'সেক্টর', 'বঙ্গবন্ধু', 'প্রাচীন'] },
  },
  medical_live_02: {
    sub1: { name: 'রসায়ন', target: 35, keywords: ['গুণগত', 'বর্ণালী', 'কোয়ান্টাম', 'দ্রাব্যতা', 'পরমাণু মডেল', 'অরবিটাল', 'রাদারফোর্ড', 'বোর'] },
    sub2: { name: 'English', target: 15, keywords: ['noun', 'pronoun', 'article', 'determiner', 'agreement', 'subject', 'plural', 'singular'] },
  },
  medical_live_03: {
    sub1: { name: 'জীববিজ্ঞান', target: 50, keywords: ['কোষ', 'প্লাজমা', 'শ্রেণিবিন্যাস', 'পর্ব', 'প্রাণী', 'অ্যানিম্যালিয়া', 'রাইবোসোম', 'লাইসোসোম', 'প্লাস্টিড'] },
  },
  medical_live_04: {
    sub1: { name: 'পদার্থবিজ্ঞান', target: 35, keywords: ['কাজ', 'শক্তি', 'ক্ষমতা', 'মহাকর্ষ', 'অভিকর্ষ', 'মুক্তিবেগ', 'উপগ্রহ', 'কেপলার'] },
    sub2: { name: 'সাধারণ জ্ঞান', target: 15, keywords: ['মুক্তিযুদ্ধ', 'স্বাধীনতা', 'সেক্টর', 'বীরশ্রেষ্ঠ', 'খেতাব', 'মুজিবনগর', 'অপারেশন সার্চলাইট'] },
  },
  medical_live_05: {
    sub1: { name: 'রসায়ন', target: 35, keywords: ['পর্যায়বৃত্ত', 'বন্ধন', 'হাইব্রিডাইজেশন', 'আয়নীকরণ', 'ইলেকট্রন আসক্তি', 'সংকরায়ন', 'ব্যাসার্ধ'] },
    sub2: { name: 'English', target: 15, keywords: ['preposition', 'group verb', 'voice', 'passive', 'active', 'verb'] },
  },
  medical_live_06: {
    sub1: { name: 'জীববিজ্ঞান', target: 50, keywords: ['কোষ বিভাজন', 'মাইটোটিক', 'মিয়োসিস', 'পরিপাক', 'শোষণ', 'যকৃৎ', 'রক্ত', 'সংবহন', 'হৃদপিণ্ড', 'কপাটিকা'] },
  },
  medical_live_07: {
    sub1: { name: 'পদার্থবিজ্ঞান', target: 35, keywords: ['গাঠনিক', 'সান্দ্রতা', 'পৃষ্ঠটান', 'স্থিতিস্থাপকতা', 'পর্যায়বৃত্ত গতি', 'সরল ছন্দিত', 'দোলক', 'হুকের সূত্র'] },
    sub2: { name: 'সাধারণ জ্ঞান', target: 15, keywords: ['সংবিধান', 'অনুচ্ছেদ', 'জাতীয়', 'সংসদ', 'স্মৃতিসৌধ', 'অর্জন', 'রাষ্ট্রপতি', 'প্রধানমন্ত্রী'] },
  },
  medical_live_08: {
    sub1: { name: 'রসায়ন', target: 35, keywords: ['রাসায়নিক পরিবর্তন', 'সাম্যাবস্থা', 'kp', 'kc', 'ph', 'বাফার', 'লা-শাতেলিয়ার', 'লা শাতেলিয়ার', 'অসওয়াল্ড'] },
    sub2: { name: 'English', target: 15, keywords: ['tense', 'verb', 'right form', 'present', 'past', 'future', 'conditional'] },
  },
  medical_live_09: {
    sub1: { name: 'জীববিজ্ঞান', target: 50, keywords: ['অনুজীব', 'ব্যাকটেরিয়া', 'ভাইরাস', 'ম্যালেরিয়া', 'নগ্নবীজী', 'আবৃতবীজী', 'শ্বসন', 'ফুসফুস', 'চলন', 'অস্থি', 'কঙ্কাল'] },
  },
  medical_live_10: {
    sub1: { name: 'পদার্থবিজ্ঞান', target: 35, keywords: ['আদর্শ গ্যাস', 'গতিতত্ত্ব', 'তাপগতিবিদ্যা', 'কার্নো', 'এন্ট্রপি', 'রুদ্ধতাপীয়', 'সমোষ্ণ'] },
    sub2: { name: 'সাধারণ জ্ঞান', target: 15, keywords: ['ভৌগোলিক', 'নদ-নদী', 'উপজাতি', 'পাহাড়', 'দ্বীপ', 'সীমান্ত', 'ক্ষুদ্র নৃগোষ্ঠী', 'জেলা', 'সীমানা'] },
  },
  medical_live_11: {
    sub1: { name: 'রসায়ন', target: 35, keywords: ['পরিবেশ রসায়ন', 'বয়েল', 'চার্লস', 'গ্রিনহাউস', 'অ্যাসিড বৃষ্টি', 'দূষণ', 'ডাল্টন', 'ব্যাপন'] },
    sub2: { name: 'English', target: 15, keywords: ['adjective', 'adverb', 'degree', 'comparative', 'superlative', 'positive', 'order'] },
  },
  medical_live_12: {
    sub1: { name: 'জীববিজ্ঞান', target: 50, keywords: ['উদ্ভিদ শারীরতত্ত্ব', 'সালোকসংশ্লেষণ', 'শ্বসন', 'প্রস্বেদন', 'রেচন', 'নেফ্রন', 'বৃক্ক', 'জিনতত্ত্ব', 'মেন্ডেল', 'বিবর্তন'] },
  },
  medical_live_13: {
    sub1: { name: 'পদার্থবিজ্ঞান', target: 35, keywords: ['স্থির তড়িৎ', 'কুলম্ব', 'ধারক', 'চল তড়িৎ', 'ওহম', 'বর্তনী', 'রোধ', 'কার্শফ', 'তড়িৎ'] },
    sub2: { name: 'সাধারণ জ্ঞান', target: 15, keywords: ['অর্থনৈতিক', 'বাজেট', 'মেগা প্রজেক্ট', 'পদ্মা সেতু', 'মেট্রোরেল', 'অর্থনীতি', 'টাকা', 'ব্যাংক', 'পরিকল্পনা'] },
  },
  medical_live_14: {
    sub1: { name: 'রসায়ন', target: 35, keywords: ['জৈব যৌগ', 'হাইড্রোকার্বন', 'সমাণুতা', 'বেনজিন', 'অ্যারোমেটিক', 'জৈব রসায়ন', 'টোলুইন'] },
    sub2: { name: 'English', target: 15, keywords: ['narration', 'synonym', 'antonym', 'vocabulary', 'reported', 'speech', 'word'] },
  },
  medical_live_15: {
    sub1: { name: 'জীববিজ্ঞান', target: 50, keywords: ['টিস্যু', 'টিস্যুতন্ত্র', 'প্রজনন', 'পরাগায়ন', 'ভ্রূণ', 'জনন', 'মানব জীবন', 'হরমোন', 'ডিম্বাশয়', 'শুক্রাশয়'] },
  },
  medical_live_16: {
    sub1: { name: 'পদার্থবিজ্ঞান', target: 35, keywords: ['আলোকবিজ্ঞান', 'প্রতিসরণ', 'লেন্স', 'প্রিজম', 'ব্যতিচার', 'অপবর্তন', 'আলো', 'দর্পণ'] },
    sub2: { name: 'সাধারণ জ্ঞান', target: 15, keywords: ['আন্তর্জাতিক', 'জাতিসংঘ', 'ইউনেস্কো', 'নোবেল', 'পুরস্কার', 'চুক্তি', 'বিশ্ব', 'সদর দফতর', 'সংস্থা'] },
  },
  medical_live_17: {
    sub1: { name: 'রসায়ন', target: 35, keywords: ['অ্যালকোহল', 'অ্যালডিহাইড', 'কিটোন', 'পলিমার', 'জৈব অ্যাসিড', 'অ্যারোমেটিক', 'এস্টার', 'ইথার'] },
    sub2: { name: 'English', target: 15, keywords: ['idiom', 'phrase', 'spelling', 'correction', 'correct sentence', 'misspelled'] },
  },
  medical_live_18: {
    sub1: { name: 'জীববিজ্ঞান', target: 50, keywords: ['প্রতিরক্ষা', 'অ্যান্টিবডি', 'ভ্যাকসিন', 'ইমিউনিটি', 'জীবপ্রযুক্তি', 'dna', 'রিকম্বিনেন্ট', 'পিসিআর', 'প্লাজমিড'] },
  },
  medical_live_19: {
    sub1: { name: 'পদার্থবিজ্ঞান', target: 35, keywords: ['আধুনিক পদার্থবিজ্ঞান', 'আপেক্ষিকতা', 'পরমাণু মডেল', 'বোর', 'তেজস্ক্রিয়তা', 'সেমিকন্ডাক্টর', 'ডায়োড', 'ট্রানজিস্টর'] },
    sub2: { name: 'সাধারণ জ্ঞান', target: 15, keywords: ['সাম্প্রতিক', '২০২৫', '২০২৬', 'বাংলাদেশ', 'বিশ্বকাপ', 'পুরস্কার', 'চলতি', 'প্রধানমন্ত্রী', 'স্মার্ট'] },
  },
  medical_live_20: {
    sub1: { name: 'রসায়ন', target: 35, keywords: ['পরিমাণগত রসায়ন', 'মোলারিটি', 'টাইট্রেশন', 'তড়িৎ রসায়ন', 'ফ্যারাডে', 'কোষ', 'জারণ', 'বিজারণ'] },
    sub2: { name: 'English', target: 15, keywords: ['conditional', 'substitution', 'one word', 'clause', 'complex', 'compound'] },
  },
  medical_live_21: {
    sub1: { name: 'জীববিজ্ঞান', target: 50, keywords: ['আচরণ', 'হাইড্রা', 'ঘাসফড়িং', 'রুই মাছ', 'বাস্তুতন্ত্র', 'পরিবেশ', 'জীববৈচিত্র্য', 'সংরক্ষণ'] },
  },
};

export async function populateMedicalLiveExams() {
  console.log('🚀 Starting Full Medical Live Exam Questions Population from Unmesh Markdown files...\n');

  const medDir = '/Volumes/LimonSSD/PDF_Question_Extractor/Weekly_Solutions_Extracted_MD/Unmesh Medical';
  if (!fs.existsSync(medDir)) {
    console.error(`❌ Medical directory not found at: ${medDir}`);
    return;
  }

  // 1. Read and parse all files
  const files = fs.readdirSync(medDir).filter((f) => f.endsWith('.md') && !f.includes('(EV)')).sort();
  console.log(`📂 Found ${files.length} Unmesh Medical solution files to parse:`);
  for (const f of files) console.log(`   - ${f}`);

  let allQuestions: MedicalMCQ[] = [];
  for (const f of files) {
    const fullPath = path.join(medDir, f);
    const content = fs.readFileSync(fullPath, 'utf8');
    const parsed = parseMedicalMarkdown(content, f);
    allQuestions = allQuestions.concat(parsed);
  }
  console.log(`\n✅ Total Unmesh MCQs parsed across all files: ${allQuestions.length}`);

  // Separate pools
  const phyPool = allQuestions.filter((q) => q.subject === 'পদার্থবিজ্ঞান');
  const chemPool = allQuestions.filter((q) => q.subject === 'রসায়ন');
  const bioPool = allQuestions.filter((q) => q.subject === 'জীববিজ্ঞান');
  const engPool = allQuestions.filter((q) => q.subject === 'English');
  const gkPool = allQuestions.filter((q) => q.subject === 'সাধারণ জ্ঞান');

  console.log(`\n📚 Subject Pools Summary:`);
  console.log(`   - Biology: ${bioPool.length} MCQs`);
  console.log(`   - Chemistry: ${chemPool.length} MCQs`);
  console.log(`   - Physics: ${phyPool.length} MCQs`);
  console.log(`   - English: ${engPool.length} MCQs`);
  console.log(`   - GK: ${gkPool.length} MCQs`);

  // 2. Fetch all Medical exams from DB
  const { data: exams, error: examErr } = await supabase
    .from('live_exams')
    .select('id, exam_id, title, category, description, total_marks')
    .eq('category', 'medical')
    .order('exam_id');

  if (examErr || !exams) {
    console.error('❌ Failed to fetch medical exams from DB:', examErr?.message);
    return;
  }
  console.log(`\n📋 Found ${exams.length} Medical exams in database.`);

  const dailyQuestionsCache: Record<string, MedicalMCQ[]> = {};
  let totalInsertedCount = 0;

  for (const exam of exams) {
    console.log(`\n--------------------------------------------------`);
    console.log(`📝 Processing [${exam.exam_id}] ${exam.title} (Marks: ${exam.total_marks})`);

    let selected: MedicalMCQ[] = [];

    if (exam.exam_id.startsWith('medical_live_')) {
      const config = MED_SYLLABUS_MAP[exam.exam_id];
      if (config) {
        // Pool 1
        const pool1 = config.sub1.name === 'পদার্থবিজ্ঞান' ? phyPool : config.sub1.name === 'রসায়ন' ? chemPool : bioPool;
        const matched1 = pool1.filter((q) => {
          const text = (q.question + ' ' + q.explanation + ' ' + q.header).toLowerCase();
          return config.sub1.keywords.some((kw) => text.includes(kw.toLowerCase()));
        });
        const pick1 = shuffle(matched1.length >= config.sub1.target ? matched1 : pool1).slice(0, config.sub1.target);

        // Pool 2 (if any)
        let pick2: MedicalMCQ[] = [];
        if (config.sub2) {
          const pool2 = config.sub2.name === 'English' ? engPool : gkPool;
          const matched2 = pool2.filter((q) => {
            const text = (q.question + ' ' + q.explanation + ' ' + q.header).toLowerCase();
            return config.sub2!.keywords.some((kw) => text.includes(kw.toLowerCase()));
          });
          pick2 = shuffle(matched2.length >= config.sub2.target ? matched2 : pool2).slice(0, config.sub2.target);
        }

        selected = [...pick1, ...pick2];
        console.log(`   Selected ${pick1.length} ${config.sub1.name} + ${pick2.length} ${config.sub2?.name || ''} MCQs`);
      } else {
        // Fallback
        selected = shuffle(allQuestions).slice(0, 50);
      }
      dailyQuestionsCache[exam.exam_id] = selected;
    } else if (exam.exam_id.startsWith('medical_weekly_')) {
      // Weekly exam: 100 marks (Bio 30 + Chem 25 + Phy 20 + Eng 15 + GK 10)
      const numMatch = exam.exam_id.match(/(\d+)/);
      const weekNum = numMatch ? parseInt(numMatch[1], 10) : 1;
      const d1 = `medical_live_${String((weekNum - 1) * 3 + 1).padStart(2, '0')}`;
      const d2 = `medical_live_${String((weekNum - 1) * 3 + 2).padStart(2, '0')}`;
      const d3 = `medical_live_${String((weekNum - 1) * 3 + 3).padStart(2, '0')}`;

      const weekQuestions = [
        ...(dailyQuestionsCache[d1] || []),
        ...(dailyQuestionsCache[d2] || []),
        ...(dailyQuestionsCache[d3] || []),
      ];

      const wBio = shuffle([...weekQuestions.filter((q) => q.subject === 'জীববিজ্ঞান'), ...bioPool]).slice(0, 30);
      const wChem = shuffle([...weekQuestions.filter((q) => q.subject === 'রসায়ন'), ...chemPool]).slice(0, 25);
      const wPhy = shuffle([...weekQuestions.filter((q) => q.subject === 'পদার্থবিজ্ঞান'), ...phyPool]).slice(0, 20);
      const wEng = shuffle([...weekQuestions.filter((q) => q.subject === 'English'), ...engPool]).slice(0, 15);
      const wGk = shuffle([...weekQuestions.filter((q) => q.subject === 'সাধারণ জ্ঞান'), ...gkPool]).slice(0, 10);

      selected = [...wBio, ...wChem, ...wPhy, ...wEng, ...wGk];
      console.log(`   Weekly Distribution: Bio: ${wBio.length}, Chem: ${wChem.length}, Phy: ${wPhy.length}, Eng: ${wEng.length}, GK: ${wGk.length} (Total: ${selected.length})`);
    } else if (exam.exam_id.startsWith('medical_mock_')) {
      // Full Syllabus Mocks: 100 marks (Bio 30 + Chem 25 + Phy 20 + Eng 15 + GK 10)
      const mBio = shuffle(bioPool).slice(0, 30);
      const mChem = shuffle(chemPool).slice(0, 25);
      const mPhy = shuffle(phyPool).slice(0, 20);
      const mEng = shuffle(engPool).slice(0, 15);
      const mGk = shuffle(gkPool).slice(0, 10);

      selected = [...mBio, ...mChem, ...mPhy, ...mEng, ...mGk];
      console.log(`   Full Mock Distribution: Bio: ${mBio.length}, Chem: ${mChem.length}, Phy: ${mPhy.length}, Eng: ${mEng.length}, GK: ${mGk.length} (Total: ${selected.length})`);
    }

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
      batch: 'medical',
      subject: q.subject || 'মেডিকেল',
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

    totalInsertedCount += payload.length;
    console.log(`   ✅ Successfully inserted ${payload.length} questions for [${exam.exam_id}]`);
  }

  console.log(`\n==================================================`);
  console.log(`🎉 ALL DONE!`);
  console.log(`Total Medical Live Exam Questions Populated: ${totalInsertedCount}`);
  console.log(`==================================================`);
}

populateMedicalLiveExams();
