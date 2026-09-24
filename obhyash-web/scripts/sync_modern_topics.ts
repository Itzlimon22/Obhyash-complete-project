import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { hscSubjects } from '../lib/data/hsc';
import { sscSubjects } from '../lib/data/ssc';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('🚀 Starting Database Topics Synchronization...');

  // 1. Sync HSC Bangla 1st Paper Topics
  console.log('\n--- 1. Synchronizing HSC Bangla 1st Paper (hsc_bangla_1) ---');
  const b1 = hscSubjects.find(s => s.id === 'hsc_bangla_1')!;
  
  // First, remove old/corrupted topics for hsc_bangla_1 chapters
  const b1ChapterIds = b1.chapters.map(c => c.id);
  const { error: delB1Err } = await supabase
    .from('topics')
    .delete()
    .in('chapter_id', b1ChapterIds);
    
  if (delB1Err) {
    console.error('Error clearing old HSC Bangla 1 topics:', delB1Err.message);
  } else {
    console.log('Cleared previous topics for HSC Bangla 1 chapters.');
  }

  // Insert modern 14 Prose + 14 Poetry + 2 Novel/Drama
  const b1Payload: Array<{ id: string; chapter_id: string; name: string; serial: number }> = [];
  for (const c of b1.chapters) {
    for (const t of c.topics || []) {
      b1Payload.push({
        id: t.id,
        chapter_id: c.id,
        name: t.name,
        serial: t.serial,
      });
    }
  }

  const { error: insB1Err } = await supabase.from('topics').insert(b1Payload);
  if (insB1Err) {
    console.error('Error inserting modern HSC Bangla 1 topics:', insB1Err.message);
  } else {
    console.log(`✅ Successfully inserted ${b1Payload.length} modern topics for HSC Bangla 1:`);
    b1Payload.forEach(t => console.log(`   [${t.chapter_id}] #${t.serial} ${t.name}`));
  }

  // 2. Sync HSC Bangla 2nd Paper Topics
  console.log('\n--- 2. Synchronizing HSC Bangla 2nd Paper (hsc_bangla_2) ---');
  const b2 = hscSubjects.find(s => s.id === 'hsc_bangla_2')!;
  
  // Ensure chapters exist in chapters table
  for (const c of b2.chapters) {
    const { error: chErr } = await supabase.from('chapters').upsert({
      id: c.id,
      subject_id: b2.id,
      name: c.name,
    });
    if (chErr) console.error(`Error upserting chapter ${c.id}:`, chErr.message);
  }

  // Clear old topics
  const b2ChapterIds = ['hsc_bangla_2_grammar', 'hsc_bangla_2_written'];
  const { error: delB2Err } = await supabase
    .from('topics')
    .delete()
    .in('chapter_id', b2ChapterIds);
  if (delB2Err) console.error('Error deleting old Bangla 2 topics:', delB2Err.message);

  const b2Payload: Array<{ id: string; chapter_id: string; name: string; serial: number }> = [];
  for (const c of b2.chapters) {
    for (const t of c.topics || []) {
      b2Payload.push({
        id: t.id,
        chapter_id: c.id,
        name: t.name,
        serial: t.serial,
      });
    }
  }

  const { error: insB2Err } = await supabase.from('topics').insert(b2Payload);
  if (insB2Err) {
    console.error('Error inserting modern HSC Bangla 2 topics:', insB2Err.message);
  } else {
    console.log(`✅ Successfully inserted ${b2Payload.length} modern topics for HSC Bangla 2:`);
    b2Payload.forEach(t => console.log(`   [${t.chapter_id}] #${t.serial} ${t.name}`));
  }

  // 3. Fix Corrupted Topic Names Across All Subjects in DB
  console.log('\n--- 3. Fixing Corrupted Topic Names Across Other Subjects in DB ---');
  const knownCorrections = [
    { old: 'ডেটাবেস ম্যাওেজমেন্ট সিস্টেম', new: 'ডেটাবেস ম্যানেজমেন্ট সিস্টেম' },
    { old: 'ডেটাবেস টেবিল ও ডেটাবেস ম্যাওেজমেন্ট সিস্টেম', new: 'ডেটাবেস টেবিল ও ডেটাবেস ম্যানেজমেন্ট সিস্টেম' },
    { old: 'অ্যাওিলিডা ও মলাস্কা', new: 'অ্যানেলিডা ও মলাস্কা' },
    { old: 'অ্যাও্টিবডি ও টিকা', new: 'অ্যান্টিবডি ও টিকা' },
    { old: 'মেন্ডেলিয়ান ইনহেরিট্যাও্স সূত্রাবলী ব্যাখ্যা ও ক্রোমোজোম তত্ত্ব', new: 'মেন্ডেলিয়ান ইনহেরিট্যান্স সূত্রাবলী ব্যাখ্যা ও ক্রোমোজোম তত্ত্ব' },
    { old: 'মেন্ডেলের সূত্রের ব্যতিক্রমসমূহ ও পলিজেনিক ইনহেরিট্যাও্স', new: 'মেন্ডেলের সূত্রের ব্যতিক্রমসমূহ ও পলিজেনিক ইনহেরিট্যান্স' },
    { old: 'পরিসংখ্যাও, চলক ও বিভিন্ন প্রতীক', new: 'পরিসংখ্যান, চলক ও বিভিন্ন প্রতীক' },
  ];

  for (const corr of knownCorrections) {
    const { data: matched, error: mErr } = await supabase
      .from('topics')
      .update({ name: corr.new })
      .eq('name', corr.old)
      .select('id, name');
      
    if (matched && matched.length > 0) {
      console.log(`Updated topic: "${corr.old}" ➔ "${corr.new}" (${matched.length} row(s))`);
    }

    // Also update chapter names if matching
    const { data: mCh } = await supabase
      .from('chapters')
      .update({ name: corr.new })
      .eq('name', corr.old)
      .select('id, name');
    if (mCh && mCh.length > 0) {
      console.log(`Updated chapter: "${corr.old}" ➔ "${corr.new}" (${mCh.length} row(s))`);
    }
  }

  // 4. Normalize questions table: clean 'টপিক XX - ' prefix from topic column
  console.log('\n--- 4. Normalizing public.questions topic column ---');
  
  // Specific typo corrections for topic values in questions:
  const topicReplacements: Record<string, string> = {
    'টপিক 18 - রেইনকোট': 'রেইনকোট',
    'টপিক 15 - মাসি-পিসি': 'মাসি-পিসি',
    'টপিক 16 - বায়ান্নর দিনগুলো': 'বায়ান্নর দিনগুলো',
    'টপিক 08 - অপরিচিতা': 'অপরিচিতা',
    'টপিক 09 - বিলাসী': 'বিলাসী',
    'টপিক 07 - বাঙ্গালার নব্য লেখকদের প্রতি নিবেদন': 'বাঙ্গালার নব্য লেখকদের প্রতি নিবেদন',
    'টপিক 10 - গৃহ': 'গৃহ',
    'টপিক 11 - আহ্বান': 'আহ্বান',
    'টপিক 12 - আমার পথ': 'আমার পথ',
    'টপিক 13 - মানব কল্যাণ': 'মানব-কল্যাণ',
    'টপিক 14 - জীবন ও বৃক্ষ': 'জীবন ও বৃক্ষ',
    'টপিক 17 - জাদুঘরে কেন যাব': 'জাদুঘরে কেন যাব',
    'টপিক 19 - মহাজাগতিক কিউরেটর': 'মহাজাগতিক কিউরেটর',
    'টপিক 20 - নেকলেস': 'নেকলেস',
    // Poetry
    'টপিক 03 - বিভীষণের প্রতি মেঘনাদ': 'বিভীষণের প্রতি মেঘনাদ',
    'টপিক 04 - সোনার তরী': 'সোনার তরী',
    'টপিক 06 - বিদ্রোহী': 'বিদ্রোহী',
    'টপিক 08 - প্রতিদান': 'প্রতিদান',
    'টপিক 09 - সুচেতনা': 'সুচেতনা',
    'টপিক 10 - তাহাই পড়ে মনে': 'তাহারেই পড়ে মনে',
    'টপিক 12 - পদ্মা': 'পদ্মা',
    'টপিক 13 - আঠারো বছর বয়স': 'আঠারো বছর বয়স',
    'টপিক 14 - ফেব্রুয়ারি ১৯৬৯': 'ফেব্রুয়ারি ১৯৬৯',
    'টপিক 15 - আমি কিংবদন্তির কথা বলছি': 'আমি কিংবদন্তির কথা বলছি',
    'টপিক 16 - নুরলদীনের কথা মনে পড়ে যায়': 'নূরলদীনের কথা মনে পড়ে যায়',
    'টপিক 07 - সাম্যবাদী': 'সাম্যবাদী',
    'টপিক 05 - ঐকতান': 'ঐকতান',
    'টপিক 11 - সেই অস্ত্র': 'সেই অস্ত্র',
    // Novel & drama
    'টপিক 01 - লালসালু': 'লালসালু',
    'টপিক 02 - সিরাজউদ্দৌলা': 'সিরাজউদ্দৌলা',
    // Obsolete topics tagged clearly:
    'টপিক 01 - সাহিত্যে খেলা': 'সাহিত্যে খেলা (পুরাতন)',
    'টপিক 02 - গন্তব্য কাবুল': 'গন্তব্য কাবুল (পুরাতন)',
    'টপিক 03 - অর্ধাঙ্গী': 'অর্ধাঙ্গী (পুরাতন)',
    'টপিক 04 - যৌবনের গান': 'যৌবনের গান (পুরাতন)',
    'টপিক 05 - কপিলদাস মুর্মুর শেষ কাজ': 'কপিলদাস মুর্মুর শেষ কাজ (পুরাতন)',
    'টপিক 06 - বিড়াল': 'বিড়াল (পুরাতন)',
    'টপিক 21 - চাষার দুক্ষু': 'চাষার দুক্ষু (পুরাতন)',
    'টপিক 01 - প্রত্যাবর্তনের লজ্জা': 'প্রত্যাবর্তনের লজ্জা (পুরাতন)',
    'টপিক 02 - ঋতু বর্ণন': 'ঋতু বর্ণন (পুরাতন)',
    'টপিক 17 - ছবি': 'ছবি (পুরাতন)',
    'টপিক 18 - এই পৃথিবীতে এক স্থান আছে': 'এই পৃথিবীতে এক স্থান আছে (পুরাতন)',
    'টপিক 19 - রক্তে আমার অনাদি অস্থি': 'রক্তে আমার অনাদি অস্থি (পুরাতন)',
    'টপিক 20 - লোক-লোকান্তর': 'লোক-লোকান্তর (পুরাতন)',
  };

  let totalUpdated = 0;
  for (const [oldTopic, newTopic] of Object.entries(topicReplacements)) {
    const { error } = await supabase
      .from('questions')
      .update({ topic: newTopic })
      .eq('topic', oldTopic);
      
    if (error) {
      console.error(`Error updating "${oldTopic}":`, error.message);
    } else {
      console.log(`Updated "${oldTopic}" ➔ "${newTopic}"`);
      totalUpdated++;
    }
  }

  console.log(`\n🎉 Total questions normalized in questions table: ${totalUpdated}`);
  console.log('✅ Synchronization completed successfully!');
}

main().catch(err => {
  console.error('Fatal error in sync script:', err);
  process.exit(1);
});
