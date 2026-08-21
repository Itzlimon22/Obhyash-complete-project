'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  MapPin,
  GraduationCap,
  Crown,
  Trophy,
  Flame,
  BookOpen,
  Smartphone,
  CheckCircle2,
  Clock,
  Edit,
  Key,
  Activity,
  Award,
  CreditCard,
  FileText,
  Send,
  Trash2,
  Ban,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { User as UserType } from '@/lib/types';
import { toast } from 'sonner';
import EditUserModal from '@/components/admin/user-management/EditUserModal';
import ResetPasswordModal from '@/components/admin/user-management/ResetPasswordModal';
import ManageSubscriptionModal from '@/components/admin/user-management/ManageSubscriptionModal';
import SuspendUserModal from '@/components/admin/user-management/SuspendUserModal';
import { createClient } from '@/utils/supabase/client';

type DetailTab = 'overview' | 'exams' | 'payments' | 'devices' | 'notes';

interface ExamItem {
  id: string;
  subject: string;
  exam_type?: string;
  score: number;
  total_marks: number;
  correct_count: number;
  wrong_count: number;
  date: string;
  time_taken?: number;
}

interface DeviceItem {
  id: string;
  device_name: string;
  device_type: string;
  ip_address: string;
  last_active: string;
}

interface PaymentItem {
  id: string;
  plan_name: string;
  amount: number;
  payment_method: string;
  trx_id: string;
  sender_number: string;
  status: string;
  requested_at: string;
}

interface SupportNoteItem {
  id: string;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export default function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [userData, setUserData] = useState<UserType | null>(null);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [notes, setNotes] = useState<SupportNoteItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form & Action states
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/admin/users/details?userId=${userId}`, {
        headers,
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch user details');
      }

      if (json.data) {
        if (json.data.user) {
          const raw = json.data.user;
          const mapped: UserType = {
            id: raw.id,
            name: raw.name || 'Unnamed User',
            email: raw.email || '',
            phone: raw.phone || '',
            role: (raw.role || 'Student') as any,
            status: (raw.status || 'Active') as any,
            lastActive: raw.last_active || raw.created_at || new Date().toISOString(),
            institute: raw.institute || 'N/A',
            enrolledExams: raw.exams_taken || 0,
            xp: raw.xp || 0,
            streakCount: raw.streak || 0,
            batch: raw.batch || raw.academic_batch || 'N/A',
            division: raw.division || raw.academic_group || 'N/A',
            stream: raw.stream || 'N/A',
            target: raw.target || '',
            gender: raw.gender || 'N/A',
            dob: raw.dob || '',
            address: raw.address || 'N/A',
            ssc_roll: raw.ssc_roll || '',
            ssc_reg: raw.ssc_reg || '',
            ssc_board: raw.ssc_board || '',
            ssc_passing_year: raw.ssc_passing_year || '',
            student_id: raw.student_id || `OBH-${raw.id.replace(/-/g, '').slice(0, 5).toUpperCase()}`,
            recentExams: [],
            subscription: raw.subscription && typeof raw.subscription === 'object'
              ? raw.subscription
              : {
                  plan: raw.plan || (raw.is_subscribed ? 'Pro' : 'Free'),
                  status: raw.is_subscribed ? 'Active' : 'Inactive',
                  expiry: raw.subscription_expires_at || '',
                },
          };
          setUserData(mapped);
        }

        if (json.data.exams) setExams(json.data.exams);
        if (json.data.devices) setDevices(json.data.devices);
        if (json.data.payments) setPayments(json.data.payments);
        if (json.data.notes) setNotes(json.data.notes);
      }
    } catch (err: any) {
      console.error('User fetch error:', err);
      toast.error(err.message || 'User not found or database error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied ${field} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleManualVerifyPhone = async () => {
    if (!userData?.phone) {
      toast.error('User has no phone number on record');
      return;
    }

    setIsVerifyingPhone(true);
    try {
      const res = await fetch('/api/admin/users/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_phone_manually',
          userId: userData.id,
          userPhone: userData.phone,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to verify phone');

      toast.success(`Phone ${userData.phone} marked as verified`);
      fetchUserData(true);
    } catch (err: any) {
      toast.error(err.message || 'Phone verification failed');
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleRevokeSessions = async () => {
    if (!confirm('Are you sure you want to log this user out from all active devices?')) {
      return;
    }

    setIsRevokingSessions(true);
    try {
      const res = await fetch('/api/admin/users/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_sessions',
          userId: userData?.id,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to revoke sessions');

      toast.success('All active device sessions revoked');
      fetchUserData(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke sessions');
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !userData) return;

    setIsSubmittingNote(true);
    try {
      const res = await fetch('/api/admin/users/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_admin_note',
          userId: userData.id,
          note: newNote.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to add note');

      toast.success('Internal support note saved');
      setNewNote('');
      fetchUserData(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 md:p-10 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          Loading user profile & records...
        </p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 md:p-10 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
          User Not Found
        </h2>
        <p className="text-sm text-neutral-500 max-w-md">
          The requested user ID does not exist or may have been permanently deleted from the database.
        </p>
        <Link
          href="/admin/user-management"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <ArrowLeft size={14} />
          Back to User Management
        </Link>
      </div>
    );
  }

  const isPro = userData.subscription?.plan && userData.subscription.plan !== 'Free';

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      {/* ── Breadcrumb & Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/user-management"
            className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
            title="Back to Users List"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              <Link href="/admin/dashboard" className="hover:underline">Admin</Link>
              <span>/</span>
              <Link href="/admin/user-management" className="hover:underline">User Management</Link>
              <span>/</span>
              <span className="text-neutral-900 dark:text-neutral-200 font-semibold">{userData.name}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5 mt-0.5">
              <span>{userData.name}</span>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                {userData.student_id}
              </span>
            </h1>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchUserData(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            title="Refresh User Data"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            className="px-3.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Edit size={14} />
            Edit Profile
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="px-3.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Key size={14} />
            Security & Pass
          </button>

          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Crown size={14} />
            Subscription
          </button>

          <button
            onClick={() => setShowSuspendModal(true)}
            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-700 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Ban size={14} />
            {userData.status === 'Active' ? 'Suspend' : 'Manage Status'}
          </button>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN: Sticky User Summary Card ── */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 space-y-6">
            
            {/* User Avatar & Header */}
            <div className="text-center space-y-3 pb-6 border-b border-neutral-200 dark:border-neutral-800">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-emerald-500/20 mx-auto">
                  {userData.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                {isPro && (
                  <div className="absolute -bottom-1 -right-1 p-1.5 bg-amber-400 text-neutral-900 rounded-xl shadow-md" title="Premium Subscriber">
                    <Crown size={16} />
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {userData.name}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5">
                    {userData.student_id}
                    <button
                      onClick={() => handleCopy(userData.student_id || '', 'Student ID')}
                      className="hover:text-emerald-600 transition-colors"
                      title="Copy Student ID"
                    >
                      {copiedField === 'Student ID' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    </button>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      userData.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400'
                    }`}
                  >
                    {userData.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Details with 1-Click Copy */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 text-neutral-500 shadow-xs">
                    <Mail size={14} />
                  </div>
                  <div className="truncate">
                    <p className="text-[10px] text-neutral-400 uppercase font-bold">Email</p>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {userData.email || 'No email provided'}
                    </p>
                  </div>
                </div>
                {userData.email && (
                  <button
                    onClick={() => handleCopy(userData.email || '', 'Email')}
                    className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-400"
                    title="Copy Email"
                  >
                    {copiedField === 'Email' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 text-neutral-500 shadow-xs">
                    <Phone size={14} />
                  </div>
                  <div className="truncate">
                    <p className="text-[10px] text-neutral-400 uppercase font-bold">Phone</p>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {userData.phone || 'No phone provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {userData.phone && (
                    <button
                      onClick={() => handleCopy(userData.phone || '', 'Phone')}
                      className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-400"
                      title="Copy Phone"
                    >
                      {copiedField === 'Phone' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  )}
                  {userData.phone && (
                    <button
                      onClick={handleManualVerifyPhone}
                      disabled={isVerifyingPhone}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                      title="Verify Phone Manually"
                    >
                      <CheckCircle2 size={11} />
                      <span>{isVerifyingPhone ? '...' : 'Verify'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick KPI Stats Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
                <p className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">XP Points</p>
                <p className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                  <Trophy size={15} />
                  {(userData.xp || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
                <p className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">Streak</p>
                <p className="text-base font-black text-red-600 dark:text-red-400 mt-0.5 flex items-center justify-center gap-1">
                  <Flame size={15} />
                  {userData.streakCount || 0} Days
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
                <p className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">Exams Taken</p>
                <p className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5 flex items-center justify-center gap-1">
                  <BookOpen size={15} />
                  {exams.length > 0 ? exams.length : userData.enrolledExams || 0}
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
                <p className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">Plan</p>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                  <Crown size={15} />
                  {userData.subscription?.plan || 'Free'}
                </p>
              </div>
            </div>

            {/* Quick Summary Metadata */}
            <div className="p-4 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/30 border border-neutral-200/60 dark:border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Account Role:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">{userData.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Joined Date:</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {new Date(userData.lastActive).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Subscription Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {userData.subscription?.status || 'Active'}
                </span>
              </div>
              {userData.subscription?.expiry && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subscription Expiry:</span>
                  <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                    {new Date(userData.subscription.expiry).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── RIGHT COLUMN: Detailed Tab Navigation & Panels ── */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
            
            {/* Tab Bar */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 px-4 pt-2 gap-1 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-900 shadow-xs'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                }`}
              >
                <GraduationCap size={16} />
                <span>Profile & Academic</span>
              </button>

              <button
                onClick={() => setActiveTab('exams')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'exams'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-900 shadow-xs'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                }`}
              >
                <BookOpen size={16} />
                <span>Exams & Results ({exams.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'payments'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-900 shadow-xs'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                }`}
              >
                <CreditCard size={16} />
                <span>Payments & Trx ({payments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('devices')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'devices'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-900 shadow-xs'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                }`}
              >
                <Smartphone size={16} />
                <span>Devices ({devices.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'notes'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-900 shadow-xs'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                }`}
              >
                <FileText size={16} />
                <span>Support Notes ({notes.length})</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6">
              
              {/* TAB 1: ACADEMIC & PROFILE */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Academic Profile Card */}
                  <div className="p-5 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <GraduationCap size={16} />
                      Academic Profile & Target
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200/60 dark:border-neutral-750">
                        <span className="text-neutral-500 block text-[11px]">Institute:</span>
                        <span className="font-bold text-neutral-900 dark:text-white text-sm mt-0.5 block">
                          {userData.institute || 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200/60 dark:border-neutral-750">
                        <span className="text-neutral-500 block text-[11px]">Academic Batch:</span>
                        <span className="font-bold text-neutral-900 dark:text-white text-sm mt-0.5 block">
                          {userData.batch || 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200/60 dark:border-neutral-750">
                        <span className="text-neutral-500 block text-[11px]">Division / Group:</span>
                        <span className="font-bold text-neutral-900 dark:text-white text-sm mt-0.5 block">
                          {userData.division || 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200/60 dark:border-neutral-750">
                        <span className="text-neutral-500 block text-[11px]">Stream & Target:</span>
                        <span className="font-bold text-neutral-900 dark:text-white text-sm mt-0.5 block">
                          {userData.stream || 'N/A'} {userData.target ? `(${userData.target})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SSC Credentials Card */}
                  <div className="p-5 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <Award size={16} />
                      SSC / Board Credentials
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200/60 dark:border-neutral-750">
                        <span className="text-neutral-500 block text-[11px]">Roll:</span>
                        <span className="font-bold font-mono text-neutral-900 dark:text-white mt-0.5 block">
                          {userData.ssc_roll || 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200/60 dark:border-neutral-750">
                        <span className="text-neutral-500 block text-[11px]">Registration:</span>
                        <span className="font-bold font-mono text-neutral-900 dark:text-white mt-0.5 block">
                          {userData.ssc_reg || 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200/60 dark:border-neutral-750">
                        <span className="text-neutral-500 block text-[11px]">Board:</span>
                        <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                          {userData.ssc_board || 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200/60 dark:border-neutral-750">
                        <span className="text-neutral-500 block text-[11px]">Passing Year:</span>
                        <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                          {userData.ssc_passing_year || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Personal Details */}
                  <div className="p-5 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-2">
                      <MapPin size={16} />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200/60 dark:border-neutral-750">
                        <span className="text-neutral-500 block text-[11px]">Gender & Date of Birth:</span>
                        <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                          {userData.gender || 'N/A'} {userData.dob ? `• ${userData.dob}` : ''}
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200/60 dark:border-neutral-750">
                        <span className="text-neutral-500 block text-[11px]">Address:</span>
                        <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                          {userData.address || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EXAMS & RESULTS */}
              {activeTab === 'exams' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {exams.length === 0 ? (
                    <div className="text-center py-16 space-y-2">
                      <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 inline-block">
                        <BookOpen size={24} />
                      </div>
                      <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        No Exams Found
                      </p>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                        This student has not participated in any live or practice exams yet.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800">
                      {exams.map((exam) => {
                        const pct = exam.total_marks > 0 ? Math.round((exam.score / exam.total_marks) * 100) : 0;
                        return (
                          <div
                            key={exam.id}
                            className="p-4 bg-white dark:bg-neutral-850 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-between text-xs gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-neutral-900 dark:text-white">
                                  {exam.subject}
                                </span>
                                {exam.exam_type && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                    {exam.exam_type}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-500 flex items-center gap-2">
                                <span>{new Date(exam.date).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  ✓ {exam.correct_count} correct
                                </span>
                                <span>•</span>
                                <span className="text-red-500 font-semibold">
                                  ✗ {exam.wrong_count} wrong
                                </span>
                                {exam.time_taken ? (
                                  <>
                                    <span>•</span>
                                    <span>⏱️ {Math.round(exam.time_taken / 60)} min</span>
                                  </>
                                ) : null}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                                {exam.score} / {exam.total_marks}
                              </p>
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                                  pct >= 80
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                                    : pct >= 50
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                                      : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400'
                                }`}
                              >
                                {pct}% Accuracy
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PAYMENTS & BILLING */}
              {activeTab === 'payments' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {payments.length === 0 ? (
                    <div className="text-center py-16 space-y-2">
                      <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 inline-block">
                        <CreditCard size={24} />
                      </div>
                      <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        No Transactions Recorded
                      </p>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                        This user does not have any manual or automatic payment requests logged.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payments.map((p) => (
                        <div
                          key={p.id}
                          className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 shadow-xs text-amber-600 dark:text-amber-400">
                              <CreditCard size={20} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-neutral-900 dark:text-white text-sm">
                                  {p.plan_name}
                                </p>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    p.status === 'Approved'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                                      : p.status === 'Pending'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400'
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-500 flex items-center gap-2">
                                <span>TrxID:</span>
                                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                  {p.trx_id}
                                </span>
                                <span>•</span>
                                <span>{p.payment_method} {p.sender_number ? `(${p.sender_number})` : ''}</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="font-black text-base text-neutral-900 dark:text-white">
                              ৳{p.amount}
                            </p>
                            <p className="text-[10px] text-neutral-500 mt-0.5">
                              {new Date(p.requested_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DEVICES & SESSIONS */}
              {activeTab === 'devices' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Registered Devices ({devices.length})
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Active login sessions and browser instances
                      </p>
                    </div>
                    {devices.length > 0 && (
                      <button
                        onClick={handleRevokeSessions}
                        disabled={isRevokingSessions}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Ban size={13} />
                        <span>{isRevokingSessions ? 'Revoking...' : 'Force Logout All'}</span>
                      </button>
                    )}
                  </div>

                  {devices.length === 0 ? (
                    <div className="text-center py-16 space-y-2">
                      <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 inline-block">
                        <Smartphone size={24} />
                      </div>
                      <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        No Active Devices
                      </p>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                        No registered device sessions currently recorded for this user.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {devices.map((device) => (
                        <div
                          key={device.id}
                          className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 shadow-xs text-emerald-600 dark:text-emerald-400">
                              <Smartphone size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-neutral-900 dark:text-white text-sm">
                                {device.device_name}
                              </p>
                              <p className="text-[11px] text-neutral-500 mt-0.5">
                                Type: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{device.device_type}</span> • IP: <span className="font-mono">{device.ip_address}</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right text-[11px] text-neutral-500 shrink-0">
                            <span>Last Active: </span>
                            <span className="font-bold text-neutral-800 dark:text-neutral-200 block mt-0.5">
                              {new Date(device.last_active).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: SUPPORT NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      Add Internal Admin Support Note
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="e.g. Student contacted support regarding coupon code or batch transfer..."
                        className="flex-1 px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingNote || !newNote.trim()}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 shrink-0"
                      >
                        {isSubmittingNote ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                        Save Note
                      </button>
                    </div>
                  </form>

                  {/* Notes Timeline List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Historical Notes & Logs ({notes.length})
                    </h4>

                    {notes.length === 0 ? (
                      <div className="text-center py-12 text-xs text-neutral-500">
                        No support notes or internal logs logged for this user yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notes.map((n) => (
                          <div
                            key={n.id}
                            className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px] text-neutral-500">
                              <span className="font-bold text-neutral-700 dark:text-neutral-300">
                                Support Agent: {n.metadata?.performed_by_admin || 'Admin'}
                              </span>
                              <span>{new Date(n.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium text-xs">
                              {n.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      {showEditModal && userData && (
        <EditUserModal
          user={userData}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchUserData(true);
          }}
        />
      )}

      {showResetModal && userData && (
        <ResetPasswordModal
          user={userData}
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
        />
      )}

      {showSubscriptionModal && userData && (
        <ManageSubscriptionModal
          user={userData}
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          onUpdate={() => fetchUserData(true)}
        />
      )}

      {showSuspendModal && userData && (
        <SuspendUserModal
          user={userData}
          isOpen={showSuspendModal}
          onClose={() => setShowSuspendModal(false)}
          onSuccess={() => fetchUserData(true)}
        />
      )}
    </div>
  );
}
