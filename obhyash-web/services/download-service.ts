import { Question, ExamDetails, UserAnswers } from '@/lib/types';
import katex from 'katex';
import { generateTemplateHtml } from '@/lib/pdf-generator/template';
import { generateQuestionPaperHtml } from '@/lib/pdf-generator/question-paper';
import { QuestionItem, GeneratorSettings } from '@/lib/pdf-generator/types';

// --- Bengali Number Conversion Helper ---
const toBengaliNumber = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
};

// --- Academic Subject Formatting & Board Subject Code Helpers ---
const formatSubjectTitle = (subject?: string, subjectLabel?: string): string => {
  if (subjectLabel && /[\u0980-\u09FF]/.test(subjectLabel)) {
    return subjectLabel.trim();
  }
  const s = (subject || '').toLowerCase().replace(/-/g, '_').trim();
  if (s.includes('physics')) {
    if (s.includes('1')) return 'পদার্থবিজ্ঞান ১ম পত্র';
    if (s.includes('2')) return 'পদার্থবিজ্ঞান ২য় পত্র';
    return 'পদার্থবিজ্ঞান';
  }
  if (s.includes('chemistry') || s.includes('chem')) {
    if (s.includes('1')) return 'রসায়ন ১ম পত্র';
    if (s.includes('2')) return 'রসায়ন ২য় পত্র';
    return 'রসায়ন';
  }
  if (s.includes('higher_math') || s.includes('math')) {
    if (s.includes('1')) return 'উচ্চতর গণিত ১ম পত্র';
    if (s.includes('2')) return 'উচ্চতর গণিত ২য় পত্র';
    return 'উচ্চতর গণিত';
  }
  if (s.includes('biology') || s.includes('bio')) {
    if (s.includes('1') || s.includes('botany')) return 'জীববিজ্ঞান ১ম পত্র (উদ্ভিদবিজ্ঞান)';
    if (s.includes('2') || s.includes('zoology')) return 'জীববিজ্ঞান ২য় পত্র (প্রাণিবিজ্ঞান)';
    return 'জীববিজ্ঞান';
  }
  if (s.includes('ict')) return 'তথ্য ও যোগাযোগ প্রযুক্তি';
  if (s.includes('bangla')) {
    if (s.includes('1')) return 'বাংলা ১ম পত্র';
    if (s.includes('2')) return 'বাংলা ২য় পত্র';
    return 'বাংলা';
  }
  if (s.includes('english')) {
    if (s.includes('1')) return 'ইংরেজি ১ম পত্র';
    if (s.includes('2')) return 'ইংরেজি ২য় পত্র';
    return 'ইংরেজি';
  }
  return subjectLabel || subject || 'মডেল টেস্ট';
};

const getSubjectCode = (subject?: string, subjectLabel?: string): string | null => {
  const title = formatSubjectTitle(subject, subjectLabel);
  if (title.includes('বাংলা ১ম')) return '১০১';
  if (title.includes('বাংলা ২')) return '১০২';
  if (title.includes('ইংরেজি ১ম')) return '১০৭';
  if (title.includes('ইংরেজি ২')) return '১০৮';
  if (title.includes('তথ্য ও যোগাযোগ') || title.includes('আইসিটি')) return '২৭৫';
  if (title.includes('পদার্থবিজ্ঞান ১ম')) return '১৭৪';
  if (title.includes('পদার্থবিজ্ঞান ২')) return '১৭৫';
  if (title.includes('রসায়ন ১ম')) return '১৭৬';
  if (title.includes('রসায়ন ২')) return '১৭৭';
  if (title.includes('জীববিজ্ঞান ১ম')) return '১৭৮';
  if (title.includes('জীববিজ্ঞান ২')) return '১৭৯';
  if (title.includes('উচ্চতর গণিত ১ম')) return '২৬৫';
  if (title.includes('উচ্চতর গণিত ২')) return '২৬৬';
  return null;
};

// --- Theme Resolver for PDF Generation ---
export const resolveTheme = (category?: string, title?: string, subject?: string): string => {
  const text = `${category || ''} ${title || ''} ${subject || ''}`.toLowerCase();
  if (
    text.includes('eng') || 
    text.includes('ইঞ্জিনিয়ারিং') || 
    text.includes('বুয়েট') || 
    text.includes('buet') || 
    text.includes('ckruet') ||
    text.includes('রুয়েট') ||
    text.includes('কুয়েট') ||
    text.includes('চুয়েট')
  ) {
    return 'engineering';
  }
  if (
    text.includes('varsi') || 
    text.includes('ভার্সিটি') || 
    text.includes('বিশ্ববিদ্যালয়') || 
    text.includes('dhaka university') || 
    text.includes('ঢাবি') || 
    text.includes('du') || 
    text.includes('guccho') || 
    text.includes('গুচ্ছ') ||
    text.includes('কৃষি')
  ) {
    return 'varsity_oxford_maroon';
  }
  return 'medical';
};

// --- LaTeX Preprocessor (Chemistry, temperatures, and arrows) ---
const preprocessMath = (math: string): string => {
  let m = math.trim();
  // Chemistry \ce{...}, \pu{...} cleanup for KaTeX
  m = m.replace(/\\(?:ce|pu)\{([^{}]*)\}/g, (_, inner) => {
    return inner.replace(/([A-Za-z\)])_?(\d+)/g, '$1_{$2}');
  });
  // Temperatures and degrees
  m = m.replace(/\^\{?\\circ\}?\s*(?:\\text\{C\}|C)/g, '^{\\circ}\\text{C}');
  m = m.replace(/\^\{?\\circ\}?\s*(?:\\text\{F\}|F)/g, '^{\\circ}\\text{F}');
  m = m.replace(/\^\{?\\circ\}?/g, '^{\\circ}');
  m = m.replace(/\\degree/g, '^{\\circ}');
  // Arrows
  m = m.replace(/\\xrightarrow(?:\[([^\]]*)\])?\{([^}]*)\}/g, (_, below, above) => {
    if (above && below) return `\\xrightarrow[${below}]{${above}}`;
    if (above) return `\\xrightarrow{${above}}`;
    return '\\rightarrow';
  });
  return m;
};

// --- LaTeX & Markdown Renderer ---
const renderLatex = (text: string): string => {
  if (!text) return '';

  // 1. Display LaTeX: $$...$$
  let result = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    const clean = preprocessMath(math);
    try {
      return `<div style="overflow-x:auto;margin:3px 0;text-align:left;">${katex.renderToString(clean, { throwOnError: false, displayMode: true })}</div>`;
    } catch {
      return `<span style="font-family:serif;font-style:italic;">$$${clean}$$</span>`;
    }
  });

  // 2. Inline LaTeX: $...$
  result = result.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    const clean = preprocessMath(math);
    try {
      return katex.renderToString(clean, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return `<span style="font-family:serif;font-style:italic;">$${clean}$</span>`;
    }
  });

  // 3. Markdown Formatting
  result = result
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
    .replace(
      /`([^`\n]+?)`/g,
      '<code style="background:#f1f5f9;padding:1px 3px;border-radius:3px;font-family:monospace;font-size:0.88em;">$1</code>',
    )
    .replace(/\n\n+/g, '<br>')
    .replace(/\n/g, '<br>');

  return result;
};

// --- Image Helper ---
const renderImage = (imageUrl?: string) => {
  if (!imageUrl) return '';
  return `<div style="margin: 6px 0; text-align: center;">
            <img src="${imageUrl}" style="max-width: 95%; max-height: 140px; border: 1px solid #e2e8f0; border-radius: 4px;" alt="Question Image" />
          </div>`;
};

// --- Question Metadata (Board / Varsity tag) ---
const renderQuestionMeta = (q: Question): string => {
  const years = q.years && q.years.length > 0 ? q.years : q.year ? [q.year] : [];
  const institutes =
    q.institutes && q.institutes.length > 0
      ? q.institutes
      : q.institute
        ? [q.institute]
        : [];
  if (years.length === 0 && institutes.length === 0) return '';
  const combined = [institutes.join(', '), years.map(toBengaliNumber).join(', ')]
    .filter(Boolean)
    .join(' ');
  return `<div style="font-size: 7.5pt; color: #4b5563; font-style: italic; margin-bottom: 3px; display: block;">[${combined}]</div>`;
};

// --- Floating Toolbar Injected into Print/Download Window ---
const dlToolbar = (label: string) => `
  <div class="dl-bar">
    <button class="dl-btn" onclick="window.print()">&#11015; ${label}</button>
    <button class="dl-close" onclick="window.close()">&#10005; বন্ধ করুন</button>
  </div>
`;

const dlBarStyles = `
  .dl-bar { position: fixed; top: 12px; right: 18px; z-index: 99999; display: flex; gap: 8px; font-family: 'Noto Serif Bengali', sans-serif; }
  .dl-btn { background: #059669; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 8px rgba(5,150,105,0.4); display: flex; align-items: center; gap: 6px; }
  .dl-btn:hover { background: #047857; }
  .dl-close { background: #4b5563; color: #fff; border: none; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .dl-close:hover { background: #374151; }
  @media print { .dl-bar { display: none !important; } }
`;

// Shared standard 2-column exam styles
const sharedExamStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;500;600;700;800&family=Tinos:ital,wght@0,400;0,700;1,400&display=swap');
  
  @page {
    size: A4 portrait;
    margin: 10mm 12mm 12mm 12mm;
  }

  * {
    box-sizing: border-box;
  }

  body {
    font-family: 'Noto Serif Bengali', 'Tinos', 'Times New Roman', serif;
    font-size: 9.5pt;
    color: #111827;
    line-height: 1.35;
    margin: 0;
    padding: 0;
    padding-top: 50px;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .header-container {
    text-align: center;
    margin-bottom: 12px;
    border-bottom: 1.5px solid #111;
    padding-bottom: 6px;
  }

  .header-top {
    font-size: 15pt;
    font-weight: 800;
    letter-spacing: 0.5px;
    margin: 0 0 2px 0;
    color: #000;
  }

  .header-sub {
    font-size: 8pt;
    font-weight: 500;
    letter-spacing: 1px;
    color: #4b5563;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .exam-title-badge {
    display: inline-block;
    border: 1px solid #111;
    padding: 2px 14px;
    border-radius: 4px;
    font-size: 10pt;
    font-weight: 700;
    margin: 3px 0 6px 0;
    background: #f8fafc;
  }

  .meta-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 4px;
    border-top: 0.5px solid #cbd5e1;
    padding-top: 4px;
  }

  .meta-table td {
    padding: 3px 2px;
    font-size: 8.5pt;
    font-weight: 600;
    color: #1f2937;
    vertical-align: middle;
  }

  /* Strict 2-Column Newspaper/Exam Layout */
  .content-wrapper {
    column-count: 2;
    column-gap: 24px;
    column-rule: 0.5px solid #d1d5db;
    -webkit-column-count: 2;
    -webkit-column-gap: 24px;
    -webkit-column-rule: 0.5px solid #d1d5db;
    text-align: justify;
  }

  .question-item {
    break-inside: avoid;
    -webkit-column-break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 11px;
    padding-bottom: 7px;
    border-bottom: 0.5px dashed #e2e8f0;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .question-item:last-child {
    border-bottom: none;
  }

  .q-header {
    display: flex;
    align-items: flex-start;
    font-weight: 600;
    margin-bottom: 3px;
    font-size: 9.5pt;
    color: #000;
  }

  .q-num {
    font-weight: 800;
    min-width: 20px;
    flex-shrink: 0;
    padding-right: 3px;
    font-size: 9.5pt;
  }

  .q-text {
    flex: 1;
    line-height: 1.35;
  }

  .options-list {
    list-style-type: none;
    padding: 0;
    margin: 3px 0 2px 20px;
    display: flex;
    flex-wrap: wrap;
  }

  .option-item {
    width: 50%;
    min-width: 110px;
    padding-right: 4px;
    margin-bottom: 2.5px;
    font-size: 9pt;
    line-height: 1.3;
    display: flex;
    align-items: flex-start;
    overflow-wrap: break-word;
  }

  .option-item.full-width, .option-item:has(.katex-display) {
    width: 100%;
  }

  .opt-letter {
    font-weight: 700;
    margin-right: 3px;
    flex-shrink: 0;
    font-size: 8.5pt;
  }

  .opt-content {
    flex: 1;
  }

  /* KaTeX mathematical typography fine-tuning */
  .katex {
    font-size: 1.02em;
    text-rendering: auto;
  }

  .katex-display {
    margin: 3px 0 !important;
    font-size: 0.95em;
    max-width: 100%;
    overflow-x: auto;
  }
`;

// ─── Helper: Print or Open HTML in Dedicated Window / Iframe ───────────────────
const printOrOpenHtml = (html: string) => {
  if (typeof window === 'undefined') return;

  const w = window.open('', '_blank');
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
  } else {
    // If popup is blocked, use hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(html);
    iframe.contentWindow?.document.close();

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'OBHYASH_PDF_READY') {
        window.removeEventListener('message', handleMessage);
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {}
        }, 3000);
      }
    };
    window.addEventListener('message', handleMessage);
  }
};

// ─── 1. Download Question Paper (2-Column Zero-Gap Exam Paper) ───────────────

export const downloadQuestionPaper = (
  details: ExamDetails,
  questions: Question[],
) => {
  const subjectTitle = formatSubjectTitle(details.subject, details.subjectLabel);
  const totalCount = questions.length;
  const marks = details.totalMarks || totalCount;
  const duration = details.durationMinutes || 25;

  const mappedQuestions: QuestionItem[] = questions.map((q, idx) => ({
    n: idx + 1,
    q: q.question || '',
    img: q.imageUrl,
    o: {
      a: q.options[0] || '',
      b: q.options[1] || '',
      c: q.options[2] || '',
      d: q.options[3] || '',
    },
    A: '', // Question paper has no answers marked
    E: [], // No explanation box
    passage: (q as any).passage || undefined,
  }));

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.obhyash.com';

  const html = generateQuestionPaperHtml(mappedQuestions, {
    category: details.chapters ? 'অধ্যায় ভিত্তিক' : 'মডেল টেস্ট',
    title: details.examType ? `${details.examType} মডেল টেস্ট` : `${subjectTitle} মডেল টেস্ট`,
    subject: subjectTitle,
    subjectCode: getSubjectCode(details.subject, details.subjectLabel) || undefined,
    chapters: Array.isArray(details.chapters) ? details.chapters.join(', ') : details.chapters || undefined,
    durationMinutes: duration,
    totalMarks: marks,
    institutionLogoText: 'অভ্যাস',
    baseUrl: origin,
    autoPrint: true,
  });

  printOrOpenHtml(html);
};

// ─── 2. Download Result & Solutions (2-Column Zero-Gap Solution Sheet) ────────

export const downloadResult = (
  details: ExamDetails,
  questions: Question[],
  userAnswers: UserAnswers = {},
) => {
  const subjectTitle = formatSubjectTitle(details.subject, details.subjectLabel);
  const banglaLetters = ['ক', 'খ', 'গ', 'ঘ'];
  const hasUserAnswers = userAnswers && Object.keys(userAnswers).length > 0;

  const score = questions.reduce((acc, q) => {
    const ua = userAnswers[q.id];
    return acc + (ua === q.correctAnswerIndex ? q.points || 1 : 0);
  }, 0);
  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 1), 0);

  const mappedQuestions: QuestionItem[] = questions.map((q, idx) => {
    const ua = userAnswers ? userAnswers[q.id] : undefined;
    const isAnswered = ua !== undefined && ua !== null && ua !== -1;
    const isCorrect = isAnswered && ua === q.correctAnswerIndex;

    const expLines: string[] = [];

    if (q.explanation && q.explanation.trim()) {
      q.explanation
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .forEach(l => expLines.push(l));
    } else {
      expLines.push('এই প্রশ্নের জন্য অতিরিক্ত কোনো ব্যাখ্যা নেই।');
    }

    return {
      n: idx + 1,
      q: q.question || '',
      img: q.imageUrl,
      o: {
        a: q.options[0] || '',
        b: q.options[1] || '',
        c: q.options[2] || '',
        d: q.options[3] || '',
      },
      A: banglaLetters[q.correctAnswerIndex] || 'ক',
      E: expLines,
    };
  });

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.obhyash.com';
  const theme = resolveTheme(details.examType, subjectTitle, details.subject);

  const subtitle = hasUserAnswers
    ? `প্রাপ্ত নম্বর: ${toBengaliNumber(score.toFixed(1))} / ${toBengaliNumber(totalPoints)} · মোট প্রশ্ন: ${toBengaliNumber(questions.length)}টি · সময়: ${toBengaliNumber(details.durationMinutes || 25)} মিনিট`
    : `উচ্চ মাধ্যমিক ও ভর্তি পরীক্ষা প্রস্তুতি · মোট প্রশ্ন: ${toBengaliNumber(questions.length)}টি · পূর্ণমান: ${toBengaliNumber(details.totalMarks || questions.length)}`;

  const settings: GeneratorSettings = {
    theme,
    title: subjectTitle,
    subTitleLabel: 'সমাধান ও ব্যাখ্যা',
    subtitle,
    hasHeader: true,
    headerLeftText: 'অ্যাপ ইনস্টল করো',
    headerLeftUrl: 'https://play.google.com/store/apps/details?id=com.obhyash.app',
    headerRightText: `${subjectTitle} — সমাধান পত্র`,
    showHeaderLeftIcon: true,
    footerLeftPrefix: 'আনলিমিটেড এক্সাম দাও',
    footerSiteText: 'www.obhyash.com',
    footerLeftUrl: 'https://www.obhyash.com',
    footerLeftSuffix: 'এ',
    footerPagePrefix: 'পৃষ্ঠা',
    useBanglaDigits: true,
    pageOffset: 0,
    density: 'balanced',
    balanceColumns: true,
    standaloneToolbar: true,
    autoPrint: true,
    baseUrl: origin,
  };

  const html = generateTemplateHtml(mappedQuestions, settings);
  printOrOpenHtml(html);
};

export const downloadResultWithExplanations = downloadResult;

// ─── 2.1 Download Live Exam Result & Solutions (Vector PDF) ─────────────────

export const downloadLiveExamResult = (
  exam: {
    id: string;
    title: string;
    category?: string;
    duration_minutes?: number;
    total_marks?: number;
    total_questions?: number;
    negative_marking?: number;
  },
  questions: Question[],
  userAnswers: UserAnswers = {},
  attempt?: {
    score?: number;
    correct_count?: number;
    wrong_count?: number;
  } | null,
  userName?: string
) => {
  const banglaLetters = ['ক', 'খ', 'গ', 'ঘ'];
  const hasUserAnswers = userAnswers && Object.keys(userAnswers).length > 0;

  const score = attempt?.score !== undefined 
    ? attempt.score 
    : questions.reduce((acc, q) => {
        const ua = userAnswers[q.id];
        if (ua === undefined || ua === null || ua === -1) return acc;
        if (ua === q.correctAnswerIndex) return acc + (q.points || 1);
        return acc - (exam.negative_marking || 0.25);
      }, 0);

  const totalPoints = exam.total_marks || questions.reduce((acc, q) => acc + (q.points || 1), 0);
  const correctCount = attempt?.correct_count !== undefined 
    ? attempt.correct_count 
    : questions.filter(q => userAnswers[q.id] === q.correctAnswerIndex).length;
  const wrongCount = attempt?.wrong_count !== undefined
    ? attempt.wrong_count
    : questions.filter(q => {
        const ua = userAnswers[q.id];
        return ua !== undefined && ua !== null && ua !== -1 && ua !== q.correctAnswerIndex;
      }).length;

  const mappedQuestions: QuestionItem[] = questions.map((q, idx) => {
    const ua = userAnswers ? userAnswers[q.id] : undefined;
    const isAnswered = ua !== undefined && ua !== null && ua !== -1;
    const isCorrect = isAnswered && (
      ua === q.correctAnswerIndex || 
      (q.correctAnswerIndices && q.correctAnswerIndices.includes(ua))
    );

    const expLines: string[] = [];

    if (q.explanation && q.explanation.trim()) {
      q.explanation
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .forEach(l => expLines.push(l));
    } else {
      expLines.push('এই প্রশ্নের জন্য অতিরিক্ত কোনো ব্যাখ্যা নেই।');
    }

    return {
      n: idx + 1,
      q: q.question || '',
      img: q.imageUrl,
      o: {
        a: q.options[0] || '',
        b: q.options[1] || '',
        c: q.options[2] || '',
        d: q.options[3] || '',
      },
      A: banglaLetters[q.correctAnswerIndex] || 'ক',
      E: expLines,
    };
  });

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.obhyash.com';
  const theme = resolveTheme(exam.category, exam.title);

  const userPrefix = userName ? `পরীক্ষার্থী: ${userName} · ` : '';
  const subtitle = hasUserAnswers
    ? `${userPrefix}প্রাপ্ত নম্বর: ${toBengaliNumber(Number(score).toFixed(2).replace(/\.00$/, ''))} / ${toBengaliNumber(totalPoints)} · সঠিক: ${toBengaliNumber(correctCount)}টি · ভুল: ${toBengaliNumber(wrongCount)}টি · সময়: ${toBengaliNumber(exam.duration_minutes || 30)} মিনিট`
    : `লাইভ পরীক্ষা · মোট প্রশ্ন: ${toBengaliNumber(questions.length)}টি · পূর্ণমান: ${toBengaliNumber(totalPoints)} · সময়: ${toBengaliNumber(exam.duration_minutes || 30)} মিনিট`;

  const settings: GeneratorSettings = {
    theme,
    title: exam.title,
    subTitleLabel: 'ফলাফল ও সমাধান',
    subtitle,
    hasHeader: true,
    headerLeftText: 'অ্যাপ ইনস্টল করো',
    headerLeftUrl: 'https://play.google.com/store/apps/details?id=com.obhyash.app',
    headerRightText: `${exam.title} — সমাধান পত্র`,
    showHeaderLeftIcon: true,
    footerLeftPrefix: 'আনলিমিটেড এক্সাম দাও',
    footerSiteText: 'www.obhyash.com',
    footerLeftUrl: 'https://www.obhyash.com',
    footerLeftSuffix: 'এ',
    footerPagePrefix: 'পৃষ্ঠা',
    useBanglaDigits: true,
    pageOffset: 0,
    density: 'balanced',
    balanceColumns: true,
    standaloneToolbar: true,
    autoPrint: true,
    baseUrl: origin,
  };

  const html = generateTemplateHtml(mappedQuestions, settings);
  printOrOpenHtml(html);
};

// ─── 3. Download OMR Sheet ───────────────────────────────────────────────────

export const downloadOMRSheet = (
  details: ExamDetails,
  totalQuestions: number,
) => {
  const w = window.open('', '_blank');
  if (!w) return;

  const qrData = JSON.stringify({
    s: details.subject,
    t: details.examType,
    m: details.totalMarks,
    q: totalQuestions,
  });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Obhyash OMR Sheet</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
        <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; background: #fff; }
            .page { width: 210mm; height: 297mm; position: relative; padding: 12mm; margin: 0 auto; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column; }
            .marker { width: 6mm; height: 6mm; background: black; position: absolute; }
            .tl { top: 10mm; left: 10mm; border-bottom-right-radius: 4px; }
            .tr { top: 10mm; right: 10mm; border-bottom-left-radius: 4px; }
            .bl { bottom: 10mm; left: 10mm; border-top-right-radius: 4px; }
            .br { bottom: 10mm; right: 10mm; border-top-left-radius: 4px; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; margin-top: 10px; }
            .title-block h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; line-height: 1; letter-spacing: 1px; color: #000; }
            .title-block p { font-size: 10px; font-weight: 600; margin: 4px 0 0; color: #333; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; }
            .omr-badge { border: 2px solid #000; padding: 2px 8px; border-radius: 4px; font-weight: 900; font-size: 16px; letter-spacing: 1px; }
            .top-section { display: flex; gap: 15px; margin-bottom: 20px; height: 160px; }
            .info-box { flex: 1; border: 1.5px solid #000; border-radius: 6px; padding: 12px; display: flex; flex-direction: column; justify-content: space-evenly; }
            .field-row { display: flex; align-items: flex-end; }
            .field-label { font-size: 10px; font-weight: 700; width: 60px; text-transform: uppercase; color: #000; padding-bottom: 2px; }
            .field-line { flex: 1; border-bottom: 1.5px dashed #aaa; height: 16px; margin-left: 5px; }
            .instructions-box { width: 38%; border: 1.5px solid #000; border-radius: 6px; padding: 10px 12px; background: #f8f8f8; display: flex; flex-direction: column; }
            .inst-header { font-size: 10px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 5px; }
            .inst-list { margin: 0; padding-left: 12px; font-size: 9px; line-height: 1.4; color: #222; font-weight: 500; }
            .inst-list li { margin-bottom: 2px; }
            .example-area { margin-top: auto; display: flex; justify-content: space-between; padding-top: 6px; }
            .ex-label { font-size: 8px; font-weight: 800; margin-bottom: 3px; display: block; }
            .bubbles-row { display: flex; gap: 4px; }
            .bubble-ex { width: 14px; height: 14px; border: 1px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 7px; background: #fff; }
            .bubble-ex.fill { background: #000; border-color: #000; }
            .bubble-ex.wrong { position: relative; overflow: hidden; }
            .bubble-ex.wrong::after { content: '×'; position: absolute; font-size: 12px; font-weight: bold; line-height: 0; }
            .sheet-body { border: 2px solid #000; padding: 15px 10px; border-radius: 6px; display: flex; justify-content: space-between; position: relative; flex: 1; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 60px; font-weight: 900; color: rgba(0,0,0,0.03); pointer-events: none; z-index: 0; white-space: nowrap; }
            .column { width: 23%; z-index: 1; display: flex; flex-direction: column; }
            .row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; height: 20px; }
            .q-num { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 800; width: 22px; text-align: right; color: #000; }
            .options { display: flex; gap: 6px; }
            .opt-bubble { width: 18px; height: 18px; border: 1.2px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; color: #444; font-family: 'Inter', sans-serif; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px; padding-top: 5px; }
            .sig-block { text-align: center; width: 30%; }
            .sig-line { border-top: 1.5px solid #000; margin-bottom: 4px; }
            .sig-text { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #333; }
            .qr-block { border: 1.5px solid #000; padding: 2px; border-radius: 4px; display: flex; flex-direction: column; align-items: center; }
            .scan-text { font-size: 8px; font-weight: 800; font-family: 'JetBrains Mono'; margin-top: 2px; }
            ${dlBarStyles}
        </style>
    </head>
    <body>
        ${dlToolbar('PDF ডাউনলোড করো')}
        <div class="page">
            <div class="marker tl"></div>
            <div class="marker tr"></div>
            <div class="marker bl"></div>
            <div class="marker br"></div>
            <div class="header">
                <div class="title-block">
                    <h1>Obhyash Answer Sheet</h1>
                    <p>EXAM: <span style="text-decoration: underline;">${details.subject.substring(0, 25)}</span> &nbsp;|&nbsp; TYPE: ${details.examType}</p>
                </div>
                <div class="omr-badge">OMR</div>
            </div>
            <div class="top-section">
                <div class="info-box">
                    <div class="field-row"><label class="field-label">NAME</label><div class="field-line"></div></div>
                    <div class="field-row"><label class="field-label">MOBILE</label><div class="field-line"></div></div>
                    <div class="field-row"><label class="field-label">DATE</label><div class="field-line"></div></div>
                    <div class="field-row"><label class="field-label">STUDENT ID</label><div class="field-line"></div></div>
                </div>
                <div class="instructions-box">
                    <div class="inst-header">INSTRUCTIONS</div>
                    <ul class="inst-list">
                        <li>Use <strong>Black</strong> or <strong>Blue</strong> ball point pen only.</li>
                        <li>Darken the circle completely.</li>
                        <li>Do not make stray marks on the sheet.</li>
                        <li>Multiple markings are invalid.</li>
                    </ul>
                    <div class="example-area">
                        <div class="ex-group">
                            <span class="ex-label">CORRECT</span>
                            <div class="bubbles-row">
                                <div class="bubble-ex fill"></div>
                                <div class="bubble-ex"></div>
                                <div class="bubble-ex"></div>
                                <div class="bubble-ex"></div>
                            </div>
                        </div>
                        <div class="ex-group">
                            <span class="ex-label">WRONG</span>
                            <div class="bubbles-row">
                                <div class="bubble-ex wrong"></div>
                                <div class="bubble-ex"></div>
                                <div class="bubble-ex"></div>
                                <div class="bubble-ex"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="sheet-body">
                <div class="watermark">OBHYASH</div>
                ${[0, 1, 2, 3]
                  .map(
                    (col) => `
                    <div class="column">
                        ${Array(25)
                          .fill(0)
                          .map((_, r) => {
                            const qNum = col * 25 + r + 1;
                            if (qNum > totalQuestions) return '';
                            return `
                                <div class="row">
                                    <div class="q-num">${qNum}</div>
                                    <div class="options">
                                        <div class="opt-bubble">A</div>
                                        <div class="opt-bubble">B</div>
                                        <div class="opt-bubble">C</div>
                                        <div class="opt-bubble">D</div>
                                    </div>
                                </div>
                            `;
                          })
                          .join('')}
                    </div>
                `,
                  )
                  .join('')}
            </div>
            <div class="footer">
                <div class="sig-block">
                    <div class="sig-line"></div>
                    <div class="sig-text">Student Signature</div>
                </div>
                <div class="qr-block">
                    <img src="${qrUrl}" width="50" height="50" alt="QR" />
                    <span class="scan-text">SCAN TO VERIFY</span>
                </div>
                <div class="sig-block">
                    <div class="sig-line"></div>
                    <div class="sig-text">Invigilator Signature</div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  w.document.write(html);
  w.document.close();
};
