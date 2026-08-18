import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../providers/dashboard_providers.dart';

/// ─── Master Daily Mission Template ───────────────────────────────────────────
class MasterDailyMission {
  final String id;
  final String title;
  final String description;
  final String metricType; // exams_count, correct_answers, streak, accuracy_80, live_or_practice, total_mcqs
  final int target;
  final int xpReward;
  final Color deepColor;

  const MasterDailyMission({
    required this.id,
    required this.title,
    required this.description,
    required this.metricType,
    required this.target,
    required this.xpReward,
    required this.deepColor,
  });
}

/// ─── 10 Most Essential & Effective Master Missions ───────────────────────────
class MasterMissionsPool {
  static const List<MasterDailyMission> pool = [
    // 1. Full Model Test
    MasterDailyMission(
      id: 'mission_exam_1',
      title: 'মডেল টেস্ট চ্যাম্পিয়ন',
      description: 'আজকের যেকোনো ১টি পূর্ণাঙ্গ মডেল টেস্ট বা পরীক্ষা সম্পন্ন করো',
      metricType: 'exams_count',
      target: 1,
      xpReward: 30,
      deepColor: Color(0xFF004633), // Signature Deep Emerald Green
    ),
    // 2. 15 Correct Answers
    MasterDailyMission(
      id: 'mission_correct_15',
      title: 'নির্ভুল নিশানাবাজ',
      description: 'আজ কমপক্ষে ১৫টি প্রশ্নের সঠিক উত্তর দাও',
      metricType: 'correct_answers',
      target: 15,
      xpReward: 25,
      deepColor: Color(0xFFB91C1C), // Deep Crimson Red
    ),
    // 3. 30 Correct Answers Pro Challenge
    MasterDailyMission(
      id: 'mission_correct_30',
      title: 'মাস্টার ব্রেইন',
      description: 'আজ কমপক্ষে ৩০টি প্রশ্নের সঠিক উত্তর দিয়ে পারদর্শী হও',
      metricType: 'correct_answers',
      target: 30,
      xpReward: 40,
      deepColor: Color(0xFF4F46E5), // Indigo
    ),
    // 4. Daily Streak
    MasterDailyMission(
      id: 'mission_streak_1',
      title: 'অবিচল অনুশীলন',
      description: 'আজকের ডেইলি পড়ার স্ট্রিক বজায় রাখো',
      metricType: 'streak',
      target: 1,
      xpReward: 20,
      deepColor: Color(0xFFD97706), // Amber Flame
    ),
    // 5. Double Exam Challenge
    MasterDailyMission(
      id: 'mission_exam_2',
      title: 'ডাবল চ্যালেঞ্জ',
      description: 'আজ যেকোনো ২টি ভিন্ন বিষয়ে পরীক্ষা সম্পন্ন করো',
      metricType: 'exams_count',
      target: 2,
      xpReward: 45,
      deepColor: Color(0xFF0F766E), // Teal
    ),
    // 6. 80%+ Accuracy Exam
    MasterDailyMission(
      id: 'mission_accuracy_80',
      title: 'পারফেকশনিস্ট',
      description: 'যেকোনো একটি পরীক্ষায় ৮০% বা তার বেশি নির্ভুল স্কোর অর্জন করো',
      metricType: 'accuracy_80',
      target: 1,
      xpReward: 35,
      deepColor: Color(0xFF7C3AED), // Violet
    ),
    // 7. Live / Practice Exam Participation
    MasterDailyMission(
      id: 'mission_live_practice',
      title: 'প্রতিযোগিতার মাঠে',
      description: 'আজকের লাইভ এক্সাম বা কোনো অনুশীলনী পরীক্ষায় অংশগ্রহণ করো',
      metricType: 'live_or_practice',
      target: 1,
      xpReward: 30,
      deepColor: Color(0xFFE11D48), // Rose
    ),
    // 8. 10 Correct Answers Sprint
    MasterDailyMission(
      id: 'mission_speed_correct_10',
      title: 'কুইক স্প্রিন্টার',
      description: 'যেকোনো পরীক্ষায় কমপক্ষে ১০টি সঠিক উত্তর দিয়ে সাবমিট করো',
      metricType: 'correct_answers',
      target: 10,
      xpReward: 20,
      deepColor: Color(0xFF059669), // Emerald
    ),
    // 9. Solve 40 MCQs
    MasterDailyMission(
      id: 'mission_solve_40_mcqs',
      title: 'এমসিকিউ ম্যারাথন',
      description: 'আজ সব মিলিয়ে মোট ৪০টি প্রশ্ন সমাধান করো',
      metricType: 'total_mcqs',
      target: 40,
      xpReward: 40,
      deepColor: Color(0xFFEA580C), // Orange
    ),
    // 10. 20 Correct Answers Goal
    MasterDailyMission(
      id: 'mission_correct_20',
      title: 'লক্ষ্য পূরণ',
      description: 'আজ বিভিন্ন পরীক্ষায় মোট ২০টি প্রশ্নের সঠিক উত্তর দাও',
      metricType: 'correct_answers',
      target: 20,
      xpReward: 30,
      deepColor: Color(0xFF2563EB), // Blue
    ),
  ];

  /// Pick 2 distinct random missions deterministically per user per date
  static List<MasterDailyMission> getTodaysMissions(String userId, DateTime date) {
    final dateKey = "${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}";
    final combinedKey = "$userId-$dateKey";

    // 32-bit FNV-1a deterministic hash
    int hash = 0x811c9dc5;
    for (int i = 0; i < combinedKey.length; i++) {
      hash ^= combinedKey.codeUnitAt(i);
      hash = (hash * 0x01000193) & 0x7FFFFFFF;
    }

    final int len = pool.length;
    final int index1 = hash % len;
    int index2 = ((hash ~/ len) + 3) % len;
    if (index2 == index1) {
      index2 = (index1 + 1) % len;
    }

    return [pool[index1], pool[index2]];
  }
}

/// ─── Runtime Daily Quest Model ───────────────────────────────────────────────
class DailyQuest {
  final String id;
  final String title;
  final String description;
  final int target;
  final int current;
  final int xpReward;
  final bool isClaimed;
  final Color deepColor;

  DailyQuest({
    required this.id,
    required this.title,
    required this.description,
    required this.target,
    required this.current,
    required this.xpReward,
    required this.isClaimed,
    required this.deepColor,
  });

  bool get isCompleted => current >= target;
  double get progress => (target > 0) ? (current / target).clamp(0.0, 1.0) : 0.0;
}

class DailyQuestsCard extends ConsumerStatefulWidget {
  const DailyQuestsCard({super.key});

  @override
  ConsumerState<DailyQuestsCard> createState() => _DailyQuestsCardState();
}

class _DailyQuestsCardState extends ConsumerState<DailyQuestsCard> {
  List<DailyQuest> _quests = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadQuests();
  }

  static String _toBanglaDigits(dynamic number) {
    const en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    String s = number.toString();
    for (int i = 0; i < 10; i++) {
      s = s.replaceAll(en[i], bn[i]);
    }
    return s;
  }

  Future<void> _loadQuests() async {
    final user = ref.read(authProvider);
    if (user == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    try {
      final now = DateTime.now();
      final todayDateOnly = DateTime(now.year, now.month, now.day);
      final todayStart = todayDateOnly.toUtc().toIso8601String();
      final todayKey = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
      final sb = Supabase.instance.client;

      // 1. Fetch today's exam results
      final examResults = await sb
          .from('exam_results')
          .select('correct_count, wrong_count, total_questions, created_at')
          .eq('user_id', user.id)
          .gte('created_at', todayStart);

      int todayExamsCount = examResults.length;
      int todayCorrectAnswers = 0;
      int todayTotalMcqs = 0;
      int todayAccuracy80Count = 0;

      for (final r in examResults) {
        final correct = (r['correct_count'] as num?)?.toInt() ?? 0;
        final wrong = (r['wrong_count'] as num?)?.toInt() ?? 0;
        final total = (r['total_questions'] as num?)?.toInt() ?? (correct + wrong);

        todayCorrectAnswers += correct;
        todayTotalMcqs += (correct + wrong);

        if (total > 0 && (correct / total) >= 0.8) {
          todayAccuracy80Count++;
        }
      }

      // 2. Fetch today's live exam attempts
      int todayLiveOrPracticeCount = 0;
      try {
        final liveAttempts = await sb
            .from('live_exam_attempts')
            .select('score, correct_count, wrong_count, submit_time')
            .eq('user_id', user.id)
            .gte('submit_time', todayStart);

        todayLiveOrPracticeCount += (liveAttempts as List).length;
        todayExamsCount += (liveAttempts).length;

        for (final l in liveAttempts) {
          final c = (l['correct_count'] as num?)?.toInt() ?? 0;
          final w = (l['wrong_count'] as num?)?.toInt() ?? 0;
          todayCorrectAnswers += c;
          todayTotalMcqs += (c + w);
        }
      } catch (_) {}

      // 3. User streak
      final profile = await ref.read(userProfileProvider.future);
      final currentStreak = profile?.streakCount ?? 0;

      // 4. Select the 2 Random Missions for Today
      final assignedMissions = MasterMissionsPool.getTodaysMissions(user.id, now);

      // 5. Check claimed states
      final prefs = await SharedPreferences.getInstance();
      final List<DailyQuest> resolvedQuests = [];

      for (final m in assignedMissions) {
        final isClaimed = prefs.getBool('quest_claimed_${user.id}_${todayKey}_${m.id}') ?? false;
        int currentVal = 0;

        switch (m.metricType) {
          case 'exams_count':
            currentVal = todayExamsCount;
            break;
          case 'correct_answers':
            currentVal = todayCorrectAnswers;
            break;
          case 'streak':
            currentVal = (currentStreak > 0 || todayExamsCount > 0) ? 1 : 0;
            break;
          case 'accuracy_80':
            currentVal = todayAccuracy80Count;
            break;
          case 'live_or_practice':
            currentVal = todayLiveOrPracticeCount;
            break;
          case 'total_mcqs':
            currentVal = todayTotalMcqs;
            break;
          default:
            currentVal = todayExamsCount;
        }

        resolvedQuests.add(
          DailyQuest(
            id: m.id,
            title: m.title,
            description: m.description,
            target: m.target,
            current: currentVal.clamp(0, m.target),
            xpReward: m.xpReward,
            isClaimed: isClaimed,
            deepColor: m.deepColor,
          ),
        );
      }

      if (mounted) {
        setState(() {
          _quests = resolvedQuests;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('[DailyQuests] Error loading quests: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _claimQuest(DailyQuest quest) async {
    final user = ref.read(authProvider);
    if (user == null || !quest.isCompleted || quest.isClaimed) return;

    HapticFeedback.mediumImpact();
    final now = DateTime.now();
    final todayKey = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('quest_claimed_${user.id}_${todayKey}_${quest.id}', true);

    try {
      final sb = Supabase.instance.client;
      // Try atomic RPC claim
      try {
        await sb.rpc('claim_daily_quest', params: {
          'p_user_id': user.id,
          'p_quest_id': quest.id,
          'p_xp_reward': quest.xpReward,
        });
      } catch (_) {
        await sb.rpc('increment_user_xp', params: {
          'p_user_id': user.id,
          'p_xp': quest.xpReward,
        });
      }
      ref.invalidate(userProfileProvider);
    } catch (e) {
      debugPrint('[DailyQuests] Error claiming XP: $e');
    }

    _loadQuests();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const SizedBox.shrink();
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor = isDark ? const Color(0xFF131316) : Colors.white;
    final borderColor = isDark ? const Color(0xFF26262B) : const Color(0xFFE5E7EB);

    final completedCount = _quests.where((q) => q.isCompleted).length;
    final isAllCompleted = _quests.isNotEmpty && completedCount == _quests.length;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor, width: 1),
        boxShadow: [
          if (!isDark)
            BoxShadow(
              color: const Color(0xFF0F172A).withValues(alpha: 0.04),
              blurRadius: 14,
              offset: const Offset(0, 4),
            ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header (Clean, Premium Typography & Pill)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    'আজকের মিশন',
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 16.5,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6.5, vertical: 1.5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF004633).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'ডেইলি ২ মিশন',
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF004633),
                      ),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3.5),
                decoration: BoxDecoration(
                  color: isAllCompleted
                      ? const Color(0xFF004633).withValues(alpha: 0.12)
                      : (isDark ? const Color(0xFF202024) : const Color(0xFFF3F4F6)),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isAllCompleted
                        ? const Color(0xFF004633).withValues(alpha: 0.3)
                        : (isDark ? const Color(0xFF2E2E33) : const Color(0xFFE5E7EB)),
                    width: 0.8,
                  ),
                ),
                child: Text(
                  '${_toBanglaDigits(completedCount)}/${_toBanglaDigits(_quests.length)} সম্পন্ন',
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isAllCompleted
                        ? const Color(0xFF004633)
                        : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF4B5563)),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Quest Items List (2 Daily Random Missions)
          ..._quests.map((quest) {
            return _QuestItemRow(
              quest: quest,
              isDark: isDark,
              onClaim: () => _claimQuest(quest),
            );
          }),
        ],
      ),
    );
  }
}

class _QuestItemRow extends StatelessWidget {
  final DailyQuest quest;
  final bool isDark;
  final VoidCallback onClaim;

  const _QuestItemRow({
    required this.quest,
    required this.isDark,
    required this.onClaim,
  });

  static String _toBanglaDigits(dynamic number) {
    const en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    String s = number.toString();
    for (int i = 0; i < 10; i++) {
      s = s.replaceAll(en[i], bn[i]);
    }
    return s;
  }

  @override
  Widget build(BuildContext context) {
    final canClaim = quest.isCompleted && !quest.isClaimed;

    final itemBg = isDark
        ? (canClaim ? quest.deepColor.withValues(alpha: 0.08) : const Color(0xFF19191D))
        : (canClaim ? quest.deepColor.withValues(alpha: 0.03) : const Color(0xFFFAFAFA));

    final itemBorder = isDark
        ? (canClaim ? quest.deepColor.withValues(alpha: 0.4) : const Color(0xFF26262B))
        : (canClaim ? quest.deepColor.withValues(alpha: 0.25) : const Color(0xFFEAEAEA));

    return Container(
      margin: const EdgeInsets.only(bottom: 9),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      decoration: BoxDecoration(
        color: itemBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: itemBorder, width: 0.9),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top Row: Task Description on Left + Action/Badge on Right
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Text(
                  quest.description,
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isDark ? const Color(0xFFF3F4F6) : const Color(0xFF1E293B),
                    height: 1.25,
                  ),
                ),
              ),
              const SizedBox(width: 10),

              // Action Badge / Claim Button
              if (quest.isClaimed)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4.5),
                  decoration: BoxDecoration(
                    color: const Color(0xFF004633).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: const Color(0xFF004633).withValues(alpha: 0.25),
                      width: 0.8,
                    ),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check_rounded, size: 13, color: Color(0xFF004633)),
                      SizedBox(width: 3),
                      Text(
                        'ক্লেইমড',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF004633),
                        ),
                      ),
                    ],
                  ),
                )
              else if (canClaim)
                InkWell(
                  onTap: onClaim,
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: quest.deepColor,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: quest.deepColor.withValues(alpha: 0.3),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '+${_toBanglaDigits(quest.xpReward)} XP ক্লেইম',
                          style: const TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF222227) : const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '+${_toBanglaDigits(quest.xpReward)} XP',
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                    ),
                  ),
                ),
            ],
          ),

          const SizedBox(height: 8),

          // Bottom Row: Progress Bar + Counter
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(
                    value: quest.progress,
                    minHeight: 4,
                    backgroundColor: isDark ? const Color(0xFF26262B) : const Color(0xFFE5E7EB),
                    valueColor: AlwaysStoppedAnimation<Color>(quest.deepColor),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${_toBanglaDigits(quest.current)}/${_toBanglaDigits(quest.target)}',
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: quest.isCompleted
                      ? quest.deepColor
                      : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
