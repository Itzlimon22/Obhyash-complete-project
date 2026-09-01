'use client';

import React from 'react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  ShieldAlert,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

export const PrivacyPolicyView: React.FC = () => {
  const cardContainerClass =
    'bg-white dark:bg-[#18181B] rounded-[18px] p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#27272A] shadow-xs mb-4';

  const POLICIES = [
    {
      icon: UserCheck,
      iconColor: '#3B82F6',
      title: '১. আমরা যেসব তথ্য সংগ্রহ করি',
      items: [
        'ব্যক্তিগত তথ্য: নাম, ইমেইল অ্যাড্রেস, ফোন নম্বর এবং প্রোফাইল পিকচার।',
        'একাডেমিক প্রোফাইল: ক্লাস/এইচএসসি ব্যাচ, শিক্ষাপ্রতিষ্ঠানের নাম, গ্রুপ ও টার্গেট।',
        'পরীক্ষার ডেটা: বিষয়ভিত্তিক মক টেস্ট স্কোর, বিস্তারিত উত্তরপত্র ও এনালাইসিস।',
        'ব্যবহারের তথ্য: প্রতিদিনের প্র্যাকটিস স্ট্রিক ও লিডারবোর্ড এক্সপি (XP)।',
      ],
    },
    {
      icon: Lock,
      iconColor: '#10B981',
      title: '২. তথ্য যেভাবে সুরক্ষিত রাখা হয়',
      items: [
        'সকল যোগাযোগ ও ডেটা ট্রানজেকশন আন্তর্জাতিক মানের এনক্রিপশনের মাধ্যমে সুরক্ষিত।',
        'শিক্ষার্থীর পাসওয়ার্ড অত্যন্ত শক্তিশালী নিরাপত্তা পদ্ধতিতে সংরক্ষিত থাকে।',
        'নিরাপদ ও আধুনিক ক্লাউড সার্ভারে ২৪/৭ কঠোর সুরক্ষায় ডেটা সংরক্ষিত হয়।',
      ],
    },
    {
      icon: ShieldAlert,
      iconColor: '#F59E0B',
      title: '৩. তথ্যের গোপনীয়তা ও বিশ্বস্ততা',
      items: [
        'Obhyash কখনোই শিক্ষার্থীদের কোনো ব্যক্তিগত তথ্য তৃতীয় কোনো পক্ষের কাছে বিক্রি বা শেয়ার করে না।',
        'তথ্য শুধুমাত্র অ্যাপের ভেতর পারসোনালাইজড প্র্যাকটিস রিপোর্ট ও পরীক্ষার পারফরম্যান্স ট্র্যাক করতে ব্যবহৃত হয়।',
      ],
    },
    {
      icon: ImageIcon,
      iconColor: '#8B5CF6',
      title: '৪. ডিভাইস পারমিশন ব্যবহারের নিয়ম',
      items: [
        'গ্যালারি পারমিশন কেবল প্রোফাইল ছবি ও অ্যাভাটার আপলোডের জন্য ব্যবহৃত হয়।',
        'অনুমতি ছাড়া ব্যাকগ্রাউন্ডে কোনো মিডিয়া বা ফাইল স্ক্যান করা হয় না।',
      ],
    },
    {
      icon: Trash2,
      iconColor: '#EF4444',
      title: '৫. শিক্ষার্থীর ডেটা অধিকার ও মুছার সুবিধা',
      items: [
        'যেকোনো সময় প্রোফাইল এডিট বা ছবি পরিবর্তন করার সম্পূর্ণ স্বাধীনতা রয়েছে।',
        'চাইলে আমাদের সাপোর্টে মেসেজ দিয়ে সম্পূর্ণ অ্যাকাউন্ট ও পরীক্ষার ইতিহাস মুছে ফেলার রিকোয়েস্ট করা যায়।',
      ],
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-3 py-3 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── 1. Hero Banner (1:1 with Flutter) ── */}
      <div className="p-6 sm:p-7 rounded-[22px] bg-gradient-to-br from-[#ECFDF5] to-[#F0FDF4] dark:from-[#14241E] dark:to-[#0F1714] border border-[#059669]/20 dark:border-[#059669]/35 shadow-md shadow-[#059669]/10 text-center mb-5">
        <div className="w-15 h-15 rounded-full bg-[#059669]/12 dark:bg-[#059669]/25 border border-[#059669]/40 flex items-center justify-center text-[#10B981] mx-auto mb-3.5">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white">
          গোপনীয়তা ও নিরাপত্তা নীতি
        </h2>
        <p className="text-xs sm:text-sm text-[#475569] dark:text-[#A1A1AA] mt-1.5 leading-relaxed max-w-md mx-auto">
          তোমার ব্যক্তিগত ও একাডেমিক তথ্যের শতভাগ নিরাপত্তা আমাদের সর্বোচ্চ অগ্রাধিকার।
        </p>

        <div className="mt-3 inline-block px-3 py-1 rounded-full bg-[#E2E8F0] dark:bg-[#27272A] text-[11px] font-bold text-[#64748B] dark:text-[#A1A1AA]">
          সর্বশেষ হালনাগাদ: ১৫ আগস্ট, ২০২৬
        </div>
      </div>

      {/* ── 2. Policy Cards (1:1 with Flutter) ── */}
      {POLICIES.map((p, idx) => {
        const Icon = p.icon;
        return (
          <div key={idx} className={cardContainerClass}>
            <div className="flex items-center gap-2.5 mb-3.5">
              <div
                className="p-1.5 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${p.iconColor}15`, color: p.iconColor }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] dark:text-white">
                {p.title}
              </h3>
            </div>

            <ul className="space-y-2">
              {p.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-start gap-2 text-xs sm:text-sm text-[#334155] dark:text-[#D4D4D8] leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0 mt-1.5" />
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
          প্রশ্ন বা সহায়তার জন্য লিখুন:{' '}
          <a
            href="mailto:support@obhyash.com"
            className="text-[#059669] font-bold hover:underline"
          >
            support@obhyash.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyView;
