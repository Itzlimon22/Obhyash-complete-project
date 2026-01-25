import { LucideIcon } from 'lucide-react';

// --- 1. Static Content Types ---
export type GroupType = 'General' | 'Science' | 'Arts' | 'Commerce';

export interface Topic {
  id: string;
  name: string;
  serial: number;
}

export interface Chapter {
  id: string;
  subject_id?: string;
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

// --- 2. NEW Question Types (The Fix) ---

// ✅ Export this so other files can find it
export interface QuestionOption {
  id: string;        // "A", "B", "C", "D"
  text: string;      // "Newton"
  isCorrect: boolean; // true/false
}

export interface QuestionFormData {
  // IDs
  subject_id?: string | null;
  chapter_id?: string | null;
  topic_id?: string | null;

  // Metadata
  stream: string;
  section: string;
  subject: string;
  chapter: string;
  topic: string;

  question: string;
  
  // ✅ New Structure
  options: QuestionOption[]; 
  
  // ❌ 'answer' is REMOVED from here because it's now inside 'options'
  
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  examType: string[];
  institute: string[];
  year: number[];
}