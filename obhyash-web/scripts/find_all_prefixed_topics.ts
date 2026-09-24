import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  let all: any[] = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('subject, chapter, topic')
      .ilike('topic', 'টপিক%')
      .range(from, from + step - 1);
    if (error) {
      console.error(error);
      break;
    }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    from += step;
  }

  console.log('Total questions with টপিক prefix:', all.length);
  const bySubject: Record<string, number> = {};
  const sampleTopicsBySubject: Record<string, Set<string>> = {};

  for (const r of all) {
    bySubject[r.subject] = (bySubject[r.subject] || 0) + 1;
    if (!sampleTopicsBySubject[r.subject]) {
      sampleTopicsBySubject[r.subject] = new Set();
    }
    if (sampleTopicsBySubject[r.subject].size < 8) {
      sampleTopicsBySubject[r.subject].add(r.topic);
    }
  }

  console.log('\nDistribution by subject:');
  for (const [subj, count] of Object.entries(bySubject)) {
    console.log(`\n${subj}: ${count} questions`);
    const samples = Array.from(sampleTopicsBySubject[subj] || []);
    samples.forEach(s => console.log(`   - ${s}`));
  }
}

main().catch(console.error);
