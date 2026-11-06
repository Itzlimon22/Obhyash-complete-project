import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getHscSubjectBySlug, HSC_SUBJECTS } from '@/lib/data/hsc-question-bank-data';
import SubjectDetailClient from '@/components/question-bank/SubjectDetailClient';

interface PageProps {
  params: Promise<{
    subject: string;
  }>;
}

export const dynamic = 'force-static';
export const revalidate = false;

export function generateStaticParams() {
  return HSC_SUBJECTS.map((subj) => ({
    subject: subj.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subject } = await params;
  const subj = getHscSubjectBySlug(subject);
  if (!subj) return { title: 'বিষয় খুঁজে পাওয়া যায়নি | অভ্যাস' };

  const title = `এইচএসসি ${subj.name} প্রশ্ন ব্যাংক ২০২৬ (HSC ${subj.name} Question Bank) | অধ্যায়ভিত্তিক MCQ ও সমাধান`;
  const description = `এইচএসসি ${subj.name} বিষয়ের সকল অধ্যায়ের বিগত ১০ বছরের বোর্ড MCQ প্রশ্ন, সমাধান ও ফ্রি মডেল টেস্ট। মোট ${subj.totalQuestions.toLocaleString('bn-BD')}টি প্রশ্ন ও ${subj.totalChapters}টি অধ্যায়।`;
  const canonicalUrl = `https://obhyash.com/question-bank/hsc/${subject}`;

  return {
    title,
    description,
    keywords: [
      `hsc ${subj.slug} question bank`,
      `এইচএসসি ${subj.name} প্রশ্ন ব্যাংক ২০২৬`,
      `hsc ${subj.name} board question solution`,
      `hsc ${subj.slug} chapterwise mcq`,
      'obhyash question bank',
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
      type: 'website',
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

export default async function HscSubjectPage({ params }: PageProps) {
  const { subject } = await params;
  const subj = getHscSubjectBySlug(subject);

  if (!subj) {
    notFound();
  }

  // Get sibling subjects in same stream for helpful context navigation
  const siblings = HSC_SUBJECTS.filter(
    (s) => s.stream === subj.stream && s.slug !== subj.slug
  );

  const jsonLd = {
    '@context': 'https://schema.org',
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
        name: 'এইচএসসি প্রশ্ন ব্যাংক',
        item: 'https://obhyash.com/question-bank/hsc',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: subj.name,
        item: `https://obhyash.com/question-bank/hsc/${subj.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SubjectDetailClient
        level="hsc"
        subject={subj}
        siblings={siblings}
      />
    </>
  );
}
