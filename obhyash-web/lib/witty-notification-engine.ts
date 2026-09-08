/**
 * Exact Chorcha App Style Contextual Notifications
 * Direct, personal, witty, guilt-tripping & live exam reminders
 */

export interface ContextualNotification {
  id: string;
  category: 'morning' | 'afternoon' | 'evening' | 'night_streak' | 'live_exam' | 'inactivity';
  title: string;
  body: string;
  route: string;
  channelId: string;
  priority: 'normal' | 'high';
  type: 'announcement' | 'warning' | 'info' | 'streak';
}

/**
 * Intelligently extracts a friendly nickname from a user's full name.
 * Strips formal prefixes/titles (Md., Mohammad, Most., Kazi, Dr., Engr., etc.)
 * and returns the first calling name (e.g., "Md. Limon Howlader" -> "Limon", "Most. Sadia Akter" -> "Sadia").
 */
export function extractIntelligentNickname(fullName?: string | null): string {
  if (!fullName || typeof fullName !== 'string') return 'বন্ধু';

  const clean = fullName.trim();
  if (!clean) return 'বন্ধু';

  // Words/prefixes to strip
  const ignorePrefixes = new Set([
    'md.', 'md', 'md:', 'mohammad', 'mohammed', 'muhammad', 'mohd', 'mohd.',
    'most.', 'most', 'mst.', 'mst', 'mosa.', 'mosa',
    'dr.', 'dr', 'engr.', 'engr', 'prof.', 'prof',
    'kazi', 'syed', 'syeda', 'sheikh', 'sk.', 'sk', 'al',
    // Bengali prefixes
    'মো:', 'মোঃ', 'মুহাম্মদ', 'মোহাম্মদ', 'মোসা:', 'মোসাম্মৎ', 'ডা:', 'ইঞ্জি:',
  ]);

  // Split by whitespace
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'বন্ধু';

  // Find the first non-prefix calling part
  let callingPart = '';
  for (const p of parts) {
    const normalized = p.toLowerCase().replace(/[,.:_-]/g, '');
    const rawLower = p.toLowerCase();
    if (!ignorePrefixes.has(rawLower) && !ignorePrefixes.has(normalized) && normalized.length > 1) {
      callingPart = p;
      break;
    }
  }

  if (!callingPart) {
    callingPart = parts[0];
  }

  // Strip trailing punctuation like comma/period
  callingPart = callingPart.replace(/[,.:_-]+$/, '').trim();

  return callingPart || 'বন্ধু';
}

export const WITTY_NOTIFICATION_POOLS: Record<string, Array<{ title: string; body: string; type: string; priority: string }>> = {
  // ── 1. রাত ১০:৩০ PM - স্ট্রিক ও ডুওলিঙ্গো/চর্চা গিল্ট-ট্রিপ (Night Streak) ────────────
  night_streak: [
    {
      title: 'টানা {streak}দিন! {name}, আমি কি তোমাকে বিরক্ত করছি?',
      body: 'ঠিক আছে, আর কখনও প্র্যাকটিস করার জন্য বলব না 😢',
      type: 'warning',
      priority: 'high',
    },
    {
      title: '{name}, তোমার {streak} দিনের স্ট্রিক পুড়ছে! 🚨🔥',
      body: 'রাত ১২টা বাজার আগেই মাত্র ৫ মিনিটের ১টি কুইজ দিয়ে স্ট্রিক বাঁচাও 🚒',
      type: 'warning',
      priority: 'high',
    },
    {
      title: '{name}, ঘুমিয়ে পড়লে নাকি? 😱',
      body: 'মাত্র ১টা ছোট প্র্যাকটিস বাকি, নয়তো কাল সকালে স্ট্রিক ০ হয়ে যাবে! ⏳',
      type: 'warning',
      priority: 'high',
    },
    {
      title: '১০:৩০ বেজে গেছে! {name}, আর কত দেরি? 👀',
      body: 'আজকের ডেইলি প্র্যাকটিসটা শেষ করে শান্তিতে ঘুমাতে যাও 😴✨',
      type: 'warning',
      priority: 'high',
    },
  ],

  // ── 2. লাইভ পরীক্ষা ও স্পেশাল টেস্ট ─────────────────────────────────────────
  live_exam: [
    {
      title: '{name}, আজকের লাইভ পরীক্ষায় অংশ নিয়ে প্রস্তুতি যাচাই করে নাও! ⏰',
      body: 'সবার সাথে লাইভ লড়াই শুরু হচ্ছে, দেরি না করে এখনই জয়েন করো 🏃‍♂️💨',
      type: 'announcement',
      priority: 'high',
    },
    {
      title: '🔴 লাইভ এক্সাম শুরু হয়েছে! {name}, তুমি কোথায়? 🎯',
      body: 'লিডারবোর্ডের শীর্ষে ওঠার সুযোগ কিন্তু এখনই! জয়েন করো ⏱️',
      type: 'announcement',
      priority: 'high',
    },
  ],

  // ── 3. সকালের হালকা মোটিভেশন (Morning) ────────────────────────────────────
  morning: [
    {
      title: '{name}, সকালের চায়ের সাথে ১টা কুইজ হয়ে যাক? ☕',
      body: 'মাত্র ৫ মিনিটের প্র্যাকটিস দিয়ে আজকের দিনটা সবার আগে শুরু করো ☀️',
      type: 'info',
      priority: 'normal',
    },
    {
      title: 'ঘুম থেকে উঠো {name}, স্বপ্ন পূরণ করতে হবে! 🩺⚡',
      body: 'প্রতিদ্বন্দ্বীরা অলরেডি রিভিশন শুরু করে দিয়েছে! তুমি পিছিয়ে থাকবে কেন?',
      type: 'info',
      priority: 'normal',
    },
  ],

  // ── 4. দুপুরের অলসতা দূরীকরণ (Afternoon) ──────────────────────────────────
  afternoon: [
    {
      title: 'খাওয়াদাওয়ার পর একটু রিফ্রেশমেন্ট? 🧠⚡',
      body: 'ঘুমানোর আগে মাত্র ৫টা MCQ সলভ করো {name}, পড়া এগিয়ে থাকবে 📖',
      type: 'info',
      priority: 'normal',
    },
  ],

  // ── 5. সন্ধ্যার রিভিশন (Evening) ──────────────────────────────────────────
  evening: [
    {
      title: '{name}, পড়ার টেবিলে তো আছো, তাই না? 🪑📖',
      body: 'আজকের ডেইলি টার্গেট এখনো শেষ হয়নি! ৫ মিনিটে শেষ করে ফেলো 🚀',
      type: 'announcement',
      priority: 'normal',
    },
  ],

  // ── 6. ইনঅ্যাক্টিভিটি (২+ দিন অ্যাপে না আসা) ────────────────────────────────
  inactivity: [
    {
      title: '{name}, ২ দিন ধরে তোমার দেখা নেই... বইগুলো তো কাঁদছে 😢',
      body: 'আজ অন্তত একটি ছোট সেট প্র্যাকটিস করে ট্র্যাকে ফিরে আসো 🤍',
      type: 'warning',
      priority: 'normal',
    },
  ],
};

/**
 * Gets a contextual notification in exact Chorcha app style
 */
export function getContextualNotification(contextOverride?: string): {
  title: string;
  body: string;
  category: string;
  route: string;
  channelId: string;
  type: 'announcement' | 'warning' | 'info' | 'streak';
  priority: 'normal' | 'high';
} {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const bdtHour = (utcHours + 6) % 24;

  let category = 'night_streak';

  if (contextOverride && WITTY_NOTIFICATION_POOLS[contextOverride]) {
    category = contextOverride;
  } else if (bdtHour >= 6 && bdtHour < 12) {
    category = 'morning';
  } else if (bdtHour >= 12 && bdtHour < 17) {
    category = 'afternoon';
  } else if (bdtHour >= 17 && bdtHour < 21) {
    category = 'evening';
  } else {
    category = 'night_streak';
  }

  const pool = WITTY_NOTIFICATION_POOLS[category] || WITTY_NOTIFICATION_POOLS.night_streak;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  return {
    title: picked.title,
    body: picked.body,
    category,
    route: '/dashboard',
    channelId: category === 'night_streak' ? 'obhyash_streak_channel' : 'obhyash_general',
    type: (picked.type as any) || 'warning',
    priority: (picked.priority as any) || 'high',
  };
}
