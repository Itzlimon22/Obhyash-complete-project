import { NextRequest, NextResponse } from 'next/server';
import { generateTemplateHtml } from '@/lib/pdf-generator/template';
import { generateQuestionPaperHtml } from '@/lib/pdf-generator/question-paper';
import { QuestionItem, GeneratorSettings } from '@/lib/pdf-generator/types';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type = 'solution', // 'solution' or 'question_paper'
      examDetails = {},
      questions = [],
      userAnswers = {},
      theme,
      format = 'html',
    } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'প্রশ্নের তালিকা (questions) প্রদান করা আবশ্যক।' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const banglaAns = ['ক', 'খ', 'গ', 'ঘ'];
    const origin = req.nextUrl.origin || 'https://www.obhyash.com';

    // ── Build QuestionItems ──
    const mappedQuestions: QuestionItem[] = questions.map((q: any, idx: number) => {
      const qId = q.id || String(idx + 1);
      const ua = userAnswers
        ? (userAnswers[qId] ?? userAnswers[String(q.serial)] ?? userAnswers[String(idx + 1)] ?? userAnswers[String(idx)])
        : undefined;
      const isAnswered = ua !== undefined && ua !== null && ua !== -1;
      const isCorrect = isAnswered && (
        ua === q.correctAnswerIndex ||
        ua === q.correct_answer_index ||
        (Array.isArray(q.correctAnswerIndices) && q.correctAnswerIndices.includes(ua)) ||
        (Array.isArray(q.correct_answer_indices) && q.correct_answer_indices.includes(ua))
      );

      const expLines: string[] = [];

      if (type === 'solution') {
        if (q.explanation && String(q.explanation).trim()) {
          String(q.explanation)
            .split('\n')
            .map((l: string) => l.trim())
            .filter(Boolean)
            .forEach((l: string) => expLines.push(l));
        } else {
          expLines.push('এই প্রশ্নের জন্য অতিরিক্ত কোনো ব্যাখ্যা নেই।');
        }
      }

      const options = q.options || [];
      return {
        n: q.serial || idx + 1,
        q: q.question || '',
        img: q.imageUrl || q.image_url || undefined,
        o: {
          a: options[0] || '',
          b: options[1] || '',
          c: options[2] || '',
          d: options[3] || '',
        },
        A: typeof q.correctAnswerIndex === 'number'
          ? banglaAns[q.correctAnswerIndex] || 'ক'
          : typeof q.correct_answer_index === 'number'
          ? banglaAns[q.correct_answer_index] || 'ক'
          : (q.A || 'ক'),
        E: expLines,
        passage: q.passage || undefined,
      };
    });

    let html = '';

    const toBnNum = (n: number | string) => {
      const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return String(n).replace(/\d/g, d => bn[Number(d)]);
    };

    if (type === 'question_paper') {
      // ── TYPE: Question Paper (Matching user's reference 2-column image) ──
      const title = examDetails.title || 'মডেল টেস্ট';
      const subject = examDetails.subjectLabel || examDetails.subject || 'সাধারণ বিষয়';
      const chapters = Array.isArray(examDetails.chapters)
        ? examDetails.chapters.join(', ')
        : examDetails.chapters || '';

      const totalQ = questions.length;
      const duration = (examDetails.durationMinutes && examDetails.durationMinutes > 0)
        ? examDetails.durationMinutes
        : totalQ;
      const totalMarks = (examDetails.totalMarks && examDetails.totalMarks > 0)
        ? examDetails.totalMarks
        : totalQ;

      html = generateQuestionPaperHtml(mappedQuestions, {
        category: examDetails.category || (chapters ? 'অধ্যায় ভিত্তিক' : 'মডেল টেস্ট'),
        title,
        subject,
        subjectCode: examDetails.subjectCode,
        chapters,
        durationMinutes: duration,
        totalMarks: totalMarks,
        institutionLogoText: 'অভ্যাস',
        baseUrl: origin,
      });
    } else {
      // ── TYPE: Solution / Answersheet (Full Obhyash A4 Theme System) ──
      const subjectTitle = examDetails.subjectLabel || examDetails.subject || 'মডেল টেস্ট';
      const totalCount = questions.length;
      const duration = (examDetails.durationMinutes && examDetails.durationMinutes > 0)
        ? examDetails.durationMinutes
        : totalCount;
      const totalPoints = (examDetails.totalMarks && examDetails.totalMarks > 0)
        ? examDetails.totalMarks
        : totalCount;

      const subtitle = `উচ্চ মাধ্যমিক ও ভর্তি পরীক্ষা প্রস্তুতি · মোট প্রশ্ন: ${toBnNum(totalCount)}টি · পূর্ণমান: ${toBnNum(totalPoints)} · সময়: ${toBnNum(duration)} মিনিট`;

      const selectedTheme = theme || (
        (examDetails.examType || '').toLowerCase().includes('eng') ? 'engineering' :
        (examDetails.examType || '').toLowerCase().includes('varsi') ? 'varsity_oxford_maroon' : 'medical'
      );

      const settings: GeneratorSettings = {
        theme: selectedTheme,
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
        standaloneToolbar: false,
        autoPrint: false,
        baseUrl: origin,
      };

      html = generateTemplateHtml(mappedQuestions, settings);
    }

    return NextResponse.json(
      {
        success: true,
        type,
        html,
        questionsCount: mappedQuestions.length,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('[API /api/pdf/generate] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'PDF তৈরিতে সমস্যা হয়েছে।' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
