import { Metadata } from 'next';
import SscQuestionBankClient from '@/components/question-bank/SscQuestionBankClient';

export const dynamic = 'force-static';
export const revalidate = false;

const PAGE_TITLE = 'এসএসসি প্রশ্ন ব্যাংক ২০২৬ (SSC Question Bank) | বোর্ড প্রশ্ন ও অধ্যায়ভিত্তিক সমাধান | অভ্যাস';
const PAGE_DESC =
  'এসএসসি ২০২৬ ও ২০২৭ এর জন্য সকল শিক্ষা বোর্ডের অধ্যায়ভিত্তিক ৪৫,০০০+ MCQ প্রশ্ন, বিস্তারিত ব্যাখ্যা এবং ফ্রি মডেল টেস্ট। পদার্থবিজ্ঞান, গণিত, রসায়ন, জীববিজ্ঞান ও বাংলা সহ সকল বিষয়ের পূর্ণাঙ্গ প্রশ্নব্যাংক।';
const CANONICAL_URL = 'https://obhyash.com/question-bank/ssc';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  keywords: [
    'ssc question bank',
    'এসএসসি প্রশ্ন ব্যাংক',
    'ssc question bank 2026',
    'ssc mcq question with answer',
    'ssc board question solution',
    'এসএসসি বোর্ড প্রশ্ন ও সমাধান',
    'ssc physics question bank',
    'ssc chemistry mcq bank',
    'ssc general math question bank',
    'ssc higher math mcq solution',
    'ssc bangla 1st paper mcq',
    'এসএসসি মডেল টেস্ট',
    'obhyash ssc question bank',
    'অভ্যাস প্রশ্ন ব্যাংক',
    'testmitro alternative',
    'ssc suggestion 2026',
  ],
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: CANONICAL_URL,
    siteName: 'Obhyash (অভ্যাস)',
    locale: 'bn_BD',
    type: 'website',
    images: [
      {
        url: 'https://obhyash.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'এসএসসি প্রশ্ন ব্যাংক ২০২৬ — অভ্যাস (Obhyash)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESC,
    images: ['https://obhyash.com/og-image.png'],
  },
};

export default function SscQuestionBankPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${CANONICAL_URL}#webpage`,
        url: CANONICAL_URL,
        name: PAGE_TITLE,
        description: PAGE_DESC,
        inLanguage: 'bn-BD',
        isPartOf: {
          '@type': 'WebSite',
          '@id': 'https://obhyash.com/#website',
          url: 'https://obhyash.com',
          name: 'Obhyash | অভ্যাস',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'হোম',
            item: 'https://obhyash.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'প্রশ্ন ব্যাংক',
            item: 'https://obhyash.com/question-bank',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'এসএসসি প্রশ্ন ব্যাংক',
            item: CANONICAL_URL,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'এসএসসি পরীক্ষার জন্য বোর্ড প্রশ্ন ও অধ্যায়ভিত্তিক প্রশ্নব্যাংক সমাধান কতটা জরুরি?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'বিগত ৫-১০ বছরের বোর্ড পরীক্ষার প্রশ্ন সমাধান করলে ৬০% থেকে ৮০% প্রশ্ন সরাসরি বা অনুরূপ নিয়মে কমন আসে।',
            },
          },
          {
            '@type': 'Question',
            name: 'অভ্যাস (Obhyash) প্রশ্ন ব্যাংকে কোন কোন শিক্ষা বোর্ডের প্রশ্ন আছে?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'ঢাকা, রাজশাহী, চট্টগ্রাম, কুমিল্লা, যশোর, বরিশাল, সিলেট, দিনাজপুর ও ময়মনসিংহ বোর্ডের বিগত বছরগুলোর নির্ভুল ও ব্যাখ্যাসহ MCQ প্রশ্ন এই ডাটাবেজে রয়েছে।',
            },
          },
          {
            '@type': 'Question',
            name: 'প্রশ্নব্যাংক ও সলিউশন কি সম্পূর্ণ বিনামূল্যে ব্যবহার করা যায়?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'হ্যাঁ, অভ্যাসের এই প্রশ্নব্যাংক ডিরেক্টরি এবং অধ্যায়ভিত্তিক তালিকা ১০০% ফ্রি। সকল শিক্ষার্থী যেকোনো ডিভাইস থেকে কোনো ফি ছাড়াই প্র্যাকটিস করতে পারবে।',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SscQuestionBankClient />
    </>
  );
}

