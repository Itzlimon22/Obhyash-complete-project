'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Edit2,
  List,
  Trash2,
  Trophy,
  Radio,
  Clock,
  Award,
  Users,
  Search,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { LiveExam } from '@/lib/types';
import {
  getLiveExams,
  deleteLiveExam,
  createLiveExam,
  updateLiveExam,
  extendLiveExamDuration,
} from '@/services/live-exam-admin-service';
import LiveExamFormModal from './LiveExamFormModal';
import { useAuth } from '@/components/auth/AuthProvider';

export default function LiveExamDashboard() {
  const { user } = useAuth();
  const pathname = usePathname();
  const basePath = pathname.startsWith('/teacher')
    ? '/teacher/live-exams'
    : '/admin/live-exams';

  const [exams, setExams] = useState<LiveExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<LiveExam | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchExams();
  }, [user?.id]);

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const data = await getLiveExams();
      setExams(data);
    } catch (error) {
      toast.error('Failed to fetch live exams: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveExam = async (examData: Partial<LiveExam>) => {
    try {
      if (editingExam) {
        await updateLiveExam(editingExam.id, examData);
        toast.success('লাইভ পরীক্ষা সফলভাবে আপডেট করা হয়েছে!');
      } else {
        await createLiveExam(examData);
        toast.success('নতুন লাইভ পরীক্ষা তৈরি করা হয়েছে!');
      }
      setIsModalOpen(false);
      fetchExams();
    } catch (error) {
      toast.error('Failed to save exam');
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        '⚠️ আপনি কি নিশ্চিত যে এই লাইভ পরীক্ষা মুছে ফেলতে চান? এতে সকল ফলাফল মুছে যাবে।',
      )
    )
      return;
    try {
      await deleteLiveExam(id);
      toast.success('লাইভ পরীক্ষা মুছে ফেলা হয়েছে');
      fetchExams();
    } catch (error) {
      toast.error('Failed to delete exam');
    }
  };

  const handleExtend = async (id: string, mins: number) => {
    try {
      await extendLiveExamDuration(id, mins);
      toast.success(`পরীক্ষার সময় +${mins} মিনিট বৃদ্ধি করা হয়েছে!`);
      fetchExams();
    } catch (error) {
      toast.error('Failed to extend duration');
    }
  };

  const filteredExams = exams.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description &&
        e.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat =
      categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
              লাইভ প্রতিযোগিতা কমান্ড সেন্টার • Live Exam Controller
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            লাইভ পরীক্ষা ব্যবস্থাপনা
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">
            শিডিউলড লাইভ প্রতিযোগিতা তৈরি, প্রশ্ন নির্ধারণ, সময় বর্ধিতকরণ ও লিডারবোর্ড ট্র্যাকিং
          </p>
        </div>

        <button
          onClick={() => {
            setEditingExam(null);
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 bg-[#004633] hover:bg-[#005a42] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>নতুন লাইভ এক্সাম তৈরি</span>
        </button>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="পরীক্ষার নাম খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-neutral-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs font-semibold outline-none text-neutral-900 dark:text-white cursor-pointer"
          >
            <option value="all">সকল ক্যাটাগরি</option>
            <option value="hsc">HSC Science</option>
            <option value="medical">Medical</option>
            <option value="engineering">Engineering</option>
            <option value="varsity_a">Varsity A</option>
            <option value="ssc">SSC</option>
          </select>

          <button
            onClick={fetchExams}
            className="p-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 rounded-xl text-neutral-600 dark:text-zinc-400 transition"
            title="Refresh list"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Live Exams Table ── */}
      <div className="bg-white dark:bg-[#121215] rounded-2xl border border-neutral-200 dark:border-zinc-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-zinc-900/60 border-b border-neutral-200 dark:border-zinc-800 text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="p-4">পরীক্ষার বিবরণ</th>
                <th className="p-4">ক্যাটাগরি</th>
                <th className="p-4">সময়সূচি (Schedule)</th>
                <th className="p-4">প্রশ্ন ও নম্বর</th>
                <th className="p-4">অবস্থা (Status)</th>
                <th className="p-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-neutral-500 font-mono text-xs"
                  >
                    লাইভ এক্সাম ডাটা লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    কোনো লাইভ পরীক্ষা পাওয়া যায়নি। "নতুন লাইভ এক্সাম তৈরি" বাটনে
                    ক্লিক করে প্রথম এক্সাম শিডিউল করুন।
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => {
                  const now = new Date().getTime();
                  const start = exam.start_time ? new Date(exam.start_time).getTime() : 0;
                  const end = exam.end_time ? new Date(exam.end_time).getTime() : 0;
                  const isLiveNow = start > 0 && end > 0 && now >= start && now <= end;
                  const isUpcoming = start > 0 && now < start;
                  const isEnded = end > 0 && now > end;

                  return (
                    <tr
                      key={exam.id}
                      className="hover:bg-neutral-50 dark:hover:bg-zinc-850/40 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {isLiveNow && (
                            <span className="flex h-2.5 w-2.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                            </span>
                          )}
                          <p className="font-bold text-neutral-900 dark:text-white text-sm">
                            {exam.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                          {exam.description || 'কোনো বিবরণ নেই'}
                        </p>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 rounded-lg text-[11px] font-semibold uppercase border border-neutral-200/60 dark:border-zinc-700/60">
                          {exam.category}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <p className="text-neutral-700 dark:text-zinc-300">
                            <span className="text-neutral-400">শুরু:</span>{' '}
                            {exam.start_time
                              ? new Date(exam.start_time).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })
                              : 'নির্ধারিত নয়'}
                          </p>
                          <p className="text-neutral-500 dark:text-zinc-400">
                            <span className="text-neutral-400">শেষ:</span>{' '}
                            {exam.end_time
                              ? new Date(exam.end_time).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })
                              : 'নির্ধারিত নয়'}
                          </p>
                        </div>
                      </td>

                      <td className="p-4 text-xs text-neutral-600 dark:text-zinc-400">
                        <p className="font-semibold">
                          {exam.duration_minutes} মিনিট • {exam.total_marks}{' '}
                          নম্বর
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {exam.total_questions || 0} টি প্রশ্ন যুক্ত রয়েছে
                        </p>
                      </td>

                      <td className="p-4">
                        {isLiveNow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            LIVE NOW
                          </span>
                        ) : isUpcoming ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Upcoming
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 border border-neutral-200 dark:border-zinc-700">
                            Ended
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Time Extension Button (Active only during live) */}
                          {isLiveNow && (
                            <button
                              onClick={() => handleExtend(exam.id, 5)}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-lg text-[10px] font-bold border border-amber-500/30 transition flex items-center gap-1"
                              title="Extend exam by +5 minutes"
                            >
                              <Zap size={11} /> +5m
                            </button>
                          )}

                          {/* Builder */}
                          <Link
                            href={`${basePath}/${exam.id}/builder`}
                            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors border border-transparent hover:border-emerald-500/20"
                            title="প্রশ্ন নির্ধারণ (Question Builder)"
                          >
                            <List size={16} />
                          </Link>

                          {/* Results */}
                          <Link
                            href={`${basePath}/${exam.id}/results`}
                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors border border-transparent hover:border-blue-500/20"
                            title="লিডারবোর্ড ও ফলাফল"
                          >
                            <Trophy size={16} />
                          </Link>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingExam(exam);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-xl transition-colors border border-transparent hover:border-amber-500/20 cursor-pointer"
                            title="পরীক্ষা সম্পাদনা"
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(exam.id)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/20 cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={16} />
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

      {isModalOpen && (
        <LiveExamFormModal
          exam={editingExam}
          onSave={handleSaveExam}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
