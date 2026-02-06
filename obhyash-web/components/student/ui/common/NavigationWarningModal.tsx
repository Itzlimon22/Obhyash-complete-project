import React from 'react';

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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-neutral-100 dark:border-neutral-700 transform transition-all scale-100">
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
              পরীক্ষা বাতিল হবে!
            </h3>
            <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
              আপনি এখন লাইভ পরীক্ষায় আছেন। এই পেজ থেকে বের হলে পরীক্ষাটি বাতিল
              হয়ে যাবে এবং কোনো ফলাফল সংরক্ষিত হবে না।
            </p>
            <p className="mt-2 text-sm font-bold text-neutral-800 dark:text-neutral-300">
              আপনি কি নিশ্চিত যে আপনি বের হতে চান?
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-base"
          >
            না, পরীক্ষা দিব
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm transition-colors text-base"
          >
            হ্যাঁ, বের হবো
          </button>
        </div>
      </div>
    </div>
  );
};

export default NavigationWarningModal;
