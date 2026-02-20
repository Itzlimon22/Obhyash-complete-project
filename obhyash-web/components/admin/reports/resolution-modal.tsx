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
  const [editedQuestion, setEditedQuestion] = useState<Partial<Question>>(() =>
    report?.question ? (report.question as Partial<Question>) : {},
  );
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when report changes
  useEffect(() => {
    if (report) {
      Promise.resolve().then(() => {
        setEditedQuestion(
          report.question ? (report.question as Partial<Question>) : {},
        );
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-neutral-900/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-950 sm:rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-bottom-5 duration-300 flex flex-col h-full sm:h-auto max-h-full sm:max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-black sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
              <AlertOctagon size={18} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black text-neutral-900 dark:text-white tracking-tight">
                Resolution Console
              </h2>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">
                <span>#{report.id.slice(0, 8)}</span>
                <span>•</span>
                <span>{report.created_at.split('T')[0]}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Left: Details */}
          <div className="w-full md:w-1/3 p-5 border-b md:border-b-0 md:border-r border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
            <div className="space-y-4">
              <div className="w-full bg-white dark:bg-black p-4 rounded-t-2xl sm:rounded-xl rounded-b-none sm:rounded-b-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-neutral-100 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Flag size={12} className="text-rose-600" />
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">
                    {report.reason}
                  </span>
                </div>
                <p className="text-[13px] text-neutral-700 dark:text-neutral-300 italic leading-relaxed">
                  &ldquo;{report.description}&rdquo;
                </p>
              </div>
              <div className="px-1">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 opacity-70">
                  Reporter
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center text-[10px] font-black uppercase shadow-inner">
                    {(report.reporter_name || 'G').charAt(0)}
                  </div>
                  <span className="text-[13px] font-bold text-neutral-900 dark:text-white">
                    {report.reporter_name || 'Anonymous'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Editor */}
          <div className="w-full md:w-2/3 p-5 bg-white dark:bg-black">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest opacity-70">
                Reported Question
              </h3>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-[11px] font-black text-rose-600 hover:text-rose-700 flex items-center gap-1 uppercase tracking-tight"
                >
                  <ArrowRight size={12} /> Edit Mode
                </button>
              ) : (
                <span className="text-[11px] font-black text-amber-600 flex items-center gap-1 uppercase tracking-tight animate-pulse">
                  <AlertTriangle size={12} /> Editing...
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 px-1 opacity-70">
                  Question Content
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
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none dark:text-white transition-all font-medium"
                    placeholder="Type LaTeX or plain text..."
                  />
                ) : (
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 transition-all">
                    <div className="text-[13px] text-neutral-900 dark:text-white leading-relaxed">
                      <MathText text={editedQuestion.question || ''} />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 px-1 opacity-70">
                  Resolution Explanation
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
                  className={`w-full px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none dark:text-white transition-all font-medium ${!editMode && 'opacity-50 grayscale select-none'}`}
                  readOnly={!editMode}
                  placeholder="Explain why this change was made..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {report.status === 'Pending' ? (
          <div className="p-4 sm:p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col sm:flex-row justify-between items-center gap-3 sticky bottom-0 z-10">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this report?'))
                  handleAction('delete');
              }}
              className="w-full sm:w-auto px-4 py-2 text-[11px] text-rose-500 bg-rose-50/50 dark:bg-rose-500/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all flex items-center justify-center gap-1.5 font-black uppercase tracking-tight"
            >
              <Trash2 size={12} /> Delete Report
            </button>
            <div className="flex gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => handleAction('ignore')}
                className="w-full flex-1 sm:flex-none px-5 py-2.5 text-xs font-black text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-t-2xl sm:rounded-xl rounded-b-none sm:rounded-b-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 transition-all active:scale-[0.98] uppercase tracking-tight shadow-sm"
              >
                Ignore
              </button>
              <button
                onClick={() => handleAction('fix')}
                disabled={isSaving}
                className="flex-[2] sm:flex-none px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-tight"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Update & Resolve
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            REPORT {report.status}
          </div>
        )}
      </div>
    </div>
  );
};
