import type { Metadata } from 'next';
import { Inter, Noto_Sans_Bengali, Noto_Serif_Bengali } from 'next/font/google';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-noto-sans',
});
const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ['bengali'],
  variable: '--font-noto-serif',
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Obhyash (অভ্যাস) Exam Platform',
  description: 'A high-performance, AI-powered examination interface.',
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
        integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
        crossOrigin="anonymous"
      />
      {children}
    </>
  );
}
