'use client';

import React, { useState } from 'react';
import { POLICY_CONTENT } from '@/lib/constants/policies';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Globe,
  Mail,
  Shield,
  Scale,
  RefreshCw,
  Flame,
  Sparkles,
  Target,
  Camera,
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
  about: <Flame className="w-5 h-5 text-emerald-500" />,
  privacy: <Shield className="w-5 h-5 text-emerald-500" />,
  terms: <Scale className="w-5 h-5 text-emerald-600" />,
  refund: <RefreshCw className="w-5 h-5 text-emerald-500" />,
};

export default function AboutUsView() {
  const [activePolicy, setActivePolicy] = useState<PolicyKey>('about');

  const content = POLICY_CONTENT[activePolicy];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="relative overflow-hidden bg-white dark:bg-[#18181B] rounded-3xl border border-slate-200 dark:border-[#27272A] p-8 md:p-10 shadow-sm">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-600 opacity-0 group-hover:opacity-10 transition-opacity" />
            {KEY_ICONS[activePolicy]}
            <div className="absolute inset-0 border-2 border-emerald-600/20 rounded-3xl animate-pulse" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold">
              <span>📱 Version 1.0.0 (Official)</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white font-serif-exam">
              {content.title}
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400 font-medium">
              {content.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,3fr] gap-8">
        {/* Navigation - Sidebar (Desktop) / Chips (Mobile) */}
        <div className="space-y-4">
          <div className="lg:sticky lg:top-8 space-y-2">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 px-4 uppercase tracking-widest hidden lg:block">
              সেকশন নির্বাচন করো
            </h3>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block space-y-1">
              {(Object.keys(POLICY_CONTENT) as PolicyKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setActivePolicy(key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group text-sm',
                    activePolicy === key
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold'
                      : 'hover:bg-white dark:hover:bg-[#18181B] text-slate-600 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-[#27272A]',
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-xl transition-colors',
                      activePolicy === key
                        ? 'bg-white/20'
                        : 'bg-slate-100 dark:bg-[#27272A] group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30',
                    )}
                  >
                    {React.cloneElement(KEY_ICONS[key], {
                      className: cn(
                        'w-4 h-4',
                        activePolicy === key ? 'text-white' : '',
                      ),
                    })}
                  </div>
                  <span className="flex-1 text-left">
                    {POLICY_CONTENT[key].title}
                  </span>
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 transition-transform',
                      activePolicy === key
                        ? 'opacity-100 translate-x-0.5'
                        : 'opacity-0 -translate-x-1',
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
                    'flex-none flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all whitespace-nowrap',
                    activePolicy === key
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-600 dark:text-slate-400',
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
        <div className="relative min-h-[500px] space-y-6">
          {/* Stats Bar if on about page */}
          {activePolicy === 'about' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-[#27272A] text-center">
                <div className="text-base md:text-xl font-black text-blue-600">৫০,০০০+</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">প্রশ্নব্যাংক</div>
              </div>
              <div className="p-4 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-[#27272A] text-center">
                <div className="text-base md:text-xl font-black text-emerald-600">১০০% AI</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">বিশ্লেষণ</div>
              </div>
              <div className="p-4 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-[#27272A] text-center">
                <div className="text-base md:text-xl font-black text-amber-500">চ্যাপ্টার</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">টেস্ট</div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activePolicy}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Description Section */}
              <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-[#27272A] p-6 shadow-sm">
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {content.description}
                </p>
              </div>

              {/* Policy Sections */}
              <div className="grid gap-4">
                {(content.sections as Section[]).map((section, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-[#27272A] p-6 hover:border-emerald-500/40 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-none flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 font-bold text-sm">
                        {section.id || idx + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                          {section.title}
                        </h3>
                        <div className="space-y-2">
                          {Array.isArray(section.content) ? (
                            <ul className="grid gap-2">
                              {section.content.map((item, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300 text-sm leading-relaxed"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                              {section.content}
                            </p>
                          )}
                        </div>
                        {section.warning && (
                          <div className="mt-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                            <span>🛡️</span>
                            <span>{section.warning}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact Links on About */}
              {activePolicy === 'about' && (
                <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-[#27272A] p-6 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    আমাদের সাথে যোগাযোগ
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <a
                      href="https://obhyash.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 bg-slate-50 dark:bg-[#27272A] rounded-xl flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:text-emerald-600 text-sm font-semibold transition-colors"
                    >
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span>obhyash.com</span>
                    </a>
                    <a
                      href="mailto:support@obhyash.com"
                      className="p-3.5 bg-slate-50 dark:bg-[#27272A] rounded-xl flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:text-emerald-600 text-sm font-semibold transition-colors"
                    >
                      <Mail className="w-4 h-4 text-emerald-600" />
                      <span>support@obhyash.com</span>
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center py-8 text-slate-400 dark:text-slate-600 text-xs font-bold">
        <p>© {new Date().getFullYear()} Obhyash Platform. All rights reserved.</p>
        <p className="mt-1">Made with ❤️ for Bangladeshi Students</p>
      </div>
    </div>
  );
}
