import generatedSscQuestions from './ssc-generated-questions.json';

export interface ChapterMcqQuestion {
  id: string;
  number: number;
  question: string;
  options: [string, string, string, string]; // [ক, খ, গ, ঘ]
  correctIndex: number; // 0 for ক, 1 for খ, 2 for গ, 3 for ঘ
  boardTag?: string; // e.g. "ঢাকা বোর্ড ২০২৩", "রাজশাহী বোর্ড ২০২৪"
  explanation: string;
  shortcutTip?: string;
  isLocked: boolean; // First 3 are false, remaining true
}

export interface ChapterDetails {
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
  questions: ChapterMcqQuestion[];
}

export const SSC_CHAPTER_QUESTIONS: Record<string, ChapterDetails> = {
  // ─── সাধারণ গণিত: সেট ও ফাংশন ───────────────────────────────────
  "general-math-ch02-set-and-functions": {
    slug: "ch02-set-and-functions",
    subjectSlug: "general-math",
    subjectName: "সাধারণ গণিত",
    subjectEnglish: "SSC General Math",
    chapterNumber: 2,
    chapterNameBangla: "সেট ও ফাংশন",
    chapterNameEnglish: "Set and Functions",
    banglishKeywords: [
      "ssc math chapter 2 mcq question answer",
      "ssc set and function mcq uttor 2026",
      "general math 2nd chapter board question solution",
      "set function shortcut mcq tricks ssc",
      "ssc gonit 2nd odhay mcq",
    ],
    totalQuestionsInDb: 103,
    summary:
      "সেটের সংজ্ঞা, সংযোগ ও ছেদ সেট, পূরক সেট, শক্তি সেট (Power Set), ক্রমজোড়, কার্তেসীয় গুণজ, অন্বয়, ডোমেন ও রেঞ্জ সম্পর্কিত সকল গুরুত্বপূর্ণ বোর্ড MCQ ও সমাধান।",
    prevChapterSlug: "ch01-real-numbers",
    nextChapterSlug: "ch03-algebraic-expressions",
    questions: [
      {
        id: "set-q1",
        number: 1,
        question: "জর্জ ক্যান্টরের সেটের ধারণা গণিতে কী নামে পরিচিত?",
        options: ["সংখ্যা তত্ত্ব", "সেট তত্ত্ব", "মূলদ তত্ত্ব", "অমূলদ তত্ত্ব"],
        correctIndex: 1,
        boardTag: "ঢাকা বোর্ড ২০২৪",
        explanation:
          'জার্মান গণিতবিদ জর্জ ক্যান্টর (Georg Cantor) সর্বপ্রথম সেটের প্রাথমিক ধারণা দেন। তাঁর এই যুগান্তকারী উদ্ভাবন গণিতশাস্ত্রে "সেট তত্ত্ব" (Set Theory) নামে সুপরিচিত।',
        shortcutTip:
          "মনে রাখার নিয়ম: Georg Cantor = Father of Set Theory (সেট তত্ত্বের জনক)।",
        isLocked: false,
      },
      {
        id: "set-q2",
        number: 2,
        question: "A × B কে নিচের কোনটি পড়া হয়?",
        options: ["A বাদ B", "A যোগ B", "A সমান B", "A ক্রস B"],
        correctIndex: 3,
        boardTag: "কুমিল্লা বোর্ড ২০২৩",
        explanation:
          'দুটি সেটের কার্তেসীয় গুণজকে (Cartesian Product) গুণ চিহ্নের মাধ্যমে প্রকাশ করা হয় এবং এটিকে পড়া হয় "A ক্রস B" (A cross B)। এর উপাদানগুলো ক্রমজোড় (Ordered Pair) আকারে থাকে।',
        shortcutTip:
          'Cartesian Product এর গুণ চিহ্নকে সর্বদা "ক্রস" (Cross) পড়া হয়।',
        isLocked: false,
      },
      {
        id: "set-q3",
        number: 3,
        question:
          "একজোড়া উপাদানের মধ্যে কোনটি প্রথম অবস্থানে আর কোনটি দ্বিতীয় অবস্থানে থাকবে, তা নির্দিষ্ট করে জোড়া আকারে প্রকাশকে কী বলা হয়?",
        options: ["নিশ্ছেদ সেট", "সংযোগ সেট", "ছেদ সেট", "ক্রমজোড়"],
        correctIndex: 3,
        boardTag: "রাজশাহী বোর্ড ২০২৪",
        explanation:
          'একজোড়া উপাদানের মধ্যে প্রথম ও দ্বিতীয় উপাদানের অবস্থান নির্দিষ্ট করে (x, y) আকারে জোড়া তৈরি করার প্রক্রিয়াকে বলা হয় "ক্রমজোড়" (Ordered Pair)। প্রথম উপাদানটি ডোমেন এবং দ্বিতীয় উপাদানটি রেঞ্জ নির্দেশ করে।',
        shortcutTip:
          "ক্রমজোড়ের প্রথম পদকে প্রথম উপাদান এবং দ্বিতীয় পদকে দ্বিতীয় উপাদান বলে।",
        isLocked: false,
      },
      {
        id: "set-q4",
        number: 4,
        question: "S = {x : x² - 5x + 6 = 0} হলে, নিচের কোনটি সত্য?",
        options: ["0", "1", "2", "3"],
        correctIndex: 2,
        boardTag: "যশোর বোর্ড ২০২৪",
        explanation:
          "x² - 5x + 6 = 0 কে উৎপাদকে বিশ্লেষণ করলে পাই:\nx² - 2x - 3x + 6 = 0\n⇒ x(x - 2) - 3(x - 2) = 0\n⇒ (x - 2)(x - 3) = 0\nঅতএব, x = 2 অথবা x = 3। সুতরাং সেটের উপাদান হলো {2, 3}। অপশনে 2 থাকায় সঠিক উত্তর (গ)।",
        shortcutTip:
          "শর্টকাট: সমীকরণের ধ্রুবক পদ 6 = 2 × 3 এবং মধ্যপদ (-2 - 3) = -5। মূলদ্বয় হবে +2 ও +3।",
        isLocked: true,
      },
      {
        id: "set-q5",
        number: 5,
        question: "A = {a, b} হলে P(A) এর প্রকৃত উপসেট সংখ্যা কয়টি?",
        options: ["1", "2", "3", "4"],
        correctIndex: 2,
        boardTag: "দিনাজপুর বোর্ড ২০২৩",
        explanation:
          "কোনো সেটের উপাদান সংখ্যা n হলে মোট উপসেট সংখ্যা 2ⁿ এবং প্রকৃত উপসেট সংখ্যা (2ⁿ - 1)। এখানে n = 2, সুতরাং মোট উপসেট 2² = 4টি, কিন্তু প্রকৃত উপসেট হবে (4 - 1) = 3টি ({a}, {b}, ∅)।",
        shortcutTip: "গোল্ডেন রুল: উপসেট = 2ⁿ, প্রকৃত উপসেট = (2ⁿ - 1)।",
        isLocked: true,
      },
      {
        id: "set-q6",
        number: 6,
        question: "A = {1, 2, 3} এবং B = {2, 4} হলে, A ∩ B এর মান কোনটি?",
        options: ["{1, 2, 3, 4}", "{2}", "{1, 3}", "∅"],
        correctIndex: 1,
        boardTag: "চট্টগ্রাম বোর্ড ২০২৪",
        explanation:
          "A ∩ B (ছেদ সেট বা Intersection) হলো উভয় সেটের সাধারণ (Common) উপাদান নিয়ে গঠিত সেট। A ও B উভয়ের মধ্যেই শুধুমাত্র 2 বিদ্যমান। সুতরাং A ∩ B = {2}।",
        shortcutTip: "ইন্টারসেকশন (∩) মানে কেবল কমন (Common) উপাদান নেওয়া।",
        isLocked: true,
      },
      {
        id: "set-q7",
        number: 7,
        question: "কোনো ফাংশন f(x) = x³ - 2x + 6 হলে, f(2) এর মান কত?",
        options: ["8", "10", "12", "14"],
        correctIndex: 1,
        boardTag: "সিলেট বোর্ড ২০২৩",
        explanation:
          "f(2) = (2)³ - 2(2) + 6 = 8 - 4 + 6 = 10। সুতরাং f(2) এর মান 10।",
        shortcutTip:
          "সরাসরি x এর স্থানে 2 বসিয়ে হিসাব করুন: 8 - 4 + 6 = 10।",
        isLocked: true,
      },
      {
        id: "set-q8",
        number: 8,
        question:
          "দুইটি সেটের উপাদান সংখ্যা যথাক্রমে 3 ও 2 হলে, তাদের কার্তেসীয় গুণজের উপাদান সংখ্যা কত?",
        options: ["5", "6", "8", "9"],
        correctIndex: 1,
        boardTag: "ময়মনসিংহ বোর্ড ২০২৪",
        explanation:
          "যদি n(A) = p এবং n(B) = q হয়, তবে n(A × B) = p × q। এখানে 3 × 2 = 6।",
        shortcutTip: "n(A × B) = n(A) × n(B)।",
        isLocked: true,
      },
    ],
  },

  // ─── সাধারণ গণিত: বাস্তব সংখ্যা ──────────────────────────────────
  "general-math-ch01-real-numbers": {
    slug: "ch01-real-numbers",
    subjectSlug: "general-math",
    subjectName: "সাধারণ গণিত",
    subjectEnglish: "SSC General Math",
    chapterNumber: 1,
    chapterNameBangla: "বাস্তব সংখ্যা",
    chapterNameEnglish: "Real Numbers",
    banglishKeywords: [
      "ssc math chapter 1 mcq with solution",
      "bastob shongkha mcq question bank 2026",
      "ssc mulod omulod shongkha board question",
      "ssc real numbers mcq answer sheet",
    ],
    totalQuestionsInDb: 67,
    summary:
      "স্বাভাবিক সংখ্যা, পূর্ণসংখ্যা, ভগ্নাংশ সংখ্যা, মূলদ ও অমূলদ সংখ্যা, আবৃত্ত দশমিক ভগ্নাংশ এবং আসন্ন মান নির্ণয়ের বোর্ড প্রশ্ন ও সমাধান।",
    nextChapterSlug: "ch02-set-and-functions",
    questions: [
      {
        id: "real-q1",
        number: 1,
        question: "সকল মূলদ ও অমূলদ সংখ্যার সেট নিয়ে নিচের কোনটি গঠিত হয়?",
        options: [
          "বাস্তব সংখ্যার সেট",
          "স্বাভাবিক সংখ্যার সেট",
          "পূর্ণসংখ্যার সেট",
          "মৌলিক সংখ্যার সেট",
        ],
        correctIndex: 0,
        boardTag: "ঢাকা বোর্ড ২০২৪",
        explanation:
          "সকল মূলদ সংখ্যা (Rational Numbers) এবং সকল অমূলদ সংখ্যাকে (Irrational Numbers) একত্রে বাস্তব সংখ্যা (Real Numbers, ℝ) বলা হয়।",
        shortcutTip: "Real Numbers = Rational (ℚ) ∪ Irrational (ℚ')।",
        isLocked: false,
      },
      {
        id: "real-q2",
        number: 2,
        question: "নিচের কোনটি অমূলদ সংখ্যা?",
        options: ["√4", "√9", "√7", "0.25"],
        correctIndex: 2,
        boardTag: "কুমিল্লা বোর্ড ২০২৩",
        explanation:
          "যেসব সংখ্যাকে দুটি পূর্ণসংখ্যার অনুপাত p/q (যেখানে q ≠ 0) আকারে প্রকাশ করা যায় না, তাদের অমূলদ সংখ্যা বলে। পূর্ণবর্গ নয় এমন যেকোনো স্বাভাবিক সংখ্যার বর্গমূল অমূলদ সংখ্যা। এখানে 7 পূর্ণবর্গ নয়, তাই √7 একটি অমূলদ সংখ্যা।",
        shortcutTip:
          "পূর্ণবর্গ নয় (যেমন √2, √3, √5, √7) সবসময় অমূলদ সংখ্যা।",
        isLocked: false,
      },
      {
        id: "real-q3",
        number: 3,
        question: "0.3̇ (০.৩ পৌনঃপুনিক)-এর সাধারণ ভগ্নাংশ রূপ কোনটি?",
        options: ["1/3", "3/10", "1/9", "3/100"],
        correctIndex: 0,
        boardTag: "রাজশাহী বোর্ড ২০২৪",
        explanation:
          "আবৃত্ত দশমিককে সাধারণ ভগ্নাংশে রূপান্তরের নিয়ম অনুযায়ী:\n0.3̇ = (3 - 0)/9 = 3/9 = 1/3।",
        shortcutTip: "পৌনঃপুনিক সংখ্যা একটি হলে হরে একটি 9 বসবে: 3/9 = 1/3।",
        isLocked: false,
      },
      {
        id: "real-q4",
        number: 4,
        question:
          "পরপর দুইটি ক্রমিক জোড় সংখ্যার গুণফল সর্বদা কোন সংখ্যা দ্বারা বিভাজ্য?",
        options: ["4", "6", "8", "12"],
        correctIndex: 2,
        boardTag: "যশোর বোর্ড ২০২৩",
        explanation:
          "যেকোনো দুটি ক্রমিক জোড় সংখ্যা ধরুন: 2 ও 4, গুণফল = 8 (যা 8 দ্বারা বিভাজ্য)। আবার 4 ও 6 ধরলে গুণফল 24 (যা 8 দ্বারা বিভাজ্য)। সুতরাং দুইটি ক্রমিক জোড় সংখ্যার গুণফল সর্বদা 8 দ্বারা বিভাজ্য।",
        shortcutTip:
          "উদাহরণ ধরে ট্রাই করুন: 2 × 4 = 8, যা 8 দ্বারা নিঃশেষে বিভাজ্য।",
        isLocked: true,
      },
      {
        id: "real-q5",
        number: 5,
        question:
          "যত দশমিক স্থান পর্যন্ত আসন্ন মান বের করতে হবে, এর পরবর্তী স্থানে 5, 6, 7, 8 বা 9 হলে শেষ স্থানের সংখ্যার সাথে কত যোগ করতে হবে?",
        options: ["0", "1", "2", "কিছুই না"],
        correctIndex: 1,
        boardTag: "দিনাজপুর বোর্ড ২০২৪",
        explanation:
          "আসন্ন মানের নিয়ম অনুসারে, বাদ দেওয়া অংশের প্রথম অঙ্কটি 5 বা তদূর্ধ্ব হলে পূর্ববর্তী অঙ্কের সাথে 1 যোগ করতে হয়।",
        shortcutTip: "≥ 5 হলে +1 যোগ হবে, < 5 হলে অপরিবর্তিত থাকবে।",
        isLocked: true,
      },
    ],
  },

  // ─── পদার্থবিজ্ঞান: গতি (Motion) ──────────────────────────────────
  "physics-ch02-motion": {
    slug: "ch02-motion",
    subjectSlug: "physics",
    subjectName: "পদার্থবিজ্ঞান",
    subjectEnglish: "SSC Physics",
    chapterNumber: 2,
    chapterNameBangla: "গতি",
    chapterNameEnglish: "Motion",
    banglishKeywords: [
      "ssc physics chapter 2 mcq question answer",
      "goti odhay mcq board question solution",
      "ssc physics motion formula math shortcut",
      "physics 2nd chapter mcq uttor 2026",
    ],
    totalQuestionsInDb: 280,
    summary:
      "স্থিতি ও গতি, স্কেলার ও ভেক্টর রাশি, দূরত্ব ও সরণ, দ্রুতি ও বেগ, ত্বরণ ও মন্দন, গতির সমীকরণাবলী এবং মুক্তভাবে পড়ন্ত বস্তুর নিয়মাবলী।",
    prevChapterSlug: "ch01-physical-quantities-and-measurement",
    nextChapterSlug: "ch03-force",
    questions: [
      {
        id: "phy-q1",
        number: 1,
        question: "নিচের কোনটি ভেক্টর রাশি?",
        options: ["দ্রুতি", "কাজ", "সরণ", "শক্তি"],
        correctIndex: 2,
        boardTag: "ঢাকা বোর্ড ২০২৪",
        explanation:
          "যেসব রাশিকে সম্পূর্ণরূপে প্রকাশ করার জন্য মান ও দিক উভয়ের প্রয়োজন হয়, তাদের ভেক্টর রাশি বলে। সরণ (Displacement) একটি নির্দিষ্ট দিকে দূরত্বের পরিবর্তন নির্দেশ করে, তাই সরণ একটি ভেক্টর রাশি। পক্ষান্তরে দ্রুতি, কাজ ও শক্তি স্কেলার রাশি।",
        shortcutTip:
          'ভেক্টর ছন্দ: "ভবে সব প্রিয়তম ভাসে প্রেমে" (বেগ, সরণ, ত্বরন, মন্দন, বল ইত্যাদি)।',
        isLocked: false,
      },
      {
        id: "phy-q2",
        number: 2,
        question:
          "মুক্তভাবে পড়ন্ত কোনো বস্তু 3 সেকেন্ডে 45 মিটার দূরত্ব অতিক্রম করলে, অভিকর্ষজ ত্বরণ g এর মান কত?",
        options: ["9.8 m/s²", "10 m/s²", "9.6 m/s²", "8.9 m/s²"],
        correctIndex: 1,
        boardTag: "কুমিল্লা বোর্ড ২০২৩",
        explanation:
          "পড়ন্ত বস্তুর ক্ষেত্রে h = 1/2 gt² (যেহেতু আদিবেগ u = 0)।\n⇒ 45 = 1/2 × g × (3)²\n⇒ 45 = 1/2 × g × 9\n⇒ g = (45 × 2) / 9 = 90 / 9 = 10 m/s²।",
        shortcutTip:
          "h = 1/2 gt² সূত্রে মান বসালেই দ্রুত উত্তর বের হয়ে আসে।",
        isLocked: false,
      },
      {
        id: "phy-q3",
        number: 3,
        question:
          "সমত্বরণে চলমান কোনো বস্তুর বেগ 5 সেকেন্ডে 10 m/s থেকে বৃদ্ধি পেয়ে 25 m/s হলে, ত্বরণ কত?",
        options: ["2 m/s²", "3 m/s²", "5 m/s²", "7 m/s²"],
        correctIndex: 1,
        boardTag: "রাজশাহী বোর্ড ২০২৪",
        explanation:
          "ত্বরণ a = (v - u) / t। এখানে আদিবেগ u = 10 m/s, শেষবেগ v = 25 m/s, সময় t = 5 s।\nঅতএব a = (25 - 10) / 5 = 15 / 5 = 3 m/s²।",
        shortcutTip: "ত্বরণ = (বেগ বৃদ্ধি) ÷ সময় = 15 ÷ 5 = 3 m/s²।",
        isLocked: false,
      },
      {
        id: "phy-q4",
        number: 4,
        question:
          "বেগ-সময় (v-t) লেখচিত্রের ক্ষেত্রফল নির্দেশ করে নিচের কোনটি?",
        options: ["ত্বরণ", "বল", "অতিক্রান্ত দূরত্ব", "মন্দন"],
        correctIndex: 2,
        boardTag: "যশোর বোর্ড ২০২৪",
        explanation:
          "বেগ-সময় (v-t) গ্রাফের নিচের ক্ষেত্রফল মূলত বেগ ও সময়ের গুণফল নির্দেশ করে, যা বস্তুর মোট অতিক্রান্ত দূরত্ব (s = vt) বা সরণের সমান।",
        shortcutTip:
          "v-t গ্রাফের ঢাল = ত্বরণ; v-t গ্রাফের ক্ষেত্রফল = সরণ/দূরত্ব।",
        isLocked: true,
      },
      {
        id: "phy-q5",
        number: 5,
        question: "ঘড়ির কাঁটার গতি নিচের কোন ধরনের গতি?",
        options: ["রৈখিক গতি", "ঘূর্ণন গতি", "পর্যাবৃত্ত গতি", "চলন গতি"],
        correctIndex: 2,
        boardTag: "দিনাজপুর বোর্ড ২০২৩",
        explanation:
          "কোনো গতিশীল বস্তুর গতি যদি এমন হয় যে এটি নির্দিষ্ট বিন্দুকে নির্দিষ্ট সময় পরপর একই দিক থেকে অতিক্রম করে, তবে তাকে পর্যাবৃত্ত গতি (Periodic Motion) বলে। ঘড়ির কাঁটার গতি একটি নির্দিষ্ট সময় পরপর একই পথে ঘোরে, তাই এটি পর্যাবৃত্ত গতি।",
        shortcutTip:
          "সময় নির্দিষ্ট রেখে বারবার একই পথে ফিরলে তা পর্যাবৃত্ত গতি।",
        isLocked: true,
      },
    ],
  },
};

/**
 * Helper to fetch chapter questions with smart fallback
 */
export function getChapterQuestions(
  subjectSlug: string,
  chapterSlug: string,
): ChapterDetails | null {
  // 1. Try exact match key first
  const key = `${subjectSlug}-${chapterSlug}`;
  if (SSC_CHAPTER_QUESTIONS[key]) {
    return SSC_CHAPTER_QUESTIONS[key];
  }

  const generatedMap = generatedSscQuestions as unknown as Record<string, ChapterDetails>;
  if (generatedMap[key]) {
    return generatedMap[key];
  }

  // 2. Try loose match in generated map (handles "ch01" matching "ch01-motion" or vice-versa)
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
