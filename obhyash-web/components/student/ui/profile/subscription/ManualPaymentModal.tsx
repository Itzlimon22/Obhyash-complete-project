import React, { useState } from 'react';
import {
  SubscriptionPlan,
  PaymentMethod,
  PaymentSubmission,
} from '@/lib/types';
import { ArrowLeft, Clock, Info, Headphones } from 'lucide-react';
import { toast } from 'sonner';

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
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !plan) return null;

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

    const trxIdRegex = /^[A-Z0-9]{5,20}$/; // Relaxed slightly from 10 but kept safe
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
        { id: 'info', label: 'তথ্য', icon: '?' },
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
      {/* Top Header with Back Button */}
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
          {/* TAB 1: DETAILS */}
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

              <div className="w-full bg-white dark:bg-black border-2 border-dashed border-emerald-200 dark:border-emerald-900 rounded-xl p-5 text-center">
                <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">
                  অনুগ্রহ করে নিচের নির্দেশনা অনুসরণ করো
                </h4>
                <div
                  className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg mb-3 flex items-center justify-between group cursor-pointer"
                  onClick={() => copyToClipboard('01234567890')}
                >
                  <span className="text-xs font-medium text-neutral-500">
                    bKash/Nagad (Send Money)
                  </span>
                  <span className="font-mono font-bold text-lg text-neutral-800 dark:text-white tracking-wider">
                    01234567890
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 text-neutral-400 group-hover:text-emerald-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                    />
                  </svg>
                </div>
                <ul className="text-xs text-neutral-500 dark:text-neutral-400 text-left space-y-1.5 list-disc pl-4">
                  <li>
                    উপরের নম্বরে <strong>Send Money</strong> করো।
                  </li>
                  <li>Reference হিসেবে আপনার মোবাইল নম্বর দাও।</li>
                  <li>
                    নিচের ফর্মে আপনার পেমেন্ট মেথড, মোবাইল নম্বর এবং TrxID দাও।
                  </li>
                </ul>
              </div>

              {savedMethods.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Saved Payment Methods
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {savedMethods.map((method) => (
                      <button
                        key={method.id}
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
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black ${method.type === 'bkash' ? 'bg-red-500' : method.type === 'nagad' ? 'bg-red-500' : 'bg-neutral-500'}`}
                          >
                            {method.type === 'bkash'
                              ? 'bK'
                              : method.type === 'nagad'
                                ? 'N'
                                : 'C'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-neutral-800 dark:text-white capitalize">
                              {method.type}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                              {method.number}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none font-medium"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Your Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="e.g., 01xxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Transaction ID (TrxID)
                  </label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="Enter the TrxID"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none font-mono uppercase"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 mt-4"
                >
                  {isSubmitting ? 'যাচাই করা হচ্ছে...' : 'Verify Payment'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SUPPORT */}
          {activeTab === 'support' && (
            <div className="space-y-4 animate-fade-in pb-4">
              {[
                {
                  icon: '📞',
                  title: 'সরাসরি কথা বলুন',
                  sub: 'কল করতে ক্লিক করো',
                  color: 'bg-emerald-50 text-emerald-600',
                  link: 'tel:+8801946855793',
                },
                {
                  icon: '💬',
                  title: 'লাইভ চ্যাট (Messenger)',
                  sub: 'এখানে ক্লিক করো',
                  color: 'bg-emerald-50 text-emerald-600',
                  link: 'https://m.me/obhyash',
                },
                {
                  icon: '📱',
                  title: 'লাইভ চ্যাট (WhatsApp)',
                  sub: 'এখানে ক্লিক করো',
                  color: 'bg-emerald-50 text-emerald-600',
                  link: 'https://wa.me/8801946855793',
                },
                {
                  icon: '✉️',
                  title: 'সাপোর্টে ইমেইল',
                  sub: 'এখানে ক্লিক করো',
                  color: 'bg-red-50 text-red-600',
                  link: 'mailto:support@obhyash.com',
                },
              ].map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 hover:shadow-md transition-all group"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${item.color} group-hover:scale-110 transition-transform`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-xs text-neutral-500">{item.sub}</p>
                  </div>
                </a>
              ))}
              <div className="mt-8">
                <button
                  onClick={() => setActiveTab('details')}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  Go to Payment
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-3 animate-fade-in pb-4">
              {[
                {
                  q: 'কিভাবে পেমেন্ট করবেন?',
                  a: '১. আপনার বিকাশ/নগদ অ্যাপে যাও। ২. সেন্ড মানি অপশনে যাও। ৩. আমাদের নম্বর দাও। ৪. রেফারেন্সে আপনার নম্বর দাও। ৫. পেমেন্ট শেষে TrxID ফর্ম এ জমা দাও।',
                },
                {
                  q: 'পেমেন্ট করার কতক্ষণ পর একাউন্ট আপগ্রেড হবে?',
                  a: 'আমাদের টিম আপনার তথ্য যাচাই করে ৩০ মিনিট থেকে ২ ঘন্টার মধ্যে আপনার একাউন্ট আপগ্রেড করে দিবে।',
                },
                {
                  q: 'ট্রানজেকশন আইডি (TrxID) খুঁজে না পেলে কী করব?',
                  a: 'আপনার পেমেন্ট অ্যাপের স্টেটমেন্ট অথবা মেসেজ অপশন চেক করো। তবুও না পেলে আমাদের সাপোর্টে যোগাযোগ করো।',
                },
                {
                  q: 'ভুল নম্বরে টাকা পাঠালে কী হবে?',
                  a: 'ভুল নম্বরে টাকা পাঠালে আমরা দায়ী থাকবো না। দয়া করে নম্বরটি দুইবার যাচাই করো।',
                },
                {
                  q: 'প্রিমিয়াম প্যাকেজে কী কী থাকছে?',
                  a: 'আনলিমিটেড এক্সাম, OMR চেকিং, এবং বিস্তারিত এনালাইসিস রিপোর্ট।',
                },
              ].map((faq, idx) => (
                <details
                  key={idx}
                  className="group bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700"
                >
                  <summary className="flex justify-between items-center p-4 cursor-pointer font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                    {faq.q}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4 transition-transform group-open:rotate-180"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </summary>
                  <div className="p-4 pt-0 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-200 dark:border-neutral-700/50 mt-2">
                    {faq.a}
                  </div>
                </details>
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
        </div>
      </div>
    </div>
  );
};

export default ManualPaymentModal;
