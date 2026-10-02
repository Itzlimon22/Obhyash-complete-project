'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  Printer,
  Download,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Layers,
  Settings,
  Sparkles,
  Sliders,
  AlignJustify,
} from 'lucide-react';
import { GeneratorSettings } from '@/lib/pdf-generator/types';

export default function PdfGeneratorPage() {
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cover' | 'header' | 'footer' | 'layout'>('layout');

  const [stats, setStats] = useState<{
    totalPages: number;
    totalCards: number;
    fillPercentage: number;
    overflows: Array<[string, number]>;
  } | null>(null);

  const [parseNotice, setParseNotice] = useState<{
    count: number;
    type: string;
    warnings: string[];
  } | null>(null);

  const [settings, setSettings] = useState<GeneratorSettings>({
    title: 'মেডিকেল ভর্তি মডেল টেস্ট ০১',
    subtitle: 'রসায়ন, পদার্থ, জীববিজ্ঞান, ইংরেজি ও সাধারণ জ্ঞান • MCQ সমাধান শীট',
    hasHeader: true,
    density: 'balanced',
    balanceColumns: true,
    headerLeftText: 'অ্যাপ ইনস্টল করো',
    headerLeftUrl: 'https://play.google.com/store/apps/details?id=com.obhyash.app',
    headerRightText: '',
    showHeaderLeftIcon: true,
    footerLeftPrefix: 'আনলিমিটেড এক্সাম দাও',
    footerSiteText: 'www.obhyash.com',
    footerLeftUrl: 'https://www.obhyash.com',
    footerLeftSuffix: 'এ',
    footerPagePrefix: 'পৃষ্ঠা',
    useBanglaDigits: true,
    pageOffset: 0,
  });

  const [zoomLevel, setZoomLevel] = useState(85);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OBHYASH_PDF_READY') {
        setStats({
          totalPages: event.data.totalPages,
          totalCards: event.data.totalCards,
          fillPercentage: event.data.fillPercentage,
          overflows: event.data.overflows || [],
        });
        setLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    // Auto set title if filename matches
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    if (nameWithoutExt.toLowerCase().includes('model_test_01') || nameWithoutExt.includes('০১')) {
      setSettings(prev => ({ ...prev, title: 'মেডিকেল ভর্তি মডেল টেস্ট ০১' }));
    } else if (nameWithoutExt.toLowerCase().includes('model_test_02') || nameWithoutExt.includes('০২')) {
      setSettings(prev => ({ ...prev, title: 'মেডিকেল ভর্তি মডেল টেস্ট ০২' }));
    } else if (nameWithoutExt.toLowerCase().includes('model_test_03') || nameWithoutExt.includes('০৩')) {
      setSettings(prev => ({ ...prev, title: 'মেডিকেল ভর্তি মডেল টেস্ট ০৩' }));
    }

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setInputText(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = async () => {
    setLoading(true);
    try {
      const sampleText = `#1
Q টেরিসের স্পোরাঞ্জিয়া একত্রিত হয়ে পত্রকের কিনারায় কী গঠন করে?
a সোরাস (Sorus)
b ফলস ইন্ডুসিয়াম (False indusium)
c স্পোরোফিল (Sporophyll)
d অমরা (Placenta)
A ক
E গাজী আজমল ও আবুল হাসান স্যারের জীববিজ্ঞান ১ম পত্র (উদ্ভিদবিজ্ঞান) বইয়ের 'pteridophyta' অধ্যায় অনুযায়ী, টেরিস (Pteris) উদ্ভিদের স্পোর উৎপাদনকারী অঙ্গ হলো স্পোরাঞ্জিয়াম (Sporangium)। এই স্পোরাঞ্জিয়াগুলো একত্রিত হয়ে পত্রকের কিনারায় যে পুঞ্জ বা গুচ্ছ গঠন করে, তাকে সোরাস (Sorus) বলে। পত্রকের কিনারা ভেতরের দিকে বেঁকে গিয়ে সোরাসগুলোকে ঢেকে রাখে, যাকে ফলস ইন্ডুসিয়াম (False indusium) বলা হয়। আর যে পাতায় সোরাস উৎপন্ন হয় তাকে স্পোরোফিল (Sporophyll) বলে।
#2
Q Fill in the gap using word that best completes the sentence. I do not know ___.
a where he does live
b where is he live
c where he lives
d where does he live
A গ
E This question is based on the rule of 'Embedded Questions'. When a direct question (e.g., 'Where does he live?') is placed inside another clause or sentence (e.g., 'I do not know...'), it becomes an embedded question. In this case, the word order of the embedded clause changes from interrogative (Auxiliary + Subject + Verb) to assertive (Subject + Verb). Therefore, 'where does he live' becomes 'where he lives'. Option (ক) is incorrect because 'does' is redundant here, and option (ঘ) incorrectly retains the interrogative structure.
#3
Q 250ml দ্রবণের মধ্যে কি পরিমাণ Na2CO3 দ্রবীভূত থাকলে তা 1M হবে?
a 25.6 g
b 26.5 g
c 27.6 g
d 27.5 g
A খ
E হাজারী ও নাগ স্যারের রসায়ন ২য় পত্রের 'পরিমাণগত রসায়ন' অধ্যায়ের সূত্রানুযায়ী,
আমরা জানি, দ্রবের ভর, $W = \\frac{S \\times M \\times V}{1000}$
এখানে,
মোলারিটি ($S$) = $1\\text{ M}$
দ্রবণের আয়তন ($V$) = $250\\text{ mL}$
$\\text{Na}_2\\text{CO}_3$ এর আণবিক ভর ($M$) = $(23 \\times 2) + 12 + (16 \\times 3) = 46 + 12 + 48 = 106\\text{ g/mol}$
মানগুলো সূত্রে বসিয়ে পাই:
$W = \\frac{1 \\times 106 \\times 250}{1000} = \\frac{106}{4} = 26.5\\text{ g}$
অতএব, ২৫০ মিলি ১ মোলার দ্রবণে ২৬.৫ গ্রাম সোডিয়াম কার্বনেট দ্রবীভূত থাকে।
#4
Q পরমাণুর ভরের ক্ষুদ্রতম একক নিচের কোনটি?
a mole
b Gram
c 1 amu
d Kilogram
A গ
E পরমাণুর অতি ক্ষুদ্র ভর পরিমাপের জন্য আন্তর্জাতিকভাবে স্বীকৃত একক হলো 'amu' (Atomic Mass Unit)।
১ amu হলো একটি কার্বন-১২ ($^{12}\\text{C}$) আইসোটোপের ভরের $\\frac{1}{12}$ অংশ, যার মান প্রায় $1.66 \\times 10^{-24}\\text{ g}$ বা $1.66 \\times 10^{-27}\\text{ kg}$।
গ্রাম, কিলোগ্রাম বা মোল পরমাণুর ভরের তুলনায় অনেক বড় একক। তাই পরমাণুর ভরের ক্ষুদ্রতম একক হলো 1 amu।
#5
Q যদি পরিবহন ব্যান্ড ওজন ব্যান্ডের মধ্যে কোনো নিষিদ্ধ অঞ্চল না থাকে তবে পদার্থটি-
a অর্ধপরিবাহী
b অপরিবাহী
c কুপরিবাহী
d সুপরিবাহী
A ঘ
E পদার্থবিজ্ঞান ২য় পত্রের 'সেমিকন্ডাক্টর ও ইলেকট্রনিক্স' অধ্যায় অনুযায়ী, পরিবাহী বা সুপরিবাহী (Conductor) পদার্থের ক্ষেত্রে যোজন ব্যান্ড (Valence band) এবং পরিবহন ব্যান্ড (Conduction band) পরস্পর ওভারল্যাপ বা উপরিপাতিত অবস্থায় থাকে। এদের মাঝে কোনো নিষিদ্ধ শক্তি ব্যবধান বা নিষিদ্ধ অঞ্চল (Forbidden energy gap) থাকে না। ফলে যোজন ব্যান্ডের ইলেকট্রনগুলো খুব সহজেই পরিবহন ব্যান্ডে চলে যেতে পারে এবং বিদ্যুৎ পরিবহন করে।`;

      setInputText(sampleText);
      setFileName('sample_model_test_01.txt');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!inputText.trim()) {
      alert('অনুগ্রহ করে প্রশ্ন কনটেন্ট পেস্ট করুন অথবা ফাইল আপলোড করুন।');
      return;
    }

    setLoading(true);
    setStats(null);

    try {
      const res = await fetch('/api/admin/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputText,
          settings,
          format: 'html',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'প্রিভিউ তৈরি করতে ব্যর্থ হয়েছে।');
      }

      setParseNotice({
        count: data.questionsCount,
        type: data.detectedType === 'txt' ? 'data.txt' : 'Markdown (.md)',
        warnings: data.warnings || [],
      });

      setPreviewHtml(data.html);
    } catch (err: any) {
      alert(err.message || 'একটি ত্রুটি ঘটেছে');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!iframeRef.current?.contentWindow) {
      alert('প্রথমে প্রিভিউ তৈরি করুন।');
      return;
    }
    iframeRef.current.contentWindow.focus();
    iframeRef.current.contentWindow.print();
  };

  const handleDownloadPdf = async () => {
    if (!inputText.trim()) {
      alert('অনুগ্রহ করে প্রশ্ন কনটেন্ট পেস্ট করুন অথবা ফাইল আপলোড করুন।');
      return;
    }

    setDownloading(true);

    try {
      const res = await fetch('/api/admin/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputText,
          settings,
          format: 'pdf',
        }),
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${settings.title || 'Model_Test'}_Solution.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Serverless / Fallback mode: Trigger browser print
        const data = await res.json();
        if (data.html) {
          setPreviewHtml(data.html);
          setTimeout(() => {
            if (iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.focus();
              iframeRef.current.contentWindow.print();
            } else {
              handlePrint();
            }
          }, 600);
        } else {
          throw new Error(data.error || 'PDF রেন্ডার করা সম্ভব হয়নি।');
        }
      }
    } catch (err: any) {
      // If server error, fallback to client-side print
      if (previewHtml) {
        handlePrint();
      } else {
        alert(err.message || 'PDF তৈরির সময় একটি সমস্যা হয়েছে।');
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1700px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  মডেল টেস্ট PDF জেনারেটর
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  Zero-Gap Dynamic Engine
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                হেডার, ফুটার, ডেনসিটি ও স্মার্ট স্পেসিং কাস্টমাইজ করে কোনো অতিরিক্ত ফাঁকা জায়গা ছাড়াই নিখুঁত PDF তৈরি করুন।
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLoadSample}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 text-sm font-medium transition"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            নমুনা ডেটা লোড করুন
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls, Right Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Inputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* File Upload & Input Area */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-600" />
                প্রশ্নের ফাইল বা কনটেন্ট
              </h2>
              {fileName && (
                <span className="text-xs text-teal-600 dark:text-teal-400 font-medium truncate max-w-[200px]">
                  {fileName}
                </span>
              )}
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-400 rounded-xl p-5 text-center cursor-pointer transition bg-gray-50/50 dark:bg-gray-850/50 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                ক্লিক করে <span className="text-teal-600">.txt</span> বা <span className="text-teal-600">.md</span> ফাইল আপলোড করুন
              </p>
              <p className="text-xs text-gray-400 mt-1">
                data.txt (#1...) অথবা মেডিকেল মডেল টেস্ট Markdown (### প্রশ্ন ১...) ফরম্যাট
              </p>
            </div>

            {/* Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  অথবা সরাসরি টেক্সট পেস্ট করুন:
                </label>
                {inputText && (
                  <button
                    onClick={() => {
                      setInputText('');
                      setFileName('');
                      setParseNotice(null);
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    ক্লিয়ার করুন
                  </button>
                )}
              </div>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="#1&#10;Q টেরিসের স্পোরাঞ্জিয়া...&#10;a সোরাস&#10;b ফলস ইন্ডুসিয়াম...&#10;A ক&#10;E ব্যাখ্যা..."
                rows={5}
                className="w-full p-3 font-mono text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-teal-500 focus:outline-none transition resize-y"
              />
            </div>

            {/* Parser Status Notice */}
            {parseNotice && (
              <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>
                    শনাক্ত হয়েছে: {parseNotice.count}টি প্রশ্ন ({parseNotice.type})
                  </span>
                </div>
                {parseNotice.warnings.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-teal-200/60 dark:border-teal-800/40 space-y-0.5 text-amber-700 dark:text-amber-300">
                    {parseNotice.warnings.slice(0, 3).map((w, idx) => (
                      <p key={idx} className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span>{w}</span>
                      </p>
                    ))}
                    {parseNotice.warnings.length > 3 && (
                      <p className="text-[11px] opacity-75">
                        + আরো {parseNotice.warnings.length - 3}টি সতর্কতা
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Granular Customization Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-600" />
                হেডার, ফুটার ও লেআউট কন্ট্রোল
              </h2>
            </div>

            {/* Customization Tabs */}
            <div className="flex rounded-xl bg-gray-100 dark:bg-gray-900 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('layout')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  activeTab === 'layout'
                    ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                লেআউট ও ডেনসিটি
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cover')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  activeTab === 'cover'
                    ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                ১ম পৃষ্ঠা হেডার
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('header')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  activeTab === 'header'
                    ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                ২য়+ পৃষ্ঠা হেডার
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('footer')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  activeTab === 'footer'
                    ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                ফুটার ও পেজিং
              </button>
            </div>

            {/* Tab: Layout & Density (Solves Huge Gap) */}
            {activeTab === 'layout' && (
              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    লেআউট ডেনসিটি (Density & Card Fit)
                  </label>
                  <select
                    value={settings.density || 'balanced'}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        density: e.target.value as 'balanced' | 'compact' | 'spacious',
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="balanced">
                      ভারসাম্যপূর্ণ (Balanced - Recommended) • কোনো গ্যাপ নেই, ৫-৬ প্রশ্ন/পেজ
                    </option>
                    <option value="compact">
                      কম্প্যাক্ট (Compact) • ১৬ পৃষ্ঠায় ১০০ প্রশ্ন, সর্বোচ্চ স্পেস ব্যবহার
                    </option>
                    <option value="spacious">
                      প্রশস্ত (Spacious) • বড় ফন্ট (১৫.৫px), ছোট ব্যাখ্যাযুক্ত টেস্টের জন্য
                    </option>
                  </select>
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1">
                    * &apos;Balanced&apos; মোডে বড় ব্যাখ্যাযুক্ত প্রশ্নেও কলামের নিচের অতিরিক্ত ফাঁকা জায়গা (gap) পুরোপুরি দূর হয়ে যায়।
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-150 dark:border-gray-750">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.balanceColumns !== false}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          balanceColumns: e.target.checked,
                        }))
                      }
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                        স্মার্ট ভার্টিক্যাল স্পেস ব্যালেন্সিং
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 block">
                        কোনো কলামে কম কার্ড থাকলে নিচে বড় গ্যাপ ফেলে না রেখে কার্ডগুলোর মাঝে ফাঁকা জায়গা সমানভাবে ছড়িয়ে দেয়।
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Tab: Cover Header */}
            {activeTab === 'cover' && (
              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    ১ম পৃষ্ঠা কভার হেডার মোড
                  </label>
                  <select
                    value={settings.hasHeader ? 'true' : 'false'}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        hasHeader: e.target.value === 'true',
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="true">১ম পৃষ্ঠায় বড় ডার্ক টিল কভার হেডার (Part 1)</option>
                    <option value="false">শুধু মিনি হেডার দিয়ে শুরু (Continuation Part 2)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    প্রধান শিরোনাম (Main Title)
                  </label>
                  <input
                    type="text"
                    value={settings.title}
                    onChange={e =>
                      setSettings(prev => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="যেমন: মেডিকেল ভর্তি মডেল টেস্ট ০১"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    সাবটাইটেল (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={settings.subtitle}
                    onChange={e =>
                      setSettings(prev => ({ ...prev, subtitle: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="রসায়ন, পদার্থ, জীববিজ্ঞান, ইংরেজি ও সাধারণ জ্ঞান • MCQ সমাধান শীট"
                  />
                </div>
              </div>
            )}

            {/* Tab: Mini Header Left & Right */}
            {activeTab === 'header' && (
              <div className="space-y-3.5 pt-1">
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-150 dark:border-gray-750 space-y-2.5">
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-between">
                    <span>হেডার বাম পাশ (Header Left)</span>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer font-normal">
                      <input
                        type="checkbox"
                        checked={settings.showHeaderLeftIcon !== false}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            showHeaderLeftIcon: e.target.checked,
                          }))
                        }
                        className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                      />
                      <span>আইকন দেখাও</span>
                    </label>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={settings.headerLeftText}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          headerLeftText: e.target.value,
                        }))
                      }
                      placeholder="যেমন: অ্যাপ ইনস্টল করো"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
                      বাম পাশের ক্লিক লিংক (URL):
                    </label>
                    <input
                      type="text"
                      value={settings.headerLeftUrl}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          headerLeftUrl: e.target.value,
                        }))
                      }
                      placeholder="https://play.google.com/..."
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-150 dark:border-gray-750 space-y-1.5">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                    হেডার ডান পাশ (Header Right)
                  </span>
                  <input
                    type="text"
                    value={settings.headerRightText}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        headerRightText: e.target.value,
                      }))
                    }
                    placeholder={`ডিফল্ট: ${settings.title}`}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-400">
                    ফাঁকা রাখলে মূল শিরোনামটি স্বয়ংক্রিয়ভাবে ডান পাশে দেখাবে।
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Footer Left & Right */}
            {activeTab === 'footer' && (
              <div className="space-y-3.5 pt-1">
                {/* Footer Left */}
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-150 dark:border-gray-750 space-y-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                    ফুটার বাম পাশ (Footer Left Branding & Link)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block text-[11px] text-gray-500 mb-0.5">প্রিফিক্স:</label>
                      <input
                        type="text"
                        value={settings.footerLeftPrefix}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            footerLeftPrefix: e.target.value,
                          }))
                        }
                        placeholder="আনলিমিটেড এক্সাম দাও"
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] text-gray-500 mb-0.5">সাইট ডোমেইন:</label>
                      <input
                        type="text"
                        value={settings.footerSiteText}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            footerSiteText: e.target.value,
                          }))
                        }
                        placeholder="www.obhyash.com"
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] text-gray-500 mb-0.5">সাফিক্স:</label>
                      <input
                        type="text"
                        value={settings.footerLeftSuffix}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            footerLeftSuffix: e.target.value,
                          }))
                        }
                        placeholder="এ"
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-0.5">ফুটার ক্লিক URL:</label>
                    <input
                      type="text"
                      value={settings.footerLeftUrl}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          footerLeftUrl: e.target.value,
                        }))
                      }
                      placeholder="https://www.obhyash.com"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Footer Right (Page Numbers) */}
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-150 dark:border-gray-750 space-y-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                    ফুটার ডান পাশ (Page Numbering)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-0.5">পৃষ্ঠা লেবেল:</label>
                      <input
                        type="text"
                        value={settings.footerPagePrefix}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            footerPagePrefix: e.target.value,
                          }))
                        }
                        placeholder="পৃষ্ঠা"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-0.5">সংখ্যার ধরণ:</label>
                      <select
                        value={settings.useBanglaDigits ? 'true' : 'false'}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            useBanglaDigits: e.target.value === 'true',
                          }))
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        <option value="true">বাংলা (১, ২, ৩)</option>
                        <option value="false">ইংরেজি (1, 2, 3)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-0.5">শুরুর পৃষ্ঠা (Offset):</label>
                      <input
                        type="number"
                        min="0"
                        value={settings.pageOffset}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            pageOffset: Math.max(0, parseInt(e.target.value) || 0),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-750 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-60"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {loading ? 'প্রিভিউ তৈরি হচ্ছে...' : 'প্রিভিউ তৈরি করুন'}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={!previewHtml || loading}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-gray-700 dark:hover:bg-gray-600 font-semibold text-sm transition disabled:opacity-40"
                title="ব্রাউজার প্রিন্ট দিয়ে ভেক্টর PDF সেভ করুন"
              >
                <Printer className="w-4 h-4" />
                প্রিন্ট / সেভ PDF
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-sm transition disabled:opacity-40"
                title="হেডলেস ক্রোমিয়াম দিয়ে সরাসরি PDF ডাউনলোড"
              >
                {downloading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                ) : (
                  <Download className="w-4 h-4 text-teal-600" />
                )}
                ডাউনলোড
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: High Fidelity Live Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                লাইভ PDF প্রিভিউ
              </span>
              {stats && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 font-semibold">
                    {stats.totalCards}টি কার্ড
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-semibold">
                    {stats.totalPages} পৃষ্ঠা
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-medium">
                    ফিল: {stats.fillPercentage}%
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-medium ${
                      stats.overflows.length === 0
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                    }`}
                  >
                    ওভারফ্লো: {stats.overflows.length}
                  </span>
                </div>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold w-12 text-center text-gray-600 dark:text-gray-400">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(85)}
                className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 text-xs font-medium text-gray-600 dark:text-gray-300"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Preview Viewport Container */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 min-h-[750px] max-h-[880px] overflow-auto flex justify-center shadow-inner relative">
            {!previewHtml ? (
              <div className="m-auto text-center p-8 max-w-sm text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-600" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  কোনো প্রিভিউ লোড করা হয়নি
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  বামে ফাইল আপলোড করুন এবং &quot;প্রিভিউ তৈরি করুন&quot; ক্লিক করুন।
                </p>
              </div>
            ) : (
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="shadow-2xl rounded-sm overflow-hidden bg-white my-2"
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={previewHtml}
                  title="PDF Preview"
                  className="w-[794px] h-[1122px] border-0"
                  style={{
                    height: stats?.totalPages
                      ? `${stats.totalPages * 1122 + 40}px`
                      : '1122px',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
