'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/services/database'; // Or use createClient from utils if simpler
import { ExamResult } from '@/lib/types';
import { evaluateOMRScript } from '@/services/gemini-service';
import { toast } from 'sonner';

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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
              <span className="bg-rose-600 text-white p-2 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
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
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              শিক্ষার্থীদের জমা দেওয়া OMR স্ক্রিপ্ট মূল্যায়ন করুন
            </p>
          </div>
          <button
            onClick={fetchSubmissions}
            className="p-2 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase">
              অপেক্ষমান
            </span>
            <div className="text-3xl font-bold text-amber-500 mt-2">
              {
                scriptSubmissions.filter(
                  (s) => s.status !== 'evaluated' && s.status !== 'rejected',
                ).length
              }
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase">
              মূল্যায়িত
            </span>
            <div className="text-3xl font-bold text-emerald-500 mt-2">
              {scriptSubmissions.filter((s) => s.status === 'evaluated').length}
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase">
              বাতিল
            </span>
            <div className="text-3xl font-bold text-red-500 mt-2">
              {scriptSubmissions.filter((s) => s.status === 'rejected').length}
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase">
              মোট
            </span>
            <div className="text-3xl font-bold text-rose-500 mt-2">
              {scriptSubmissions.length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-4 font-bold text-neutral-700 dark:text-neutral-300">
                    শিক্ষার্থী
                  </th>
                  <th className="px-6 py-4 font-bold text-neutral-700 dark:text-neutral-300">
                    বিষয় / ধরণ
                  </th>
                  <th className="px-6 py-4 font-bold text-neutral-700 dark:text-neutral-300">
                    জমাদানের সময়
                  </th>
                  <th className="px-6 py-4 font-bold text-neutral-700 dark:text-neutral-300">
                    ফাইল
                  </th>
                  <th className="px-6 py-4 font-bold text-neutral-700 dark:text-neutral-300">
                    স্ট্যাটাস
                  </th>
                  <th className="px-6 py-4 font-bold text-neutral-700 dark:text-neutral-300 text-right">
                    অ্যাকশন
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="animate-pulse flex justify-center">
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : scriptSubmissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-neutral-500 dark:text-neutral-400"
                    >
                      কোনো OMR স্ক্রিপ্ট জমা পড়েনি
                    </td>
                  </tr>
                ) : (
                  scriptSubmissions.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900 dark:text-white">
                          {item.user?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {item.user?.email || 'No Email'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900 dark:text-white">
                          {item.subject}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {item.examType || 'General'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                        {new Date(item.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setViewingScript(item)}
                          className="flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:underline"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                            />
                          </svg>
                          View Script
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {item.status === 'evaluated' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            মূল্যায়িত
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 w-fit">
                              বাতিল
                            </span>
                          </div>
                        )}
                        {(item.status === 'pending' || !item.status) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            অপেক্ষমান
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.status === 'evaluated' ? (
                          <span className="font-bold text-neutral-900 dark:text-white">
                            {item.score?.toFixed(2) || 0} নম্বর
                          </span>
                        ) : item.status === 'rejected' ? (
                          <span
                            className="text-xs text-red-500 italic max-w-[150px] inline-block"
                            title={item.rejectionReason}
                          >
                            {item.rejectionReason || 'Rejected'}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEvaluate(item)}
                            disabled={processingId === item.id}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 ml-auto"
                          >
                            {processingId === item.id
                              ? 'যাচাই হচ্ছে...'
                              : 'AI মূল্যায়ন'}
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

        {/* Script Viewer Modal */}
        {viewingScript && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800">
                <div>
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
                    {viewingScript.subject} - {viewingScript.user?.name}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    ID: {viewingScript.id}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setViewingScript(null);
                    setShowRejectInput(false);
                  }}
                  className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6 text-neutral-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 bg-neutral-900 flex justify-center">
                <Image
                  src={viewingScript.scriptImageData ?? '/placeholder.png'}
                  alt="Script"
                  width={800}
                  height={600}
                  className="max-w-full object-contain"
                  style={{ height: 'auto' }}
                  priority
                />
              </div>

              <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                {showRejectInput ? (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                      বাতিল করার কারণ (Rejection Reason):
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="কেন এই স্ক্রিপ্টটি বাতিল করা হচ্ছে? (যেমন: অস্পষ্ট ছবি, ভুল ফরম্যাট)"
                      className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                      autoFocus
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowRejectInput(false)}
                        className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        ফিরে যান
                      </button>
                      <button
                        onClick={confirmReject}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md"
                      >
                        নিশ্চিত বাতিল
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setRejectReason('');
                        setShowRejectInput(true);
                      }}
                      disabled={
                        viewingScript.status === 'evaluated' ||
                        viewingScript.status === 'rejected'
                      }
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                      বাতিল করুন (Reject)
                    </button>
                    <button
                      onClick={() => handleEvaluate(viewingScript)}
                      disabled={
                        viewingScript.status === 'evaluated' ||
                        viewingScript.status === 'rejected'
                      }
                      className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50"
                    >
                      মূল্যায়ন করুন (Evaluate)
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
