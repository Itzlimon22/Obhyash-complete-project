'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Copy,
  ExternalLink,
  AlertCircle,
  Phone,
  PhoneCall,
  Filter,
  ArrowUpDown,
  Send,
  Bell,
  ShieldAlert,
  UserMinus,
  UserCheck,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { exportToCSV } from '@/lib/utils/export-csv';

interface PaymentRequest {
  id: string;
  user_id: string;
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
  plan_name?: string;
  plan_id?: string;
  plan?: {
    display_name?: string;
    price?: number;
  };
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
    phone?: string;
  };
  plan_name?: string;
  plan_id?: string;
  plan?: {
    display_name?: string;
    price?: number;
  };
  started_at: string;
  expires_at: string;
  is_active: boolean;
}

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<
    'requests' | 'active_subscriptions' | 'expired_subscriptions'
  >('requests');
  const [rawRequests, setRawRequests] = useState<PaymentRequest[]>([]);
  const [rawSubscriptions, setRawSubscriptions] = useState<SubscriptionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Requests Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'All' | 'Pending' | 'Approved' | 'Rejected'
  >('All');
  const [methodFilter, setMethodFilter] = useState<
    'All' | 'bKash' | 'Nagad' | 'Rocket' | 'UddoktaPay' | 'Manual'
  >('All');
  const [reqSort, setReqSort] = useState<
    'newest' | 'oldest' | 'amount_high' | 'amount_low'
  >('newest');

  // Subscriptions Filters & Sorting
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState<
    'All' | 'Expiring'
  >('All');
  const [subSort, setSubSort] = useState<
    'expiring_soon' | 'newest' | 'name'
  >('expiring_soon');

  // Pagination State
  const [reqPage, setReqPage] = useState(1);
  const [subPage, setSubPage] = useState(1);
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

  // Manual Subscription Management (Extend / Upgrade)
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingSubscription, setExtendingSubscription] =
    useState<SubscriptionHistory | null>(null);
  const [extensionDays, setExtensionDays] = useState(30);
  const [extensionPlan, setExtensionPlan] = useState('');
  const [isSubmittingExtend, setIsSubmittingExtend] = useState(false);

  // Send Direct Notification Modal
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifTargetUser, setNotifTargetUser] =
    useState<SubscriptionHistory | null>(null);
  const [notifTitle, setNotifTitle] = useState('প্রিমিয়াম সাবস্ক্রিপশন রিমাইন্ডার 🔔');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning'>('info');
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // Cancel / Revoke Subscription Modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] =
    useState<SubscriptionHistory | null>(null);
  const [cancelReason, setCancelReason] = useState('পেমেন্ট সমস্যা বা ব্যবহারকারীর অনুরোধে সাবস্ক্রিপশন বাতিল');
  const [isCancelling, setIsCancelling] = useState(false);

  // Global Server Aggregate Stats
  const [serverStats, setServerStats] = useState({
    totalRevenue: 0,
    pendingRequests: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    approvalRate: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showToast = false) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/subscriptions');
      if (!res.ok) throw new Error('Failed to fetch subscriptions data');
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || 'Invalid response');

      if (json.data.stats) {
        setServerStats({
          totalRevenue: Number(json.data.stats.totalRevenue) || 0,
          pendingRequests: Number(json.data.stats.pendingRequests) || 0,
          activeSubscriptions: Number(json.data.stats.activeSubscriptions) || 0,
          expiredSubscriptions: Number(json.data.stats.expiredSubscriptions) || 0,
          approvalRate: Number(json.data.stats.approvalRate) || 0,
        });
      }

      setRawRequests(json.data.paymentRequests || []);
      setRawSubscriptions(json.data.subscriptions || []);

      if (showToast) {
        toast.success('ডাটা সফলভাবে রিফ্রেশ হয়েছে');
      }
    } catch (error: unknown) {
      console.error('Failed to fetch data:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load subscription data';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered & Sorted Requests
  const filteredRequests = useMemo(() => {
    let list = [...rawRequests];

    // Search by Phone, TrxID, User Name, Email
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) =>
        (r.transaction_id && r.transaction_id.toLowerCase().includes(q)) ||
        (r.user?.phone && r.user.phone.toLowerCase().includes(q)) ||
        (r.user?.name && r.user.name.toLowerCase().includes(q)) ||
        (r.user?.email && r.user.email.toLowerCase().includes(q)) ||
        (r.plan_name && r.plan_name.toLowerCase().includes(q))
      );
    }

    // Status Filter
    if (statusFilter !== 'All') {
      list = list.filter((r) => r.status === statusFilter);
    }

    // Method Filter
    if (methodFilter !== 'All') {
      list = list.filter((r) => {
        const m = (r.payment_method || '').toLowerCase();
        return m.includes(methodFilter.toLowerCase());
      });
    }

    // Sorting
    if (reqSort === 'newest') {
      list.sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
    } else if (reqSort === 'oldest') {
      list.sort((a, b) => new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime());
    } else if (reqSort === 'amount_high') {
      list.sort((a, b) => b.amount - a.amount);
    } else if (reqSort === 'amount_low') {
      list.sort((a, b) => a.amount - b.amount);
    }

    return list;
  }, [rawRequests, searchQuery, statusFilter, methodFilter, reqSort]);

  // Paginated Requests
  const paginatedRequests = useMemo(() => {
    const from = (reqPage - 1) * pageSize;
    return filteredRequests.slice(from, from + pageSize);
  }, [filteredRequests, reqPage]);

  // Filtered & Sorted Active Subscriptions
  const filteredActiveSubscriptions = useMemo(() => {
    let list = rawSubscriptions.filter((s) => {
      if (!s.is_active) return false;
      const plan = (s.plan_name || s.plan?.display_name || '').toLowerCase();
      if (plan === 'free' || plan === 'rookie' || plan.includes('free plan') || plan === 'basic') {
        return false;
      }
      return true;
    });

    // Search by Phone, Name, Email, Plan
    if (subSearchQuery.trim()) {
      const q = subSearchQuery.toLowerCase().trim();
      list = list.filter((s) =>
        (s.user?.phone && s.user.phone.toLowerCase().includes(q)) ||
        (s.user?.name && s.user.name.toLowerCase().includes(q)) ||
        (s.user?.email && s.user.email.toLowerCase().includes(q)) ||
        (s.plan_name && s.plan_name.toLowerCase().includes(q))
      );
    }

    // Status Filter
    if (subStatusFilter === 'Expiring') {
      list = list.filter((s) => {
        if (!s.expires_at || !s.is_active) return false;
        const days = Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days <= 7 && days >= 0;
      });
    }

    // Sorting
    if (subSort === 'expiring_soon') {
      list.sort((a, b) => {
        const aTime = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
        const bTime = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
        return aTime - bTime;
      });
    } else if (subSort === 'newest') {
      list.sort((a, b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime());
    } else if (subSort === 'name') {
      list.sort((a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''));
    }

    return list;
  }, [rawSubscriptions, subSearchQuery, subStatusFilter, subSort]);

  // Filtered & Sorted Expired Subscriptions
  const filteredExpiredSubscriptions = useMemo(() => {
    let list = rawSubscriptions.filter((s) => {
      if (s.is_active) return false;
      const plan = (s.plan_name || s.plan?.display_name || '').toLowerCase();
      if (plan === 'free' || plan === 'rookie' || plan.includes('free plan') || plan === 'basic') {
        return false;
      }
      return true;
    });

    // Search by Phone, Name, Email, Plan
    if (subSearchQuery.trim()) {
      const q = subSearchQuery.toLowerCase().trim();
      list = list.filter((s) =>
        (s.user?.phone && s.user.phone.toLowerCase().includes(q)) ||
        (s.user?.name && s.user.name.toLowerCase().includes(q)) ||
        (s.user?.email && s.user.email.toLowerCase().includes(q)) ||
        (s.plan_name && s.plan_name.toLowerCase().includes(q))
      );
    }

    // Default newest expired first
    list.sort((a, b) => {
      const aTime = a.expires_at ? new Date(a.expires_at).getTime() : 0;
      const bTime = b.expires_at ? new Date(b.expires_at).getTime() : 0;
      return bTime - aTime;
    });

    return list;
  }, [rawSubscriptions, subSearchQuery]);

  // Paginated Active Subscriptions
  const paginatedActiveSubscriptions = useMemo(() => {
    const from = (subPage - 1) * pageSize;
    return filteredActiveSubscriptions.slice(from, from + pageSize);
  }, [filteredActiveSubscriptions, subPage]);

  // Paginated Expired Subscriptions
  const paginatedExpiredSubscriptions = useMemo(() => {
    const from = (subPage - 1) * pageSize;
    return filteredExpiredSubscriptions.slice(from, from + pageSize);
  }, [filteredExpiredSubscriptions, subPage]);

  const handleReviewPayment = async () => {
    if (!reviewingRequest) return;

    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review_payment',
          requestId: reviewingRequest.id,
          status: reviewAction === 'approve' ? 'Approved' : 'Rejected',
          adminNotes,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to review payment');

      toast.success(
        `Payment ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`,
      );
      setShowReviewModal(false);
      setReviewingRequest(null);
      setAdminNotes('');
      fetchData();
    } catch (error: unknown) {
      console.error('Error reviewing payment:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to review payment';
      toast.error(errorMessage);
    }
  };

  const handleExtendSubscription = async () => {
    if (!extendingSubscription) return;

    try {
      setIsSubmittingExtend(true);
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extend_subscription',
          userId: extendingSubscription.user_id,
          subscriptionId: extendingSubscription.id,
          days: extensionDays,
          planName: extensionPlan || undefined,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to extend subscription');

      toast.success(`${extendingSubscription.user?.name || 'User'} এর মেয়াদ সফলভাবে +${extensionDays} দিন বাড়ানো হয়েছে! 🎉`);
      setShowExtendModal(false);
      setExtendingSubscription(null);
      setExtensionPlan('');
      fetchData();
    } catch (error: unknown) {
      console.error('Error extending subscription:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to extend subscription';
      toast.error(errorMessage);
    } finally {
      setIsSubmittingExtend(false);
    }
  };

  // Quick 1-Click Bonus Gift (+7 Days)
  const handleQuickGiftBonus = async (sub: SubscriptionHistory, days = 7) => {
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extend_subscription',
          userId: sub.user_id,
          subscriptionId: sub.id,
          days,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to gift bonus');
      toast.success(`${sub.user?.name || 'User'} কে সফলভাবে +${days} দিন বোনাস গিফট দেওয়া হয়েছে! 🎁`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to gift bonus');
    }
  };

  // Cancel / Revoke Subscription
  const handleCancelSubscription = async () => {
    if (!cancellingSubscription) return;
    try {
      setIsCancelling(true);
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_subscription',
          userId: cancellingSubscription.user_id,
          reason: cancelReason,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to cancel subscription');
      toast.success('সাবস্ক্রিপশন সফলভাবে বাতিল করা হয়েছে।');
      setShowCancelModal(false);
      setCancellingSubscription(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  // Send Direct In-App Notification
  const handleSendNotification = async () => {
    if (!notifTargetUser || !notifTitle.trim() || !notifMessage.trim()) {
      toast.error('অনুগ্রহ করে শিরোনাম ও মেসেজ লিখুন');
      return;
    }
    try {
      setIsSendingNotif(true);
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_notification',
          userId: notifTargetUser.user_id,
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          type: notifType,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to send notification');
      toast.success(`${notifTargetUser.user?.name || 'User'} এর কাছে নোটিফিকেশন পাঠানো হয়েছে! 🚀`);
      setShowNotifModal(false);
      setNotifTargetUser(null);
      setNotifMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setIsSendingNotif(false);
    }
  };

  const formatTimestamp24h = (dateStr?: string | null) => {
    if (!dateStr) return { date: 'N/A', time: '', full: 'N/A' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: 'N/A', time: '', full: 'N/A' };

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}:${seconds}`,
      full: `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Active':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'Pending':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'Rejected':
      case 'Expired':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20';
    }
  };

  const renderMethodBadge = (method?: string) => {
    const m = (method || '').toLowerCase();
    if (m.includes('uddokta')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {method || 'UddoktaPay'}
        </span>
      );
    }
    if (m.includes('bkash')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
          bKash
        </span>
      );
    }
    if (m.includes('nagad')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          Nagad
        </span>
      );
    }
    if (m.includes('rocket')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Rocket
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
        {method || 'Manual'}
      </span>
    );
  };

  const renderPhoneCell = (phone?: string | null) => {
    if (!phone) {
      return <span className="text-xs text-neutral-400 italic">প্রযোজ্য নয়</span>;
    }
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono text-neutral-800 dark:text-neutral-200 font-medium">
          {phone}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(phone);
            toast.success('ফোন নম্বর কপি করা হয়েছে');
          }}
          className="p-1 text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors"
          title="Copy Phone"
        >
          <Copy size={12} />
        </button>
      </div>
    );
  };

  const exportData = () => {
    if (activeTab === 'requests') {
      if (!filteredRequests || filteredRequests.length === 0) {
        toast.error('এক্সপোর্ট করার মতো কোনো পেমেন্ট রিকোয়েস্ট নেই');
        return;
      }
      exportToCSV({
        filename: `payment_requests_${new Date().toISOString().split('T')[0]}.csv`,
        headers: [
          'User Name',
          'Email',
          'Phone Number',
          'Payment Method',
          'Transaction ID',
          'Plan Name',
          'Amount (BDT)',
          'Status',
          'Requested Date & Time (24h)',
        ],
        rows: filteredRequests.map((r) => [
          r.user?.name || 'N/A',
          r.user?.email || 'N/A',
          r.user?.phone || 'N/A',
          r.payment_method?.toUpperCase() || 'N/A',
          r.transaction_id || 'N/A',
          r.plan_name || 'N/A',
          r.amount || 0,
          r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Pending',
          formatTimestamp24h(r.requested_at).full,
        ]),
      });
      toast.success('পেমেন্ট রিকোয়েস্ট শিট সফলভাবে ডাউনলোড হয়েছে');
    } else if (activeTab === 'active_subscriptions') {
      if (!filteredActiveSubscriptions || filteredActiveSubscriptions.length === 0) {
        toast.error('এক্সপোর্ট করার মতো কোনো অ্যাক্টিভ প্রিমিয়াম ইউজার নেই');
        return;
      }
      exportToCSV({
        filename: `active_premium_users_${new Date().toISOString().split('T')[0]}.csv`,
        headers: [
          'User Name',
          'Email',
          'Phone Number',
          'Subscription Plan',
          'Started Date & Time (24h)',
          'Expires Date & Time (24h)',
          'Remaining Days',
          'Status',
        ],
        rows: filteredActiveSubscriptions.map((s) => {
          const daysLeft = s.expires_at
            ? Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;
          const remainingText =
            daysLeft !== null
              ? daysLeft <= 0
                ? 'আজকে শেষ হবে'
                : `${daysLeft} দিন বাকি`
              : 'আজীবন / আনলিমিটেড';

          return [
            s.user?.name || 'N/A',
            s.user?.email || 'N/A',
            s.user?.phone || 'N/A',
            s.plan_name || s.plan?.display_name || 'Pro Premium',
            formatTimestamp24h(s.started_at).full,
            s.expires_at ? formatTimestamp24h(s.expires_at).full : 'Unlimited',
            remainingText,
            'Active',
          ];
        }),
      });
      toast.success('অ্যাক্টিভ প্রিমিয়াম ইউজার শিট সফলভাবে ডাউনলোড হয়েছে');
    } else {
      if (!filteredExpiredSubscriptions || filteredExpiredSubscriptions.length === 0) {
        toast.error('এক্সপোর্ট করার মতো কোনো মেয়াদোত্তীর্ণ ইউজার নেই');
        return;
      }
      exportToCSV({
        filename: `expired_premium_users_${new Date().toISOString().split('T')[0]}.csv`,
        headers: [
          'User Name',
          'Email',
          'Phone Number',
          'Last Plan',
          'Started Date & Time (24h)',
          'Expired Date & Time (24h)',
          'Expired Ago',
          'Status',
        ],
        rows: filteredExpiredSubscriptions.map((s) => {
          const daysAgo = s.expires_at
            ? Math.floor((Date.now() - new Date(s.expires_at).getTime()) / (1000 * 60 * 60 * 24))
            : null;
          const expiredAgoText =
            daysAgo !== null
              ? daysAgo <= 0
                ? 'আজকে শেষ হয়েছে'
                : `${daysAgo} দিন আগে`
              : 'N/A';

          return [
            s.user?.name || 'N/A',
            s.user?.email || 'N/A',
            s.user?.phone || 'N/A',
            s.plan_name || s.plan?.display_name || 'Pro Premium',
            formatTimestamp24h(s.started_at).full,
            s.expires_at ? formatTimestamp24h(s.expires_at).full : 'N/A',
            expiredAgoText,
            'Expired',
          ];
        }),
      });
      toast.success('মেয়াদোত্তীর্ণ ইউজার শিট সফলভাবে ডাউনলোড হয়েছে');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"
            ></div>
          ))}
        </div>
        <div className="h-96 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
            সাবস্ক্রিপশন ও পেমেন্ট
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            পেমেন্ট ভেরিফিকেশন, অ্যাক্টিভ প্রিমিয়াম ইউজার ও মেয়াদ নিয়ন্ত্রণ করুন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View Toggle */}
          <div className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl flex items-center gap-1 border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setViewStyle('responsive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewStyle === 'responsive'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Responsive View (Auto)"
            >
              Auto
            </button>
            <button
              onClick={() => setViewStyle('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewStyle === 'table'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewStyle('card')}
              className={`p-1.5 rounded-lg transition-all ${
                viewStyle === 'card'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Card View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <button
            onClick={() => fetchData(true)}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-200 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">রিফ্রেশ</span>
          </button>

          <button
            onClick={exportData}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-200 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95"
            title="Export CSV"
          >
            <Download size={16} />
            <span className="hidden sm:inline">এক্সপোর্ট CSV</span>
          </button>
        </div>
      </div>

      {/* Global Server Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">
                মোট আয়
              </p>
              <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-1 sm:mt-2">
                ৳{serverStats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">
                পেন্ডিং রিকোয়েস্ট
              </p>
              <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-1 sm:mt-2">
                {serverStats.pendingRequests}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 dark:bg-amber-950/40 rounded-xl sm:rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">
                এক্টিভ প্রিমিয়াম ইউজার
              </p>
              <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-1 sm:mt-2">
                {serverStats.activeSubscriptions}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 dark:bg-purple-950/40 rounded-xl sm:rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">
                মেয়াদোত্তীর্ণ প্রিমিয়াম
              </p>
              <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-1 sm:mt-2">
                {serverStats.expiredSubscriptions}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-950/40 rounded-xl sm:rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-[13px] sm:text-sm font-bold border-b-2 transition-colors shrink-0 whitespace-nowrap ${
              activeTab === 'requests'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <FileText size={18} />
            <span>পেমেন্ট রিকোয়েস্ট</span>
            {serverStats.pendingRequests > 0 && (
              <span className="px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full font-bold animate-pulse">
                {serverStats.pendingRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('active_subscriptions');
              setSubPage(1);
            }}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-[13px] sm:text-sm font-bold border-b-2 transition-colors shrink-0 whitespace-nowrap ${
              activeTab === 'active_subscriptions'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Crown size={18} />
            <span>এক্টিভ প্রিমিয়াম ইউজার</span>
            <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full font-bold">
              {serverStats.activeSubscriptions}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab('expired_subscriptions');
              setSubPage(1);
            }}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-[13px] sm:text-sm font-bold border-b-2 transition-colors shrink-0 whitespace-nowrap ${
              activeTab === 'expired_subscriptions'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Clock size={18} />
            <span>সম্প্রতি মেয়াদোত্তীর্ণ</span>
            <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full font-bold">
              {serverStats.expiredSubscriptions}
            </span>
          </button>
        </div>

        {/* Tab 1: Payment Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              {/* Search Box: TrxID, Phone, Name, Email */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="ফোন নম্বর (017...), ট্রানজেকশন আইডি, ইউজারের নাম বা ইমেইল দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setReqPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
                />
              </div>

              {/* Status, Method, and Sort Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
                {/* Status Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setReqPage(1);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          statusFilter === status
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {status === 'All'
                          ? `সব (${rawRequests.length})`
                          : status === 'Pending'
                          ? `পেন্ডিং (${serverStats.pendingRequests})`
                          : status}
                      </button>
                    ),
                  )}
                </div>

                {/* Method & Sort Dropdowns */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Method Filter */}
                  <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <Filter size={14} className="text-neutral-400" />
                    <span className="text-xs text-neutral-500 font-medium">মেথড:</span>
                    <select
                      value={methodFilter}
                      onChange={(e) => {
                        setMethodFilter(e.target.value as typeof methodFilter);
                        setReqPage(1);
                      }}
                      className="bg-transparent text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
                    >
                      <option value="All">সব মেথড</option>
                      <option value="UddoktaPay">UddoktaPay</option>
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <ArrowUpDown size={14} className="text-neutral-400" />
                    <span className="text-xs text-neutral-500 font-medium">সর্ট:</span>
                    <select
                      value={reqSort}
                      onChange={(e) => {
                        setReqSort(e.target.value as typeof reqSort);
                        setReqPage(1);
                      }}
                      className="bg-transparent text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
                    >
                      <option value="newest">নতুন আগে</option>
                      <option value="oldest">পুরনো আগে</option>
                      <option value="amount_high">টাকা (বেশি থেকে কম)</option>
                      <option value="amount_low">টাকা (কম থেকে বেশি)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Card List */}
            {(viewStyle === 'responsive' || viewStyle === 'card') && (
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${viewStyle === 'responsive' ? 'lg:hidden' : ''}`}
              >
                {paginatedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <Link
                        href={`/admin/user-management/${request.user_id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 font-bold text-sm">
                          {request.user?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                            {request.user?.name || 'Unknown'}
                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                            {request.user?.email || 'N/A'}
                          </p>
                        </div>
                      </Link>
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
                          ফোন নম্বর
                        </p>
                        <div className="mt-0.5">
                          {renderPhoneCell(request.user?.phone)}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase">
                          মেথড
                        </p>
                        <div className="mt-0.5">
                          {renderMethodBadge(request.payment_method)}
                        </div>
                      </div>
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
                        <p className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                          ৳{request.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase">
                          Transaction ID
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 truncate">
                            {request.transaction_id || 'N/A'}
                          </p>
                          {request.transaction_id && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(request.transaction_id || '');
                                toast.success('TrxID কপি করা হয়েছে');
                              }}
                              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
                              title="Copy TrxID"
                            >
                              <Copy size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500">
                        <Clock size={13} className="text-neutral-400" />
                        <span>{formatTimestamp24h(request.requested_at).full}</span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        {request.payment_proof_url && (
                          <button
                            onClick={() => {
                              setSelectedProof(request.payment_proof_url);
                              setShowProofModal(true);
                            }}
                            className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
                            title="প্রুফ দেখুন"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        {request.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => {
                                setReviewingRequest(request);
                                setReviewAction('approve');
                                setShowReviewModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setReviewingRequest(request);
                                setReviewAction('reject');
                                setShowReviewModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all"
                            >
                              <X size={14} /> Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setReviewingRequest(request);
                              setReviewAction(request.status === 'Approved' ? 'reject' : 'approve');
                              setShowReviewModal(true);
                            }}
                            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-bold transition-all"
                          >
                            পরিবর্তন
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Desktop Table View */}
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
                          <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Phone Number
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Transaction ID
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Date & Time (24h)
                          </th>
                          <th className="px-5 py-4 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {paginatedRequests.map((request) => (
                          <tr
                            key={request.id}
                            className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                          >
                            <td className="px-5 py-4">
                              <Link
                                href={`/admin/user-management/${request.user_id}`}
                                className="group flex items-center gap-2"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                                    {request.user?.name || 'Unknown'}
                                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </p>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {request.user?.email || 'N/A'}
                                  </p>
                                </div>
                              </Link>
                            </td>
                            <td className="px-5 py-4">
                              {renderPhoneCell(request.user?.phone)}
                            </td>
                            <td className="px-5 py-4">
                              {renderMethodBadge(request.payment_method)}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-neutral-700 dark:text-neutral-300 font-semibold">
                                  {request.transaction_id || 'N/A'}
                                </span>
                                {request.transaction_id && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(request.transaction_id || '');
                                      toast.success('TrxID কপি করা হয়েছে');
                                    }}
                                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded transition-colors"
                                    title="Copy TrxID"
                                  >
                                    <Copy size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                                {request.plan_name}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                ৳{request.amount.toLocaleString()}
                              </p>
                            </td>
                            <td className="px-5 py-4">
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
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                                  {formatTimestamp24h(request.requested_at).date}
                                </span>
                                <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-1 pl-5">
                                  <Clock className="w-3 h-3 text-neutral-400" />
                                  {formatTimestamp24h(request.requested_at).time}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {request.payment_proof_url && (
                                  <button
                                    onClick={() => {
                                      setSelectedProof(
                                        request.payment_proof_url,
                                      );
                                      setShowProofModal(true);
                                    }}
                                    className="p-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                                    title="প্রুফ দেখুন (View Proof)"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                                {request.status === 'Pending' ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setReviewingRequest(request);
                                        setReviewAction('approve');
                                        setShowReviewModal(true);
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                                      title="অনুমোদন করুন (Approve)"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Approve</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReviewingRequest(request);
                                        setReviewAction('reject');
                                        setShowReviewModal(true);
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                                      title="বাতিল করুন (Reject)"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Reject</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setReviewingRequest(request);
                                      setReviewAction(request.status === 'Approved' ? 'reject' : 'approve');
                                      setShowReviewModal(true);
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                                    title="স্ট্যাটাস পরিবর্তন করুন"
                                  >
                                    পরিবর্তন
                                  </button>
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

            {/* Pagination for Requests */}
            {filteredRequests.length > pageSize && (
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-500">
                  দেখাচ্ছে {(reqPage - 1) * pageSize + 1} থেকে {Math.min(reqPage * pageSize, filteredRequests.length)} (মোট {filteredRequests.length} টি)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={reqPage === 1}
                    onClick={() => setReqPage((p) => p - 1)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-40"
                  >
                    আগের পেজ
                  </button>
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    পেজ {reqPage} / {Math.ceil(filteredRequests.length / pageSize)}
                  </span>
                  <button
                    disabled={reqPage * pageSize >= filteredRequests.length}
                    onClick={() => setReqPage((p) => p + 1)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-40"
                  >
                    পরের পেজ
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Active Premium Subscriptions */}
        {activeTab === 'active_subscriptions' && (
          <div className="space-y-6">
            {/* Filter Bar for Active Subscriptions */}
            <div className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="ফোন নম্বর (017...), ইউজারের নাম, ইমেইল অথবা প্লান দিয়ে খুঁজুন..."
                  value={subSearchQuery}
                  onChange={(e) => {
                    setSubSearchQuery(e.target.value);
                    setSubPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-medium"
                />
              </div>

              {/* Status Pills and Sorting */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => {
                      setSubStatusFilter('All');
                      setSubPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      subStatusFilter === 'All'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    সব এক্টিভ ({filteredActiveSubscriptions.length})
                  </button>
                  <button
                    onClick={() => {
                      setSubStatusFilter('Expiring');
                      setSubPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      subStatusFilter === 'Expiring'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    মেয়াদ শেষের দিকে (≤ ৭ দিন)
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <ArrowUpDown size={14} className="text-neutral-400" />
                  <span className="text-xs text-neutral-500 font-medium">সর্ট:</span>
                  <select
                    value={subSort}
                    onChange={(e) => {
                      setSubSort(e.target.value as typeof subSort);
                      setSubPage(1);
                    }}
                    className="bg-transparent text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
                  >
                    <option value="expiring_soon">মেয়াদ শেষের দিকে আগে</option>
                    <option value="newest">নতুন সাবস্ক্রাইবার আগে</option>
                    <option value="name">ইউজারের নাম (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile Card List */}
            {(viewStyle === 'responsive' || viewStyle === 'card') && (
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${viewStyle === 'responsive' ? 'lg:hidden' : ''}`}
              >
                {filteredActiveSubscriptions.length === 0 ? (
                  <div className="py-24 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center col-span-2">
                    <Crown className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                      কোন অ্যাক্টিভ প্রিমিয়াম ইউজার নেই
                    </p>
                  </div>
                ) : (
                  paginatedActiveSubscriptions.map((sub) => {
                    const daysRemaining = sub.expires_at
                      ? Math.ceil((new Date(sub.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : null;

                    return (
                      <div
                        key={sub.id}
                        className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <Link
                            href={`/admin/user-management/${sub.user_id}`}
                            className="flex items-center gap-3 group"
                          >
                            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 font-bold text-sm">
                              <Crown size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-purple-600 transition-colors flex items-center gap-1">
                                {sub.user?.name || 'Unknown'}
                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </p>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                                {sub.user?.email || 'N/A'}
                              </p>
                            </div>
                          </Link>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        </div>

                        <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase">
                              ফোন নম্বর
                            </span>
                            {renderPhoneCell(sub.user?.phone)}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase">
                              প্লান
                            </span>
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                              {sub.plan_name || sub.plan?.display_name || 'Pro Premium'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-neutral-200 dark:border-neutral-800">
                            <span className="text-neutral-500 font-mono">
                              Exp: {sub.expires_at ? formatTimestamp24h(sub.expires_at).full : 'Unlimited'}
                            </span>
                            {daysRemaining !== null && (
                              <span className={`text-[10px] font-bold ${daysRemaining <= 7 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Active Subscriber Card Actions */}
                        <div className="flex items-center justify-between pt-2 gap-1.5 border-t border-neutral-100 dark:border-neutral-800">
                          {/* Extend Button */}
                          <button
                            onClick={() => {
                              setExtendingSubscription(sub);
                              setExtensionPlan(sub.plan_name || sub.plan?.display_name || 'Pro Premium');
                              setShowExtendModal(true);
                            }}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                            title="মেয়াদ বাড়ান"
                          >
                            <RefreshCw size={13} />
                            <span>মেয়াদ বাড়ান</span>
                          </button>

                          {/* Quick +7d Bonus */}
                          <button
                            onClick={() => handleQuickGiftBonus(sub, 7)}
                            className="p-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 transition-colors"
                            title="১-ক্লিকে +৭ দিন ফ্রি গিফট করুন"
                          >
                            <Gift size={15} />
                          </button>

                          {/* Send Notification */}
                          <button
                            onClick={() => {
                              setNotifTargetUser(sub);
                              setNotifTitle('প্রিমিয়াম সাবস্ক্রিপশন আপডেট 🌟');
                              setNotifMessage(`প্রিয় ${sub.user?.name || 'শিক্ষার্থী'}, অভ্যাস প্রিমিয়ামে আপনার সক্রিয় থাকার জন্য ধন্যবাদ!`);
                              setNotifType('info');
                              setShowNotifModal(true);
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 transition-colors"
                            title="ইন-অ্যাপ বার্তা পাঠান"
                          >
                            <Bell size={15} />
                          </button>

                          {/* Cancel Subscription */}
                          <button
                            onClick={() => {
                              setCancellingSubscription(sub);
                              setShowCancelModal(true);
                            }}
                            className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 transition-colors"
                            title="সাবস্ক্রিপশন বাতিল করুন"
                          >
                            <UserMinus size={15} />
                          </button>

                          {/* View Profile */}
                          <Link
                            href={`/admin/user-management/${sub.user_id}`}
                            className="p-2 text-neutral-500 hover:text-purple-600 dark:hover:text-purple-400 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 transition-colors"
                            title="ইউজারের বিস্তারিত প্রোফাইল"
                          >
                            <ExternalLink size={15} />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Active Subscriptions Table */}
            {(viewStyle === 'responsive' || viewStyle === 'table') && (
              <div
                className={`bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden ${viewStyle === 'responsive' ? 'hidden lg:block' : ''}`}
              >
                {filteredActiveSubscriptions.length === 0 ? (
                  <div className="py-24 flex flex-col items-center justify-center">
                    <Crown className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                      কোন অ্যাক্টিভ প্রিমিয়াম ইউজার পাওয়া যায়নি
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
                            Phone Number
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Started (24h)
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Expires (24h)
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {paginatedActiveSubscriptions.map((sub) => {
                          const daysRemaining = sub.expires_at
                            ? Math.ceil((new Date(sub.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                            : null;

                          return (
                            <tr
                              key={sub.id}
                              className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <Link
                                  href={`/admin/user-management/${sub.user_id}`}
                                  className="group flex items-center gap-2"
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-purple-600 transition-colors flex items-center gap-1.5">
                                      {sub.user?.name || 'Unknown'}
                                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                      {sub.user?.email || 'N/A'}
                                    </p>
                                  </div>
                                </Link>
                              </td>
                              <td className="px-6 py-4">
                                {renderPhoneCell(sub.user?.phone)}
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                  <Crown className="w-4 h-4 text-amber-500" />
                                  {sub.plan_name || sub.plan?.display_name || 'Pro Premium'}
                                </p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                    {formatTimestamp24h(sub.started_at).date}
                                  </span>
                                  <span className="text-[11px] font-mono text-neutral-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-neutral-400" />
                                    {formatTimestamp24h(sub.started_at).time}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="space-y-1">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                      {sub.expires_at ? formatTimestamp24h(sub.expires_at).date : 'Unlimited'}
                                    </span>
                                    {sub.expires_at && (
                                      <span className="text-[11px] font-mono text-neutral-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-neutral-400" />
                                        {formatTimestamp24h(sub.expires_at).time}
                                      </span>
                                    )}
                                  </div>
                                  {daysRemaining !== null && (
                                    <span
                                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        daysRemaining <= 7
                                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                                      }`}
                                    >
                                      {daysRemaining > 0 ? `${daysRemaining} দিন বাকি` : 'শেষ হয়েছে'}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Active
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Extend Button */}
                                  <button
                                    onClick={() => {
                                      setExtendingSubscription(sub);
                                      setExtensionPlan(sub.plan_name || sub.plan?.display_name || 'Pro Premium');
                                      setShowExtendModal(true);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-bold rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800/60 shadow-sm active:scale-95"
                                    title="মেয়াদ বা প্লান বাড়ান"
                                  >
                                    <RefreshCw size={13} />
                                    <span>মেয়াদ বাড়ান</span>
                                  </button>

                                  {/* Quick +7d Bonus */}
                                  <button
                                    onClick={() => handleQuickGiftBonus(sub, 7)}
                                    className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800/50 transition-colors active:scale-95"
                                    title="১-ক্লিকে +৭ দিন ফ্রি গিফট করুন"
                                  >
                                    <Gift size={14} />
                                  </button>

                                  {/* Send In-App Notification */}
                                  <button
                                    onClick={() => {
                                      setNotifTargetUser(sub);
                                      setNotifTitle('প্রিমিয়াম সাবস্ক্রিপশন আপডেট 🌟');
                                      setNotifMessage(`প্রিয় ${sub.user?.name || 'শিক্ষার্থী'}, অভ্যাস প্রিমিয়ামে আপনার সক্রিয় থাকার জন্য ধন্যবাদ!`);
                                      setNotifType('info');
                                      setShowNotifModal(true);
                                    }}
                                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800/50 transition-colors active:scale-95"
                                    title="ইন-অ্যাপ বার্তা পাঠান"
                                  >
                                    <Bell size={14} />
                                  </button>

                                  {/* Cancel Subscription */}
                                  <button
                                    onClick={() => {
                                      setCancellingSubscription(sub);
                                      setShowCancelModal(true);
                                    }}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-800/50 transition-colors active:scale-95"
                                    title="সাবস্ক্রিপশন বাতিল করুন"
                                  >
                                    <UserMinus size={14} />
                                  </button>

                                  {/* Profile View */}
                                  <Link
                                    href={`/admin/user-management/${sub.user_id}`}
                                    className="p-1.5 text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors border border-neutral-200 dark:border-neutral-800"
                                    title="ইউজারের বিস্তারিত প্রোফাইল দেখুন"
                                  >
                                    <ExternalLink size={14} />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Pagination for Active Subscriptions */}
            {filteredActiveSubscriptions.length > pageSize && (
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-500">
                  দেখাচ্ছে {(subPage - 1) * pageSize + 1} থেকে {Math.min(subPage * pageSize, filteredActiveSubscriptions.length)} (মোট {filteredActiveSubscriptions.length} জন)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={subPage === 1}
                    onClick={() => setSubPage((p) => p - 1)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-40"
                  >
                    আগের পেজ
                  </button>
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    পেজ {subPage} / {Math.ceil(filteredActiveSubscriptions.length / pageSize)}
                  </span>
                  <button
                    disabled={subPage * pageSize >= filteredActiveSubscriptions.length}
                    onClick={() => setSubPage((p) => p + 1)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-40"
                  >
                    পরের পেজ
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Recently Expired Subscriptions */}
        {activeTab === 'expired_subscriptions' && (
          <div className="space-y-6">
            {/* Filter Bar for Expired Subscriptions */}
            <div className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="ফোন নম্বর (017...), ইউজারের নাম, ইমেইল অথবা প্লান দিয়ে খুঁজুন..."
                  value={subSearchQuery}
                  onChange={(e) => {
                    setSubSearchQuery(e.target.value);
                    setSubPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Mobile Card List */}
            {(viewStyle === 'responsive' || viewStyle === 'card') && (
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${viewStyle === 'responsive' ? 'lg:hidden' : ''}`}
              >
                {filteredExpiredSubscriptions.length === 0 ? (
                  <div className="py-24 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center col-span-2">
                    <Clock className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                      কোন মেয়াদোত্তীর্ণ প্রিমিয়াম ইউজার নেই
                    </p>
                  </div>
                ) : (
                  paginatedExpiredSubscriptions.map((sub) => {
                    const daysAgo = sub.expires_at
                      ? Math.floor((Date.now() - new Date(sub.expires_at).getTime()) / (1000 * 60 * 60 * 24))
                      : null;

                    return (
                      <div
                        key={sub.id}
                        className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <Link
                            href={`/admin/user-management/${sub.user_id}`}
                            className="flex items-center gap-3 group"
                          >
                            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 font-bold text-sm">
                              <Clock size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-red-600 transition-colors flex items-center gap-1">
                                {sub.user?.name || 'Unknown'}
                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </p>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                                {sub.user?.email || 'N/A'}
                              </p>
                            </div>
                          </Link>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            Expired
                          </span>
                        </div>

                        <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase">
                              ফোন নম্বর
                            </span>
                            {renderPhoneCell(sub.user?.phone)}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase">
                              পূর্ববর্তী প্লান
                            </span>
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                              {sub.plan_name || sub.plan?.display_name || 'Pro Premium'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-neutral-200 dark:border-neutral-800">
                            <span className="text-neutral-500 font-mono">
                              শেষ হয়েছে: {sub.expires_at ? formatTimestamp24h(sub.expires_at).full : 'N/A'}
                            </span>
                            {daysAgo !== null && (
                              <span className="text-[10px] font-bold text-red-500">
                                {daysAgo <= 0 ? 'আজকে শেষ হয়েছে' : `${daysAgo} দিন আগে`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expired Subscriber Card Actions */}
                        <div className="flex items-center justify-between pt-2 gap-1.5 border-t border-neutral-100 dark:border-neutral-800">
                          {/* Reactivate Button */}
                          <button
                            onClick={() => {
                              setExtendingSubscription(sub);
                              setExtensionPlan(sub.plan_name || sub.plan?.display_name || 'Pro Premium');
                              setShowExtendModal(true);
                            }}
                            className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                            title="পুনরায় সাবস্ক্রিপশন এক্টিভ করুন"
                          >
                            <RefreshCw size={13} />
                            <span>এক্টিভ করুন</span>
                          </button>

                          {/* Quick +7d Winback Gift */}
                          <button
                            onClick={() => handleQuickGiftBonus(sub, 7)}
                            className="p-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 transition-colors"
                            title="উইনব্যাক অফার: ১-ক্লিকে +৭ দিন ফ্রি দিন"
                          >
                            <Gift size={15} />
                          </button>

                          {/* Send Renewal Offer Notification */}
                          <button
                            onClick={() => {
                              setNotifTargetUser(sub);
                              setNotifTitle('বিশেষ রিনিউয়াল ছাড় অফার 🎁');
                              setNotifMessage(`প্রিয় ${sub.user?.name || 'শিক্ষার্থী'}, অভ্যাস প্রো-তে পুনরায় ফিরে আসতে বিশেষ ২০% ছাড় উপভোগ করুন!`);
                              setNotifType('success');
                              setShowNotifModal(true);
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 transition-colors"
                            title="রিনিউয়াল অফার নোটিফিকেশন পাঠান"
                          >
                            <Bell size={15} />
                          </button>

                          {/* Profile Link */}
                          <Link
                            href={`/admin/user-management/${sub.user_id}`}
                            className="p-2 text-neutral-500 hover:text-purple-600 dark:hover:text-purple-400 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 transition-colors"
                            title="ইউজারের প্রোফাইল দেখুন"
                          >
                            <ExternalLink size={15} />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Expired Subscriptions Table */}
            {(viewStyle === 'responsive' || viewStyle === 'table') && (
              <div
                className={`bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden ${viewStyle === 'responsive' ? 'hidden lg:block' : ''}`}
              >
                {filteredExpiredSubscriptions.length === 0 ? (
                  <div className="py-24 flex flex-col items-center justify-center">
                    <Clock className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                      কোন মেয়াদোত্তীর্ণ প্রিমিয়াম ইউজার পাওয়া যায়নি
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
                            Phone Number
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Last Plan
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Started (24h)
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Expired (24h)
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {paginatedExpiredSubscriptions.map((sub) => {
                          const daysAgo = sub.expires_at
                            ? Math.floor((Date.now() - new Date(sub.expires_at).getTime()) / (1000 * 60 * 60 * 24))
                            : null;

                          return (
                            <tr
                              key={sub.id}
                              className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <Link
                                  href={`/admin/user-management/${sub.user_id}`}
                                  className="group flex items-center gap-2"
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-red-600 transition-colors flex items-center gap-1.5">
                                      {sub.user?.name || 'Unknown'}
                                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                      {sub.user?.email || 'N/A'}
                                    </p>
                                  </div>
                                </Link>
                              </td>
                              <td className="px-6 py-4">
                                {renderPhoneCell(sub.user?.phone)}
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                  <Crown className="w-4 h-4 text-amber-500" />
                                  {sub.plan_name || sub.plan?.display_name || 'Pro Premium'}
                                </p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                    {formatTimestamp24h(sub.started_at).date}
                                  </span>
                                  <span className="text-[11px] font-mono text-neutral-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-neutral-400" />
                                    {formatTimestamp24h(sub.started_at).time}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="space-y-1">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                      {sub.expires_at ? formatTimestamp24h(sub.expires_at).date : 'N/A'}
                                    </span>
                                    {sub.expires_at && (
                                      <span className="text-[11px] font-mono text-neutral-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-neutral-400" />
                                        {formatTimestamp24h(sub.expires_at).time}
                                      </span>
                                    )}
                                  </div>
                                  {daysAgo !== null && (
                                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600">
                                      {daysAgo <= 0 ? 'আজকে শেষ হয়েছে' : `${daysAgo} দিন আগে`}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                  <XCircle className="w-3.5 h-3.5" />
                                  Expired
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Reactivate Button */}
                                  <button
                                    onClick={() => {
                                      setExtendingSubscription(sub);
                                      setExtensionPlan(sub.plan_name || sub.plan?.display_name || 'Pro Premium');
                                      setShowExtendModal(true);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-bold rounded-lg transition-colors border border-purple-200 dark:border-purple-800/60 shadow-sm active:scale-95"
                                    title="পুনরায় এক্টিভ করুন"
                                  >
                                    <RefreshCw size={13} />
                                    <span>এক্টিভ করুন</span>
                                  </button>

                                  {/* Quick +7d Winback Bonus */}
                                  <button
                                    onClick={() => handleQuickGiftBonus(sub, 7)}
                                    className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800/50 transition-colors active:scale-95"
                                    title="উইনব্যাক বোনাস: ১-ক্লিকে +৭ দিন ফ্রি দিন"
                                  >
                                    <Gift size={14} />
                                  </button>

                                  {/* Send Renewal Offer Notification */}
                                  <button
                                    onClick={() => {
                                      setNotifTargetUser(sub);
                                      setNotifTitle('বিশেষ রিনিউয়াল ছাড় অফার 🎁');
                                      setNotifMessage(`প্রিয় ${sub.user?.name || 'শিক্ষার্থী'}, অভ্যাস প্রো-তে পুনরায় ফিরে আসতে বিশেষ ২০% ছাড় উপভোগ করুন!`);
                                      setNotifType('success');
                                      setShowNotifModal(true);
                                    }}
                                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800/50 transition-colors active:scale-95"
                                    title="রিনিউয়াল অফার নোটিফিকেশন পাঠান"
                                  >
                                    <Bell size={14} />
                                  </button>

                                  {/* Profile View */}
                                  <Link
                                    href={`/admin/user-management/${sub.user_id}`}
                                    className="p-1.5 text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors border border-neutral-200 dark:border-neutral-800"
                                    title="ইউজারের বিস্তারিত প্রোফাইল দেখুন"
                                  >
                                    <ExternalLink size={14} />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Pagination for Expired Subscriptions */}
            {filteredExpiredSubscriptions.length > pageSize && (
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-500">
                  দেখাচ্ছে {(subPage - 1) * pageSize + 1} থেকে {Math.min(subPage * pageSize, filteredExpiredSubscriptions.length)} (মোট {filteredExpiredSubscriptions.length} জন)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={subPage === 1}
                    onClick={() => setSubPage((p) => p - 1)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-40"
                  >
                    আগের পেজ
                  </button>
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    পেজ {subPage} / {Math.ceil(filteredExpiredSubscriptions.length / pageSize)}
                  </span>
                  <button
                    disabled={subPage * pageSize >= filteredExpiredSubscriptions.length}
                    onClick={() => setSubPage((p) => p + 1)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-40"
                  >
                    পরের পেজ
                  </button>
                </div>
              </div>
            )}
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

        {/* ── 1. Extend / Upgrade Subscription Modal ── */}
        {showExtendModal && extendingSubscription && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-[#004633] to-[#00664B] text-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/20 border border-emerald-400/30 uppercase tracking-widest text-emerald-200">
                    {extendingSubscription.is_active ? 'Extend Active Plan' : 'Reactivate Plan'}
                  </span>
                  <button
                    onClick={() => {
                      setShowExtendModal(false);
                      setExtendingSubscription(null);
                    }}
                    className="p-1 text-white/70 hover:text-white rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {extendingSubscription.is_active ? 'সাবস্ক্রিপশন মেয়াদ বাড়ান' : 'পুনরায় সাবস্ক্রিপশন এক্টিভ করুন'}
                </h3>
                <p className="text-white/80 text-xs mt-0.5">
                  {extendingSubscription.user?.name} ({extendingSubscription.user?.phone || extendingSubscription.user?.email})
                </p>
              </div>

              <div className="p-6 space-y-5">
                {/* Expiry Overview Box */}
                <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">বর্তমান স্ট্যাটাস:</span>
                    <span className={`font-bold ${extendingSubscription.is_active ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {extendingSubscription.is_active ? 'এক্টিভ' : 'মেয়াদোত্তীর্ণ'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">বর্তমান মেয়াদ:</span>
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">
                      {extendingSubscription.expires_at ? new Date(extendingSubscription.expires_at).toLocaleDateString('bn-BD') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1.5 border-t border-neutral-200 dark:border-neutral-800">
                    <span className="text-neutral-500">নতুন বর্ধিত মেয়াদ:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {new Date(
                        (extendingSubscription.expires_at && new Date(extendingSubscription.expires_at).getTime() > Date.now()
                          ? new Date(extendingSubscription.expires_at).getTime()
                          : Date.now()) +
                          extensionDays * 24 * 60 * 60 * 1000,
                      ).toLocaleDateString('bn-BD')}
                    </span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    কতদিন মেয়াদ বাড়াবেন?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { days: 7, label: '+৭ দিন' },
                      { days: 15, label: '+১৫ দিন' },
                      { days: 30, label: '+৩০ দিন' },
                      { days: 90, label: '+৩ মাস' },
                      { days: 180, label: '+৬ মাস' },
                      { days: 365, label: '+১ বছর' },
                    ].map((item) => (
                      <button
                        key={item.days}
                        type="button"
                        onClick={() => setExtensionDays(item.days)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          extensionDays === item.days
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Number Input */}
                  <div className="relative mt-2">
                    <input
                      type="number"
                      min={1}
                      value={extensionDays}
                      onChange={(e) => setExtensionDays(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="কাস্টম দিন সংখ্যা লিখুন"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 uppercase">
                      Days
                    </span>
                  </div>
                </div>

                {/* Plan Upgrade Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    প্লানের নাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={extensionPlan}
                    onChange={(e) => setExtensionPlan(e.target.value)}
                    placeholder={extendingSubscription.plan_name || 'Pro Premium'}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={() => {
                    setShowExtendModal(false);
                    setExtendingSubscription(null);
                  }}
                  className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl transition-all active:scale-95 text-xs"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleExtendSubscription}
                  disabled={isSubmittingExtend || extensionDays <= 0}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingExtend ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>সেভ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>মেয়াদ নিশ্চিত করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. Send In-App Notification Modal ── */}
        {showNotifModal && notifTargetUser && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 uppercase tracking-widest text-white">
                    Direct Notification
                  </span>
                  <button
                    onClick={() => {
                      setShowNotifModal(false);
                      setNotifTargetUser(null);
                    }}
                    className="p-1 text-white/70 hover:text-white rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bell size={18} /> ইউজারকে নোটিফিকেশন পাঠান
                </h3>
                <p className="text-white/80 text-xs mt-0.5">
                  প্রাপক: {notifTargetUser.user?.name} ({notifTargetUser.user?.phone || notifTargetUser.user?.email})
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Template Presets */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    কুইক টেমপ্লেট
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifTitle('সাবস্ক্রিপশনের মেয়াদ শেষের সতর্কবার্তা ⏰');
                        setNotifMessage(`প্রিয় ${notifTargetUser.user?.name || 'শিক্ষার্থী'}, আপনার প্রিমিয়াম সাবস্ক্রিপশনের মেয়াদ শীঘ্রই শেষ হতে যাচ্ছে। নিরবচ্ছিন্ন অ্যাক্সেস পেতে এখনই রিনিউ করুন!`);
                        setNotifType('warning');
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100"
                    >
                      ⏰ মেয়াদ শেষের রিমাইন্ডার
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifTitle('বিশেষ রিনিউয়াল ছাড় অফার 🎁');
                        setNotifMessage(`প্রিয় ${notifTargetUser.user?.name || 'শিক্ষার্থী'}, আপনার জন্য বিশেষ ২০% ডিসকাউন্ট! কোড PRO20 ব্যবহার করে রিনিউ করুন।`);
                        setNotifType('success');
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100"
                    >
                      🎁 রিনিউয়াল অফার
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifTitle('অভ্যাস প্রিমিয়ামে আপনাকে স্বাগতম 🌟');
                        setNotifMessage(`প্রিয় ${notifTargetUser.user?.name || 'শিক্ষার্থী'}, অভ্যাস প্রো ব্যবহার করার জন্য ধন্যবাদ। কোনো সমস্যা হলে আমাদের জানান।`);
                        setNotifType('info');
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100"
                    >
                      🌟 শুভেচ্ছা বার্তা
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    নোটিফিকেশনের শিরোনাম
                  </label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="নোটিফিকেশন টাইটেল..."
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    মেসেজের বিবরণ
                  </label>
                  <textarea
                    rows={3}
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="ইউজারের কাছে প্রদর্শিত বার্তা লিখুন..."
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Type */}
                <div className="flex items-center gap-4">
                  <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    টাইপ:
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'info', label: 'তথ্য (Info)' },
                      { id: 'success', label: 'সাফল্য (Success)' },
                      { id: 'warning', label: 'সতর্কতা (Warning)' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNotifType(t.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          notifType === t.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={() => {
                    setShowNotifModal(false);
                    setNotifTargetUser(null);
                  }}
                  className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl transition-all active:scale-95 text-xs"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleSendNotification}
                  disabled={isSendingNotif || !notifTitle.trim() || !notifMessage.trim()}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 transition-all active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSendingNotif ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>নোটিফিকেশন পাঠান</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. Cancel / Revoke Subscription Modal ── */}
        {showCancelModal && cancellingSubscription && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-rose-600 to-rose-700 text-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 uppercase tracking-widest text-white">
                    Danger Action
                  </span>
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancellingSubscription(null);
                    }}
                    className="p-1 text-white/70 hover:text-white rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert size={18} /> সাবস্ক্রিপশন বাতিল করবেন?
                </h3>
                <p className="text-white/80 text-xs mt-0.5">
                  ইউজার: {cancellingSubscription.user?.name} ({cancellingSubscription.user?.phone || cancellingSubscription.user?.email})
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  ⚠️ <strong>সতর্কতা:</strong> সাবস্ক্রিপশন বাতিল করলে ব্যবহারকারীর অ্যাকাউন্ট সাথে সাথে Rookie/Free প্ল্যানে ডাউনগ্রেড হয়ে যাবে এবং সে আর প্রিমিয়াম কনটেন্ট অ্যাক্সেস করতে পারবে না।
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    বাতিল করার কারণ
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'পেমেন্ট রিফান্ড করা হয়েছে',
                      'ব্যবহারকারীর সরাসরি অনুরোধ',
                      'নিয়ম লঙ্ঘন বা অপব্যবহার',
                      'ভুল বা জাল ট্রানজেকশন',
                    ].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setCancelReason(reason)}
                        className={`p-2 text-left text-[11px] font-bold rounded-xl border transition-all ${
                          cancelReason === reason
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-600 dark:text-rose-300'
                            : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="অন্য কোনো কারণ থাকলে লিখুন..."
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 mt-2"
                  />
                </div>
              </div>

              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellingSubscription(null);
                  }}
                  className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl transition-all active:scale-95 text-xs"
                >
                  ফিরে যান
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling || !cancelReason.trim()}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/25 transition-all active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCancelling ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>বাতিল হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <UserMinus size={14} />
                      <span>হ্যাঁ, বাতিল নিশ্চিত করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
