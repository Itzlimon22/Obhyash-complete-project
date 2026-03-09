'use client';

import { useState, useEffect } from 'react';
import {
  Crown,
  Clock,
  Receipt,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  History,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';
import { Invoice, SubscriptionPlan } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  getUserInvoices,
  getUserActiveSubscription,
} from '@/services/database';

interface MySubscriptionPanelProps {
  onUpgrade?: () => void; // navigates to upgrade tab
}

type Tab = 'overview' | 'history';

const STATUS_CONFIG = {
  paid: {
    label: 'পরিশোধিত',
    bg: 'bg-green-800 text-white',
    icon: CheckCircle2,
  },
  valid: { label: 'সফল', bg: 'bg-green-800 text-white', icon: CheckCircle2 },
  checking: {
    label: 'যাচাই হচ্ছে',
    bg: 'bg-red-600 text-white',
    icon: Loader2,
  },
  pending: { label: 'অপেক্ষমান', bg: 'bg-red-600 text-white', icon: Loader2 },
  failed: { label: 'ব্যর্থ', bg: 'bg-neutral-600 text-white', icon: XCircle },
  rejected: { label: 'বাতিল', bg: 'bg-neutral-600 text-white', icon: XCircle },
} as const;

function StatusBadge({ status }: { status: Invoice['status'] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold',
        cfg.bg,
      )}
    >
      <cfg.icon size={10} />
      {cfg.label}
    </span>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-xl',
        className,
      )}
    />
  );
}

export default function MySubscriptionPanel({
  onUpgrade,
}: MySubscriptionPanelProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<SubscriptionPlan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sub, inv] = await Promise.all([
          getUserActiveSubscription(),
          getUserInvoices(),
        ]);
        setActiveSub(sub);
        setInvoices(inv);
      } catch (err) {
        console.error('Failed to load subscription data', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isFree = !activeSub || activeSub.id === 'free';
  const daysLeft = activeSub?.expiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(activeSub.expiresAt).getTime() - Date.now()) / 86400000,
        ),
      )
    : null;

  const paidInvoices = invoices.filter(
    (i) => i.status === 'valid' || i.status === 'paid',
  );
  const pendingInvoices = invoices.filter(
    (i) => i.status === 'pending' || i.status === 'checking',
  );

  // ── Progress ring for days left ──────────────────
  const totalDays = activeSub?.billingCycle?.includes('Year')
    ? 365
    : activeSub?.billingCycle?.includes('Quarterly')
      ? 90
      : 30;
  const progressPct =
    daysLeft != null
      ? Math.min(100, Math.round((daysLeft / totalDays) * 100))
      : 0;

  const TABS: { id: Tab; label: string; Icon: typeof Receipt }[] = [
    { id: 'overview', label: 'ওভারভিউ', Icon: Crown },
    { id: 'history', label: 'ইতিহাস', Icon: History },
  ];

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-green-800 px-6 py-4 flex items-center gap-3">
        <Crown size={20} className="text-yellow-300 shrink-0" />
        <div>
          <h2 className="text-lg font-bold text-white">আমার সাবস্ক্রিপশন</h2>
          <p className="text-xs text-green-200">
            বর্তমান প্ল্যান, ট্রানজেকশন ও ইতিহাস
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors',
                active
                  ? 'border-green-800 text-green-800 dark:text-green-400 dark:border-green-600'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200',
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 bg-neutral-50 dark:bg-neutral-950 overflow-y-auto">
        {/* ─── OVERVIEW TAB ─────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            {loading ? (
              <div className="space-y-4">
                <SkeletonBlock className="h-44" />
                <SkeletonBlock className="h-32" />
              </div>
            ) : isFree ? (
              /* Free user CTA */
              <div className="rounded-2xl border border-dashed border-green-700 bg-green-900/10 dark:bg-green-950/30 p-8 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-green-800 flex items-center justify-center">
                  <Crown size={24} className="text-yellow-300" />
                </div>
                <div>
                  <p className="text-base font-bold text-neutral-800 dark:text-neutral-100 mb-1">
                    এখনো কোনো সাবস্ক্রিপশন নেই
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    প্রিমিয়াম সাবস্ক্রিপশন নিয়ে সব ফিচার সীমাহীনভাবে ব্যবহার
                    করো
                  </p>
                </div>
                <button
                  onClick={onUpgrade}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-800 text-white text-sm font-bold hover:bg-green-900 transition-colors"
                >
                  <ArrowUpRight size={15} />
                  এখনই আপগ্রেড করো
                </button>
              </div>
            ) : (
              <>
                {/* Active plan hero card */}
                <div className="relative overflow-hidden rounded-2xl bg-neutral-900 dark:bg-black p-6 text-white">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10">
                    {/* Status row */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-900/50 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        সক্রিয়
                      </span>
                      <Crown size={18} className="text-yellow-300" />
                    </div>

                    {/* Plan name + price */}
                    <h3 className="text-2xl font-black mb-0.5">
                      {activeSub.name}
                    </h3>
                    <p className="text-sm text-neutral-400 mb-5">
                      {activeSub.currency}
                      {activeSub.price} / {activeSub.billingCycle}
                    </p>

                    {/* Days left ring + info */}
                    <div className="flex items-center gap-5">
                      {/* SVG ring */}
                      <div className="relative w-20 h-20 shrink-0">
                        <svg
                          viewBox="0 0 36 36"
                          className="w-20 h-20 -rotate-90"
                        >
                          <circle
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke="#374151"
                            strokeWidth="3.5"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke={progressPct > 30 ? '#166534' : '#DC2626'}
                            strokeWidth="3.5"
                            strokeDasharray={`${progressPct} ${100 - progressPct}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-lg font-black leading-none">
                            {daysLeft}
                          </span>
                          <span className="text-[9px] text-neutral-400 leading-none mt-0.5">
                            দিন
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar
                            size={13}
                            className="text-neutral-400 shrink-0"
                          />
                          <span className="text-neutral-400 text-xs">
                            মেয়াদ শেষ
                          </span>
                          <span className="font-semibold text-xs ml-auto">
                            {activeSub.expiresAt
                              ? new Date(
                                  activeSub.expiresAt,
                                ).toLocaleDateString('bn-BD', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock
                            size={13}
                            className="text-neutral-400 shrink-0"
                          />
                          <span className="text-neutral-400 text-xs">বাকি</span>
                          <span
                            className={cn(
                              'font-bold text-xs ml-auto',
                              daysLeft != null && daysLeft <= 7
                                ? 'text-red-400'
                                : 'text-green-400',
                            )}
                          >
                            {daysLeft} দিন
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-5 h-1.5 rounded-full bg-neutral-700 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          progressPct > 30 ? 'bg-green-600' : 'bg-red-600',
                        )}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Renew/Upgrade */}
                    <button
                      onClick={onUpgrade}
                      className="mt-5 w-full py-2.5 rounded-xl border border-green-700 text-green-400 text-sm font-bold hover:bg-green-900/40 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} />
                      রিনিউ / আপগ্রেড
                    </button>
                  </div>
                </div>

                {/* Features grid */}
                {activeSub.features && activeSub.features.length > 0 && (
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
                    <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-3">
                      সক্রিয় ফিচার সমূহ
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeSub.features.map((feat, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300"
                        >
                          <CheckCircle2
                            size={14}
                            className="text-green-800 dark:text-green-500 mt-0.5 shrink-0"
                          />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pending payments alert */}
                {pendingInvoices.length > 0 && (
                  <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4 flex items-start gap-3">
                    <Loader2
                      size={16}
                      className="text-red-600 dark:text-red-500 shrink-0 mt-0.5 animate-spin"
                    />
                    <div>
                      <p className="text-sm font-bold text-red-700 dark:text-red-400">
                        {pendingInvoices.length}টি পেমেন্ট যাচাই করা হচ্ছে
                      </p>
                      <p className="text-xs text-red-600/80 dark:text-red-500/80 mt-0.5">
                        ১–২৪ ঘণ্টার মধ্যে কনফার্ম হবে
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ─── HISTORY TAB ──────────────────────────────────── */}
        {tab === 'history' && (
          <>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <SkeletonBlock key={i} className="h-20" />
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-400">
                <Receipt
                  size={36}
                  className="text-neutral-300 dark:text-neutral-700"
                />
                <p className="text-sm">কোনো ট্রানজেকশন নেই</p>
              </div>
            ) : (
              <>
                {/* Summary row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: 'মোট',
                      value: invoices.length,
                      color: 'text-neutral-700 dark:text-neutral-200',
                    },
                    {
                      label: 'সফল',
                      value: paidInvoices.length,
                      color: 'text-green-800 dark:text-green-400',
                    },
                    {
                      label: 'অপেক্ষমান',
                      value: pendingInvoices.length,
                      color: 'text-red-600',
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 text-center"
                    >
                      <p className={cn('text-xl font-black', color)}>{value}</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Invoice list */}
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <InvoiceRow key={inv.id} invoice={inv} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Invoice Row ──────────────────────────────────────────────────────────────
function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-green-800 flex items-center justify-center shrink-0">
          <Receipt size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate">
            {invoice.planName}
          </p>
          <p className="text-xs text-neutral-400">{invoice.date}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            {invoice.currency}
            {invoice.amount}
          </span>
          <StatusBadge status={invoice.status} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-2 border-t border-neutral-100 dark:border-neutral-800">
          {invoice.transactionId && invoice.transactionId !== 'N/A' && (
            <DetailRow
              label="ট্রানজেকশন আইডি"
              value={invoice.transactionId}
              mono
            />
          )}
          {invoice.paymentMethod && invoice.paymentMethod !== 'N/A' && (
            <DetailRow label="পেমেন্ট পদ্ধতি" value={invoice.paymentMethod} />
          )}
          {invoice.senderNumber && (
            <DetailRow label="প্রেরকের নম্বর" value={invoice.senderNumber} />
          )}
          <DetailRow
            label="ইনভয়েস আইডি"
            value={`#${invoice.id.slice(0, 8).toUpperCase()}`}
            mono
          />
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      <span
        className={cn(
          'text-xs font-bold text-neutral-700 dark:text-neutral-300',
          mono && 'font-mono',
        )}
      >
        {value}
      </span>
    </div>
  );
}
