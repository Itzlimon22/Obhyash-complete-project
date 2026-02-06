import React, { useState } from 'react';

interface SubjectData {
  name: string;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
}

interface SubjectStatProps {
  data: SubjectData[];
  onSubjectClick: (subject: string) => void;
}

const SubjectItem: React.FC<{ subject: SubjectData; onClick: () => void }> = ({
  subject,
  onClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const accuracy =
    subject.total > 0 ? Math.round((subject.correct / subject.total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
      {/* Header - Always Visible - Click to Toggle */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer bg-white dark:bg-neutral-900 transition-colors select-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-base group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
          {subject.name}
        </h4>

        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-bold ${accuracy >= 80 ? 'text-emerald-600' : accuracy >= 50 ? 'text-amber-500' : 'text-neutral-500'}`}
          >
            {accuracy}%
          </span>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-800 text-neutral-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 transition-colors"
            aria-label="Toggle details"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-0 border-t border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-800/20">
            {/* Stats Grid */}
            <div className="flex gap-4 text-xs font-medium text-neutral-600 dark:text-neutral-400 py-4 justify-between sm:justify-start sm:gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-none"></div>
                <span>{subject.correct} সঠিক</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-200 dark:shadow-none"></div>
                <span>{subject.wrong} ভুল</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-200 dark:shadow-none"></div>
                <span>{subject.skipped} স্কিপড</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden flex mb-4">
              <div
                style={{
                  width: `${(subject.correct / Math.max(subject.total, 1)) * 100}%`,
                }}
                className="h-full bg-emerald-500"
              ></div>
              <div
                style={{
                  width: `${(subject.wrong / Math.max(subject.total, 1)) * 100}%`,
                }}
                className="h-full bg-red-500"
              ></div>
            </div>

            {/* Footer Button (The "See Detailed Report" button) */}
            <div className="flex justify-center border-t border-neutral-200 dark:border-neutral-700/50 pt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1.5 transition-colors bg-rose-50 dark:bg-rose-900/10 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-800"
              >
                বিস্তারিত রিপোর্ট দেখো
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-3 h-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SubjectStat: React.FC<SubjectStatProps> = ({ data, onSubjectClick }) => {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-neutral-800 dark:text-white">
          সাবজেক্ট ভিত্তিক রিপোর্ট
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {data.map((subject, idx) => (
          <SubjectItem
            key={idx}
            subject={subject}
            onClick={() => onSubjectClick(subject.name)}
          />
        ))}

        {data.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-8 text-neutral-400 text-sm bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700">
            এখনও কোনো পরীক্ষা দেওয়া হয়নি।
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectStat;
