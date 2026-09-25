'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bookmark,
  ChevronDown,
  Calendar,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Question } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import { toast } from 'sonner';
import QuestionCard from '@/components/student/ui/exam/QuestionCard';
import ReportModal from '@/components/student/ui/common/ReportModal';
import { cn } from '@/lib/utils';
import { getBookmarkedQuestions } from '@/services/bookmark-service';

interface BookmarkItem {
  question: Question;
  createdAt: Date;
}

// Ensure deterministic institute/board tag if absent, exactly matching Flutter _ensureQuestionHasInstitute
function ensureQuestionHasInstitute(q: Question): Question {
  const examHist = q.exam_history || (q as any).examHistory;
  const insts = q.institutes || (q.institute ? [q.institute] : []);

  if ((examHist && examHist.length > 0) || insts.length > 0) {
    return q;
  }

  const examTypeLower = (q.examType || (q as any).exam_type || '').toLowerCase();
  const isEngineering =
    examTypeLower.includes('eng') || examTypeLower.includes('buet');
  const isMedical =
    examTypeLower.includes('med') || examTypeLower.includes('mat');
  const isVarsity =
    examTypeLower.includes('var') || examTypeLower.includes('admission');

  // Simple string hash
  let hash = 0;
  const idStr = String(q.id || '');
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  let code: string;
  let institute: string;
  let year: number;

  if (isEngineering) {
    const engList = [
      { code: 'BUET', institute: 'বুয়েট ভর্তি পরীক্ষা', years: [2023, 2022, 2021, 2020, 2019] },
      { code: 'CKRUET', institute: 'চুয়েট-কুয়েট-রুয়েট সমন্বিত', years: [2023, 2022, 2021] },
      { code: 'KUET', institute: 'কুয়েট ভর্তি পরীক্ষা', years: [2022, 2021, 2020, 2019] },
      { code: 'RUET', institute: 'রুয়েট ভর্তি পরীক্ষা', years: [2022, 2021, 2020, 2018] },
      { code: 'CUET', institute: 'চুয়েট ভর্তি পরীক্ষা', years: [2022, 2021, 2020, 2019] },
      { code: 'BUTEX', institute: 'বুটেক্স ভর্তি পরীক্ষা', years: [2023, 2022, 2021, 2020] },
      { code: 'MIST', institute: 'এমআইএসটি ভর্তি পরীক্ষা', years: [2023, 2022, 2021] },
    ];
    const entry = engList[hash % engList.length];
    code = entry.code;
    institute = entry.institute;
    const qYears = q.years || (q.year ? [Number(q.year)] : []);
    year = qYears.length > 0 ? Number(qYears[0]) : entry.years[hash % entry.years.length];
  } else if (isMedical) {
    const medList = [
      { code: 'MAT', institute: 'মেডিকেল ভর্তি পরীক্ষা (MBBS)', years: [2023, 2022, 2021, 2020, 2019, 2018] },
      { code: 'DAT', institute: 'ডেন্টাল ভর্তি পরীক্ষা (BDS)', years: [2023, 2022, 2021, 2020] },
      { code: 'AFMC', institute: 'আর্মড ফোর্সেস মেডিকেল কলেজ', years: [2023, 2022, 2021] },
    ];
    const entry = medList[hash % medList.length];
    code = entry.code;
    institute = entry.institute;
    const qYears = q.years || (q.year ? [Number(q.year)] : []);
    year = qYears.length > 0 ? Number(qYears[0]) : entry.years[hash % entry.years.length];
  } else if (isVarsity) {
    const varList = [
      { code: 'DU', institute: 'ঢাকা বিশ্ববিদ্যালয়', years: [2023, 2022, 2021, 2020, 2019] },
      { code: 'JU', institute: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়', years: [2023, 2022, 2021, 2020] },
      { code: 'RU', institute: 'রাজশাহী বিশ্ববিদ্যালয়', years: [2023, 2022, 2021, 2020] },
      { code: 'CU', institute: 'চট্টগ্রাম বিশ্ববিদ্যালয়', years: [2023, 2022, 2021, 2019] },
      { code: 'GST', institute: 'গুচ্ছ সমন্বিত বিশ্ববিদ্যালয়', years: [2023, 2022, 2021] },
      { code: 'SUST', institute: 'শাহজালাল বিজ্ঞান ও প্রযুক্তি', years: [2022, 2021, 2020] },
      { code: 'JnU', institute: 'জগন্নাথ বিশ্ববিদ্যালয়', years: [2022, 2021, 2019] },
    ];
    const entry = varList[hash % varList.length];
    code = entry.code;
    institute = entry.institute;
    const qYears = q.years || (q.year ? [Number(q.year)] : []);
    year = qYears.length > 0 ? Number(qYears[0]) : entry.years[hash % entry.years.length];
  } else {
    const boardList = [
      { code: 'DB', institute: 'ঢাকা বোর্ড', years: [2023, 2022, 2021] },
      { code: 'CB', institute: 'কুমিল্লা বোর্ড', years: [2023, 2022, 2021] },
      { code: 'RB', institute: 'রাজশাহী বোর্ড', years: [2023, 2022, 2021] },
      { code: 'CtgB', institute: 'চট্টগ্রাম বোর্ড', years: [2023, 2022, 2021] },
      { code: 'JB', institute: 'যশোর বোর্ড', years: [2023, 2022, 2021] },
      { code: 'BB', institute: 'বরিশাল বোর্ড', years: [2023, 2022, 2021] },
      { code: 'SB', institute: 'সিলেট বোর্ড', years: [2023, 2022, 2021] },
      { code: 'DinB', institute: 'দিনাজপুর বোর্ড', years: [2023, 2022, 2021] },
    ];
    const entry = boardList[hash % boardList.length];
    code = entry.code;
    institute = entry.institute;
    const qYears = q.years || (q.year ? [Number(q.year)] : []);
    year = qYears.length > 0 ? Number(qYears[0]) : entry.years[hash % entry.years.length];
  }

  return {
    ...q,
    exam_history: [{ code, institute, year }],
    institutes: [institute],
    years: [year],
  };
}

interface BookmarksViewProps {
  userId?: string;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  userId: propUserId,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  // Filters
  const [filterSubject, setFilterSubject] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [displayCount, setDisplayCount] = useState(15);

  // Report Modal
  const [reportQuestionId, setReportQuestionId] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const supabase = createClient();
      let targetUserId = propUserId;

      if (!targetUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        targetUserId = sessionData?.session?.user?.id;
      }

      if (!targetUserId) {
        const { data: userData } = await supabase.auth.getUser();
        targetUserId = userData?.user?.id;
      }

      if (!targetUserId && typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('obhyash_user_profile');
          if (cached) {
            const parsed = JSON.parse(cached);
            targetUserId = parsed?.id;
          }
        } catch (_) {}
      }

      if (!targetUserId) {
        console.warn('[BookmarksView] No user session found');
        setIsLoading(false);
        return;
      }

      const fetchedQs = await getBookmarkedQuestions(targetUserId, supabase);
      const ordered: BookmarkItem[] = fetchedQs.map((q) => ({
        question: ensureQuestionHasInstitute(q),
        createdAt: q.bookmarkedAt ? new Date(q.bookmarkedAt) : new Date(),
      }));

      setBookmarks(ordered);
    } catch (err) {
      console.error('[BookmarksView] fetch error:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [propUserId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Remove single bookmark
  const handleRemoveBookmark = async (questionId: string | number) => {
    try {
      const supabase = createClient();
      let targetUserId = propUserId;
      if (!targetUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        targetUserId = sessionData?.session?.user?.id;
      }
      if (!targetUserId) {
        const { data: userData } = await supabase.auth.getUser();
        targetUserId = userData?.user?.id;
      }
      if (!targetUserId) return;

      const qIdStr = String(questionId);
      setBookmarks((prev) => prev.filter((b) => String(b.question.id) !== qIdStr));
      toast.success('বুকমার্ক থেকে সরানো হয়েছে');

      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', targetUserId)
        .eq('question_id', qIdStr);
    } catch (err) {
      console.error('[BookmarksView] remove error:', err);
      toast.error('বুকমার্ক সরাতে সমস্যা হয়েছে');
      fetchBookmarks();
    }
  };

  // Filter lists
  const subjects = useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach((b) => {
      if (b.question.subject) set.add(b.question.subject);
    });
    return Array.from(set);
  }, [bookmarks]);

  const chapters = useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach((b) => {
      if (
        (!filterSubject || b.question.subject === filterSubject) &&
        b.question.chapter
      ) {
        set.add(b.question.chapter);
      }
    });
    return Array.from(set);
  }, [bookmarks, filterSubject]);

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((b) => {
      if (filterSubject && b.question.subject !== filterSubject) return false;
      if (filterChapter && b.question.chapter !== filterChapter) return false;
      if (filterDate) {
        const d = b.createdAt;
        const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (formatted !== filterDate) return false;
      }
      return true;
    });
  }, [bookmarks, filterSubject, filterChapter, filterDate]);

  const displayedList = filteredBookmarks.slice(0, displayCount);

  // Formatted date for filter display (d/M)
  const formattedFilterDateText = useMemo(() => {
    if (!filterDate) return 'তারিখ';
    const parts = filterDate.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10);
      return `${BanglaNameHelper.toBanglaNumeral(day)}/${BanglaNameHelper.toBanglaNumeral(month)}`;
    }
    return filterDate;
  }, [filterDate]);

  return (
    <div className="w-full flex flex-col font-['HindSiliguri',sans-serif] pb-16">
      {/* ── 1. Top Filters Bar (Matching Flutter BookmarksView horizontal: 10, vertical: 8) ── */}
      <div className="px-2.5 sm:px-3 py-2 flex items-center gap-2">
        {/* Subject Dropdown */}
        <div className="flex-1 relative">
          <select
            value={filterSubject}
            onChange={(e) => {
              setFilterSubject(e.target.value);
              setFilterChapter('');
              setDisplayCount(15);
            }}
            className={cn(
              "w-full h-[42px] px-3 pr-8 rounded-[12px] text-[13.5px] font-medium appearance-none cursor-pointer outline-none transition-colors",
              "bg-white dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#1C1C1E]",
              filterSubject
                ? "text-[#0F172A] dark:text-white font-semibold"
                : "text-[#A3A3A3]"
            )}
          >
            <option value="">সব বিষয়</option>
            {subjects.map((s) => {
              const name = BanglaNameHelper.formatSubject(s);
              const emoji = BanglaNameHelper.getSubjectEmoji(s, name);
              return (
                <option key={s} value={s}>
                  {emoji} {name}
                </option>
              );
            })}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3] pointer-events-none" />
        </div>

        {/* Chapter Dropdown */}
        <div className="flex-1 relative">
          <select
            value={filterChapter}
            onChange={(e) => {
              setFilterChapter(e.target.value);
              setDisplayCount(15);
            }}
            className={cn(
              "w-full h-[42px] px-3 pr-8 rounded-[12px] text-[13.5px] font-medium appearance-none cursor-pointer outline-none transition-colors",
              "bg-white dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#1C1C1E]",
              filterChapter
                ? "text-[#0F172A] dark:text-white font-semibold"
                : "text-[#A3A3A3]"
            )}
          >
            <option value="">সব অধ্যায়</option>
            {chapters.map((c) => (
              <option key={c} value={c}>
                {BanglaNameHelper.formatChapter(c)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3] pointer-events-none" />
        </div>

        {/* Date Filter (Matching Flutter styling: 42px height, green when selected, d/M text, clear button) */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "h-[42px] px-3 rounded-[12px] border text-[13.5px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer relative",
              filterDate
                ? "bg-[#ECFDF5] dark:bg-[#064E3B]/30 border-[#34D399] dark:border-[#059669] text-[#059669] dark:text-[#34D399]"
                : "bg-white dark:bg-[#1C1C1C] border-[#E5E5E5] dark:border-[#1C1C1E] text-[#A3A3A3]"
            )}
          >
            <Calendar
              size={16}
              className={filterDate ? "text-[#059669] dark:text-[#34D399]" : "text-[#A3A3A3]"}
            />
            <span className="select-none">{formattedFilterDateText}</span>

            {/* Invisible Date Input Covering the Box for Native Picker */}
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setDisplayCount(15);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />

            {filterDate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterDate('');
                  setDisplayCount(15);
                }}
                className="z-10 ml-0.5 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#059669] dark:text-[#34D399]"
                title="তারিখ মুছুন"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Content Body (Matching Flutter BookmarksView _buildBody) ── */}
      {isLoading ? (
        <div className="px-2.5 sm:px-3 py-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-[16px] bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] animate-pulse space-y-3"
            >
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
              <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="h-10 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl" />
                <div className="h-10 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : hasError ? (
        <div className="py-20 text-center flex flex-col items-center justify-center px-4">
          <div className="w-14 h-14 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mb-4">
            <AlertTriangle size={36} />
          </div>
          <h3 className="text-[15px] font-semibold text-[#1E293B] dark:text-white">
            ডাটা লোড করতে সমস্যা হয়েছে!
          </h3>
          <button
            type="button"
            onClick={fetchBookmarks}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-semibold text-[13.5px] transition-all cursor-pointer shadow-xs active:scale-95"
          >
            আবার চেষ্টা করো
          </button>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="py-24 text-center flex flex-col items-center justify-center px-4">
          <Bookmark
            size={54}
            className="text-neutral-300 dark:text-neutral-800 mb-3.5"
          />
          <h3 className="text-[15.5px] font-semibold text-neutral-600 dark:text-neutral-400">
            কোনো বুকমার্ক করা প্রশ্ন নেই!
          </h3>
          <p className="text-[12.5px] text-neutral-500 dark:text-neutral-500 mt-1 max-w-sm leading-relaxed">
            এক্সাম দেওয়ার সময় গুরুত্বপূর্ণ প্রশ্নগুলো বুকমার্ক করে রাখো।
          </p>
        </div>
      ) : (
        <div className="px-2.5 sm:px-3 py-4 space-y-4">
          {displayedList.map((item, idx) => (
            <div key={item.question.id || idx} className="relative">
              <QuestionCard
                question={item.question}
                serialNumber={idx + 1}
                isFlagged={false}
                readOnly={true}
                showAnswer={true}
                showFeedback={true}
                initiallyExpanded={false}
                isBookmarked={true}
                alwaysShowSourceTag={true}
                showReport={true}
                onSelectOption={() => {}}
                onToggleFlag={() => {}}
                onToggleBookmark={() => handleRemoveBookmark(item.question.id)}
                onReport={() => setReportQuestionId(String(item.question.id))}
              />
            </div>
          ))}

          {/* Load More Button matching Flutter ElevatedButton.icon */}
          {filteredBookmarks.length > displayCount && (
            <div className="py-4 text-center">
              <button
                type="button"
                onClick={() => setDisplayCount((prev) => prev + 15)}
                className="px-6 py-3 rounded-xl bg-[#F5F5F5] hover:bg-neutral-200 dark:bg-[#1C1C1E] dark:hover:bg-[#27272A] text-neutral-800 dark:text-white font-semibold text-sm inline-flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <ChevronDown size={16} />
                <span>আরও লোড করুন</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Report Modal ── */}
      {reportQuestionId && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportQuestionId(null)}
          questionId={reportQuestionId}
        />
      )}
    </div>
  );
};

export default BookmarksView;
