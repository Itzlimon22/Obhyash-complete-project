import React, { useState } from 'react';
import { Save, X, Trash2 } from 'lucide-react';
import { Question } from '@/lib/types';
import { MathRenderer } from '@/components/common/MathRenderer';
import { ImageUploader } from '@/components/ui/image-uploader';
import {
  getSubjects,
  getChapters,
  getTopics,
} from '@/services/metadata-service';

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
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-200">
      <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white sticky top-0 z-10 rounded-t-2xl">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
          {data.id ? 'প্রশ্ন সম্পাদনা' : 'নতুন প্রশ্ন তৈরি করুন'}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-6 bg-white">
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
                setData({
                  ...data,
                  subject: e.target.value,
                  chapter: '',
                  topic: '',
                })
              }
              className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm outline-none"
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
                setData({ ...data, chapter: e.target.value, topic: '' })
              }
              disabled={!data.subject}
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
              value={data.topic || ''}
              onChange={(e) => setData({ ...data, topic: e.target.value })}
              disabled={!data.chapter}
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
              onChange={(e) => setData({ ...data, institute: e.target.value })}
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
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold border border-blue-100">
                  LaTeX Supported ($...$)
                </span>
              </div>
              <textarea
                value={data.question || ''}
                onChange={(e) => setData({ ...data, question: e.target.value })}
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
                      onClick={() => setData({ ...data, imageUrl: undefined })}
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
                                const newOpts = [...(data.optionImages || [])];
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

            <textarea
              value={data.explanation || ''}
              onChange={(e) =>
                setData({ ...data, explanation: e.target.value })
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
      <div className="p-5 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3 rounded-b-2xl">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors"
        >
          বাতিল করুন
        </button>
        <button
          onClick={() => onSave(data)}
          className="px-6 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
        >
          <Save size={16} /> সংরক্ষণ করুন
        </button>
      </div>
    </div>
  );
};
