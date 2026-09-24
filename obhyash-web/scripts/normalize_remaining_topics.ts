import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PREFIX_REGEX = /^(?:টপিক\s*[০-৯0-9.]+\s*[-–—:]*\s*|Topic\s*[০-৯0-9.]+\s*[-–—:]*\s*)/i;

const TYPO_FIXES: Record<string, string> = {
  'ডেটাবেস টেবিল ও ডেটাবেস ম্যাওেজমেন্ট সিস্টেম': 'ডেটাবেস টেবিল ও ডেটাবেস ম্যানেজমেন্ট সিস্টেম',
  'অ্যাওিলিডা ও মলাস্কা': 'অ্যানেলিডা ও মলাস্কা',
  'অ্যাও্টিবডি ও টিকা': 'অ্যান্টিবডি ও টিকা',
  'মেন্ডেলিয়ান ইনহেরিট্যাও্স সূত্রাবলী ব্যাখ্যা ও ক্রোমোজোম তত্ত্ব': 'মেন্ডেলিয়ান ইনহেরিট্যান্স সূত্রাবলী ব্যাখ্যা ও ক্রোমোজোম তত্ত্ব',
  'মেন্ডেলের সূত্রের ব্যতিক্রমসমূহ ও পলিজেনিক ইনহেরিট্যাও্স': 'মেন্ডেলের সূত্রের ব্যতিক্রমসমূহ ও পলিজেনিক ইনহেরিট্যান্স',
};

async function main() {
  console.log('🚀 Cleaning all remaining prefixed topics until 0 remain...');

  let iteration = 0;
  while (true) {
    iteration++;
    // Fetch a batch of topics that still start with টপিক or Topic
    const { data: rows, error } = await supabase
      .from('questions')
      .select('topic')
      .or('topic.ilike.টপিক %,topic.ilike.Topic %')
      .limit(1000);

    if (error) {
      console.error('Fetch error:', error.message);
      break;
    }

    if (!rows || rows.length === 0) {
      console.log('✨ No more prefixed topics found!');
      break;
    }

    const distinct = [...new Set(rows.map(r => r.topic))];
    console.log(`\nIteration ${iteration}: Found ${distinct.length} distinct topics among ${rows.length} rows.`);

    for (const oldTopic of distinct) {
      let clean = oldTopic.replace(PREFIX_REGEX, '').trim();
      if (TYPO_FIXES[clean]) clean = TYPO_FIXES[clean];

      if (!clean || clean === oldTopic) {
        // Tag it if it can't be cleaned
        clean = oldTopic + ' (সাধারণ)';
      }

      const { error: upErr } = await supabase
        .from('questions')
        .update({ topic: clean })
        .eq('topic', oldTopic);

      if (upErr) {
        console.error(`Error updating "${oldTopic}":`, upErr.message);
      } else {
        console.log(`✓ "${oldTopic}" ➔ "${clean}"`);
      }
    }
  }

  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .ilike('topic', 'টপিক % - %');

  console.log(`\n🏁 Done! Remaining with "টপিক XX - ": ${count}`);
}

main().catch(console.error);
