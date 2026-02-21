import React, { useState, useCallback } from 'react';
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
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { hscSubjects } from '@/lib/data/hsc';
import {
  getSubjects,
  getChapters,
  getTopics,
} from '@/services/metadata-service';

// ─── Types ───────────────────────────────────────────────────────────
interface BulkUploadProps {
  onImport: (questions: Partial<Question>[]) => Promise<boolean>;
  onCancel: () => void;
}

interface ParseError {
  row: number;
  field: string;
  message: string;
}

// ─── Unified Data Normalizer ─────────────────────────────────────────
// Converts flat format (option1, option2, answer:"option3") into
// the Question schema the database expects.
function normalizeRawRow(
  raw: Record<string, string>,
  rowIndex: number,
  parseErrors: ParseError[],
): Partial<Question> {
  const q: Partial<Question> = {
    type: 'MCQ',
    status: 'Pending',
    author: 'Bulk Upload',
    version: 1,
    tags: [],
  };

  // Map flat fields
  q.question = raw['question'] || raw['content'] || '';
  q.subject = raw['subject'] || '';
  q.chapter = raw['chapter'] || '';
  q.topic = raw['topic'] || '';
  q.stream = raw['stream'] || '';
  q.stream = raw['stream'] || '';
  // Mapped 'section' from file to 'division' in DB as per requirement
  q.division = raw['division'] || raw['section'] || '';
  q.section = raw['section'] || ''; // Keep section for backward compat if needed, or leave empty if we strictly switch.
  q.explanation = raw['explanation'] || '';
  q.difficulty = ((raw['difficulty'] || 'Medium') as string)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(',') as 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  q.examType = (raw['examType'] || raw['exam_type'] || 'Academic')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(',');

  // Institutes & Years (comma separated)
  if (raw['institute'] || raw['institutes']) {
    const val = raw['institute'] || raw['institutes'] || '';
    q.institutes = val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    q.institute = q.institutes[0] || '';
  }
  if (raw['year'] || raw['years']) {
    const val = raw['year'] || raw['years'] || '';
    q.years = val
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
    q.year = q.years[0]?.toString() || '';
  }

  // Build options array from option1..option6
  const options: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const opt = raw[`option${i}`];
    if (opt && opt.trim()) options.push(opt.trim());
  }
  // Fallback: if no option1..N, try options array directly
  if (options.length === 0 && raw['options']) {
    try {
      const parsed = JSON.parse(raw['options']);
      if (Array.isArray(parsed)) options.push(...parsed);
    } catch {
      /* ignore */
    }
  }
  q.options = options;

  // Resolve correct answer
  const answerRef = raw['answer'] || raw['correctAnswer'] || '';
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

  return q;
}

// ─── Question Preview Modal ──────────────────────────────────────────
const QuestionPreview: React.FC<{
  question: Partial<Question>;
  onClose: () => void;
}> = ({ question: q, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
    <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl border border-neutral-200 dark:border-neutral-800">
      <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900 z-10">
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
            <MathText text={q.question || ''} />
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
                  <MathText text={opt} />
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
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <MathText text={q.explanation} />
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
    </div>
  </div>
);

// ─── Edit Modal ──────────────────────────────────────────────────────
const EditModal: React.FC<{
  data: Partial<Question>;
  onChange: (d: Partial<Question>) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ data, onChange, onSave, onCancel }) => {
  const updateOption = (idx: number, val: string) => {
    const opts = [...(data.options || [])];
    opts[idx] = val;
    onChange({ ...data, options: opts });
  };

  // --- Data State for Dropdowns ---
  const [availableSubjects, setAvailableSubjects] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [availableChapters, setAvailableChapters] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [availableTopics, setAvailableTopics] = React.useState<
    { id: string; name: string }[]
  >([]);

  // 1. Fetch Subjects on Mount
  React.useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const subjects = await getSubjects();
        setAvailableSubjects(
          subjects.map((s) => ({
            id: s.id,
            name: (s as any).rawName || s.name,
          })),
        );
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  // 2. Fetch Chapters when Subject changes
  React.useEffect(() => {
    if (!data.subject) {
      setAvailableChapters([]);
      setAvailableTopics([]);
      return;
    }
    const fetchChapters = async () => {
      try {
        const matchedSubject = availableSubjects.find(
          (s) => s.name.toLowerCase() === data.subject?.toLowerCase(),
        );
        const subjectId = matchedSubject ? matchedSubject.id : data.subject;
        if (subjectId) {
          const chapters = await getChapters(subjectId);
          setAvailableChapters(chapters);
        }
      } catch (err) {
        console.error('Failed to load chapters:', err);
      }
    };
    fetchChapters();
  }, [data.subject, availableSubjects]);

  // 3. Fetch Topics when Chapter changes
  React.useEffect(() => {
    if (!data.chapter) {
      setAvailableTopics([]);
      return;
    }
    const fetchTopics = async () => {
      try {
        const matchedChapter = availableChapters.find(
          (c) => c.name.toLowerCase() === data.chapter?.toLowerCase(),
        );
        const chapterId = matchedChapter ? matchedChapter.id : data.chapter;
        if (chapterId) {
          const topics = await getTopics(chapterId);
          setAvailableTopics(topics.map((t) => ({ id: t.id, name: t.name })));
        }
      } catch (err) {
        console.error('Failed to load topics:', err);
      }
    };
    fetchTopics();
  }, [data.chapter, availableChapters]);

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            প্রশ্ন সম্পাদনা
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {/* Metadata & Hierarchy */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-neutral-50 rounded-xl border border-neutral-100">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                বিষয়
              </label>
              <select
                value={data.subject || ''}
                onChange={(e) =>
                  onChange({
                    ...data,
                    subject: e.target.value,
                    chapter: '',
                    topic: '',
                  })
                }
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm"
              >
                <option value="">নির্বাচন করুন</option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                অধ্যায়
              </label>
              <select
                value={data.chapter || ''}
                onChange={(e) =>
                  onChange({ ...data, chapter: e.target.value, topic: '' })
                }
                disabled={!data.subject}
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm disabled:opacity-50"
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                টপিক
              </label>
              <select
                value={data.topic || ''}
                onChange={(e) => onChange({ ...data, topic: e.target.value })}
                disabled={!data.chapter}
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm disabled:opacity-50"
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                কাঠিন্য মাত্রা
              </label>
              <select
                value={data.difficulty || 'Medium'}
                onChange={(e) =>
                  onChange({
                    ...data,
                    difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard',
                  })
                }
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>

            {/* Stream */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                স্ট্রিম (Stream)
              </label>
              <input
                value={data.stream || ''}
                onChange={(e) => onChange({ ...data, stream: e.target.value })}
                placeholder="e.g. HSC"
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm"
              />
            </div>

            {/* Section */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                বিভাগ (Section)
              </label>
              <input
                value={data.section || data.division || ''}
                onChange={(e) => onChange({ ...data, section: e.target.value })}
                placeholder="e.g. Science"
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm"
              />
            </div>

            {/* Exam Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                পরীক্ষার ধরন
              </label>
              <input
                value={data.examType || ''}
                onChange={(e) =>
                  onChange({ ...data, examType: e.target.value })
                }
                placeholder="e.g. Medical,Varsity"
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm"
              />
            </div>

            {/* Year */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                বছর
              </label>
              <input
                value={data.year || ''}
                onChange={(e) => onChange({ ...data, year: e.target.value })}
                placeholder="e.g. 2023"
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm"
              />
            </div>

            {/* Institute */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                প্রতিষ্ঠান (Institute)
              </label>
              <input
                value={data.institute || data.institutes?.join(',') || ''}
                onChange={(e) =>
                  onChange({ ...data, institute: e.target.value })
                }
                placeholder="e.g. Buet,Ruet,DMC"
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm"
              />
            </div>
          </div>

          {/* Core Content */}
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Question */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-neutral-700 block">
                    প্রশ্ন
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold border border-blue-100">
                    LaTeX Supported ($...$)
                  </span>
                </div>
                <textarea
                  value={data.question || ''}
                  onChange={(e) =>
                    onChange({ ...data, question: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  rows={4}
                  placeholder="প্রশ্নের বিবরণ লিখুন..."
                />

                {data.question && (
                  <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-xl min-h-[60px]">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold mb-2 block">
                      প্রিভিউ
                    </span>
                    <MathRenderer text={data.question} />
                  </div>
                )}

                <div className="pt-2">
                  <label className="text-sm font-bold text-neutral-700 block mb-2">
                    প্রশ্নের ছবি (ঐচ্ছিক)
                  </label>
                  <div className="inline-block">
                    <ImageUploader
                      folder="questions"
                      defaultValue={data.imageUrl}
                      onUploadComplete={(url) => {
                        onChange({ ...data, imageUrl: url });
                      }}
                    />
                  </div>
                  {data.imageUrl && (
                    <div className="relative mt-2 w-full h-32 border rounded-xl overflow-hidden bg-neutral-100 group">
                      <img
                        src={data.imageUrl}
                        alt="Question"
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() =>
                          onChange({ ...data, imageUrl: undefined })
                        }
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 block mb-3">
                  অপশনসমূহ
                  <span className="text-xs font-normal text-neutral-500 ml-2">
                    (সঠিক উত্তরে ক্লিক করুন)
                  </span>
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {(data.options || []).map((opt, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-1 p-3 rounded-xl border border-neutral-100 bg-neutral-50"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              ...data,
                              correctAnswerIndex: i,
                              correctAnswer: data.options?.[i] || '',
                              correctAnswerIndices: [i],
                            })
                          }
                          className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-mono text-sm font-bold transition-all ${
                            data.correctAnswerIndex === i
                              ? 'bg-emerald-500 text-white border-emerald-500 ring-2 ring-emerald-500/20'
                              : 'bg-white text-neutral-500 border-neutral-300 hover:border-emerald-400 border'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </button>

                        <div className="flex-1 space-y-2">
                          <input
                            value={opt}
                            onChange={(e) => updateOption(i, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            className={`w-full p-2 rounded-lg border text-sm transition-all outline-none ${
                              data.correctAnswerIndex === i
                                ? 'border-emerald-300 bg-emerald-50 focus:ring-1 focus:ring-emerald-500'
                                : 'border-neutral-200 bg-white focus:ring-1 focus:ring-emerald-500'
                            }`}
                          />

                          {/* Option Image Preview if exists */}
                          {data.optionImages?.[i] && (
                            <div className="relative w-full h-20 rounded-lg border border-neutral-200 overflow-hidden bg-white group">
                              <img
                                src={data.optionImages[i]}
                                alt="Option"
                                className="w-full h-full object-contain"
                              />
                              <button
                                onClick={() => {
                                  const newOpts = [
                                    ...(data.optionImages || []),
                                  ];
                                  newOpts[i] = '';
                                  onChange({ ...data, optionImages: newOpts });
                                }}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Image Uploader Component */}
                        <div className="shrink-0 self-start mt-0.5">
                          <ImageUploader
                            folder="options"
                            onUploadComplete={(url) => {
                              const newOpts = [...(data.optionImages || [])];
                              while (newOpts.length <= i) newOpts.push('');
                              newOpts[i] = url;
                              onChange({ ...data, optionImages: newOpts });
                            }}
                          />
                        </div>
                      </div>

                      {/* Option Math Preview */}
                      {opt && (
                        <div className="ml-10 mt-1 pb-1 text-xs text-neutral-700">
                          <MathRenderer text={opt} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-neutral-700 block">
                  ব্যাখ্যা / সমাধান
                </label>
                <div className="inline-block scale-90 origin-right">
                  <ImageUploader
                    folder="explanations"
                    defaultValue={data.explanationImageUrl}
                    onUploadComplete={(url) => {
                      onChange({ ...data, explanationImageUrl: url });
                    }}
                  />
                </div>
              </div>

              {/* Explanation Image Preview */}
              {data.explanationImageUrl && (
                <div className="relative w-full md:w-1/2 h-32 border rounded-xl overflow-hidden bg-neutral-100 group mb-3">
                  <img
                    src={data.explanationImageUrl}
                    alt="Explanation"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() =>
                      onChange({ ...data, explanationImageUrl: undefined })
                    }
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              <textarea
                value={data.explanation || ''}
                onChange={(e) =>
                  onChange({ ...data, explanation: e.target.value })
                }
                className="w-full p-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                rows={3}
                placeholder="সঠিক উত্তরের ব্যাখ্যা লিখুন..."
              />

              {data.explanation && (
                <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-xl min-h-[60px]">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold mb-2 block">
                    সমাধান প্রিভিউ
                  </span>
                  <MathRenderer text={data.explanation} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-neutral-50 border-t border-neutral-100 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors"
          >
            বাতিল করুন
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-3 text-sm font-bold bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95"
          >
            সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
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
  const [importSuccess, setImportSuccess] = useState(false);

  // ── Unified processor: raw rows -> Question[] ──
  // ── Unified processor: raw rows -> Question[] ──
  const processRawData = useCallback(
    (rows: Record<string, string>[]): Partial<Question>[] => {
      const parseErrors: ParseError[] = [];
      const questions = rows.map((row, i) =>
        normalizeRawRow(row, i, parseErrors),
      );
      setErrors(parseErrors);
      return questions;
    },
    [],
  );

  // Helper to resolve topic serials to names using local hscSubjects data
  const resolveTopicSerialsLocally = (questions: Partial<Question>[]) => {
    return questions.map((q) => {
      let resolvedSubject = q.subject || '';
      let resolvedChapter = q.chapter || '';
      let resolvedTopic = q.topic || '';

      if (!resolvedSubject) return q;

      const subjLower = resolvedSubject.toLowerCase().trim();
      const foundSubject = hscSubjects.find(
        (s) =>
          s.name.toLowerCase() === subjLower ||
          s.name.toLowerCase().includes(subjLower) ||
          subjLower.includes(s.name.toLowerCase()),
      );

      if (foundSubject) {
        resolvedSubject = foundSubject.name; // Keep exact DB string format

        if (resolvedChapter) {
          const chapLower = resolvedChapter.toLowerCase().trim();
          const foundChapter = foundSubject.chapters?.find(
            (c) =>
              c.name.toLowerCase() === chapLower ||
              c.name.toLowerCase().includes(chapLower) ||
              chapLower.includes(c.name.toLowerCase()),
          );

          if (foundChapter) {
            resolvedChapter = foundChapter.name; // Keep exact DB string format

            if (resolvedTopic) {
              const topicRaw = resolvedTopic.trim();
              const topicLower = topicRaw.toLowerCase();
              const isSerial = /^\d+$/.test(topicRaw);

              const foundTopic = foundChapter.topics?.find((t) => {
                if (isSerial) {
                  return t.serial?.toString() === topicRaw;
                }
                return (
                  t.name.toLowerCase() === topicLower ||
                  t.name.toLowerCase().includes(topicLower) ||
                  topicLower.includes(t.name.toLowerCase())
                );
              });

              if (foundTopic) {
                resolvedTopic = foundTopic.name; // Keep exact DB string format
              }
            }
          }
        }
      }

      return {
        ...q,
        subject: resolvedSubject,
        chapter: resolvedChapter,
        topic: resolvedTopic,
      };
    });
  };

  // ── File handler ───────────────────────────────────────────────────
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);
    setErrors([]);
    setImportSuccess(false);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let rawRows: Record<string, string>[] = [];

      if (ext === 'json') {
        const text = await file.text();
        const data = JSON.parse(text);
        rawRows = (Array.isArray(data) ? data : [data]).map(
          (row: Record<string, unknown>) => {
            const mapped: Record<string, string> = {};
            Object.entries(row).forEach(([k, v]) => {
              mapped[k] = String(v ?? '');
            });
            return mapped;
          },
        );
      } else if (ext === 'csv') {
        const text = await file.text();
        const result = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h: string) => h.trim(),
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
            mapped[k.trim()] = String(v ?? '');
          });
          return mapped;
        });
      } else {
        throw new Error(
          'অসমর্থিত ফাইল ফরম্যাট। JSON, CSV, অথবা XLSX ব্যবহার করুন।',
        );
      }

      if (rawRows.length === 0) {
        throw new Error('ফাইলে কোনো ডাটা পাওয়া যায়নি।');
      }

      let questions = processRawData(rawRows);

      // Resolve Topic Serials Synchronously using hscSubjects
      questions = resolveTopicSerialsLocally(questions);

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
      e.target.value = '';
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
      const success = await onImport(toImport);
      if (success) {
        setImportSuccess(true);
        setTimeout(() => onCancel(), 2000);
      }
    } catch {
      alert('ইমপোর্ট করতে ব্যর্থ। আবার চেষ্টা করুন।');
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
          {/* Templates */}
          <div>
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
              টেম্পলেট ডাউনলোড করুন
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  fmt: 'json' as const,
                  icon: FileJson,
                  label: 'JSON',
                  color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
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
                  color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
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

          {/* Upload Area */}
          <label className="relative border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl p-10 text-center hover:border-emerald-500 bg-neutral-50/50 dark:bg-neutral-950/50 cursor-pointer block group transition-all">
            <input
              type="file"
              onChange={handleFile}
              className="hidden"
              accept=".csv,.json,.xlsx,.xls"
            />
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                <FileUp size={28} />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
                ফাইল সিলেক্ট অথবা ড্র্যাগ করুন
              </h3>
              <p className="text-xs text-neutral-500 mb-5">
                JSON, CSV, Excel (.xlsx) — সর্বোচ্চ ৫MB
              </p>
              <div className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all">
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    পার্স করা হচ্ছে...
                  </span>
                ) : (
                  'ফাইল আপলোড করুন'
                )}
              </div>
            </div>
          </label>
        </div>
      </div>
    );
  }

  // ── STEP 2: Review & Import ────────────────────────────────────────
  return (
    <div className="w-full bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-5xl mx-auto overflow-hidden flex flex-col max-h-[95vh]">
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
        <div className="absolute inset-0 bg-white/90 dark:bg-neutral-900/90 z-50 flex flex-col items-center justify-center gap-4">
          <CheckCircle2 size={56} className="text-emerald-500" />
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
            সফলভাবে ইমপোর্ট হয়েছে!
          </p>
        </div>
      )}

      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep(1)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              রিভিউ — {fileName}
            </h2>
            <p className="text-[10px] text-neutral-500">
              {parsedData.length} টি প্রশ্ন পাওয়া গেছে • {validCount} টি
              নির্বাচিত
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500"
        >
          <X size={20} />
        </button>
      </div>

      {/* Stats & Errors */}
      <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={isAllSelected ? clearSelection : selectAll}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline"
          >
            {isAllSelected ? <CheckSquare size={14} /> : <Square size={14} />}
            {isAllSelected ? 'সব বাদ দিন' : 'সব সিলেক্ট'}
          </button>
          {selectedIndices.size > 0 && (
            <button
              onClick={removeSelected}
              className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:underline"
            >
              <Trash2 size={12} />
              নির্বাচিত মুছুন ({selectedIndices.size})
            </button>
          )}
        </div>
        {errorCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-800">
            <AlertCircle size={14} />
            {errorCount} ত্রুটি
          </div>
        )}
      </div>

      {/* Error details */}
      {errorCount > 0 && (
        <div className="px-5 py-3 bg-red-50/50 dark:bg-red-900/5 border-b border-red-100 dark:border-red-900/20">
          <div className="max-h-20 overflow-y-auto space-y-1 custom-scrollbar">
            {errors.map((err, i) => (
              <div
                key={i}
                className="text-[10px] text-red-600 flex items-start gap-2"
              >
                <span className="shrink-0 font-bold">রো {err.row}:</span>
                <span>
                  {err.field} — {err.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {parsedData.map((q, i) => {
          const isSelected = selectedIndices.has(i);
          const hasError = errors.some((err) => err.row === i + 1);

          return (
            <div
              key={i}
              className={`p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30'
                  : 'bg-white border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800'
              } ${hasError ? 'ring-1 ring-amber-400/50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelection(i)}
                  className="mt-1 rounded border-neutral-300 dark:border-neutral-700 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-neutral-400">
                      #{i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewQuestion(q)}
                        className="p-1 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      >
                        <Eye size={12} className="inline mr-1" />
                        দেখুন
                      </button>
                      <button
                        onClick={() => handleEditQuestion(i)}
                        className="p-1 px-2 text-[10px] font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                      >
                        <Edit size={12} className="inline mr-1" />
                        সম্পাদনা
                      </button>
                      <button
                        onClick={() => removeQuestion(i)}
                        className="p-1 px-2 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 size={12} className="inline mr-1" />
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
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold truncate max-w-[180px]">
                        📖 {q.chapter}
                      </span>
                    )}
                    {q.topic && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-bold truncate max-w-[180px]">
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
                              : 'bg-amber-50 text-amber-600'
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

      {/* Footer */}
      <div className="p-4 sm:p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all w-full sm:w-auto"
        >
          পিছে যান
        </button>
        <button
          onClick={handleImport}
          disabled={isProcessing || selectedIndices.size === 0}
          className="px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              ইমপোর্ট হচ্ছে...
            </>
          ) : (
            <>
              <Save size={18} />
              ইমপোর্ট করুন ({selectedIndices.size})
            </>
          )}
        </button>
      </div>
    </div>
  );
};
