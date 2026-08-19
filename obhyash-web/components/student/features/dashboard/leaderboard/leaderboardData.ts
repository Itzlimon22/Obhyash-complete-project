import React from 'react';
import { UserProfile } from 'lib/types';

export type LevelType =
  | 'Explorer'
  | 'Challenger'
  | 'Warrior'
  | 'Scholar'
  | 'Legend'
  | 'Rookie'
  | 'Scout'
  | 'Titan';

export const LEVELS: {
  id: LevelType;
  label: string;
  minXP: number;
  maxXP?: number;
  color: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'Legend',
    label: 'লিজেন্ড',
    minXP: 15000,
    maxXP: 100000,
    color: 'from-red-600 to-red-900',
    icon: null,
  },
  {
    id: 'Scholar',
    label: 'স্কলার',
    minXP: 7000,
    maxXP: 14999,
    color: 'from-amber-500 to-amber-700',
    icon: null,
  },
  {
    id: 'Warrior',
    label: 'ওয়ারিয়র',
    minXP: 3000,
    maxXP: 6999,
    color: 'from-purple-600 to-indigo-700',
    icon: null,
  },
  {
    id: 'Challenger',
    label: 'চ্যালেঞ্জার',
    minXP: 1000,
    maxXP: 2999,
    color: 'from-sky-500 to-blue-600',
    icon: null,
  },
  {
    id: 'Explorer',
    label: 'এক্সপ্লোরার',
    minXP: 0,
    maxXP: 999,
    color: 'from-emerald-500 to-teal-700',
    icon: null,
  },
];

/**
 * @deprecated Mock users are no longer used for leaderboard.
 * The leaderboard now fetches real data from the Supabase database.
 * This data is kept for backward compatibility and testing purposes only.
 */
export const MOCK_USERS: UserProfile[] = [
  {
    id: '1',
    name: 'Ishraq Kabir',
    institute: 'Notre Dame College',
    xp: 5820,
    level: 'Legend',
    examsTaken: 95,
    avatarColor: 'bg-red-500',
  },
  {
    id: '2',
    name: 'Fatima Anjum',
    institute: 'Viqarunnisa Noon School',
    xp: 5150,
    level: 'Legend',
    examsTaken: 82,
    avatarColor: 'bg-red-400',
  },
  {
    id: '3',
    name: 'Tanvir Hasan',
    institute: 'Dhaka College',
    xp: 4890,
    level: 'Titan',
    examsTaken: 75,
    avatarColor: 'bg-red-500',
  },
  {
    id: '4',
    name: 'Sadia Islam',
    institute: 'Holy Cross College',
    xp: 4200,
    level: 'Titan',
    examsTaken: 68,
    avatarColor: 'bg-red-500',
  },
  {
    id: 'me',
    name: 'আপনি (You)',
    institute: 'Rajuk Uttara Model College',
    xp: 2850,
    level: 'Warrior',
    examsTaken: 42,
    avatarColor: 'bg-emerald-600',
    isCurrentUser: true,
  },
  {
    id: '5',
    name: 'Rahim Uddin',
    institute: 'Chittagong College',
    xp: 2600,
    level: 'Warrior',
    examsTaken: 38,
    avatarColor: 'bg-red-500',
  },
  {
    id: '6',
    name: 'Karim Ahmed',
    institute: 'Govt. Science College',
    xp: 2100,
    level: 'Warrior',
    examsTaken: 30,
    avatarColor: 'bg-red-500',
  },
  {
    id: '7',
    name: 'Nusrat Jahan',
    institute: 'Motijheel Ideal School',
    xp: 1800,
    level: 'Scout',
    examsTaken: 25,
    avatarColor: 'bg-emerald-500',
  },
  {
    id: '8',
    name: 'Mehedi Hasan',
    institute: 'Adamjee Cantonment College',
    xp: 950,
    level: 'Scout',
    examsTaken: 12,
    avatarColor: 'bg-emerald-500',
  },
  {
    id: '9',
    name: 'Ayesha Siddika',
    institute: 'BAF Shaheen College',
    xp: 600,
    level: 'Rookie',
    examsTaken: 8,
    avatarColor: 'bg-slate-500',
  },
  {
    id: '10',
    name: 'Rafiqul Islam',
    institute: 'Dhaka Residential Model',
    xp: 200,
    level: 'Rookie',
    examsTaken: 2,
    avatarColor: 'bg-gray-500',
  },
];
