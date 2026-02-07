import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { UploadQuestionFormat } from './question-upload-mapper';

/**
 * Parse CSV file to questions array
 */
export async function parseCSVFile(
  file: File,
): Promise<UploadQuestionFormat[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const questions = results.data as UploadQuestionFormat[];
          resolve(questions);
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
    reader.readAsText(file);
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
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          raw: false,
          defval: '',
        });

        // Process arrays stored as comma-separated strings
        const questions = json.map((row: Record<string, unknown>) => {
          const processed: Record<string, unknown> = { ...row };

          if (processed.options && typeof processed.options === 'string') {
            processed.options = processed.options
              .split(',')
              .map((opt: string) => opt.trim());
          }
          if (
            processed.correctAnswers &&
            typeof processed.correctAnswers === 'string'
          ) {
            processed.correctAnswers = processed.correctAnswers
              .split(',')
              .map((idx: string) => parseInt(idx.trim()))
              .filter((n: number) => !isNaN(n));
          }
          if (
            processed.institutes &&
            typeof processed.institutes === 'string'
          ) {
            processed.institutes = processed.institutes
              .split(',')
              .map((i: string) => i.trim());
          }
          if (processed.years && typeof processed.years === 'string') {
            processed.years = processed.years
              .split(',')
              .map((y: string) => parseInt(y.trim()))
              .filter((n: number) => !isNaN(n));
          }

          return processed;
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
