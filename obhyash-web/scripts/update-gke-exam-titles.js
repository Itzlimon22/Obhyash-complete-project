const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const GKE_EXAMS = [
  {
    exam_id: 'gke_mt_01',
    num: '01',
    title: 'GKE Model Test - 01',
    gk: 'প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস',
    english: 'Noun, Determiners, Article, Number, Gender'
  },
  {
    exam_id: 'gke_mt_02',
    num: '02',
    title: 'GKE Model Test - 02',
    gk: 'ব্রিটিশ শাসন, ভাষা আন্দোলন',
    english: 'Pronoun & Its Classification, Uses of Pronoun'
  },
  {
    exam_id: 'gke_mt_03',
    num: '03',
    title: 'GKE Model Test - 03',
    gk: 'বাংলাদেশের মহান মুক্তিযুদ্ধ',
    english: 'Adjective & Its Classification, Degree of Comparison, Adverb & Its Classification, Inversion, Affirmative & Negative Agreement'
  },
  {
    exam_id: 'gke_mt_04',
    num: '04',
    title: 'GKE Model Test - 04',
    gk: 'মুক্তিযুদ্ধ পরবর্তী ঘটনা প্রবাহ, বাংলাদেশের সংবিধান',
    english: 'Verb & Its Classification, Gerund, Participle & Verbal Noun, Conjugation of Verbs'
  },
  {
    exam_id: 'gke_mt_05',
    num: '05',
    title: 'GKE Model Test - 05',
    gk: 'বাংলাদেশের সরকার ব্যবস্থা, জাতীয় সংসদ, আইন ও বিচার বিভাগ, বাংলাদেশের রাজনৈতিক কাঠামো',
    english: 'Preposition & Its Classification, Uses of Some Prepositions'
  },
  {
    exam_id: 'gke_mt_06',
    num: '06',
    title: 'GKE Model Test - 06',
    gk: 'বাংলাদেশের জনতত্ত্ব ও শিক্ষা ব্যবস্থা',
    english: 'Conjunction, Linkers & Interjection, Prefix & Suffix, Identification of Parts of Speech, Same Word but Different Parts of Speech, Transformation of Parts of Speech'
  },
  {
    exam_id: 'gke_mt_07',
    num: '07',
    title: 'GKE Model Test - 07',
    gk: 'বাংলাদেশের স্বাস্থ্য ও চিকিৎসা ব্যবস্থা',
    english: 'Phrases & Clauses, Sentence & Its Classification, Transformation of Sentence, Voice, Narration'
  },
  {
    exam_id: 'gke_mt_08',
    num: '08',
    title: 'GKE Model Test - 08',
    gk: 'বাংলাদেশের প্রাকৃতিক সম্পদ',
    english: 'Right Form of Verbs'
  },
  {
    exam_id: 'gke_mt_09',
    num: '09',
    title: 'GKE Model Test - 09',
    gk: 'বাংলাদেশের অর্থনীতি, শিল্প ও বাণিজ্য',
    english: 'Sentence Correction'
  },
  {
    exam_id: 'gke_mt_10',
    num: '10',
    title: 'GKE Model Test - 10',
    gk: 'বাংলাদেশের প্রতিরক্ষা, যোগাযোগ ব্যবস্থা এবং তথ্য প্রযুক্তি',
    english: 'Tag Question, Sentence Completion'
  },
  {
    exam_id: 'gke_mt_11',
    num: '11',
    title: 'GKE Model Test - 11',
    gk: 'বাংলাদেশের শিল্প, সংস্কৃতি ও সাহিত্য',
    english: 'Analogy, Translation, Literature'
  },
  {
    exam_id: 'gke_mt_12',
    num: '12',
    title: 'GKE Model Test - 12',
    gk: 'বাংলাদেশের বিখ্যাত ব্যক্তিবর্গ, বাংলাদেশের অর্জন, বিভিন্ন চুক্তি ও সনদ, পদক ও পুরস্কার, দিবস, প্রথম, বৃহত্তম ও ক্ষুদ্রতম',
    english: 'Appropriate Preposition'
  },
  {
    exam_id: 'gke_mt_13',
    num: '13',
    title: 'GKE Model Test - 13',
    gk: 'বৈশ্বিক ইতিহাস',
    english: 'Synonym & Antonym (A - L)'
  },
  {
    exam_id: 'gke_mt_14',
    num: '14',
    title: 'GKE Model Test - 14',
    gk: 'বিশ্ব পরিচিতি',
    english: 'Synonym & Antonym (M - Z)'
  },
  {
    exam_id: 'gke_mt_15',
    num: '15',
    title: 'GKE Model Test - 15',
    gk: 'বিশ্ব ভৌগোলিক পরিচিতি',
    english: 'Spelling'
  },
  {
    exam_id: 'gke_mt_16',
    num: '16',
    title: 'GKE Model Test - 16',
    gk: 'বৈশ্বিক স্বাস্থ্য ও চিকিৎসা ব্যবস্থা, জাতিসংঘ, জাতিসংঘের অঙ্গ সংগঠন',
    english: 'Idiom & Phrases'
  },
  {
    exam_id: 'gke_mt_17',
    num: '17',
    title: 'GKE Model Test - 17',
    gk: 'বিশ্বের উল্লেখযোগ্য অর্থনৈতিক জোট ও আর্থিক প্রতিষ্ঠান, অন্যান্য আন্তর্জাতিক, আঞ্চলিক সহযোগীতা সংস্থা',
    english: 'Group Verb'
  },
  {
    exam_id: 'gke_mt_18',
    num: '18',
    title: 'GKE Model Test - 18',
    gk: 'আন্তর্জাতিক সামরিক জোট, অস্ত্র নিয়ন্ত্রণ সংস্থা ও নিরস্ত্রীকরণ চুক্তি, বিশ্বের পরিবেশ ইস্যু ও কূটনীতি',
    english: 'Proverb'
  },
  {
    exam_id: 'gke_mt_19',
    num: '19',
    title: 'GKE Model Test - 19',
    gk: 'বিশ্বের অন্যান্য গুরুত্বপূর্ণ বিষয়াবলী',
    english: 'One Word Substitution, Foreign Words'
  },
  {
    exam_id: 'gke_mt_20',
    num: '20',
    title: 'GKE Model Test - 20',
    gk: 'বিশ্বের অন্যান্য গুরুত্বপূর্ণ বিষয়াবলী',
    english: 'One Word Substitution, Foreign Words'
  }
];

async function updateGkeExams() {
  console.log('🔄 Updating GKE live exams to match Medical Exam Batch structure...\n');

  let updatedCount = 0;

  for (const item of GKE_EXAMS) {
    const description = `বিষয়: সাধারণ জ্ঞান ও ইংরেজি\nসিলেবাস: সাধারণ জ্ঞান: ${item.gk}; ইংরেজি: ${item.english}`;

    const { data, error } = await supabase
      .from('live_exams')
      .update({
        title: item.title,
        description: description
      })
      .eq('exam_id', item.exam_id)
      .select('id, exam_id, title');

    if (error) {
      console.error(`❌ Failed to update ${item.exam_id}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`✅ Updated ${data[0].exam_id} -> Title: "${data[0].title}"`);
      updatedCount++;
    } else {
      console.warn(`⚠️ Exam ${item.exam_id} not found in database.`);
    }
  }

  console.log(`\n🎉 Finished! ${updatedCount}/${GKE_EXAMS.length} exams updated successfully.`);
}

updateGkeExams();

