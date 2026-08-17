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
    if (l.contains('physics')) subjectPart = 'পদার্থবিজ্ঞান';
    else if (l.contains('chemistry')) subjectPart = 'রসায়ন';
    else if (l.contains('biology') || l.contains('botany') || l.contains('zoology')) subjectPart = 'জীববিজ্ঞান';
    else if (l.contains('math') || l.contains('higher_math')) subjectPart = 'উচ্চতর গণিত';
    else if (l.contains('bangla')) subjectPart = 'বাংলা';
    else if (l.contains('english')) subjectPart = 'ইংরেজি';
    else if (l.contains('ict')) subjectPart = 'আইসিটি';
    else if (l.contains('accounting')) subjectPart = 'হিসাববিজ্ঞান';
    else if (l.contains('finance')) subjectPart = 'ফাইনান্স';
    else if (l.contains('management')) subjectPart = 'ব্যবসায় সংগঠন';
    else if (l.contains('general_science')) subjectPart = 'সাধারণ বিজ্ঞান';
    else if (l.contains('bgs') || l.contains('bangladesh_and_global_studies')) subjectPart = 'বাংলাদেশ ও বিশ্বপরিচয়';
    else if (l.contains('general_knowledge') || l.contains('gk')) subjectPart = 'সাধারণ জ্ঞান';
    else if (l.contains('general')) subjectPart = 'সাধারণ';
    else {
      if (!name.contains('_')) return name;
      return name.split('_').map((word) {
        if (word.isEmpty) return word;
        if (word.toLowerCase() == 'hsc' || word.toLowerCase() == 'ssc') return word.toUpperCase();
        return word[0].toUpperCase() + word.substring(1).toLowerCase();
      }).join(' ');
    }

    String suffix = '';
    if (l.endsWith('_1')) suffix = ' ১ম পত্র';
    else if (l.endsWith('_2')) suffix = ' ২য় পত্র';

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

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (subjectStats.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF000000) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'বিষয়ভিত্তিক দক্ষতা',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : const Color(0xFF000000),
                fontFamily: 'Anek Bangla',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'এখনও কোনো পরীক্ষা দেওয়া হয়নি। পরীক্ষা দিলে এখানে তোমার বিষয়ভিত্তিক দক্ষতা দেখা যাবে।',
              style: TextStyle(
                fontSize: 16,
                color: isDark
                    ? const Color(0xFFA3A3A3)
                    : const Color(0xFF737373),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(20), // sm:p-8
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(24), // sm:rounded-3xl
        border: Border.all(
          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'বিষয়ভিত্তিক দক্ষতা',
            style: TextStyle(
              fontSize: 22, // text-xl
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF000000),
              fontFamily: 'Anek Bangla',
            ),
          ),
          const SizedBox(height: 16),
          ...subjectStats.map((stat) {
            final accuracy = _calculateAccuracy(stat);
            final examCount = stat.correct + stat.wrong + stat.skipped;

            return Container(
              margin: const EdgeInsets.only(bottom: 16), // space-y-4
              padding: const EdgeInsets.all(16), // p-4
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0x80262626)
                    : const Color(0xFFFAFAFA), // neutral-800/50 : neutral-50
                borderRadius: BorderRadius.circular(16), // rounded-xl
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            Flexible(
                              child: Text(
                                _formatSubjectName(stat.name),
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF000000),
                                  fontFamily: 'Anek Bangla',
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0xFF27272A)
                                    : const Color(
                                        0xFFE5E5E5,
                                      ), // neutral-700 : neutral-200
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '$examCount পরীক্ষা',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? const Color(0xFFA3A3A3)
                                      : const Color(0xFF737373),
                                  fontFamily: 'Anek Bangla',
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _getAccuracyBgColor(accuracy, isDark),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '$accuracy%',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: _getAccuracyTextColor(accuracy, isDark),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Progress bar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: accuracy / 100,
                      backgroundColor: isDark
                          ? const Color(0xFF27272A)
                          : const Color(
                              0xFFE5E5E5,
                            ), // neutral-700 : neutral-200
                      valueColor: AlwaysStoppedAnimation<Color>(
                        _getAccuracyColor(accuracy),
                      ),
                      minHeight: 8,
                    ),
                  ),
                  if (onSubjectClick != null) ...[
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton.icon(
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          foregroundColor: isDark
                              ? const Color(0xFFA3A3A3)
                              : const Color(0xFF737373),
                        ),
                        onPressed: () => onSubjectClick!(stat.id),
                        icon: const Icon(LucideIcons.arrowRight, size: 12),
                        label: const Text(
                          'বিস্তারিত রিপোর্ট',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Anek Bangla',
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
