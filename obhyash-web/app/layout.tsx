import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Inter, Anek_Bangla } from 'next/font/google';
import './globals.css';
import 'katex/dist/katex.min.css';
import { Toaster } from 'sonner';
import AuthProvider from '@/components/auth/AuthProvider';
import SWRProvider from '@/components/providers/SWRProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

// ✅ Configure Inter (English text)
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

// ✅ Configure Anek Bangla (Bengali text)
const anekBangla = Anek_Bangla({
  variable: '--font-anek',
  subsets: ['bengali', 'latin'],
  display: 'swap',
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
  themeColor: '#9f1239',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ✅ Added 'dark' class for theme and font variables
    <html lang="en" className={`${inter.variable} ${anekBangla.variable}`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-512.png" />
      </head>
      <body className="antialiased overflow-x-hidden selection:bg-brand-500/30 bg-paper-50 text-paper-900 dark:bg-paper-900 dark:text-paper-50 font-sans">
        <Suspense fallback={null}>
          <AuthProvider>
            <SWRProvider>
              {children}

              {/* ✅ Render the Toast Container (Overlay) */}
              <Toaster
                position="bottom-center"
                richColors
                expand={false}
                closeButton
                theme="dark"
                toastOptions={{
                  className: 'font-anek !rounded-2xl shadow-2xl !border-0',
                  style: {
                    padding: '16px',
                  },
                }}
              />
              <Analytics />
              <SpeedInsights />
            </SWRProvider>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
