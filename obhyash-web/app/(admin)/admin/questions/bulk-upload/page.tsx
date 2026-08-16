'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Eye,
  Sliders,
  Database,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  parseQuestionFile,
  generateCSVTemplate,
  generateJSONTemplate,
} from '@/lib/file-parsers';
import {
  UploadQuestionFormat,
  transformAndValidateBatch,
  DatabaseQuestionFormat,
} from '@/lib/question-upload-mapper';
import { bulkCreateQuestions } from '@/services/database';
import { Question } from '@/lib/types';
import { MathRenderer } from '@/components/common/MathRenderer';
import { uploadQuestionImage } from '@/services/storage-service';
import { Image as ImageIcon } from 'lucide-react';

export default function BulkUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'CSV' | 'JSON' | 'XLSX' | null>(
    null,
  );
  const [previewQuestions, setPreviewQuestions] = useState<Partial<Question>[]>(
    [],
  );
  const [databaseQuestions, setDatabaseQuestions] = useState<
    DatabaseQuestionFormat[]
  >([]);
  const [validationErrors, setValidationErrors] = useState<
    Array<{ row: number; field: string; message: string }>
  >([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Bulk Image Upload to Cloudflare R2
  const [uploadedImagesMap, setUploadedImagesMap] = useState<
    Record<string, string>
  >({});
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isImageDragOver, setIsImageDragOver] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Chunking and Real-time Progress State
  const [batchSize, setBatchSize] = useState<number>(50);
  const [progressState, setProgressState] = useState<{
    isOpen: boolean;
    total: number;
    processed: number;
    currentBatch: number;
    totalBatches: number;
    successCount: number;
    failCount: number;
    isFinished: boolean;
    isCancelled: boolean;
    logs: Array<{
      id: string;
      time: string;
      text: string;
      type: 'info' | 'success' | 'warning' | 'error';
    }>;
  }>({
    isOpen: false,
    total: 0,
    processed: 0,
    currentBatch: 0,
    totalBatches: 0,
    successCount: 0,
    failCount: 0,
    isFinished: false,
    isCancelled: false,
    logs: [],
  });

  const abortImportRef = useRef(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [progressState.logs]);

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

  const handleBulkImageUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith('image/'),
    );
    if (fileArray.length === 0) return;

    setIsUploadingImages(true);
    const newMap: Record<string, string> = { ...uploadedImagesMap };

    for (const imgFile of fileArray) {
      try {
        const result = await uploadQuestionImage(imgFile);
        if (result?.url) {
          newMap[imgFile.name] = result.url;
          newMap[imgFile.name.toLowerCase()] = result.url;
          const baseName = imgFile.name.substring(
            0,
            imgFile.name.lastIndexOf('.'),
          );
          if (baseName) {
            newMap[baseName] = result.url;
            newMap[baseName.toLowerCase()] = result.url;
          }
        }
      } catch (err) {
        console.error(`Failed to upload ${imgFile.name} to R2:`, err);
      }
    }

    setUploadedImagesMap(newMap);
    setIsUploadingImages(false);

    // If questions are already previewed, immediately map image URLs
    setPreviewQuestions((prev) =>
      prev.map((q) => {
        let updatedImageUrl = q.imageUrl;
        if (q.imageUrl && newMap[q.imageUrl]) {
          updatedImageUrl = newMap[q.imageUrl];
        }
        let updatedExpImg = q.explanationImageUrl;
        if (q.explanationImageUrl && newMap[q.explanationImageUrl]) {
          updatedExpImg = newMap[q.explanationImageUrl];
        }
        let updatedOptImgs = q.optionImages;
        if (q.optionImages && Array.isArray(q.optionImages)) {
          updatedOptImgs = q.optionImages.map((img) =>
            img && newMap[img] ? newMap[img] : img,
          );
        }
        return {
          ...q,
          imageUrl: updatedImageUrl,
          explanationImageUrl: updatedExpImg,
          optionImages: updatedOptImgs,
        };
      }),
    );
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
    },
    [handleFileUpload],
  );

  const handleImageDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsImageDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleBulkImageUpload(e.dataTransfer.files);
      }
    },
    [uploadedImagesMap, previewQuestions],
  );

  const handleImport = async () => {
    if (selectedRows.size === 0)
      return alert('Please select at least one question to import.');

    const selectedIndices = Array.from(selectedRows).sort((a, b) => a - b);
    const selected = selectedIndices
      .map((idx) => previewQuestions[idx])
      .filter((q): q is Partial<Question> => Boolean(q));

    if (selected.length === 0) return;

    abortImportRef.current = false;
    setIsImporting(true);

    const BATCH_SIZE = Math.max(10, Math.min(250, batchSize));
    const chunks: Partial<Question>[][] = [];
    for (let i = 0; i < selected.length; i += BATCH_SIZE) {
      chunks.push(selected.slice(i, i + BATCH_SIZE));
    }

    const now = () => new Date().toLocaleTimeString();

    setProgressState({
      isOpen: true,
      total: selected.length,
      processed: 0,
      currentBatch: 0,
      totalBatches: chunks.length,
      successCount: 0,
      failCount: 0,
      isFinished: false,
      isCancelled: false,
      logs: [
        {
          id: 'log-start',
          time: now(),
          text: `Starting import of ${selected.length} questions across ${chunks.length} batches (${BATCH_SIZE} questions/batch)...`,
          type: 'info',
        },
      ],
    });

    let totalSuccess = 0;
    let totalFail = 0;
    let processed = 0;

    try {
      for (let i = 0; i < chunks.length; i++) {
        if (abortImportRef.current) {
          setProgressState((prev) => ({
            ...prev,
            isCancelled: true,
            isFinished: true,
            logs: [
              ...prev.logs,
              {
                id: `log-cancel-${Date.now()}`,
                time: now(),
                text: `🛑 Import cancelled by admin after batch ${i}. ${totalSuccess} questions preserved.`,
                type: 'warning',
              },
            ],
          }));
          break;
        }

        const chunk = chunks[i];
        const batchNum = i + 1;
        const startTime = Date.now();

        setProgressState((prev) => ({
          ...prev,
          currentBatch: batchNum,
          logs: [
            ...prev.logs,
            {
              id: `log-batch-start-${batchNum}`,
              time: now(),
              text: `Uploading Batch ${batchNum}/${chunks.length} (${chunk.length} questions)...`,
              type: 'info',
            },
          ],
        }));

        let result = await bulkCreateQuestions(chunk);

        // Auto retry once if network momentary glitch
        if (!result.success && !abortImportRef.current) {
          setProgressState((prev) => ({
            ...prev,
            logs: [
              ...prev.logs,
              {
                id: `log-retry-${batchNum}`,
                time: now(),
                text: `⚠️ Batch ${batchNum} encountered an issue. Retrying...`,
                type: 'warning',
              },
            ],
          }));
          await new Promise((r) => setTimeout(r, 1000));
          result = await bulkCreateQuestions(chunk);
        }

        const elapsed = Date.now() - startTime;
        processed += chunk.length;

        if (result.success) {
          const count = result.count || chunk.length;
          totalSuccess += count;
          setProgressState((prev) => ({
            ...prev,
            processed,
            successCount: totalSuccess,
            logs: [
              ...prev.logs,
              {
                id: `log-batch-success-${batchNum}`,
                time: now(),
                text: `✓ Batch ${batchNum}/${chunks.length} completed: ${count} questions uploaded (${elapsed}ms)`,
                type: 'success',
              },
            ],
          }));
        } else {
          totalFail += chunk.length;
          const errorMsg =
            result.errorDetails && result.errorDetails.length > 0
              ? result.errorDetails.join(', ')
              : `Batch failed with ${result.errors || chunk.length} errors`;
          setProgressState((prev) => ({
            ...prev,
            processed,
            failCount: totalFail,
            logs: [
              ...prev.logs,
              {
                id: `log-batch-fail-${batchNum}`,
                time: now(),
                text: `✕ Batch ${batchNum} failed (${chunk.length} items): ${errorMsg}`,
                type: 'error',
              },
            ],
          }));
        }

        // Yield to browser UI thread
        if (i < chunks.length - 1) {
          await new Promise((r) => setTimeout(r, 60));
        }
      }

      if (!abortImportRef.current) {
        setProgressState((prev) => ({
          ...prev,
          isFinished: true,
          logs: [
            ...prev.logs,
            {
              id: 'log-complete',
              time: now(),
              text: `🎉 Import Process Finished! Total: ${totalSuccess} succeeded, ${totalFail} failed.`,
              type: totalFail === 0 ? 'success' : 'warning',
            },
          ],
        }));
      }
    } catch (err) {
      setProgressState((prev) => ({
        ...prev,
        isFinished: true,
        logs: [
          ...prev.logs,
          {
            id: 'log-err',
            time: now(),
            text: `Critical exception: ${err instanceof Error ? err.message : 'Unknown exception'}`,
            type: 'error',
          },
        ],
      }));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Bulk Upload Questions
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Upload CSV, JSON, or XLSX files
            </p>
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
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

        {/* Dual Upload Area (Questions File + Cloudflare R2 Image Assets) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Card 1: Question Data File */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Questions File (CSV, Excel, JSON)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Upload your question spreadsheet with options, answers, and metadata.
              </p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-slate-400" />
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Parsing...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" /> Choose Data File
                  </>
                )}
              </label>
              {file ? (
                <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ {file.name} ({fileType})
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-slate-400">
                  Drag & drop .xlsx, .csv, or .json
                </p>
              )}
            </div>
          </div>

          {/* Card 2: Question Diagrams & Images (Cloudflare R2) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-600 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Question Diagrams (Cloudflare R2)
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 rounded-full">
                  Optional
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Upload image files referenced in your excel (e.g.{' '}
                <code className="text-slate-700 dark:text-slate-300 font-mono">
                  q1.png, fig2.jpg
                </code>
                ).
              </p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsImageDragOver(true);
              }}
              onDragLeave={() => setIsImageDragOver(false)}
              onDrop={handleImageDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                isImageDragOver
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              <ImageIcon className="w-8 h-8 mx-auto mb-3 text-cyan-500" />
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) =>
                  e.target.files && handleBulkImageUpload(e.target.files)
                }
                className="hidden"
                id="image-bulk-upload"
              />
              <label
                htmlFor="image-bulk-upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
              >
                {isUploadingImages ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading to
                    R2...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" /> Select Images to Upload
                  </>
                )}
              </label>

              {Object.keys(uploadedImagesMap).length > 0 ? (
                <p className="mt-3 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                  🎉 {Object.keys(uploadedImagesMap).length / 2} diagrams
                  uploaded to Cloudflare R2!
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-slate-400">
                  Drag & drop all diagram images together
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Validation Results */}
        {previewQuestions.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
              Validation Results
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <FileText className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {previewQuestions.length}
                  </p>
                  <p className="text-sm text-slate-600">Total</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {validCount}
                  </p>
                  <p className="text-sm text-slate-600">Valid</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {errorCount}
                  </p>
                  <p className="text-sm text-slate-600">Errors</p>
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
              <span className="text-sm text-slate-600 dark:text-slate-400">
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
                  className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 rounded"
                >
                  Select Valid
                </button>
                <button
                  onClick={() => setSelectedRows(new Set())}
                  className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 rounded"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] border border-slate-200 dark:border-slate-700 rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-700 z-10">
                  <tr>
                    <th className="p-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedRows.size === previewQuestions.length &&
                          previewQuestions.length > 0
                        }
                        onChange={(e) =>
                          setSelectedRows(
                            e.target.checked
                              ? new Set(previewQuestions.map((_, i) => i))
                              : new Set(),
                          )
                        }
                      />
                    </th>
                    <th className="p-3 text-left w-12">#</th>
                    <th className="p-3 text-left">Question (Live LaTeX Preview)</th>
                    <th className="p-3 text-left w-28">Subject</th>
                    <th className="p-3 text-left w-24">Status</th>
                    <th className="p-3 text-center w-16">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {previewQuestions.map((q, idx) => {
                    const hasError = validationErrors.some(
                      (e) => e.row === idx + 1,
                    );
                    const isExpanded = expandedRow === idx;
                    const options = q.options || [];
                    const correctIndices =
                      (q.correctAnswerIndices as number[]) || [0];

                    return (
                      <React.Fragment key={idx}>
                        <tr
                          className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition ${
                            hasError ? 'bg-red-50/60 dark:bg-red-900/10' : ''
                          }`}
                        >
                          <td className="p-3 align-top">
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
                          <td className="p-3 align-top text-slate-500 font-mono text-xs">
                            {idx + 1}
                          </td>
                          <td className="p-3 align-top max-w-xl">
                            <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-3">
                              <MathRenderer text={q.question || ''} />
                            </div>
                            {q.institutes && q.institutes.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {q.institutes.map((inst, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-900 dark:bg-cyan-950/80 dark:text-cyan-300"
                                  >
                                    {inst}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-3 align-top text-slate-600 dark:text-slate-400">
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                              {q.subject || '—'}
                            </span>
                          </td>
                          <td className="p-3 align-top">
                            {hasError ? (
                              <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded">
                                Error
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded">
                                Valid
                              </span>
                            )}
                          </td>
                          <td className="p-3 align-top text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedRow(isExpanded ? null : idx)
                              }
                              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                              title="Toggle full LaTeX question preview"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable full question card with LaTeX options & explanation */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                            <td colSpan={6} className="p-5">
                              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                <div className="space-y-2">
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                    Question Stem
                                  </span>
                                  <div className="text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <MathRenderer text={q.question || ''} />
                                  </div>
                                  {q.imageUrl && (
                                    <div className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg max-h-48 flex items-center justify-center">
                                      <img
                                        src={q.imageUrl}
                                        alt="Question Diagram"
                                        className="max-h-44 object-contain rounded"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                    Options (A, B, C, D)
                                  </span>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {options.map((opt, optIdx) => {
                                      const isCorrect =
                                        correctIndices.includes(optIdx);
                                      const labels = ['A', 'B', 'C', 'D'];
                                      const optImg = q.optionImages?.[optIdx];

                                      return (
                                        <div
                                          key={optIdx}
                                          className={`flex flex-col p-3 rounded-lg border ${
                                            isCorrect
                                              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850'
                                          }`}
                                        >
                                          <div className="flex items-start gap-2.5">
                                            <span
                                              className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                                                isCorrect
                                                  ? 'bg-emerald-600 text-white'
                                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                              }`}
                                            >
                                              {labels[optIdx] || optIdx + 1}
                                            </span>
                                            <div className="flex-1 text-sm pt-0.5">
                                              <MathRenderer text={opt || ''} />
                                            </div>
                                            {isCorrect && (
                                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 self-center">
                                                Correct
                                              </span>
                                            )}
                                          </div>
                                          {optImg && (
                                            <div className="mt-2 pl-8">
                                              <img
                                                src={optImg}
                                                alt={`Option ${labels[optIdx]}`}
                                                className="h-16 object-contain rounded border border-slate-200 dark:border-slate-700 bg-white p-1"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {(q.explanation || q.explanationImageUrl) && (
                                  <div className="space-y-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                      Explanation / Solution
                                    </span>
                                    {q.explanation && (
                                      <div className="text-sm bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 p-3 rounded-lg text-slate-800 dark:text-slate-200">
                                        <MathRenderer text={q.explanation} />
                                      </div>
                                    )}
                                    {q.explanationImageUrl && (
                                      <div className="p-2 border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10 rounded-lg max-h-48 flex items-center justify-center">
                                        <img
                                          src={q.explanationImageUrl}
                                          alt="Explanation Diagram"
                                          className="max-h-44 object-contain rounded"
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
                                  {q.chapter && <span>Chapter: <strong className="text-slate-700 dark:text-slate-300">{q.chapter}</strong></span>}
                                  {q.topic && <span>• Topic: <strong className="text-slate-700 dark:text-slate-300">{q.topic}</strong></span>}
                                  {q.difficulty && <span>• Difficulty: <strong className="text-slate-700 dark:text-slate-300">{q.difficulty}</strong></span>}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom Actions and Batch Size Config */}
        {previewQuestions.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600" /> Batch Size:
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-900">
                {[50, 100, 200].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setBatchSize(size)}
                    disabled={isImporting}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                      batchSize === size
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {size} / batch
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isImporting}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={selectedRows.size === 0 || isImporting}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition cursor-pointer disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Batches...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Import {selectedRows.size} Selected Questions
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── REAL-TIME CHUNKING & BATCH PROGRESS MODAL ── */}
        {progressState.isOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {progressState.isFinished ? (
                    progressState.failCount === 0 && !progressState.isCancelled ? (
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                    )
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {progressState.isFinished
                        ? progressState.isCancelled
                          ? 'Import Cancelled'
                          : progressState.failCount === 0
                            ? 'All Questions Successfully Imported!'
                            : 'Import Completed With Some Failures'
                        : 'Importing Questions in Batches...'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {progressState.isFinished
                        ? 'All selected batches have been processed and synced to Supabase.'
                        : `Processing Batch ${progressState.currentBatch} of ${progressState.totalBatches} (${batchSize} questions per batch)`}
                    </p>
                  </div>
                </div>

                {progressState.isFinished && (
                  <button
                    onClick={() =>
                      setProgressState((prev) => ({ ...prev, isOpen: false }))
                    }
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Progress & Stat Indicators */}
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Visual Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Overall Progress
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {progressState.total > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (progressState.processed / progressState.total) *
                                100,
                            ),
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300 relative shadow-sm"
                      style={{
                        width: `${
                          progressState.total > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (progressState.processed /
                                    progressState.total) *
                                    100,
                                ),
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* 4 Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Target Questions
                    </span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100 font-mono">
                      {progressState.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Processed
                    </span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
                      {progressState.processed.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
                      Succeeded
                    </span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {progressState.successCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 block">
                      Failed
                    </span>
                    <span className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
                      {progressState.failCount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Live Console Output Box */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-500" />
                      Live Sync Log
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {progressState.logs.length} events
                    </span>
                  </div>
                  <div
                    ref={logContainerRef}
                    className="bg-slate-950 text-slate-200 font-mono text-xs p-3.5 rounded-xl border border-slate-800 max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin"
                  >
                    {progressState.logs.map((log) => {
                      const colorMap = {
                        info: 'text-slate-300',
                        success: 'text-emerald-400 font-semibold',
                        warning: 'text-amber-300',
                        error: 'text-rose-400 font-semibold',
                      };
                      return (
                        <div key={log.id} className="flex items-start gap-2">
                          <span className="text-slate-600 select-none">
                            [{log.time}]
                          </span>
                          <span className={colorMap[log.type]}>{log.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                {!progressState.isFinished ? (
                  <>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                      Please do not close this window while batches are importing.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            'Are you sure you want to stop the remaining batches? Questions already uploaded will be kept in database.',
                          )
                        ) {
                          abortImportRef.current = true;
                        }
                      }}
                      className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 text-xs font-bold rounded-lg transition"
                    >
                      Cancel Import
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setProgressState((prev) => ({ ...prev, isOpen: false }))
                      }
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition"
                    >
                      Close Modal
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/admin/question-management')}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5"
                    >
                      Go to Question Management
                      <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
