export interface AdminNotificationTemplate {
  id: string;
  category: 'streak' | 'morning' | 'afternoon' | 'inactivity' | 'live_exam' | 'result' | 'milestone';
  categoryLabel: string;
  title: string;
  message: string;
  route: string;
  type: 'announcement' | 'system' | 'info' | 'warning' | 'success';
  priority: 'low' | 'normal' | 'high';
}

export const NOTIFICATION_TEMPLATES: AdminNotificationTemplate[] = [
  // 1. স্ট্রিক সেভার
  {
    id: 'streak_1',
    category: 'streak',
    categoryLabel: '🔥 স্ট্রিক সেভার',
    title: '🚨 তোমার স্ট্রিক পুড়ছে!',
    message: 'আর মাত্র কয়েক ঘণ্টা বাকি! এখনই ১টি ছোট প্র্যাকটিস দিয়ে আগুনটা বাঁচাও 🔥',
    route: '/exam-setup',
    type: 'warning',
    priority: 'high',
  },
  {
    id: 'streak_2',
    category: 'streak',
    categoryLabel: '🔥 স্ট্রিক সেভার',
    title: 'আমি কি তোমাকে বিরক্ত করছি? 😢',
    message: 'ঠিক আছে, আর কখনও পড়তে বলব না... নিজের স্ট্রিকের যত্ন নিও!',
    route: '/exam-setup',
    type: 'warning',
    priority: 'high',
  },
  {
    id: 'streak_3',
    category: 'streak',
    categoryLabel: '🔥 স্ট্রিক সেভার',
    title: 'ফোন স্ক্রল করতে করতে স্ট্রিক ভুলে গেলে? 👀',
    message: 'রিলস কালও থাকবে, কিন্তু তোমার সাধের স্ট্রিক আজ রাতেই শেষ হয়ে যাবে! ⏳',
    route: '/exam-setup',
    type: 'warning',
    priority: 'high',
  },

  // 2. সকালের মোটিভেশন
  {
    id: 'morning_1',
    category: 'morning',
    categoryLabel: '☕ সকালের কুইজ',
    title: 'ঘুম থেকে উঠো, স্বপ্ন পূরণ করতে হবে! ☀️',
    message: 'সকালের প্রথম চা খাওয়ার ফাঁকে মাত্র ৫ মিনিটের স্পেশাল টেস্টটা দিয়ে দিন শুরু করো ☕',
    route: '/exam-setup',
    type: 'info',
    priority: 'normal',
  },
  {
    id: 'morning_2',
    category: 'morning',
    categoryLabel: '☕ সকালের কুইজ',
    title: 'বুয়েট/মেডিকেলের সিট কিন্তু বসে নেই! 🩺⚡',
    message: 'তোমার প্রতিদ্বন্দ্বীরা অলরেডি পড়া শুরু করে দিয়েছে। তুমি পিছিয়ে থাকবে কেন?',
    route: '/exam-setup',
    type: 'announcement',
    priority: 'normal',
  },

  // 3. লাইভ পরীক্ষা
  {
    id: 'live_exam_1',
    category: 'live_exam',
    categoryLabel: '🎯 লাইভ পরীক্ষা',
    title: '🎯 লাইভ পরীক্ষা শুরু হতে আর মাত্র ১৫ মিনিট!',
    message: 'আজকের স্পেশাল লাইভ এক্সামের জন্য খাতা-কলম নিয়ে রেডি হও। সবার সাথে লাইভ লড়াই শুরু হচ্ছে ⏱️',
    route: '/live-exams',
    type: 'announcement',
    priority: 'high',
  },
  {
    id: 'live_exam_2',
    category: 'live_exam',
    categoryLabel: '🎯 লাইভ পরীক্ষা',
    title: '🔴 স্পেশাল লাইভ পরীক্ষা এখন সরাসরি চলছে!',
    message: 'দেরি না করে এখনই জয়েন করো, নয়তো সময় কমে যাবে। লিডারবোর্ডের শীর্ষে ওঠো! 🏆',
    route: '/live-exams',
    type: 'announcement',
    priority: 'high',
  },

  // 4. ইনঅ্যাক্টিভিটি ও মিসিং ইউজার
  {
    id: 'inactivity_1',
    category: 'inactivity',
    categoryLabel: '📚 মিসিং ইউজার',
    title: '২ দিন ধরে তোমার দেখা নেই... বইগুলো তো কাঁদছে 😢',
    message: 'সবকিছু কি ঠিক আছে? আজ অন্তত একটি ছোট সেট প্র্যাকটিস করে কামব্যাক করো!',
    route: '/exam-setup',
    type: 'warning',
    priority: 'normal',
  },
  {
    id: 'inactivity_2',
    category: 'inactivity',
    categoryLabel: '📚 মিসিং ইউজার',
    title: 'তোমার পড়ার টেবিল তোমার জন্য অপেক্ষা করছে 🪑',
    message: 'গ্যাপ পড়ে গেলে পড়া পাহাড় সমান ভারী হয়ে যায়। আজই ফিরে আসো ট্র্যাকে 🏃‍♂️',
    route: '/exam-setup',
    type: 'info',
    priority: 'normal',
  },

  // 5. অফার ও মাইলস্টোন
  {
    id: 'offer_1',
    category: 'milestone',
    categoryLabel: '🎁 অফার ও প্রো',
    title: '✨ নতুন প্রো সাবস্ক্রিপশন অফার!',
    message: 'সকল প্রিমিয়াম ফিচার ও স্পেশাল কোশ্চেন আনলক করতে এখনই প্রো সাবস্ক্রাইব করো 🎁',
    route: '/profile/my-subscription',
    type: 'success',
    priority: 'normal',
  },
];
