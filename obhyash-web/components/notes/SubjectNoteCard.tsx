import Link from 'next/link';
import {
  Atom,
  FlaskConical,
  Compass,
  Dna,
  Download,
  Smartphone,
  BookOpen,
  FileText,
  HardDrive,
  BadgeCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { SubjectNoteItem } from '@/data/hsc-ka-kha-notes';

const iconMap = {
  Atom,
  FlaskConical,
  Compass,
  Dna,
};

export function SubjectNoteCard({ item }: { item: SubjectNoteItem }) {
  const IconComponent = iconMap[item.iconName];

  return (
    <div
      id={item.slug}
      className={`group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-900/90 border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl overflow-hidden p-6 sm:p-7 ${
        item.isFreePdf
          ? 'border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-500/50 shadow-emerald-500/5'
          : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 shadow-indigo-500/5'
      }`}
    >
      {/* Background Accent Ambient Glow */}
      <div
        className={`absolute -top-20 -right-20 w-44 h-44 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          item.isFreePdf
            ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
            : 'bg-indigo-500/10 group-hover:bg-indigo-500/20'
        }`}
      />

      <div>
        {/* Top Header: Icon + Badge */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div
            className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110 ${
              item.isFreePdf
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40'
                : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40'
            }`}
          >
            <IconComponent className="w-6 h-6" />
          </div>

          {item.isFreePdf ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {item.badgeTextBn}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 text-purple-800 dark:text-amber-300 border border-purple-500/30 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              {item.badgeTextBn}
            </span>
          )}
        </div>

        {/* Title & Paper */}
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {item.titleBn}
        </h3>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 line-clamp-1">
          {item.paperBn}
        </p>

        {/* Short Description */}
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
          {item.descriptionBn}
        </p>

        {/* 2x2 Metadata Grid */}
        <div className="grid grid-cols-2 gap-2.5 py-4 border-y border-slate-100 dark:border-slate-800/80 mb-6 text-xs font-medium text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{item.chaptersCountBn}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{item.questionsCountBn}</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{item.fileSize}</span>
          </div>
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
            <span>মেন্টর ভেরিফাইড</span>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      {item.isFreePdf ? (
        <a
          href={item.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          <span>{item.ctaTextBn}</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-auto" />
        </a>
      ) : (
        <Link
          href={item.targetUrl}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Smartphone className="w-4 h-4" />
          <span>{item.ctaTextBn}</span>
        </Link>
      )}
    </div>
  );
}
