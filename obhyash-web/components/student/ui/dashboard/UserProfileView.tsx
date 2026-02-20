import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { UserProfile, ExamResult } from '@/lib/types';
import { calculateActivityStats } from '@/lib/stats-utils';
import SubjectStat from './SubjectStat';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';

interface UserProfileViewProps {
  user: UserProfile;
  currentUser?: UserProfile | null;
  rank: number;
  history?: ExamResult[];
  onBack: () => void;
  onSubjectClick?: (subject: string) => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  rank,
  history = [],
  onBack,
  onSubjectClick,
}) => {
  // Comparison Chart Data
  const data = useMemo(() => {
    // 1. My Stats (You) - From actual history if available
    const myStats = calculateActivityStats(history);

    // 2. Opponent Stats (User Profile) - From recentExams
    // If recentExams is not available on user object (it should be on User interface but maybe not UserProfile)
    // UserProfile extends Partial<User>, so check if recentExams exists.
    // If not, we might need to fallback to empty or fetch it.
    // Assuming user.recentExams exists or we treat it as empty.
    // Actually UserProfile interface in types.ts doesn't explicitly have recentExams, but User does.
    // Let's check types.ts again. UserProfile extends Partial<User>.
    // So distinct properties are optional.
    const opponentHistory = (user as any).recentExams || [];
    const opponentStats = calculateActivityStats(opponentHistory);

    // Merge them by day name
    return myStats.map((myDay) => {
      const oppDay = opponentStats.find((d) => d.name === myDay.name);
      return {
        name: myDay.name,
        you: myDay.xp,
        opponent: oppDay ? oppDay.xp : 0,
      };
    });
  }, [history, user]);

  // Calculate Subject Stats dynamically matching SubjectData interface for SubjectStat component
  const subjectStats = useMemo(() => {
    // If it's the current user, calculate from actual history
    if (user.isCurrentUser && history.length > 0) {
      const stats: Record<
        string,
        { correct: number; wrong: number; skipped: number; total: number }
      > = {};

      // Initialize common subjects
      const defaultSubjects = [
        'পদার্থবিজ্ঞান',
        'রসায়ন',
        'উচ্চতর গণিত',
        'জীববিজ্ঞান',
      ];
      defaultSubjects.forEach((s) => {
        stats[s] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
      });

      history.forEach((exam) => {
        // Resolve Bengali display name for the subject
        const subjectName = getSubjectDisplayName(
          exam.subjectLabel || exam.subject,
        );

        // Find matching subject key or use full name
        const subjectKey =
          Object.keys(stats).find((k) => subjectName.includes(k)) ||
          subjectName;

        if (!stats[subjectKey]) {
          stats[subjectKey] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
        }

        stats[subjectKey].correct += exam.correctCount;
        stats[subjectKey].wrong += exam.wrongCount;
        stats[subjectKey].total += exam.totalQuestions;
        // Derive skipped from totals
        const answered = exam.correctCount + exam.wrongCount;
        const skipped = exam.totalQuestions - answered;
        stats[subjectKey].skipped += skipped;
      });

      return Object.entries(stats)
        .map(([name, val]) => ({
          name,
          ...val,
        }))
        .filter((item) => item.total > 0 || defaultSubjects.includes(item.name))
        .sort((a, b) => b.total - a.total);
    }

    // Fallback / Mock data for other users to show UI structure
    // Fallback if no history or not current user
    // Ideally we'd show the user's actual subject stats if we had them.
    // Since we don't calculate them for others yet, return empty to hide the chart or show "No Data"
    return [];
  }, [user.isCurrentUser, history]);

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-neutral-950 p-4 md:p-8 animate-fade-in transition-colors font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          <span>ফিরে যান</span>
        </button>

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800 p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div
              className={`w-20 h-20 md:w-24 md:h-24 rounded-full ${user.avatarColor} flex items-center justify-center text-white font-bold text-3xl md:text-4xl shadow-md ring-4 ring-white dark:ring-neutral-800`}
            >
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-1">
                {user.name}
              </h1>
              <span className="inline-block px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full mb-1">
                Batch : অ্যাডমিশন ২০২৫
              </span>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
                {user.institute}
              </p>
            </div>
          </div>

          <div className="flex gap-4 md:gap-8 w-full md:w-auto justify-around md:justify-end">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white">
                {user.xp.toLocaleString()}
              </div>
              <div className="text-xs text-neutral-500 font-medium">পয়েন্ট</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-indigo-500 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white">
                {rank}
              </div>
              <div className="text-xs text-neutral-500 font-medium">
                র‍্যাংক
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-rose-500 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path d="M21.721 12.752a9.711 9.711 0 00-.945-5.003 12.754 12.754 0 01-4.339 2.708 18.991 18.991 0 01-.214 4.772 17.165 17.165 0 005.498-2.477zM14.634 15.55a17.324 17.324 0 00.332-4.647c-.952.227-1.945.347-2.966.347-1.021 0-2.014-.12-2.966-.347a17.515 17.515 0 00.332 4.647 17.387 17.387 0 005.268 0zM9.772 17.119a18.963 18.963 0 004.456 0A17.182 17.182 0 0112 21.724a17.165 17.165 0 01-2.228-4.605zM7.777 15.23a18.87 18.87 0 01-.214-4.774 12.753 12.753 0 01-4.34-2.708 9.711 9.711 0 00-.944 5.004 17.165 17.165 0 005.498 2.477zM21.356 14.752a9.765 9.765 0 01-7.478 6.817 18.64 18.64 0 001.988-4.718 18.627 18.627 0 005.49 2.098zM2.644 14.752c1.682.097 3.53.75 5.49 2.098a18.64 18.64 0 001.988 4.718 9.765 9.765 0 01-7.478-6.817z" />
                </svg>
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white">
                {user.examsTaken}
              </div>
              <div className="text-xs text-neutral-500 font-medium">
                পরীক্ষা
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white">
                ২
              </div>
              <div className="text-xs text-neutral-500 font-medium">
                স্ট্রিক
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            {/* Badges */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800 p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-4">
                ব্যাজেস
              </h3>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-2 ring-4 ring-green-50 dark:ring-green-900/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  25
                </div>
                <div className="text-sm text-neutral-500 font-medium">
                  সঠিক উত্তর
                </div>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800 p-6 flex-1">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-4 text-center">
                You v/s {user.name}&apos;s পয়েন্ট
              </h3>

              <div className="flex justify-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-neutral-500"></div>
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    You - 0
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {user.name.split(' ')[0]} - {data[data.length - 1].opponent}
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient
                        id="colorOpponent"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="you"
                      stroke="#64748b"
                      strokeWidth={3}
                      fill="transparent"
                      dot={{
                        r: 4,
                        fill: '#64748b',
                        strokeWidth: 2,
                        stroke: '#fff',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="opponent"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#colorOpponent)"
                      dot={{
                        r: 4,
                        fill: '#3b82f6',
                        strokeWidth: 2,
                        stroke: '#fff',
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Subject Report - Replaced with Component for Consistency */}
          <div>
            <SubjectStat
              data={subjectStats}
              onSubjectClick={(subject) => {
                if (user.isCurrentUser && onSubjectClick) {
                  onSubjectClick(subject);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
