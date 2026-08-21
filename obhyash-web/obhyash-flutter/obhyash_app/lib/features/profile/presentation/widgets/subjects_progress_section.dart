import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../dashboard/domain/models.dart';

class SubjectsProgressSection extends StatelessWidget {
  final List<SubjectStats> subjectStats;
  final Function(String)? onSubjectClick;

  const SubjectsProgressSection({
    super.key,
    required this.subjectStats,
    this.onSubjectClick,
  });

  String _formatSubjectName(String name) {
    if (name.isEmpty) return name;
    final l = name.toLowerCase();

    String subjectPart = name;
    if (l.contains('physics')) {
      subjectPart = 'পদার্থবিজ্ঞান';
    } else if (l.contains('chemistry')) {
      subjectPart = 'রসায়ন';
    } else if (l.contains('biology') || l.contains('botany') || l.contains('zoology')) {
      subjectPart = 'জীববিজ্ঞান';
    } else if (l.contains('math') || l.contains('higher_math')) {
      subjectPart = 'উচ্চতর গণিত';
    } else if (l.contains('bangla')) {
      subjectPart = 'বাংলা';
    } else if (l.contains('english')) {
      subjectPart = 'ইংরেজি';
    } else if (l.contains('ict')) {
      subjectPart = 'আইসিটি';
    } else if (l.contains('accounting')) {
      subjectPart = 'হিসাববিজ্ঞান';
    } else if (l.contains('finance')) {
      subjectPart = 'ফাইনান্স';
    } else if (l.contains('management')) {
      subjectPart = 'ব্যবসায় সংগঠন';
    } else if (l.contains('general_science')) {
      subjectPart = 'সাধারণ বিজ্ঞান';
    } else if (l.contains('bgs') || l.contains('bangladesh_and_global_studies')) {
      subjectPart = 'বাংলাদেশ ও বিশ্বপরিচয়';
    } else if (l.contains('general_knowledge') || l.contains('gk')) {
      subjectPart = 'সাধারণ জ্ঞান';
    } else if (l.contains('general')) {
      subjectPart = 'সাধারণ';
    } else {
      if (!name.contains('_')) return name;
      return name.split('_').map((word) {
        if (word.isEmpty) return word;
        if (word.toLowerCase() == 'hsc' || word.toLowerCase() == 'ssc') return word.toUpperCase();
        return word[0].toUpperCase() + word.substring(1).toLowerCase();
      }).join(' ');
    }

    String suffix = '';
    if (l.endsWith('_1')) {
      suffix = ' ১ম পত্র';
    } else if (l.endsWith('_2')) {
      suffix = ' ২য় পত্র';
    }

    return '$subjectPart$suffix';
  }

  int _calculateAccuracy(SubjectStats stat) {
    if (stat.total == 0) return 0;
    return ((stat.correct / stat.total) * 100).round();
  }

  Color _getAccuracyColor(int accuracy) {
    if (accuracy >= 80) return const Color(0xFF059669); // emerald-500
    if (accuracy >= 50) return const Color(0xFF1E3A8A); // amber-500
    return const Color(0xFFB91C1C); // red-500
  }

  Color _getAccuracyBgColor(int accuracy, bool isDark) {
    if (accuracy >= 80) {
      return isDark
          ? const Color(0x33064e3b)
          : const Color(0xFFECFDF5); // emerald-900/20 : emerald-100
    }
    if (accuracy >= 50) {
      return isDark
          ? const Color(0x3378350f)
          : const Color(0xFFFEF3C7); // amber-900/20 : amber-100
    }
    return isDark
        ? const Color(0x337f1d1d)
        : const Color(0xFFFEE2E2); // red-900/20 : red-100
  }

  Color _getAccuracyTextColor(int accuracy, bool isDark) {
    if (accuracy >= 80) {
      return isDark
          ? const Color(0xFF059669)
          : const Color(0xFF059669); // emerald-400 : emerald-600
    }
    if (accuracy >= 50) {
      return isDark
          ? const Color(0xFFFBBF24)
          : const Color(0xFFD97706); // amber-400 : amber-600
    }
    return isDark
        ? const Color(0xFFF87171)
        : const Color(0xFFB91C1C); // red-400 : red-600
  }

  void _showSubjectDetailModal(
    BuildContext context,
    SubjectStats stat,
    int accuracy,
    int examCount,
    bool isDark,
  ) {
    final formattedName = _formatSubjectName(stat.name);
    final totalQuestions = stat.correct + stat.wrong + stat.skipped;

    String masteryBadge;
    Color masteryColor;
    String advice;

    if (accuracy >= 80) {
      masteryBadge = 'চমৎকার দক্ষতা (Master)';
      masteryColor = const Color(0xFF10B981);
      advice =
          'তোমার এই বিষয়ে চমৎকার দক্ষতা রয়েছে! পরীক্ষার হলে নিখুঁত টাইমিং বজায় রাখতে নিয়মিত মডেল টেস্ট দাও।';
    } else if (accuracy >= 60) {
      masteryBadge = 'ভালো অগ্রগতি (Proficient)';
      masteryColor = const Color(0xFF3B82F6);
      advice =
          'বেসিক কনসেপ্ট ভালো আছে। যেসব চ্যাপ্টারে ভুল বেশি হচ্ছে সেগুলো চিহ্নিত করে রিভিশন দাও।';
    } else if (accuracy >= 40) {
      masteryBadge = 'অনুশীলনের সুযোগ (Developing)';
      masteryColor = const Color(0xFFF59E0B);
      advice =
          'আন্দাজে উত্তর না দিয়ে নিশ্চিত প্রশ্নগুলো আগে সমাধান করো। অধ্যায়ভিত্তিক প্র্যাকটিসে মনোযোগ দাও।';
    } else {
      masteryBadge = 'বিশেষ মনোযোগ প্রয়োজন (Needs Focus)';
      masteryColor = const Color(0xFFEF4444);
      advice =
          'এই বিষয়ে নির্ভুলতা বাড়াতে প্রতিদিন অন্তত ১৫ মিনিট করে মূল বই ও সূত্রের নোট রিভিশন করো।';
    }

    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.55),
      isScrollControlled: true,
      builder: (ctx) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.50,
          ),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border.all(
              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
            ),
          ),
          child: Column(
          children: [
            // Pinned Header
            Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 16, 12),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: isDark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFE4E4E7),
                    width: 0.8,
                  ),
                ),
              ),
              child: Column(
                children: [
                  // Pill Handle
                  Center(
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      width: 36,
                      height: 4,
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF3F3F46)
                            : const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          formattedName,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF0F172A),
                            fontFamily: 'Anek Bangla',
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(ctx).pop(),
                        icon: const Icon(LucideIcons.x, size: 18),
                        splashRadius: 18,
                        color: isDark
                            ? const Color(0xFFA1A1AA)
                            : const Color(0xFF64748B),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Scrollable Content Below
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Accuracy & Mastery Banner
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF27272A)
                            : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF3F3F46)
                              : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'গড় নির্ভুলতা (Accuracy)',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: isDark
                                      ? const Color(0xFFA1A1AA)
                                      : const Color(0xFF64748B),
                                  fontFamily: 'Anek Bangla',
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                masteryBadge,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: masteryColor,
                                  fontFamily: 'Anek Bangla',
                                ),
                              ),
                            ],
                          ),
                          Text(
                            '$accuracy%',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              color: _getAccuracyColor(accuracy),
                              fontFamily: 'Anek Bangla',
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Stats Breakdown Grid (3 chips)
                    Row(
                      children: [
                        Expanded(
                          child: _buildModalStatChip(
                            title: 'মোট প্রশ্ন',
                            value: totalQuestions.toString(),
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                            bgColor: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                            isDark: isDark,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildModalStatChip(
                            title: 'সঠিক উত্তর',
                            value: stat.correct.toString(),
                            color: const Color(0xFF10B981),
                            bgColor: const Color(0xFF10B981).withValues(alpha: 0.12),
                            isDark: isDark,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildModalStatChip(
                            title: 'ভুল উত্তর',
                            value: stat.wrong.toString(),
                            color: const Color(0xFFEF4444),
                            bgColor: const Color(0xFFEF4444).withValues(alpha: 0.12),
                            isDark: isDark,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // Personalized Guidance
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF1F1F24)
                            : const Color(0xFFF0FDF4),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF2E2E36)
                              : const Color(0xFFDCFCE7),
                        ),
                      ),
                      child: Text(
                        advice,
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark
                              ? const Color(0xFFD4D4D8)
                              : const Color(0xFF166534),
                          height: 1.4,
                          fontFamily: 'Anek Bangla',
                        ),
                      ),
                    ),

                    const SizedBox(height: 18),

                    // Close Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => Navigator.of(ctx).pop(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isDark
                              ? const Color(0xFF27272A)
                              : const Color(0xFF0F172A),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'ঠিক আছে',
                          style: TextStyle(
                            fontFamily: 'Anek Bangla',
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
  }

  Widget _buildModalStatChip({
    required String title,
    required String value,
    required Color color,
    required Color bgColor,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE2E8F0),
          width: 0.8,
        ),
      ),
      child: Column(
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
              fontFamily: 'Anek Bangla',
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: color,
              fontFamily: 'Anek Bangla',
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (subjectStats.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF18181B) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
          ),
          boxShadow: [
            BoxShadow(
              color: isDark ? Colors.black26 : Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'বিষয়ভিত্তিক দক্ষতা',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
                fontFamily: 'Anek Bangla',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'এখনও কোনো পরীক্ষা দেওয়া হয়নি। পরীক্ষা দিলে এখানে তোমার বিষয়ভিত্তিক দক্ষতা দেখা যাবে।',
              style: TextStyle(
                fontSize: 16,
                color: isDark
                    ? const Color(0xFFA1A1AA)
                    : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'বিষয়ভিত্তিক দক্ষতা',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
              fontFamily: 'Anek Bangla',
            ),
          ),
          const SizedBox(height: 16),
          ...subjectStats.map((stat) {
            final accuracy = _calculateAccuracy(stat);
            final examCount = stat.correct + stat.wrong + stat.skipped;

            return InkWell(
              onTap: () => _showSubjectDetailModal(
                context,
                stat,
                accuracy,
                examCount,
                isDark,
              ),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF3F3F46)
                        : const Color(0xFFE2E8F0),
                    width: 0.8,
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            _formatSubjectName(stat.name),
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: isDark
                                  ? Colors.white
                                  : const Color(0xFF0F172A),
                              fontFamily: 'Anek Bangla',
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF3F3F46)
                                : const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '$examCount পরীক্ষা',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? const Color(0xFFA1A1AA)
                                  : const Color(0xFF64748B),
                              fontFamily: 'Anek Bangla',
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: _getAccuracyBgColor(accuracy, isDark),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '$accuracy%',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: _getAccuracyTextColor(accuracy, isDark),
                              fontFamily: 'Anek Bangla',
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    // Progress bar
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: accuracy / 100,
                        backgroundColor: isDark
                            ? const Color(0xFF3F3F46)
                            : const Color(0xFFE2E8F0),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          _getAccuracyColor(accuracy),
                        ),
                        minHeight: 6,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
