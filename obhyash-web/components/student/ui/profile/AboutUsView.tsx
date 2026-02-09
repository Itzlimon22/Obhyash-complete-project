'use client';

import React, { useState } from 'react';
import { POLICY_CONTENT } from '@/lib/constants/policies';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Globe,
  Shield,
  Scale,
  RefreshCw,
  Flame,
} from 'lucide-react';

type PolicyKey = keyof typeof POLICY_CONTENT;

interface Section {
  id?: number;
  title: string;
  content: string | string[];
  warning?: string;
  icon?: React.ReactNode;
}

const KEY_ICONS: Record<
  PolicyKey,
  React.ReactElement<{ className?: string }>
> = {
  about: <Flame className="w-5 h-5 text-indigo-500" />,
  privacy: <Shield className="w-5 h-5 text-emerald-500" />,
  terms: <Scale className="w-5 h-5 text-blue-500" />,
  refund: <RefreshCw className="w-5 h-5 text-rose-500" />,
};

export default function AboutUsView() {
  const [activePolicy, setActivePolicy] = useState<PolicyKey>('about');

  const content = POLICY_CONTENT[activePolicy];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="relative overflow-hidden bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 p-8 md:p-12 shadow-sm">
        <div className="absolute top-0 right-0 -tranneutral-y-1/2 tranneutral-x-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity" />
            {KEY_ICONS[activePolicy]}
            <div className="absolute inset-0 border-2 border-indigo-600/20 rounded-3xl animate-pulse" />
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-white font-serif-exam">
              {content.title}
            </h1>
            <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium italic">
              {content.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,3fr] gap-8">
        {/* Navigation - Sidebar (Desktop) / Chips (Mobile) */}
        <div className="space-y-4">
          <div className="lg:sticky lg:top-8 space-y-2">
            <h3 className="text-sm font-black text-neutral-400 dark:text-neutral-600 px-4 uppercase tracking-widest hidden lg:block">
              সেকশন নির্বাচন করুন
            </h3>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block space-y-1">
              {(Object.keys(POLICY_CONTENT) as PolicyKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setActivePolicy(key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group',
                    activePolicy === key
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none translate-x-1'
                      : 'hover:bg-white dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-xl transition-colors',
                      activePolicy === key
                        ? 'bg-white/20'
                        : 'bg-neutral-100 dark:bg-neutral-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30',
                    )}
                  >
                    {React.cloneElement(KEY_ICONS[key], {
                      className: cn(
                        'w-4 h-4',
                        activePolicy === key ? 'text-white' : '',
                      ),
                    })}
                  </div>
                  <span className="font-bold flex-1 text-left">
                    {POLICY_CONTENT[key].title}
                  </span>
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 transition-transform',
                      activePolicy === key
                        ? 'opacity-100 translate-x-1'
                        : 'opacity-0 -translate-x-2',
                    )}
                  />
                </button>
              ))}
            </div>

            {/* Mobile Chips */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 px-4 scrollbar-none no-scrollbar -mx-4 md:mx-0 md:px-0">
              {(Object.keys(POLICY_CONTENT) as PolicyKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setActivePolicy(key)}
                  className={cn(
                    'flex-none flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap',
                    activePolicy === key
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400',
                  )}
                >
                  {React.cloneElement(KEY_ICONS[key], {
                    className: cn(
                      'w-4 h-4',
                      activePolicy === key ? 'text-white' : '',
                    ),
                  })}
                  {POLICY_CONTENT[key].title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePolicy}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-6 md:space-y-8"
            >
              {/* Description Section */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 p-6 md:p-10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                <p className="text-base md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
                  {content.description}
                </p>
              </div>

              {/* Policy Sections */}
              <div className="grid gap-4 md:gap-6">
                {(content.sections as Section[]).map((section, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group"
                  >
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 p-5 md:p-8 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
                      <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                        <div className="flex-none flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 font-black text-lg shadow-inner group-hover:scale-110 transition-transform">
                          {section.id || idx + 1}
                        </div>
                        <div className="flex-1 space-y-3 md:space-y-4">
                          <h3 className="text-lg md:text-xl font-black text-neutral-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {section.title}
                          </h3>
                          <div className="space-y-3">
                            {Array.isArray(section.content) ? (
                              <ul className="grid gap-3">
                                {section.content.map((item, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-3 text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm md:text-base"
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2" />
                                    <span className="flex-1">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm md:text-base">
                                {section.content}
                              </p>
                            )}
                          </div>
                          {section.warning && (
                            <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center gap-2">
                              <span className="text-lg">⚠️</span>
                              {section.warning}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center py-12 text-neutral-400 dark:text-neutral-600 text-sm font-bold">
        <p>
          © {new Date().getFullYear()} Obhyash Exam Platform - Built for
          Excellence
        </p>
        <p className="mt-1">সর্বশেষ আপডেট: ০৪ ফেব্রুয়ারি, ২০২৬</p>
      </div>
    </div>
  );
}
