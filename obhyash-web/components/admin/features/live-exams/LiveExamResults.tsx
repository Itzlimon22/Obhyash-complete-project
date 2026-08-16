'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Trophy,
  Clock,
  Target,
  Download,
  Users,
  Award,
  TrendingUp,
  Search,
  RotateCcw,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  School,
} from 'lucide-react';
import { toast } from 'sonner';
import { LiveExam } from '@/lib/types';
import {
  getLiveExam,
  getLiveExamLeaderboard,
  resetLiveExamAttempt,
  getLiveExamOngoingCount,
} from '@/services/live-exam-admin-service';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function LiveExamResults({ examId }: { examId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith('/teacher')
    ? '/teacher/live-exams'
    : '/admin/live-exams';

  const [exam, setExam] = useState<LiveExam | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [ongoingCount, setOngoingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchResults();

    // ⚡ Supabase Realtime Listener: updates leaderboard & active takers instantly as students submit!
    const supabase = createClient();
    const channel = supabase
      .channel(`live_exam_realtime_${examId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_exam_attempts',
          filter: `live_exam_id=eq.${examId}`,
        },
        async () => {
          if (isMounted) {
            const [freshLeaderboard, freshOngoing] = await Promise.all([
              getLiveExamLeaderboard(examId),
              getLiveExamOngoingCount(examId),
            ]);
            setLeaderboard(freshLeaderboard);
            setOngoingCount(freshOngoing);
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [examId]);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      const [examData, leaderboardData, ongoing] = await Promise.all([
        getLiveExam(examId),
        getLiveExamLeaderboard(examId),
        getLiveExamOngoingCount(examId),
      ]);
      if (!examData) {
        toast.error('Exam not found');
        router.push(basePath);
        return;
      }
      setExam(examData);
      setLeaderboard(leaderboardData);
      setOngoingCount(ongoing);
    } catch (error) {
      toast.error('Failed to load leaderboard: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAttempt = async (attemptId: string, studentName: string) => {
    if (
      !window.confirm(
        `⚠️ আপনি কি নিশ্চিত যে ${studentName}-এর পরীক্ষা রিসেট করতে চান? শিক্ষার্থী পুনরায় পরীক্ষা দিতে পারবে।`,
      )
    )
      return;

    try {
      await resetLiveExamAttempt(attemptId);
      toast.success(`${studentName}-এর পরীক্ষা সফলভাবে রিসেট করা হয়েছে!`);
      setSelectedAttempt(null);
      fetchResults();
    } catch (error) {
      toast.error('Failed to reset attempt');
    }
  };

  const handleExport = () => {
    const csv = [
      [
        'Rank',
        'Student Name',
        'Email',
        'Phone',
        'Institute',
        'Score',
        'Correct Count',
        'Wrong Count',
        'Time Taken (Mins)',
        'Submit Time',
      ].join(','),
      ...leaderboard.map((entry, index) => {
        const student = entry.users || entry.user || {};
        const timeTakenMs =
          new Date(entry.submit_time).getTime() -
          new Date(entry.start_time).getTime();
        const timeTakenMins = (timeTakenMs / 1000 / 60).toFixed(2);

        return [
          index + 1,
          `"${student.name || 'Student'}"`,
          `"${student.email || 'N/A'}"`,
          `"${student.phone || 'N/A'}"`,
          `"${student.institute || 'N/A'}"`,
          entry.score,
          entry.correct_count,
          entry.wrong_count,
          timeTakenMins,
          `"${new Date(entry.submit_time).toLocaleString()}"`,
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-exam-leaderboard-${exam?.title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('লিডারবোর্ড CSV সফলভাবে ডাউনলোড হয়েছে!');
  };

  // Calculations
  const totalSubmissions = leaderboard.length;
  const highestScore =
    leaderboard.length > 0
      ? Math.max(...leaderboard.map((e) => Number(e.score) || 0))
      : 0;
  const avgScore =
    leaderboard.length > 0
      ? (
          leaderboard.reduce((acc, e) => acc + (Number(e.score) || 0), 0) /
          totalSubmissions
        ).toFixed(1)
      : '0';

  const totalAnswered = leaderboard.reduce(
    (acc, e) => acc + (e.correct_count || 0) + (e.wrong_count || 0),
    0,
  );
  const totalCorrect = leaderboard.reduce(
    (acc, e) => acc + (e.correct_count || 0),
    0,
  );
  const avgAccuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const filteredLeaderboard = leaderboard.filter((entry) => {
    const student = entry.users || entry.user || {};
    const name = student.name || '';
    const institute = student.institute || '';
    const query = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(query) ||
      institute.toLowerCase().includes(query)
    );
  });

  if (isLoading)
    return (
      <div className="p-8 text-center text-xs font-mono text-zinc-500">
        লিডারবোর্ড লোড হচ্ছে...
      </div>
    );
  if (!exam) return null;

  const now = Date.now();
  const start = new Date(exam.start_time).getTime();
  const end = new Date(exam.end_time).getTime();
  const isLiveNow = now >= start && now <= end;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* ── Live Running Banner ── */}
      {isLiveNow && (
        <div className="p-3.5 px-5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <div>
              <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                লাইভ প্রতিযোগিতা চলছে • Live Examination In Progress
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                শিক্ষার্থীরা উত্তর সাবমিট করার সাথে সাথে লিডারবোর্ড রিয়েল-টাইমে স্বয়ংক্রিয়ভাবে আপডেট হচ্ছে
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono font-bold text-xs shrink-0">
            <span className="animate-pulse">🔴</span>
            <span>{ongoingCount} জন বর্তমানে পরীক্ষা দিচ্ছেন</span>
          </div>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href={basePath}
            className="p-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 rounded-xl transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-500/10 text-amber-500">
                <Trophy size={16} />
              </span>
              <h1 className="text-xl font-black text-neutral-900 dark:text-white">
                লিডারবোর্ড ও অংশগ্রহণ বিবরণী: {exam.title}
              </h1>
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">
              ক্যাটাগরি: <span className="uppercase font-bold">{exam.category}</span> • মোট পূর্ণমান: {exam.total_marks} • নেগেটিভ মার্কিং: {exam.negative_marking}
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={leaderboard.length === 0}
          className="px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-zinc-200 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Download size={15} />
          <span>CSV রিপোর্ট ডাউনলোড</span>
        </button>
      </div>

      {/* ── 4 KPI Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-zinc-400 text-xs font-bold">
            <span>মোট পরীক্ষার্থী</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
            {totalSubmissions} <span className="text-xs font-normal text-zinc-500">জন</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-zinc-400 text-xs font-bold">
            <span>সর্বোচ্চ নম্বর</span>
            <Award size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {highestScore} <span className="text-xs font-normal text-zinc-500">/ {exam.total_marks}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-zinc-400 text-xs font-bold">
            <span>গড় স্কোর (Average)</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {avgScore}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-zinc-400 text-xs font-bold">
            <span>গড় নির্ভুলতা (Accuracy)</span>
            <Target size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {avgAccuracy}%
          </p>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative max-w-sm">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          placeholder="শিক্ষার্থীর নাম বা কলেজ খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-900 dark:text-white"
        />
      </div>

      {/* ── Leaderboard Table ── */}
      <div className="bg-white dark:bg-[#121215] rounded-2xl border border-neutral-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-zinc-900/60 border-b border-neutral-200 dark:border-zinc-800 text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="p-4 w-16 text-center">র‍্যাংক</th>
                <th className="p-4">শিক্ষার্থী</th>
                <th className="p-4 text-center">স্কোর</th>
                <th className="p-4 text-center">সঠিক / ভুল</th>
                <th className="p-4 text-center">সময়</th>
                <th className="p-4 text-right">জমা দেওয়ার সময়</th>
                <th className="p-4 text-right">কন্ট্রোল</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800/60 text-xs">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    এখনও কোনো ফলাফল পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((entry, index) => {
                  const student = entry.users || entry.user || {};
                  const timeTakenMs =
                    new Date(entry.submit_time).getTime() -
                    new Date(entry.start_time).getTime();
                  const mins = Math.floor(timeTakenMs / 1000 / 60);
                  const secs = Math.floor((timeTakenMs / 1000) % 60);

                  const isTop3 = index < 3;

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-neutral-50 dark:hover:bg-zinc-850/40 transition-colors ${
                        isTop3
                          ? 'bg-amber-50/20 dark:bg-amber-950/10 font-semibold'
                          : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black font-mono ${
                            index === 0
                              ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                              : index === 1
                              ? 'bg-slate-300 dark:bg-zinc-700 text-slate-900 dark:text-white'
                              : index === 2
                              ? 'bg-amber-700/80 text-white'
                              : 'text-neutral-500 font-normal'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>

                      {/* Student Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm"
                            style={{
                              backgroundColor:
                                student.avatarColor || '#059669',
                            }}
                          >
                            {student.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 dark:text-white">
                              {student.name || 'শিক্ষার্থী'}
                            </p>
                            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 flex items-center gap-1">
                              <School size={11} />
                              <span>{student.institute || 'প্রতিষ্ঠান অনুল্লেখিত'}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="p-4 text-center">
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {entry.score}
                        </span>
                      </td>

                      {/* Correct / Wrong */}
                      <td className="p-4 text-center font-mono text-[11px]">
                        <span className="text-emerald-600 font-bold">
                          ✓ {entry.correct_count || 0}
                        </span>
                        <span className="text-neutral-400 mx-1">/</span>
                        <span className="text-rose-500 font-bold">
                          ✗ {entry.wrong_count || 0}
                        </span>
                      </td>

                      {/* Time Taken */}
                      <td className="p-4 text-center font-mono text-neutral-700 dark:text-zinc-300">
                        {mins}m {secs}s
                      </td>

                      {/* Submit Timestamp */}
                      <td className="p-4 text-right font-mono text-[11px] text-neutral-500 dark:text-zinc-400">
                        {new Date(entry.submit_time).toLocaleString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Submission */}
                          <button
                            onClick={() => setSelectedAttempt(entry)}
                            className="p-1.5 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-300 rounded-lg transition"
                            title="উত্তরপত্র দেখুন (Inspect Answers)"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Reset Attempt */}
                          <button
                            onClick={() =>
                              handleResetAttempt(
                                entry.id,
                                student.name || 'Student',
                              )
                            }
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 rounded-lg transition cursor-pointer"
                            title="পরীক্ষা রিসেট করুন (অনুমতি দিন পুনরায় দেওয়ার)"
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Student Submission Inspector Modal ── */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    backgroundColor:
                      selectedAttempt.users?.avatarColor ||
                      selectedAttempt.user?.avatarColor ||
                      '#059669',
                  }}
                >
                  {selectedAttempt.users?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                    {selectedAttempt.users?.name || 'শিক্ষার্থী'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {selectedAttempt.users?.institute || 'প্রতিষ্ঠান অনুল্লেখিত'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAttempt(null)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-neutral-50 dark:bg-zinc-900/60 text-center text-xs">
              <div>
                <p className="text-neutral-500 text-[10px]">অর্জিত নম্বর</p>
                <p className="text-base font-black text-emerald-600 font-mono">
                  {selectedAttempt.score}
                </p>
              </div>
              <div>
                <p className="text-neutral-500 text-[10px]">সঠিক উত্তর</p>
                <p className="text-base font-black text-emerald-500 font-mono">
                  {selectedAttempt.correct_count} টি
                </p>
              </div>
              <div>
                <p className="text-neutral-500 text-[10px]">ভুল উত্তর</p>
                <p className="text-base font-black text-rose-500 font-mono">
                  {selectedAttempt.wrong_count} টি
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-neutral-600 dark:text-zinc-400">
              <p className="flex justify-between">
                <span>পরীক্ষা শুরু:</span>
                <span className="font-mono text-neutral-900 dark:text-white">
                  {new Date(selectedAttempt.start_time).toLocaleTimeString()}
                </span>
              </p>
              <p className="flex justify-between">
                <span>জমা দেওয়ার সময়:</span>
                <span className="font-mono text-neutral-900 dark:text-white">
                  {new Date(selectedAttempt.submit_time).toLocaleTimeString()}
                </span>
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-zinc-800 flex justify-between gap-2">
              <button
                onClick={() =>
                  handleResetAttempt(
                    selectedAttempt.id,
                    selectedAttempt.users?.name || 'Student',
                  )
                }
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>অ্যাটেম্পট রিসেট করুন</span>
              </button>

              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-5 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-zinc-800"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
