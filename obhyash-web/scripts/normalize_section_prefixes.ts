import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PREFIX_REGEX = /^(?:টপিক\s*[০-৯0-9]+\s*[-–—:]\s*|Topic\s*[০-৯0-9]+\s*[-–—:]\s*|[০-৯0-9]+(?:\.[০-৯0-9]+)*\s*[-–—:]+\s*|[০-৯0-9]+(?:\.[০-৯0-9]+)+\s*)/i;

async function run() {
  console.log('🚀 Normalizing remaining section-number prefixed topics in questions table...');

  let offset = 0;
  const PAGE = 1000;
  let totalUpdated = 0;
  const uniqueNormalized = new Map<string, string>();

  // First collect all updates
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, topic')
      .range(offset, offset + PAGE - 1);

    if (error || !data || data.length === 0) break;

    for (const q of data) {
      const top = (q.topic || '').trim();
      if (PREFIX_REGEX.test(top)) {
        const clean = top.replace(PREFIX_REGEX, '').trim();
        if (clean.length > 0 && !uniqueNormalized.has(top)) {
          uniqueNormalized.set(top, clean);
        }
      }
    }

    offset += data.length;
    if (data.length < PAGE) break;
  }

  console.log(`Found ${uniqueNormalized.size} unique prefixed topic types.`);

  // Update in batch by topic name
  for (const [orig, clean] of uniqueNormalized.entries()) {
    const { count, error } = await supabase
      .from('questions')
      .update({ topic: clean }, { count: 'exact' })
      .eq('topic', orig);

    if (error) {
      console.error(`❌ Error updating "${orig}":`, error.message);
    } else {
      console.log(`✅ Normalized ${count} rows: "${orig}" ➔ "${clean}"`);
      totalUpdated += (count || 0);
    }
  }

  console.log(`\n🎉 Total questions normalized: ${totalUpdated}`);
}

run().catch(console.error);
