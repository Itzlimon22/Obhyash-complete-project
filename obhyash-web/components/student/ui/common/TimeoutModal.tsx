import React from 'react';

interface TimeoutModalProps {
  onReattempt: () => void;
  onCancel: () => void;
}

const TimeoutModal: React.FC<TimeoutModalProps> = ({
  onReattempt,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-xl rounded-b-none sm:rounded-b-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 shadow-2xl max-w-md w-full p-8 border border-neutral-100 dark:border-neutral-800 text-center transform transition-all duration-300">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-10 h-10"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          সময় শেষ!
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
          দুঃখিত, আপনি নির্ধারিত সময় এবং অতিরিক্ত সময়ের মধ্যে উত্তরপত্র জমা দিতে
          পারেননি। পরীক্ষাটি বাতিল হয়ে গেছে।
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onReattempt}
            className="w-full py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold transition-colors shadow-sm"
          >
            আবার পরীক্ষা দিন
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            পরীক্ষা বাতিল করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeoutModal;
