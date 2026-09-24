import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { hscSubjects } from '../lib/data/hsc';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncHsc() {
  console.log('🚀 Synchronizing all canonical HSC topics into public.topics table...');

  const allTopicsPayload: Array<{ id: string; chapter_id: string; name: string; serial: number }> = [];

  for (const s of hscSubjects) {
    for (const c of s.chapters) {
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

  console.log(`Total HSC topics to sync: ${allTopicsPayload.length}`);

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

  console.log(`🎉 Successfully synced ${upserted} HSC topics into public.topics!`);
}

syncHsc().catch(console.error);
