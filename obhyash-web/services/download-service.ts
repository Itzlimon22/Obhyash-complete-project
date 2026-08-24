import { Question, ExamDetails, UserAnswers } from '@/lib/types';
import katex from 'katex';

// --- Bengali Number Conversion Helper ---
const toBengaliNumber = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
};

// --- LaTeX & Markdown Renderer ---
const renderLatex = (text: string): string => {
  if (!text) return '';

  // 1. Display LaTeX: $$...$$
  let result = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return `<div style="overflow-x:auto;margin:3px 0;text-align:left;">${katex.renderToString(math.trim(), { throwOnError: false, displayMode: true })}</div>`;
    } catch {
      return `<span style="font-family:serif;font-style:italic;">$$${math}$$</span>`;
    }
  });

  // 2. Inline LaTeX: $...$
  result = result.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return `<span style="font-family:serif;font-style:italic;">$${math}$</span>`;
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

  /* Solution Box (Only on Solution Paper) */
  .solution-box {
    break-inside: avoid;
    -webkit-column-break-inside: avoid;
    page-break-inside: avoid;
    margin-top: 5px;
    margin-left: 18px;
    padding: 6px 8px;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3px solid #059669;
    border-radius: 3px;
    font-size: 8.5pt;
    line-height: 1.35;
  }

  .sol-row {
    margin-bottom: 2.5px;
  }

  .sol-label {
    font-weight: 700;
    font-size: 8pt;
    color: #374151;
    margin-right: 4px;
    text-transform: uppercase;
  }

  .sol-correct {
    font-weight: 700;
    color: #047857;
  }

  .sol-wrong {
    font-weight: 700;
    color: #b91c1c;
  }

  .sol-skipped {
    color: #d97706;
    font-style: italic;
  }

  .sol-explanation {
    margin-top: 4px;
    border-top: 0.5px solid #e2e8f0;
    padding-top: 3px;
    color: #1f2937;
  }

  @media print {
    body {
      padding-top: 0;
    }
  }

  ${dlBarStyles}
`;

// ─── 1. Download Question Paper (2-Column Exam Paper ONLY) ───────────────────

export const downloadQuestionPaper = (
  details: ExamDetails,
  questions: Question[],
) => {
  const w = window.open('', '_blank');
  if (!w) return;

  const subjectTitle = details.subjectLabel || details.subject;
  const optLetters = ['(ক)', '(খ)', '(গ)', '(ঘ)'];

  const html = `
    <!DOCTYPE html>
    <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <title>${subjectTitle} - প্রশ্নপত্র (Question Paper)</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <style>
          ${sharedExamStyles}
        </style>
      </head>
      <body>
        ${dlToolbar('PDF ডাউনলোড / প্রিন্ট')}
        
        <div class="header-container">
          <div class="header-top">অভ্যাস (Obhyash)</div>
          <div class="header-sub">EXAM PLATFORM · obhyash.com</div>
          <div class="exam-title-badge">${subjectTitle} — ${details.examType}</div>
          <table class="meta-table">
            <tr>
              <td width="33%" align="left">&#9201; সময়: ${toBengaliNumber(details.durationMinutes)} মিনিট</td>
              <td width="34%" align="center">&#128218; অধ্যায়: ${details.chapters}</td>
              <td width="33%" align="right">&#9998; পূর্ণমান: ${toBengaliNumber(details.totalMarks)} (${toBengaliNumber(questions.length)}টি প্রশ্ন)</td>
            </tr>
          </table>
        </div>

        <div class="content-wrapper">
          ${questions
            .map(
              (q, idx) => `
            <div class="question-item">
              <div class="q-header">
                <span class="q-num">${toBengaliNumber(idx + 1)}.</span>
                <span class="q-text">${renderLatex(q.question || '')}</span>
              </div>
              ${renderImage(q.imageUrl)}
              <div style="margin-left:20px">${renderQuestionMeta(q)}</div>
              <ul class="options-list">
                ${q.options
                  .map(
                    (opt, oIdx) => `
                  <li class="option-item ${opt.length > 35 || opt.includes('$$') ? 'full-width' : ''}">
                    <span class="opt-letter">${optLetters[oIdx]}</span>
                    <span class="opt-content">${renderLatex(opt)}</span>
                  </li>
                `,
                  )
                  .join('')}
              </ul>
            </div>
          `,
            )
            .join('')}
        </div>
      </body>
    </html>
  `;

  w.document.write(html);
  w.document.close();
};

// ─── 2. Download Result & Solutions (2-Column with Answers & Explanations) ────

export const downloadResult = (
  details: ExamDetails,
  questions: Question[],
  userAnswers: UserAnswers = {},
) => {
  const w = window.open('', '_blank');
  if (!w) return;

  const subjectTitle = details.subjectLabel || details.subject;
  const optLetters = ['(ক)', '(খ)', '(গ)', '(ঘ)'];

  const score = questions.reduce((acc, q) => {
    const ua = userAnswers[q.id];
    return acc + (ua === q.correctAnswerIndex ? q.points || 1 : 0);
  }, 0);
  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 1), 0);

  const html = `
    <!DOCTYPE html>
    <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <title>${subjectTitle} - উত্তর ও ব্যাখ্যা (Solution Sheet)</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <style>
          ${sharedExamStyles}
        </style>
      </head>
      <body>
        ${dlToolbar('PDF ডাউনলোড / প্রিন্ট')}
        
        <div class="header-container">
          <div class="header-top">অভ্যাস (Obhyash)</div>
          <div class="header-sub">EXAM PLATFORM · SOLUTION & EXPLANATION</div>
          <div class="exam-title-badge">${subjectTitle} — ${details.examType} (সমাধান পত্র)</div>
          <table class="meta-table">
            <tr>
              <td width="30%" align="left">&#9201; সময়: ${toBengaliNumber(details.durationMinutes)} মিনিট</td>
              <td width="40%" align="center">&#128218; অধ্যায়: ${details.chapters}</td>
              <td width="30%" align="right">&#127942; প্রাপ্ত নম্বর: ${toBengaliNumber(score.toFixed(1))} / ${toBengaliNumber(totalPoints)}</td>
            </tr>
          </table>
        </div>

        <div class="content-wrapper">
          ${questions
            .map((q, idx) => {
              const userAns = userAnswers[q.id];
              const isCorrect = userAns === q.correctAnswerIndex;
              const isSkipped = userAns === undefined || userAns === null;
              const userAnsLetter = isSkipped ? 'উত্তর নেই' : optLetters[userAns];
              const correctAnsLetter = optLetters[q.correctAnswerIndex] || optLetters[0];
              const correctOptText = q.options[q.correctAnswerIndex] || '';

              return `
            <div class="question-item">
              <div class="q-header">
                <span class="q-num">${toBengaliNumber(idx + 1)}.</span>
                <span class="q-text">${renderLatex(q.question || '')}</span>
              </div>
              ${renderImage(q.imageUrl)}
              <div style="margin-left:20px">${renderQuestionMeta(q)}</div>
              <ul class="options-list">
                ${q.options
                  .map(
                    (opt, oIdx) => `
                  <li class="option-item ${opt.length > 35 || opt.includes('$$') ? 'full-width' : ''}">
                    <span class="opt-letter">${optLetters[oIdx]}</span>
                    <span class="opt-content">${renderLatex(opt)}</span>
                  </li>
                `,
                  )
                  .join('')}
              </ul>

              <div class="solution-box">
                <div class="sol-row">
                  <span class="sol-label">সঠিক উত্তর:</span>
                  <span class="sol-correct">${correctAnsLetter} ${renderLatex(correctOptText)}</span>
                </div>
                ${
                  userAnswers && Object.keys(userAnswers).length > 0
                    ? `
                <div class="sol-row">
                  <span class="sol-label">তোমার উত্তর:</span>
                  <span class="${isSkipped ? 'sol-skipped' : isCorrect ? 'sol-correct' : 'sol-wrong'}">
                    ${isSkipped ? 'উত্তর নেই' : `${userAnsLetter} ${renderLatex(q.options[userAns] || '')}`}
                  </span>
                </div>
                `
                    : ''
                }
                <div class="sol-explanation">
                  <span class="sol-label">ব্যাখ্যা:</span>
                  <div style="margin-top:2px;">${renderLatex(q.explanation || 'কোনো ব্যাখ্যা দেওয়া নেই।')}</div>
                </div>
              </div>
            </div>
          `;
            })
            .join('')}
        </div>
      </body>
    </html>
  `;

  w.document.write(html);
  w.document.close();
};

export const downloadResultWithExplanations = downloadResult;

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
