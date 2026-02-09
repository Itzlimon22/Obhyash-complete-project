import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  FileJson,
  FileText,
  Eye,
  Edit,
  Trash2,
  Save,
} from 'lucide-react';
import { Question } from '@/lib/types';
import { MathText } from './shared';

interface BulkUploadProps {
  onImport: (questions: Partial<Question>[]) => Promise<boolean>;
  onCancel: () => void;
}

interface ParseError {
  row: number;
  field: string;
  message: string;
}

// Simple QuestionPreview Component
const QuestionPreview: React.FC<{
  question: Partial<Question>;
  onClose: () => void;
}> = ({ question, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            প্রশ্ন প্রিভিউ
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase mb-2 block">
              প্রশ্ন
            </label>
            <div className="text-neutral-900 dark:text-white">
              <MathText text={question.question || ''} />
            </div>
          </div>

          {question.options && question.options.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase mb-2 block">
                অপশন
              </label>
              <div className="space-y-2">
                {question.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      i === question.correctAnswerIndex
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    <span className="font-mono text-xs mr-2">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <MathText text={opt} />
                    {i === question.correctAnswerIndex && (
                      <span className="ml-2 text-emerald-600 text-xs font-bold">
                        ✓ সঠিক
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {question.explanation && (
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase mb-2 block">
                ব্যাখ্যা
              </label>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-lg text-sm text-neutral-700 dark:text-neutral-300">
                <MathText text={question.explanation} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase block mb-1">
                বিষয়
              </label>
              <div className="text-neutral-900 dark:text-white">
                {question.subject || '-'}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase block mb-1">
                অধ্যায়
              </label>
              <div className="text-neutral-900 dark:text-white">
                {question.chapter || '-'}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase block mb-1">
                কঠিন্য
              </label>
              <div className="text-neutral-900 dark:text-white">
                {question.difficulty || '-'}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase block mb-1">
                স্ট্রিম
              </label>
              <div className="text-neutral-900 dark:text-white">
                {question.stream || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BulkUpload: React.FC<BulkUploadProps> = ({
  onImport,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [parsedData, setParsedData] = useState<Partial<Question>[]>([]);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(),
  );
  const [previewQuestion, setPreviewQuestion] =
    useState<Partial<Question> | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<Question> | null>(
    null,
  );

  // Parse CSV file
  const parseCSV = (text: string): Partial<Question>[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error(
        'CSV file must have at least a header row and one data row',
      );
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const questions: Partial<Question>[] = [];
    const parseErrors: ParseError[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const question: Partial<Question> = {
        type: 'MCQ',
        status: 'Pending',
        author: 'Bulk Upload',
        version: 1,
        tags: [],
        options: [],
      };

      let answerRef = '';

      headers.forEach((header, index) => {
        const value = values[index];
        const lowerHeader = header.toLowerCase();

        if (
          lowerHeader.includes('question') ||
          lowerHeader.includes('content')
        ) {
          question.question = value;
        } else if (lowerHeader === 'option1') {
          question.options![0] = value;
        } else if (lowerHeader === 'option2') {
          question.options![1] = value;
        } else if (lowerHeader === 'option3') {
          question.options![2] = value;
        } else if (lowerHeader === 'option4') {
          question.options![3] = value;
        } else if (lowerHeader === 'answer') {
          answerRef = value; // e.g., "option1", "option2"
        } else if (lowerHeader.includes('subject')) {
          question.subject = value;
        } else if (lowerHeader.includes('chapter')) {
          question.chapter = value;
        } else if (lowerHeader.includes('topic')) {
          question.topic = value;
        } else if (lowerHeader.includes('difficulty')) {
          question.difficulty = value as 'Easy' | 'Medium' | 'Hard';
        } else if (lowerHeader.includes('explanation')) {
          question.explanation = value;
        } else if (lowerHeader.includes('stream')) {
          question.stream = value;
        } else if (lowerHeader.includes('section')) {
          question.section = value;
        } else if (lowerHeader.includes('institute')) {
          question.institute = value;
        } else if (lowerHeader.includes('year')) {
          question.year = value;
        }
      });

      // Convert answer reference to actual answer and index
      if (answerRef) {
        const optionMatch = answerRef.match(/option(\d+)/i);
        if (optionMatch) {
          const optionIndex = parseInt(optionMatch[1]) - 1;
          if (question.options && question.options[optionIndex]) {
            question.correctAnswer = question.options[optionIndex];
            question.correctAnswerIndex = optionIndex;
          }
        }
      }

      // Validation
      if (!question.question) {
        parseErrors.push({
          row: i,
          field: 'question',
          message: 'Question text is required',
        });
      }
      if (!question.options || question.options.filter((o) => o).length < 2) {
        parseErrors.push({
          row: i,
          field: 'options',
          message: 'At least 2 options are required',
        });
      }
      if (!question.correctAnswer) {
        parseErrors.push({
          row: i,
          field: 'correctAnswer',
          message: 'Correct answer is required',
        });
      }
      if (!question.subject) {
        parseErrors.push({
          row: i,
          field: 'subject',
          message: 'Subject is required',
        });
      }

      // Filter out empty options
      question.options = question.options?.filter((o) => o) || [];

      questions.push(question);
    }

    setErrors(parseErrors);
    return questions;
  };

  // Parse JSON file
  const parseJSON = (text: string): Partial<Question>[] => {
    const data = JSON.parse(text);
    const questions = Array.isArray(data) ? data : [data];
    const parseErrors: ParseError[] = [];

    questions.forEach((q, i) => {
      // Build options array from option1, option2, option3, option4
      const options: string[] = [];
      if (q.option1) options.push(q.option1);
      if (q.option2) options.push(q.option2);
      if (q.option3) options.push(q.option3);
      if (q.option4) options.push(q.option4);

      q.options = options;

      // Convert answer reference (e.g., "option3") to actual answer and index
      if (q.answer) {
        const answerMatch = q.answer.match(/option(\d+)/i);
        if (answerMatch) {
          const optionIndex = parseInt(answerMatch[1]) - 1;
          if (options[optionIndex]) {
            q.correctAnswer = options[optionIndex];
            q.correctAnswerIndex = optionIndex;
          }
        }
      }

      if (!q.question && q.content) {
        q.question = q.content;
      }

      // Validation
      if (!q.question) {
        parseErrors.push({
          row: i,
          field: 'question',
          message: 'Question text is required',
        });
      }
      if (!options || options.length < 2) {
        parseErrors.push({
          row: i,
          field: 'options',
          message: 'At least 2 options are required',
        });
      }
      if (!q.correctAnswer) {
        parseErrors.push({
          row: i,
          field: 'correctAnswer',
          message:
            'Correct answer is required (provide answer field like "option1")',
        });
      }
      if (!q.subject) {
        parseErrors.push({
          row: i,
          field: 'subject',
          message: 'Subject is required',
        });
      }

      // Set defaults
      q.type = q.type || 'MCQ';
      q.status = q.status || 'Pending';
      q.author = q.author || 'Bulk Upload';
      q.difficulty = q.difficulty || 'Medium';
      q.tags = q.tags || [];
      q.version = 1;
    });

    setErrors(parseErrors);
    return questions;
  };

  // Handle file upload
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);
    setErrors([]);

    try {
      const text = await file.text();
      let parsed: Partial<Question>[] = [];

      if (file.name.endsWith('.csv')) {
        parsed = parseCSV(text);
      } else if (file.name.endsWith('.json')) {
        parsed = parseJSON(text);
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON.');
      }

      setParsedData(parsed);
      // Select all by default
      setSelectedIndices(new Set(parsed.map((_, i) => i)));
      setStep(2);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to parse file. Please check the format.',
      );
      setErrors([
        {
          row: 0,
          field: 'file',
          message:
            error instanceof Error ? error.message : 'Failed to parse file',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download template
  const downloadTemplate = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const csv = `stream,section,subject,chapter,topic,question,option1,option2,option3,option4,answer,explanation,difficulty
HSC,Science,রসায়ন ১ম পত্র,ল্যাবরেটরীর নিরাপদ ব্যবহার,1,কোন ধরনের পদার্থ চোখের বেশি ক্ষতি করে?,গ্যাসীয়,এসডিটিয়,ক্ষারীয়,লবণ,option3,রাসায়নিক ল্যাবরেটরিতে ক্ষারীয় পদার্থ চোখের মারাত্মক ক্ষতি করে,Medium
HSC,Science,রসায়ন ১ম পত্র,ল্যাবরেটরীর নিরাপদ ব্যবহার,1,ল্যাবরেটরিতে নিচের কোন কাজটি বেশি বিপজ্জনক?,নির্গত গ্যাসের গন্ধ নেওয়া,খাবার গ্রহণ,দ্রুত চলাচল,লেবেল ছাড়া বিকারক ব্যবহার,option1,নির্গত গ্যাসের প্রভাব অত্যন্ত মারাত্মক হতে পারে,Easy`;

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'question_template.csv';
      a.click();
    } else {
      const json = [
        {
          stream: 'HSC',
          section: 'Science',
          subject: 'রসায়ন ১ম পত্র',
          chapter: 'ল্যাবরেটরীর নিরাপদ ব্যবহার',
          topic: '1',
          question: 'কোন ধরনের পদার্থ চোখের বেশি ক্ষতি করে?',
          option1: 'গ্যাসীয়',
          option2: 'এসডিটিয়',
          option3: 'ক্ষারীয়',
          option4: 'লবণ',
          answer: 'option3',
          explanation:
            'রাসায়নিক ল্যাবরেটরিতে ক্ষারীয় ও বিভিন্ন ক্ষয়কারী রাসায়নিক দ্রব্য চোখের মারাত্মক ক্ষতি করে।',
          difficulty: 'Medium',
          examType: 'Medical, Varsity,Academic',
          institute: '',
          year: '',
        },
        {
          stream: 'HSC',
          section: 'Science',
          subject: 'রসায়ন ১ম পত্র',
          chapter: 'ল্যাবরেটরীর নিরাপদ ব্যবহার',
          topic: '1',
          question: 'ল্যাবরেটরিতে নিচের কোন কাজটি বেশি বিপজ্জনক?',
          option1: 'নির্গত গ্যাসের গন্ধ ও স্বাদ নেওয়া',
          option2: 'খাবার গ্রহণ',
          option3: 'দ্রুত চলাচল',
          option4: 'লেবেল ছাড়া বিকারক ব্যবহার',
          answer: 'option1',
          explanation:
            'ল্যাবরেটরিতে উৎপন্ন $CO_2$, $NH_3$, $NO_2$ প্রভৃতি ক্ষতিকর গ্যাসের প্রভাব অত্যন্ত মারাত্মক।',
          difficulty: 'Easy',
          examType: 'Medical, Varsity,Academic',
          institute: '',
          year: '',
        },
      ];

      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'question_template.json';
      a.click();
    }
  };

  // Selection helpers
  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedIndices(newSet);
  };

  const selectAll = () => {
    const allIndices = new Set(parsedData.map((_, i) => i));
    setSelectedIndices(allIndices);
  };

  const clearSelection = () => {
    setSelectedIndices(new Set());
  };

  // Edit helpers
  const handleEditQuestion = (index: number) => {
    setEditingIndex(index);
    setEditingData({ ...parsedData[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null && editingData) {
      const updated = [...parsedData];
      updated[editingIndex] = editingData;
      setParsedData(updated);
      setEditingIndex(null);
      setEditingData(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingData(null);
  };

  const removeQuestion = (index: number) => {
    const filtered = parsedData.filter((_, i) => i !== index);
    setParsedData(filtered);
    // Update selections
    const newSelection = new Set<number>();
    selectedIndices.forEach((i) => {
      if (i < index) newSelection.add(i);
      else if (i > index) newSelection.add(i - 1);
    });
    setSelectedIndices(newSelection);
  };

  const handleImport = async () => {
    // Get selected questions or all if none selected
    const questionsToImport =
      selectedIndices.size > 0
        ? parsedData.filter((_, i) => selectedIndices.has(i))
        : parsedData;

    if (questionsToImport.length === 0) {
      alert('কোন প্রশ্ন নির্বাচন করা হয়নি');
      return;
    }

    if (errors.length > 0) {
      const proceed = confirm(
        `There are ${errors.length} validation errors. Do you want to proceed anyway? Only valid questions will be imported.`,
      );
      if (!proceed) return;
    }

    // Filter out questions with errors
    const validQuestions = questionsToImport.filter((_, i) => {
      const originalIndex =
        selectedIndices.size > 0 ? Array.from(selectedIndices)[i] : i;
      return !errors.some((err) => err.row === originalIndex + 1);
    });

    const success = await onImport(validQuestions);
    if (success) {
      onCancel();
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-5xl mx-auto overflow-hidden animate-fade-in">
      {/* Preview Modal */}
      {previewQuestion && (
        <QuestionPreview
          question={previewQuestion}
          onClose={() => setPreviewQuestion(null)}
        />
      )}

      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 sticky top-0 z-20">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Upload className="text-rose-600" size={20} />
            বাল্ক আপলোড (Bulk Upload)
          </h2>
          <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">
            {step === 1
              ? 'ধাপ ১: ফাইল আপলোড করুন'
              : 'ধাপ ২: ডাটা চেক ও ইমপোর্ট'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 sm:p-8">
        {step === 1 ? (
          <div className="space-y-6 sm:space-y-8">
            {/* ডাউনলোড টেম্পলেট */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => downloadTemplate('csv')}
                className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-900/50 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-neutral-900 dark:text-white">
                    CSV টেম্পলেট
                  </span>
                  <span className="block text-[10px] text-neutral-500 truncate">
                    এক্সেল বা স্প্রেডশিটের জন্য
                  </span>
                </div>
                <Download
                  size={16}
                  className="text-neutral-400 group-hover:text-rose-500"
                />
              </button>

              <button
                onClick={() => downloadTemplate('json')}
                className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-900/50 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
                  <FileJson size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-neutral-900 dark:text-white">
                    JSON টেম্পলেট
                  </span>
                  <span className="block text-[10px] text-neutral-500 truncate">
                    ডেভেলপার বা পাইথন স্কিপ্টের জন্য
                  </span>
                </div>
                <Download
                  size={16}
                  className="text-neutral-400 group-hover:text-rose-500"
                />
              </button>
            </div>

            {/* আপলোড এরিয়া */}
            <label className="relative border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 sm:p-12 text-center transition-all hover:border-rose-500 bg-neutral-50/30 dark:bg-neutral-950/30 cursor-pointer block group">
              <input
                type="file"
                onChange={handleFile}
                className="hidden"
                accept=".csv,.json"
              />

              <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <Upload size={32} className="sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-base sm:text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  ফাইল সিলেক্ট অথবা ড্র্যাগ করুন
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 mb-6 sm:mb-8 max-w-xs mx-auto">
                  CSV অথবা JSON ফাইল সাপোর্ট করে। সর্বোচ্চ ৫MB পর্যন্ত।
                </p>
                <div className="px-6 sm:px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/25 transition-all outline-none">
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      পার্স করা হচ্ছে...
                    </div>
                  ) : (
                    'ফাইল আপলোড করুন'
                  )}
                </div>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            {/* রিভিউ সামারি ও ত্রুটি */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-bold text-neutral-900 dark:text-white">
                    {parsedData.length} টি প্রশ্ন পাওয়া গেছে
                  </div>
                  {errors.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                      <AlertCircle size={14} />
                      {errors.length} টি ত্রুটি আছে
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs font-bold text-rose-600 hover:underline px-2 py-1"
                  >
                    সব সিলেক্ট
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-xs font-medium text-neutral-500 hover:text-neutral-700 px-2 py-1"
                  >
                    মুছুন
                  </button>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="p-4 bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                  <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
                    <AlertCircle size={14} />
                    ভ্যালিডেশন ত্রুটিগুলো ঠিক করুন:
                  </h4>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                    {errors.map((err, i) => (
                      <div
                        key={i}
                        className="text-[10px] text-rose-600 flex items-start gap-2"
                      >
                        <span className="shrink-0 font-bold">
                          রো {err.row}:
                        </span>
                        <span>
                          {err.field} - {err.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ডাটা লিস্ট (রেসপনসিভ) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {parsedData.map((q, i) => {
                const isSelected = selectedIndices.has(i);
                const hasError = errors.some((err) => err.row === i + 1);

                return (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-rose-50/50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30'
                        : 'bg-white border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800'
                    } ${hasError ? 'ring-1 ring-amber-500/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(i)}
                        className="mt-1 rounded border-neutral-300 dark:border-neutral-700 text-rose-600 focus:ring-rose-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-neutral-400">
                            # {i + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setPreviewQuestion(q)}
                              className="p-1 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            >
                              PREVIEW
                            </button>
                            <button
                              onClick={() => handleEditQuestion(i)}
                              className="p-1 px-2 text-[10px] font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => removeQuestion(i)}
                              className="p-1 px-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors"
                            >
                              REMOVE
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200 line-clamp-2">
                          {q.question}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold uppercase">
                            {q.subject}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[150px]">
                            Ans: {q.correctAnswer}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 sm:p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0">
        {step === 2 && (
          <button
            onClick={() => setStep(1)}
            className="order-2 sm:order-1 px-6 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all w-full sm:w-auto"
          >
            পিছে যান
          </button>
        )}
        <button
          onClick={step === 1 ? onCancel : handleImport}
          disabled={isProcessing || (step === 2 && selectedIndices.size === 0)}
          className={`order-1 sm:order-2 px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto ${
            step === 1
              ? 'bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200'
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              ইমপোর্ট হচ্ছে...
            </>
          ) : step === 1 ? (
            'বাতিল করুন'
          ) : (
            <>
              <Save size={18} />
              ইমপোর্ট নিশ্চিত করুন ({selectedIndices.size})
            </>
          )}
        </button>
      </div>

      {/* Edit Modal (Inner Inline) */}
      {editingIndex !== null && editingData && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                প্রশ্ন তথ্য আপডেট করুন
              </h3>
              <button
                onClick={cancelEdit}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X size={20} className="text-neutral-500" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">
                  মূল প্রশ্ন (Question)
                </label>
                <textarea
                  value={editingData.question || ''}
                  onChange={(e) =>
                    setEditingData({ ...editingData, question: e.target.value })
                  }
                  className="w-full p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all text-sm leading-relaxed"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 uppercase mb-2 block">
                    বিষয়
                  </label>
                  <input
                    value={editingData.subject || ''}
                    onChange={(e) =>
                      setEditingData({
                        ...editingData,
                        subject: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 uppercase mb-2 block">
                    কঠিন্য
                  </label>
                  <select
                    value={editingData.difficulty || 'Medium'}
                    onChange={(e) =>
                      setEditingData({
                        ...editingData,
                        difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard',
                      })
                    }
                    className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase mb-2 block">
                  ব্যাখ্যা (Explanation)
                </label>
                <textarea
                  value={editingData.explanation || ''}
                  onChange={(e) =>
                    setEditingData({
                      ...editingData,
                      explanation: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm leading-relaxed"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-5 bg-neutral-50 dark:bg-neutral-950 flex gap-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={cancelEdit}
                className="flex-1 py-3 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 py-3 text-sm font-bold bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-95"
              >
                আপডেট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
