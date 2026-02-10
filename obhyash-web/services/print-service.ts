import {
  Question,
  ExamDetails,
  UserAnswers,
  Invoice,
  UserProfile,
  SubjectAnalysis,
} from '@/lib/types';
import katex from 'katex';

// --- Helpers ---

const renderLatex = (text: string): string => {
  if (!text) return '';
  const parts = text.split(/(\$[^$]+\$)/g);
  return parts
    .map((part) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        try {
          return katex.renderToString(part.slice(1, -1), {
            throwOnError: false,
            displayMode: false,
          });
        } catch (e) {
          return part;
        }
      }
      return part;
    })
    .join('');
};

// Restored Image Helper (Critical for questions with diagrams)
const renderImage = (imageUrl?: string) => {
  if (!imageUrl) return '';
  return `<div style="margin: 10px 0; text-align: center;">
            <img src="${imageUrl}" style="max-width: 100%; max-height: 200px; border: 1px solid #eee; border-radius: 4px;" alt="Question Image" />
          </div>`;
};

// --- Exported Print Functions ---

export const printQuestionPaper = (
  details: ExamDetails,
  questions: Question[],
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <title>${details.subject} - Question Paper</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&family=Times+New+Roman:ital,wght@0,400;0,700;1,400&display=swap');
          @page { size: A4; margin: 1.5cm; }
          body { font-family: 'Times New Roman', 'Noto Serif Bengali', serif; font-size: 11pt; color: #000; line-height: 1.4; margin: 0; }
          .header-container { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .institution-name { font-size: 22pt; font-weight: bold; text-transform: uppercase; margin: 0; letter-spacing: 1px; }
          .exam-title { font-size: 14pt; font-weight: bold; margin: 5px 0 15px 0; border: 1px solid #000; display: inline-block; padding: 5px 20px; border-radius: 4px; }
          .meta-table { width: 100%; margin-top: 15px; border-collapse: collapse; }
          .meta-table td { padding: 4px 0; font-weight: bold; font-size: 10pt; vertical-align: bottom; }
          .content-wrapper { column-count: 2; column-gap: 40px; column-rule: 1px solid #ccc; }
          .question-item { break-inside: avoid; margin-bottom: 12px; }
          .q-header { display: flex; align-items: baseline; font-weight: bold; margin-bottom: 4px; }
          .options-list { list-style-type: none; padding: 0; margin: 0 0 0 25px; display: flex; flex-wrap: wrap; }
          .option-item { width: 50%; padding-right: 5px; margin-bottom: 2px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header-container">
          <h1 class="institution-name">Obhyash (অভ্যাস) Exam Platform</h1>
          <div class="exam-title">${details.subject}</div>
          <div style="font-size: 10pt; margin-top: -10px; margin-bottom: 10px;">${details.examType}</div>
          <table class="meta-table">
            <tr>
              <td width="35%">Time: ${details.durationMinutes} Minutes</td>
              <td width="30%" align="center">Chapter: ${details.chapters}</td>
              <td width="35%" align="right">Full Marks: ${details.totalMarks}</td>
            </tr>
          </table>
        </div>
        <div class="content-wrapper">
          ${questions
            .map(
              (q, idx) => `
            <div class="question-item">
              <div class="q-header">
                <span style="min-width:25px">${idx + 1}.</span>
                    <span>${renderLatex(q.question || '')}</span>
                    ${renderImage(q.imageUrl)} 
                </div>
                <span style="font-size:9pt;margin-left:5px">[${q.points}]</span>
              </div>
              <ul class="options-list">
                ${q.options
                  .map(
                    (opt, oIdx) => `
                  <li class="option-item">
                    <span style="font-weight:bold;margin-right:5px">(${['a', 'b', 'c', 'd'][oIdx]})</span>
                    <span>${renderLatex(opt)}</span>
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
        <script>setTimeout(() => { window.print(); }, 800);</script>
      </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const printOMRSheet = (details: ExamDetails, totalQuestions: number) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  const qrData = JSON.stringify({
    s: details.subject,
    t: details.examType,
    m: details.totalMarks,
    q: totalQuestions,
  });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  const htmlContent = `
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
            
            /* Corner Markers (Fiducials) - Critical for Scanning */
            .marker { width: 6mm; height: 6mm; background: black; position: absolute; }
            .tl { top: 10mm; left: 10mm; border-bottom-right-radius: 4px; }
            .tr { top: 10mm; right: 10mm; border-bottom-left-radius: 4px; }
            .bl { bottom: 10mm; left: 10mm; border-top-right-radius: 4px; }
            .br { bottom: 10mm; right: 10mm; border-top-left-radius: 4px; }

            /* Header */
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; margin-top: 10px; }
            .title-block h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; line-height: 1; letter-spacing: 1px; color: #000; }
            .title-block p { font-size: 10px; font-weight: 600; margin: 4px 0 0; color: #333; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; }
            .omr-badge { border: 2px solid #000; padding: 2px 8px; border-radius: 4px; font-weight: 900; font-size: 16px; letter-spacing: 1px; }

            /* Top Section: Info & Instructions */
            .top-section { display: flex; gap: 15px; margin-bottom: 20px; height: 160px; }
            
            /* Student Info (Left) */
            .info-box { flex: 1; border: 1.5px solid #000; border-radius: 6px; padding: 12px; display: flex; flex-direction: column; justify-content: space-evenly; }
            .field-row { display: flex; align-items: flex-end; }
            .field-label { font-size: 10px; font-weight: 700; width: 60px; text-transform: uppercase; color: #000; padding-bottom: 2px; }
            .field-line { flex: 1; border-bottom: 1.5px dashed #aaa; height: 16px; margin-left: 5px; }

            /* Instructions (Right) */
            .instructions-box { width: 38%; border: 1.5px solid #000; border-radius: 6px; padding: 10px 12px; background: #f8f8f8; display: flex; flex-direction: column; }
            .inst-header { font-size: 10px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 5px; }
            .inst-list { margin: 0; padding-left: 12px; font-size: 9px; line-height: 1.4; color: #222; font-weight: 500; }
            .inst-list li { margin-bottom: 2px; }
            
            /* Bubbling Example */
            .example-area { margin-top: auto; display: flex; justify-content: space-between; padding-top: 6px; }
            .ex-label { font-size: 8px; font-weight: 800; margin-bottom: 3px; display: block; }
            .bubbles-row { display: flex; gap: 4px; }
            .bubble-ex { width: 14px; height: 14px; border: 1px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 7px; background: #fff; }
            .bubble-ex.fill { background: #000; border-color: #000; }
            .bubble-ex.wrong { position: relative; overflow: hidden; }
            .bubble-ex.wrong::after { content: '×'; position: absolute; font-size: 12px; font-weight: bold; line-height: 0; }

            /* Answer Sheet Body */
            .sheet-body { 
                border: 2px solid #000; 
                padding: 15px 10px; 
                border-radius: 6px; 
                display: flex; 
                justify-content: space-between; 
                position: relative;
                flex: 1;
            }
            .watermark {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 60px; font-weight: 900; color: rgba(0,0,0,0.03); pointer-events: none; z-index: 0; white-space: nowrap;
            }

            .column { width: 23%; z-index: 1; display: flex; flex-direction: column; }
            .row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; height: 20px; }
            .q-num { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 800; width: 22px; text-align: right; color: #000; }
            .options { display: flex; gap: 6px; }
            .opt-bubble { 
                width: 18px; height: 18px; 
                border: 1.2px solid #000; 
                border-radius: 50%; 
                display: flex; align-items: center; justify-content: center; 
                font-size: 8px; font-weight: 700; 
                color: #444; 
                font-family: 'Inter', sans-serif;
            }
            
            /* Footer */
            .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px; padding-top: 5px; }
            .sig-block { text-align: center; width: 30%; }
            .sig-line { border-top: 1.5px solid #000; margin-bottom: 4px; }
            .sig-text { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #333; }
            .qr-block { border: 1.5px solid #000; padding: 2px; border-radius: 4px; display: flex; flex-direction: column; align-items: center; }
            .scan-text { font-size: 8px; font-weight: 800; font-family: 'JetBrains Mono'; margin-top: 2px; }
            
        </style>
    </head>
    <body>
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
                    <div class="field-row">
                        <label class="field-label">NAME</label>
                        <div class="field-line"></div>
                    </div>
                    <div class="field-row">
                        <label class="field-label">MOBILE</label>
                        <div class="field-line"></div>
                    </div>
                    <div class="field-row">
                        <label class="field-label">DATE</label>
                        <div class="field-line"></div>
                    </div>
                    <div class="field-row">
                        <label class="field-label">STUDENT ID</label>
                        <div class="field-line"></div>
                    </div>
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
        <script>window.onload = () => setTimeout(() => window.print(), 800);</script>
    </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const printResultWithExplanations = (
  details: ExamDetails,
  questions: Question[],
  userAnswers: UserAnswers,
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Calculate score for the report
  const score = Object.values(userAnswers).filter(
    (ua, idx) => questions[idx] && questions[idx].correctAnswerIndex === ua,
  ).length;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <title>${details.subject} - Solution & Explanation</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&family=Times+New+Roman:ital,wght@0,400;0,700;1,400&display=swap');
          @page { size: A4; margin: 1.5cm; }
          body { font-family: 'Times New Roman', 'Noto Serif Bengali', serif; font-size: 11pt; color: #000; line-height: 1.4; margin: 0; }
          .header-container { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .institution-name { font-size: 22pt; font-weight: bold; text-transform: uppercase; margin: 0; letter-spacing: 1px; }
          .exam-title { font-size: 14pt; font-weight: bold; margin: 5px 0 15px 0; border: 1px solid #000; display: inline-block; padding: 5px 20px; border-radius: 4px; }
          .meta-table { width: 100%; margin-top: 15px; border-collapse: collapse; }
          .meta-table td { padding: 4px 0; font-weight: bold; font-size: 10pt; vertical-align: bottom; }
          .content-wrapper { column-count: 2; column-gap: 40px; column-rule: 1px solid #ccc; }
          .question-item { break-inside: avoid; margin-bottom: 20px; border-bottom: 1px dashed #ddd; padding-bottom: 15px; }
          .q-header { display: flex; align-items: baseline; font-weight: bold; margin-bottom: 4px; }
          .options-list { list-style-type: none; padding: 0; margin: 0 0 0 25px; display: flex; flex-wrap: wrap; }
          .option-item { width: 50%; padding-right: 5px; margin-bottom: 2px; font-size: 10pt; }
          .solution-box { margin-top: 8px; padding: 8px; background-color: #f8f9fa; border-left: 3px solid #333; font-size: 9pt; page-break-inside: avoid; }
          .sol-row { margin-bottom: 3px; }
          .label { font-weight: bold; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; color: #444; }
          .correct { color: #15803d; font-weight: bold; }
          .wrong { color: #b91c1c; font-weight: bold; }
          .skipped { color: #d97706; font-style: italic; }
          .exp-text { font-style: italic; color: #333; display: block; margin-top: 2px; }
          @media print { button { display: none; } body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header-container">
          <h1 class="institution-name">Obhyash (অভ্যাস) Exam Platform</h1>
          <div class="exam-title">${details.subject} - Solution</div>
          <div style="font-size: 10pt; margin-top: -10px; margin-bottom: 10px;">${details.examType}</div>
          <table class="meta-table">
            <tr>
              <td width="30%">Time: ${details.durationMinutes} Minutes</td>
              <td width="40%" align="center">Chapter: ${details.chapters}</td>
              <td width="30%" align="right">Your Score: ${score} / ${questions.length}</td>
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
                ? 'Skipped'
                : ['a', 'b', 'c', 'd'][userAns];
              const correctAnsLabel = ['a', 'b', 'c', 'd'][
                q.correctAnswerIndex
              ];

              return `
            <div class="question-item">
              <div class="q-header">
                <span style="min-width:25px">${idx + 1}.</span>
                    <span>${renderLatex(q.question || '')}</span>
                    ${renderImage(q.imageUrl)} 
                </div>
                <span style="font-size:9pt;margin-left:5px">[${q.points}]</span>
              </div>
              <ul class="options-list">
                ${q.options
                  .map(
                    (opt, oIdx) => `
                  <li class="option-item">
                    <span style="font-weight:bold;margin-right:5px">(${['a', 'b', 'c', 'd'][oIdx]})</span>
                    <span>${renderLatex(opt)}</span>
                  </li>
                `,
                  )
                  .join('')}
              </ul>
              <div class="solution-box">
                 <div class="sol-row">
                    <span class="label">Correct Answer:</span> <span class="correct">(${correctAnsLabel}) ${renderLatex(q.options[q.correctAnswerIndex])}</span>
                 </div>
                 <div class="sol-row">
                    <span class="label">Your Answer:</span> 
                    <span class="${isSkipped ? 'skipped' : isCorrect ? 'correct' : 'wrong'}">
                        ${isSkipped ? 'Skipped' : `(${userAnsLabel}) ${renderLatex(q.options[userAns])}`}
                    </span>
                 </div>
                 <div style="margin-top:6px;">
                    <span class="label">Explanation:</span> 
                    <span class="exp-text">${renderLatex(q.explanation || 'No explanation provided.')}</span>
                 </div>
              </div>
            </div>
          `;
            })
            .join('')}
        </div>
        <script>setTimeout(() => { window.print(); }, 800);</script>
      </body>
    </html>
   `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const printSubjectReport = (subject: string, stats: SubjectAnalysis) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <title>${subject} - Performance Report</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <style>
          body { font-family: 'Times New Roman', sans-serif; padding: 40px; color: #333; }
          h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; background: #f8fafc; text-align: center; }
          .stat-val { font-size: 24px; font-weight: bold; color: #0f172a; }
          .stat-label { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 5px; display: block; }
          .mistake-list { margin-top: 30px; }
          .mistake-item { margin-bottom: 20px; page-break-inside: avoid; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
          .meta { font-size: 12px; color: #94a3b8; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <h1>${subject} - Performance Report</h1>
        
        <div class="stats-grid">
           <div class="stat-card">
              <span class="stat-label">Accuracy</span>
              <div class="stat-val">${stats.accuracy}%</div>
           </div>
           <div class="stat-card">
              <span class="stat-label">Total Questions</span>
              <div class="stat-val">${stats.totalQuestions}</div>
           </div>
           <div class="stat-card">
              <span class="stat-label">Mistakes</span>
              <div class="stat-val">${stats.wrong}</div>
           </div>
        </div>

        <h2>Mistakes Log</h2>
        <div class="mistake-list">
           ${stats.mistakes
             .map(
               (m) => `
              <div class="mistake-item">
                 <div class="meta">${new Date(m.examDate).toLocaleDateString()} - ${m.examName}</div>
                 <div class="q-content">
                    <p><strong>Q:</strong> ${renderLatex(m.question.question || '')}</p>
                    ${renderImage(m.question.imageUrl)}
                 </div>
                 <p style="color:red">Your Answer: ${renderLatex(m.question.options[m.userAns])}</p>
                 <p style="color:green">Correct Answer: ${renderLatex(m.question.options[m.correctAns])}</p>
                 <p style="font-size:12px; font-style:italic; margin-top:5px; color:#475569">Exp: ${renderLatex(m.question.explanation || '')}</p>
              </div>
           `,
             )
             .join('')}
        </div>
        <script>setTimeout(() => { window.print(); }, 1000);</script>
      </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const printInvoice = (invoice: Invoice, user: UserProfile) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Payment Slip - ${invoice.id}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; background: #f3f4f6; }
        .invoice-container { max-width: 800px; margin: auto; background: #fff; padding: 0; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); position: relative; overflow: hidden; }
        
        /* Decorative Border */
        .border-pattern { height: 8px; background: repeating-linear-gradient(45deg, #059669, #059669 10px, #047857 10px, #047857 20px); }
        
        /* Content Area */
        .content { padding: 40px 50px; position: relative; }

        /* Header */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
        .brand h1 { font-family: 'Cinzel', serif; font-size: 32px; font-weight: 700; color: #059669; margin: 0; letter-spacing: 1px; }
        .brand p { margin: 5px 0 0; font-size: 12px; color: #6b7280; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; }
        
        .invoice-meta { text-align: right; }
        .invoice-title { font-size: 36px; font-weight: 800; text-transform: uppercase; color: #e5e7eb; margin: 0; line-height: 0.8; }
        .invoice-subtitle { font-size: 14px; font-weight: 600; color: #374151; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
        .ref-number { font-family: 'Courier New', monospace; font-size: 14px; color: #6b7280; margin-top: 5px; }

        /* Two Column Layout */
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        
        .info-group h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 1px; margin: 0 0 10px 0; }
        .info-card { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
        .info-row:last-child { margin-bottom: 0; }
        .info-label { color: #6b7280; font-weight: 500; }
        .info-value { font-weight: 600; color: #111827; text-align: right; }

        .bill-to-info div { font-size: 14px; font-weight: 600; color: #111827; }
        .bill-to-info p { font-size: 13px; color: #4b5563; margin: 2px 0 0; }

        /* Amount Section */
        .amount-box { background: #ecfdf5; border: 1px solid #059669; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 40px; }
        .amount-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #047857; letter-spacing: 1px; }
        .amount-value { font-size: 32px; font-weight: 800; color: #059669; margin: 5px 0; }
        .amount-currency { font-size: 16px; font-weight: 600; vertical-align: super; }

        /* Stamp */
        .stamp { 
            position: absolute; 
            top: 40%; 
            right: 80px; 
            border: 4px solid #059669; 
            color: #059669; 
            font-size: 24px; 
            font-weight: 900; 
            text-transform: uppercase; 
            padding: 10px 20px; 
            transform: rotate(-15deg);
            border-radius: 8px;
            opacity: 0.15;
            z-index: 0;
            pointer-events: none;
            letter-spacing: 2px;
        }

        /* Footer */
        .footer { text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; }
        .footer p { margin: 2px 0; }

        /* Print Specifics */
        @media print {
            body { padding: 0; background: #fff; }
            .invoice-container { box-shadow: none; width: 100%; max-width: none; }
            .amount-box { -webkit-print-color-adjust: exact; }
            .border-pattern { -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="border-pattern"></div>
        <div class="content">
            <!-- Valid Stamp -->
            ${invoice.status === 'valid' || invoice.status === 'paid' ? '<div class="stamp">PAID & VALID</div>' : ''}

            <div class="header">
                <div class="brand">
                    <h1>OBHYASH</h1>
                    <p>Academic Excellence</p>
                </div>
                <div class="invoice-meta">
                    <div class="invoice-title">RECEIPT</div>
                    <div class="invoice-subtitle">Payment Slip</div>
                    <div class="ref-number">REF: ${invoice.id.toUpperCase().substring(0, 12)}</div>
                </div>
            </div>

            <div class="info-grid">
                <!-- User Info -->
                <div class="info-group">
                    <h3>Billed To</h3>
                    <div class="bill-to-info">
                        <div>${user.name}</div>
                        <p>${user.institute || 'Institute Not Provided'}</p>
                        <p>${user.phone || ''}</p>
                    </div>
                </div>

                <!-- Payment Details -->
                <div class="info-group">
                    <h3>Payment Details</h3>
                    <div class="info-card">
                        <div class="info-row">
                            <span class="info-label">Date</span>
                            <span class="info-value">${invoice.date}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Method</span>
                            <span class="info-value" style="text-transform: capitalize;">${invoice.paymentMethod || 'Manual'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">TrxID</span>
                            <span class="info-value" style="font-family: monospace;">${invoice.transactionId || 'N/A'}</span>
                        </div>
                        ${
                          invoice.senderNumber
                            ? `
                        <div class="info-row">
                            <span class="info-label">Sender No.</span>
                            <span class="info-value" style="font-family: monospace;">${invoice.senderNumber}</span>
                        </div>`
                            : ''
                        }
                    </div>
                </div>
            </div>

            <!-- Plan Details -->
            <div class="info-group" style="margin-bottom: 30px;">
                <h3>Subscription Plan</h3>
                <div class="info-card" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 700; color: #111827;">${invoice.planName}</div>
                        <div style="font-size: 12px; color: #6b7280;">Professional Access</div>
                    </div>
                    <div style="font-weight: 700; color: #111827;">
                        ${invoice.currency} ${invoice.amount}
                    </div>
                </div>
            </div>

            <div class="amount-box">
                <div class="amount-label">Total Amount Paid</div>
                <div class="amount-value"><span class="amount-currency">${invoice.currency}</span> ${invoice.amount}</div>
                <div style="font-size: 12px; color: #059669; font-weight: 500;">Thank you for your payment</div>
            </div>

            <div class="footer">
                <p><strong>Zenith / Obhyash Education Platform</strong></p>
                <p>Level 5, House 42, Road 7/A, Dhanmondi, Dhaka - 1209</p>
                <p>support@obhyash.com | +880 1712 345678</p>
                <p style="margin-top: 10px; font-style: italic;">This is a computer-generated receipt.</p>
            </div>
        </div>
        <div class="border-pattern"></div>
      </div>
      <script>
        window.onload = () => {
             setTimeout(() => { window.print(); }, 800);
        };
      </script>
    </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
