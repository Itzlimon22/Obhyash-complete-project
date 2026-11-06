import generatedHscQuestions from './hsc-generated-questions.json';

export interface HscChapterMcqQuestion {
  id: string;
  number: number;
  question: string;
  options: [string, string, string, string]; // [ক, খ, গ, ঘ]
  correctIndex: number; // 0 for ক, 1 for খ, 2 for গ, 3 for ঘ
  boardTag?: string; // e.g. "ঢাকা বোর্ড ২০২৪", "এইচএসসি ২০২৩"
  explanation: string;
  shortcutTip?: string;
  isLocked: boolean; // First 3 are false, remaining true
}

export interface HscChapterDetails {
  slug: string;
  subjectSlug: string;
  subjectName: string;
  subjectEnglish: string;
  chapterNumber: number;
  chapterNameBangla: string;
  chapterNameEnglish: string;
  banglishKeywords: string[];
  totalQuestionsInDb: number;
  summary: string;
  prevChapterSlug?: string;
  nextChapterSlug?: string;
  questions: HscChapterMcqQuestion[];
}

export const HSC_CHAPTER_QUESTIONS: Record<string, HscChapterDetails> = {
  // ─── পদার্থবিজ্ঞান ১ম পত্র: ভেক্টর (Vector) ─────────────────────────
  'physics-1st-ch02-vector': {
    slug: 'ch02-vector',
    subjectSlug: 'physics-1st',
    subjectName: 'পদার্থবিজ্ঞান ১ম পত্র',
    subjectEnglish: 'HSC Physics 1st Paper',
    chapterNumber: 2,
    chapterNameBangla: 'ভেক্টর (Vector)',
    chapterNameEnglish: 'Vector',
    banglishKeywords: [
      'hsc physics vector mcq question answer',
      'hsc physics 1st paper chapter 2 board solution',
      'vector dot cross product shortcut tricks hsc',
      'hsc vector mcq uttor 2026',
    ],
    totalQuestionsInDb: 340,
    summary:
      'ভেক্টর যোজন ও বিয়োজন, সামান্তরিকের সূত্র, ডট গুণন ও ক্রস গুণন, লব্ধির মান ও দিক, একক ভেক্টর, অবস্থান ভেক্টর ও ক্যালকুলাস-ভিত্তিক ভেক্টর ডিফারেনশিয়েশন।',
    prevChapterSlug: 'ch01-physical-world-measurement',
    nextChapterSlug: 'ch03-dynamics',
    questions: [
      {
        id: 'vec-q1',
        number: 1,
        question: 'দুটি ভেক্টর P⃗ ও Q⃗ পরস্পর লম্ব হলে, নিচের কোনটি সঠিক?',
        options: ['P⃗ × Q⃗ = 0', 'P⃗ · Q⃗ = 0', 'P⃗ · Q⃗ = PQ', '|P⃗| = |Q⃗|'],
        correctIndex: 1,
        boardTag: 'ঢাকা বোর্ড ২০২৪',
        explanation:
          'আমরা জানি ডট গুণনের সূত্র: P⃗ · Q⃗ = |P⃗||Q⃗| cos θ। দুটি ভেক্টর পরস্পর লম্ব হলে তাদের অন্তর্ভুক্ত কোণ θ = 90°। যেহেতু cos 90° = 0, তাই P⃗ · Q⃗ = 0 হবে।',
        shortcutTip: 'গোল্ডেন রুল: পরস্পর লম্ব হলে ডট গুণন শূন্য (· = 0); সমান্তরাল হলে ক্রস গুণন শূন্য (× = 0)।',
        isLocked: false,
      },
      {
        id: 'vec-q2',
        number: 2,
        question: 'A⃗ = 2î - 3ĵ + k̂ এবং B⃗ = mî + 2ĵ + 4k̂ ভেক্টরদ্বয় পরস্পর লম্ব হলে, m এর মান কত?',
        options: ['1', '2', '3', '4'],
        correctIndex: 0,
        boardTag: 'রাজশাহী বোর্ড ২০২৩',
        explanation:
          'যেহেতু ভেক্টর দুটি লম্ব, তাই A⃗ · B⃗ = 0 হবে।\n⇒ (2)(m) + (-3)(2) + (1)(4) = 0\n⇒ 2m - 6 + 4 = 0\n⇒ 2m - 2 = 0\n⇒ 2m = 2 ⇒ m = 1।',
        shortcutTip: 'AxBx + AyBy + AzBz = 0 সূত্রে এক লাইনে মান বসিয়ে হিসাব করুন: 2m - 6 + 4 = 0 ⇒ m = 1।',
        isLocked: false,
      },
      {
        id: 'vec-q3',
        number: 3,
        question: 'সমান মানের দুটি বলের লব্ধির মান তাদের যেকোনো একটি বলের সমান হলে, বলদ্বয়ের মধ্যবর্তী কোণ কত?',
        options: ['60°', '90°', '120°', '180°'],
        correctIndex: 2,
        boardTag: 'চট্টগ্রাম বোর্ড ২০২৪',
        explanation:
          'ধরি দুটি বল P এবং P, এবং লব্ধি R = P।\nলব্ধির সূত্র: R² = P² + Q² + 2PQ cos α\n⇒ P² = P² + P² + 2P² cos α\n⇒ P² = 2P² + 2P² cos α\n⇒ -P² = 2P² cos α\n⇒ cos α = -1/2\n⇒ α = cos⁻¹(-0.5) = 120°।',
        shortcutTip: 'মুখস্থ রাখার হ্যাক: সমান মানের দুটি বলের লব্ধি যদি বলের সমান হয়, কোণ সর্বদা ১২০° হয়।',
        isLocked: false,
      },
      {
        id: 'vec-q4',
        number: 4,
        question: 'î × (ĵ × k̂) এর মান নিচের কোনটি?',
        options: ['0', '1', 'î', '-î'],
        correctIndex: 0,
        boardTag: 'যশোর বোর্ড ২০২৪',
        explanation:
          'আমরা জানি ডানহাতি নিয়মে ĵ × k̂ = î।\nঅতএব, î × (ĵ × k̂) = î × î = 0 (যেহেতু একই একক ভেক্টরের ক্রস গুণন সর্বদা শূন্য)।',
        shortcutTip: 'ক্রস গুণনে একই ভেক্টরের গুণফল শূন্য (î × î = 0)।',
        isLocked: true,
      },
      {
        id: 'vec-q5',
        number: 5,
        question: 'একটি সামান্তরিকের দুটি সন্নিহিত বাহু A⃗ = 3î + ĵ - 2k̂ এবং B⃗ = 2î - ĵ + k̂ হলে, এর ক্ষেত্রফল কত বর্গ একক?',
        options: ['5√3', '√35', '3√5', '√26'],
        correctIndex: 1,
        boardTag: 'দিনাজপুর বোর্ড ২০২৩',
        explanation:
          'সামান্তরিকের সন্নিহিত বাহুদ্বয় A⃗ ও B⃗ হলে ক্ষেত্রফল = |A⃗ × B⃗|।\nA⃗ × B⃗ নির্ণয় করে পরম মান নিলে ক্ষেত্রফল √35 বর্গ একক পাওয়া যায়।',
        shortcutTip: 'সন্নিহিত বাহু দিলে ক্ষেত্রফল = |A⃗ × B⃗|; কর্ণ দিলে ক্ষেত্রফল = 1/2 |d₁ × d₂|।',
        isLocked: true,
      },
    ],
  },

  // ─── উচ্চতর গণিত ১ম পত্র: অন্তরীকরণ (Differentiation) ─────────────────
  'higher-math-1st-ch09-differentiation': {
    slug: 'ch09-differentiation',
    subjectSlug: 'higher-math-1st',
    subjectName: 'উচ্চতর গণিত ১ম পত্র',
    subjectEnglish: 'HSC Higher Math 1st Paper',
    chapterNumber: 9,
    chapterNameBangla: 'অন্তরীকরণ (Differentiation)',
    chapterNameEnglish: 'Differentiation',
    banglishKeywords: [
      'hsc calculus ontorikoron mcq solution',
      'hsc higher math 1st paper chapter 9 mcq 2026',
      'differentiation limits shortcut formula hsc',
      'hsc math 9th chapter mcq uttor',
    ],
    totalQuestionsInDb: 420,
    summary:
      'সীমা (Limits), মূল নিয়মে অন্তরজ নির্ণয়, গুণের ও ভাগের সূত্র (uv & u/v), চেইন রুল, স্পর্শক ও অভিলম্বের সমীকরণ, চরম মান (গুরুমান ও লঘুমান)।',
    prevChapterSlug: 'ch08-functions-graphs',
    nextChapterSlug: 'ch10-integration',
    questions: [
      {
        id: 'diff-q1',
        number: 1,
        question: 'lim (x→0) (sin 7x) / (sin 3x) এর মান কত?',
        options: ['3/7', '7/3', '1', '0'],
        correctIndex: 1,
        boardTag: 'ঢাকা বোর্ড ২০২৪',
        explanation:
          'ল’হোপিটালস নিয়ম (L’Hôpital’s Rule) অনুসারে 0/0 আকারের ক্ষেত্রে লব ও হরকে আলাদাভাবে অন্তরীকরণ করতে হয়:\nlim (x→0) [d/dx(sin 7x)] / [d/dx(sin 3x)]\n= lim (x→0) (7 cos 7x) / (3 cos 3x)\n= (7 × cos 0) / (3 × cos 0) = (7 × 1) / (3 × 1) = 7/3।',
        shortcutTip: 'সুপার শর্টকাট: lim(x→0) sin(ax)/sin(bx) = a/b। সরাসরি 7/3 উত্তর!',
        isLocked: false,
      },
      {
        id: 'diff-q2',
        number: 2,
        question: 'd/dx (ln tan x) এর মান কোনটি?',
        options: ['sec x', '2 cosec 2x', 'sec² x', 'cosec x'],
        correctIndex: 1,
        boardTag: 'কুমিল্লা বোর্ড ২০২৩',
        explanation:
          'চেইন রুল অনুসারে:\nd/dx (ln tan x) = (1/tan x) × d/dx(tan x)\n= (cot x) × (sec² x)\n= (cos x / sin x) × (1 / cos² x) = 1 / (sin x cos x)\nলব ও হরকে 2 দিয়ে গুণ করলে: 2 / (2 sin x cos x) = 2 / sin 2x = 2 cosec 2x।',
        shortcutTip: 'সরাসরি রূপ: 1/(sin x cos x) = 2/sin 2x = 2 cosec 2x।',
        isLocked: false,
      },
      {
        id: 'diff-q3',
        number: 3,
        question: 'y = x³ - 3x² - 9x + 5 বক্ররেখার চরম মানের (গুরুমান/লঘুমান) জন্য dy/dx এর মান কত হবে?',
        options: ['0', '1', '-1', 'অসীম'],
        correctIndex: 0,
        boardTag: 'সিলেট বোর্ড ২০২৪',
        explanation:
          'যেকোনো ফাংশনের সর্বোচ্চ (গুরুমান) বা সর্বনিম্ন (লঘুমান) বিন্দুতে বক্ররেখার স্পর্শক x-অক্ষের সমান্তরাল হয়, অর্থাৎ ঢাল dy/dx = 0 হতে হয়। এটি চরম মানের প্রয়োজনীয় শর্ত।',
        shortcutTip: 'চরম মান (Max/Min) থাকলেই প্রথম অন্তরজ সর্বদা শূন্য: dy/dx = 0।',
        isLocked: false,
      },
      {
        id: 'diff-q4',
        number: 4,
        question: 'd/dx [e^(sin x)] এর মান কত?',
        options: ['e^(sin x)', 'cos x · e^(sin x)', '-cos x · e^(sin x)', 'sin x · e^(cos x)'],
        correctIndex: 1,
        boardTag: 'বরিশাল বোর্ড ২০২৩',
        explanation:
          'চেইন রুল অনুযায়ী:\nd/dx [e^(f(x))] = e^(f(x)) × f\'(x)\nঅতএব, e^(sin x) × d/dx(sin x) = cos x · e^(sin x)।',
        shortcutTip: 'ই-এর পাওয়ার যা থাকে তাই বসে, সাথে পাওয়ারের অন্তরক গুণ হয়।',
        isLocked: true,
      },
    ],
  },

  // ─── তথ্য ও যোগাযোগ প্রযুক্তি: সংখ্যা পদ্ধতি ─────────────────────
  'ict-ch03-number-systems-logic-gates': {
    slug: 'ch03-number-systems-logic-gates',
    subjectSlug: 'ict',
    subjectName: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
    subjectEnglish: 'HSC ICT',
    chapterNumber: 3,
    chapterNameBangla: 'সংখ্যা পদ্ধতি ও ডিজিটাল ডিভাইস',
    chapterNameEnglish: 'Number Systems & Digital Logic',
    banglishKeywords: [
      'hsc ict chapter 3 mcq question answer 2026',
      'hsc shongkha poddhoti mcq board solution',
      '2s complement shortcut tricks hsc ict',
      'logic gate truth table mcq hsc',
    ],
    totalQuestionsInDb: 520,
    summary:
      'বাইনারি, অক্টাল, ডেসিমেল ও হেক্সাডেসিমেল রূপান্তর, ২-এর পরিপূরক (2\'s Complement), বুলিয়ান অ্যালজেবরা, ডিমরগ্যানের উপপাদ্য এবং মৌলিক ও যৌগিক লজিক গেইট।',
    prevChapterSlug: 'ch02-communication-networking',
    nextChapterSlug: 'ch04-web-design-html',
    questions: [
      {
        id: 'ict-q1',
        number: 1,
        question: '(10110)₂ সংখ্যাটির সমতুল্য দশমিক (Decimal) মান কত?',
        options: ['18', '20', '22', '24'],
        correctIndex: 2,
        boardTag: 'ঢাকা বোর্ড ২০২৪',
        explanation:
          'বাইনারি থেকে দশমিকে রূপান্তর:\n1 × 2⁴ + 0 × 2³ + 1 × 2² + 1 × 2¹ + 0 × 2⁰\n= 16 + 0 + 4 + 2 + 0 = 22।',
        shortcutTip: '8421 ডাবল মেথড: 16 + 4 + 2 = 22। চোখের পলকে বের করা যায়!',
        isLocked: false,
      },
      {
        id: 'ict-q2',
        number: 2,
        question: 'নিচের কোন লজিক গেইটটিকে সার্বজনীন গেইট (Universal Gate) বলা হয়?',
        options: ['AND ও OR', 'NAND ও NOR', 'XOR ও XNOR', 'NOT ও AND'],
        correctIndex: 1,
        boardTag: 'রাজশাহী বোর্ড ২০২৩',
        explanation:
          'যেসব গেইট দিয়ে মৌলিক তিনটি গেইট (AND, OR, NOT) সহ যেকোনো ধরনের লজিক সার্কিট বাস্তবায়ন করা যায়, তাদের সার্বজনীন গেইট বলে। NAND এবং NOR গেইট হলো দুটি সার্বজনীন গেইট।',
        shortcutTip: 'সার্বজনীন গেইট মাত্র ২টি: NAND এবং NOR।',
        isLocked: false,
      },
      {
        id: 'ict-q3',
        number: 3,
        question: '৮-বিট রেজিস্টারে (-৫)-এর ২-এর পরিপূরক (2’s Complement) রূপ কোনটি?',
        options: ['11111011', '10000101', '11111010', '00000101'],
        correctIndex: 0,
        boardTag: 'দিনাজপুর বোর্ড ২০২৪',
        explanation:
          '+5 এর ৮-বিট মান = 00000101\n১-এর পরিপূরক (বিট উল্টানো) = 11111010\nএর সাথে 1 যোগ করলে:\n11111010 + 1 = 11111011 (যা -৫ এর মান)।',
        shortcutTip: 'ডানপাশ থেকে প্রথম 1 আসা পর্যন্ত যা আছে তাই রেখে বাকি বিটগুলো উল্টে দিলে এক লাইনে ২-এর পরিপূরক হয়: 00000101 → 11111011।',
        isLocked: false,
      },
      {
        id: 'ict-q4',
        number: 4,
        question: 'A + ĀB এর সরলীকৃত মান কোনটি?',
        options: ['A', 'B', 'A + B', 'AB'],
        correctIndex: 2,
        boardTag: 'কুমিল্লা বোর্ড ২০২৪',
        explanation:
          'বুলিয়ান বিভাজন উপপাদ্য অনুযায়ী:\nA + ĀB = (A + Ā)(A + B) = (1)(A + B) = A + B।',
        shortcutTip: 'A + ĀB = A + B সরাসরি ফর্মুলা।',
        isLocked: true,
      },
    ],
  },
};

export function getHscChapterQuestions(subjectSlug: string, chapterSlug: string): HscChapterDetails | null {
  // 1. Try exact match key first
  const key = `${subjectSlug}-${chapterSlug}`;
  if (HSC_CHAPTER_QUESTIONS[key]) {
    return HSC_CHAPTER_QUESTIONS[key];
  }

  const generatedMap = generatedHscQuestions as unknown as Record<string, HscChapterDetails>;
  if (generatedMap[key]) {
    return generatedMap[key];
  }

  // 2. Try loose match in generated map
  const subNormalized = subjectSlug.toLowerCase();
  const chNormalized = chapterSlug.toLowerCase();

  const foundEntry = Object.entries(generatedMap).find(([entryKey, data]) => {
    if (data.subjectSlug.toLowerCase() !== subNormalized) return false;
    const entrySlug = data.slug.toLowerCase();
    return (
      entrySlug === chNormalized ||
      entrySlug.includes(chNormalized) ||
      chNormalized.includes(entrySlug) ||
      entryKey.endsWith(`-${chNormalized}`)
    );
  });

  if (foundEntry) {
    return foundEntry[1];
  }

  return null;
}

