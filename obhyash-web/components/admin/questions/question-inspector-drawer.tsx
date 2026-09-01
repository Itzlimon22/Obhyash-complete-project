'use client';

import React from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  BookOpen,
  Calendar,
  Building2,
  User,
  ExternalLink,
  Layers,
  Award,
  Clock,
} from 'lucide-react';
import { Question } from '@/lib/types';
import { MathText } from '@/components/admin/questions/shared';

interface QuestionInspectorProps {
  question: Question | null;
  onClose: () => void;
  onEdit: (q: Question) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}

export function QuestionInspectorDrawer({
  question,
  onClose,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}: QuestionInspectorProps) {
  if (!question) return null;

  const isPending = question.status === 'Pending' || !question.status;
  const isApproved = question.status === 'Approved';

  const correctIndices = new Set(
    question.correctAnswerIndices ||
      (question.correctAnswerIndex !== undefined
        ? [question.correctAnswerIndex]
        : []),
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-[#121215] border-l border-neutral-200 dark:border-zinc-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-zinc-800 flex items-center justify-between bg-neutral-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isApproved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400'
                  : isPending
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400'
                    : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-400'
              }`}
            >
              {question.status || 'Pending Review'}
            </span>
            <span className="text-xs font-mono text-neutral-400">
              ID: {question.id.slice(0, 8)}...
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Chips Bar */}
          <div className="flex flex-wrap gap-2 text-xs">
            {question.subject && (
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold flex items-center gap-1">
                <BookOpen size={12} /> {question.subject}
              </span>
            )}
            {question.chapter && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold flex items-center gap-1">
                <Layers size={12} /> {question.chapter}
              </span>
            )}
            {question.difficulty && (
              <span
                className={`px-2.5 py-1 rounded-lg font-semibold border ${
                  question.difficulty === 'Easy'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : question.difficulty === 'Hard'
                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
              >
                {question.difficulty}
              </span>
            )}
            {question.examType && (
              <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 font-semibold">
                {question.examType}
              </span>
            )}
          </div>

          {/* Question Stem */}
          <div className="space-y-3 p-5 rounded-2xl bg-neutral-50 dark:bg-zinc-900/40 border border-neutral-200/80 dark:border-zinc-800">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              প্রশ্ন (Question Stem)
            </h4>
            <div className="text-base text-neutral-900 dark:text-white font-medium leading-relaxed">
              <MathText text={question.question || ''} />
            </div>

            {/* Question Stem Diagram */}
            {question.imageUrl && (
              <div className="mt-3 rounded-xl overflow-hidden border border-neutral-200 dark:border-zinc-700/80 max-w-sm bg-white dark:bg-black p-2">
                <img
                  src={question.imageUrl}
                  alt="Question Diagram"
                  className="w-full h-auto max-h-56 object-contain rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              বিকল্প উত্তরসমূহ (Options)
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              {(question.options || []).map((opt, idx) => {
                const isCorrect = correctIndices.has(idx);
                const optImage = question.optionImages?.[idx];

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      isCorrect
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 shadow-sm'
                        : 'bg-white dark:bg-zinc-900/30 border-neutral-200 dark:border-zinc-800 text-neutral-800 dark:text-zinc-200'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>

                    <div className="flex-1 text-sm font-medium">
                      <MathText text={opt || ''} />
                      {optImage && (
                        <img
                          src={optImage}
                          alt={`Option ${idx + 1}`}
                          className="mt-2 h-20 w-auto object-contain rounded border border-neutral-200 dark:border-zinc-700 bg-white p-1"
                        />
                      )}
                    </div>

                    {isCorrect && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                        <CheckCircle2 size={15} /> সঠিক উত্তর
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explanation & Solution */}
          {question.explanation && (
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <BookOpen size={14} className="text-amber-500" />
                <span>বিস্তারিত ব্যাখ্যা ও সমাধান (Explanation)</span>
              </h4>
              <div className="text-sm text-neutral-800 dark:text-zinc-200 leading-relaxed">
                <MathText text={question.explanation || ''} />
              </div>
              {question.explanationImageUrl && (
                <div className="mt-2 rounded-xl overflow-hidden border border-amber-200 dark:border-amber-900/60 max-w-sm bg-white dark:bg-black p-2">
                  <img
                    src={question.explanationImageUrl}
                    alt="Explanation Solution Diagram"
                    className="w-full h-auto max-h-48 object-contain rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Author & Institutes Metadata */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-zinc-900/40 border border-neutral-200/80 dark:border-zinc-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-neutral-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 font-medium">
                <User size={13} /> লেখক / আপলোডার:
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {question.authorName || question.author || 'Admin'}
              </span>
            </div>

            {question.institutes && question.institutes.length > 0 && (
              <div className="flex items-center justify-between text-neutral-600 dark:text-zinc-400 pt-1 border-t border-neutral-200/60 dark:border-zinc-800">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 size={13} /> বোর্ড / বিশ্ববিদ্যালয়:
                </span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {question.institutes.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-zinc-800 bg-neutral-50/80 dark:bg-zinc-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isPending && (
              <button
                onClick={() => onApprove(question.id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>অনুমোদন করুন (Approve)</span>
              </button>
            )}

            {isApproved && (
              <button
                onClick={() => onReject(question.id)}
                className="px-3.5 py-2 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle size={14} />
                <span>আন-ভেরিফাই করুন</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(question)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Edit3 size={14} />
              <span>এডিট করুন (Full Editor)</span>
            </button>

            <button
              onClick={() => onDelete(question.id)}
              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
              title="Delete question"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
