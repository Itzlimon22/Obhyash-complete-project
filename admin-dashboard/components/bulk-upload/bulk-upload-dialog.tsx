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
import {
  Subject,
  Chapter,
  QuestionFormData,
  QuestionOption,
  Topic,
} from '@/lib/types';

// ✅ CRITICAL: Import from the file that has the IDs
import { hscSubjects as allSubjectsData } from '@/lib/data/hsc';

// import { addQuestionsInBulk } from '@/ai/flows/manage-questions'; // <-- Not needed for direct upload
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

  // Inside bulk-upload-dialog.tsx

  const processParsedData = (rawData: any[]): QuestionFormData[] => {
    return rawData
      .map((row) => {
        // 1. MATCH IDs
        const matchedSubjectName =
          findClosestMatch(
            row.subject,
            allSubjectsData.map((s) => s.name),
          ) || row.subject;
        const subjectObj = allSubjectsData.find(
          (s) => s.name === matchedSubjectName,
        );

        const matchedChapterName =
          findClosestMatch(
            row.chapter,
            subjectObj?.chapters.map((c) => c.name) || [],
          ) || row.chapter;
        const chapterObj = subjectObj?.chapters.find(
          (c) => c.name === matchedChapterName,
        );

        const normalizedInputTopic = normalizeTopic(chapterObj, row.topic);
        const topicObj = chapterObj?.topics.find(
          (t) => t.name === normalizedInputTopic || t.name === row.topic,
        );

        // 2. TRANSFORM OPTIONS
        const rawAnswer = row.answer ? String(row.answer).trim() : '';

        const optionsArray: QuestionOption[] = [
          { id: 'A', text: String(row.option1 || ''), isCorrect: false },
          { id: 'B', text: String(row.option2 || ''), isCorrect: false },
          { id: 'C', text: String(row.option3 || ''), isCorrect: false },
          { id: 'D', text: String(row.option4 || ''), isCorrect: false },
        ]
          .filter((opt) => opt.text !== '')
          .map((opt) => ({
            ...opt,
            isCorrect: opt.text.trim() === rawAnswer, // ✅ Logic happens here
          }));

        // 3. RETURN OBJECT (No 'answer' field!)
        return {
          stream: row.stream || 'HSC',
          section: row.section || 'Science',
          subject: matchedSubjectName,
          chapter: matchedChapterName,
          topic: normalizedInputTopic,
          subject_id: subjectObj?.id || null,
          chapter_id: chapterObj?.id || null,
          topic_id: topicObj?.id || null,
          question: row.question || '',

          options: optionsArray, // ✅ Correct

          // ❌ REMOVED: answer: ... (This caused your error)

          explanation: row.explanation || '',
          difficulty:
            (row.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
          examType: row.examType ? String(row.examType).split(',') : [],
          institute: row.institute ? String(row.institute).split(',') : [],
          year:
            String(row.year || '')
              .match(/\d{4}/g)
              ?.map(Number) || [],
        };
      })
      .filter((q) => q.question && q.options.length >= 2);
  };

  const handleAiReview = async () => {
    setIsAiReviewing(true);
    setAiProgress(0);
    const updated = [...parsedData];
    const errors: any[] = [];

    // Inside your AI Review function or handler
    for (let i = 0; i < updated.length; i++) {
      try {
        const result = await reviewQuestionWithAI({ question: updated[i] });

        if (result.suggestedAnswer) {
          // ❌ OLD: updated[i].answer = result.suggestedAnswer;

          // ✅ NEW: Find the matching option and mark it correct
          updated[i].options = updated[i].options.map((opt) => ({
            ...opt,
            // If option text matches AI suggestion, set True, otherwise False
            isCorrect: opt.text.trim() === result.suggestedAnswer?.trim(),
          }));

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

    try {
      const finalPayload = parsedData.map((q) => ({
        // 1. Text Search Vector (Auto-generated by DB trigger usually, but we send raw text)
        question: q.question,
        explanation: q.explanation,

        // 2. The IDs
        subject_id: q.subject_id,
        chapter_id: q.chapter_id,
        topic_id: q.topic_id,

        // 3. The New JSON Options
        options_data: q.options, // ✅ Sending the array, not separate columns

        // 4. Metadata
        difficulty: q.difficulty,
        examType: q.examType,
        institute: q.institute,
        year: q.year,

        // Note: We do NOT send 'option1', 'answer', etc. anymore.
      }));

      const { error } = await supabase.from('questions').insert(finalPayload);
      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      // handle error...
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
                            {q.difficulty} •{' '}
                            <span className="text-emerald-400">
                              {q.options.find((opt) => opt.isCorrect)?.text ||
                                'No Answer'}
                            </span>
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
