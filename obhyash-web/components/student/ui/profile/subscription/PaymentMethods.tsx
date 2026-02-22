'use client';

import React from 'react';
import { PaymentMethod } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Plus, Trash2, CreditCard, Wallet } from 'lucide-react';

interface PaymentMethodsProps {
  methods: PaymentMethod[];
  onAddMethod: () => void;
  onDelete: (id: string) => void;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  methods,
  onAddMethod,
  onDelete,
}) => {
  const getMethodIcon = (type: string) => {
    if (type === 'bkash') {
      return (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white text-[10px] font-black shadow-sm">
          bK
        </div>
      );
    }
    if (type === 'nagad') {
      return (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-[10px] font-black shadow-sm">
          N
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <CreditCard className="w-4 h-4 text-neutral-500" />
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 overflow-hidden h-full">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-neutral-400" />
          <h3 className="text-base font-bold text-neutral-800 dark:text-white">
            পেমেন্ট মেথড
          </h3>
        </div>
        <button
          onClick={onAddMethod}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          যুক্ত করো
        </button>
      </div>

      {/* Content */}
      {methods.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
          <div className="w-14 h-14 mb-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
            <Wallet className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />
          </div>
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
            কোনো মেথড নেই
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-[180px]">
            bKash বা Nagad যুক্ত করো সহজ পেমেন্টের জন্য।
          </p>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          {methods.map((method) => (
            <div
              key={method.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-xl border transition-colors',
                'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30',
                'hover:border-neutral-200 dark:hover:border-neutral-700',
              )}
            >
              <div className="flex items-center gap-3">
                {getMethodIcon(method.type)}
                <div>
                  <p className="font-bold text-sm text-neutral-800 dark:text-white">
                    {method.type === 'card'
                      ? `Visa •••• ${method.last4}`
                      : `${method.type === 'bkash' ? 'bKash' : 'Nagad'}`}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {method.number ||
                      (method.expiry && `Exp: ${method.expiry}`)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {method.isDefault && (
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase rounded-full">
                    Default
                  </span>
                )}
                <button
                  onClick={() => onDelete(method.id)}
                  className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
