import { Question, SubscriptionPlan, PaymentSubmission } from '@/lib/types';

// --- TYPES ---
export interface SubjectMetadata {
  chapters: string[];
  topics: Record<string, string[]>; // Map chapter to topics
}

export const SUBJECT_METADATA: Record<string, SubjectMetadata> = {
  Physics: {
    chapters: [
      'ভেক্টর (Vectors)',
      'গতিবিদ্যা (Dynamics)',
      'নিউটনীয় বলবিদ্যা (Newtonian Mechanics)',
      'কাজ, শক্তি ও ক্ষমতা',
      'মহাকর্ষ ও অভিকর্ষ',
      'পদার্থের গাঠনিক ধর্ম',
      'পর্যায়বৃত্ত গতি',
    ],
    topics: {
      'ভেক্টর (Vectors)': [
        'লব্ধি',
        'নদী-নৌকা',
        'ডট ও ক্রস গুণন',
        'গ্রেডিয়েন্ট, ডাইভারজেন্স, কার্ল',
      ],
      'গতিবিদ্যা (Dynamics)': ['প্রাস', 'লেখচিত্র', 'গড় বেগ ও আপেক্ষিক বেগ'],
      'নিউটনীয় বলবিদ্যা (Newtonian Mechanics)': [
        'জড়তার ভ্রামক',
        'কৌণিক গতিসূত্র',
        'ব্যাংকিং কোণ',
        'রকেট',
      ],
    },
  },
  Chemistry: {
    chapters: [
      'ল্যাবরেটরির নিরাপদ ব্যবহার',
      'গুণগত রসায়ন',
      'মৌলের পর্যায়বৃত্ত ধর্ম',
      'রাসায়নিক পরিবর্তন',
      'কর্মমুখী রসায়ন',
    ],
    topics: {
      'গুণগত রসায়ন': [
        'রাদারফোর্ড ও বোর মডেল',
        'কোয়ান্টাম সংখ্যা',
        'দ্রাব্যতা',
        'আয়ন শনাক্তকরণ',
      ],
      'রাসায়নিক পরিবর্তন': [
        'pH ও বাফার দ্রবণ',
        'হেস এর সূত্র',
        'বিক্রিয়ার হার',
      ],
    },
  },
  Math: {
    chapters: [
      'ম্যাট্রিক্স ও নির্ণায়ক',
      'ভেক্টর',
      'সরলরেখা',
      'বৃত্ত',
      'বিন্যাস ও সমাবেশ',
      'ত্রিকোণমিতি',
      'অন্তরীকরণ',
      'যোগজীকরণ',
    ],
    topics: {
      'ম্যাট্রিক্স ও নির্ণায়ক': [
        'বিপরীত ম্যাট্রিক্স',
        'ক্রেমারের নিয়ম',
        'ম্যাট্রিক্সের প্রকারভেদ',
      ],
      সরলরেখা: ['ঢাল', 'লম্ব ও সমান্তরাল রেখা', 'কোণ নির্ণয়'],
    },
  },
  Biology: {
    chapters: [
      'কোষ ও এর গঠন',
      'কোষ বিভাজন',
      'কোষ রসায়ন',
      'অণুজীব',
      'উদ্ভিদের শারীরতত্ত্ব',
    ],
    topics: {
      'কোষ ও এর গঠন': [
        'DNA ও RNA',
        'ট্রান্সক্রিপশন ও ট্রান্সলেশন',
        'কোষ অঙ্গাণু',
      ],
      'কোষ বিভাজন': ['মাইটোসিস', 'মিয়োসিস', 'ক্রসিং ওভার'],
    },
  },
  Bangla: {
    chapters: ['গদ্য', 'পদ্য', 'উপন্যাস', 'নাটক', 'ব্যাকরণ'],
    topics: {
      ব্যাকরণ: ['সমাস', 'কারক', 'সন্ধি', 'বানান শুদ্ধি'],
      গদ্য: ['অপরিচিতা', 'বিলাসী', 'আমার পথ'],
    },
  },
  English: {
    chapters: ['Grammar', 'Literature', 'Reading Comprehension'],
    topics: {
      Grammar: [
        'Right form of verbs',
        'Preposition',
        'Voice Change',
        'Narration',
        'Transformation',
      ],
      Literature: ['William Shakespeare', 'Modern Poets', 'Romantic Period'],
    },
  },
  GK: {
    chapters: ['বাংলাদেশ বিষয়াবলি', 'আন্তর্জাতিক বিষয়াবলি', 'সাম্প্রতিক'],
    topics: {
      'বাংলাদেশ বিষয়াবলি': ['মুক্তিযুদ্ধ', 'সংবিধান', 'নদী ও জনপদ'],
      'আন্তর্জাতিক বিষয়াবলি': [
        'সংস্থা ও সংগঠন',
        'বিশ্বযুদ্ধ',
        'প্রণালী ও সীমারেখা',
      ],
    },
  },
};

export const MOCK_QUESTIONS_DB: Record<string, Question[]> = {
  bangla: [
    {
      id: '1',
      question: 'রবীন্দ্রনাথ ঠাকুর কত সালে নোবেল পুরস্কার পান?',
      options: ['১৯১১', '১৯১৩', '১৯২১', '১৯৩০'],
      correctAnswerIndex: 1,
      correctAnswerIndices: [1],
      correctAnswer: '১৯১৩',
      points: 1,
      explanation:
        "রবীন্দ্রনাথ ঠাকুর ১৯১৩ সালে 'গীতাঞ্জলি' কাব্যের জন্য সাহিত্যে নোবেল পুরস্কার পান।",
      difficulty: 'Medium',
      subject: 'Bangla',
      chapter: 'পদ্য',
      topic: 'আধুনিক বাংলা সাহিত্য',
      type: 'MCQ',
      status: 'Approved',
      author: 'System',
      version: 1,
      tags: ['literature', 'nobel'],
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      question: 'বাংলাদেশের জাতীয় কবি কে?',
      options: [
        'কাজী নজরুল ইসলাম',
        'রবীন্দ্রনাথ ঠাকুর',
        'জসীম উদ্দীন',
        'শামসুর রাহমান',
      ],
      correctAnswerIndex: 0,
      correctAnswerIndices: [0],
      correctAnswer: 'কাজী নজরুল ইসলাম',
      points: 1,
      explanation: 'বাংলাদেশের জাতীয় কবি কাজী নজরুল ইসলাম।',
      difficulty: 'Easy',
      subject: 'Bangla',
      chapter: 'পদ্য',
      topic: 'জাতীয় কবি',
      type: 'MCQ',
      status: 'Approved',
      author: 'System',
      version: 1,
      tags: ['general knowledge'],
      createdAt: new Date().toISOString(),
    },
  ],
  english: [
    {
      id: '1',
      question: 'Which one is a Noun?',
      options: ['Run', 'Beauty', 'Beautiful', 'Quickly'],
      correctAnswerIndex: 1,
      correctAnswerIndices: [1],
      correctAnswer: 'Beauty',
      points: 1,
      explanation: "'Beauty' is an abstract noun.",
      difficulty: 'Easy',
      subject: 'English',
      chapter: 'Grammar',
      topic: 'Parts of Speech',
      type: 'MCQ',
      status: 'Approved',
      author: 'System',
      version: 1,
      tags: ['grammar', 'noun'],
      createdAt: new Date().toISOString(),
    },
  ],
  math: [
    {
      id: '1',
      question: 'What is the value of $\\pi$ (approx)?',
      options: ['3.1416', '3.1415', '3.1216', '3.4116'],
      correctAnswerIndex: 0,
      correctAnswerIndices: [0],
      correctAnswer: '3.1416',
      points: 1,
      explanation: 'The value of Pi is approximately 3.14159...',
      difficulty: 'Easy',
      subject: 'Math',
      chapter: 'ত্রিকোণমিতি',
      topic: 'ধ্রুবক',
      type: 'MCQ',
      status: 'Approved',
      author: 'System',
      version: 1,
      tags: ['math', 'constants'],
      createdAt: new Date().toISOString(),
    },
  ],
};

export const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'ফ্রি (Free)',
    price: 0,
    billingCycle: 'Lifetime',
    duration_days: 36500,
    currency: '৳',
    features: [
      'প্রতিদিন ২টি ফ্রি এক্সাম',
      'সর্বোচ্চ ৫০টি প্রশ্নের এক্সাম সেটআপ',
      'সর্বোচ্চ ২৫টি বুকমার্ক সংরক্ষণ',
      'লাইভ এক্সামে পূর্ণ এক্সেস',
      'স্ট্রিক ও বেসিক লিডারবোর্ড',
    ],
    colorTheme: 'slate',
  },
  {
    id: 'exam_ready',
    name: 'মাসিক প্ল্যান (১ মাস)',
    price: 149,
    billingCycle: 'Monthly',
    duration_days: 30,
    currency: '৳',
    features: [
      'আনলিমিটেড মক টেস্ট ও প্র্যাকটিস',
      'প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা ও সমাধান',
      '৫০+ ও ১০০ প্রশ্নের ফুল মডেল টেস্ট',
      'আনলিমিটেড বুকমার্ক ও রিভিশন লিস্ট',
      'বিষয়ভিত্তিক দুর্বলতা ট্র্যাকার ও গ্রাফ',
      'সম্পূর্ণ বিজ্ঞাপনমুক্ত প্রিমিয়াম অভিজ্ঞতা',
    ],
    colorTheme: 'indigo',
  },
  {
    id: 'pro',
    name: 'এডমিশন প্যাক (৩ মাস)',
    price: 349,
    billingCycle: 'Quarterly',
    duration_days: 90,
    currency: '৳',
    features: [
      'আনলিমিটেড মক টেস্ট ও প্র্যাকটিস',
      'প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা ও সমাধান',
      '৫০+ ও ১০০ প্রশ্নের ফুল মডেল টেস্ট',
      'আনলিমিটেড বুকমার্ক ও রিভিশন লিস্ট',
      'বিষয়ভিত্তিক দুর্বলতা ট্র্যাকার ও গ্রাফ',
      'সম্পূর্ণ বিজ্ঞাপনমুক্ত প্রিমিয়াম অভিজ্ঞতা',
    ],
    isPopular: true,
    colorTheme: 'emerald',
  },
  {
    id: 'master_pro',
    name: 'ফুল সেশন প্যাক (৬ মাস)',
    price: 599,
    billingCycle: 'Half-Yearly',
    duration_days: 180,
    currency: '৳',
    features: [
      'আনলিমিটেড মক টেস্ট ও প্র্যাকটিস',
      'প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা ও সমাধান',
      '৫০+ ও ১০০ প্রশ্নের ফুল মডেল টেস্ট',
      'আনলিমিটেড বুকমার্ক ও রিভিশন লিস্ট',
      'বিষয়ভিত্তিক দুর্বলতা ট্র্যাকার ও গ্রাফ',
      'সম্পূর্ণ বিজ্ঞাপনমুক্ত প্রিমিয়াম অভিজ্ঞতা',
    ],
    isPopular: false,
    colorTheme: 'amber',
  },
];

export const MOCK_PAYMENTS: PaymentSubmission[] = [];
