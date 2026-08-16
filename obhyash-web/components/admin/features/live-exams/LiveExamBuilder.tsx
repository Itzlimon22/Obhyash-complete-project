'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  GripVertical,
  Check,
  AlertCircle,
  Sparkles,
  Zap,
  BookOpen,
  Filter,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { LiveExam, Question } from '@/lib/types';
import {
  getLiveExam,
  getLiveExamQuestions,
  addQuestionToLiveExam,
  removeQuestionFromLiveExam,
  reorderLiveExamQuestions,
  autoAssignQuestionsToLiveExam,
} from '@/services/live-exam-admin-service';
import { getQuestionsPage } from '@/services/question-service';
import { subjects } from '@/lib/data';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { MathRenderer } from '@/components/common/MathRenderer';

export default function LiveExamBuilder({ examId }: { examId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith('/teacher')
    ? '/teacher/live-exams'
    : '/admin/live-exams';

  const [exam, setExam] = useState<LiveExam | null>(null);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Manual Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [searchResults, setSearchResults] = useState<Question[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Auto-Assign Modal State
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [autoSubject, setAutoSubject] = useState('');
  const [autoChapter, setAutoChapter] = useState('');
  const [autoCount, setAutoCount] = useState<number>(25);
  const [autoDifficulty, setAutoDifficulty] = useState<string>('');
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);

  useEffect(() => {
    fetchExamData();
  }, [examId]);

  const fetchExamData = async () => {
    try {
      setIsLoading(true);
      const [examData, questionsData] = await Promise.all([
        getLiveExam(examId),
        getLiveExamQuestions(examId),
      ]);
      if (!examData) {
        toast.error('Exam not found');
        router.push(basePath);
        return;
      }
      setExam(examData);
      setExamQuestions(questionsData);
    } catch (error) {
      toast.error('Failed to load exam data: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setIsSearching(true);
      const res = await getQuestionsPage(1, 30, {
        search: searchQuery,
        subject: subjectFilter || undefined,
        status: 'Approved' as any,
      });
      setSearchResults(res.questions);
    } catch (error) {
      toast.error('Failed to search questions');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddQuestion = async (question: Question) => {
    if (examQuestions.some((eq) => eq.question?.id === question.id)) {
      toast.warning('এই প্রশ্নটি ইতিমধ্যেই পরীক্ষায় যুক্ত রয়েছে');
      return;
    }

    try {
      const serial = examQuestions.length + 1;
      await addQuestionToLiveExam(examId, question.id, serial, 1);
      toast.success('প্রশ্ন যুক্ত করা হয়েছে!');
      fetchExamData();
    } catch (error) {
      toast.error('Failed to add question');
    }
  };

  const handleRemoveQuestion = async (mappingId: string) => {
    try {
      await removeQuestionFromLiveExam(mappingId);
      toast.success('প্রশ্নটি পরীক্ষা থেকে বাদ দেওয়া হয়েছে');
      fetchExamData();
    } catch (error) {
      toast.error('Failed to remove question');
    }
  };

  const handleAutoAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAutoAssigning(true);
      const added = await autoAssignQuestionsToLiveExam(
        examId,
        autoSubject || undefined,
        autoChapter || undefined,
        autoCount,
        autoDifficulty || undefined,
      );

      if (added === 0) {
        toast.warning(
          'নির্বাচিত বিষয়/অধ্যায়ে কোনো অতিরিক্ত প্রশ্ন পাওয়া যায়নি।',
        );
      } else {
        toast.success(`সফলভাবে ${added} টি প্রশ্ন পরীক্ষায় যুক্ত করা হয়েছে!`);
        setShowAutoModal(false);
        fetchExamData();
      }
    } catch (error) {
      toast.error('Auto-assign failed: ' + String(error));
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const moveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === examQuestions.length - 1)
    )
      return;

    const newOrder = [...examQuestions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const updates = newOrder.map((item, i) => ({
      id: item.mapping_id,
      serial: i + 1,
    }));

    setExamQuestions(newOrder);

    try {
      await reorderLiveExamQuestions(updates);
    } catch (error) {
      toast.error('Failed to save new order');
      fetchExamData();
    }
  };

  const selectedSubjectObj = subjects.find((s) => s.id === autoSubject);
  const chaptersList = selectedSubjectObj ? selectedSubjectObj.chapters : [];

  if (isLoading)
    return (
      <div className="p-8 text-center text-xs font-mono text-zinc-500">
        বিল্ডার ডাটা লোড হচ্ছে...
      </div>
    );
  if (!exam) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 flex flex-col h-[calc(100vh-70px)]">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pb-4 border-b border-neutral-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href={basePath}
            className="p-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 rounded-xl transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
                {exam.category}
              </span>
              <h1 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">
                {exam.title}
              </h1>
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5 font-mono">
              মোট প্রশ্ন: {examQuestions.length} / {exam.total_marks} পূর্ণমান •{' '}
              {exam.duration_minutes} মিনিট
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAutoModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-950/20 cursor-pointer"
          >
            <Zap size={15} />
            <span>অটো-পিক প্রশ্ন জেনারেটর</span>
          </button>
        </div>
      </div>

      {/* ── Main Split View ── */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left Side: Exam Assigned Questions */}
        <div className="flex-1 bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-neutral-200 dark:border-zinc-800 bg-neutral-50/70 dark:bg-zinc-900/50 flex items-center justify-between">
            <h2 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={14} className="text-emerald-500" />
              <span>নির্ধারিত প্রশ্ন তালিকা ({examQuestions.length})</span>
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">
              ক্রম অনুযায়ী পরীক্ষায় প্রদর্শিত হবে
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {examQuestions.length === 0 ? (
              <div className="text-center py-16 text-neutral-400 dark:text-zinc-500 space-y-3">
                <AlertCircle className="mx-auto opacity-40" size={36} />
                <p className="text-sm font-bold">এখনও কোনো প্রশ্ন যুক্ত করা হয়নি</p>
                <p className="text-xs max-w-sm mx-auto text-zinc-500">
                  ডানপাশের প্রশ্ন ব্যাংক থেকে সার্চ করে ম্যানুয়ালি যোগ করুন অথবা
                  উপরের "অটো-পিক প্রশ্ন জেনারেটর" ব্যবহার করুন।
                </p>
              </div>
            ) : (
              examQuestions.map((eq, index) => (
                <div
                  key={eq.mapping_id}
                  className="flex items-start gap-3 p-3.5 bg-neutral-50 dark:bg-zinc-900/40 border border-neutral-200/80 dark:border-zinc-800 rounded-xl hover:border-emerald-500/40 transition"
                >
                  {/* Reorder Buttons */}
                  <div className="flex flex-col items-center gap-1 text-neutral-400 pt-0.5">
                    <button
                      onClick={() => moveQuestion(index, 'up')}
                      disabled={index === 0}
                      className="hover:text-emerald-500 disabled:opacity-20 cursor-pointer"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      #{index + 1}
                    </span>
                    <button
                      onClick={() => moveQuestion(index, 'down')}
                      disabled={index === examQuestions.length - 1}
                      className="hover:text-emerald-500 disabled:opacity-20 cursor-pointer"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-neutral-900 dark:text-zinc-200">
                      <MathRenderer text={eq.question?.question || ''} />
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-[11px] text-neutral-500 dark:text-zinc-400">
                      <span className="px-2 py-0.5 bg-neutral-200 dark:bg-zinc-800 rounded font-semibold">
                        {eq.question?.subject}
                      </span>
                      {eq.question?.chapter && (
                        <span className="truncate max-w-[150px]">
                          {eq.question?.chapter}
                        </span>
                      )}
                      <span className="font-mono text-amber-600">
                        {eq.question?.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveQuestion(eq.mapping_id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                    title="Remove from exam"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Question Bank Search */}
        <div className="w-full lg:w-[460px] bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-sm shrink-0">
          <div className="p-4 border-b border-neutral-200 dark:border-zinc-800 bg-neutral-50/70 dark:bg-zinc-900/50 space-y-3">
            <h2 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Search size={14} className="text-blue-500" />
              <span>প্রশ্ন ব্যাংক থেকে খুঁজুন</span>
            </h2>

            <form onSubmit={handleSearch} className="space-y-2.5">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="text"
                  placeholder="কীওয়ার্ড বা প্রশ্ন খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="flex-1 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none text-neutral-900 dark:text-white"
                >
                  <option value="">সকল বিষয় (All)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  খুঁজুন
                </button>
              </div>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isSearching ? (
              <div className="text-center py-10 text-neutral-500 text-xs font-mono">
                প্রশ্ন লোড হচ্ছে...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-10 text-neutral-400 text-xs">
                কোনো প্রশ্ন মেলেনি। সার্চ বা ফিল্টার প্রয়োগ করুন।
              </div>
            ) : (
              searchResults.map((q) => {
                const isAdded = examQuestions.some(
                  (eq) => eq.question?.id === q.id,
                );
                return (
                  <div
                    key={q.id}
                    className="p-3 bg-neutral-50 dark:bg-zinc-900/40 border border-neutral-200/80 dark:border-zinc-800 rounded-xl space-y-2"
                  >
                    <div className="text-xs font-medium text-neutral-900 dark:text-zinc-200 line-clamp-3">
                      <MathRenderer text={q.question || ''} />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-200/40 dark:border-zinc-800/60 text-[11px]">
                      <span className="font-semibold text-neutral-500">
                        {q.subject}
                      </span>
                      <button
                        onClick={() => handleAddQuestion(q)}
                        disabled={isAdded}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-neutral-200 dark:bg-zinc-800 text-neutral-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check size={13} /> যুক্ত আছে
                          </>
                        ) : (
                          <>
                            <Plus size={13} /> যুক্ত করুন
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Auto-Assign Modal ── */}
      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Zap size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-neutral-900 dark:text-white">
                    স্মার্ট অটো-পিক প্রশ্ন জেনারেটর
                  </h2>
                  <p className="text-[11px] text-neutral-500">
                    বিষয় ও অধ্যায় নির্বাচন করে নিমেষে প্রশ্ন ব্যাংক থেকে যুক্ত করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAutoAssign} className="space-y-4 text-xs">
              {/* Subject */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-zinc-300">
                  বিষয় (Subject) *
                </label>
                <select
                  required
                  value={autoSubject}
                  onChange={(e) => {
                    setAutoSubject(e.target.value);
                    setAutoChapter('');
                  }}
                  className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-neutral-900 dark:text-white"
                >
                  <option value="">বিষয় নির্বাচন করুন</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-zinc-300">
                  অধ্যায় (ঐচ্ছিক)
                </label>
                <select
                  value={autoChapter}
                  onChange={(e) => setAutoChapter(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-neutral-900 dark:text-white"
                  disabled={!autoSubject}
                >
                  <option value="">সম্পূর্ণ বই (All Chapters)</option>
                  {chaptersList.map((ch) => (
                    <option key={ch.id} value={ch.name}>
                      {ch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Count & Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-zinc-300">
                    প্রশ্নের সংখ্যা
                  </label>
                  <select
                    value={autoCount}
                    onChange={(e) => setAutoCount(Number(e.target.value))}
                    className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-900 dark:text-white"
                  >
                    <option value={10}>১০টি প্রশ্ন</option>
                    <option value={25}>২৫টি প্রশ্ন</option>
                    <option value={50}>৫০টি প্রশ্ন</option>
                    <option value={100}>১০০টি প্রশ্ন</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-zinc-300">
                    কাঠিন্য (Difficulty)
                  </label>
                  <select
                    value={autoDifficulty}
                    onChange={(e) => setAutoDifficulty(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 dark:text-white"
                  >
                    <option value="">সকল লেভেল</option>
                    <option value="Easy">সহজ (Easy)</option>
                    <option value="Medium">মাঝারি (Medium)</option>
                    <option value="Hard">কঠিন (Hard)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAutoModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isAutoAssigning || !autoSubject}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/20 cursor-pointer disabled:opacity-50"
                >
                  <Zap size={14} />
                  <span>
                    {isAutoAssigning ? 'যোগ হচ্ছে...' : 'অটো-পিক যুক্ত করুন'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
