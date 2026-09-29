"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Download,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  LiveExamRoutineService,
  GoogleSheetRoutineItem,
} from "@/services/live-exam-routine-service";

interface LiveExamRoutinePageViewProps {
  categoryTitle: string;
  onBack: () => void;
}

export const LiveExamRoutinePageView: React.FC<LiveExamRoutinePageViewProps> = ({
  categoryTitle,
  onBack,
}) => {
  const sheetName = LiveExamRoutineService.getSheetNameFromCategory(categoryTitle);

  const [items, setItems] = useState<GoogleSheetRoutineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    LiveExamRoutineService.fetchRoutine(sheetName)
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
  }, [sheetName]);

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

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <title>Obhyash - ${categoryTitle} Live Routine 2026-27 (Google Sheet)</title>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
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
            padding: 4px;
            font-size: 11px;
            font-weight: 400;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #004633;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .brand-logo {
            height: 38px;
            width: auto;
          }
          .brand-title {
            font-size: 16px;
            font-weight: 700;
            color: #004633;
            line-height: 1.15;
          }
          .brand-sub {
            font-size: 9.5px;
            color: #64748b;
          }
          .badge {
            background: #e8f5e9;
            color: #004633;
            border: 1px solid #a5d6a7;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 10.5px;
            font-weight: 700;
            text-align: right;
          }
          .badge-sub {
            font-size: 8.5px;
            font-weight: 400;
            color: #2e7d32;
          }
          .routine-title-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 6px 10px;
            border-radius: 6px;
            margin-bottom: 10px;
            font-size: 12px;
            font-weight: 700;
            color: #004633;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 10.5px;
          }
          th {
            background: #004633;
            color: #fff;
            font-weight: 600;
            padding: 6px 7px;
            text-align: left;
            border: 1px solid #004633;
            font-size: 10.5px;
          }
          td {
            padding: 5px 7px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
            font-weight: 400;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .mega-row {
            background: #f0fdf4 !important;
            font-weight: 600;
          }
          .rules-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 7px 10px;
            margin-top: 8px;
          }
          .rules-header {
            font-weight: 600;
            font-size: 10.5px;
            color: #004633;
            margin-bottom: 3px;
          }
          .rules-list {
            margin: 0;
            padding-left: 15px;
            font-size: 9.5px;
            color: #475569;
            line-height: 1.4;
          }
          .footer {
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <img src="/obhyash_full_logo.png" class="brand-logo" alt="Obhyash" onerror="this.style.display='none'">
            <div>
              <div class="brand-title">অভ্যাস (Obhyash) - লাইভ এক্সাম শিডিউল</div>
              <div class="brand-sub">স্মার্ট পরীক্ষা প্রস্তুতি ও লাইভ এক্সাম প্ল্যাটফর্ম • obhyash.com</div>
            </div>
          </div>
          <div class="badge">
            অফিশিয়াল লাইভ রুটিন<br>
            <span class="badge-sub">Google Sheets লাইভ সিঙ্ক</span>
          </div>
        </div>

        <div class="routine-title-bar">
          <div>${categoryTitle} - সাপ্তাহিক লাইভ পরীক্ষা ও সিলেবাস ২০২৬-২৭</div>
          <div style="font-size: 10px; font-weight: 600; color: #166534;">পরীক্ষার সময়: রাত ৮:০০ টা - রাত ১১:০০ টা</div>
        </div>

        <!-- 6 Columns matching Google Sheet Exactly -->
        <table>
          <thead>
            <tr>
              <th style="width: 14%;">তারিখ (Date)</th>
              <th style="width: 9%;">বার (Day)</th>
              <th style="width: 17%;">পরীক্ষার নাম</th>
              <th style="width: 15%;">বিষয়</th>
              <th style="width: 33%;">সিলেবাস (Syllabus)</th>
              <th style="width: 12%; text-align: center;">নম্বর ও সময়</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, idx) => {
              const isMega = item.examName.toLowerCase().includes("mega") || item.examName.toLowerCase().includes("mock");
              return `
              <tr class="${isMega ? "mega-row" : ""}">
                <td>
                  <strong>${item.date}</strong>
                </td>
                <td style="color: #475569;">
                  ${item.dayName}
                </td>
                <td>
                  <strong style="color: ${isMega ? "#004633" : "#0f172a"};">${item.examName}</strong>
                </td>
                <td style="color: ${isMega ? "#004633" : "#1e293b"}; font-weight: ${isMega ? "600" : "400"};">
                  ${item.subject}
                </td>
                <td style="line-height: 1.35; color: #1e293b;">
                  ${item.chapters.join("; ")}
                </td>
                <td style="text-align: center;">
                  <strong style="color: #004633;">${item.totalMarks} মার্কস</strong><br>
                  <span style="color: #64748b; font-size: 9.5px;">${item.durationMinutes} মিনিট</span>
                </td>
              </tr>
            `;
            }).join("")}
          </tbody>
        </table>

        <div class="rules-box">
          <div class="rules-header">📌 পরীক্ষার্থীদের জন্য নির্দেশাবলী:</div>
          <ul class="rules-list">
            <li>সাপ্তাহিক লাইভ পরীক্ষা প্রতি রবিবার, মঙ্গলবার, বৃহস্পতিবার এবং শুক্রবার রাত ৮:০০ টা থেকে রাত ১১:০০ টা পর্যন্ত যেকোনো সময় দেওয়া যাবে।</li>
            <li>প্রতিটি ভুল উত্তরের জন্য ০.২৫ নম্বর নেগেটিভ মার্কিং কর্তন করা হবে।</li>
            <li>লাইভ উইন্ডো শেষ হওয়ার পর পূর্ণাঙ্গ বিস্তারিত সমাধান ও অল-বাংলাদেশ সেন্ট্রাল মেধা তালিকা (Leaderboard) প্রকাশিত হবে।</li>
          </ul>
        </div>

        <div class="footer">
          <div>মুদ্রণের তারিখ: ${new Date().toLocaleDateString("bn-BD")} | © অভ্যাস (Obhyash) এডুকেশন</div>
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
    <div className="space-y-4 font-['HindSiliguri'] font-normal text-black dark:text-white animate-in fade-in duration-200">
      {/* Top Header Bar with Back Button & Download Icon */}
      <div className="bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] rounded-xl p-4 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            title="ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-normal text-black dark:text-white">
              {categoryTitle} - পরীক্ষার রুটিন ও সিলেবাস
            </h1>
          </div>
        </div>

        {/* Clean Black/White Download Button */}
        <button
          type="button"
          onClick={handleDownloadRoutinePdf}
          disabled={loading || items.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-black dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-normal transition-all cursor-pointer disabled:opacity-50"
          title="রুটিন PDF ডাউনলোড করুন"
        >
          <Download className="w-4 h-4 text-black dark:text-white" />
          <span>PDF ডাউনলোড</span>
        </button>
      </div>

      {/* Real Table with Sticky Header */}
      <div className="bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-7 h-7 text-black dark:text-white animate-spin mx-auto opacity-70" />
            <p className="text-xs text-neutral-500 font-normal">
              গুগল শিট থেকে রুটিন লোড করা হচ্ছে...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <p className="text-sm font-normal text-neutral-700 dark:text-neutral-300">
              কোনো পরীক্ষা পাওয়া যায়নি!
            </p>
          </div>
        ) : (
          <div className="w-full max-h-[72vh] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-10 bg-[#0f172a] text-white shadow-xs">
                <tr className="text-[12px] font-normal">
                  <th className="py-3 px-3 text-center w-12 font-normal text-white">নং</th>
                  <th className="py-3 px-3.5 w-32 font-normal text-white">তারিখ ও বার</th>
                  <th className="py-3 px-3.5 w-40 font-normal text-white">পরীক্ষা ও বিষয়</th>
                  <th className="py-3 px-3.5 font-normal text-white">সিলেবাস (অধ্যায়সমূহ)</th>
                  <th className="py-3 px-3.5 text-center w-28 font-normal text-white">নম্বর ও সময়</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-[12px] font-normal">
                {items.map((item, index) => {
                  const isMega =
                    item.examName.toLowerCase().includes("mega") ||
                    item.examName.toLowerCase().includes("mock");

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isMega
                          ? "bg-neutral-100/80 dark:bg-neutral-800/60"
                          : index % 2 === 0
                          ? "bg-white dark:bg-[#13151F]"
                          : "bg-neutral-50 dark:bg-[#171926]/50"
                      } hover:bg-neutral-100/50 dark:hover:bg-neutral-800/30`}
                    >
                      {/* নং */}
                      <td className="py-3.5 px-3 text-center font-normal text-neutral-500">
                        {index + 1}
                      </td>

                      {/* তারিখ ও বার */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-normal text-black dark:text-white">
                          {item.date}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-normal">
                          {item.dayName}
                        </div>
                      </td>

                      {/* পরীক্ষা ও বিষয় */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-normal text-black dark:text-white">
                          {item.examName}
                        </div>
                        <div className="text-[11px] text-black dark:text-white font-normal">
                          {item.subject}
                        </div>
                        {isMega && (
                          <span className="inline-block mt-1 text-[9px] font-normal uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black px-1.5 py-0.2 rounded">
                            মেগা টেস্ট
                          </span>
                        )}
                      </td>

                      {/* সিলেবাস */}
                      <td className="py-3.5 px-3.5 leading-relaxed text-black dark:text-white font-normal">
                        {item.chapters.join("; ")}
                      </td>

                      {/* নম্বর ও সময় */}
                      <td className="py-3.5 px-3.5 text-center">
                        <div className="text-black dark:text-white font-normal text-xs">
                          {item.totalMarks} নম্বর
                        </div>
                        <div className="text-[11px] text-neutral-500 font-normal">
                          {item.durationMinutes} মিনিট
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
    </div>
  );
};

export default LiveExamRoutinePageView;
