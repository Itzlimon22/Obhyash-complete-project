import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { generateQuestionPaperHtml } from '../lib/pdf-generator/question-paper';
import { generateTemplateHtml } from '../lib/pdf-generator/template';
import { QuestionItem } from '../lib/pdf-generator/types';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
const supabase = createClient(url, key);

async function main() {
  console.log('Fetching real exam result from Supabase...');
  const { data: results, error } = await supabase
    .from('exam_results')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error || !results || results.length === 0) {
    console.error('Failed to fetch real exam results:', error);
    process.exit(1);
  }

  // Find a result that has questions
  const realExam = results.find(r => Array.isArray(r.questions) && r.questions.length > 0) || results[0];
  console.log('Loaded real exam:', {
    id: realExam.id,
    subject: realExam.subject,
    subjectLabel: realExam.subject_label,
    totalQuestions: realExam.questions.length,
    score: realExam.score,
    totalMarks: realExam.total_marks,
    date: realExam.created_at,
  });

  const banglaAns = ['ক', 'খ', 'গ', 'ঘ'];
  const userAnswers = realExam.user_answers || {};

  const mappedQuestions: QuestionItem[] = realExam.questions.map((q: any, idx: number) => {
    const qId = q.id || String(idx + 1);
    const ua = userAnswers[qId];
    const isAnswered = ua !== undefined && ua !== null && ua !== -1;
    const isCorrect = isAnswered && (ua === q.correct_answer_index || ua === q.correctAnswerIndex);

    const expLines: string[] = [];

    if (q.explanation && String(q.explanation).trim()) {
      String(q.explanation).split('\n').map((l: string) => l.trim()).filter(Boolean).forEach((l: string) => expLines.push(l));
    } else {
      expLines.push('এই প্রশ্নের জন্য অতিরিক্ত কোনো ব্যাখ্যা নেই।');
    }

    const options = q.options || [];
    return {
      n: idx + 1,
      q: q.question || '',
      img: q.imageUrl || q.image_url || undefined,
      o: {
        a: options[0] || '',
        b: options[1] || '',
        c: options[2] || '',
        d: options[3] || '',
      },
      A: banglaAns[q.correct_answer_index ?? q.correctAnswerIndex ?? 0] || 'ক',
      E: expLines,
      passage: q.passage || undefined,
    };
  });

  const outDir = path.join(process.cwd(), 'output_pdfs', 'real_exam');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const subjectTitle = realExam.subject || 'পদার্থবিজ্ঞান ১ম পত্র';
  const totalQ = mappedQuestions.length;
  const toBn = (n: number | string) => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[Number(d)]);
  const duration = (realExam.total_marks && realExam.total_marks !== totalQ)
    ? realExam.total_marks
    : totalQ;

  // 1. Question Paper HTML (Exact 2-column layout from user reference image)
  const qHtml = generateQuestionPaperHtml(mappedQuestions, {
    category: 'মডেল টেস্ট',
    title: `${subjectTitle} ফাইনাল মডেল টেস্ট`,
    subject: `বিষয়ঃ ${subjectTitle} (MCQ)`,
    chapters: 'সম্পূর্ণ সিলেবাস',
    durationMinutes: duration,
    totalMarks: realExam.total_marks || totalQ,
    institutionLogoText: 'অভ্যাস',
  });
  fs.writeFileSync(path.join(outDir, 'real_question_paper.html'), qHtml);

  // 2. Answersheet HTML (Web format with badges, KaTeX formulas, and solutions)
  const aHtml = generateTemplateHtml(mappedQuestions, {
    theme: 'medical',
    title: subjectTitle,
    subTitleLabel: 'সমাধান ও ব্যাখ্যা',
    subtitle: `উচ্চ মাধ্যমিক ও ভর্তি পরীক্ষা প্রস্তুতি · মোট প্রশ্ন: ${toBn(totalQ)}টি · পূর্ণমান: ${toBn(realExam.total_marks || totalQ)} · সময়: ${toBn(duration)} মিনিট`,
    hasHeader: true,
    headerLeftText: 'অ্যাপ ইনস্টল করো',
    headerLeftUrl: 'https://play.google.com/store/apps/details?id=com.obhyash.app',
    headerRightText: `${subjectTitle} — সমাধান পত্র`,
    footerLeftPrefix: 'আনলিমিটেড এক্সাম দাও',
    footerSiteText: 'www.obhyash.com',
    footerLeftUrl: 'https://www.obhyash.com',
    footerLeftSuffix: 'এ',
    footerPagePrefix: 'পৃষ্ঠা',
    useBanglaDigits: true,
    pageOffset: 0,
  });
  fs.writeFileSync(path.join(outDir, 'real_answersheet.html'), aHtml);

  console.log('Real exam HTML files generated in:', outDir);
}

main().catch(console.error);
