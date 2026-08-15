import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/presentation/widgets/latex_text.dart';
import '../../domain/exam_models.dart';

class QuestionCard extends StatefulWidget {
  final Question question;
  final int serialNumber;
  final int? selectedOptionIndex;
  final bool isFlagged;
  final ValueChanged<int> onSelectOption;
  final VoidCallback onToggleFlag;
  final VoidCallback onReport;
  final bool isOmrMode;
  final bool showFeedback;
  final bool readOnly;
  final bool showAnswer;
  final bool isBookmarked;
  final bool initiallyExpanded;
  final VoidCallback? onToggleBookmark;

  const QuestionCard({
    super.key,
    required this.question,
    required this.serialNumber,
    this.selectedOptionIndex,
    required this.isFlagged,
    required this.onSelectOption,
    required this.onToggleFlag,
    required this.onReport,
    this.isOmrMode = false,
    this.showFeedback = false,
    this.readOnly = false,
    this.showAnswer = false,
    this.isBookmarked = false,
    this.initiallyExpanded = false,
    this.onToggleBookmark,
  });

  @override
  State<QuestionCard> createState() => _QuestionCardState();
}

class _QuestionCardState extends State<QuestionCard>
    with SingleTickerProviderStateMixin {
  bool _isExplanationOpen = false;
  late AnimationController _animCtrl;
  late Animation<double> _arrowTurns;

  @override
  void initState() {
    super.initState();
    _isExplanationOpen = widget.showFeedback && widget.initiallyExpanded;
    _animCtrl = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _arrowTurns = Tween<double>(
      begin: 0,
      end: 0.5,
    ).animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeInOut));
    if (_isExplanationOpen) _animCtrl.value = 1.0;
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  void _toggleExplanation() {
    HapticFeedback.lightImpact();
    setState(() {
      _isExplanationOpen = !_isExplanationOpen;
      if (_isExplanationOpen) {
        _animCtrl.forward();
      } else {
        _animCtrl.reverse();
      }
    });
  }

  String _toBengaliNumeral(int n) {
    const m = {
      '0': '০',
      '1': '১',
      '2': '২',
      '3': '৩',
      '4': '৪',
      '5': '৫',
      '6': '৬',
      '7': '৭',
      '8': '৮',
      '9': '৯',
    };
    return n.toString().split('').map((c) => m[c] ?? c).join();
  }

  static const _banglaIndices = [
    'ক',
    'খ',
    'গ',
    'ঘ',
    'ঙ',
    'চ',
    'ছ',
    'জ',
    'ঝ',
    'ঞ',
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isAnswered = widget.selectedOptionIndex != null;

    // Card border — orange ring when flagged
    Color borderColor = isDark
        ? const Color(0xFF333333)
        : const Color(0xFFE5E7EB);
    double borderWidth = 1;
    if (widget.isFlagged) {
      borderColor = const Color(0xFFFB923C); // orange-400
      borderWidth = 2;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: borderWidth),
        boxShadow: isDark
            ? []
            : [
                const BoxShadow(
                  color: Color(0x0A000000),
                  blurRadius: 12,
                  offset: Offset(0, 4),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Top section: serial + question + tags/actions ─────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 12, 10, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Serial number + question text (seamless continuous wrapping & baseline)
                LatexText(
                  text: '**${_toBengaliNumeral(widget.serialNumber)}.** ${widget.question.question}',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                    fontFamily: 'HindSiliguri',
                    color: isDark
                        ? const Color(0xFFF5F5F5)
                        : const Color(0xFF111827),
                    height: 1.45,
                  ),
                ),

                const SizedBox(height: 8),

                // Tags + action buttons row
                Row(
                  children: [
                    // Institute tag (if present)
                    if (widget.readOnly && widget.question.institutes.isNotEmpty) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF1E3A8A).withValues(alpha: 0.3)
                              : const Color(0xFFDBEAFE),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          widget.question.institutes.join(', '),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF1D4ED8),
                            letterSpacing: 0.3,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                    ],

                    // Year tag (if present)
                    if (widget.readOnly && widget.question.years.isNotEmpty) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF4C1D95).withValues(alpha: 0.3)
                              : const Color(0xFFF3E8FF),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          widget.question.years.join(', '),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: isDark ? const Color(0xFFA78BFA) : const Color(0xFF6D28D9),
                            letterSpacing: 0.3,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                    ],

                    // Flagged badge
                    if (widget.isFlagged) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0x4D78350F)
                              : const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'চিহ্নিত',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? const Color(0xFFFBBF24)
                                : const Color(0xFFD97706),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                    ],

                    const Spacer(),

                    // Bookmark button
                    _IconBtn(
                      onTap: widget.onToggleBookmark,
                      tooltip: widget.isBookmarked
                          ? 'বুকমার্ক সরাও'
                          : 'বুকমার্ক করো',
                      child: Icon(
                        widget.isBookmarked
                            ? Icons.bookmark_rounded
                            : Icons.bookmark_border_rounded,
                        size: 18,
                        color: widget.isBookmarked
                            ? const Color(0xFF1E3A8A) // amber-500
                            : (isDark
                                  ? const Color(0xFF525252)
                                  : const Color(0xFF9CA3AF)),
                      ),
                    ),

                    if (widget.readOnly) ...[
                      const SizedBox(width: 2),

                      // Report button
                      _IconBtn(
                        onTap: widget.onReport,
                        tooltip: 'রিপোর্ট করো',
                        child: Icon(
                          Icons.warning_amber_rounded,
                          size: 18,
                          color: isDark
                              ? const Color(0xFF525252)
                              : const Color(0xFF9CA3AF),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),

          // ── Options ───────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 0, 10, 14),
            child: Column(
              children: List.generate(widget.question.options.length, (idx) {
                final option = widget.question.options[idx];
                final isSelected = widget.selectedOptionIndex == idx;
                final isCorrect = idx == widget.question.correctAnswerIndex;
                final banglaIndex = _banglaIndices.length > idx
                    ? _banglaIndices[idx]
                    : (idx + 1).toString();

                // ── State colours (Clean, Premium, High-Contrast) ──
                Color boxBg = isDark
                    ? const Color(0xFF1F1F1F)
                    : const Color(0xFFF8F9FA);
                Color boxBorder = isDark
                    ? const Color(0xFF333333)
                    : const Color(0xFFE5E7EB);
                Color bulletBg = Colors.transparent;
                Color bulletBorder = isDark
                    ? const Color(0xFF525252)
                    : const Color(0xFFD1D5DB);
                Color bulletText = isDark
                    ? const Color(0xFFD4D4D4)
                    : const Color(0xFF6B7280);
                Color optionTextColor = isDark
                    ? const Color(0xFFE5E5E5)
                    : const Color(0xFF1F2937);
                bool boldText = false;
                double opacity = 1.0;
                Widget? trailingBadge;

                if (widget.showFeedback) {
                  if (isCorrect) {
                    // Premium High-Contrast Correct Styling (No harsh green)
                    boxBg = isDark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFF1F5F9);
                    boxBorder = isDark
                        ? const Color(0xFFF8FAFC)
                        : const Color(0xFF1E293B);
                    bulletBg = isDark
                        ? const Color(0xFFF8FAFC)
                        : const Color(0xFF1E293B);
                    bulletBorder = bulletBg;
                    bulletText = isDark
                        ? const Color(0xFF0F172A)
                        : Colors.white;
                    optionTextColor = isDark
                        ? const Color(0xFFFFFFFF)
                        : const Color(0xFF0F172A);
                    boldText = true;
                    trailingBadge = Icon(
                      Icons.check_circle_rounded,
                      size: 20,
                      color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B),
                    );
                  } else if (isSelected) {
                    // Refined Crimson for Wrong Selected
                    boxBg = isDark
                        ? const Color(0x337F1D1D)
                        : const Color(0xFFFEF2F2);
                    boxBorder = isDark
                        ? const Color(0xFFB91C1C)
                        : const Color(0xFFFCA5A5);
                    bulletBg = const Color(0xFFDC2626);
                    bulletBorder = const Color(0xFFDC2626);
                    bulletText = Colors.white;
                    optionTextColor = isDark
                        ? const Color(0xFFFCA5A5)
                        : const Color(0xFF991B1B);
                    boldText = true;
                    trailingBadge = Icon(
                      Icons.cancel_rounded,
                      size: 20,
                      color: isDark ? const Color(0xFFF87171) : const Color(0xFFDC2626),
                    );
                  } else {
                    opacity = 0.5;
                  }
                } else if (widget.showAnswer && isCorrect) {
                  boxBg = isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFF1F5F9);
                  boxBorder = isDark
                      ? const Color(0xFFF8FAFC)
                      : const Color(0xFF1E293B);
                  bulletBg = isDark
                      ? const Color(0xFFF8FAFC)
                      : const Color(0xFF1E293B);
                  bulletBorder = bulletBg;
                  bulletText = isDark
                      ? const Color(0xFF0F172A)
                      : Colors.white;
                  optionTextColor = isDark
                      ? const Color(0xFFFFFFFF)
                      : const Color(0xFF0F172A);
                  boldText = true;
                  trailingBadge = Icon(
                    Icons.check_circle_rounded,
                    size: 20,
                    color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF1E293B),
                  );
                } else if (isSelected) {
                  boxBg = isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFE5E7EB);
                  boxBorder = isDark
                      ? const Color(0xFF525252)
                      : const Color(0xFF9CA3AF);
                  bulletBg = isDark
                      ? const Color(0xFFE5E5E5)
                      : const Color(0xFF1F2937);
                  bulletBorder = isDark
                      ? const Color(0xFFE5E5E5)
                      : const Color(0xFF1F2937);
                  bulletText = isDark ? const Color(0xFF1F2937) : Colors.white;
                  optionTextColor = isDark
                      ? Colors.white
                      : const Color(0xFF111827);
                  boldText = true;
                }

                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Opacity(
                    opacity: opacity,
                    child: Material(
                      color: Colors.transparent,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: boxBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: boxBorder,
                            width: (widget.showFeedback || widget.showAnswer) && isCorrect ? 1.6 : 1.0,
                          ),
                        ),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            if (!isAnswered && !widget.isOmrMode && !widget.readOnly) {
                              HapticFeedback.lightImpact();
                              widget.onSelectOption(idx);
                            }
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                // Circular badge (letter)
                                AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  width: 24,
                                  height: 24,
                                  margin: const EdgeInsets.only(right: 10),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: bulletBg,
                                    border: Border.all(
                                      color: bulletBorder,
                                      width: 1.5,
                                    ),
                                    boxShadow:
                                        bulletBg == Colors.transparent && !isDark
                                        ? [
                                            const BoxShadow(
                                              color: Color(0x0D000000),
                                              blurRadius: 2,
                                              offset: Offset(0, 1),
                                            ),
                                          ]
                                        : [],
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    banglaIndex,
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.bold,
                                      fontFamily: 'HindSiliguri',
                                      color: bulletText,
                                      height: 1.1,
                                    ),
                                  ),
                                ),
                                // Option text
                                Expanded(
                                  child: LatexText(
                                    text: option,
                                    style: TextStyle(
                                      fontSize: 16.5,
                                      fontFamily: 'HindSiliguri',
                                      fontWeight: boldText
                                          ? FontWeight.bold
                                          : FontWeight.normal,
                                      color: optionTextColor,
                                      height: 1.35,
                                    ),
                                  ),
                                ),
                                if (trailingBadge != null) ...[
                                  const SizedBox(width: 8),
                                  trailingBadge,
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),

          // ── Explanation (collapsible, web-style) ──────────────────────────
          if (widget.showFeedback &&
              widget.question.explanation != null &&
              widget.question.explanation!.isNotEmpty)
            _ExplanationPanel(
              question: widget.question,
              isDark: isDark,
              isOpen: _isExplanationOpen,
              arrowTurns: _arrowTurns,
              onToggle: _toggleExplanation,
              banglaIndices: _banglaIndices,
            ),
        ],
      ),
    );
  }
}

// ── Explanation Panel (Warm Book Page Theme) ──────────────────────────────────

class _ExplanationPanel extends StatelessWidget {
  final Question question;
  final bool isDark;
  final bool isOpen;
  final Animation<double> arrowTurns;
  final VoidCallback onToggle;
  final List<String> banglaIndices;

  const _ExplanationPanel({
    required this.question,
    required this.isDark,
    required this.isOpen,
    required this.arrowTurns,
    required this.onToggle,
    required this.banglaIndices,
  });

  @override
  Widget build(BuildContext context) {
    // ── Book Page Theme Color Tokens ──
    // Header (deeper tone)
    final headerBg = isDark
        ? const Color(0xFF28221D)
        : const Color(0xFFF3ECE4);
    final headerTextColor = isDark
        ? const Color(0xFFEADFCF)
        : const Color(0xFF42352B);
    final headerBorderColor = isDark
        ? const Color(0xFF3D332B)
        : const Color(0xFFE2D7C9);
    final chevronBg = isDark
        ? const Color(0xFF362C25)
        : const Color(0xFFE7DDD0);

    // Below body (lighter tone)
    final bodyBg = isDark
        ? const Color(0xFF1B1614)
        : const Color(0xFFFAF7F2);
    final bodyTextColor = isDark
        ? const Color(0xFFD6CDC3)
        : const Color(0xFF2E2621);
    final dividerColor = isDark
        ? const Color(0xFF332922)
        : const Color(0xFFE8DFD3);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      margin: const EdgeInsets.fromLTRB(10, 0, 10, 12),
      decoration: BoxDecoration(
        color: isOpen ? bodyBg : headerBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: headerBorderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Toggle Header (Deeper Book Page Color)
          GestureDetector(
            onTap: onToggle,
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: headerBg,
                borderRadius: isOpen
                    ? const BorderRadius.vertical(top: Radius.circular(9))
                    : BorderRadius.circular(9),
              ),
              child: Row(
                children: [
                  Icon(
                    LucideIcons.bookOpen,
                    size: 16,
                    color: headerTextColor,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'ব্যাখ্যা',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'HindSiliguri',
                      color: headerTextColor,
                    ),
                  ),
                  const Spacer(),
                  // Animated Chevron Button
                  Container(
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      color: chevronBg,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: headerBorderColor,
                        width: 0.8,
                      ),
                    ),
                    child: RotationTransition(
                      turns: arrowTurns,
                      child: Icon(
                        Icons.keyboard_arrow_down_rounded,
                        size: 17,
                        color: headerTextColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Collapsible Content (Lighter Book Page Color)
          AnimatedCrossFade(
            duration: const Duration(milliseconds: 200),
            crossFadeState: isOpen
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            firstChild: const SizedBox.shrink(),
            secondChild: Container(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 14),
              decoration: BoxDecoration(
                color: bodyBg,
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(9)),
                border: Border(
                  top: BorderSide(
                    color: dividerColor,
                    width: 1,
                  ),
                ),
              ),
              child: LatexText(
                text: question.explanation!,
                style: TextStyle(
                  fontSize: 16,
                  fontFamily: 'HindSiliguri',
                  height: 1.6,
                  color: bodyTextColor,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Small icon button helper ──────────────────────────────────────────────────

class _IconBtn extends StatelessWidget {
  final VoidCallback? onTap;
  final String tooltip;
  final Widget child;

  const _IconBtn({
    required this.onTap,
    required this.tooltip,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap != null ? () {
            HapticFeedback.lightImpact();
            onTap!();
          } : null,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.all(8), 
            child: child,
          ),
        ),
      ),
    );
  }
}
