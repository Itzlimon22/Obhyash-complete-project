import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getStudentLiveExamDetails, getPublicLeaderboard, getStudentLiveExamPracticeHistory } from "@/services/live-exam-student-service";
import { LiveExam, LiveExamAttempt } from "@/lib/types";
import { toast } from "sonner";
import { Trophy, Clock, CheckCircle, BookOpen, AlertCircle, RotateCcw, ChevronRight, History, Award, EyeOff } from "lucide-react";
import { LiveExamSession } from "./LiveExamSession";
import LiveExamSolutionView from "./LiveExamSolutionView";
import LiveExamLeaderboardView from "./LiveExamLeaderboardView";
import AppLayout from "@/components/student/ui/layout/AppLayout";

export interface LiveExamDetailsViewProps {
  examId: string;
  examTitle: string;
  status: "untaken" | "taken";
  commonLayoutProps: any;
  onBack: () => void;
}

const LiveExamDetailsView: React.FC<LiveExamDetailsViewProps> = ({
  examId,
  examTitle,
  status,
  commonLayoutProps,
  onBack,
}) => {
  const { user } = useAuth();
  const [exam, setExam] = useState<LiveExam | null>(null);
  const [attempt, setAttempt] = useState<LiveExamAttempt | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [isViewingSolutions, setIsViewingSolutions] = useState(false);
  const [isViewingLeaderboard, setIsViewingLeaderboard] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchDetails();
    }
  }, [examId, user?.id]);

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      const [detailsData, historyData] = await Promise.all([
        getStudentLiveExamDetails(examId, user!.id),
        getStudentLiveExamPracticeHistory(examId, user!.id),
      ]);
      setExam(detailsData.exam);
      setAttempt(detailsData.attempt);
      setPracticeHistory(historyData);

      const now = new Date();
      const end = new Date(detailsData.exam.end_time);
      const isPast = now > end;

      // Only show public leaderboard if exam has ended or publish_result_instantly is true
      if (detailsData.attempt?.status === "submitted" && (isPast || detailsData.exam.id.startsWith("mock-"))) {
        const lb = await getPublicLeaderboard(examId, 5);
        setLeaderboard(lb);
      }
    } catch (error) {
      toast.error("Failed to load exam details");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="w-full flex justify-center py-20 text-neutral-500 font-medium animate-pulse">পরীক্ষার বিবরণ লোড হচ্ছে...</div>;
  }

  if (!exam) return null;

  const now = new Date();
  const start = new Date(exam.start_time);
  const end = new Date(exam.end_time);

  const isOngoing = now >= start && now <= end;
  const isUpcoming = now < start;
  const isPast = now > end;
  const isTaken = attempt?.status === "submitted";

  let statusBadgeText = "Upcoming";
  let statusBadgeColor = "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";

  if (isOngoing) {
    statusBadgeText = "Ongoing Live";
    statusBadgeColor = "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400";
  } else if (isPast) {
    statusBadgeText = "Archive / Past";
    statusBadgeColor = "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400";
  }

  // Leaderboard View Screen
  if (isViewingLeaderboard) {
    return (
      <AppLayout activeTab="live_exam" {...commonLayoutProps} title="মেধা তালিকা">
        <LiveExamLeaderboardView
          exam={exam}
          onBack={() => setIsViewingLeaderboard(false)}
          onViewSolutions={() => {
            setIsViewingLeaderboard(false);
            setIsViewingSolutions(true);
          }}
        />
      </AppLayout>
    );
  }

  // Solution View Screen
  if (isViewingSolutions) {
    return (
      <LiveExamSolutionView
        examId={exam.id}
        examTitle={exam.title}
        categoryTitle={exam.category}
        negativeMarking={exam.negative_marking || 0.25}
        commonLayoutProps={commonLayoutProps}
        onBack={() => setIsViewingSolutions(false)}
      />
    );
  }

  // Exam Taking Screen
  if (isTakingExam) {
    return (
      <LiveExamSession
        exam={exam}
        onExit={() => {
          setIsTakingExam(false);
          fetchDetails(); // refresh attempt status
        }}
        isDarkMode={commonLayoutProps.isDarkMode}
        toggleTheme={commonLayoutProps.toggleTheme}
      />
    );
  }

  return (
    <AppLayout
      activeTab="live_exam"
      {...commonLayoutProps}
      title="লাইভ পরীক্ষা"
    >
    <div className="w-full max-w-6xl mx-auto px-2 md:px-4 pt-4 md:pt-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors -ml-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-neutral-800 dark:text-neutral-200">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {exam.category}
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white">
              {exam.title}
            </h2>
          </div>
        </div>

        {isTaken && attempt && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-3.5 py-1.5 rounded-full flex items-center gap-2 font-bold text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>প্রাপ্ত নম্বর: {attempt.score}</span>
          </div>
        )}
      </div>

      <div className={`grid gap-8 lg:gap-12 ${(isTaken && isPast) ? "lg:grid-cols-[1.1fr_0.9fr]" : "max-w-2xl mx-auto"}`}>
        
        {/* Left Column: Details & Actions */}
        <div className="space-y-6">
          
          {/* Unified Big Exam Information Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 space-y-6">
            
            {/* Header / Schedule Header */}
            <div className="flex items-center justify-between font-extrabold text-lg text-neutral-900 dark:text-white">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>পরীক্ষার সময়সূচী</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadgeColor}`}>
                {statusBadgeText}
              </span>
            </div>
            
            {/* Schedule Range */}
            <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-xs text-neutral-500 font-semibold">শুরু</span>
                <div className="font-extrabold text-neutral-900 dark:text-white text-base sm:text-lg">
                  {start.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-xs text-neutral-500 font-medium">
                  {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="text-neutral-300 dark:text-neutral-700 font-black text-xl">→</div>
              <div className="text-right">
                <span className="text-xs text-neutral-500 font-semibold">সমাপ্তি</span>
                <div className="font-extrabold text-neutral-900 dark:text-white text-base sm:text-lg">
                  {end.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-xs text-neutral-500 font-medium">
                  {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Meta Information Stats */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-100 dark:border-neutral-800 grid grid-cols-3 divide-x divide-neutral-200 dark:divide-neutral-700 text-center">
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">সময়</p>
                <p className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white">{exam.duration_minutes} মিনিট</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">মোট প্রশ্ন</p>
                <p className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white">{exam.total_questions} টি</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">নেগেটিভ মার্ক</p>
                <p className="text-base sm:text-lg font-extrabold text-red-600 dark:text-red-400">-{exam.negative_marking || 0.25}</p>
              </div>
            </div>

            {/* Syllabus & Chapter Breakdown */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 text-sm font-extrabold text-neutral-900 dark:text-white">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>সিলেবাস ও অধ্যায়সমূহ</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-100 dark:border-neutral-800">
                {(() => {
                  const syllabusList = exam.description?.trim()
                    ? exam.description.split(/[\n\r,;•|]+/).map((s: string) => s.trim()).filter(Boolean)
                    : [];

                  if (syllabusList.length === 0) {
                    return (
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                        এই পরীক্ষার সিলেবাসে বোর্ড পাঠ্যবইয়ের সংশ্লিষ্ট অধ্যায়সমূহ অন্তর্ভুক্ত রয়েছে।
                      </p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-neutral-800 dark:text-neutral-200">
                      {syllabusList.map((item: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 min-w-0">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs mt-0.5">
                            {String(idx + 1).padStart(2, '0')}.
                          </span>
                          <span className="leading-relaxed font-medium truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Action Buttons based on lifecycle */}
          <div className="flex flex-col gap-3 pt-2">
            {!isTaken ? (
              // Untaken
              isOngoing ? (
                <button 
                  className="w-full bg-[#0B6B42] hover:bg-[#095937] text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-emerald-800/20 active:scale-[0.99] flex items-center justify-center gap-2"
                  onClick={() => setIsTakingExam(true)}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                  পরীক্ষা শুরু করুন
                </button>
              ) : isUpcoming ? (
                <button 
                  disabled
                  className="w-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 py-4 rounded-2xl font-bold text-base cursor-not-allowed"
                >
                  পরীক্ষা এখনো শুরু হয়নি
                </button>
              ) : (
                // Past & Untaken -> Practice mode
                <button 
                  className="w-full bg-[#0B6B42] hover:bg-[#095937] text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-emerald-800/20 active:scale-[0.99] flex items-center justify-center gap-2"
                  onClick={() => setIsTakingExam(true)}
                >
                  <RotateCcw className="w-5 h-5" />
                  অনুশীলন পরীক্ষা শুরু করুন
                </button>
              )
            ) : (
              // Taken
              isPast || exam.id.startsWith("mock-") ? (
                <div className="space-y-3">
                  <button 
                    onClick={() => setIsViewingSolutions(true)}
                    className="w-full bg-[#0B6B42] hover:bg-[#095937] text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-emerald-800/20 active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    সমাধান ও ব্যাখ্যা দেখুন
                  </button>
                  <button 
                    onClick={() => setIsTakingExam(true)}
                    className="w-full bg-transparent border-2 border-[#0B6B42] text-[#0B6B42] dark:border-emerald-600 dark:text-emerald-400 py-3.5 rounded-2xl font-bold text-base hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    পুনরায় অনুশীলন করুন
                  </button>
                </div>
              ) : (
                <button 
                  disabled
                  className="w-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 py-4 rounded-2xl font-bold text-base cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  ফলাফল প্রকাশের অপেক্ষায়...
                </button>
              )
            )}
          </div>

          {/* User's Result summary if completed and ended */}
          {isTaken && (isPast || exam.id.startsWith("mock-")) && attempt && (
            <div className="mt-6 bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                    অফিসিয়াল লাইভ পরীক্ষার ফলাফল
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  মেধা তালিকায় অন্তর্ভুক্ত
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <span className="text-xs text-neutral-500 font-medium">সঠিক</span>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{attempt.correct_count || 0}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                  <span className="text-xs text-neutral-500 font-medium">ভুল</span>
                  <p className="text-lg font-black text-red-600 dark:text-red-400">{attempt.wrong_count || 0}</p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-100 dark:border-neutral-700">
                  <span className="text-xs text-neutral-500 font-medium">মোট স্কোর</span>
                  <p className="text-lg font-black text-neutral-900 dark:text-white">{attempt.score}</p>
                </div>
              </div>
            </div>
          )}

          {/* Practice Attempts History Section */}
          {practiceHistory.length > 0 && (
            <div className="mt-6 bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                    অনুশীলন পরীক্ষার ইতিহাস ({practiceHistory.length})
                  </h3>
                </div>
                <span className="text-xs text-neutral-500 font-medium">
                  শুধুমাত্র অনুশীলনের রেকর্ড
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 divide-y divide-neutral-100 dark:divide-zinc-800">
                {practiceHistory.map((ph, idx) => (
                  <div key={ph.id || idx} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-neutral-800 dark:text-zinc-200 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-mono text-[10px]">
                          অনুশীলন #{practiceHistory.length - idx}
                        </span>
                        <span>{new Date(ph.submit_time).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        সঠিক: <span className="text-emerald-600 font-bold">{ph.correct_count}</span> • ভুল: <span className="text-rose-600 font-bold">{ph.wrong_count}</span>
                        {ph.time_taken_seconds > 0 && ` • সময়: ${Math.floor(ph.time_taken_seconds / 60)} মি.`}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-neutral-900 dark:text-white">
                        {ph.score}
                      </span>
                      <span className="text-[10px] text-neutral-400 block font-semibold">নম্বর</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anti-Leakage / Pending Results Banner (Placed Below Practice History) */}
          {isTaken && isOngoing && !exam.id.startsWith("mock-") && (
            <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 text-amber-900 dark:text-amber-200 flex items-start gap-3.5">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-base mb-1">উত্তরপত্র সফলভাবে জমা নেওয়া হয়েছে!</h4>
                <p className="text-sm text-amber-800/90 dark:text-amber-300 leading-relaxed">
                  পরীক্ষার গোপনীয়তা ও সমতা বজায় রাখতে, লাইভ পরীক্ষার সময়সীমা ({end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) শেষ হওয়ার পর সম্পূর্ণ সমাধান ও মেধা তালিকা উন্মুক্ত করা হবে।
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Leaderboard (Published / Ended) */}
        {isTaken && (isPast || exam.id.startsWith("mock-")) && (
          exam.is_leaderboard_published !== false ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
                    শীর্ষ মেধা তালিকা (Top Rankers)
                  </h3>
                </div>
                <span className="text-xs font-bold text-neutral-500">
                  শীর্ষ ৫ জন
                </span>
              </div>

              <div className="space-y-2.5">
                {leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                    লিডারবোর্ড তথ্য এখনও উপলব্ধ নয়।
                  </div>
                ) : (
                  leaderboard.slice(0, 5).map((lbEntry, index) => (
                    <div 
                      key={lbEntry.id || index} 
                      className={`bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border transition-all flex items-center justify-between ${
                        index === 0 
                          ? "border-amber-300 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/10" 
                          : "border-neutral-200 dark:border-neutral-800"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Rank number badge */}
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                          index === 0 ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" :
                          index === 1 ? "bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-white" :
                          index === 2 ? "bg-amber-700 text-white" :
                          "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}>
                          #{index + 1}
                        </span>

                        {/* User Avatar */}
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                          style={{ backgroundColor: lbEntry.users?.avatarColor || '#10b981' }}
                        >
                          {lbEntry.users?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        
                        {/* Name & Institute */}
                        <div className="min-w-0">
                          <div className="font-extrabold text-neutral-900 dark:text-white text-sm sm:text-base truncate">
                            {lbEntry.users?.name || "নাম অপ্রকাশিত"}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {lbEntry.users?.institute || "প্রতিষ্ঠান নেই"}
                          </div>
                        </div>
                      </div>
                      
                      {/* Score */}
                      <div className="text-right shrink-0 pl-3">
                        <span className="font-black text-base sm:text-lg text-emerald-600 dark:text-emerald-400">
                          {lbEntry.score}
                        </span>
                        <p className="text-[10px] text-neutral-400 font-semibold">নম্বর</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {leaderboard.length > 0 && (
                <button
                  onClick={() => setIsViewingLeaderboard(true)}
                  className="w-full mt-4 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-neutral-800 dark:text-neutral-200 hover:text-emerald-700 dark:hover:text-emerald-300 font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-700"
                >
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  <span>সম্পূর্ণ মেধা তালিকা দেখুন</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-neutral-200/60 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                <EyeOff className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-neutral-900 dark:text-white">মেধা তালিকা প্রকাশ স্থগিত</h4>
              <p className="text-sm text-neutral-500 leading-relaxed max-w-sm mx-auto">
                কর্তৃপক্ষ কর্তৃক এই পরীক্ষার মেধা তালিকা সাময়িকভাবে অপ্রকাশিত রাখা হয়েছে।
              </p>
            </div>
          )
        )}

      </div>
    </div>
    </AppLayout>
  );
};

export default LiveExamDetailsView;

