// File: app/omr-reviews/page.tsx
'use client'; // ✅ Switch to Client Component for dynamic data fetching

import React, { useEffect, useState } from 'react';
import OmrDashboard from '@/components/OmrDashboard';
import { ExamResult } from '@/lib/types';
import { supabase } from '@/lib/supabase'; // ✅ Import Supabase Client

export default function OmrReviewPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH REAL DATA FROM DB ---
  useEffect(() => {
    const fetchResults = async () => {
      try {
        // 1. Query Supabase for 'script' submissions
        const { data, error } = await supabase
          .from('results')
          .select(
            `
            *,
            exams (
              subject
            )
          `,
          )
          .eq('submission_type', 'script')
          .order('submitted_at', { ascending: false });

        if (error) throw error;

        // 2. Map Database Fields to App Types
        const formattedData: ExamResult[] = (data || []).map((item: any) => ({
          id: item.id,
          // Handle Join: 'exams' might be an array or object depending on query
          subject: item.exams?.subject || 'Unknown Subject',
          date: item.submitted_at,
          score: item.score || 0,
          totalMarks: item.total_marks || 0,
          totalQuestions: 0, // Optional: fetch if needed
          correctCount: item.correct_count || 0,
          wrongCount: item.wrong_count || 0,
          timeTaken: 0,
          negativeMarking: 0.25,
          status: item.status || 'pending',
          submissionType: 'script',
          // ✅ CRITICAL: Map the R2 URL from DB to the image prop
          scriptImageData: item.script_r2_url,
          questions: [], // We will fetch specific questions only when "Review" is clicked (optimization)
        }));

        setResults(formattedData);
      } catch (err) {
        console.error('Error fetching OMR scripts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <span className="bg-indigo-600 text-white p-2 rounded-lg">
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
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
                  />
                </svg>
              </span>
              OMR Review Center
            </h1>
            <p className="text-slate-500 mt-1">
              Review, Grade, and Approve student script submissions.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          /* Render the Dashboard Logic with REAL Data */
          <OmrDashboard initialData={results} />
        )}
      </div>
    </main>
  );
}
