"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Award, RefreshCw, ExternalLink, Lock } from "lucide-react";
import { supabase } from "@/services/core";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

interface LiveExamHistoryRecord {
  attemptId: string;
  liveExamId: string;
  examTitle: string;
  category: string;
  score: number;
  totalMarks: number;
  correctCount: number;
  wrongCount: number;
  submitTime: string;
  durationSeconds: number;
  rank: number;
  totalParticipants: number;
  isResultPublished: boolean;
}

interface LiveExamHistoryPageViewProps {
  onBack: () => void;
  onViewSolution?: (examId: string) => void;
}

export const LiveExamHistoryPageView: React.FC<LiveExamHistoryPageViewProps> = ({
  onBack,
  onViewSolution,
}) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<LiveExamHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSection, setSelectedSection] = useState<string>("all");

  const toBanglaDigits = (num: any): string => {
    const en = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    let s = String(num);
    for (let i = 0; i < 10; i++) {
      s = s.replaceAll(en[i], bn[i]);
    }
    return s;
  };

  const formatBanglaDate = (dateStr: string): string => {
    try {
      const dt = new Date(dateStr);
      const months = [
        "জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন",
        "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"
      ];
      const day = toBanglaDigits(String(dt.getDate()).padStart(2, "0"));
      const month = months[dt.getMonth()];
      const year = toBanglaDigits(String(dt.getFullYear()).slice(-2));
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const getCategoryDisplayName = (cat: string): string => {
    switch (cat.toLowerCase().trim()) {
      case "medical":
        return "মেডিকেল";
      case "engineering":
        return "ইঞ্জিনিয়ারিং";
      case "varsity":
      case "varsity_a":
        return "ভার্সিটি ক";
      case "ssc_science":
        return "বিজ্ঞান বিভাগ";
      case "ssc_business":
        return "বাণিজ্য ও মানবিক";
      case "ssc_humanities":
        return "মানবিক";
      case "ssc_board":
        return "বোর্ড স্পেশাল";
      case "ssc_school":
        return "শীর্ষ স্কুল";
      case "hsc":
        return "এইচএসসি";
      default:
        return cat || "অন্যান্য";
    }
  };

  const formatDuration = (seconds: number): string => {
    const clamped = Math.max(0, Math.min(seconds, 86400));
    const mins = Math.floor(clamped / 60);
    const secs = clamped % 60;
    return `${toBanglaDigits(String(mins).padStart(2, "0"))}:${toBanglaDigits(String(secs).padStart(2, "0"))} মি.`;
  };

  const loadHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: attempts, error } = await supabase
        .from("live_exam_attempts")
        .select(
          "id, live_exam_id, score, correct_count, wrong_count, start_time, submit_time, live_exams(id, title, category, total_marks, duration_minutes, start_time, end_time, is_leaderboard_published, is_answer_published, status)"
        )
        .eq("user_id", user.id)
        .eq("status", "submitted")
        .order("submit_time", { ascending: false });

      if (error) throw error;

      if (!attempts || attempts.length === 0) {
        setRecords([]);
        setLoading(false);
        return;
      }

      const list: LiveExamHistoryRecord[] = [];

      for (const a of attempts as any[]) {
        const examData = a.live_exams;
        const examId = a.live_exam_id;
        const userScore = Number(a.score || 0);

        let durationSecs = 0;
        if (a.start_time && a.submit_time) {
          const diff = (new Date(a.submit_time).getTime() - new Date(a.start_time).getTime()) / 1000;
          durationSecs = Math.max(0, Math.floor(diff));
        }

        const isMock = String(examId).startsWith("mock-");
        const now = new Date();
        const isPast = examData?.end_time ? now.getTime() > new Date(examData.end_time).getTime() : false;
        const isLbPub = examData?.is_leaderboard_published !== false;
        const isResultPub = isMock || (isPast && isLbPub);

        // Rank count & Total count (only calculated if results are published)
        let rank = 1;
        let total = 1;
        if (isResultPub) {
          try {
            const { count: higherCount } = await supabase
              .from("live_exam_attempts")
              .select("id", { count: "exact", head: true })
              .eq("live_exam_id", examId)
              .eq("status", "submitted")
              .gt("score", userScore);

            rank = (higherCount || 0) + 1;

            const { count: totalCount } = await supabase
              .from("live_exam_attempts")
              .select("id", { count: "exact", head: true })
              .eq("live_exam_id", examId)
              .eq("status", "submitted");

            total = totalCount || 1;
          } catch {
            // fallback
          }
        }

        list.push({
          attemptId: a.id,
          liveExamId: examId,
          examTitle: examData?.title || "লাইভ পরীক্ষা",
          category: examData?.category || "admission",
          score: userScore,
          totalMarks: Number(examData?.total_marks || 50),
          correctCount: Number(a.correct_count || 0),
          wrongCount: Number(a.wrong_count || 0),
          submitTime: a.submit_time || new Date().toISOString(),
          durationSeconds: durationSecs,
          rank,
          totalParticipants: total,
          isResultPublished: isResultPub,
        });
      }

      setRecords(list);
    } catch (err) {
      console.error("[LiveExamHistoryPageView] Error:", err);
      toast.error("ফলাফল হিস্ট্রি লোড করতে ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const distinctCategories = Array.from(
    new Set(records.map((r) => r.category.toLowerCase().trim()))
  );

  const filteredRecords =
    selectedSection === "all"
      ? records
      : records.filter((r) => r.category.toLowerCase().trim() === selectedSection);

  return (
    <div className="space-y-4 font-['HindSiliguri'] font-normal text-black dark:text-white animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] rounded-xl p-4 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            title="ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-normal text-black dark:text-white">
              আমার লাইভ পরীক্ষার ফলাফল
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={loadHistory}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-black dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-normal transition-all cursor-pointer disabled:opacity-50"
          title="রিফ্রেশ করুন"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-7 h-7 text-black dark:text-white animate-spin mx-auto opacity-70" />
            <p className="text-xs text-neutral-500 font-normal">
              ফলাফল ও মেধা তালিকা লোড হচ্ছে...
            </p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center space-y-3 px-4">
            <Award className="w-12 h-12 text-neutral-400 mx-auto opacity-40" />
            <p className="text-sm font-normal text-neutral-700 dark:text-neutral-300">
              আপনি এখনো কোনো লাইভ পরীক্ষায় অংশগ্রহণ করেননি!
            </p>
          </div>
        ) : (
          <div className="w-full max-h-[72vh] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xs">
                <tr className="text-[12px] font-normal">
                  <th className="py-3 px-3.5 w-28 font-normal text-white">তারিখ</th>
                  <th className="py-3 px-3.5 font-normal text-white">পরীক্ষার নাম ও বিষয়</th>
                  <th className="py-3 px-3.5 w-32 font-normal text-white">স্কোর</th>
                  <th className="py-3 px-3.5 w-32 font-normal text-white">মেধাক্রম</th>
                  <th className="py-3 px-3.5 w-28 font-normal text-white">সময়</th>
                  <th className="py-3 px-3.5 text-center w-24 font-normal text-white">সমাধান</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-[12px] font-normal">
                {filteredRecords.map((r, index) => {
                  return (
                    <tr
                      key={r.attemptId}
                      className={`transition-colors ${
                        index % 2 === 0
                          ? "bg-white dark:bg-[#13151F]"
                          : "bg-neutral-50 dark:bg-[#171926]/50"
                      } hover:bg-neutral-100/50 dark:hover:bg-neutral-800/30`}
                    >
                      {/* তারিখ */}
                      <td className="py-3.5 px-3.5 text-neutral-600 dark:text-neutral-300">
                        {formatBanglaDate(r.submitTime)}
                      </td>

                      {/* পরীক্ষার নাম ও বিষয় */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-normal text-black dark:text-white">
                          {r.examTitle}
                        </div>
                        <div className="mt-1">
                          <span className="inline-block text-[10px] font-normal bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded">
                            {getCategoryDisplayName(r.category)}
                          </span>
                        </div>
                      </td>

                      {/* স্কোর */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-normal text-black dark:text-white">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {toBanglaDigits(r.score)}
                          </span>{" "}
                          / {toBanglaDigits(r.totalMarks)}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-normal mt-0.5">
                          ✓ {toBanglaDigits(r.correctCount)} &nbsp; ✗ {toBanglaDigits(r.wrongCount)}
                        </div>
                      </td>

                      {/* মেধাক্রম */}
                      <td className="py-3.5 px-3.5">
                        {r.isResultPublished ? (
                          <>
                            <div className="font-normal text-black dark:text-white">
                              {toBanglaDigits(r.rank)} তম
                            </div>
                            <div className="text-[11px] text-neutral-500 font-normal mt-0.5">
                              ({toBanglaDigits(r.totalParticipants)} জন)
                            </div>
                          </>
                        ) : (
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              অপেক্ষমাণ
                            </span>
                            <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-normal mt-0.5">
                              মেধাতালিকা স্থগিত
                            </div>
                          </div>
                        )}
                      </td>

                      {/* সময় */}
                      <td className="py-3.5 px-3.5 text-neutral-600 dark:text-neutral-300">
                        {formatDuration(r.durationSeconds)}
                      </td>

                      {/* সমাধান */}
                      <td className="py-3.5 px-3.5 text-center">
                        {r.isResultPublished ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (onViewSolution) {
                                onViewSolution(r.liveExamId);
                              } else {
                                window.location.href = `/live-exam/${r.category}?examId=${r.liveExamId}&solution=true`;
                              }
                            }}
                            className="px-2.5 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-black dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-md transition-all cursor-pointer"
                          >
                            সমাধান
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              toast.info("পরীক্ষার সময় শেষ হলে এবং মেধা তালিকা প্রকাশিত হলে সমাধান দেখতে পারবেন।");
                            }}
                            className="px-2 py-1 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
                            title="সমাধান এখনো প্রকাশ করা হয়নি"
                          >
                            <Lock className="w-3 h-3" />
                            <span>লক করা</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dynamic Bottom Section Tabs: Shown ONLY if user participated in MORE THAN 1 section */}
      {distinctCategories.length > 1 && (
        <div className="bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] rounded-xl p-2.5 flex items-center gap-2 overflow-x-auto shadow-xs">
          <button
            type="button"
            onClick={() => setSelectedSection("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-normal transition-all shrink-0 cursor-pointer ${
              selectedSection === "all"
                ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            সবগুলো ({toBanglaDigits(records.length)})
          </button>

          {distinctCategories.map((cat) => {
            const count = records.filter(
              (r) => r.category.toLowerCase().trim() === cat
            ).length;
            const isSelected = selectedSection === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedSection(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-normal transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
              >
                {getCategoryDisplayName(cat)} ({toBanglaDigits(count)})
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveExamHistoryPageView;
