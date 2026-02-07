import type { Metadata, Viewport } from 'next';
// ✅ Import the specific fonts you requested
import { Inter, Hind_Siliguri } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

// ✅ Configure Inter (English text)
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// ✅ Configure Hind Siliguri (Bengali text)
const hindSiliguri = Hind_Siliguri({
  variable: '--font-hind',
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['bengali', 'latin'],
});

export const metadata: Metadata = {
  title: 'Obhyash',
  description: 'Smart Exam Platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Obhyash',
  },
};

export const viewport: Viewport = {
  themeColor: '#e11d48',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ✅ Added 'dark' class for theme and font variables
    <html
      lang="en"
      className={`${hindSiliguri.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased overflow-x-hidden selection:bg-brand-500/30 bg-paper-50 text-paper-900 dark:bg-paper-900 dark:text-paper-50 font-sans">
        {/* Render the application */}
        {children}

        {/* ✅ Render the Toast Container (Overlay) */}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
