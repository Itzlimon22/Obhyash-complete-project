import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const updates = [
  {
    serial: 2,
    question: 'একটি পাথর সোজা উপরের দিকে $3 \\times 9.8\\text{ m s}^{-1}$ বেগে নিক্ষেপ করা হলে $3\\text{ s}$ পর ইহা কত উপরে উঠবে?',
    options: [
      '$44.1\\text{ m}$',
      '$42.9\\text{ m}$',
      '$4.9\\text{ m}$',
      '$45.9\\text{ m}$'
    ],
    correct_answer_index: 0,
    explanation: 'উচ্চতার সূত্র $h = ut - \\frac{1}{2}gt^2$।\nএখানে, আদিবেগ $u = 3 \\times 9.8 = 29.4\\text{ m s}^{-1}$, সময় $t = 3\\text{ s}$, এবং $g = 9.8\\text{ m s}^{-2}$।\n$$ h = (29.4 \\times 3) - \\left(\\frac{1}{2} \\times 9.8 \\times 3^2\\right) = 88.2 - 44.1 = 44.1\\text{ m} $$'
  },
  {
    serial: 3,
    question: 'যদি রকেটের সাপেক্ষে $300\\text{ m s}^{-1}$ বেগে জ্বালানি নির্গত হয় এবং রকেটের উপর ধাক্কার পরিমাণ $210\\text{ N}$ হয়, তবে জ্বালানি নির্গমনের হার কত?',
    options: [
      '$0.7\\text{ kg s}^{-1}$',
      '$63000\\text{ kg s}^{-1}$',
      '$1.4\\text{ kg s}^{-1}$',
      '$0.35\\text{ kg s}^{-1}$'
    ],
    correct_answer_index: 0,
    explanation: 'রকেটের ওপর প্রযুক্ত ধাক্কা বল (Thrust force):\n$$ F = v_r \\frac{dm}{dt} $$\nএখানে, $F = 210\\text{ N}$ এবং $v_r = 300\\text{ m s}^{-1}$।\nঅতএব, জ্বালানি নির্গমনের হার:\n$$ \\frac{dm}{dt} = \\frac{F}{v_r} = \\frac{210}{300} = 0.7\\text{ kg s}^{-1} $$'
  },
  {
    serial: 36,
    question: 'A woodpecker is pecking a tree. Its head comes to a stop from an initial velocity of $0.600\\text{ m s}^{-1}$ at a distance of only $4.00\\text{ mm}$. What is the magnitude of acceleration? (একটি কাঠঠোকরা একটি গাছে ঠোকর দিচ্ছে। এর মাথা $0.600\\text{ m s}^{-1}$ আদিবেগে এসে মাত্র $4.00\\text{ mm}$ দূরত্বে এসে থেমে যায়। ত্বরণের মান কত?)',
    options: [
      '$50.0\\text{ m s}^{-2}$',
      '$45.0\\text{ m s}^{-2}$',
      '$55.0\\text{ m s}^{-2}$',
      '$35.0\\text{ m s}^{-2}$'
    ],
    correct_answer_index: 1,
    explanation: 'প্রদত্ত, $v = 0$, $u = 0.600\\text{ m s}^{-1}$, $s = 4.00\\text{ mm} = 0.004\\text{ m}$।\nগতির সমীকরণ হতে:\n$$ v^2 = u^2 + 2as \\implies 0 = (0.6)^2 + 2a(0.004) $$\n$$ a = -\\frac{0.36}{0.008} = -45\\text{ m s}^{-2} $$\nঅতএব, ত্বরণের মান $|a| = 45\\text{ m s}^{-2}$।'
  }
];

async function run() {
  const { data: exam, error: examErr } = await supabase
    .from('live_exams')
    .select('*')
    .eq('exam_id', 'engineering_live_01')
    .single();

  if (examErr || !exam) {
    throw new Error('Exam not found: ' + examErr?.message);
  }

  for (const u of updates) {
    const { error } = await supabase
      .from('live_exam_questions')
      .update({
        question: u.question,
        options: u.options,
        correct_answer_index: u.correct_answer_index,
        explanation: u.explanation
      })
      .eq('live_exam_id', exam.id)
      .eq('serial', u.serial);

    if (error) {
      console.error(`❌ Failed to update Q${u.serial}:`, error.message);
    } else {
      console.log(`✅ Q${u.serial} successfully updated in database.`);
    }
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
