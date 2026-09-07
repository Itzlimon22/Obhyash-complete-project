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
  bookmarkAlert,
  welcome,
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
    this.defaultRoute = '/setup',
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
    final sc = score != null ? score.toStringAsFixed(score.truncateToDouble() == score ? 0 : 1) : '০';
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
    // ── 1. স্ট্রিক সেভার ও রাতের রিমাইন্ডার (Evening & Night Panic - Duolingo/Chorcha Style) ─
    NotificationTemplate(
      id: 'streak_save_1',
      category: NotificationCategory.streakSaver,
      title: '🚨 {name}, তোমার {streak} দিনের স্ট্রিক পুড়ছে!',
      body: 'ফায়ার সার্ভিস ডাকার আগেই ১টি ৫ মিনিটের কুইজ দিয়ে আগুনটা বাঁচাও 🚒🔥 রাত ১২টার পর কিন্তু আফসোস বাড়বে!',
      defaultRoute: '/setup',
      type: 'streak',
    ),
    NotificationTemplate(
      id: 'streak_save_2',
      category: NotificationCategory.streakSaver,
      title: 'ঠিক আছে, আর কখনও পড়তে বলব না... 💔',
      body: 'টানা {streak} দিন পড়ে আজ স্ট্রিক ভুলে গেলে? নিজের স্ট্রিকের যত্ন নিও... আমি আর কিছু বলব না 😢',
      defaultRoute: '/setup',
      type: 'streak',
    ),
    NotificationTemplate(
      id: 'streak_save_3',
      category: NotificationCategory.streakSaver,
      title: 'রিলস কালও থাকবে, কিন্তু স্ট্রিক থাকবে না! 👀',
      body: 'ফোন স্ক্রল করতে করতে স্ট্রিক ভুলে গেলে? তোমার সাধের {streak} দিনের স্ট্রিক আজ রাতেই শেষ হবে! ⏳',
      defaultRoute: '/setup',
      type: 'streak',
    ),
    NotificationTemplate(
      id: 'streak_save_4',
      category: NotificationCategory.streakSaver,
      title: 'ঘুমিয়ে পড়লে নাকি {name}? 😱',
      body: 'মাত্র ১টা ৫ মিনিটের কুইজ দাও, নয়তো কাল সকালে স্ট্রিক ০ দেখে কেঁদে বুক ভাসাবে 😭',
      defaultRoute: '/setup',
      type: 'streak',
    ),
    NotificationTemplate(
      id: 'streak_save_5',
      category: NotificationCategory.streakSaver,
      title: 'তোমার স্ট্রিক আজ রাতে আইসিইউতে! 🏥',
      body: 'ডাক্তার বলেছে আর দেরি করা যাবে না! মাত্র ১টি টেস্টই পারে একে জীবন ফিরিয়ে দিতে 🩺⚡',
      defaultRoute: '/setup',
      type: 'streak',
    ),
    NotificationTemplate(
      id: 'streak_save_6',
      category: NotificationCategory.streakSaver,
      title: 'শেষ ডাক {name}! ঘড়ির কাঁটা কিন্তু থামবে না ⏰',
      body: 'রাত ১২টা বাজতে আর অল্প বাকি। ১০টি এমসিকিউ সলভ করে আগুনটা টিকিয়ে রাখো! ⚡',
      defaultRoute: '/setup',
      type: 'streak',
    ),

    // ── 2. সকালের মোটিভেশন ও চা-টাইম কুইজ (Morning Kickstarters) ──────────────
    NotificationTemplate(
      id: 'morning_1',
      category: NotificationCategory.morningKickstart,
      title: 'চা ঠান্ডা হওয়ার আগেই কুইজ শেষ করো! 🍵',
      body: 'সকালের প্রথম চা খাওয়ার ফাঁকে মাত্র ৫ মিনিট দাও, দেখা যাক চা জেতে নাকি তোমার ব্রেন 💡☕',
      defaultRoute: '/setup',
      type: 'general',
    ),
    NotificationTemplate(
      id: 'morning_2',
      category: NotificationCategory.morningKickstart,
      title: 'ঘুম থেকে উঠো {name}, বুয়েট/মেডিকেল ডাকছে! 🩺⚡',
      body: 'তোমার প্রতিদ্বন্দ্বীরা অলরেডি পড়া শুরু করে দিয়েছে। তুমি কাঁথা মুড়ি দিয়ে পিছিয়ে থাকবে নাকি? 🛌',
      defaultRoute: '/setup',
      type: 'general',
    ),
    NotificationTemplate(
      id: 'morning_3',
      category: NotificationCategory.morningKickstart,
      title: 'আজকের দিনের প্রথম চ্যালেঞ্জটা নিয়ে নাও! ⏱️',
      body: 'সকালে ১০টি এমসিকিউ জয় করলে সারাদিনের পড়াশোনার কনফিডেন্স বেড়ে যায় দ্বিগুণ 🧠🔥',
      defaultRoute: '/setup',
      type: 'general',
    ),

    // ── 3. দুপুরের হালকা রিভিশন (Afternoon Quick Bites) ───────────────────────
    NotificationTemplate(
      id: 'afternoon_1',
      category: NotificationCategory.afternoonBite,
      title: 'ভাতঘুমের আলসেমি তাড়ানোর সেরা দাওয়াই! 🥱',
      body: '৫ মিনিটের একটি র‍্যাপিড ফায়ার কুইজ খেলো, আলসেমি একদম হাওয়া হয়ে যাবে 🎯',
      defaultRoute: '/setup',
      type: 'general',
    ),
    NotificationTemplate(
      id: 'afternoon_2',
      category: NotificationCategory.afternoonBite,
      title: '{name}, {subject} এর এই ফর্মুলাটা মনে আছে তো? 📖',
      body: 'মাত্র ৩টি প্রশ্নে নিজেকে যাচাই করে নাও। রিভিশন ছাড়া প্রস্তুতি কিন্তু ফাঁকা আওয়াজ!',
      defaultRoute: '/question-bank',
      type: 'general',
    ),

    // ── 4. ইনঅ্যাক্টিভিটি ও কামব্যাক (Guilt-trip Comeback) ─────────────────────
    NotificationTemplate(
      id: 'chorcha_exact_1',
      category: NotificationCategory.inactivityGuilt,
      title: 'কি ব্যাপার {name}?',
      body: 'একটা মক টেস্ট কি দিয়ে দেখা যায় না? 😒',
      defaultRoute: '/setup',
      type: 'general',
    ),
    NotificationTemplate(
      id: 'inactivity_1',
      category: NotificationCategory.inactivityGuilt,
      title: 'পড়ার টেবিল কাঁদছে, বইগুলো অভিমান করেছে... 📚😢',
      body: '২ দিন ধরে তোমার দেখা নেই {name}... আজ অন্তত ১টি ছোট প্র্যাকটিস দিয়ে মান ভাঙাও!',
      defaultRoute: '/setup',
      type: 'general',
    ),
    NotificationTemplate(
      id: 'inactivity_2',
      category: NotificationCategory.inactivityGuilt,
      title: 'আমরা কি কোনো ভুল করেছি {name}? 🥺',
      body: 'তুমি না পড়লে কার মেধা যাচাই করব বলো? অ্যাপে তোমার জন্য ফ্রেশ প্রশ্ন রেডি আছে 🏃‍♂️',
      defaultRoute: '/setup',
      type: 'general',
    ),

    // ── 5. লাইভ পরীক্ষা ও জরুরি অ্যালার্ট (Live Exam Alerts) ───────────────────
    NotificationTemplate(
      id: 'live_exam_1',
      category: NotificationCategory.liveExamAlert,
      title: '🎯 লাইভ পরীক্ষা শুরু হতে আর মাত্র ১৫ মিনিট!',
      body: '{exam_title} এর জন্য প্রস্তুত হও। সারা দেশের হাজারো শিক্ষার্থীর সাথে সরাসরি লড়াই! ⏱️',
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

    // ── 6. পরীক্ষার দারুণ ফলাফল (Positive Exam Results) ──────────────────────
    NotificationTemplate(
      id: 'result_pos_1',
      category: NotificationCategory.examResultPositive,
      title: '🔥 আগুন পারফরম্যান্স {name}! পেয়েছ {score}%',
      body: '{exam_title} পরীক্ষায় তুমি ফাটিয়ে দিয়েছ! এলাকার মিষ্টির দোকানে অগ্রিম অর্ডার দিয়ে রাখো 🍬🏅',
      defaultRoute: '/history',
      type: 'result',
    ),
    NotificationTemplate(
      id: 'result_pos_2',
      category: NotificationCategory.examResultPositive,
      title: '👏 সাবাশ! তুমি লিডারবোর্ডে #{rank} নম্বরে আছো',
      body: 'তোমার পরিশ্রম বৃথা যাবে না। এই মোমেন্টাম ধরে রাখলে চান্স নিশ্চিত! 🚀',
      defaultRoute: '/history',
      type: 'result',
    ),

    // ── 7. উৎসাহব্যঞ্জক ফলাফল (Encouragement on Low Score / Mistakes) ────────
    NotificationTemplate(
      id: 'result_enc_1',
      category: NotificationCategory.examResultEncourage,
      title: '🙈 স্কোর দেখে আমি চোখ বন্ধ করে ফেলেছি... {score}%?!',
      body: '{exam_title} এর ভুলগুলোর সমাধান দ্রুত দেখে নাও, নয়তো রাতে দুঃস্বপ্ন দেখবে 👻📖 এখনই রিভিশন দাও!',
      defaultRoute: '/history',
      type: 'result',
    ),
    NotificationTemplate(
      id: 'result_enc_2',
      category: NotificationCategory.examResultEncourage,
      title: 'ভুল থেকেই আসল শেখা শুরু হয় {name} 💡',
      body: 'যে প্রশ্নগুলো ভুল হয়েছে সেগুলোর ব্যাখ্যা এখনই দেখে নাও, ভুলগুলোকে শক্তিতে রূপ দাও!',
      defaultRoute: '/history',
      type: 'result',
    ),

    // ── 8. মাইলস্টোন সেলিব্রেশন (Milestones) ──────────────────────────────────
    NotificationTemplate(
      id: 'milestone_7',
      category: NotificationCategory.milestoneReward,
      title: '🎉 ইতিহাস সৃষ্টি! টানা ৭ দিনের স্ট্রিক সম্পন্ন!',
      body: '{name}, তুমি টানা ১ সপ্তাহ ধরে নিয়ম মেনে পড়ছ। তুমি কিন্তু এখন প্রো লেভেলে! 🚀',
      defaultRoute: '/profile/my-profile',
      type: 'milestone',
    ),
    NotificationTemplate(
      id: 'milestone_30',
      category: NotificationCategory.milestoneReward,
      title: '👑 টানা ৩০ দিন! তুমি অভ্যাসের মাস্টার!',
      body: '১ মাস একটানা অনুশীলন করা মুখের কথা নয়। তোমার জন্য স্পেশাল ব্যাজ আনলক হয়েছে 🎖️',
      defaultRoute: '/profile/my-profile',
      type: 'milestone',
    ),

    // ── 9. বুকমার্ক ও অনবোর্ডিং ─────────────────────────────────────────────
    NotificationTemplate(
      id: 'bookmark_saved',
      category: NotificationCategory.bookmarkAlert,
      title: '📑 ভুলে যাওয়ার আগেই বুকমার্কে রেখে দিলাম!',
      body: 'পরীক্ষার আগের রাতে কিন্তু এটা এক পলক দেখতে হবে, কোনো ফাঁকিবাজি চলবে না 🧠',
      defaultRoute: '/profile/bookmarks',
      type: 'general',
    ),
    NotificationTemplate(
      id: 'welcome_onboard',
      category: NotificationCategory.welcome,
      title: '🎉 অভ্যাসে স্বাগতম {name}! যাত্রা শুরু হলো',
      body: 'প্রতিদিন অল্প অল্প পড়ে অভ্যাস গড়ে তোলো। হাজারো প্রতিযোগীর ভিড়ে নিজেকে সেরা প্রমাণ করো 🎓',
      defaultRoute: '/setup',
      type: 'general',
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

  /// Get exam result notification (high score vs encouragement)
  static Map<String, String> getExamResultNotification({
    String? name,
    required String examTitle,
    required num score,
    int? rank,
  }) {
    final isHigh = score >= 75;
    final template = getRandom(
      isHigh ? NotificationCategory.examResultPositive : NotificationCategory.examResultEncourage,
    );
    return template.format(
      name: name,
      examTitle: examTitle,
      score: score,
      rank: rank ?? 1,
    );
  }
}
