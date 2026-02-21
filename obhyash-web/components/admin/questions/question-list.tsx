import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  Eye,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Question, QuestionStatus } from '@/lib/types';
import { MathText, StatusBadge, DifficultyBadge } from './shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface QuestionListProps {
  questions: Question[];
  selectedQuestions: Set<string>;
  onEdit: (q: Question) => void;
  onDelete: (id: string) => void;
  onPreview: (q: Question) => void;
  onStatusChange: (id: string, status: QuestionStatus) => void;
  onToggleSelection: (id: string) => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  selectedQuestions,
  onEdit,
  onDelete,
  onPreview,
  onStatusChange,
  onToggleSelection,
}) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
            কোন প্রশ্ন পাওয়া যায়নি
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            ফিল্টার পরিবর্তন করুন বা নতুন প্রশ্ন যোগ করুন
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View - 2 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
        {questions.map((q) => (
          <div
            key={q.id}
            onClick={() => onPreview(q)}
            className={`relative p-4 rounded-2xl border transition-all active:scale-95 ${
              selectedQuestions.has(q.id)
                ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'
                : 'bg-white border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800'
            } shadow-sm cursor-pointer`}
          >
            {/* Selection Checkbox */}
            <div className="absolute top-3 right-3 z-10">
              <input
                type="checkbox"
                checked={selectedQuestions.has(q.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelection(q.id);
                }}
                className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
            </div>

            {/* Content */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-200 line-clamp-3 leading-relaxed">
                <MathText text={q.question || ''} />
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusBadge status={q.status} />
                <DifficultyBadge level={q.difficulty} />
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-neutral-900 dark:text-neutral-300">
                    {q.subject}
                  </span>
                  <span className="text-[10px] text-neutral-500 line-clamp-1">
                    {q.chapter || 'সাধারণ'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(q);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, q.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={
                      questions.length > 0 &&
                      questions.every((q) => selectedQuestions.has(q.id))
                    }
                    onChange={(e) => {
                      questions.forEach((q) => {
                        if (e.target.checked !== selectedQuestions.has(q.id)) {
                          onToggleSelection(q.id);
                        }
                      });
                    }}
                    className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">প্রশ্ন (Question)</th>
                <th className="px-6 py-4">বিষয় ও অধ্যায়</th>
                <th className="px-6 py-4">কঠিন্য</th>
                <th className="px-6 py-4">আপলোডার</th>
                <th className="px-6 py-4">স্ট্যাটাস</th>
                <th className="px-6 py-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {questions.map((q) => (
                <tr
                  key={q.id}
                  className={`group hover:bg-neutral-50 dark:hover:bg-neutral-950/50 transition-colors ${
                    selectedQuestions.has(q.id)
                      ? 'bg-rose-50/50 dark:bg-rose-900/10'
                      : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.has(q.id)}
                      onChange={() => onToggleSelection(q.id)}
                      className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 max-w-sm">
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-200 line-clamp-2">
                      <MathText text={q.question || ''} />
                    </div>
                    <div className="mt-1 text-xs text-neutral-400 font-mono">
                      #{q.id.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-200">
                        {q.subject}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {q.chapter || 'সাধারণ'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <DifficultyBadge level={q.difficulty} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-700 dark:text-rose-300 font-bold">
                          {(q.author || 'S').charAt(0)}
                        </div>
                        {q.author || 'System'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={10} />{' '}
                        {q.createdAt
                          ? new Date(q.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreview(q);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors"
                        title="প্রিভিউ দেখুন"
                      >
                        <Eye size={16} />
                      </button>
                      {q.status === 'Pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(q.id, 'Approved');
                          }}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors"
                          title="Approve"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(q);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors"
                        title="এডিট করুন"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, q.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors"
                        title="ডিলিট করুন"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              প্রশ্ন মুছে ফেলুন
            </DialogTitle>
            <DialogDescription>
              আপনি কি নিশ্চিত যে আপনি এই প্রশ্নটি মুছে ফেলতে চান? এই ক্রিয়াটি
              অপরিবর্তনীয়।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              বাতিল
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              মুছে ফেলুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
