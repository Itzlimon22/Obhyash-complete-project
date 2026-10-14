'use client';

import Image from 'next/image';
import { CheckCircle2, Sparkles, Zap, ShieldCheck, WifiOff } from 'lucide-react';

interface MockupFeature {
  badge: string;
  title: string;
  description: string;
  points: string[];
  imageSrc: string;
  fallbackGradient: string;
  screenTitle: string;
  accentIcon: typeof Sparkles;
}

const MOCKUP_FEATURES: MockupFeature[] = [
  {
    badge: 'গোছানো সিলেবাস',
    title: 'বিষয় ও পত্রভিত্তিক আলাদা মডিউল',
    description:
      'পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত ও জীববিজ্ঞানের ১ম ও ২য় পত্রের সব অধ্যায় এক ক্লিকেই হাতের মুঠোয়।',
    points: ['১ম ও ২য় পত্রের আলাদা ড্যাশবোর্ড', 'অধ্যায়ভিত্তিক চ্যাপ্টার নেভিগেশন', 'বোর্ড পরীক্ষার সাম্প্রতিক সিলেবাস'],
    imageSrc: '/mockups/s25-subjects-straight.png',
    fallbackGradient: 'from-blue-600 via-indigo-700 to-purple-850',
    screenTitle: 'বিষয় ভিত্তিক ক-খ হ্যান্ডনোট',
    accentIcon: Sparkles,
  },
  {
    badge: 'স্মার্ট রিভিশন টুলস',
    title: 'দ্রুত রিভিশন শিট, হ্যান্ডনোট ও মাইন্ড ম্যাপস',
    description:
      'শুধু ক ও খ নয়, সাথে থাকছে পুরো অধ্যায়ের সামারি, অনুশীলনীর সমাধান এবং কালারফুল মাইন্ড ম্যাপস।',
    points: ['বোর্ড স্ট্যান্ডার্ড নির্ভুল উত্তরমালা', 'এক নজরে মাইন্ড ম্যাপ ও কনসেপ্ট চার্ট', 'বোল্ড কি-ওয়ার্ড সহ সহজ উপস্থাপনা'],
    imageSrc: '/mockups/s25-notes-straight.png',
    fallbackGradient: 'from-emerald-600 via-teal-700 to-slate-900',
    screenTitle: 'হ্যান্ডরিটেন নোটস ও রিভিশন শিট',
    accentIcon: Zap,
  },
  {
    badge: 'মাস্টার ফর্মুলা ব্যাংক (Σ)',
    title: 'সব বিষয়ের গাণিতিক সূত্র এক জায়গায়',
    description:
      'পরীক্ষার আগের রাতে কিংবা ম্যাথ সলভ করার সময় সূত্র মনে করতে বেগ পেতে হবে না। প্রতিটি অধ্যায়ের সব সূত্র সাজানো।',
    points: ['পদার্থ, রসায়ন ও গণিতের সকল সূত্র', 'প্রতিটি সূত্রের চলক ও এককের পরিচয়', 'গুরুত্বপূর্ণ শর্টকাট টেকনিক ও টিপস'],
    imageSrc: '/mockups/s25-formula-straight.png',
    fallbackGradient: 'from-amber-600 via-orange-700 to-slate-900',
    screenTitle: 'অধ্যায়ভিত্তিক ফর্মুলা ব্যাংক (Σ)',
    accentIcon: ShieldCheck,
  },
  {
    badge: '১০০% অফলাইন সাপোর্ট',
    title: 'ইন্টারনেট ছাড়াই যেকোনো জায়গায় পড়াশোনা',
    description:
      'একবার নোট ওপেন করলেই সেটি ফোনে স্বয়ংক্রিয়ভাবে সেভ হয়ে থাকবে। বাসে, কলেজে কিংবা লোডশেডিংয়েও পড়া থামবে না।',
    points: ['জিরো বাফারিং ও তাৎক্ষণিক পেজ লোড', 'কোনো বিরক্তিকর পপ-আপ বিজ্ঞাপন নেই', 'চোখের সুরক্ষায় ডার্ক মোড সাপোর্ট'],
    imageSrc: '/mockups/s25-offline-straight.png',
    fallbackGradient: 'from-purple-600 via-pink-700 to-slate-900',
    screenTitle: 'অফলাইন রিডার ও ডার্ক মোড',
    accentIcon: WifiOff,
  },
];

export function AppMockupGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 my-12 sm:my-16">
      {MOCKUP_FEATURES.map((item, idx) => {
        const IconComponent = item.accentIcon;
        return (
          <div
            key={idx}
            className="group relative rounded-3xl bg-gradient-to-b from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-9 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500 pointer-events-none" />

            {/* Feature Content */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                  <IconComponent className="w-3.5 h-3.5" />
                  {item.badge}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2.5">
                {item.title}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                {item.description}
              </p>

              {/* Bullet Points */}
              <ul className="space-y-2.5">
                {item.points.map((pt, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Smartphone Mockup Frame (Samsung S25 Style) */}
            <div className="relative mx-auto w-full max-w-[260px] sm:max-w-[280px] aspect-[9/19] rounded-[2.8rem] p-2.5 bg-slate-900 border-[3px] border-slate-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] flex flex-col items-center transition-transform duration-500 ease-out group-hover:scale-[1.03] group-hover:-translate-y-2">
              {/* Dynamic Island / Punch Hole */}
              <div className="w-4 h-4 rounded-full bg-black border border-slate-700/60 mb-2 shrink-0 z-20" />

              {/* Screen Body */}
              <div className="relative w-full flex-1 rounded-[2.2rem] overflow-hidden bg-slate-950 flex flex-col">
                <Image
                  src={item.imageSrc}
                  alt={item.title}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 260px, 280px"
                  className="object-cover object-top"
                  onError={(e) => {
                    // Fallback to stylized screen if image file not yet present
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />

                {/* Styled CSS Screen Fallback (Displays cleanly before user uploads actual mockups) */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.fallbackGradient} p-5 flex flex-col justify-between text-white -z-10`}
                >
                  <div className="pt-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block mb-1">
                      অভ্যাস • নোটস
                    </span>
                    <h4 className="text-base font-bold leading-tight">
                      {item.screenTitle}
                    </h4>
                  </div>

                  <div className="space-y-2 pb-6">
                    <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                      <div className="w-16 h-2 bg-white/40 rounded-full mb-1.5" />
                      <div className="w-32 h-2.5 bg-white/80 rounded-full" />
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                      <div className="w-12 h-2 bg-white/40 rounded-full mb-1.5" />
                      <div className="w-28 h-2.5 bg-white/80 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Navigation Gesture Bar */}
              <div className="w-20 h-1 bg-slate-700/80 rounded-full mt-2 shrink-0" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
