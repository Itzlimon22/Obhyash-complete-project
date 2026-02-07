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
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${invoice.id}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-size: 28px; font-weight: bold; color: #4f46e5; }
        .company-info { text-align: right; font-size: 12px; color: #666; }
        .invoice-details { margin-bottom: 30px; display: flex; justify-content: space-between; }
        .bill-to { font-size: 14px; }
        .invoice-meta { text-align: right; }
        .invoice-meta h1 { margin: 0; font-size: 24px; color: #333; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th { background: #f9fafb; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
        .table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
        .total-section { text-align: right; margin-top: 20px; }
        .total-row { display: flex; justify-content: flex-end; gap: 40px; font-size: 14px; padding: 5px 0; }
        .grand-total { font-weight: bold; font-size: 18px; color: #4f46e5; border-top: 2px solid #eee; padding-top: 10px; margin-top: 10px; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .paid { background: #d1fae5; color: #065f46; }
        .pending { background: #fef3c7; color: #92400e; }
        .failed { background: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="header">
          <div class="logo">Zenith / Obhyash</div>
          <div class="company-info">
            Level 5, House 42, Road 7/A<br>
            Dhanmondi, Dhaka - 1209<br>
            support@zenith.edu.bd<br>
            +880 1712 345678
          </div>
        </div>

        <div class="invoice-details">
          <div class="bill-to">
            <strong>Bill To:</strong><br>
            ${user.name}<br>
            ${user.institute}<br>
            Dhaka, Bangladesh
          </div>
          <div class="invoice-meta">
            <h1>INVOICE</h1>
            <p><strong>#${invoice.id}</strong></p>
            <p>Date: ${invoice.date}</p>
            <p>Status: <span class="badge ${invoice.status}">${invoice.status}</span></p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center">Cycle</th>
              <th style="text-align: right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.planName} Subscription</td>
              <td style="text-align: center">Monthly</td>
              <td style="text-align: right">${invoice.currency} ${invoice.amount}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${invoice.currency} ${invoice.amount}</span>
          </div>
          <div class="total-row">
            <span>Tax (0%):</span>
            <span>${invoice.currency} 0.00</span>
          </div>
          <div class="total-row grand-total">
            <span>Total:</span>
            <span>${invoice.currency} ${invoice.amount}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This is a computer-generated invoice and requires no signature.</p>
        </div>
      </div>
      <script>setTimeout(() => { window.print(); }, 800);</script>
    </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
