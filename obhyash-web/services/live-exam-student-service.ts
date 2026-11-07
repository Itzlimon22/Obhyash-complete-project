import { supabase } from "./core";
import { LiveExam, LiveExamAttempt, Question } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";

// ==========================================
// GKE BATCH MOCK EXAMS & QUESTIONS DATA
// ==========================================

// Helper to compute November 2026 dates (Month 10 is November in JS)
const getGkeDate = (day: number, hour: number = 18, minute: number = 0) => {
  const currentYear = new Date().getFullYear();
  return new Date(currentYear, 10, day, hour, minute, 0).toISOString();
};

export const GKE_DEFAULT_EXAMS: (LiveExam & { userAttemptStatus?: string })[] = [
  {
    id: "gke-mt-01",
    title: "MT-01: প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস ও English Grammar",
    description: "বিষয়: সাধারণ জ্ঞান ও ইংরেজি\nসিলেবাস: প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস, Noun, Determiners, Article, Number, Gender (জিকে ১৫ + ইং ১০)",
    category: "gke",
    duration_minutes: 30,
    total_marks: 25,
    total_questions: 25,
    negative_marking: 0.25,
    status: "published",
    start_time: getGkeDate(10, 18, 0), // Starts 10 November 6:00 PM
    end_time: getGkeDate(10, 23, 59),
    is_leaderboard_published: true,
    is_answer_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "gke-mt-02",
    title: "MT-02: ব্রিটিশ শাসন, ভাষা আন্দোলন ও Pronoun",
    description: "বিষয়: সাধারণ জ্ঞান ও ইংরেজি\nসিলেবাস: ব্রিটিশ শাসন, ভাষা আন্দোলন, Pronoun & Classification, Uses of Pronoun (জিকে ১৫ + ইং ১০)",
    category: "gke",
    duration_minutes: 30,
    total_marks: 25,
    total_questions: 25,
    negative_marking: 0.25,
    status: "published",
    start_time: getGkeDate(11, 18, 0), // 11 November
    end_time: getGkeDate(11, 23, 59),
    is_leaderboard_published: true,
    is_answer_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "gke-mt-03",
    title: "MT-03: মুক্তিযুদ্ধ, বাংলাদেশের সংবিধান ও Adjective",
    description: "বিষয়: সাধারণ জ্ঞান ও ইংরেজি\nসিলেবাস: মুক্তিযুদ্ধ ও ৭ বীরশ্রেষ্ঠ, সংবিধান, Adjective, Degree of Comparison (জিকে ১৫ + ইং ১০)",
    category: "gke",
    duration_minutes: 30,
    total_marks: 25,
    total_questions: 25,
    negative_marking: 0.25,
    status: "published",
    start_time: getGkeDate(12, 18, 0), // 12 November
    end_time: getGkeDate(12, 23, 59),
    is_leaderboard_published: true,
    is_answer_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "gke-mt-04",
    title: "MT-04: বাংলাদেশের ভূপ্রকৃতি ও Tense & Sequence of Tense",
    description: "বিষয়: সাধারণ জ্ঞান ও ইংরেজি\nসিলেবাস: নদ-নদী, পাহাড়, সীমানা, দ্বীপ, Tense, Right forms of verbs (জিকে ১৫ + ইং ১০)",
    category: "gke",
    duration_minutes: 30,
    total_marks: 25,
    total_questions: 25,
    negative_marking: 0.25,
    status: "published",
    start_time: getGkeDate(13, 18, 0), // 13 November
    end_time: getGkeDate(13, 23, 59),
    is_leaderboard_published: true,
    is_answer_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "gke-mt-05",
    title: "MT-05: জাতীয় অর্জন, পুরস্কার ও Subject-Verb Agreement",
    description: "বিষয়: সাধারণ জ্ঞান ও ইংরেজি\nসিলেবাস: জাতীয় অর্জন, স্থাপত্য, ভাস্কর্য, Subject-Verb Agreement (জিকে ১৫ + ইং ১০)",
    category: "gke",
    duration_minutes: 30,
    total_marks: 25,
    total_questions: 25,
    negative_marking: 0.25,
    status: "published",
    start_time: getGkeDate(14, 18, 0), // 14 November
    end_time: getGkeDate(14, 23, 59),
    is_leaderboard_published: true,
    is_answer_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "gke-mt-06",
    title: "MT-06: আন্তর্জাতিক সংগঠন, চুক্তি ও Preposition",
    description: "বিষয়: সাধারণ জ্ঞান ও ইংরেজি\nসিলেবাস: জাতিসংঘ, বিশ্বসংস্থা, সদর দপ্তর, Appropriate Preposition, Group Verbs (জিকে ১৫ + ইং ১০)",
    category: "gke",
    duration_minutes: 30,
    total_marks: 25,
    total_questions: 25,
    negative_marking: 0.25,
    status: "published",
    start_time: getGkeDate(15, 18, 0), // 15 November
    end_time: getGkeDate(15, 23, 59),
    is_leaderboard_published: true,
    is_answer_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const GKE_DEFAULT_QUESTIONS: Question[] = [
  {
    id: "gke-q-1",
    question: "বাংলা নামের উৎপত্তি কোন ঐতিহাসিক গ্রন্থ থেকে প্রথম জানা যায়?",
    options: ["আইন-ই-আকবরী", "অর্থশাস্ত্র", "রাজতরঙ্গিণী", "তবকাত-ই-নাসিরী"],
    correctAnswerIndex: 0,
    explanation: "আবুল ফজলের রচিত 'আইন-ই-আকবরী' গ্রন্থে প্রথম 'বাঙ্গালাহ' বা 'বাংলা' নামের সুস্পষ্ট উল্লেখ পাওয়া যায়।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-2",
    question: "প্রাচীন বাংলার প্রথম স্বাধীন ও সার্বভৌম নরপতি কে ছিলেন?",
    options: ["রাজা শশাঙ্ক", "গোপাল", "ধর্মপাল", "লক্ষণ সেন"],
    correctAnswerIndex: 0,
    explanation: "সপ্তম শতকে রাজা শশাঙ্ক স্বাধীন গৌড় রাজ্য প্রতিষ্ঠা করে প্রাচীন বাংলার প্রথম স্বাধীন ও সার্বভৌম শাসক হিসেবে স্বীকৃতি পান।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-3",
    question: "বখতিয়ার খলজি কত সালে বাংলা জয় করেন?",
    options: ["১২০৪ সালে", "১২০৫ সালে", "১২০৬ সালে", "১১৯৯ সালে"],
    correctAnswerIndex: 0,
    explanation: "ইখতিয়ার উদ্দিন মুহাম্মদ বখতিয়ার খলজি ১২০৪ খ্রিস্টাব্দে সেন বংশের রাজা লক্ষণ সেনকে পরাজিত করে বাংলা জয় করেন।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-4",
    question: "বাংলার প্রথম স্বাধীন মুসলিম সুলতান কে ছিলেন?",
    options: ["ফখরুদ্দিন মুবারক শাহ", "শামসুদ্দিন ইলিয়াস শাহ", "আলাউদ্দিন হোসেন শাহ", "গিয়াসউদ্দিন আজম শাহ"],
    correctAnswerIndex: 0,
    explanation: "১৩৩৮ খ্রিস্টাব্দে সোনারগাঁয়ে ফখরুদ্দিন মুবারক শাহ স্বাধীনতা ঘোষণা করে বাংলার প্রথম স্বাধীন সুলতান হিসেবে সিংহাসনে বসেন।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-5",
    question: "'শাহ-ই-বাঙ্গালাহ' উপাধি প্রথম কে ধারণ করেছিলেন?",
    options: ["শামসুদ্দিন ইলিয়াস শাহ", "শেরশাহ", "সুবেদার ইসলাম খান", "মুর্শিদকুলি খান"],
    correctAnswerIndex: 0,
    explanation: "শামসুদ্দিন ইলিয়াস শাহ সমগ্র বাংলাকে একত্রিত করে 'শাহ-ই-বাঙ্গালাহ' বা 'বাঙালির রাজা' উপাধি গ্রহণ করেন।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-6",
    question: "মুঘল আমলে ঢাকাকে সর্বপ্রথম বাংলার রাজধানী করা হয় কত সালে?",
    options: ["১৬১০ সালে", "১৬০৫ সালে", "১৬১২ সালে", "১৭০৪ সালে"],
    correctAnswerIndex: 0,
    explanation: "সুবেদার ইসলাম খান চিশতি ১৬১০ সালে ঢাকাকে সুবাহ বাংলার প্রথম রাজধানী ঘোষণা করেন এবং নামকরণ করেন 'জাহাঙ্গীরনগর'।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-7",
    question: "১৭৫৭ সালের ২৩ জুন কোন নদীর তীরে ঐতিহাসিক পলাশীর যুদ্ধ সংঘটিত হয়?",
    options: ["ভাগীরথী নদী", "পদ্মা নদী", "মেঘনা নদী", "যমুনা নদী"],
    correctAnswerIndex: 0,
    explanation: "নদিয়া জেলার ভাগীরথী নদীর তীরে পলাশীর আম্রকাননে নবাব সিরাজউদ্দৌলা ও রবার্ট ক্লাইভের মধ্যে পলাশীর যুদ্ধ সংঘটিত হয়।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-8",
    question: "১৯৫২ সালের ২১ ফেব্রুয়ারি বাংলা সনের কত তারিখ ছিল?",
    options: ["৮ই ফাল্গুন ১৩৫৮", "৭ই ফাল্গুন ১৩৫৮", "৯ই ফাল্গুন ১৩৫৯", "২১শে মাঘ ১৩৫৮"],
    correctAnswerIndex: 0,
    explanation: "১৯৫২ সালের ২১ ফেব্রুয়ারি ছিল বৃহস্পতিবার, ৮ই ফাল্গুন ১৩৫৮ বঙ্গাব্দ।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-9",
    question: "গণপ্রজাতন্ত্রী বাংলাদেশের সংবিধানের মূলনীতি কয়টি?",
    options: ["৪টি", "৫টি", "৬টি", "৭টি"],
    correctAnswerIndex: 0,
    explanation: "সংবিধানের ৮(১) অনুচ্ছেদ অনুযায়ী মূলনীতি চারটি: জাতীয়তাবাদ, সমাজতন্ত্র, গণতন্ত্র ও ধর্মনিরপেক্ষতা।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-10",
    question: "১৯৭১ সালের মহান মুক্তিযুদ্ধের সর্বাধিনায়ক (Commander-in-Chief) কে ছিলেন?",
    options: ["বঙ্গবন্ধু শেখ মুজিবুর রহমান", "জেনারেল এম এ জি ওসমানী", "তাজউদ্দীন আহমদ", "মেজর জিয়াউর রহমান"],
    correctAnswerIndex: 0,
    explanation: "মুক্তিযুদ্ধের সর্বাধিনায়ক ছিলেন রাষ্ট্রপতি বঙ্গবন্ধু শেখ মুজিবুর রহমান এবং প্রধান সেনাপতি ছিলেন জেনারেল এম এ জি ওসমানী।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-11",
    question: "ঐতিহাসিক মুজিবনগর সরকার কবে আনুষ্ঠানিকভাবে শপথ গ্রহণ করে?",
    options: ["১৭ এপ্রিল ১৯৭১", "১০ এপ্রিল ১৯৭১", "২৬ মার্চ ১৯৭১", "২৫ মার্চ ১৯৭১"],
    correctAnswerIndex: 0,
    explanation: "১০ এপ্রিল মুজিবনগর সরকার গঠিত হয় এবং ১৭ এপ্রিল মেহেরপুরের বৈদ্যনাথতলার আম্রকাননে আনুষ্ঠানিকভাবে শপথ গ্রহণ করে।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-12",
    question: "বীরশ্রেষ্ঠ ফ্লাইট লেফটেন্যান্ট মতিউর রহমানের সমাধিস্থল বর্তমান কোথায়?",
    options: ["মিরপুর শহীদ বুদ্ধিজীবী কবরস্থান", "করাচি, পাকিস্তান", "মেহেরপুর", "কুমিল্লা সেনানিবাস"],
    correctAnswerIndex: 0,
    explanation: "২০০৬ সালে করাচির মাশরুর বিমানঘাঁটি থেকে তাঁর দেহাবশেষ এনে মিরপুর শহীদ বুদ্ধিজীবী কবরস্থানে সমাহিত করা হয়।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-13",
    question: "বাংলাদেশের একমাত্র প্রবাল দ্বীপ কোনটি?",
    options: ["সেন্টমার্টিন", "মহেশখালী", "হাতিয়া", "কুতুবদিয়া"],
    correctAnswerIndex: 0,
    explanation: "সেন্টমার্টিন বাংলাদেশের একমাত্র প্রবাল দ্বীপ। এটি নারিকেল জিঞ্জিরা নামেও পরিচিত।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-14",
    question: "২১শে ফেব্রুয়ারিকে আন্তর্জাতিক মাতৃভাষা দিবস হিসেবে ঘোষণা করে কোন আন্তর্জাতিক সংস্থা?",
    options: ["UNESCO", "UNICEF", "WHO", "UNDP"],
    correctAnswerIndex: 0,
    explanation: "১৯৯৯ সালের ১৭ নভেম্বর ইউনেস্কোর ৩০তম সাধারণ অধিবেশনে ২১শে ফেব্রুয়ারিকে আন্তর্জাতিক মাতৃভাষা দিবস ঘোষণা করা হয়।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-15",
    question: "জাতিসংঘের বর্তমান সদস্য রাষ্ট্র সংখ্যা কত?",
    options: ["১৯৩ টি", "১৯৪ টি", "১৯২ টি", "১৯৫ টি"],
    correctAnswerIndex: 0,
    explanation: "জাতিসংঘের বর্তমান সদস্য সংখ্যা ১৯৩। ২০১১ সালে ১৯৩তম সদস্য হিসেবে অন্তর্ভুক্ত হয় দক্ষিণ সুদান।",
    points: 1,
    subject: "সাধারণ জ্ঞান (GK)",
  } as unknown as Question,
  {
    id: "gke-q-16",
    question: "Identify the noun form of the word 'Brief':",
    options: ["Brevity", "Briefly", "Briefness", "Briefing"],
    correctAnswerIndex: 0,
    explanation: "'Brief' (সংক্ষিপ্ত) শব্দের আদর্শ noun রূপ হলো 'Brevity' (সংক্ষিপ্ততা)। 'Brevity is the soul of wit.'",
    points: 1,
    subject: "ইংরেজি (English)",
  } as unknown as Question,
  {
    id: "gke-q-17",
    question: "Which one of the following words is an Uncountable Noun?",
    options: ["Information", "Book", "Idea", "Song"],
    correctAnswerIndex: 0,
    explanation: "'Information' একটি uncountable noun। এর কোনো বহুবচন (informations) হয় না, একটি তথ্য বোঝাতে 'a piece of information' ব্যবহৃত হয়।",
    points: 1,
    subject: "ইংরেজি (English)",
  } as unknown as Question,
  {
    id: "gke-q-18",
    question: "'A herd of cattle is passing.' Here 'herd' is a/an:",
    options: ["Collective noun", "Abstract noun", "Common noun", "Material noun"],
    correctAnswerIndex: 0,
    explanation: "পশু বা গরুর পালকে বোঝাতে 'herd' ব্যবহৃত হয়, যা সমষ্টিবাচক বা Collective Noun।",
    points: 1,
    subject: "ইংরেজি (English)",
  } as unknown as Question,
  {
    id: "gke-q-19",
    question: "Which of the following is an Abstract Noun?",
    options: ["Childhood", "Child", "Boy", "Family"],
    correctAnswerIndex: 0,
    explanation: "'Childhood' (শৈশব) গুণ, অবস্থা বা অনুভূতির নাম প্রকাশ করে, তাই এটি Abstract Noun।",
    points: 1,
    subject: "ইংরেজি (English)",
  } as unknown as Question,
  {
    id: "gke-q-20",
    question: "What is the plural form of the word 'Criterion'?",
    options: ["Criteria", "Criterions", "Criterias", "Criteriones"],
    correctAnswerIndex: 0,
    explanation: "গ্রিক নিয়মানুযায়ী '-on' যুক্ত একবচন শব্দের বহুবচন করতে '-a' যুক্ত হয়। Criterion -> Criteria, Phenomenon -> Phenomena।",
    points: 1,
    subject: "ইংরেজি (English)",
  } as unknown as Question,
  {
    id: "gke-q-21",
    question: "Which of the following words is singular in number?",
    options: ["Scenery", "People", "Police", "Cattle"],
    correctAnswerIndex: 0,
    explanation: "'Scenery', 'Poetry', 'Furniture', 'Luggage' সর্বদা singular uncountable noun হিসেবে গণ্য হয়।",
    points: 1,
    subject: "ইংরেজি (English)",
  } as unknown as Question,
  {
    id: "gke-q-22",
    question: "Identify the masculine gender of 'Duck':",
    options: ["Drake", "Drone", "Gander", "Buck"],
    correctAnswerIndex: 0,
    explanation: "'Duck' (স্ত্রী হাঁস)-এর masculine gender হলো 'Drake' (পাতিহাঁস)। রাজহাঁসের ক্ষেত্রে Goose -> Gander।",
    points: 1,
    subject: "ইংরেজি (English)",
  } as unknown as Question,
  {
    id: "gke-q-23",
    question: "'He gave me ______ useful advice.' Choose the correct determiner:",
    options: ["some", "many", "a few", "an"],
    correctAnswerIndex: 0,
    explanation: "'Advice' একটি uncountable noun, তাই এর পূর্বে 'some' সঠিক। 'many' বা 'a few' কেবল countable plural-এর পূর্বে বসে।",
    points: 1,
    subject: "ইংরেজি (English)",
  } as unknown as Question,
  {
    id: "gke-q-24",
    question: "Choose the grammatically correct sentence:",
    options: [
      "He gave me a piece of information.",
      "He gave me an information.",
      "He gave me many informations.",
      "He gave me informations."
    ],
    correctAnswerIndex: 0,
    explanation: "'Information' uncountable হওয়ায় এর সাথে সরাসরি 'an' বা 's' যোগ করা যায় না। 'a piece of information' বলা ব্যাকরণগতভাবে শুদ্ধ।",
    points: 1,
    subject: "ইংরেজি (English)",
  } as unknown as Question,
  {
    id: "gke-q-25",
    question: "The feminine form of the noun 'Colt' is:",
    options: ["Filly", "Mare", "Ewe", "Doe"],
    correctAnswerIndex: 0,
    explanation: "ঘোড়ার পুরুষ শাবককে 'Colt' এবং স্ত্রী শাবককে 'Filly' বলা হয়। পূর্ণাঙ্গ ঘোড়া: Stallion -> Mare।",
    points: 1,
    subject: "ইংরেজি (English)",
  } as unknown as Question,
];

// ==========================================
// FETCHING EXAMS
// ==========================================

export async function getPublishedLiveExams(category?: string, userId?: string): Promise<(LiveExam & { userAttemptStatus?: string })[]> {
  let query = supabase
    .from("live_exams")
    .select(`
      *,
      total_questions:live_exam_questions(count)
    `)
    .eq("status", "published")
    .order("start_time", { ascending: true });

  if (category && category !== 'All' && category !== 'all') {
    query = query.or(`category.ilike.${category},category.ilike.all,category.ilike.general`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching student live exams:", error);
    if (category && category.toLowerCase().includes("gke")) {
      return GKE_DEFAULT_EXAMS.map((exam) => {
        let attemptStatus: string | undefined = undefined;
        if (typeof window !== "undefined" && userId) {
          const cached = localStorage.getItem(`obhyash_live_attempt_${exam.id}_${userId}`);
          if (cached) attemptStatus = "submitted";
        }
        return { ...exam, userAttemptStatus: attemptStatus };
      });
    }
    throw error;
  }

  if ((!data || data.length === 0) && category && category.toLowerCase().includes("gke")) {
    return GKE_DEFAULT_EXAMS.map((exam) => {
      let attemptStatus: string | undefined = undefined;
      if (typeof window !== "undefined" && userId) {
        const cached = localStorage.getItem(`obhyash_live_attempt_${exam.id}_${userId}`);
        if (cached) attemptStatus = "submitted";
      }
      return { ...exam, userAttemptStatus: attemptStatus };
    });
  }

  const attemptsMap: Record<string, string> = {};

  if (userId && data.length > 0) {
    const examIds = data.map(e => e.id);
    const { data: attemptsData } = await supabase
      .from("live_exam_attempts")
      .select("live_exam_id, status")
      .eq("user_id", userId)
      .in("live_exam_id", examIds);

    if (attemptsData) {
      attemptsData.forEach(a => {
        attemptsMap[a.live_exam_id] = a.status;
      });
    }
  }

  return data.map((exam) => ({
    ...exam,
    total_questions: exam.total_questions?.[0]?.count || 0,
    userAttemptStatus: attemptsMap[exam.id]
  })) as (LiveExam & { userAttemptStatus?: string })[];
}

export async function getStudentLiveExamDetails(
  examId: string,
  userId: string
): Promise<{ exam: LiveExam; attempt: LiveExamAttempt | null }> {
  // GKE or Mock Exam fallback handling
  if (examId.startsWith("gke-") || examId.startsWith("mock-")) {
    const matchedExam = GKE_DEFAULT_EXAMS.find((e) => e.id === examId) || {
      id: examId,
      title: `${examId.toUpperCase()}: মেডিকেল ভর্তি মডেল টেস্ট`,
      description: "বিষয়: সাধারণ জ্ঞান ও ইংরেজি\nসিলেবাস: প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস, Noun, Determiners, Article, Number, Gender (জিকে ১৫ + ইং ১০)",
      category: "gke",
      duration_minutes: 30,
      total_marks: 25,
      total_questions: 25,
      negative_marking: 0.25,
      status: "published",
      start_time: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      end_time: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      is_leaderboard_published: true,
      is_answer_published: true,
    } as LiveExam;

    let attempt: LiveExamAttempt | null = null;
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(`obhyash_live_attempt_${examId}_${userId}`);
      if (cached) {
        try {
          attempt = JSON.parse(cached);
        } catch {}
      }
    }
    return { exam: matchedExam, attempt };
  }

  // GKE Practice Exam on-the-fly handling
  if (examId.startsWith("gke_practice_") || examId.startsWith("gke-practice-")) {
    const isEn = examId.includes("english");
    const isInt = examId.includes("international");
    const isBd = examId.includes("bangladesh");
    const title = isEn
      ? "GKE ইংরেজি স্পেশাল প্র্যাকটিস টেস্ট"
      : isInt
        ? "GKE আন্তর্জাতিক বিষয়াবলী প্র্যাকটিস টেস্ট"
        : isBd
          ? "GKE বাংলাদেশ বিষয়াবলী প্র্যাকটিস টেস্ট"
          : "GKE কম্বাইন্ড কুইক প্র্যাকটিস টেস্ট";

    const practiceExam: LiveExam = {
      id: examId,
      title,
      description: "GKE প্র্যাকটিস প্রশ্নব্যাংক থেকে ৫০ নম্বরের অনুশীলন পরীক্ষা",
      category: "gke",
      duration_minutes: 30,
      total_marks: 50,
      total_questions: 50,
      negative_marking: 0.25,
      status: "published",
      start_time: new Date(Date.now() - 3600000).toISOString(),
      end_time: new Date(Date.now() + 31536000000).toISOString(),
      is_leaderboard_published: true,
      is_answer_published: true,
      is_practice_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { exam: practiceExam, attempt: null };
  }

  // Fetch exam from database
  try {
    let resolvedExamId = examId;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(examId)) {
      const { data: codeMatch } = await supabase
        .from("live_exams")
        .select("id")
        .or(`exam_id.eq.${examId},exam_id.eq.${examId.replace(/-/g, "_")}`)
        .maybeSingle();
      if (codeMatch?.id) {
        resolvedExamId = codeMatch.id;
      }
    }

    const { data: examData, error: examError } = await supabase
      .from("live_exams")
      .select(`*, total_questions:live_exam_questions(count)`)
      .eq("id", resolvedExamId)
      .single();

    if (examError || !examData) {
      console.warn("Live exam not found in DB, checking GKE default fallback:", examId);
      const fallbackExam = GKE_DEFAULT_EXAMS.find((e) => e.id === examId) || GKE_DEFAULT_EXAMS[0];
      let attempt: LiveExamAttempt | null = null;
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(`obhyash_live_attempt_${examId}_${userId}`);
        if (cached) {
          try {
            attempt = JSON.parse(cached);
          } catch {}
        }
      }
      return { exam: fallbackExam, attempt };
    }

    // Fetch attempt
    const { data: attemptData, error: attemptError } = await supabase
      .from("live_exam_attempts")
      .select(`*`)
      .eq("live_exam_id", examId)
      .eq("user_id", userId)
      .maybeSingle();

    if (attemptError && attemptError.code !== "PGRST116") {
      console.error("Error fetching user attempt:", attemptError);
    }

    return {
      exam: {
        ...examData,
        total_questions: examData.total_questions?.[0]?.count || 0,
      } as LiveExam,
      attempt: attemptData as LiveExamAttempt | null,
    };
  } catch (err) {
    const fallbackExam = GKE_DEFAULT_EXAMS.find((e) => e.id === examId) || GKE_DEFAULT_EXAMS[0];
    let attempt: LiveExamAttempt | null = null;
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(`obhyash_live_attempt_${examId}_${userId}`);
      if (cached) {
        try {
          attempt = JSON.parse(cached);
        } catch {}
      }
    }
    return { exam: fallbackExam, attempt };
  }
}

// ==========================================
// EXAM TAKING FLOW
// ==========================================

export async function startLiveExam(
  examId: string,
  userId: string
): Promise<{ attemptId: string; questions: Question[] }> {
  let resolvedExamId = examId;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(examId)) {
    const { data: codeMatch } = await supabase
      .from("live_exams")
      .select("id")
      .or(`exam_id.eq.${examId},exam_id.eq.${examId.replace(/-/g, "_")}`)
      .maybeSingle();
    if (codeMatch?.id) {
      resolvedExamId = codeMatch.id;
    }
  }

  // GKE Practice Exam on-the-fly handling
  if (examId.startsWith("gke_practice_") || examId.startsWith("gke-practice-")) {
    const attemptId = `practice-${examId}-${Date.now()}`;
    let query = supabase
      .from("gke_questions")
      .select("id, question, options, answer, correct_answer_indices, explanation, category, sheet_name")
      .neq("category", "Model Test");

    if (examId.includes("bangladesh")) {
      query = query.eq("category", "Bangladesh");
    } else if (examId.includes("international")) {
      query = query.eq("category", "International");
    } else if (examId.includes("english")) {
      query = query.eq("category", "English");
    }

    const { data: qData, error: qErr } = await query.limit(50);
    if (qErr) throw qErr;

    const questions: Question[] = (qData || []).map((q: any, idx: number) => {
      const correctIdx = Array.isArray(q.correct_answer_indices) && q.correct_answer_indices.length > 0
        ? q.correct_answer_indices[0]
        : (q.answer === "B" ? 1 : q.answer === "C" ? 2 : q.answer === "D" ? 3 : 0);

      return {
        id: q.id,
        serial: idx + 1,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correct_answer_index: correctIdx,
        correct_answer_indices: [correctIdx],
        explanation: q.explanation || "",
        points: 1,
        subject: q.category === "English" ? "ইংরেজি" : "সাধারণ জ্ঞান",
      } as unknown as Question;
    });

    return { attemptId, questions };
  }

  // Mock Exam fallback handling
  if (resolvedExamId.startsWith("mock-")) {
    const attemptId = `${examId}-attempt-${Date.now()}`;
    return { attemptId, questions: GKE_DEFAULT_QUESTIONS };
  }

  // 1. Create or get existing "ongoing" attempt
  const { data: attemptData, error: attemptError } = await supabase
    .from("live_exam_attempts")
    .select("id, status")
    .eq("live_exam_id", resolvedExamId)
    .eq("user_id", userId)
    .maybeSingle();

  if (attemptError) throw attemptError;

  let attemptId: string;

  if (attemptData && attemptData.status === "submitted") {
    // Already submitted official attempt -> Enter practice re-attempt mode!
    attemptId = `practice-${Date.now()}`;
  } else if (!attemptData) {
    // Insert new official attempt
    const { data: newAttempt, error: insertError } = await supabase
      .from("live_exam_attempts")
      .insert([
        {
          live_exam_id: resolvedExamId,
          user_id: userId,
          status: "ongoing",
          start_time: new Date().toISOString(),
        },
      ])
      .select("id")
      .single();

    if (insertError) throw insertError;
    attemptId = newAttempt.id;
  } else {
    attemptId = attemptData.id;
  }

  // 2. Fetch junction rows with question_id, points, serial, and direct secret question fields
  const { data: junctionData, error: junctionError } = await supabase
    .from("live_exam_questions")
    .select("id, serial, points, question_id, question, options, correct_answer_index, explanation, subject")
    .eq("live_exam_id", resolvedExamId)
    .order("serial", { ascending: true });

  if (junctionError) throw junctionError;

  // Helper to guarantee questions are grouped subject-wise
  const groupBySubject = (qList: Question[]): Question[] => {
    if (!qList || qList.length === 0) return [];
    const groups = new Map<string, Question[]>();
    const subjectOrder: string[] = [];

    for (const q of qList) {
      const rawSub = q.subject || (q as any).subjectLabel || 'সাধারণ';
      const subKey = BanglaNameHelper.getMainSubjectName(rawSub);
      if (!groups.has(subKey)) {
        groups.set(subKey, []);
        subjectOrder.push(subKey);
      }
      groups.get(subKey)!.push(q);
    }

    const result: Question[] = [];
    for (const subKey of subjectOrder) {
      result.push(...groups.get(subKey)!);
    }
    return result;
  };

  // Direct secret questions stored inside live_exam_questions
  const isDirect = (junctionData || []).some((j: any) => j.question && j.question.trim().length > 0);
  if (isDirect) {
    const rawQuestions: Question[] = (junctionData || []).map((j: any) => ({
      id: j.id,
      question: j.question,
      options: Array.isArray(j.options) ? j.options : [],
      correctAnswerIndex: j.correct_answer_index ?? 0,
      correctAnswerIndices: [j.correct_answer_index ?? 0],
      explanation: j.explanation || "",
      subject: j.subject || "",
      points: Number(j.points) || 1,
      type: "MCQ",
      difficulty: "Medium",
    } as any));

    const questions = groupBySubject(rawQuestions);
    return { attemptId: attemptId!, questions };
  }

  const questionIds = (junctionData || [])
    .map((j: any) => j.question_id)
    .filter(Boolean);

  if (questionIds.length === 0) {
    return { attemptId: attemptId!, questions: [] };
  }

  // 3. Fetch actual questions
  const { data: qListData, error: qListError } = await supabase
    .from("questions")
    .select("*")
    .in("id", questionIds);

  if (qListError) throw qListError;

  const questionMap = new Map((qListData || []).map((q: any) => [q.id, q]));

  const rawQuestions: Question[] = [];
  for (const j of junctionData || []) {
    if (questionMap.has(j.question_id)) {
      const q = questionMap.get(j.question_id);
      rawQuestions.push({
        ...q,
        imageUrl: q.imageUrl || q.image_url,
        explanationImageUrl: q.explanationImageUrl || q.explanation_image_url,
        subject: j.subject || q.subject || "",
        points: Number(j.points) || q.points || 1,
      });
    }
  }

  const questions = groupBySubject(rawQuestions);
  return { attemptId: attemptId!, questions };
}

export async function submitLiveExam(
  attemptId: string,
  userAnswers: Record<string, number>,
  correctCount: number,
  wrongCount: number,
  score: number,
  examId?: string,
  userId?: string,
  timeTakenSeconds?: number
): Promise<void> {
  if (attemptId.startsWith("mock-") || attemptId.startsWith("gke-") || examId?.startsWith("gke-")) {
    if (typeof window !== "undefined" && examId) {
      const attemptData: LiveExamAttempt = {
        id: attemptId,
        live_exam_id: examId,
        user_id: userId || "user",
        score,
        correct_count: correctCount,
        wrong_count: wrongCount,
        user_answers: userAnswers,
        start_time: new Date(Date.now() - (timeTakenSeconds || 120) * 1000).toISOString(),
        submit_time: new Date().toISOString(),
        status: "submitted",
        created_at: new Date().toISOString(),
      };
      try {
        localStorage.setItem(`obhyash_live_attempt_${examId}_${userId || "user"}`, JSON.stringify(attemptData));
      } catch (err) {
        console.warn("Failed to save local attempt for GKE:", err);
      }
    }
    return;
  }

  if (attemptId.startsWith("practice-") && examId && userId) {
    // Practice Attempt -> Persist in practice history table
    try {
      await supabase.from("live_exam_practice_history").insert([
        {
          live_exam_id: examId,
          user_id: userId,
          score,
          correct_count: correctCount,
          wrong_count: wrongCount,
          user_answers: userAnswers,
          time_taken_seconds: timeTakenSeconds || 0,
          submit_time: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.warn("Failed to insert into live_exam_practice_history:", err);
    }
    return;
  }

  // Official First-Time Attempt -> Updates live_exam_attempts for official Leaderboard
  const safeTimeTaken = Math.max(0, timeTakenSeconds || 0);
  const { error } = await supabase
    .from("live_exam_attempts")
    .update({
      user_answers: userAnswers,
      correct_count: correctCount,
      wrong_count: wrongCount,
      score: score,
      time_taken_seconds: safeTimeTaken,
      time_taken_ms: safeTimeTaken * 1000,
      submit_time: new Date().toISOString(),
      status: "submitted",
    })
    .eq("id", attemptId);

  if (error) {
    console.error("Error submitting live exam:", error);
    throw error;
  }
}

export async function getStudentLiveExamPracticeHistory(
  examId: string,
  userId: string
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("live_exam_practice_history")
      .select("*")
      .eq("live_exam_id", examId)
      .eq("user_id", userId)
      .order("submit_time", { ascending: false });

    if (error) return [];
    return data || [];
  } catch (_) {
    return [];
  }
}

// ==========================================
// SOLUTIONS & EXPLANATIONS
// ==========================================

export async function getLiveExamSolutions(
  examId: string,
  userId?: string
): Promise<{ questions: Question[]; userAnswers: Record<string, number> }> {
  if (examId.startsWith("gke-")) {
    let userAnswers: Record<string, number> = {};
    if (typeof window !== "undefined" && userId) {
      const cached = localStorage.getItem(`obhyash_live_attempt_${examId}_${userId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.user_answers) userAnswers = parsed.user_answers;
        } catch {}
      }
    }
    return { questions: GKE_DEFAULT_QUESTIONS, userAnswers };
  }

  if (examId.startsWith("mock-")) {
    const mockQuestions: Question[] = [
      {
        id: "mock-q-0",
        question: "নিচের কোন বলটি প্রকৃতির সবচেয়ে শক্তিশালী মৌলিক বল?",
        options: [
          "সবল নিউক্লীয় বল (Strong Nuclear Force)",
          "তড়িৎ চৌম্বক বল (Electromagnetic Force)",
          "দুর্বল নিউক্লীয় বল (Weak Nuclear Force)",
          "মহাকর্ষ বল (Gravitational Force)"
        ],
        correctAnswerIndex: 0,
        explanation: "প্রকৃতির চারটি মৌলিক বলের মধ্যে সবল নিউক্লীয় বল সবচেয়ে শক্তিশালী। এর আপেক্ষিক তীব্রতা ১০৩৮ গুণ (মহাকর্ষ বলের সাপেক্ষে)।",
        points: 1,
        subject: "পদার্থবিজ্ঞান",
        chapter: "ভৌত জগত ও পরিমাপ",
        topic: "মৌলিক বল",
        difficulty: "easy",
        examType: "live",
        status: "published",
      } as unknown as Question,
      {
        id: "mock-q-1",
        question: "একটি বস্তুকে খাড়া উপরের দিকে 49 m/s বেগে নিক্ষেপ করলে এটি সর্বোচ্চ কত উচ্চতায় পৌঁছাবে?",
        options: [
          "122.5 m",
          "245 m",
          "98 m",
          "49 m"
        ],
        correctAnswerIndex: 0,
        explanation: "সর্বোচ্চ উচ্চতা $H = \\frac{u^2}{2g} = \\frac{(49)^2}{2 \\times 9.8} = \\frac{2401}{19.6} = 122.5\\text{ m}$।",
        points: 1,
        subject: "পদার্থবিজ্ঞান",
        chapter: "গতিবিদ্যা",
        topic: "নিক্ষিপ্ত বস্তু",
        difficulty: "medium",
        examType: "live",
        status: "published",
      } as unknown as Question,
      {
        id: "mock-q-2",
        question: "মানবদেহের স্বাভাবিক রক্তচাপ (Blood Pressure) কত?",
        options: [
          "120/80 mmHg",
          "140/90 mmHg",
          "100/70 mmHg",
          "130/85 mmHg"
        ],
        correctAnswerIndex: 0,
        explanation: "একজন সুস্থ পূর্ণবয়স্ক মানুষের আদর্শ সিস্টোলিক রক্তচাপ ১২০ মিমি পারদ এবং ডায়াস্টোলিক রক্তচাপ ৮০ মিমি পারদ (120/80 mmHg)।",
        points: 1,
        subject: "জীববিজ্ঞান",
        chapter: "রক্ত ও সংবহন",
        topic: "রক্তচাপ",
        difficulty: "easy",
        examType: "live",
        status: "published",
      } as unknown as Question,
      {
        id: "mock-q-3",
        question: "$\\lim_{x \\to 0} \\frac{\\sin 5x}{x}$ এর মান কত?",
        options: [
          "5",
          "1",
          "0",
          "অসীম"
        ],
        correctAnswerIndex: 0,
        explanation: "আমরা জানি $\\lim_{x \\to 0} \\frac{\\sin ax}{ax} = 1$, অতএব $\\lim_{x \\to 0} \\frac{\\sin 5x}{5x} \\times 5 = 1 \\times 5 = 5$।",
        points: 1,
        subject: "উচ্চতর গণিত",
        chapter: "অন্তরীকরণ",
        topic: "লিমিট",
        difficulty: "medium",
        examType: "live",
        status: "published",
      } as unknown as Question,
      {
        id: "mock-q-4",
        question: "নিচের কোন যৌগে sp² সংকরায়ণ (Hybridization) বিদ্যমান?",
        options: [
          "C₂H₄ (ইথিন)",
          "CH₄ (মিথেন)",
          "C₂H₂ (ইথাইন)",
          "C₂H₆ (ইথেন)"
        ],
        correctAnswerIndex: 0,
        explanation: "ইথিন (C₂H₄) অণুতে প্রতিটি কার্বন পরমাণু ৩টি সিগমা ও ১টি পাই বন্ধন তৈরি করে, তাই এখানে $sp^2$ সংকরায়ণ ঘটে।",
        points: 1,
        subject: "রসায়ন",
        chapter: "পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন",
        topic: "সংকরায়ণ",
        difficulty: "medium",
        examType: "live",
        status: "published",
      } as unknown as Question,
    ];

    const mockAnswers: Record<string, number> = {
      "mock-q-0": 0,
      "mock-q-1": 0,
      "mock-q-2": 1, // deliberately wrong for demonstration
      "mock-q-3": 0,
    };

    return { questions: mockQuestions, userAnswers: mockAnswers };
  }

  let resolvedExamId = examId;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(examId)) {
    const { data: codeMatch } = await supabase
      .from("live_exams")
      .select("id")
      .or(`exam_id.eq.${examId},exam_id.eq.${examId.replace(/-/g, "_")}`)
      .maybeSingle();
    if (codeMatch?.id) {
      resolvedExamId = codeMatch.id;
    }
  }

  // Security Check: Verify exam has finished or answers are explicitly published before returning solutions
  const { data: examMeta, error: examMetaErr } = await supabase
    .from("live_exams")
    .select("id, end_time, is_answer_published")
    .eq("id", resolvedExamId)
    .maybeSingle();

  if (examMetaErr) {
    console.error("Error fetching live exam metadata:", examMetaErr);
  } else if (examMeta) {
    const now = new Date();
    const isPast = examMeta.end_time ? now.getTime() > new Date(examMeta.end_time).getTime() : false;
    const isAnswerAllowed = isPast || examMeta.is_answer_published === true;
    if (!isAnswerAllowed) {
      throw new Error("EXAM_RESULT_NOT_PUBLISHED");
    }
  }

  // 1. Fetch junction rows with question_id, points, serial, and direct secret question fields
  const { data: junctionData, error: junctionErr } = await supabase
    .from("live_exam_questions")
    .select("id, serial, points, question_id, question, options, correct_answer_index, explanation, subject")
    .eq("live_exam_id", resolvedExamId)
    .order("serial", { ascending: true });

  if (junctionErr) {
    console.error("Error fetching exam solution junction:", junctionErr);
    throw junctionErr;
  }

  const isDirect = (junctionData || []).some((j: any) => j.question && j.question.trim().length > 0);
  let questions: Question[] = [];

  if (isDirect) {
    questions = (junctionData || []).map((j: any) => ({
      id: j.id,
      question: j.question,
      options: Array.isArray(j.options) ? j.options : [],
      correctAnswerIndex: j.correct_answer_index ?? 0,
      correctAnswerIndices: [j.correct_answer_index ?? 0],
      explanation: j.explanation || "",
      subject: j.subject || "",
      points: Number(j.points) || 1,
      type: "MCQ",
      difficulty: "Medium",
    } as any));
  } else {
    const questionIds = (junctionData || [])
      .map((j: any) => j.question_id)
      .filter(Boolean);

    if (questionIds.length > 0) {
      const { data: qListData, error: qListErr } = await supabase
        .from("questions")
        .select("*")
        .in("id", questionIds);

      if (qListErr) {
        console.error("Error fetching solution questions:", qListErr);
        throw qListErr;
      }

      const questionMap = new Map((qListData || []).map((q: any) => [q.id, q]));
      for (const j of junctionData || []) {
        if (questionMap.has(j.question_id)) {
          const q = questionMap.get(j.question_id);
          questions.push({
            ...q,
            points: Number(j.points) || q.points || 1,
          });
        }
      }
    }
  }

  // 2. Fetch user's answers if user is provided
  let userAnswers: Record<string, number> = {};
  if (userId) {
    const { data: attemptData } = await supabase
      .from("live_exam_attempts")
      .select("user_answers")
      .eq("live_exam_id", examId)
      .eq("user_id", userId)
      .maybeSingle();

    if (attemptData?.user_answers) {
      userAnswers = attemptData.user_answers;
    }
  }

  return { questions, userAnswers };
}

// ==========================================
// LEADERBOARD (PUBLIC)
// ==========================================

export async function getPublicLeaderboard(examId: string, limit: number = 100): Promise<any[]> {
  if (examId.startsWith("gke-")) {
    return [
      { id: "gke-lb-1", score: 24.75, correct_count: 25, wrong_count: 1, users: { name: "রাকিবুল হাসান", institute: "ঢাকা কলেজ", avatarColor: "#f59e0b" } },
      { id: "gke-lb-2", score: 24.00, correct_count: 24, wrong_count: 0, users: { name: "সাদিয়া আক্তার", institute: "ভিকারুননিসা নূন স্কুল ও কলেজ", avatarColor: "#10b981" } },
      { id: "gke-lb-3", score: 23.50, correct_count: 24, wrong_count: 2, users: { name: "তানভীর আহমেদ", institute: "নটর ডেম কলেজ", avatarColor: "#3b82f6" } },
      { id: "gke-lb-4", score: 22.75, correct_count: 23, wrong_count: 1, users: { name: "মেহজাবিন চৌধুরী", institute: "রাজউক উত্তরা মডেল কলেজ", avatarColor: "#8b5cf6" } },
      { id: "gke-lb-5", score: 22.50, correct_count: 23, wrong_count: 2, users: { name: "আহনাফ রহমান", institute: "আইডিয়াল কলেজ", avatarColor: "#059669" } },
    ];
  }

  if (examId.startsWith("mock-")) {
    return [
      { id: "mock-lb-1", score: 95, correct_count: 95, wrong_count: 0, users: { name: "রাকিবুল হাসান", institute: "ঢাকা কলেজ", avatarColor: "#f59e0b" } },
      { id: "mock-lb-2", score: 85, correct_count: 85, wrong_count: 0, users: { name: "সাদিয়া আক্তার", institute: "ভিকারুননিসা নূন স্কুল ও কলেজ", avatarColor: "#10b981" } },
      { id: "mock-lb-3", score: 80, correct_count: 82, wrong_count: 8, users: { name: "তানভীর আহমেদ", institute: "নটর ডেম কলেজ", avatarColor: "#3b82f6" } },
      { id: "mock-lb-4", score: 76.25, correct_count: 78, wrong_count: 7, users: { name: "মেহজাবিন চৌধুরী", institute: "রাজউক উত্তরা মডেল কলেজ", avatarColor: "#8b5cf6" } },
      { id: "mock-lb-5", score: 72.5, correct_count: 75, wrong_count: 10, users: { name: "আহনাফ রহমান", institute: "আইডিয়াল কলেজ", avatarColor: "#ec4899" } }
    ];
  }
  const { data, error } = await supabase
    .from("live_exam_attempts")
    .select(`
      id,
      score,
      correct_count,
      wrong_count,
      start_time,
      time_taken_seconds,
      time_taken_ms,
      created_at,
      users (
        name,
        avatarUrl:avatar_url,
        avatarColor:avatar_color,
        institute,
        role
      )
    `)
    .eq("live_exam_id", examId)
    .eq("status", "submitted")
    .limit(limit * 2);

  if (error) {
    console.error("Error fetching public leaderboard:", error);
    throw error;
  }

  const studentData = (data || [])
    .filter((item: any) => {
      const role = (item.users?.role || "student").toLowerCase();
      return role === "student";
    })
    .sort((a: any, b: any) => {
      // 1. Score DESC (Highest marks first)
      if (b.score !== a.score) return b.score - a.score;

      // 2. Exact Millisecond Duration ASC (Fastest duration first)
      const getDurationMs = (it: any) => {
        if (it.time_taken_ms != null) return Number(it.time_taken_ms);
        if (it.time_taken_seconds != null) return Number(it.time_taken_seconds) * 1000;
        if (it.start_time && it.submit_time) {
          return new Date(it.submit_time).getTime() - new Date(it.start_time).getTime();
        }
        return 999999999999;
      };
      const aDur = getDurationMs(a);
      const bDur = getDurationMs(b);
      if (aDur !== bDur) return aDur - bDur;

      // 3. Wrong Count ASC (Fewest mistakes first)
      if ((a.wrong_count || 0) !== (b.wrong_count || 0)) {
        return (a.wrong_count || 0) - (b.wrong_count || 0);
      }

      // 4. Start Time ASC (First begun first)
      const aStart = a.start_time ? new Date(a.start_time).getTime() : 0;
      const bStart = b.start_time ? new Date(b.start_time).getTime() : 0;
      return aStart - bStart;
    })
    .slice(0, limit);

  return studentData;
}
