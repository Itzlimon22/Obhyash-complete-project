'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  Search,
  RefreshCw,
  Copy,
  Check,
  Edit2,
  Trash2,
  Users,
  Percent,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  X,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface Ambassador {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface CouponItem {
  id: string;
  code: string;
  name: string;
  discount_percentage: number;
  fixed_prices?: Record<string, number>;
  is_active: boolean;
  ambassador_id?: string | null;
  ambassador?: Ambassador | null;
  used_count: number;
  max_uses?: number | null;
  expires_at?: string | null;
  created_at: string;
}

interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  totalUses: number;
  activeAmbassadors: number;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [stats, setStats] = useState<CouponStats>({
    totalCoupons: 0,
    activeCoupons: 0,
    totalUses: 0,
    activeAmbassadors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<CouponItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDiscount, setFormDiscount] = useState('33.56');
  const [formPrice149, setFormPrice149] = useState('99');
  const [formPrice349, setFormPrice349] = useState('249');
  const [formPrice599, setFormPrice599] = useState('399');
  const [formMaxUses, setFormMaxUses] = useState('');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Fetch Coupons
  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/coupons?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (res.ok) {
        setCoupons(json.coupons || []);
        if (json.stats) setStats(json.stats);
      } else {
        toast.error(json.error || 'কুপন লোড করতে সমস্যা হয়েছে');
      }
    } catch {
      toast.error('সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Copy code handler
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`'${code}' কপি করা হয়েছে!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Toggle Active/Inactive status
  const handleToggleStatus = async (coupon: CouponItem) => {
    try {
      const newStatus = !coupon.is_active;
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `কুপন '${coupon.code}' ${newStatus ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'} করা হয়েছে`,
        );
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, is_active: newStatus } : c)),
        );
        setStats((prev) => ({
          ...prev,
          activeCoupons: newStatus ? prev.activeCoupons + 1 : Math.max(0, prev.activeCoupons - 1),
        }));
      } else {
        toast.error(data.error || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
      }
    } catch {
      toast.error('স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে');
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormCode('');
    setFormName('');
    setFormDiscount('33.56');
    setFormPrice149('99');
    setFormPrice349('249');
    setFormPrice599('399');
    setFormMaxUses('');
    setFormExpiresAt('');
    setFormIsActive(true);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormName(coupon.name);
    setFormDiscount(String(coupon.discount_percentage || '33.56'));
    setFormPrice149(String(coupon.fixed_prices?.['149'] ?? '99'));
    setFormPrice349(String(coupon.fixed_prices?.['349'] ?? '249'));
    setFormPrice599(String(coupon.fixed_prices?.['599'] ?? '399'));
    setFormMaxUses(coupon.max_uses ? String(coupon.max_uses) : '');
    setFormExpiresAt(
      coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : '',
    );
    setFormIsActive(coupon.is_active);
  };

  // Save Coupon (Create or Edit)
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      return toast.error('কুপন কোড প্রদান করুন');
    }

    const payload = {
      code: formCode.trim().toUpperCase(),
      name: formName.trim() || `অফার (${formCode.trim().toUpperCase()})`,
      discount_percentage: Number(formDiscount) || 33.56,
      fixed_prices: {
        '149': Number(formPrice149) || 99,
        '349': Number(formPrice349) || 249,
        '599': Number(formPrice599) || 399,
      },
      max_uses: formMaxUses ? Number(formMaxUses) : null,
      expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
      is_active: formIsActive,
    };

    setIsSubmitting(true);
    try {
      if (editingCoupon) {
        // Update
        const res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(`'${payload.code}' কুপন সফলভাবে আপডেট করা হয়েছে!`);
          setEditingCoupon(null);
          fetchCoupons();
        } else {
          toast.error(data.error || 'আপডেট করতে ব্যর্থ হয়েছে');
        }
      } else {
        // Create
        const res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(`🎉 '${payload.code}' কুপন সফলভাবে তৈরি করা হয়েছে!`);
          setIsCreateModalOpen(false);
          fetchCoupons();
        } else {
          toast.error(data.error || 'কুপন তৈরি ব্যর্থ হয়েছে');
        }
      }
    } catch {
      toast.error('সার্ভারে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async () => {
    if (!deletingCoupon) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/coupons/${deletingCoupon.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`'${deletingCoupon.code}' কুপন সফলভাবে মুছে ফেলা হয়েছে!`);
        setDeletingCoupon(null);
        fetchCoupons();
      } else {
        toast.error(data.error || 'কুপন মুছে ফেলা সম্ভব হয়নি');
      }
    } catch {
      toast.error('কুপন মুছে ফেলতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List
  const filteredCoupons = coupons.filter((c) => {
    if (filterStatus === 'active') return c.is_active;
    if (filterStatus === 'inactive') return !c.is_active;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Tag size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
                কুপন ও অ্যাম্বাসেডর ম্যানেজমেন্ট
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif]">
                ক্যাম্পাস অ্যাম্বাসেডরদের কুপন কোড তৈরি, লাইভ ট্র্যাকিং ও রেভিনিউ শেয়ার নিয়ন্ত্রণ
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCoupons}
            disabled={loading}
            className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-[#12544F] hover:bg-[#0E423E] active:scale-[0.98] text-white font-bold text-sm font-['Anek_Bangla',sans-serif] shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span>নতুন কুপন তৈরি করুন</span>
          </button>
        </div>
      </div>

      {/* ── Stats Overview ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-semibold">
            <span>মোট কুপন</span>
            <Tag size={16} className="text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono">
            {stats.totalCoupons}
          </div>
          <div className="text-[11px] text-neutral-400 font-['HindSiliguri',sans-serif]">
            তৈরিকৃত মোট কোড
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span>সক্রিয় কুপন</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.activeCoupons}
          </div>
          <div className="text-[11px] text-neutral-400 font-['HindSiliguri',sans-serif]">
            বর্তমানে চলমান অফার
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            <span>মোট ব্যবহার</span>
            <Sparkles size={16} />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {stats.totalUses}
          </div>
          <div className="text-[11px] text-neutral-400 font-['HindSiliguri',sans-serif]">
            সফল ডিসকাউন্ট সেলস
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <span>সক্রিয় অ্যাম্বাসেডর</span>
            <UserCheck size={16} />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {stats.activeAmbassadors}
          </div>
          <div className="text-[11px] text-neutral-400 font-['HindSiliguri',sans-serif]">
            ফিল্ডে প্রমোশনে যুক্ত
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="কোড বা অ্যাম্বাসেডর খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#12544F]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['Anek_Bangla',sans-serif] transition-colors ${
              filterStatus === 'all'
                ? 'bg-[#12544F] text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            সকল ({coupons.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['Anek_Bangla',sans-serif] transition-colors ${
              filterStatus === 'active'
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            সক্রিয় ({stats.activeCoupons})
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['Anek_Bangla',sans-serif] transition-colors ${
              filterStatus === 'inactive'
                ? 'bg-neutral-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            নিষ্ক্রিয় ({Math.max(0, stats.totalCoupons - stats.activeCoupons)})
          </button>
        </div>
      </div>

      {/* ── Coupons Table ── */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-400 font-['HindSiliguri',sans-serif]">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#12544F]" />
            <span>কুপন লোড করা হচ্ছে...</span>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mx-auto mb-3">
              <Tag size={24} />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
              কোনো কুপন পাওয়া যায়নি
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif] mt-1 max-w-sm mx-auto">
              নতুন ক্যাম্পাস অ্যাম্বাসেডরের জন্য বা ক্যাম্পেইনের জন্য আপনার প্রথম কুপন কোড তৈরি করুন।
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-xl bg-[#12544F] text-white text-xs font-bold font-['Anek_Bangla',sans-serif] inline-flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>কুপন তৈরি করুন</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[12px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-900/50 font-['HindSiliguri',sans-serif]">
                  <th className="py-3.5 px-5">কুপন কোড</th>
                  <th className="py-3.5 px-4">অফার ও বিবরণ</th>
                  <th className="py-3.5 px-4">অ্যাম্বাসেডর</th>
                  <th className="py-3.5 px-4">ছাড়ের মূল্য</th>
                  <th className="py-3.5 px-4">ব্যবহার</th>
                  <th className="py-3.5 px-4">স্ট্যাটাস</th>
                  <th className="py-3.5 px-5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {filteredCoupons.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    {/* Code */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          {c.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(c.code)}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                          title="কোড কপি করুন"
                        >
                          {copiedCode === c.code ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
                        {c.name}
                      </div>
                      <div className="text-xs text-neutral-400 font-['HindSiliguri',sans-serif]">
                        {c.discount_percentage}% ছাড়
                      </div>
                    </td>

                    {/* Ambassador */}
                    <td className="py-4 px-4">
                      {c.ambassador ? (
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-neutral-200 text-xs">
                            {c.ambassador.name}
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            {c.ambassador.phone || c.ambassador.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">পাবলিক / জেনারেল</span>
                      )}
                    </td>

                    {/* Pricing */}
                    <td className="py-4 px-4 font-mono text-xs">
                      {c.fixed_prices ? (
                        <div className="space-y-0.5">
                          <div>
                            1M: <span className="font-bold text-emerald-600 dark:text-emerald-400">৳{c.fixed_prices['149'] ?? 99}</span>
                          </div>
                          <div>
                            3M: <span className="font-bold text-emerald-600 dark:text-emerald-400">৳{c.fixed_prices['349'] ?? 249}</span>
                          </div>
                          <div>
                            Adm: <span className="font-bold text-emerald-600 dark:text-emerald-400">৳{c.fixed_prices['599'] ?? 399}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {c.discount_percentage}% OFF
                        </span>
                      )}
                    </td>

                    {/* Uses */}
                    <td className="py-4 px-4">
                      <div className="font-mono font-bold text-neutral-900 dark:text-white text-xs">
                        {c.used_count} বার
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {c.max_uses ? `সীমা: ${c.max_uses}` : 'আনলিমিটেড'}
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-['Anek_Bangla',sans-serif] transition-colors cursor-pointer ${
                          c.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.is_active ? 'bg-emerald-500' : 'bg-neutral-400'
                          }`}
                        />
                        <span>{c.is_active ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Off)'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="এডিট করুন"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingCoupon(c)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Coupon Modal ── */}
      {(isCreateModalOpen || editingCoupon) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => {
              setIsCreateModalOpen(false);
              setEditingCoupon(null);
            }}
          />
          <div className="relative bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Tag size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
                    {editingCoupon ? 'কুপন এডিট করুন' : 'নতুন কুপন তৈরি করুন'}
                  </h3>
                  <p className="text-xs text-neutral-400 font-['HindSiliguri',sans-serif]">
                    ক্যাম্পাস অ্যাম্বাসেডর অফার ও প্রাইস কনফিগার করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingCoupon(null);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCoupon} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 font-['Anek_Bangla',sans-serif] mb-1">
                  কুপন কোড (Coupon Code) *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: AHAMZA"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  disabled={Boolean(editingCoupon)}
                  required
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-mono uppercase font-bold text-sm focus:outline-none focus:border-[#12544F] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 font-['Anek_Bangla',sans-serif] mb-1">
                  অফার বা অ্যাম্বাসেডরের নাম
                </label>
                <input
                  type="text"
                  placeholder="যেমন: আমির (HSC 27) অফার"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-[#12544F]"
                />
              </div>

              {/* Price overrides */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 font-['Anek_Bangla',sans-serif]">
                  প্ল্যানভিত্তিক ছাড়ের চূড়ান্ত মূল্য (Fixed Pricing)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[11px] text-neutral-400 block mb-0.5">১ মাস (১৪৯৳):</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                        ৳
                      </span>
                      <input
                        type="number"
                        value={formPrice149}
                        onChange={(e) => setFormPrice149(e.target.value)}
                        className="w-full pl-6 pr-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-400 block mb-0.5">৩ মাস (৩৪৯৳):</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                        ৳
                      </span>
                      <input
                        type="number"
                        value={formPrice349}
                        onChange={(e) => setFormPrice349(e.target.value)}
                        className="w-full pl-6 pr-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-400 block mb-0.5">এডমিশন (৫৯৯৳):</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                        ৳
                      </span>
                      <input
                        type="number"
                        value={formPrice599}
                        onChange={(e) => setFormPrice599(e.target.value)}
                        className="w-full pl-6 pr-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Limits & Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 font-['Anek_Bangla',sans-serif] mb-1">
                    সর্বোচ্চ ব্যবহার সীমা (ঐচ্ছিক)
                  </label>
                  <input
                    type="number"
                    placeholder="যেমন: 50"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#12544F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 font-['Anek_Bangla',sans-serif] mb-1">
                    মেয়াদ শেষ তারিখ (ঐচ্ছিক)
                  </label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-[#12544F]"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 font-['Anek_Bangla',sans-serif]">
                  তৈরির সাথে সাথেই সক্রিয় (Active) থাকবে
                </span>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#12544F] accent-[#12544F]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingCoupon(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#12544F] hover:bg-[#0E423E] text-white text-xs font-bold font-['Anek_Bangla',sans-serif] shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>{editingCoupon ? 'আপডেট করুন' : 'কুপন সেভ করুন'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setDeletingCoupon(null)} />
          <div className="relative bg-white dark:bg-neutral-900 w-full max-w-sm rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-5 z-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
                কুপন মুছে ফেলতে চান?
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif] mt-1">
                আপনি কি নিশ্চিত যে <span className="font-mono font-bold text-neutral-900 dark:text-white">{deletingCoupon.code}</span> কুপনটি চিরতরে মুছে ফেলতে চান?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingCoupon(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-400"
              >
                না, রাখুন
              </button>
              <button
                onClick={handleDeleteCoupon}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
              >
                {isSubmitting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
