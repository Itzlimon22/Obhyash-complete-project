import React, { useState, useEffect } from 'react';
import {
  SubscriptionPlan,
  Invoice,
  PaymentMethod,
  UserProfile,
  PaymentSubmission,
} from '@/lib/types';
import PricingCard from './subscription/PricingCard';
import BillingHistory from './subscription/BillingHistory';
import PaymentMethods from './subscription/PaymentMethods';
import AddPaymentMethodModal from './subscription/AddPaymentMethodModal';
import ManualPaymentModal from './subscription/ManualPaymentModal';
import {
  getSubscriptionPlans,
  getUserInvoices,
  getUserPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  getUserProfile,
  submitManualPayment,
  getUserActiveSubscription,
} from '@/services/database';
import { printInvoice } from '@/services/print-service';

const SubscriptionView: React.FC = () => {
  // State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string>('free');

  // User Data for Invoice
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);
  const [isAddingMethod, setIsAddingMethod] = useState(false);

  // Manual Payment Logic
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const currentPlan: SubscriptionPlan = plans.find(
    (p) => p.id === currentPlanId,
  ) ||
    plans[0] || {
      id: 'loading',
      name: 'Loading...',
      price: 0,
      billingCycle: '',
      currency: '',
      features: [],
      colorTheme: 'neutral',
    };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedPlans, fetchedInvoices, fetchedMethods, user, activeSub] =
          await Promise.all([
            getSubscriptionPlans(),
            getUserInvoices(),
            getUserPaymentMethods(),
            getUserProfile('me'),
            getUserActiveSubscription(),
          ]);
        setPlans(fetchedPlans);
        setInvoices(fetchedInvoices);
        setPaymentMethods(fetchedMethods);
        setCurrentUser(user);

        // Determine active plan
        if (activeSub) {
          setCurrentPlanId(activeSub.id);
        } else if (fetchedInvoices && fetchedInvoices.length > 0) {
          // Fallback: Invoice logic
          const latestPaid = fetchedInvoices.find(
            (inv) => inv.status === 'paid',
          );
          if (latestPaid) {
            const matchedPlan = fetchedPlans.find(
              (p) => p.name === latestPaid.planName,
            );
            if (matchedPlan) setCurrentPlanId(matchedPlan.id);
          }
        }
      } catch (error) {
        console.error('Failed to load subscription data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (plan.id === 'free' || plan.id === currentPlanId) return;

    // Open the manual payment modal instead of direct subscribe
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentConfirm = async (data: {
    method: string;
    number: string;
    trxId: string;
  }) => {
    if (!currentUser || !selectedPlan) {
      alert('User or Plan details missing.');
      return;
    }

    const submission: PaymentSubmission = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      amount: selectedPlan.price,
      paymentMethod: data.method,
      senderNumber: data.number,
      transactionId: data.trxId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    try {
      const success = await submitManualPayment(submission);
      if (success) {
        alert(
          `আপনার পেমেন্ট তথ্য জমা নেওয়া হয়েছে। যাচাই করার পর ${selectedPlan?.name} প্ল্যানটি চালু হবে।`,
        );
        setIsPaymentModalOpen(false);
        setSelectedPlan(null);
      } else {
        throw new Error('Submission failed');
      }
    } catch {
      alert('ত্রুটি হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const handleAddPaymentMethod = async (
    type: 'bkash' | 'nagad',
    number: string,
  ) => {
    setIsAddingMethod(true);
    try {
      const newMethod = await addPaymentMethod({
        type,
        number,
        isDefault: false,
      });
      setPaymentMethods((prev) => [...prev, newMethod]);
      setIsAddMethodOpen(false);
    } catch {
      alert('মেথড যুক্ত করা যায়নি।');
    } finally {
      setIsAddingMethod(false);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (confirm('আপনি কি নিশ্চিত যে আপনি এই পেমেন্ট মেথডটি মুছে ফেলতে চান?')) {
      try {
        await deletePaymentMethod(id);
        setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
      } catch (error) {
        console.error('Failed to delete method', error);
        alert('মুছে ফেলা সম্ভব হয়নি।');
      }
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (currentUser) {
      printInvoice(invoice, currentUser);
    } else {
      alert('ব্যবহারকারীর তথ্য লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Current Plan Details Header */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900 rounded-2xl p-5 md:p-6 text-white shadow-lg relative overflow-hidden border border-neutral-700">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-32 h-32"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
              বর্তমান সাবস্ক্রিপশন
            </h2>
            {loading ? (
              <div className="h-8 w-40 bg-neutral-700 rounded animate-pulse mb-3"></div>
            ) : (
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl font-extrabold text-white">
                  {currentPlan.name}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wide">
                  Active
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-neutral-300">
              <div className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 text-neutral-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>
                শুরু:{' '}
                <span className="font-medium text-white">12 Oct, 2023</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 text-neutral-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                নবায়ন:{' '}
                <span className="font-medium text-white">
                  {currentPlan.id === 'free' ? 'আজীবন' : 'আগামী মাসে'}
                </span>
              </div>
            </div>
          </div>

          {currentPlanId === 'free' && (
            <div className="bg-neutral-800/50 p-3 rounded-xl border border-neutral-700 backdrop-blur-sm max-w-xs">
              <p className="text-xs text-neutral-300 leading-relaxed">
                <span className="font-bold text-amber-400">টিপস:</span>{' '}
                প্রিমিয়াম প্ল্যানে আপগ্রেড করে আনলিমিটেড এক্সাম এবং এআই
                এনালাইসিস আনলক করুন।
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-white dark:bg-neutral-900 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.id} className="relative">
              <PricingCard
                plan={plan}
                isCurrent={currentPlanId === plan.id}
                onSelect={() => handlePlanSelect(plan)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Feature Comparison - Minimal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 border-y border-neutral-200 dark:border-neutral-800">
        {[
          { label: 'Secure Payment', icon: '🔒' },
          { label: 'Cancel Anytime', icon: '📅' },
          { label: '24/7 Support', icon: '💬' },
          { label: 'Money Back', icon: '💰' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="flex flex-row md:flex-col items-center justify-center text-center gap-2 md:gap-1 p-2"
          >
            <span className="text-base md:text-lg">{item.icon}</span>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Account Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <div className="lg:col-span-1">
          {loading ? (
            <div className="h-40 bg-white dark:bg-neutral-900 rounded-2xl animate-pulse"></div>
          ) : (
            <PaymentMethods
              methods={paymentMethods}
              onAddMethod={() => setIsAddMethodOpen(true)}
              onDelete={handleDeletePaymentMethod}
            />
          )}
        </div>

        {/* Billing History */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="h-64 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl animate-pulse"></div>
          ) : (
            <BillingHistory
              invoices={invoices}
              onDownload={handleDownloadInvoice}
            />
          )}
        </div>
      </div>

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal
        isOpen={isAddMethodOpen}
        onClose={() => setIsAddMethodOpen(false)}
        onSubmit={handleAddPaymentMethod}
        isLoading={isAddingMethod}
      />

      {/* Manual Payment Processing Modal */}
      <ManualPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        plan={selectedPlan}
        onConfirm={handlePaymentConfirm}
      />
    </div>
  );
};

export default SubscriptionView;
