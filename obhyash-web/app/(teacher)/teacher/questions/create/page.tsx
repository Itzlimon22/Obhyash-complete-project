'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import {
  getHscSubjectList,
  getHscChapterList,
  getHscTopicList,
  resolveTaxonomyHierarchy,
} from '@/lib/data/hsc-helpers';
import {
  createQuestion,
  getSubjects,
  getChapters,
  getTopics,
  getExamTypes,
} from '@/services/database';
import { Question } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { RichTextEditor } from '@/components/admin/questions/rich-text-editor';

type QuestionFormData = {
  question: string;
  options: string[];
  correctAnswerIndices: number[];
  explanation: string;
  subject: string;
  chapter: string;
  topic: string;
  stream: string;
  division: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  examType: string;
  institutes: string[];
  years: number[];
  imageUrl: string;
  optionImages: string[];
  explanationImageUrl: string;
};

const defaultFormData: QuestionFormData = {
  question: '',
  options: ['', '', '', ''],
  correctAnswerIndices: [0],
  explanation: '',
  subject: '',
  chapter: '',
  topic: '',
  stream: 'HSC',
  division: 'Science',
  difficulty: 'Medium',
  examType: 'Academic',
  institutes: [],
  years: [],
  imageUrl: '',
  optionImages: [],
  explanationImageUrl: '',
};

export default function TeacherCreateQuestionPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState<QuestionFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const [examTypes, setExamTypes] = useState<{ id: string; name: string }[]>(
    [],
  );

  // Load exam types on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const types = await getExamTypes();
        setExamTypes(types);
      } catch (error) {
        console.error('Failed to load exam types:', error);
      }
    };
    loadInitialData();
  }, []);

  const subjects = getHscSubjectList();
  const chapters = formData.subject ? getHscChapterList(formData.subject) : [];
  const topics = formData.chapter ? getHscTopicList(formData.chapter) : [];
  const isLoadingSubjects = false;

  const handleChange = (
    field: keyof QuestionFormData,
    value: QuestionFormData[keyof QuestionFormData],
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset dependent fields
      if (field === 'subject') {
        updated.chapter = '';
        updated.topic = '';
      } else if (field === 'chapter') {
        updated.topic = '';
      }
      return updated;
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData((prev) => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setFormData((prev) => ({ ...prev, options: [...prev.options, ''] }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) return;
    const newOptions = formData.options.filter((_, i) => i !== index);
    const newCorrect = formData.correctAnswerIndices
      .filter((i) => i !== index)
      .map((i) => (i > index ? i - 1 : i));
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
      correctAnswerIndices: newCorrect.length ? newCorrect : [0],
    }));
  };

  const toggleCorrectAnswer = (index: number) => {
    const current = formData.correctAnswerIndices;
    const newIndices = current.includes(index)
      ? current.filter((i) => i !== index)
      : [...current, index];
    if (newIndices.length === 0) newIndices.push(0);
    setFormData((prev) => ({ ...prev, correctAnswerIndices: newIndices }));
  };

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSubmit = async () => {
    setNotification(null);

    // Validation
    if (!formData.question.trim()) {
      setNotification({ type: 'error', message: 'প্রশ্নের বিবরণ আবশ্যক' });
      return;
    }
    if (!formData.subject) {
      setNotification({ type: 'error', message: 'বিষয় নির্বাচন আবশ্যক' });
      return;
    }

    const validOptions = formData.options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      setNotification({
        type: 'error',
        message: 'কমপক্ষে ২টি অপশন আবশ্যক',
      });
      return;
    }

    const finalOptions: string[] = [];
    const finalIndices: number[] = [];

    formData.options.forEach((opt, originalIdx) => {
      if (opt.trim()) {
        finalOptions.push(opt.trim());
        if (formData.correctAnswerIndices.includes(originalIdx)) {
          finalIndices.push(finalOptions.length - 1);
        }
      }
    });

    if (finalOptions.length < 2) {
      setNotification({
        type: 'error',
        message: 'কমপক্ষে ২টি সঠিক অপশন দিন।',
      });
      return;
    }

    if (finalIndices.length === 0) {
      setNotification({
        type: 'error',
        message: 'কমপক্ষে ১টি সঠিক উত্তর নির্বাচন করো।',
      });
      return;
    }

    if (!user?.email) {
      setNotification({
        type: 'error',
        message: 'ব্যবহারকারী সনাক্ত করা যায়নি। লগইন করো।',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Resolve canonical names and IDs
      const {
        subject: subjName,
        chapter: chapName,
        topic: topName,
      } = resolveTaxonomyHierarchy(
        formData.subject,
        formData.chapter,
        formData.topic,
      );

      const questionData: Partial<Question> = {
        question: formData.question,
        options: finalOptions,
        correctAnswerIndices: finalIndices,
        correctAnswer: finalOptions[finalIndices[0]] || '',
        correctAnswerIndex: finalIndices[0],
        explanation: formData.explanation,
        subject: subjName,
        subjectId: formData.subject,
        chapter: chapName,
        chapterId: formData.chapter,
        topic: topName,
        topicId: formData.topic,
        stream: formData.stream,
        division: formData.division,
        difficulty: formData.difficulty,
        examType: formData.examType,
        institutes: formData.institutes,
        years: formData.years,
        imageUrl: formData.imageUrl,
        optionImages: formData.optionImages,
        explanationImageUrl: formData.explanationImageUrl,
        type: 'MCQ',
        status: 'Pending', // Teachers always create pending questions
        author: user.email, // Associate validation
        authorName: user.user_metadata?.name || 'Teacher',
        createdAt: new Date().toISOString(),
      };

      const result = await createQuestion(questionData);

      if (result.success) {
        setNotification({
          type: 'success',
          message:
            'প্রশ্নটি সফলভাবে তৈরি করা হয়েছে! এটি অনুমোদনের জন পাঠাওো হয়েছে।',
        });

        // Reset form but keep context
        setFormData((prev) => ({
          ...defaultFormData,
          subject: prev.subject,
          chapter: prev.chapter,
          topic: prev.topic,
          stream: prev.stream,
          division: prev.division,
          examType: prev.examType,
        }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setNotification({
          type: 'error',
          message: `ব্যর্থ হয়েছে: ${result.error}`,
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: `ত্রুটি: ${error instanceof Error ? error.message : 'অজানা ত্রুটি'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectClassName =
    'w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none';

  const inputClassName =
    'w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-emerald-900/10 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => router.back()}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-emerald-100" />
            </button>
            <h1 className="text-2xl font-black">নতুন প্রশ্ন তৈরি করো</h1>
          </div>
          <p className="text-emerald-100 text-sm ml-1">
            শিক্ষার্থীদের জন্য একটি নতুন প্রশ্ন যোগ করো।
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-100 rounded-xl text-sm font-bold border border-emerald-700/50 transition-all"
          >
            <Eye className="w-4 h-4" />{' '}
            {showPreview ? 'প্রিভিউ বন্ধ' : 'প্রিভিউ দেখো'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-neutral-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-all"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            সাবমিট করো
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm animate-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="font-bold text-sm">{notification.message}</p>
        </div>
      )}

      <div
        className={`grid ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6`}
      >
        {/* ── Editor Column ── */}
        <div className="space-y-6">
          {/* Question Text */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              প্রশ্ন (Question) *
            </label>
            <RichTextEditor
              value={formData.question}
              onChange={(val) => handleChange('question', val)}
              placeholder="আপনার প্রশ্নটি এখানে লেখো (supports LaTeX and formatting)..."
            />
          </div>

          {/* Options */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                অপশনসমূহ (Options) *
              </label>
              <button
                onClick={addOption}
                className="flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> অপশন যোগ করো
              </button>
            </div>

            <div className="space-y-3">
              {formData.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-3 group">
                  <button
                    onClick={() => toggleCorrectAnswer(idx)}
                    className={`
                        w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 border-2
                        ${
                          formData.correctAnswerIndices.includes(idx)
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-emerald-400'
                        }
                      `}
                    title="সঠিক উত্তর হিসেবে মার্ক করো"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <div className="flex-1 w-full relative">
                    <RichTextEditor
                      value={option}
                      onChange={(val) => handleOptionChange(idx, val)}
                      placeholder={`অপশন ${String.fromCharCode(65 + idx)}`}
                    />
                  </div>
                  {formData.options.length > 2 && (
                    <button
                      onClick={() => removeOption(idx)}
                      className="p-3 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-neutral-500 font-medium">
              * সঠিক উত্তরের বাম পাশের টিক চিহ্নে ক্লিক করো। একাধিক সঠিক উত্তর
              নির্বাচন করা যাবে।
            </p>
          </div>

          {/* Metadata */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-emerald-600" />
              <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                শ্রেণী ও বিষয় তথ্য
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subject Dropdown */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase">
                  বিষয় (Subject) *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  className={selectClassName}
                  disabled={isLoadingSubjects}
                >
                  <option value="">বিষয় নির্বাচন করো</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter Dropdown */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase">
                  অধ্যায় (Chapter)
                </label>
                <select
                  value={formData.chapter}
                  onChange={(e) => handleChange('chapter', e.target.value)}
                  className={selectClassName}
                  disabled={!formData.subject || chapters.length === 0}
                >
                  <option value="">অধ্যায় নির্বাচন করো</option>
                  {chapters.map((chap) => (
                    <option key={chap.id} value={chap.id}>
                      {chap.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Dropdown */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase">
                  টপিক (Topic)
                </label>
                <select
                  value={formData.topic}
                  onChange={(e) => handleChange('topic', e.target.value)}
                  className={selectClassName}
                  disabled={!formData.chapter || topics.length === 0}
                >
                  <option value="">টপিক নির্বাচন করো</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Type */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase">
                  পরীক্ষার ধরণ (Exam Type)
                </label>
                <select
                  value={formData.examType}
                  onChange={(e) => handleChange('examType', e.target.value)}
                  className={selectClassName}
                >
                  {examTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase">
                  কঠিন্য (Difficulty)
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    handleChange(
                      'difficulty',
                      e.target.value as QuestionFormData['difficulty'],
                    )
                  }
                  className={selectClassName}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              ব্যাখ্যা (Explanation) - অপশনাল
            </label>
            <RichTextEditor
              value={formData.explanation}
              onChange={(val) => handleChange('explanation', val)}
              placeholder="সঠিক উত্তরের ব্যাখ্যা লেখো (supports LaTeX and formatting)..."
            />
          </div>
        </div>

        {/* ── Preview Column ── */}
        {showPreview && (
          <div className="space-y-6">
            <div className="sticky top-6">
              <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl shadow-xl p-1 border border-neutral-700 text-white">
                <div className="bg-neutral-950 rounded-xl p-6">
                  <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-6">
                    LIVE PREVIEW
                  </h3>

                  {/* Exam Card Preview */}
                  <div className="font-serif">
                    <div className="flex items-start gap-4 mb-4">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-neutral-800 text-neutral-300 rounded-full text-sm font-bold font-sans">
                        01
                      </span>
                      <div className="flex-1">
                        <div className="text-lg font-medium text-neutral-200 leading-relaxed mb-6 whitespace-pre-wrap">
                          {formData.question || (
                            <span className="text-neutral-600 italic">
                              আপনার প্রশ্নটি এখানে দেখা যাবে...
                            </span>
                          )}
                        </div>

                        <div className="space-y-3 font-sans">
                          {formData.options
                            .filter((o) => o.trim())
                            .map((opt, idx) => (
                              <div
                                key={idx}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  formData.correctAnswerIndices.includes(idx)
                                    ? 'border-emerald-500/50 bg-emerald-500/10'
                                    : 'border-neutral-800 bg-neutral-900/50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                                      formData.correctAnswerIndices.includes(
                                        idx,
                                      )
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-neutral-800 text-neutral-500'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  <span
                                    className={
                                      formData.correctAnswerIndices.includes(
                                        idx,
                                      )
                                        ? 'text-emerald-400 font-medium'
                                        : 'text-neutral-400'
                                    }
                                  >
                                    {opt}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Explanation Preview */}
                    {formData.explanation && (
                      <div className="mt-8 pt-6 border-t border-neutral-800">
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
                          ব্যাখ্যা
                        </h4>
                        <p className="text-sm text-neutral-400 leading-relaxed font-sans bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                          {formData.explanation}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="mt-6 flex flex-wrap gap-2 font-sans">
                      {formData.subject && (
                        <span className="px-2 py-1 rounded-md bg-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                          {subjects.find((s) => s.id === formData.subject)
                            ?.name || formData.subject}
                        </span>
                      )}
                      <span className="px-2 py-1 rounded-md bg-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                        {formData.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-4">
                <p className="text-xs text-neutral-500">
                  এটি শিক্ষার্থীরা পরীক্ষার হলে যেমন দেখবে তার একটি প্রিভিউ
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
