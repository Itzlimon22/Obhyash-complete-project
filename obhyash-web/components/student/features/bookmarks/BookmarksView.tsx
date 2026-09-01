'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bookmark,
  ChevronDown,
  Calendar,
  X,
  AlertTriangle,
  RefreshCw,
  Trash2,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { Question } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import { toast } from 'sonner';
import QuestionCard from '@/components/student/ui/exam/QuestionCard';
import ReportModal from '@/components/student/ui/common/ReportModal';

interface BookmarkItem {
  question: Question;
  createdAt: Date;
}

export const BookmarksView: React.FC = () => {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      // 1. Fetch user bookmarks
      const { data: bData, error: bErr } = await supabase
        .from('bookmarks')
        .select('question_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bErr) throw bErr;

      const rawList = bData || [];
      if (rawList.length === 0) {
        setBookmarks([]);
        setIsLoading(false);
        return;
      }

      const qIds = rawList
        .map((e: any) => e.question_id?.toString() || '')
        .filter((id: string) => id.length > 0);

      const dateMap = new Map<string, Date>();
      rawList.forEach((e: any) => {
        const qid = e.question_id?.toString() || '';
        if (qid) {
          dateMap.set(
            qid,
            e.created_at ? new Date(e.created_at) : new Date()
          );
        }
      });

      const questionMap = new Map<string, Question>();

      // 2. Fetch from 'questions' table in chunks of 50
      for (let i = 0; i < qIds.length; i += 50) {
        const chunk = qIds.slice(i, i + 50);
        try {
          const { data: qData } = await supabase
            .from('questions')
            .select('*')
            .in('id', chunk);

          if (qData) {
            qData.forEach((q: any) => {
              if (q.id) questionMap.set(q.id, q as Question);
            });
          }
        } catch (chunkErr) {
          console.warn('[BookmarksView] chunk fetch error:', chunkErr);
        }
      }

      // 3. Fallback: Search missing questions in exam_results
      const missingIds = qIds.filter((id) => !questionMap.has(id));
      if (missingIds.length > 0) {
        try {
          const { data: examRes } = await supabase
            .from('exam_results')
            .select('questions')
            .eq('user_id', user.id)
            .not('questions', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50);

          if (examRes) {
            examRes.forEach((row: any) => {
              const qList = row.questions;
              if (Array.isArray(qList)) {
                qList.forEach((item: any) => {
                  if (item && item.id && missingIds.includes(item.id)) {
                    questionMap.set(item.id, item as Question);
                  }
                });
              }
            });
          }
        } catch (fallbackErr) {
          console.warn('[BookmarksView] fallback search error:', fallbackErr);
        }
      }

      // 4. Build ordered list
      const ordered: BookmarkItem[] = [];
      qIds.forEach((id) => {
        if (questionMap.has(id)) {
          ordered.push({
            question: questionMap.get(id)!,
            createdAt: dateMap.get(id) || new Date(),
          });
        }
      });

      setBookmarks(ordered);
    } catch (err) {
      console.error('[BookmarksView] fetch error:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Remove single bookmark
  const handleRemoveBookmark = async (questionId: string) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Optimistic update
      setBookmarks((prev) => prev.filter((b) => b.question.id !== questionId));
      toast.success('বুকমার্ক থেকে সরানো হয়েছে');

      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('question_id', questionId);
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

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto space-y-4 px-1 sm:px-3 py-2 font-['HindSiliguri',sans-serif]">
      {/* ── 1. Top Filters Bar (Matching Flutter BookmarksView) ── */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        {/* Subject Filter */}
        <div className="flex-1 min-w-[140px] relative">
          <select
            value={filterSubject}
            onChange={(e) => {
              setFilterSubject(e.target.value);
              setFilterChapter('');
              setDisplayCount(15);
            }}
            className="w-full h-11 px-3.5 pr-8 rounded-xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] text-sm font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
          >
            <option value="">সব বিষয়</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {BanglaNameHelper.getSubjectEmoji(
                  s,
                  BanglaNameHelper.formatSubject(s)
                )}{' '}
                {BanglaNameHelper.formatSubject(s)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Chapter Filter */}
        <div className="flex-1 min-w-[140px] relative">
          <select
            value={filterChapter}
            onChange={(e) => {
              setFilterChapter(e.target.value);
              setDisplayCount(15);
            }}
            className="w-full h-11 px-3.5 pr-8 rounded-xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] text-sm font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
          >
            <option value="">সব অধ্যায়</option>
            {chapters.map((c) => (
              <option key={c} value={c}>
                {BanglaNameHelper.formatChapter(c)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Date Filter */}
        <div className="relative">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setDisplayCount(15);
            }}
            className={`
              h-11 px-3 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20
              ${
                filterDate
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-[#18181B] border-neutral-200 dark:border-[#27272A] text-neutral-700 dark:text-neutral-300'
              }
            `}
          />
          {filterDate && (
            <button
              onClick={() => {
                setFilterDate('');
                setDisplayCount(15);
              }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center shadow-xs text-xs hover:bg-neutral-300"
              title="ফিল্টার ক্লিয়ার করো"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Content Body ── */}
      {isLoading ? (
        <div className="space-y-4 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] animate-pulse space-y-3"
            >
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
              <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
                <div className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : hasError ? (
        <div className="p-12 text-center flex flex-col items-center justify-center bg-white dark:bg-[#18181B] rounded-3xl border border-neutral-200 dark:border-[#27272A]">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            ডাটা লোড করতে সমস্যা হয়েছে!
          </h3>
          <button
            onClick={fetchBookmarks}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#059669] text-white font-bold text-sm flex items-center gap-2 hover:bg-[#047857] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>আবার চেষ্টা করো</span>
          </button>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="p-14 text-center flex flex-col items-center justify-center bg-white dark:bg-[#18181B] rounded-3xl border border-neutral-200 dark:border-[#27272A]">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-[#27272A] flex items-center justify-center text-neutral-400 mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
            কোনো বুকমার্ক করা প্রশ্ন নেই!
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
            পরীক্ষা বা অনুশীলনের সময় গুরুত্বপূর্ণ প্রশ্নগুলো বুকমার্ক করে রাখলে
            এখানে দেখতে পাবে।
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedList.map((item, idx) => (
            <div key={item.question.id || idx} className="relative group">
              <QuestionCard
                question={item.question}
                serialNumber={idx + 1}
                isBookmarked={true}
                readOnly={true}
                showAnswer={true}
                showFeedback={true}
                initiallyExpanded={false}
                onToggleBookmark={() => handleRemoveBookmark(item.question.id)}
                onReport={() => setReportQuestionId(item.question.id)}
              />
            </div>
          ))}

          {/* Load More Button */}
          {filteredBookmarks.length > displayCount && (
            <div className="py-4 text-center">
              <button
                onClick={() => setDisplayCount((prev) => prev + 15)}
                className="px-6 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#27272A] dark:hover:bg-[#3F3F46] text-neutral-800 dark:text-white font-bold text-sm flex items-center gap-2 mx-auto transition-all cursor-pointer shadow-xs"
              >
                <ChevronDown className="w-4 h-4" />
                <span>আরও লোড করুন ({filteredBookmarks.length - displayCount}টি বাকি)</span>
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
