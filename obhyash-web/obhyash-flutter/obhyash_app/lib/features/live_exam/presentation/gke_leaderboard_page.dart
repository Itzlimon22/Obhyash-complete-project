import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../domain/models.dart';
import '../providers/live_exam_providers.dart';

class GkeLeaderboardPage extends ConsumerStatefulWidget {
  final LiveExam? exam;

  const GkeLeaderboardPage({super.key, this.exam});

  @override
  ConsumerState<GkeLeaderboardPage> createState() => _GkeLeaderboardPageState();
}

class _GkeLeaderboardPageState extends ConsumerState<GkeLeaderboardPage> {

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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);
    final cardBg = isDark ? const Color(0xFF13151F) : Colors.white;
    final borderColor = isDark
        ? const Color(0xFF232738)
        : const Color(0xFFE2E8F0);

    final examId = widget.exam?.id ?? 'gke-mt-01';
    final leaderboardAsync = ref.watch(liveExamLeaderboardProvider(examId));

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF0A0C14)
          : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF13151F) : Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: primaryTextColor, size: 22),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'GKE ব্যাচ জাতীয় মেধা তালিকা',
          style: TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: primaryTextColor,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: borderColor, height: 1),
        ),
      ),
      body: leaderboardAsync.when(
        data: (entries) {
          final top3 = entries.take(3).toList();

          return SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Top Banner: Exam Track Info & Batch Stats
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF004633), Color(0xFF065F46)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF004633).withValues(alpha: 0.25),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  LucideIcons.trophy,
                                  size: 13,
                                  color: Color(0xFFFDE047),
                                ),
                                SizedBox(width: 5),
                                Text(
                                  'GKE ব্যাচ ০১',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Text(
                            'মেডিকেল সাধারণ জ্ঞান ও ইংরেজি',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFFD1FAE5),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Text(
                        widget.exam?.title ??
                            'MT-01: প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস ও English Grammar',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          vertical: 10,
                          horizontal: 16,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStatItem(
                              'মোট পরীক্ষার্থী',
                              '${_toBanglaDigits(1240)}+ জন',
                            ),
                            Container(
                              width: 1,
                              height: 26,
                              color: Colors.white24,
                            ),
                            _buildStatItem(
                              'সর্বোচ্চ স্কোর',
                              '${_toBanglaDigits(24.75)}/২৫',
                            ),
                            Container(
                              width: 1,
                              height: 26,
                              color: Colors.white24,
                            ),
                            _buildStatItem(
                              'গড় স্কোর',
                              _toBanglaDigits(18.20),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Top 3 Podium Cards
                if (top3.isNotEmpty) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // 2nd Place
                      if (top3.length > 1)
                        Expanded(
                          child: _buildPodiumCard(
                            top3[1],
                            2,
                            const Color(0xFF94A3B8),
                            170,
                            isDark,
                          ),
                        ),
                      const SizedBox(width: 8),
                      // 1st Place
                      Expanded(
                        child: _buildPodiumCard(
                          top3[0],
                          1,
                          const Color(0xFFF59E0B),
                          200,
                          isDark,
                        ),
                      ),
                      const SizedBox(width: 8),
                      // 3rd Place
                      if (top3.length > 2)
                        Expanded(
                          child: _buildPodiumCard(
                            top3[2],
                            3,
                            const Color(0xFFD97706),
                            155,
                            isDark,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],

                // Section Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'সকল মেধা তালিকা',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: primaryTextColor,
                      ),
                    ),
                    Text(
                      'মোট ${_toBanglaDigits(entries.length)} জন শিক্ষার্থী',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: secondaryTextColor,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Full Leaderboard List
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: entries.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = entries[index];
                    final rank = index + 1;
                    return _buildRankTile(
                      item,
                      rank,
                      isDark,
                      cardBg,
                      borderColor,
                      primaryTextColor,
                      secondaryTextColor,
                    );
                  },
                ),
              ],
            ),
          );
        },
        loading: () => const Center(
          child: Padding(
            padding: EdgeInsets.all(40),
            child: CircularProgressIndicator(color: Color(0xFF004633)),
          ),
        ),
        error: (_, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(30),
            child: Text(
              'মেধা তালিকা লোড করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।',
              style: TextStyle(color: secondaryTextColor),
            ),
          ),
        ),
      ),
    );
  }

  static Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w500,
            color: Color(0xFFD1FAE5),
          ),
        ),
      ],
    );
  }

  static Widget _buildPodiumCard(
    LiveExamLeaderboardEntry student,
    int rank,
    Color medalColor,
    double height,
    bool isDark,
  ) {
    final rankText = rank == 1
        ? '১ম'
        : rank == 2
        ? '২য়'
        : '৩য়';
    return Container(
      height: height,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF13151F) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: rank == 1
              ? medalColor.withValues(alpha: 0.6)
              : (isDark ? const Color(0xFF232738) : const Color(0xFFE2E8F0)),
          width: rank == 1 ? 1.8 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: medalColor.withValues(alpha: rank == 1 ? 0.15 : 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: medalColor.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.crown, size: 13, color: medalColor),
                const SizedBox(width: 4),
                Text(
                  rankText,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: medalColor,
                  ),
                ),
              ],
            ),
          ),
          Column(
            children: [
              Text(
                student.userName,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                student.userInstitute,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: isDark
                      ? const Color(0xFF94A3B8)
                      : const Color(0xFF64748B),
                ),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF004633).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '${_toBanglaDigits(student.score)} নম্বর',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: Color(0xFF004633),
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Widget _buildRankTile(
    LiveExamLeaderboardEntry item,
    int rank,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color primaryTextColor,
    Color secondaryTextColor,
  ) {
    Color rankColor;
    if (rank == 1) {
      rankColor = const Color(0xFFF59E0B);
    } else if (rank == 2) {
      rankColor = const Color(0xFF10B981);
    } else if (rank == 3) {
      rankColor = const Color(0xFF3B82F6);
    } else {
      rankColor = isDark ? const Color(0xFF475569) : const Color(0xFF94A3B8);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: rankColor.withValues(alpha: rank <= 3 ? 0.2 : 0.12),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                _toBanglaDigits(rank),
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: rank <= 3 ? rankColor : primaryTextColor,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.userName,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: primaryTextColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item.userInstitute,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w500,
                    color: secondaryTextColor,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                _toBanglaDigits(item.score),
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF004633),
                ),
              ),
              const SizedBox(height: 2),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.clock, size: 10, color: secondaryTextColor),
                  const SizedBox(width: 3),
                  Text(
                    item.formattedDuration,
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w600,
                      color: secondaryTextColor,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
