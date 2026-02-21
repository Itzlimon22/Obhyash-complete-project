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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="timeout-title"
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-300"
    >
      <div className="relative w-full max-w-lg animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 ease-out">
        {/* Top accent — red */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-red-600 rounded-t-3xl" />

        <div className="rounded-t-3xl sm:rounded-3xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl px-6 pb-8 pt-5 text-center max-h-[50vh] sm:max-h-none overflow-y-auto">
          {/* Drag handle */}
          <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700 sm:hidden" />

          {/* Clock icon badge */}
          <div className="mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600 shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="white"
              className="w-8 h-8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>

          <h3
            id="timeout-title"
            className="text-2xl font-bold text-neutral-900 dark:text-white mb-2"
          >
            সময় শেষ!
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8 max-w-sm mx-auto">
            দুঃখিত, নির্ধারিত সময়ের মধ্যে উত্তরপত্র জমা দিতে পারোনি। পরীক্ষাটি
            বাতিল হয়ে গেছে।
          </p>

          {/* Stacked buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={onReattempt}
              className="w-full py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 active:scale-[0.98] text-white font-bold text-sm transition-all duration-150 shadow-md"
            >
              আবার পরীক্ষা দাও
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 rounded-2xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-medium text-sm transition-colors duration-150"
            >
              বাতিল করো
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeoutModal;
