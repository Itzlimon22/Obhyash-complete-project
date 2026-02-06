import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileQuestion,
  GraduationCap,
  Flag,
  BarChart3,
  PieChart,
  BookOpen,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';
import { NavSection, NavItem } from './types';

export const SIDEBAR_NAVIGATION: NavSection[] = [
  {
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard',
      },
      { id: 'users', label: 'Users', icon: Users, path: '/users' },
      {
        id: 'subscriptions',
        label: 'Subscriptions',
        icon: CreditCard,
        path: '/subscriptions',
      },
    ],
  },
  {
    items: [
      {
        id: 'questions',
        label: 'Question Bank',
        icon: FileQuestion,
        path: '/questions',
      },
      {
        id: 'exams',
        label: 'Exam Management',
        icon: GraduationCap,
        path: '/exams',
        hasSubmenu: true,
      },
      { id: 'reports', label: 'Reports', icon: Flag, path: '/reports' },
    ],
  },
  {
    items: [
      {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        path: '/analytics',
      },
      { id: 'segments', label: 'Segments', icon: PieChart, path: '/segments' },
      {
        id: 'study',
        label: 'Study Materials',
        icon: BookOpen,
        path: '/study-materials',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        path: '/notifications',
        count: 9,
      },
    ],
  },
];

export const BOTTOM_NAVIGATION: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  { id: 'logout', label: 'Logout', icon: LogOut, path: '/logout' },
];

//------------- new constants can be added here -------------//

import { Difficulty } from './types';

export const SUBJECT_OPTIONS = [
  {
    id: 'Physics',
    label: 'পদার্থবিজ্ঞান (Physics)',
    icon: '⚛️',
    color: 'bg-rose-100 text-rose-600',
  },
  {
    id: 'Chemistry',
    label: 'রসায়ন (Chemistry)',
    icon: '🧪',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'Math',
    label: 'উচ্চতর গণিত (Higher Math)',
    icon: '📐',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'Biology',
    label: 'জীববিজ্ঞান (Biology)',
    icon: '🧬',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    id: 'Bangla',
    label: 'বাংলা (Bangla)',
    icon: '📚',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    id: 'English',
    label: 'English',
    icon: '📝',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    id: 'GK',
    label: 'সাধারণ জ্ঞান (General Knowledge)',
    icon: '🌍',
    color: 'bg-teal-100 text-teal-600',
  },
];

export const EXAM_TYPE_OPTIONS = [
  { id: 'Academic', label: 'Academic', desc: 'Board Standard' },
  { id: 'Medical Admission', label: 'Medical', desc: 'Admission Test' },
  { id: 'Engineering Admission', label: 'Engineering', desc: 'BUET/CKRUET' },
  { id: 'Varsity Admission', label: 'Varsity', desc: 'A Unit Standard' },
  { id: 'Main Book', label: 'Textbook', desc: 'Chapter-wise' },
  { id: 'Mixed', label: 'Mixed', desc: 'Randomized' },
];

export const DIFFICULTY_OPTIONS = [
  { id: Difficulty.Easy, label: 'সহজ', color: 'emerald' },
  { id: Difficulty.Medium, label: 'মধ্যম', color: 'amber' },
  { id: Difficulty.Hard, label: 'কঠিন', color: 'red' },
  { id: Difficulty.Mixed, label: 'মিশ্র', color: 'rose' },
];

export const NEGATIVE_MARKING_OPTIONS = [0, 0.25, 0.5, 1.0];
