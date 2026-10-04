'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  Facebook,
  Youtube,
  Users,
  ArrowRight,
} from 'lucide-react';
import { trackBlogConversion } from '@/lib/track-blog-conversion';

export default function BlogFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-[#2b2b2b] bg-white dark:bg-[#121212] mt-20 font-anek">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand & About */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 group w-max"
              aria-label="অভ্যাস হোমপেজ"
            >
              {/* Light mode logo */}
              <Image
                src="/obhyash_full_logo.svg"
                alt="অভ্যাস"
                width={132}
                height={34}
                className="h-8 w-auto object-contain dark:hidden group-hover:opacity-90 transition-opacity"
              />
              {/* Dark mode logo */}
              <Image
                src="/obhyash_full_logo_dark.svg"
                alt="অভ্যাস"
                width={132}
                height={34}
                className="h-8 w-auto object-contain hidden dark:block group-hover:opacity-90 transition-opacity"
              />
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-neutral-100 dark:bg-zinc-800 text-rose-600 dark:text-rose-400 border border-neutral-200 dark:border-zinc-700">
                ব্লগ
              </span>
            </Link>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              বাংলাদেশের শিক্ষার্থীদের এসএসসি, এইচএসসি এবং অ্যাডমিশন পরীক্ষার
              প্রস্তুতিকে আরও সহজ এবং কার্যকর করার জন্য অভ্যাস প্ল্যাটফর্মের
              একটি উদ্যোগ। আমাদের ব্লগে পাবেন সেরা স্টাডি টিপস, পরীক্ষার কৌশল
              এবং অনুপ্রেরণামূলক আর্টিকেল।
            </p>

            {/* Social Links (Facebook Page, Facebook Group, YouTube) */}
            <div className="flex items-center gap-3 mt-1">
              {/* Facebook Page */}
              <a
                href="https://www.facebook.com/obhyash.official"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Obhyash Facebook Page"
                title="অভ্যাস অফিসিয়াল ফেসবুক পেজ"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#383838] text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-800 transition-all text-xs font-semibold"
              >
                <Facebook className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>ফেসবুক পেজ</span>
              </a>

              {/* Facebook Group */}
              <a
                href="https://www.facebook.com/groups/obhyash"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Obhyash Facebook Community Group"
                title="অভ্যাস শিক্ষার্থী কমিউনিটি গ্রুপ"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#383838] text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-800 transition-all text-xs font-semibold"
              >
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>গ্রুপ</span>
              </a>

              {/* YouTube Channel */}
              <a
                href="https://www.youtube.com/@phymathnerds"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Obhyash YouTube Channel"
                title="অভ্যাস অফিসিয়াল ইউটিউব চ্যানেল"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#383838] text-slate-600 dark:text-slate-300 hover:text-red-600 hover:border-red-300 dark:hover:border-red-800 transition-all text-xs font-semibold"
              >
                <Youtube className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0" />
                <span>ইউটিউব</span>
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
                  href="/blog?category=স্টাডি+টিপস+ও+রুটিন"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 group"
                >
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all text-rose-500" />
                  স্টাডি টিপস ও রুটিন
                </Link>
              </li>
              <li>
                <Link
                  href="/blog?category=এইচএসসি+প্রস্তুতি"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 group"
                >
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all text-rose-500" />
                  এইচএসসি ও বোর্ড প্রস্তুতি
                </Link>
              </li>
              <li>
                <Link
                  href="/blog?category=ক্যারিয়ার+ও+ভর্তি+গাইড"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 group"
                >
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all text-rose-500" />
                  ভর্তি পরীক্ষা গাইড
                </Link>
              </li>
              <li>
                <Link
                  href="/blog?category=বিষয়ভিত্তিক+পড়াশোনা"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 group"
                >
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all text-rose-500" />
                  বিষয়ভিত্তিক পড়াশোনা
                </Link>
              </li>
              <li>
                <Link
                  href="/blog?category=মোটিভেশন+ও+মানসিক+স্বাস্থ্য"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 group"
                >
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all text-rose-500" />
                  মোটিভেশন ও মানসিক স্বাস্থ্য
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
                  href="/about-us"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  আমাদের সম্পর্কে
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  onClick={() =>
                    trackBlogConversion({
                      eventType: 'login_click',
                      buttonLocation: 'footer',
                    })
                  }
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  লগইন করো
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  onClick={() =>
                    trackBlogConversion({
                      eventType: 'signup_click',
                      buttonLocation: 'footer',
                    })
                  }
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  ফ্রি অ্যাকাউন্ট
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  সাপোর্ট ও যোগাযোগ
                </Link>
              </li>
              <li>
                <Link
                  href="/demo"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  ফ্রি এক্সাম দাও
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
                  href="/about-us"
                  className="hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  About Us (আমাদের সম্পর্কে)
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  Privacy Policy (গোপনীয়তা নীতি)
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-and-conditions"
                  className="hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  Terms & Conditions (শর্তাবলি)
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  Refund Policy (রিফান্ড নীতি)
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
