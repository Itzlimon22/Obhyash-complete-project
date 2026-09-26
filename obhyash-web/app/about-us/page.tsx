import { Metadata } from 'next';
import PolicyPageShell from '@/components/legal/PolicyPageShell';
import { LEGAL_CONTENT } from '@/lib/constants/legal-content';

export const metadata: Metadata = {
  title: 'আমাদের সম্পর্কে | Obhyash (অভ্যাস)',
  description:
    'অভ্যাস (Obhyash) সম্পর্কে জানুন — বাংলাদেশের HSC, SSC ও ভর্তি পরীক্ষার্থীদের জন্য তৈরি স্মার্ট অনলাইন এক্সাম প্রিপারেশন প্ল্যাটফর্মের লক্ষ্য, দল ও যাত্রা।',
  alternates: {
    canonical: 'https://obhyash.com/about-us',
  },
  openGraph: {
    title: 'আমাদের সম্পর্কে | Obhyash (অভ্যাস)',
    description:
      'অভ্যাস (Obhyash) সম্পর্কে জানুন — বাংলাদেশের HSC, SSC ও ভর্তি পরীক্ষার্থীদের জন্য তৈরি স্মার্ট অনলাইন এক্সাম প্ল্যাটফর্মের লক্ষ্য ও যাত্রা।',
    url: 'https://obhyash.com/about-us',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Obhyash About Us' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'আমাদের সম্পর্কে | Obhyash',
    description: 'অভ্যাস (Obhyash) — বাংলাদেশের শিক্ষার্থীদের জন্য স্মার্ট এক্সাম প্রিপারেশন প্ল্যাটফর্ম।',
    images: ['/og-image.png'],
  },
};

export default function AboutUsPage() {
  return <PolicyPageShell document={LEGAL_CONTENT.about} activeSlug="about" />;
}
