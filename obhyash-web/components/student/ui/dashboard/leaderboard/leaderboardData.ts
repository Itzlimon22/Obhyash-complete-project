
import React from 'react';
import { UserProfile } from '@/lib/types';

export type LevelType = 'Rookie' | 'Scout' | 'Warrior' | 'Titan' | 'Legend';

export const LEVELS: { id: LevelType; label: string; minXP: number; maxXP?: number; color: string; icon: React.ReactNode }[] = [
  { 
    id: 'Legend', 
    label: 'লিজেন্ড (Legend)', 
    minXP: 5000, 
    maxXP: 100000,
    color: 'from-fuchsia-600 to-purple-600',
    icon: null // Icons handled in component to avoid SVG imports in pure data file if strict, but for now we'll handle icons in the component mapping
  },
  { 
    id: 'Titan', 
    label: 'টাইটান (Titan)', 
    minXP: 3500, 
    maxXP: 4999,
    color: 'from-amber-500 to-orange-600',
    icon: null
  },
  { 
    id: 'Warrior', 
    label: 'ওয়ারিয়র (Warrior)', 
    minXP: 2000, 
    maxXP: 3499,
    color: 'from-rose-500 to-red-600',
    icon: null
  },
  { 
    id: 'Scout', 
    label: 'স্কাউট (Scout)', 
    minXP: 800, 
    maxXP: 1999,
    color: 'from-emerald-500 to-teal-500',
    icon: null
  },
  { 
    id: 'Rookie', 
    label: 'রুকি (Rookie)', 
    minXP: 0, 
    maxXP: 799,
    color: 'from-slate-400 to-slate-600',
    icon: null
  }
];

export const MOCK_USERS: UserProfile[] = [
  { id: '1', name: 'Ishraq Kabir', institute: 'Notre Dame College', xp: 5820, level: 'Legend', examsTaken: 95, avatarColor: 'bg-fuchsia-500' },
  { id: '2', name: 'Fatima Anjum', institute: 'Viqarunnisa Noon School', xp: 5150, level: 'Legend', examsTaken: 82, avatarColor: 'bg-purple-500' },
  { id: '3', name: 'Tanvir Hasan', institute: 'Dhaka College', xp: 4890, level: 'Titan', examsTaken: 75, avatarColor: 'bg-orange-500' },
  { id: '4', name: 'Sadia Islam', institute: 'Holy Cross College', xp: 4200, level: 'Titan', examsTaken: 68, avatarColor: 'bg-amber-500' },
  { id: 'me', name: 'আপনি (You)', institute: 'Rajuk Uttara Model College', xp: 2850, level: 'Warrior', examsTaken: 42, avatarColor: 'bg-indigo-600', isCurrentUser: true },
  { id: '5', name: 'Rahim Uddin', institute: 'Chittagong College', xp: 2600, level: 'Warrior', examsTaken: 38, avatarColor: 'bg-rose-500' },
  { id: '6', name: 'Karim Ahmed', institute: 'Govt. Science College', xp: 2100, level: 'Warrior', examsTaken: 30, avatarColor: 'bg-red-500' },
  { id: '7', name: 'Nusrat Jahan', institute: 'Motijheel Ideal School', xp: 1800, level: 'Scout', examsTaken: 25, avatarColor: 'bg-teal-500' },
  { id: '8', name: 'Mehedi Hasan', institute: 'Adamjee Cantonment College', xp: 950, level: 'Scout', examsTaken: 12, avatarColor: 'bg-emerald-500' },
  { id: '9', name: 'Ayesha Siddika', institute: 'BAF Shaheen College', xp: 600, level: 'Rookie', examsTaken: 8, avatarColor: 'bg-slate-500' },
  { id: '10', name: 'Rafiqul Islam', institute: 'Dhaka Residential Model', xp: 200, level: 'Rookie', examsTaken: 2, avatarColor: 'bg-gray-500' },
];
