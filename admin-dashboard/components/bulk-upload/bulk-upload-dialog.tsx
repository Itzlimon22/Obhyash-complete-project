'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';
import {
  Upload,
  X,
  CheckCircle,
  Loader2,
  Edit,
  Trash2,
  Wand2,
  Download,
  AlertCircle,
} from 'lucide-react';

// Internal Utils & Types
import { findClosestMatch } from '@/lib/utils/fuzzy-match';
import { normalizeTopic, normalizeAnswer } from '@/lib/utils/normalization';
import { Subject, Chapter, QuestionFormData } from '@/lib/types';
import { subjects as allSubjectsData } from '@/lib/data';
import { addQuestionsInBulk } from '@/ai/flows/manage-questions';
import { reviewQuestionWithAI } from '@/ai/flows/review-question-flow';

// UI Components
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MathRenderer } from '@/components/math-renderer';
import { QuestionFormDialog } from './question-form-dialog';
import { useToast } from '@/hooks/use-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function BulkUploadDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [parsedData, setParsedData] = useState<QuestionFormData[]>([]);
  const [failedData, setFailedData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAiReviewing, setIsAiReviewing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<{
    q: QuestionFormData;
    i: number;
  } | null>(null);

  const { toast } = useToast();

  // Helper to download logs
  const downloadErrorLogs = () => {
    const blob = new Blob([JSON.stringify(failedData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `upload_errors_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const processParsedData = (rawData: any[]): QuestionFormData[] => {
    return rawData
      .map((row): QuestionFormData => {
        const options = [
          String(row.option1 || ''),
          String(row.option2 || ''),
          String(row.option3 || ''),
          String(row.option4 || ''),
        ].filter(Boolean);

        const correctedSubject =
          findClosestMatch(
            row.subject,
            allSubjectsData.map((s: Subject) => s.name),
          ) || row.subject;
        const subjectData = allSubjectsData.find(
          (s: Subject) => s.name === correctedSubject,
        );
        const correctedChapter =
          findClosestMatch(
            row.chapter,
            subjectData?.chapters.map((c: Chapter) => c.name) || [],
          ) || row.chapter;
        const chapterData = subjectData?.chapters.find(
          (c: Chapter) => c.name === correctedChapter,
        );

        return {
          stream: row.stream || 'HSC',
          section: row.section || 'Science',
          subject: correctedSubject,
          chapter: correctedChapter,
          topic: normalizeTopic(chapterData, row.topic),
          question: row.question || '',
          options: options,
          // If answer is passed as text (from JSON pre-processing) use it, otherwise normalize
          answer: row.answer || normalizeAnswer(row, options),
          explanation: row.explanation || '',
          difficulty:
            (row.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
          examType:
            typeof row.examType === 'string'
              ? row.examType.split(',')
              : row.examType || [],
          institute:
            typeof row.institute === 'string'
              ? row.institute.split(',')
              : row.institute || [],
          year:
            String(row.year || '')
              .match(/\d{4}/g)
              ?.map(Number) || [],
        };
      })
      .filter((q) => q.question && q.subject && q.options.length === 4);
  };

  const handleAiReview = async () => {
    setIsAiReviewing(true);
    setAiProgress(0);
    const updated = [...parsedData];
    const errors: any[] = [];

    for (let i = 0; i < updated.length; i++) {
      try {
        const result = await reviewQuestionWithAI({ question: updated[i] });
        if (result.suggestedAnswer) {
          updated[i].answer = result.suggestedAnswer;
          updated[i].explanation = result.formattedExplanation;
        }
      } catch (err: any) {
        errors.push({ question: updated[i].question, error: err.message });
      }
      setAiProgress(((i + 1) / updated.length) * 100);
    }

    setParsedData(updated);
    if (errors.length > 0) setFailedData((prev) => [...prev, ...errors]);
    setIsAiReviewing(false);
    toast({
      title: 'AI Review Complete',
      description: 'Questions have been analyzed and updated.',
    });
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;
    setUploading(true);
    setLogs(['🚀 Starting batch upload...']);

    const BATCH_SIZE = 100;
    let totalAdded = 0;
    const uploadFailures: any[] = [];

    try {
      for (let i = 0; i < parsedData.length; i += BATCH_SIZE) {
        const batch = parsedData.slice(i, i + BATCH_SIZE);
        try {
          const result = await addQuestionsInBulk({
            questions: batch,
            userId: 'user_id_here', // Replace with dynamic Auth ID
          });
          if (result.success) totalAdded += result.count;
        } catch (err: any) {
          uploadFailures.push({
            batch: i / BATCH_SIZE,
            error: err.message,
            data: batch,
          });
        }
      }

      setFailedData((prev) => [...prev, ...uploadFailures]);

      toast({
        title: totalAdded > 0 ? 'Success' : 'Upload Failed',
        description: `${totalAdded} questions deployed. ${uploadFailures.length} batches failed.`,
      });

      if (totalAdded > 0) {
        onSuccess();
        setTimeout(onClose, 2000);
      }
    } catch (err: any) {
      setLogs((prev) => [...prev, `❌ Critical Error: ${err.message}`]);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    // 🟢 HANDLE JSON FILES
    if (file.name.endsWith('.json') || file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonRaw = JSON.parse(e.target?.result as string);
          // Ensure it's an array
          const rawArray = Array.isArray(jsonRaw) ? jsonRaw : [jsonRaw];

          // Map your specific JSON format to expected format
          // Specifically converts "answer": "option3" -> "Actual Answer Text"
          const normalizedRaw = rawArray.map((item: any) => {
            let realAnswer = item.answer;
            if (item.answer === 'option1') realAnswer = item.option1;
            else if (item.answer === 'option2') realAnswer = item.option2;
            else if (item.answer === 'option3') realAnswer = item.option3;
            else if (item.answer === 'option4') realAnswer = item.option4;

            return {
              ...item,
              answer: realAnswer,
              year: item.year, // Pass year as-is for processing by processParsedData
            };
          });

          setParsedData(processParsedData(normalizedRaw));
          setStep(2);
          toast({
            title: 'Success',
            description: `Loaded ${rawArray.length} questions from JSON`,
          });
        } catch (err) {
          console.error(err);
          toast({
            title: 'Error',
            description: 'Invalid JSON format',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
      return;
    }

    // 🟢 HANDLE EXCEL FILES
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.getWorksheet(1);
      let raw: any[] = [];
      worksheet?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const v = Array.isArray(row.values) ? row.values.slice(1) : [];
        raw.push({
          stream: v[0],
          section: v[1],
          subject: v[2],
          chapter: v[3],
          topic: v[4],
          question: v[5],
          option1: v[6],
          option2: v[7],
          option3: v[8],
          option4: v[9],
          answer: v[10],
          explanation: v[11],
          difficulty: v[12],
          examType: v[13],
          institute: v[14],
          year: v[15],
        });
      });
      setParsedData(processParsedData(raw));
      setStep(2);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Could not parse Excel file',
        variant: 'destructive',
      });
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'application/json': ['.json'],
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Intelligent Bulk Upload
            </h2>
            <p className="text-xs text-slate-500">
              Step {step}: {step === 1 ? 'Data Ingestion' : 'Review & Deploy'}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 p-6 overflow-hidden bg-white">
          {step === 1 ? (
            <div
              {...getRootProps()}
              className="border-4 border-dashed h-full rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors border-slate-200"
            >
              <input {...getInputProps()} />
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <Upload className="w-10 h-10 text-blue-600" />
              </div>
              <p className="font-semibold text-slate-700">
                Click or drag Excel or JSON file here
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Supports standard 16-column Excel or JSON format
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-4">
              {isAiReviewing && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-medium text-blue-700">
                      Gemini AI Fact-Checking...
                    </span>
                    <span>{Math.round(aiProgress)}%</span>
                  </div>
                  <Progress value={aiProgress} className="h-2" />
                </div>
              )}

              <div className="flex-1 border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-left font-semibold text-slate-600">
                        Question Content
                      </th>
                      <th className="p-4 text-left font-semibold text-slate-600">
                        Subject/Chapter
                      </th>
                      <th className="p-4 text-right font-semibold text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedData.map((q, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-4 max-w-md">
                          <div className="truncate font-medium text-slate-800">
                            <MathRenderer text={q.question} />
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                            {q.difficulty} • {q.answer}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {q.subject}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {q.chapter}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingQuestion({ q, i })}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() =>
                              setParsedData((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="h-24 bg-slate-900 text-emerald-400 p-3 font-mono text-[10px] rounded-lg overflow-auto shadow-inner border border-slate-800">
                {logs.length === 0
                  ? '> Initialized system... awaiting action'
                  : logs.map((l, i) => <div key={i}>{`> ${l}`}</div>)}
                {failedData.length > 0 && (
                  <div className="text-red-400">{`> Found ${failedData.length} issues during processing.`}</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-between items-center bg-slate-50">
          <div>
            {failedData.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadErrorLogs}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Download className="mr-2 h-4 w-4" /> Download Error Log (
                {failedData.length})
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            {step === 2 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleAiReview}
                  disabled={isAiReviewing || uploading}
                >
                  <Wand2 className="mr-2 h-4 w-4 text-purple-600" /> AI Review
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || isAiReviewing}
                  className="bg-blue-600 hover:bg-blue-700 shadow-md"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Deploy {parsedData.length} Questions
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <QuestionFormDialog
        isOpen={!!editingQuestion}
        onOpenChange={(open) => !open && setEditingQuestion(null)}
        question={editingQuestion?.q}
        onSubmit={async (updated) => {
          const newData = [...parsedData];
          newData[editingQuestion!.i] = updated;
          setParsedData(newData);
          return true;
        }}
      />
    </div>
  );
}
// FORCE UPDATE: V1.1
