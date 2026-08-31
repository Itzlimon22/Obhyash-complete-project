import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../domain/models.dart';
import '../../../../core/presentation/widgets/user_avatar.dart';
import '../../../../core/utils/bangla_name_helper.dart';

class DashboardLeaderboardCard extends StatelessWidget {
  final LeaderboardUser currentUser;
  final int userRank;
  final LeaderboardUser? topUser;
  final int xpDiff;
  final VoidCallback onLeaderboardClick;

  const DashboardLeaderboardCard({
    super.key,
    required this.currentUser,
    required this.userRank,
    required this.topUser,
    required this.xpDiff,
    required this.onLeaderboardClick,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141416) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onLeaderboardClick,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Title + Arrow
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF27272A)
                                : const Color(0xFFF3F4F6),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            LucideIcons.trophy,
                            size: 16,
                            color: isDark
                                ? const Color(0xFFA1A1AA)
                                : const Color(0xFF71717A),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'লিডারবোর্ড',
                          style: TextStyle(
                            fontFamily: 'Anek Bangla',
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                            color: isDark
                                ? const Color(0xFFF4F4F5)
                                : const Color(0xFF18181B),
                          ),
                        ),
                      ],
                    ),
                    Icon(
                      LucideIcons.chevronRight,
                      size: 18,
                      color: isDark
                          ? const Color(0xFF71717A)
                          : const Color(0xFFA1A1AA),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Table Header
                Row(
                  children: [
                    SizedBox(width: 36, child: Text('র‍্যাঙ্ক', style: _headerStyle)),
                    const SizedBox(width: 8),
                    const SizedBox(width: 28),
                    const Expanded(child: Text('নাম', style: _headerStyle, maxLines: 1, overflow: TextOverflow.ellipsis)),
                  ],
                ),
                const SizedBox(height: 8),

                // Topper Row
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669), // Solid green
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 36,
                        child: const Text('🥇', style: TextStyle(fontSize: 18)),
                      ),
                      const SizedBox(width: 8),
                      if (topUser != null) ...[
                        UserAvatar(
                          id: topUser!.id,
                          name: topUser!.name,
                          avatarUrl: topUser!.avatarUrl,
                          size: 28,
                          showBorder: true,
                          borderColor: const Color(0xFF6EE7B7),
                          borderWidth: 1.5,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            topUser!.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontFamily: 'Anek Bangla',
                              fontWeight: FontWeight.bold,
                              fontSize: 17,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ] else ...[
                        // Skeleton
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF27272A)
                                : const Color(0xFFE5E5E5),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Container(
                          width: 96,
                          height: 14,
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF27272A)
                                : const Color(0xFFE5E5E5),
                            borderRadius: BorderRadius.circular(7),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 8),

                // Current User Row
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFB91C1C), // Solid red
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 36,
                        child: Text(
                          BanglaNameHelper.toBanglaNumeral(userRank),
                          style: const TextStyle(
                            fontFamily: 'Anek Bangla',
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      UserAvatar(
                        id: currentUser.id,
                        name: currentUser.name,
                        avatarUrl: currentUser.avatarUrl,
                        size: 28,
                        showBorder: true,
                        borderColor: Colors.white,
                        borderWidth: 1.5,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Row(
                          children: [
                            Flexible(
                              child: Text(
                                currentUser.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontFamily: 'Anek Bangla',
                                  fontWeight: FontWeight.bold,
                                  fontSize: 17,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(100),
                              ),
                              child: const Text(
                                'তুমি',
                                style: TextStyle(
                                  fontFamily: 'Anek Bangla',
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                if (xpDiff > 0) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const SizedBox(width: 12),
                      Container(
                        width: 4,
                        height: 4,
                        decoration: const BoxDecoration(
                          color: Color(0xFF059669),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'শীর্ষে পৌঁছাতে আরও ',
                        style: TextStyle(
                          fontFamily: 'Anek Bangla',
                          fontSize: 16,
                          color: isDark
                              ? const Color(0xFFA3A3A3)
                              : const Color(0xFF737373),
                        ),
                      ),
                      Text(
                        '$xpDiff XP',
                        style: TextStyle(
                          fontFamily: 'Anek Bangla',
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isDark
                              ? const Color(0xFFD4D4D4)
                              : const Color(0xFF27272A),
                        ),
                      ),
                      Text(
                        ' লাগবে',
                        style: TextStyle(
                          fontFamily: 'Anek Bangla',
                          fontSize: 16,
                          color: isDark
                              ? const Color(0xFFA3A3A3)
                              : const Color(0xFF737373),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

const _headerStyle = TextStyle(
  fontFamily: 'Anek Bangla',
  fontWeight: FontWeight.w900,
  fontSize: 13,
  color: Color(0xFFA3A3A3), // neutral-400
  letterSpacing: 0.5,
);
