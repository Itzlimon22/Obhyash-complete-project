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
    bg: "bg-[#004633] text-white",
    icon: CheckCircle2,
  },
  valid: { label: "সফল", bg: "bg-[#004633] text-white", icon: CheckCircle2 },
  checking: {
    label: "যাচাই হচ্ছে",
    bg: "bg-amber-600 text-white",
    icon: Loader2,
  },
  pending: { label: "অপেক্ষমান", bg: "bg-amber-600 text-white", icon: Loader2 },
  failed: { label: "ব্যর্থ", bg: "bg-red-600 text-white", icon: XCircle },
  rejected: { label: "বাতিল", bg: "bg-neutral-600 text-white", icon: XCircle },
} as const;

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold",
        cfg.bg
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
        "animate-pulse bg-neutral-200 dark:bg-[#27272A] rounded-2xl",
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
    { id: "overview", label: "ওভারভিউ", Icon: Crown },
    { id: "history", label: "ইতিহাস", Icon: History },
  ];

  return (
    <div className="min-h-full flex flex-col font-['HindSiliguri']">
      {/* Header */}
      <div className="bg-[#004633] px-6 py-4 flex items-center gap-3 rounded-t-2xl">
        <img src="/dashboard-icons/pro_crown.svg" alt="Pro" className="w-7 h-7 object-contain drop-shadow-xs shrink-0" />
        <div>
          <h2 className="text-base sm:text-lg font-black text-white">আমার সাবস্ক্রিপশন</h2>
          <p className="text-xs text-emerald-100 font-medium">
            বর্তমান প্ল্যান, ট্রানজেকশন ও ইতিহাস
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-neutral-200 dark:border-[#27272A] bg-white dark:bg-[#18181B]">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-black border-b-2 transition-colors",
                active
                  ? "border-[#004633] text-[#004633] dark:text-[#4ADE80] dark:border-[#4ADE80]"
                  : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              )}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 bg-neutral-50 dark:bg-[#141417] overflow-y-auto rounded-b-2xl">
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
              <div className="rounded-2xl border border-dashed border-[#004633]/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-8 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#004633] flex items-center justify-center shadow-lg shadow-emerald-950/30">
                  <img src="/dashboard-icons/pro_crown.svg" alt="Pro" className="w-8 h-8 object-contain drop-shadow-md" />
                </div>
                <div>
                  <p className="text-base font-black text-neutral-800 dark:text-neutral-100 mb-1">
                    এখনো কোনো সাবস্ক্রিপশন নেই
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    প্রিমিয়াম সাবস্ক্রিপশন নিয়ে সব ফিচার সীমাহীনভাবে ব্যবহার করো
                  </p>
                </div>
                <button
                  onClick={onUpgrade}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#004633] text-white text-xs font-black hover:bg-[#003627] active:scale-95 transition-all shadow-sm"
                >
                  <ArrowUpRight size={15} />
                  <span>এখনই আপগ্রেড করো</span>
                </button>
              </div>
            ) : (
              <>
                {/* Active plan hero card */}
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200/90 dark:border-[#27272A] p-5 sm:p-6 shadow-sm">
                  <div className="relative z-10">
                    {/* Status row */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>সক্রিয় প্রো প্ল্যান</span>
                      </span>
                      <Crown size={18} className="text-yellow-500 dark:text-yellow-300" />
                    </div>

                    {/* Plan name + price */}
                    <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                      {activeSub.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-bold">
                      বিলিং সাইকেল: {activeSub.billingCycle}
                    </p>

                    {/* Days left indicator */}
                    {daysLeft !== null && (
                      <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1.5">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>মেয়াদ বাকি</span>
                          </span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            {BanglaNameHelper.toBanglaNumeral(daysLeft)} দিন
                          </span>
                        </div>
                        <div className="h-2 bg-neutral-100 dark:bg-[#27272A] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#004633] dark:bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={onUpgrade}
                      className="mt-5 w-full py-2.5 rounded-xl border border-[#004633] text-[#004633] dark:text-[#4ADE80] text-xs font-black hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all flex items-center justify-center gap-2"
                    >
                      <span>প্ল্যান রিনিউ বা পরিবর্তন করুন</span>
                      <ArrowUpRight size={14} />
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
              <div className="py-12 text-center text-neutral-400">
                <Receipt size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold">কোনো পূর্ববর্তী লেনদেন পাওয়া যায়নি।</p>
              </div>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200/90 dark:border-[#27272A] flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white">
                      {inv.planName || "প্রো সাবস্ক্রিপশন"}
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">
                      {new Date(inv.date || (inv as any).createdAt || (inv as any).created_at).toLocaleDateString("bn-BD")} • ৳{BanglaNameHelper.toBanglaNumeral(inv.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={inv.status} />
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                      title="মানি রিসিট দেখুন"
                    >
                      <Receipt size={16} />
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
