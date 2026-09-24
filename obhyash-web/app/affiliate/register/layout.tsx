import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'অ্যাফিলিয়েট রেজিস্ট্রেশন ফর্ম | অভ্যাস পার্টনার প্রোগ্রাম',
  description:
    'অভ্যাস অ্যাফিলিয়েট প্রোগ্রামে যুক্ত হতে ফর্মটি পূরণ করুন। সহপাঠীদের মাঝে স্মার্ট প্রস্তুতি ছড়িয়ে দিয়ে নিশ্চিত করুন আকর্ষণীয় কমিশন।',
};

export default function AffiliateRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
