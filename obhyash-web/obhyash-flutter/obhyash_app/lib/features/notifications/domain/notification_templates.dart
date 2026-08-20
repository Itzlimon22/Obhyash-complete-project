import 'dart:math';

enum NotificationCategory {
  streakSaver,
  morningKickstart,
  afternoonBite,
  inactivityGuilt,
  liveExamAlert,
  examResultPositive,
  examResultEncourage,
  milestoneReward,
  leaderboardNudge,
}

class NotificationTemplate {
  final String id;
  final NotificationCategory category;
  final String title;
  final String body;
  final String defaultRoute;
  final String type; // 'streak', 'live_exam', 'result', 'milestone', 'general'

  const NotificationTemplate({
    required this.id,
    required this.category,
    required this.title,
    required this.body,
    this.defaultRoute = '/exam-setup',
    this.type = 'general',
  });

  /// Replaces {name}, {streak}, {subject}, {score}, {rank}, {exam_title} placeholders
  Map<String, String> format({
    String? name,
    int? streak,
    String? subject,
    num? score,
    int? rank,
    String? examTitle,
  }) {
    final studentName = (name != null && name.trim().isNotEmpty) ? name.trim() : 'শিক্ষার্থী';
    final streakCount = (streak != null && streak > 0) ? streak.toString() : '১';
    final subj = subject ?? 'পদার্থবিজ্ঞান';
    final sc = score != null ? score.toString() : '০';
    final rk = rank != null ? rank.toString() : '১';
    final titleText = examTitle ?? 'মডেল টেস্ট';

    String formattedTitle = title
        .replaceAll('{name}', studentName)
        .replaceAll('{streak}', streakCount)
        .replaceAll('{subject}', subj)
        .replaceAll('{score}', sc)
        .replaceAll('{rank}', rk)
        .replaceAll('{exam_title}', titleText);

    String formattedBody = body
        .replaceAll('{name}', studentName)
        .replaceAll('{streak}', streakCount)
        .replaceAll('{subject}', subj)
        .replaceAll('{score}', sc)
        .replaceAll('{rank}', rk)
        .replaceAll('{exam_title}', titleText);

    return {
      'title': formattedTitle,
      'body': formattedBody,
      'route': defaultRoute,
      'type': type,
    };
  }
}

class NotificationTemplateLibrary {
  static const List<NotificationTemplate> templates = [
    // ── 1. স্ট্রিক সেভার ও রাতের রিমাইন্ডার (Evening Streak Saviors) ───────────
    NotificationTemplate(
      id: 'streak_save_1',
      category: NotificationCategory.streakSaver,
      title: '🚨 {name}, তোমার {streak} দিনের স্ট্রিক পুড়ছে!',
      body: 'আর মাত্র কয়েক ঘণ্টা বাকি! এখনই ১টি ছোট প্র্যাকটিস দিয়ে আগুনটা বাঁচাও 🚒',
      defaultRoute: '/exam-setup',
      type: 'streak',
    ),
    NotificationTemplate(
      id: 'streak_save_2',
      category: NotificationCategory.streakSaver,
      title: 'টানা {streak} দিন! {name}, আমি কি তোমাকে বিরক্ত করছি?',
      body: 'ঠিক আছে, আর কখনও পড়তে বলব না... নিজের স্ট্রিকের যত্ন নিও 😢',
      defaultRoute: '/exam-setup',
      type: 'streak',
    ),
    NotificationTemplate(
      id: 'streak_save_3',
      category: NotificationCategory.streakSaver,
      title: 'ফোন স্ক্রল করতে করতে স্ট্রিক ভুলে গেলে? 👀',
      body: 'রিলস কালও থাকবে, কিন্তু তোমার সাধের {streak} দিনের স্ট্রিক আজ রাতেই শেষ হয়ে যাবে! ⏳',
      defaultRoute: '/exam-setup',
      type: 'streak',
    ),
    NotificationTemplate(
      id: 'streak_save_4',
      category: NotificationCategory.streakSaver,
      title: 'ঘুমিয়ে পড়লে নাকি {name}? 😱',
      body: 'মাত্র ১টা ৫ মিনিটের কুইজ দাও, নয়তো কাল সকালে স্ট্রিক ০ দেখে আফসোস করবে 😭',
      defaultRoute: '/exam-setup',
      type: 'streak',
    ),
    NotificationTemplate(
      id: 'streak_save_5',
      category: NotificationCategory.streakSaver,
      title: 'শেষ ডাক {name}! ঘড়ির কাঁটা কিন্তু ঘুরছে ⏰',
      body: 'রাত ১২টার আগে মাত্র ১০টি এমসিকিউ সলভ করে স্ট্রিকটা টিকিয়ে রাখো! ⚡',
      defaultRoute: '/exam-setup',
      type: 'streak',
    ),
    NotificationTemplate(
      id: 'streak_save_6',
      category: NotificationCategory.streakSaver,
      title: 'তোমার স্ট্রিক আজ রাতে আইসিইউতে! 🏥',
      body: 'মাত্র ১টি টেস্টই পারে একে বাঁচাতে। ডাক্তার বলেছে আর দেরি করা যাবে না 🩺',
      defaultRoute: '/exam-setup',
      type: 'streak',
    ),

    // ── 2. সকালের মোটিভেশন ও চা-টাইম কুইজ (Morning Kickstarters) ──────────────
    NotificationTemplate(
      id: 'morning_1',
      category: NotificationCategory.morningKickstart,
      title: 'ঘুম থেকে উঠো {name}, স্বপ্ন পূরণ করতে হবে! ☀️',
      body: 'সকালের প্রথম চা খাওয়ার ফাঁকে মাত্র ৫ মিনিটের স্পেশাল টেস্টটা দিয়ে দিন শুরু করো ☕',
      defaultRoute: '/exam-setup',
      type: 'general',
    ),
    NotificationTemplate(
      id: 'morning_2',
      category: NotificationCategory.morningKickstart,
      title: 'আজকের দিনের প্রথম চ্যালেঞ্জটা নিয়ে নাও! ⏱️',
      body: 'সকালে ১০টি কঠিন প্রশ্ন সমাধান করলে সারাদিনের পড়াশোনার কনফিডেন্স বেড়ে যায় দ্বিগুণ 🧠',
      defaultRoute: '/exam-setup',
      type: 'general',
    ),
    NotificationTemplate(
      id: 'morning_3',
      category: NotificationCategory.morningKickstart,
      title: 'বুয়েট/মেডিকেলের সিট কিন্তু বসে নেই {name}! 🩺⚡',
      body: 'তোমার প্রতিদ্বন্দ্বীরা অলরেডি পড়া শুরু করে দিয়েছে। তুমি পিছিয়ে থাকবে কেন?',
      defaultRoute: '/exam-setup',
      type: 'general',
    ),
    NotificationTemplate(
      id: 'morning_4',
      category: NotificationCategory.morningKickstart,
      title: 'চা ঠান্ডা হওয়ার আগেই কুইজ শেষ করো! 🍵',
      body: 'মাত্র ৫ মিনিট সময় দাও, নিজের মেমোরি কতটা শার্প নিজেই পরীক্ষা করে নাও 💡',
      defaultRoute: '/exam-setup',
      type: 'general',
    ),

    // ── 3. দুপুরের হালকা রিভিশন (Afternoon Quick Bites) ───────────────────────
    NotificationTemplate(
      id: 'afternoon_1',
      category: NotificationCategory.afternoonBite,
      title: 'ভাতঘুমের আলসেমি দূর করার সেরা উপায়! 🥱',
      body: '৫ মিনিটের একটি র‍্যাপিড ফায়ার কুইজ খেলো, ঘুম একদম উড়ে যাবে 🎯',
      defaultRoute: '/exam-setup',
      type: 'general',
    ),
    NotificationTemplate(
      id: 'afternoon_2',
      category: NotificationCategory.afternoonBite,
      title: '{name}, {subject} এর এই নিয়মটা মনে আছে তো? 📖',
      body: 'মাত্র ৩টি প্রশ্নে নিজেকে যাচাই করে নাও। রিভিশন ছাড়া প্রস্তুতি কিন্তু অসম্পূর্ণ!',
      defaultRoute: '/question-bank',
      type: 'general',
    ),

    // ── 4. ইনঅ্যাক্টিভিটি ও কামব্যাক (User Inactivity / Missing) ─────────────
    NotificationTemplate(
      id: 'inactivity_1',
      category: NotificationCategory.inactivityGuilt,
      title: '২ দিন ধরে তোমার দেখা নেই {name}... বইগুলো তো কাঁদছে 📚😢',
      body: 'সবকিছু কি ঠিক আছে? আজ অন্তত একটি ছোট সেট প্র্যাকটিস করে কামব্যাক করো!',
      defaultRoute: '/exam-setup',
      type: 'general',
    ),
    NotificationTemplate(
      id: 'inactivity_2',
      category: NotificationCategory.inactivityGuilt,
      title: 'তোমার পড়ার টেবিল তোমার জন্য অপেক্ষা করছে 🪑',
      body: 'গ্যাপ পড়ে গেলে পড়া পাহাড় সমান ভারী হয়ে যায়। আজই ফিরে আসো ট্র্যাকে 🏃‍♂️',
      defaultRoute: '/exam-setup',
      type: 'general',
    ),
    NotificationTemplate(
      id: 'inactivity_3',
      category: NotificationCategory.inactivityGuilt,
      title: 'আমরা কি কোনো ভুল করেছি {name}? 🥺',
      body: 'তুমি না পড়লে কার মেধা যাচাই করব বলো? অ্যাপে তোমার জন্য নতুন প্রশ্ন রেডি আছে!',
      defaultRoute: '/exam-setup',
      type: 'general',
    ),

    // ── 5. লাইভ পরীক্ষা ও জরুরি অ্যালার্ট (Live Exam Alerts) ───────────────────
    NotificationTemplate(
      id: 'live_exam_1',
      category: NotificationCategory.liveExamAlert,
      title: '🎯 লাইভ পরীক্ষা শুরু হতে আর মাত্র ১৫ মিনিট!',
      body: '{exam_title} এর জন্য খাতা-কলম নিয়ে রেডি হও। সবার সাথে লাইভ লড়াই শুরু হচ্ছে ⏱️',
      defaultRoute: '/live-exams',
      type: 'live_exam',
    ),
    NotificationTemplate(
      id: 'live_exam_2',
      category: NotificationCategory.liveExamAlert,
      title: '🔴 {exam_title} এখন সরাসরি লাইভ চলছে!',
      body: 'দেরি না করে এখনই জয়েন করো, নয়তো সময় কমে যাবে। লিডারবোর্ডের শীর্ষে ওঠো! 🏆',
      defaultRoute: '/live-exams',
      type: 'live_exam',
    ),
    NotificationTemplate(
      id: 'live_exam_3',
      category: NotificationCategory.liveExamAlert,
      title: '⏳ শেষ সুযোগ! পরীক্ষা শেষ হতে আর ৩০ মিনিট বাকি',
      body: '{exam_title} সাবমিট না করলে তোমার র‍্যাংকিং গণনা করা হবে না। দ্রুত শেষ করো!',
      defaultRoute: '/live-exams',
      type: 'live_exam',
    ),

    // ── 6. পরীক্ষার দারুণ ফলাফল (Positive Exam Results) ──────────────────────
    NotificationTemplate(
      id: 'result_pos_1',
      category: NotificationCategory.examResultPositive,
      title: '🔥 আগুন পারফরম্যান্স {name}! পেয়েছ {score}%',
      body: '{exam_title} পরীক্ষায় তুমি দারুণ করেছ! লিডারবোর্ডে তোমার অবস্থান দেখে নাও 🏅',
      defaultRoute: '/history',
      type: 'result',
    ),
    NotificationTemplate(
      id: 'result_pos_2',
      category: NotificationCategory.examResultPositive,
      title: '👏 সাবাশ! তুমি লিডারবোর্ডে #{rank} নম্বরে আছো',
      body: 'তোমার কঠোর পরিশ্রম কাজে দিচ্ছে। এই মোমেন্টাম ধরে রাখো শেষ পর্যন্ত!',
      defaultRoute: '/history',
      type: 'result',
    ),

    // ── 7. উৎসাহব্যঞ্জক ফলাফল (Encouragement on Low Score / Mistakes) ────────
    NotificationTemplate(
      id: 'result_enc_1',
      category: NotificationCategory.examResultEncourage,
      title: 'ভুল থেকেই আসল শেখা শুরু হয় {name} 💡',
      body: 'যে প্রশ্নগুলো ভুল হয়েছে সেগুলোর ব্যাখ্যা এখনই দেখে নাও, ভুলগুলোকে শক্তিতে রূপ দাও!',
      defaultRoute: '/history',
      type: 'result',
    ),
    NotificationTemplate(
      id: 'result_enc_2',
      category: NotificationCategory.examResultEncourage,
      title: 'মন খারাপের কিছু নেই! অনুশীলনই তোমাকে পারফেক্ট করবে 🎯',
      body: 'আজকের টেস্টের ভুল উত্তরগুলো রিভিশন দিয়ে কালকের জন্য নিজেকে আরও প্রস্তুত করো।',
      defaultRoute: '/history',
      type: 'result',
    ),

    // ── 8. মাইলস্টোন সেলিব্রেশন (Milestones: 7, 30, 50, 100 Days) ─────────────
    NotificationTemplate(
      id: 'milestone_7',
      category: NotificationCategory.milestoneReward,
      title: '🎉 অসাধারণ! টানা ৭ দিনের স্ট্রিক কমপ্লিট!',
      body: '{name}, তুমি টানা ১ সপ্তাহ ধরে নিয়ম মেনে পড়ছ। তুমি কিন্তু এখন অন্য লেভেলে! 🚀',
      defaultRoute: '/profile/my-profile',
      type: 'milestone',
    ),
    NotificationTemplate(
      id: 'milestone_30',
      category: NotificationCategory.milestoneReward,
      title: '👑 টানা ৩০ দিন! তুমি অভ্যাসের মাস্টার!',
      body: '১ মাস একটানা অনুশীলন করা মুখের কথা নয়। তোমার জন্য বিশেষ ব্যাজ আনলক হয়েছে 🎖️',
      defaultRoute: '/profile/my-profile',
      type: 'milestone',
    ),
  ];

  /// Get random template for a specific category
  static NotificationTemplate getRandom(NotificationCategory category) {
    final list = templates.where((t) => t.category == category).toList();
    if (list.isEmpty) return templates.first;
    return list[Random().nextInt(list.length)];
  }

  /// Get random streak saver template
  static NotificationTemplate getRandomStreakSaver() {
    return getRandom(NotificationCategory.streakSaver);
  }

  /// Get random morning kickstarter template
  static NotificationTemplate getRandomMorning() {
    return getRandom(NotificationCategory.morningKickstart);
  }

  /// Get random inactivity recovery template
  static NotificationTemplate getRandomInactivity() {
    return getRandom(NotificationCategory.inactivityGuilt);
  }
}
