'use client';

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  RefreshCw,
  Search,
  Filter,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Phone,
  MessageCircle,
  FileText,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/utils/export-csv';

interface SupportTicket {
  id: string;
  name: string;
  contact_info: string;
  issue_type: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Dismissed';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export function LoginSupportTicketsView() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [page, setPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const pageSize = 20;

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    dismissed: 0,
  });

  const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, statusFilter, searchQuery]);

  const fetchTickets = async (showToast = false) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/support-tickets?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setTickets(json.data || []);
        setTotalTickets(json.pagination?.total || 0);
        if (json.stats) setStats(json.stats);
        if (showToast) toast.success('সাপোর্ট টিকিট তালিকা আপডেট হয়েছে');
      } else {
        toast.error(json.error || 'টিকিট লোড করা যায়নি');
      }
    } catch (err) {
      console.error(err);
      toast.error('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/support-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`স্ট্যাটাস '${newStatus}' এ পরিবর্তন করা হয়েছে`);
        fetchTickets();
      } else {
        toast.error(data.error || 'আপডেট করা যায়নি');
      }
    } catch (e) {
      toast.error('সমস্যা হয়েছে');
    }
  };

  const handleSaveNotes = async () => {
    if (!editingTicket) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/support-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTicket.id, adminNotes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('নোট সেভ করা হয়েছে');
        setEditingTicket(null);
        fetchTickets();
      } else {
        toast.error(data.error || 'নোট সেভ করা যায়নি');
      }
    } catch (e) {
      toast.error('সমস্যা হয়েছে');
    } finally {
      setIsUpdating(false);
    }
  };

  const exportCSV = () => {
    if (tickets.length === 0) {
      toast.error('এক্সপোর্ট করার মতো কোনো ডেটা নেই');
      return;
    }

    exportToCSV({
      filename: `login_support_tickets_${new Date().toISOString().split('T')[0]}.csv`,
      headers: [
        'Ticket ID',
        'Student Name',
        'Contact Info',
        'Issue Type',
        'Problem Description',
        'Status',
        'Admin Notes',
        'Submitted Time',
      ],
      rows: tickets.map((t) => [
        t.id,
        t.name,
        t.contact_info,
        t.issue_type,
        t.description,
        t.status,
        t.admin_notes || '',
        new Date(t.created_at).toLocaleString('en-GB'),
      ]),
    });
    toast.success('সাপোর্ট টিকিট এক্সপোর্ট সম্পন্ন হয়েছে');
  };

  const cleanPhone = (contact: string) => {
    const digits = contact.replace(/\D/g, '');
    if (digits.startsWith('8801')) return digits;
    if (digits.startsWith('01')) return `88${digits}`;
    if (digits.startsWith('1') && digits.length === 10) return `880${digits}`;
    return digits;
  };

  return (
    <div className="space-y-5">
      {/* Top Stats Cards & Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Quick Stats Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
              <Clock size={14} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-600/80 uppercase">Pending</p>
              <p className="text-sm font-black text-amber-600 dark:text-amber-400">{stats.pending}</p>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <RefreshCw size={14} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-600/80 uppercase">In Progress</p>
              <p className="text-sm font-black text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={14} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600/80 uppercase">Resolved</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{stats.resolved}</p>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
              <HelpCircle size={14} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Total</p>
              <p className="text-sm font-black text-zinc-800 dark:text-zinc-200">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={exportCSV}
            className="p-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Export CSV"
          >
            <Download size={14} />
            <span>Export</span>
          </button>
          <button
            onClick={() => fetchTickets(true)}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input
            type="text"
            placeholder="নাম, মোবাইল নম্বর, ইমেইল বা সমস্যা লিখে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-xs md:text-sm font-medium"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-xs md:text-sm font-medium cursor-pointer"
          >
            <option value="All">সকল স্ট্যাটাস (All)</option>
            <option value="Pending">Pending (অপেক্ষমান)</option>
            <option value="In Progress">In Progress (প্রক্রিয়াধীন)</option>
            <option value="Resolved">Resolved (সমাধান হয়েছে)</option>
            <option value="Dismissed">Dismissed (বাতিল)</option>
          </select>
        </div>
      </div>

      {/* Listing Content */}
      {isLoading ? (
        <div className="h-[320px] flex flex-col items-center justify-center gap-3 text-neutral-500">
          <Loader2 size={36} className="animate-spin text-[#006A4E]" />
          <p className="font-semibold text-sm">সাপোর্ট টিকিট লোড হচ্ছে...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="h-[280px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl flex flex-col items-center justify-center text-center p-8 space-y-3">
          <div className="w-14 h-14 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400">
            <CheckCircle2 size={28} />
          </div>
          <h4 className="text-base font-bold text-neutral-900 dark:text-white">কোনো সাপোর্ট টিকিট পাওয়া যায়নি</h4>
          <p className="text-xs text-neutral-500 max-w-sm">বর্তমানে কোনো পেন্ডিং লগইন সাপোর্ট অনুরোধ নেই।</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const rawPhone = cleanPhone(t.contact_info);
            const isPhone = /^\d{10,13}$/.test(rawPhone);
            const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(
              `হ্যালো ${t.name}, অভ্যাশ সাপোর্ট থেকে মেসেজ দেওয়া হয়েছে। আপনার লগইন সমস্যা: "${t.issue_type}" সংক্রান্ত বিষয়ে কীভাবে সহায়তা করতে পারি?`,
            )}`;

            return (
              <div
                key={t.id}
                className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                      {t.name}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-[#006A4E] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {t.issue_type}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'Pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          : t.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                          : t.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-medium">
                    {t.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-neutral-400">
                    <span className="font-mono text-neutral-600 dark:text-neutral-300">
                      যোগাযোগ: <strong>{t.contact_info}</strong>
                    </span>
                    <span>•</span>
                    <span>{new Date(t.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    {t.admin_notes && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 italic">নোট: {t.admin_notes}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
                  {/* WhatsApp Quick Action */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-bold transition-all border border-[#25D366]/30"
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </a>

                  {/* Phone Call (if mobile number) */}
                  {isPhone && (
                    <a
                      href={`tel:${t.contact_info}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all border border-blue-200 dark:border-blue-800"
                    >
                      <Phone size={14} />
                      <span>Call</span>
                    </a>
                  )}

                  {/* Status Dropdown */}
                  <select
                    value={t.status}
                    onChange={(e) => handleStatusChange(t.id, e.target.value)}
                    className="px-2.5 py-2 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Dismissed">Dismissed</option>
                  </select>

                  {/* Add Notes Button */}
                  <button
                    onClick={() => {
                      setEditingTicket(t);
                      setAdminNotes(t.admin_notes || '');
                    }}
                    className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    title="নোট লিখুন"
                  >
                    <FileText size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Notes Modal */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              অ্যাডমিন নোট: {editingTicket.name}
            </h3>
            <p className="text-xs text-neutral-500">
              এই টিকিটটির সমাধান বা যোগাযোগের অগ্রগতি সম্পর্কে নোট রাখুন।
            </p>
            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="উদাহরণ: শিক্ষার্থীকে ফোন করে পাসওয়ার্ড রিসেট লিংক বুঝিয়ে দেওয়া হয়েছে..."
              className="w-full p-3 text-sm rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:border-[#006A4E] text-neutral-900 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTicket(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isUpdating}
                className="px-5 py-2 text-xs font-bold bg-[#006A4E] hover:bg-[#005a42] text-white rounded-xl shadow-xs"
              >
                {isUpdating ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
