import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PREFIX_REGEX = /^(?:টপিক\s*[০-৯0-9]+\s*[-–—:]\s*|Topic\s*[০-৯0-9]+\s*[-–—:]\s*|[০-৯0-9]+(?:\.[০-৯0-9]+)*\s*[-–—:]*\s*)/i;

async function testClean() {
  const { data: topicsData } = await supabase
    .from('questions')
    .select('topic')
    .limit(1000);

  // Get all unique topics with prefix
  let offset = 0;
  const PAGE = 1000;
  const uniqueMap = new Map<string, string>();

  while (true) {
    const { data } = await supabase.from('questions').select('topic').range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    for (const q of data) {
      const top = (q.topic || '').trim();
      if (PREFIX_REGEX.test(top)) {
        const clean = top.replace(PREFIX_REGEX, '').trim();
        if (clean.length > 0 && !uniqueMap.has(top)) {
          uniqueMap.set(top, clean);
        }
      }
    }
    offset += data.length;
    if (data.length < PAGE) break;
  }

  console.log(`Found ${uniqueMap.size} unique prefixed topics to normalize:`);
  for (const [orig, clean] of uniqueMap.entries()) {
    console.log(`   "${orig}" ➔ "${clean}"`);
  }
}

testClean().catch(console.error);
