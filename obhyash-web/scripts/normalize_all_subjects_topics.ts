import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PREFIX_REGEX = /^(?:টপিক\s*[০-৯0-9.]+\s*[-–—:]*\s*|Topic\s*[০-৯0-9.]+\s*[-–—:]*\s*)/i;

// Special specific normalizations for Bangla 2 and others:
const SPECIAL_MAPPINGS: Record<string, string> = {
  '১.বাংলা উচ্চারণের নিয়ম(৫)': 'বাংলা উচ্চারণের নিয়ম',
  '২.বাংলা বানানের নিয়ম(৫)': 'বাংলা বানানের নিয়ম',
  '৩ বাংলা ভাষার ব্যাকরণিক শব্দশ্রেণি(৫)': 'বাংলা ভাষার ব্যাকরণিক শব্দশ্রেণি',
  '৪ . বাংলা শব্দের গঠন ( উপসর্গ ও সমাস )': 'বাংলা শব্দ গঠন (উপসর্গ ও সমাস)',
  '৫ । বাক্যতত্ত্ব': 'বাক্যতত্ত্ব',
  '৬ বাংলা ভাষার অপপ্রয়োগ ও শুদ্ধ প্রয়োগ': 'বাংলা ভাষার অপপ্রয়োগ ও শুদ্ধ প্রয়োগ',
  '৭.পারিভাষিক শব্দ/অনুবাদ-১০': 'পারিভাষিক শব্দ ও অনুবাদ',
  '৮.দিনলিপি/প্রতিবেদন-১০': 'দিনলিপি ও প্রতিবেদন লিখন',
  '৯ বৈদ্যুতিক চিঠি / আবেদন পত্র': 'বৈদ্যুতিন চিঠি ও আবেদনপত্র',
  '১০ সারাংশ / ভাবসম্প্রসারণ': 'সারাংশ ও সারমর্ম / ভাবসম্প্রসারণ',
  '১১ সংলাপ / ক্ষুদেগল্প': 'সংলাপ ও খুদেগল্প লিখন',
  '১২ প্রবন্ধ- নিবন্ধ রচনা': 'প্রবন্ধ ও নিবন্ধ রচনা',
  'টপিক ০৬': 'টপিক ০৬ (সাধারণ)',
  'টপিক ০৭': 'টপিক ০৭ (সাধারণ)',
  'টপিক ০৮': 'টপিক ০৮ (সাধারণ)',
  'টপিক 1': 'সাধারণ টপিক ১',
  'টপিক 2': 'সাধারণ টপিক ২',
  'টপিক 5': 'সাধারণ টপিক ৫',
  'টপিক 02': 'সাধারণ টপিক ০২',
  'টপিক 03': 'সাধারণ টপিক ০৩',
};

async function main() {
  console.log('🚀 Fetching all questions with "টপিক" prefix across all subjects...');

  let all: any[] = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('topic')
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

  const distinct = [...new Set(all.map(r => r.topic))];
  console.log(`Found ${all.length} questions across ${distinct.length} distinct prefixed topics.`);

  let totalUpdated = 0;
  for (const oldTopic of distinct) {
    let cleanTopic = oldTopic.replace(PREFIX_REGEX, '').trim();

    // Check special mappings
    if (SPECIAL_MAPPINGS[cleanTopic]) {
      cleanTopic = SPECIAL_MAPPINGS[cleanTopic];
    } else if (SPECIAL_MAPPINGS[oldTopic]) {
      cleanTopic = SPECIAL_MAPPINGS[oldTopic];
    }

    if (!cleanTopic || cleanTopic === oldTopic) {
      console.log(`Skipping: "${oldTopic}" -> "${cleanTopic}"`);
      continue;
    }

    const { error } = await supabase
      .from('questions')
      .update({ topic: cleanTopic })
      .eq('topic', oldTopic);

    if (error) {
      console.error(`Error updating "${oldTopic}":`, error.message);
    } else {
      console.log(`✓ "${oldTopic}" ➔ "${cleanTopic}"`);
      totalUpdated++;
    }
  }

  console.log(`\n🎉 Successfully processed all ${totalUpdated} topic groups across the entire database!`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
