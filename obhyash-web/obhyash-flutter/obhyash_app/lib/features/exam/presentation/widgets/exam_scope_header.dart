import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/utils/bangla_name_helper.dart';

/// A shared, single-row exam scope header with Subject name on the left
/// and floating center-modal buttons for Chapters and Topics on the right.
/// Used identically across Exam Runner (Pre-exam) and Exam Result views.
class ExamScopeHeader extends StatelessWidget {
  final String subjectName;
  final List<String> chapters;
  final List<String> topics;
  final bool isDark;
  final EdgeInsetsGeometry? margin;

  const ExamScopeHeader({
    super.key,
    required this.subjectName,
    this.chapters = const [],
    this.topics = const [],
    required this.isDark,
    this.margin,
  });

  void _showChaptersModal(BuildContext context) {
    HapticFeedback.lightImpact();
    ExamScopeModal.show(
      context: context,
      title: 'পরীক্ষার অধ্যায়সমূহ',
      subtitle: subjectName,
      accentColor: isDark ? const Color(0xFF34D399) : const Color(0xFF059669),
      items: chapters,
      isDark: isDark,
      emptyMessage: 'সম্পূর্ণ সিলেবাসের সকল অধ্যায় থেকে প্রশ্ন অন্তর্ভুক্ত রয়েছে।',
    );
  }

  void _showTopicsModal(BuildContext context) {
    HapticFeedback.lightImpact();
    ExamScopeModal.show(
      context: context,
      title: 'পরীক্ষার টপিকসমূহ',
      subtitle: subjectName,
      accentColor: isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB),
      items: topics,
      isDark: isDark,
      emptyMessage: 'সিলেবাসের অন্তর্ভুক্ত সকল টপিক থেকে প্রশ্ন করা হয়েছে।',
    );
  }

  String _toBengaliNumber(int number) {
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    String result = number.toString();
    for (int i = 0; i < 10; i++) {
      result = result.replaceAll(englishDigits[i], bengaliDigits[i]);
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    final textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final bgColor = isDark ? const Color(0xFF131316) : Colors.white;
    final borderColor = isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0);
    final buttonBg = isDark ? const Color(0xFF1F1F24) : const Color(0xFFF1F5F9);
    final buttonBorder = isDark ? const Color(0xFF2E2E33) : const Color(0xFFE2E8F0);

    final cleanChapters = chapters
        .where((c) => c.trim().isNotEmpty && c.toLowerCase() != 'all')
        .toList();
    final cleanTopics = topics
        .where((t) => t.trim().isNotEmpty && t.toLowerCase() != 'all')
        .toList();

    final chapterLabel = cleanChapters.isNotEmpty
        ? 'অধ্যায় (${_toBengaliNumber(cleanChapters.length)})'
        : 'অধ্যায়সমূহ';

    final topicLabel = cleanTopics.isNotEmpty
        ? 'টপিক (${_toBengaliNumber(cleanTopics.length)})'
        : 'টপিকসমূহ';

    return Container(
      margin: margin ?? const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: bgColor,
        border: Border.all(color: borderColor),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          // ── Left: Subject Name (Clean, No Icon) ──
          Expanded(
            child: Text(
              subjectName,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                fontFamily: 'HindSiliguri',
                color: textColor,
                height: 1.2,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),

          const SizedBox(width: 10),

          // ── Right: Action Buttons (Chapters & Topics without icons) ──
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Chapters Button
              _ScopeActionButton(
                label: chapterLabel,
                bgColor: buttonBg,
                borderColor: buttonBorder,
                textColor: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF334155),
                onTap: () => _showChaptersModal(context),
              ),

              const SizedBox(width: 8),

              // Topics Button
              _ScopeActionButton(
                label: topicLabel,
                bgColor: buttonBg,
                borderColor: buttonBorder,
                textColor: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF334155),
                onTap: () => _showTopicsModal(context),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ScopeActionButton extends StatelessWidget {
  final String label;
  final Color bgColor;
  final Color borderColor;
  final Color textColor;
  final VoidCallback onTap;

  const _ScopeActionButton({
    required this.label,
    required this.bgColor,
    required this.borderColor,
    required this.textColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: borderColor, width: 1),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              fontFamily: 'HindSiliguri',
              color: textColor,
            ),
          ),
        ),
      ),
    );
  }
}

/// A sleek, centered floating pop-up dialog for displaying selected chapters or topics.
class ExamScopeModal extends StatelessWidget {
  final String title;
  final String subtitle;
  final Color accentColor;
  final List<String> items;
  final bool isDark;
  final String emptyMessage;

  const ExamScopeModal({
    super.key,
    required this.title,
    required this.subtitle,
    required this.accentColor,
    required this.items,
    required this.isDark,
    required this.emptyMessage,
  });

  static void show({
    required BuildContext context,
    required String title,
    required String subtitle,
    required Color accentColor,
    required List<String> items,
    required bool isDark,
    required String emptyMessage,
  }) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'ExamScopeModal',
      barrierColor: Colors.black.withValues(alpha: 0.45),
      transitionDuration: const Duration(milliseconds: 220),
      pageBuilder: (ctx, anim1, anim2) {
        return Stack(
          alignment: Alignment.center,
          children: [
            Positioned.fill(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => Navigator.of(ctx).pop(),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
                  child: const SizedBox.expand(),
                ),
              ),
            ),
            Dialog(
              backgroundColor: Colors.transparent,
              elevation: 0,
              insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              child: ExamScopeModal(
                title: title,
                subtitle: subtitle,
                accentColor: accentColor,
                items: items,
                isDark: isDark,
                emptyMessage: emptyMessage,
              ),
            ),
          ],
        );
      },
      transitionBuilder: (ctx, anim1, anim2, child) {
        final curve = CurvedAnimation(parent: anim1, curve: Curves.easeOutCubic);
        return FadeTransition(
          opacity: curve,
          child: ScaleTransition(
            scale: Tween<double>(begin: 0.94, end: 1.0).animate(curve),
            child: child,
          ),
        );
      },
    );
  }

  String _toBengaliNumber(int number) {
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    String result = number.toString();
    for (int i = 0; i < 10; i++) {
      result = result.replaceAll(englishDigits[i], bengaliDigits[i]);
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = isDark ? const Color(0xFF141416) : Colors.white;
    final cardBg = isDark ? const Color(0xFF1E1E22) : const Color(0xFFF8FAFC);
    final cardBorder = isDark ? const Color(0xFF2E2E33) : const Color(0xFFE2E8F0);
    final textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final subColor = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);

    final cleanItems = items
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty && e.toLowerCase() != 'all')
        .toList();

    // Canonical textbook sorting
    cleanItems.sort((a, b) {
      final idxA = BanglaNameHelper.getChapterSortIndex(a);
      final idxB = BanglaNameHelper.getChapterSortIndex(b);
      return idxA.compareTo(idxB);
    });

    return Center(
      child: Container(
        constraints: BoxConstraints(
          maxWidth: 420,
          maxHeight: MediaQuery.of(context).size.height * 0.65,
        ),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.6 : 0.2),
              blurRadius: 28,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        padding: const EdgeInsets.fromLTRB(20, 18, 16, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Header Row (Clean, No Icon Box) ──
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'HindSiliguri',
                          color: textColor,
                        ),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'HindSiliguri',
                          color: subColor,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: Icon(
                    LucideIcons.x,
                    size: 20,
                    color: subColor,
                  ),
                  splashRadius: 20,
                ),
              ],
            ),

            const SizedBox(height: 14),

            // ── Content List or Empty State ──
            if (cleanItems.isEmpty) ...[
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 12),
                child: Center(
                  child: Text(
                    emptyMessage,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      fontFamily: 'HindSiliguri',
                      color: subColor,
                      height: 1.45,
                    ),
                  ),
                ),
              ),
            ] else ...[
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const BouncingScrollPhysics(),
                  padding: EdgeInsets.zero,
                  itemCount: cleanItems.length,
                  separatorBuilder: (ctx, i) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final item = cleanItems[index];
                    final formattedName = BanglaNameHelper.formatChapter(item);

                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: cardBorder),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(
                              color: accentColor.withValues(alpha: isDark ? 0.2 : 0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '#${_toBengaliNumber(index + 1)}',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                                color: accentColor,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              formattedName,
                              style: TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'HindSiliguri',
                                color: textColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
