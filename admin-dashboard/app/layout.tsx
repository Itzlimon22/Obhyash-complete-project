import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

// 1. Configure Fonts
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// 2. Define Metadata
export const metadata: Metadata = {
  title: 'Obyash Admin Dashboard',
  description: 'Question Bank Management System',
};

// 3. Single Root Layout Export
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main>{children}</main>

        {/* ✅ Enables global toast notifications for your bulk upload results */}
        <Toaster />
      </body>
    </html>
  );
}
