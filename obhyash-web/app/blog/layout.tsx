import type { Metadata } from 'next';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogFooter from '@/components/blog/BlogFooter';

export const metadata: Metadata = {
  title: {
    default: 'Obhyash Blog — Study Tips, Exam Strategies & More',
    template: '%s | Obhyash Blog',
  },
  description:
    'Expert study tips, MCQ techniques, SSC & HSC exam strategies, and insights to help Bangladeshi students study smarter and score higher.',
  keywords: [
    'SSC study tips',
    'HSC preparation',
    'MCQ techniques',
    'exam strategies',
    'Bangladesh student',
    'board exam',
    'Obhyash',
    'পড়ালেখার টিপস',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Obhyash Blog',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#121212] text-slate-900 dark:text-slate-100 font-sans tracking-tight">
      <BlogHeader />
      <main className="flex-1">{children}</main>
      <BlogFooter />
    </div>
  );
}
