import React from 'react';
import Portal from '@/components/ui/portal';

interface NavigationWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const NavigationWarningModal: React.FC<NavigationWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nav-warning-title"
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-300"
      >
        <div className="relative w-full max-w-lg animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 ease-out">
          {/* Top accent line — red (destructive action) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-red-600 rounded-t-3xl" />

          <div className="rounded-t-3xl sm:rounded-3xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl px-6 pb-8 pt-5">
            {/* Drag handle */}
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700 sm:hidden" />

            {/* Icon + Heading */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-red-600 shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="white"
                  className="w-6 h-6"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  id="nav-warning-title"
                  className="text-lg font-bold text-neutral-900 dark:text-white leading-snug"
                >
                  পরীক্ষা বাতিল হবে!
                </h3>
                <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  তুমি এখন লাইভ পরীক্ষায় আছো। এই পেজ থেকে বের হলে পরীক্ষাটি
                  বাতিল হয়ে যাবে এবং কোনো ফলাফল সংরক্ষিত হবে না।
                </p>
              </div>
            </div>

            {/* Warning banner */}
            <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 px-4 py-3 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 flex-shrink-0 text-red-600"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                তুমি কি নিশ্চিত যে বের হতে চাও?
              </p>
            </div>

            {/* Stacked buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={onConfirm}
                className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-sm transition-all duration-150 shadow-md"
              >
                হ্যাঁ, বের হবো
              </button>
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-white dark:bg-black hover:bg-neutral-100 dark:hover:bg-neutral-900 active:scale-[0.98] text-black dark:text-white font-semibold text-sm border border-neutral-300 dark:border-neutral-700 transition-all duration-150"
              >
                না, পরীক্ষা দেবো
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default NavigationWarningModal;
