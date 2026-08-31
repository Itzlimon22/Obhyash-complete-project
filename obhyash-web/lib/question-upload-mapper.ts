import { Question, ExamHistoryItem } from './types';
import { hscSubjects } from './data/hsc';

/**
 * Maps institute name in Bengali/English to standard code
 */
export function getStandardInstituteCode(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes('ঢাকা') || lower.includes('dhaka')) return 'DB';
  if (lower.includes('রাজশাহী') || lower.includes('rajshahi')) return 'RB';
  if (lower.includes('চট্টগ্রাম') || lower.includes('chattogram') || lower.includes('chittagong')) return 'CB';
  if (lower.includes('কুমিল্লা') || lower.includes('cumilla') || lower.includes('comilla')) return 'ComB';
  if (lower.includes('দিনাজপুর') || lower.includes('dinajpur')) return 'DinB';
  if (lower.includes('যশোর') || lower.includes('jashore') || lower.includes('jessore')) return 'JB';
  if (lower.includes('সিলেট') || lower.includes('sylhet')) return 'SB';
  if (lower.includes('বরিশাল') || lower.includes('barishal') || lower.includes('barisal')) return 'BB';
  if (lower.includes('ময়মনসিংহ') || lower.includes('mymensingh')) return 'MB';
  if (lower.includes('মাদ্রাসা') || lower.includes('madrasah') || lower.includes('madrasa')) return 'MadB';
  if (lower.includes('কারিগরি') || lower.includes('technical') || lower.includes('bteb')) return 'BTEB';
  if (lower.includes('মেডিকেল') || lower.includes('medical') || lower.includes('mat')) return 'MAT';
  if (lower.includes('ডেন্টাল') || lower.includes('dental') || lower.includes('dat')) return 'DAT';
  if (lower.includes('বুয়েট') || lower.includes('buet')) return 'BUET';
  if (lower.includes('ঢাবি') || lower.includes('du')) return 'DU';
  if (lower.includes('রাবি') || lower.includes('ru')) return 'RU';
  if (lower.includes('চবি') || lower.includes('cu')) return 'CU';
  if (lower.includes('জাবি') || lower.includes('ju')) return 'JU';
  if (lower.includes('জিএসটি') || lower.includes('gst')) return 'GST';
  if (lower.includes('সকল বোর্ড') || lower.includes('all board')) return 'AllB';

  return trimmed.length <= 5 ? trimmed.toUpperCase() : trimmed;
}

/**
 * Upload format interface - the format users provide
 * Supports both array format and backward-compatible option1-N format
 */
export interface UploadQuestionFormat {
  // Question Type: 'MCQ' (default), 'Ka', 'Kha', 'CQ', 'Written'
  type?: string;
  marks?: number;
  subQuestions?: Array<{
    part: string;
    question: string;
    marks?: number;
    answer: string;
  }>;

  // Academic Info
  stream?: string;
  division?: string; // NEW: Science, Humanities, Business Studies
  section?: string;
  subject: string;
  chapter?: string;
  topic?: string;

  // Question Content - Array Format (Preferred)
  question: string;
  passage?: string; // Stimulus text for composite questions / CQ
  parentId?: string;
  isComposite?: boolean;
  compositeIndex?: number;
  options?: string[]; // Array of options (MCQ only)
  correctAnswers?: number[]; // Array of correct answer indices (multi-select MCQ)

  // Question Content - Backward Compatible Format
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  option5?: string;
  option6?: string;
  answer?: string; // "option1", "option2" for MCQ OR direct answer text for Ka/Kha/Written

  explanation?: string;

  // Metadata
  difficulty?: string;
  examType?: string;
  exam_history?: ExamHistoryItem[]; // Structured exam history: [{ institute, code, year }]
  examHistory?: ExamHistoryItem[]; // CamelCase alias
  institutes?: string[]; // Array of institutes (legacy/fallback)
  years?: number[]; // Array of years (legacy/fallback)
  fingerprint?: string;

  // Legacy fields (backward compatibility)
  institute?: string;
  year?: string;

  // Media (All Optional)
  imageUrl?: string; // Question image
  questionImage?: string; // Alternative naming
  optionImages?: string[]; // Array of images for options
  explanationImageUrl?: string;
  explanationImage?: string; // Alternative naming
}

/**
 * Database format interface - snake_case for Supabase
 */
export interface DatabaseQuestionFormat {
  // Core Content
  question: string;
  passage?: string;
  parent_id?: string;
  is_composite?: boolean;
  composite_index?: number;
  fingerprint?: string;
  options: string[];
  correct_answer_indices: number[];
  explanation?: string;

  // Question Type
  type: string; // 'MCQ', 'Ka', 'Kha', 'CQ', 'Written'
  marks?: number;
  sub_questions?: any[];
  difficulty: string;

  // Academic Info
  subject: string;
  subject_id?: string;
  chapter?: string;
  chapter_id?: string;
  topic?: string;
  topic_id?: string;
  stream?: string;
  stream_id?: string;
  division?: string;
  division_id?: string;
  section?: string;

  // Exam Context
  exam_type: string; // Defaults to 'Academic'
  exam_history: ExamHistoryItem[];
  institutes: string[];
  years: number[];

  // Metadata
  status: string; // 'Pending', 'Approved', 'Rejected'
  author: string;
  created_at?: string;
  version: number;
  tags: string[];

  // Media
  image_url?: string;
  option_images?: string[];
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
  const qType = (question.type || 'MCQ').trim();
  const isWrittenOrCQ = qType === 'Ka' || qType === 'Kha' || qType === 'CQ' || qType === 'Written';

  // Required fields
  if (!question.question && !question.passage) {
    errors.push({
      field: 'question',
      message: `Row ${index + 1}: Question text or passage is required`,
    });
  }

  if (!question.subject || question.subject.trim() === '') {
    errors.push({
      field: 'subject',
      message: `Row ${index + 1}: Subject is required`,
    });
  }

  if (!isWrittenOrCQ) {
    // Helper to extract options from either array or individual columns
    const extractOptions = (q: any): string[] => {
      if (q.options && Array.isArray(q.options) && q.options.length > 0) {
        return q.options.map((o: any) => String(o ?? '').trim()).filter((o: string) => o.length > 0);
      }
      const cols = [
        q.option1 ?? q.option_1 ?? q.optionA ?? q.option_a ?? q.opt1 ?? q['Option 1'] ?? q['Option A'] ?? q['ক'],
        q.option2 ?? q.option_2 ?? q.optionB ?? q.option_b ?? q.opt2 ?? q['Option 2'] ?? q['Option B'] ?? q['খ'],
        q.option3 ?? q.option_3 ?? q.optionC ?? q.option_c ?? q.opt3 ?? q['Option 3'] ?? q['Option C'] ?? q['গ'],
        q.option4 ?? q.option_4 ?? q.optionD ?? q.option_d ?? q.opt4 ?? q['Option 4'] ?? q['Option D'] ?? q['ঘ'],
        q.option5 ?? q.option_5 ?? q.optionE ?? q.option_e ?? q.opt5 ?? q['Option 5'] ?? q['Option E'] ?? q['ঙ'],
        q.option6 ?? q.option_6 ?? q.optionF ?? q.option_f ?? q.opt6 ?? q['Option 6'] ?? q['Option F'],
      ];
      return cols.filter((opt): opt is string => typeof opt === 'string' && opt.trim() !== '');
    };

    const options = extractOptions(question);

    if (options.length < 2) {
      errors.push({
        field: 'options',
        message: `Row ${index + 1}: At least 2 options are required for MCQ`,
      });
    }

    const rawAnswer = question.correctAnswers ?? question.answer ?? (question as any).correct_answer ?? (question as any).correct_answer_index ?? (question as any)['Correct Answer'];

    const parseSingleAnswerIndex = (ans: any): number | null => {
      if (typeof ans === 'number') {
        if (ans >= 0 && ans < options.length) return ans;
        if (ans >= 1 && ans <= options.length) return ans - 1; // 1-indexed fallback
        return null;
      }
      if (typeof ans !== 'string') return null;
      const trimmed = ans.trim().toLowerCase();

      // 1. Check option1, option2 ...
      const optMatch = trimmed.match(/option\s*(\d+)/i);
      if (optMatch) {
        const idx = parseInt(optMatch[1], 10) - 1;
        return idx >= 0 && idx < options.length ? idx : null;
      }

      // 2. Check pure English digits (0, 1, 2, 3 or 1, 2, 3, 4)
      if (/^\d+$/.test(trimmed)) {
        const num = parseInt(trimmed, 10);
        if (num >= 0 && num < options.length) return num;
        if (num >= 1 && num <= options.length) return num - 1;
      }

      // 3. Check English letters A, B, C, D, E, F
      const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };
      if (letterMap[trimmed] !== undefined && letterMap[trimmed] < options.length) {
        return letterMap[trimmed];
      }

      // 4. Check Bengali Letters ক, খ, গ, ঘ, ঙ
      const bengaliLetterMap: Record<string, number> = { 'ক': 0, 'খ': 1, 'গ': 2, 'ঘ': 3, 'ঙ': 4 };
      if (bengaliLetterMap[ans.trim()] !== undefined && bengaliLetterMap[ans.trim()] < options.length) {
        return bengaliLetterMap[ans.trim()];
      }

      // 5. Check Bengali Numerals ১, ২, ৩, ৪
      const bengaliDigitMap: Record<string, number> = { '১': 0, '২': 1, '৩': 2, '৪': 3, '৫': 4 };
      if (bengaliDigitMap[ans.trim()] !== undefined && bengaliDigitMap[ans.trim()] < options.length) {
        return bengaliDigitMap[ans.trim()];
      }

      // 6. Direct match with option content
      const directIdx = options.findIndex((o) => o.trim().toLowerCase() === trimmed);
      if (directIdx !== -1) return directIdx;

      return null;
    };

    let validIndices: number[] = [];
    if (Array.isArray(rawAnswer)) {
      validIndices = rawAnswer.map(parseSingleAnswerIndex).filter((idx): idx is number => idx !== null);
    } else if (rawAnswer !== undefined && rawAnswer !== null && String(rawAnswer).trim() !== '') {
      const parts = String(rawAnswer).split(/[,;|\/]/).map((p) => p.trim()).filter(Boolean);
      validIndices = parts.map(parseSingleAnswerIndex).filter((idx): idx is number => idx !== null);
    }

    if (validIndices.length === 0) {
      errors.push({
        field: 'answer',
        message: `Row ${index + 1}: Valid correct answer is required (e.g. A, B, C, D or 1, 2, 3, 4 or ক, খ, গ, ঘ)`,
      });
    }
  } else {
    // Written, Ka, Kha, CQ validation
    if (qType === 'Ka' || qType === 'Kha' || qType === 'Written') {
      const hasAnswer = Boolean(question.answer?.trim() || question.explanation?.trim());
      if (!hasAnswer) {
        errors.push({
          field: 'answer',
          message: `Row ${index + 1}: Answer/Explanation is required for ${qType} question`,
        });
      }
    } else if (qType === 'CQ') {
      const hasCQContent = Boolean(
        question.passage?.trim() ||
        question.question?.trim() ||
        (question.subQuestions && question.subQuestions.length > 0)
      );
      if (!hasCQContent) {
        errors.push({
          field: 'passage',
          message: `Row ${index + 1}: Passage or Sub-questions are required for CQ`,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Resolves a topic serial number to a topic name based on provided subject and chapter.
 */
function resolveTopicName(
  subjectInput?: string,
  chapterInput?: string,
  topicInput?: string,
): string | undefined {
  if (!topicInput || !subjectInput) return topicInput;

  const serial = parseInt(topicInput.trim(), 10);
  // If it's not a pure number, assume it's already a string name or something else
  if (isNaN(serial)) return topicInput;

  const targetSubjLower = subjectInput.toLowerCase().trim();
  const matchedSubjects = hscSubjects.filter(
    (s) =>
      s.id.toLowerCase() === targetSubjLower ||
      s.name.toLowerCase() === targetSubjLower ||
      s.name.toLowerCase().includes(targetSubjLower),
  );

  if (matchedSubjects.length === 0) return topicInput;

  let chaptersToSearch = matchedSubjects.flatMap((s) => s.chapters);

  if (chapterInput) {
    const targetChapLower = chapterInput.toLowerCase().trim();
    const filteredChapters = chaptersToSearch.filter(
      (c) =>
        c.id.toLowerCase() === targetChapLower ||
        c.name.toLowerCase() === targetChapLower ||
        c.name.toLowerCase().includes(targetChapLower),
    );

    if (filteredChapters.length > 0) {
      chaptersToSearch = filteredChapters;
    }
  }

  // Iterate over whatever chapters we have and find the serial
  for (const chapter of chaptersToSearch) {
    const topic = chapter.topics.find((t) => t.serial === serial);
    if (topic) return topic.name;
  }

  return topicInput; // Fallback to raw string if not found
}

/**
 * Transform upload format to database format
 */
export function transformUploadToDatabase(
  uploadQuestion: UploadQuestionFormat,
): DatabaseQuestionFormat {
  const rawType = (uploadQuestion.type || 'MCQ').trim();
  const isWrittenOrCQ = rawType === 'Ka' || rawType === 'Kha' || rawType === 'CQ' || rawType === 'Written';

  // Extract options from either array or individual columns
  let options: string[] = [];
  let correctAnswerIndices: number[] = [];

  if (!isWrittenOrCQ) {
    if (uploadQuestion.options && Array.isArray(uploadQuestion.options) && uploadQuestion.options.length > 0) {
      options = uploadQuestion.options.map((o: any) => String(o ?? '').trim()).filter((o: string) => o.length > 0);
    } else {
      const q: any = uploadQuestion;
      const cols = [
        q.option1 ?? q.option_1 ?? q.optionA ?? q.option_a ?? q.opt1 ?? q['Option 1'] ?? q['Option A'] ?? q['ক'],
        q.option2 ?? q.option_2 ?? q.optionB ?? q.option_b ?? q.opt2 ?? q['Option 2'] ?? q['Option B'] ?? q['খ'],
        q.option3 ?? q.option_3 ?? q.optionC ?? q.option_c ?? q.opt3 ?? q['Option 3'] ?? q['Option C'] ?? q['গ'],
        q.option4 ?? q.option_4 ?? q.optionD ?? q.option_d ?? q.opt4 ?? q['Option 4'] ?? q['Option D'] ?? q['ঘ'],
        q.option5 ?? q.option_5 ?? q.optionE ?? q.option_e ?? q.opt5 ?? q['Option 5'] ?? q['Option E'] ?? q['ঙ'],
        q.option6 ?? q.option_6 ?? q.optionF ?? q.option_f ?? q.opt6 ?? q['Option 6'] ?? q['Option F'],
      ];
      options = cols.filter((opt): opt is string => typeof opt === 'string' && opt.trim() !== '');
    }

    // Parse correct answer indices
    const rawAns = uploadQuestion.correctAnswers ?? uploadQuestion.answer ?? (uploadQuestion as any).correct_answer ?? (uploadQuestion as any).correct_answer_index ?? (uploadQuestion as any)['Correct Answer'];

    const parseSingleAnswerIndex = (ans: any): number | null => {
      if (typeof ans === 'number') {
        if (ans >= 0 && ans < options.length) return ans;
        if (ans >= 1 && ans <= options.length) return ans - 1;
        return null;
      }
      if (typeof ans !== 'string') return null;
      const trimmed = ans.trim().toLowerCase();

      const optMatch = trimmed.match(/option\s*(\d+)/i);
      if (optMatch) {
        const idx = parseInt(optMatch[1], 10) - 1;
        return idx >= 0 && idx < options.length ? idx : null;
      }

      if (/^\d+$/.test(trimmed)) {
        const num = parseInt(trimmed, 10);
        if (num >= 0 && num < options.length) return num;
        if (num >= 1 && num <= options.length) return num - 1;
      }

      const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };
      if (letterMap[trimmed] !== undefined && letterMap[trimmed] < options.length) {
        return letterMap[trimmed];
      }

      const bengaliLetterMap: Record<string, number> = { 'ক': 0, 'খ': 1, 'গ': 2, 'ঘ': 3, 'ঙ': 4 };
      if (bengaliLetterMap[ans.trim()] !== undefined && bengaliLetterMap[ans.trim()] < options.length) {
        return bengaliLetterMap[ans.trim()];
      }

      const bengaliDigitMap: Record<string, number> = { '১': 0, '২': 1, '৩': 2, '৪': 3, '৫': 4 };
      if (bengaliDigitMap[ans.trim()] !== undefined && bengaliDigitMap[ans.trim()] < options.length) {
        return bengaliDigitMap[ans.trim()];
      }

      const directIdx = options.findIndex((o) => o.trim().toLowerCase() === trimmed);
      if (directIdx !== -1) return directIdx;

      return null;
    };

    if (Array.isArray(rawAns)) {
      correctAnswerIndices = rawAns.map(parseSingleAnswerIndex).filter((idx): idx is number => idx !== null);
    } else if (rawAns !== undefined && rawAns !== null && String(rawAns).trim() !== '') {
      const parts = String(rawAns).split(/[,;|\/]/).map((p) => p.trim()).filter(Boolean);
      correctAnswerIndices = parts.map(parseSingleAnswerIndex).filter((idx): idx is number => idx !== null);
    }

    if (correctAnswerIndices.length === 0) {
      correctAnswerIndices = [0];
    }
  }

  // Parse exam history and maintain backward compatibility
  let examHistory: ExamHistoryItem[] = [];
  const rawHistory = uploadQuestion.exam_history || uploadQuestion.examHistory;

  if (rawHistory && Array.isArray(rawHistory) && rawHistory.length > 0) {
    examHistory = rawHistory
      .map((item: any) => {
        const inst = String(item.institute || item.name || '').trim();
        const yr = Number(item.year) || 0;
        const code = item.code ? String(item.code).trim() : getStandardInstituteCode(inst);
        return {
          institute: inst,
          code: code || getStandardInstituteCode(inst),
          year: yr,
        };
      })
      .filter((h) => h.institute.length > 0 || h.year > 0);
  }

  // Parse legacy institutes
  let institutes: string[] = [];
  if (uploadQuestion.institutes && Array.isArray(uploadQuestion.institutes)) {
    institutes = uploadQuestion.institutes.map((i) => String(i).trim()).filter(Boolean);
  } else if (uploadQuestion.institute) {
    institutes = uploadQuestion.institute
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);
  }

  // Parse legacy years
  let years: number[] = [];
  if (uploadQuestion.years && Array.isArray(uploadQuestion.years)) {
    years = uploadQuestion.years.map((y) => Number(y)).filter((y) => !isNaN(y) && y > 1900 && y < 2100);
  } else if (uploadQuestion.year) {
    const yearStrings = uploadQuestion.year.split(',').map((y) => y.trim());
    years = yearStrings
      .map((y) => parseInt(y))
      .filter((y) => !isNaN(y) && y > 1900 && y < 2100);
  }

  // If exam_history was not provided but institutes/years exist, synthesize exam_history
  if (examHistory.length === 0 && (institutes.length > 0 || years.length > 0)) {
    if (institutes.length > 0 && years.length > 0) {
      if (institutes.length === years.length) {
        institutes.forEach((inst, idx) => {
          examHistory.push({
            institute: inst,
            code: getStandardInstituteCode(inst),
            year: years[idx] || 0,
          });
        });
      } else if (years.length === 1) {
        institutes.forEach((inst) => {
          examHistory.push({
            institute: inst,
            code: getStandardInstituteCode(inst),
            year: years[0],
          });
        });
      } else if (institutes.length === 1) {
        years.forEach((yr) => {
          examHistory.push({
            institute: institutes[0],
            code: getStandardInstituteCode(institutes[0]),
            year: yr,
          });
        });
      } else {
        const maxLen = Math.max(institutes.length, years.length);
        for (let i = 0; i < maxLen; i++) {
          const inst = institutes[i] || institutes[0] || '';
          const yr = years[i] || years[0] || 0;
          examHistory.push({
            institute: inst,
            code: getStandardInstituteCode(inst),
            year: yr,
          });
        }
      }
    } else if (institutes.length > 0) {
      institutes.forEach((inst) => {
        examHistory.push({
          institute: inst,
          code: getStandardInstituteCode(inst),
          year: 0,
        });
      });
    } else if (years.length > 0) {
      years.forEach((yr) => {
        examHistory.push({
          institute: '',
          code: '',
          year: yr,
        });
      });
    }
  }

  // If examHistory was provided but legacy institutes/years were empty, extract them
  if (examHistory.length > 0) {
    if (institutes.length === 0) {
      institutes = examHistory.map((h) => h.institute).filter(Boolean);
    }
    if (years.length === 0) {
      years = examHistory.map((h) => h.year).filter((y) => y > 1900 && y < 2100);
    }
  }

  // Parse option images
  let optionImages: string[] | undefined;
  if (
    uploadQuestion.optionImages &&
    Array.isArray(uploadQuestion.optionImages)
  ) {
    optionImages = uploadQuestion.optionImages;
  }

  const rawStream = uploadQuestion.stream || 'HSC';
  const streamId = rawStream.toUpperCase().includes('SSC')
    ? 'SSC'
    : rawStream.toUpperCase().includes('ADMISSION')
    ? 'ADMISSION'
    : rawStream.toUpperCase().includes('BCS')
    ? 'BCS'
    : 'HSC';

  // Transform to database format with snake_case
  return {
    // Core Content
    question: uploadQuestion.question || uploadQuestion.passage || '',
    passage: uploadQuestion.passage,
    parent_id: uploadQuestion.parentId,
    is_composite: uploadQuestion.isComposite || Boolean(uploadQuestion.passage),
    composite_index: uploadQuestion.compositeIndex || 1,
    fingerprint: uploadQuestion.fingerprint,
    options,
    correct_answer_indices: correctAnswerIndices,
    explanation: uploadQuestion.explanation?.trim() || uploadQuestion.answer?.trim(),

    // Question Type
    type: rawType,
    marks: uploadQuestion.marks || (rawType === 'Ka' ? 1 : rawType === 'Kha' ? 2 : rawType === 'Written' ? 10 : rawType === 'CQ' ? 10 : 1),
    sub_questions: uploadQuestion.subQuestions,
    difficulty: uploadQuestion.difficulty || 'Medium',

    // Academic Info
    subject: uploadQuestion.subject,
    chapter: uploadQuestion.chapter,
    topic: resolveTopicName(
      uploadQuestion.subject,
      uploadQuestion.chapter,
      uploadQuestion.topic,
    ),
    stream: uploadQuestion.stream || 'HSC',
    stream_id: streamId,
    division: uploadQuestion.division || 'Science',
    division_id: uploadQuestion.division?.toLowerCase().includes('hum')
      ? 'humanities'
      : uploadQuestion.division?.toLowerCase().includes('bus')
      ? 'business_studies'
      : 'science',
    section: uploadQuestion.section,

    // Exam Context
    exam_type: uploadQuestion.examType || 'Academic',
    exam_history: examHistory,
    institutes,
    years,

    // Metadata
    status: 'Approved',
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
    passage: dbQuestion.passage,
    parentId: dbQuestion.parent_id,
    isComposite: dbQuestion.is_composite,
    compositeIndex: dbQuestion.composite_index,
    fingerprint: dbQuestion.fingerprint,
    options: dbQuestion.options,

    // Multi-select support
    correctAnswer: firstCorrectAnswer,
    correctAnswerIndex: firstCorrectIndex,
    correctAnswerIndices: dbQuestion.correct_answer_indices,

    explanation: dbQuestion.explanation,

    type: dbQuestion.type as Question['type'],
    difficulty: dbQuestion.difficulty as Question['difficulty'],

    subject: dbQuestion.subject,
    subjectId: dbQuestion.subject_id,
    chapter: dbQuestion.chapter,
    chapterId: dbQuestion.chapter_id,
    topic: dbQuestion.topic,
    topicId: dbQuestion.topic_id,
    stream: dbQuestion.stream,
    streamId: dbQuestion.stream_id,
    division: dbQuestion.division,
    divisionId: dbQuestion.division_id,
    section: dbQuestion.section,
    examType: dbQuestion.exam_type,
    exam_history: dbQuestion.exam_history,
    examHistory: dbQuestion.exam_history,
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
