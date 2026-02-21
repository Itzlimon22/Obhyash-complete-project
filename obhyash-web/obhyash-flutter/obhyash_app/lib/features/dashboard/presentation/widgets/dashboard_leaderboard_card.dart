import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../domain/models.dart';

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

    return GestureDetector(
      onTap: onLeaderboardClick,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF171717) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
          ),
          boxShadow: [
            if (!isDark)
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 4,
                spreadRadius: 0,
              ),
          ],
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // Top Right Decor
            Positioned(
              top: -20,
              right: -20,
              child: Container(
                width: 128,
                height: 128,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: isDark
                        ? [
                            const Color(0xFF78350F).withOpacity(0.1),
                            Colors.transparent,
                          ]
                        : [
                            const Color(0xFFFFFBEB).withOpacity(0.5),
                            Colors.transparent,
                          ],
                  ),
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(100),
                  ),
                ),
              ),
            ),

            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF78350F).withOpacity(0.3)
                                : const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            LucideIcons.medal,
                            size: 16,
                            color: isDark
                                ? const Color(0xFFF59E0B)
                                : const Color(0xFFD97706),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'লিডারবোর্ড',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF262626),
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF78350F).withOpacity(0.2)
                            : const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          Text(
                            'সব দেখো',
                            style: TextStyle(
                              fontFamily: 'HindSiliguri',
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              color: isDark
                                  ? const Color(0xFFFBBF24)
                                  : const Color(0xFFD97706),
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            LucideIcons.chevronRight,
                            size: 12,
                            color: isDark
                                ? const Color(0xFFFBBF24)
                                : const Color(0xFFD97706),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Table Header
                Row(
                  children: [
                    const SizedBox(
                      width: 32,
                      child: Text('#', style: _headerStyle),
                    ),
                    const SizedBox(width: 32),
                    const Expanded(child: Text('নাম', style: _headerStyle)),
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
                    gradient: LinearGradient(
                      colors: isDark
                          ? [
                              const Color(0xFF78350F).withOpacity(0.2),
                              const Color(0xFF78350F).withOpacity(0.05),
                            ]
                          : [
                              const Color(0xFFFFFBEB),
                              const Color(0xFFFFFBEB).withOpacity(0.3),
                            ],
                    ),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF92400E).withOpacity(0.3)
                          : const Color(0xFFFEF3C7).withOpacity(0.6),
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const SizedBox(
                        width: 32,
                        child: Text('🥇', style: TextStyle(fontSize: 14)),
                      ),
                      if (topUser != null) ...[
                        _buildMiniAvatar(topUser!.name, isDark),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            topUser!.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontFamily: 'HindSiliguri',
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: isDark
                                  ? const Color(0xFFE5E5E5)
                                  : const Color(0xFF262626),
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
                                ? const Color(0xFF404040)
                                : const Color(0xFFE5E5E5),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          width: 96,
                          height: 14,
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF404040)
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
                    gradient: LinearGradient(
                      colors: isDark
                          ? [
                              const Color(0xFF075985).withOpacity(0.15),
                              const Color(0xFF075985).withOpacity(0.05),
                            ]
                          : [
                              const Color(0xFFF0F9FF),
                              const Color(0xFFF0F9FF).withOpacity(0.3),
                            ],
                    ),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF0369A1).withOpacity(0.3)
                          : const Color(0xFFE0F2FE).withOpacity(0.6),
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 32,
                        child: Text(
                          '#$userRank',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontWeight: FontWeight.w900,
                            fontSize: 14,
                            color: isDark
                                ? const Color(0xFF38BDF8)
                                : const Color(0xFF0284C7),
                          ),
                        ),
                      ),
                      _buildMiniAvatar(currentUser.name, isDark),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Row(
                          children: [
                            Flexible(
                              child: Text(
                                currentUser.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  color: isDark
                                      ? const Color(0xFFE5E5E5)
                                      : const Color(0xFF262626),
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
                                color: isDark
                                    ? const Color(0xFF0C4A6E).withOpacity(0.3)
                                    : const Color(0xFFE0F2FE),
                                borderRadius: BorderRadius.circular(100),
                              ),
                              child: Text(
                                'তুমি',
                                style: TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  fontWeight: FontWeight.bold,
                                  fontSize: 9,
                                  color: isDark
                                      ? const Color(0xFF38BDF8)
                                      : const Color(0xFF0EA5E9),
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
                          color: Color(0xFFFBBF24),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'শীর্ষে পৌঁছাতে আরও ',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 11,
                          color: isDark
                              ? const Color(0xFFA3A3A3)
                              : const Color(0xFF737373),
                        ),
                      ),
                      Text(
                        '$xpDiff XP',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isDark
                              ? const Color(0xFFD4D4D4)
                              : const Color(0xFF404040),
                        ),
                      ),
                      Text(
                        ' লাগবে',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 11,
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
          ],
        ),
      ),
    );
  }

  Widget _buildMiniAvatar(String name, bool isDark) {
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5),
        shape: BoxShape.circle,
        border: Border.all(
          color: isDark ? const Color(0xFF92400E) : const Color(0xFFFDE68A),
          width: 2,
        ),
      ),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: isDark ? const Color(0xFFE5E5E5) : const Color(0xFF262626),
          ),
        ),
      ),
    );
  }
}

const _headerStyle = TextStyle(
  fontFamily: 'HindSiliguri',
  fontWeight: FontWeight.w900,
  fontSize: 10,
  color: Color(0xFFA3A3A3), // neutral-400
  letterSpacing: 0.5,
);
