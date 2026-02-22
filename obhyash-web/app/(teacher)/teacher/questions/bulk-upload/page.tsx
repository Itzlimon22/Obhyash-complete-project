'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider'; // Added useAuth
import {
  Upload,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
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
import { Question, QuestionStatus } from '@/lib/types'; // Import QuestionStatus

export default function TeacherBulkUploadPage() {
  // Renamed component
  const router = useRouter();
  const { user } = useAuth(); // Get current user
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
      return alert('Please select at least one question');

    if (!user?.email) return alert('User not identified.'); // Teacher specific check

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Chunking for large datasets (e.g. 50 at a time) to prevent timeouts
      const selected = Array.from(selectedRows)
        .map((idx) => previewQuestions[idx])
        .filter(Boolean)
        .map((q) => ({
          ...q,
          status: 'Pending' as QuestionStatus, // Enforce Pending status for teachers
          author: user.email, // Enforce current user as author
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
          failCount += chunk.length; // Approximate
          console.error('Batch failed', result.errors);
        }
      }

      if (failCount === 0) {
        alert(
          `Successfully imported all ${successCount} questions! Questions submitted for approval.`,
        );
        router.push('/teacher/question-management'); // Redirect to teacher question management
      } else {
        alert(
          `Import Partial Success: ${successCount} uploaded, ${failCount} failed. Check console for details.`,
        );
      }
    } catch (error) {
      alert(
        `Critical Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white dark:bg-neutral-900 shadow hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Bulk Upload Questions (Teacher)
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Upload CSV, JSON, or XLSX files. All uploads require admin
              approval.
            </p>
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
            Download Templates
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => downloadTemplate('CSV')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            >
              <Download className="w-4 h-4" /> CSV Template
            </button>
            <button
              onClick={() => downloadTemplate('JSON')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            >
              <Download className="w-4 h-4" /> JSON Template
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-6 mb-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition ${isDragOver ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-neutral-300 dark:border-neutral-700'}`}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Drag & drop your file here, or click to browse
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Parsing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" /> Choose File
                </>
              )}
            </label>
            {file && (
              <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                Selected: <strong>{file.name}</strong> ({fileType})
              </p>
            )}
          </div>
        </div>

        {/* Validation Results */}
        {previewQuestions.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
              Validation Results
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <FileText className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {previewQuestions.length}
                  </p>
                  <p className="text-sm text-neutral-600">Total</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {validCount}
                  </p>
                  <p className="text-sm text-neutral-600">Valid</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {errorCount}
                  </p>
                  <p className="text-sm text-neutral-600">Errors</p>
                </div>
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="max-h-32 overflow-y-auto">
                    {validationErrors.slice(0, 10).map((err, i) => (
                      <p
                        key={i}
                        className="text-sm text-red-800 dark:text-red-300"
                      >
                        Row {err.row}: {err.message}
                      </p>
                    ))}
                    {validationErrors.length > 10 && (
                      <p className="text-sm text-red-600 font-medium">
                        ...and {validationErrors.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {selectedRows.size} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setSelectedRows(
                      new Set(
                        previewQuestions
                          .map((_, i) => i)
                          .filter(
                            (i) =>
                              !validationErrors.some((e) => e.row === i + 1),
                          ),
                      ),
                    )
                  }
                  className="px-3 py-1 text-sm bg-neutral-200 dark:bg-neutral-700 rounded"
                >
                  Select Valid
                </button>
                <button
                  onClick={() => setSelectedRows(new Set())}
                  className="px-3 py-1 text-sm bg-neutral-200 dark:bg-neutral-700 rounded"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-700">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === previewQuestions.length}
                        onChange={(e) =>
                          setSelectedRows(
                            e.target.checked
                              ? new Set(previewQuestions.map((_, i) => i))
                              : new Set(),
                          )
                        }
                      />
                    </th>
                    <th className="p-3 text-left">#</th>
                    <th className="p-3 text-left">Question</th>
                    <th className="p-3 text-left">Subject</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewQuestions.map((q, idx) => {
                    const hasError = validationErrors.some(
                      (e) => e.row === idx + 1,
                    );
                    return (
                      <tr
                        key={idx}
                        className={`border-b border-neutral-100 dark:border-neutral-700 ${hasError ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(idx)}
                            disabled={hasError}
                            onChange={(e) => {
                              const s = new Set(selectedRows);
                              e.target.checked ? s.add(idx) : s.delete(idx);
                              setSelectedRows(s);
                            }}
                          />
                        </td>
                        <td className="p-3 text-neutral-500">{idx + 1}</td>
                        <td className="p-3 max-w-md truncate">{q.question}</td>
                        <td className="p-3 text-neutral-500">{q.subject}</td>
                        <td className="p-3">
                          {hasError ? (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                              Error
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                              Valid
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
        )}

        {/* Actions */}
        {previewQuestions.length > 0 && (
          <div className="flex justify-between">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedRows.size === 0 || isImporting}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-400 text-white rounded-lg"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Importing...
                </>
              ) : (
                `Import ${selectedRows.size} Questions`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
