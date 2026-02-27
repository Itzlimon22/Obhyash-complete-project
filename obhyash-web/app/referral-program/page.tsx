import React from 'react';
import Link from 'next/link';
import { Gift, Share2, Sparkles, ArrowRight, Home } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Referral Program - Obhyash',
  description: 'Invite friends to Obhyash and earn free premium access.',
};

export default function ReferralProgramPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black font-anek overflow-hidden selection:bg-rose-200 dark:selection:bg-rose-900/40">
      {/* ── Navbar ── */}
      <nav className="absolute top-0 w-full z-50 p-4 sm:p-6 md:px-12 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-rose-600 to-rose-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <span className="font-serif-exam font-black text-xl">অ</span>
          </div>
          <span className="text-xl font-extrabold text-neutral-900 dark:text-white font-serif-exam tracking-tight">
            অভ্যাস
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm font-semibold flex items-center gap-2 bg-white dark:bg-[#121212] border border-neutral-200 dark:border-[#2b2b2b] px-4 py-2 rounded-full text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/50 shadow-sm transition-all"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">হোমে ফিরে যান</span>
        </Link>
      </nav>

      {/* ── Background decoration ── */}
      <div className="absolute top-0 inset-x-0 h-[50vh] bg-gradient-to-b from-rose-50 to-slate-50 dark:from-rose-950/20 dark:to-black"></div>
      <div className="absolute top-0 right-0 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-rose-200/40 dark:bg-rose-900/20 rounded-full blur-[80px] sm:blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

      <div className="relative pt-32 pb-20 px-4 sm:px-6 z-10">
        <div className="max-w-2xl mx-auto space-y-10">
          {/* ── Hero Section ── */}
          <section className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm shadow-sm md:animate-fade-in-up">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>প্রিমিয়াম আনলক করার সুযোগ!</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-[1.2] tracking-tight">
              বন্ধুদের আমন্ত্রণ জানাও, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-700">
                দুজনেই পাও প্রিমিয়াম!
              </span>
            </h1>
            <p className="text-[17px] sm:text-[19px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto font-medium">
              তোমার রেফারেল লিংক দিয়ে কোনো বন্ধু অভ্যাসে যুক্ত হলে তুমি এবং
              তোমার বন্ধু—দুজনেই পেয়ে যাবে ১ মাসের ফ্রি প্রিমিয়াম অ্যাক্সেস।
            </p>
          </section>

          {/* ── Value Proposition Card ── */}
          <section className="bg-white dark:bg-[#121212] border border-neutral-200 dark:border-[#2b2b2b] rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl shadow-rose-900/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-100 to-transparent dark:from-rose-900/30 rounded-full blur-2xl pointer-events-none" />

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              রেফারেল প্রোগ্রামের সুবিধা
            </h2>

            <ul className="space-y-4">
              {[
                {
                  title: '১ মাস ফ্রি প্রিমিয়াম',
                  desc: 'তোমার রেফার করা প্রতিটি সফল সাইনআপের জন্য ১ মাসের প্রিমিয়াম সাবস্ক্রিপশন সম্পূর্ণ ফ্রি।',
                },
                {
                  title: 'তোমার বন্ধুর জন্যও উপহার',
                  desc: 'তোমার লিংকের মাধ্যমে যে যুক্ত হবে, সে নিজেও পাবে দারুণ সব উপহার ও ফিচার ব্যবহারের সুযোগ।',
                },
                {
                  title: 'আনলিমিটেড রেফারেল',
                  desc: 'যত বেশি বন্ধুকে ইনভাইট করবে, তত বেশি মাসের প্রিমিয়াম তুমি অর্জন করতে পারবে।',
                },
              ].map((item, idx) => (
                <li
                  key={idx}
                  className="flex gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-100 dark:border-[#2b2b2b]"
                >
                  <div className="shrink-0 w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 font-black">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg mb-1">
                      {item.title}
                    </h3>
                    <p className="text-[14.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* ── How It Works ── */}
          <section>
            <h3 className="text-[13px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-6 text-center">
              কীভাবে শুরু করবে?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 relative">
              <div className="hidden sm:block absolute top-[28px] left-[15%] right-[15%] border-t-2 border-dashed border-slate-200 dark:border-slate-800 z-0"></div>

              {[
                {
                  icon: '🔗',
                  title: 'লিংক জেনারেট',
                  desc: 'অ্যাকাউন্টে লগইন করে নিজের ইউনিক রেফারেল লিংক বা কোড কপি করো।',
                },
                {
                  icon: (
                    <Share2 className="w-6 h-6 mx-auto text-rose-600 dark:text-rose-400" />
                  ),
                  title: 'শেয়ার করো',
                  desc: 'মেসেঞ্জার, হোয়াটসঅ্যাপ বা যেকোনো মাধ্যমে বন্ধুদের পাঠাও।',
                },
                {
                  icon: '🎉',
                  title: 'দুজনেই পুরস্কৃত হও',
                  desc: 'তারা রেজিস্টার করলেই অটোমেটিকভাবে তোমরা ১ মাসের প্রিমিয়াম পেয়ে যাবে।',
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="relative z-10 flex flex-col items-center text-center p-4"
                >
                  <div className="w-14 h-14 bg-white dark:bg-[#1a1a1a] border-4 border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm">
                    {step.icon}
                  </div>
                  <h4 className="font-bold text-[17px] text-slate-900 dark:text-slate-100 mb-2">
                    {step.title}
                  </h4>
                  <p className="text-[13.5px] text-slate-500 dark:text-slate-400 leading-[1.6] max-w-[200px] font-medium">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="text-center pt-6">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-lg shadow-xl shadow-rose-600/20 transition-all hover:-translate-y-1 active:scale-[0.98]"
            >
              এখুনি শুরু করুন
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-6">
              অ্যাকাউন্ট নেই?{' '}
              <Link
                href="/signup"
                className="text-rose-600 dark:text-rose-400 hover:underline font-bold"
              >
                এখানে অ্যাকাউন্ট তৈরি করুন
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
