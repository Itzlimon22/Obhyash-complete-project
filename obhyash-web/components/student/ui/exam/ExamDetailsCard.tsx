import React from 'react';
import { ExamDetails } from '@/lib/types';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';
import {
  Clock,
  BookOpen,
  AlertCircle,
  Target,
  Layers,
  Award,
} from 'lucide-react';

interface ExamDetailsCardProps {
  details: ExamDetails;
  totalQuestions: number;
  negativeMarking?: number;
}

const ExamDetailsCard: React.FC<ExamDetailsCardProps> = ({
  details,
  totalQuestions,
  negativeMarking = 0.25,
}) => {
  const subjectName =
    details.subjectLabel || getSubjectDisplayName(details.subject);

  // Calculate Full Marks if not explicitly provided
  const fullMarks = details.totalMarks || totalQuestions;

  const infoItems = [
    {
      label: 'বিষয়',
      value: subjectName,
      icon: BookOpen,
      color: 'emerald',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      iconBg: 'bg-emerald-500',
    },
    {
      label: 'অধ্যায়',
      value: details.chapters || 'সকল অধ্যায়',
      icon: Layers,
      color: 'indigo',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      text: 'text-indigo-700 dark:text-indigo-300',
      iconBg: 'bg-indigo-500',
    },
    {
      label: 'সময়',
      value: `${details.durationMinutes || 0} মিনিট`,
      icon: Clock,
      color: 'sky',
      bg: 'bg-sky-50 dark:bg-sky-900/20',
      text: 'text-sky-700 dark:text-sky-300',
      iconBg: 'bg-sky-500',
    },
    {
      label: 'মোট প্রশ্ন',
      value: `${totalQuestions} টি`,
      icon: Target,
      color: 'violet',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      text: 'text-violet-700 dark:text-violet-300',
      iconBg: 'bg-violet-500',
    },
    {
      label: 'নেগেটিভ মার্ক',
      value: negativeMarking > 0 ? `-${negativeMarking}` : 'নেই',
      icon: AlertCircle,
      color: negativeMarking > 0 ? 'red' : 'neutral',
      bg:
        negativeMarking > 0
          ? 'bg-red-50 dark:bg-red-900/20'
          : 'bg-neutral-50 dark:bg-neutral-800/20',
      text:
        negativeMarking > 0
          ? 'text-red-700 dark:text-red-300'
          : 'text-neutral-600 dark:text-neutral-400',
      iconBg: negativeMarking > 0 ? 'bg-red-500' : 'bg-neutral-400',
    },
    {
      label: 'পূর্ণমান',
      value: `${fullMarks}`,
      icon: Award,
      color: 'amber',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-700 dark:text-amber-300',
      iconBg: 'bg-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
      {infoItems.map((item, idx) => (
        <div
          key={idx}
          className={`
            flex flex-col gap-2 p-3 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50
            ${item.bg} shadow-sm transition-all hover:scale-[1.02]
          `}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0 shadow-sm`}
            >
              <item.icon size={14} className="text-white" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 opacity-80">
              {item.label}
            </p>
          </div>
          <div className="flex items-end justify-between">
            <p
              className={`text-base font-black truncate leading-tight ${item.text}`}
            >
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExamDetailsCard;

export default ExamDetailsCard;
