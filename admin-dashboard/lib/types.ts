// File: lib/types.ts
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

// --- 2. Question Types (Fixed) ---

// ✅ Export this so other files can find it
export interface QuestionOption {
  id: string;       // "a", "b", "c", "d"
  text: string;     // "Newton"
  image_url?: string; // ✅ NEW: Support images for options (A, B, C, D)
  isCorrect: boolean; // true/false
}

export interface QuestionFormData {
  // IDs (Optional because they might be generated later)
  subject_id?: string | null;
  chapter_id?: string | null;
  topic_id?: string | null;
  id?: string;

  // Metadata
  stream: string;
  section: string;
  subject: string;
  chapter: string;
  topic: string;

  // Content
  question: string;
  image_url?: string; // Main Question Image

  // ✅ New Structure: Array of Option Objects
  options: QuestionOption[]; 
  
  // Explanation & Categorization
  explanation: string;
  explanation_image_url?: string; // ✅ NEW: Support image for explanation
  
  // ⚠️ FIX: Changed these from Arrays to Strings to match the Form Inputs
  difficulty: string; 
  examType: string;   // Was string[], now string (e.g., "HSC, Admission")
  institute: string;  // Was string[], now string (e.g., "BUET")
  year: string;       // Was number[], now string (e.g., "2024")

  // System
  status?: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  created_by?: string;
}

// --- 3. OMR & Exam Result Types (NEW - Added for Admin Dashboard) ---

/**
 * Represents a simplified question structure used specifically for 
 * Exam Results and OMR processing.
 */
export interface Question {
  id: number;
  text: string;
  options: string[]; // Simple string array for OMR display
  correctAnswerIndex: number;
  points: number;
  explanation?: string;
}

export type UserAnswers = Record<number, number>;

/**
 * Represents a single student's exam submission (Digital or OMR).
 */
export interface ExamResult {
  id: string;
  subject: string;
  examType?: string;
  date: string; // ISO String
  score: number;
  totalMarks: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  timeTaken: number; // Seconds
  negativeMarking: number;
  
  // OMR / Status Fields
  status?: 'pending' | 'evaluated' | 'rejected';
  rejectionReason?: string;
  submissionType: 'digital' | 'script';
  scriptImageData?: string; // Base64 string or URL of the uploaded OMR
  
  // Answers Data
  userAnswers?: Record<number, number>; // Map of { questionId: optionIndex }
  questions?: Question[]; // The questions included in this specific exam result
}