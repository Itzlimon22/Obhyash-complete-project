import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  MapPin,
  Layers,
  GraduationCap,
  Crown,
  Trophy,
  Flame,
  BookOpen,
  Smartphone,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit,
  Key,
  Activity,
  Award,
  CreditCard,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { User as UserType } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { isUserPro } from '@/lib/subscription-utils';

interface DetailsModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (user: UserType) => void;
  onResetPassword?: (user: UserType) => void;
  onManageSubscription?: (user: UserType) => void;
  onViewActivityLog?: (user: UserType) => void;
}

type DetailTab = 'overview' | 'exams' | 'payments' | 'devices' | 'notes';

interface ExamHistoryItem {
  id: string;
  subject: string;
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

export default function DetailsModal({
  user,
  isOpen,
  onClose,
  onEdit,
  onResetPassword,
  onManageSubscription,
  onViewActivityLog,
}: DetailsModalProps) {
  const [userData, setUserData] = useState<UserType>(user);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [exams, setExams] = useState<ExamHistoryItem[]>([]);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [notes, setNotes] = useState<SupportNoteItem[]>([]);

  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  // New note input state
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Phone verification state
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [isAskingReverify, setIsAskingReverify] = useState(false);

  useEffect(() => {
    setUserData(user);
    if (isOpen && user?.id) {
      fetchAllDetails();
    }
  }, [isOpen, user?.id]);

  const fetchAllDetails = async () => {
    setIsLoadingExams(true);
    setIsLoadingDevices(true);
    setIsLoadingPayments(true);
    setIsLoadingNotes(true);

    try {
      const res = await fetch(`/api/admin/users/details?userId=${user.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.exams) setExams(json.data.exams);
        if (json.data.devices) setDevices(json.data.devices);
        if (json.data.payments) setPayments(json.data.payments);
        if (json.data.notes) setNotes(json.data.notes);
        if (json.data.user) {
          const u = json.data.user;
          setUserData((prev) => ({
            ...prev,
            ...u,
            student_id: u.student_id || prev.student_id,
            streakCount: u.streak ?? prev.streakCount,
            enrolledExams: u.exams_taken ?? prev.enrolledExams,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch user details:', err);
    } finally {
      setIsLoadingExams(false);
      setIsLoadingDevices(false);
      setIsLoadingPayments(false);
      setIsLoadingNotes(false);
    }
  };

  const fetchNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const res = await fetch(`/api/admin/users/details?userId=${user.id}`);
      const json = await res.json();
      if (json.success && json.data?.notes) {
        setNotes(json.data.notes);
      }
    } catch (_) {}
    setIsLoadingNotes(false);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await fetch('/api/admin/users/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_admin_note',
          userId: user.id,
          note: newNote.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to add note');

      toast.success('Internal note added successfully');
      setNewNote('');
      fetchNotes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleManualVerifyPhone = async () => {
    if (!userData.phone) {
      toast.error('User does not have a phone number');
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

      setUserData((prev: any) => ({
        ...prev,
        is_phone_verified: true,
        requires_phone_verification: false,
      }));
      toast.success(`Phone ${userData.phone} marked as verified by Admin`);
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleAskPhoneReverification = async () => {
    if (!confirm('Are you sure you want to request this student to re-verify / update their phone number?')) {
      return;
    }

    setIsAskingReverify(true);
    try {
      const res = await fetch('/api/admin/users/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ask_phone_reverification',
          userId: userData.id,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to send re-verification request');

      setUserData((prev: any) => ({
        ...prev,
        is_phone_verified: false,
        requires_phone_verification: true,
      }));
      toast.success('Re-verification request sent to student successfully');
    } catch (err: any) {
      toast.error(err.message || 'Request failed');
    } finally {
      setIsAskingReverify(false);
    }
  };

  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isAskingEmailReverify, setIsAskingEmailReverify] = useState(false);

  const handleManualVerifyEmail = async () => {
    if (!userData.email) {
      toast.error('User does not have an email address');
      return;
    }

    setIsVerifyingEmail(true);
    try {
      const res = await fetch('/api/admin/users/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_email_manually',
          userId: userData.id,
          userEmail: userData.email,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to verify email');

      setUserData((prev: any) => ({
        ...prev,
        is_email_verified: true,
        requires_email_verification: false,
      }));
      toast.success(`Email ${userData.email} marked as verified by Admin`);
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleAskEmailReverification = async () => {
    if (!confirm('Are you sure you want to request this student to re-verify / update their email address?')) {
      return;
    }

    setIsAskingEmailReverify(true);
    try {
      const res = await fetch('/api/admin/users/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ask_email_reverification',
          userId: userData.id,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to send email re-verification request');

      setUserData((prev: any) => ({
        ...prev,
        is_email_verified: false,
        requires_email_verification: true,
      }));
      toast.success('Email re-verification request sent to student successfully');
    } catch (err: any) {
      toast.error(err.message || 'Request failed');
    } finally {
      setIsAskingEmailReverify(false);
    }
  };

  if (!isOpen) return null;

  const isPro = isUserPro(userData);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white font-bold text-xl shadow-inner">
              {userData.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {userData.name || 'Unnamed User'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 text-white border border-white/30">
                  {userData.student_id || `OBH-${userData.id.replace(/-/g, '').slice(0, 5).toUpperCase()}`}
                </span>
                {isPro && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-neutral-900 shadow-sm">
                    <Crown size={12} />
                    {userData.subscription?.plan}
                  </span>
                )}
              </div>
              <p className="text-emerald-100 text-xs mt-0.5 flex items-center gap-2">
                <span>{userData.email || 'No email'}</span>
                {userData.phone && (
                  <>
                    <span>•</span>
                    <span>{userData.phone}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 px-4 pt-2 gap-1 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-800 shadow-sm'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
            }`}
          >
            <User size={15} />
            <span>Profile & Academic</span>
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'exams'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-800 shadow-sm'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
            }`}
          >
            <BookOpen size={15} />
            <span>Exams & Results ({exams.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-800 shadow-sm'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
            }`}
          >
            <CreditCard size={15} />
            <span>Payments & Trx ({payments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'devices'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-800 shadow-sm'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
            }`}
          >
            <Smartphone size={15} />
            <span>Devices ({devices.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'notes'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-800 shadow-sm'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
            }`}
          >
            <FileText size={15} />
            <span>Support Notes ({notes.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Quick KPI Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
                  <p className="text-[10px] font-bold uppercase text-neutral-500">Role</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                    {userData.role}
                  </p>
                </div>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
                  <p className="text-[10px] font-bold uppercase text-neutral-500">Status</p>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-bold rounded-md mt-0.5 ${
                      userData.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400'
                    }`}
                  >
                    {userData.status}
                  </span>
                </div>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
                  <p className="text-[10px] font-bold uppercase text-neutral-500">XP Points</p>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                    <Trophy size={13} />
                    {(userData.xp || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
                  <p className="text-[10px] font-bold uppercase text-neutral-500">Streak</p>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-0.5 flex items-center justify-center gap-1">
                    <Flame size={13} />
                    {userData.streakCount || 0} Days
                  </p>
                </div>
              </div>

              {/* Email Verification Support Banner */}
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                    <Mail size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-neutral-900 dark:text-white">
                        Email: {userData.email || 'Not provided'}
                      </p>
                      {userData.requires_email_verification ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                          Re-verification Pending
                        </span>
                      ) : userData.is_email_verified ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                          Verified
                        </span>
                      ) : userData.email ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                          Unverified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-200 dark:bg-zinc-700 text-neutral-600 dark:text-zinc-300">
                          No Email
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Admin direct email verification & user re-verification request controls
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {userData.email && (
                    <button
                      type="button"
                      onClick={handleManualVerifyEmail}
                      disabled={isVerifyingEmail}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                      title="Directly verify user's email address"
                    >
                      <CheckCircle2 size={13} />
                      <span>{isVerifyingEmail ? 'Verifying...' : 'Verify Email'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleAskEmailReverification}
                    disabled={isAskingEmailReverify}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                    title="Send a request to user to re-verify/edit their email"
                  >
                    <AlertCircle size={13} />
                    <span>{isAskingEmailReverify ? 'Sending...' : 'Ask Re-verify'}</span>
                  </button>
                </div>
              </div>

              {/* Phone Verification Support Banner */}
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Phone size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-neutral-900 dark:text-white">
                        Phone: {userData.phone || 'Not provided'}
                      </p>
                      {userData.requires_phone_verification ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                          Re-verification Pending
                        </span>
                      ) : (userData.is_phone_verified || userData.phone) ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-200 dark:bg-zinc-700 text-neutral-600 dark:text-zinc-300">
                          No Phone
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Admin direct verification & user re-verification request controls
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {userData.phone && (
                    <button
                      type="button"
                      onClick={handleManualVerifyPhone}
                      disabled={isVerifyingPhone}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                      title="Directly verify user's phone number"
                    >
                      <CheckCircle2 size={13} />
                      <span>{isVerifyingPhone ? 'Verifying...' : 'Verify Number'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleAskPhoneReverification}
                    disabled={isAskingReverify}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                    title="Send a request to user to re-verify/edit their number"
                  >
                    <AlertCircle size={13} />
                    <span>{isAskingReverify ? 'Sending...' : 'Ask Re-verify'}</span>
                  </button>
                </div>
              </div>

              {/* Academic & Track Card */}
              <div className="p-4 bg-white dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-emerald-500" />
                  Academic Profile
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Institute:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {userData.institute || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Academic Batch:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {userData.batch || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Division / Group:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {userData.division || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Stream & Target:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {userData.stream || 'N/A'} {userData.target ? `(${userData.target})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* SSC Record Card */}
              <div className="p-4 bg-white dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Award size={15} className="text-blue-500" />
                  SSC Credentials
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2.5 gap-x-4 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Roll:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white font-mono">
                      {userData.ssc_roll || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Registration:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white font-mono">
                      {userData.ssc_reg || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Board:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {userData.ssc_board || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Passing Year:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {userData.ssc_passing_year || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal & Subscription Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2.5 text-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <MapPin size={15} className="text-red-500" />
                    Personal Details
                  </h3>
                  <div>
                    <span className="text-neutral-500 block">Gender / DOB:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {userData.gender || 'N/A'} {userData.dob ? `(${userData.dob})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Address:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {userData.address || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Joined Date:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {new Date(userData.lastActive).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2.5 text-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Crown size={15} className="text-amber-500" />
                    Subscription Status
                  </h3>
                  <div>
                    <span className="text-neutral-500 block">Current Plan:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {userData.subscription?.plan || 'Free'} Plan
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Status:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {userData.subscription?.status || 'Active'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Expiry Date:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white font-mono">
                      {userData.subscription?.expiry
                        ? new Date(userData.subscription.expiry).toLocaleDateString()
                        : 'No Expiry'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RECENT EXAMS */}
          {activeTab === 'exams' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {isLoadingExams ? (
                <div className="text-center py-12 text-xs text-neutral-500">
                  Loading exam records...
                </div>
              ) : exams.length === 0 ? (
                <div className="text-center py-12 text-xs text-neutral-500">
                  No exam records found for this student.
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                  {exams.map((exam) => {
                    const percentage =
                      exam.total_marks > 0
                        ? Math.round((exam.score / exam.total_marks) * 100)
                        : 0;
                    return (
                      <div
                        key={exam.id}
                        className="p-3.5 flex items-center justify-between bg-white dark:bg-neutral-850 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-xs"
                      >
                        <div>
                          <p className="font-bold text-neutral-900 dark:text-white">
                            {exam.subject || 'Practice Exam'}
                          </p>
                          <p className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-2">
                            <span>{new Date(exam.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              ✓ {exam.correct_count} correct
                            </span>
                            <span className="text-red-500">✗ {exam.wrong_count} wrong</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-neutral-900 dark:text-white font-mono">
                            {exam.score} / {exam.total_marks}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              percentage >= 80
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                                : percentage >= 50
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400'
                            }`}
                          >
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAYMENTS & PURCHASES */}
          {activeTab === 'payments' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {isLoadingPayments ? (
                <div className="text-center py-12 text-xs text-neutral-500">
                  Loading payment history...
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12 text-xs text-neutral-500">
                  No payment or subscription transactions recorded for this user.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-800 shadow-sm text-amber-600 dark:text-amber-400">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-neutral-900 dark:text-white">
                              {p.plan_name || 'Premium Plan'}
                            </p>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
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
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            TrxID: <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">{p.trx_id || 'N/A'}</span> • {p.payment_method || 'bKash'} {p.sender_number ? `(${p.sender_number})` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-sm text-neutral-900 dark:text-white">
                          ৳{p.amount || 0}
                        </p>
                        <p className="text-[10px] text-neutral-500">
                          {p.requested_at ? new Date(p.requested_at).toLocaleDateString() : ''}
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
              {isLoadingDevices ? (
                <div className="text-center py-12 text-xs text-neutral-500">
                  Loading registered devices...
                </div>
              ) : devices.length === 0 ? (
                <div className="text-center py-12 text-xs text-neutral-500">
                  No active registered devices recorded.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-800 shadow-sm text-emerald-600 dark:text-emerald-400">
                          <Smartphone size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 dark:text-white">
                            {device.device_name || 'Mobile / Web Device'}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            IP: {device.ip_address || 'Hidden'} • {device.device_type || 'Device'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-neutral-500">
                        <span>Last Active: </span>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          {device.last_active
                            ? new Date(device.last_active).toLocaleString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: INTERNAL SUPPORT NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Add Internal Support Note (Visible to Admins Only)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="e.g. Student contacted support regarding coupon code..."
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNote || !newNote.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    {isSubmittingNote ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}
                    Save Note
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                  Historical Notes ({notes.length})
                </p>
                {isLoadingNotes ? (
                  <div className="text-center py-8 text-xs text-neutral-500">
                    Loading support notes...
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutral-500">
                    No internal support notes logged for this user yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {notes.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-neutral-500">
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                            Support Agent: {n.metadata?.performed_by_admin || 'Admin'}
                          </span>
                          <span>{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
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

        {/* Footer Quick Action Toolbar */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(userData);
                }}
                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition-colors"
              >
                <Edit size={13} />
                Edit Profile
              </button>
            )}
            {onResetPassword && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onResetPassword(userData);
                }}
                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition-colors"
              >
                <Key size={13} />
                Security & Pass
              </button>
            )}
            {onManageSubscription && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onManageSubscription(userData);
                }}
                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition-colors"
              >
                <Crown size={13} />
                Subscription
              </button>
            )}
            {onViewActivityLog && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewActivityLog(userData);
                }}
                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition-colors"
              >
                <Activity size={13} />
                Activity Log
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-xl transition-colors ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
