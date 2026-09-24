import type { Metadata } from 'next';
import LandingPageClient from '@/components/landing/LandingPageClient';

export const metadata: Metadata = {
  title: 'Obhyash (অভ্যাস) - The Smart Exam Platform for Students',
  description:
    'অভ্যাস (Obhyash) - বাংলাদেশের শিক্ষার্থীদের জন্য স্মার্ট এক্সাম ও প্র্যাকটিস প্ল্যাটফর্ম। হাজারো বোর্ড ও ভর্তি পরীক্ষার প্রশ্ন প্র্যাকটিস, নির্ভুল ব্যাখ্যা এবং স্মার্ট মিস্টেক নোটবুক।',
  alternates: {
    canonical: 'https://obhyash.com',
  },
};

const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://obhyash.com/#website',
      url: 'https://obhyash.com',
      name: 'Obhyash',
      alternateName: ['অভ্যাস', 'Obhyash App', 'অভ্যাস অ্যাপ', 'Obhyash Exam Platform'],
      description: 'স্মার্ট এক্সাম ও প্র্যাকটিস প্ল্যাটফর্ম - বোর্ড ও ভর্তি পরীক্ষার হাজারো প্রশ্ন প্র্যাকটিস',
      inLanguage: ['bn-BD', 'en-US'],
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://obhyash.com/blog?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'EducationalOrganization',
      '@id': 'https://obhyash.com/#organization',
      name: 'Obhyash',
      alternateName: 'অভ্যাস',
      url: 'https://obhyash.com',
      logo: 'https://obhyash.com/icon-512.png',
      description:
        'অভ্যাস (Obhyash) হলো HSC, বিশ্ববিদ্যালয় ও মেডিকেল ভর্তি পরীক্ষার্থীদের জন্য একটি স্মার্ট ও গেমিফাইড অনলাইন এক্সাম প্ল্যাটফর্ম।',
      sameAs: [
        'https://facebook.com/obhyash',
        'https://www.youtube.com/@obhyash',
      ],
    },
    {
      '@type': 'ItemList',
      itemListElement: [
        {
          '@type': 'SiteNavigationElement',
          position: 1,
          name: 'রেজিস্ট্রেশন/ লগ ইন',
          description: 'অভ্যাস একাউন্টে লগইন করুন অথবা বিনামূল্যে রেজিস্ট্রেশন করুন।',
          url: 'https://obhyash.com/login',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 2,
          name: 'নতুন একাউন্ট (Sign Up)',
          description: 'ফ্রিতে একাউন্ট খুলে ডেমো এক্সাম ও চ্যাপ্টারভিত্তিক প্রশ্ন প্র্যাকটিস শুরু করুন।',
          url: 'https://obhyash.com/signup',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 3,
          name: 'স্টাডি ব্লগ ও গাইড',
          description: 'HSC, শর্টকাট টেকনিক, ক্যালকুলেটর হ্যাকস ও স্টাডি স্ট্র্যাটেজি গাইড।',
          url: 'https://obhyash.com/blog',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 4,
          name: 'আমাদের সম্পর্কে',
          description: 'অভ্যাস প্ল্যাটফর্মের লক্ষ্য ও যাত্রা সম্পর্কে জানুন।',
          url: 'https://obhyash.com/about-us',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://obhyash.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'অভ্যাস (Obhyash) অ্যাপ এর কাজ কি?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'অভ্যাস (Obhyash) হলো HSC, বিশ্ববিদ্যালয় ও মেডিকেল ভর্তি পরীক্ষার্থীদের জন্য একটি স্মার্ট অনলাইন এক্সাম প্রিপারেশন প্ল্যাটফর্ম। এখানে রয়েছে বিগত ২০ বছরের বোর্ড প্রশ্ন, বিষয় ও অধ্যায়ভিত্তিক প্র্যাকটিস, লাইভ এক্সাম, অটোমেটিক মিস্টেক নোটবুক এবং স্মার্ট পারফরম্যান্স অ্যানালাইসিস।',
          },
        },
        {
          '@type': 'Question',
          name: 'অভ্যাস অ্যাপ কি ফ্রি?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'হ্যাঁ! শিক্ষার্থীরা কোনো প্রকার পেমেন্ট ছাড়াই ফ্রিতে একাউন্ট খুলে ডেমো এক্সাম ও অধ্যায়ভিত্তিক ফ্রি প্রশ্ন প্র্যাকটিস করতে পারে। এছাড়াও সকল বিষয়ের আনলিমিটেড প্রশ্নব্যাংক ও ফুল-লেন্থ মডেল টেস্টের জন্য সাশ্রয়ী প্রিমিয়াম প্ল্যান রয়েছে।',
          },
        },
        {
          '@type': 'Question',
          name: 'অভ্যাস (Obhyash) দিয়ে কিভাবে প্রস্তুতি নেওয়া যায়?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'obhyash.com ওয়েবসাইটে অথবা মোবাইল অ্যাপে প্রবেশ করে নিজের কাঙ্ক্ষিত বিভাগ (HSC, ইঞ্জিনিয়ারিং, মেডিকেল বা ভার্সিটি) সিলেক্ট করে যেকোনো সাবজেক্টের চ্যাপ্টারভিত্তিক কুইজ ও মডেল টেস্ট দিয়ে তাৎক্ষণিক ফলাফল ও টেক্সটবুক রেফারেন্স সহ নির্ভুল ব্যাখ্যা দেখে প্রস্তুতি নেওয়া যায়।',
          },
        },
        {
          '@type': 'Question',
          name: 'অভ্যাসের প্রশ্ন ও উত্তরের নির্ভুলতা কেমন?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'অভ্যাসের প্রতিটি প্রশ্ন ও সমাধান বুয়েট, ঢাকা বিশ্ববিদ্যালয় ও শীর্ষ মেডিকেল কলেজের অভিজ্ঞ শিক্ষকদের দ্বারা এনসিটিবি (NCTB) অনুমোদিত টেক্সটবুকের রেফারেন্স সহ নিখুঁতভাবে যাচাইকৃত। কোনো প্রকার ভুল উত্তরের বিভ্রান্তি ছাড়াই শিক্ষার্থীরা প্রস্তুতি নিতে পারে।',
          },
        },
        {
          '@type': 'Question',
          name: 'ভুল হওয়া প্রশ্নগুলো কি পরবর্তীতে রিভিশন দেওয়া যায়?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'হ্যাঁ! প্রতিটি পরীক্ষার পর ভুল হওয়া প্রশ্নগুলো স্বয়ংক্রিয়ভাবে শিক্ষার্থীর পার্সোনাল "Mistake Notebook"-এ সংরক্ষিত থাকে, যাতে যেকোনো সময় শুধু ভুলগুলো ফিল্টার করে রিভিশন দেওয়া যায়।',
          },
        },
      ],
    },
  ],
};

// Middleware redirects authenticated users away from '/' before this page renders,
// so this component is only ever shown to unauthenticated (guest) visitors.
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
      />
      <main>
        <LandingPageClient />
      </main>
    </>
  );
}
