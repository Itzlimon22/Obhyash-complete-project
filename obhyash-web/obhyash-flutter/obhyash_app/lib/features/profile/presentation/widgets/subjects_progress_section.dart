import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/utils/bangla_name_helper.dart';

import '../../../dashboard/domain/models.dart';

class SubjectsProgressSection extends StatelessWidget {
  final List<SubjectStats> subjectStats;
  final Function(String)? onSubjectClick;
  final bool isViewingSelf;
  final String? studentName;
  final String? stream;

  const SubjectsProgressSection({
    super.key,
    required this.subjectStats,
    this.onSubjectClick,
    this.isViewingSelf = true,
    this.studentName,
    this.stream,
  });

  static const List<(String, String)> _hscSubjects = [
    ('hsc_physics_1', 'পদার্থবিজ্ঞান ১ম পত্র'),
    ('hsc_physics_2', 'পদার্থবিজ্ঞান ২য় পত্র'),
    ('hsc_chemistry_1', 'রসায়ন ১ম পত্র'),
    ('hsc_chemistry_2', 'রসায়ন ২য় পত্র'),
    ('hsc_higher_math_1', 'উচ্চতর গণিত ১ম পত্র'),
    ('hsc_higher_math_2', 'উচ্চতর গণিত ২য় পত্র'),
    ('hsc_biology_1', 'জীববিজ্ঞান ১ম পত্র'),
    ('hsc_biology_2', 'জীববিজ্ঞান ২য় পত্র'),
    ('hsc_bangla_1', 'বাংলা ১ম পত্র'),
    ('hsc_bangla_2', 'বাংলা ২য় পত্র'),
    ('hsc_english_1', 'ইংরেজি ১ম পত্র'),
    ('hsc_english_2', 'ইংরেজি ২য় পত্র'),
    ('hsc_ict', 'তথ্য ও যোগাযোগ প্রযুক্তি'),
  ];

  static const List<(String, String)> _sscSubjects = [
    ('ssc_physics', 'পদার্থবিজ্ঞান'),
    ('ssc_chemistry', 'রসায়ন'),
    ('ssc_higher_math', 'উচ্চতর গণিত'),
    ('ssc_general_math', 'সাধারণ গণিত'),
    ('ssc_biology', 'জীববিজ্ঞান'),
    ('ssc_ict', 'তথ্য ও যোগাযোগ প্রযুক্তি'),
    ('ssc_bangla_1', 'বাংলা ১ম পত্র'),
    ('ssc_bangla_2', 'বাংলা ২য় পত্র'),
    ('ssc_english_1', 'ইংরেজি ১ম পত্র'),
    ('ssc_english_2', 'ইংরেজি ২য় পত্র'),
  ];

  String _formatSubjectName(String name, [String? id]) {
    // Preserve full Bengali subject name with paper (e.g. পদার্থবিজ্ঞান ১ম পত্র)
    final formatted = BanglaNameHelper.formatSubject(name, id);
    return formatted.replaceAll(RegExp(r'\s*\([^)]*\)'), '').trim();
  }

  int _calculateAccuracy(SubjectStats stat) {
    final attempted = stat.correct + stat.wrong;
    if (attempted == 0) return 0;
    return ((stat.correct / attempted) * 100).round();
  }

  Color _getAccuracyColor(int accuracy, [int examCount = 1]) {
    if (examCount == 0) return const Color(0xFF64748B);
    if (accuracy >= 80) return const Color(0xFF059669); // emerald-500
    if (accuracy >= 60) return const Color(0xFF2563EB); // blue-600
    if (accuracy >= 40) return const Color(0xFFD97706); // amber-600
    return const Color(0xFFDC2626); // red-600
  }

  Color _getAccuracyBgColor(int accuracy, bool isDark, [int examCount = 1]) {
    if (examCount == 0) {
      return isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9);
    }
    if (accuracy >= 80) {
      return isDark
          ? const Color(0x33064e3b)
          : const Color(0xFFECFDF5);
    }
    if (accuracy >= 60) {
      return isDark
          ? const Color(0x331e3a8a)
          : const Color(0xFFEFF6FF);
    }
    if (accuracy >= 40) {
      return isDark
          ? const Color(0x3378350f)
          : const Color(0xFFFFFBEB);
    }
    return isDark
        ? const Color(0x337f1d1d)
        : const Color(0xFFFFF1F2);
  }

  Color _getAccuracyTextColor(int accuracy, bool isDark, [int examCount = 1]) {
    if (examCount == 0) {
      return isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);
    }
    if (accuracy >= 80) {
      return isDark
          ? const Color(0xFF34D399)
          : const Color(0xFF059669);
    }
    if (accuracy >= 60) {
      return isDark
          ? const Color(0xFF60A5FA)
          : const Color(0xFF2563EB);
    }
    if (accuracy >= 40) {
      return isDark
          ? const Color(0xFFFBBF24)
          : const Color(0xFFD97706);
    }
    return isDark
        ? const Color(0xFFF87171)
        : const Color(0xFFDC2626);
  }

  void _showSubjectDetailModal(
    BuildContext context,
    SubjectStats stat,
    int accuracy,
    int examCount,
    bool isDark,
  ) {
    final formattedName = _formatSubjectName(stat.name, stat.id);
    final totalQuestions = stat.total > 0 ? stat.total : (stat.correct + stat.wrong + stat.skipped);
    final skipped = (totalQuestions - (stat.correct + stat.wrong)).clamp(0, 999999);

    String masteryBadge;
    Color masteryColor;
    String advice;
    Color adviceBg;
    Color adviceBorder;
    Color adviceTextColor;

    if (examCount == 0) {
      masteryBadge = 'শুরু করোনি (Not Started)';
      masteryColor = const Color(0xFF94A3B8);
      advice =
          'এই বিষয়ে এখনও কোনো পরীক্ষা দেওয়া হয়নি। অধ্যায়ভিত্তিক প্র্যাকটিস বা মডেল টেস্ট দিয়ে প্রস্তুতি শুরু করো।';
      adviceBg = isDark ? const Color(0xFF1E2028) : const Color(0xFFF8FAFC);
      adviceBorder = isDark ? const Color(0xFF2A2D3A) : const Color(0xFFE2E8F0);
      adviceTextColor = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569);
    } else if (accuracy >= 80) {
      masteryBadge = 'চমৎকার দক্ষতা (Master)';
      masteryColor = const Color(0xFF10B981);
      advice =
          'তোমার এই বিষয়ে চমৎকার দক্ষতা রয়েছে! পরীক্ষার হলে নিখুঁত টাইমিং বজায় রাখতে নিয়মিত মডেল টেস্ট দাও।';
      adviceBg = isDark ? const Color(0xFF064E3B).withValues(alpha: 0.22) : const Color(0xFFECFDF5);
      adviceBorder = isDark ? const Color(0xFF047857) : const Color(0xFFA7F3D0);
      adviceTextColor = isDark ? const Color(0xFF6EE7B7) : const Color(0xFF065F46);
    } else if (accuracy >= 60) {
      masteryBadge = 'ভালো অগ্রগতি (Proficient)';
      masteryColor = const Color(0xFF3B82F6);
      advice =
          'বেসিক কনসেপ্ট ভালো আছে। যেসব চ্যাপ্টারে ভুল বেশি হচ্ছে সেগুলো চিহ্নিত করে রিভিশন দাও।';
      adviceBg = isDark ? const Color(0xFF1E3A8A).withValues(alpha: 0.22) : const Color(0xFFEFF6FF);
      adviceBorder = isDark ? const Color(0xFF1D4ED8) : const Color(0xFFBFDBFE);
      adviceTextColor = isDark ? const Color(0xFF93C5FD) : const Color(0xFF1E40AF);
    } else if (accuracy >= 40) {
      masteryBadge = 'অনুশীলনের সুযোগ (Developing)';
      masteryColor = const Color(0xFFF59E0B);
      advice =
          'আন্দাজে উত্তর না দিয়ে নিশ্চিত প্রশ্নগুলো আগে সমাধান করো। অধ্যায়ভিত্তিক প্র্যাকটিসে মনোযোগ দাও।';
      adviceBg = isDark ? const Color(0xFF78350F).withValues(alpha: 0.22) : const Color(0xFFFFFBEB);
      adviceBorder = isDark ? const Color(0xFFD97706) : const Color(0xFFFDE68A);
      adviceTextColor = isDark ? const Color(0xFFFCD34D) : const Color(0xFF92400E);
    } else {
      masteryBadge = 'বিশেষ মনোযোগ প্রয়োজন (Needs Focus)';
      masteryColor = const Color(0xFFEF4444);
      advice =
          'এই বিষয়ে নির্ভুলতা বাড়াতে প্রতিদিন অন্তত ১৫ মিনিট করে মূল বই ও সূত্রের নোট রিভিশন করো।';
      adviceBg = isDark ? const Color(0xFF881337).withValues(alpha: 0.22) : const Color(0xFFFFF1F2);
      adviceBorder = isDark ? const Color(0xFFE11D48) : const Color(0xFFFECDD3);
      adviceTextColor = isDark ? const Color(0xFFFDA4AF) : const Color(0xFF9F1239);
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
            maxHeight: MediaQuery.of(context).size.height * 0.65,
          ),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF141417) : Colors.white,
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
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
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
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  masteryBadge,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: masteryColor,
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              examCount == 0
                                  ? '০%'
                                  : '${BanglaNameHelper.toBanglaNumeral(accuracy)}%',
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                color: _getAccuracyColor(accuracy, examCount),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 14),

                      // Stats Breakdown: Row 1 (Exams & Total Questions)
                      Row(
                        children: [
                          Expanded(
                            child: _buildModalStatChip(
                              title: 'মোট পরীক্ষা',
                              value: examCount == 0
                                  ? '০'
                                  : BanglaNameHelper.toBanglaNumeral(examCount),
                              color: isDark
                                  ? Colors.white
                                  : const Color(0xFF0F172A),
                              bgColor: isDark
                                  ? const Color(0xFF27272A)
                                  : const Color(0xFFF1F5F9),
                              isDark: isDark,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _buildModalStatChip(
                              title: 'মোট প্রশ্ন',
                              value: totalQuestions == 0
                                  ? '০'
                                  : BanglaNameHelper.toBanglaNumeral(totalQuestions),
                              color: isDark
                                  ? Colors.white
                                  : const Color(0xFF0F172A),
                              bgColor: isDark
                                  ? const Color(0xFF27272A)
                                  : const Color(0xFFF1F5F9),
                              isDark: isDark,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 8),

                      // Stats Breakdown: Row 2 (Correct, Wrong, Skipped)
                      Row(
                        children: [
                          Expanded(
                            child: _buildModalStatChip(
                              title: 'সঠিক উত্তর',
                              value: stat.correct == 0
                                  ? '০'
                                  : BanglaNameHelper.toBanglaNumeral(stat.correct),
                              color: const Color(0xFF10B981),
                              bgColor: const Color(0xFF10B981).withValues(alpha: 0.12),
                              isDark: isDark,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _buildModalStatChip(
                              title: 'ভুল উত্তর',
                              value: stat.wrong == 0
                                  ? '০'
                                  : BanglaNameHelper.toBanglaNumeral(stat.wrong),
                              color: const Color(0xFFEF4444),
                              bgColor: const Color(0xFFEF4444).withValues(alpha: 0.12),
                              isDark: isDark,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _buildModalStatChip(
                              title: 'উত্তর দেয়নি',
                              value: skipped == 0
                                  ? '০'
                                  : BanglaNameHelper.toBanglaNumeral(skipped),
                              color: isDark
                                  ? const Color(0xFF94A3B8)
                                  : const Color(0xFF64748B),
                              bgColor: isDark
                                  ? const Color(0xFF27272A)
                                  : const Color(0xFFF1F5F9),
                              isDark: isDark,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),

                      // Harmonized Personalized Guidance (Matches Status Color)
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: adviceBg,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: adviceBorder),
                        ),
                        child: Text(
                          advice,
                          style: TextStyle(
                            fontSize: 13,
                            color: adviceTextColor,
                            height: 1.4,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),

                      const SizedBox(height: 18),

                      // Close Button with Safe Area
                      SafeArea(
                        top: false,
                        child: SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton(
                            onPressed: () => Navigator.of(ctx).pop(),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isDark
                                  ? const Color(0xFF27272A)
                                  : const Color(0xFF0F172A),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              elevation: 0,
                            ),
                            child: const Text(
                              'ঠিক আছে',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
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
              ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final isSsc = stream?.toUpperCase() == 'SSC';
    final curriculum = isSsc ? _sscSubjects : _hscSubjects;

    // 1. Group exam stats by clean Bengali name with paper preserved
    final Map<String, SubjectStats> examStatsBySubject = {};
    for (final stat in subjectStats) {
      final formattedName = _formatSubjectName(stat.name, stat.id);
      if (examStatsBySubject.containsKey(formattedName)) {
        final prev = examStatsBySubject[formattedName]!;
        examStatsBySubject[formattedName] = SubjectStats(
          id: prev.id,
          name: formattedName,
          correct: prev.correct + stat.correct,
          wrong: prev.wrong + stat.wrong,
          skipped: prev.skipped + stat.skipped,
          total: prev.total + stat.total,
          examsCount: prev.examsCount + stat.examsCount,
        );
      } else {
        examStatsBySubject[formattedName] = SubjectStats(
          id: stat.id,
          name: formattedName,
          correct: stat.correct,
          wrong: stat.wrong,
          skipped: stat.skipped,
          total: stat.total,
          examsCount: stat.examsCount,
        );
      }
    }

    // 2. Populate curriculum subjects in order
    final List<SubjectStats> validStats = [];
    final Set<String> matchedKeys = {};

    for (final (subId, banglaName) in curriculum) {
      SubjectStats? match = examStatsBySubject[banglaName];

      if (match != null) {
        matchedKeys.add(banglaName);
        validStats.add(SubjectStats(
          id: subId,
          name: banglaName,
          correct: match.correct,
          wrong: match.wrong,
          skipped: match.skipped,
          total: match.total,
          examsCount: match.examsCount,
        ));
      } else {
        // Look for any alias in examStatsBySubject matching subId
        for (final entry in examStatsBySubject.entries) {
          if (matchedKeys.contains(entry.key)) continue;
          final keyLower = entry.key.toLowerCase();
          final idLower = entry.value.id.toLowerCase();
          final isP1 = idLower.contains('1') || keyLower.contains('১ম') || idLower.contains('first');
          final isP2 = idLower.contains('2') || keyLower.contains('২য়') || idLower.contains('second');

          bool isMatch = false;
          if (subId.contains('physics_1') && (idLower.contains('phy') || keyLower.contains('পদার্থ')) && isP1) isMatch = true;
          if (subId.contains('physics_2') && (idLower.contains('phy') || keyLower.contains('পদার্থ')) && isP2) isMatch = true;
          if (subId.contains('chemistry_1') && (idLower.contains('chem') || keyLower.contains('রসায়ন')) && isP1) isMatch = true;
          if (subId.contains('chemistry_2') && (idLower.contains('chem') || keyLower.contains('রসায়ন')) && isP2) isMatch = true;
          if (subId.contains('higher_math_1') && (idLower.contains('math') || keyLower.contains('গণিত')) && isP1) isMatch = true;
          if (subId.contains('higher_math_2') && (idLower.contains('math') || keyLower.contains('গণিত')) && isP2) isMatch = true;
          if (subId.contains('biology_1') && (idLower.contains('bio') || keyLower.contains('জীব')) && isP1) isMatch = true;
          if (subId.contains('biology_2') && (idLower.contains('bio') || keyLower.contains('জীব')) && isP2) isMatch = true;
          if (subId.contains('bangla_1') && (idLower.contains('bangla') || keyLower.contains('বাংলা')) && isP1) isMatch = true;
          if (subId.contains('bangla_2') && (idLower.contains('bangla') || keyLower.contains('বাংলা')) && isP2) isMatch = true;
          if (subId.contains('english_1') && (idLower.contains('english') || keyLower.contains('ইংরেজি')) && isP1) isMatch = true;
          if (subId.contains('english_2') && (idLower.contains('english') || keyLower.contains('ইংরেজি')) && isP2) isMatch = true;
          if (subId.contains('ict') && (idLower.contains('ict') || keyLower.contains('তথ্য') || keyLower.contains('আইসিটি'))) isMatch = true;

          if (isMatch) {
            match = entry.value;
            matchedKeys.add(entry.key);
            break;
          }
        }

        if (match != null) {
          validStats.add(SubjectStats(
            id: subId,
            name: banglaName,
            correct: match.correct,
            wrong: match.wrong,
            skipped: match.skipped,
            total: match.total,
            examsCount: match.examsCount,
          ));
        } else {
          validStats.add(SubjectStats(
            id: subId,
            name: banglaName,
            correct: 0,
            wrong: 0,
            skipped: 0,
            total: 0,
            examsCount: 0,
          ));
        }
      }
    }

    // 3. Append any other academic subjects user tested outside standard list
    for (final entry in examStatsBySubject.entries) {
      if (!matchedKeys.contains(entry.key) &&
          BanglaNameHelper.isAcademicSubject(entry.key)) {
        validStats.add(entry.value);
      }
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
              ),
          ),
          const SizedBox(height: 16),
          ...validStats.map((stat) {
            final accuracy = _calculateAccuracy(stat);
            final examCount = stat.examsCount;

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
                            _formatSubjectName(stat.name, stat.id),
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: isDark
                                  ? Colors.white
                                  : const Color(0xFF0F172A),
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
                            examCount == 0
                                ? '০ টি পরীক্ষা'
                                : '${BanglaNameHelper.toBanglaNumeral(examCount)} টি পরীক্ষা',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? const Color(0xFFA1A1AA)
                                  : const Color(0xFF64748B),
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
                            color: _getAccuracyBgColor(accuracy, isDark, examCount),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            examCount == 0
                                ? '০%'
                                : '${BanglaNameHelper.toBanglaNumeral(accuracy)}%',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: _getAccuracyTextColor(accuracy, isDark, examCount),
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
                        value: examCount == 0 ? 0.0 : (accuracy / 100),
                        backgroundColor: isDark
                            ? const Color(0xFF3F3F46)
                            : const Color(0xFFE2E8F0),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          _getAccuracyColor(accuracy, examCount),
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
