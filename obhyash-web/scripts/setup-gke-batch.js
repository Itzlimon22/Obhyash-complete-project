const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

const JSON_PATH = '/Volumes/LimonSSD/PDF_Question_Extractor/GKE_Batch_01_Extracted/all_gke_batch01_questions.json';

const GKE_ROUTINE = [
  {
    num: 1,
    code: 'MT-01',
    sheet_name: 'GKE MT 1',
    exam_id: 'gke_mt_01',
    date: '5 Nov 2026',
    day: 5,
    title: 'MT-01: প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস ও English Grammar (Noun, Determiners, Article, Number, Gender)',
    syllabus: 'প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস\nNoun\nDeterminers\nArticle\nNumber\nGender',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 2,
    code: 'MT-02',
    sheet_name: 'GKE MT 2',
    exam_id: 'gke_mt_02',
    date: '6 Nov 2026',
    day: 6,
    title: 'MT-02: ব্রিটিশ শাসন, ভাষা আন্দোলন ও Pronoun & Its Classification',
    syllabus: 'ব্রিটিশ শাসন\nভাষা আন্দোলন\nPronoun & Its Classification\nUses of Pronoun',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 3,
    code: 'MT-03',
    sheet_name: 'GKE MT 3',
    exam_id: 'gke_mt_03',
    date: '7 Nov 2026',
    day: 7,
    title: 'MT-03: বাংলাদেশের মহান মুক্তিযুদ্ধ, Adjective, Degree, Adverb, Inversion & Agreement',
    syllabus: 'বাংলাদেশের মহান মুক্তিযুদ্ধ\nAdjective & Its Classification\nDegree of Comparison\nAdverb & Its Classification\nInversion\nAffirmative & Negative Agreement',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 4,
    code: 'MT-04',
    sheet_name: 'GKE MT 4',
    exam_id: 'gke_mt_04',
    date: '8 Nov 2026',
    day: 8,
    title: 'MT-04: মুক্তিযুদ্ধ পরবর্তী ঘটনা প্রবাহ, সংবিধান ও Verb, Gerund, Participle',
    syllabus: 'মুক্তিযুদ্ধ পরবর্তী ঘটনা প্রবাহ\nবাংলাদেশের সংবিধান\nVerb & Its Classification\nGerund, Participle & Verbal Noun\nConjugation of Verbs',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 5,
    code: 'MT-05',
    sheet_name: 'GKE MT 5',
    exam_id: 'gke_mt_05',
    date: '9 Nov 2026',
    day: 9,
    title: 'MT-05: সরকার ব্যবস্থা, সংসদ, রাজনৈতিক কাঠামো ও Preposition',
    syllabus: 'বাংলাদেশের সরকার ব্যবস্থা\nজাতীয় সংসদ, আইন ও বিচার বিভাগ\nবাংলাদেশের রাজনৈতিক কাঠামো\nPreposition & Its Classification\nUses of Some Prepositions',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 6,
    code: 'MT-06',
    sheet_name: 'GKE MT 6',
    exam_id: 'gke_mt_06',
    date: '10 Nov 2026',
    day: 10,
    title: 'MT-06: জনতত্ত্ব, শিক্ষা ও Conjunction, Prefix-Suffix, Parts of Speech',
    syllabus: 'বাংলাদেশের জনতত্ত্ব ও শিক্ষা ব্যবস্থা\nConjunction, Linkers & Interjection\nPrefix & Suffix\nIdentification of Parts of Speech\nSame Word but Different Parts of Speech\nTransformation of Parts of Speech',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 7,
    code: 'MT-07',
    sheet_name: 'GKE MT 7',
    exam_id: 'gke_mt_07',
    date: '11 Nov 2026',
    day: 11,
    title: 'MT-07: স্বাস্থ্য ও চিকিৎসা ব্যবস্থা, Phrases & Clauses, Voice & Narration',
    syllabus: 'বাংলাদেশের স্বাস্থ্য ও চিকিৎসা ব্যবস্থা\nPhrases & Clauses\nSentence & Its Classification\nTransformation of Sentence\nVoice\nNarration',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 8,
    code: 'MT-08',
    sheet_name: 'GKE MT 8',
    exam_id: 'gke_mt_08',
    date: '12 Nov 2026',
    day: 12,
    title: 'MT-08: বাংলাদেশের প্রাকৃতিক সম্পদ ও Right Form of Verbs',
    syllabus: 'বাংলাদেশের প্রাকৃতিক সম্পদ\nRight Form of Verbs',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 9,
    code: 'MT-09',
    sheet_name: 'GKE MT 9',
    exam_id: 'gke_mt_09',
    date: '13 Nov 2026',
    day: 13,
    title: 'MT-09: বাংলাদেশের অর্থনীতি, শিল্প ও বাণিজ্য এবং Sentence Correction',
    syllabus: 'বাংলাদেশের অর্থনীতি, শিল্প ও বাণিজ্য\nSentence Correction',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 10,
    code: 'MT-10',
    sheet_name: 'GKE MT 10',
    exam_id: 'gke_mt_10',
    date: '14 Nov 2026',
    day: 14,
    title: 'MT-10: প্রতিরক্ষা, যোগাযোগ ও আইসিটি, Tag Question & Sentence Completion',
    syllabus: 'বাংলাদেশের প্রতিরক্ষা, যোগাযোগ ব্যবস্থা এবং তথ্য প্রযুক্তি\nTag Question\nSentence Completion',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 11,
    code: 'MT-11',
    sheet_name: 'GKE MT 11',
    exam_id: 'gke_mt_11',
    date: '15 Nov 2026',
    day: 15,
    title: 'MT-11: শিল্প, সংস্কৃতি ও সাহিত্য, Analogy, Translation, Literature',
    syllabus: 'বাংলাদেশের শিল্প, সংস্কৃতি ও সাহিত্য\nAnalogy\nTranslation\nLiterature',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 12,
    code: 'MT-12',
    sheet_name: 'GKE MT 12',
    exam_id: 'gke_mt_12',
    date: '16 Nov 2026',
    day: 16,
    title: 'MT-12: বিখ্যাত ব্যক্তিবর্গ, অর্জন, চুক্তি, পদক, দিবস ও Appropriate Preposition',
    syllabus: 'বাংলাদেশের বিখ্যাত ব্যক্তিবর্গ\nবাংলাদেশের অর্জন\nবিভিন্ন চুক্তি ও সনদ\nপদক ও পুরস্কার\nদিবস\nপ্রথম, বৃহত্তম ও ক্ষুদ্রতম\nAppropriate Preposition',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 13,
    code: 'MT-13',
    sheet_name: 'GKE MT 13',
    exam_id: 'gke_mt_13',
    date: '17 Nov 2026',
    day: 17,
    title: 'MT-13: বৈশ্বিক ইতিহাস এবং Synonym & Antonym (A - L)',
    syllabus: 'বৈশ্বিক ইতিহাস\nSynonym & Antonym (A - L)',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 14,
    code: 'MT-14',
    sheet_name: 'GKE MT 14',
    exam_id: 'gke_mt_14',
    date: '18 Nov 2026',
    day: 18,
    title: 'MT-14: বিশ্ব পরিচিতি এবং Synonym & Antonym (M - Z)',
    syllabus: 'বিশ্ব পরিচিতি\nSynonym & Antonym (M - Z)',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 15,
    code: 'MT-15',
    sheet_name: 'GKE MT 15',
    exam_id: 'gke_mt_15',
    date: '19 Nov 2026',
    day: 19,
    title: 'MT-15: বিশ্ব ভৌগোলিক পরিচিতি ও Spelling',
    syllabus: 'বিশ্ব ভৌগোলিক পরিচিতি\nSpelling',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 16,
    code: 'MT-16',
    sheet_name: 'GKE MT 16',
    exam_id: 'gke_mt_16',
    date: '20 Nov 2026',
    day: 20,
    title: 'MT-16: বৈশ্বিক স্বাস্থ্য ও চিকিৎসা, জাতিসংঘ এবং Idiom & Phrases',
    syllabus: 'বৈশ্বিক স্বাস্থ্য ও চিকিৎসা ব্যবস্থা\nজাতিসংঘ, জাতিসংঘের অঙ্গ সংগঠন\nIdiom & Phrases',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 17,
    code: 'MT-17',
    sheet_name: 'GKE MT 17',
    exam_id: 'gke_mt_17',
    date: '21 Nov 2026',
    day: 21,
    title: 'MT-17: অর্থনৈতিক জোট, আন্তর্জাতিক সংস্থা ও Group Verb',
    syllabus: 'বিশ্বের উল্লেখযোগ্য অর্থনৈতিক জোট ও আর্থিক প্রতিষ্ঠান\nঅন্যান্য আন্তর্জাতিক, আঞ্চলিক সহযোগীতা সংস্থা\nGroup Verb',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 18,
    code: 'MT-18',
    sheet_name: 'GKE MT 18',
    exam_id: 'gke_mt_18',
    date: '22 Nov 2026',
    day: 22,
    title: 'MT-18: আন্তর্জাতিক সামরিক জোট, নিরস্ত্রীকরণ, পরিবেশ কূটনীতি ও Proverb',
    syllabus: 'আন্তর্জাতিক সামরিক জোট, অস্ত্র নিয়ন্ত্রণ সংস্থা ও নিরস্ত্রীকরণ চুক্তি\nবিশ্বের পরিবেশ ইস্যু ও কূটনীতি\nProverb',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 19,
    code: 'MT-19',
    sheet_name: 'GKE MT 19',
    exam_id: 'gke_mt_19',
    date: '23 Nov 2026',
    day: 23,
    title: 'MT-19: বিশ্বের অন্যান্য বিষয়াবলী, One Word Substitution ও Foreign Words',
    syllabus: 'বিশ্বের অন্যান্য গুরুত্বপূর্ণ বিষয়াবলী\nOne Word Substitution\nForeign Words',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  },
  {
    num: 20,
    code: 'MT-20',
    sheet_name: 'GKE MT 20',
    exam_id: 'gke_mt_20',
    date: '24 Nov 2026',
    day: 24,
    title: 'MT-20: বিশ্বের অন্যান্য বিষয়াবলী, One Word Substitution ও Foreign Words',
    syllabus: 'বিশ্বের অন্যান্য গুরুত্বপূর্ণ বিষয়াবলী\nOne Word Substitution\nForeign Words',
    subject: 'সাধারণ জ্ঞান ও ইংরেজি'
  }
];

async function run() {
  console.log('Loading all questions from:', JSON_PATH);
  const rawQuestions = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  console.log('Loaded', rawQuestions.length, 'total questions.');

  // ─────────────────────────────────────────────────────────────
  // STEP 1: Insert into gke_questions in batches of 500
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- STEP 1: Populating gke_questions ---');
  const existingGkeQCount = (await supabase.from('gke_questions').select('*', { count: 'exact', head: true })).count || 0;
  console.log('Current gke_questions count in DB:', existingGkeQCount);

  if (existingGkeQCount < rawQuestions.length) {
    if (existingGkeQCount > 0) {
      console.log('Truncating / clearing existing rows to ensure clean sync...');
      await supabase.from('gke_questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const batchSize = 500;
    for (let i = 0; i < rawQuestions.length; i += batchSize) {
      const chunk = rawQuestions.slice(i, i + batchSize);
      const { error } = await supabase.from('gke_questions').insert(chunk);
      if (error) {
        console.error(`Error inserting chunk ${i}-${i + chunk.length}:`, error);
        process.exit(1);
      }
      console.log(`Inserted gke_questions: ${Math.min(i + batchSize, rawQuestions.length)} / ${rawQuestions.length}`);
    }
  } else {
    console.log('gke_questions already fully populated (' + existingGkeQCount + ' rows).');
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 2: Clear old GKE exams from live_exams & live_exam_questions
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- STEP 2: Setting up 20 GKE Model Tests in live_exams ---');
  const oldExamsRes = await supabase.from('live_exams').select('id').eq('category', 'gke');
  if (oldExamsRes.data && oldExamsRes.data.length > 0) {
    const oldIds = oldExamsRes.data.map(e => e.id);
    console.log('Cleaning up', oldIds.length, 'old GKE exams and questions...');
    await supabase.from('live_exam_questions').delete().in('live_exam_id', oldIds);
    await supabase.from('live_exams').delete().in('id', oldIds);
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 3: Insert 20 Model Tests into live_exams & live_exam_questions
  // ─────────────────────────────────────────────────────────────
  for (const item of GKE_ROUTINE) {
    const examUuid = crypto.randomUUID();
    const dayStr = item.day < 10 ? `0${item.day}` : `${item.day}`;
    // 6:00 PM BST = 12:00 UTC, 12:00 AM (midnight) BST = 18:00 UTC
    const startTime = `2026-11-${dayStr}T12:00:00.000Z`;
    const endTime = `2026-11-${dayStr}T18:00:00.000Z`;

    const examPayload = {
      id: examUuid,
      category: 'gke',
      title: item.title,
      description: item.syllabus,
      exam_id: item.exam_id,
      duration_minutes: 60,
      total_marks: 100,
      negative_marking: 0.25,
      status: 'published',
      start_time: startTime,
      end_time: endTime,
      is_leaderboard_published: true,
      is_answer_published: true,
      is_practice_enabled: true
    };

    const { error: examErr } = await supabase.from('live_exams').insert(examPayload);
    if (examErr) {
      console.error('Failed to insert live_exam', item.code, examErr);
      process.exit(1);
    }

    // Filter questions for this Model Test
    const mtQuestions = rawQuestions.filter(q => q.category === 'Model Test' && q.sheet_name === item.sheet_name);
    console.log(`[${item.code}] Inserted exam: ${examUuid}. Found ${mtQuestions.length} questions.`);

    const junctionRows = mtQuestions.map((q, idx) => {
      const correctIdx = Array.isArray(q.correct_answer_indices) && q.correct_answer_indices.length > 0
        ? q.correct_answer_indices[0]
        : (q.answer === 'B' ? 1 : q.answer === 'C' ? 2 : q.answer === 'D' ? 3 : 0);

      return {
        live_exam_id: examUuid,
        serial: idx + 1,
        points: 1,
        question: q.question,
        options: q.options || [],
        correct_answer_index: correctIdx,
        explanation: q.explanation || '',
        batch: 'gke',
        subject: 'সাধারণ জ্ঞান ও ইংরেজি'
      };
    });

    if (junctionRows.length > 0) {
      // Insert in chunks of 50
      for (let j = 0; j < junctionRows.length; j += 50) {
        const jChunk = junctionRows.slice(j, j + 50);
        const { error: jErr } = await supabase.from('live_exam_questions').insert(jChunk);
        if (jErr) {
          console.error(`Failed to insert questions for ${item.code}:`, jErr);
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 4: Final verification
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- STEP 4: Verification ---');
  const finalExams = await supabase.from('live_exams').select('id, title, category, start_time, exam_id').eq('category', 'gke').order('start_time', { ascending: true });
  console.log(`Verified: ${finalExams.data.length} GKE live exams created in Supabase!`);
  finalExams.data.forEach(e => console.log(`- ${e.title} (${e.exam_id})`));

  const finalQuestionsCount = (await supabase.from('gke_questions').select('*', { count: 'exact', head: true })).count;
  console.log(`Verified: ${finalQuestionsCount} total questions in gke_questions table!`);

  console.log('\nSetup completed successfully!');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

