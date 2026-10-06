'use client';

import React from 'react';
import { ChevronRight, Plus, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TeamMemberItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

const DEFAULT_MEMBERS: TeamMemberItem[] = [
  {
    id: '1',
    name: 'Mahid Ahmed',
    role: 'Project Manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
  },
  {
    id: '2',
    name: 'Daniel Karl',
    role: 'HR Head',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face',
  },
  {
    id: '3',
    name: 'Elena Michel',
    role: 'Co-ordinator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
  },
  {
    id: '4',
    name: 'Salina Mitso',
    role: 'Co-ordinator',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
  },
];

interface TeamListProps {
  title?: string;
  members?: TeamMemberItem[];
  onAddMember?: () => void;
  className?: string;
}

export const TeamList: React.FC<TeamListProps> = ({
  title = 'Team Member',
  members = DEFAULT_MEMBERS,
  onAddMember,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-[#151515] rounded-3xl p-6 shadow-card border border-slate-100/80 dark:border-zinc-800/80',
        'flex flex-col justify-between',
        className,
      )}
    >
      <div>
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
          {title}
        </h3>

        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-zinc-800"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white">
                    {member.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium">
                    {member.role}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
            </div>
          ))}
        </div>
      </div>

      {/* Add More Member Pill Button */}
      <div className="pt-4">
        <button
          onClick={onAddMember}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#d0e2ff] hover:bg-[#c0d6ff] dark:bg-[#1f314d] dark:hover:bg-[#284065] text-blue-950 dark:text-blue-100 font-bold rounded-full text-xs transition-all duration-150 active:scale-95 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add more member</span>
        </button>
      </div>
    </div>
  );
};

export default TeamList;
