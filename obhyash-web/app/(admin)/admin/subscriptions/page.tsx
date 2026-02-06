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
  AlertCircle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

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
  }, []);

  const fetchData = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);

    const supabase = createClient();

    try {
      // Fetch payment requests with user data
      const { data: requestsData, error: requestsError } = await supabase
        .from('payment_requests')
        .select(
          `
          *,
          user:users!payment_requests_user_id_fkey(name, email, phone)
        `,
        )
        .order('requested_at', { ascending: false });

      if (requestsError) {
        console.error('Payment requests error:', requestsError);
        throw requestsError;
      }

      // Fetch subscription history with user and plan data
      const { data: subsData, error: subsError } = await supabase
        .from('subscription_history')
        .select(
          `
          *,
          user:users(name, email),
          plan:subscription_plans(*)
        `,
        )
        .order('created_at', { ascending: false });

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
      setSubscriptions(subsData || []);
      setPlans(plansData || []);

      if (showToast) {
        toast.success('Data refreshed successfully');
      }
    } catch (error: any) {
      console.error('Failed to fetch data:', error);

      // Show specific error message
      const errorMessage = error?.message || 'Failed to load subscription data';
      toast.error(errorMessage);

      // If tables don't exist, show helpful message
      if (
        error?.code === '42P01' ||
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
    } catch (error: any) {
      console.error('Failed to delete plan:', error);
      toast.error(error.message || 'Failed to delete plan');
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
      ...data.map((item: any) =>
        activeTab === 'requests'
          ? [
              item.user?.name || 'N/A',
              item.user?.email || 'N/A',
              item.plan_name,
              item.amount,
              item.payment_method,
              item.transaction_id || 'N/A',
              item.status,
              new Date(item.requested_at).toLocaleDateString(),
            ].join(',')
          : [
              item.user?.name || 'N/A',
              item.user?.email || 'N/A',
              item.plan?.display_name || 'N/A',
              new Date(item.started_at).toLocaleDateString(),
              new Date(item.expires_at).toLocaleDateString(),
              item.is_active ? 'Active' : 'Expired',
            ].join(','),
      ),
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
        return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10';
      case 'Rejected':
      case 'Expired':
        return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10';
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

  const filteredRequests = paymentRequests.filter((request) => {
    const matchesSearch =
      request.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      statusFilter === 'All' || request.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-rose-600 dark:text-rose-400 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">
            Loading subscription data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Subscriptions & Payments
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              Manage payment requests, subscriptions, and plans
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={isRefreshing ? 'animate-spin' : ''}
              />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all shadow-sm hover:shadow active:scale-[0.98]"
            >
              <Download size={18} />
              <span>Export CSV</span>
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
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-sm font-semibold rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                <Plus size={18} />
                <span>Create Plan</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: 'Total Revenue',
              value: `৳${stats.totalRevenue.toLocaleString()}`,
              icon: DollarSign,
              gradient: 'from-rose-500 to-red-500',
              bg: 'bg-rose-50 dark:bg-rose-500/10',
            },
            {
              label: 'Pending Requests',
              value: stats.pendingRequests,
              icon: Clock,
              gradient: 'from-amber-500 to-orange-500',
              bg: 'bg-amber-50 dark:bg-amber-500/10',
            },
            {
              label: 'Active Subscriptions',
              value: stats.activeSubscriptions,
              icon: Users,
              gradient: 'from-rose-500 to-red-500',
              bg: 'bg-rose-50 dark:bg-rose-500/10',
            },
            {
              label: 'Approval Rate',
              value: `${stats.approvalRate}%`,
              icon: TrendingUp,
              gradient: 'from-emerald-500 to-teal-500',
              bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-xl ${stat.bg} bg-gradient-to-br ${stat.gradient} bg-clip-padding`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
          {[
            { id: 'requests', label: 'Payment Requests', icon: FileText },
            { id: 'subscriptions', label: 'Active Subscriptions', icon: Crown },
            { id: 'plans', label: 'Plans', icon: CreditCard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
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
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or transaction ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex gap-2">
                  {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          statusFilter === status
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {status}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
              {filteredRequests.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center">
                  <FileText className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-2">
                    No payment requests found
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">
                    Try adjusting your filters
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
                                    setSelectedProof(request.payment_proof_url);
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
                                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                    title="Reject"
                                  >
                                    <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />
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
          </div>
        )}

        {/* Active Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            {subscriptions.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center">
                <Crown className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mb-4" />
                <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-2">
                  No active subscriptions
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
                            <Crown className="w-4 h-4 text-amber-500" />
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
                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
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

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                      {plan.display_name}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      {plan.duration_days} days
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      plan.is_active
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mb-6">
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    ৳{plan.price.toLocaleString()}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {plan.currency}
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setShowPlanModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                  >
                    <Edit className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment Proof Modal */}
        {showProofModal && selectedProof && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-2xl w-full">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Payment Proof
                </h3>
                <button
                  onClick={() => {
                    setShowProofModal(false);
                    setSelectedProof(null);
                  }}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <img
                  src={selectedProof}
                  alt="Payment Proof"
                  className="w-full rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && reviewingRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full">
              <div
                className={`p-6 rounded-t-2xl ${
                  reviewAction === 'approve'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                    : 'bg-gradient-to-r from-rose-600 to-red-600'
                }`}
              >
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {reviewAction === 'approve' ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                  {reviewAction === 'approve' ? 'Approve' : 'Reject'} Payment
                </h3>
                <p className="text-white/80 text-sm mt-1">
                  Review payment request from {reviewingRequest.user?.name}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Plan:
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {reviewingRequest.plan_name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Amount:
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      ৳{reviewingRequest.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Method:
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {reviewingRequest.payment_method}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Admin Notes{' '}
                    {reviewAction === 'reject' && (
                      <span className="text-rose-600">*</span>
                    )}
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={
                      reviewAction === 'approve'
                        ? 'Add any notes (optional)'
                        : 'Provide reason for rejection'
                    }
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-3">
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setReviewingRequest(null);
                    setAdminNotes('');
                  }}
                  className="flex-1 px-6 py-3 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewPayment}
                  disabled={reviewAction === 'reject' && !adminNotes.trim()}
                  className={`flex-1 px-6 py-3 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                    reviewAction === 'approve'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                      : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white'
                  }`}
                >
                  {reviewAction === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plan Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-violet-600 p-6 rounded-t-2xl">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  {editingPlan.id ? 'Edit Plan' : 'Create New Plan'}
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  Configure subscription plan details
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      Plan Name (ID)
                    </label>
                    <input
                      type="text"
                      value={editingPlan.name || ''}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, name: e.target.value })
                      }
                      disabled={!!editingPlan.id}
                      placeholder="premium_monthly"
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      Display Name
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
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      Price
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
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      Duration (Days)
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
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Features (one per line)
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
                    placeholder="Unlimited exams&#10;AI question generator&#10;Detailed analytics"
                    rows={5}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      Color Theme
                    </label>
                    <select
                      value={editingPlan.color_theme || 'border-neutral-200'}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          color_theme: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="border-neutral-200">Neutral (Gray)</option>
                      <option value="border-indigo-500">
                        Indigo (Blue-ish)
                      </option>
                      <option value="border-rose-500">Rose (Red-ish)</option>
                      <option value="border-emerald-500">
                        Emerald (Green)
                      </option>
                      <option value="border-amber-500">Amber (Orange)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2 pt-8">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={editingPlan.is_active}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            is_active: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded border-neutral-300 dark:border-neutral-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="is_active"
                        className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                      >
                        Active (visible to users)
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_popular"
                        checked={editingPlan.is_popular}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            is_popular: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded border-neutral-300 dark:border-neutral-700 text-amber-500 focus:ring-2 focus:ring-amber-500"
                      />
                      <label
                        htmlFor="is_popular"
                        className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                      >
                        Mark as Popular (Highlight)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-neutral-50 dark:bg-neutral-800 p-6 rounded-b-2xl border-t border-neutral-200 dark:border-neutral-700 flex gap-3">
                <button
                  onClick={() => {
                    setShowPlanModal(false);
                    setEditingPlan({
                      currency: 'BDT',
                      features: [],
                      is_active: true,
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlan}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]"
                >
                  {editingPlan.id ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Extend Subscription Modal */}
        {showExtendModal && extendingSubscription && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-sm w-full animate-fade-in">
              <div className="p-6">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                  Extend Subscription
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                  Add days to {extendingSubscription.user?.name}'s current plan.
                </p>

                <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-500">Current Expiry:</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {new Date(
                        extendingSubscription.expires_at,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">New Expiry:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {new Date(
                        new Date(extendingSubscription.expires_at).getTime() +
                          extensionDays * 24 * 60 * 60 * 1000,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Extension Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[7, 30, 365].map((days) => (
                      <button
                        key={days}
                        onClick={() => setExtensionDays(days)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border ${
                          extensionDays === days
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {days} Days
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
                      className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                      Days
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowExtendModal(false);
                      setExtendingSubscription(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExtendSubscription}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
