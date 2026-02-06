'use client';

import { useState } from 'react';
import { createQuestion } from '@/services/database';

export default function TestUploadPage() {
  const [status, setStatus] = useState<string>('Ready');
  const [details, setDetails] = useState<string>('');

  const handleUpload = async () => {
    setStatus('Uploading...');
    setDetails('');

    try {
      const result = await createQuestion({
        question: 'Test Question via Auto-Verification',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswerIndices: [1], // Option B
        explanation: 'This is a test explanation proving the upload works.',
        subject: 'Physics', // Must exist in your DB or be allowed
        type: 'MCQ',
        difficulty: 'Medium',
        // New fields
        institutes: ['Test Institute'],
        years: [2024],
        division: 'Science',
        stream: 'HSC',
        status: 'Approved',
      });

      if (result.success) {
        setStatus('✅ Success!');
        setDetails(`Question created with ID: ${result.id}`);
      } else {
        setStatus('❌ Failed');
        setDetails(result.error || 'Unknown error');
      }
    } catch (err) {
      setStatus('❌ Error');
      setDetails(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
          Question Upload Verification
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Click below to insert a test question into the database. This verifies
          that the Authentication, RLS Policies, and Schema are all working
          correctly.
        </p>

        <button
          onClick={handleUpload}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          disabled={status === 'Uploading...'}
        >
          {status === 'Uploading...' ? 'Uploading...' : 'Upload Test Question'}
        </button>

        <div className="mt-6 p-4 rounded-lg bg-slate-100 dark:bg-slate-700">
          <p className="font-semibold text-sm mb-1">Status: {status}</p>
          {details && (
            <pre className="text-xs text-slate-500 whitespace-pre-wrap overflow-auto max-h-40">
              {details}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
