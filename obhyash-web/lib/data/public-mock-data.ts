import { Question } from '@/lib/types';
import publicMockMeta from '@/lib/data/public-mock-meta.json';
import publicMockQuestions from '@/lib/data/public-mock-questions.json';

export interface PublicLevel {
  id: 'HSC' | 'SSC';
  name: string;
}

export interface PublicSubject {
  id: string;
  level: 'HSC' | 'SSC';
  name: string;
  label: string;
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
  { id: 'HSC', name: 'HSC' },
  { id: 'SSC', name: 'SSC' },
];

// Helper to determine subject code name
function getSubjectNormalizedCode(subId: string): string {
  if (subId.includes('physics')) return 'physics';
  if (subId.includes('chemistry')) return 'chemistry';
  if (subId.includes('biology')) return 'biology';
  if (subId.includes('higher_math') || subId.includes('math_1') || subId.includes('math_2')) return 'higher_math';
  if (subId.includes('math')) return 'general_math';
  if (subId.includes('ict')) return 'ict';
  return 'general';
}

// Map from meta.subjects to PublicSubject[]
export const PUBLIC_SUBJECTS: PublicSubject[] = (publicMockMeta.subjects as Array<{ id: string; name: string; level: 'HSC' | 'SSC' }>).map((s) => ({
  id: s.id,
  level: s.level,
  name: getSubjectNormalizedCode(s.id),
  label: s.name.replace(/^SSC\s+/, ''), // Clean clean display label
}));

// Map from meta.chapters to PublicChapter[]
export const PUBLIC_CHAPTERS: PublicChapter[] = (publicMockMeta.chapters as Array<{ id: string; subjectId: string; name: string }>).map((c) => ({
  id: c.id,
  subjectId: c.subjectId,
  name: c.name,
}));

// Export all 1460+ authentic questions with 20+ questions per chapter
export const PUBLIC_QUESTIONS: Question[] = publicMockQuestions as unknown as Question[];
