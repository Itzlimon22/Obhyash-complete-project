import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { UploadQuestionFormat } from './question-upload-mapper';

/**
 * Helper to normalize spreadsheet keys (case-insensitive, trimmed, alias-mapped)
 */
function normalizeRowKeys(rawRow: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(rawRow)) {
    const cleanKey = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
    
    // Map common aliases
    if (cleanKey === 'q' || cleanKey === 'question' || cleanKey === 'questiontext' || cleanKey === 'প্রশ্ন') {
      normalized.question = value;
    } else if (cleanKey === 'passage' || cleanKey === 'stimulus' || cleanKey === 'উদ্দীপক') {
      normalized.passage = value;
    } else if (cleanKey === 'subj' || cleanKey === 'subject' || cleanKey === 'বিষয়' || cleanKey === 'বিষয়') {
      normalized.subject = value;
    } else if (cleanKey === 'chap' || cleanKey === 'chapter' || cleanKey === 'অধ্যায়' || cleanKey === 'অধ্যায়') {
      normalized.chapter = value;
    } else if (cleanKey === 'top' || cleanKey === 'topic' || cleanKey === 'টপিক') {
      normalized.topic = value;
    } else if (cleanKey === 'ans' || cleanKey === 'answer' || cleanKey === 'correctanswer' || cleanKey === 'উত্তর') {
      normalized.answer = value;
    } else if (cleanKey === 'exp' || cleanKey === 'explanation' || cleanKey === 'ব্যাখ্যা') {
      normalized.explanation = value;
    } else if (cleanKey === 'diff' || cleanKey === 'difficulty' || cleanKey === 'লেভেল') {
      normalized.difficulty = value;
    } else if (cleanKey === 'opt1' || cleanKey === 'option1' || cleanKey === 'optiona' || cleanKey === 'opta' || cleanKey === 'ক') {
      normalized.option1 = value;
    } else if (cleanKey === 'opt2' || cleanKey === 'option2' || cleanKey === 'optionb' || cleanKey === 'optb' || cleanKey === 'খ') {
      normalized.option2 = value;
    } else if (cleanKey === 'opt3' || cleanKey === 'option3' || cleanKey === 'optionc' || cleanKey === 'optc' || cleanKey === 'গ') {
      normalized.option3 = value;
    } else if (cleanKey === 'opt4' || cleanKey === 'option4' || cleanKey === 'optiond' || cleanKey === 'optd' || cleanKey === 'ঘ') {
      normalized.option4 = value;
    } else if (cleanKey === 'opt5' || cleanKey === 'option5' || cleanKey === 'optione' || cleanKey === 'ঙ') {
      normalized.option5 = value;
    } else if (cleanKey === 'opt6' || cleanKey === 'option6' || cleanKey === 'optionf') {
      normalized.option6 = value;
    } else {
      normalized[key.trim()] = value;
    }
  }

  return normalized;
}

/**
 * Parse CSV file to questions array
 */
export async function parseCSVFile(
  file: File,
): Promise<UploadQuestionFormat[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        try {
          const rawData = results.data as Record<string, unknown>[];
          const questions = rawData.map(normalizeRowKeys);
          resolve(questions as unknown as UploadQuestionFormat[]);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Parse JSON file to questions array
 */
export async function parseJSONFile(
  file: File,
): Promise<UploadQuestionFormat[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);
        const questions = Array.isArray(json) ? json : [json];
        resolve(questions as unknown as UploadQuestionFormat[]);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Parse XLSX file to questions array
 */
export async function parseXLSXFile(
  file: File,
): Promise<UploadQuestionFormat[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', codepage: 65001 });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          raw: false,
          defval: '',
        });

        // Process normalized rows
        const questions = json.map((row: Record<string, unknown>) => {
          const normalized = normalizeRowKeys(row);
          return normalized;
        });

        resolve(questions as unknown as UploadQuestionFormat[]);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Auto-detect file type and parse
 */
export async function parseQuestionFile(file: File): Promise<{
  questions: UploadQuestionFormat[];
  fileType: 'CSV' | 'JSON' | 'XLSX';
}> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    return { questions: await parseCSVFile(file), fileType: 'CSV' };
  } else if (fileName.endsWith('.json')) {
    return { questions: await parseJSONFile(file), fileType: 'JSON' };
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return { questions: await parseXLSXFile(file), fileType: 'XLSX' };
  }

  throw new Error(
    'Unsupported file format. Please upload CSV, JSON, or XLSX files.',
  );
}

/**
 * Generate CSV template
 */
export function generateCSVTemplate(): string {
  const headers = [
    'stream',
    'division',
    'subject',
    'chapter',
    'topic',
    'question',
    'option1',
    'option2',
    'option3',
    'option4',
    'answer',
    'explanation',
    'difficulty',
    'examType',
    'institutes',
    'years',
  ];
  const sample = [
    'HSC',
    'Science',
    'রসায়ন',
    'অধ্যায় ১',
    '১',
    'প্রশ্ন টেক্সট',
    'অপশন ১',
    'অপশন ২',
    'অপশন ৩',
    'অপশন ৪',
    'option1',
    'ব্যাখ্যা',
    'Easy',
    'Academic',
    'ঢাকা মেডিকেল',
    '2024',
  ];
  return Papa.unparse([headers, sample]);
}

/**
 * Generate JSON template
 */
export function generateJSONTemplate(): string {
  return JSON.stringify(
    [
      {
        stream: 'HSC',
        division: 'Science',
        subject: 'রসায়ন',
        chapter: 'অধ্যায় ১',
        topic: '১',
        question: 'প্রশ্ন টেক্সট',
        options: ['অপশন ১', 'অপশন ২', 'অপশন ৩', 'অপশন ৪'],
        correctAnswers: [0],
        explanation: 'ব্যাখ্যা',
        difficulty: 'Easy',
        examType: 'Academic',
        institutes: ['ঢাকা মেডিকেল'],
        years: [2024],
      },
    ],
    null,
    2,
  );
}
