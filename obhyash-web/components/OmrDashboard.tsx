// File: components/OmrDashboard.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ExamResult } from '@/lib/types'; // Adjust path if needed
import { evaluateOMRScript } from '@/services/geminiService'; // Adjust path
import { supabase } from '@/lib/utils/supabase'; // ✅ Import Supabase

interface OmrDashboardProps {
  initialData: ExamResult[];
}

export default function OmrDashboard({ initialData }: OmrDashboardProps) {
  const [history, setHistory] = useState<ExamResult[]>(initialData);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewingScript, setViewingScript] = useState<ExamResult | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Filter only script submissions
  const scriptSubmissions = history.filter(
    (h) => h.submissionType === 'script',
  );

  // --- 1. AI EVALUATION & SAVE TO DB ---
  const handleEvaluate = async (result: ExamResult) => {
    if (!result.scriptImageData) {
      alert('Error: Script image missing.');
      return;
    }
    // Validation: Ensure we have questions to grade against
    if (!result.questions || result.questions.length === 0) {
      alert('Error: Questions data missing. Cannot grade.');
      return;
    }

    setProcessingId(result.id);

    try {
      // 1. Call AI Service
      const detectedAnswers = await evaluateOMRScript(
        result.scriptImageData,
        result.questions,
      );

      // 2. Local Grading Logic
      let rawScore = 0;
      let correctCount = 0;
      let wrongCount = 0;

      result.questions.forEach((q) => {
        const ua = detectedAnswers[q.id];
        if (ua !== undefined && typeof q.points === 'number') {
          if (ua === q.correctAnswerIndex) {
            rawScore += q.points;
            correctCount++;
          } else {
            wrongCount++;
            rawScore -= q.points * result.negativeMarking;
          }
        }
      });

      const finalScore = Math.max(0, rawScore);

      // 3. Update Result Object (Local)
      const updatedResult: ExamResult = {
        ...result,
        userAnswers: detectedAnswers,
        score: finalScore,
        correctCount,
        wrongCount,
        status: 'evaluated',
      };

      // 4. ✅ SAVE TO SUPABASE
      const { error } = await supabase
        .from('results')
        .update({
          score: finalScore,
          correct_count: correctCount,
          wrong_count: wrongCount,
          status: 'evaluated',
          // If you have a column for user answers, uncomment below:
          // user_answers: detectedAnswers
        })
        .eq('id', result.id);

      if (error) throw error;

      // 5. Update State
      setHistory((prev) =>
        prev.map((h) => (h.id === result.id ? updatedResult : h)),
      );
      setViewingScript(null);
      alert(`Evaluation Complete! Saved Score: ${finalScore.toFixed(2)}`);
    } catch (error: unknown) {
      console.error(error);
      alert('Evaluation Failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  };

  // --- 2. REJECTION LOGIC & SAVE TO DB ---
  const confirmReject = async () => {
    if (!viewingScript) return;
    const reason = rejectReason.trim() || 'No reason provided';

    // 1. Update DB (Mark as rejected)
    const { error } = await supabase
      .from('results')
      .update({
        status: 'rejected',
        score: 0,
        // rejection_reason: reason // Uncomment if you added this column to DB
      })
      .eq('id', viewingScript.id);

    if (error) {
      alert('Failed to reject: ' + error.message);
      return;
    }

    // 2. Update Local State
    const updatedResult: ExamResult = {
      ...viewingScript,
      status: 'rejected',
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      rejectionReason: reason,
    };

    setHistory((prev) =>
      prev.map((h) => (h.id === viewingScript.id ? updatedResult : h)),
    );
    setViewingScript(null);
    setShowRejectInput(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Pending"
          value={scriptSubmissions.filter((s) => s.status === 'pending').length}
          color="text-amber-500"
        />
        <StatCard
          label="Evaluated"
          value={
            scriptSubmissions.filter((s) => s.status === 'evaluated').length
          }
          color="text-emerald-500"
        />
        <StatCard
          label="Rejected"
          value={
            scriptSubmissions.filter((s) => s.status === 'rejected').length
          }
          color="text-red-500"
        />
        <StatCard
          label="Total"
          value={scriptSubmissions.length}
          color="text-indigo-500"
        />
      </div>

      {/* 2. Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                  Subject
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                  Date
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {scriptSubmissions.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {item.subject}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.examType || 'General'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status || 'pending'} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setViewingScript(item);
                        setShowRejectInput(false);
                      }}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 ml-auto"
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
                          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {scriptSubmissions.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    No OMR scripts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Review Modal */}
      {viewingScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {viewingScript.subject}
                </h3>
                <p className="text-xs text-slate-500">ID: {viewingScript.id}</p>
              </div>
              <button
                onClick={() => setViewingScript(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6 text-slate-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Image Viewer */}
            <div className="flex-1 bg-slate-100 dark:bg-black p-4 overflow-auto flex justify-center items-center">
              {viewingScript.scriptImageData ? (
                <Image
                  src={viewingScript.scriptImageData}
                  alt="Script"
                  width={800}
                  height={600}
                  className="max-w-full max-h-full object-contain shadow-md rounded"
                />
              ) : (
                <div className="text-slate-400 flex flex-col items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-12 h-12 mb-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                    />
                  </svg>
                  Image not available
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              {showRejectInput ? (
                <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Reason for Rejection:
                  </label>
                  <input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="e.g., Image too blurry, wrong form..."
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmReject}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-sm transition-colors"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowRejectInput(true)}
                    disabled={viewingScript.status !== 'pending'}
                    className="px-4 py-2 text-red-600 border border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 rounded-lg font-bold transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleEvaluate(viewingScript)}
                    disabled={
                      viewingScript.status !== 'pending' ||
                      processingId === viewingScript.id
                    }
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30 transition-all"
                  >
                    {processingId === viewingScript.id ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
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
                            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                          />
                        </svg>
                        Auto-Evaluate (AI)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -- Sub Components --

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:
      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    evaluated:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    rejected:
      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${styles[status] || 'bg-gray-100 text-gray-800'}`}
    >
      {status}
    </span>
  );
}
