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
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-6 animate-fade-in relative">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-3">
              <span className="bg-rose-600 text-white p-2 rounded-xl shadow-lg shadow-rose-500/20">
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
                    d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"
                  />
                </svg>
              </span>
              OMR চেকিং
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              শিক্ষার্থীদের জমা দেওয়া OMR স্ক্রিপ্ট মূল্যায়ন করুন
            </p>
          </div>
          <button
            onClick={fetchSubmissions}
            className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all shadow-sm shrink-0 w-fit active:scale-95"
            title="Refresh"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
              className="bg-white dark:bg-neutral-900 p-4 md:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm"
            >
              <span className="text-[10px] md:text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                {stat.label}
              </span>
              <div
                className={`text-2xl md:text-3xl font-black ${stat.color} mt-1`}
              >
                {stat.val}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content: Table on desktop, Cards on mobile */}
        <div className="space-y-4">
          {/* Mobile Card Layout (< md) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {isLoading ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-10 border border-neutral-200 dark:border-neutral-800 text-center text-neutral-400">
                Loading...
              </div>
            ) : scriptSubmissions.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-10 border border-dashed border-neutral-300 dark:border-neutral-800 text-center text-neutral-500">
                কোনো OMR স্ক্রিপ্ট জমা পড়েনি
              </div>
            ) : (
              scriptSubmissions.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-neutral-900 dark:text-white leading-tight">
                        {item.user?.name || 'Unknown'}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.user?.email || 'No Email'}
                      </p>
                    </div>
                    {item.status === 'evaluated' && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-tighter">
                        evaluated
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 uppercase tracking-tighter">
                        rejected
                      </span>
                    )}
                    {(item.status === 'pending' || !item.status) && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 uppercase tracking-tighter animate-pulse">
                        pending
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                        Subject
                      </p>
                      <p className="font-bold text-neutral-900 dark:text-neutral-200">
                        {item.subject}
                      </p>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                        Date
                      </p>
                      <p className="font-bold text-neutral-900 dark:text-neutral-200">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setViewingScript(item)}
                      className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs hover:underline"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                        />
                      </svg>
                      View Image
                    </button>

                    <div className="flex-1 text-right">
                      {item.status === 'evaluated' ? (
                        <span className="font-extrabold text-neutral-900 dark:text-white text-lg">
                          {item.score?.toFixed(1) || 0}{' '}
                          <span className="text-[10px] text-neutral-400">
                            MARKS
                          </span>
                        </span>
                      ) : item.status === 'rejected' ? (
                        <span className="text-[10px] text-rose-500 font-bold italic truncate max-w-[120px] inline-block">
                          {item.rejectionReason || 'Rejected'}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEvaluate(item)}
                          disabled={processingId === item.id}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {processingId === item.id
                            ? 'Evaluating...'
                            : 'AI Evaluation'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table Layout (>= md) */}
          <div className="hidden md:block bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr className="text-[10px] uppercase font-black tracking-widest text-neutral-400">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Submitted At</th>
                    <th className="px-6 py-4">File</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-20">
                        <div className="animate-pulse flex justify-center text-neutral-400 font-bold uppercase tracking-widest text-xs">
                          Fetching Data...
                        </div>
                      </td>
                    </tr>
                  ) : scriptSubmissions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-20 text-center text-neutral-500 dark:text-neutral-400 font-medium"
                      >
                        কোনো OMR স্ক্রিপ্ট জমা পড়েনি
                      </td>
                    </tr>
                  ) : (
                    scriptSubmissions.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-neutral-900 dark:text-white text-base">
                            {item.user?.name || 'Unknown'}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono">
                            {item.user?.email || 'No Email'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-black text-neutral-900 dark:text-neutral-200">
                            {item.subject}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-bold bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded w-fit mt-1 uppercase">
                            {item.examType || 'General'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 text-xs font-medium">
                          {new Date(item.date).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setViewingScript(item)}
                            className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold hover:underline group-hover:scale-105 transition-transform origin-left"
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
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>View Script</span>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          {item.status === 'evaluated' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-widest">
                              Evaluated
                            </span>
                          )}
                          {item.status === 'rejected' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 uppercase tracking-widest">
                              Rejected
                            </span>
                          )}
                          {(item.status === 'pending' || !item.status) && (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 uppercase tracking-widest">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.status === 'evaluated' ? (
                            <div className="flex flex-col items-end">
                              <span className="font-black text-xl text-neutral-900 dark:text-white">
                                {item.score?.toFixed(2) || 0}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none">
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
                              className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 ml-auto"
                            >
                              {processingId === item.id ? (
                                <Loader2 className="animate-spin w-4 h-4" />
                              ) : (
                                <Activity size={14} />
                              )}
                              {processingId === item.id
                                ? 'Processing...'
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
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-neutral-900 w-full sm:max-w-4xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-neutral-200 dark:border-neutral-800">
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900">
                <div>
                  <h3 className="font-black text-neutral-900 dark:text-white leading-tight">
                    {viewingScript.subject}
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">
                    {viewingScript.user?.name} • ID:{' '}
                    {viewingScript.id.slice(0, 8)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setViewingScript(null);
                    setShowRejectInput(false);
                  }}
                  className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-rose-600 transition-colors"
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
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-2 bg-black/95 flex items-center justify-center">
                <Image
                  src={viewingScript.scriptImageData ?? '/placeholder.png'}
                  alt="Script"
                  width={1200}
                  height={1600}
                  className="max-w-full h-auto object-contain shadow-2xl"
                  priority
                />
              </div>

              <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                {showRejectInput ? (
                  <div className="animate-in slide-in-from-bottom-4 duration-300">
                    <label className="block text-xs font-black text-neutral-400 uppercase tracking-widest mb-3">
                      Rejection Reason
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g., Image too blurry, Wrong format..."
                      className="w-full p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white mb-4 focus:ring-2 focus:ring-rose-500/20 outline-none text-sm min-h-[100px]"
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowRejectInput(false)}
                        className="flex-1 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500 font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmReject}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setRejectReason('');
                        setShowRejectInput(true);
                      }}
                      disabled={
                        viewingScript.status === 'evaluated' ||
                        viewingScript.status === 'rejected'
                      }
                      className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 disabled:opacity-30"
                    >
                      Reject Script
                    </button>
                    <button
                      onClick={() => handleEvaluate(viewingScript)}
                      disabled={
                        viewingScript.status === 'evaluated' ||
                        viewingScript.status === 'rejected'
                      }
                      className="flex-[2] py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-500/30 active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                      {processingId === viewingScript.id ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                      ) : (
                        <Activity size={16} />
                      )}
                      {processingId === viewingScript.id
                        ? 'Evaluating...'
                        : 'Start AI Evaluation'}
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
