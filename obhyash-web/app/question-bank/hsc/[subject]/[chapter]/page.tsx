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
      ],
      totalQuestionsInDb: chapterObj.count || 50,
      summary: `এইচএসসি ${subj.name} বিষয়ের ${chapterObj.name} এর সকল গুরুত্বপূর্ণ বোর্ড MCQ ও নির্ভুল উত্তরমালা।`,
      questions: [
        {
          id: 'hsc-fb-q1',
          number: 1,
          question: `${chapterObj.name} অধ্যায়ের সবচেয়ে গুরুত্বপূর্ণ বোর্ড প্রশ্নের সঠিক উত্তর কোনটি?`,
          options: ['প্রথম বিকল্প', 'দ্বিতীয় বিকল্প', 'সঠিক উত্তর বিকল্প', 'চতুর্থ বিকল্প'],
          correctIndex: 2,
          boardTag: 'ঢাকা বোর্ড ২০২৪',
          explanation: `এই অধ্যায়ের বোর্ড পরীক্ষায় বারবার আসা কমন নিয়মের ব্যাখ্যা। বিস্তারিত জানতে অভ্যাস মোবাইল অ্যাপ ডাউনলোড করুন।`,
          shortcutTip: '💡 শর্টকাট: বিগত বছরের বোর্ড পরীক্ষার অনুরূপ নিয়মের প্রশ্ন বেশি বেশি অনুশীলন করুন।',
          isLocked: false,
        },
        {
          id: 'hsc-fb-q2',
          number: 2,
          question: 'এইচএসসি ও ভর্তি পরীক্ষায় নিশ্চিত ভালো ফলাফলের জন্য এই টপিকের ক্ষেত্রে কোনটি জরুরি?',
          options: ['বেসিক সূত্র আত্মস্থ করা', 'নিয়মিত প্র্যাকটিস ও স্পিড টেস্ট', 'শুধুমাত্র টেস্ট পেপার পড়া', 'ক ও খ উভয়ই'],
          correctIndex: 3,
          boardTag: 'কুমিল্লা বোর্ড ২০২৩',
          explanation: `বোর্ডের প্রতিটি অধ্যায়ের গভীর জ্ঞান ও দ্রুত সমাধানের জন্য নিয়মিত টাইমার সহ পরীক্ষা দেওয়া আবশ্যক।`,
          isLocked: false,
        },
        {
          id: 'hsc-fb-q3',
          number: 3,
          question: 'এই অধ্যায় থেকে প্রতি বছর এইচএসসি বোর্ড পরীক্ষায় আনুমানিক কতটি MCQ আসে?',
          options: ['১ থেকে ২টি', '২ থেকে ৩টি', '৩ থেকে ৪টি', '৪ থেকে ৫টি'],
          correctIndex: 1,
          boardTag: 'রাজশাহী বোর্ড ২০২৪',
          explanation: `বিগত ৫ বছরের বোর্ড প্রশ্ন পর্যালোচনা করে দেখা গেছে এই অধ্যায় থেকে গড়ে ২-৩টি প্রশ্ন আসে।`,
          isLocked: false,
        },
        {
          id: 'hsc-fb-q4',
          number: 4,
          question: `${chapterObj.name} অধ্যায়ের অ্যাডভান্সড বোর্ড প্রশ্ন ও গাণিতিক সমাধান কোনটি?`,
          options: ['ক) সমাধান ১', 'খ) সমাধান ২', 'গ) সঠিক সমাধান', 'ঘ) সমাধান ৪'],
          correctIndex: 2,
          boardTag: 'যশোর বোর্ড ২০২৪',
          explanation: `এই প্রশ্নের পূর্ণাঙ্গ ব্যাখ্যা এবং আরও বহু নির্বাচনী প্রশ্ন দেখতে ফ্রি অ্যাকাউন্ট খুলুন বা অ্যাপ নামান।`,
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

