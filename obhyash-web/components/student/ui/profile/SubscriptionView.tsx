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
import { toast } from 'sonner';
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
  const [activeSubscription, setActiveSubscription] =
    useState<SubscriptionPlan | null>(null);

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

  // Fix: Prefer activeSubscription data if it matches the currentPlanId to get expiresAt
  const currentPlan: SubscriptionPlan =
    activeSubscription && activeSubscription.id === currentPlanId
      ? activeSubscription
      : plans.find((p) => p.id === currentPlanId) ||
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
        setActiveSubscription(activeSub);

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
      toast.error('User or Plan details missing.');
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
        toast.success(
          `আপনার পেমেন্ট তথ্য জমা নেওয়া হয়েছে। যাচাই করার পর ${selectedPlan?.name} প্ল্যানটি চালু হবে।`,
        );
        setIsPaymentModalOpen(false);
        setSelectedPlan(null);
      } else {
        throw new Error('Submission failed');
      }
    } catch {
      toast.error('ত্রুটি হয়েছে। আবার চেষ্টা করো।');
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
      toast.error('মেথড যুক্ত করা যায়নি।');
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
        toast.error('মুছে ফেলা সম্ভব হয়নি।');
      }
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (currentUser) {
      printInvoice(invoice, currentUser);
    } else {
      toast.info('ব্যবহারকারীর তথ্য লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করো...');
    }
  };

  const isFreeUser = currentPlanId === 'free' || !currentPlanId;

  const TRUST_BADGES = [
    { icon: Headphones, label: '২৪/৭ সাপোর্ট', color: 'text-red-500' },
    { icon: Clock, label: 'তাৎক্ষণিক অ্যাক্সেস', color: 'text-emerald-500' },
  ];

  if (isPaymentModalOpen && selectedPlan) {
    return (
      <ManualPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        savedMethods={paymentMethods}
        onConfirm={handlePaymentConfirm}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-24 sm:pb-20 px-1">
      {/* HERO SECTION - REPLACED WITH CURRENT PLAN CARD & BANNER */}
      <div className="space-y-4 sm:space-y-6">
        {/* Banner for new users or upgrades */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-neutral-900 dark:bg-black p-8 sm:p-12 text-center">
          <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 sm:w-64 h-40 sm:h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-white text-2xl sm:text-3xl font-black tracking-tight">
              প্রিমিয়াম সাবস্ক্রিপশন
            </h2>
          </div>
        </div>

        {/* Current Plan Details Card (If active subscription exists) */}
        {!isFreeUser && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Crown className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                    {currentPlan.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    Active
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                    মেয়াদ শেষ হবে:{' '}
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">
                      {currentPlan.expiresAt
                        ? new Date(currentPlan.expiresAt).toLocaleDateString(
                            'bn-BD',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            },
                          )
                        : '(অ্যাক্টিভ)'}
                    </span>
                  </p>
                  {currentPlan.expiresAt && (
                    <p className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      বাকি আছে:{' '}
                      {Math.ceil(
                        (new Date(currentPlan.expiresAt).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24),
                      )}{' '}
                      দিন
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PRICING CARDS */}
      <div id="pricing-plans" className="scroll-mt-24">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mb-2">
            আপনার প্ল্যান বেছে নাও
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-96 bg-white dark:bg-neutral-900 rounded-3xl animate-pulse border border-neutral-100 dark:border-neutral-800"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            {plans
              .filter(
                (p) =>
                  p.price > 0 &&
                  (p.billingCycle.includes('মাস') ||
                    p.billingCycle === 'Monthly' ||
                    p.price === 149 ||
                    p.price === 299),
              ) // Filter specifically for desired plans
              .sort((a, b) => a.price - b.price) // Ensure 1 month comes first
              .map((plan) => (
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
    </div>
  );
};

export default SubscriptionView;
