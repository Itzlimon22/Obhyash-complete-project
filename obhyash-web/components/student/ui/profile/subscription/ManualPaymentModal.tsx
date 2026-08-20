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
      const { data: { user } } = await supabase.auth.getUser();

      const res = await fetch('/api/payment/uddoktapay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          customerEmail: user?.email,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!senderNumber.trim() || !trxId.trim()) {
      toast.error('অনুগ্রহ করে সব তথ্য পূরণ করো');
      return;
    }

    const phoneRegex = /^01\d{9}$/;
    if (!phoneRegex.test(senderNumber)) {
      toast.error('সঠিক মোবাইল নম্বর দাও (১১ ডিজিট, শুরু হতে হবে ০১ দিয়ে)');
      return;
    }

    const trxIdRegex = /^[A-Z0-9]{5,25}$/;
    if (!trxIdRegex.test(trxId.toUpperCase())) {
      toast.error('সঠিক ট্রানজেকশন আইডি দাও');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onConfirm({
        method: paymentMethod,
        number: senderNumber,
        trxId: trxId.toUpperCase(),
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
    <div className="flex border-b border-neutral-200 dark:border-neutral-700 mb-6 bg-white dark:bg-neutral-900 sticky top-0 z-10">
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
          className={`flex-1 py-4 text-sm font-bold transition-all relative flex items-center justify-center gap-2 ${
            activeTab === tab.id
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
          }`}
        >
          {tab.icon}
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-t-full"></div>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-[80vh] flex flex-col bg-white dark:bg-neutral-900 animate-in slide-in-from-right duration-300">
      <div className="p-4 sm:p-6 flex items-center gap-4 border-b border-neutral-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-20">
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 dark:text-neutral-400"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
          পেমেন্ট প্রসেসিং
        </h3>
      </div>

      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col">
        {renderTabs()}

        <div className="flex-1 p-6 pt-0">
          {activeTab === 'details' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex gap-4">
                <div className="flex-1 bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl text-center border border-neutral-200 dark:border-neutral-700">
                  <span className="text-xs font-bold text-neutral-500 uppercase">
                    প্যাকেজ
                  </span>
                  <div className="text-lg font-bold text-neutral-900 dark:text-white">
                    {plan.name}
                  </div>
                </div>
                <div className="flex-1 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center border border-red-100 dark:border-red-900/30">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">
                    পরিশোধ করতে হবে
                  </span>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    ৳ {plan.price}.00
                  </div>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setPaymentMode('instant')}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMode === 'instant'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>ইনস্ট্যান্ট (অটো)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('manual')}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMode === 'manual'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>ম্যানুয়াল (TrxID)</span>
                </button>
              </div>

              {paymentMode === 'instant' ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10 border border-emerald-500/30 rounded-2xl p-5 text-center shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-600/20">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-black text-neutral-900 dark:text-white mb-1">
                      সরাসরি অনলাইন পেমেন্ট
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-4 max-w-sm mx-auto">
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
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 disabled:opacity-60 flex justify-center items-center gap-2 transition-all cursor-pointer"
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
                  <div className="w-full bg-white dark:bg-neutral-900 border border-emerald-300 dark:border-emerald-800/80 rounded-2xl p-5 text-center shadow-sm">
                <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3">
                  অনুগ্রহ করে নিচের নির্দেশনা অনুসরণ করুন
                </h4>
                <div
                  className="bg-neutral-100 dark:bg-neutral-800/80 p-3.5 rounded-xl mb-3.5 flex items-center justify-between group cursor-pointer border border-neutral-200 dark:border-neutral-700 hover:border-emerald-400 transition-colors"
                  onClick={() => copyToClipboard('01749591456')}
                >
                  <div className="text-left">
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">
                      bKash / Nagad (Send Money)
                    </span>
                    <span className="font-mono font-bold text-lg text-neutral-900 dark:text-white tracking-wider">
                      01749591456
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-sm group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40">
                    কপি
                  </div>
                </div>
                <ul className="text-xs text-neutral-600 dark:text-neutral-300 text-left space-y-2 list-disc pl-4">
                  <li>উপরের নম্বরে <strong>Send Money</strong> করুন।</li>
                  <li>Reference হিসেবে আপনার মোবাইল নম্বর দিন।</li>
                  <li>নিচের ফর্মে আপনার পেমেন্ট মেথড, প্রেরকের মোবাইল নম্বর এবং TrxID দিন।</li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    SAVED PAYMENT METHODS
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsManageMethodsOpen(true)}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
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
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                          senderNumber === method.number &&
                          paymentMethod.toLowerCase() ===
                            method.type.toLowerCase()
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-neutral-800'
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
                            <p className="font-bold text-sm text-neutral-800 dark:text-white uppercase">
                              {method.type}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                              {method.number}
                            </p>
                          </div>
                        </div>
                        {senderNumber === method.number && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            সিলেক্টেড
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => setIsManageMethodsOpen(true)}
                    className="p-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-center cursor-pointer hover:border-emerald-400 transition-colors"
                  >
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      ভবিষ্যতে সহজে পেমেন্ট করতে আপনার বিকাশ/নগদ নম্বর যোগ করুন
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    পেমেন্ট মেথড (Payment Method)
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none font-medium text-sm"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    প্রেরকের মোবাইল নম্বর (Your Mobile Number)
                  </label>
                  <input
                    type="tel"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="যেমন: 017xxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none font-mono text-sm"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    ট্রানজেকশন আইডি (TrxID)
                  </label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="SMS থেকে প্রাপ্ত TrxID দিন"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none font-mono uppercase text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 mt-4 transition-colors"
                >
                  {isSubmitting ? 'যাচাই করা হচ্ছে...' : 'পেমেন্ট সম্পন্ন করুন'}
                </button>
              </form>
            </>
          )}
        </div>
      )}

          {activeTab === 'support' && (
            <div className="space-y-4 animate-fade-in pb-4">
              {[
                {
                  icon: '📞',
                  title: 'সরাসরি কথা বলুন',
                  sub: 'কল করতে ক্লিক করো',
                  color: 'bg-emerald-50 text-emerald-600',
                  link: 'tel:+8801409583992',
                },
                {
                  icon: '💬',
                  title: 'হোয়াটসঅ্যাপ মেসেজ',
                  sub: 'তাৎক্ষণিক চ্যাট সাপোর্ট',
                  color: 'bg-green-50 text-green-600',
                  link: 'https://wa.me/8801409583992',
                },
                {
                  icon: '✉️',
                  title: 'ইমেইল সাপোর্ট',
                  sub: 'support@obhyash.com',
                  color: 'bg-blue-50 text-blue-600',
                  link: 'mailto:support@obhyash.com',
                },
              ].map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors bg-neutral-50/50 dark:bg-neutral-800/50"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-white dark:bg-neutral-750 shadow-sm border border-neutral-100 dark:border-neutral-700">
                    {item.icon}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-neutral-800 dark:text-white">
                      {item.title}
                    </h5>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {item.sub}
                    </p>
                  </div>
                </a>
              ))}
              <div className="mt-6">
                <button
                  onClick={() => setActiveTab('details')}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  Go to Payment
                </button>
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-3 animate-fade-in pb-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2.5 mb-2">
                <span className="text-base">💡</span>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
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
                  className="group bg-white dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700/80 transition-all open:border-emerald-500/60 open:shadow-sm"
                >
                  <summary className="flex justify-between items-center p-4 cursor-pointer font-bold text-neutral-800 dark:text-neutral-100 text-sm select-none">
                    {faq.q}
                    <svg
                      className="w-4 h-4 text-neutral-400 group-open:text-emerald-500 transition-transform group-open:rotate-180"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="p-4 pt-0 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed border-t border-neutral-100 dark:border-neutral-700/50 mt-2 whitespace-pre-line">
                    {faq.a}
                  </div>
                </details>
              ))}

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
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
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[50vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-4 px-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                পেমেন্ট মেথড ব্যবস্থাপনা
              </h4>
              <button
                onClick={() => setIsManageMethodsOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 px-5 border-b border-neutral-100 dark:border-neutral-800 flex gap-2">
              <button
                type="button"
                onClick={() => setManageTab('list')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
                  manageTab === 'list'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
              >
                সংরক্ষিত নম্বর ({localSavedMethods.length})
              </button>
              <button
                type="button"
                onClick={() => setManageTab('add')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                  manageTab === 'add'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
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
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                      কোনো সেভ করা পেমেন্ট মেথড নেই
                    </p>
                    <button
                      onClick={() => setManageTab('add')}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      + নতুন মেথড যোগ করুন
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {localSavedMethods.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50"
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
                            <p className="font-bold text-xs text-neutral-800 dark:text-white uppercase">
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
                            className="px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
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
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      মেথড সিলেক্ট করুন
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['bkash', 'nagad'] as const).map((prov) => (
                        <button
                          key={prov}
                          type="button"
                          onClick={() => setNewMethodType(prov)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                            newMethodType === prov
                              ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                              : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {prov === 'bkash' ? 'bKash' : 'Nagad'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      ১১ ডিজিটের মোবাইল নম্বর
                    </label>
                    <input
                      type="tel"
                      value={newMethodNumber}
                      onChange={(e) => setNewMethodNumber(e.target.value)}
                      placeholder="যেমন: 017xxxxxxxx"
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none font-mono text-xs"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingMethod}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow disabled:opacity-50 transition-colors"
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
  );
};

export default ManualPaymentModal;
