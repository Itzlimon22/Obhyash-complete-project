import React from 'react';
import { UserProfile, ExamResult } from '@/lib/types';
import ProfileHeader from './dashboard/ProfileHeader';
import StatsGrid from './dashboard/StatsGrid';
import SubjectRadar from './dashboard/SubjectRadar';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MyProfileViewProps {
  user: UserProfile;
  history: ExamResult[];
  onEditProfile: () => void;
}

const MyProfileView: React.FC<MyProfileViewProps> = ({
  user,
  history,
  onEditProfile,
}) => {
  // -- Data Processing (Mock for now, would be Supabase aggregations) --
  const evaluatedExams = history.filter((h) => h.status === 'evaluated');
  const avgScore =
    evaluatedExams.length > 0
      ? Math.round(
          evaluatedExams.reduce(
            (acc, curr) => acc + (curr.score / curr.totalMarks) * 100,
            0,
          ) / evaluatedExams.length,
        )
      : 0;

  // Mock Subject Data for Radar
  const radarData = [
    { subject: 'Physics', score: 80 },
    { subject: 'Chemistry', score: 65 },
    { subject: 'Math', score: 90 },
    { subject: 'Biology', score: 70 },
    { subject: 'English', score: 55 },
    { subject: 'GK', score: 85 },
  ];

  // Mock Activity Data for Area Chart
  const activityData = [
    { name: 'শনি', xp: 400 },
    { name: 'রবি', xp: 300 },
    { name: 'সোম', xp: 550 },
    { name: 'মঙ্গল', xp: 450 },
    { name: 'বুধ', xp: 600 },
    { name: 'বৃহঃ', xp: 200 },
    { name: 'শুক্র', xp: 700 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12 pt-2">
      {/* 1. Header Section */}
      <ProfileHeader user={user} onEdit={onEditProfile} />

      {/* 2. Key Stats Grid */}
      <StatsGrid
        examsTaken={user.examsTaken}
        avgScore={avgScore}
        xp={user.xp}
        streak={12} // Mock streak
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. Left Column: Subject Proficiency */}
        <div className="lg:col-span-1 space-y-6">
          <SubjectRadar data={radarData} />
        </div>

        {/* 4. Right Column: Activity Graph & Recent Exams List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Graph */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white">
                  সাপ্তাহিক প্রোগ্রেস
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  গত ৭ দিনের XP অর্জনের চিত্র
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                +12% vs last week
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      backgroundColor:
                        'var(--tw-bg-opacity, 1) rgb(255 255 255 / var(--tw-bg-opacity))',
                    }}
                    cursor={{
                      stroke: '#6366f1',
                      strokeWidth: 1,
                      strokeDasharray: '5 5',
                    }}
                    formatter={(value?: number) => [
                      `${value ?? 0} XP`,
                      'অর্জিত',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="xp"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorXp)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity List */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-white">
                সর্বশেষ কার্যক্রম
              </h3>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {history.slice(0, 3).map((exam, idx) => (
                <div
                  key={idx}
                  className="p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${exam.score / exam.totalMarks >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    >
                      {Math.round((exam.score / exam.totalMarks) * 100)}%
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 dark:text-white text-sm">
                        {exam.subject}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(exam.date).toLocaleDateString('bn-BD', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        • {exam.totalQuestions} Questions
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                    {exam.examType || 'Practice'}
                  </span>
                </div>
              ))}
              {history.length === 0 && (
                <div className="p-8 text-center text-neutral-500 text-sm">
                  এখনও কোনো পরীক্ষা দেওয়া হয়নি।
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfileView;
