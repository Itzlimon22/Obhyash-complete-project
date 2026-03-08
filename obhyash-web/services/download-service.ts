import { Question, ExamDetails, UserAnswers } from '@/lib/types';
import katex from 'katex';

// --- Helpers (shared with print-service, duplicated to keep services independent) ---

const renderLatex = (text: string): string => {
  if (!text) return '';

  let result = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return `<div style="overflow-x:auto;margin:4px 0;text-align:left;">${katex.renderToString(math.trim(), { throwOnError: false, displayMode: true })}</div>`;
    } catch {
      return `$$${math}$$`;
    }
  });

  result = result.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return `$${math}$`;
    }
  });

  result = result
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
    .replace(
      /`([^`\n]+?)`/g,
      '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:0.9em;">$1</code>',
    )
    .replace(/\n\n+/g, '<br><br>')
    .replace(/\n/g, '<br>');

  return result;
};

const renderImage = (imageUrl?: string) => {
  if (!imageUrl) return '';
  return `<div style="margin: 10px 0; text-align: center;">
            <img src="${imageUrl}" style="max-width: 100%; max-height: 200px; border: 1px solid #eee; border-radius: 4px;" alt="Question Image" />
          </div>`;
};

const renderQuestionMeta = (q: Question): string => {
  const years =
    q.years && q.years.length > 0 ? q.years : q.year ? [q.year] : [];
  const institutes =
    q.institutes && q.institutes.length > 0
      ? q.institutes
      : q.institute
        ? [q.institute]
        : [];
  if (years.length === 0 && institutes.length === 0) return '';
  const combined = [institutes.join(', '), years.join(', ')]
    .filter(Boolean)
    .join(' ');
  return `<div style="font-size: 8pt; color: #666; font-style: italic; margin-bottom: 5px; display: block;">[${combined}]</div>`;
};

/** Shared floating toolbar injected into every download page */
const dlToolbar = (label: string) => `
  <div class="dl-bar">
    <button class="dl-btn" onclick="window.print()">&#11015; ${label}</button>
    <button class="dl-close" onclick="window.close()">&#10005;</button>
  </div>
`;

const dlBarStyles = `
  .dl-bar { position: fixed; top: 14px; right: 18px; z-index: 99999; display: flex; gap: 8px; }
  .dl-btn { background: #059669; color: #fff; border: none; padding: 9px 20px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 8px rgba(5,150,105,0.4); }
  .dl-btn:hover { background: #047857; }
  .dl-close { background: #6b7280; color: #fff; border: none; padding: 9px 13px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
  .dl-close:hover { background: #4b5563; }
  @media print { .dl-bar { display: none !important; } }
`;

// ─── Exported Download Functions ───────────────────────────────────────────────

export const downloadQuestionPaper = (
  details: ExamDetails,
  questions: Question[],
) => {
  const w = window.open('', '_blank');
  if (!w) return;

  const html = `
    <!DOCTYPE html>
    <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <title>${details.subject} - Question Paper</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');
          @page { size: A4; margin: 1.2cm 1cm; }
          body { font-family: 'Noto Serif Bengali', 'Times New Roman', serif; font-size: 10.5pt; color: #000; line-height: 1.4; margin: 0; padding: 0; }
          .header-container { text-align: center; margin-bottom: 14px; margin-top: 60px; }
          .header-top-bar { background: #000; color: #fff; padding: 6px 12px; }
          .institution-name { font-size: 16pt; font-weight: 800; letter-spacing: 0.5px; margin: 0; font-family: 'Noto Serif Bengali', serif; }
          .institution-sub { font-size: 8.5pt; font-weight: 400; letter-spacing: 1px; opacity: 0.85; margin-top: 1px; }
          .header-body { border-left: 2.5px solid #000; border-right: 2.5px solid #000; border-bottom: 2.5px solid #000; padding: 8px 14px 10px; }
          .subject-title { font-size: 15pt; font-weight: 800; margin: 6px 0 2px; letter-spacing: 0.3px; }
          .exam-type-badge { display: inline-block; border: 1.5px solid #000; padding: 2px 12px; border-radius: 3px; font-size: 9pt; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; }
          .meta-table { width: 100%; margin-top: 6px; border-collapse: collapse; border-top: 1px solid #ccc; padding-top: 5px; }
          .meta-table td { padding: 4px 0 0; font-weight: 700; font-size: 9.5pt; vertical-align: bottom; }
          .content-wrapper { column-count: 2; column-gap: 30px; column-rule: 0.5px solid #000; }
          .question-item { break-inside: avoid; margin-bottom: 15px; padding-bottom: 5px; overflow-wrap: break-word; word-break: break-word; }
          .q-header { display: flex; align-items: flex-start; font-weight: bold; margin-bottom: 4px; }
          .q-num { min-width: 22px; padding-top: 1px; flex-shrink: 0; }
          .options-list { list-style-type: none; padding: 0; margin: 0 0 0 22px; display: flex; flex-wrap: wrap; }
          .option-item { width: 50%; min-width: 120px; padding-right: 4px; margin-bottom: 2px; font-size: 9.5pt; overflow-wrap: break-word; }
          .option-item:has(.katex-display) { width: 100%; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          ${dlBarStyles}
        </style>
      </head>
      <body>
        ${dlToolbar('PDF ডাউনলোড করুন')}
        <div class="header-container">
          <div class="header-top-bar">
            <div class="institution-name">অভ্যাস (Obhyash)</div>
            <div class="institution-sub">EXAM PLATFORM &nbsp;·&nbsp; obhyash.com</div>
          </div>
          <div class="header-body">
            <div class="subject-title">${details.subjectLabel}</div>
            <div class="exam-type-badge">${details.examType}</div>
            <table class="meta-table">
              <tr>
                <td width="33%">&#128336; সময়: ${details.durationMinutes} মিনিট</td>
                <td width="34%" align="center">&#128218; অধ্যায়: ${details.chapters}</td>
                <td width="33%" align="right">&#9998; পূর্ণমান: ${details.totalMarks}</td>
              </tr>
            </table>
          </div>
        </div>
        <div class="content-wrapper">
          ${questions
            .map(
              (q, idx) => `
            <div class="question-item">
              <div class="q-header">
                <span class="q-num">${idx + 1}.</span>
                <span style="flex:1">${renderLatex(q.question || '')}</span>
              </div>
              ${renderImage(q.imageUrl)}
              <div style="margin-left:22px">${renderQuestionMeta(q)}</div>
              <ul class="options-list">
                ${q.options
                  .map(
                    (opt, oIdx) => `
                  <li class="option-item">
                    <span style="font-weight:bold;margin-right:4px">(${['ক', 'খ', 'গ', 'ঘ'][oIdx]})</span><span>${renderLatex(opt)}</span>
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
        ${dlToolbar('PDF ডাউনলোড করুন')}
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
                          .map((_, row) => {
                            const qNum = col * 25 + row + 1;
                            const opacity = qNum <= totalQuestions ? 1 : 0.15;
                            return `
                              <div class="row" style="opacity: ${opacity}">
                                  <span class="q-num">${qNum}</span>
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
                    <div class="sig-text">Signature of Candidate</div>
                </div>
                <div class="qr-block">
                    <img src="${qrUrl}" width="50" height="50" style="display:block;" />
                    <span class="scan-text">SCAN ME</span>
                </div>
                <div class="sig-block">
                    <div class="sig-line"></div>
                    <div class="sig-text">Signature of Invigilator</div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  w.document.write(html);
  w.document.close();
};

export const downloadResult = (
  details: ExamDetails,
  questions: Question[],
  userAnswers: UserAnswers,
) => {
  const w = window.open('', '_blank');
  if (!w) return;

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
        <title>${details.subject} - Solution & Explanation</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&family=Times+New+Roman:ital,wght@0,400;0,700;1,400&display=swap');
          @page { size: A4; margin: 1cm; }
          body { font-family: 'Times New Roman', 'Noto Serif Bengali', serif; font-size: 10pt; color: #000; line-height: 1.3; margin: 0; padding: 0.5cm; padding-top: 70px; }
          .header-container { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; }
          .institution-name { font-size: 20pt; font-weight: bold; text-transform: uppercase; margin: 0; letter-spacing: 1px; }
          .exam-title { font-size: 13pt; font-weight: bold; margin: 4px 0 10px 0; border: 1px solid #000; display: inline-block; padding: 4px 15px; border-radius: 4px; }
          .meta-table { width: 100%; margin-top: 10px; border-collapse: collapse; }
          .meta-table td { padding: 2px 0; font-weight: bold; font-size: 9pt; vertical-align: bottom; }
          .content-wrapper { column-count: 2; column-gap: 30px; column-rule: 0.5px solid #000; }
          .question-item { break-inside: avoid; margin-bottom: 18px; border-bottom: 0.5px dashed #ccc; padding-bottom: 10px; overflow-wrap: break-word; word-break: break-word; }
          .q-header { display: flex; align-items: flex-start; font-weight: bold; margin-bottom: 4px; }
          .q-num { min-width: 22px; padding-top: 1px; flex-shrink: 0; }
          .options-list { list-style-type: none; padding: 0; margin: 4px 0 4px 22px; display: flex; flex-wrap: wrap; }
          .option-item { width: 50%; min-width: 120px; padding-right: 4px; margin-bottom: 2px; font-size: 9pt; overflow-wrap: break-word; }
          .option-item:has(.katex-display) { width: 100%; }
          .solution-box { break-inside: avoid; margin-top: 6px; padding: 8px 10px; background-color: #f9f9f9; border-left: 3px solid #555; font-size: 8.5pt; border-radius: 0 4px 4px 0; }
          .sol-row { margin-bottom: 3px; }
          .label { font-weight: bold; font-size: 8pt; text-transform: uppercase; color: #444; margin-right: 4px; }
          .correct { color: #15803d; font-weight: bold; }
          .wrong { color: #b91c1c; font-weight: bold; }
          .skipped { color: #d97706; font-style: italic; }
          .exp-text { color: #333; display: block; margin-top: 4px; line-height: 1.4; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding-top: 0.5cm; } }
          ${dlBarStyles}
        </style>
      </head>
      <body>
        ${dlToolbar('PDF ডাউনলোড করুন')}
        <div class="header-container">
          <h1 class="institution-name">Obhyash (অভ্যাস) Exam Platform</h1>
          <div class="exam-title">${details.subject} - Solution</div>
          <div style="font-size: 9pt; margin-top: -8px; margin-bottom: 8px;">${details.examType}</div>
          <table class="meta-table">
            <tr>
              <td width="30%">সময়: ${details.durationMinutes} মিনিট</td>
              <td width="40%" align="center">অধ্যায়: ${details.chapters}</td>
              <td width="30%" align="right">নম্বর: ${score.toFixed(1)} / ${totalPoints}</td>
            </tr>
          </table>
        </div>
        <div class="content-wrapper">
          ${questions
            .map((q, idx) => {
              const userAns = userAnswers[q.id];
              const isCorrect = userAns === q.correctAnswerIndex;
              const isSkipped = userAns === undefined;
              const userAnsLabel = isSkipped
                ? 'উত্তর নেই'
                : ['ক', 'খ', 'গ', 'ঘ'][userAns];
              const correctAnsLabel = ['ক', 'খ', 'গ', 'ঘ'][
                q.correctAnswerIndex
              ];

              return `
            <div class="question-item">
              <div class="q-header"><span class="q-num">${idx + 1}.</span><span style="flex:1">${renderLatex(q.question || '')}</span></div>
              ${renderImage(q.imageUrl)}
              <div style="margin-left:22px">${renderQuestionMeta(q)}</div>
              <ul class="options-list">
                ${q.options
                  .map(
                    (opt, oIdx) => `
                  <li class="option-item">
                    <span style="font-weight:bold;margin-right:4px">(${['ক', 'খ', 'গ', 'ঘ'][oIdx]})</span><span>${renderLatex(opt)}</span>
                  </li>
                `,
                  )
                  .join('')}
              </ul>
              <div class="solution-box">
                <div class="sol-row">
                  <span class="label">সঠিক উত্তর:</span><span class="correct">(${correctAnsLabel}) ${renderLatex(q.options[q.correctAnswerIndex])}</span>
                </div>
                <div class="sol-row">
                  <span class="label">তোমার উত্তর:</span><span class="${isSkipped ? 'skipped' : isCorrect ? 'correct' : 'wrong'}">${isSkipped ? 'উত্তর নেই' : `(${userAnsLabel}) ${renderLatex(q.options[userAns])}`}</span>
                </div>
                <div style="margin-top:5px;border-top:0.5px solid #ddd;padding-top:4px;">
                  <span class="label">ব্যাখ্যা:</span>
                  <span class="exp-text">${renderLatex(q.explanation || 'কোনো ব্যাখ্যা দেওয়া নেই।')}</span>
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
