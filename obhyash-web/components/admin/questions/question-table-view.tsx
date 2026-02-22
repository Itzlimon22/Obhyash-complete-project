import React, { useState, useEffect } from 'react';
import { Question } from '@/lib/types';
import { MathRenderer } from '@/components/common/MathRenderer';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  getHscSubjectList,
  getHscChapterList,
  getHscTopicList,
  resolveSubjectName,
  resolveChapterName,
  resolveTopicName,
} from '@/lib/data/hsc-helpers';
import { Trash2, Edit, Copy } from 'lucide-react';

interface QuestionTableViewProps {
  questions: Question[];
  selectedQuestions: Set<string>;
  onEdit: (q: Question) => void;
  onDelete: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  fontSize: number;
  saveQuestion: (q: Partial<Question>) => Promise<boolean>;
}

const EditableRow = ({
  question,
  isSelected,
  onToggle,
  onEdit,
  onDelete,
  onSave,
  onPreviewQuestion,
}: {
  question: Question;
  isSelected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (q: Partial<Question>) => void;
  onPreviewQuestion: (q: Question) => void;
}) => {
  const [localQ, setLocalQ] = useState<Question>(question);

  useEffect(() => {
    setLocalQ(question);
  }, [question]);

  const handleBlur = () => {
    if (JSON.stringify(localQ) !== JSON.stringify(question)) {
      onSave(localQ);
    }
  };

  const updateField = (field: keyof Question, value: any) => {
    setLocalQ((prev) => ({ ...prev, [field]: value }));
  };

  const updateOption = (index: number, value: string) => {
    const newOpts = [...(localQ.options || [])];
    while (newOpts.length <= index) newOpts.push('');
    newOpts[index] = value;
    setLocalQ((prev) => ({ ...prev, options: newOpts }));
  };

  const updateAnswerKey = (letter: string) => {
    // Force lowercase index matching logic to match previous bulk uploader
    const idx = letter.toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < (localQ.options?.length || 4)) {
      setLocalQ((prev) => ({
        ...prev,
        correctAnswerIndex: idx,
        correctAnswer: prev.options?.[idx] || '',
        correctAnswerIndices: [idx],
      }));
    }
  };

  const getAnswerLetter = () => {
    if (typeof localQ.correctAnswerIndex === 'number') {
      return String.fromCharCode(65 + localQ.correctAnswerIndex);
    }
    if (
      Array.isArray(localQ.correctAnswerIndices) &&
      localQ.correctAnswerIndices.length > 0
    ) {
      return String.fromCharCode(65 + localQ.correctAnswerIndices[0]);
    }
    // Fallback if correctAnswer is present but index is missing
    if (localQ.correctAnswer && localQ.options) {
      const idx = localQ.options.findIndex(
        (o) => o?.trim() === localQ.correctAnswer?.trim(),
      );
      if (idx !== -1) return String.fromCharCode(65 + idx);
    }
    return '';
  };

  const cleanSubject = (localQ.subject || '').trim();
  const canonicalSubject = cleanSubject
    ? resolveSubjectName(cleanSubject) || cleanSubject
    : '';
  const cleanChapter = (localQ.chapter || '').trim();
  const canonicalChapter = cleanChapter
    ? resolveChapterName(canonicalSubject, cleanChapter) || cleanChapter
    : '';
  const cleanTopic = (localQ.topic || '').trim();
  const canonicalTopic = cleanTopic
    ? resolveTopicName(canonicalChapter, cleanTopic) || cleanTopic
    : '';

  const availableSubjects = getHscSubjectList();
  const availableChapters = canonicalSubject
    ? getHscChapterList(canonicalSubject)
    : [];
  const availableTopics = canonicalChapter
    ? getHscTopicList(canonicalChapter)
    : [];

  const tdClass =
    'border border-neutral-300 dark:border-neutral-600 p-1 align-top relative';
  const inputClass =
    'w-full min-w-[80px] h-full bg-transparent border-none outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1';

  return (
    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
      <td className="border border-neutral-300 dark:border-neutral-600 p-2 text-center align-middle">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="cursor-pointer"
        />
      </td>
      <td className={`${tdClass} text-center align-middle`}>
        <button
          onClick={() => navigator.clipboard.writeText(localQ.id!)}
          className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md text-neutral-500 transition-colors"
          title="Copy ID"
        >
          <Copy size={16} />
        </button>
      </td>

      <td
        className={`${tdClass} cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 min-w-[300px] max-w-[500px] resize-x overflow-auto`}
        onClick={() => onPreviewQuestion(localQ)}
        title="Click to view full question/math"
      >
        <div className="line-clamp-2 overflow-hidden text-ellipsis px-1 max-h-[2.8em]">
          <MathRenderer text={localQ.question || ''} />
        </div>
      </td>

      {[0, 1, 2, 3].map((i) => (
        <td key={i} className={`${tdClass} min-w-[200px]`}>
          <div className="relative group w-full h-full min-h-[36px]">
            <input
              value={localQ.options?.[i] || ''}
              onChange={(e) => updateOption(i, e.target.value)}
              onBlur={handleBlur}
              className={`${inputClass} absolute inset-0 opacity-0 focus:opacity-100 z-10 w-full h-full bg-white dark:bg-neutral-800 border focus:border-emerald-500 rounded px-2`}
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
            />
            <div className="absolute inset-0 pointer-events-none flex items-center px-2 py-1 overflow-hidden group-focus-within:opacity-0">
              <MathRenderer text={localQ.options?.[i] || ''} />
            </div>
          </div>
        </td>
      ))}

      <td
        className={`${tdClass} min-w-[60px] text-center bg-emerald-50/50 dark:bg-emerald-900/10`}
      >
        <select
          value={getAnswerLetter()}
          onChange={(e) => {
            updateAnswerKey(e.target.value);
            const newQ = { ...localQ };
            const idx = e.target.value.charCodeAt(0) - 65;
            newQ.correctAnswerIndex = idx;
            newQ.correctAnswer = newQ.options?.[idx] || '';
            newQ.correctAnswerIndices = [idx];
            setLocalQ(newQ);
            onSave(newQ);
          }}
          className={`${inputClass} text-center font-bold cursor-pointer text-emerald-700 dark:text-emerald-400`}
        >
          <option value=""></option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </td>

      <td className={`${tdClass} min-w-[100px]`}>
        <input
          value={localQ.stream || ''}
          onChange={(e) => updateField('stream', e.target.value)}
          onBlur={handleBlur}
          className={inputClass}
        />
      </td>

      <td className={`${tdClass} min-w-[100px]`}>
        <input
          value={localQ.division || localQ.section || ''}
          onChange={(e) => {
            updateField('division', e.target.value);
            updateField('section', e.target.value);
          }}
          onBlur={handleBlur}
          className={inputClass}
        />
      </td>

      <td className={`${tdClass} min-w-[120px]`}>
        <select
          value={localQ.examType || ''}
          onChange={(e) => {
            updateField('examType', e.target.value);
            const newQ = { ...localQ, examType: e.target.value };
            setLocalQ(newQ);
            onSave(newQ);
          }}
          className={`${inputClass} min-w-[100px]`}
        >
          <option value="">Select</option>
          {localQ.examType &&
            !['Academic', 'Medical', 'Engineering', 'Varsity'].includes(
              localQ.examType,
            ) && <option value={localQ.examType}>{localQ.examType}</option>}
          <option value="Academic">Academic</option>
          <option value="Medical">Medical</option>
          <option value="Engineering">Engineering</option>
          <option value="Varsity">Varsity</option>
        </select>
      </td>

      <td className={`${tdClass} min-w-[100px]`}>
        <input
          value={localQ.year || ''}
          onChange={(e) => updateField('year', e.target.value)}
          onBlur={handleBlur}
          className={inputClass}
        />
      </td>

      <td className={`${tdClass} min-w-[160px]`}>
        <input
          value={localQ.institute || ''}
          onChange={(e) => updateField('institute', e.target.value)}
          onBlur={handleBlur}
          className={inputClass}
        />
      </td>

      <td className={`${tdClass} min-w-[160px]`}>
        <select
          value={canonicalSubject}
          onChange={(e) => {
            updateField('subject', e.target.value);
            updateField('chapter', '');
            updateField('topic', '');

            // Auto save subject change immediately
            const newQ = {
              ...localQ,
              subject: e.target.value,
              chapter: '',
              topic: '',
            };
            setLocalQ(newQ);
            onSave(newQ);
          }}
          className={`${inputClass} min-w-[100px]`}
        >
          <option value="">Select</option>
          {availableSubjects.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </td>

      <td className={`${tdClass} min-w-[160px]`}>
        <select
          value={canonicalChapter}
          onChange={(e) => {
            updateField('chapter', e.target.value);
            updateField('topic', '');

            const newQ = { ...localQ, chapter: e.target.value, topic: '' };
            setLocalQ(newQ);
            onSave(newQ);
          }}
          disabled={!canonicalSubject}
          className={`${inputClass} min-w-[100px] disabled:opacity-50`}
        >
          <option value="">Select</option>
          {availableChapters.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </td>

      <td className={`${tdClass} min-w-[160px]`}>
        <select
          value={canonicalTopic}
          onChange={(e) => {
            updateField('topic', e.target.value);
            const newQ = { ...localQ, topic: e.target.value };
            setLocalQ(newQ);
            onSave(newQ);
          }}
          disabled={!canonicalChapter}
          className={`${inputClass} min-w-[100px] disabled:opacity-50`}
        >
          <option value="">Select</option>
          {availableTopics.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </td>

      <td className={`${tdClass} min-w-[120px]`}>
        <select
          value={localQ.difficulty || ''}
          onChange={(e) => {
            updateField('difficulty', e.target.value);
            const newQ = { ...localQ, difficulty: e.target.value as any };
            setLocalQ(newQ);
            onSave(newQ);
          }}
          className={inputClass}
        >
          <option value="">Select</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </td>

      <td className={`${tdClass} min-w-[120px]`}>
        <select
          value={localQ.status || 'Pending'}
          onChange={(e) => {
            updateField('status', e.target.value);
            const newQ = { ...localQ, status: e.target.value as any };
            setLocalQ(newQ);
            onSave(newQ);
          }}
          className={`${inputClass} ${localQ.status === 'Approved' ? 'text-emerald-600' : localQ.status === 'Rejected' ? 'text-red-600' : 'text-amber-600'}`}
        >
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Draft">Draft</option>
        </select>
      </td>

      <td className={`${tdClass} text-center align-middle whitespace-nowrap`}>
        <div className="flex items-center justify-center gap-1 px-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
            title="Form Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export const QuestionTableView: React.FC<QuestionTableViewProps> = ({
  questions,
  selectedQuestions,
  onEdit,
  onDelete,
  onToggleSelection,
  onSelectAll,
  fontSize,
  saveQuestion,
}) => {
  const [previewQ, setPreviewQ] = useState<Question | null>(null);

  const thClass =
    'border border-neutral-400 dark:border-neutral-500 bg-neutral-100 dark:bg-neutral-800 p-2 font-bold text-left whitespace-nowrap sticky top-0 z-10 shadow-sm';

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] border border-neutral-300 dark:border-neutral-700 overflow-x-auto max-h-[70vh] custom-scrollbar shadow-sm rounded-xl">
      <table
        className="w-full min-w-max border-collapse border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100"
        style={{ fontSize: `${fontSize}px` }}
      >
        <thead>
          <tr>
            <th className={`${thClass} text-center w-10`}>
              <input
                type="checkbox"
                checked={
                  questions.length > 0 &&
                  selectedQuestions.size === questions.length
                }
                onChange={onSelectAll}
                className="cursor-pointer"
              />
            </th>
            <th className={thClass}>ID</th>
            <th className={thClass}>Question / Text</th>
            <th className={thClass}>Opt A</th>
            <th className={thClass}>Opt B</th>
            <th className={thClass}>Opt C</th>
            <th className={thClass}>Opt D</th>
            <th className={thClass}>Key</th>
            <th className={thClass}>Stream</th>
            <th className={thClass}>Section</th>
            <th className={thClass}>Exam Type</th>
            <th className={thClass}>Year</th>
            <th className={thClass}>Institute</th>
            <th className={thClass}>Subject</th>
            <th className={thClass}>Chapter</th>
            <th className={thClass}>Topic</th>
            <th className={thClass}>Diff</th>
            <th className={thClass}>Status</th>
            <th className={`${thClass} text-center`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <EditableRow
              key={q.id!}
              question={q}
              isSelected={selectedQuestions.has(q.id!)}
              onToggle={() => onToggleSelection(q.id!)}
              onEdit={() => onEdit(q)}
              onDelete={() => onDelete(q.id!)}
              onSave={saveQuestion}
              onPreviewQuestion={setPreviewQ}
            />
          ))}
          {questions.length === 0 && (
            <tr>
              <td
                colSpan={19}
                className="p-8 text-center text-neutral-500 border border-neutral-300"
              >
                No questions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Preview Modal for Truncated Questions */}
      <Dialog
        open={!!previewQ}
        onOpenChange={(open) => {
          if (!open) setPreviewQ(null);
        }}
      >
        <DialogContent
          className="sm:max-w-3xl max-h-[85vh] overflow-y-auto"
          showCloseButton={true}
        >
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-bold border-b pb-2">
              Full Question (ID: {previewQ?.id})
            </h3>
            <div className="bg-neutral-50 dark:bg-neutral-900 p-5 rounded-xl text-lg relative min-h-[100px]">
              {previewQ && <MathRenderer text={previewQ.question || ''} />}
            </div>

            {previewQ?.imageUrl && (
              <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl mt-4 border border-neutral-200">
                <h4 className="font-bold mb-2">Question Image</h4>
                <img
                  src={previewQ.imageUrl}
                  alt="question"
                  className="max-h-60 object-contain"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
              {previewQ?.options?.map((opt, i) => (
                <div
                  key={i}
                  className={`p-3 border rounded-xl ${i === previewQ.correctAnswerIndex ? 'bg-emerald-50 border-emerald-200' : 'bg-white'}`}
                >
                  <span className="font-bold mr-2">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <MathRenderer text={opt || ''} />
                </div>
              ))}
            </div>

            {(previewQ?.explanation || previewQ?.explanationImageUrl) && (
              <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl mt-4 border border-blue-100 dark:border-blue-800">
                <h4 className="font-bold mb-3 text-blue-900 dark:text-blue-300">
                  Explanation
                </h4>
                {previewQ.explanationImageUrl && (
                  <img
                    src={previewQ.explanationImageUrl}
                    alt="explanation"
                    className="max-h-60 object-contain mb-3"
                  />
                )}
                <MathRenderer text={previewQ.explanation || ''} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
