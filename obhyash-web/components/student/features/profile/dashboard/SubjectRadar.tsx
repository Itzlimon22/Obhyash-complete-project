
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SubjectRadarProps {
  data: { subject: string; score: number }[];
}

const SubjectRadar: React.FC<SubjectRadarProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">বিষয়ভিত্তিক দক্ষতা</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">আপনার বিভিন্ন বিষয়ের দক্ষতার তুলনামূলক চিত্র</p>
      
      <div className="flex-1 min-h-[250px]">
        {/* SUPABASE: Data fed here should come from aggregation of 'exam_results' by subject */}
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
            />
            <Radar
              name="স্কোর"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={2}
              fill="#6366f1"
              fillOpacity={0.2}
            />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-2 text-center">
         <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
            Average Score / Subject
         </span>
      </div>
    </div>
  );
};

export default SubjectRadar;
