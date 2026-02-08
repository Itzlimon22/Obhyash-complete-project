import React, { useState, useEffect } from 'react';
import {
  X,
  AlertOctagon,
  Flag,
  ArrowRight,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Report, Question } from '@/lib/types';
import { MathText } from '@/components/admin/questions/shared';

interface ResolutionModalProps {
  report: Report | null;
  onClose: () => void;
  onResolve: (
    action: 'fix' | 'ignore' | 'delete',
    data?: Partial<Question>,
  ) => Promise<void>;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  report,
  onClose,
  onResolve,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState<Partial<Question>>(
    () => report?.questionPreview || {},
  );
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when report changes
  useEffect(() => {
    if (report) {
      // Use a micro-task to avoid synchronous setState
      Promise.resolve().then(() => {
        setEditedQuestion(report.questionPreview);
        setEditMode(false);
      });
    }
  }, [report]);

  if (!report) return null;

  const handleAction = async (action: 'fix' | 'ignore' | 'delete') => {
    setIsSaving(true);
    await onResolve(action, editedQuestion);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-fade-in flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-lg">
              <AlertOctagon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Resolution Console
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Report #{report.id.slice(0, 8)}</span>
                <span>•</span>
                <span>{report.createdAt}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-0 flex flex-col md:flex-row">
          {/* Left: Details */}
          <div className="w-full md:w-1/3 p-6 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-950/30">
            <div className="space-y-4">
              <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Flag size={14} className="text-rose-500" />
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {report.reason}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  &ldquo;{report.description}&rdquo;
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Reporter
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs font-bold">
                    {report.reporterName.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">
                    {report.reporterName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Editor */}
          <div className="w-full md:w-2/3 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                Reported Question
              </h3>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <ArrowRight size={14} /> Edit Mode
                </button>
              ) : (
                <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                  <AlertTriangle size={14} /> Editing...
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Content (LaTeX supported)
                </label>
                {editMode ? (
                  <textarea
                    rows={4}
                    value={editedQuestion.question || ''}
                    onChange={(e) =>
                      setEditedQuestion({
                        ...editedQuestion,
                        question: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none dark:text-white"
                  />
                ) : (
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white">
                    <MathText text={editedQuestion.question || ''} />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Explanation
                </label>
                <textarea
                  rows={3}
                  value={editedQuestion.explanation || ''}
                  onChange={(e) =>
                    setEditedQuestion({
                      ...editedQuestion,
                      explanation: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm focus:ring-2 focus:ring-rose-500 outline-none dark:text-white ${!editMode && 'opacity-50 pointer-events-none'}`}
                  readOnly={!editMode}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {report.status === 'Pending' ? (
          <div className="p-4 sm:p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={() => {
                if (confirm('Are you sure?')) handleAction('delete');
              }}
              className="w-full sm:w-auto px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors flex items-center justify-center gap-2 font-bold"
            >
              <Trash2 size={16} /> Delete Report
            </button>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleAction('ignore')}
                className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-all active:scale-95"
              >
                Ignore
              </button>
              <button
                onClick={() => handleAction('fix')}
                disabled={isSaving}
                className="flex-[2] sm:flex-none px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Update & Resolve
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 text-center text-xs font-bold text-neutral-400 uppercase tracking-widest">
            Report is already{' '}
            <span className="text-neutral-900 dark:text-white">
              {report.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
