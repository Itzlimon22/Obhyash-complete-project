import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
// ✅ Import the specific fonts you requested
import { Inter } from 'next/font/google';
import './globals.css';
import 'katex/dist/katex.min.css';
import { Toaster } from 'sonner';
import AuthProvider from '@/components/auth/AuthProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

// ✅ Configure Inter (English text)
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
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
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-512.png" />
      </head>
      <body className="antialiased overflow-x-hidden selection:bg-brand-500/30 bg-paper-50 text-paper-900 dark:bg-paper-900 dark:text-paper-50 font-sans">
        <Suspense fallback={null}>
          <AuthProvider>
            {children}

            {/* ✅ Render the Toast Container (Overlay) */}
            <Toaster
              position="top-center"
              richColors
              expand={true}
              closeButton
              theme="light"
              toastOptions={{
                className: 'font-anek',
                style: {
                  borderRadius: '1rem',
                },
              }}
            />
            <Analytics />
            <SpeedInsights />
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
