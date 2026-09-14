import React, { useState } from 'react';
import {
  SubscriptionPlan,
  PaymentMethod,
} from '@/lib/types';
import { ArrowLeft, Clock, Info, Headphones, X, Plus, Trash2, Zap, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { addPaymentMethod, deletePaymentMethod } from '@/services/subscription-service';
import { createClient } from '@/utils/supabase/client';

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  savedMethods?: PaymentMethod[];
  onConfirm: (data: { method: string; number: string; trxId: string }) => void;
}

type TabId = 'details' | 'support' | 'info';

const ManualPaymentModal: React.FC<ManualPaymentModalProps> = ({
  isOpen,
  onClose,
  plan,
  savedMethods = [],
  onConfirm,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [paymentMode, setPaymentMode] = useState<'instant' | 'manual'>('instant');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Saved Methods Management Modal State
  const [localSavedMethods, setLocalSavedMethods] = useState<PaymentMethod[]>(savedMethods);
  const [isManageMethodsOpen, setIsManageMethodsOpen] = useState(false);
  const [manageTab, setManageTab] = useState<'list' | 'add'>(savedMethods.length === 0 ? 'add' : 'list');
  const [newMethodType, setNewMethodType] = useState<'bkash' | 'nagad' | 'card'>('bkash');
  const [newMethodNumber, setNewMethodNumber] = useState('');
  const [isSavingMethod, setIsSavingMethod] = useState(false);

  if (!isOpen || !plan) return null;

  const handleInstantPayment = async () => {
    try {
      setIsRedirecting(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('পেমেন্ট করতে অনুগ্রহ করে আগে লগইন করুন');
        setIsRedirecting(false);
        return;
      }

      const res = await fetch('/api/payment/uddoktapay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          customerEmail: user.email,
        }),
      });

      const data = await res.json();
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.error(data.error || 'পেমেন্ট গেটওয়ে লোড করা সম্ভব হয়নি');
      }
    } catch (e: any) {
      toast.error('পেমেন্ট শুরু করতে সমস্যা হয়েছে: ' + (e.message || 'Error'));
    } finally {
      setIsRedirecting(false);
    }
  };

  const isValidTrxId = (rawTrx: string, method: string) => {
    const trx = rawTrx.trim().toUpperCase();
    const isBkash = method.toLowerCase().includes('bkash');
    const isNagad = method.toLowerCase().includes('nagad');

    // Length check: bKash = 10, Nagad = 8, Others = 8 or 10
    if (isBkash && trx.length !== 10) return false;
    if (isNagad && trx.length !== 8) return false;
    if (!isBkash && !isNagad && trx.length !== 8 && trx.length !== 10) return false;

    // Only alphanumeric
    if (!/^[A-Z0-9]+$/.test(trx)) return false;

    // Must combine letters and digits
    const hasLetter = /[A-Z]/.test(trx);
    const hasDigit = /[0-9]/.test(trx);
    if (!hasLetter || !hasDigit) return false;

    // Anti-spam repetition filter
    if (new Set(trx.split('')).size <= 2) return false;

    const dummyTrx = new Set([
      '12345678',
      '1234567890',
      '00000000',
      '0000000000',
      'AAAAAAAA',
      'AAAAAAAAAA',
      'ABCDEFGH',
      'ABCDEFGHIJ',
      'TEST1234',
      'TEST123456',
      'ASDFGHJK',
      'ASDFGHJKLM',
      'TRANSACTIO',
      'TRANSACTION',
    ]);
    if (dummyTrx.has(trx)) return false;

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!senderNumber.trim() || !trxId.trim()) {
      toast.error('অনুগ্রহ করে সব তথ্য পূরণ করো');
      return;
    }

    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(senderNumber.trim())) {
      toast.error('সঠিক মোবাইল নম্বর দাও (১১ ডিজিটের মোবাইল নম্বর)');
      return;
    }

    if (!isValidTrxId(trxId, paymentMethod)) {
      toast.error('ভুল ট্রানজেকশন আইডি! অনুগ্রহ করে সঠিক ট্রানজেকশন আইডি দিন।');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onConfirm({
        method: paymentMethod,
        number: senderNumber,
        trxId: trxId.trim().toUpperCase(),
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('নম্বর কপি করা হয়েছে!');
  };

  const handleAddNewMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(newMethodNumber.trim())) {
      toast.error('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)');
      return;
    }

    setIsSavingMethod(true);
    try {
      const added = await addPaymentMethod({
        type: newMethodType,
        number: newMethodNumber.trim(),
        last4: newMethodNumber.trim().slice(-4),
        expiry: '',
        isDefault: false,
      });

      setLocalSavedMethods((prev) => [added, ...prev]);
      setPaymentMethod(
        added.type === 'nagad'
          ? 'Nagad'
          : 'bKash',
      );
      setSenderNumber(added.number || '');
      setNewMethodNumber('');
      setIsManageMethodsOpen(false);
      toast.success('পেমেন্ট মেথড সফলভাবে যুক্ত করা হয়েছে!');
    } catch (err) {
      console.error(err);
      toast.error('পেমেন্ট মেথড সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setIsSavingMethod(false);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    try {
      await deletePaymentMethod(id);
      setLocalSavedMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success('পেমেন্ট মেথড মুছে ফেলা হয়েছে');
    } catch (err) {
      console.error(err);
      toast.error('মুছে ফেলতে সমস্যা হয়েছে');
    }
  };

  const renderTabs = () => (
    <div className="flex p-1 bg-neutral-100 dark:bg-[#2C2C2E] rounded-xl mb-5 sticky top-0 z-10 font-['Anek_Bangla',sans-serif] gap-1">
      {[
        {
          id: 'details',
          label: 'বিস্তারিত',
          icon: <Info className="w-4 h-4" />,
        },
        {
          id: 'support',
          label: 'সাপোর্ট',
          icon: <Headphones className="w-4 h-4" />,
        },
        { id: 'info', label: 'তথ্য', icon: <span className="text-xs font-bold">?</span> },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as TabId)}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold transition-all rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === tab.id
              ? 'bg-white dark:bg-[#3A3A3C] text-[#12544F] dark:text-[#2DD4BF] shadow-xs'
              : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-[#1C1C1E] rounded-[24px] border border-neutral-200/80 dark:border-[#2C2C2E] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-neutral-100 dark:border-[#2C2C2E] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 -ml-1 hover:bg-neutral-100 dark:hover:bg-[#2C2C2E] rounded-xl transition-colors text-neutral-500 dark:text-neutral-400 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
              {paymentMode === 'instant' ? 'অটোমেটিক পেমেন্ট' : 'ম্যানুয়াল পেমেন্ট (TrxID)'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#2C2C2E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-full flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-5 pb-0">
            {renderTabs()}
          </div>

          <div className="flex-1 p-4 sm:p-5 pt-0">
            {activeTab === 'details' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex gap-3">
                  <div className="flex-1 bg-neutral-50 dark:bg-[#2C2C2E]/60 p-3.5 rounded-2xl text-center border border-neutral-100 dark:border-white/[0.08]">
                    <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase font-['Anek_Bangla',sans-serif]">
                      প্যাকেজ
                    </span>
                    <div className="text-base font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
                      {plan.name}
                    </div>
                  </div>
                  <div className="flex-1 bg-[#12544F]/5 dark:bg-[#092328] p-3.5 rounded-2xl text-center border border-[#12544F]/20 dark:border-[#12544F]/30">
                    <span className="text-[11px] font-bold text-[#12544F] dark:text-[#2DD4BF] uppercase font-['Anek_Bangla',sans-serif]">
                      পরিশোধ করতে হবে
                    </span>
                    <div className="text-base font-bold text-[#12544F] dark:text-[#2DD4BF] font-['Anek_Bangla',sans-serif]">
                      ৳ {plan.price}.00
                    </div>
                  </div>
                </div>

                {/* Payment Mode Selector */}
                <div className="flex p-1 bg-neutral-100 dark:bg-[#2C2C2E] rounded-xl border border-neutral-200/80 dark:border-[#3A3A3C] font-['Anek_Bangla',sans-serif] gap-1">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('instant')}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentMode === 'instant'
                        ? 'bg-[#12544F] text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>ইনস্ট্যান্ট (অটো)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('manual')}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentMode === 'manual'
                        ? 'bg-[#12544F] text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>ম্যানুয়াল (TrxID)</span>
                  </button>
                </div>

                {paymentMode === 'instant' ? (
                  <div className="space-y-4">
                    <div className="bg-neutral-50/80 dark:bg-[#2C2C2E]/40 border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-5 text-center shadow-xs">
                      <div className="w-12 h-12 rounded-2xl bg-[#12544F] text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#12544F]/20">
                        <Zap className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-neutral-900 dark:text-white mb-1 font-['Anek_Bangla',sans-serif]">
                        সরাসরি অনলাইন পেমেন্ট
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-4 max-w-sm mx-auto font-['HindSiliguri',sans-serif] leading-relaxed">
                        বিকাশ, নগদ, রকেট বা ভিসা/মাস্টারকার্ড দিয়ে নিরাপদে পেমেন্ট করুন। পেমেন্ট শেষে স্বয়ংক্রিয়ভাবে প্রো প্ল্যান চালু হবে।
                      </p>

                      <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-[#D11559]/10 text-[#D11559] border border-[#D11559]/20 font-mono text-xs font-bold">bKash</span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#E11D48]/10 text-[#E11D48] border border-[#E11D48]/20 font-mono text-xs font-bold">Nagad</span>
                        <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono text-xs font-bold">Rocket</span>
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono text-xs font-bold">Cards</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleInstantPayment}
                        disabled={isRedirecting}
                        className="w-full h-[48px] bg-[#12544F] hover:bg-[#0E423E] text-white font-bold rounded-xl shadow-sm disabled:opacity-60 flex justify-center items-center gap-2 transition-all active:scale-[0.98] font-['Anek_Bangla',sans-serif] text-[15px] cursor-pointer"
                      >
                        {isRedirecting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>পেমেন্ট গেটওয়েতে পাঠানো হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5" />
                            <span>৳ {plan.price}.00 পে করুন (অটোমেটিক)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-full bg-white dark:bg-[#2C2C2E]/40 border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 text-center shadow-xs">
                  <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3 font-['Anek_Bangla',sans-serif]">
                    অনুগ্রহ করে নিচের নির্দেশনা অনুসরণ করুন
                  </h4>
                <div
                  className="bg-neutral-50 dark:bg-[#2C2C2E]/60 p-3.5 rounded-xl mb-3.5 flex items-center justify-between group cursor-pointer border border-neutral-200/80 dark:border-white/[0.08] hover:border-[#12544F] transition-colors"
                  onClick={() => copyToClipboard('01749591456')}
                >
                  <div className="text-left">
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block font-['HindSiliguri',sans-serif]">
                      bKash / Nagad (Send Money)
                    </span>
                    <span className="font-mono font-bold text-lg text-neutral-900 dark:text-white tracking-wider">
                      01749591456
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#3A3A3C] text-[#12544F] dark:text-[#2DD4BF] text-xs font-bold shadow-xs group-hover:bg-[#12544F]/10 transition-colors font-['Anek_Bangla',sans-serif]">
                    কপি
                  </div>
                </div>
                <ul className="text-xs text-neutral-600 dark:text-neutral-300 text-left space-y-1.5 list-disc pl-4 font-['HindSiliguri',sans-serif]">
                  <li>উপরের নম্বরে <strong>Send Money</strong> করুন।</li>
                  <li>Reference হিসেবে আপনার মোবাইল নম্বর দিন।</li>
                  <li>নিচের ফর্মে আপনার পেমেন্ট মেথড, প্রেরকের মোবাইল নম্বর এবং TrxID দিন।</li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-['Anek_Bangla',sans-serif]">
                    SAVED PAYMENT METHODS
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsManageMethodsOpen(true)}
                    className="text-xs font-bold text-[#12544F] dark:text-[#2DD4BF] hover:underline flex items-center gap-1 font-['Anek_Bangla',sans-serif] cursor-pointer"
                  >
                    <span>{localSavedMethods.length === 0 ? 'মেথড যোগ করুন' : 'এডিট / যোগ করুন'}</span>
                  </button>
                </div>

                {localSavedMethods.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {localSavedMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(
                            method.type === 'bkash'
                              ? 'bKash'
                              : method.type === 'nagad'
                                ? 'Nagad'
                                : method.type,
                          );
                          setSenderNumber(method.number || '');
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                          senderNumber === method.number &&
                          paymentMethod.toLowerCase() ===
                            method.type.toLowerCase()
                            ? 'border-[#12544F] bg-[#12544F]/5 dark:bg-[#092328] ring-1 ring-[#12544F]'
                            : 'border-neutral-200/80 dark:border-white/[0.08] hover:border-[#12544F]/40 bg-white dark:bg-[#2C2C2E]/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-black ${
                              method.type === 'bkash'
                                ? 'bg-[#D11559]'
                                : method.type === 'nagad'
                                  ? 'bg-[#E11D48]'
                                  : 'bg-purple-600'
                            }`}
                          >
                            {method.type === 'bkash'
                              ? 'bK'
                              : method.type === 'nagad'
                                ? 'N'
                                : 'R'}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-neutral-800 dark:text-white uppercase font-['Anek_Bangla',sans-serif]">
                              {method.type}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                              {method.number}
                            </p>
                          </div>
                        </div>
                        {senderNumber === method.number && (
                          <span className="text-xs font-bold text-[#12544F] dark:text-[#2DD4BF] font-['Anek_Bangla',sans-serif]">
                            সিলেক্টেড
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => setIsManageMethodsOpen(true)}
                    className="p-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-center cursor-pointer hover:border-[#12544F] transition-colors"
                  >
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif]">
                      ভবিষ্যতে সহজে পেমেন্ট করতে আপনার বিকাশ/নগদ নম্বর যোগ করুন
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 font-['Anek_Bangla',sans-serif]">
                    পেমেন্ট মেথড (Payment Method)
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200/80 dark:border-[#3A3A3C] bg-[#F8FAFC] dark:bg-[#27272A] text-neutral-900 dark:text-white outline-none font-medium text-sm focus:border-[#12544F] focus:ring-1 focus:ring-[#12544F] transition-all"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 font-['Anek_Bangla',sans-serif]">
                    প্রেরকের মোবাইল নম্বর (Your Mobile Number)
                  </label>
                  <input
                    type="tel"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="যেমন: 017xxxxxxxx"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200/80 dark:border-[#3A3A3C] bg-[#F8FAFC] dark:bg-[#27272A] text-neutral-900 dark:text-white outline-none font-mono text-sm focus:border-[#12544F] focus:ring-1 focus:ring-[#12544F] transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 font-['Anek_Bangla',sans-serif]">
                    ট্রানজেকশন আইডি (TrxID)
                  </label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="SMS থেকে প্রাপ্ত TrxID দিন"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200/80 dark:border-[#3A3A3C] bg-[#F8FAFC] dark:bg-[#27272A] text-neutral-900 dark:text-white outline-none font-mono uppercase text-sm focus:border-[#12544F] focus:ring-1 focus:ring-[#12544F] transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[48px] bg-[#12544F] hover:bg-[#0E423E] text-white font-bold rounded-xl shadow-sm disabled:opacity-50 flex justify-center items-center gap-2 mt-4 transition-all active:scale-[0.98] font-['Anek_Bangla',sans-serif] text-[15px] cursor-pointer"
                >
                  {isSubmitting ? 'যাচাই করা হচ্ছে...' : 'পেমেন্ট সম্পন্ন করুন'}
                </button>
              </form>
            </>
          )}
        </div>
      )}

          {activeTab === 'support' && (
            <div className="space-y-3 animate-fade-in pb-4">
              {[
                {
                  icon: '📞',
                  title: 'সরাসরি কথা বলুন',
                  sub: 'কল করতে ক্লিক করো',
                  link: 'tel:+8801409583992',
                },
                {
                  icon: '💬',
                  title: 'হোয়াটসঅ্যাপ মেসেজ',
                  sub: 'তাৎক্ষণিক চ্যাট সাপোর্ট',
                  link: 'https://wa.me/8801409583992',
                },
                {
                  icon: '✉️',
                  title: 'ইমেইল সাপোর্ট',
                  sub: 'support@obhyash.com',
                  link: 'mailto:support@obhyash.com',
                },
              ].map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3.5 p-3.5 rounded-xl border border-neutral-200/80 dark:border-white/[0.08] hover:border-[#12544F]/50 transition-colors bg-neutral-50/60 dark:bg-[#2C2C2E]/40"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-white dark:bg-[#3A3A3C] shadow-xs border border-neutral-100 dark:border-white/[0.08] shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-neutral-800 dark:text-white font-['Anek_Bangla',sans-serif]">
                      {item.title}
                    </h5>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif]">
                      {item.sub}
                    </p>
                  </div>
                </a>
              ))}
              <div className="mt-4 pt-1">
                <button
                  onClick={() => setActiveTab('details')}
                  className="w-full h-[48px] bg-[#12544F] hover:bg-[#0E423E] text-white font-bold rounded-xl shadow-sm flex items-center justify-center transition-all active:scale-[0.98] font-['Anek_Bangla',sans-serif] text-[15px] cursor-pointer"
                >
                  পেমেন্ট ফর্মে যান
                </button>
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-2.5 animate-fade-in pb-4">
              <div className="p-3 bg-[#12544F]/5 dark:bg-[#092328] border border-[#12544F]/20 dark:border-[#12544F]/30 rounded-xl flex items-center gap-2.5 mb-2">
                <span className="text-base">💡</span>
                <p className="text-xs font-bold text-[#12544F] dark:text-[#2DD4BF] font-['Anek_Bangla',sans-serif]">
                  পেমেন্ট সংক্রান্ত যেকোনো প্রশ্নে নিচের উত্তরগুলো দেখে নিন
                </p>
              </div>

              {[
                {
                  q: 'কিভাবে পেমেন্ট সম্পন্ন করবেন?',
                  a: '১. আপনার বিকাশ বা নগদ অ্যাপে গিয়ে "Send Money" করুন।\n২. আমাদের অফিসিয়াল মার্চেন্ট নম্বর 01749591456 দিন।\n৩. প্যাকেজের নির্ধারিত সঠিক টাকা পাঠান।\n৪. পেমেন্ট সম্পন্ন হলে ফিরতি SMS বা অ্যাপ থেকে TrxID কপি করে "বিস্তারিত" ফর্মে সাবমিট করুন।',
                },
                {
                  q: 'পেমেন্ট করার কতক্ষণ পর একাউন্ট প্রিমিয়াম হবে?',
                  a: 'তথ্য সাবমিট করার পর সাধারণত ৫ থেকে ৩০ মিনিটের মধ্যে আমাদের ভেরিফিকেশন টিম যাচাই করে আপনার একাউন্ট স্বয়ংক্রিয়ভাবে প্রিমিয়াম করে দেয়। সর্বোচ্চ ১-২ ঘণ্টার মধ্যে নিশ্চিতভাবে এক্টিভেশন সম্পন্ন হয়।',
                },
                {
                  q: 'ট্রানজেকশন আইডি (TrxID) কোথায় পাব?',
                  a: '• বিকাশ: পেমেন্ট সফল হওয়ার পর স্ক্রিনে, ইনবক্স স্টেটমেন্টে অথবা আসা SMS-এ TrxID (যেমন: BLA7X8Y9Z) দেখতে পাবেন।\n• নগদ: নগদ অ্যাপের "লেনদেন" হিস্ট্রি বা ফিরতি SMS-এ TxnID দেখতে পাবেন।',
                },
                {
                  q: 'ভুল TrxID বা ভুল নম্বর সাবমিট করলে কি করব?',
                  a: 'ভুল তথ্য দেওয়া হয়ে থাকলে "বিস্তারিত" ট্যাবে থাকা পেন্ডিং রিকোয়েস্ট থেকে "আবেদন বাতিল" বাটনে ক্লিক করে সাথে সাথে সঠিক তথ্য দিয়ে পুনরায় আবেদন করতে পারবেন। অথবা আমাদের হোয়াটসঅ্যাপ সাপোর্টে যোগাযোগ করতে পারেন।',
                },
                {
                  q: 'রেফারেন্সে (Reference) কিছু না দিলে কি সমস্যা হবে?',
                  a: 'না, কোনো সমস্যা নেই। রেফারেন্সে আপনার নম্বর দেওয়া সুবিধাজনক, তবে রেফারেন্স না দিলেও সঠিক TrxID ফর্মে সাবমিট করলেই পেমেন্ট সফলভাবে শনাক্ত করা যাবে।',
                },
                {
                  q: 'প্যাকেজের মেয়াদ শেষ হলে কি স্বয়ংক্রিয়ভাবে টাকা কাটবে?',
                  a: 'না, এখানে কোনো অটো-রিনিউ বা স্বয়ংক্রিয় টাকা কাটার সুযোগ নেই। মেয়াদ শেষ হলে আপনি নিজের সুবিধাজনক সময়ে পুনরায় রিনিউ করতে পারবেন।',
                },
                {
                  q: 'টাকা কেটে নিয়েছে কিন্তু কনফার্মেশন পাইনি?',
                  a: 'কখনও নেটওয়ার্ক সমস্যার কারণে SMS আসতে দেরি হতে পারে। আপনার বিকাশ/নগদ অ্যাপের স্টেটমেন্ট চেক করে প্রাপ্ত TrxID ফর্মে সাবমিট করুন অথবা সরাসরি সাপোর্টে যোগাযোগ করুন।',
                },
                {
                  q: 'যেকোনো প্রয়োজনে জরুরি সহায়তা কোথায় পাব?',
                  a: '"সাপোর্ট" ট্যাবে গিয়ে সরাসরি আমাদের হোয়াটসঅ্যাপে (01409583992) মেসেজ দিন অথবা হেল্পলাইনে কল করুন। আমাদের সাপোর্ট টিম দ্রুত সহায়তা প্রদান করবে।',
                },
              ].map((faq, idx) => (
                <details
                  key={idx}
                  className="group bg-white dark:bg-[#2C2C2E]/40 rounded-xl border border-neutral-200/80 dark:border-white/[0.08] transition-all open:border-[#12544F]/50 open:shadow-xs"
                >
                  <summary className="flex justify-between items-center p-3.5 cursor-pointer font-bold text-neutral-800 dark:text-neutral-100 text-xs sm:text-sm select-none font-['Anek_Bangla',sans-serif]">
                    {faq.q}
                    <svg
                      className="w-4 h-4 text-neutral-400 group-open:text-[#12544F] transition-transform group-open:rotate-180"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="p-3.5 pt-0 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed border-t border-neutral-100 dark:border-white/[0.08] mt-2 whitespace-pre-line font-['HindSiliguri',sans-serif]">
                    {faq.a}
                  </div>
                </details>
              ))}

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="w-full h-[48px] bg-[#12544F] hover:bg-[#0E423E] text-white font-bold rounded-xl text-[15px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm font-['Anek_Bangla',sans-serif] cursor-pointer"
                >
                  <span>পেমেন্ট করতে এগিয়ে যান</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isManageMethodsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-[28px] sm:rounded-[24px] border border-neutral-200/80 dark:border-[#2C2C2E] shadow-2xl flex flex-col max-h-[50vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-4 px-5 border-b border-neutral-100 dark:border-[#2C2C2E] flex items-center justify-between bg-neutral-50/50 dark:bg-[#1C1C1E]">
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
                পেমেন্ট মেথড ব্যবস্থাপনা
              </h4>
              <button
                onClick={() => setIsManageMethodsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#2C2C2E] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2.5 px-4 border-b border-neutral-100 dark:border-[#2C2C2E] flex gap-2">
              <button
                type="button"
                onClick={() => setManageTab('list')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors font-['Anek_Bangla',sans-serif] ${
                  manageTab === 'list'
                    ? 'bg-[#12544F] text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-[#2C2C2E] dark:text-neutral-400'
                }`}
              >
                সংরক্ষিত নম্বর ({localSavedMethods.length})
              </button>
              <button
                type="button"
                onClick={() => setManageTab('add')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors font-['Anek_Bangla',sans-serif] ${
                  manageTab === 'add'
                    ? 'bg-[#12544F] text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-[#2C2C2E] dark:text-neutral-400'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                নতুন যোগ করুন
              </button>
            </div>
            <div className="p-4 px-5 overflow-y-auto flex-1 space-y-3">
              {manageTab === 'list' ? (
                localSavedMethods.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 font-['HindSiliguri',sans-serif]">
                      কোনো সেভ করা পেমেন্ট মেথড নেই
                    </p>
                    <button
                      onClick={() => setManageTab('add')}
                      className="text-xs font-bold text-[#12544F] dark:text-[#2DD4BF] hover:underline font-['Anek_Bangla',sans-serif]"
                    >
                      + নতুন মেথড যোগ করুন
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {localSavedMethods.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-neutral-200/80 dark:border-white/[0.08] bg-neutral-50/50 dark:bg-[#2C2C2E]/40"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black ${
                              m.type === 'bkash'
                                ? 'bg-[#D11559]'
                                : 'bg-[#E11D48]'
                            }`}
                          >
                            {m.type === 'bkash' ? 'bK' : 'N'}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-neutral-800 dark:text-white uppercase font-['Anek_Bangla',sans-serif]">
                              {m.type}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                              {m.number}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentMethod(
                                m.type === 'nagad'
                                  ? 'Nagad'
                                  : 'bKash',
                              );
                              setSenderNumber(m.number || '');
                              setIsManageMethodsOpen(false);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-[#12544F] dark:text-[#2DD4BF] hover:bg-[#12544F]/10 rounded-lg transition-colors font-['Anek_Bangla',sans-serif]"
                          >
                            ব্যবহার করুন
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMethod(m.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <form onSubmit={handleAddNewMethod} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 font-['Anek_Bangla',sans-serif]">
                      মেথড সিলেক্ট করুন
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['bkash', 'nagad'] as const).map((prov) => (
                        <button
                          key={prov}
                          type="button"
                          onClick={() => setNewMethodType(prov)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-colors font-['Anek_Bangla',sans-serif] ${
                            newMethodType === prov
                              ? 'border-[#12544F] bg-[#12544F]/10 text-[#12544F] dark:text-[#2DD4BF]'
                              : 'border-neutral-200/80 dark:border-[#3A3A3C] text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {prov === 'bkash' ? 'bKash' : 'Nagad'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 font-['Anek_Bangla',sans-serif]">
                      ১১ ডিজিটের মোবাইল নম্বর
                    </label>
                    <input
                      type="tel"
                      value={newMethodNumber}
                      onChange={(e) => setNewMethodNumber(e.target.value)}
                      placeholder="যেমন: 017xxxxxxxx"
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-200/80 dark:border-[#3A3A3C] bg-[#F8FAFC] dark:bg-[#27272A] text-neutral-900 dark:text-white outline-none font-mono text-xs focus:border-[#12544F] focus:ring-1 focus:ring-[#12544F]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingMethod}
                    className="w-full h-[40px] bg-[#12544F] hover:bg-[#0E423E] text-white font-bold rounded-xl text-xs shadow-sm disabled:opacity-50 transition-colors font-['Anek_Bangla',sans-serif]"
                  >
                    {isSavingMethod ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ ও ব্যবহার করুন'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ManualPaymentModal;
