'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Users,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  Crown,
  Calendar,
  TrendingUp,
  FileText,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Gift,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

interface PaymentRequest {
  id: string;
  user_id: string;
  user?: {
    name: string;
    email: string;
    phone: string;
  };
  plan_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string | null;
  payment_proof_url: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  admin_notes: string | null;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  price: number;
  currency: string;
  duration_days: number;
  features: string[];
  is_active: boolean;
  is_popular?: boolean;
  color_theme?: string;
}

interface SubscriptionHistory {
  id: string;
  user_id: string;
  user?: {
    name: string;
    email: string;
  };
  plan_id: string;
  plan?: SubscriptionPlan;
  started_at: string;
  expires_at: string;
  is_active: boolean;
}

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<
    'requests' | 'subscriptions' | 'plans' | 'analytics'
  >('requests');
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionHistory[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'All' | 'Pending' | 'Approved' | 'Rejected'
  >('All');

  // Pagination State
  const [reqPage, setReqPage] = useState(1);
  const [reqTotal, setReqTotal] = useState(0);
  const [subPage, setSubPage] = useState(1);
  const [subTotal, setSubTotal] = useState(0);
  const pageSize = 20;

  // View Style
  const [viewStyle, setViewStyle] = useState<'table' | 'card' | 'responsive'>(
    'responsive',
  );

  // Modals
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingRequest, setReviewingRequest] =
    useState<PaymentRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>(
    'approve',
  );
  const [adminNotes, setAdminNotes] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan>>({
    currency: 'BDT',
    features: [],
    is_active: true,
    is_popular: false,
    color_theme: 'border-neutral-200',
  });

  // Manual Subscription Management
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingSubscription, setExtendingSubscription] =
    useState<SubscriptionHistory | null>(null);
  const [extensionDays, setExtensionDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [reqPage, subPage, statusFilter, searchQuery]); // Re-fetch when pagination or filters change

  const fetchData = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);

    const supabase = createClient();

    try {
      // 1. Payment Requests Query
      let reqQuery = supabase
        .from('payment_requests')
        .select(
          `*, user:users!payment_requests_user_id_fkey(name, email, phone)`,
          { count: 'exact' },
        );

      if (statusFilter !== 'All') {
        reqQuery = reqQuery.eq('status', statusFilter);
      }

      // Note: Full text search across joined tables is complex in simple Supabase client.
      // We will rely on simple local filtering for `searchQuery` if we don't implement an RPC,
      // OR we can implement server-side search for transaction_id.
      if (searchQuery) {
        reqQuery = reqQuery.ilike('transaction_id', `%${searchQuery}%`);
      }

      const reqFrom = (reqPage - 1) * pageSize;
      const reqTo = reqFrom + pageSize - 1;

      const {
        data: requestsData,
        error: requestsError,
        count: reqCount,
      } = await reqQuery
        .order('requested_at', { ascending: false })
        .range(reqFrom, reqTo);

      if (requestsError) {
        console.error('Payment requests error:', requestsError);
        throw requestsError;
      }

      // 2. Subscriptions Query
      let subQuery = supabase
        .from('subscription_history')
        .select(`*, user:users(name, email), plan:subscription_plans(*)`, {
          count: 'exact',
        });

      // Note: To search by user name/email server-side requires more complex joins/RPC.
      // For now we just paginate the history based on creation date.
      const subFrom = (subPage - 1) * pageSize;
      const subTo = subFrom + pageSize - 1;

      const {
        data: subsData,
        error: subsError,
        count: subCount,
      } = await subQuery
        .order('created_at', { ascending: false })
        .range(subFrom, subTo);

      if (subsError) {
        console.error('Subscription history error:', subsError);
        throw subsError;
      }

      // Fetch subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (plansError) {
        console.error('Subscription plans error:', plansError);
        throw plansError;
      }

      setPaymentRequests(requestsData || []);
      if (reqCount !== null) setReqTotal(reqCount);

      setSubscriptions(subsData || []);
      if (subCount !== null) setSubTotal(subCount);

      setPlans(plansData || []);

      if (showToast) {
        toast.success('Data refreshed successfully');
      }
    } catch (error: unknown) {
      console.error('Failed to fetch data:', error);

      // Show specific error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to load subscription data';
      toast.error(errorMessage);

      // If tables don't exist, show helpful message
      if (
        (error instanceof Object &&
          'code' in error &&
          error.code === '42P01') ||
        errorMessage.includes('relation') ||
        errorMessage.includes('does not exist')
      ) {
        toast.error(
          'Database tables not found. Please run the SQL migration first.',
          {
            duration: 5000,
          },
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleReviewPayment = async () => {
    if (!reviewingRequest) return;

    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update payment request
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({
          status: reviewAction === 'approve' ? 'Approved' : 'Rejected',
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', reviewingRequest.id);

      if (updateError) throw updateError;

      // If approved, create subscription and update user
      if (reviewAction === 'approve') {
        // Find the plan
        const plan = plans.find(
          (p) => p.display_name === reviewingRequest.plan_name,
        );

        if (plan) {
          const startDate = new Date();
          const expiryDate = new Date(startDate);
          expiryDate.setDate(expiryDate.getDate() + plan.duration_days);

          // Create subscription history
          const { error: historyError } = await supabase
            .from('subscription_history')
            .insert({
              user_id: reviewingRequest.user_id,
              plan_id: plan.id,
              payment_request_id: reviewingRequest.id,
              started_at: startDate.toISOString(),
              expires_at: expiryDate.toISOString(),
              is_active: true,
            });

          if (historyError) throw historyError;

          // Update user subscription in users table
          const { error: userUpdateError } = await supabase
            .from('users')
            .update({
              subscription: {
                plan: plan.display_name.includes('Yearly')
                  ? 'Premium'
                  : 'Premium',
                status: 'Active',
                expires_at: expiryDate.toISOString(),
              },
            })
            .eq('id', reviewingRequest.user_id);

          if (userUpdateError) throw userUpdateError;
        }
      }

      toast.success(
        `Payment ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`,
      );
      setShowReviewModal(false);
      setReviewingRequest(null);
      setAdminNotes('');
      fetchData();
    } catch (error) {
      console.error('Failed to review payment:', error);
      toast.error('Failed to process payment review');
    }
  };

  const handleExtendSubscription = async () => {
    if (!extendingSubscription) return;

    const supabase = createClient();
    try {
      const currentExpiry = new Date(extendingSubscription.expires_at);
      const newExpiry = new Date(
        currentExpiry.getTime() + extensionDays * 24 * 60 * 60 * 1000,
      );

      const { error } = await supabase
        .from('subscription_history')
        .update({
          expires_at: newExpiry.toISOString(),
          is_active: true,
        })
        .eq('id', extendingSubscription.id);

      if (error) throw error;

      // Also update user profile
      await supabase
        .from('users')
        .update({
          subscription: {
            plan: extendingSubscription.plan?.display_name.includes('Yearly')
              ? 'Premium'
              : 'Premium',
            status: 'Active',
            expires_at: newExpiry.toISOString(),
          },
        })
        .eq('id', extendingSubscription.user_id);

      toast.success(`Subscription extended by ${extensionDays} days`);
      setShowExtendModal(false);
      setExtendingSubscription(null);
      setExtensionDays(30);
      fetchData();
    } catch (error) {
      console.error('Failed to extend subscription:', error);
      toast.error('Failed to extend subscription');
    }
  };

  const handleCreatePlan = async () => {
    if (
      !editingPlan.name ||
      !editingPlan.display_name ||
      !editingPlan.price ||
      !editingPlan.duration_days
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    const supabase = createClient();

    try {
      if (editingPlan.id) {
        // Update existing plan
        const { error } = await supabase
          .from('subscription_plans')
          .update({
            display_name: editingPlan.display_name,
            price: editingPlan.price,
            duration_days: editingPlan.duration_days,
            features: editingPlan.features,
            is_active: editingPlan.is_active,
            is_popular: editingPlan.is_popular,
            color_theme: editingPlan.color_theme,
          })
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast.success('Plan updated successfully');
      } else {
        // Create new plan
        const { error } = await supabase.from('subscription_plans').insert({
          name: editingPlan.name,
          display_name: editingPlan.display_name,
          price: editingPlan.price,
          currency: editingPlan.currency,
          duration_days: editingPlan.duration_days,
          features: editingPlan.features,
          is_active: editingPlan.is_active,
          is_popular: editingPlan.is_popular,
          color_theme: editingPlan.color_theme,
        });

        if (error) throw error;
        toast.success('Plan created successfully');
      }

      setShowPlanModal(false);
      setEditingPlan({
        currency: 'BDT',
        features: [],
        is_active: true,
        is_popular: false,
        color_theme: 'border-neutral-200',
      });
      fetchData();
    } catch (error) {
      console.error('Failed to save plan:', error);
      toast.error('Failed to save subscription plan');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast.success('Plan deleted successfully');
      fetchData();
    } catch (error: unknown) {
      console.error('Failed to delete plan:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete plan',
      );
    }
  };

  const handleExport = () => {
    const data = activeTab === 'requests' ? paymentRequests : subscriptions;
    const csv = [
      activeTab === 'requests'
        ? [
            'User',
            'Email',
            'Plan',
            'Amount',
            'Method',
            'Transaction ID',
            'Status',
            'Date',
          ].join(',')
        : ['User', 'Email', 'Plan', 'Started', 'Expires', 'Status'].join(','),
      ...data.map((item) => {
        if (activeTab === 'requests' && 'plan_name' in item) {
          const req = item as PaymentRequest;
          return [
            req.user?.name || 'N/A',
            req.user?.email || 'N/A',
            req.plan_name,
            req.amount,
            req.payment_method,
            req.transaction_id || 'N/A',
            req.status,
            new Date(req.requested_at).toLocaleDateString(),
          ].join(',');
        }
        const sub = item as SubscriptionHistory;
        return [
          sub.user?.name || 'N/A',
          sub.user?.email || 'N/A',
          sub.plan?.display_name || 'N/A',
          new Date(sub.started_at).toLocaleDateString(),
          new Date(sub.expires_at).toLocaleDateString(),
          sub.is_active ? 'Active' : 'Expired',
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('Data exported successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Active':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10';
      case 'Pending':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10';
      case 'Rejected':
      case 'Expired':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10';
      default:
        return 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800';
    }
  };

  const stats = {
    totalRevenue: paymentRequests
      .filter((r) => r.status === 'Approved')
      .reduce((sum, r) => sum + r.amount, 0),
    pendingRequests: paymentRequests.filter((r) => r.status === 'Pending')
      .length,
    activeSubscriptions: subscriptions.filter((s) => s.is_active).length,
    approvalRate:
      paymentRequests.length > 0
        ? Math.round(
            (paymentRequests.filter((r) => r.status === 'Approved').length /
              paymentRequests.length) *
              100,
          )
        : 0,
  };

  // We still explicitly filter for the front-end string matching just in case (e.g. name matching which we didn't send to server)
  const filteredRequests = paymentRequests.filter((request) => {
    const matchesSearch =
      request.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-red-600 dark:text-red-400 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">
            Loading subscription data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
              সাবস্ক্রিপশন ও পেমেন্ট
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs sm:text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? 'animate-spin' : ''}
              />
              <span>{isRefreshing ? 'লোডিং...' : 'রিফ্রেশ'}</span>
            </button>

            {/* View Toggles for Requests and Subscriptions */}
            {(activeTab === 'requests' || activeTab === 'subscriptions') && (
              <div className="hidden md:flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewStyle('card')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewStyle === 'card'
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-red-600 dark:text-red-400'
                      : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewStyle('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewStyle === 'table'
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-red-600 dark:text-red-400'
                      : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                  title="Table View"
                >
                  <List size={18} />
                </button>
              </div>
            )}

            <Link
              href="/admin/referrals"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs sm:text-sm font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all shadow-sm active:scale-95"
            >
              <Gift size={16} />
              <span>রেফারেল</span>
            </Link>

            <button
              onClick={handleExport}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs sm:text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all shadow-sm active:scale-95"
            >
              <Download size={16} />
              <span>এক্সপোর্ট</span>
            </button>

            {activeTab === 'plans' && (
              <button
                onClick={() => {
                  setEditingPlan({
                    currency: 'BDT',
                    features: [],
                    is_active: true,
                  });
                  setShowPlanModal(true);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95"
              >
                <Plus size={16} />
                <span>নতুন প্লান</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[
            {
              label: 'মোট আয়',
              value: `৳${stats.totalRevenue.toLocaleString()}`,
              icon: DollarSign,
              gradient: 'from-red-500 to-red-500',
              bg: 'bg-red-50 dark:bg-red-500/10',
              textColor: 'text-red-600 dark:text-red-400',
            },
            {
              label: 'পেন্ডিং রিকোয়েস্ট',
              value: stats.pendingRequests,
              icon: Clock,
              gradient: 'from-red-500 to-red-500',
              bg: 'bg-red-50 dark:bg-red-500/10',
              textColor: 'text-red-600 dark:text-red-400',
            },
            {
              label: 'এক্টিভ ইউজার',
              value: stats.activeSubscriptions,
              icon: Users,
              gradient: 'from-red-500 to-red-500',
              bg: 'bg-red-50 dark:bg-red-500/10',
              textColor: 'text-red-600 dark:text-red-400',
            },
            {
              label: 'অ্যাপ্রুভাল রেট',
              value: `${stats.approvalRate}%`,
              icon: TrendingUp,
              gradient: 'from-emerald-500 to-emerald-500',
              bg: 'bg-emerald-50 dark:bg-emerald-500/10',
              textColor: 'text-emerald-600 dark:text-emerald-400',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-[1.5rem] border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div
                  className={`p-2 sm:p-3 rounded-xl ${stat.bg} text-white bg-gradient-to-br ${stat.gradient}`}
                >
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: 'requests', label: 'পেমেন্ট রিকোয়েস্ট', icon: FileText },
            { id: 'subscriptions', label: 'এক্টিভ ইউজার', icon: Crown },
            { id: 'plans', label: 'প্লান ম্যাওেজমেন্ট', icon: CreditCard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-[13px] sm:text-sm font-bold border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-red-600 text-red-600 dark:text-red-400'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Payment Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="ট্রানজেকশন আইডি দিয়ে খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setReqPage(1);
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setReqPage(1); // Reset page on filter change
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          statusFilter === status
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {status === 'All' ? 'সবগুলো' : status}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Card List */}
            {(viewStyle === 'responsive' || viewStyle === 'card') && (
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${viewStyle === 'responsive' ? 'lg:hidden' : ''}`}
              >
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 font-bold text-sm">
                          {request.user?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1">
                            {request.user?.name || 'Unknown'}
                          </p>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                            {request.user?.email || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(
                          request.status,
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-neutral-100 dark:border-neutral-800">
                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase">
                          প্যাক
                        </p>
                        <p className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200">
                          {request.plan_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase">
                          টাকা
                        </p>
                        <p className="text-[13px] font-bold text-red-600 dark:text-red-400">
                          ৳{request.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase">
                          Transaction ID
                        </p>
                        <p className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 truncate">
                          {request.transaction_id || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                        <Calendar size={12} />
                        {new Date(request.requested_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        {request.payment_proof_url && (
                          <button
                            onClick={() => {
                              setSelectedProof(request.payment_proof_url);
                              setShowProofModal(true);
                            }}
                            className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-900/30"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {request.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => {
                                setReviewingRequest(request);
                                setReviewAction('approve');
                                setShowReviewModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setReviewingRequest(request);
                                setReviewAction('reject');
                                setShowReviewModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-500/20"
                            >
                              <X size={14} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Requests Table */}
            {(viewStyle === 'responsive' || viewStyle === 'table') && (
              <div
                className={`bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden ${viewStyle === 'responsive' ? 'hidden lg:block' : ''}`}
              >
                {filteredRequests.length === 0 ? (
                  <div className="py-24 flex flex-col items-center justify-center">
                    <FileText className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-2">
                      কোন রিকোয়েস্ট পাওয়া যায়নি
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Transaction ID
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {filteredRequests.map((request) => (
                          <tr
                            key={request.id}
                            className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                  {request.user?.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {request.user?.email || 'N/A'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                {request.plan_name}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-neutral-900 dark:text-white">
                                ৳{request.amount.toLocaleString()}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {request.payment_method}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                                {request.transaction_id || 'N/A'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(
                                  request.status,
                                )}`}
                              >
                                {request.status === 'Approved' && (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                {request.status === 'Pending' && (
                                  <Clock className="w-3.5 h-3.5" />
                                )}
                                {request.status === 'Rejected' && (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                {request.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(
                                  request.requested_at,
                                ).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {request.payment_proof_url && (
                                  <button
                                    onClick={() => {
                                      setSelectedProof(
                                        request.payment_proof_url,
                                      );
                                      setShowProofModal(true);
                                    }}
                                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                    title="View Proof"
                                  >
                                    <Eye className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                  </button>
                                )}
                                {request.status === 'Pending' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setReviewingRequest(request);
                                        setReviewAction('approve');
                                        setShowReviewModal(true);
                                      }}
                                      className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                                      title="Approve"
                                    >
                                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReviewingRequest(request);
                                        setReviewAction('reject');
                                        setShowReviewModal(true);
                                      }}
                                      className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                      title="Reject"
                                    >
                                      <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Active Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            {/* Mobile Card List */}
            {(viewStyle === 'responsive' || viewStyle === 'card') && (
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${viewStyle === 'responsive' ? 'lg:hidden' : ''}`}
              >
                {subscriptions.length === 0 ? (
                  <div className="py-24 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center">
                    <Crown className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                      কোন এক্টিভ ইউজার নেই
                    </p>
                  </div>
                ) : (
                  subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 font-bold text-sm">
                            <Crown size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1">
                              {sub.user?.name || 'Unknown'}
                            </p>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                              {sub.user?.email || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(
                            sub.is_active ? 'Active' : 'Expired',
                          )}`}
                        >
                          {sub.is_active ? 'Active' : 'Expired'}
                        </span>
                      </div>

                      <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[10px] text-neutral-400 font-bold uppercase">
                            প্যাক
                          </p>
                          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                            {sub.plan?.display_name || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-neutral-500">
                            Exp: {new Date(sub.expires_at).toLocaleDateString()}
                          </span>
                          <span className="text-red-600 font-bold">
                            ৳{sub.plan?.price || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end pt-1">
                        <button
                          onClick={() => {
                            setExtendingSubscription(sub);
                            setShowExtendModal(true);
                          }}
                          className="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={14} /> মেয়াদ বাড়ান
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Subscriptions Table */}
            {(viewStyle === 'responsive' || viewStyle === 'table') && (
              <div
                className={`bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden ${viewStyle === 'responsive' ? 'hidden lg:block' : ''}`}
              >
                {subscriptions.length === 0 ? (
                  <div className="py-24 flex flex-col items-center justify-center">
                    <Crown className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                      কোন এক্টিভ ইউজার পাওয়া যায়নি
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Started
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Expires
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {subscriptions.map((sub) => (
                          <tr
                            key={sub.id}
                            className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                  {sub.user?.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {sub.user?.email || 'N/A'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                                <Crown className="w-4 h-4 text-red-500" />
                                {sub.plan?.display_name || 'Unknown Plan'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {new Date(sub.started_at).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {new Date(sub.expires_at).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(
                                  sub.is_active ? 'Active' : 'Expired',
                                )}`}
                              >
                                {sub.is_active ? (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                {sub.is_active ? 'Active' : 'Expired'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => {
                                  setExtendingSubscription(sub);
                                  setShowExtendModal(true);
                                }}
                                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                              >
                                Extend
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Pagination Controls for Subscriptions */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] md:text-sm text-neutral-600 dark:text-neutral-400">
                Showing{' '}
                <span className="font-bold text-neutral-900 dark:text-white">
                  {subscriptions.length > 0 ? (subPage - 1) * pageSize + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-bold text-neutral-900 dark:text-white">
                  {Math.min(subPage * pageSize, subTotal)}
                </span>{' '}
                of{' '}
                <span className="font-bold text-neutral-900 dark:text-white">
                  {subTotal}
                </span>{' '}
                subscriptions
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSubPage((p) => Math.max(1, p - 1))}
                  disabled={subPage === 1 || isLoading}
                  className="px-3 py-1.5 text-xs md:text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg disabled:opacity-50 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 font-medium px-2 py-1.5">
                  Page {subPage} of{' '}
                  {Math.max(1, Math.ceil(subTotal / pageSize))}
                </span>
                <button
                  onClick={() =>
                    setSubPage((p) =>
                      Math.min(Math.ceil(subTotal / pageSize), p + 1),
                    )
                  }
                  disabled={
                    subPage >= Math.ceil(subTotal / pageSize) || isLoading
                  }
                  className="px-3 py-1.5 text-xs md:text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg disabled:opacity-50 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white dark:bg-neutral-900 p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                        {plan.display_name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider mt-1">
                        মেয়াদ: {plan.duration_days} দিন
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        plan.is_active
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {plan.is_active ? 'এক্টিভ' : 'ইনএক্টিভ'}
                    </span>
                  </div>

                  <div className="mb-6">
                    <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                      ৳{plan.price.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase">
                      {plan.currency}
                    </p>
                  </div>

                  <div className="space-y-2 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setShowPlanModal(true);
                    }}
                    className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Edit size={16} />
                    এডিট
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="py-3 px-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl transition-all active:scale-95 flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment Proof Modal */}
        {showProofModal && selectedProof && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-2xl w-full overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <ImageIcon size={20} className="text-red-600" />
                  পেমেন্ট প্রুফ (Proof)
                </h3>
                <button
                  onClick={() => {
                    setShowProofModal(false);
                    setSelectedProof(null);
                  }}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-950 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <img
                  src={selectedProof}
                  alt="Payment Proof"
                  className="w-full rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800"
                />
              </div>
              <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end bg-white dark:bg-neutral-900">
                <a
                  href={selectedProof}
                  download
                  target="_blank"
                  className="px-6 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all flex items-center gap-2"
                >
                  <Download size={16} /> ডাউনলোড
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && reviewingRequest && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full overflow-hidden">
              <div
                className={`p-6 ${
                  reviewAction === 'approve'
                    ? 'bg-gradient-to-br from-emerald-600 to-emerald-700'
                    : 'bg-gradient-to-br from-red-600 to-red-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {reviewAction === 'approve' ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <XCircle className="w-6 h-6" />
                    )}
                    {reviewAction === 'approve'
                      ? 'অ্যাপ্রুভ করো'
                      : 'রিজেক্ট করো'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowReviewModal(false);
                      setReviewingRequest(null);
                      setAdminNotes('');
                    }}
                    className="p-1 hover:bg-white/20 rounded-full text-white/80 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-white/80 text-xs sm:text-sm">
                  {reviewingRequest.user?.name} এর পেমেন্ট রিকোয়েস্টটি রিভিউ
                  করো
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-neutral-500">প্লান:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {reviewingRequest.plan_name}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-neutral-500">টাকার পরিমাণ:</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      ৳{reviewingRequest.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-neutral-500">পেমেন্ট মেথড:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {reviewingRequest.payment_method}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    অ্যাডমিন নোট (ঐচ্ছিক)
                    {reviewAction === 'reject' && (
                      <span className="text-red-600 ml-1">*</span>
                    )}
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={
                      reviewAction === 'approve'
                        ? 'অতিরিক্ত কোনো তথ্য থাকলে লেখো...'
                        : 'রিজেক্ট করার কারণ অবশ্যই লেখো...'
                    }
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none text-sm"
                  />
                </div>
              </div>

              <div className="p-6 pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setReviewingRequest(null);
                    setAdminNotes('');
                  }}
                  className="flex-1 px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl transition-all active:scale-95"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleReviewPayment}
                  disabled={reviewAction === 'reject' && !adminNotes.trim()}
                  className={`flex-1 px-6 py-3 font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'bg-red-600 text-white shadow-red-500/20'
                  }`}
                >
                  {reviewAction === 'approve'
                    ? 'অ্যাপ্রুভ করো'
                    : 'রিজেক্ট করো'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plan Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-emerald-600 to-emerald-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-6 h-6" />
                      {editingPlan.id ? 'প্লান এডিট করো' : 'নতুন প্লান তৈরি'}
                    </h3>
                    <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                      সাবস্ক্রিপশন প্লানের সকল তথ্য এখানে প্রদান করো
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowPlanModal(false);
                      setEditingPlan({
                        currency: 'BDT',
                        features: [],
                        is_active: true,
                      });
                    }}
                    className="p-1 hover:bg-white/20 rounded-full text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                      প্লান আইডি (নাম)
                    </label>
                    <input
                      type="text"
                      value={editingPlan.name || ''}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, name: e.target.value })
                      }
                      disabled={!!editingPlan.id}
                      placeholder="premium_monthly"
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                      ডিসপ্লে নাম
                    </label>
                    <input
                      type="text"
                      value={editingPlan.display_name || ''}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          display_name: e.target.value,
                        })
                      }
                      placeholder="Premium Monthly"
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                      টাকার পরিমাণ (Price)
                    </label>
                    <input
                      type="number"
                      value={editingPlan.price || ''}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          price: parseFloat(e.target.value),
                        })
                      }
                      placeholder="299"
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                      মেয়াদ (দিন)
                    </label>
                    <input
                      type="number"
                      value={editingPlan.duration_days || ''}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          duration_days: parseInt(e.target.value),
                        })
                      }
                      placeholder="30"
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                    ফিচারসমূহ (প্রতিটি আলাদা লাইনে)
                  </label>
                  <textarea
                    value={editingPlan.features?.join('\n') || ''}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        features: e.target.value
                          .split('\n')
                          .filter((f) => f.trim()),
                      })
                    }
                    placeholder="অনিমিত এক্সাম&#10;সকল চ্যাপ্টার এক্সেস&#10;বিস্তারিত এনালাইটিক্স"
                    rows={5}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none text-sm leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-neutral-50 dark:bg-neutral-950 rounded-3xl border border-neutral-100 dark:border-neutral-800">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2">
                      থিম কালার সিলেক্ট করো
                    </label>
                    <select
                      value={editingPlan.color_theme || 'border-neutral-200'}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          color_theme: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                    >
                      <option value="border-neutral-200">Gray (Default)</option>
                      <option value="border-emerald-500">Blue (Premium)</option>
                      <option value="border-red-500">Rose (Popular)</option>
                      <option value="border-emerald-500">Green (Growth)</option>
                      <option value="border-red-500">Amber (Gold)</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={editingPlan.is_active}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              is_active: e.target.checked,
                            })
                          }
                          className="w-5 h-5 rounded border-neutral-300 dark:border-neutral-700 text-emerald-600 focus:ring-0"
                        />
                      </div>
                      <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-emerald-600 transition-colors">
                        প্লানটি এক্টিভ রাখো
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={editingPlan.is_popular}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            is_popular: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded border-neutral-300 dark:border-neutral-700 text-red-500 focus:ring-0"
                      />
                      <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-red-500 transition-colors">
                        জনপ্রিয় (Highlighed) হিসেবে দেখান
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowPlanModal(false);
                    setEditingPlan({
                      currency: 'BDT',
                      features: [],
                      is_active: true,
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl border border-neutral-200 dark:border-neutral-800 transition-all active:scale-95"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleCreatePlan}
                  className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  {editingPlan.id ? 'আপডেট করো' : 'তৈরি করো'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Extend Subscription Modal */}
        {showExtendModal && extendingSubscription && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-sm w-full overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-red-600 to-red-700">
                <h3 className="text-xl font-bold text-white mb-1">
                  মেয়াদ বাড়িয়ে দিন
                </h3>
                <p className="text-white/80 text-xs">
                  {extendingSubscription.user?.name} এর সাবস্ক্রিপশন মেয়াদ বাড়ান
                </p>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">বর্তমান মেয়াদ:</span>
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">
                      {new Date(
                        extendingSubscription.expires_at,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">নতুন মেয়াদ:</span>
                    <span className="font-bold text-emerald-600">
                      {new Date(
                        new Date(extendingSubscription.expires_at).getTime() +
                          extensionDays * 24 * 60 * 60 * 1000,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    কতদিন বাড়াবেন?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[7, 30, 365].map((days) => (
                      <button
                        key={days}
                        onClick={() => setExtensionDays(days)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          extensionDays === days
                            ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/20'
                            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500'
                        }`}
                      >
                        {days === 7
                          ? '৭ দিন'
                          : days === 30
                            ? '৩০ দিন'
                            : '১ বছর'}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={extensionDays}
                      onChange={(e) =>
                        setExtensionDays(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-red-600 dark:text-red-400 font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400 uppercase">
                      Days
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={() => {
                    setShowExtendModal(false);
                    setExtendingSubscription(null);
                  }}
                  className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-bold rounded-2xl transition-all active:scale-95"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleExtendSubscription}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-95"
                >
                  নিশ্চিত করো
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
