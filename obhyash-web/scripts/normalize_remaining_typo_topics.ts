import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Map of exact DB typo/spacing string -> Canonical Topic Name in public.topics
const TOPIC_REPLACEMENTS: Record<string, string> = {
  // Triple spaces & bad spacing
  'ডট   ক্রস গুণন': 'ডট ও ক্রস গুণন',
  'কাঠিন্য   দৃঢ়তার গুণাঙ্ক , আয়তন গুণাঙ্ক': 'কাঠিন্য / দৃঢ়তার গুণাঙ্ক, আয়তন গুণাঙ্ক',
  'পোশাক,নিরাপদ গ্লাস,মাস্ক ও হ্যান্ড গ্লাভস': 'পোশাক, নিরাপদ গ্লাস, মাস্ক ও হ্যান্ড গ্লাভস',

  // Character typos (ও instead of ণ/ন)
  'অ্যাও্টিবডি ও টিকা': 'অ্যান্টিবডি ও টিকা',
  'মেন্ডেলিয়ান ইনহেরিট্যাও্স সূত্রাবলী ব্যাখ্যা ও ক্রোমোজোম তত্ত্ব': 'মেন্ডেলিয়ান ইনহেরিট্যান্স সূত্রাবলী ব্যাখ্যা ও ক্রোমোজোম তত্ত্ব',
  'মেন্ডেলের সূত্রের ব্যতিক্রমসমূহ ও পলিজেনিক ইনহেরিট্যাও্স': 'মেন্ডেলের সূত্রের ব্যতিক্রমসমূহ ও পলিজেনিক ইনহেরিট্যান্স',
  'অ্যাওিলিডা ও মলাস্কা': 'অ্যানিলিডা ও মলাস্কা',
  'সংখ্যা পদ্ধতির অন্যাও্য': 'সংখ্যা পদ্ধতির অন্যান্য',

  // Bangla 2nd subtopics
  'বাংলা ভাষার প্রয়োগ -অপপ্রয়োগ (বাক্য শুদ্ধিকরণ)': 'বাংলা ভাষার অপপ্রয়োগ ও শুদ্ধ প্রয়োগ',

  // Math & Chemistry variations
  'ম্যাট্রিক্সের প্রকারভেদ, বৈশিষ্ট্য ও বীজগণিত': 'ম্যাট্রিক্স ও এর প্রকারভেদ',
  'বিপরীত ম্যাট্রিক্স ও সমীকরণ জোট সমাধান': 'বিপরীত ম্যাট্রিক্স ও সমীকরণ সমাধান',
  'নিঃসঙ্গ ইলেকট্রন জোড় ও লিগ্যান্ড': 'মুক্তজোড় ইলেকট্রন ও সন্নিবেশ বন্ধন',
  'গুণগত রসায়নের অন্যান্য': 'দ্রাব্যতা ও দ্রাব্যতা গুণফল',
};

async function main() {
  console.log('🚀 Starting normalization of typo and spacing topics in questions table...');

  let totalUpdated = 0;
  for (const [fromTopic, toTopic] of Object.entries(TOPIC_REPLACEMENTS)) {
    const { count: beforeCount } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('topic', fromTopic);

    if (beforeCount && beforeCount > 0) {
      const { error } = await supabase
        .from('questions')
        .update({ topic: toTopic })
        .eq('topic', fromTopic);

      if (error) {
        console.error(`❌ Error updating "${fromTopic}":`, error.message);
      } else {
        totalUpdated += beforeCount;
        console.log(`✅ Normalized ${beforeCount} questions: "${fromTopic}" ➔ "${toTopic}"`);
      }
    }
  }

  console.log(`🎉 Total questions updated with canonical topic names: ${totalUpdated}`);
}

main().catch(console.error);
