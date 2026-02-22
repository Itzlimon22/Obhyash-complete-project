'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  createQuestion,
  updateQuestion,
  getQuestion,
  getSubjects,
  getChapters,
  getTopics,
  getExamTypes,
} from '@/services/database';
import { Question } from '@/lib/types';
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

export default function NewQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const isEditMode = params?.id && params.id !== 'new';

  const [formData, setFormData] = useState<QuestionFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Dropdown data
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [chapters, setChapters] = useState<{ id: string; name: string }[]>([]);
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);
  const [examTypes, setExamTypes] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  // Load subjects and exam types on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingSubjects(true);
      try {
        const [subs, types] = await Promise.all([
          getSubjects(),
          getExamTypes(),
        ]);
        setSubjects(subs);
        setExamTypes(types);
      } catch (error) {
        console.error('Failed to load subjects/exam types:', error);
      } finally {
        setIsLoadingSubjects(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    // Only load question data if in Edit Mode
    if (isEditMode) {
      const loadQuestion = async () => {
        try {
          const question = await getQuestion(params.id as string);
          if (question) {
            setFormData({
              question: question.question,
              options: question.options,
              correctAnswerIndices: question.correctAnswerIndices || [0],
              explanation: question.explanation || '',
              subject: question.subject,
              chapter: question.chapter || '',
              topic: question.topic || '',
              stream: question.stream || 'HSC',
              division: question.division || 'Science',
              difficulty:
                (question.difficulty as QuestionFormData['difficulty']) ||
                'Medium',
              examType: question.examType || 'Academic',
              institutes: question.institutes || [],
              years: question.years || [],
              imageUrl: question.imageUrl || '',
              optionImages: question.optionImages || [],
              explanationImageUrl: question.explanationImageUrl || '',
            });
          }
        } catch (error) {
          console.error('Failed to load question:', error);
        }
      };
      loadQuestion();
    }
  }, [isEditMode, params.id]);

  // Load chapters when subject changes
  useEffect(() => {
    if (formData.subject) {
      const loadChapters = async () => {
        try {
          const chaps = await getChapters(formData.subject);
          setChapters(chaps);
          setTopics([]); // Reset topics when subject changes
        } catch (error) {
          console.error('Failed to load chapters:', error);
        }
      };
      loadChapters();
    } else {
      setChapters([]);
      setTopics([]);
    }
  }, [formData.subject]);

  // Load topics when chapter changes
  useEffect(() => {
    if (formData.chapter) {
      const loadTopics = async () => {
        try {
          const tops = await getTopics(formData.chapter);
          setTopics(tops);
        } catch (error) {
          console.error('Failed to load topics:', error);
        }
      };
      loadTopics();
    } else {
      setTopics([]);
    }
  }, [formData.chapter]);

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
      setNotification({ type: 'error', message: 'Question text is required' });
      return;
    }
    if (!formData.subject) {
      setNotification({ type: 'error', message: 'Subject is required' });
      return;
    }

    const validOptions = formData.options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      setNotification({
        type: 'error',
        message: 'At least 2 valid options are required',
      });
      return;
    }

    // Better strategy: Filter empty options AND re-map indices safely
    const finalOptions: string[] = [];
    const finalIndices: number[] = [];

    formData.options.forEach((opt, originalIdx) => {
      if (opt.trim()) {
        finalOptions.push(opt.trim());
        // If this original index was a correct answer, new index is (finalOptions.length - 1)
        if (formData.correctAnswerIndices.includes(originalIdx)) {
          finalIndices.push(finalOptions.length - 1);
        }
      }
    });

    if (finalOptions.length < 2) {
      setNotification({
        type: 'error',
        message: 'Please provide at least 2 non-empty options.',
      });
      return;
    }

    if (finalIndices.length === 0) {
      setNotification({
        type: 'error',
        message: 'Please mark at least one correct answer.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const questionData: Partial<Question> = {
        question: formData.question,
        options: finalOptions,
        correctAnswerIndices: finalIndices,
        correctAnswer: finalOptions[finalIndices[0]] || '', // Legacy
        correctAnswerIndex: finalIndices[0], // Legacy
        explanation: formData.explanation,
        subject: formData.subject,
        chapter: formData.chapter,
        topic: formData.topic,
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
        status: 'Pending',
        // Auto-generate random_id is handled in service
      };

      const result = isEditMode
        ? await updateQuestion(params.id as string, questionData)
        : await createQuestion(questionData);

      if (result.success) {
        setNotification({
          type: 'success',
          message: isEditMode
            ? 'Question updated successfully!'
            : 'Question created successfully!',
        });

        if (!isEditMode) {
          // Reset form for next entry, but keep some context like Subject/Chapter for faster data entry
          setFormData((prev) => ({
            ...defaultFormData,
            subject: prev.subject,
            chapter: prev.chapter,
            topic: prev.topic,
            stream: prev.stream,
            division: prev.division,
            examType: prev.examType,
          }));
          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          router.push('/admin/question-management');
        }
      } else {
        setNotification({ type: 'error', message: `Failed: ${result.error}` });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectClassName =
    'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* ... existing header content ... */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {isEditMode ? 'Edit Question' : 'New Question'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-medium"
            >
              <Eye className="w-4 h-4" /> {showPreview ? 'Hide' : 'Show'}{' '}
              Preview
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditMode ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Notifications */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 shadow-sm animate-in slide-in-from-top-2 ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p className="font-medium">{notification.message}</p>
          </div>
        )}

        <div
          className={`grid ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6`}
        >
          {/* Editor */}
          <div className="space-y-6">
            {/* Question */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Question *
              </label>
              <RichTextEditor
                value={formData.question}
                onChange={(val) => handleChange('question', val)}
                placeholder="Enter your question (supports LaTeX and formatting)..."
              />
            </div>

            {/* Options */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Options *
                </label>
                <button
                  onClick={addOption}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" /> Add Option
                </button>
              </div>
              <div className="space-y-3">
                {formData.options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCorrectAnswer(idx)}
                      className={`p-2 rounded-full transition ${formData.correctAnswerIndices.includes(idx) ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-600'}`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <div className="flex-1 w-full relative">
                      <RichTextEditor
                        value={option}
                        onChange={(val) => handleOptionChange(idx, val)}
                        placeholder={`Option ${idx + 1}`}
                      />
                    </div>
                    {formData.options.length > 2 && (
                      <button
                        onClick={() => removeOption(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Click checkmark to mark correct answer(s). Multiple can be
                selected.
              </p>
            </div>

            {/* Explanation */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Explanation (Optional)
              </label>
              <RichTextEditor
                value={formData.explanation}
                onChange={(val) => handleChange('explanation', val)}
                placeholder="Enter explanation (supports LaTeX and formatting)..."
              />
            </div>

            {/* Metadata with Dropdowns */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                Metadata
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Subject Dropdown */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Subject *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    className={selectClassName}
                    disabled={isLoadingSubjects}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chapter Dropdown */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Chapter
                  </label>
                  <select
                    value={formData.chapter}
                    onChange={(e) => handleChange('chapter', e.target.value)}
                    className={selectClassName}
                    disabled={!formData.subject || chapters.length === 0}
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map((chap) => (
                      <option key={chap.id} value={chap.id}>
                        {chap.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic Dropdown */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Topic
                  </label>
                  <select
                    value={formData.topic}
                    onChange={(e) => handleChange('topic', e.target.value)}
                    className={selectClassName}
                    disabled={!formData.chapter || topics.length === 0}
                  >
                    <option value="">Select Topic</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stream */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Stream
                  </label>
                  <select
                    value={formData.stream}
                    onChange={(e) => handleChange('stream', e.target.value)}
                    className={selectClassName}
                  >
                    <option>HSC</option>
                    <option>SSC</option>
                    <option>Admission</option>
                  </select>
                </div>

                {/* Division */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Division
                  </label>
                  <select
                    value={formData.division}
                    onChange={(e) => handleChange('division', e.target.value)}
                    className={selectClassName}
                  >
                    <option>Science</option>
                    <option>Humanities</option>
                    <option>Business Studies</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Difficulty
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

                {/* Institutes */}
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">
                    Institutes (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dhaka College, Rajuk College"
                    value={formData.institutes.join(', ')}
                    onChange={(e) =>
                      handleChange(
                        'institutes',
                        e.target.value.split(',').map((s) => s.trim()),
                      )
                    }
                    className={selectClassName}
                  />
                </div>

                {/* Years */}
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">
                    Years (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2023, 2024"
                    value={formData.years.join(', ')}
                    onChange={(e) =>
                      handleChange(
                        'years',
                        e.target.value
                          .split(',')
                          .map((s) => parseInt(s.trim()) || 0)
                          .filter((y) => y > 0),
                      )
                    }
                    className={selectClassName}
                  />
                </div>

                {/* Exam Type Dropdown */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Exam Type
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
              </div>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="sticky top-24 h-fit">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
                  Live Preview (Exam Card)
                </h3>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  {/* Question Number */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full text-sm font-bold">
                      1
                    </span>
                    <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                      {formData.difficulty}
                    </span>
                  </div>

                  {/* Question Text */}
                  <p className="text-lg font-medium text-slate-900 dark:text-white mb-6 whitespace-pre-wrap">
                    {formData.question || 'Your question will appear here...'}
                  </p>

                  {/* Options */}
                  <div className="space-y-3">
                    {formData.options
                      .filter((o) => o.trim())
                      .map((opt, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border-2 transition ${
                            formData.correctAnswerIndices.includes(idx)
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                                formData.correctAnswerIndices.includes(idx)
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 dark:bg-slate-600'
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span
                              className={
                                formData.correctAnswerIndices.includes(idx)
                                  ? 'font-medium text-emerald-700 dark:text-emerald-300'
                                  : ''
                              }
                            >
                              {opt}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Explanation */}
                  {formData.explanation && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Explanation
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                        {formData.explanation}
                      </p>
                    </div>
                  )}

                  {/* Metadata Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 text-xs text-slate-500">
                    {formData.subject && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                        {subjects.find((s) => s.id === formData.subject)
                          ?.name || formData.subject}
                      </span>
                    )}
                    {formData.chapter && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                        {chapters.find((c) => c.id === formData.chapter)
                          ?.name || formData.chapter}
                      </span>
                    )}
                    {formData.topic && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                        {topics.find((t) => t.id === formData.topic)?.name ||
                          formData.topic}
                      </span>
                    )}
                    {formData.examType && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                        {formData.examType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
