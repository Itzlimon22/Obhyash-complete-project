import {
  Bell,
  Trophy,
  Zap,
  BookOpen,
  Info,
  CheckCircle2,
  AlertTriangle,
  PartyPopper,
} from 'lucide-react';
import { NotificationType } from '@/lib/types';

// --- ENGAGING CONTENT STRATEGY ---

export const FUNNY_EMPTY_STATES = [
  // --- Motivation & Study ---
  {
    message: 'সব ফাঁকা! পড়াশোনা শুরু করে দাও 🚀',
    subtext: 'এখানে মশা মাছিও নেই, একদম পরিষ্কার! 🦟',
    icon: '🧹',
  },
  {
    message: 'বইয়ের পাতায় মন দাও 📖',
    subtext: 'নোটিফিকেশন তো আসবেই, কিন্তু পড়াটা বেশি জরুরি।',
    icon: '🤓',
  },
  {
    message: 'আপনার ফোকাস এখন অন্য লেভেলে! 🎯',
    subtext: 'এই মনোযোগটা পড়াশোনায় কাজে লাগান।',
    icon: '🔥',
  },
  {
    message: 'পিনপতন নীরবতা! 🔇',
    subtext: 'মনে হচ্ছে সবাই পরীক্ষার প্রস্তুতি নিতে ব্যস্ত।',
    icon: '📚',
  },
  {
    message: 'স্বপ্ন দেখো বড় কিছু করার ✨',
    subtext: 'নোটিফিকেশনের অপেক্ষা না করে স্বপ্নের পেছনে ছুটুন।',
    icon: '🌠',
  },

  // --- Relaxation & Chill ---
  {
    message: 'নোটিফিকেশন নেই, টেনশন নেই! 😎',
    subtext: 'চিল মুডে পড়াশোনা চালিয়ে যান।',
    icon: '🧘',
  },
  {
    message: 'ব্রেক টাইম! ☕',
    subtext: 'নোটিফিকেশন চেক না করে এক কাপ চা খেয়ে নাও।',
    icon: '🍪',
  },
  {
    message: 'আপনার ইনবক্স এখন ঘুমাচ্ছে 😴',
    subtext: 'বিরক্ত করো না, রেস্ট নিতে দাও!',
    icon: '💤',
  },
  {
    message: 'শান্ত... খুব শান্ত... 🤫',
    subtext: 'ঝড় আসার আগে পরিবেশ যেমন শান্ত থাকে!',
    icon: '🍃',
  },
  {
    message: 'আজকে আকাশ পরিষ্কার ☀️',
    subtext: 'কোনো মেঘ (নোটিফিকেশন) নেই, শুধুই রোদ!',
    icon: '🏖️',
  },

  // --- Friendly & Casual ---
  {
    message: 'বন্ধু, সব ঠিক তো? 🤔',
    subtext: 'অনেকক্ষণ কোনো খবর নেই, তাই খোঁজ নিলাম!',
    icon: '👋',
  },
  {
    message: 'হাই! কেমন আছেন? 😊',
    subtext: 'নতুন কোনো আপডেট নেই, শুধু হ্যালো বলতে এলাম।',
    icon: '🙋‍♂️',
  },
  {
    message: 'মিস করছি আপনাকে! 🥺',
    subtext: 'নোটিফিকেশন সেকশনটা একদম একা হয়ে গেছে।',
    icon: '💔',
  },
  {
    message: 'স্বাগতম নতুন শুরুতে! 🌱',
    subtext: 'পুরানো সব মুছে ফেলে নতুন করে শুরু করো।',
    icon: '✨',
  },
  {
    message: 'অপেক্ষা... শুধুই অপেক্ষা... ⏳',
    subtext: 'ভালো কিছুর জন্য অপেক্ষা করা ভালো!',
    icon: '🎁',
  },

  // --- Funny & Witty ---
  {
    message: 'আপনার ইনবক্স এখন ডায়েটে আছে 🥗',
    subtext: 'কোনো নতুন আপডেট খায়নি এখনো।',
    icon: '🍽️',
  },
  {
    message: 'মাকড়সা জাল বুনছে... 🕸️',
    subtext: 'অনেকদিন কোনো খবর নেই, সব ঠিক তো?',
    icon: '🕷️',
  },
  {
    message: 'কিছু নেই, সব হাওয়া! �',
    subtext: 'বাতাসের বেগে সব নোটিফিকেশন উড়ে গেছে।',
    icon: '🌬️',
  },
  {
    message: 'হারিয়ে গেছে বিজ্ঞপ্তি! 🕵️‍♂️',
    subtext: 'আমরা খুঁজছি, পেলে জানিয়ে দেব।',
    icon: '�',
  },
  {
    message: 'ইন্টারনেট কি আছে? 🌐',
    subtext: 'নাকি সব আপডেট জ্যামে আটকে আছে?',
    icon: '🚦',
  },
  {
    message: 'এলিয়েনরা সব নিয়ে গেছে! �',
    subtext: 'আপনার নোটিফিকেশন এখন অন্য গ্রহে।',
    icon: '🛸',
  },
  {
    message: 'বিড়ালটা সব খেয়ে ফেলেছে! �',
    subtext: 'দুঃখিত, কোনো আপডেট অবশিষ্ট নেই।',
    icon: '🐟',
  },
  {
    message: 'ভূত আছে নাকি? 👻',
    subtext: 'এত নিস্তব্ধ কেন চারপাশ?',
    icon: '🏚️',
  },

  // --- Tech & System ---
  {
    message: 'লোডিং... লোডিং... না, কিছু নেই! 🔄',
    subtext: 'চেষ্টা করে দেখলাম, কিন্তু ঝুড়ি খালি।',
    icon: '💾',
  },
  {
    message: 'এরর ৪০৪: নটিফিকেশন নট ফাউন্ড 🚫',
    subtext: 'খুঁজে পাওয়া যাচ্ছে না, পরে চেষ্টা করো!',
    icon: '📟',
  },
  {
    message: 'ব্যাটারি সেভ হচ্ছে 🔋',
    subtext: 'নোটিফিকেশন না থাকায় ফোনের চার্জ বাঁচছে!',
    icon: '⚡',
  },

  // --- Exam & Confidence ---
  {
    message: 'প্রস্তুতি কেমন চলছে? 📝',
    subtext: 'নতুন আপডেটের চেয়ে সিলেবাস শেষ করা জরুরি।',
    icon: '🎓',
  },
  {
    message: 'ভয় পাবেন না! 💪',
    subtext: 'আমরা আছি আপনার পাশে, পরীক্ষার লড়াইয়ে।',
    icon: '🛡️',
  },
  {
    message: 'টপার হওয়ার লক্ষণ! 🏆',
    subtext: 'যারা বেশি পড়ে, তাদের নোটিফিকেশন কম আসে (হয়তো!)।',
    icon: '🥇',
  },
  {
    message: 'নিজেকে সময় দাও 🕰️',
    subtext: 'অন্যের আপডেটের চেয়ে নিজের উন্নতি বেশি দামী।',
    icon: '💎',
  },
];

export const getRandomEmptyState = () => {
  const randomIndex = Math.floor(Math.random() * FUNNY_EMPTY_STATES.length);
  return FUNNY_EMPTY_STATES[randomIndex];
};

// --- ICON & STYLE MAPPING ---

export const getNotificationStyle = (type: NotificationType | string) => {
  switch (type) {
    case 'exam_result':
      return {
        icon: BookOpen,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-800',
      };
    case 'achievement':
    case 'level_up':
      return {
        icon: Trophy,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        border: 'border-amber-200 dark:border-amber-800',
      };
    case 'announcement':
      return {
        icon: Bell,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        border: 'border-purple-200 dark:border-purple-800',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        border: 'border-orange-200 dark:border-orange-800',
      };
    case 'success':
      return {
        icon: CheckCircle2,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        border: 'border-emerald-200 dark:border-emerald-800',
      };
    case 'system':
    default:
      return {
        icon: Zap, // Or Info
        color: 'text-neutral-600 dark:text-neutral-400',
        bg: 'bg-neutral-100 dark:bg-neutral-800',
        border: 'border-neutral-200 dark:border-neutral-700',
      };
  }
};

// --- DATE GROUPING UTILS ---

export const groupNotificationsByDate = (notifications: any[]) => {
  const groups: { label: string; items: any[] }[] = [
    { label: 'আজকে (Today)', items: [] },
    { label: 'গতকাল (Yesterday)', items: [] },
    { label: 'আগের (Earlier)', items: [] },
  ];

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const yesterday = today - 86400000;

  notifications.forEach((notif) => {
    const notifDate = new Date(notif.created_at);
    const dateStart = new Date(
      notifDate.getFullYear(),
      notifDate.getMonth(),
      notifDate.getDate(),
    ).getTime();

    if (dateStart === today) {
      groups[0].items.push(notif);
    } else if (dateStart === yesterday) {
      groups[1].items.push(notif);
    } else {
      groups[2].items.push(notif);
    }
  });

  // Filter out empty groups
  return groups.filter((g) => g.items.length > 0);
};
