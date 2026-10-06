'use client';

import React from 'react';
import { DollarSign, TrendingUp, Users, BookOpen, Layers } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { ParticipationChart } from './ParticipationChart';
import { StatusBanner } from './StatusBanner';
import { ScheduleCard } from './ScheduleCard';
import { QuestionSetTable } from './QuestionSetTable';
import { TeamList } from './TeamList';
import { cn } from '@/lib/utils';

export interface DashboardOverviewMetrics {
  totalUsers?: number;
  proUsers?: number;
  totalQuestions?: number;
  totalExams?: number;
  todayExams?: number;
  examGrowthPercent?: number;
}

export interface NiondBentoDashboardProps {
  metrics?: DashboardOverviewMetrics;
  className?: string;
}

export const NiondBentoDashboard: React.FC<NiondBentoDashboardProps> = ({
  metrics,
  className,
}) => {
  // Format numbers nicely with 'k' suffix if large, or fallback to Niond reference
  const totalEarningDisplay = metrics?.totalUsers
    ? `${(metrics.totalUsers / 1000).toFixed(2)}K`
    : '242.65K';

  const avgEarningDisplay = metrics?.todayExams
    ? `${(metrics.todayExams / 1000).toFixed(3)}K`
    : '17.347K';

  const conversionRateDisplay = '74.86%';

  return (
    <div className={cn('space-y-6', className)}>
      {/* 1. TOP ROW: 3 Soft Pastel Metric KPI Cards (Lavender, Periwinkle, Mint) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Lavender (Total Earning) */}
        <KpiCard
          variant="lavender"
          title="Total Earning"
          badgeText="Total Earning"
          value={totalEarningDisplay}
          subtext="From the running month"
        />

        {/* Card 2: Periwinkle (Average Earning) */}
        <KpiCard
          variant="periwinkle"
          title="Average Earning"
          badgeText="Average Earning"
          value={avgEarningDisplay}
          subtext="Daily Earning of this month"
        />

        {/* Card 3: Mint (Conversation Rate) */}
        <KpiCard
          variant="mint"
          title="Conversation Rate"
          badgeText="Conversation Rate"
          value={conversionRateDisplay}
          subtext="+6.04% greater than last month"
          trend={{ value: '+6.04%', isPositive: true }}
        />
      </div>

      {/* 2. MIDDLE ROW: 8 Cols (Dual Bar Chart + Analysis) & 4 Cols (Deep Teal Banner + Schedule) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 8 Cols: Participation Chart */}
        <div className="lg:col-span-8 flex flex-col">
          <ParticipationChart className="h-full" />
        </div>

        {/* Right 4 Cols: Status Banner & Daily Meeting */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <StatusBanner
            title="Upgrade to Pro"
            metric="$4.20 / Month"
            subtext="$50 Billed Annually"
            buttonText="Upgrade Now"
          />
          <ScheduleCard
            title="Daily Meeting"
            timeInfo="12+ Person • 8:30 PM"
            conductorsText="They will conduct the meeting"
            buttonText="Click for meeting link"
          />
        </div>
      </div>

      {/* 3. BOTTOM ROW: 8 Cols (Top Store Table) & 4 Cols (Team Members) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 8 Cols: Top Store Table */}
        <div className="lg:col-span-8">
          <QuestionSetTable title="Top Store" />
        </div>

        {/* Right 4 Cols: Team Members Widget */}
        <div className="lg:col-span-4 flex flex-col">
          <TeamList title="Team Member" className="h-full" />
        </div>
      </div>
    </div>
  );
};

export default NiondBentoDashboard;
