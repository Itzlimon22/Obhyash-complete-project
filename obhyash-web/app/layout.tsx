import type { Metadata, Viewport } from 'next';
// ✅ Import the specific fonts you requested
import { Inter, Anek_Bangla } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import AuthProvider from '@/components/auth/AuthProvider';

// ✅ Configure Inter (English text)
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
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
    <html
      lang="en"
      className={`${anekBangla.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icon-512.png" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased overflow-x-hidden selection:bg-brand-500/30 bg-paper-50 text-paper-900 dark:bg-paper-900 dark:text-paper-50 font-sans">
        <AuthProvider>
          {/* Render the application */}
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
        </AuthProvider>
      </body>
    </html>
  );
}
