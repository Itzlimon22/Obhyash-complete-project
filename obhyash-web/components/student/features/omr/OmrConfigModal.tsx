'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  Settings,
  Layers,
  BookOpen,
} from 'lucide-react';
import { ExamDetails } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OmrConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (details: ExamDetails, totalQuestions: number) => void;
  initialSubject?: string;
  initialChapters?: string;
  initialTopics?: string;
}

import Portal from '@/components/ui/portal';

export const OmrConfigModal: React.FC<OmrConfigModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  initialSubject = '',
  initialChapters = '',
  initialTopics = '',
}) => {
  const [isBlank, setIsBlank] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [chapter, setChapter] = useState(initialChapters);
  const [topic, setTopic] = useState(initialTopics);
  const [count, setCount] = useState(50);

  // Sync state from props when the modal transitions from closed to open
  // Using the "store previous prop in state" pattern recommended by React:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen && !prevIsOpen) {
    setSubject(initialSubject);
    setChapter(initialChapters);
    setTopic(initialTopics);
  }
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
  }

  const handleGenerate = () => {
    // Validation if not blank
    if (!isBlank && !subject.trim()) {
      toast.error("Please enter a subject name or select 'Blank OMR'");
      return;
    }

    const details: ExamDetails = {
      subject: isBlank ? '' : subject,
      subjectLabel: isBlank ? '' : subject,
      examType: isBlank ? '' : 'Practice Exam',
      chapters: isBlank ? '' : chapter,
      topics: isBlank ? '' : topic,
      totalQuestions: count,
      durationMinutes: 0,
      totalMarks: 0,
      negativeMarking: 0,
    };

    onGenerate(details, count);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end md:justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="relative w-full md:max-w-md md:rounded-3xl rounded-t-3xl bg-white dark:bg-neutral-900 shadow-2xl flex flex-col max-h-[90vh] md:max-h-[600px] animate-in slide-in-from-bottom duration-300 md:mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                OMR Configuration
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Setup your OMR sheet for printing
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto p-6 space-y-6">
            {/* Blank Option */}
            <div
              onClick={() => setIsBlank(!isBlank)}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer',
                isBlank
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300',
              )}
            >
              <div>
                <div className="font-bold text-neutral-900 dark:text-white">
                  Blank OMR Sheet
                </div>
                <div className="text-xs text-neutral-500">
                  Hand-write details later
                </div>
              </div>
              <div
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                  isBlank
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'border-neutral-300 dark:border-neutral-600',
                )}
              >
                {isBlank && (
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                )}
              </div>
            </div>

            {/* Inputs - Fade out if Blank */}
            <div
              className={cn(
                'space-y-4 transition-opacity duration-200',
                isBlank && 'opacity-40 pointer-events-none grayscale',
              )}
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1">
                  <BookOpen size={12} /> Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Physics"
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-transparent focus:bg-white dark:focus:bg-neutral-900 border focus:border-indigo-500 focus:ring-0 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1">
                    <Layers size={12} /> Chapter
                  </label>
                  <input
                    type="text"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-transparent focus:bg-white dark:focus:bg-neutral-900 border focus:border-indigo-500 focus:ring-0 transition-all font-medium text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1">
                    <FileText size={12} /> Topic
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-transparent focus:bg-white dark:focus:bg-neutral-900 border focus:border-indigo-500 focus:ring-0 transition-all font-medium text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Questions Count Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-500 uppercase">
                  Questions Count
                </label>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">
                  {count} Q
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-medium px-1">
                <span>10</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 pb-safe bg-white dark:bg-neutral-900 md:rounded-b-3xl">
            <button
              onClick={handleGenerate}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Generate PDF
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
