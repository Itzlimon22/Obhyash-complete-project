import React, { useState, useMemo } from 'react';
import { Save, X, Trash2 } from 'lucide-react';
import { Question } from '@/lib/types';
import { MathRenderer } from '@/components/common/MathRenderer';
import { ImageUploader } from '@/components/ui/image-uploader';
import {
  getHscSubjectList,
  getHscChapterList,
  getHscTopicList,
  findHscSubject,
  findHscChapter,
} from '@/lib/data/hsc-helpers';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RichTextEditor } from '@/components/admin/questions/rich-text-editor';
import { toast } from 'sonner';
import { standardizeInstituteName } from '@/lib/data/institute-helpers';
import { validateLatex } from '@/lib/latex-utils';

interface QuestionFormProps {
  initialData: Partial<Question>;
  onSave: (q: Partial<Question>) => void;
  onCancel: () => void;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const [data, setData] = useState<Partial<Question>>(initialData);

  const updateOption = (idx: number, val: string) => {
    const opts = [...(data.options || [])];
    opts[idx] = val;
    setData({ ...data, options: opts });
  };

  // --- Synchronous Dropdown Data from hsc.ts (Single Source of Truth) ---
  const availableSubjects = useMemo(() => getHscSubjectList(), []);

  // To ensure the dropdowns work even if ID is passed instead of Name
  const currentSubjectName = data.subject
    ? findHscSubject(data.subject)?.name || data.subject
    : '';
  const currentChapterName =
    data.chapter && currentSubjectName
      ? findHscChapter(data.chapter)?.chapter.name || data.chapter
      : '';
  const currentTopicName = data.topic ? data.topic : '';

  const availableChapters = useMemo(
    () => (currentSubjectName ? getHscChapterList(currentSubjectName) : []),
    [currentSubjectName],
  );

  const availableTopics = useMemo(
    () => (currentChapterName ? getHscTopicList(currentChapterName) : []),
    [currentChapterName],
  );

  const handleSave = () => {
    // ── Input Validation (Crash Prevention) ──
    if (!data.subject?.trim()) {
      toast.error('দয়া করে একটি বিষয় নির্বাচন করো');
      return;
    }
    if (!data.chapter?.trim()) {
      toast.error('দয়া করে একটি অধ্যায় নির্বাচন করো');
      return;
    }
    if (!data.question?.trim() && !data.imageUrl) {
      toast.error('প্রশ্নের বিবরণ বা ছবি খালি রাখা যাবে না');
      return;
    }

    const opts = data.options || ['', '', '', ''];
    const optImgs = data.optionImages || [];
    for (let i = 0; i < opts.length; i++) {
      if (!opts[i]?.trim() && !optImgs[i]) {
        toast.error(`অপশন ${String.fromCharCode(65 + i)} খালি রাখা যাবে না`);
        return;
      }
    }

    if (
      data.correctAnswerIndex === undefined ||
      data.correctAnswerIndex === null ||
      data.correctAnswerIndex < 0
    ) {
      toast.error('সঠিক উত্তর নির্বাচন করো');
      return;
    }

    // --- LaTeX Validation ---
    const questionVal = validateLatex(data.question || '');
    if (!questionVal.isValid) {
      toast.error(`প্রশ্ন: ${questionVal.error}`);
      return;
    }

    const explanationVal = validateLatex(data.explanation || '');
    if (!explanationVal.isValid) {
      toast.error(`ব্যাখ্যা: ${explanationVal.error}`);
      return;
    }

    const optsToValidate = data.options || [];
    for (let i = 0; i < optsToValidate.length; i++) {
      const optVal = validateLatex(optsToValidate[i]);
      if (!optVal.isValid) {
        toast.error(`অপশন ${String.fromCharCode(65 + i)}: ${optVal.error}`);
        return;
      }
    }

    // Standardize institutes
    const rawInstitute = data.institute || data.institutes?.join(',') || '';
    if (rawInstitute) {
      const unifiedInstitutes = rawInstitute
        .split(',')
        .map((s) => standardizeInstituteName(s))
        .filter(Boolean);

      data.institutes = unifiedInstitutes;
      data.institute = unifiedInstitutes[0] || '';
    }

    onSave(data);
  };

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
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 sticky top-0 z-10 shrink-0">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            {data.id ? 'প্রশ্ন সম্পাদনা' : 'নতুন প্রশ্ন তৈরি করো'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 bg-white overflow-y-auto flex-1">
          {/* Metadata & Hierarchy */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-neutral-50 rounded-xl border border-neutral-100">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                বিষয়
              </label>
              <select
                value={currentSubjectName}
                onChange={(e) =>
                  setData({
                    ...data,
                    subject: e.target.value,
                    chapter: '',
                    topic: '',
                  })
                }
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm outline-none"
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                অধ্যায়
              </label>
              <select
                value={currentChapterName}
                onChange={(e) =>
                  setData({ ...data, chapter: e.target.value, topic: '' })
                }
                disabled={!currentSubjectName}
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm outline-none disabled:opacity-50"
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
                value={currentTopicName}
                onChange={(e) => setData({ ...data, topic: e.target.value })}
                disabled={!currentChapterName}
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm outline-none disabled:opacity-50"
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
                  setData({
                    ...data,
                    difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard',
                  })
                }
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm outline-none"
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
                onChange={(e) => setData({ ...data, stream: e.target.value })}
                placeholder="e.g. HSC"
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm outline-none"
              />
            </div>

            {/* Section */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                বিভাগ (Section)
              </label>
              <input
                value={data.section || data.division || ''}
                onChange={(e) => setData({ ...data, section: e.target.value })}
                placeholder="e.g. Science"
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm outline-none"
              />
            </div>

            {/* Exam Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                পরীক্ষার ধরন
              </label>
              <input
                value={data.examType || ''}
                onChange={(e) => setData({ ...data, examType: e.target.value })}
                placeholder="e.g. Medical,Varsity"
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm outline-none"
              />
            </div>

            {/* Year */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                বছর
              </label>
              <input
                value={data.year || ''}
                onChange={(e) => setData({ ...data, year: e.target.value })}
                placeholder="e.g. 2023"
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm outline-none"
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
                  setData({ ...data, institute: e.target.value })
                }
                placeholder="e.g. Buet,Ruet,DMC"
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm outline-none"
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
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold border border-emerald-100">
                    LaTeX Supported ($...$)
                  </span>
                </div>
                <RichTextEditor
                  value={data.question || ''}
                  onChange={(val) => setData({ ...data, question: val })}
                  placeholder="প্রশ্নের বিবরণ লেখো (LaTeX and formatting supported)..."
                />
                {!validateLatex(data.question || '').isValid && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    ⚠ {validateLatex(data.question || '').error}
                  </p>
                )}

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
                  <div className="inline-block mt-2">
                    <ImageUploader
                      folder="questions"
                      compact
                      defaultValue={data.imageUrl}
                      onUploadComplete={(url) => {
                        setData({ ...data, imageUrl: url });
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
                          setData({ ...data, imageUrl: undefined })
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
                  {(data.options || ['', '', '', '']).map((opt, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-1 p-3 rounded-xl border border-neutral-100 bg-neutral-50"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setData({
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
                          <div className="flex-1 w-full relative">
                            <RichTextEditor
                              value={opt}
                              onChange={(val) => updateOption(i, val)}
                              placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            />
                          </div>

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
                                  setData({ ...data, optionImages: newOpts });
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
                            compact
                            onUploadComplete={(url) => {
                              const newOpts = [...(data.optionImages || [])];
                              while (newOpts.length <= i) newOpts.push('');
                              newOpts[i] = url;
                              setData({ ...data, optionImages: newOpts });
                            }}
                          />
                        </div>
                      </div>

                      {/* Option Math Preview */}
                      {opt && (
                        <div className="ml-10 mt-1 pb-1">
                          {!validateLatex(opt).isValid && (
                            <p className="text-[10px] text-red-500 font-bold mb-1">
                              ⚠ {validateLatex(opt).error}
                            </p>
                          )}
                          <div className="text-xs text-neutral-700">
                            <MathRenderer text={opt} />
                          </div>
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
                <div className="inline-block origin-right">
                  <ImageUploader
                    folder="explanations"
                    compact
                    defaultValue={data.explanationImageUrl}
                    onUploadComplete={(url) => {
                      setData({ ...data, explanationImageUrl: url });
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
                      setData({ ...data, explanationImageUrl: undefined })
                    }
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              <RichTextEditor
                value={data.explanation || ''}
                onChange={(val) => setData({ ...data, explanation: val })}
                placeholder="সঠিক উত্তরের ব্যাখ্যা লেখো (LaTeX and formatting supported)..."
              />
              {!validateLatex(data.explanation || '').isValid && (
                <p className="text-[10px] text-red-500 font-bold mt-1">
                  ⚠ {validateLatex(data.explanation || '').error}
                </p>
              )}

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
        <div className="p-5 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3 rounded-b-2xl shrink-0">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors"
          >
            বাতিল করুন
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <Save size={16} /> সংরক্ষণ করুন
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
