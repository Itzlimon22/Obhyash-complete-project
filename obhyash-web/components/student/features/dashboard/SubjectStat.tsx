import React, { useState } from 'react';

interface SubjectData {
  id?: string;
  name: string;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
}

interface SubjectStatProps {
  data: SubjectData[];
  onSubjectClick?: (subject: string) => void;
  isLoading?: boolean;
}

const SubjectItem: React.FC<{
  subject: SubjectData;
  onClick?: () => void;
}> = ({ subject, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const accuracy =
    subject.total > 0 ? Math.round((subject.correct / subject.total) * 100) : 0;

  return (
    <div
      className={`bg-white dark:bg-neutral-800/50 rounded-2xl border transition-all duration-300 shadow-sm ${isOpen ? 'border-rose-200 dark:border-rose-900 shadow-md ring-1 ring-rose-100 dark:ring-rose-900/50' : 'border-neutral-200 dark:border-neutral-700 hover:shadow-md'}`}
    >
      <div
        className="p-4 flex items-center justify-between cursor-pointer select-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-1.5 h-8 rounded-full transition-colors ${isOpen ? 'bg-rose-500' : 'bg-neutral-200 dark:bg-neutral-700 group-hover:bg-rose-400'}`}
          ></div>
          <h4
            className={`font-bold text-base transition-colors ${isOpen ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-800 dark:text-neutral-200 group-hover:text-rose-600 dark:group-hover:text-rose-400'}`}
          >
            {subject.name}
          </h4>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-black ${accuracy >= 80 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : accuracy >= 50 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}
          >
            {accuracy}%
          </div>
          <button
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${isOpen ? 'bg-rose-50 text-rose-600 rotate-180 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-neutral-50 text-neutral-500 dark:bg-neutral-800  group-hover:bg-rose-50 group-hover:text-rose-600 dark:group-hover:bg-rose-900/20'}`}
            aria-label="Toggle details"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4"
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

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-5 pt-1 border-t border-neutral-100 dark:border-neutral-700/50 bg-neutral-50/50 dark:bg-neutral-800/10">
            <div className="grid grid-cols-3 gap-2 py-4">
              <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 text-center shadow-sm">
                <span className="block text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">
                  সঠিক
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                  {subject.correct}
                </span>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 text-center shadow-sm">
                <span className="block text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">
                  ভুল
                </span>
                <span className="text-lg font-black text-rose-500 dark:text-rose-400 leading-tight">
                  {subject.wrong}
                </span>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 text-center shadow-sm">
                <span className="block text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">
                  স্কিপড
                </span>
                <span className="text-lg font-black text-amber-500 dark:text-amber-400 leading-tight">
                  {subject.skipped}
                </span>
              </div>
            </div>

            <div className="relative h-2.5 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden flex mb-4">
              <div
                style={{
                  width: `${(subject.correct / Math.max(subject.total, 1)) * 100}%`,
                }}
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-sm relative z-10"
              ></div>
              <div
                style={{
                  width: `${(subject.wrong / Math.max(subject.total, 1)) * 100}%`,
                }}
                className="h-full bg-gradient-to-r from-rose-400 to-rose-600 shadow-sm relative z-10"
              ></div>
            </div>

            {/* Conditionally render Details button */}
            {onClick && (
              <div className="flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                >
                  বিস্তারিত রিপোর্ট
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SubjectStat: React.FC<SubjectStatProps> = ({
  data,
  onSubjectClick,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-neutral-800 dark:text-white">
            সাবজেক্ট ভিত্তিক রিপোর্ট
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                  <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </div>
                <div className="h-6 w-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
            onClick={
              onSubjectClick
                ? () => onSubjectClick(subject.id || subject.name)
                : undefined
            }
          />
        ))}

        {data.length === 0 && (
          <div className="text-center py-8 text-neutral-400 text-sm bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700">
            এখনও কোনো পরীক্ষা দেওয়া হয়নি।
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectStat;
