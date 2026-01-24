'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ExcelJS from 'exceljs'; // 🔒 Secure alternative
import { createClient } from '@supabase/supabase-js';
import { Upload, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function BulkUploadModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // --- 1. SECURE FILE PARSING WITH EXCELJS ---
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const workbook = new ExcelJS.Workbook();
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet(1);
        const jsonData: any[] = [];

        worksheet?.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip Header

          // Mapping your exact flat format
          jsonData.push({
            stream: row.getCell(1).text,
            section: row.getCell(2).text,
            subject: row.getCell(3).text,
            chapter: row.getCell(4).text,
            topic: row.getCell(5).text,
            question: row.getCell(6).text,
            option1: row.getCell(7).text,
            option2: row.getCell(8).text,
            option3: row.getCell(9).text,
            option4: row.getCell(10).text,
            answer: row.getCell(11).text,
            explanation: row.getCell(12).text || '',
            difficulty: row.getCell(13).text || 'Medium',
            examType: row.getCell(14).text || '',
            institute: row.getCell(15).text || '',
            year: row.getCell(16).text || '',
          });
        });

        setParsedQuestions(jsonData);
        setStep(2);
      } catch (err: any) {
        alert(
          'Parsing failed. Ensure your Excel follows the 16-column template.',
        );
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // --- 2. THE UPLOAD LOGIC ---
  const handleUpload = async () => {
    setUploading(true);
    setLogs(['🚀 Starting secure upload...']);

    try {
      // We pass the flat array directly.
      // The Edge Function we built handles the mapping to options tables.
      const { data, error } = await supabase.functions.invoke(
        'bulk-upload-questions',
        {
          body: parsedQuestions,
        },
      );

      if (error) throw error;

      setLogs((prev) => [
        ...prev,
        `✅ Success! Added ${parsedQuestions.length} questions.`,
      ]);
      setTimeout(() => {
        alert('Upload complete!');
        onClose();
      }, 1000);
    } catch (err: any) {
      setLogs((prev) => [...prev, `❌ Error: ${err.message}`]);
    } finally {
      setUploading(false);
    }
  };

  // --- 3. EDITABLE CELL HANDLER ---
  const handleEdit = (index: number, key: string, value: string) => {
    const updated = [...parsedQuestions];
    updated[index][key] = value;
    setParsedQuestions(updated);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
    },
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-slate-800">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Bulk Upload Center
            </h2>
            <p className="text-xs text-slate-500">
              Supported: .xlsx (Excel) only
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Main Area */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
          {step === 1 ? (
            <div
              {...getRootProps()}
              className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}
            >
              <input {...getInputProps()} />
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <Upload className="w-10 h-10 text-blue-600" />
              </div>
              <p className="text-lg font-medium">
                Drop your Question Bank here
              </p>
              <p className="text-sm text-slate-400">or click to browse files</p>
            </div>
          ) : (
            <>
              {/* Editable Table */}
              <div className="flex-1 border rounded-xl overflow-auto bg-white shadow-inner">
                <table className="w-full text-sm border-separate border-spacing-0">
                  <thead className="bg-slate-100 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 border-b text-left">
                        Question (Editable)
                      </th>
                      <th className="p-3 border-b text-left">Subject</th>
                      <th className="p-3 border-b text-left">Answer</th>
                      <th className="p-3 border-b text-left">Institute</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedQuestions.map((q, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 border-b">
                          <textarea
                            className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded p-1 resize-none h-12"
                            value={q.question}
                            onChange={(e) =>
                              handleEdit(i, 'question', e.target.value)
                            }
                          />
                        </td>
                        <td className="p-2 border-b">
                          <input
                            className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded p-1"
                            value={q.subject}
                            onChange={(e) =>
                              handleEdit(i, 'subject', e.target.value)
                            }
                          />
                        </td>
                        <td className="p-2 border-b">
                          <select
                            className="bg-transparent border-none text-blue-600 font-medium cursor-pointer"
                            value={q.answer}
                            onChange={(e) =>
                              handleEdit(i, 'answer', e.target.value)
                            }
                          >
                            <option value="option1">Option 1</option>
                            <option value="option2">Option 2</option>
                            <option value="option3">Option 3</option>
                            <option value="option4">Option 4</option>
                          </select>
                        </td>
                        <td className="p-2 border-b">
                          <input
                            className="w-full bg-transparent border-none text-slate-500"
                            value={q.institute}
                            onChange={(e) =>
                              handleEdit(i, 'institute', e.target.value)
                            }
                            placeholder="Optional"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Console Logs */}
              <div className="h-24 bg-slate-900 rounded-lg p-3 font-mono text-[10px] text-emerald-400 overflow-y-auto shadow-lg">
                {logs.map((log, i) => (
                  <div key={i}>{`> ${log}`}</div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t flex justify-between items-center">
          <p className="text-sm text-slate-500">
            {step === 2 &&
              `${parsedQuestions.length} questions ready for processing`}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-all"
            >
              Cancel
            </button>
            {step === 2 && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`flex items-center gap-2 px-8 py-2 rounded-lg text-white font-bold shadow-lg transition-all ${uploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
              >
                {uploading ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {uploading ? 'Processing...' : 'Deploy Questions'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
