"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Trophy, Clock, Target, Download } from "lucide-react";
import { toast } from "sonner";
import { LiveExam } from "@/lib/types";
import { getLiveExam, getLiveExamLeaderboard } from "@/services/live-exam-admin-service";
import Link from "next/link";
import {  useRouter , usePathname} from 'next/navigation';

export default function LiveExamResults({ examId }: { examId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith('/teacher') ? '/teacher/live-exams' : '/admin/live-exams';
  const [exam, setExam] = useState<LiveExam | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [examId]);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      const [examData, leaderboardData] = await Promise.all([
        getLiveExam(examId),
        getLiveExamLeaderboard(examId)
      ]);
      if (!examData) {
        toast.error("Exam not found");
        router.push(basePath);
        return;
      }
      setExam(examData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      toast.error("Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Rank", "Name", "Institute", "Score", "Correct", "Wrong", "Time Taken (Mins)", "Submit Time"].join(","),
      ...leaderboard.map((entry, index) => {
        const timeTakenMs = new Date(entry.submit_time).getTime() - new Date(entry.start_time).getTime();
        const timeTakenMins = (timeTakenMs / 1000 / 60).toFixed(2);
        
        return [
          index + 1,
          `"${entry.user?.name || 'Unknown User'}"`,
          `"${entry.user?.institute || 'N/A'}"`,
          entry.score,
          entry.correct_count,
          entry.wrong_count,
          timeTakenMins,
          new Date(entry.submit_time).toLocaleString()
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaderboard-${exam?.title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Leaderboard exported successfully!');
  };

  if (isLoading) return <div className="p-8 text-center">Loading leaderboard...</div>;
  if (!exam) return null;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={basePath} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Trophy className="text-yellow-500" />
              Leaderboard: {exam.title}
            </h1>
            <p className="text-sm text-neutral-500">
              {leaderboard.length} submissions • Total Marks: {exam.total_marks}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleExport}
          disabled={leaderboard.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="p-4 w-16 text-center">Rank</th>
                <th className="p-4">Student</th>
                <th className="p-4 text-center">Score</th>
                <th className="p-4 text-center">Accuracy</th>
                <th className="p-4 text-center">Time Taken</th>
                <th className="p-4 text-right">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    No submissions yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry, index) => {
                  const timeTakenMs = new Date(entry.submit_time).getTime() - new Date(entry.start_time).getTime();
                  const mins = Math.floor(timeTakenMs / 1000 / 60);
                  const secs = Math.floor((timeTakenMs / 1000) % 60);
                  
                  const totalAnswered = (entry.correct_count || 0) + (entry.wrong_count || 0);
                  const accuracy = totalAnswered > 0 ? Math.round((entry.correct_count / totalAnswered) * 100) : 0;

                  return (
                    <tr key={entry.id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${index < 3 ? 'bg-yellow-50/30 dark:bg-yellow-900/10' : ''}`}>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400" :
                          index === 1 ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" :
                          index === 2 ? "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400" :
                          "text-neutral-500"
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                            style={{ backgroundColor: entry.user?.avatarColor || '#10b981' }}
                          >
                            {entry.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 dark:text-white">
                              {entry.user?.name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-neutral-500">{entry.user?.institute || 'No institute'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {entry.score}
                        </span>
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                          {entry.correct_count} C / {entry.wrong_count} W
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Target size={16} className="text-neutral-400" />
                          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{accuracy}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Clock size={16} className="text-neutral-400" />
                          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            {mins}m {secs}s
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right text-xs text-neutral-500">
                        {new Date(entry.submit_time).toLocaleString()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
