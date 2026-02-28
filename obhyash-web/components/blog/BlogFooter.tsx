'use client';

import Link from 'next/link';
import {
  Flame,
  Mail,
  Facebook,
  Twitter,
  Youtube,
  ArrowRight,
} from 'lucide-react';

export default function BlogFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-[#2b2b2b] bg-white dark:bg-[#121212] mt-20 font-anek">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand & About */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2.5 group w-max">
              <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-slate-900 group-hover:scale-105 transition-transform duration-200">
                <Flame className="w-[18px] h-[18px]" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                অভ্যাস ব্লগ
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              বাংলাদেশের শিক্ষার্থীদের এসএসসি, এইচএসসি এবং অ্যাডমিশন পরীক্ষার
              প্রস্তুতিকে আরও সহজ এবং কার্যকর করার জন্য অভ্যাস প্ল্যাটফর্মের
              একটি উদ্যোগ। আমাদের ব্লগে পাবেন সেরা স্টাডি টিপস, পরীক্ষার কৌশল
              এবং অনুপ্রেরণামূলক আর্টিকেল।
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4 mt-2">
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#383838] text-slate-500 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-900 transition-all"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#383838] text-slate-500 hover:text-sky-500 hover:border-sky-200 dark:hover:border-sky-900 transition-all"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#383838] text-slate-500 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900 transition-all"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-5">
              ক্যাটাগরি সমূহ
            </h3>
            <ul className="space-y-3.5 text-[15px] font-medium text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  href="/blog"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 group"
                >
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all text-rose-500" />
                  সকল আর্টিকেল
                </Link>
              </li>
              <li>
                <Link
                  href="/blog?category=Study+Tips"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 group"
                >
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all text-rose-500" />
                  স্টাডি টিপস
                </Link>
              </li>
              <li>
                <Link
                  href="/blog?category=Exam+Prep"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 group"
                >
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all text-rose-500" />
                  পরীক্ষার প্রস্তুতি
                </Link>
              </li>
              <li>
                <Link
                  href="/blog?category=MCQ+Techniques"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 group"
                >
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all text-rose-500" />
                  MCQ কৌশল
                </Link>
              </li>
              <li>
                <Link
                  href="/blog?category=Motivation"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 group"
                >
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all text-rose-500" />
                  অনুপ্রেরণা
                </Link>
              </li>
            </ul>
          </div>

          {/* Important Links & Support */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-5">
              প্রয়োজনীয় লিংক
            </h3>
            <ul className="space-y-3.5 text-[15px] font-medium text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  href="/"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  হোমপেজ
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  আমাদের সম্পর্কে
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  লগইন করুন
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  ফ্রি অ্যাকাউন্ট
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  সাধারণ জিজ্ঞাসা
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Contact */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-5">
              যোগাযোগ ও পলিসি
            </h3>
            <ul className="space-y-3.5 text-[15px] font-medium text-slate-600 dark:text-slate-400 mb-6">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-slate-400" />
                <a
                  href="mailto:support@obhyash.com"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  support@obhyash.com
                </a>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  প্রাইভেসি পলিসি
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  শর্তাবলী (Terms)
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  রিফান্ড পলিসি
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-100 dark:border-[#2b2b2b] flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-slate-500 dark:text-slate-400">
          <p>© {currentYear} অভ্যাস (Obhyash)। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="flex items-center gap-1.5">
            শিক্ষার্থীদের জন্য{' '}
            <span className="text-rose-500 animate-pulse">❤️</span> নিয়ে তৈরি
          </p>
        </div>
      </div>
    </footer>
  );
}
