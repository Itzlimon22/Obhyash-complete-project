"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  X, 
  Calendar, 
  BookOpen, 
  Clock, 
  Download, 
  Search,
  RefreshCw,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { 
  LiveExamRoutineService, 
  GoogleSheetRoutineItem, 
  TrackKey 
} from "@/services/live-exam-routine-service";
import { 
  LiveExamControlsService, 
  LiveExamControlsConfig, 
  DEFAULT_LIVE_EXAM_CONTROLS 
} from "@/services/live-exam-controls-service";

interface LiveExamRoutineModalProps {
  categoryTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectExam?: (examTitle: string) => void;
}

const TRACKS: { key: TrackKey; label: string; badge: string; color: string }[] = [
  { key: "Medical", label: "মেডিকেল ভর্তি", badge: "MBBS ২০২৬-২৭", color: "from-emerald-500 to-teal-600" },
  { key: "Engineering", label: "ইঞ্জিনিয়ারিং", badge: "BUET/CKRUET", color: "from-blue-500 to-indigo-600" },
  { key: "Varsity_A", label: "ঢাবি 'ক' ইউনিট", badge: "DU Science", color: "from-amber-500 to-orange-600" },
];

export const LiveExamRoutineModal: React.FC<LiveExamRoutineModalProps> = ({
  categoryTitle,
  isOpen,
  onClose,
  onSelectExam,
}) => {
  const initialTrack = useMemo(() => {
    return LiveExamRoutineService.getSheetNameFromCategory(categoryTitle);
  }, [categoryTitle]);

  const [activeTrack, setActiveTrack] = useState<TrackKey>(initialTrack);
  const [controls, setControls] = useState<LiveExamControlsConfig>(DEFAULT_LIVE_EXAM_CONTROLS);
  const [items, setItems] = useState<GoogleSheetRoutineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      LiveExamControlsService.getControls().then((c) => {
        setControls(c);
        const mappedSheet = LiveExamControlsService.getSheetName(categoryTitle, c) as TrackKey;
        setActiveTrack(mappedSheet);
      });
    }
  }, [isOpen, categoryTitle]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    const hasRoutine = LiveExamControlsService.hasRoutine(activeTrack, controls);
    if (!hasRoutine) {
      setItems([]);
      setLoading(false);
      return;
    }

    LiveExamRoutineService.fetchRoutine(activeTrack, controls.routine_spreadsheet_id)
      .then((data) => {
        if (isMounted) {
          setItems(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load routine items:", err);
          setLoading(false);
          toast.error("রুটিন লোড করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTrack, controls]);

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.examName.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      item.syllabus.toLowerCase().includes(q) ||
      item.date.toLowerCase().includes(q) ||
      item.dayName.toLowerCase().includes(q)
    );
  });

  const handleDownloadRoutinePdf = () => {
    if (items.length === 0) {
      toast.error("রুটিনের কোনো তথ্য পাওয়া যায়নি।");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("পপ-আপ ব্লক করা হয়েছে। অনুগ্রহ করে পপ-আপ অনুমোদন করুন।");
      return;
    }

    const currentTrackConfig = TRACKS.find(t => t.key === activeTrack);
    const trackLabel = currentTrackConfig?.label ?? "ভর্তি পরীক্ষা";
    const trackBadge = currentTrackConfig?.badge ?? "২০২৬-২৭ শিক্ষাবর্ষ";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <title>Obhyash - ${trackLabel} Routine & Syllabus 2026-27</title>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Hind Siliguri', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #0f172a;
            background: #fff;
            margin: 0;
            padding: 8px;
            font-size: 11.5px;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2.5px solid #004633;
            padding-bottom: 10px;
            margin-bottom: 14px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo-badge {
            width: 38px;
            height: 38px;
            background: #004633;
            color: #fff;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 20px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 800;
            color: #004633;
            line-height: 1.1;
          }
          .brand-sub {
            font-size: 10px;
            color: #64748b;
            font-weight: 600;
          }
          .exam-badge {
            background: #ecfdf5;
            color: #004633;
            border: 1px solid #a7f3d0;
            padding: 5px 12px;
            border-radius: 18px;
            font-size: 12px;
            font-weight: 700;
            text-align: right;
          }
          .routine-title {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 10px 0;
            text-align: center;
            background: #f8fafc;
            padding: 7px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 11px;
          }
          th {
            background: #004633;
            color: #fff;
            font-weight: 700;
            padding: 7px 8px;
            text-align: left;
            border: 1px solid #004633;
          }
          td {
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .chapter-pill {
            display: inline-block;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            color: #334155;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 10.5px;
            margin: 1.5px 2px;
            line-height: 1.35;
          }
          .mega-row {
            background: #f0fdf4 !important;
            font-weight: bold;
          }
          .rules-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 9px 12px;
            margin-top: 10px;
          }
          .rules-header {
            font-weight: 700;
            font-size: 11px;
            color: #004633;
            margin-bottom: 4px;
          }
          .rules-list {
            margin: 0;
            padding-left: 16px;
            font-size: 10px;
            color: #475569;
            line-height: 1.45;
          }
          .footer {
            margin-top: 15px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9.5px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <div class="logo-badge">অ</div>
            <div>
              <div class="brand-title">অভ্যাস (Obhyash)</div>
              <div class="brand-sub">স্মার্ট পরীক্ষা প্রস্তুতি ও লাইভ এক্সাম প্ল্যাটফর্ম</div>
            </div>
          </div>
          <div class="exam-badge">
            ${trackBadge}<br>
            <span style="font-size: 10.5px; font-weight: normal; color: #475569;">লাইভ পরীক্ষার অফিশিয়াল রুটিন</span>
          </div>
        </div>

        <div class="routine-title">${trackLabel} - সাপ্তাহিক লাইভ পরীক্ষা ও সিলেবাস ২০২৬-২৭</div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">নং</th>
              <th style="width: 17%;">তারিখ ও বার</th>
              <th style="width: 18%;">পরীক্ষার নাম ও বিষয়</th>
              <th style="width: 46%;">সিলেবাস (অন্তর্ভুক্ত অধ্যায়সমূহ)</th>
              <th style="width: 14%; text-align: center;">নম্বর ও সময়</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, idx) => {
              const isMega = item.examName.toLowerCase().includes("mega") || item.examName.toLowerCase().includes("mock");
              return `
              <tr class="${isMega ? 'mega-row' : ''}">
                <td style="text-align: center; font-weight: bold; color: #004633;">${idx + 1}</td>
                <td>
                  <strong>${item.date}</strong><br>
                  <span style="color: #64748b; font-size: 10px;">${item.dayName}</span>
                </td>
                <td>
                  <strong style="color: #0f172a;">${item.examName}</strong><br>
                  <span style="font-size: 10.5px; color: #004633; font-weight: 600;">${item.subject}</span>
                </td>
                <td>
                  ${item.chapters.map(ch => `<span class="chapter-pill">${ch}</span>`).join('')}
                </td>
                <td style="text-align: center;">
                  <strong style="color: #004633;">${item.totalMarks} মার্কস</strong><br>
                  <span style="color: #64748b; font-size: 10px;">${item.durationMinutes} মিনিট</span>
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>

        <div class="rules-box">
          <div class="rules-header">পরীক্ষার্থীদের জন্য বিশেষ নির্দেশাবলী:</div>
          <ul class="rules-list">
            <li>সাপ্তাহিক লাইভ পরীক্ষা প্রতি রবিবার, মঙ্গলবার ও বৃহস্পতিবার এবং শুক্রবার রাত ৮:০০ টা থেকে রাত ১১:০০ টা পর্যন্ত যেকোনো সময় দেওয়া যাবে।</li>
            <li>প্রতিটি ভুল উত্তরের জন্য ০.২৫ নম্বর নেগেটিভ মার্কিং প্রযোজ্য হবে।</li>
            <li>লাইভ উইন্ডো শেষ হওয়ার পর পূর্ণাঙ্গ বিস্তারিত সমাধান ও অল-বাংলাদেশ সেন্ট্রাল মেধা তালিকা (Leaderboard) প্রকাশিত হবে।</li>
          </ul>
        </div>

        <div class="footer">
          <div>মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD')} | © অভ্যাস (Obhyash) এডুকেশন</div>
          <div>ওয়েবসাইট: www.obhyash.com • রুটিন সোর্স: Google Sheets Live Sync</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success("রুটিন PDF প্রিন্ট / ডাউনলোড উইন্ডো খোলা হয়েছে!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#004633]/10 dark:bg-emerald-500/10 text-[#004633] dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#004633] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                    অফিশিয়াল লাইভ রুটিন
                  </span>
                  <span className="text-[11px] text-neutral-500 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    ২০২৬-২৭ সেশন
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white mt-0.5">
                  ভর্তি পরীক্ষা রুটিন ও পূর্ণাঙ্গ সিলেবাস
                </h3>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Track Switcher Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {TRACKS.map((t) => {
              const isActive = activeTrack === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTrack(t.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#004633] text-white shadow-sm"
                      : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60"
                  }`}
                >
                  <span>{t.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isActive ? "bg-white/20 text-white" : "bg-neutral-100 dark:bg-neutral-900 text-neutral-500"
                  }`}>
                    {t.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-neutral-100/60 dark:bg-neutral-900/40 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="অধ্যায় বা বিষয় খুঁজুন (উদা: ভেক্টর, সমাণুতা)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-[#004633] dark:focus:border-emerald-500 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
            />
          </div>

          <div className="text-[11px] font-bold text-neutral-500 shrink-0">
            {loading ? "তথ্য আসছে..." : `মোট ${filteredItems.length} টি পরীক্ষা`}
          </div>
        </div>

        {/* Modal Body: Routine Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-7 h-7 text-[#004633] animate-spin mx-auto opacity-80" />
              <p className="text-xs text-neutral-500 font-medium">
                গুগল শিট থেকে রুটিন লোড করা হচ্ছে...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                কোনো পরীক্ষা পাওয়া যায়নি!
              </p>
              <p className="text-xs text-neutral-400">
                অন্য কোনো শব্দ দিয়ে সার্চ করুন অথবা ফিল্টার পরিবর্তন করুন।
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isMega = item.examName.toLowerCase().includes("mega") || item.examName.toLowerCase().includes("mock");

              return (
                <div
                  key={item.id}
                  className={`border rounded-2xl p-4 transition-all shadow-xs ${
                    isMega
                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60"
                      : "bg-white dark:bg-[#181920] border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        isMega
                          ? "bg-[#004633] text-white"
                          : "bg-neutral-100 dark:bg-neutral-800 text-[#004633] dark:text-emerald-400"
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm sm:text-base">
                            {item.examName}
                          </h4>
                          {isMega && (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                              উইকলি মেগা টেস্ট
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-medium">
                          <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{item.date}</span>
                          <span>•</span>
                          <span>{item.dayName}</span>
                          <span>•</span>
                          <span className="text-[#004633] dark:text-emerald-400 font-bold">{item.subject}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                      <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/50">
                        {item.durationMinutes} মিনিট
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#004633]/10 dark:bg-emerald-500/10 text-[#004633] dark:text-emerald-400 border border-[#004633]/20 dark:border-emerald-500/20">
                        পূর্ণমান: {item.totalMarks}
                      </span>
                    </div>
                  </div>

                  {/* Syllabus Section */}
                  <div className="bg-neutral-50/80 dark:bg-neutral-900/60 rounded-xl p-2.5 sm:p-3 border border-neutral-100 dark:border-neutral-800/80">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1.5">
                      <BookOpen className="w-3 h-3" />
                      <span>সিলেবাসের বিস্তারিত অধ্যায়:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.chapters.map((ch, chIdx) => (
                        <span
                          key={chIdx}
                          className="text-[11px] font-medium bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 px-2.5 py-1 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs leading-relaxed"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleDownloadRoutinePdf}
            disabled={loading || items.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#004633] dark:text-emerald-400" />
            <span>{TRACKS.find(t => t.key === activeTrack)?.label} রুটিন ডাউনলোড (PDF)</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#004633] hover:bg-[#003828] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-950/20"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};

export default LiveExamRoutineModal;
