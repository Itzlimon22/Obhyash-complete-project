import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

function cleanExplanation(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // 1. Remove raw markdown quotes prefixes (> ) if leftover
  text = text
    .split('\n')
    .map((line) => line.replace(/^>\s?/, ''))
    .join('\n');

  // 2. Strip trailing horizontal rules and dashes completely
  text = text.replace(/(\r?\n\s*[-*_]{3,}\s*)+[\r\n\s]*$/g, '');
  text = text.replace(/^[\r\n\s]*(\r?\n\s*[-*_]{3,}\s*)+/g, '');

  // 3. Remove any residual trailing '---'
  while (text.trim().endsWith('---')) {
    text = text.trim().slice(0, -3).trim();
  }

  // 4. Normalize multiple newlines to clean double newlines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

async function fixAllRemaining() {
  console.log('🧹 Cleaning all remaining trailing dashes and filling missing explanation...\n');

  // 1. Fill the 1 remaining empty explanation
  await supabase
    .from('live_exam_questions')
    .update({
      explanation:
        'হোলট্রিকাস আইসোরাইজা (Holotrichous isorhiza) নেমাটোসিস্টের সূত্রকটি লম্বা এবং এর সমগ্র দৈর্ঘ্য বরাবর সর্পিল আকারে কাঁটা সজ্জিত থাকে। এটি শিকারকে জড়িয়ে ধরতে ও অবশ করতে সহায়তা করে। [আজমল স্যার, প্রাণিবিজ্ঞান ২য় অধ্যায়: হাইড্রা]',
    })
    .eq('id', '4e5d59d2-d787-478c-8463-53cfc5ca4933');

  // 2. Process all rows in chunks of 500
  const pageSize = 500;
  let page = 0;
  let hasMore = true;
  let totalUpdated = 0;

  while (hasMore) {
    const { data: rows, error } = await supabase
      .from('live_exam_questions')
      .select('id, explanation')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error || !rows || rows.length === 0) {
      hasMore = false;
      break;
    }

    const updates: { id: string; explanation: string }[] = [];
    for (const r of rows) {
      if (!r.explanation) continue;
      const cleaned = cleanExplanation(r.explanation);
      if (cleaned !== r.explanation) {
        updates.push({ id: r.id, explanation: cleaned });
      }
    }

    if (updates.length > 0) {
      const batchSize = 30;
      for (let i = 0; i < updates.length; i += batchSize) {
        const chunk = updates.slice(i, i + batchSize);
        await Promise.all(
          chunk.map((item) =>
            supabase
              .from('live_exam_questions')
              .update({ explanation: item.explanation })
              .eq('id', item.id)
          )
        );
      }
      totalUpdated += updates.length;
      console.log(`Page ${page + 1}: Cleaned ${updates.length} explanations.`);
    }

    page++;
    if (rows.length < pageSize) hasMore = false;
  }

  console.log(`\n🎉 Total explanations cleaned: ${totalUpdated}`);
}

fixAllRemaining();
