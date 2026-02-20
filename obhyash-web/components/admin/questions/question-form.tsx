import React, { useState } from 'react';
import { Save, X, ChevronDown, Loader2 } from 'lucide-react'; // Loader2 যোগ করা হয়েছে
import { Question } from '@/lib/types';
import { MathText, RichText } from './shared';
import { RichTextEditor } from './rich-text-editor';
import { useFileUpload } from '@/hooks/use-file-upload'; // ✅ Import Hook
import Image from 'next/image';
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

// Helper for Input Labels
const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 font-sans">
    {children}
  </label>
);

// Helper for Input Fields
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full px-3 py-2 rounded-lg border border-paper-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-950 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-gray-400 dark:text-gray-200"
  />
);

export const QuestionForm: React.FC<QuestionFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const [data, setData] = useState<Partial<Question>>(initialData);
  const { uploadFile, isUploading } = useFileUpload(); // ✅ Hook ব্যবহার

  // --- Data State for Dropdowns ---
  const [availableSubjects, setAvailableSubjects] = useState<
    { id: string; name: string }[]
  >([]);
  const [availableChapters, setAvailableChapters] = useState<
    { id: string; name: string }[]
  >([]);
  const [availableTopics, setAvailableTopics] = useState<
    { id: string; name: string }[]
  >([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // 1. Fetch Subjects on Mount
  React.useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsLoadingMetadata(true);
        const subjects = await getSubjects();
        // The service returns objects with `{ id, name, label, icon }`
        setAvailableSubjects(
          subjects.map((s) => ({
            id: s.id,
            name: (s as any).rawName || s.name,
          })),
        );
      } catch (err) {
        console.error('Failed to load subjects:', err);
      } finally {
        setIsLoadingMetadata(false);
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
        // Find subject ID
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
        // Find chapter ID
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

  // --- ইমেজ আপলোড হ্যান্ডলার ---
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'imageUrl' | 'explanationImageUrl' | { optionIndex: number },
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ফাইল আপলোড শুরু
    const publicUrl = await uploadFile(file);
    console.log('Upload finished. Public URL:', publicUrl);

    if (publicUrl) {
      if (field === 'imageUrl') {
        console.log('Setting imageUrl:', publicUrl);
        setData((prev) => ({ ...prev, imageUrl: publicUrl }));
      } else if (field === 'explanationImageUrl') {
        setData((prev) => ({ ...prev, explanationImageUrl: publicUrl }));
      } else if (typeof field === 'object') {
        const newOptionImages = [...(data.optionImages || [])];
        // Ensure array size
        while (newOptionImages.length <= field.optionIndex)
          newOptionImages.push('');

        newOptionImages[field.optionIndex] = publicUrl;
        setData((prev) => ({ ...prev, optionImages: newOptionImages }));
      }
    } else {
      console.error('Upload failed: publicUrl is null');
    }
  };

  return (
    <div className="bg-white dark:bg-obsidian-900 rounded-2xl border border-paper-200 dark:border-obsidian-800 shadow-xl max-w-4xl mx-auto animate-fade-in relative overflow-hidden">
      {/* গ্লোবাল লোডিং ওভারলে (যদি আপলোড চলে) */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-obsidian-800 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
            <Loader2 className="animate-spin text-brand-600" />
            <span className="text-sm font-medium">ছবি আপলোড হচ্ছে...</span>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 border-b border-paper-200 dark:border-obsidian-800 flex justify-between items-center bg-white dark:bg-obsidian-900 sticky top-0 z-20">
        <h2 className="text-base sm:text-lg font-bold text-paper-900 dark:text-white">
          {data.id ? 'প্রশ্ন এডিট করুন' : 'নতুন প্রশ্ন তৈরি করুন'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-paper-100 dark:hover:bg-obsidian-800 rounded-full text-gray-500 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        {/* মেটাডাটা গ্রিড */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          <div>
            <Label>স্ট্রিম (Stream)</Label>
            <Input
              value={data.stream || ''}
              onChange={(e) => setData({ ...data, stream: e.target.value })}
              placeholder="যেমন: Science"
            />
          </div>
          <div>
            <Label>বিষয় (Subject)</Label>
            <div className="relative">
              <select
                value={data.subject || ''}
                onChange={(e) => {
                  setData({
                    ...data,
                    subject: e.target.value,
                    chapter: '',
                    topic: '',
                  });
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-paper-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-950 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none appearance-none cursor-pointer dark:text-gray-200"
              >
                <option value="">নির্বাচন করুন</option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
          <div>
            <Label>অধ্যায় (Chapter)</Label>
            <div className="relative">
              <select
                value={data.chapter || ''}
                onChange={(e) =>
                  setData({ ...data, chapter: e.target.value, topic: '' })
                }
                disabled={!data.subject}
                className="w-full px-3 py-2.5 rounded-xl border border-paper-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-950 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none appearance-none cursor-pointer dark:text-gray-200 disabled:opacity-50"
              >
                <option value="">নির্বাচন করুন</option>
                {availableChapters.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
          <div>
            <Label>টপিক (Topic)</Label>
            <div className="relative">
              <select
                value={data.topic || ''}
                onChange={(e) => setData({ ...data, topic: e.target.value })}
                disabled={!data.chapter}
                className="w-full px-3 py-2.5 rounded-xl border border-paper-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-950 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none appearance-none cursor-pointer dark:text-gray-200 disabled:opacity-50"
              >
                <option value="">নির্বাচন করুন</option>
                {availableTopics.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
          <div>
            <Label>কঠিন্য (Difficulty)</Label>
            <div className="relative">
              <select
                value={data.difficulty || 'Medium'}
                onChange={(e) =>
                  setData({
                    ...data,
                    difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard',
                  })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-paper-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-950 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none appearance-none cursor-pointer dark:text-gray-200"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* প্রশ্ন লেখার এরিয়া */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-0">
            <h3 className="text-sm font-semibold text-paper-900 dark:text-white">
              মূল প্রশ্ন (Question Content)
            </h3>
            <span className="self-start sm:self-auto text-[10px] font-medium px-2 py-0.5 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 rounded border border-brand-100 dark:border-brand-800">
              LaTeX সমর্থিত ($...$)
            </span>
          </div>
          <RichTextEditor
            value={data.question || ''}
            onChange={(val) => setData({ ...data, question: val })}
            placeholder="আপনার প্রশ্নটি এখানে লিখুন..."
          />
        </div>

        {/* Live Preview */}
        {data.question && (
          <div className="p-4 rounded-xl border border-paper-200 dark:border-obsidian-800 bg-paper-50 dark:bg-obsidian-950/50">
            <Label>প্রিভিউ (Preview)</Label>
            <div className="text-sm text-paper-900 dark:text-gray-200 min-h-[20px] mt-1 overflow-x-auto">
              <RichText text={data.question} />
            </div>
          </div>
        )}

        <div>
          <Label>প্রশ্নের ছবি (Question Image)</Label>
          <div className="mt-2 text-center">
            <UploadBox
              image={data.imageUrl}
              onUpload={(e) => handleImageUpload(e, 'imageUrl')}
              onRemove={() => setData({ ...data, imageUrl: undefined })}
            />
          </div>
        </div>

        {/* অপশন সমূহ (Options) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-paper-900 dark:text-white">
            অপশন সমূহ (Options)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-paper-200 dark:border-obsidian-800 bg-paper-50/50 dark:bg-obsidian-900/50 flex flex-col gap-3"
              >
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-paper-200 dark:bg-obsidian-800 flex items-center justify-center text-[10px] font-bold text-gray-500 mt-1 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <textarea
                    value={data.options?.[idx] || ''}
                    onChange={(e) => {
                      const newOptions = [
                        ...(data.options || ['', '', '', '']),
                      ];
                      newOptions[idx] = e.target.value;
                      setData({ ...data, options: newOptions });
                    }}
                    className="flex-1 bg-transparent text-sm outline-none resize-none h-16 text-paper-900 dark:text-gray-200 placeholder:text-gray-400 leading-relaxed"
                    placeholder={`অপশন ${String.fromCharCode(65 + idx)}`}
                  />
                </div>
                {/* অপশন ইমেজ আপলোড */}
                <div className="pl-9">
                  <UploadBox
                    height="h-20"
                    label="IMG"
                    image={data.optionImages?.[idx]}
                    onUpload={(e) => handleImageUpload(e, { optionIndex: idx })}
                    onRemove={() => {
                      const newImgs = [...(data.optionImages || [])];
                      newImgs[idx] = '';
                      setData({ ...data, optionImages: newImgs });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* সঠিক উত্তর ও ব্যাখ্যা */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20">
            <Label>সঠিক উত্তর (Correct Answer)</Label>
            <div className="relative mt-2">
              <select
                value={data.correctAnswer || ''}
                onChange={(e) =>
                  setData({ ...data, correctAnswer: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-obsidian-950 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none cursor-pointer dark:text-gray-200"
              >
                <option value="">সঠিক উত্তর নির্বাচন করুন</option>
                {(data.options || []).map((opt, i) => (
                  <option key={i} value={opt || `Option ${i + 1}`}>
                    অপশন {String.fromCharCode(65 + i)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none"
              />
            </div>
          </div>

          <div>
            <Label>ব্যাখ্যা (Explanation Image)</Label>
            <div className="mt-2 text-center">
              <UploadBox
                height="h-24"
                label="ব্যাখ্যার ছবি আপলোড করুন"
                image={data.explanationImageUrl}
                onUpload={(e) => handleImageUpload(e, 'explanationImageUrl')}
                onRemove={() =>
                  setData({ ...data, explanationImageUrl: undefined })
                }
              />
            </div>
          </div>
        </div>

        <div>
          <Label>ব্যাখ্যা টেক্সট (Explanation Text)</Label>
          <textarea
            rows={4}
            value={data.explanation || ''}
            onChange={(e) => setData({ ...data, explanation: e.target.value })}
            className="w-full px-4 py-3.5 mt-2 rounded-2xl border border-paper-200 dark:border-obsidian-700 bg-white dark:bg-obsidian-950 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-y placeholder:text-gray-400 dark:text-gray-200 leading-relaxed"
            placeholder="গাণিতিক ব্যাখ্যা দিন..."
          />
        </div>
      </div>

      <div className="p-4 sm:p-6 border-t border-paper-200 dark:border-obsidian-800 flex flex-col sm:flex-row justify-end gap-3 bg-paper-50 dark:bg-obsidian-950">
        <button
          onClick={onCancel}
          disabled={isUploading}
          className="order-2 sm:order-1 px-6 py-3 rounded-xl border border-paper-300 dark:border-obsidian-700 bg-white dark:bg-obsidian-900 text-gray-700 dark:text-gray-300 font-medium hover:bg-paper-50 dark:hover:bg-obsidian-800 transition-colors w-full sm:w-auto"
        >
          বাতিল করুন
        </button>
        <button
          onClick={() => onSave(data)}
          disabled={isUploading}
          className="order-1 sm:order-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 w-full sm:w-auto"
        >
          <Save size={18} /> সংরক্ষণ করুন
        </button>
      </div>
    </div>
  );
};

// --- Reusable Upload Box ---
import { Trash2, Image as ImageIcon } from 'lucide-react';

const UploadBox: React.FC<{
  label?: string;
  height?: string;
  image?: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}> = ({ label, height = 'h-32', image, onUpload, onRemove }) => (
  <div
    className={`relative w-full ${height} border-2 border-dashed ${image ? 'border-brand-500/50' : 'border-paper-300 dark:border-obsidian-700 hover:border-brand-400 dark:hover:border-brand-600'} rounded-2xl flex flex-col items-center justify-center transition-colors bg-paper-50/50 dark:bg-obsidian-950/30 overflow-hidden group`}
  >
    {image ? (
      <>
        <Image
          src={image}
          alt="Preview"
          className="w-full h-full object-contain p-2"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <button
            onClick={onRemove}
            className="bg-red-500 text-white p-2.5 rounded-full hover:bg-red-600 transition-colors shadow-lg"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </>
    ) : (
      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-400 hover:text-brand-500 dark:hover:text-brand-400">
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={onUpload}
        />
        <ImageIcon size={22} className="mb-1.5 opacity-50" />
        <span className="text-[11px] font-bold uppercase tracking-wider">
          {label || 'Upload'}
        </span>
      </label>
    )}
  </div>
);
