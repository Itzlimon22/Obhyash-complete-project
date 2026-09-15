'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Flame,
  ArrowLeft,
  Mail,
  ShieldCheck,
  FileText,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { PolicyDocument } from '@/lib/constants/legal-content';

interface PolicyPageShellProps {
  document: PolicyDocument;
  activeSlug: 'about' | 'privacy' | 'terms' | 'refund';
}

export default function PolicyPageShell({
  document,
  activeSlug,
}: PolicyPageShellProps) {
  const pathname = usePathname();

  const NAV_TABS = [
    {
      label: 'About Us',
      href: '/about-us',
      slug: 'about',
      icon: Info,
    },
    {
      label: 'Privacy Policy',
      href: '/privacy-policy',
      slug: 'privacy',
      icon: ShieldCheck,
    },
    {
      label: 'Terms & Conditions',
      href: '/terms-and-conditions',
      slug: 'terms',
      icon: FileText,
    },
    {
      label: 'Refund Policy',
      href: '/refund-policy',
      slug: 'refund',
      icon: RefreshCw,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300 transition-colors">
      {/* ── Top Sticky Navigation Bar ── */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-slate-200/80 dark:border-zinc-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform duration-200">
              <Flame className="w-5 h-5 fill-white/20" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Obhyash
              </span>
              <span className="text-[10px] font-medium tracking-widest text-slate-500 dark:text-slate-400 uppercase -mt-1">
                Legal & Policies
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100 dark:bg-zinc-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/70 dark:border-zinc-700/60 transition-all duration-150"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ── Top Tabs (Chorcha Style) ── */}
        <div className="flex items-center gap-1 sm:gap-2 p-1 bg-slate-200/60 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 mb-8 overflow-x-auto no-scrollbar">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSlug === tab.slug;
            return (
              <Link
                key={tab.slug}
                href={tab.href}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-zinc-700/80'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* ── Hero Section ── */}
        <div className="mb-8 sm:mb-10 text-center sm:text-left border-b border-slate-200/80 dark:border-zinc-800 pb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 mb-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {document.badge}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2.5">
            {document.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed mb-4">
            {document.subtitle}
          </p>

          <div className="text-xs font-medium text-slate-500 dark:text-slate-500">
            Last Updated:{' '}
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              {document.lastUpdated}
            </span>{' '}
            • Effective across Obhyash Web & Android Mobile App
          </div>
        </div>

        {/* ── Overview Card ── */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 shadow-sm mb-8 leading-relaxed text-sm sm:text-base text-slate-700 dark:text-slate-300">
          {document.description}
        </div>

        {/* ── Policy Content Sections ── */}
        <div className="space-y-6">
          {document.sections.map((section, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/90 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
            >
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-start gap-2.5">
                <span className="text-slate-900 dark:text-white font-extrabold">
                  {section.title}
                </span>
              </h2>

              <ul className="space-y-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {section.content.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {section.callout && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2.5 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>{section.callout}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Help / Contact Banner ── */}
        <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950 border border-emerald-200/80 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Have questions or need assistance?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Our support team is available 7 days a week to help with your inquiries.
              </p>
            </div>
          </div>

          <a
            href="mailto:support@obhyash.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs sm:text-sm hover:bg-emerald-600 dark:hover:bg-emerald-400 dark:hover:text-black transition-colors shadow-sm shrink-0"
          >
            <Mail className="w-4 h-4" />
            support@obhyash.com
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>
      </main>

      {/* ── Minimalist Clean Footer ── */}
      <footer className="border-t border-slate-200 dark:border-zinc-800/80 py-8 text-center text-xs text-slate-500 dark:text-slate-400 mt-12 bg-white/60 dark:bg-black/60">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Obhyash. Developed by S. M Sahabul Alam. All rights reserved.</p>
          <div className="flex items-center gap-4 font-medium text-slate-600 dark:text-slate-400">
            <Link href="/about-us" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              About
            </Link>
            <Link href="/privacy-policy" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              Privacy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              Terms
            </Link>
            <Link href="/refund-policy" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              Refund
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
