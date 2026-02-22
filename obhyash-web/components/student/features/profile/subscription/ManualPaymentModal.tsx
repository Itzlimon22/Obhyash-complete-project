import React, { useState } from 'react';
import { SubscriptionPlan } from '@/lib/types';
import { toast } from 'sonner';

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  onConfirm: (data: { method: string; number: string; trxId: string }) => void;
}

const ManualPaymentModal: React.FC<ManualPaymentModalProps> = ({
  isOpen,
  onClose,
  plan,
  onConfirm,
}) => {
  type TabId = 'details' | 'support' | 'info';
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

    if (senderNumber.length < 11 || senderNumber.length > 11) {
      toast.error('সঠিক ফোন নম্বর দাও');
      return;
    }

    if (trxId.length < 10 || trxId.length > 10) {
      toast.error('TrxID সঠিক নয়');
      return;
    }

    setIsSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      onConfirm({ method: paymentMethod, number: senderNumber, trxId });
      setIsSubmitting(false);
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('নম্বর কপি করা হয়েছে!');
  };

  const renderTabs = () => (
    <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
      {[
        { id: 'details', label: 'বিস্তারিত', icon: 'ⓘ' },
        { id: 'support', label: 'সাপোর্ট', icon: '🎧' },
        { id: 'info', label: 'তথ্য', icon: '?' },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as TabId)}
          className={`flex-1 py-3 text-sm font-bold transition-all relative ${
            activeTab === tab.id
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-t-full"></div>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            পেমেন্ট প্রসেসিং
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {renderTabs()}

        <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
          {/* TAB 1: DETAILS (Payment Form) */}
          {activeTab === 'details' && (
            <div className="space-y-6 animate-fade-in">
              {/* Summary Card */}
              <div className="flex gap-4">
                <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    প্যাকেজ
                  </span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
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

              {/* Instructions Box */}
              <div className="w-full bg-white dark:bg-black border-2 border-dashed border-emerald-200 dark:border-emerald-900 rounded-t-2xl sm:rounded-xl rounded-b-none sm:rounded-b-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 p-5 text-center">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                  অনুগ্রহ করে নিচের নির্দেশনা অনুসরণ করুন
                </h4>

                <div
                  className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg mb-3 flex items-center justify-between group cursor-pointer"
                  onClick={() => copyToClipboard('01234567890')}
                >
                  <span className="text-xs font-medium text-slate-500">
                    bKash/Nagad (Send Money)
                  </span>
                  <span className="font-mono font-bold text-lg text-slate-800 dark:text-white tracking-wider">
                    01234567890
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 text-slate-400 group-hover:text-emerald-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                    />
                  </svg>
                </div>

                <ul className="text-xs text-slate-500 dark:text-slate-400 text-left space-y-1.5 list-disc pl-4">
                  <li>
                    উপরের নম্বরে <strong>Send Money</strong> করো।
                  </li>
                  <li>Reference হিসেবে তোমার মোবাইল নম্বর দাও।</li>
                  <li>
                    নিচের ফর্মে তোমার পেমেন্ট মেথড, মোবাইল নম্বর এবং TrxID দাও।
                  </li>
                </ul>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Your Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="e.g., 01xxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Transaction ID (TrxID)
                  </label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="Enter the TrxID"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono uppercase"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
                >
                  {isSubmitting ? (
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
                      যাচাই করা হচ্ছে...
                    </>
                  ) : (
                    'Verify Payment'
                  )}
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
                  sub: 'এখানে ক্লিক করো',
                  color: 'bg-emerald-50 text-emerald-600',
                  link: 'tel:+8801712345678',
                },
                {
                  icon: '💬',
                  title: 'লাইভ চ্যাট (Messenger)',
                  sub: 'এখানে ক্লিক করো',
                  color: 'bg-emerald-50 text-emerald-600',
                  link: '#',
                },
                {
                  icon: '📱',
                  title: 'লাইভ চ্যাট (WhatsApp)',
                  sub: 'এখানে ক্লিক করো',
                  color: 'bg-emerald-50 text-emerald-600',
                  link: '#',
                },
                {
                  icon: '✉️',
                  title: 'সাপোর্টে ইমেইল',
                  sub: 'এখানে ক্লিক করো',
                  color: 'bg-red-50 text-red-600',
                  link: 'mailto:support@zenith.edu.bd',
                },
              ].map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:shadow-md transition-all group"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${item.color} group-hover:scale-110 transition-transform`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500">{item.sub}</p>
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

          {/* TAB 3: INFO (FAQ) */}
          {activeTab === 'info' && (
            <div className="space-y-3 animate-fade-in pb-4">
              {[
                {
                  q: 'কিভাবে পেমেন্ট করবেন?',
                  a: '১. তোমার বিকাশ/নগদ অ্যাপে যাও। ২. সেন্ড মানি অপশনে যাও। ৩. আমাদের নম্বর দাও। ৪. রেফারেন্সে তোমার নম্বর দাও। ৫. পেমেন্ট শেষে TrxID ফর্ম এ জমা দাও।',
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
                  className="group bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
                >
                  <summary className="flex justify-between items-center p-4 cursor-pointer font-bold text-slate-800 dark:text-slate-200 text-sm select-none">
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
                  <div className="p-4 pt-0 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-700/50 mt-2">
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
