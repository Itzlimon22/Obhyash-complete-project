import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  unansweredCount: number;
  isOmrMode?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  unansweredCount,
  isOmrMode = false,
}) => {
  if (!isOpen) return null;

  const isWarning = !isOmrMode && unansweredCount > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-xl rounded-b-none sm:rounded-b-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 shadow-2xl max-w-md w-full p-6 border border-neutral-100 dark:border-neutral-700 transform transition-all duration-300">
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 p-3 rounded-full ${isWarning ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}
          >
            {isOmrMode ? (
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
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            ) : isWarning ? (
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
            ) : (
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
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              {isOmrMode
                ? 'OMR জমা নিশ্চিতকরণ'
                : isWarning
                  ? 'অসম্পূর্ণ জমা'
                  : 'নিশ্চিতকরণ'}
            </h3>
            <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isOmrMode
                ? 'আপনি কি আপনার OMR উত্তরপত্র জমা দিয়ে মূল্যায়নের জন্য পাঠাতে প্রস্তুত?'
                : isWarning
                  ? `আপনি এখনও ${unansweredCount}টি প্রশ্নের উত্তর দেননি। আপনি কি নিশ্চিত যে আপনি এখনই পরীক্ষা জমা দিতে চান?`
                  : 'আপনি সব প্রশ্নের উত্তর দিয়েছেন। আপনি কি আপনার উত্তরপত্র জমা দিতে প্রস্তুত?'}
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-base"
          >
            ফিরে যান
          </button>
          <button
            onClick={onConfirm}
            className={`
              px-5 py-2.5 rounded-lg text-white font-bold shadow-sm transition-colors text-base
              ${isWarning ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500' : 'bg-emerald-700 hover:bg-emerald-800'}
            `}
          >
            জমা দিন
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
