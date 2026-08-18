import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../providers/dashboard_providers.dart';

class DailyQuest {
  final String id;
  final String description;
  final int target;
  final int current;
  final int xpReward;
  final bool isClaimed;
  final Color deepColor;

  DailyQuest({
    required this.id,
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
      final todayStart = DateTime(now.year, now.month, now.day).toUtc().toIso8601String();
      final sb = Supabase.instance.client;

      // 1. Fetch today's exam results
      final examResults = await sb
          .from('exam_results')
          .select('correct_count, created_at')
          .eq('user_id', user.id)
          .gte('created_at', todayStart);

      int todayExamsCount = examResults.length;
      int todayCorrectAnswers = 0;
      for (final r in examResults) {
        todayCorrectAnswers += (r['correct_count'] as num?)?.toInt() ?? 0;
      }

      // 2. Fetch today's live exam attempts
      try {
        final liveAttempts = await sb
            .from('live_exam_attempts')
            .select('score, submit_time')
            .eq('user_id', user.id)
            .gte('submit_time', todayStart);
        todayExamsCount += liveAttempts.length;
      } catch (_) {}

      // 3. User streak
      final profile = await ref.read(userProfileProvider.future);
      final currentStreak = profile?.streakCount ?? 0;

      // 4. Claimed states
      final todayKey = "${now.year}-${now.month}-${now.day}";
      final prefs = await SharedPreferences.getInstance();
      final claimed1 = prefs.getBool('quest_claimed_${user.id}_${todayKey}_exam_1') ?? false;
      final claimed2 = prefs.getBool('quest_claimed_${user.id}_${todayKey}_correct_15') ?? false;
      final claimed3 = prefs.getBool('quest_claimed_${user.id}_${todayKey}_streak_1') ?? false;

      if (mounted) {
        setState(() {
          _quests = [
            DailyQuest(
              id: 'exam_1',
              description: 'আজকের যেকোনো ১টি পূর্ণাঙ্গ পরীক্ষা সম্পন্ন করো',
              target: 1,
              current: todayExamsCount.clamp(0, 1),
              xpReward: 30,
              isClaimed: claimed1,
              deepColor: const Color(0xFF004633), // Signature Deep Emerald Green
            ),
            DailyQuest(
              id: 'correct_15',
              description: 'আজ কমপক্ষে ১৫টি প্রশ্নের সঠিক উত্তর দাও',
              target: 15,
              current: todayCorrectAnswers.clamp(0, 15),
              xpReward: 20,
              isClaimed: claimed2,
              deepColor: const Color(0xFFB91C1C), // Deep Crimson Red
            ),
            DailyQuest(
              id: 'streak_1',
              description: 'আজকের স্ট্রিক বজায় রাখো',
              target: 1,
              current: (currentStreak > 0 || todayExamsCount > 0) ? 1 : 0,
              xpReward: 15,
              isClaimed: claimed3,
              deepColor: const Color(0xFF004633), // Signature Deep Emerald Green
            ),
          ];
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
    final todayKey = "${now.year}-${now.month}-${now.day}";
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('quest_claimed_${user.id}_${todayKey}_${quest.id}', true);

    try {
      final sb = Supabase.instance.client;
      await sb.rpc('increment_user_xp', params: {
        'p_user_id': user.id,
        'p_xp': quest.xpReward,
      });
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
    final isAllCompleted = completedCount == _quests.length;

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

          // Quest Items List
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
