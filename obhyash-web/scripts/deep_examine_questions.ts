import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('🔍 Comprehensive Examination of Questions Fetching & Topic Consistency...\n');

  // 1. Scan all topics starting with numbers or prefixes across all 60k rows
  let offset = 0;
  const PAGE = 1000;
  const subjectTopicMap = new Map<string, Set<string>>();
  let totalQuestions = 0;

  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('subject, topic')
      .range(offset, offset + PAGE - 1);

    if (error || !data || data.length === 0) break;
    totalQuestions += data.length;

    for (const q of data) {
      const top = (q.topic || '').trim();
      if (/^[0-9০-৯]/.test(top)) {
        if (!subjectTopicMap.has(q.subject)) {
          subjectTopicMap.set(q.subject, new Set());
        }
        subjectTopicMap.get(q.subject)!.add(top);
      }
    }

    offset += data.length;
    if (data.length < PAGE) break;
  }

  console.log(`Total questions scanned: ${totalQuestions}`);
  console.log(`Subjects with number-prefixed topics:`);
  for (const [subj, topics] of subjectTopicMap.entries()) {
    console.log(`\n📚 [${subj}] -> ${topics.size} unique topics:`);
    for (const t of Array.from(topics)) {
      console.log(`   - "${t}"`);
    }
  }
}

main().catch(console.error);
