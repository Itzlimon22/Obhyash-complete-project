import React from 'react';
import { ExamDetails } from '@/lib/types';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';
// Icon imports removed for simplified layout

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
    { label: 'বিষয়', value: subjectName },
    { label: 'অধ্যায়', value: details.chapters || 'সকল অধ্যায়' },
    { label: 'সময়', value: `${details.durationMinutes || 0} মিনিট` },
    { label: 'মোট প্রশ্ন', value: `${totalQuestions} টি` },
    {
      label: 'নেগেটিভ মার্ক',
      value: negativeMarking > 0 ? `-${negativeMarking}` : 'নেই',
    },
    { label: 'পূর্ণমান', value: `${fullMarks}` },
  ];

  return (
    <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200/60 dark:border-neutral-800/60 rounded-[2rem] p-5 md:p-7 shadow-sm mb-6">
      <div className="grid grid-cols-3 gap-y-6 md:gap-y-8 gap-x-4">
        {infoItems.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1.5 md:gap-2">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500">
              {item.label}
            </p>
            <p className="text-sm md:text-lg font-black text-neutral-900 dark:text-white leading-tight break-words lg:truncate">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamDetailsCard;
