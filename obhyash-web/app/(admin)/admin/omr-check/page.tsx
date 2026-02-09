'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/services/database'; // Or use createClient from utils if simpler
import { ExamResult } from '@/lib/types';
import { evaluateOMRScript } from '@/services/gemini-service';
import { toast } from 'sonner';
import { Loader2, Activity } from 'lucide-react';

// Extended type to include user details
interface AdminExamResult extends Omit<ExamResult, 'questions'> {
  user?: {
    name: string;
    email: string;
  };
  questions: OMRQuestion[];
}

// Type for raw database response with snake_case
interface RawExamResultFromDB {
  id: string;
  subject: string;
  exam_type: string;
  date: string;
  score: number;
  total_marks: number;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  time_taken: number;
  negative_marking: number;
  submission_type: string;
  status: string;
  rejection_reason?: string;
  script_image_data?: string;
  questions: Array<{ id: string; correctAnswerIndex: number; points?: number }>;
  user_answers: Record<string, string | number | null>;
  user?: {
    name: string;
    email: string;
  };
}

// Simplified question type for OMR evaluation
interface OMRQuestion {
  id: string;
  correctAnswerIndex: number;
  points?: number;
}

// Type for questions from database (only fields we need)
type DBQuestion = Pick<OMRQuestion, 'id' | 'correctAnswerIndex' | 'points'>;

export default function OmrCheckPage() {
  const [submissions, setSubmissions] = useState<AdminExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewingScript, setViewingScript] = useState<AdminExamResult | null>(
    null,
  );
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select(
          `
          *,
          user:users (
            name,
            email
          )
        `,
        )
        .eq('submission_type', 'script')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        // Map snake_case from DB to camelCase if needed, but ExamResult type matches mostly
        // However, DB usually returns snake_case.
        // Let's assume the DB returns columns matching our types or we need to map them.
        // Actually types.ts defines ExamResult with camelCase (totalMarks, etc).
        // Supabase returns snake_case by default unless we alias.
        // We should double check column names in DB.
        // Assuming current types match. If not, map them:
        const mapped = data.map((d: RawExamResultFromDB): AdminExamResult => {
          const result: AdminExamResult = {
            id: d.id,
            subject: d.subject,
            examType: d.exam_type, // Map if needed
            date: d.date,
            score: d.score,
            totalMarks: d.total_marks,
            totalQuestions: d.total_questions,
            correctCount: d.correct_count,
            wrongCount: d.wrong_count,
            timeTaken: d.time_taken,
            negativeMarking: d.negative_marking,
            submissionType: d.submission_type as 'script' | 'digital',
            status: d.status as
              | 'pending'
              | 'evaluated'
              | 'rejected'
              | undefined,
            rejectionReason: d.rejection_reason,
            scriptImageData: d.script_image_data,
            questions: d.questions as OMRQuestion[],
            userAnswers: Object.entries(d.user_answers).reduce(
              (acc, [key, val]) => {
                if (typeof val === 'number') {
                  return {
                    ...acc,
                    [key]: val,
                  };
                }
                return acc;
              },
              {} as Record<string, number>,
            ),
            user: d.user, // Join result
          };
          return result;
        });
        setSubmissions(mapped);
      }
    } catch (error: unknown) {
      console.error('Error fetching OMR submissions:', error);
      toast.error('তথ্য লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleEvaluate = async (result: AdminExamResult) => {
    if (!result.scriptImageData || !result.questions) {
      toast.error('স্ক্রিপ্টের ছবি বা প্রশ্নপত্র পাওয়া যায়নি।');
      return;
    }

    setProcessingId(result.id);

    try {
      // 1. AI Analysis
      const detectedAnswers = await evaluateOMRScript(
        result.scriptImageData,
        result.questions,
      );

      // 2. Score Calculation
      let rawScore = 0;
      let correctCount = 0;
      let wrongCount = 0;

      result.questions.forEach((q) => {
        const ua = detectedAnswers[q.id];
        if (ua !== undefined) {
          if (ua === q.correctAnswerIndex) {
            if (typeof q.points === 'number') {
              rawScore += q.points;
              correctCount++;
            }
          } else {
            wrongCount++;
            if (typeof q.points === 'number') {
              rawScore -= q.points * result.negativeMarking;
            }
          }
        }
      });

      const finalScore = Math.max(0, rawScore);

      // 3. Update DB
      const { error } = await supabase
        .from('exam_results')
        .update({
          score: finalScore,
          correct_count: correctCount,
          wrong_count: wrongCount,
          user_answers: detectedAnswers,
          status: 'evaluated',
        })
        .eq('id', result.id);

      if (error) throw error;

      toast.success(
        `মূল্যায়ন সম্পন্ন! প্রাপ্ত নম্বর: ${finalScore.toFixed(2)}`,
      );
      fetchSubmissions(); // Refresh list
      setViewingScript(null);
    } catch (error: unknown) {
      console.error('Evaluation failed:', error);
      toast.error(
        error instanceof Error ? error.message : 'মূল্যায়ন ব্যর্থ হয়েছে',
      );
    } finally {
      setProcessingId(null);
    }
  };

  const confirmReject = async () => {
    if (!viewingScript) return;
    const reason = rejectReason.trim() || 'No reason provided';

    try {
      const { error } = await supabase
        .from('exam_results')
        .update({
          status: 'rejected',
          score: 0,
          correct_count: 0,
          wrong_count: 0,
          rejection_reason: reason,
        })
        .eq('id', viewingScript.id);

      if (error) throw error;

      toast.success('স্ক্রিপ্ট বাতিল করা হয়েছে');
      fetchSubmissions();
      setViewingScript(null);
      setShowRejectInput(false);
    } catch (error: unknown) {
      console.error('Rejection failed:', error);
      toast.error('বাতিল করা যায়নি');
    }
  };

  const scriptSubmissions = submissions;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 sm:p-6 animate-fade-in relative">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-rose-600 text-white p-2 rounded-2xl shadow-lg shadow-rose-500/20">
              <Activity size={24} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              OMR চেকিং
            </h1>
          </div>
          <button
            onClick={fetchSubmissions}
            className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-500 hover:text-rose-600 transition-all shadow-sm active:scale-95"
            title="Refresh"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[
            {
              label: 'অপেক্ষমান',
              val: scriptSubmissions.filter(
                (s) => s.status !== 'evaluated' && s.status !== 'rejected',
              ).length,
              color: 'text-amber-500',
              bg: 'bg-amber-50 dark:bg-amber-500/10',
            },
            {
              label: 'মূল্যায়িত',
              val: scriptSubmissions.filter((s) => s.status === 'evaluated')
                .length,
              color: 'text-emerald-500',
              bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            },
            {
              label: 'বাতিল',
              val: scriptSubmissions.filter((s) => s.status === 'rejected')
                .length,
              color: 'text-rose-500',
              bg: 'bg-rose-50 dark:bg-rose-500/10',
            },
            {
              label: 'মোট',
              val: scriptSubmissions.length,
              color: 'text-indigo-500',
              bg: 'bg-indigo-50 dark:bg-indigo-500/10',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all hover:shadow-md"
            >
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-1 block">
                {stat.label}
              </span>
              <div className={`text-2xl sm:text-3xl font-black ${stat.color}`}>
                {stat.val}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content: Table on desktop, Cards on mobile */}
        <div className="space-y-4">
          {/* Mobile Card Layout (< md) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {isLoading ? (
              <div className="col-span-full bg-white dark:bg-neutral-900 rounded-[2rem] p-12 border border-neutral-200 dark:border-neutral-800 text-center">
                <Loader2
                  className="animate-spin mx-auto text-rose-500 mb-2"
                  size={32}
                />
                <p className="text-neutral-500 dark:text-neutral-400 font-bold text-sm">
                  লোড হচ্ছে...
                </p>
              </div>
            ) : scriptSubmissions.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-neutral-900 rounded-[2rem] p-12 border border-dashed border-neutral-300 dark:border-neutral-800 text-center">
                <p className="text-neutral-400 font-bold text-sm">
                  কোনো OMR স্ক্রিপ্ট জমা পড়েনি
                </p>
              </div>
            ) : (
              scriptSubmissions.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] p-6 shadow-sm space-y-5 transition-all active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-neutral-900 dark:text-white leading-tight">
                        {item.user?.name || 'অজানা ব্যবহারকারী'}
                      </h4>
                      <p className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-wider">
                        {item.user?.email || 'ইমেইল নেই'}
                      </p>
                    </div>
                    {item.status === 'evaluated' && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                        EVALUATED
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 uppercase tracking-widest border border-rose-100 dark:border-rose-500/20">
                        REJECTED
                      </span>
                    )}
                    {(item.status === 'pending' || !item.status) && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 uppercase tracking-widest border border-amber-100 dark:border-amber-500/20 animate-pulse">
                        PENDING
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 leading-none">
                        বিষয়
                      </p>
                      <p className="font-black text-neutral-900 dark:text-neutral-200 truncate">
                        {item.subject}
                      </p>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 leading-none">
                        তারিখ
                      </p>
                      <p className="font-black text-neutral-900 dark:text-neutral-200">
                        {new Date(item.date).toLocaleDateString('bn-BD')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setViewingScript(item)}
                      className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/20 px-3 py-2 rounded-xl transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                        />
                      </svg>
                      স্ক্রিপ্ট দেখুন
                    </button>

                    <div className="flex-1 text-right">
                      {item.status === 'evaluated' ? (
                        <div className="flex flex-col items-end">
                          <span className="font-black text-rose-600 dark:text-rose-500 text-2xl leading-none">
                            {item.score?.toFixed(1) || 0}
                          </span>
                          <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1">
                            MARKS
                          </span>
                        </div>
                      ) : item.status === 'rejected' ? (
                        <span className="text-[10px] text-rose-500 font-bold italic truncate max-w-[120px] inline-block">
                          {item.rejectionReason || 'বাতিল করা হয়েছে'}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEvaluate(item)}
                          disabled={processingId === item.id}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {processingId === item.id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Activity size={16} />
                          )}
                          মূল্যায়ন
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table Layout (>= md) */}
          <div className="hidden md:block bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-separate border-spacing-0">
                <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                  <tr className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-400">
                    <th className="px-8 py-5">শিক্ষার্থী (Student)</th>
                    <th className="px-8 py-5">বিষয় (Subject)</th>
                    <th className="px-8 py-5">সময় (Submitted At)</th>
                    <th className="px-8 py-5">স্ক্রিপ্ট (Script)</th>
                    <th className="px-8 py-5">স্ট্যাটাস (Status)</th>
                    <th className="px-8 py-5 text-right">অ্যাকশন (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-24">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2
                            className="animate-spin text-rose-500"
                            size={32}
                          />
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                            Fetching Data...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : scriptSubmissions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-8 py-24 text-center text-neutral-400 font-bold"
                      >
                        কোনো OMR স্ক্রিপ্ট জমা পড়েনি
                      </td>
                    </tr>
                  ) : (
                    scriptSubmissions.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <div className="font-black text-neutral-900 dark:text-white text-base leading-tight">
                            {item.user?.name || 'Unknown'}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1">
                            {item.user?.email || 'No Email'}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-black text-neutral-900 dark:text-neutral-200">
                            {item.subject}
                          </div>
                          <div className="text-[9px] text-rose-600 dark:text-rose-400 font-black bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-lg w-fit mt-1.5 uppercase tracking-widest border border-rose-100 dark:border-rose-500/20">
                            {item.examType || 'General'}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-neutral-500 font-bold text-xs">
                          {new Date(item.date).toLocaleString('bn-BD')}
                        </td>
                        <td className="px-8 py-6">
                          <button
                            onClick={() => setViewingScript(item)}
                            className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-xs hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-2 rounded-xl transition-all active:scale-95 border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>স্ক্রিপ্ট দেখুন</span>
                          </button>
                        </td>
                        <td className="px-8 py-6">
                          {item.status === 'evaluated' && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                              Evaluated
                            </span>
                          )}
                          {item.status === 'rejected' && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 uppercase tracking-widest border border-rose-100 dark:border-rose-500/20">
                              Rejected
                            </span>
                          )}
                          {(item.status === 'pending' || !item.status) && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 uppercase tracking-widest border border-amber-100 dark:border-amber-500/20">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          {item.status === 'evaluated' ? (
                            <div className="flex flex-col items-end">
                              <span className="font-black text-2xl text-rose-600 dark:text-rose-500 leading-none">
                                {item.score?.toFixed(2) || 0}
                              </span>
                              <span className="text-[9px] text-neutral-400 font-black uppercase tracking-[0.2em] mt-1.5">
                                Score
                              </span>
                            </div>
                          ) : item.status === 'rejected' ? (
                            <span
                              className="text-xs text-rose-500 font-bold italic opacity-80"
                              title={item.rejectionReason}
                            >
                              {item.rejectionReason || 'Rejected'}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleEvaluate(item)}
                              disabled={processingId === item.id}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 ml-auto"
                            >
                              {processingId === item.id ? (
                                <Loader2 className="animate-spin w-4 h-4" />
                              ) : (
                                <Activity size={16} />
                              )}
                              {processingId === item.id
                                ? 'Evaluatiing...'
                                : 'AI Evaluate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Script Viewer Modal */}
        {viewingScript && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in transition-all">
            <div className="bg-white dark:bg-neutral-900 w-full sm:max-w-4xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl border-t sm:border border-neutral-200 dark:border-neutral-800">
              <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 sticky top-0 z-10">
                <div>
                  <h3 className="font-black text-neutral-900 dark:text-white leading-tight">
                    {viewingScript.subject}
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-[0.2em] mt-1">
                    {viewingScript.user?.name} • ID:{' '}
                    {viewingScript.id.slice(0, 8)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setViewingScript(null);
                    setShowRejectInput(false);
                  }}
                  className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-rose-600 transition-all active:scale-95"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 bg-neutral-950 flex items-center justify-center">
                <Image
                  src={viewingScript.scriptImageData ?? '/placeholder.png'}
                  alt="Script"
                  width={1200}
                  height={1600}
                  className="max-w-full h-auto object-contain rounded-xl shadow-2xl"
                  priority
                />
              </div>

              <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky bottom-0 z-10">
                {showRejectInput ? (
                  <div className="animate-in slide-in-from-bottom-4 duration-300">
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1">
                      বাতিল করার কারণ (Rejection Reason)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="যেমন: ছবি অস্পষ্ট, ভুল ফরম্যাট..."
                      className="w-full p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white mb-4 focus:ring-2 focus:ring-rose-500/20 outline-none text-sm min-h-[100px] resize-none"
                      autoFocus
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowRejectInput(false)}
                        className="flex-1 py-3.5 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-500 font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all active:scale-95"
                      >
                        ফিরে যান
                      </button>
                      <button
                        onClick={confirmReject}
                        className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95"
                      >
                        বাতিল নিশ্চিত করুন
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => {
                        setRejectReason('');
                        setShowRejectInput(true);
                      }}
                      disabled={
                        viewingScript.status === 'evaluated' ||
                        viewingScript.status === 'rejected'
                      }
                      className="flex-1 py-3.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 disabled:opacity-30 active:scale-95"
                    >
                      স্ক্রিপ্ট বাতিল করুন
                    </button>
                    <button
                      onClick={() => handleEvaluate(viewingScript)}
                      disabled={
                        viewingScript.status === 'evaluated' ||
                        viewingScript.status === 'rejected'
                      }
                      className="flex-[2] py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-500/30 active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                      {processingId === viewingScript.id ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                      ) : (
                        <Activity size={18} />
                      )}
                      {processingId === viewingScript.id
                        ? 'মূল্যায়ন চলছে...'
                        : 'AI মূল্যায়ন শুরু করুন'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
