export interface Topic {
  id: string;
  name: string;
  serial: number | string;
}

export interface Chapter {
  id: string;
  name: string;
  topics: Topic[];
}

export interface Subject {
  id: string;
  name: string;
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
}