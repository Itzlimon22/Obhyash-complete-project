import {
  Question,
  ExamDetails,
  UserAnswers,
  Invoice,
  UserProfile,
  SubjectAnalysis, // ✅ Imported from central types, not local database
} from '@/lib/types';
import katex from 'katex';

// Helper to render LaTeX
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
        } catch {
          return part;
        }
      }
      return part;
    })
    .join('');
};

const LOGO_SVG = `
<svg width="120" height="40" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M30 10C18.9543 10 10 18.9543 10 30C10 41.0457 18.9543 50 30 50C41.0457 50 50 41.0457 50 30C50 18.9543 41.0457 10 30 10Z" fill="white" stroke="#047857" stroke-width="4"/>
  <path d="M30 20C24.4772 20 20 24.4772 20 30C20 35.5228 24.4772 40 30 40C35.5228 40 40 35.5228 40 30C40 24.4772 35.5228 20 30 20Z" fill="#047857"/>
  <path d="M30 40L25 55L30 52L35 55L30 40Z" fill="#047857"/>
  <text x="65" y="42" fill="black" style="font-family: Arial, sans-serif; font-size: 32px; font-weight: 900;">অ<tspan fill="#047857">ভ্যা</tspan>স</text>
</svg>
`;

// Helper to render Image from R2/Supabase
const renderImage = (imageUrl?: string) => {
  if (!imageUrl) return '';
  return `<div style="margin: 10px 0; text-align: center;">
            <img src="${imageUrl}" style="max-width: 100%; max-height: 200px; border: 1px solid #eee; border-radius: 4px;" alt="Question Image" />
          </div>`;
};

/**
 * Generates and prints a question paper for a given exam.
 * Opens a new window with formatted HTML including LaTeX rendering and image support.
 *
 * @param details - The metadata for the exam (subject, type, duration, etc.)
 * @param questions - The list of questions to include in the paper.
 */
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
          <div style="margin-bottom: 10px;">${LOGO_SVG}</div>
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
                <div style="flex:1">
                    <span>${renderLatex(q.question)}</span>
                    ${renderImage(q.imageUrl)} </div>
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
          <div style="margin-bottom: 10px;">${LOGO_SVG}</div>
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
                <div style="flex:1">
                    <span>${renderLatex(q.question)}</span>
                    ${renderImage(q.imageUrl)} </div>
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
               (m: {
                 examDate: string;
                 examName: string;
                 question: Question;
                 userAns: number;
                 correctAns: number;
               }) => `
              <div class="mistake-item">
                 <div class="meta">${new Date(m.examDate).toLocaleDateString()} - ${m.examName}</div>
                 <p><strong>Q:</strong> ${renderLatex(m.question.question)}</p>
                 ${renderImage(m.question.imageUrl)} <p style="color:red">Your Answer: ${renderLatex(m.question.options[m.userAns])}</p>
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
  // ... (existing implementation) ...
};

/**
 * Generates and prints an OMR (Optical Mark Recognition) answer sheet.
 * This replaces the need for an OmrPrintModal by printing directly.
 *
 * @param details - Metadata for the exam (subject, type, etc.)
 * @param totalQuestions - Number of questions to show on the OMR (default: 50)
 */
export const printOMRSheet = (
  details: ExamDetails,
  totalQuestions: number = 50,
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const qrData = encodeURIComponent(
    JSON.stringify({
      s: details.subject,
      t: details.examType,
      m: details.totalMarks,
      q: totalQuestions,
    }),
  );

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>OMR Sheet - ${details.subject || 'Obhyash'}</title>
        <style>
          @page { size: A4; margin: 0; }
          body { 
            width: 210mm; 
            height: 297mm; 
            margin: 0; 
            padding: 12mm; 
            box-sizing: border-box; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            line-height: normal;
            color: black;
            background: white;
            position: relative;
          }
          .marker { position: absolute; width: 6mm; height: 6mm; background-color: black; }
          .top-left { top: 8mm; left: 8mm; border-bottom-right-radius: 1mm; background: black; width: 6mm; height: 6mm; }
          .top-right { top: 8mm; right: 8mm; border-bottom-left-radius: 1mm; background: black; width: 6mm; height: 6mm; }
          .bottom-left { bottom: 8mm; left: 8mm; border-top-right-radius: 1mm; background: black; width: 6mm; height: 6mm; }
          .bottom-right { bottom: 8mm; right: 8mm; border-top-left-radius: 1mm; background: black; width: 6mm; height: 6mm; }

          .header { border-bottom: 2px solid black; padding-bottom: 2mm; margin-bottom: 4mm; display: flex; justify-content: space-between; align-items: flex-end; }
          .header h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: 1px; }
          .header .meta { font-size: 10px; font-weight: bold; margin-top: 2px; text-transform: uppercase; }
          .omr-badge { border: 2px solid black; padding: 1px 4px; border-radius: 4px; font-size: 18px; font-weight: 900; }

          .info-section { display: flex; gap: 4mm; margin-bottom: 5mm; }
          .student-info { flex: 1; border: 1.5px solid black; rounded: 4px; padding: 3mm; display: flex; flex-direction: column; justify-content: space-between; height: 35mm; }
          .info-row { display: flex; align-items: flex-end; margin-bottom: 2mm; }
          .info-label { font-size: 10px; font-weight: bold; width: 50px; text-transform: uppercase; }
          .info-line { flex: 1; border-bottom: 1.5px dashed #666; height: 14px; margin-left: 4px; }

          .instructions { width: 40%; border: 1.5px solid black; padding: 2.5mm; background: #f9f9f9; font-size: 9px; line-height: 1.3; }
          .instr-title { font-weight: 900; text-transform: uppercase; border-bottom: 1px solid black; padding-bottom: 1px; margin-bottom: 2px; display: block; }
          .instr-list { list-style: none; padding: 0; margin: 0; }
          .instr-examples { display: flex; justify-content: space-between; margin-top: 4px; }
          .circle { width: 14px; height: 14px; border: 1.2px solid black; border-radius: 50%; display: inline-block; vertical-align: middle; }
          .circle.filled { background: black; }
          .circle.wrong { text-align: center; font-weight: bold; font-size: 12px; line-height: 14px; }

          .answer-container { flex: 1; border: 2px solid black; padding: 4mm; display: flex; justify-content: space-between; position: relative; min-height: 185mm; }
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; font-weight: 950; color: #f0f0f0; opacity: 0.5; z-index: 0; user-select: none; }
          .column { width: 23%; z-index: 10; }
          .q-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5mm; height: 5mm; }
          .q-num { font-family: monospace; font-size: 11px; font-weight: bold; width: 25px; text-align: right; margin-right: 4px; }
          .options { display: flex; gap: 1.5mm; }
          .option { width: 18px; height: 18px; border: 1.2px solid #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; color: #555; }
          .dimmed { opacity: 0.15; filter: grayscale(1); }

          .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 5mm; }
          .sig-box { width: 30%; text-align: center; }
          .sig-line { border-top: 1.5px solid black; margin-bottom: 2px; }
          .sig-label { font-size: 9px; font-weight: bold; text-transform: uppercase; }
          .qr-box { border: 1.5px solid black; padding: 2px; background: white; text-align: center; }
          .qr-box img { width: 48px; height: 48px; display: block; }
          .qr-label { font-size: 8px; font-weight: 900; font-family: monospace; display: block; margin-top: 2px; }

          @media print {
            body { padding: 8mm; width: auto; height: auto; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .watermark { color: #f5f5f5 !important; }
          }
        </style>
      </head>
      <body>
        <div class="marker top-left"></div>
        <div class="marker top-right"></div>
        <div class="marker bottom-left"></div>
        <div class="marker bottom-right"></div>

        <div class="header">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${LOGO_SVG}
            <div>
              <h1 style="font-size: 18px;">Answer Sheet</h1>
              <div class="meta">
              EXAM: <span style="text-decoration: underline;">${details.subjectLabel || details.subject || 'Practice'}</span>
              &nbsp;|&nbsp; TYPE: ${details.examType || 'Practice Exam'}
            </div>
          </div>
          <div class="omr-badge">OMR</div>
        </div>

        <div class="info-section">
          <div class="student-info">
            <div class="info-row"><span class="info-label">Name</span><div class="info-line"></div></div>
            <div class="info-row"><span class="info-label">Mobile</span><div class="info-line"></div></div>
            <div class="info-row"><span class="info-label">Date</span><div class="info-line"></div></div>
            <div class="info-row"><span class="info-label">Student ID</span><div class="info-line"></div></div>
          </div>
          <div class="instructions">
            <span class="instr-title">Instructions</span>
            <ul class="instr-list">
              <li>• Use <b>Black</b> or <b>Blue</b> pen.</li>
              <li>• Darken circle completely.</li>
              <li>• No stray marks.</li>
              <li>• Multiple marks invalid.</li>
            </ul>
            <div class="instr-examples">
              <div>
                <span style="font-size:8px; font-weight:bold; display:block;">CORRECT</span>
                <div class="circle filled"></div>
                <div class="circle"></div>
              </div>
              <div>
                <span style="font-size:8px; font-weight:bold; display:block;">WRONG</span>
                <div class="circle wrong">×</div>
                <div class="circle"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="answer-container">
          <div class="watermark">OBHYASH</div>
          ${[0, 1, 2, 3]
            .map(
              (col) => `
            <div class="column">
              ${Array.from({ length: 25 })
                .map((_, row) => {
                  const qNum = col * 25 + row + 1;
                  const isVisible = qNum <= totalQuestions;
                  return `
                  <div class="q-row ${!isVisible ? 'dimmed' : ''}">
                    <span class="q-num">${qNum}</span>
                    <div class="options">
                      <div class="option">A</div>
                      <div class="option">B</div>
                      <div class="option">C</div>
                      <div class="option">D</div>
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
          <div class="sig-box">
            <div class="sig-line"></div>
            <span class="sig-label">Candidate Signature</span>
          </div>
          <div class="qr-box">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}" alt="QR Code" />
            <span class="qr-label">SCAN ME</span>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <span class="sig-label">Invigilator Signature</span>
          </div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              // window.close(); // Optional: close widow after printing
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
