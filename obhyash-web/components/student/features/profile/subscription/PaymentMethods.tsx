
import React from 'react';
import { PaymentMethod } from '@/lib/types';

interface PaymentMethodsProps {
  methods: PaymentMethod[];
  onAddMethod: () => void;
  onDelete: (id: string) => void;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ methods, onAddMethod, onDelete }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">পেমেন্ট মেথড</h3>
            <button 
                onClick={onAddMethod}
                className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                যুক্ত করুন
            </button>
        </div>

        <div className="space-y-3">
            {methods.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm">কোনো পেমেন্ট মেথড যুক্ত করা হয়নি।</p>
            ) : (
                methods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                                {method.type === 'bkash' && <span className="font-bold text-red-600 text-xs">bKash</span>}
                                {method.type === 'nagad' && <span className="font-bold text-red-600 text-xs">Nagad</span>}
                                {method.type === 'card' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600 dark:text-slate-300">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white text-sm">
                                    {method.type === 'card' ? `Visa ending in ${method.last4}` : `${method.type === 'bkash' ? 'bKash' : 'Nagad'} - ${method.number}`}
                                </p>
                                {method.expiry && <p className="text-xs text-slate-500">Expires {method.expiry}</p>}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {method.isDefault && (
                                <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase rounded">Default</span>
                            )}
                            <button 
                                onClick={() => onDelete(method.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                title="মুছে ফেলুন"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

export default PaymentMethods;
