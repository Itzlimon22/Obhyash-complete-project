import React from 'react';

interface OmrErrorModalProps {
  error: string;
  onRetry: () => void;
  onSendToExaminer: () => void;
  onCancel: () => void;
}

const OmrErrorModal: React.FC<OmrErrorModalProps> = ({
  error,
  onRetry,
  onSendToExaminer,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-xl rounded-b-none sm:rounded-b-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 shadow-2xl max-w-md w-full p-6 border border-neutral-100 dark:border-neutral-800 transform transition-all duration-300">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              মূল্যায়ন ত্রুটি
            </h3>
            <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {error}
            </p>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-500">
              আপনি কি আবার চেষ্টা করতে চান, নাকি উত্তরপত্রটি পরীক্ষকের কাছে
              পাঠাতে চান?
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm"
          >
            বাতিল
          </button>
          <button
            onClick={onSendToExaminer}
            className="px-4 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-sm"
          >
            ম্যানুয়ালি পাঠান
          </button>
          <button
            onClick={onRetry}
            className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold transition-colors shadow-sm text-sm"
          >
            পুনরায় চেষ্টা
          </button>
        </div>
      </div>
    </div>
  );
};

export default OmrErrorModal;
