import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../gamification/domain/gamification_models.dart';
import '../../../gamification/services/gamification_service.dart';
import '../../../../core/presentation/widgets/celebration_dialog.dart';
import '../../providers/dashboard_providers.dart';

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

  Future<void> _loadQuests() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }
    final quests = await GamificationService.getDailyQuests(userId);
    if (mounted) {
      setState(() {
        _quests = quests;
        _isLoading = false;
      });
    }
  }

  Future<void> _claimQuest(DailyQuest quest) async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null || quest.isClaimed || !quest.isCompleted) return;

    HapticFeedback.heavyImpact();
    final success = await GamificationService.claimDailyQuest(
      userId: userId,
      questId: quest.id,
      xpReward: quest.xpReward,
    );

    if (success && mounted) {
      // Invalidate profile so new XP reflects instantly
      ref.invalidate(userProfileProvider);

      // Trigger Celebration Dialog
      CelebrationDialog.show(
        context,
        title: 'মিশন সম্পন্ন!',
        badgeLabel: quest.title,
        subtitle: 'তুমি আজকের "${quest.title}" মিশন সফলভাবে সম্পন্ন করেছো।',
        icon: quest.icon,
        primaryColor: quest.color,
        secondaryColor: quest.color.withValues(alpha: 0.7),
        xpAwarded: quest.xpReward,
      );

      _loadQuests();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final Color surfaceColor = isDark ? const Color(0xFF1C1C1E) : Colors.white;
    final Color borderColor = isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE2E8F0);

    if (_isLoading) {
      return Container(
        height: 160,
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: borderColor),
        ),
        child: const Center(
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    }

    if (_quests.isEmpty) return const SizedBox.shrink();

    final completedCount = _quests.where((q) => q.isCompleted).length;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: borderColor),
        boxShadow: [
          if (!isDark)
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF004633).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      LucideIcons.target,
                      color: Color(0xFF004633),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'আজকের মিশন',
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: completedCount == _quests.length
                      ? const Color(0xFF10B981).withValues(alpha: 0.15)
                      : (isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9)),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  '$completedCount/${_quests.length} সম্পন্ন',
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: completedCount == _quests.length
                        ? const Color(0xFF10B981)
                        : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B)),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Quest Items
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

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141416) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: canClaim
              ? quest.color.withValues(alpha: 0.4)
              : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
        ),
      ),
      child: Row(
        children: [
          // Icon
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: quest.color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              quest.icon,
              color: quest.color,
              size: 20,
            ),
          ),

          const SizedBox(width: 12),

          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      quest.title,
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      '${quest.current}/${quest.target}',
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: quest.isCompleted
                            ? const Color(0xFF10B981)
                            : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  quest.description,
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 12,
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 8),

                // Linear Progress
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: quest.progress,
                    minHeight: 6,
                    backgroundColor: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                    valueColor: AlwaysStoppedAnimation<Color>(quest.color),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 12),

          // Action Button
          if (quest.isClaimed)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check, size: 14, color: Color(0xFF10B981)),
                  SizedBox(width: 4),
                  Text(
                    'ক্লেইমড',
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF10B981),
                    ),
                  ),
                ],
              ),
            )
          else if (canClaim)
            ElevatedButton(
              onPressed: onClaim,
              style: ElevatedButton.styleFrom(
                backgroundColor: quest.color,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: Text(
                '+${quest.xpReward} XP',
                style: const TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                ),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '+${quest.xpReward} XP',
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
