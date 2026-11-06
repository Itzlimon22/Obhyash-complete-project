import { Metadata } from 'next';
import HscQuestionBankClient from '@/components/question-bank/HscQuestionBankClient';

export const dynamic = 'force-static';
export const revalidate = false;

const PAGE_TITLE = 'এইচএসসি প্রশ্ন ব্যাংক ২০২৬ (HSC Question Bank) | বোর্ড প্রশ্ন ও অধ্যায়ভিত্তিক সমাধান | অভ্যাস';
const PAGE_DESC =
  'এইচএসসি ২০২৬ ও ২০২৭ এর জন্য সকল শিক্ষা বোর্ডের অধ্যায়ভিত্তিক ৩৫,০০০+ MCQ প্রশ্ন, বিস্তারিত ব্যাখ্যা এবং ফ্রি মডেল টেস্ট। পদার্থবিজ্ঞান, রসায়ন, গণিত, জীববিজ্ঞান ও আইসিটি সহ সকল বিষয়ের প্রশ্নব্যাংক।';
const CANONICAL_URL = 'https://obhyash.com/question-bank/hsc';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  keywords: [
    'hsc question bank',
    'এইচএসসি প্রশ্ন ব্যাংক',
    'hsc question bank 2026',
    'hsc physics mcq question bank',
    'hsc chemistry question bank with solution',
    'hsc higher math mcq solution',
    'hsc ict mcq question answer',
    'hsc biology board question solution',
    'এইচএসসি বোর্ড প্রশ্ন ও সমাধান',
    'hsc admission preparation question bank',
    'obhyash hsc question bank',
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
        alt: 'এইচএসসি প্রশ্ন ব্যাংক ২০২৬ — অভ্যাস (Obhyash)',
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

export default function HscQuestionBankPage() {
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
            item: 'https://obhyash.com/question-bank/hsc',
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
      <HscQuestionBankClient />
    </>
  );
}

