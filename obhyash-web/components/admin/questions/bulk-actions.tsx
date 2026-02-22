import React, { useState, useMemo } from 'react';
import {
  Trash2,
  CheckCircle2,
  XCircle,
  FileEdit,
  ChevronDown,
} from 'lucide-react';
import { QuestionStatus } from '@/lib/types';
import { getHscSubjectList, getHscChapterList } from '@/lib/data/hsc-helpers';

interface BulkActionsProps {
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
  }) => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onUpdateStatus,
  onUpdateMetadata,
}) => {
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
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
        `আপনি কি ${selectedCount} টি প্রশ্ন মুছে ফেলতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না।`,
      )
    ) {
      onDeleteSelected();
    }
  };

  const handleSubjectChange = (subjectName: string) => {
    onUpdateMetadata?.({ subject: subjectName, chapter: '', topic: '' });
    setShowSubjectPicker(false);
  };

  const handleChapterChange = (chapterName: string) => {
    onUpdateMetadata?.({ chapter: chapterName, topic: '' });
    setShowChapterPicker(false);
    setSelectedSubjectForChapter('');
  };

  return (
    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
      {/* Selection Info */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <CheckCircle2
            size={18}
            className="text-red-600 dark:text-red-400"
          />
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900 dark:text-white">
            {selectedCount} টি প্রশ্ন নির্বাচিত
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {selectedCount < totalCount && (
              <button
                onClick={onSelectAll}
                className="text-[10px] sm:text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
              >
                সব নির্বাচন করো ({totalCount})
              </button>
            )}
            <button
              onClick={onClearSelection}
              className="text-[10px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              নির্বাচন মুছুন
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
        {/* Batch Edit Subject */}
        {onUpdateMetadata && (
          <div className="flex items-center gap-1">
            {/* Subject Picker */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSubjectPicker(!showSubjectPicker);
                  setShowChapterPicker(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
              >
                <FileEdit size={14} />
                <span className="hidden xs:inline">বিষয়</span>
                <ChevronDown size={12} />
              </button>
              {showSubjectPicker && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-150">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSubjectChange(s.name)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-b border-neutral-50 dark:border-neutral-800 last:border-0"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chapter Picker */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowChapterPicker(!showChapterPicker);
                  setShowSubjectPicker(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
              >
                <FileEdit size={14} />
                <span className="hidden xs:inline">অধ্যায়</span>
                <ChevronDown size={12} />
              </button>
              {showChapterPicker && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-30 max-h-72 overflow-y-auto min-w-[220px] animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* First pick subject */}
                  {!selectedSubjectForChapter ? (
                    <>
                      <div className="px-3 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-800 sticky top-0">
                        প্রথমে বিষয় নির্বাচন করো
                      </div>
                      {subjects.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSubjectForChapter(s.name)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-b border-neutral-50 dark:border-neutral-800 last:border-0"
                        >
                          {s.name}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedSubjectForChapter('')}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 sticky top-0"
                      >
                        ← {selectedSubjectForChapter}
                      </button>
                      {chapters.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleChapterChange(c.name)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-b border-neutral-50 dark:border-neutral-800 last:border-0"
                        >
                          {c.name}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Update Status */}
        <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-1 flex-1 sm:flex-none justify-center">
          <button
            onClick={() => onUpdateStatus('Approved')}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center justify-center gap-1.5"
            title="Approve Selected"
          >
            <CheckCircle2 size={14} className="sm:inline" />
            <span className="hidden xs:inline">Approve</span>
          </button>
          <button
            onClick={() => onUpdateStatus('Rejected')}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-1.5"
            title="Reject Selected"
          >
            <XCircle size={14} className="sm:inline" />
            <span className="hidden xs:inline">Reject</span>
          </button>
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center gap-2 shrink-0"
        >
          <Trash2 size={16} />
          <span className="hidden xs:inline">মুছে ফেলুন</span>
        </button>
      </div>
    </div>
  );
};
