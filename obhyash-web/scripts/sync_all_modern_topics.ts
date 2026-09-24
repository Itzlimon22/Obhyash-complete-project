import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { hscSubjects } from '../lib/data/hsc';
import { sscSubjects } from '../lib/data/ssc';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncAll() {
  console.log('🚀 Synchronizing all canonical topics into public.topics table...');

  const allSubjects = [...hscSubjects, ...sscSubjects];
  const allChapterIds: string[] = [];
  const allTopicsPayload: Array<{ id: string; chapter_id: string; name: string; serial: number }> = [];

  for (const s of allSubjects) {
    for (const c of s.chapters) {
      allChapterIds.push(c.id);
      for (const t of c.topics || []) {
        allTopicsPayload.push({
          id: t.id,
          chapter_id: c.id,
          name: t.name,
          serial: t.serial,
        });
      }
    }
  }

  console.log(`Total topics to sync: ${allTopicsPayload.length} across ${allChapterIds.length} chapters.`);

  // Upsert in batches of 100
  const BATCH_SIZE = 100;
  let upserted = 0;
  for (let i = 0; i < allTopicsPayload.length; i += BATCH_SIZE) {
    const batch = allTopicsPayload.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('topics')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error upserting batch ${i}:`, error.message);
    } else {
      upserted += batch.length;
    }
  }

  console.log(`🎉 Successfully synced ${upserted} topics into public.topics!`);
}

syncAll().catch(console.error);
