"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle2,
  Zap,
  Smile,
  Bug,
  AlertCircle,
  ShieldCheck,
  Send,
  LifeBuoy,
  Clock,
  RefreshCw,
  XCircle,
  AlertTriangle,
  History,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { submitComplaint, getUserComplaints } from "@/services/complaint-service";
import { ComplaintType, AppComplaint, ComplaintStatus } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { cn } from "@/lib/utils";

interface IssueCategory {
  id: ComplaintType;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  colorClass: string;
  iconColor: string;
}

const ISSUE_CATEGORIES: IssueCategory[] = [
  {
    id: "Technical",
    title: "কারিগরি সমস্যা",
    subtitle: "অ্যাপ ক্র্যাশ, লোডিং সমস্যা বা এরর",
    icon: Zap,
    colorClass: "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "UX",
    title: "ডিজাইন ও অভিজ্ঞতা",
    subtitle: "ইন্টারফেস বা ব্যবহারের সুবিধা নিয়ে পরামর্শ",
    icon: Smile,
    colorClass: "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "Bug",
    title: "বাগ রিপোর্ট",
    subtitle: "কোনো ফিচার ঠিকমতো কাজ করছে না",
    icon: Bug,
    colorClass: "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "Other",
    title: "নতুন ফিচার প্রস্তাব",
    subtitle: "নতুন কোনো সুবিধা বা ফিচার যোগ করার আইডিয়া",
    icon: AlertCircle,
    colorClass: "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
];

const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  Pending: {
    label: "অপেক্ষমাণ",
    color: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50",
    icon: Clock,
  },
  "In Progress": {
    label: "প্রক্রিয়াধীন",
    color: "text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50",
    icon: RefreshCw,
  },
  Resolved: {
    label: "সমাধান হয়েছে",
    color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50",
    icon: CheckCircle2,
  },
  Dismissed: {
    label: "বাতিল",
    color: "text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700",
    icon: XCircle,
  },
};

export const ComplaintView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"new" | "my_tickets">("new");
  const [selectedType, setSelectedType] = useState<ComplaintType>("Technical");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // My Complaints State
  const [myComplaints, setMyComplaints] = useState<AppComplaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);

  const pendingCount = myComplaints.filter(
    (c) => c.status === "Pending" || c.status === "In Progress"
  ).length;
  const isPendingLimitReached = pendingCount >= 3;

  useEffect(() => {
    if (activeTab !== "my_tickets") return;

    let isMounted = true;
    const fetchMyComplaints = async () => {
      if (isMounted) setIsLoadingComplaints(true);
      const data = await getUserComplaints();
      if (isMounted) {
        setMyComplaints(data);
        setIsLoadingComplaints(false);
      }
    };

    void fetchMyComplaints();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPendingLimitReached) {
      toast.error(
        "আপনার ৩টি আবেদন ইতিমধ্যে প্রক্রিয়াধীন আছে। নতুন আবেদন জমা দেওয়ার পূর্বে আগেরগুলোর সমাধানের অপেক্ষা করুন।"
      );
      return;
    }

    const trimmed = description.trim();
    if (trimmed.length < 15) {
      toast.error("সমস্যাটি একটু বিস্তারিত লিখে জানাও (কমপক্ষে ১৫ অক্ষর আবশ্যক)");
      return;
    }
    if (trimmed.length > 1000) {
      toast.error("মতামতের বিবরণ সর্বোচ্চ ১০০০ অক্ষরের মধ্যে লিখুন");
      return;
    }

    // Duplicate check in last 7 days
    const isDuplicate = myComplaints.some(
      (c) =>
        c.description.trim().toLowerCase() === trimmed.toLowerCase() &&
        new Date().getTime() - new Date(c.created_at).getTime() <
          7 * 24 * 60 * 60 * 1000
    );
    if (isDuplicate) {
      toast.error(
        "আপনি ইতিপূর্বে হুবহু একই বিবরণ পাঠিয়েছেন! নতুন তথ্য থাকলে তা উল্লেখ করুন।"
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitComplaint(selectedType, trimmed);
      if (result.success) {
        setIsSuccess(true);
        toast.success("সাপোর্ট টিকেট সফলভাবে জমা নেওয়া হয়েছে!");
        setDescription("");
        setSelectedType("Technical");
      } else {
        toast.error(result.error || "টিকেট পাঠাতে সমস্যা হয়েছে");
      }
    } catch (error: unknown) {
      console.error("Error submitting complaint:", error);
      toast.error("টিকেট পাঠাতে সমস্যা হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setSelectedType("Technical");
    setDescription("");
  };

  const filteredComplaints =
    filterStatus === "all"
      ? myComplaints
      : myComplaints.filter((c) => c.status === filterStatus);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6 font-['HindSiliguri'] pb-24">
      {/* ── Sticky Support Navigation ── */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#141417]/80 backdrop-blur-md py-2 -mx-4 px-4 flex justify-center">
        <div className="bg-neutral-100 dark:bg-[#18181B] p-1 rounded-2xl flex items-center gap-1 border border-neutral-200 dark:border-[#27272A] shadow-sm">
          <button
            onClick={() => setActiveTab("new")}
            className={cn(
              "px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2",
              activeTab === "new"
                ? "bg-[#004633] text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            )}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>অভিযোগ বা সমস্যা</span>
          </button>
          <button
            onClick={() => setActiveTab("my_tickets")}
            className={cn(
              "px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2",
              activeTab === "my_tickets"
                ? "bg-[#004633] text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            )}
          >
            <History className="w-4 h-4" />
            <span>আমার টিকেট</span>
            {myComplaints.length > 0 && (
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {BanglaNameHelper.toBanglaNumeral(myComplaints.length)}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "new" ? (
        isSuccess ? (
          /* Success Screen */
          <div className="bg-white dark:bg-[#18181B] rounded-3xl p-8 border border-neutral-200/90 dark:border-[#27272A] text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                টিকেট জমা নেওয়া হয়েছে!
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm max-w-md mx-auto font-medium">
                তোমার বার্তাটি আমাদের সাপোর্ট টিমের কাছে পৌঁছেছে। দ্রুতই ব্যবস্থা গ্রহণ করা হবে এবং আপডেট জানানো হবে।
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-[#27272A] text-neutral-700 dark:text-neutral-300 font-black text-xs hover:bg-neutral-50 dark:hover:bg-[#27272A] transition-colors"
              >
                আরেকটি সমস্যা জানাও
              </button>
              <button
                onClick={() => setActiveTab("my_tickets")}
                className="px-5 py-2.5 rounded-xl bg-[#004633] text-white font-black text-xs hover:bg-[#003627] transition-all shadow-sm"
              >
                আমার টিকেটগুলো দেখো
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <div className="space-y-6">
            {/* Limit Banner */}
            {isPendingLimitReached && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  আপনার ৩টি আবেদন ইতিমধ্যে প্রক্রিয়াধীন আছে। নতুন আবেদন জমা দেওয়ার পূর্বে আগেরগুলোর সমাধানের অপেক্ষা করুন।
                </p>
              </div>
            )}

            {/* Support Desk Banner */}
            <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#004633] flex items-center justify-center text-white shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-black text-emerald-900 dark:text-emerald-300 text-sm">
                  অভ্যাস সাপোর্ট টিম সর্বদা পাশে আছে
                </h3>
                <p className="text-emerald-700 dark:text-emerald-400/90 text-xs mt-0.5 font-medium">
                  যেকোনো সমস্যা জানালে দ্রুত সমাধান প্রদান করা হবে।
                </p>
              </div>
            </div>

            {/* Issue Category Tiles */}
            <div className="space-y-3">
              <h2 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                সমস্যার ধরন নির্বাচন করো
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {ISSUE_CATEGORIES.map((cat) => {
                  const isSelected = selectedType === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      type="button"
                      disabled={isPendingLimitReached}
                      key={cat.id}
                      onClick={() => setSelectedType(cat.id)}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all",
                        isSelected
                          ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-[#004633] dark:border-emerald-500 shadow-sm ring-1 ring-[#004633]/20"
                          : "bg-white dark:bg-[#18181B] border-neutral-200/90 dark:border-[#27272A] hover:border-neutral-300",
                        isPendingLimitReached && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div
                        className={cn(
                          "p-2.5 rounded-xl shrink-0 transition-colors",
                          isSelected
                            ? "bg-[#004633] text-white"
                            : "bg-neutral-100 dark:bg-[#27272A] text-neutral-600 dark:text-neutral-400"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-neutral-900 dark:text-white text-xs md:text-sm">
                          {cat.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-medium mt-0.5">
                          {cat.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description Card */}
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-[#18181B] rounded-2xl p-5 sm:p-6 border border-neutral-200/90 dark:border-[#27272A] shadow-sm space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white">
                    সমস্যার বিস্তারিত বিবরণ
                  </label>
                  <span
                    className={cn(
                      "text-xs font-black",
                      description.trim().length === 0
                        ? "text-neutral-400"
                        : description.trim().length < 15
                        ? "text-amber-600 dark:text-amber-400"
                        : description.trim().length <= 1000
                        ? "text-emerald-600"
                        : "text-rose-600"
                    )}
                  >
                    {BanglaNameHelper.toBanglaNumeral(description.trim().length)} / ১০০০ অক্ষর
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={1000}
                  disabled={isPendingLimitReached}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="সমস্যাটি কীভাবে ঘটেছে বা কোথায় হয়েছে তা বিস্তারিত লেখো (কমপক্ষে ১৫ অক্ষর আবশ্যক)..."
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#141417] text-neutral-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#004633]/20 focus:border-[#004633] transition-all placeholder:text-neutral-400 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isPendingLimitReached}
                className="w-full py-3 rounded-xl bg-[#004633] hover:bg-[#003627] font-black text-white text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>টিকেট পাঠানো হচ্ছে...</span>
                  </>
                ) : isPendingLimitReached ? (
                  <span>আগের ৩টি আবেদনের সমাধানের অপেক্ষা করুন</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>সাপোর্ট টিকেট জমা দাও</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )
      ) : (
        /* My Tickets View */
        <div className="space-y-4">
          {isLoadingComplaints ? (
            <div className="py-16 text-center">
              <Loader2 className="w-7 h-7 animate-spin text-[#004633] mx-auto" />
            </div>
          ) : myComplaints.length === 0 ? (
            <div className="bg-white dark:bg-[#18181B] rounded-2xl p-10 text-center border border-neutral-200/90 dark:border-[#27272A] space-y-3">
              <div className="w-12 h-12 bg-neutral-100 dark:bg-[#27272A] rounded-2xl flex items-center justify-center mx-auto text-neutral-500">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                কোনো সাপোর্ট টিকেট নেই
              </h3>
              <p className="text-neutral-500 text-xs max-w-sm mx-auto font-medium">
                অ্যাপে কোনো সমস্যার সম্মুখীন হলে নতুন টিকেট জমা দিতে পারো।
              </p>
              <button
                onClick={() => setActiveTab("new")}
                className="mt-2 px-4 py-2 rounded-xl bg-[#004633] text-white font-black text-xs hover:bg-[#003627] transition-all shadow-sm"
              >
                নতুন টিকেট তৈরি করো
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter Chips */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-black transition-all border",
                    filterStatus === "all"
                      ? "bg-[#004633] text-white border-[#004633] shadow-sm"
                      : "bg-white dark:bg-[#18181B] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-[#27272A]"
                  )}
                >
                  সব ({BanglaNameHelper.toBanglaNumeral(myComplaints.length)})
                </button>
                <button
                  onClick={() => setFilterStatus("Pending")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-black transition-all border",
                    filterStatus === "Pending"
                      ? "bg-[#004633] text-white border-[#004633] shadow-sm"
                      : "bg-white dark:bg-[#18181B] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-[#27272A]"
                  )}
                >
                  অপেক্ষমাণ ({BanglaNameHelper.toBanglaNumeral(myComplaints.filter((c) => c.status === "Pending").length)})
                </button>
                <button
                  onClick={() => setFilterStatus("Resolved")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-black transition-all border",
                    filterStatus === "Resolved"
                      ? "bg-[#004633] text-white border-[#004633] shadow-sm"
                      : "bg-white dark:bg-[#18181B] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-[#27272A]"
                  )}
                >
                  সমাধান ({BanglaNameHelper.toBanglaNumeral(myComplaints.filter((c) => c.status === "Resolved").length)})
                </button>
              </div>

              {/* Tickets Cards */}
              <div className="space-y-3">
                {filteredComplaints.map((comp) => {
                  const status = STATUS_CONFIG[comp.status] || {
                    label: "অপেক্ষমাণ",
                    color: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200",
                    icon: Clock,
                  };
                  const StatusIcon = status.icon;
                  const ticketCode = comp.id.slice(0, 6).toUpperCase();

                  return (
                    <div
                      key={comp.id}
                      className="bg-white dark:bg-[#18181B] rounded-2xl border border-neutral-200/90 dark:border-[#27272A] overflow-hidden shadow-sm"
                    >
                      {/* Ticket Top Header */}
                      <div className="bg-neutral-50 dark:bg-[#141417] px-4 py-2.5 border-b border-neutral-100 dark:border-[#27272A] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-neutral-500 dark:text-neutral-400">
                            #TKT-{ticketCode}
                          </span>
                          <span className="bg-neutral-200 dark:bg-[#27272A] text-neutral-700 dark:text-neutral-300 text-[11px] px-2 py-0.5 rounded font-bold">
                            {comp.type}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1",
                            status.color
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{status.label}</span>
                        </span>
                      </div>

                      {/* Ticket Content */}
                      <div className="p-4 space-y-3">
                        <p className="text-neutral-700 dark:text-neutral-300 text-xs sm:text-sm leading-relaxed font-medium">
                          {comp.description}
                        </p>

                        {comp.admin_feedback && (
                          <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 p-3 rounded-xl text-xs space-y-1">
                            <strong className="text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-black">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>সাপোর্ট টিমের প্রতিক্রিয়া:</span>
                            </strong>
                            <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                              {comp.admin_feedback}
                            </p>
                          </div>
                        )}

                        <div className="text-[11px] text-neutral-400 pt-1 font-bold">
                          {new Date(comp.created_at).toLocaleDateString("bn-BD", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComplaintView;
