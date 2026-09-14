"use client";

import { useState, useEffect } from "react";
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
  Download,
} from "lucide-react";
import { Invoice, SubscriptionPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import OfficialReceiptModal from "../subscription/OfficialReceiptModal";
import {
  getUserInvoices,
  getUserActiveSubscription,
} from "@/services/database";

interface MySubscriptionPanelProps {
  onUpgrade?: () => void;
}

type Tab = "overview" | "history";

const STATUS_CONFIG = {
  paid: {
    label: "পরিশোধিত",
    bg: "bg-[#12544F]/10 text-[#12544F] dark:text-[#2DD4BF] border border-[#12544F]/20",
    icon: CheckCircle2,
  },
  valid: {
    label: "সফল",
    bg: "bg-[#12544F]/10 text-[#12544F] dark:text-[#2DD4BF] border border-[#12544F]/20",
    icon: CheckCircle2,
  },
  checking: {
    label: "যাচাই হচ্ছে",
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    icon: Loader2,
  },
  pending: {
    label: "অপেক্ষমান",
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    icon: Loader2,
  },
  failed: {
    label: "ব্যর্থ",
    bg: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
    icon: XCircle,
  },
  rejected: {
    label: "বাতিল",
    bg: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20",
    icon: XCircle,
  },
} as const;

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-['Anek_Bangla',sans-serif]",
        cfg.bg
      )}
    >
      <cfg.icon size={11} />
      {cfg.label}
    </span>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-neutral-200 dark:bg-[#18181B] rounded-[20px]",
        className
      )}
    />
  );
}

export default function MySubscriptionPanel({
  onUpgrade,
}: MySubscriptionPanelProps) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<SubscriptionPlan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
        console.error("Failed to load subscription data", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isFree = !activeSub || activeSub.id === "free";
  const daysLeft = activeSub?.expiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(activeSub.expiresAt).getTime() - Date.now()) / 86400000
        )
      )
    : null;

  const paidInvoices = invoices.filter(
    (i) => i.status === "valid" || i.status === "paid"
  );
  const pendingInvoices = invoices.filter(
    (i) => i.status === "pending" || i.status === "checking"
  );

  const totalDays = activeSub?.billingCycle?.includes("Year")
    ? 365
    : activeSub?.billingCycle?.includes("Quarterly")
    ? 90
    : 30;
  const progressPct =
    daysLeft != null
      ? Math.min(100, Math.round((daysLeft / totalDays) * 100))
      : 0;

  const TABS: { id: Tab; label: string; Icon: typeof Receipt }[] = [
    { id: "overview", label: "বর্তমান প্ল্যান", Icon: Crown },
    { id: "history", label: "ইতিহাস", Icon: History },
  ];

  return (
    <div className="min-h-full flex flex-col font-['HindSiliguri',sans-serif]">
      {/* Header */}
      <div className="bg-[#12544F] px-5 sm:px-6 py-4 flex items-center gap-3 rounded-t-[20px]">
        <img src="/dashboard-icons/pro_crown.svg" alt="Pro" className="w-7 h-7 object-contain drop-shadow-xs shrink-0" />
        <div>
          <h2 className="font-['Anek_Bangla',sans-serif] text-base sm:text-lg font-bold text-white">আমার সাবস্ক্রিপশন</h2>
          <p className="text-xs text-emerald-100 font-medium">
            বর্তমান প্ল্যান, ট্রানজেকশন ও ইতিহাস
          </p>
        </div>
      </div>

      {/* Tab bar (Flutter segmented style) */}
      <div className="p-1.5 bg-neutral-100 dark:bg-[#1C1C1E] border-b border-neutral-200/80 dark:border-white/[0.08] flex items-center gap-1">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold font-['Anek_Bangla',sans-serif] flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                active
                  ? "bg-white dark:bg-[#2C2C2E] text-[#12544F] dark:text-[#2DD4BF] shadow-xs"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
              )}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 bg-[#FAF9F6] dark:bg-[#000000] overflow-y-auto rounded-b-[20px]">
        {/* ─── OVERVIEW TAB ─────────────────────────────────── */}
        {tab === "overview" && (
          <>
            {loading ? (
              <div className="space-y-4">
                <SkeletonBlock className="h-44" />
                <SkeletonBlock className="h-32" />
              </div>
            ) : isFree ? (
              /* Free user CTA */
              <div className="rounded-[20px] bg-white dark:bg-[#121212] border border-neutral-200/80 dark:border-white/[0.08] p-7 flex flex-col items-center text-center gap-3.5 shadow-xs">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#004633] to-[#059669] flex items-center justify-center shadow-md shadow-emerald-950/20">
                  <img src="/dashboard-icons/pro_crown.svg" alt="Pro" className="w-7 h-7 object-contain drop-shadow-xs" />
                </div>
                <div>
                  <p className="font-['Anek_Bangla',sans-serif] text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                    এখনো কোনো সাবস্ক্রিপশন নেই
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
                    প্রিমিয়াম সাবস্ক্রিপশন নিয়ে সব ফিচার সীমাহীনভাবে ব্যবহার করো
                  </p>
                </div>
                <button
                  onClick={onUpgrade}
                  className="h-[46px] px-6 rounded-xl bg-[#12544F] hover:bg-[#0E423E] active:scale-[0.98] text-white font-['Anek_Bangla',sans-serif] font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowUpRight size={16} />
                  <span>এখনই আপগ্রেড করো</span>
                </button>
              </div>
            ) : (
              <>
                {/* Active plan hero card */}
                <div className="relative overflow-hidden rounded-[20px] bg-white dark:bg-[#121212] border border-neutral-200/80 dark:border-white/[0.08] p-5 sm:p-6 shadow-xs">
                  <div className="relative z-10">
                    {/* Status row */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-1.5 text-xs font-bold font-['Anek_Bangla',sans-serif] text-[#12544F] dark:text-[#2DD4BF] bg-[#12544F]/10 dark:bg-[#12544F]/25 px-2.5 py-1 rounded-full border border-[#12544F]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>সক্রিয় প্রো প্ল্যান</span>
                      </span>
                      <Crown size={18} className="text-[#FBBF24]" />
                    </div>

                    {/* Plan name + price */}
                    <h3 className="font-['Anek_Bangla',sans-serif] text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                      {activeSub.name}
                    </h3>
                    <p className="font-['Anek_Bangla',sans-serif] text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
                      বিলিং সাইকেল: {activeSub.billingCycle}
                    </p>

                    {/* Days left indicator */}
                    {daysLeft !== null && (
                      <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-white/[0.08]">
                        <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1.5 font-['Anek_Bangla',sans-serif]">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>মেয়াদ বাকি</span>
                          </span>
                          <span className="font-black text-[#12544F] dark:text-[#2DD4BF]">
                            {BanglaNameHelper.toBanglaNumeral(daysLeft)} দিন
                          </span>
                        </div>
                        <div className="h-2 bg-neutral-100 dark:bg-[#27272A] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#12544F] dark:bg-[#2DD4BF] rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={onUpgrade}
                      className="mt-5 w-full h-[46px] rounded-xl border border-[#12544F] text-[#12544F] dark:text-[#2DD4BF] dark:border-[#12544F]/40 font-['Anek_Bangla',sans-serif] font-bold text-sm hover:bg-[#12544F]/5 dark:hover:bg-[#12544F]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>প্ল্যান রিনিউ বা পরিবর্তন করুন</span>
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ─── HISTORY TAB ──────────────────────────────────── */}
        {tab === "history" && (
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 font-['Anek_Bangla',sans-serif]">
                <Receipt size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold">কোনো পূর্ববর্তী লেনদেন পাওয়া যায়নি।</p>
              </div>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-[16px] bg-white dark:bg-[#121212] border border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 shadow-xs"
                >
                  <div>
                    <h4 className="font-['Anek_Bangla',sans-serif] text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                      {inv.planName || "প্রো সাবস্ক্রিপশন"}
                    </h4>
                    <p className="font-['Anek_Bangla',sans-serif] text-[11px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
                      {new Date(inv.date || (inv as any).createdAt || (inv as any).created_at).toLocaleDateString("bn-BD")} • ৳{BanglaNameHelper.toBanglaNumeral(inv.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={inv.status} />
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition active:scale-95 cursor-pointer"
                      title="মানি রিসিট দেখুন"
                    >
                      <Receipt size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Official Receipt Modal */}
      {selectedInvoice && (
        <OfficialReceiptModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
