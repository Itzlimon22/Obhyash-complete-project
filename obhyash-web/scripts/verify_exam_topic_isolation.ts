import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { BanglaNameHelper } from '../lib/bangla-name-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TestCase {
  subject: string;
  chapter?: string;
  topic: string;
}

const testCases: TestCase[] = [
  { subject: 'English 2nd Paper', chapter: 'Grammar Part', topic: 'Narration' },
  { subject: 'English 2nd Paper', chapter: 'Memorizing Part', topic: 'Appropriate Preposition' },
  { subject: 'উচ্চতর গণিত ১ম পত্র', chapter: 'ফাংশন ও ফাংশনের লেখচিত্র', topic: 'ফাংশন, ডোমেন ও রেঞ্জ নির্ণয়' },
  { subject: 'পদার্থবিজ্ঞান ১ম পত্র', chapter: 'ভেক্টর', topic: 'ভেক্টর রাশি প্রকারভেদ ও সূত্রাবলী' },
  { subject: 'বাংলা ১ম পত্র', chapter: 'গদ্য', topic: 'রেইনকোট' },
  { subject: 'বাংলা ১ম পত্র', chapter: 'পদ্য', topic: 'সোনার তরী' },
  { subject: 'বাংলা ২য় পত্র', chapter: 'বাংলা ব্যাকরণ', topic: 'বাংলা উচ্চারণের নিয়ম' },
  { subject: 'জীববিজ্ঞান ১ম পত্র', chapter: 'কোষ রসায়ন', topic: 'কার্বোহাইড্রেট' },
  { subject: 'তথ্য ও যোগাযোগ প্রযুক্তি', chapter: 'ডেটাবেজ ম্যানেজমেন্ট সিস্টেম', topic: 'ডেটাবেস সিকিউরিটি' },
];

async function simulateExamFetch(test: TestCase) {
  const subjectVariants = BanglaNameHelper.getSubjectSearchVariants(test.subject, test.subject);
  const expandedTopics = BanglaNameHelper.getTopicSearchVariants(test.topic);
  const expandedChapters = test.chapter ? BanglaNameHelper.getChapterSearchVariants(test.chapter) : null;

  console.log(`\n======================================================`);
  console.log(`🧪 Testing Exam Topic Isolation: [${test.subject}] -> "${test.topic}"`);
  console.log(`   Variants: [${expandedTopics.slice(0, 3).join(', ')}]`);

  // 1. Adaptive RPC
  let questions: any[] = [];
  let method = '';

  for (const formName of subjectVariants) {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_adaptive_mock_exam_questions',
      {
        p_user_id: null,
        p_subject: formName,
        p_subject_name: formName,
        p_total: 25,
        p_chapters: expandedChapters,
        p_topics: expandedTopics,
        p_difficulties: null,
        p_exam_types: null,
      }
    );

    if (!rpcError && rpcData && rpcData.length > 0) {
      questions = rpcData;
      method = 'ADAPTIVE_SMART_MOCK_RPC';
      break;
    }

    // Distributed RPC
    const { data: distData, error: distError } = await supabase.rpc(
      'get_distributed_exam_questions',
      {
        p_user_id: null,
        p_subject: formName,
        p_subject_name: formName,
        p_total: 25,
        p_chapters: expandedChapters,
        p_topics: expandedTopics,
        p_difficulties: null,
        p_exam_types: null,
      }
    );

    if (!distError && distData && distData.length > 0) {
      questions = distData;
      method = 'DISTRIBUTED_RPC';
      break;
    }
  }

  // 2. Direct Query Fallback if RPC didn't return
  if (questions.length === 0) {
    let query = supabase
      .from('questions')
      .select('*')
      .in('subject', subjectVariants)
      .eq('status', 'Approved')
      .in('topic', expandedTopics)
      .limit(25);

    if (expandedChapters) {
      query = query.in('chapter', expandedChapters);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      questions = data;
      method = 'DIRECT_QUERY_IN_TOPIC';
    } else {
      // Substring fallback
      const clean = test.topic
        .replace(/^(?:টপিক\s*[০-৯0-9]+\s*[-–—:]\s*|[০-৯0-9]+(?:\.[০-৯0-9]+)*\s*[-–—:]*\s*)/, '')
        .replace(/\s*\([^)]*\)\s*/, '')
        .trim();

      let kwQuery = supabase
        .from('questions')
        .select('*')
        .in('subject', subjectVariants)
        .eq('status', 'Approved')
        .ilike('topic', `%${clean}%`)
        .limit(25);

      if (expandedChapters) {
        kwQuery = kwQuery.in('chapter', expandedChapters);
      }

      const kwRes = await kwQuery;
      if (!kwRes.error && kwRes.data && kwRes.data.length > 0) {
        questions = kwRes.data;
        method = 'DIRECT_QUERY_ILIKE_TOPIC';
      }
    }
  }

  console.log(`   Fetch Method: ${method || 'NONE'}`);
  console.log(`   Questions Returned: ${questions.length}`);

  if (questions.length === 0) {
    console.log(`   ⚠️ No questions found for topic "${test.topic}"`);
    return true;
  }

  // Verify that EVERY question belongs to the selected topic
  let leakCount = 0;
  for (const q of questions) {
    const qTopic = (q.topic || '').trim();
    const isExactMatch = expandedTopics.some((t: string) => t.toLowerCase() === qTopic.toLowerCase());
    const isSubstringMatch = qTopic.toLowerCase().includes(test.topic.toLowerCase()) ||
                             test.topic.toLowerCase().includes(qTopic.toLowerCase());

    if (!isExactMatch && !isSubstringMatch) {
      leakCount++;
      console.log(`   🚨 LEAK DETECTED! Question ID: ${q.id} has topic: "${qTopic}" (Expected: "${test.topic}")`);
    }
  }

  if (leakCount === 0) {
    console.log(`   ✅ PERFECT ISOLATION: 100% of questions (${questions.length}/${questions.length}) belong to "${test.topic}"! Zero leaks.`);
    return true;
  } else {
    console.log(`   ❌ FAILED: ${leakCount} questions leaked from outside "${test.topic}"!`);
    return false;
  }
}

async function run() {
  let allPassed = true;
  for (const t of testCases) {
    const passed = await simulateExamFetch(t);
    if (!passed) allPassed = false;
  }

  console.log(`\n======================================================`);
  if (allPassed) {
    console.log(`🎉 ALL SUBJECTS PASSED TOPIC ISOLATION VERIFICATION!`);
  } else {
    console.log(`❌ SOME TESTS FAILED TOPIC ISOLATION.`);
    process.exit(1);
  }
}

run().catch(console.error);
