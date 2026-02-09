'use client';

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
import { cn } from '@/lib/utils';
import {
  Crown,
  Shield,
  Clock,
  Headphones,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';

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
          `আপনার পেমেন্ট তথ্য জমা নেওয়া হয়েছে। যাচাই করার পর ${selectedPlan?.name} প্ল্যানটি চালু হবে।`,
        );
        setIsPaymentModalOpen(false);
        setSelectedPlan(null);
      } else {
        throw new Error('Submission failed');
      }
    } catch {
      alert('ত্রুটি হয়েছে। আবার চেষ্টা করুন।');
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
      alert('মেথড যুক্ত করা যায়নি।');
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
        alert('মুছে ফেলা সম্ভব হয়নি।');
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

  const isFreeUser = currentPlanId === 'free' || !currentPlanId;

  const TRUST_BADGES = [
    { icon: Shield, label: 'নিরাপদ পেমেন্ট', color: 'text-emerald-500' },
    { icon: RefreshCcw, label: 'যেকোনো সময় বাতিল', color: 'text-blue-500' },
    { icon: Headphones, label: '২৪/৭ সাপোর্ট', color: 'text-purple-500' },
    { icon: Clock, label: 'তাৎক্ষণিক অ্যাক্সেস', color: 'text-orange-500' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 p-6 md:p-10">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-rose-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
                  isFreeUser
                    ? 'bg-neutral-700/50 text-neutral-300'
                    : 'bg-emerald-500/20 text-emerald-400',
                )}
              >
                {isFreeUser ? (
                  <>
                    <Sparkles className="w-3 h-3" />
                    ফ্রি প্ল্যান
                  </>
                ) : (
                  <>
                    <Crown className="w-3 h-3" />
                    {currentPlan.name}
                  </>
                )}
              </div>
              {!isFreeUser && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                  Active
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight">
              {isFreeUser
                ? 'আপনার সম্ভাবনা আনলক করুন'
                : 'আপনি প্রিমিয়াম সদস্য! 🎉'}
            </h1>
            <p className="text-neutral-400 text-sm md:text-base max-w-md">
              {isFreeUser
                ? 'আনলিমিটেড এক্সাম, এডভান্সড এনালাইসিস এবং আরও অনেক কিছু পেতে প্রিমিয়ামে আপগ্রেড করুন।'
                : 'সব প্রিমিয়াম ফিচার আপনার জন্য খোলা আছে। পড়াশোনা চালিয়ে যান!'}
            </p>
          </div>

          {/* Right Stats (for Premium users) */}
          {!isFreeUser && (
            <div className="flex gap-4 md:gap-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-black text-white">
                  {currentPlan.currency}
                  {currentPlan.price}
                </div>
                <div className="text-xs text-neutral-500 font-medium">
                  {currentPlan.billingCycle}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PRICING CARDS */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-lg md:text-xl font-bold text-neutral-800 dark:text-white mb-1">
            আপনার প্ল্যান বেছে নিন
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            সব প্ল্যানে ৩ দিনের ফ্রি ট্রায়াল অন্তর্ভুক্ত
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 bg-white dark:bg-neutral-900 rounded-2xl animate-pulse border border-neutral-100 dark:border-neutral-800"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isCurrent={currentPlanId === plan.id}
                onSelect={() => handlePlanSelect(plan)}
              />
            ))}
          </div>
        )}
      </div>

      {/* TRUST BADGES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {TRUST_BADGES.map((badge, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center text-center gap-2 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <badge.icon
              className={cn('w-6 h-6', badge.color)}
              strokeWidth={1.5}
            />
            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
              {badge.label}
            </span>
          </div>
        ))}
      </div>

      {/* BILLING & PAYMENT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <div className="lg:col-span-1">
          {loading ? (
            <div className="h-40 bg-white dark:bg-neutral-900 rounded-2xl animate-pulse border border-neutral-100 dark:border-neutral-800" />
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
            <div className="h-64 bg-white dark:bg-neutral-900 rounded-2xl animate-pulse border border-neutral-100 dark:border-neutral-800" />
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
