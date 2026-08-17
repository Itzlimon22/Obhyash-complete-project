import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/utils/bangla_name_helper.dart';

/// A sleek, inline expandable Accordion Card for exam scope (Subject, Chapters & Topics).
/// Used identically across Exam Runner (Pre-exam) and Exam Result views.
class ExamScopeHeader extends StatefulWidget {
  final String subjectName;
  final List<String> chapters;
  final List<String> topics;
  final bool isDark;
  final EdgeInsetsGeometry? margin;
  final bool initiallyExpanded;

  const ExamScopeHeader({
    super.key,
    required this.subjectName,
    this.chapters = const [],
    this.topics = const [],
    required this.isDark,
    this.margin,
    this.initiallyExpanded = false,
  });

  @override
  State<ExamScopeHeader> createState() => _ExamScopeHeaderState();
}

class _ExamScopeHeaderState extends State<ExamScopeHeader>
    with SingleTickerProviderStateMixin {
  late bool _isExpanded;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;
  }

  void _toggleExpand() {
    HapticFeedback.selectionClick();
    setState(() {
      _isExpanded = !_isExpanded;
    });
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
    final isDark = widget.isDark;
    final textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final bgColor = isDark ? const Color(0xFF141417) : Colors.white;
    final borderColor =
        isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0);
    final pillBg = isDark
        ? (_isExpanded
            ? const Color(0xFF064E3B).withValues(alpha: 0.5)
            : const Color(0xFF1F1F24))
        : (_isExpanded ? const Color(0xFFECFDF5) : const Color(0xFFF1F5F9));
    final pillBorder = isDark
        ? (_isExpanded
            ? const Color(0xFF059669).withValues(alpha: 0.5)
            : const Color(0xFF2E2E33))
        : (_isExpanded ? const Color(0xFFA7F3D0) : const Color(0xFFE2E8F0));
    final pillTextColor = isDark
        ? (_isExpanded ? const Color(0xFF34D399) : const Color(0xFFD4D4D8))
        : (_isExpanded ? const Color(0xFF047857) : const Color(0xFF334155));

    final cleanChapters = widget.chapters
        .where((c) => c.trim().isNotEmpty && c.toLowerCase() != 'all')
        .toList();
    cleanChapters.sort((a, b) {
      final idxA = BanglaNameHelper.getChapterSortIndex(a, a);
      final idxB = BanglaNameHelper.getChapterSortIndex(b, b);
      if (idxA != idxB) return idxA.compareTo(idxB);
      return a.compareTo(b);
    });
    final cleanTopics = widget.topics
        .where((t) => t.trim().isNotEmpty && t.toLowerCase() != 'all')
        .toList();

    final hasSpecificChapters = cleanChapters.isNotEmpty;
    final chapterCountLabel = hasSpecificChapters
        ? '${_toBengaliNumber(cleanChapters.length)}টি অধ্যায়'
        : 'সম্পূর্ণ সিলেবাস';

    final emoji = BanglaNameHelper.getSubjectEmoji(
      widget.subjectName,
      widget.subjectName,
    );

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeInOut,
      margin: widget.margin ?? const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        border: Border.all(
          color: _isExpanded
              ? (isDark
                  ? const Color(0xFF059669).withValues(alpha: 0.4)
                  : const Color(0xFF10B981).withValues(alpha: 0.3))
              : borderColor,
          width: _isExpanded ? 1.5 : 1,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(
              alpha: isDark ? 0.3 : (_isExpanded ? 0.08 : 0.03),
            ),
            blurRadius: _isExpanded ? 14 : 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Header Row (Clickable Accordion Toggle) ──
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: _toggleExpand,
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                child: Row(
                  children: [
                    // Subject Emoji
                    Container(
                      width: 34,
                      height: 34,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF1F1F24)
                            : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF2E2E33)
                              : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Text(
                        emoji,
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                    const SizedBox(width: 10),

                    // Subject Name
                    Expanded(
                      child: Text(
                        widget.subjectName,
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

                    const SizedBox(width: 8),

                    // Expand/Collapse Badge Pill
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: pillBg,
                        border: Border.all(color: pillBorder),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            chapterCountLabel,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'HindSiliguri',
                              color: pillTextColor,
                            ),
                          ),
                          const SizedBox(width: 4),
                          AnimatedRotation(
                            turns: _isExpanded ? 0.5 : 0.0,
                            duration: const Duration(milliseconds: 200),
                            child: Icon(
                              LucideIcons.chevronDown,
                              size: 13,
                              color: pillTextColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── Expandable Body: Chapters & Topics ──
          AnimatedSize(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeInOutCubic,
            child: _isExpanded
                ? Container(
                    padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Subtle Divider Line
                        Divider(
                          height: 1,
                          thickness: 1,
                          color: isDark
                              ? const Color(0xFF27272A)
                              : const Color(0xFFF1F5F9),
                        ),
                        const SizedBox(height: 12),

                        // Section Title
                        Row(
                          children: [
                            Icon(
                              LucideIcons.bookOpen,
                              size: 14,
                              color: isDark
                                  ? const Color(0xFF34D399)
                                  : const Color(0xFF059669),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'অন্তর্ভুক্ত অধ্যায়সমূহ (${_toBengaliNumber(cleanChapters.isNotEmpty ? cleanChapters.length : 1)}টি)',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'HindSiliguri',
                                color: isDark
                                    ? const Color(0xFFA1A1AA)
                                    : const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),

                        // Chapters List
                        if (cleanChapters.isEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF1A1A1E)
                                  : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              'সম্পূর্ণ সিলেবাসের সকল অধ্যায় থেকে প্রশ্ন অন্তর্ভুক্ত রয়েছে।',
                              style: TextStyle(
                                fontSize: 12,
                                fontFamily: 'HindSiliguri',
                                color: isDark
                                    ? const Color(0xFF71717A)
                                    : const Color(0xFF64748B),
                              ),
                            ),
                          )
                        else
                          ...List.generate(cleanChapters.length, (index) {
                            final ch = cleanChapters[index];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0xFF1A1A1E)
                                      : const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: isDark
                                        ? const Color(0xFF27272A)
                                        : const Color(0xFFE2E8F0),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 20,
                                      height: 20,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(
                                        color: isDark
                                            ? const Color(0xFF064E3B)
                                            : const Color(0xFFD1FAE5),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Text(
                                        _toBengaliNumber(index + 1),
                                        style: TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w800,
                                          fontFamily: 'HindSiliguri',
                                          color: isDark
                                              ? const Color(0xFF34D399)
                                              : const Color(0xFF047857),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        ch,
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          fontFamily: 'HindSiliguri',
                                          color: textColor,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }),

                        // Topics Section (if topics are present)
                        if (cleanTopics.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Icon(
                                LucideIcons.tag,
                                size: 13,
                                color: isDark
                                    ? const Color(0xFF60A5FA)
                                    : const Color(0xFF2563EB),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'টপিকসমূহ (${_toBengaliNumber(cleanTopics.length)}টি)',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'HindSiliguri',
                                  color: isDark
                                      ? const Color(0xFFA1A1AA)
                                      : const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: cleanTopics.map((topic) {
                              return Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 9,
                                  vertical: 4.5,
                                ),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0xFF1E293B)
                                      : const Color(0xFFEFF6FF),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isDark
                                        ? const Color(0xFF334155)
                                        : const Color(0xFFBFDBFE),
                                  ),
                                ),
                                child: Text(
                                  topic,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark
                                        ? const Color(0xFF93C5FD)
                                        : const Color(0xFF1D4ED8),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ],
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}
