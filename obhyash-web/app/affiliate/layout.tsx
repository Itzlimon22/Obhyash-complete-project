import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'পার্টনার ও অ্যাফিলিয়েট প্রোগ্রাম | পড়াশোনার পাশাপাশি আয় - অভ্যাস (Obhyash)',
  description:
    'সহপাঠীদের পড়াশোনায় সহায়তার পাশাপাশি অভ্যাসের প্রিমিয়াম এক্সাম প্যাক রেফার করে প্রতি বিক্রয়ে সর্বোচ্চ ৩৫% পর্যন্ত সরাসরি ক্যাশ কমিশন অর্জন করুন।',
  alternates: {
    canonical: 'https://obhyash.com/affiliate',
  },
  openGraph: {
    title: 'পড়াশোনার পাশাপাশি স্বাবলম্বী হোন | অভ্যাস পার্টনার প্রোগ্রাম',
    description:
      'সহপাঠীদের পড়াশোনায় সহায়তা করার পাশাপাশি অভ্যাসের প্রিমিয়াম এক্সাম প্যাক রেফার করে প্রতি বিক্রয়ে অর্জন করুন আকর্ষণীয় ক্যাশ কমিশন।',
    url: 'https://obhyash.com/affiliate',
    siteName: 'Obhyash',
    locale: 'bn_BD',
    type: 'website',
  },
};

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
