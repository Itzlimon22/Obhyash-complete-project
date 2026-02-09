import React, { useState } from 'react';

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: 'bkash' | 'nagad', number: string) => void;
  isLoading?: boolean;
}

import Portal from '@/components/ui/portal';

const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [type, setType] = useState<'bkash' | 'nagad'>('bkash');
  const [number, setNumber] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (number.length < 11) {
      alert('সঠিক নম্বর দিন');
      return;
    }
    onSubmit(type, number);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden transform transition-all scale-100 border border-neutral-100 dark:border-neutral-800">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                নতুন পেমেন্ট মেথড
              </h3>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-2">
                  অ্যাকাউন্ট টাইপ
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('bkash')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${type === 'bkash' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-500'}`}
                  >
                    <span className="font-bold">bKash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('nagad')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${type === 'nagad' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-500'}`}
                  >
                    <span className="font-bold">Nagad</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-2">
                  মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    যুক্ত হচ্ছে...
                  </>
                ) : (
                  'যুক্ত করুন'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default AddPaymentMethodModal;
