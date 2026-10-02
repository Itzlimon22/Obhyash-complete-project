import { QuestionItem, ParseResult } from './types';

const BN_TO_EN_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export function bnToEnNumber(str: string): number {
  const converted = str.replace(/[০-৯]/g, d => BN_TO_EN_DIGITS[d] || d);
  const parsed = parseInt(converted, 10);
  return isNaN(parsed) ? 0 : parsed;
}

const OPTION_KEY_MAP: Record<string, string> = {
  'ক': 'a', 'a': 'a',
  'খ': 'b', 'b': 'b',
  'গ': 'c', 'c': 'c',
  'ঘ': 'd', 'd': 'd',
};

const ANSWER_MAP: Record<string, string> = {
  'a': 'ক', 'ক': 'ক',
  'b': 'খ', 'খ': 'খ',
  'c': 'গ', 'গ': 'গ',
  'd': 'ঘ', 'ঘ': 'ঘ',
};

export function parseDataTxt(text: string): { questions: QuestionItem[]; warnings: string[] } {
  const questions: QuestionItem[] = [];
  const warnings: string[] = [];
  const lines = text.split('\n');

  let cur: QuestionItem | null = null;
  let inExpl = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    const m = line.match(/^#(\d+)$/);
    if (m) {
      if (cur) questions.push(cur);
      cur = {
        n: parseInt(m[1], 10),
        q: '',
        o: {},
        A: '',
        E: [],
      };
      inExpl = false;
      continue;
    }

    if (!cur) continue;

    if (inExpl) {
      cur.E.push(rawLine);
      continue;
    }

    if (line.startsWith('Q ')) {
      cur.q = line.slice(2).trim();
    } else if (line.startsWith('A ')) {
      const rawAns = line.slice(2).trim();
      cur.A = ANSWER_MAP[rawAns.toLowerCase()] || rawAns;
    } else if (/^[abcd] /.test(line)) {
      const key = line[0];
      cur.o[key] = line.slice(2).trim();
    } else if (line.startsWith('E ')) {
      cur.E.push(line.slice(2));
      inExpl = true;
    }
  }

  if (cur) questions.push(cur);

  // Validate
  questions.forEach(q => {
    const optKeys = Object.keys(q.o);
    if (optKeys.length < 4) {
      warnings.push(`প্রশ্ন ${q.n}: মাত্র ${optKeys.length}টি অপশন পাওয়া গেছে।`);
    }
    if (!q.A) {
      warnings.push(`প্রশ্ন ${q.n}: কোনো সঠিক উত্তর পাওয়া যায়নি।`);
    }
  });

  return { questions, warnings };
}

export function parseMarkdown(text: string): { questions: QuestionItem[]; warnings: string[] } {
  const questions: QuestionItem[] = [];
  const warnings: string[] = [];
  const lines = text.split('\n');

  let cur: QuestionItem | null = null;
  let inExpl = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check Question Heading (e.g. ### প্রশ্ন ০১: ..., ### প্রশ্ন ১: ..., ### Question 1: ...)
    const qMatch =
      line.match(/^###\s*প্রশ্ন\s*([০-৯\d]+)\s*[:.]\s*(.*)$/i) ||
      line.match(/^###\s*Question\s*([০-৯\d]+)\s*[:.]\s*(.*)$/i);

    if (qMatch) {
      if (cur) questions.push(cur);
      const qNum = bnToEnNumber(qMatch[1]);
      cur = {
        n: qNum,
        q: qMatch[2].trim(),
        o: {},
        A: '',
        E: [],
      };
      inExpl = false;
      continue;
    }

    if (!cur) continue;

    // Check Option (e.g. - **(ক)** Option text or - (a) Option text)
    const optMatch = line.match(/^-\s*\**\(([কখগঘabcd])\)\**\s*(.*)$/i);
    if (optMatch) {
      const mappedKey = OPTION_KEY_MAP[optMatch[1].toLowerCase()];
      if (mappedKey) {
        cur.o[mappedKey] = optMatch[2].trim();
      }
      inExpl = false;
      continue;
    }

    // Check Answer (e.g. > **সঠিক উত্তর:** (ক) ... or > **সঠিক উত্তর:** ক)
    const ansMatch = line.match(/^>\s*\**সঠিক\s*উত্তর\s*[:.]\**\s*\(?([কখগঘabcd])/i);
    if (ansMatch) {
      const rawAns = ansMatch[1].toLowerCase();
      cur.A = ANSWER_MAP[rawAns] || rawAns;
      continue;
    }

    // Check Explanation Start (e.g. > **ব্যাখ্যা:** ...)
    const explMatch = line.match(/^>\s*\**ব্যাখ্যা\s*[:.]\**\s*(.*)$/i);
    if (explMatch) {
      inExpl = true;
      if (explMatch[1].trim()) {
        cur.E.push(explMatch[1].trim());
      }
      continue;
    }

    // Continuation of explanation
    if (inExpl) {
      if (line.startsWith('### ') || line.startsWith('---')) {
        inExpl = false;
      } else {
        const cleaned = line.replace(/^>\s*/, '');
        cur.E.push(cleaned);
      }
    }
  }

  if (cur) questions.push(cur);

  // Validate
  questions.forEach(q => {
    const optKeys = Object.keys(q.o);
    if (optKeys.length < 4) {
      warnings.push(`প্রশ্ন ${q.n}: মাত্র ${optKeys.length}টি অপশন পাওয়া গেছে।`);
    }
    if (!q.A) {
      warnings.push(`প্রশ্ন ${q.n}: কোনো সঠিক উত্তর পাওয়া যায়নি।`);
    }
  });

  return { questions, warnings };
}

export function parseQuestionContent(content: string): ParseResult {
  const trimmed = content.trim();
  if (!trimmed) {
    return {
      success: false,
      questions: [],
      warnings: ['কোনো কনটেন্ট পাওয়া যায়নি।'],
      detectedType: 'unknown',
    };
  }

  // Detect type
  const isDataTxt = /^#\d+/m.test(trimmed) && /^[abcd] /m.test(trimmed);
  const isMarkdown = /###\s*(?:প্রশ্ন|Question)/i.test(trimmed);

  if (isDataTxt) {
    const { questions, warnings } = parseDataTxt(trimmed);
    return {
      success: questions.length > 0,
      questions,
      warnings,
      detectedType: 'txt',
    };
  }

  if (isMarkdown) {
    const { questions, warnings } = parseMarkdown(trimmed);
    return {
      success: questions.length > 0,
      questions,
      warnings,
      detectedType: 'md',
    };
  }

  // Fallback: try data.txt parser first, then markdown
  const txtResult = parseDataTxt(trimmed);
  if (txtResult.questions.length > 0) {
    return {
      success: true,
      questions: txtResult.questions,
      warnings: txtResult.warnings,
      detectedType: 'txt',
    };
  }

  const mdResult = parseMarkdown(trimmed);
  if (mdResult.questions.length > 0) {
    return {
      success: true,
      questions: mdResult.questions,
      warnings: mdResult.warnings,
      detectedType: 'md',
    };
  }

  return {
    success: false,
    questions: [],
    warnings: ['সঠিক ফরম্যাটের প্রশ্ন পাওয়া যায়নি। অনুগ্রহ করে data.txt (#1...) বা Markdown (### প্রশ্ন ১...) ফরম্যাট ব্যবহার করুন।'],
    detectedType: 'unknown',
  };
}
