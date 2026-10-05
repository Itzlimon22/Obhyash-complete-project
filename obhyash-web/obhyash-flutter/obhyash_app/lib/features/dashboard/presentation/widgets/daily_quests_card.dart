import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/utils/bangla_name_helper.dart';
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
      description: 'আজকের যেকোনো 1টি পূর্ণাঙ্গ মডেল টেস্ট বা পরীক্ষা সম্পন্ন করো',
      metricType: 'exams_count',
      target: 1,
      xpReward: 30,
      deepColor: Color(0xFF12544F), // Viridian Forest
    ),
    // 2. 15 Correct Answers
    MasterDailyMission(
      id: 'mission_correct_15',
      title: 'নির্ভুল নিশানাবাজ',
      description: 'আজ কমপক্ষে 15টি প্রশ্নের সঠিক উত্তর দাও',
      metricType: 'correct_answers',
      target: 15,
      xpReward: 25,
      deepColor: Color(0xFF740A03), // Deep Crimson
    ),
    // 3. 30 Correct Answers Pro Challenge
    MasterDailyMission(
      id: 'mission_correct_30',
      title: 'মাস্টার ব্রেইন',
      description: 'আজ কমপক্ষে 30টি প্রশ্নের সঠিক উত্তর দিয়ে পারদর্শী হও',
      metricType: 'correct_answers',
      target: 30,
      xpReward: 40,
      deepColor: Color(0xFF601D49), // Royal Mulberry
    ),
    // 4. Daily Streak
    MasterDailyMission(
      id: 'mission_streak_1',
      title: 'অবিচল অনুশীলন',
      description: 'আজকের ডেইলি পড়ার স্ট্রিক বজায় রাখো',
      metricType: 'streak',
      target: 1,
      xpReward: 20,
      deepColor: Color(0xFF601D49), // Royal Mulberry
    ),
    // 5. Double Exam Challenge
    MasterDailyMission(
      id: 'mission_exam_2',
      title: 'ডাবল চ্যালেঞ্জ',
      description: 'আজ যেকোনো 2টি ভিন্ন বিষয়ে পরীক্ষা সম্পন্ন করো',
      metricType: 'exams_count',
      target: 2,
      xpReward: 45,
      deepColor: Color(0xFF12544F), // Viridian Forest
    ),
    // 6. 80%+ Accuracy Exam
    MasterDailyMission(
      id: 'mission_accuracy_80',
      title: 'পারফেকশনিস্ট',
      description: 'যেকোনো একটি পরীক্ষায় 80% বা তার বেশি নির্ভুল স্কোর অর্জন করো',
      metricType: 'accuracy_80',
      target: 1,
      xpReward: 35,
      deepColor: Color(0xFF601D49), // Royal Mulberry
    ),
    // 7. Live / Practice Exam Participation
    MasterDailyMission(
      id: 'mission_live_practice',
      title: 'প্রতিযোগিতার মাঠে',
      description: 'আজকের লাইভ এক্সাম বা কোনো অনুশীলনী পরীক্ষায় অংশগ্রহণ করো',
      metricType: 'live_or_practice',
      target: 1,
      xpReward: 30,
      deepColor: Color(0xFF740A03), // Deep Crimson
    ),
    // 8. 10 Correct Answers Sprint
    MasterDailyMission(
      id: 'mission_speed_correct_10',
      title: 'কুইক স্প্রিন্টার',
      description: 'যেকোনো পরীক্ষায় কমপক্ষে 10টি সঠিক উত্তর দিয়ে সাবমিট করো',
      metricType: 'correct_answers',
      target: 10,
      xpReward: 20,
      deepColor: Color(0xFF12544F), // Viridian Forest
    ),
    // 9. Solve 40 MCQs
    MasterDailyMission(
      id: 'mission_solve_40_mcqs',
      title: 'এমসিকিউ ম্যারাথন',
      description: 'আজ সব মিলিয়ে মোট 40টি প্রশ্ন সমাধান করো',
      metricType: 'total_mcqs',
      target: 40,
      xpReward: 40,
      deepColor: Color(0xFF12544F), // Viridian Forest
    ),
    // 10. 20 Correct Answers Goal
    MasterDailyMission(
      id: 'mission_correct_20',
      title: 'লক্ষ্য পূরণ',
      description: 'আজ বিভিন্ন পরীক্ষায় মোট 20টি প্রশ্নের সঠিক উত্তর দাও',
      metricType: 'correct_answers',
      target: 20,
      xpReward: 30,
      deepColor: Color(0xFF601D49), // Royal Mulberry
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

  DailyQuest copyWith({
    String? id,
    String? title,
    String? description,
    int? target,
    int? current,
    int? xpReward,
    bool? isClaimed,
    Color? deepColor,
  }) {
    return DailyQuest(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      target: target ?? this.target,
      current: current ?? this.current,
      xpReward: xpReward ?? this.xpReward,
      isClaimed: isClaimed ?? this.isClaimed,
      deepColor: deepColor ?? this.deepColor,
    );
  }
}

class DailyQuestsCard extends ConsumerStatefulWidget {
  const DailyQuestsCard({super.key});

  @override
  ConsumerState<DailyQuestsCard> createState() => _DailyQuestsCardState();
}

class _DailyQuestsCardState extends ConsumerState<DailyQuestsCard>
    with WidgetsBindingObserver {
  List<DailyQuest> _quests = [];
  bool _isLoading = true;
  RealtimeChannel? _questsChannel;
  RealtimeChannel? _examsChannel;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _setupRealtime();
    _loadQuests();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cleanupRealtime();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadQuests();
    }
  }

  void _setupRealtime() {
    final user = ref.read(authProvider);
    if (user == null) return;
    final sb = Supabase.instance.client;

    try {
      _cleanupRealtime();

      // 1. Listen for daily quests claim state updates from other devices
      _questsChannel = sb.channel('realtime_daily_quests_${user.id}');
      _questsChannel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'daily_quests_state',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'user_id',
          value: user.id,
        ),
        callback: (_) {
          if (mounted) _loadQuests();
        },
      ).subscribe();

      // 2. Listen for newly submitted exams to update mission progress in real-time
      _examsChannel = sb.channel('realtime_exam_results_quests_${user.id}');
      _examsChannel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'exam_results',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'user_id',
          value: user.id,
        ),
        callback: (_) {
          if (mounted) _loadQuests();
        },
      ).subscribe();
    } catch (e) {
      debugPrint('[DailyQuests] Realtime subscription error: $e');
    }
  }

  void _cleanupRealtime() {
    final sb = Supabase.instance.client;
    if (_questsChannel != null) {
      sb.removeChannel(_questsChannel!);
      _questsChannel = null;
    }
    if (_examsChannel != null) {
      sb.removeChannel(_examsChannel!);
      _examsChannel = null;
    }
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
        todayExamsCount += (liveAttempts as List).length;

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

      // 5. Fetch server claimed state from Supabase daily_quests_state
      final Set<String> serverClaimedIds = {};
      try {
        final stateRes = await sb
            .from('daily_quests_state')
            .select('claimed_ids, quest_date')
            .eq('user_id', user.id)
            .order('quest_date', ascending: false)
            .limit(3);

        for (final row in stateRes) {
          final qDate = row['quest_date']?.toString();
          if (qDate == todayKey || qDate == todayDateOnly.toIso8601String().substring(0, 10)) {
            final claimed = row['claimed_ids'];
            if (claimed is List) {
              for (final c in claimed) {
                serverClaimedIds.add(c.toString());
              }
            }
          }
        }
      } catch (e) {
        debugPrint('[DailyQuests] Error fetching daily_quests_state: $e');
      }

      // 6. Check claimed states merging server truth with local cache
      final prefs = await SharedPreferences.getInstance();
      final List<DailyQuest> resolvedQuests = [];

      for (final m in assignedMissions) {
        final isServerClaimed = serverClaimedIds.contains(m.id);
        final isLocalClaimed = prefs.getBool('quest_claimed_${user.id}_${todayKey}_${m.id}') ?? false;
        final isClaimed = isServerClaimed || isLocalClaimed;

        // Keep local cache synced
        if (isServerClaimed && !isLocalClaimed) {
          prefs.setBool('quest_claimed_${user.id}_${todayKey}_${m.id}', true);
        }

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

    // Optimistic UI update
    setState(() {
      _quests = _quests
          .map((q) => q.id == quest.id ? q.copyWith(isClaimed: true) : q)
          .toList();
    });

    try {
      final sb = Supabase.instance.client;
      // Try atomic RPC claim
      try {
        await sb.rpc('claim_daily_quest', params: {
          'p_user_id': user.id,
          'p_quest_id': quest.id,
          'p_xp_reward': quest.xpReward,
          'p_quest_date': todayKey,
        });
      } catch (_) {
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
      }
      ref.invalidate(userProfileProvider);
    } catch (e) {
      debugPrint('[DailyQuests] Error claiming XP: $e');
    }

    _loadQuests();
  }

  @override
  Widget build(BuildContext context) {
    // Listen to global pull-to-refresh trigger
    ref.listen(dailyQuestsRefreshTriggerProvider, (prev, next) {
      _loadQuests();
    });
    if (_isLoading) {
      return const SizedBox.shrink();
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor = isDark ? const Color(0xFF1C1917) : Colors.white;
    final borderColor = isDark ? const Color(0xFF2C2723) : const Color(0xFFEFE6DC);

    final completedCount = _quests.where((q) => q.isCompleted).length;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF461E14).withValues(alpha: isDark ? 0.35 : 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header: Subtitle + Proportioned Title + Progress Pill with dots
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'দৈনিক লক্ষ্য',
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isDark ? const Color(0xFFF87171) : const Color(0xFF7A1410),
                      letterSpacing: 0.4,
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    'আজকের মিশন',
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : const Color(0xFF1B1411),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF28231D) : const Color(0xFFF5EFE7),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ..._quests.map((q) => Container(
                          width: 7.5,
                          height: 7.5,
                          margin: const EdgeInsets.only(right: 5),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: q.isCompleted
                                ? (isDark ? const Color(0xFFEF4444) : const Color(0xFF7A1410))
                                : (isDark ? const Color(0xFF44392E) : const Color(0xFFD9CCC0)),
                          ),
                        )),
                    const SizedBox(width: 2),
                    Text(
                      '${BanglaNameHelper.toBanglaNumeral(completedCount)}/${BanglaNameHelper.toBanglaNumeral(_quests.length)}',
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isDark ? const Color(0xFFD1C7BD) : const Color(0xFF4A3B33),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Quest Items List (Ivory Ring Cards)
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

  @override
  Widget build(BuildContext context) {
    final canClaim = quest.isCompleted && !quest.isClaimed;

    final itemBg = isDark ? const Color(0xFF231F1C) : const Color(0xFFFBF8F4);
    final itemBorder = isDark ? const Color(0xFF332C26) : const Color(0xFFF0E8DE);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: itemBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: itemBorder, width: 1.2),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left Ring Indicator (52x52)
          _buildLeftIndicator(context, canClaim),
          const SizedBox(width: 14),

          // Right Content: Description + Bottom Row (Counter + Badge)
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  quest.description,
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 13.5,
                    fontWeight: FontWeight.w500,
                    color: quest.isClaimed
                        ? (isDark ? const Color(0xFFA89F91) : const Color(0xFF5E4E45))
                        : (isDark ? Colors.white : const Color(0xFF1B1411)),
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Counter
                    Text(
                      '${BanglaNameHelper.toBanglaNumeral(quest.current)}/${BanglaNameHelper.toBanglaNumeral(quest.target)}',
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                        color: isDark ? const Color(0xFFD1C7BD) : const Color(0xFF4A3B33),
                      ),
                    ),

                    // Badge / Claim Action
                    _buildBadge(context, canClaim),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLeftIndicator(BuildContext context, bool canClaim) {
    if (quest.isClaimed) {
      return Container(
        width: 50,
        height: 50,
        decoration: const BoxDecoration(
          color: Color(0xFF7A1410),
          shape: BoxShape.circle,
        ),
        child: const Icon(
          Icons.check_rounded,
          size: 26,
          color: Colors.white,
        ),
      );
    }

    if (canClaim) {
      return GestureDetector(
        onTap: onClaim,
        child: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: const Color(0xFF7A1410),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF7A1410).withValues(alpha: 0.35),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: const Icon(
            Icons.check_rounded,
            size: 26,
            color: Colors.white,
          ),
        ),
      );
    }

    // Incomplete State: Circular Ivory Ring with count inside
    return Container(
      width: 50,
      height: 50,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1C1917) : Colors.white,
        shape: BoxShape.circle,
        border: Border.all(
          color: isDark ? const Color(0xFF3E362F) : const Color(0xFFEADFD3),
          width: 4,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        BanglaNameHelper.toBanglaNumeral(quest.current),
        style: TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 15,
          fontWeight: FontWeight.w700,
          color: isDark ? Colors.white : const Color(0xFF1B1411),
        ),
      ),
    );
  }

  Widget _buildBadge(BuildContext context, bool canClaim) {
    if (quest.isClaimed) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF133E33) : const Color(0xFFE3EFEA),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          'ক্লেইমড',
          style: TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
            color: isDark ? const Color(0xFF34D399) : const Color(0xFF155A47),
          ),
        ),
      );
    }

    if (canClaim) {
      return InkWell(
        onTap: onClaim,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
          decoration: BoxDecoration(
            color: const Color(0xFF7A1410),
            borderRadius: BorderRadius.circular(999),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF7A1410).withValues(alpha: 0.3),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Text(
            '+${BanglaNameHelper.toBanglaNumeral(quest.xpReward)} XP দাবি করুন',
            style: const TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
        ),
      );
    }

    // Active/Pending Quest: XP badge
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF3D3116) : const Color(0xFFFBEFD0),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        '+${BanglaNameHelper.toBanglaNumeral(quest.xpReward)} XP',
        style: TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 11.5,
          fontWeight: FontWeight.w700,
          color: isDark ? const Color(0xFFFBBF24) : const Color(0xFF6B4A00),
        ),
      ),
    );
  }
}
