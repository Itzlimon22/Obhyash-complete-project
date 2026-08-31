"use client";

import React, { useState } from "react";
import { 
  X, 
  Calendar, 
  BookOpen, 
  Clock, 
  Award, 
  Download, 
  CheckCircle,
  ChevronRight,
  GraduationCap
} from "lucide-react";
import { toast } from "sonner";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";

interface RoutineItem {
  id: string;
  date: string;
  dayName: string;
  time: string;
  subject: string;
  paper: string;
  chapters: string[];
  totalMarks: number;
  durationMinutes: number;
  status: "completed" | "ongoing" | "upcoming";
}

interface LiveExamRoutineModalProps {
  categoryTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectExam?: (examTitle: string) => void;
}

export const LiveExamRoutineModal: React.FC<LiveExamRoutineModalProps> = ({
  categoryTitle,
  isOpen,
  onClose,
  onSelectExam,
}) => {
  if (!isOpen) return null;

  const isHSC = categoryTitle.toLowerCase().includes("hsc") || categoryTitle.includes("এইচএসসি");

  // Tailored Routine based on SSC vs HSC
  const routineData: RoutineItem[] = isHSC
    ? [
        {
          id: "hsc-1",
          date: "১৮ আগস্ট ২০২৬",
          dayName: "মঙ্গলবার",
          time: "রাত ৮:০০ - ৯:০০",
          subject: "পদার্থবিজ্ঞান ১ম পত্র",
          paper: "১ম পত্র",
          chapters: ["অধ্যায় ২: ভেক্টর", "অধ্যায় ৩: গতিবিদ্যা"],
          totalMarks: 50,
          durationMinutes: 45,
          status: "upcoming",
        },
        {
          id: "hsc-2",
          date: "২০ আগস্ট ২০২৬",
          dayName: "বৃহস্পতিবার",
          time: "রাত ৮:০০ - ৯:০০",
          subject: "রসায়ন ১ম পত্র",
          paper: "১ম পত্র",
          chapters: ["অধ্যায় ২: গুণগত রসায়ন", "অধ্যায় ৩: পর্যায়বৃত্ত ধর্ম"],
          totalMarks: 50,
          durationMinutes: 45,
          status: "upcoming",
        },
        {
          id: "hsc-3",
          date: "২২ আগস্ট ২০২৬",
          dayName: "শনিবার",
          time: "রাত ৮:০০ - ৯:০০",
          subject: "উচ্চতর গণিত ১ম পত্র",
          paper: "১ম পত্র",
          chapters: ["অধ্যায় ১: ম্যাট্রিক্স ও নির্ণায়ক", "অধ্যায় ৯: অন্তরীকরণ"],
          totalMarks: 50,
          durationMinutes: 45,
          status: "upcoming",
        },
        {
          id: "hsc-4",
          date: "২৪ আগস্ট ২০২৬",
          dayName: "সোমবার",
          time: "রাত ৮:০০ - ৯:০০",
          subject: "জীববিজ্ঞান ১ম পত্র (উদ্ভিদবিজ্ঞান)",
          paper: "১ম পত্র",
          chapters: ["অধ্যায় ১: কোষ ও এর গঠন", "অধ্যায় ৪: অণুজীব"],
          totalMarks: 50,
          durationMinutes: 45,
          status: "upcoming",
        },
        {
          id: "hsc-5",
          date: "২৬ আগস্ট ২০২৬",
          dayName: "বুধবার",
          time: "রাত ৮:০০ - ৯:০০",
          subject: "তথ্য ও যোগাযোগ প্রযুক্তি (ICT)",
          paper: "আবশ্যিক",
          chapters: ["অধ্যায় ৩: সংখ্যা পদ্ধতি ও ডিজিটাল ডিভাইস", "অধ্যায় ৪: ওয়েব ডিজাইন ও HTML"],
          totalMarks: 50,
          durationMinutes: 40,
          status: "upcoming",
        },
      ]
    : [
        {
          id: "ssc-1",
          date: "১৮ আগস্ট ২০২৬",
          dayName: "মঙ্গলবার",
          time: "সন্ধ্যা ৭:৩০ - ৮:৩০",
          subject: "পদার্থবিজ্ঞান",
          paper: "সাধারণ",
          chapters: ["অধ্যায় ২: গতি", "অধ্যায় ৩: বল"],
          totalMarks: 40,
          durationMinutes: 40,
          status: "upcoming",
        },
        {
          id: "ssc-2",
          date: "২০ আগস্ট ২০২৬",
          dayName: "বৃহস্পতিবার",
          time: "সন্ধ্যা ৭:৩০ - ৮:৩০",
          subject: "রসায়ন",
          paper: "সাধারণ",
          chapters: ["অধ্যায় ৩: পদার্থের গঠন", "অধ্যায় ৪: পর্যায় সারণি"],
          totalMarks: 40,
          durationMinutes: 40,
          status: "upcoming",
        },
        {
          id: "ssc-3",
          date: "২২ আগস্ট ২০২৬",
          dayName: "শনিবার",
          time: "সন্ধ্যা ৭:৩০ - ৮:৩০",
          subject: "সাধারণ গণিত",
          paper: "সাধারণ",
          chapters: ["অধ্যায় ২: সেট ও ফাংশন", "অধ্যায় ৩: বীজগাণিতিক রাশি"],
          totalMarks: 40,
          durationMinutes: 40,
          status: "upcoming",
        },
        {
          id: "ssc-4",
          date: "২৪ আগস্ট ২০২৬",
          dayName: "সোমবার",
          time: "সন্ধ্যা ৭:৩০ - ৮:৩০",
          subject: "জীববিজ্ঞান",
          paper: "সাধারণ",
          chapters: ["অধ্যায় ১: জীবন পাঠ", "অধ্যায় ২: জীব কোষ ও টিস্যু"],
          totalMarks: 40,
          durationMinutes: 40,
          status: "upcoming",
        },
        {
          id: "ssc-5",
          date: "২৬ আগস্ট ২০২৬",
          dayName: "বুধবার",
          time: "সন্ধ্যা ৭:৩০ - ৮:৩০",
          subject: "উচ্চতর গণিত",
          paper: "ঐচ্ছিক",
          chapters: ["অধ্যায় ১: সেট ও ফাংশন", "অধ্যায় ৭: অসীম ধারা"],
          totalMarks: 40,
          durationMinutes: 40,
          status: "upcoming",
        },
      ];

  const handleDownloadRoutinePdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("পপ-আপ ব্লক করা হয়েছে। অনুগ্রহ করে পপ-আপ অনুমোদন করুন।");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <title>Obhyash - ${categoryTitle} Routine & Syllabus</title>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Hind Siliguri', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #1e293b;
            background: #fff;
            margin: 0;
            padding: 10px;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2.5px solid #0B6B42;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo-badge {
            width: 42px;
            height: 42px;
            background: #0B6B42;
            color: #fff;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 20px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 800;
            color: #0B6B42;
            line-height: 1.1;
          }
          .brand-sub {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
          }
          .exam-badge {
            background: #ecfdf5;
            color: #0B6B42;
            border: 1px solid #a7f3d0;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 700;
            text-align: right;
          }
          .routine-title {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 14px 0;
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12.5px;
          }
          th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-align: left;
            padding: 9px 10px;
            border: 1px solid #cbd5e1;
          }
          td {
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .subject-col {
            font-weight: 700;
            color: #0f172a;
            font-size: 13px;
          }
          .chapter-pill {
            display: inline-block;
            background: #ecfdf5;
            color: #065f46;
            border: 1px solid #a7f3d0;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            margin: 2px 3px 2px 0;
            font-weight: 500;
          }
          .rules-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 12px 16px;
            margin-top: 15px;
          }
          .rules-header {
            font-weight: 700;
            font-size: 12px;
            color: #0B6B42;
            margin-bottom: 6px;
          }
          .rules-list {
            margin: 0;
            padding-left: 18px;
            font-size: 11px;
            color: #475569;
            line-height: 1.5;
          }
          .footer {
            margin-top: 25px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10.5px;
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
              <div class="brand-sub">স্মার্ট পরীক্ষা প্রস্তুতি প্ল্যাটফর্ম</div>
            </div>
          </div>
          <div class="exam-badge">
            ${isHSC ? 'HSC ২০২৫-২৬ একাডেমিক' : 'SSC ২০২৫-২৬ একাডেমিক'}<br>
            <span style="font-size: 11px; font-weight: normal; color: #475569;">লাইভ পরীক্ষার সময়সূচী</span>
          </div>
        </div>

        <h2 class="routine-title">${categoryTitle} - পরীক্ষার রুটিন ও সিলেবাস</h2>

        <table>
          <thead>
            <tr>
              <th style="width: 6%; text-align: center;">নং</th>
              <th style="width: 22%;">তারিখ ও সময়</th>
              <th style="width: 26%;">বিষয় ও পত্র</th>
              <th style="width: 34%;">সিলেবাস (অধ্যায়সমূহ)</th>
              <th style="width: 12%; text-align: center;">নম্বর / সময়</th>
            </tr>
          </thead>
          <tbody>
            ${routineData.map((item, idx) => `
              <tr>
                <td style="text-align: center; font-weight: bold; color: #0B6B42;">${idx + 1}</td>
                <td>
                  <strong>${item.date}</strong><br>
                  <span style="color: #64748b; font-size: 11px;">(${item.dayName}) ${item.time}</span>
                </td>
                <td class="subject-col">
                  ${BanglaNameHelper.formatSubject(item.subject)}<br>
                  <span style="font-weight: 500; font-size: 11px; color: #64748b;">${item.paper}</span>
                </td>
                <td>
                  ${item.chapters.map(ch => `<span class="chapter-pill">${ch}</span>`).join('')}
                </td>
                <td style="text-align: center; font-weight: 600;">
                  <span style="color: #0B6B42; font-weight: 700;">${item.totalMarks} নম্বর</span><br>
                  <span style="color: #64748b; font-size: 11px;">${item.durationMinutes} মিনিট</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="rules-box">
          <div class="rules-header">পরীক্ষার্থীদের জন্য বিশেষ নির্দেশাবলী:</div>
          <ul class="rules-list">
            <li>লাইভ পরীক্ষা নির্ধারিত সময়ে শুরু হবে এবং নির্ধারিত সময় অতিবাহিত হওয়ার পর উত্তরপত্র স্বয়ংক্রিয়ভাবে জমা হয়ে যাবে।</li>
            <li>প্রতিটি ভুল উত্তরের জন্য ০.২৫ নম্বর নেগেটিভ মার্কিং প্রযোজ্য হবে।</li>
            <li>পরীক্ষার সময় শেষ হওয়ার সাথে সাথে পূর্ণাঙ্গ সমাধান ও মেধা তালিকা (Leaderboard) উন্মুক্ত করা হবে।</li>
            <li>যেকোনো সহায়তার জন্য অভ্যাস মোবাইল অ্যাপ অথবা ওয়েবসাইট (obhyash.com) ভিজিট করুন।</li>
          </ul>
        </div>

        <div class="footer">
          <div>মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD')} | © অভ্যাস (Obhyash) এডুকেশন</div>
          <div>ওয়েবসাইট: www.obhyash.com</div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-[#0B6B42] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                  {isHSC ? "HSC ২০২৫-২৬" : "SSC ২০২৫-২৬"}
                </span>
                <span className="text-xs text-neutral-500 font-medium">একাডেমিক রুটিন</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white mt-0.5">
                {categoryTitle} - পরীক্ষার সময়সূচী ও সিলেবাস
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

        {/* Modal Body: Routine List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 uppercase tracking-wider px-1">
            <span>আসন্ন লাইভ পরীক্ষাসমূহ</span>
            <span>মোট {routineData.length} টি পরীক্ষা</span>
          </div>

          <div className="space-y-3">
            {routineData.map((item, index) => (
              <div
                key={item.id}
                className="bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#0B6B42] dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-100 dark:border-emerald-800/30">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-neutral-900 dark:text-white text-base">
                        {BanglaNameHelper.formatSubject(item.subject)}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                        <span>{item.date} ({item.dayName})</span>
                        <span>•</span>
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    <span className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800">
                      {item.durationMinutes} মিনিট
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800">
                      পূর্ণমান: {item.totalMarks}
                    </span>
                  </div>
                </div>

                {/* Chapter Syllabus breakdown */}
                <div className="bg-neutral-50 dark:bg-neutral-800/40 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>সিলেবাসে অন্তর্ভুক্ত অধ্যায়সমূহ:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.chapters.map((ch, chIdx) => (
                      <span
                        key={chIdx}
                        className="text-xs font-medium bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-xs"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleDownloadRoutinePdf}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-sm font-bold transition-all shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>রুটিন ডাউনলোড (PDF)</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#0B6B42] hover:bg-[#095937] text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-800/20"
          >
            ঠিক আছে
          </button>
        </div>

      </div>
    </div>
  );
};

export default LiveExamRoutineModal;
