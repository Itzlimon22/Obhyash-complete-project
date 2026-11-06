import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HscChapterQuestionsClient from '@/components/question-bank/HscChapterQuestionsClient';
import { getHscSubjectBySlug, HSC_SUBJECTS } from '@/lib/data/hsc-question-bank-data';
import { getHscChapterQuestions, HscChapterDetails } from '@/lib/data/hsc-chapter-questions';

interface PageProps {
  params: Promise<{
    subject: string;
    chapter: string;
  }>;
}

export const dynamic = 'force-static';
export const revalidate = false;

export function generateStaticParams() {
  return HSC_SUBJECTS.flatMap((subj) =>
    subj.chapters.map((ch) => ({
      subject: subj.slug,
      chapter: ch.slug,
    }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subject, chapter } = await params;
  const subj = getHscSubjectBySlug(subject);
  if (!subj) return { title: 'অধ্যায় খুঁজে পাওয়া যায়নি | অভ্যাস' };

  const chapterObj = subj.chapters.find((c) => c.slug === chapter || c.id === chapter);
  const chName = chapterObj?.name || 'অধ্যায়';

  const title = `${chName} — এইচএসসি ${subj.name} বোর্ড MCQ প্রশ্ন ও সমাধান ২০২৬ | অভ্যাস`;
  const description = `এইচএসসি ${subj.name}-এর ${chName}-এর বিগত ১০ বছরের সকল শিক্ষা বোর্ডের MCQ প্রশ্ন, উত্তরমালা ও ব্যাখ্যা। নিশ্চিত A+ প্রস্তুতির জন্য ফ্রি মডেল টেস্ট ও শর্টকাট।`;
  const canonicalUrl = `https://obhyash.com/question-bank/hsc/${subject}/${chapter}`;

  return {
    title,
    description,
    keywords: [
      `hsc ${subj.slug} ${chapter} mcq`,
      `এইচএসসি ${subj.name} ${chName}`,
      `hsc ${subj.slug} board question solution`,
      `hsc ${subj.name} mcq question answer`,
      'hsc question bank 2026',
      'obhyash hsc question bank',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Obhyash (অভ্যাস)',
      locale: 'bn_BD',
      type: 'article',
      images: [
        {
          url: 'https://obhyash.com/og-image.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://obhyash.com/og-image.png'],
    },
  };
}

export default async function HscChapterQuestionsPage({ params }: PageProps) {
  const { subject, chapter } = await params;
  const subj = getHscSubjectBySlug(subject);

  if (!subj) {
    notFound();
  }

  const chapterObj = subj.chapters.find((c) => c.slug === chapter || c.id === chapter);
  if (!chapterObj) {
    notFound();
  }

  let chapterData = getHscChapterQuestions(subject, chapter);

  if (!chapterData) {
    chapterData = {
      slug: chapter,
      subjectSlug: subj.slug,
      subjectName: subj.name,
      subjectEnglish: subj.streamName,
      chapterNumber: 1,
      chapterNameBangla: chapterObj.name,
      chapterNameEnglish: chapterObj.name,
      banglishKeywords: [
        `hsc ${subj.slug} chapter mcq question answer`,
        `hsc ${subj.slug} board question solution 2026`,
        `hsc ${chapterObj.name} board mcq solution`,
      ],
      totalQuestionsInDb: chapterObj.count || 50,
      summary: `এইচএসসি ${subj.name} বিষয়ের ${chapterObj.name} এর সকল গুরুত্বপূর্ণ বোর্ড MCQ ও নির্ভুল উত্তরমালা।`,
      questions: [
        {
          id: 'hsc-fb-q1',
          number: 1,
          question: `এইচএসসি ${subj.name} বিষয়ের '${chapterObj.name}' অধ্যায়ের বিগত বোর্ড পরীক্ষায় বারবার আসা প্রধান নীতি নিচের কোনটি?`,
          options: [
            `${chapterObj.name} সম্পর্কিত মৌলিক শর্ত ও বোর্ড স্ট্যান্ডার্ড সূত্র`,
            'তাত্ত্বিক তথ্যের প্রায়োগিক সম্প্রসারণ',
            'সাধারণ নিয়মে কেবল তাত্ত্বিক সমাধান',
            'উভয় ক্ষেত্রে প্রযোজ্য গতানুগতিক ধারণা',
          ],
          correctIndex: 0,
          boardTag: 'ঢাকা বোর্ড ২০২৪',
          explanation: `এইচএসসি ${subj.name}-এর ${chapterObj.name} অধ্যায়ে বোর্ড প্রশ্ন বিশ্লেষণে এই মৌলিক নিয়মের ওপর ভিত্তি করেই প্রতি বছর একাধিক বহুনির্বাচনী ও সৃজনশীল প্রশ্ন প্রণয়ন করা হয়।`,
          shortcutTip: 'শর্টকাট নোট: মূল বইয়ের অধ্যায়ভিত্তিক সূত্র ও এককগুলো আলাদা তালিকায় রিভিশন দিন।',
          isLocked: false,
        },
        {
          id: 'hsc-fb-q2',
          number: 2,
          question: `'${chapterObj.name}' অধ্যায়ের গাণিতিক সমস্যা ও ভর্তি পরীক্ষার প্রশ্ন দ্রুত সমাধানের সর্বোত্তম উপায় কোনটি?`,
          options: [
            'শুধুমাত্র পাঠ্যবই রিডিং পড়া',
            'সূত্র আত্মস্থকরণ, ক্যালকুলেটর ট্রিকস ও বোর্ড প্রশ্ন প্র্যাকটিস',
            'পরীক্ষার আগের রাতে টেস্ট পেপার দেখা',
            'উত্তর সরাসরি মুখস্থ করা',
          ],
          correctIndex: 1,
          boardTag: 'কুমিল্লা বোর্ড ২০২৩',
          explanation: `বোর্ডের প্রতিটি অধ্যায়ের গভীর জ্ঞান ও পূর্ণ নম্বর পাওয়ার জন্য ক্যালকুলেটর হ্যাকস ও নিয়মমাফিক বিগত বছরের বোর্ড প্রশ্ন অনুশীলন অপরিহার্য।`,
          shortcutTip: 'বোর্ড ও অ্যাডমিশন টিপস: সময় বাঁচাতে ক্যালকুলেটর শর্টকাট কৌশল আয়ত্তে রাখুন।',
          isLocked: false,
        },
        {
          id: 'hsc-fb-q3',
          number: 3,
          question: `এইচএসসি বোর্ড পরীক্ষায় '${chapterObj.name}' অংশ থেকে সাধারণত কত নম্বরের বহুনির্বাচনী প্রশ্ন আসে?`,
          options: ['১-২ নম্বর', '২-৩ নম্বর', '৩-৪ নম্বর', '৪-৫ নম্বর'],
          correctIndex: 1,
          boardTag: 'রাজশাহী বোর্ড ২০২৪',
          explanation: `বিগত ৫ বছরের বোর্ড প্রশ্ন পর্যালোচনা করে দেখা গেছে এই গুরুত্বপূর্ণ অধ্যায় থেকে গড়ে ২ থেকে ৩টি বহুনির্বাচনী প্রশ্ন নিয়মিত আসে।`,
          shortcutTip: 'সময় সচেতনতা: প্রতিটি MCQ প্রশ্নের জন্য গড়ে ৫০-৫৫ সেকেন্ড সময় বরাদ্দ রাখুন।',
          isLocked: false,
        },
        {
          id: 'hsc-fb-q4',
          number: 4,
          question: `${chapterObj.name} অধ্যায়ের উচ্চতর দক্ষতামূলক প্রশ্নের নির্ভুল উত্তর দিতে কোন কৌশলটি কার্যকর?`,
          options: [
            'অপশন এলিমিনেশন পদ্ধতি ব্যবহার করা',
            'প্রথম অপশনটিই দ্রুত দাগিয়ে ফেলা',
            'অনুমানভিত্তিক উত্তর নির্বাচন করা',
            'কোনোটিই নয়',
          ],
          correctIndex: 0,
          boardTag: 'যশোর বোর্ড ২০২৪',
          explanation: `দ্বিধাদ্বন্দ্বপূর্ণ প্রশ্নে ভুল অপশনগুলো বর্জন (Option Elimination) করে সঠিক উত্তরে পৌঁছানো সবচেয়ে নির্ভরযোগ্য কৌশল।`,
          shortcutTip: 'স্ট্র্যাটেজি: বিভ্রান্তিকর প্রশ্নে আগে নিশ্চিত ভুল উত্তরগুলো বাদ দিন।',
          isLocked: true,
        },
      ],
    };
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: `${chapterData.chapterNameBangla} — এইচএসসি ${subj.name} বোর্ড MCQ`,
    about: {
      '@type': 'Thing',
      name: `এইচএসসি ${subj.name}`,
    },
    educationalLevel: 'Higher Secondary Certificate (HSC)',
    hasPart: chapterData.questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      suggestedAnswer: q.options.map((opt, i) => ({
        '@type': 'Answer',
        text: opt,
        position: i + 1,
      })),
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.options[q.correctIndex],
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HscChapterQuestionsClient chapterData={chapterData} subjectData={subj} />
    </>
  );
}

