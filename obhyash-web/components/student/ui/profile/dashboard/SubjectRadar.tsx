import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface SubjectRadarProps {
  data: { subject: string; score: number }[];
}

const SubjectRadar: React.FC<SubjectRadarProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8 flex flex-col">
      <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
        বিষয়ভিত্তিক দক্ষতা
      </h3>
      <p className="text-base text-neutral-500 dark:text-neutral-400 mb-6">
        আপনার বিভিন্ন বিষয়ের দক্ষতার তুলনামূলক চিত্র
      </p>

      <div className="h-[320px] w-full">
        {/* SUPABASE: Data fed here should come from aggregation of 'exam_results' by subject */}
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }}
            />
            <Radar
              name="স্কোর"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={3}
              fill="#6366f1"
              fillOpacity={0.25}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '14px',
                fontWeight: 600,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center">
        <span className="text-sm font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-3 py-1.5 rounded-lg">
          Average Score / Subject
        </span>
      </div>
    </div>
  );
};

export default SubjectRadar;
