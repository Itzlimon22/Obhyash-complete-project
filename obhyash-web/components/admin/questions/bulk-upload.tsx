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
          question.difficulty = value as any;
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
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg overflow-hidden animate-fade-in max-w-6xl mx-auto">
      {/* Preview Modal */}
      {previewQuestion && (
        <QuestionPreview
          question={previewQuestion}
          onClose={() => setPreviewQuestion(null)}
        />
      )}

      {/* Header */}
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Upload className="text-rose-600" size={24} />
          বাল্ক আপলোড (Bulk Upload)
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <X size={20} className="text-neutral-500" />
        </button>
      </div>

      {step === 1 ? (
        <div className="p-12">
          {/* Upload Area */}
          <div className="flex flex-col items-center justify-center text-center mb-8">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-6 text-rose-600 dark:text-rose-400">
              <FileSpreadsheet size={40} />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              CSV বা JSON ফাইল আপলোড করুন
            </h3>
            <p className="text-neutral-500 text-sm max-w-md mb-8">
              প্রশ্ন ইম্পোর্ট করতে আপনার CSV অথবা JSON ফাইল আপলোড করুন। সঠিক
              ফরম্যাট নিশ্চিত করতে টেমপ্লেট ডাউনলোড করুন।
            </p>
            <label className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-lg shadow-rose-500/20 transition-all active:scale-95 flex items-center gap-2 font-medium">
              {isProcessing && <Loader2 className="animate-spin" size={16} />}
              <input
                type="file"
                className="hidden"
                accept=".csv,.json"
                onChange={handleFile}
              />
              {isProcessing ? 'পার্স করা হচ্ছে...' : 'ফাইল সিলেক্ট করুন'}
            </label>
          </div>

          {/* Template Downloads */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 text-center">
              টেমপ্লেট ডাউনলোড করুন
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              <button
                onClick={() => downloadTemplate('csv')}
                className="flex items-center gap-3 p-4 border border-neutral-200 dark:border-neutral-800 rounded- hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <FileText
                    size={20}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">
                    CSV Template
                  </p>
                  <p className="text-xs text-neutral-500">
                    Excel & Spreadsheets
                  </p>
                </div>
                <Download size={16} className="text-neutral-400" />
              </button>

              <button
                onClick={() => downloadTemplate('json')}
                className="flex items-center gap-3 p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <FileJson
                    size={20}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">
                    JSON Template
                  </p>
                  <p className="text-xs text-neutral-500">Structured data</p>
                </div>
                <Download size={16} className="text-neutral-400" />
              </button>
            </div>
          </div>

          {/* Format Guide */}
          <div className="mt-8 bg-neutral-50 dark:bg-neutral-950 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">
              প্রয়োজনীয় ফিল্ড:
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                question (প্রশ্ন)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                option1-4 (অপশন - ন্যূনতম 2টি)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                answer (সঠিক উত্তর - "option1", "option2", etc.)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                subject (বিষয়)
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-[600px]">
          {/* Preview Header */}
          <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                  {parsedData.length} টি প্রশ্ন পাওয়া গেছে
                </span>
                <span className="text-xs text-neutral-500 ml-2">
                  ({fileName})
                </span>
                {selectedIndices.size > 0 && (
                  <span className="ml-3 px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs rounded-full font-medium">
                    {selectedIndices.size} টি নির্বাচিত
                  </span>
                )}
                {errors.length > 0 && (
                  <span className="ml-3 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full font-medium">
                    {errors.length} টি ত্রুটি
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setParsedData([]);
                    setErrors([]);
                    setSelectedIndices(new Set());
                  }}
                  className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  পেছনে যান
                </button>
                <button
                  onClick={handleImport}
                  disabled={selectedIndices.size === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={14} /> ইম্পোর্ট নিশ্চিত করুন (
                  {selectedIndices.size})
                </button>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                সব নির্বাচন করুন
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                নির্বাচন মুছে ফেলুন
              </button>
            </div>
          </div>

          {/* Errors List */}
          {errors.length > 0 && (
            <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-900/30">
              <div className="flex items-start gap-2">
                <AlertCircle
                  size={16}
                  className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                    ভ্যালিডেশন ত্রুটি পাওয়া গেছে
                  </p>
                  <div className="text-xs text-amber-700 dark:text-amber-400 space-y-0.5 max-h-20 overflow-y-auto">
                    {errors.slice(0, 5).map((err, i) => (
                      <div key={i}>
                        Row {err.row}: {err.field} - {err.message}
                      </div>
                    ))}
                    {errors.length > 5 && (
                      <div className="font-medium">
                        ...এবং আরও {errors.length - 5} টি ত্রুটি
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white dark:bg-neutral-900 z-10 shadow-sm">
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold uppercase text-neutral-500">
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIndices.size === parsedData.length}
                      onChange={() => {
                        if (selectedIndices.size === parsedData.length) {
                          clearSelection();
                        } else {
                          selectAll();
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">প্রশ্ন</th>
                  <th className="px-4 py-3">বিষয়</th>
                  <th className="px-4 py-3">কঠিন্য</th>
                  <th className="px-4 py-3">সঠিক উত্তর</th>
                  <th className="px-4 py-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                {parsedData.map((q, i) => {
                  const hasError = errors.some((err) => err.row === i + 1);
                  const isSelected = selectedIndices.has(i);
                  return (
                    <tr
                      key={i}
                      className={`hover:bg-neutral-50 dark:hover:bg-neutral-950/50 ${hasError ? 'bg-amber-50/50 dark:bg-amber-900/5' : ''} ${isSelected ? 'bg-rose-50/30 dark:bg-rose-900/10' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(i)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {hasError && (
                          <AlertCircle
                            size={12}
                            className="text-amber-600 inline mr-1"
                          />
                        )}
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 text-neutral-900 dark:text-neutral-200 max-w-md">
                        <div className="line-clamp-2">
                          <MathText text={q.question || ''} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                        {q.subject || '-'}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                        {q.difficulty || '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                        {q.correctAnswer || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewQuestion(q)}
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
                            title="প্রিভিউ"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleEditQuestion(i)}
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-amber-600 dark:text-amber-400"
                            title="এডিট"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('এই প্রশ্নটি মুছে ফেলবেন?')) {
                                removeQuestion(i);
                              }
                            }}
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-rose-600 dark:text-rose-400"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingIndex !== null && editingData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                প্রশ্ন এডিট করুন
              </h3>
              <button
                onClick={cancelEdit}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">
                  প্রশ্ন
                </label>
                <textarea
                  value={editingData.question || ''}
                  onChange={(e) =>
                    setEditingData({
                      ...editingData,
                      question: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">
                  অপশন
                </label>
                <div className="space-y-2">
                  {editingData.options?.map((opt, i) => (
                    <input
                      key={i}
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...(editingData.options || [])];
                        newOptions[i] = e.target.value;
                        setEditingData({ ...editingData, options: newOptions });
                      }}
                      className="w-full p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                      placeholder={`অপশন ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">
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
                    className="w-full p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">
                    কঠিন্য
                  </label>
                  <select
                    value={editingData.difficulty || 'Medium'}
                    onChange={(e) =>
                      setEditingData({
                        ...editingData,
                        difficulty: e.target.value as any,
                      })
                    }
                    className="w-full p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">
                  ব্যাখ্যা
                </label>
                <textarea
                  value={editingData.explanation || ''}
                  onChange={(e) =>
                    setEditingData({
                      ...editingData,
                      explanation: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium"
                >
                  <Save size={14} /> সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
