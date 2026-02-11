'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  Upload,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Info,
} from 'lucide-react';
import {
  parseQuestionFile,
  generateCSVTemplate,
  generateJSONTemplate,
} from '@/lib/file-parsers';
import {
  transformAndValidateBatch,
  DatabaseQuestionFormat,
} from '@/lib/question-upload-mapper';
import { bulkCreateQuestions } from '@/services/database';
import { Question, QuestionStatus } from '@/lib/types';

export default function TeacherBulkUploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'CSV' | 'JSON' | 'XLSX' | null>(
    null,
  );
  const [previewQuestions, setPreviewQuestions] = useState<Partial<Question>[]>(
    [],
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [databaseQuestions, setDatabaseQuestions] = useState<
    DatabaseQuestionFormat[]
  >([]);
  const [validationErrors, setValidationErrors] = useState<
    Array<{ row: number; field: string; message: string }>
  >([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    setIsUploading(true);
    setValidationErrors([]);

    try {
      const { questions, fileType: detectedType } =
        await parseQuestionFile(uploadedFile);
      setFile(uploadedFile);
      setFileType(detectedType);

      const {
        databaseQuestions: dbQ,
        previewQuestions: preview,
        validationErrors: errors,
      } = transformAndValidateBatch(questions);
      setDatabaseQuestions(dbQ);
      setPreviewQuestions(preview);
      setValidationErrors(errors);

      // Select valid questions by default
      const validIndices = new Set(
        preview
          .map((_, idx) => idx)
          .filter((idx) => !errors.some((e) => e.row === idx + 1)),
      );
      setSelectedRows(validIndices);
    } catch (error) {
      alert(
        `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
    },
    [handleFileUpload],
  );

  const handleImport = async () => {
    if (selectedRows.size === 0)
      return alert('কমপক্ষে একটি প্রশ্ন নির্বাচন করুন।');

    if (!user?.email) return alert('ব্যবহারকারী সনাক্ত করা যায়নি।');

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Chunking for large datasets
      const selected = Array.from(selectedRows)
        .map((idx) => previewQuestions[idx])
        .filter(Boolean)
        .map((q) => ({
          ...q,
          status: 'Pending' as QuestionStatus, // Force status to Pending for teachers
          author: user.email, // Set author to current user
        }));

      const BATCH_SIZE = 50;
      const chunks = [];
      for (let i = 0; i < selected.length; i += BATCH_SIZE) {
        chunks.push(selected.slice(i, i + BATCH_SIZE));
      }

      for (const chunk of chunks) {
        const result = await bulkCreateQuestions(chunk);
        if (result.success) {
          successCount += result.count;
        } else {
          failCount += chunk.length;
          console.error('Batch failed', result.errors);
        }
      }

      if (failCount === 0) {
        alert(
          `সফলভাবে ${successCount} টি প্রশ্ন আপলোড করা হয়েছে! প্রশ্নগুলো অনুমোদনের জন্য জমা দেওয়া হয়েছে।`,
        );
        router.push('/teacher/questions');
      } else {
        alert(
          `আংশিক সফল: ${successCount} টি আপলোড হয়েছে, ${failCount} টি ব্যর্থ হয়েছে।`,
        );
      }
    } catch (error) {
      alert(
        `আপলোড ব্যর্থ হয়েছে: ${error instanceof Error ? error.message : 'অজানা ত্রুটি'}`,
      );
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = (format: 'CSV' | 'JSON') => {
    const content =
      format === 'CSV' ? generateCSVTemplate() : generateJSONTemplate();
    const blob = new Blob([content], {
      type: format === 'CSV' ? 'text/csv' : 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `question_template.${format.toLowerCase()}`;
    a.click();
  };

  const validCount =
    previewQuestions.length - new Set(validationErrors.map((e) => e.row)).size;
  const errorCount = new Set(validationErrors.map((e) => e.row)).size;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-emerald-900/10 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => router.back()}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-emerald-100" />
            </button>
            <h1 className="text-2xl font-black">বাল্ক আপলোড (Bulk Upload)</h1>
          </div>
          <p className="text-emerald-100 text-sm ml-1 max-w-xl">
            একসাথে একাধিক প্রশ্ন আপলোড করতে CSV বা JSON ফাইল ব্যবহার করুন। নিচে
            দেওয়া টেমপ্লেট ডাউনলোড করে শুরু করুন।
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => downloadTemplate('CSV')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-100 rounded-xl text-sm font-bold border border-emerald-700/50 transition-all"
          >
            <Download className="w-4 h-4" /> CSV টেমপ্লেট
          </button>
          <button
            onClick={() => downloadTemplate('JSON')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-100 rounded-xl text-sm font-bold border border-emerald-700/50 transition-all"
          >
            <Download className="w-4 h-4" /> JSON টেমপ্লেট
          </button>
        </div>
      </div>

      {/* ── Upload Area ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm text-center">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-12 transition-all duration-300
            ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 scale-[1.02]'
                : 'border-neutral-300 dark:border-neutral-700 hover:border-emerald-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
            }
          `}
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            ফাইল ড্র্যাগ করে এখানে আনুন
          </h3>
          <p className="text-neutral-500 text-sm mb-6 max-w-sm mx-auto">
            অথবা কম্পিউটার থেকে ফাইল সিলেক্ট করতে নিচের বাটনে ক্লিক করুন। (CSV,
            JSON, XLSX)
          </p>

          <input
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            onChange={(e) =>
              e.target.files?.[0] && handleFileUpload(e.target.files[0])
            }
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> প্রসেসিং হচ্ছে...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" /> ফাইল নির্বাচন করুন
              </>
            )}
          </label>

          {file && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium animate-in zoom-in">
              <CheckCircle className="w-4 h-4" />
              নির্বাচিত: {file.name} ({fileType})
            </div>
          )}
        </div>
      </div>

      {/* ── Validation Results ── */}
      {previewQuestions.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-2xl font-black text-neutral-800 dark:text-neutral-200">
                  {previewQuestions.length}
                </p>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  মোট প্রশ্ন
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-600">
                  {validCount}
                </p>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  সঠিক
                </p>
              </div>
            </div>

            <div
              className={`bg-white dark:bg-neutral-900 p-5 rounded-2xl border shadow-sm flex items-center gap-4 ${errorCount > 0 ? 'border-red-200 dark:border-red-900/50' : 'border-neutral-200 dark:border-neutral-800'}`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${errorCount > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-400'}`}
              >
                <XCircle size={24} />
              </div>
              <div>
                <p
                  className={`text-2xl font-black ${errorCount > 0 ? 'text-red-600' : 'text-neutral-400'}`}
                >
                  {errorCount}
                </p>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  ত্রুটিপূর্ণ
                </p>
              </div>
            </div>
          </div>

          {/* Validation Errors List */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4 text-red-700 dark:text-red-400 font-bold">
                <AlertCircle className="w-5 h-5" />
                <h3>সংশোধন প্রয়োজন</h3>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {validationErrors.slice(0, 10).map((err, i) => (
                  <div
                    key={i}
                    className="flex gap-2 text-sm text-red-800 dark:text-red-300 bg-red-100/50 dark:bg-red-900/20 p-2 rounded-lg"
                  >
                    <span className="font-bold whitespace-nowrap">
                      Row {err.row}:
                    </span>
                    <span>{err.message}</span>
                  </div>
                ))}
                {validationErrors.length > 10 && (
                  <p className="text-sm font-bold text-red-600 text-center pt-2">
                    ...আরও {validationErrors.length - 10} টি ত্রুটি
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                  {selectedRows.size} টি প্রশ্ন নির্বাচিত
                </span>
                {validationErrors.length > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md font-medium">
                    ত্রুটিপূর্ণ প্রশ্নগুলো স্বয়ংক্রিয়ভাবে বাতিল করা হয়েছে
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedRows(new Set())}
                className="text-xs font-bold text-red-500 hover:text-red-600"
              >
                সব বাতিল করুন
              </button>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 dark:bg-neutral-800 font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                        checked={
                          selectedRows.size === validCount && validCount > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const validIndices = previewQuestions
                              .map((_, i) => i)
                              .filter(
                                (i) =>
                                  !validationErrors.some(
                                    (e) => e.row === i + 1,
                                  ),
                              );
                            setSelectedRows(new Set(validIndices));
                          } else {
                            setSelectedRows(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="p-4">প্রশ্ন (Question)</th>
                    <th className="p-4">বিষয় (Subject)</th>
                    <th className="p-4 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {previewQuestions.map((q, idx) => {
                    const hasError = validationErrors.some(
                      (e) => e.row === idx + 1,
                    );
                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${
                          hasError ? 'bg-red-50/30 dark:bg-red-900/5' : ''
                        }`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                            checked={selectedRows.has(idx)}
                            disabled={hasError}
                            onChange={(e) => {
                              const s = new Set(selectedRows);
                              e.target.checked ? s.add(idx) : s.delete(idx);
                              setSelectedRows(s);
                            }}
                          />
                        </td>
                        <td className="p-4 font-medium text-neutral-800 dark:text-neutral-200 max-w-lg">
                          <div className="line-clamp-2">{q.question}</div>
                          {hasError && (
                            <div className="mt-1 text-xs text-red-500">
                              {
                                validationErrors.find((e) => e.row === idx + 1)
                                  ?.message
                              }
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-neutral-500">{q.subject}</td>
                        <td className="p-4 text-center">
                          {hasError ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold">
                              ত্রুটি
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                              সঠিক
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
            >
              বাতিল করুন
            </button>
            <button
              onClick={handleImport}
              disabled={selectedRows.size === 0 || isImporting}
              className="flex items-center gap-2 px-8 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> আপলোড হচ্ছে...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {selectedRows.size} টি প্রশ্ন আপলোড করুন
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
