import { QuestionItem } from './types';
import { inlineMath, escapeHtml, toBnNumber } from './template';

export interface QuestionPaperSettings {
  category?: string; // e.g. "অধ্যায় ভিত্তিক", "মডেল টেস্ট"
  title: string; // e.g. "এস এস সি মডেল টেস্ট ২০২৬"
  subject: string; // e.g. "বিষয়ঃ গণিত (MCQ)"
  subjectCode?: string; // e.g. "১০১", "২৬৫"
  chapters?: string; // e.g. "১১" or "১ম ও ২য় অধ্যায়"
  durationMinutes: number; // e.g. 40
  totalMarks: number; // e.g. 40
  institutionLogoText?: string; // e.g. "অভ্যাস"
  instructionNote?: string;
  baseUrl?: string;
  autoPrint?: boolean;
}

export function generateQuestionPaperHtml(
  questions: QuestionItem[],
  settings: QuestionPaperSettings
): string {
  const categoryText = settings.category || 'অধ্যায় ভিত্তিক';
  const examTitle = settings.title || 'মডেল টেস্ট';
  const subjectText = settings.subject.startsWith('বিষয়ঃ') || settings.subject.startsWith('বিষয়ঃ')
    ? settings.subject
    : `বিষয়ঃ ${settings.subject} (MCQ)`;
  const durationMinutes = (settings.durationMinutes && settings.durationMinutes > 0)
    ? settings.durationMinutes
    : questions.length;
  const durationText = `${toBnNumber(durationMinutes)} মিনিট`;
  const totalMarks = (settings.totalMarks && settings.totalMarks > 0)
    ? settings.totalMarks
    : questions.length;
  const marksText = toBnNumber(totalMarks);
  const totalQuestionsText = `${toBnNumber(questions.length)}টি`;
  const chaptersText = settings.chapters ? toBnNumber(settings.chapters) : 'সম্পূর্ণ সিলেবাস';
  const logoText = settings.institutionLogoText || 'অভ্যাস';
  const noteText = settings.instructionNote ||
    '[বি:দ্র: সঠিক উত্তরের বৃত্তটি বল পয়েন্ট কলম দ্বারা সম্পূর্ণ ভরাট কর। প্রতিটি প্রশ্নের মান-১]';

  const baseUrlTag = settings.baseUrl
    ? `<base href="${escapeHtml(settings.baseUrl)}/">`
    : '';

  const questionsHtml = questions.map((q, idx) => {
    const qNum = toBnNumber(q.n || idx + 1);
    const stemHtml = inlineMath(q.q || '');
    const imgHtml = q.img
      ? `<div style="text-align:center;margin:4px 0;"><img src="${escapeHtml(q.img)}" style="max-width:90%;max-height:120px;border-radius:3px;" /></div>`
      : '';

    const optA = inlineMath(q.o.a || '');
    const optB = inlineMath(q.o.b || '');
    const optC = inlineMath(q.o.c || '');
    const optD = inlineMath(q.o.d || '');

    const passageHtml = q.passage
      ? `<div class="passage-box">${inlineMath(q.passage)}</div>`
      : '';

    // Determine if options need full width
    const isAnyLong = [q.o.a, q.o.b, q.o.c, q.o.d].some(
      (s) => (s || '').length > 25 || (s || '').includes('$$')
    );

    const colClass = isAnyLong ? 'opt-col full-w' : 'opt-col';

    return `
      <div class="q-block">
        ${passageHtml}
        <div class="q-row">
          <span class="q-num">${qNum}।</span>
          <div class="q-text">${stemHtml}</div>
        </div>
        ${imgHtml}
        <div class="opt-grid">
          <div class="${colClass}"><span class="opt-lbl">(ক)</span><span class="opt-val">${optA}</span></div>
          <div class="${colClass}"><span class="opt-lbl">(খ)</span><span class="opt-val">${optB}</span></div>
          <div class="${colClass}"><span class="opt-lbl">(গ)</span><span class="opt-val">${optC}</span></div>
          <div class="${colClass}"><span class="opt-lbl">(ঘ)</span><span class="opt-val">${optD}</span></div>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>${escapeHtml(examTitle)} — প্রশ্নপত্র</title>
${baseUrlTag}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css" crossorigin="anonymous">
<style>
@font-face {
  font-family: 'Kalpurush';
  src: url('/fonts/Kalpurush.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@page {
  size: 210mm 297mm;
  margin: 10mm 12mm 12mm 12mm;
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background: #ffffff;
}

body {
  font-family: 'Times New Roman', 'Liberation Serif', 'Kalpurush', 'SolaimanLipi', 'Kohinoor Bangla', 'FreeSans', serif;
  font-size: 9.4pt;
  color: #000000;
  line-height: 1.35;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Watermark in page center */
.watermark-bg {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 110pt;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.045);
  pointer-events: none;
  z-index: 9999;
  user-select: none;
  white-space: nowrap;
  letter-spacing: 4px;
  font-family: 'Times New Roman', 'Liberation Serif', 'Kalpurush', 'SolaimanLipi', 'Kohinoor Bangla', 'FreeSans', serif;
}

.passage-box {
  background: #f8fafc;
  border-left: 2.5px solid #475569;
  padding: 3px 6px;
  margin-bottom: 4px;
  font-size: 8.8pt;
  font-weight: 500;
  color: #1e293b;
  border-radius: 2px;
}

/* ── Standard Bangladeshi Exam Header (Exact Replica of Reference) ── */
.header-box {
  position: relative;
  text-align: center;
  margin-bottom: 6px;
  padding-bottom: 2px;
}

.brand-badge {
  position: absolute;
  top: 0;
  right: 0;
  border: 1.2px solid #006A4E;
  background: #E8F5E9;
  color: #006A4E;
  font-size: 8pt;
  font-weight: bold;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.cat-title {
  font-size: 10.5pt;
  font-weight: 700;
  color: #222222;
  margin-bottom: 1px;
}

.main-title {
  font-size: 13pt;
  font-weight: 800;
  color: #000000;
  margin-bottom: 1px;
}

.sub-title {
  font-size: 11pt;
  font-weight: 700;
  color: #000000;
  margin-bottom: 5px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9pt;
  font-weight: 700;
  color: #111111;
  margin-bottom: 4px;
  padding: 0 2px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
}

.student-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 8.8pt;
  font-weight: 600;
  color: #222222;
  margin-bottom: 3px;
  padding: 0 2px;
}

.name-dots {
  display: inline-block;
  flex: 1;
  border-bottom: 1px dotted #333333;
  margin: 0 10px 0 6px;
  height: 11px;
}

.roll-dots {
  display: inline-block;
  width: 140px;
  border-bottom: 1px dotted #333333;
  margin-left: 6px;
  height: 11px;
}

.note-line {
  font-size: 7.8pt;
  font-weight: 500;
  color: #333333;
  text-align: center;
  margin: 3px 0 5px 0;
  letter-spacing: 0.1px;
}

.header-hr {
  border: 0;
  border-top: 1px solid #000000;
  margin: 0 0 9px 0;
}

/* ── 2-Column Newspaper Exam Layout ── */
.columns-wrapper {
  column-count: 2;
  column-gap: 22px;
  column-rule: 0.7px solid #444444;
  -webkit-column-count: 2;
  -webkit-column-gap: 22px;
  -webkit-column-rule: 0.7px solid #444444;
  text-align: justify;
}

.q-block {
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
  margin-bottom: 8.5px;
  overflow-wrap: break-word;
  word-break: break-word;
}

.q-row {
  display: flex;
  align-items: flex-start;
  font-size: 9.4pt;
  line-height: 1.34;
  color: #000000;
}

.q-num {
  font-weight: 700;
  min-width: 20px;
  flex-shrink: 0;
  padding-right: 2px;
  font-size: 9.4pt;
}

.q-text {
  flex: 1;
  font-weight: 500;
}

.opt-grid {
  display: flex;
  flex-wrap: wrap;
  margin-top: 2.5px;
  margin-left: 20px;
}

.opt-col {
  width: 50%;
  padding-right: 4px;
  margin-bottom: 1.5px;
  font-size: 8.9pt;
  line-height: 1.3;
  display: flex;
  align-items: flex-start;
}

.opt-col.full-w {
  width: 100%;
}

.opt-lbl {
  font-weight: 600;
  margin-right: 3px;
  flex-shrink: 0;
  font-size: 8.7pt;
}

.opt-val {
  flex: 1;
}

/* ── KaTeX Math Adjustments for Print ── */
.katex {
  font-size: 1.02em;
  text-rendering: auto;
}

.katex-display {
  margin: 2px 0 !important;
  font-size: 0.95em;
  max-width: 100%;
  overflow-x: auto;
}

.m {
  display: inline;
}

.dm {
  display: block;
  text-align: center;
  margin: 3px 0;
}

.dl {
  display: inline-block;
  width: 2px;
}

/* ── Screen Controls (hidden when printed) ── */
@media screen {
  body {
    padding: 20px;
    background: #eef2f5;
  }
  .page-card {
    max-width: 210mm;
    margin: 0 auto 30px auto;
    background: #ffffff;
    padding: 12mm;
    box-shadow: 0 4px 18px rgba(0,0,0,0.12);
    border-radius: 4px;
  }
}

@media print {
  body {
    background: #ffffff;
  }
  .no-print {
    display: none !important;
  }
}
</style>
</head>
<body>
<div class="watermark-bg">অভ্যাস</div>

<div class="page-card">
  <!-- Exam Header -->
  <div class="header-box">
    <div class="brand-badge">${escapeHtml(logoText)}</div>
    <div class="cat-title">${escapeHtml(categoryText)}</div>
    <div class="main-title">${escapeHtml(examTitle)}</div>
    <div class="sub-title">${escapeHtml(subjectText)}</div>

    <div class="meta-row">
      <div class="meta-item">অধ্যায়: ${escapeHtml(chaptersText)}</div>
      <div class="meta-item">মোট প্রশ্ন: ${escapeHtml(totalQuestionsText)}</div>
      <div class="meta-item">সময়: ${escapeHtml(durationText)}</div>
      <div class="meta-item">পূর্ণমান: ${escapeHtml(marksText)}</div>
      <div class="meta-item">প্রাপ্ত নম্বর: ________</div>
    </div>

    <div class="student-row">
      <span style="white-space:nowrap;">শিক্ষার্থীর নাম:</span>
      <span class="name-dots"></span>
      <span style="white-space:nowrap;">রোল নং:</span>
      <span class="roll-dots"></span>
    </div>

    <div class="note-line">${escapeHtml(noteText)}</div>
    <hr class="header-hr">
  </div>

  <!-- 2 Column Question Body -->
  <div class="columns-wrapper">
    ${questionsHtml}
  </div>
</div>

${settings.autoPrint ? '<script>window.addEventListener("load", () => { setTimeout(() => window.print(), 350); });</script>' : ''}
</body>
</html>`;
}
