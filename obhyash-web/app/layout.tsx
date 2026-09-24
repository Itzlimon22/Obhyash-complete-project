import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, Hind_Siliguri, Anek_Bangla } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Toaster } from "sonner";
import AuthProvider from "@/components/auth/AuthProvider";
import SWRProvider from "@/components/providers/SWRProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ReferralCatcher from "@/components/ReferralCatcher";
import NetworkStatusListener from "@/components/common/NetworkStatusListener";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

// ✅ Configure Inter (English, numbers, units, badges, UI elements)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// ✅ Configure Hind Siliguri (Bengali Unicode body text)
const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// ✅ Configure Anek Bangla (1:1 with Flutter App Typography for titles, cards, badges & numerals)
const anekBangla = Anek_Bangla({
  variable: "--font-anek",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://obhyash.com"),
  title: {
    template: "%s | Obhyash (অভ্যাস)",
    default: "Obhyash (অভ্যাস) - The Smart Exam Platform for Students",
  },
  description:
    "অভ্যাস (Obhyash) - বাংলাদেশের শিক্ষার্থীদের জন্য স্মার্ট এক্সাম ও প্র্যাকটিস প্ল্যাটফর্ম। হাজারো বোর্ড ও ভর্তি পরীক্ষার প্রশ্ন প্র্যাকটিস, নির্ভুল ব্যাখ্যা এবং স্মার্ট মিস্টেক নোটবুক।",
  keywords: [
    "obhyash",
    "অভ্যাস",
    "obhyash app",
    "অভ্যাস অ্যাপ",
    "obhyash web",
    "hsc exam preparation",
    "admission test",
    "question bank",
    "প্রশ্ন ব্যাংক",
    "মডেল টেস্ট",
    "smart exam platform",
    "medical admission preparation",
    "buet admission test",
  ],
  authors: [{ name: "Obhyash Team" }],
  creator: "Obhyash",
  publisher: "Obhyash",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Obhyash (অভ্যাস) - Smart Exam Platform",
    description:
      "অভ্যাস (Obhyash) - বাংলাদেশের শিক্ষার্থীদের জন্য স্মার্ট এক্সাম ও প্র্যাকটিস প্ল্যাটফর্ম। হাজারো বোর্ড ও ভর্তি পরীক্ষার প্রশ্ন প্র্যাকটিস ও পূর্ণাঙ্গ মডেল টেস্ট।",
    url: "https://obhyash.com",
    siteName: "Obhyash | অভ্যাস",
    locale: "bn_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Obhyash (অভ্যাস) - Smart Exam Platform",
    description:
      "হাজারো বোর্ড ও ভর্তি পরীক্ষার প্রশ্ন প্র্যাকটিস, স্মার্ট অ্যানালাইসিস এবং লাইভ লিডারবোর্ড।",
    creator: "@obhyash",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Obhyash",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0A09" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${hindSiliguri.variable} ${anekBangla.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icon-512.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var storedTheme = localStorage.getItem('theme');
                if (storedTheme === 'dark' || (!storedTheme && true)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body className="antialiased overflow-x-hidden selection:bg-brand-500/30 bg-paper-50 text-paper-900 dark:bg-paper-900 dark:text-paper-50 font-sans">
        <Suspense fallback={null}>
          <ThemeProvider>
            <AuthProvider>
              <ReferralCatcher />
              <NetworkStatusListener />
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
                    className: "font-anek !rounded-2xl shadow-2xl !border-0",
                    style: {
                      padding: "16px",
                    },
                  }}
                />
                <Analytics />
                <SpeedInsights />
              </SWRProvider>
            </AuthProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}
