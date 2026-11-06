import type { Question } from '../types';
import publicMockQuestions from './public-mock-questions.json';
import { HSC_SUBJECTS } from './hsc-question-bank-data';
import { SSC_SUBJECTS } from './ssc-question-bank-data';
import generatedHscQuestions from './hsc-generated-questions.json';
import generatedSscQuestions from './ssc-generated-questions.json';

export type LevelId = 'HSC' | 'SSC' | 'CLASS_8';

export interface PublicLevel {
  id: LevelId;
  name: string;
}

export type StreamId = 'all' | 'science' | 'commerce' | 'humanities';

export interface PublicStream {
  id: StreamId;
  name: string;
}

export interface PublicSubject {
  id: string;
  level: LevelId;
  stream: 'science' | 'commerce' | 'humanities' | 'general';
  streamName: string;
  name: string;
  label: string;
  iconName?: string;
}

export interface PublicChapter {
  id: string;
  subjectId: string;
  name: string;
}

export interface PublicTopic {
  id: string;
  chapterId: string;
  name: string;
}

export const PUBLIC_LEVELS: PublicLevel[] = [
  { id: 'HSC', name: 'এইচএসসি (HSC) — একাদশ ও দ্বাদশ শ্রেণি' },
  { id: 'SSC', name: 'এসএসসি (SSC) — নবম ও দশম শ্রেণি' },
  { id: 'CLASS_8', name: 'অষ্টম শ্রেণি (Class 8)' },
];

export const PUBLIC_STREAMS: PublicStream[] = [
  { id: 'all', name: 'সকল বিভাগ / সাধারণ' },
  { id: 'science', name: 'বিজ্ঞান বিভাগ (Science)' },
  { id: 'commerce', name: 'ব্যবসায় শিক্ষা (Commerce)' },
  { id: 'humanities', name: 'মানবিক বিভাগ (Arts)' },
];

// ─── Class 8 Official NCTB Curriculum Subjects & Chapters ─────────
export const CLASS_8_SUBJECTS = [
  {
    id: 'class8_math',
    name: 'general_math',
    label: 'গণিত (Mathematics)',
    iconName: 'Calculator',
    chapters: [
      { id: 'c8_math_ch01', name: 'অধ্যায় ০১: প্যাটার্ন' },
      { id: 'c8_math_ch02', name: 'অধ্যায় ০২: মুনাফা' },
      { id: 'c8_math_ch03', name: 'অধ্যায় ০৩: পরিমাপ' },
      { id: 'c8_math_ch04', name: 'অধ্যায় ০৪: বীজগণিতীয় সূত্রাবলী ও প্রয়োগ' },
      { id: 'c8_math_ch05', name: 'অধ্যায় ০৫: বীজগণিতীয় ভগ্নাংশ' },
      { id: 'c8_math_ch06', name: 'অধ্যায় ০৬: সরল সহসমীকরণ' },
      { id: 'c8_math_ch07', name: 'অধ্যায় ০৭: সেট' },
      { id: 'c8_math_ch08', name: 'অধ্যায় ০৮: চতুর্ভুজ' },
      { id: 'c8_math_ch09', name: 'অধ্যায় ০৯: পিথাগোরাসের উপপাদ্য' },
      { id: 'c8_math_ch10', name: 'অধ্যায় ১০: বৃত্ত' },
      { id: 'c8_math_ch11', name: 'অধ্যায় ১১: তথ্য ও উপাত্ত' },
    ],
  },
  {
    id: 'class8_science',
    name: 'science',
    label: 'বিজ্ঞান (General Science)',
    iconName: 'FlaskConical',
    chapters: [
      { id: 'c8_sci_ch01', name: 'অধ্যায় ০১: প্রাণীজগতের শ্রেণিবিন্যাস' },
      { id: 'c8_sci_ch02', name: 'অধ্যায় ০২: জীবের বৃদ্ধি ও বংশগতি' },
      { id: 'c8_sci_ch03', name: 'অধ্যায় ০৩: ব্যাপন, অভিস্রবণ ও প্রস্বেদন' },
      { id: 'c8_sci_ch04', name: 'অধ্যায় ০৪: উদ্ভিদে বংশবৃদ্ধি' },
      { id: 'c8_sci_ch05', name: 'অধ্যায় ০৫: সমন্বয় ও নিঃসরণ' },
      { id: 'c8_sci_ch06', name: 'অধ্যায় ০৬: পরমাণুর গঠন' },
      { id: 'c8_sci_ch07', name: 'অধ্যায় ০৭: পৃথিবী ও মহাকর্ষ' },
      { id: 'c8_sci_ch08', name: 'অধ্যায় ০৮: রাসায়নিক বিক্রিয়া' },
      { id: 'c8_sci_ch09', name: 'অধ্যায় ০৯: বর্তনী ও চলবিদ্যুৎ' },
      { id: 'c8_sci_ch10', name: 'অধ্যায় ১০: অম্ল, ক্ষারক ও লবণ' },
      { id: 'c8_sci_ch11', name: 'অধ্যায় ১১: আলো' },
      { id: 'c8_sci_ch12', name: 'অধ্যায় ১২: মহাকাশ ও উপগ্রহ' },
      { id: 'c8_sci_ch13', name: 'অধ্যায় ১৩: খাদ্য ও পুষ্টি' },
      { id: 'c8_sci_ch14', name: 'অধ্যায় ১৪: পরিবেশ এবং বাস্তুতন্ত্র' },
    ],
  },
  {
    id: 'class8_bangla',
    name: 'bangla',
    label: 'বাংলা (Bangla)',
    iconName: 'BookOpen',
    chapters: [
      { id: 'c8_bn_ch01', name: 'গদ্যাংশ: অতিথির স্মৃতি' },
      { id: 'c8_bn_ch02', name: 'গদ্যাংশ: ভাব ও কাজ' },
      { id: 'c8_bn_ch03', name: 'গদ্যাংশ: পড়ে পাওয়া' },
      { id: 'c8_bn_ch04', name: 'গদ্যাংশ: আমাদের লোকশিল্প' },
      { id: 'c8_bn_ch05', name: 'কবিতা: মানবধর্ম' },
      { id: 'c8_bn_ch06', name: 'কবিতা: বঙ্গভূমির প্রতি' },
      { id: 'c8_bn_ch07', name: 'কবিতা: দুই বিঘা জমি' },
      { id: 'c8_bn_ch08', name: 'কবিতা: নারী' },
      { id: 'c8_bn_ch09', name: 'ব্যাকরণ: ধ্বনি ও বর্ণ' },
      { id: 'c8_bn_ch10', name: 'ব্যাকরণ: সন্ধি ও কারক' },
    ],
  },
  {
    id: 'class8_english',
    name: 'english',
    label: 'ইংরেজি (English)',
    iconName: 'Globe',
    chapters: [
      { id: 'c8_en_ch01', name: 'Unit 1: A Glimpse of Our Culture' },
      { id: 'c8_en_ch02', name: 'Unit 2: Food and Nutrition' },
      { id: 'c8_en_ch03', name: 'Unit 3: Health and Hygiene' },
      { id: 'c8_en_ch04', name: 'Unit 5: Making a Difference' },
      { id: 'c8_en_ch05', name: 'Unit 6: Going on a Tour' },
      { id: 'c8_en_ch06', name: 'Grammar: Right Form of Verbs' },
      { id: 'c8_en_ch07', name: 'Grammar: Narration & Voice Change' },
    ],
  },
  {
    id: 'class8_bgs',
    name: 'bgs',
    label: 'বাংলাদেশ ও বিশ্বপরিচয় (BGS)',
    iconName: 'Landmark',
    chapters: [
      { id: 'c8_bgs_ch01', name: 'অধ্যায় ০১: ঔপনিবেশিক যুগ ও স্বাধীনতা সংগ্রাম' },
      { id: 'c8_bgs_ch02', name: 'অধ্যায় ০২: বাংলাদেশের মুক্তিযুদ্ধ' },
      { id: 'c8_bgs_ch03', name: 'অধ্যায় ০৩: সাংস্কৃতিক পরিবর্তন ও উন্নয়ন' },
      { id: 'c8_bgs_ch04', name: 'অধ্যায় ০৪: প্রত্নতাত্ত্বিক ঐতিহ্য' },
      { id: 'c8_bgs_ch05', name: 'অধ্যায় ০৫: সামাজিকীকরণ ও উন্নয়ন' },
      { id: 'c8_bgs_ch06', name: 'অধ্যায় ০৬: বাংলাদেশের অর্থনীতি' },
      { id: 'c8_bgs_ch07', name: 'অধ্যায় ০৭: রাষ্ট্র ও সরকার ব্যবস্থা' },
      { id: 'c8_bgs_ch08', name: 'অধ্যায় ০৮: দুর্যোগ ব্যবস্থাপনা' },
    ],
  },
  {
    id: 'class8_ict',
    name: 'ict',
    label: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
    iconName: 'Cpu',
    chapters: [
      { id: 'c8_ict_ch01', name: 'অধ্যায় ০১: তথ্য ও যোগাযোগ প্রযুক্তির গুরুত্ব' },
      { id: 'c8_ict_ch02', name: 'অধ্যায় ০২: কম্পিউটার নেটওয়ার্ক' },
      { id: 'c8_ict_ch03', name: 'অধ্যায় ০৩: নিরাপদ ও নৈতিক ব্যবহার' },
      { id: 'c8_ict_ch04', name: 'অধ্যায় ০৪: স্প্রেডশিটের ব্যবহার' },
      { id: 'c8_ict_ch05', name: 'অধ্যায় ০৫: শিক্ষায় ইন্টারনেট' },
    ],
  },
  {
    id: 'class8_islam',
    name: 'islam',
    label: 'ইসলাম ও নৈতিক শিক্ষা',
    iconName: 'BookOpen',
    chapters: [
      { id: 'c8_is_ch01', name: 'অধ্যায় ০১: আকাইদ' },
      { id: 'c8_is_ch02', name: 'অধ্যায় ০২: ইবাদত' },
      { id: 'c8_is_ch03', name: 'অধ্যায় ০৩: কুরআন ও হাদিস শিক্ষা' },
      { id: 'c8_is_ch04', name: 'অধ্যায় ০৪: আখলাক' },
      { id: 'c8_is_ch05', name: 'অধ্যায় ০৫: আদর্শ জীবনচরিত' },
    ],
  },
];

// Helper to normalize streams
function normalizeStream(stream: string): 'science' | 'commerce' | 'humanities' | 'general' {
  if (stream === 'science') return 'science';
  if (stream === 'business' || stream === 'commerce') return 'commerce';
  if (stream === 'humanities') return 'humanities';
  return 'general';
}

// ─── Comprehensive Complete Public Subjects Catalog ───────────────
export const PUBLIC_SUBJECTS: PublicSubject[] = [
  // 1. All HSC Subjects (Science, Commerce, Humanities, Compulsory)
  ...HSC_SUBJECTS.map((s) => ({
    id: s.id,
    level: 'HSC' as LevelId,
    stream: normalizeStream(s.stream),
    streamName: s.streamName,
    name: s.slug,
    label: s.name,
    iconName: s.iconName,
  })),

  // 2. All SSC Subjects (Science, Commerce, Humanities, Compulsory)
  ...SSC_SUBJECTS.map((s) => ({
    id: s.id,
    level: 'SSC' as LevelId,
    stream: normalizeStream(s.stream),
    streamName: s.streamName,
    name: s.slug,
    label: s.name,
    iconName: s.iconName,
  })),

  // 3. All Class 8 Subjects
  ...CLASS_8_SUBJECTS.map((s) => ({
    id: s.id,
    level: 'CLASS_8' as LevelId,
    stream: 'general' as const,
    streamName: 'সাধারণ বিষয়',
    name: s.name,
    label: s.label,
    iconName: s.iconName,
  })),
];

// ─── Complete Public Chapters Catalog ──────────────────────────────
export const PUBLIC_CHAPTERS: PublicChapter[] = [
  // HSC Chapters
  ...HSC_SUBJECTS.flatMap((s) =>
    s.chapters.map((c) => ({
      id: `${s.id}_${c.id}`,
      subjectId: s.id,
      name: c.name,
    }))
  ),

  // SSC Chapters
  ...SSC_SUBJECTS.flatMap((s) =>
    s.chapters.map((c) => ({
      id: `${s.id}_${c.id}`,
      subjectId: s.id,
      name: c.name,
    }))
  ),

  // Class 8 Chapters
  ...CLASS_8_SUBJECTS.flatMap((s) =>
    s.chapters.map((c) => ({
      id: c.id,
      subjectId: s.id,
      name: c.name,
    }))
  ),
];

// ─── Unified Questions Pool for All Subjects & Chapters ───────────
const allGeneratedQuestions: Question[] = [
  ...Object.values(generatedHscQuestions as Record<string, any>).flatMap((c: any) =>
    c.questions.map((q: any) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.options[q.correctIndex],
      correctAnswerIndex: q.correctIndex,
      correctAnswerIndices: [q.correctIndex],
      explanation: q.explanation,
      type: 'MCQ' as const,
      difficulty: 'Medium' as const,
      subject: c.subjectSlug,
      subjectId: c.subjectSlug,
      subjectLabel: c.subjectName,
      chapter: c.chapterNameBangla,
      status: 'Approved' as const,
      author: 'Obhyash Academic Wing',
      createdAt: '2026-01-01T00:00:00.000Z',
      version: 1,
      tags: ['Board Question', q.boardTag || 'বোর্ড প্রশ্ন'],
      stream: 'HSC',
    }))
  ),
  ...Object.values(generatedSscQuestions as Record<string, any>).flatMap((c: any) =>
    c.questions.map((q: any) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.options[q.correctIndex],
      correctAnswerIndex: q.correctIndex,
      correctAnswerIndices: [q.correctIndex],
      explanation: q.explanation,
      type: 'MCQ' as const,
      difficulty: 'Medium' as const,
      subject: c.subjectSlug,
      subjectId: c.subjectSlug,
      subjectLabel: c.subjectName,
      chapter: c.chapterNameBangla,
      status: 'Approved' as const,
      author: 'Obhyash Academic Wing',
      createdAt: '2026-01-01T00:00:00.000Z',
      version: 1,
      tags: ['Board Question', q.boardTag || 'বোর্ড প্রশ্ন'],
      stream: 'SSC',
    }))
  ),
];

// Export authentic mock questions with automatic shuffle fallback
export const PUBLIC_QUESTIONS: Question[] = [
  ...(publicMockQuestions as unknown as Question[]),
  ...allGeneratedQuestions,
];
