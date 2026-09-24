import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SYNONYMS: Record<string, string> = {
  'hsc_chemistry_1::ল্যাবরেটরির নিরাপদ ব্যবহার': 'chem1_ch01',
  'hsc_chemistry_2::জৈব রসায়ন': 'chem2_ch02',
  'hsc_biology_1::উদ্ভিদ প্রজনন': 'bio1_ch10',
  'hsc_biology_1::বিস্তার ও সংরক্ষণ,জীবের পরিবেশ': 'bio1_ch12',
  'hsc_bangla_2::ব্যাকরণ অংশ ( এডমিশন )': 'hsc_bangla_2_grammar',
  'hsc_bangla_2::বাক্যতত্ত্ব': 'hsc_bangla_2_grammar',
  'hsc_bangla_2::ব্যাকরণ অংশ - বিষয়সমূহ': 'hsc_bangla_2_grammar',
  'hsc_bangla_2::ব্যাকরণ অংশ': 'hsc_bangla_2_grammar',
  'hsc_higher_math_1::সংযুক্ত ও যৌগিক কোণের ত্রিকোণমিতিক অনুপাত': 'math1_ch07',
};

async function main() {
  console.log('🚀 Starting backfill of chapter_id for questions with chapter_id = "_" ...');

  const { data: chapters } = await supabase.from('chapters').select('id, name, subject_id');
  const lookup = new Map<string, string>();
  for (const c of chapters || []) {
    lookup.set(c.subject_id + '::' + c.name.trim(), c.id);
    if (c.subject_id === 'hsc_math_1') lookup.set('hsc_higher_math_1::' + c.name.trim(), c.id);
    if (c.subject_id === 'hsc_math_2') lookup.set('hsc_higher_math_2::' + c.name.trim(), c.id);
  }
  for (const [k, v] of Object.entries(SYNONYMS)) {
    lookup.set(k, v);
  }

  // Get distinct subject_id + chapter pairs currently with chapter_id = '_'
  let from = 0;
  const pairsToUpdate = new Map<string, string>();

  while (true) {
    const { data: qRows } = await supabase
      .from('questions')
      .select('subject_id, chapter')
      .eq('chapter_id', '_')
      .range(from, from + 999);
    if (!qRows || qRows.length === 0) break;

    for (const q of qRows) {
      const key = q.subject_id + '::' + q.chapter?.trim();
      const targetId = lookup.get(key);
      if (targetId && !pairsToUpdate.has(key)) {
        pairsToUpdate.set(key, targetId);
      }
    }
    from += 1000;
  }

  console.log(`Found ${pairsToUpdate.size} distinct (subject_id :: chapter) groups to update.`);

  let updatedGroups = 0;
  for (const [key, targetChapterId] of pairsToUpdate.entries()) {
    const [subjectId, chapterName] = key.split('::');
    const { error, count } = await supabase
      .from('questions')
      .update({ chapter_id: targetChapterId })
      .eq('chapter_id', '_')
      .eq('subject_id', subjectId)
      .eq('chapter', chapterName);

    if (error) {
      console.error(`❌ Failed to update ${key} -> ${targetChapterId}:`, error.message);
    } else {
      updatedGroups++;
      console.log(`✅ [${updatedGroups}/${pairsToUpdate.size}] Updated: "${subjectId} | ${chapterName}" -> "${targetChapterId}"`);
    }
  }

  // Verify remaining underscores
  const { count: remainingUnderscores } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('chapter_id', '_');

  console.log(`🎉 Finished! Remaining questions with chapter_id = "_": ${remainingUnderscores}`);
}

main().catch(console.error);
