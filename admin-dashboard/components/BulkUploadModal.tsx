'use client'; // 👈 IMPORTANT for Next.js

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { Upload, X, FileText, CheckCircle, Loader2 } from 'lucide-react';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function BulkUploadModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Helper: Normalize Data
  const normalizeQuestion = (raw: any) => {
    const options = [
      raw.option1 || raw.Option1 || raw.options?.[0],
      raw.option2 || raw.Option2 || raw.options?.[1],
      raw.option3 || raw.Option3 || raw.options?.[2],
      raw.option4 || raw.Option4 || raw.options?.[3],
    ].filter(Boolean);

    let answer = raw.answer || raw.Answer;
    if (answer === 'option1') answer = options[0];
    if (answer === 'option2') answer = options[1];
    if (answer === 'option3') answer = options[2];
    if (answer === 'option4') answer = options[3];

    return {
      question: raw.question || raw.Question,
      explanation: raw.explanation || raw.Explanation || '',
      difficulty: raw.difficulty || raw.Difficulty || 'Medium',
      subject: raw.subject || raw.Subject || 'General',
      chapter: raw.chapter || raw.Chapter || 'General',
      topic: raw.topic || raw.Topic || '1',
      options: options,
      answer: answer,
      examType: raw.examType || raw.ExamType || '',
    };
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let rawData = [];
        if (file.name.endsWith('.json')) {
          rawData = JSON.parse(e.target?.result as string);
        } else {
          const workbook = XLSX.read(e.target?.result, { type: 'binary' });
          rawData = XLSX.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[0]],
          );
        }
        setParsedQuestions(rawData.map(normalizeQuestion));
        setStep(2);
      } catch (err: any) {
        alert('Error parsing file: ' + err.message);
      }
    };

    file.name.endsWith('.json')
      ? reader.readAsText(file)
      : reader.readAsBinaryString(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
  });

  const handleUpload = async () => {
    setUploading(true);
    setLogs(['Starting upload...']);
    const BATCH_SIZE = 200;
    let successCount = 0;

    try {
      // In Next.js, we don't always have a logged-in user on the client instantly,
      // so we use a placeholder or handle auth separately.
      const userId = '00000000-0000-0000-0000-000000000000';

      for (let i = 0; i < parsedQuestions.length; i += BATCH_SIZE) {
        const batch = parsedQuestions.slice(i, i + BATCH_SIZE);
        setLogs((prev) => [
          ...prev,
          `Uploading batch ${i + 1} - ${i + batch.length}...`,
        ]);

        const { data, error } = await supabase.functions.invoke(
          'bulk-upload-questions',
          {
            body: { questions: batch, userId: userId },
          },
        );

        if (error) throw error;
        successCount += data.count || 0;
      }
      setLogs((prev) => [...prev, `✅ DONE! Added ${successCount} questions.`]);
      setTimeout(() => {
        if (confirm('Success! Close?')) onClose();
      }, 500);
    } catch (err: any) {
      setLogs((prev) => [...prev, `❌ Error: ${err.message}`]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 text-black">
      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Bulk Upload</h2>
          <button onClick={onClose}>
            <X className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {step === 1 ? (
            <div
              {...getRootProps()}
              className={`border-3 border-dashed rounded-xl h-full flex flex-col items-center justify-center cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
            >
              <input {...getInputProps()} />
              <Upload className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-lg text-gray-600">
                Drag & Drop Excel, CSV, or JSON
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex justify-between mb-4">
                <span className="font-semibold">
                  Previewing {parsedQuestions.length} Questions
                </span>
                <button onClick={() => setStep(1)} className="text-blue-600">
                  Change File
                </button>
              </div>
              <div className="flex-1 border rounded bg-white overflow-auto mb-4">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-3">Question</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Answer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedQuestions.slice(0, 50).map((q, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-3 truncate max-w-xs">{q.question}</td>
                        <td className="p-3">{q.subject}</td>
                        <td className="p-3 text-green-600">{q.answer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {logs.length > 0 && (
                <div className="bg-gray-900 text-green-400 p-3 rounded text-xs mb-4 h-32 overflow-auto">
                  {logs.map((l, i) => (
                    <div key={i}>
                      {'>'} {l}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          {step === 2 && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`flex items-center gap-2 px-6 py-2 rounded text-white ${uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {uploading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}{' '}
              Upload
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
