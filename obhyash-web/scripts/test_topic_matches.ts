import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const testTopics = [
    { subject: 'English 2nd Paper', topic: 'Appropriate Preposition' },
    { subject: 'English 2nd Paper', topic: 'Narration' },
    { subject: 'English 2nd Paper', topic: 'Analogy' },
    { subject: 'উচ্চতর গণিত ১ম পত্র', topic: 'ফাংশন, ডোমেন ও রেঞ্জ নির্ণয়' },
    { subject: 'উচ্চতর গণিত ২য় পত্র', topic: 'জটিল সংখ্যা ও জ্যামিতিক প্রতিরূপ' },
    { subject: 'জীববিজ্ঞান ১ম পত্র', topic: 'কার্বোহাইড্রেট' },
    { subject: 'জীববিজ্ঞান ২য় পত্র', topic: 'পরিফেরা ও নিডারিয়া' },
    { subject: 'তথ্য ও যোগাযোগ প্রযুক্তি', topic: 'ডেটাবেস সিকিউরিটি' },
    { subject: 'পদার্থবিজ্ঞান ১ম পত্র', topic: 'ভেক্টর রাশি প্রকারভেদ ও সূত্রাবলী' },
    { subject: 'রসায়ন ১ম পত্র', topic: 'রাসায়নিক বিক্রিয়া ও গ্রিন কেমিস্ট্রি' },
    { subject: 'বাংলা ১ম পত্র', topic: 'রেইনকোট' },
    { subject: 'বাংলা ১ম পত্র', topic: 'সোনার তরী' },
    { subject: 'বাংলা ১ম পত্র', topic: 'মাসি-পিসি' },
    { subject: 'বাংলা ২য় পত্র', topic: 'বাংলা উচ্চারণের নিয়ম' },
  ];

  console.log('Testing direct topic matching across ALL subjects:');
  for (const item of testTopics) {
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('topic', item.topic);

    if (error) {
      console.log(`❌ [${item.subject}] "${item.topic}": ${error.message}`);
    } else {
      console.log(`✅ [${item.subject}] "${item.topic}": ${count} questions found!`);
    }
  }
}

main().catch(console.error);
