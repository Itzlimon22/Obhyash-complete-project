import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  ChevronLeft,
  CheckSquare,
  Square,
  FileUp,
  ImageIcon,
} from 'lucide-react';
import { Question } from '@/lib/types';
import { MathText } from './shared';
import { MathRenderer } from '@/components/common/MathRenderer';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { generateQuestionFingerprintSync } from '@/lib/crypto-utils';
import { resolveAcademicIds } from '@/lib/data/academic-resolver';
import {
  getHscSubjectList,
  getHscChapterList,
  getHscTopicList,
  resolveSubjectName,
  resolveChapterName,
  resolveTopicName,
} from '@/lib/data/hsc-helpers';
import {
  checkDuplicateQuestions,
  getBulkUploadJobStatus,
  BulkUploadJob,
} from '@/services/question-service';
import { standardizeInstituteName } from '@/lib/data/institute-helpers';
import { validateLatex } from '@/lib/latex-utils';

// ─── Types ───────────────────────────────────────────────────────────
interface BulkUploadProps {
  onImport: (questions: Partial<Question>[]) => Promise<boolean>;
  onCancel: () => void;
  importProgress?: {
    total: number;
    completed: number;
    failed: number;
    failedRows: number[];
    isImporting: boolean;
  };
}

interface ParseError {
  row: number;
  field: string;
  message: string;
}

// ─── JSON Error Helper ───────────────────────────────────────────────
function getHelpfulJsonError(rawText: string, error: any): string {
  const baseMessage = error instanceof Error ? error.message : String(error);
  let helpfulMessage = baseMessage;

  const posMatch = baseMessage.match(/position (\d+)/);
  if (posMatch) {
    const pos = parseInt(posMatch[1]);
    const snippet = rawText.substring(
      Math.max(0, pos - 30),
      Math.min(rawText.length, pos + 30),
    );
    helpfulMessage += `\nসমস্যাটি এই অংশের আশেপাশে:\n"...${snippet}..."`;

    if (snippet.includes(',}') || snippet.includes(']')) {
      helpfulMessage += '\nটিপস: ব্র্যাকেটের আগে অতিরিক্ত কমা (,) থাকতে পারে।';
    } else if (snippet.includes("'")) {
      helpfulMessage +=
        '\nটিপস: JSON এর প্রপার্টি এবং ভ্যালু ডাবল কোট (") দিয়ে লিখতে হয়, সিঙ্গেল কোট (\') নয়।';
    }
  } else if (baseMessage.includes('Unexpected end')) {
    helpfulMessage +=
      '\nটিপস: শেষে কোনো ব্র্যাকেট } বা ] বন্ধ করতে ভুলে গেছেন হতে পারে।';
  }

  return helpfulMessage;
}

// ─── Unified Data Normalizer ─────────────────────────────────────────
// Converts flat format (option1, option2, answer:"option3") into
// the Question schema the database expects.
function normalizeRawRow(
  raw: Record<string, string>,
  rowIndex: number,
  parseErrors: ParseError[],
): Partial<Question> {
  // Helper: get value by trying multiple key variants (original, lowercase, snake_case)
  const get = (...keys: string[]): string => {
    for (const k of keys) {
      if (raw[k] !== undefined && raw[k] !== '') return String(raw[k]).trim();
      const lower = k.toLowerCase();
      if (raw[lower] !== undefined && raw[lower] !== '')
        return String(raw[lower]).trim();
    }
    return '';
  };

  const q: Partial<Question> = {
    type: 'MCQ',
    status: 'Pending',
    author: 'Bulk Upload',
    version: 1,
    tags: [],
  };

  // Map flat fields
  q.question = get('question', 'content');
  q.subject = get('subject');
  q.chapter = get('chapter');
  q.topic = get('topic');
  q.stream = get('stream');
  // Mapped 'section' from file to 'division' in DB as per requirement
  q.division = get('division', 'section');
  q.section = get('section');
  q.explanation = get('explanation');
  q.difficulty = (get('difficulty') || 'Medium')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(',') as 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  q.examType = (get('examType', 'examtype', 'exam_type') || 'Academic')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(',');

  // Image URLs from parsed data
  q.imageUrl = get('imageUrl', 'imageurl', 'image_url') || undefined;
  q.explanationImageUrl =
    get(
      'explanationImageUrl',
      'explanationimageurl',
      'explanation_image_url',
    ) || undefined;

  // Institutes & Years (comma separated)
  const instituteVal = get('institute', 'institutes');
  if (instituteVal) {
    q.institutes = instituteVal
      .split(',')
      .map((s) => standardizeInstituteName(s))
      .filter(Boolean);
    q.institute = q.institutes[0] || '';
  }
  const yearVal = get('year', 'years');
  if (yearVal) {
    q.years = yearVal
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
    q.year = q.years[0]?.toString() || '';
  }

  // Build options array from option1..option6
  const options: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const opt = get(`option${i}`);
    if (opt && opt.trim()) options.push(opt.trim());
  }
  // Fallback: if no option1..N, try options array directly
  const optionsRaw = get('options');
  if (options.length === 0 && optionsRaw) {
    try {
      const parsed = JSON.parse(optionsRaw);
      if (Array.isArray(parsed)) options.push(...parsed);
    } catch {
      /* ignore */
    }
  }
  q.options = options;

  // Resolve correct answer
  const answerRef = get(
    'answer',
    'correctAnswer',
    'correctanswer',
    'correct_answer',
  );
  if (answerRef) {
    // Try "option3" style
    const optionMatch = answerRef.match(/^option(\d+)$/i);
    if (optionMatch) {
      const idx = parseInt(optionMatch[1]) - 1;
      if (options[idx]) {
        q.correctAnswerIndex = idx;
        q.correctAnswer = options[idx];
        q.correctAnswerIndices = [idx];
      }
    }
    // Try letter style "A", "B", "C", "D"
    else if (/^[A-Fa-f]$/.test(answerRef)) {
      const idx = answerRef.toUpperCase().charCodeAt(0) - 65;
      if (options[idx]) {
        q.correctAnswerIndex = idx;
        q.correctAnswer = options[idx];
        q.correctAnswerIndices = [idx];
      }
    }
    // Try numeric index "1", "2", "3", "4" -> maps to 0, 1, 2, 3
    else if (/^\d+$/.test(answerRef)) {
      const parsedNum = parseInt(answerRef);
      // Assuming 1-based input (e.g. 1=A, 4=D). If the user means 0-based, it could conflict.
      // But typically, a user inputs 1 for Option 1.
      const idx = parsedNum > 0 ? parsedNum - 1 : 0;
      if (options[idx]) {
        q.correctAnswerIndex = idx;
        q.correctAnswer = options[idx];
        q.correctAnswerIndices = [idx];
      }
    }
    // Try matching by text
    else {
      const idx = options.findIndex(
        (o) => o.toLowerCase() === answerRef.toLowerCase(),
      );
      if (idx !== -1) {
        q.correctAnswerIndex = idx;
        q.correctAnswer = options[idx];
        q.correctAnswerIndices = [idx];
      }
    }
  }

  // Validation
  if (!q.question) {
    parseErrors.push({
      row: rowIndex + 1,
      field: 'question',
      message: 'প্রশ্নের টেক্সট আবশ্যক',
    });
  }
  if (options.length < 2) {
    parseErrors.push({
      row: rowIndex + 1,
      field: 'options',
      message: 'কমপক্ষে ২টি অপশন আবশ্যক',
    });
  }
  if (q.correctAnswerIndex === undefined) {
    parseErrors.push({
      row: rowIndex + 1,
      field: 'answer',
      message: 'সঠিক উত্তর নির্ধারণ করা যায়নি',
    });
  }
  if (!q.subject) {
    parseErrors.push({
      row: rowIndex + 1,
      field: 'subject',
      message: 'বিষয় আবশ্যক',
    });
  }

  // LaTeX Validation
  const fieldsToValidate = [
    { name: 'প্রশ্ন', value: q.question },
    { name: 'ব্যাখ্যা', value: q.explanation },
    ...options.map((opt, i) => ({
      name: `অপশন ${String.fromCharCode(65 + i)}`,
      value: opt,
    })),
  ];

  fieldsToValidate.forEach((field) => {
    if (field.value) {
      const validation = validateLatex(field.value);
      if (!validation.isValid) {
        parseErrors.push({
          row: rowIndex + 1,
          field: field.name,
          message: validation.error || 'LaTeX সিনট্যাক্স ভুল',
        });
      }
    }
  });

  // --- Relational Taxonomy Resolution ---
  // Note: This is an async operation, but normalization is usually sync.
  // We will do a "best effort" or mark for later resolution if needed.
  // For now, let's keep it simple and resolve during the IMPORT phase primarily,
  // or provide a "Resolve IDs" button in the UI.

  return q;
}

// ─── Question Preview Modal ──────────────────────────────────────────
const QuestionPreview: React.FC<{
  question: Partial<Question>;
  onClose: () => void;
}> = ({ question: q, onClose }) => (
  <Dialog
    open={true}
    onOpenChange={(open) => {
      if (!open) onClose();
    }}
  >
    <DialogContent
      className="sm:max-w-2xl p-0 overflow-hidden flex flex-col"
      showCloseButton={false}
    >
      <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900 z-10 shrink-0">
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
      <div className="p-6 space-y-5">
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">
            প্রশ্ন
          </label>
          <div className="text-neutral-900 dark:text-white text-[15px] leading-relaxed">
            <MathRenderer text={q.question || ''} />
          </div>
        </div>

        {q.options && q.options.length > 0 && (
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">
              অপশনসমূহ
            </label>
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-sm flex items-start gap-2 ${
                    i === q.correctAnswerIndex
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <span className="font-mono text-xs font-bold mt-0.5 shrink-0 w-5">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <MathRenderer text={opt} />
                  {i === q.correctAnswerIndex && (
                    <CheckCircle2
                      size={16}
                      className="ml-auto shrink-0 text-emerald-600"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {q.explanation && (
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">
              ব্যাখ্যা
            </label>
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <MathRenderer text={q.explanation} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {[
            { label: 'বিষয়', value: q.subject },
            { label: 'অধ্যায়', value: q.chapter },
            { label: 'টপিক', value: q.topic },
            { label: 'কঠিন্য', value: q.difficulty },
            { label: 'স্ট্রিম', value: q.stream },
            { label: 'পরীক্ষার ধরন', value: q.examType },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl"
            >
              <span className="text-[9px] font-bold text-neutral-400 uppercase block mb-0.5">
                {item.label}
              </span>
              <span className="text-sm font-medium text-neutral-800 dark:text-white truncate block">
                {item.value || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

// ─── Edit Modal ──────────────────────────────────────────────────────
const EditModal: React.FC<{
  data: Partial<Question>;
  onChange: (d: Partial<Question>) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ data, onChange, onSave, onCancel }) => {
  // ── Normalize synchronously in useState initializer so dropdowns
  //    are populated on the very first render (no useEffect delay). ──
  const [localData, setLocalData] = React.useState<Partial<Question>>(() => {
    const subject =
      resolveSubjectName(data.subject || '') ?? data.subject ?? '';
    const chapter = subject
      ? (resolveChapterName(subject, data.chapter || '') ?? data.chapter ?? '')
      : (data.chapter ?? '');
    const topic = chapter
      ? (resolveTopicName(chapter, data.topic || '') ?? data.topic ?? '')
      : (data.topic ?? '');
    return { ...data, subject, chapter, topic };
  });

  // Sync local changes back to parent so Save works correctly.
  const update = (patch: Partial<Question>) => {
    const next = { ...localData, ...patch };
    setLocalData(next);
    onChange(next);
  };

  const updateOption = (idx: number, val: string) => {
    const opts = [...(localData.options || [])];
    opts[idx] = val;
    update({ options: opts });
  };

  const availableSubjects = React.useMemo(() => getHscSubjectList(), []);
  const availableChapters = React.useMemo(
    () => (localData.subject ? getHscChapterList(localData.subject) : []),
    [localData.subject],
  );
  const availableTopics = React.useMemo(
    () => (localData.chapter ? getHscTopicList(localData.chapter) : []),
    [localData.chapter],
  );

  const fieldCls =
    'w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all';
  const labelCls =
    'text-[10px] font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1 block';

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent
        className="sm:max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80 sticky top-0 z-10 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
              প্রশ্ন সম্পাদনা
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              সঠিক তথ্য পূরণ করে সংরক্ষণ করুন
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-neutral-500 transition-colors active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* Section: Taxonomy */}
          <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <p className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-500 uppercase tracking-widest mb-3">
              বিষয় বিন্যাস
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Subject */}
              <div>
                <label className={labelCls}>বিষয়</label>
                <select
                  value={localData.subject || ''}
                  onChange={(e) =>
                    update({
                      subject: e.target.value,
                      chapter: '',
                      topic: '',
                    })
                  }
                  className={fieldCls}
                >
                  <option value="">নির্বাচন করো</option>
                  {availableSubjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter */}
              <div>
                <label className={labelCls}>অধ্যায়</label>
                <select
                  value={localData.chapter || ''}
                  onChange={(e) =>
                    update({ chapter: e.target.value, topic: '' })
                  }
                  disabled={!localData.subject}
                  className={`${fieldCls} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">নির্বাচন করুন</option>
                  {availableChapters.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className={labelCls}>টপিক</label>
                <select
                  value={localData.topic || ''}
                  onChange={(e) => update({ topic: e.target.value })}
                  disabled={!localData.chapter}
                  className={`${fieldCls} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">নির্বাচন করুন</option>
                  {availableTopics.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className={labelCls}>কাঠিন্য</label>
                <select
                  value={localData.difficulty || 'Medium'}
                  onChange={(e) =>
                    update({
                      difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard',
                    })
                  }
                  className={fieldCls}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Extra Metadata */}
          <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <p className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest mb-3">
              অতিরিক্ত তথ্য
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>স্ট্রিম</label>
                <input
                  value={localData.stream || ''}
                  onChange={(e) => update({ stream: e.target.value })}
                  placeholder="e.g. HSC"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>বিভাগ</label>
                <input
                  value={localData.section || localData.division || ''}
                  onChange={(e) => update({ section: e.target.value })}
                  placeholder="e.g. Science"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>পরীক্ষার ধরন</label>
                <input
                  value={localData.examType || ''}
                  onChange={(e) => update({ examType: e.target.value })}
                  placeholder="Medical,Varsity"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>বছর</label>
                <input
                  value={localData.year || ''}
                  onChange={(e) => update({ year: e.target.value })}
                  placeholder="e.g. 2023"
                  className={fieldCls}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>প্রতিষ্ঠান</label>
                <input
                  value={
                    localData.institute || localData.institutes?.join(',') || ''
                  }
                  onChange={(e) => update({ institute: e.target.value })}
                  placeholder="e.g. Buet,Ruet,DMC"
                  className={fieldCls}
                />
              </div>
            </div>
          </div>

          {/* Section: Content */}
          <div className="px-5 py-5 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              {/* Question */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-neutral-800 dark:text-white">
                    প্রশ্ন
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-100 dark:border-emerald-800">
                    LaTeX: $...$
                  </span>
                </div>
                <textarea
                  value={localData.question || ''}
                  onChange={(e) => update({ question: e.target.value })}
                  className={`${fieldCls} resize-none ${localData.question && !validateLatex(localData.question).isValid ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                  rows={4}
                  placeholder="প্রশ্নের বিবরণ লেখো..."
                />
                {!validateLatex(localData.question || '').isValid && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    ⚠ {validateLatex(localData.question || '').error}
                  </p>
                )}
                {localData.question && (
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-xl">
                    <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1 block">
                      প্রিভিউ
                    </span>
                    <MathRenderer text={localData.question} />
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                    প্রশ্নের ছবি (ঐচ্ছিক)
                  </label>
                  <ImageUploader
                    folder="questions"
                    compact
                    defaultValue={localData.imageUrl}
                    onUploadComplete={(url) => update({ imageUrl: url })}
                  />
                  {localData.imageUrl && (
                    <div className="relative mt-2 w-full h-28 border rounded-xl overflow-hidden bg-neutral-100 group">
                      <img
                        src={localData.imageUrl}
                        alt="Question"
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => update({ imageUrl: undefined })}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-neutral-800 dark:text-white">
                    অপশনসমূহ
                  </label>
                  <span className="text-[10px] text-neutral-400 font-semibold">
                    (সঠিক উত্তরে ক্লিক করুন)
                  </span>
                </div>
                <div className="space-y-2">
                  {(localData.options || []).map((opt, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                        localData.correctAnswerIndex === i
                          ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          update({
                            correctAnswerIndex: i,
                            correctAnswer: localData.options?.[i] || '',
                            correctAnswerIndices: [i],
                          })
                        }
                        className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-mono text-sm font-extrabold transition-all ${
                          localData.correctAnswerIndex === i
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-white dark:bg-neutral-700 text-neutral-500 border border-neutral-300 dark:border-neutral-600 hover:border-emerald-400'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </button>
                      <input
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        className={`flex-1 px-2.5 py-1.5 rounded-lg border text-sm transition-all outline-none ${
                          localData.correctAnswerIndex === i
                            ? 'border-emerald-300 dark:border-emerald-700 bg-white dark:bg-emerald-900/10 focus:ring-1 focus:ring-emerald-500'
                            : 'border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 focus:ring-1 focus:ring-emerald-500'
                        }`}
                      />
                      <ImageUploader
                        folder="options"
                        compact
                        onUploadComplete={(url) => {
                          const newOpts = [...(localData.optionImages || [])];
                          while (newOpts.length <= i) newOpts.push('');
                          newOpts[i] = url;
                          update({ optionImages: newOpts });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-neutral-800 dark:text-white">
                  ব্যাখ্যা / সমাধান
                </label>
                <ImageUploader
                  folder="explanations"
                  compact
                  defaultValue={localData.explanationImageUrl}
                  onUploadComplete={(url) =>
                    update({ explanationImageUrl: url })
                  }
                />
              </div>
              {localData.explanationImageUrl && (
                <div className="relative w-full md:w-1/2 h-28 border rounded-xl overflow-hidden bg-neutral-100 group">
                  <img
                    src={localData.explanationImageUrl}
                    alt="Explanation"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => update({ explanationImageUrl: undefined })}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
              <textarea
                value={localData.explanation || ''}
                onChange={(e) => update({ explanation: e.target.value })}
                className={`${fieldCls} resize-none ${localData.explanation && !validateLatex(localData.explanation).isValid ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                rows={3}
                placeholder="সঠিক উত্তরের ব্যাখ্যা লেখো..."
              />
              {!validateLatex(localData.explanation || '').isValid && (
                <p className="text-[10px] text-red-500 font-bold mt-1">
                  ⚠ {validateLatex(localData.explanation || '').error}
                </p>
              )}
              {localData.explanation && (
                <div className="p-3 bg-red-50/60 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 rounded-xl">
                  <span className="text-[9px] text-red-600 uppercase tracking-widest font-bold mb-1 block">
                    সমাধান প্রিভিউ
                  </span>
                  <MathRenderer text={localData.explanation} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-neutral-50 dark:bg-neutral-900/80 border-t border-neutral-100 dark:border-neutral-800 flex gap-3 shrink-0">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-sm font-extrabold text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all active:scale-[0.98]"
          >
            বাতিল
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-3 text-sm font-extrabold bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 border border-emerald-600 transition-all active:scale-[0.98]"
          >
            সংরক্ষণ করুন
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Template Data ───────────────────────────────────────────────────
const TEMPLATE_ROWS = [
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
      'রাসায়নিক ল্যাবরেটরিতে ক্ষারীয় পদার্থ চোখের মারাত্মক ক্ষতি করে।',
    difficulty: 'Medium',
    examType: 'Medical,Academic',
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
    option1: 'নির্গত গ্যাসের গন্ধ নেওয়া',
    option2: 'খাবার গ্রহণ',
    option3: 'দ্রুত চলাচল',
    option4: 'লেবেল ছাড়া বিকারক ব্যবহার',
    answer: 'option1',
    explanation: 'নির্গত গ্যাসের প্রভাব অত্যন্ত মারাত্মক হতে পারে।',
    difficulty: 'Easy',
    examType: 'Medical,Varsity,Academic',
    institute: 'Buet,Ruet',
    year: '2022,2023',
  },
];

// ─── Main Component ──────────────────────────────────────────────────
export const BulkUpload: React.FC<BulkUploadProps> = ({
  onImport,
  onCancel,
  importProgress,
}) => {
  const [step, setStep] = useState<1 | 2 | 'complete'>(1);
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
  const [importSuccess, setImportSuccess] = useState(false);

  // ── JSON Auto-Fix State ──
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');
  const [jsonErrorMsg, setJsonErrorMsg] = useState('');
  const [directJsonText, setDirectJsonText] = useState('');

  // ── Filters & View state ──
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'json'>('file');

  // ── Bulk Action State ──
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkChapter, setBulkChapter] = useState('');
  const [bulkTopic, setBulkTopic] = useState('');

  const bulkAvailableSubjects = React.useMemo(() => getHscSubjectList(), []);
  const bulkAvailableChapters = React.useMemo(
    () => (bulkSubject ? getHscChapterList(bulkSubject) : []),
    [bulkSubject],
  );
  const bulkAvailableTopics = React.useMemo(
    () => (bulkChapter ? getHscTopicList(bulkChapter) : []),
    [bulkChapter],
  );

  const applyBulkAction = () => {
    if (selectedIndices.size === 0) return;

    // Resolve full names based on inputs
    const subjectName = bulkSubject
      ? (resolveSubjectName(bulkSubject) ?? bulkSubject)
      : undefined;
    const chapterName =
      subjectName && bulkChapter
        ? (resolveChapterName(subjectName, bulkChapter) ?? bulkChapter)
        : undefined;
    const topicName =
      chapterName && bulkTopic
        ? (resolveTopicName(chapterName, bulkTopic) ?? bulkTopic)
        : undefined;

    setParsedData((prev) =>
      prev.map((q, i) => {
        if (!selectedIndices.has(i)) return q;
        const newQ = { ...q };
        if (subjectName !== undefined) newQ.subject = subjectName;
        // Only update chapter/topic if the new subject is set or doesn't conflict
        if (chapterName !== undefined) newQ.chapter = chapterName;
        if (topicName !== undefined) newQ.topic = topicName;

        // Also clear invalid chapter/topic if changing subject
        if (subjectName !== undefined && subjectName !== q.subject) {
          if (chapterName === undefined) newQ.chapter = '';
          if (topicName === undefined) newQ.topic = '';
        } else if (chapterName !== undefined && chapterName !== q.chapter) {
          if (topicName === undefined) newQ.topic = '';
        }

        return newQ;
      }),
    );

    // Reset bulk selections after applying
    setBulkSubject('');
    setBulkChapter('');
    setBulkTopic('');

    // Optionally clear selection (or keep it selected)
    // setSelectedIndices(new Set());
  };

  // ── Unified processor: raw rows -> Question[] with dedup ──
  const processRawData = useCallback(
    (rows: Record<string, string>[]): Partial<Question>[] => {
      const parseErrors: ParseError[] = [];
      const questions = rows.map((row, i) =>
        normalizeRawRow(row, i, parseErrors),
      );

      // In-batch duplicate detection
      const seen = new Map<string, number>();
      questions.forEach((q, i) => {
        const key = (q.question || '').trim().toLowerCase();
        if (!key) return;
        const prevIndex = seen.get(key);
        if (prevIndex !== undefined) {
          parseErrors.push({
            row: i + 1,
            field: 'question',
            message: `ডুপ্লিকেট: সারি ${prevIndex + 1} এর সাথে মিলে গেছে`,
          });
        } else {
          seen.set(key, i);
        }
      });

      setErrors(parseErrors);
      return questions;
    },
    [],
  );

  // Resolve subject/chapter/topic to canonical names (including serial→name for topics)
  const resolveTopicSerialsLocally = (questions: Partial<Question>[]) => {
    return questions.map((q) => {
      const subject = resolveSubjectName(q.subject || '') ?? q.subject ?? '';
      const chapter = subject
        ? (resolveChapterName(subject, q.chapter || '') ?? q.chapter ?? '')
        : (q.chapter ?? '');
      const topic = chapter
        ? (resolveTopicName(chapter, q.topic || '') ?? q.topic ?? '')
        : (q.topic ?? '');
      return { ...q, subject, chapter, topic };
    });
  };

  // ── File handler ───────────────────────────────────────────────────
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_ROW_COUNT = 500;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      setErrors([
        {
          row: 0,
          field: 'file',
          message: `ফাইল সাইজ ${(file.size / 1024 / 1024).toFixed(1)}MB — সর্বোচ্চ 5MB অনুমোদিত`,
        },
      ]);
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);
    setErrors([]);
    setImportSuccess(false);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let rawRows: Record<string, string>[] = [];

      if (ext === 'json') {
        const text = await file.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err: any) {
          setRawJsonText(text);
          setJsonErrorMsg(getHelpfulJsonError(text, err));
          setShowJsonEditor(true);
          setIsProcessing(false);
          e.target.value = '';
          return; // Stop processing further here
        }
        rawRows = (Array.isArray(data) ? data : [data]).map(
          (row: Record<string, unknown>) => {
            const mapped: Record<string, string> = {};
            Object.entries(row).forEach(([k, v]) => {
              if (v !== null && typeof v === 'object') {
                mapped[k.trim().toLowerCase()] = JSON.stringify(v);
              } else {
                mapped[k.trim().toLowerCase()] = String(v ?? '');
              }
            });
            return mapped;
          },
        );
      } else if (ext === 'csv') {
        const text = await file.text();
        const result = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h: string) => h.trim().toLowerCase(),
        });
        if (result.errors.length > 0) {
          console.warn('CSV parse warnings:', result.errors);
        }
        rawRows = result.data;
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        rawRows = (
          XLSX.utils.sheet_to_json(firstSheet, { defval: '' }) as Record<
            string,
            unknown
          >[]
        ).map((row) => {
          const mapped: Record<string, string> = {};
          Object.entries(row).forEach(([k, v]) => {
            mapped[k.trim().toLowerCase()] = String(v ?? '');
          });
          return mapped;
        });
      } else {
        throw new Error(
          'অসমর্থিত ফাইল ফরম্যাট। JSON, CSV, অথবা XLSX ব্যবহার করো।',
        );
      }

      if (rawRows.length === 0) {
        throw new Error('ফাইলে কোনো ডাটা পাওয়া যায়নি।');
      }

      if (rawRows.length > MAX_ROW_COUNT) {
        throw new Error(
          `ফাইলে ${rawRows.length} টি সারি আছে — সর্বোচ্চ ${MAX_ROW_COUNT} টি অনুমোদিত। ফাইল ভাগ করে আপলোড করো।`,
        );
      }

      let questions = processRawData(rawRows);

      // Resolve Topic Serials Synchronously using hscSubjects
      questions = resolveTopicSerialsLocally(questions);

      // Cross-upload duplicate check against DB
      const questionTexts = questions.map((q) => q.question || '');
      const dbDuplicates = await checkDuplicateQuestions(questionTexts);
      if (dbDuplicates.size > 0) {
        const dupErrors: ParseError[] = [];
        dbDuplicates.forEach((idx) => {
          dupErrors.push({
            row: idx + 1,
            field: 'question',
            message: 'ডাটাবেসে ইতিমধ্যে বিদ্যমান — ডুপ্লিকেট',
          });
        });
        setErrors((prev) => [...prev, ...dupErrors]);
      }

      setParsedData(questions);
      setSelectedIndices(new Set(questions.map((_, i) => i)));
      setStep(2);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'ফাইল পার্স করতে ব্যর্থ। ফরম্যাট চেক করুন।',
      );
    } finally {
      setIsProcessing(false);
      // Reset input so the same file can be re-uploaded
      // Only reset if we didn't open the JSON editor (which resets early)
      if (!showJsonEditor) e.target.value = '';
    }
  };

  // ── Manual JSON Fix Handler ────────────────────────────────────────
  const handleJsonFix = async () => {
    setIsProcessing(true);
    setJsonErrorMsg('');
    try {
      const data = JSON.parse(rawJsonText);
      const rawRows = (Array.isArray(data) ? data : [data]).map(
        (row: Record<string, unknown>) => {
          const mapped: Record<string, string> = {};
          Object.entries(row).forEach(([k, v]) => {
            if (v !== null && typeof v === 'object') {
              mapped[k.trim().toLowerCase()] = JSON.stringify(v);
            } else {
              mapped[k.trim().toLowerCase()] = String(v ?? '');
            }
          });
          return mapped;
        },
      );

      if (rawRows.length === 0)
        throw new Error('ফাইলে কোনো ডাটা পাওয়া যায়নি।');
      if (rawRows.length > MAX_ROW_COUNT)
        throw new Error(`সর্বোচ্চ ${MAX_ROW_COUNT} টি সারি অনুমোদিত।`);

      let questions = processRawData(rawRows);
      questions = resolveTopicSerialsLocally(questions);

      const questionTexts = questions.map((q) => q.question || '');
      const dbDuplicates = await checkDuplicateQuestions(questionTexts);
      if (dbDuplicates.size > 0) {
        const dupErrors: ParseError[] = [];
        dbDuplicates.forEach((idx) => {
          dupErrors.push({
            row: idx + 1,
            field: 'question',
            message: 'ডাটাবেসে ইতিমধ্যে বিদ্যমান — ডুপ্লিকেট',
          });
        });
        setErrors((prev) => [...prev, ...dupErrors]);
      }

      setParsedData(questions);
      setSelectedIndices(new Set(questions.map((_, i) => i)));
      setShowJsonEditor(false); // Close editor on success
      setStep(2);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setJsonErrorMsg(getHelpfulJsonError(rawJsonText, err));
      } else {
        setJsonErrorMsg(err.message || 'অজানা ত্রুটি');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ── JSON Text Submit Handler ───────────────────────────────────────
  const handleJsonTextSubmit = async () => {
    if (!directJsonText.trim()) return;
    setIsProcessing(true);
    setErrors([]);
    setImportSuccess(false);

    try {
      let data;
      try {
        data = JSON.parse(directJsonText);
      } catch (err: any) {
        setRawJsonText(directJsonText);
        setJsonErrorMsg(getHelpfulJsonError(directJsonText, err));
        setShowJsonEditor(true);
        setIsProcessing(false);
        return;
      }

      const rawRows = (Array.isArray(data) ? data : [data]).map(
        (row: Record<string, unknown>) => {
          const mapped: Record<string, string> = {};
          Object.entries(row).forEach(([k, v]) => {
            if (v !== null && typeof v === 'object') {
              mapped[k.trim().toLowerCase()] = JSON.stringify(v);
            } else {
              mapped[k.trim().toLowerCase()] = String(v ?? '');
            }
          });
          return mapped;
        },
      );

      if (rawRows.length === 0)
        throw new Error('টেক্সটে কোনো ডাটা পাওয়া যায়নি।');
      if (rawRows.length > MAX_ROW_COUNT)
        throw new Error(`সর্বোচ্চ ${MAX_ROW_COUNT} টি সারি অনুমোদিত।`);

      let questions = processRawData(rawRows);
      questions = resolveTopicSerialsLocally(questions);

      const questionTexts = questions.map((q) => q.question || '');
      const dbDuplicates = await checkDuplicateQuestions(questionTexts);
      if (dbDuplicates.size > 0) {
        const dupErrors: ParseError[] = [];
        dbDuplicates.forEach((idx) => {
          dupErrors.push({
            row: idx + 1,
            field: 'question',
            message: 'ডাটাবেসে ইতিমধ্যে বিদ্যমান — ডুপ্লিকেট',
          });
        });
        setErrors((prev) => [...prev, ...dupErrors]);
      }

      setFileName('Pasted JSON text');
      setParsedData(questions);
      setSelectedIndices(new Set(questions.map((_, i) => i)));
      setStep(2);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'JSON পার্স করতে ব্যর্থ।');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Download Templates ─────────────────────────────────────────────
  const downloadTemplate = (format: 'json' | 'csv' | 'xlsx') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(TEMPLATE_ROWS, null, 2)], {
        type: 'application/json',
      });
      downloadBlob(blob, 'question_template.json');
    } else if (format === 'csv') {
      const csv = Papa.unparse(TEMPLATE_ROWS);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      downloadBlob(blob, 'question_template.csv');
    } else {
      const ws = XLSX.utils.json_to_sheet(TEMPLATE_ROWS);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Questions');
      XLSX.writeFile(wb, 'question_template.xlsx');
    }
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Selection helpers ──────────────────────────────────────────────
  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedIndices(newSet);
  };
  const selectAll = () =>
    setSelectedIndices(new Set(parsedData.map((_, i) => i)));
  const clearSelection = () => setSelectedIndices(new Set());
  const isAllSelected = selectedIndices.size === parsedData.length;

  // ── Edit helpers ───────────────────────────────────────────────────
  const handleEditQuestion = (i: number) => {
    setEditingIndex(i);
    setEditingData({ ...parsedData[i] });
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
  const removeQuestion = (index: number) => {
    setParsedData((prev) => prev.filter((_, i) => i !== index));
    const newSel = new Set<number>();
    selectedIndices.forEach((i) => {
      if (i < index) newSel.add(i);
      else if (i > index) newSel.add(i - 1);
    });
    setSelectedIndices(newSel);
  };
  const removeSelected = () => {
    setParsedData((prev) => prev.filter((_, i) => !selectedIndices.has(i)));
    setSelectedIndices(new Set());
  };

  // --- Background Job Polling ---
  const [activeJob, setActiveJob] = useState<BulkUploadJob | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const startPolling = (jobId: string) => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);

    pollingInterval.current = setInterval(async () => {
      const status = await getBulkUploadJobStatus(jobId);
      if (status) {
        setActiveJob(status);
        if (status.status === 'Completed' || status.status === 'Failed') {
          if (pollingInterval.current) clearInterval(pollingInterval.current);
        }
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, []);

  // ── Import handler ─────────────────────────────────────────────────
  const handleImport = async () => {
    const toImport =
      selectedIndices.size > 0
        ? parsedData.filter((_, i) => selectedIndices.has(i))
        : parsedData;
    if (toImport.length === 0) {
      alert('কোনো প্রশ্ন নির্বাচন করা হয়নি');
      return;
    }

    setIsProcessing(true);
    try {
      // --- ID Resolution Phase ---
      // Assuming 'toast' is available globally or imported from a library like react-hot-toast
      // toast.loading('শ্রেণীকরণ (Taxonomy) যাচাই করা হচ্ছে...');
      const resolvedQuestions = await Promise.all(
        toImport.map(async (q) => {
          const ids = await resolveAcademicIds(
            q.subject || '',
            q.chapter || '',
            q.topic || '',
          );
          return {
            ...q,
            subjectId: ids.subjectId,
            chapterId: ids.chapterId,
            topicId: ids.topicId,
          };
        }),
      );
      // toast.dismiss();

      const success = await onImport(resolvedQuestions as Partial<Question>[]);

      // Check if a job ID was returned via importProgress (needs hook update to store jobId)
      // For now, the hook handles the summary toast.
      if (success) {
        setImportSuccess(true);
        setTimeout(() => onCancel(), 2000);
      }
    } catch {
      alert('ইমপোর্ট করতে ব্যর্থ। আবার চেষ্টা করো।');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────
  const validCount = parsedData.filter(
    (_, i) => !errors.some((e) => e.row === i + 1) && selectedIndices.has(i),
  ).length;
  const errorCount = errors.length;

  // ── STEP 1: Upload ─────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="w-full bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-3xl mx-auto overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Upload className="text-emerald-600" size={20} />
              বাল্ক আপলোড
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              JSON, CSV, অথবা Excel ফাইল আপলোড করুন
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tab Selection */}
          <div className="flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl max-w-sm mx-auto mb-2 border border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setUploadMethod('file')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                uploadMethod === 'file'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <FileUp size={14} />
              ফাইল আপলোড
            </button>
            <button
              onClick={() => setUploadMethod('json')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                uploadMethod === 'json'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <FileJson size={14} />
              সরাসরি পেস্ট (JSON)
            </button>
          </div>

          <div className="animate-in fade-in zoom-in-95 duration-200">
            {uploadMethod === 'file' ? (
              <div className="space-y-6">
                {/* Templates */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    টেম্পলেট ডাউনলোড করুন
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        fmt: 'json' as const,
                        icon: FileJson,
                        label: 'JSON',
                        color: 'bg-red-50 dark:bg-red-900/20 text-red-600',
                      },
                      {
                        fmt: 'csv' as const,
                        icon: FileText,
                        label: 'CSV',
                        color:
                          'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
                      },
                      {
                        fmt: 'xlsx' as const,
                        icon: FileSpreadsheet,
                        label: 'Excel',
                        color:
                          'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
                      },
                    ].map((t) => (
                      <button
                        key={t.fmt}
                        onClick={() => downloadTemplate(t.fmt)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-sm transition-all group"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.color} group-hover:scale-110 transition-transform`}
                        >
                          <t.icon size={20} />
                        </div>
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                          {t.label}
                        </span>
                        <Download
                          size={12}
                          className="text-neutral-400 group-hover:text-emerald-500"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dropzone */}
                <label className="relative border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl p-8 text-center hover:border-emerald-500 bg-neutral-50/50 dark:bg-neutral-950/50 cursor-pointer flex flex-col items-center justify-center transition-all h-64 group">
                  <input
                    type="file"
                    onChange={handleFile}
                    className="hidden"
                    accept=".csv,.json,.xlsx,.xls"
                  />
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                    <FileUp size={28} />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
                    ফাইল সিলেক্ট অথবা ড্র্যাগ করুন
                  </h3>
                  <p className="text-xs text-neutral-500 mb-5">
                    JSON, CSV, Excel (.xlsx) — সর্বোচ্চ ৫MB
                  </p>
                  <div className="px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all">
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        পার্স করা হচ্ছে...
                      </span>
                    ) : (
                      'ফাইল আপলোড করুন'
                    )}
                  </div>
                </label>
              </div>
            ) : (
              /* Json Code Paste */
              <div className="relative border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 flex flex-col focus-within:border-emerald-500 bg-white dark:bg-neutral-950 transition-all h-[420px] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                    <FileJson size={18} className="text-emerald-600" />
                    <h3 className="text-sm font-bold">
                      JSON টেক্সট পেস্ট করুন
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">
                    ARRAY OF QUESTION OBJECTS
                  </span>
                </div>
                <textarea
                  value={directJsonText}
                  onChange={(e) => setDirectJsonText(e.target.value)}
                  placeholder='[ 
  { 
    "question": "ধ্রুবক g এর মান কত?",
    "options": ["9.8", "10", "8.9", "7"],
    "answer": "option1"
  } 
]'
                  className="flex-1 w-full bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 text-xs font-mono text-neutral-800 dark:text-neutral-300 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 mb-4 leading-relaxed"
                />
                <button
                  onClick={handleJsonTextSubmit}
                  disabled={isProcessing || !directJsonText.trim()}
                  className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-xl font-extrabold text-sm shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      প্রসেস হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      টেক্সট ইম্পোর্ট করুন
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: Review & Import ────────────────────────────────────────
  return (
    <div className="w-full bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-5xl mx-auto overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
      {/* Modals */}
      {previewQuestion && (
        <QuestionPreview
          question={previewQuestion}
          onClose={() => setPreviewQuestion(null)}
        />
      )}
      {editingIndex !== null && editingData && (
        <EditModal
          data={editingData}
          onChange={setEditingData}
          onSave={saveEdit}
          onCancel={() => {
            setEditingIndex(null);
            setEditingData(null);
          }}
        />
      )}

      {/* Success overlay */}
      {importSuccess && (
        <div className="absolute inset-0 bg-white/95 dark:bg-neutral-900/95 z-50 flex flex-col items-center justify-center gap-5 backdrop-blur-sm transition-all duration-300">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2
              size={40}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <p className="text-xl md:text-2xl font-extrabold text-emerald-800 dark:text-emerald-400">
            সফলভাবে ইমপোর্ট হয়েছে!
          </p>
        </div>
      )}

      {/* Header */}
      <div className="p-4 sm:px-6 sm:py-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setStep(1)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors active:scale-95"
          >
            <ChevronLeft
              size={20}
              className="text-neutral-700 dark:text-neutral-300"
            />
          </button>
          <div>
            <h2 className="text-base md:text-lg font-extrabold text-neutral-900 dark:text-white">
              রিভিউ — {fileName}
            </h2>
            <p className="text-xs font-semibold text-neutral-500 mt-0.5">
              {parsedData.length} টি প্রশ্ন পাওয়া গেছে •{' '}
              <span className="text-emerald-600 dark:text-emerald-400">
                {validCount} টি নির্বাচিত
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-neutral-500 transition-colors active:scale-95"
        >
          <X size={20} />
        </button>
      </div>

      {/* Stats & Errors */}
      <div className="px-5 sm:px-6 py-3 bg-neutral-50/80 dark:bg-neutral-950/80 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-3 justify-between shadow-sm z-10">
        <div className="flex items-center gap-2.5">
          <button
            onClick={isAllSelected ? clearSelection : selectAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-[0.98] border ${
              isAllSelected
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            }`}
          >
            {isAllSelected ? <CheckSquare size={14} /> : <Square size={14} />}
            {isAllSelected ? 'সব বাদ দাও' : 'সব সিলেক্ট'}
          </button>

          <button
            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-[0.98] border ${
              showOnlyErrors
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            }`}
          >
            <AlertCircle size={14} />
            {showOnlyErrors ? 'সব প্রশ্ন দেখাও' : 'শুধু ভুলগুলো (Errors) দেখাও'}
          </button>

          {selectedIndices.size > 0 && (
            <button
              onClick={removeSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all active:scale-[0.98]"
            >
              <Trash2 size={13} />
              নির্বাচিত মুছুন ({selectedIndices.size})
            </button>
          )}
        </div>
        {errorCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-extrabold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm animate-pulse-slight">
            <AlertCircle size={14} className="animate-bounce-slight" />
            {errorCount} ত্রুটি
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIndices.size > 0 && (
        <div className="px-5 sm:px-6 py-3 bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/30 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
            বাল্ক অ্যাকশন:
          </span>
          <div className="flex-1 flex flex-wrap items-center gap-2">
            <select
              value={bulkSubject}
              onChange={(e) => {
                setBulkSubject(e.target.value);
                setBulkChapter('');
                setBulkTopic('');
              }}
              className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="">বিষয় পরিবর্তন</option>
              {bulkAvailableSubjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={bulkChapter}
              onChange={(e) => {
                setBulkChapter(e.target.value);
                setBulkTopic('');
              }}
              disabled={!bulkSubject}
              className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50"
            >
              <option value="">অধ্যায় পরিবর্তন</option>
              {bulkAvailableChapters.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={bulkTopic}
              onChange={(e) => setBulkTopic(e.target.value)}
              disabled={!bulkChapter}
              className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50"
            >
              <option value="">টপিক পরিবর্তন</option>
              {bulkAvailableTopics.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              onClick={applyBulkAction}
              disabled={!bulkSubject && !bulkChapter && !bulkTopic}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm ml-auto sm:ml-0 whitespace-nowrap"
            >
              এপ্লাই করুন
            </button>
          </div>
        </div>
      )}

      {/* Error details */}
      {errorCount > 0 && (
        <div className="px-5 sm:px-6 py-3 bg-red-50 dark:bg-red-950/30 border-b border-red-100 dark:border-red-900/30">
          <div className="max-h-24 overflow-y-auto space-y-1.5 custom-scrollbar pr-2">
            {errors.map((err, i) => (
              <div
                key={i}
                className="text-xs text-red-700 dark:text-red-400 flex items-center gap-2 bg-white/60 dark:bg-black/20 px-2.5 py-1.5 rounded-md border border-red-100/50 dark:border-red-900/20"
              >
                <span className="shrink-0 font-extrabold bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded text-[10px]">
                  রো {err.row}
                </span>
                <span className="font-semibold text-xs text-red-800 dark:text-red-300">
                  {err.field}{' '}
                  <span className="text-red-400 dark:text-red-600 mx-1">—</span>{' '}
                  {err.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-neutral-50/30 dark:bg-[#0a0a0a]">
        {parsedData
          .map((q, i) => ({ q, i }))
          .filter(({ i }) => {
            if (!showOnlyErrors) return true;
            return errors.some((err) => err.row === i + 1);
          })
          .map(({ q, i }) => {
            const isSelected = selectedIndices.has(i);
            const hasError = errors.some((err) => err.row === i + 1);

            return (
              <div
                key={i}
                className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 relative overflow-hidden group ${
                  isSelected
                    ? 'bg-emerald-50/80 dark:bg-emerald-900/10 border-2 border-emerald-500/40 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.15)] dark:shadow-none'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700'
                } ${hasError ? 'border-red-300 dark:border-red-800 ring-1 ring-red-400/20' : ''}`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(i)}
                    className="mt-1 w-4.5 h-4.5 rounded border-neutral-300 dark:border-neutral-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-all"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-extrabold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                        #{i + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewQuestion(q)}
                          className="p-1 px-2 text-[10px] md:text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 rounded-md transition-colors"
                        >
                          <Eye size={14} className="inline mr-1" />
                          দেখো
                        </button>
                        <button
                          onClick={() => handleEditQuestion(i)}
                          className="p-1 px-2 text-[10px] md:text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          <Edit size={14} className="inline mr-1" />
                          সম্পাদনা
                        </button>
                        <button
                          onClick={() => removeQuestion(i)}
                          className="p-1 px-2 text-[10px] md:text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          <Trash2 size={14} className="inline mr-1" />
                          মুছুন
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200 line-clamp-2 mb-2">
                      {q.question}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold">
                        {q.subject || '—'}
                      </span>
                      {q.chapter && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[180px]">
                          📖 {q.chapter}
                        </span>
                      )}
                      {q.topic && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[180px]">
                          🏷️ {q.topic}
                        </span>
                      )}
                      {q.correctAnswer && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-bold truncate max-w-[150px]">
                          ✓ {q.correctAnswer}
                        </span>
                      )}
                      {q.difficulty && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            q.difficulty === 'Easy'
                              ? 'bg-green-50 text-green-600'
                              : q.difficulty === 'Hard'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      )}
                      {hasError && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold">
                          ⚠ ত্রুটি
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Progress Bar */}
      {importProgress &&
        (importProgress.isImporting ||
          (importProgress.completed > 0 && isProcessing)) && (
          <div className="px-5 py-4 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                {activeJob ? 'সার্ভার ইমপোর্ট প্রগ্রেস' : 'ইমপোর্ট প্রগ্রেস'}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-neutral-500">
                  {activeJob
                    ? `${activeJob.processed_rows} / ${activeJob.total_rows}`
                    : `${importProgress.completed + importProgress.failed} / ${importProgress.total}`}
                </span>
                {(activeJob
                  ? activeJob.error_rows > 0
                  : importProgress.failed > 0) && (
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-bold">
                    {activeJob ? activeJob.error_rows : importProgress.failed}{' '}
                    ব্যর্থ
                  </span>
                )}
              </div>
            </div>
            <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${activeJob?.status === 'Failed' ? 'from-red-500 to-red-400' : 'from-emerald-500 to-emerald-400'} rounded-full transition-all duration-300 ease-out`}
                style={{
                  width: activeJob
                    ? `${(activeJob.processed_rows / activeJob.total_rows) * 100}%`
                    : `${importProgress.total > 0 ? ((importProgress.completed + importProgress.failed) / importProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
            {!importProgress.isImporting && importProgress.completed > 0 && (
              <p className="text-xs text-emerald-600 font-bold mt-2">
                ✅ {importProgress.completed} টি সফল
                {importProgress.failed > 0
                  ? `, ${importProgress.failed} টি ব্যর্থ`
                  : ''}
              </p>
            )}
          </div>
        )}

      {/* Footer */}
      <div className="p-4 sm:p-5 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 z-20">
        <button
          onClick={() => setStep(1)}
          disabled={isProcessing}
          className="px-6 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 font-extrabold hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 transition-all w-full sm:w-auto active:scale-[0.98] disabled:opacity-50"
        >
          পিছে যান
        </button>
        <button
          onClick={handleImport}
          disabled={isProcessing || selectedIndices.size === 0}
          className="px-8 py-3 rounded-xl font-extrabold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20 border border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              {activeJob ? 'সার্ভারে হচ্ছে...' : 'ইমপোর্ট হচ্ছে...'}
              {activeJob
                ? ` (${activeJob.processed_rows}/${activeJob.total_rows})`
                : importProgress
                  ? ` (${importProgress.completed + importProgress.failed}/${importProgress.total})`
                  : ''}
            </>
          ) : (
            <>
              <Save size={18} />
              ইমপোর্ট করুন ({selectedIndices.size})
            </>
          )}
        </button>
      </div>

      {/* JSON Editor Modal */}
      {showJsonEditor && (
        <Dialog
          open={showJsonEditor}
          onOpenChange={(open) => {
            if (!open) setShowJsonEditor(false);
          }}
        >
          <DialogContent
            className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden"
            showCloseButton={false}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shrink-0">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                <FileJson size={20} />
                <h3 className="font-extrabold text-sm tracking-wide">
                  JSON ফিক্সার
                </h3>
              </div>
              <button
                onClick={() => setShowJsonEditor(false)}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3 flex-1 overflow-hidden">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-sm flex items-start gap-2 text-red-700 dark:text-red-400">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold mb-1">
                    JSON ফাইলটি পার্স করা যাচ্ছে না
                  </p>
                  <p className="opacity-90 leading-relaxed font-mono text-xs">
                    {jsonErrorMsg}
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                নিচের টেক্সট-এ উল্লেখিত লাইনে ভুলটি (যেমন কমা বা কোলন মিসিং) ঠিক
                করে পুনরায় চেষ্টা করো।
              </p>

              <textarea
                value={rawJsonText}
                onChange={(e) => setRawJsonText(e.target.value)}
                className="w-full flex-1 p-4 font-mono text-sm leading-relaxed rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                spellCheck={false}
              />
            </div>

            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex justify-end gap-2">
              <button
                onClick={() => setShowJsonEditor(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                disabled={isProcessing}
              >
                বাতিল
              </button>
              <button
                onClick={handleJsonFix}
                disabled={isProcessing}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                সংরক্ষণ ও চেষ্টা করো
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
