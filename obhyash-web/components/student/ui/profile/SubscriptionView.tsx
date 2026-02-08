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
      {/* Current Plan Details Header Removed - Showing minimal active plan info if needed or just pricing */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">
            বর্তমান সাবস্ক্রিপশন
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-neutral-900 dark:text-white">
              {currentPlan.name}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide">
              Active
            </span>
          </div>
        </div>
        {currentPlanId === 'free' && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md text-center md:text-right">
            আনলিমিটেড এক্সাম এবং এনালাইসিস পেতে{' '}
            <span className="text-rose-600 font-bold">প্রিমিয়াম</span> প্ল্যানে
            আপগ্রেড করুন
          </p>
        )}
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
