'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, ExternalLink } from 'lucide-react';
import { PolicyDocument } from '@/lib/constants/legal-content';

interface PolicyPageShellProps {
  document: PolicyDocument;
  activeSlug: 'about' | 'privacy' | 'terms' | 'refund';
}

export default function PolicyPageShell({
  document,
  activeSlug,
}: PolicyPageShellProps) {
  const isFrameless =
    activeSlug === 'privacy' || activeSlug === 'terms' || activeSlug === 'refund';

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0C0E] text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300 transition-colors">
      {/* ── Top Header with Official Logo (Hidden on Frameless Pages: Privacy, Terms, Refund) ── */}
      {!isFrameless && (
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 dark:bg-[#0B0C0E]/90 border-b border-slate-200/80 dark:border-zinc-800/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-[#071500] border border-emerald-900/30 shadow-sm group-hover:scale-105 transition-transform duration-200">
                <img
                  src="/obhyash_logo.svg"
                  alt="Obhyash Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col items-start -space-y-0.5 select-none">
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.15em] leading-none font-sans">
                  OBHYASH
                </span>
                <span className="text-xl font-black text-emerald-800 dark:text-emerald-400 leading-none">
                  অভ্যাস
                </span>
              </div>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100 dark:bg-zinc-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/70 dark:border-zinc-700/60 transition-all duration-150"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              হোম পেজে ফিরুন
            </Link>
          </div>
        </header>
      )}

      {/* ── Document Body ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {activeSlug === 'refund' ? (
          <div className="max-w-2xl mx-auto py-12 sm:py-20 text-center space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              We are sorry you had to visit this page.
            </h1>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
              <p>
                At Obhyash.com, we are committed to providing exceptional value and service.
              </p>
              <p>
                By completing your subscription purchase, you acknowledge and agree that the sale is final and non-refundable. We encourage our customers to review all subscription details before finalizing a purchase.
              </p>
              <p>
                Our customer support team remains available to assist you with any questions or concerns you may have regarding your subscription.
              </p>
              <p>
                By purchasing a subscription, you are agreeing to our terms and conditions and the no-refund policy. Your satisfaction is important to us, and we are here to support you in making the most of your subscription.
              </p>
            </div>

            <div className="pt-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Support contact:{' '}
              <a
                href="mailto:support@obhyash.com"
                className="hover:underline text-emerald-600 dark:text-emerald-400 font-medium"
              >
                support@obhyash.com
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Document Header */}
            {isFrameless ? (
              <div className="mb-8 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-6">
                  {document.title}
                </h1>
              </div>
            ) : (
              <div className="mb-8 border-b border-slate-200 dark:border-zinc-800/80 pb-6">
                <div className="text-xs font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 mb-2">
                  {document.badge}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                  {document.title}
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mb-4">
                  {document.subtitle}
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-500">
                  Last Updated: <span className="font-semibold text-slate-700 dark:text-slate-300">{document.lastUpdated}</span> • Effective across Obhyash Web & Mobile Application
                </div>
              </div>
            )}

            {/* Overview Paragraph */}
            <div className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-8">
              {document.description}
            </div>

            {/* Content Sections as Clean Typography */}
            <div className="space-y-8">
              {document.sections.map((section, idx) => (
                <section key={idx} className="pt-6 border-t border-slate-100 dark:border-zinc-800/60 first:border-t-0 first:pt-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
                    {section.title}
                  </h2>

                  <div className="space-y-3 text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                    {section.content.map((item, itemIdx) => {
                      if (item.startsWith('• ') || item.startsWith('- ')) {
                        return (
                          <div key={itemIdx} className="flex items-start gap-2 pl-2">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                            <span className="leading-relaxed">{item.substring(2)}</span>
                          </div>
                        );
                      }
                      const colonIndex = item.indexOf(':');
                      if (colonIndex > 0 && colonIndex < 40) {
                        const label = item.substring(0, colonIndex);
                        const rest = item.substring(colonIndex + 1);
                        return (
                          <p key={itemIdx} className="leading-relaxed">
                            <strong className="text-slate-900 dark:text-white font-semibold">
                              {label}:
                            </strong>
                            {rest}
                          </p>
                        );
                      }
                      return (
                        <p key={itemIdx} className="leading-relaxed">
                          {item}
                        </p>
                      );
                    })}
                  </div>

                  {section.callout && (
                    <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/25 border-l-4 border-amber-500 text-sm sm:text-base text-amber-900 dark:text-amber-200 leading-relaxed">
                      {section.callout}
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Contact Support Section (Hidden on Frameless Pages) */}
            {!isFrameless && (
              <div className="mt-12 pt-8 border-t border-slate-200 dark:border-zinc-800/80">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  যোগাযোগ ও সহায়তা (Contact & Support)
                </h2>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  আমাদের নীতিমালা, রিফান্ড প্রক্রিয়া বা অ্যাকাউন্ট সংক্রান্ত যেকোনো তথ্য বা সহায়তার জন্য সরাসরি আমাদের সাপোর্ট ইমেইলে যোগাযোগ করতে পারেন:
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-100 font-semibold text-sm">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <a href="mailto:support@obhyash.com" className="hover:underline text-emerald-700 dark:text-emerald-400">
                    support@obhyash.com
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Clean Footer (Hidden on Frameless Pages) ── */}
      {!isFrameless && (
        <footer className="border-t border-slate-200/80 dark:border-zinc-800/80 py-8 text-xs text-slate-500 dark:text-slate-400 mt-16 bg-slate-50/50 dark:bg-black/40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 Obhyash. Developed by S. M Sahabul Alam. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4 font-medium text-slate-600 dark:text-slate-400">
              <Link href="/about-us" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                About Us
              </Link>
              <Link href="/privacy-policy" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                Privacy Policy
              </Link>
              <Link href="/terms-and-conditions" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                Terms & Conditions
              </Link>
              <Link href="/refund-policy" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                Refund Policy
              </Link>
              <Link href="/affiliate" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                Affiliate
              </Link>
              <Link href="/delete-account" className="hover:text-rose-600 dark:hover:text-rose-400">
                Delete Account
              </Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
