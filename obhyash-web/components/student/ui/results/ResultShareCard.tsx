'use client';

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
  Download,
  Share2,
  Facebook,
  MessageCircle,
  Link2,
  X,
  CheckCircle2,
  Clock,
  BookOpen,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface ResultShareCardProps {
  percentage: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  finalScore: number;
  totalPoints: number;
  timeTaken: number; // seconds
  subjectLabel?: string;
  feedbackTitle: string;
  userName?: string;
}

const ResultShareCard = React.forwardRef<HTMLDivElement, ResultShareCardProps>(
  (
    {
      percentage,
      correctCount,
      wrongCount,
      skippedCount,
      finalScore,
      totalPoints,
      timeTaken,
      subjectLabel,
      feedbackTitle,
      userName,
    },
    ref,
  ) => {
    const mins = Math.floor(timeTaken / 60);
    const secs = timeTaken % 60;
    const totalQs = correctCount + wrongCount + skippedCount;

    const accent =
      percentage >= 70
        ? { ring: '#10b981', bg: '#f0fdf4', text: '#065f46', badge: '#dcfce7' }
        : percentage >= 40
          ? {
              ring: '#f59e0b',
              bg: '#fffbeb',
              text: '#92400e',
              badge: '#fef3c7',
            }
          : {
              ring: '#ef4444',
              bg: '#fef2f2',
              text: '#991b1b',
              badge: '#fee2e2',
            };

    return (
      <div
        ref={ref}
        style={{
          width: 480,
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
          borderRadius: 24,
          overflow: 'hidden',
          fontFamily: '"Hind Siliguri", "Noto Sans Bengali", sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: accent.ring,
            opacity: 0.12,
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: '#818cf8',
            opacity: 0.1,
            filter: 'blur(40px)',
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: accent.ring,
                marginBottom: 4,
              }}
            >
              Obhyash
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#f8fafc',
                lineHeight: 1.2,
              }}
            >
              {feedbackTitle}
            </div>
            {userName && (
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                {userName}
              </div>
            )}
          </div>
          {/* Big percentage ring */}
          <div
            style={{
              position: 'relative',
              width: 80,
              height: 80,
              flexShrink: 0,
            }}
          >
            <svg width={80} height={80} viewBox="0 0 80 80">
              <circle
                cx={40}
                cy={40}
                r={34}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={7}
              />
              <circle
                cx={40}
                cy={40}
                r={34}
                fill="none"
                stroke={accent.ring}
                strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray={213.6}
                strokeDashoffset={213.6 - (213.6 * percentage) / 100}
                transform="rotate(-90 40 40)"
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: '#f8fafc',
                  lineHeight: 1,
                }}
              >
                {percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Score row */}
        <div
          style={{
            margin: '20px 28px 0',
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>
              প্রাপ্ত নম্বর
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#f8fafc',
                lineHeight: 1,
              }}
            >
              {finalScore.toFixed(1)}
              <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>
                {' '}
                / {totalPoints}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>
              সময় লেগেছে
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>
              {mins}:{String(secs).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Stats pills */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            margin: '12px 28px 0',
          }}
        >
          {[
            {
              label: 'সঠিক',
              val: correctCount,
              color: '#10b981',
              bg: 'rgba(16,185,129,0.12)',
            },
            {
              label: 'ভুল',
              val: wrongCount,
              color: '#ef4444',
              bg: 'rgba(239,68,68,0.12)',
            },
            {
              label: 'বাদ',
              val: skippedCount,
              color: '#94a3b8',
              bg: 'rgba(148,163,184,0.1)',
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                background: s.bg,
                borderRadius: 12,
                padding: '10px 0',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>
                {s.val}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Subject + total */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            margin: '12px 28px 0',
          }}
        >
          {subjectLabel && (
            <div
              style={{
                flex: 1,
                background: 'rgba(99,102,241,0.12)',
                borderRadius: 10,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 13, color: '#818cf8' }}>📚</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#c7d2fe' }}>
                {subjectLabel}
              </span>
            </div>
          )}
          <div
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 10,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13 }}>📝</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>
              {totalQs}টি প্রশ্ন
            </span>
          </div>
        </div>

        {/* CTA footer */}
        <div
          style={{
            margin: '16px 28px 24px',
            padding: '14px 20px',
            background: `linear-gradient(90deg, ${accent.ring}22, transparent)`,
            borderLeft: `3px solid ${accent.ring}`,
            borderRadius: '0 12px 12px 0',
          }}
        >
          <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>
            🎯 Obhyash-এ পরীক্ষা দিয়ে নিজেকে যাচাই করো
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
            obhyash.com — বাংলাদেশের সেরা MCQ প্র্যাকটিস প্ল্যাটফর্ম
          </div>
        </div>
      </div>
    );
  },
);

ResultShareCard.displayName = 'ResultShareCard';

// ─── Share / Download button strip ────────────────────────────────────────────

interface ShareStripProps {
  percentage: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  finalScore: number;
  totalPoints: number;
  timeTaken: number;
  subjectLabel?: string;
  feedbackTitle: string;
  userName?: string;
  isHistoryMode?: boolean;
}

export function ResultShareStrip(props: ShareStripProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const shareText =
    `আমি Obhyash-এ ${props.subjectLabel ? props.subjectLabel + '-এ ' : ''}` +
    `${props.percentage}% নম্বর পেলাম! (${props.finalScore.toFixed(1)}/${props.totalPoints}) 🎯\n` +
    `বাংলাদেশের সেরা MCQ প্র্যাকটিস প্ল্যাটফর্মে যোগ দাও 👉 https://obhyash.com`;

  const generateImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    setGeneratingImage(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        style: { fontFamily: '"Segoe UI", system-ui, sans-serif' },
      });
      return dataUrl;
    } catch (e) {
      console.error(e);
      toast.error('ছবি তৈরি করতে সমস্যা হয়েছে।');
      return null;
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleDownload = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `obhyash-result-${Date.now()}.png`;
    link.click();
    toast.success('রেজাল্ট কার্ড ডাউনলোড হয়েছে!');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://obhyash.com').then(() => {
      toast.success('লিংক কপি হয়েছে!');
    });
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://obhyash.com')}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // Try to share with image if supported
        const dataUrl = await generateImage();
        if (dataUrl && navigator.canShare) {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], 'obhyash-result.png', {
            type: 'image/png',
          });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'আমার রেজাল্ট',
              text: shareText,
            });
            return;
          }
        }
        await navigator.share({
          title: 'আমার রেজাল্ট — Obhyash',
          text: shareText,
          url: 'https://obhyash.com',
        });
      } catch {
        // user cancelled
      }
    } else {
      setShowPanel(true);
    }
  };

  if (props.isHistoryMode) return null;

  return (
    <div className="my-8">
      {/* Hidden card used for image export*/}
      <div
        className="flex justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div
          style={{
            transform: 'scale(0)',
            height: 0,
            overflow: 'hidden',
            position: 'absolute',
          }}
        >
          <ResultShareCard ref={cardRef} {...props} />
        </div>
      </div>

      {/* Visible preview card */}
      <div className="flex justify-center mb-5">
        <div className="pointer-events-none select-none overflow-hidden rounded-2xl shadow-2xl shadow-black/30 ring-1 ring-white/10 w-full max-w-sm scale-100">
          <ResultShareCard {...props} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={generatingImage}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60"
        >
          {generatingImage ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Download size={16} />
          )}
          ডাউনলোড করো
        </button>

        {/* Share */}
        <button
          onClick={handleNativeShare}
          disabled={generatingImage}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-60"
        >
          <Share2 size={16} />
          শেয়ার করো
        </button>
      </div>

      {/* Share platform panel */}
      {showPanel && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPanel(false)}
          />
          <div className="relative z-10 w-full max-w-xs bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-5 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="font-black text-neutral-900 dark:text-white">
                শেয়ার করো
              </span>
              <button
                onClick={() => setShowPanel(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Facebook */}
              <button
                onClick={() => {
                  handleFacebook();
                  setShowPanel(false);
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#1877f2]/10 hover:bg-[#1877f2]/20 transition-colors"
              >
                <Facebook size={22} className="text-[#1877f2]" />
                <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                  Facebook
                </span>
              </button>
              {/* WhatsApp */}
              <button
                onClick={() => {
                  handleWhatsApp();
                  setShowPanel(false);
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#25d366]/10 hover:bg-[#25d366]/20 transition-colors"
              >
                <MessageCircle size={22} className="text-[#25d366]" />
                <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                  WhatsApp
                </span>
              </button>
              {/* Copy link */}
              <button
                onClick={() => {
                  handleCopyLink();
                  setShowPanel(false);
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <Link2
                  size={22}
                  className="text-neutral-600 dark:text-neutral-400"
                />
                <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                  লিংক কপি
                </span>
              </button>
            </div>

            {/* Download from panel */}
            <button
              onClick={() => {
                handleDownload();
                setShowPanel(false);
              }}
              disabled={generatingImage}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors disabled:opacity-60"
            >
              <Download size={15} />
              ছবি ডাউনলোড করো
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultShareCard;
