import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'রেজিস্ট্রেশন / লগ ইন | Obhyash (অভ্যাস)',
  description:
    'অভ্যাস (Obhyash)-এ লগইন বা রেজিস্ট্রেশন করুন। হাজার হাজার বোর্ড ও ভর্তি পরীক্ষার প্রশ্ন প্র্যাকটিস করে নিজের প্রস্তুতিকে এগিয়ে রাখুন।',
  openGraph: {
    title: 'রেজিস্ট্রেশন / লগ ইন | Obhyash',
    description:
      'অভ্যাস (Obhyash)-এ লগইন বা রেজিস্ট্রেশন করুন। হাজার হাজার বোর্ড ও ভর্তি পরীক্ষার প্রশ্ন প্র্যাকটিস করে নিজের প্রস্তুতিকে এগিয়ে রাখুন।',
    url: 'https://obhyash.com/login',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
