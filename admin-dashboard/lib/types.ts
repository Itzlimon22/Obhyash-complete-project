import { LucideIcon } from 'lucide-react';

export type GroupType = 'General' | 'Science' | 'Arts' | 'Commerce';

export interface Topic {
  id: string;
  name: string;
  serial: number;
}

export interface Chapter {
  id: string;
  name: string;
  topics: Topic[];
}

export interface Subject {
  id: string;
  name: string;
  icon: LucideIcon;
  group: GroupType;
  chapters: Chapter[];
}
export interface QuestionFormData {
  stream: string;
  section: string;
  subject: string;
  chapter: string;
  topic: string;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  examType: string[];
  institute?: string[];
  year?: number[];
  subject_id?: string | null;  // 👈 Add this
  chapter_id?: string | null;  // 👈 Add this
  topic_id?: string | null;
}