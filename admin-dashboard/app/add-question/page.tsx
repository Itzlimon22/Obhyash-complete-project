'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AddQuestion() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form State
  const [examId, setExamId] = useState('');
  const [text, setText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correct, setCorrect] = useState('0'); // 0=A, 1=B, 2=C, 3=D

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 1. Send data to Supabase
      const { error } = await supabase.from('questions').insert([
        {
          exam_id: examId,
          question_text: text,
          options: [optionA, optionB, optionC, optionD], // Save options as a list
          correct_index: parseInt(correct),
          explanation: 'Explanation coming soon...',
        },
      ]);

      if (error) throw error;

      // 2. Success!
      setMessage('✅ Question added successfully!');
      // Clear the text field so you can add the next one quickly
      setText('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
    } catch (error: any) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex justify-center">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-black">Add Question</h1>

        {message && (
          <div
            className={`mb-4 p-2 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          {/* Exam ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Exam ID (UUID)
            </label>
            <input
              type="text"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              placeholder="Paste TEST_EXAM_ID here"
              className="w-full p-2 border rounded border-gray-300"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Copy this from your Supabase 'exams' table.
            </p>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Question Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-2 border rounded border-gray-300"
              rows={3}
              required
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Option A"
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              className="p-2 border rounded border-gray-300"
              required
            />
            <input
              placeholder="Option B"
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              className="p-2 border rounded border-gray-300"
              required
            />
            <input
              placeholder="Option C"
              value={optionC}
              onChange={(e) => setOptionC(e.target.value)}
              className="p-2 border rounded border-gray-300"
              required
            />
            <input
              placeholder="Option D"
              value={optionD}
              onChange={(e) => setOptionD(e.target.value)}
              className="p-2 border rounded border-gray-300"
              required
            />
          </div>

          {/* Correct Answer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Correct Answer
            </label>
            <select
              value={correct}
              onChange={(e) => setCorrect(e.target.value)}
              className="w-full p-2 border rounded border-gray-300"
            >
              <option value="0">Option A</option>
              <option value="1">Option B</option>
              <option value="2">Option C</option>
              <option value="3">Option D</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold"
          >
            {loading ? 'Saving...' : 'Save Question'}
          </button>
        </form>
      </div>
    </div>
  );
}
