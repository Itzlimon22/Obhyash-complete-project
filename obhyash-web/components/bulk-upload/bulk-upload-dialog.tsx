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
  ImageIcon,
} from 'lucide-react';

// Internal Utils & Types
import { QuestionFormData, QuestionOption } from '@/lib/types';
import { hscSubjects as allSubjectsData } from '@/lib/data/hsc'; // ✅ Keep your specific data import
import { reviewQuestionWithAI } from '@/ai/flows/review-question-flow';

// UI Components
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MathRenderer } from '@/components/common/MathRenderer';
import { QuestionFormDialog } from './question-form-dialog';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

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
  const [failedData, setFailedData] = useState<{ question: string; error: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAiReviewing, setIsAiReviewing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<{
    q: QuestionFormData;
    i: number;
  } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const { toast } = useToast();

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

  // ✅ HELPER: Smart Case-Insensitive Search
  const findValue = (row: Record<string, unknown>, possibleKeys: string[]): string => {
    const rowKeys = Object.keys(row);
    for (const target of possibleKeys) {
      const foundKey = rowKeys.find(
        (k) => k.toLowerCase().trim() === target.toLowerCase().trim(),
      );
      if (foundKey && row[foundKey]) {
        return row[foundKey]?.toString().trim() || '';
      }
    }
    return '';
  };

  const processParsedData = (rawData: Record<string, unknown>[]): QuestionFormData[] => {
    return rawData
      .map((row) => {
        // 1. MATCH IDs
        const matchedSubjectName = findValue(row, ['subject', 'Subject']) || '';
        const matchedChapterName = findValue(row, ['chapter', 'Chapter']) || '';

        // 2. PARSE OPTIONS (Updated for numeric/text variations)
        const optA = findValue(row, [
          'optionA',
          'Option A',
          'OptionA',
          'A',
          'a',
          'option1',
          'Option 1',
          '1',
        ]);
        const optB = findValue(row, [
          'optionB',
          'Option B',
          'OptionB',
          'B',
          'b',
          'option2',
          'Option 2',
          '2',
        ]);
        const optC = findValue(row, [
          'optionC',
          'Option C',
          'OptionC',
          'C',
          'c',
          'option3',
          'Option 3',
          '3',
        ]);
        const optD = findValue(row, [
          'optionD',
          'Option D',
          'OptionD',
          'D',
          'd',
          'option4',
          'Option 4',
          '4',
        ]);

        // 3. PARSE IMAGES FOR OPTIONS
        const imgA = findValue(row, ['optionA_image', 'Image A', 'Img A']);
        const imgB = findValue(row, ['optionB_image', 'Image B', 'Img B']);
        const imgC = findValue(row, ['optionC_image', 'Image C', 'Img C']);
        const imgD = findValue(row, ['optionD_image', 'Image D', 'Img D']);

        const options: QuestionOption[] = [
          { id: 'a', text: optA, image_url: imgA, isCorrect: false },
          { id: 'b', text: optB, image_url: imgB, isCorrect: false },
          { id: 'c', text: optC, image_url: imgC, isCorrect: false },
          { id: 'd', text: optD, image_url: imgD, isCorrect: false },
        ].map((opt) => ({
          ...opt,
          // Check correct answer against 'A', '1', 'Option A', and the actual text
          isCorrect:
            findValue(row, [
              'correctAnswer',
              'Correct Answer',
              'Answer',
              'ans',
            ]).toLowerCase() === opt.id ||
            findValue(row, [
              'correctAnswer',
              'Correct Answer',
              'Answer',
              'ans',
            ]) === opt.text,
        }));

        // 4. CONSTRUCT DATA
        return {
          subject_id: selectedSubject,
          chapter_id: selectedChapter,
          topic_id: selectedTopic || null,

          stream: findValue(row, ['stream', 'Stream']),
          section: findValue(row, ['section', 'Section']),
          subject: matchedSubjectName,
          chapter: matchedChapterName,
          topic: findValue(row, ['topic', 'Topic']),

          question: findValue(row, ['question', 'Question', 'q']),
          image_url: findValue(row, [
            'image',
            'image_url',
            'Question Image',
            'Img',
          ]),

          options: options,

          explanation: findValue(row, [
            'explanation',
            'Explanation',
            'Solution',
          ]),
          explanation_image_url: findValue(row, [
            'explanation_image',
            'Explanation Image',
          ]),

          difficulty: findValue(row, ['difficulty', 'Difficulty']) || 'Medium',
          examType: findValue(row, ['examType', 'Exam Type']),
          institute: findValue(row, ['institute', 'Institute']),
          year: findValue(row, ['year', 'Year']),

          status: 'Pending',
        } as QuestionFormData;
      })
      .filter((q) => q.question || q.image_url);
  };

  const handleAiReview = async () => {
    setIsAiReviewing(true);
    setAiProgress(0);
    const updated = [...parsedData];
    const errors: { question: string; error: string }[] = [];

    for (let i = 0; i < updated.length; i++) {
      try {
        const result = await reviewQuestionWithAI({ question: updated[i] });

        if (result.suggestedAnswer) {
          updated[i].options = updated[i].options.map((opt) => ({
            ...opt,
            isCorrect: opt.text.trim() === result.suggestedAnswer?.trim(),
          }));
          updated[i].explanation = result.formattedExplanation;
        }
      } catch (err: Error | unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push({ question: updated[i].question, error: errorMessage });
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
    setLogs(['🚀 Verifying admin session...']);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Session expired.');

      const userId = user.id;
      setLogs((prev) => [...prev, '✅ Session verified. Preparing payload...']);

      const finalPayload = parsedData.map((q) => ({
        stream: q.stream,
        section: q.section,
        subject: q.subject,
        chapter: q.chapter,
        topic: q.topic,
        subject_id: q.subject_id,
        chapter_id: q.chapter_id,
        topic_id: q.topic_id,
        question: q.question,
        image_url: q.image_url,
        options: q.options.map((o) => o.text), // Map to text[]
        option_images: q.options.map((o) => o.image_url || ''), // Map to text[]
        explanation: q.explanation,
        explanation_image_url: q.explanation_image_url, // ✅ Pass explanation image
        difficulty: q.difficulty,
        examType: q.examType,
        institute: q.institute,
        year: q.year,
        status: 'Pending',
        created_by: userId,
      }));

      const { error } = await supabase.from('questions').insert(finalPayload);
      if (error) throw error;

      setLogs((prev) => [...prev, '✅ Upload successful!']);
      toast({
        title: 'Success',
        description: `${parsedData.length} questions deployed.`,
      });

      onSuccess();
      setTimeout(onClose, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(err);
      setLogs((prev) => [...prev, `❌ Error: ${errorMessage}`]);
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file.name.endsWith('.json') || file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonRaw = JSON.parse(e.target?.result as string);
          const rawArray = Array.isArray(jsonRaw) ? jsonRaw : [jsonRaw];
          setParsedData(processParsedData(rawArray));
          setStep(2);
          toast({
            title: 'Success',
            description: `Loaded ${rawArray.length} questions`,
          });
        } catch (err) {
          toast({
            title: 'Error',
            description: 'Invalid JSON',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.getWorksheet(1);
      const raw: Array<Record<string, unknown>> = [];

      // ✅ Improved Excel Parsing: Get headers from Row 1 to use as keys
      const headers: string[] = [];
      worksheet?.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = cell.text;
      });

      worksheet?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        // Construct an object where keys are the headers from row 1
        const rowData: Record<string, unknown> = {};
        row.eachCell((cell, colNumber) => {
          if (headers[colNumber]) {
            rowData[headers[colNumber]] = cell.text; // map "Option A" -> value
          }
        });
        raw.push(rowData);
      });

      setParsedData(processParsedData(raw));
      setStep(2);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Could not parse Excel',
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-neutral-50">
          <div>
            <h2 className="text-xl font-bold text-neutral-800">
              Intelligent Bulk Upload
            </h2>
            <p className="text-xs text-neutral-500">
              Step {step}: {step === 1 ? 'Data Ingestion' : 'Review & Deploy'}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden bg-white">
          {step === 1 ? (
            <div
              {...getRootProps()}
              className="border-4 border-dashed h-full rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors border-neutral-200"
            >
              <input {...getInputProps()} />
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <Upload className="w-10 h-10 text-blue-600" />
              </div>
              <p className="font-semibold text-neutral-700">
                Click or drag Excel or JSON file here
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-4">
              {isAiReviewing && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-medium text-blue-700">
                      AI Fact-Checking...
                    </span>
                    <span>{Math.round(aiProgress)}%</span>
                  </div>
                  <Progress value={aiProgress} className="h-2" />
                </div>
              )}

              <div className="flex-1 border rounded-xl overflow-hidden shadow-sm overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-left font-semibold text-neutral-600">
                        Question Content
                      </th>
                      <th className="p-4 text-left font-semibold text-neutral-600">
                        Context
                      </th>
                      <th className="p-4 text-right font-semibold text-neutral-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedData.map((q, i) => (
                      <tr
                        key={i}
                        className="hover:bg-neutral-50 transition-colors"
                      >
                        <td className="p-4 max-w-md">
                          {/* ✅ PREVIEW FIX: Show Question Image */}
                          {q.image_url && (
                            <div className="mb-2 relative h-20 w-32 border rounded overflow-hidden">
                              <Image
                                src={q.image_url}
                                alt="Q"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          <div className="truncate font-medium text-neutral-800">
                            <MathRenderer text={q.question} />
                          </div>

                          {/* ✅ PREVIEW FIX: Show Options Info */}
                          <div className="flex gap-2 mt-2">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`text-[10px] px-2 py-1 rounded border ${opt.isCorrect ? 'bg-emerald-100 border-emerald-300 text-emerald-700 font-bold' : 'bg-neutral-50 text-neutral-500'}`}
                              >
                                {opt.id.toUpperCase()}
                                {opt.image_url && (
                                  <ImageIcon className="inline w-3 h-3 ml-1" />
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-medium bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                            {q.subject}
                          </span>
                          <div className="text-[10px] text-neutral-400 mt-1">
                            {q.chapter}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingQuestion({ q, i })}
                            className="text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setParsedData((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Logs */}
              <div className="h-24 bg-slate-900 text-emerald-400 p-3 font-mono text-[10px] rounded-lg overflow-auto shadow-inner border border-slate-800">
                {logs.length === 0
                  ? '> Initialized system... awaiting action'
                  : logs.map((l, i) => <div key={i}>{`> ${l}`}</div>)}
                {failedData.length > 0 && (
                  <div className="text-red-400">{`> Found ${failedData.length} issues.`}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center bg-slate-50">
          <div>
            {failedData.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadErrorLogs}
                className="text-red-600 border-red-200"
              >
                <Download className="mr-2 h-4 w-4" /> Error Log
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
