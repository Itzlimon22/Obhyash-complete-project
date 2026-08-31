"use client";

import React, { useState } from "react";
import { Question } from "@/lib/types";
import { MathRenderer } from "@/components/common/MathRenderer";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import {
  Bookmark,
  Flag,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuestionCardProps {
  question: Question;
  serialNumber?: number;
  selectedOptionIndex?: number;
  isFlagged?: boolean;
  onSelectOption?: (optionIndex: number) => void;
  onToggleFlag?: () => void;
  onReport?: () => void;
  showFeedback?: boolean;
  readOnly?: boolean;
  showAnswer?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  hideMetadata?: boolean;
  initiallyExpanded?: boolean;
}

const BANGLA_INDICES = ["ক", "খ", "গ", "ঘ", "ঙ", "চ", "ছ", "জ", "ঝ", "ঞ"];

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  serialNumber,
  selectedOptionIndex,
  isFlagged = false,
  onSelectOption,
  onToggleFlag,
  onReport,
  showFeedback = false,
  readOnly = false,
  showAnswer = false,
  isBookmarked = false,
  onToggleBookmark,
  hideMetadata = false,
  initiallyExpanded = false,
}) => {
  const [isExplanationOpen, setIsExplanationOpen] = useState(
    showFeedback && initiallyExpanded
  );

  // Parse institute/year/author tags
  const sourceTags = React.useMemo(() => {
    return BanglaNameHelper.formatQuestionSource({
      institutes: question.institutes || (question.institute ? [question.institute] : []),
      years: question.years || (question.year ? [question.year] : []),
      examHistory: question.exam_history || question.examHistory || [],
    });
  }, [question]);

  const correctIndex = question.correctAnswerIndex;
  const isCorrectAnswer = (idx: number) => {
    if (question.correctAnswerIndices && question.correctAnswerIndices.length > 0) {
      return question.correctAnswerIndices.includes(idx);
    }
    return idx === correctIndex;
  };

  const isUserSelected = (idx: number) => selectedOptionIndex === idx;

  return (
    <div
      id={`question-${question.id}`}
      className={cn(
        "relative mb-5 scroll-mt-24 rounded-2xl bg-white dark:bg-[#000000] border transition-all duration-200 shadow-sm font-['HindSiliguri']",
        isFlagged
          ? "border-orange-500 ring-2 ring-orange-500/30"
          : "border-neutral-200/90 dark:border-neutral-800"
      )}
    >
      {/* ── Top Header Section: Serial + Question text + Tags ── */}
      <div className="p-4 sm:p-5">
        {/* Stimulus / Passage (উদ্দীপক) if present */}
        {question.passage && (
          <div className="mb-3.5 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-1 uppercase tracking-wider">
              উদ্দীপক
            </span>
            <MathRenderer text={question.passage} />
          </div>
        )}

        {/* Question Text with Bengali Serial Number */}
        <div className="flex items-start gap-2.5 mb-3">
          {serialNumber !== undefined && (
            <span className="shrink-0 text-base sm:text-lg font-black text-neutral-900 dark:text-white leading-snug">
              {BanglaNameHelper.toBanglaNumeral(serialNumber)}.
            </span>
          )}
          <div className="flex-1 min-w-0 text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-snug">
            <MathRenderer text={question.question} />
          </div>
        </div>

        {/* Question Image (if any) */}
        {question.imageUrl && (
          <div className="my-3 max-w-md mx-auto rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2">
            <img
              src={question.imageUrl}
              alt="Question illustration"
              className="max-h-64 mx-auto object-contain rounded-lg"
            />
          </div>
        )}

        {/* Source Tags & Actions Toolbar */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          {/* Source Tag Badge */}
          {!hideMetadata && sourceTags ? (
            <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#e8f4f0] dark:bg-[#0d3326] text-[#1a7a5a] dark:text-[#4ecca3] text-xs font-bold tracking-wide">
              {sourceTags}
            </div>
          ) : (
            <div />
          )}

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Flag for Review */}
            {onToggleFlag && !showFeedback && (
              <button
                type="button"
                onClick={onToggleFlag}
                title={isFlagged ? "ফ্ল্যাগ বাতিল করো" : "রিভিউর জন্য ফ্ল্যাগ করো"}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition",
                  isFlagged
                    ? "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-700"
                    : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                <Flag size={13} className={isFlagged ? "fill-orange-500" : ""} />
                <span>{isFlagged ? "ফ্ল্যাগকৃত" : "ফ্ল্যাগ"}</span>
              </button>
            )}

            {/* Bookmark Button */}
            {onToggleBookmark && (
              <button
                type="button"
                onClick={onToggleBookmark}
                title={isBookmarked ? "বুকমার্ক সরানো হয়েছে" : "বুকমার্কে যোগ করো"}
                className={cn(
                  "p-1.5 rounded-lg transition",
                  isBookmarked
                    ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
                    : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                <Bookmark size={16} className={isBookmarked ? "fill-amber-500" : ""} />
              </button>
            )}

            {/* Report Question Button */}
            {onReport && (
              <button
                type="button"
                onClick={onReport}
                title="ভুল প্রশ্ন রিপোর্ট করো"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
              >
                <AlertTriangle size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Options List Section ── */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 flex flex-col gap-2.5">
        {question.options.map((option, idx) => {
          const banglaIndex = BANGLA_INDICES[idx] || `${idx + 1}`;
          const isSelected = isUserSelected(idx);
          const isCorrect = isCorrectAnswer(idx);

          // Determine option styling based on mode (Active Exam vs Feedback/Review)
          let optionStyle =
            "bg-[#F8FAFC] dark:bg-[#121214] border-[#E2E8F0] dark:border-[#27272A] text-neutral-800 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700";
          let badgeStyle =
            "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700";
          let rightIcon: React.ReactNode = null;

          if (showFeedback || showAnswer) {
            // In Review / Result Mode:
            if (isCorrect) {
              optionStyle =
                "bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm";
              badgeStyle = "bg-emerald-600 text-white border-emerald-600";
              rightIcon = <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />;
            } else if (isSelected && !isCorrect) {
              optionStyle =
                "bg-red-50/90 dark:bg-red-950/30 border-red-500 text-red-900 dark:text-red-200 shadow-sm";
              badgeStyle = "bg-red-600 text-white border-red-600";
              rightIcon = <X size={16} className="text-red-600 dark:text-red-400 shrink-0" />;
            } else {
              optionStyle =
                "bg-[#F8FAFC]/50 dark:bg-[#121214]/50 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 opacity-60";
            }
          } else {
            // In Active Exam Mode:
            if (isSelected) {
              optionStyle =
                "bg-[#004633] dark:bg-[#003D2C] border-[#004633] dark:border-[#059669] text-white dark:text-[#E6FFFA] shadow-md shadow-[#004633]/20";
              badgeStyle = "bg-white dark:bg-[#10B981] text-[#004633] dark:text-black border-white dark:border-[#10B981]";
              rightIcon = (
                <div className="w-5 h-5 rounded-full bg-white dark:bg-[#10B981] flex items-center justify-center shrink-0">
                  <Check size={12} className="text-[#004633] dark:text-black stroke-[3]" />
                </div>
              );
            }
          }

          const optionImageUrl = question.optionImages?.[idx];

          return (
            <button
              key={idx}
              type="button"
              disabled={readOnly || showFeedback}
              onClick={() => onSelectOption && onSelectOption(idx)}
              className={cn(
                "w-full flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all text-left group",
                optionStyle,
                !readOnly && !showFeedback && "cursor-pointer active:scale-[0.99]"
              )}
            >
              {/* Option Alphabet Badge (ক, খ, গ, ঘ) */}
              <span
                className={cn(
                  "w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-black shrink-0 transition-colors mt-0.5",
                  badgeStyle
                )}
              >
                {banglaIndex}
              </span>

              {/* Option Text & Image */}
              <div className="flex-1 min-w-0 flex flex-col gap-1.5 pt-0.5">
                <div className="text-base font-semibold leading-relaxed">
                  <MathRenderer text={option} />
                </div>
                {optionImageUrl && (
                  <img
                    src={optionImageUrl}
                    alt={`Option ${banglaIndex}`}
                    className="max-h-32 object-contain rounded-lg border border-neutral-200 dark:border-neutral-800 mt-1 bg-white p-1"
                  />
                )}
              </div>

              {/* Right Selection / Check Icon */}
              {rightIcon}
            </button>
          );
        })}
      </div>

      {/* ── Explanation Accordion Section (in Feedback/Review mode) ── */}
      {showFeedback && (question.explanation || question.explanationImageUrl) && (
        <div className="border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setIsExplanationOpen(!isExplanationOpen)}
            className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition rounded-b-2xl"
          >
            <div className="flex items-center gap-1.5">
              <HelpCircle size={15} />
              <span>{isExplanationOpen ? "ব্যাখ্যা লুকান" : "বিস্তারিত ব্যাখ্যা দেখুন"}</span>
            </div>
            {isExplanationOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isExplanationOpen && (
            <div className="px-5 pb-5 pt-1 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block mb-1.5">
                  ব্যাখ্যা:
                </span>
                {question.explanation && <MathRenderer text={question.explanation} />}
                {question.explanationImageUrl && (
                  <img
                    src={question.explanationImageUrl}
                    alt="Explanation diagram"
                    className="max-h-48 object-contain rounded-lg border border-emerald-200 dark:border-emerald-800 mt-2 bg-white p-1"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
