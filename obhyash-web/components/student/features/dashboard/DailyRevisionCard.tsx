'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Flame, ArrowRight, Sparkles, Layers, CheckCircle2, Clock } from 'lucide-react';
import { getSpacedRepetitionStats, SpacedRepetitionStats } from '@/services/spaced-repetition-service';
import SpacedRepetitionModal from '@/components/student/features/spaced-repetition/SpacedRepetitionModal';

interface DailyRevisionCardProps {
  userId?: string;
}

export default function DailyRevisionCard({ userId }: DailyRevisionCardProps) {
  const [stats, setStats] = useState<SpacedRepetitionStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await getSpacedRepetitionStats(userId);
      setStats(data);
    } catch (e) {
      console.warn('Failed to load revision stats:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [userId]);

  const dueCount = stats ? (stats.due_today_count > 0 ? stats.due_today_count : 10) : 10;
  const masteredCount = stats ? stats.mastered_count : 0;

  return (
    <>
      <div className="rounded-2xl p-5 md:p-6 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-800/40 relative overflow-hidden shadow-lg hover:border-purple-700/60 transition-all group">
        {/* Background ambient glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          {/* Left info */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 shadow-sm">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                Leitner SM-2 Memory System
              </span>
              {masteredCount > 0 && (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  🏆 {masteredCount}টি আয়ত্তে
                </span>
              )}
            </div>

            <div>
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <span>আজকের মেমোরি রিভিশন ডোজ</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 animate-pulse">
                  {dueCount}টি প্রস্তুত
                </span>
              </h3>
              <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
                ভুলে যাওয়ার আগেই স্মৃতি ঝালিয়ে নিন। ১০টি প্রশ্ন সমাধান করে স্মৃতিকে দীর্ঘস্থায়ী বক্সে উন্নীত করুন এবং বোনাস XP ও গিফট জিতুন!
              </p>
            </div>

            {/* Micro Feature Highlights */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                ১০ মিনিট সময়
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                +১৫ XP / প্রশ্ন
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Box 1-5 বৈজ্ঞানিক শিডিউল
              </span>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-95 group-hover:shadow-purple-500/40"
            >
              <span>রিভিশন শুরু করুন</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Modal */}
      <SpacedRepetitionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSessionComplete={loadStats}
      />
    </>
  );
}
