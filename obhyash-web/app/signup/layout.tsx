import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'নতুন একাউন্ট তৈরি করুন (Sign Up) | Obhyash (অভ্যাস)',
  description:
    'বিনামূল্যে অভ্যাস একাউন্ট খুলে ফ্রি ডেমো টেস্ট ও অধ্যায়ভিত্তিক প্রশ্নব্যাংক প্র্যাকটিস শুরু করুন।',
  openGraph: {
    title: 'নতুন একাউন্ট তৈরি করুন | Obhyash',
    description:
      'বিনামূল্যে অভ্যাস একাউন্ট খুলে ফ্রি ডেমো টেস্ট ও অধ্যায়ভিত্তিক প্রশ্নব্যাংক প্র্যাকটিস শুরু করুন।',
    url: 'https://obhyash.com/signup',
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
