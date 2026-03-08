'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserProfile } from '@/lib/types';

export const EXAM_TARGETS = [
  { id: 'hsc_2026', label: 'এইচএসসি ২০২৬', sub: 'HSC 2026', emoji: '📚' },
  { id: 'hsc_2027', label: 'এইচএসসি ২০২৭', sub: 'HSC 2027', emoji: '📚' },
  {
    id: 'mbbs_2026',
    label: 'মেডিকেল ভর্তি ২০২৬',
    sub: 'MBBS Admission',
    emoji: '🏥',
  },
  {
    id: 'mbbs_2027',
    label: 'মেডিকেল ভর্তি ২০২৭',
    sub: 'MBBS Admission',
    emoji: '🏥',
  },
  { id: 'ssc_2026', label: 'এসএসসি ২০২৬', sub: 'SSC 2026', emoji: '✏️' },
  { id: 'ssc_2027', label: 'এসএসসি ২০২৭', sub: 'SSC 2027', emoji: '✏️' },
  { id: 'other', label: 'অন্যান্য', sub: 'Other', emoji: '🎯' },
];

interface ExamTargetModalProps {
  user: UserProfile;
  onClose: (updatedTarget?: string) => void;
}

const ExamTargetModal: React.FC<ExamTargetModalProps> = ({ user, onClose }) => {
  const [selected, setSelected] = useState<string>(user.exam_target ?? '');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await supabase
        .from('users')
        .update({ exam_target: selected })
        .eq('id', user.id);
      onClose(selected);
    } catch {
      onClose(selected);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onClose()}
      />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-800 p-6 animate-slide-up sm:animate-fade-in mx-0 sm:mx-4">
        {/* Handle (mobile) */}
        <div className="w-10 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto mb-5 sm:hidden" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
            🎯
          </div>
          <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">
            তোমার লক্ষ্য কী?
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            তোমার পরীক্ষার লক্ষ্য নির্বাচন করো — আমরা সেই অনুযায়ী তোমাকে
            সাহায্য করব
          </p>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-6 max-h-72 overflow-y-auto pr-1">
          {EXAM_TARGETS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={`flex items-center justify-center p-3 rounded-xl border-2 text-center transition-all active:scale-95 ${
                selected === t.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-600'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800/50'
              }`}
            >
              <p
                className={`text-xs font-extrabold leading-tight ${
                  selected === t.id
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-neutral-800 dark:text-neutral-200'
                }`}
              >
                {t.label}
              </p>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="w-full py-3 rounded-xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 text-white disabled:text-neutral-400 dark:disabled:text-neutral-500 transition-all active:scale-[0.98]"
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'লক্ষ্য নির্ধারণ করো'}
          </button>
          <button
            onClick={() => onClose()}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            পরে সেট করবো
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamTargetModal;
