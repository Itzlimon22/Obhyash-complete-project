import { LucideIcon } from 'lucide-react';

// ==========================================
// 1. STATIC CONTENT TYPES (Curriculum)
// ==========================================
export type GroupType =
  | 'General'
  | 'Science'
  | 'Humanities'
  | 'Business Studies';

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
  stream?: string; // e.g., 'HSC'
  division?: string; // e.g., 'Science'
  chapters: Chapter[];
}

// ==========================================
// 2. QUESTION & EXAM CORE TYPES
// ==========================================

export type QuestionType = 'MCQ' | 'TrueFalse' | 'ShortAnswer';
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Mixed';
export type QuestionStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';

export interface QuestionOption {
  id: string; // "a", "b" or "0", "1"
  text: string;
  image_url?: string;
  isCorrect: boolean;
}

/**
 * The Unified Question Interface
 * Handles both Database (Admin) and Exam Engine (Student) needs.
 * Enhanced with multi-select answers, division, institutes, years, and option images.
 */
export interface Question {
  id: string; // Unified to string (UUID for DB, stringified number for Engine)

  // Core Content
  question: string; // The question text (supports LaTeX + Bangla + formatted content)
  options: string[]; // Variable length array (min 2) - supports LaTeX + Bangla

  // Correct Answers (Multi-select support)
  correctAnswer: string; // The text of the first correct answer (for backward compatibility)
  correctAnswerIndex: number; // Index of first correct answer (for backward compatibility)
  correctAnswerIndices: number[]; // Array of all correct answer indices (NEW - supports multi-select)

  explanation?: string; // OPTIONAL - supports LaTeX + Bangla + formatted content

  // Metadata
  type: QuestionType;
  difficulty: QuestionDifficulty;
  subject: string;
  subjectId?: string; // Reference to subjects(id)
  subjectLabel?: string; // Human-readable display name (e.g. "পদার্থবিজ্ঞান (Physics)")
  chapter: string;
  chapterId?: string; // Reference to chapters(id)
  topic?: string;
  topicId?: string; // Reference to topics(id)

  // Media (All optional)
  imageUrl?: string; // Question image
  optionImages?: string[]; // Array of images for each option (aligned with options array)
  explanationImageUrl?: string; // Explanation image

  // Exam Engine Specifics
  points?: number; // Optional, usually 1

  // System Metadata
  status: QuestionStatus;
  author: string;
  author_name?: string;
  createdAt: string;
  version: number;
  tags: string[];

  // Academic Info
  stream?: string; // HSC, SSC, Admission
  division?: string; // Science, Arts, Commerce (NEW)
  section?: string; // Optional subdivision
  examType?: string; // Medical, Engineering, Academic (defaults to 'Academic')
  institutes?: string[]; // Array of institute names (NEW)
  years?: number[]; // Array of years [2023, 2024] (NEW)

  // Legacy fields (for backward compatibility)
  institute?: string; // Deprecated - use institutes[] instead
  year?: string; // Deprecated - use years[] instead
}

// Map of Question ID -> Selected Option Index
// Using string key to support UUIDs, but can handle "1", "2" etc.
export type UserAnswers = Record<string | number, number>;

// ==========================================
// 3. EXAM CONFIGURATION & RESULTS
// ==========================================

export interface ExamConfig {
  subject: string; // The ID/English name for DB filtering
  subjectLabel: string; // The display name for UI
  examType: string; // Daily, Weekly, Model Test
  chapters: string; // Comma separated IDs or names
  topics: string;
  difficulty: QuestionDifficulty | string;
  questionCount: number;
  durationMinutes: number;
  negativeMarking: number;
}

export interface ExamDetails {
  subject: string; // The ID
  subjectLabel: string; // The display name
  examType: string;
  chapters: string;
  topics: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: number;
}

export interface ExamHistory {
  id: string;
  name: string;
  date: string;
  score: number;
  total: number;
  status: 'Passed' | 'Failed';
}

export interface ExamResult {
  id: string;
  user_id?: string; // Optional user association

  // Exam Info
  subject: string;
  subjectLabel?: string;
  examType?: string;
  chapters?: string; // Comma separated list of chapters
  date: string;

  // Stats
  score: number;
  totalMarks: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  timeTaken: number;
  negativeMarking: number;

  // Detailed Data
  questions?: Question[];
  userAnswers?: UserAnswers;
  flaggedQuestions?: (number | string)[]; // IDs of flagged questions

  // Submission Metadata
  submissionType: 'digital' | 'script';
  status?: 'pending' | 'evaluated' | 'rejected';
  rejectionReason?: string;

  // OMR / Script Specifics
  scriptFile?: string;
  scriptImageData?: string;
}

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
  Mixed = 'Mixed',
}

// ==========================================
// 4. USER & PROFILE TYPES
// ==========================================

export type UserRole = 'Admin' | 'Teacher' | 'Student';
export type UserStatus = 'Active' | 'Inactive' | 'Suspended';

export interface User {
  id: string;

  // Identity
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;

  // Personal Info
  dob?: string;
  gender?: string;
  address?: string;
  bio?: string;
  // Academic Info
  institute?: string;
  goal?: string; // HSC, Admission
  division?: string; // Science, Arts
  batch?: string; // HSC 2025
  ssc_roll?: string;
  ssc_reg?: string;
  ssc_board?: string;
  ssc_passing_year?: string;
  optional_subject?: string;
  target?: string; // Medical, Engineering, etc.
  stream?: string; // HSC, Admission

  // Gamification & Stats
  xp?: number;
  level?: string;
  avatarColor?: string; // Tailwind color class

  // Subscription System
  subscription: {
    plan: 'Free' | 'Pro' | 'Enterprise';
    expiry: string;
    status: 'Active' | 'Past Due' | 'Canceled';
  };

  // Usage Stats
  enrolledExams: number;
  lastActive: string;
  recentExams: ExamHistory[];
  streakCount?: number;
  lastStreakDate?: string;
}

export interface UserProfile extends Partial<User> {
  // A simplified view for Leaderboards/Public profiles
  id: string;
  name: string;
  institute: string;
  xp: number;
  level: string;
  examsTaken: number;
  avatarColor: string;
  avatarUrl?: string;
  isCurrentUser?: boolean;
  target?: string;
  stream?: string;
  group?: string; // Legacy alias for division
  createdAt?: string; // Mapped from DB created_at
  bio?: string;
  streakCount?: number;
  lastStreakDate?: string;
}

// ==========================================
// 5. FINANCE & SUBSCRIPTION TYPES
// ==========================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  currency: string;
  features: string[];
  isPopular?: boolean;
  isRecommended?: boolean;
  colorTheme?: string; // Tailwind class
  expiresAt?: string;
}

export interface Transaction {
  id: string;
  user: {
    name: string;
    email: string;
    initial: string;
    color: string;
  };
  plan: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  date: string;
  invoiceId: string;
  method: string;
}

export interface PaymentSubmission {
  id: string;
  userId: string;
  userName: string;
  planId: string;
  planName: string;
  amount: number;
  paymentMethod: string; // bKash, Nagad
  senderNumber: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'checking' | 'valid' | 'rejected';
  planName: string;
  downloadUrl?: string;
  // New fields for detailed payment slip
  transactionId?: string;
  paymentMethod?: string;
  senderNumber?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bkash' | 'nagad';
  last4?: string;
  number?: string;
  expiry?: string;
  isDefault: boolean;
}

export interface PlanStat {
  id: string;
  label: string; // e.g., "Free Plan", "Pro Plan"
  value: number; // e.g., 1050 users
  percentage: number; // e.g., 45% of total users      // e.g., "bg-emerald-500" for the progress bar
  name: string; // Matches "Free Tier", "Pro Plan"
  count: number; // Matches 854, 320
  total: number; // Used for calculating the progress bar width
  price: number; // Matches 0, 29, 499
  color: string; // Matches 'bg-gray-500', etc.
}
// ==========================================
// 6. DASHBOARD & UI UTILITIES
// ==========================================

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  hasSubmenu?: boolean;
  count?: number;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export interface StatData {
  id: string;
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass: string;
  bgClass: string;
}

export interface DatabaseTool {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  action: () => void;
}

// ==========================================
// 7. REPORTS & DATASETS
// ==========================================

export type ReportStatus = 'Pending' | 'Resolved' | 'Ignored';
export type ReportReason =
  | 'Wrong Answer'
  | 'Typo/Grammar'
  | 'Inappropriate Content'
  | 'Duplicate'
  | 'অসম্পূর্ণ প্রশ্ন'
  | 'ভুল উত্তর'
  | 'প্রশ্নে ডাউট'
  | 'ভুল ক্যাটাগরি'
  | 'অসম্পূর্ণ সলিউশন'
  | 'Other';

export interface Report {
  id: string;
  question_id: string | number;
  reporter_id: string | null;
  reporter_name: string;
  reason: string; // ReportReason (kept as string for DB flexibility)
  description?: string;
  image_url?: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_at?: string | null;
  admin_comment?: string | null;
  // Joined from questions table
  question?: {
    id: string;
    question: string;
    options?: string[];
    correct_answer?: string;
    explanation?: string;
    subject?: string;
  } | null;
}

export interface Dataset {
  id: string;
  name: string;
  type: 'CSV' | 'JSON' | 'SQL' | 'LOG' | 'PARQUET';
  size: string;
  rows: string;
  description: string;
  category: 'ML Training' | 'Business Intelligence' | 'System Logs';
  lastUpdated: string;
}

// ==========================================
// 8. APP STATE (Frontend)
// ==========================================

export enum AppState {
  IDLE = 'IDLE', // Initial Landing Page
  DASHBOARD = 'DASHBOARD',
  SETUP = 'SETUP', // Exam Configuration Form
  LOADING = 'LOADING',
  INSTRUCTIONS = 'INSTRUCTIONS',
  ACTIVE = 'ACTIVE', // Exam in progress
  GRACE_PERIOD = 'GRACE_PERIOD',
  COMPLETED = 'COMPLETED',
  HISTORY = 'HISTORY',
  ADMIN = 'ADMIN',
  ERROR = 'ERROR',
  RUNNING = 'RUNNING',
  TIMEOUT = 'TIMEOUT',
  SUBMITTED = 'SUBMITTED',
}

// ==========================================
// 9. BULK UPLOAD FORMS
// ==========================================

export interface QuestionFormData {
  id?: string;
  status?: QuestionStatus;

  // Hierarchy
  subject_id?: string | null;
  chapter_id?: string | null;
  topic_id?: string | null;
  subject: string;
  chapter: string;
  topic: string;

  // Content
  question: string;
  image_url?: string;
  options: QuestionOption[];
  explanation: string;
  explanation_image_url?: string;

  // Metadata
  stream: string;
  section: string;
  difficulty: string;
  examType: string;
  institute: string;
  institutes?: string[];
  year: string;
  years?: number[];

  created_at?: string;
  created_by?: string;
}

// --- ANALYTICS TYPES ---

export interface SubjectAnalysis {
  totalQuestions: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  averageTime: number;
  chapterPerformance: {
    name: string;
    total: number;
    correct: number;
    accuracy: number;
  }[];
  mistakes: {
    question: Question;
    examDate: string;
    examName: string;
    userAns: number;
    correctAns: number;
  }[];
}

export interface OverallAnalytics {
  totalExams: number;
  avgScore: number;
  avgAccuracy: number;
  totalTime: number;
  timelineData: { name: string; score: number; fullDate: string }[];
  subjectData: {
    name: string;
    correct: number;
    wrong: number;
    skipped: number;
    total: number;
  }[];
}

// ==========================================
// 10. NOTIFICATION SYSTEM
// ==========================================

export type NotificationType =
  | 'exam_result'
  | 'achievement'
  | 'level_up'
  | 'announcement'
  | 'system'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  action_url?: string;
  icon?: string;
  priority: NotificationPriority;
  metadata?: Record<string, unknown>;
  created_at: string;
  read_at?: string;
  expires_at?: string;
}
// ==========================================
// 11. APP COMPLAINTS (Technical/UX)
// ==========================================

export type ComplaintType =
  | 'Technical'
  | 'UX'
  | 'Bug'
  | 'Feature Request'
  | 'Other';

export type ComplaintStatus =
  | 'Pending'
  | 'In Progress'
  | 'Resolved'
  | 'Dismissed';

export interface AppComplaint {
  id: string;
  user_id: string;
  user?: {
    name: string;
    email: string;
  };
  type: ComplaintType;
  description: string;
  status: ComplaintStatus;
  admin_feedback?: string;
  created_at: string;
  updated_at: string;
}
