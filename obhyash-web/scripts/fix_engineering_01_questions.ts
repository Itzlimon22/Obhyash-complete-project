import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const updates = [
  {
    serial: 6,
    question: '$\\vec{A}$ ও $\\vec{B}$ এর মধ্যবর্তী কোণ $\\theta$ হলে, $(\\vec{B} \\times \\vec{A})$ ভেক্টরটি কোনটি?',
    options: [
      '$AB \\sin \\theta$',
      '$AB \\cos \\theta$',
      '$-AB \\sin \\theta \\,\\hat{n}$',
      '$AB \\sin \\theta \\,\\hat{n}$'
    ],
    correct_answer_index: 2,
    explanation: 'ভেক্টর গুণনের সংজ্ঞা অনুযায়ী, $\\vec{A} \\times \\vec{B} = AB \\sin \\theta \\,\\hat{n}$, যেখানে $\\hat{n}$ হলো ডানহস্ত নিয়ম দ্বারা নির্ধারিত একক লম্ব ভেক্টর।\nযেহেতু ভেক্টর গুণন বিনিময় নিয়ম মেনে চলে না এবং ক্রম পরিবর্তন করলে দিক বিপরীত হয়:\n$$ \\vec{B} \\times \\vec{A} = -(\\vec{A} \\times \\vec{B}) = -AB \\sin \\theta \\,\\hat{n} $$'
  },
  {
    serial: 9,
    question: 'ত্রিমাত্রিক স্থানাঙ্ক ব্যবস্থায় মূলবিন্দু $O(0, 0, 0)$ এবং $xy$-সমতলে অবস্থিত একটি বিন্দু $C(1, 1, 0)$ হলে, অবস্থান ভেক্টর $\\vec{OC}$ কোনটি?',
    options: [
      '$\\hat{i} + \\hat{j}$',
      '$\\hat{j} + \\hat{k}$',
      '$\\hat{j} - \\hat{k}$',
      '$\\hat{i} + \\hat{j} + \\hat{k}$'
    ],
    correct_answer_index: 0,
    explanation: 'ত্রিমাত্রিক কার্তেসীয় স্থানাঙ্ক ব্যবস্থায় যেকোনো বিন্দু $P(x, y, z)$-এর অবস্থান ভেক্টর:\n$$ \\vec{r} = x\\hat{i} + y\\hat{j} + z\\hat{k} $$\nপ্রদত্ত বিন্দু $C(1, 1, 0)$-এর জন্য অবস্থান ভেক্টর:\n$$ \\vec{OC} = 1\\hat{i} + 1\\hat{j} + 0\\hat{k} = \\hat{i} + \\hat{j} $$'
  },
  {
    serial: 11,
    question: 'দুটি বলের সর্বোচ্চ লব্ধি $12$ একক এবং বলদ্বয় লম্বভাবে ক্রিয়া করলে যে লব্ধি হয় তার বর্গ $104$ একক হলে, সর্বনিম্ন লব্ধি কত?',
    options: [ '$2$', '$4$', '$8$', '$16$' ],
    correct_answer_index: 2,
    explanation: 'ধরি, বল দুটি $P$ ও $Q$।\nসর্বোচ্চ লব্ধি, $P + Q = 12$\nবলদ্বয় লম্বভাবে ক্রিয়া করলে লব্ধি $R = \\sqrt{P^2 + Q^2}$। শর্তমতে, $R^2 = 104 \\implies P^2 + Q^2 = 104$।\nআমরা জানি,\n$$ (P+Q)^2 - 2PQ = 104 $$\n$$ 12^2 - 2PQ = 104 \\implies 2PQ = 40 \\implies 4PQ = 80 $$\nসর্বনিম্ন লব্ধি:\n$$ |P - Q| = \\sqrt{(P+Q)^2 - 4PQ} = \\sqrt{144 - 80} = \\sqrt{64} = 8\\text{ একক} $$'
  },
  {
    serial: 18,
    question: 'একটি রাইফেলের গুলি একটি তক্তা ভেদ করতে পারে। যদি গুলির বেগ চারগুণ করা হয় তাহলে একই পুরুত্বের কয়টি তক্তা ভেদ করবে?',
    options: [ '$4\\text{ টি}$', '$8\\text{ টি}$', '$16\\text{ টি}$', '$64\\text{ টি}$' ],
    correct_answer_index: 2,
    explanation: 'গুলির আদিবেগ $u$ এবং তক্তার গড় বাধাদানকারী বলের জন্য মন্দন $a$ হলে, তক্তা ভেদ করে গুলি থেমে যায় (শেষ বেগ $v = 0$)।\nগতির সমীকরণ অনুযায়ী:\n$$ v^2 = u^2 - 2as \\implies 0 = u^2 - 2as \\implies s = \\frac{u^2}{2a} $$\nমন্দন $a$ ধ্রুবক থাকায় অতিক্রান্ত দূরত্ব আদিবেগের বর্গের সমানুপাতিক ($s \\propto u^2$)।\nঅতএব, আদিবেগ $4$ গুণ ($u\' = 4u$) করা হলে ভেদকৃত তক্তার সংখ্যা হবে:\n$$ s\' \\propto (4u)^2 = 16u^2 \\implies s\' = 16s $$\nঅর্থাৎ একই পুরুত্বের $16$ টি তক্তা ভেদ করবে।'
  },
  {
    serial: 24,
    question: 'বহুতল বিশিষ্ট একটি দালানের ছাদের কিনার থেকে একটি পাথর ছেড়ে দিলে পাথরটি ভূমিতে পড়ার শেষ $2\\text{ s}$-এ $58.8\\text{ m}$ অতিক্রম করে। দালানের উচ্চতা কত?',
    options: [
      '$9.8\\text{ m}$',
      '$19.6\\text{ m}$',
      '$78.4\\text{ m}$',
      '$156.8\\text{ m}$'
    ],
    correct_answer_index: 2,
    explanation: 'ধরি, পাথরটি ভূমিতে পৌঁছাতে মোট সময় লাগে $t\\text{ s}$ এবং দালানের উচ্চতা $H$।\nস্থির অবস্থান থেকে মুক্তভাবে পড়ন্ত বস্তুর ক্ষেত্রে:\n$$ H = \\frac{1}{2}gt^2 $$\nপতনের শেষ $2\\text{ s}$-এর পূর্বে (প্রথম $(t - 2)\\text{ s}$-এ) অতিক্রান্ত দূরত্ব:\n$$ h_1 = \\frac{1}{2}g(t - 2)^2 $$\nশর্তমতে, শেষ $2\\text{ s}$-এ অতিক্রান্ত দূরত্ব:\n$$ H - h_1 = 58.8\\text{ m} $$\n$$ \\frac{1}{2}gt^2 - \\frac{1}{2}g(t - 2)^2 = 58.8 $$\n$$ 4.9(4t - 4) = 58.8 \\implies 4t - 4 = 12 \\implies 4t = 16 \\implies t = 4\\text{ s} $$\nঅতএব, দালানের মোট উচ্চতা:\n$$ H = \\frac{1}{2} \\times 9.8 \\times 4^2 = 4.9 \\times 16 = 78.4\\text{ m} $$'
  },
  {
    serial: 26,
    question: 'স্থির অবস্থান থেকে $100\\text{ kg}$ ভরের একটি গাড়ি অনুভূমিকের সাথে $30^\\circ$ কোণে অবস্থিত $20\\text{ m}$ দীর্ঘ একটি ঘর্ষণহীন আনত তল বেয়ে নামলে তলদেশের বেগ কত?',
    options: [
      '$9.8\\text{ m s}^{-1}$',
      '$14\\text{ m s}^{-1}$',
      '$98\\text{ m s}^{-1}$',
      '$196\\text{ m s}^{-1}$'
    ],
    correct_answer_index: 1,
    explanation: 'ঘর্ষণহীন আনত তলের দৈর্ঘ্য $d = 20\\text{ m}$ এবং অনুভূমিকের সাথে কোণ $\\theta = 30^\\circ$ হলে, উল্লম্ব উচ্চতা:\n$$ h = d \\sin\\theta = 20\\text{ m} \\times \\sin 30^\\circ = 20 \\times \\frac{1}{2} = 10\\text{ m} $$\nশক্তির সংরক্ষণশীলতা নীতি অনুযায়ী, তলদেশে গতিশক্তি = শীর্ষবিন্দুর বিভবশক্তি:\n$$ \\frac{1}{2}mv^2 = mgh \\implies v = \\sqrt{2gh} $$\n$$ v = \\sqrt{2 \\times 9.8\\text{ m s}^{-2} \\times 10\\text{ m}} = \\sqrt{196} = 14\\text{ m s}^{-1} $$'
  },
  {
    serial: 41,
    question: 'স্থির অবস্থান ($t = 0\\text{ s}$-এ $v = 0$) থেকে একটি বস্তুর ত্বরণ $a = (3t - 1)\\text{ m s}^{-2}$ সমীকরণ অনুযায়ী পরিবর্তিত হয়। $t = 2\\text{ s}$ সময়ে বস্তুটির বেগ কত হবে?',
    options: [
      '$4\\text{ m s}^{-1}$',
      '$6\\text{ m s}^{-1}$',
      '$9\\text{ m s}^{-1}$',
      '$14\\text{ m s}^{-1}$'
    ],
    correct_answer_index: 0,
    explanation: 'আমরা জানি, ত্বরণ $a = \\frac{dv}{dt} \\implies dv = a\\,dt$।\nউভয়পক্ষে সমাকলন করে (যেহেতু $t = 0$ সময়ে আদিবেগ $v = 0$):\n$$ v = \\int_0^2 a\\,dt = \\int_0^2 (3t - 1)\\,dt $$\n$$ v = \\left[ \\frac{3t^2}{2} - t \\right]_0^2 = \\left( \\frac{3 \\times 2^2}{2} - 2 \\right) - 0 = (6 - 2) = 4\\text{ m s}^{-1} $$'
  },
  {
    serial: 42,
    question: 'দুটি ভেক্টর $\\vec{A} = 2\\hat{i} - \\hat{j} - 2\\hat{k}$ এবং $\\vec{B} = 2\\hat{i} + 2\\hat{j} + a\\hat{k}$। যদি $\\vec{A} \\perp \\vec{B}$ হয়, তবে $|\\vec{B}|$ এর মান কত?',
    options: [ '$3$', '$2.386$', '$5.42$', '$7.21$' ],
    correct_answer_index: 0,
    explanation: 'দুটি ভেক্টর পরস্পর লম্ব হলে তাদের ডট গুণফল শূন্য হয় ($\\vec{A} \\cdot \\vec{B} = 0$)।\n$$ (2\\hat{i} - \\hat{j} - 2\\hat{k}) \\cdot (2\\hat{i} + 2\\hat{j} + a\\hat{k}) = 0 $$\n$$ (2 \\times 2) + (-1 \\times 2) + (-2 \\times a) = 0 $$\n$$ 4 - 2 - 2a = 0 \\implies 2 - 2a = 0 \\implies a = 1 $$\nঅতএব, $\\vec{B} = 2\\hat{i} + 2\\hat{j} + 1\\hat{k}$।\nভেক্টরটির মান:\n$$ |\\vec{B}| = \\sqrt{2^2 + 2^2 + 1^2} = \\sqrt{4 + 4 + 1} = \\sqrt{9} = 3 $$'
  },
  {
    serial: 48,
    question: 'কোনো বস্তুর কৌণিক বেগ $2\\text{ s}$-এ $2\\text{ rad s}^{-1}$ হতে বৃদ্ধি পেয়ে $5\\text{ rad s}^{-1}$ হলে, বস্তুটির কৌণিক ত্বরণ কত?',
    options: [
      '$1.5\\text{ rad s}^{-2}$',
      '$3.5\\text{ rad s}^{-2}$',
      '$0.75\\text{ rad s}^{-2}$',
      '$7\\text{ rad s}^{-2}$'
    ],
    correct_answer_index: 0,
    explanation: 'কৌণিক ত্বরণের সংজ্ঞা অনুযায়ী:\n$$ \\alpha = \\frac{\\omega_2 - \\omega_1}{t} $$\nএখানে, আদি কৌণিক বেগ $\\omega_1 = 2\\text{ rad s}^{-1}$, শেষ কৌণিক বেগ $\\omega_2 = 5\\text{ rad s}^{-1}$ এবং সময় $t = 2\\text{ s}$।\n$$ \\alpha = \\frac{5\\text{ rad s}^{-1} - 2\\text{ rad s}^{-1}}{2\\text{ s}} = \\frac{3}{2}\\text{ rad s}^{-2} = 1.5\\text{ rad s}^{-2} $$'
  },
  {
    serial: 49,
    question: 'ঘূর্ণনশীল কোনো দৃঢ় বস্তুর রৈখিক বেগ $\\vec{v}$ এবং কৌণিক বেগ $\\vec{\\omega}$ হলে, $\\vec{\\nabla} \\times \\vec{v}$ এর মান কত?',
    options: [
      '$\\vec{\\omega}$',
      '$2\\vec{\\omega}$',
      '$\\frac{1}{2}\\vec{\\omega}$',
      '$0$'
    ],
    correct_answer_index: 1,
    explanation: 'ঘূর্ণনশীল দৃঢ় বস্তুর ক্ষেত্রে রৈখিক বেগ $\\vec{v} = \\vec{\\omega} \\times \\vec{r}$, যেখানে $\\vec{\\omega}$ ধ্রুবক কৌণিক বেগ ভেক্টর এবং $\\vec{r}$ অবস্থান ভেক্টর।\nভেক্টর ক্যালকুলাসের নিয়ম অনুযায়ী:\n$$ \\vec{\\nabla} \\times (\\vec{\\omega} \\times \\vec{r}) = \\vec{\\omega}(\\vec{\\nabla} \\cdot \\vec{r}) - (\\vec{\\omega} \\cdot \\vec{\\nabla})\\vec{r} $$\nযেহেতু $\\vec{\\nabla} \\cdot \\vec{r} = 3$ এবং $(\\vec{\\omega} \\cdot \\vec{\\nabla})\\vec{r} = \\vec{\\omega}$:\n$$ \\vec{\\nabla} \\times \\vec{v} = 3\\vec{\\omega} - \\vec{\\omega} = 2\\vec{\\omega} $$\nঅতএব, রৈখিক বেগের কার্ল হলো কৌণিক বেগের দ্বিগুণ ($2\\vec{\\omega}$)।'
  }
];

async function applyUpdates() {
  const { data: exam, error: examErr } = await supabase.from('live_exams').select('*').eq('exam_id', 'engineering_live_01').single();
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
      console.log(`✅ Q${u.serial} updated successfully`);
    }
  }
}

applyUpdates().catch(err => {
  console.error(err);
  process.exit(1);
});
