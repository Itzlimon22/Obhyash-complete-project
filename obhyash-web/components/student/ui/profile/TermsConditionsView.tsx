'use client';

import React from 'react';
import {
  Scale,
  FileCheck,
  Cookie,
  Award,
  ShieldAlert,
  UserCheck,
  Zap,
} from 'lucide-react';

export const TermsConditionsView: React.FC = () => {
  const cardContainerClass =
    'bg-white dark:bg-[#18181B] rounded-[18px] p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#27272A] shadow-xs mb-4';

  const TERMS = [
    {
      icon: FileCheck,
      iconColor: '#10B981',
      title: '১. শর্তাবলী সম্মতি ও অ্যাকাউন্ট গাইডলাইন',
      items: [
        'Obhyash ওয়েবসাইট বা মোবাইল অ্যাপে প্রবেশের মাধ্যমে আপনি এই ব্যবহারকারী নির্দেশিকা ও শর্তাবলীতে পূর্ণ সম্মতি প্রদান করছেন।',
        'অ্যাকাউন্ট তৈরির সময় সঠিক নাম, শিক্ষাপ্রতিষ্ঠান ও মোবাইল নম্বর প্রদান করা আবশ্যক।',
      ],
    },
    {
      icon: Cookie,
      iconColor: '#06B6D4',
      title: '২. কুকিজ ও ডেটা ব্যবহার (Usage of Cookies)',
      items: [
        'আমাদের প্ল্যাটফর্ম ব্যবহারকারীর অভিজ্ঞতা উন্নত করতে কুকিজ ও লোকাল স্টোরেজ ব্যবহার করে।',
        'Obhyash ব্যবহারের মাধ্যমে আপনি আমাদের Privacy Policy অনুযায়ী কুকিজ ব্যবহারে সম্মতি দিচ্ছেন।',
        'কুকিজের মাধ্যমে লগইন সেশন মনে রাখা এবং সাইট ও অ্যাপকে অধিকতর দ্রুত ও ইউজার-ফ্রেন্ডলি করা হয়।',
      ],
    },
    {
      icon: Award,
      iconColor: '#8B5CF6',
      title: '৩. কপিরাইট ও লাইসেন্স (Copyright and Licenses)',
      items: [
        'অন্যথায় উল্লেখিত না থাকলে, Obhyash এবং/অথবা এর লাইসেন্সদাতারা এই প্ল্যাটফর্মের সকল কনটেন্ট ও প্রশ্নব্যাংকের পূর্ণ কপিরাইট ধারণ করে।',
        'সকল মেধাস্বত্ব ও কপিরাইট সংরক্ষিত। শিক্ষার্থীদের ব্যক্তিগত শিক্ষামূলক অনুশীলনের জন্য এটি ব্যবহারের অনুমতি দেওয়া হয়।',
      ],
    },
    {
      icon: ShieldAlert,
      iconColor: '#EF4444',
      title: '৪. কঠোরভাবে নিষিদ্ধ কার্যক্রম (Prohibitions)',
      items: [
        'Obhyash থেকে কোনো কনটেন্ট অনুমতি ছাড়া অন্য কোথাও পুনরায় প্রকাশ করা যাবে না।',
        'কনটেন্ট বিক্রি, ভাড়া দেওয়া, সাব-লাইসেন্স দেওয়া বা বাণিজ্যিকভাবে ব্যবহার করা সম্পূর্ণ নিষিদ্ধ।',
        'কোনো কনটেন্ট নকল (Duplicate), কপি বা অননুমোদিতভাবে রি-ডিস্ট্রিবিউট করা নিষিদ্ধ।',
        'অটোমেটেড স্ক্র্যাপিং, বট চালানো বা সিস্টেমে অননুমোদিত অ্যাক্সেসের চেষ্টা করা কঠোরভাবে নিষিদ্ধ।',
      ],
    },
    {
      icon: UserCheck,
      iconColor: '#F59E0B',
      title: '৫. ফেয়ার ইউজ পলিসি (Fair Use Policy)',
      items: [
        'ব্যবহারকারীদের অবশ্যই আমাদের ফেয়ার ইউজ পলিসি মেনে চলতে হবে এবং প্ল্যাটফর্মটি শুধুমাত্র ব্যক্তিগত অনুশীলনে ব্যবহার করতে হবে।',
        'আইডি-পাসওয়ার্ড অন্যান্য শিক্ষার্থীদের সাথে গ্রুপ শেয়ার করা বা বিক্রি করা কঠোরভাবে নিষিদ্ধ।',
        'ফেয়ার ইউজ পলিসি লঙ্ঘন করলে অ্যাকাউন্ট সাময়িক স্থগিত বা স্থায়ীভাবে ব্যান করা হতে পারে।',
      ],
    },
    {
      icon: Zap,
      iconColor: '#10B981',
      title: '৬. সার্ভিস ডেলিভারি টাইম (Delivery Time)',
      items: [
        'পেমেন্ট সম্পন্ন ও যাচাই হওয়ার সাথে সাথে ব্যবহারকারী তাত্ক্ষণিকভাবে নির্বাচিত প্রিমিয়াম প্ল্যানের সকল ফিচার ও এক্সেস পেয়ে যাবেন।',
        'Obhyash-এ কোনো অনাকাঙ্ক্ষিত অটো-রিনিউয়াল নেই। সাবস্ক্রিপশনের মেয়াদ শেষ হলে অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে ফ্রি প্ল্যানে চলে আসবে।',
      ],
    },
    {
      icon: Scale,
      iconColor: '#6366F1',
      title: '৭. কনটেন্টের নির্ভরযোগ্যতা ও দায়বদ্ধতা',
      items: [
        'Obhyash প্ল্যাটফর্মে প্রশ্ন ও তথ্যের সর্বোচ্চ নির্ভুলতা ও মান বজায় রাখার জন্য সার্বক্ষণিক আন্তরিক চেষ্টা করা হয়।',
        'প্রযোজ্য আইনের আওতায় প্ল্যাটফর্মের টেকনিক্যাল আধুনিকায়ন, নিরাপত্তা ও নিয়মিত আপডেট অব্যাহত থাকে।',
      ],
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-3 py-3 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── 1. Hero Banner (1:1 with Flutter) ── */}
      <div className="p-6 sm:p-7 rounded-[22px] bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] dark:from-[#1A2228] dark:to-[#101518] border border-[#0284C7]/20 dark:border-[#0284C7]/35 shadow-md shadow-[#0284C7]/10 text-center mb-5">
        <div className="w-15 h-15 rounded-full bg-[#0284C7]/12 dark:bg-[#0284C7]/25 border border-[#0284C7]/40 flex items-center justify-center text-[#38BDF8] mx-auto mb-3.5">
          <Scale className="w-7 h-7" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white">
          ব্যবহারের শর্তাবলী
        </h2>
        <p className="text-xs sm:text-sm text-[#475569] dark:text-[#A1A1AA] mt-1.5 leading-relaxed max-w-md mx-auto">
          Obhyash প্ল্যাটফর্ম ও মোবাইল অ্যাপ ব্যবহারের সার্বিক নীতিমালা ও নিয়মাবলী।
        </p>

        <div className="mt-3 inline-block px-3 py-1 rounded-full bg-[#E2E8F0] dark:bg-[#27272A] text-[11px] font-bold text-[#64748B] dark:text-[#A1A1AA]">
          নিয়মাবলি কার্যকর: ২০২৩-২০২৬
        </div>
      </div>

      {/* ── 2. Terms Cards (1:1 with Flutter) ── */}
      {TERMS.map((t, idx) => {
        const Icon = t.icon;
        return (
          <div key={idx} className={cardContainerClass}>
            <div className="flex items-center gap-2.5 mb-3.5">
              <div
                className="p-1.5 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${t.iconColor}15`, color: t.iconColor }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] dark:text-white">
                {t.title}
              </h3>
            </div>

            <ul className="space-y-2">
              {t.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-start gap-2 text-xs sm:text-sm text-[#334155] dark:text-[#D4D4D8] leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] shrink-0 mt-1.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {/* ── Footer ── */}
      <div className="text-center pt-2">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          শর্ত সংক্রান্ত যেকোনো প্রয়োজনে লিখুন:{' '}
          <a
            href="mailto:support@obhyash.com"
            className="text-[#0284C7] font-bold hover:underline"
          >
            support@obhyash.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default TermsConditionsView;
