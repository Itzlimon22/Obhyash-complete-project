import { Question } from './types';

/**
 * Upload format interface - the format users provide
 * Supports both array format and backward-compatible option1-N format
 */
export interface UploadQuestionFormat {
  // Academic Info
  stream?: string;
  division?: string; // NEW: Science, Arts, Commerce
  section?: string;
  subject: string;
  chapter?: string;
  topic?: string;

  // Question Content - Array Format (Preferred)
  question: string;
  options?: string[]; // NEW: Array of options
  correctAnswers?: number[]; // NEW: Array of correct answer indices (multi-select)

  // Question Content - Backward Compatible Format
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  option5?: string;
  option6?: string;
  answer?: string; // "option1", "option2", etc. OR comma-separated "option1,option3"

  explanation?: string;

  // Metadata
  difficulty?: string;
  examType?: string;
  institutes?: string[]; // NEW: Array of institutes
  years?: number[]; // NEW: Array of years

  // Legacy fields (backward compatibility)
  institute?: string;
  year?: string;

  // Media (All Optional)
  imageUrl?: string; // Question image
  questionImage?: string; // Alternative naming
  optionImages?: string[]; // NEW: Array of images for options
  explanationImageUrl?: string;
  explanationImage?: string; // Alternative naming
}

/**
 * Database format interface - snake_case for Supabase
 */
export interface DatabaseQuestionFormat {
  // Core Content
  question: string;
  options: string[];
  correct_answer_indices: number[]; // NEW: Multi-select support
  explanation?: string;

  // Question Type
  type: string; // 'MCQ'
  difficulty: string;

  // Academic Info
  subject: string;
  chapter?: string;
  topic?: string;
  stream?: string;
  division?: string; // NEW
  section?: string;

  // Exam Context
  exam_type: string; // Defaults to 'Academic'
  institutes: string[]; // NEW
  years: number[]; // NEW

  // Metadata
  status: string; // 'Pending', 'Approved', 'Rejected'
  author: string;
  created_at?: string;
  version: number;
  tags: string[];

  // Media
  image_url?: string;
  option_images?: string[]; // NEW
  explanation_image_url?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Validate upload format question
 */
export function validateUploadQuestion(
  question: UploadQuestionFormat,
  index: number,
): ValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  // Required fields
  if (!question.question || question.question.trim() === '') {
    errors.push({
      field: 'question',
      message: `Row ${index + 1}: Question text is required`,
    });
  }

  if (!question.subject || question.subject.trim() === '') {
    errors.push({
      field: 'subject',
      message: `Row ${index + 1}: Subject is required`,
    });
  }

  // Validate options (support both formats)
  let options: string[] = [];

  if (question.options && Array.isArray(question.options)) {
    // Array format
    options = question.options.filter((opt) => opt && opt.trim() !== '');
  } else {
    // option1-N format
    options = [
      question.option1,
      question.option2,
      question.option3,
      question.option4,
      question.option5,
      question.option6,
    ].filter((opt): opt is string => !!(opt && opt.trim() !== ''));
  }

  if (options.length < 2) {
    errors.push({
      field: 'options',
      message: `Row ${index + 1}: At least 2 options are required`,
    });
  }

  // Validate correct answers
  if (question.correctAnswers && Array.isArray(question.correctAnswers)) {
    // Array format (preferred)
    if (question.correctAnswers.length === 0) {
      errors.push({
        field: 'correctAnswers',
        message: `Row ${index + 1}: At least one correct answer is required`,
      });
    }

    question.correctAnswers.forEach((idx) => {
      if (idx < 0 || idx >= options.length) {
        errors.push({
          field: 'correctAnswers',
          message: `Row ${index + 1}: Correct answer index ${idx} is out of range`,
        });
      }
    });
  } else if (question.answer) {
    // Backward compatible format
    const answers = question.answer.split(',').map((a) => a.trim());

    answers.forEach((answerRef) => {
      const answerMatch = answerRef.match(/option(\d+)/i);
      if (!answerMatch) {
        errors.push({
          field: 'answer',
          message: `Row ${index + 1}: Answer must be in format "option1", "option2", etc.`,
        });
      } else {
        const optionIndex = parseInt(answerMatch[1]) - 1;
        if (optionIndex < 0 || optionIndex >= options.length) {
          errors.push({
            field: 'answer',
            message: `Row ${index + 1}: Answer refers to option${optionIndex + 1} which doesn't exist`,
          });
        }
      }
    });
  } else {
    errors.push({
      field: 'answer',
      message: `Row ${index + 1}: At least one correct answer is required`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Transform upload format to database format
 */
export function transformUploadToDatabase(
  uploadQuestion: UploadQuestionFormat,
): DatabaseQuestionFormat {
  // Build options array
  let options: string[] = [];

  if (uploadQuestion.options && Array.isArray(uploadQuestion.options)) {
    // Array format
    options = uploadQuestion.options.filter((opt): opt is string =>
      Boolean(opt && opt.trim() !== ''),
    );
  } else {
    // option1-N format
    options = [
      uploadQuestion.option1,
      uploadQuestion.option2,
      uploadQuestion.option3,
      uploadQuestion.option4,
      uploadQuestion.option5,
      uploadQuestion.option6,
    ].filter((opt): opt is string => Boolean(opt && opt.trim() !== ''));
  }

  // Parse correct answer indices
  let correctAnswerIndices: number[] = [];

  if (
    uploadQuestion.correctAnswers &&
    Array.isArray(uploadQuestion.correctAnswers)
  ) {
    // Array format (preferred)
    correctAnswerIndices = uploadQuestion.correctAnswers;
  } else if (uploadQuestion.answer) {
    // Backward compatible format - supports comma-separated values
    const answers = uploadQuestion.answer.split(',').map((a) => a.trim());

    answers.forEach((answerRef) => {
      const answerMatch = answerRef.match(/option(\d+)/i);
      if (answerMatch) {
        const optionIndex = parseInt(answerMatch[1]) - 1;
        if (optionIndex >= 0 && optionIndex < options.length) {
          correctAnswerIndices.push(optionIndex);
        }
      }
    });
  }

  // Fallback to first option if no valid answers
  if (correctAnswerIndices.length === 0) {
    correctAnswerIndices = [0];
  }

  // Parse institutes
  let institutes: string[] = [];
  if (uploadQuestion.institutes && Array.isArray(uploadQuestion.institutes)) {
    institutes = uploadQuestion.institutes;
  } else if (uploadQuestion.institute) {
    // Parse comma-separated institutes or single institute
    institutes = uploadQuestion.institute
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);
  }

  // Parse years
  let years: number[] = [];
  if (uploadQuestion.years && Array.isArray(uploadQuestion.years)) {
    years = uploadQuestion.years;
  } else if (uploadQuestion.year) {
    // Parse comma-separated years or single year
    const yearStrings = uploadQuestion.year.split(',').map((y) => y.trim());
    years = yearStrings
      .map((y) => parseInt(y))
      .filter((y) => !isNaN(y) && y > 1900 && y < 2100);
  }

  // Parse option images
  let optionImages: string[] | undefined;
  if (
    uploadQuestion.optionImages &&
    Array.isArray(uploadQuestion.optionImages)
  ) {
    optionImages = uploadQuestion.optionImages;
  }

  // Transform to database format with snake_case
  return {
    // Core Content
    question: uploadQuestion.question,
    options,
    correct_answer_indices: correctAnswerIndices,
    explanation: uploadQuestion.explanation,

    // Question Type
    type: 'MCQ',
    difficulty: uploadQuestion.difficulty || 'Medium',

    // Academic Info
    subject: uploadQuestion.subject,
    chapter: uploadQuestion.chapter,
    topic: uploadQuestion.topic,
    stream: uploadQuestion.stream,
    division: uploadQuestion.division,
    section: uploadQuestion.section,

    // Exam Context
    exam_type: uploadQuestion.examType || 'Academic',
    institutes,
    years,

    // Metadata
    status: 'Pending',
    author: 'Bulk Upload',
    created_at: new Date().toISOString(),
    version: 1,
    tags: [],

    // Media
    image_url: uploadQuestion.imageUrl || uploadQuestion.questionImage,
    option_images: optionImages,
    explanation_image_url:
      uploadQuestion.explanationImageUrl || uploadQuestion.explanationImage,
  };
}

/**
 * Transform database format to Question type (for frontend display)
 */
export function transformDatabaseToQuestion(
  dbQuestion: DatabaseQuestionFormat,
): Partial<Question> {
  // Get first correct answer for backward compatibility
  const firstCorrectIndex = dbQuestion.correct_answer_indices[0] || 0;
  const firstCorrectAnswer = dbQuestion.options[firstCorrectIndex] || '';

  return {
    id: '', // Will be set by database
    question: dbQuestion.question,
    options: dbQuestion.options,

    // Multi-select support
    correctAnswer: firstCorrectAnswer,
    correctAnswerIndex: firstCorrectIndex,
    correctAnswerIndices: dbQuestion.correct_answer_indices,

    explanation: dbQuestion.explanation,

    type: dbQuestion.type as Question['type'],
    difficulty: dbQuestion.difficulty as Question['difficulty'],

    subject: dbQuestion.subject,
    chapter: dbQuestion.chapter,
    topic: dbQuestion.topic,
    stream: dbQuestion.stream,
    division: dbQuestion.division,
    section: dbQuestion.section,
    examType: dbQuestion.exam_type,
    institutes: dbQuestion.institutes,
    years: dbQuestion.years,

    status: dbQuestion.status as Question['status'],
    author: dbQuestion.author,
    createdAt: dbQuestion.created_at || new Date().toISOString(),
    version: dbQuestion.version,
    tags: dbQuestion.tags,

    imageUrl: dbQuestion.image_url,
    optionImages: dbQuestion.option_images,
    explanationImageUrl: dbQuestion.explanation_image_url,
  };
}

/**
 * Batch transform and validate
 */
export function transformAndValidateBatch(
  uploadQuestions: UploadQuestionFormat[],
): {
  databaseQuestions: DatabaseQuestionFormat[];
  previewQuestions: Partial<Question>[];
  validationErrors: Array<{ row: number; field: string; message: string }>;
} {
  const databaseQuestions: DatabaseQuestionFormat[] = [];
  const previewQuestions: Partial<Question>[] = [];
  const validationErrors: Array<{
    row: number;
    field: string;
    message: string;
  }> = [];

  uploadQuestions.forEach((uploadQ, index) => {
    const validation = validateUploadQuestion(uploadQ, index);

    if (!validation.isValid) {
      validation.errors.forEach((err) => {
        validationErrors.push({
          row: index + 1,
          field: err.field,
          message: err.message,
        });
      });
    }

    // Transform even if invalid (so user can preview and fix)
    const dbQuestion = transformUploadToDatabase(uploadQ);
    const previewQuestion = transformDatabaseToQuestion(dbQuestion);

    databaseQuestions.push(dbQuestion);
    previewQuestions.push(previewQuestion);
  });

  return {
    databaseQuestions,
    previewQuestions,
    validationErrors,
  };
}
