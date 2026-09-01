'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Trash2,
  BookOpen,
  Layers,
  Zap,
  ChevronDown,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { QuestionStatus } from '@/lib/types';
import { getHscSubjectList, getHscChapterList } from '@/lib/data/hsc-helpers';

interface MassBulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onUpdateStatus: (status: QuestionStatus) => void;
  onUpdateMetadata?: (fields: {
    subject?: string;
    chapter?: string;
    topic?: string;
    difficulty?: string;
  }) => void;
}

export function MassBulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onUpdateStatus,
  onUpdateMetadata,
}: MassBulkActionsProps) {
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showDifficultyPicker, setShowDifficultyPicker] = useState(false);
  const [selectedSubjectForChapter, setSelectedSubjectForChapter] =
    useState('');

  const subjects = useMemo(() => getHscSubjectList(), []);
  const chapters = useMemo(
    () =>
      selectedSubjectForChapter
        ? getHscChapterList(selectedSubjectForChapter)
        : [],
    [selectedSubjectForChapter],
  );

  if (selectedCount === 0) return null;

  const handleDelete = () => {
    if (
      confirm(
        `⚠️ আপনি কি নিশ্চিত যে নির্বাচিত ${selectedCount} টি প্রশ্ন স্থায়ীভাবে মুছে ফেলতে চান?`,
      )
    ) {
      onDeleteSelected();
    }
  };

  return (
    <div className="sticky top-4 z-40 bg-white dark:bg-[#121215] border-2 border-emerald-500/50 dark:border-emerald-500/40 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-200">
      {/* Left: Selection Counter */}
      <div className="flex items-center gap-3 w-full lg:w-auto">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <span>{selectedCount} টি প্রশ্ন নির্বাচিত</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Selected
            </span>
          </h4>
          <div className="flex items-center gap-3 text-xs mt-0.5">
            {selectedCount < totalCount && (
              <button
                type="button"
                onClick={onSelectAll}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                সব {totalCount} টি নির্বাচন করুন
              </button>
            )}
            <button
              type="button"
              onClick={onClearSelection}
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-zinc-300 cursor-pointer"
            >
              নির্বাচন বাতিল
            </button>
          </div>
        </div>
      </div>

      {/* Right: Mass Actions Toolbar */}
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
        {/* 1. Bulk Approve */}
        <button
          type="button"
          onClick={() => onUpdateStatus('Approved')}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <CheckCircle2 size={14} />
          <span>সব অনুমোদন (Approve)</span>
        </button>

        {/* 2. Bulk Reject */}
        <button
          type="button"
          onClick={() => onUpdateStatus('Rejected')}
          className="px-3 py-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-800 dark:text-zinc-200 hover:text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <XCircle size={14} />
          <span>বাতিল (Reject)</span>
        </button>

        {/* 3. Reassign Subject & Chapter Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowSubjectPicker(!showSubjectPicker);
              setShowDifficultyPicker(false);
            }}
            className="px-3 py-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen size={14} />
            <span>বিষয়/অধ্যায় স্থানান্তর</span>
            <ChevronDown size={12} />
          </button>

          {showSubjectPicker && (
            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-3 w-64 z-50 animate-in fade-in space-y-2">
              <div className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400">
                নতুন বিষয় সিলেক্ট করুন:
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {subjects.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      onUpdateMetadata?.({
                        subject: sub.name,
                        chapter: '',
                        topic: '',
                      });
                      setShowSubjectPicker(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-800 dark:text-zinc-200"
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Change Difficulty Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowDifficultyPicker(!showDifficultyPicker);
              setShowSubjectPicker(false);
            }}
            className="px-3 py-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Zap size={14} />
            <span>কাঠিন্য পরিবর্তন</span>
            <ChevronDown size={12} />
          </button>

          {showDifficultyPicker && (
            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-2xl p-2 w-40 z-50 animate-in fade-in space-y-1">
              {['Easy', 'Medium', 'Hard'].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => {
                    onUpdateMetadata?.({ difficulty: diff });
                    setShowDifficultyPicker(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-800 dark:text-zinc-200"
                >
                  {diff === 'Easy'
                    ? '🟢 সহজ (Easy)'
                    : diff === 'Medium'
                      ? '🟡 মাঝারি (Medium)'
                      : '🔴 কঠিন (Hard)'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. Bulk Delete */}
        <button
          type="button"
          onClick={handleDelete}
          className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
          title="Delete selected questions"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
