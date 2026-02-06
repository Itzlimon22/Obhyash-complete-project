
import React from 'react';
import { Question } from '@/lib/types';
import LatexText from './LatexText';

interface QuestionCardProps {
  question: Question;
  selectedOptionIndex: number | undefined;
  isFlagged: boolean;
  onSelectOption: (optionIndex: number) => void;
  onToggleFlag: () => void;
  onReport?: () => void;
}

// Extended Bangla characters for indices to handle more than 4 options gracefully
const BANGLA_INDICES = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'];

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  selectedOptionIndex, 
  isFlagged,
  onSelectOption,
  onToggleFlag,
  onReport
}) => {
  const isAnswered = selectedOptionIndex !== undefined;

  return (
    <div 
      id={`question-${question.id}`} 
      className="bg-white dark:bg-neutral-900 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] dark:shadow-none border border-neutral-200 dark:border-neutral-800 mb-6 md:mb-8 scroll-mt-24 overflow-hidden transition-all hover:shadow-md"
    >
      {/* Header Section */}
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs md:text-sm">
            {question.id.toString().padStart(2, '0')}
          </div>
          <div className="flex flex-col">
            <span className="text-xs md:text-sm font-bold text-neutral-500 dark:text-neutral-400">প্রশ্ন {question.id}</span>
            <span className="text-sm md:text-base font-bold text-neutral-800 dark:text-neutral-200 leading-none">{question.points} নম্বর</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {onReport && (
            <button
              onClick={onReport}
              className="p-2 md:p-2.5 rounded-full text-neutral-400 dark:text-neutral-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="প্রশ্ন রিপোর্ট করুন"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </button>
          )}
          
          <button 
            onClick={onToggleFlag}
            className={`
              transition-all duration-200 p-2 md:p-2.5 rounded-full 
              ${isFlagged ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400' : 'text-neutral-400 dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-600 dark:hover:text-neutral-400'}
            `}
            title={isFlagged ? "বুকমার্ক সরান" : "বুকমার্ক করুন"}
          >
            {isFlagged ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 11.186 0Z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 md:px-6 md:py-6">
        {/* Question Text - Clean Sans Serif */}
        <h3 className="text-neutral-900 dark:text-neutral-100 font-semibold text-base md:text-lg leading-relaxed mb-6">
          <LatexText text={question.question} />
        </h3>

        <div className="flex flex-col gap-3">
          {question.options.map((option, idx) => {
            const isSelected = selectedOptionIndex === idx;
            const banglaIndex = BANGLA_INDICES[idx] || (idx + 1).toString();
            
            return (
              <label 
                key={idx}
                className={`
                  group relative flex items-center p-3 md:p-4 rounded-xl transition-all border-2
                  ${isAnswered ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}
                  ${isSelected 
                    ? 'bg-indigo-50/60 dark:bg-indigo-900/20 border-indigo-600 dark:border-indigo-500 shadow-sm' 
                    : 'bg-white dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }
                `}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={isSelected}
                  onChange={() => !isAnswered && onSelectOption(idx)}
                  disabled={isAnswered}
                  className="sr-only" 
                />
                
                {/* Index Bubble */}
                <div className={`
                  flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold border transition-colors mr-3 md:mr-4
                  ${isSelected 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 group-hover:text-neutral-700 dark:group-hover:text-neutral-300'
                  }
                `}>
                  {banglaIndex}
                </div>
                
                {/* Option Text */}
                <span className={`text-sm md:text-[17px] font-medium leading-normal flex-1 ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  <LatexText text={option} />
                </span>

                {/* Selection Indicator */}
                <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center ml-2 transition-colors flex-shrink-0
                    ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-neutral-300 dark:border-neutral-600'}
                `}>
                    {isSelected && (
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                         </svg>
                    )}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
