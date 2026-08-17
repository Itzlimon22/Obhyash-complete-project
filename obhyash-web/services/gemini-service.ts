import { Question, UserAnswers } from '../lib/types';

// --- Constants ---

// --- Helper Functions ---

/**
 * Cleans the AI response text by removing Markdown code blocks.
 */
const cleanJSON = (text: string): string => {
  return text.replace(/```json\s*|\s*```/g, '').trim();
};

// --- Main Functions ---

// --- Main Functions ---

/**
 * DEPRECATED: AI Question Generation is disabled.
 * Returns an empty array or throws to prevent API calls.
 */
export const generateExamQuestions = async (
  topic: string,
  count: number,
): Promise<Question[]> => {
  console.warn('AI Question Generation is currently disabled.');
  throw new Error('AI Question Generation is no longer supported.');
};
