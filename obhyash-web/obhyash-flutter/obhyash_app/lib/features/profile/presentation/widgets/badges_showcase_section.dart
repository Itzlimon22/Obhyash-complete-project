import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../gamification/domain/gamification_models.dart';
import '../../../gamification/services/gamification_service.dart';

class BadgesShowcaseSection extends StatefulWidget {
  final String userId;

  const BadgesShowcaseSection({super.key, required this.userId});

  @override
  State<BadgesShowcaseSection> createState() => _BadgesShowcaseSectionState();
}

class _BadgesShowcaseSectionState extends State<BadgesShowcaseSection> {
  List<BadgeItem> _badges = ObhyashBadges.allBadges;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBadges();
  }

  Future<void> _loadBadges() async {
    final badges = await GamificationService.getUserBadges(widget.userId);
    if (mounted) {
      setState(() {
        _badges = badges;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final unlockedCount = _badges.where((b) => b.isUnlocked).length;

    final Color surfaceColor = isDark ? const Color(0xFF1C1C1E) : Colors.white;
    final Color borderColor = isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE2E8F0);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
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
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      LucideIcons.award,
                      color: Color(0xFFF59E0B),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'অর্জন ও ব্যাজসমূহ',
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
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  '$unlockedCount/${_badges.length} আনলকড',
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Badges Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 10,
              mainAxisSpacing: 12,
              childAspectRatio: 0.82,
            ),
            itemCount: _badges.length,
            itemBuilder: (context, index) {
              final badge = _badges[index];
              return _BadgeCard(badge: badge, isDark: isDark);
            },
          ),
        ],
      ),
    );
  }
}

class _BadgeCard extends StatelessWidget {
  final BadgeItem badge;
  final bool isDark;

  const _BadgeCard({
    required this.badge,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final isUnlocked = badge.isUnlocked;

    return Tooltip(
      message: badge.description,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
        decoration: BoxDecoration(
          color: isDark
              ? (isUnlocked ? const Color(0xFF141416) : const Color(0xFF111113))
              : (isUnlocked ? const Color(0xFFF8FAFC) : const Color(0xFFF1F5F9)),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isUnlocked
                ? badge.gradientStart.withValues(alpha: 0.3)
                : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Icon Bubble
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: isUnlocked
                    ? LinearGradient(
                        colors: [badge.gradientStart, badge.gradientEnd],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: isUnlocked ? null : (isDark ? const Color(0xFF27272A) : const Color(0xFFCBD5E1)),
                shape: BoxShape.circle,
                boxShadow: isUnlocked
                    ? [
                        BoxShadow(
                          color: badge.gradientStart.withValues(alpha: 0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Icon(
                isUnlocked ? badge.icon : LucideIcons.lock,
                color: isUnlocked ? Colors.white : (isDark ? Colors.white38 : Colors.black38),
                size: 20,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              badge.titleBangla,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontFamily: 'HindSiliguri',
                fontSize: 13,
                fontWeight: isUnlocked ? FontWeight.bold : FontWeight.normal,
                color: isUnlocked
                    ? (isDark ? Colors.white : const Color(0xFF0F172A))
                    : (isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8)),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              isUnlocked ? 'অর্জন সম্পন্ন' : 'লকড',
              style: TextStyle(
                fontFamily: 'HindSiliguri',
                fontSize: 10,
                color: isUnlocked
                    ? const Color(0xFF10B981)
                    : (isDark ? const Color(0xFF52525B) : const Color(0xFFA1A1AA)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
