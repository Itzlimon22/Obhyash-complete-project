import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/presentation/widgets/app_icon.dart';
import '../../../../core/presentation/widgets/latex_text.dart';
import '../../../../core/presentation/widgets/obhyash_tooltip.dart';
import '../../../../core/presentation/widgets/pro_upgrade_modal.dart';
import '../../../../core/utils/bangla_name_helper.dart';
import '../../domain/exam_models.dart';

class WrittenQuestionCard extends StatefulWidget {
  final Question question;
  final int serialNumber;
  final bool isBookmarked;
  final bool isFlagged;
  final VoidCallback? onToggleBookmark;
  final VoidCallback? onToggleFlag;
  final VoidCallback? onReport;
  final bool hideExplanation;
  final bool initiallyExpanded;
  final EdgeInsetsGeometry? margin;

  const WrittenQuestionCard({
    super.key,
    required this.question,
    required this.serialNumber,
    this.isBookmarked = false,
    this.isFlagged = false,
    this.onToggleBookmark,
    this.onToggleFlag,
    this.onReport,
    this.hideExplanation = false,
    this.initiallyExpanded = true,
    this.margin,
  });

  @override
  State<WrittenQuestionCard> createState() => _WrittenQuestionCardState();
}

class _WrittenQuestionCardState extends State<WrittenQuestionCard>
    with SingleTickerProviderStateMixin {
  late bool _isExplanationOpen;
  late AnimationController _animCtrl;
  late Animation<double> _arrowTurns;

  @override
  void initState() {
    super.initState();
    _isExplanationOpen = widget.initiallyExpanded;
    _animCtrl = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _arrowTurns = Tween<double>(
      begin: 0,
      end: 0.5,
    ).animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeInOut));
    if (_isExplanationOpen) {
      _animCtrl.value = 1.0;
    }
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

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Color borderColor = isDark
        ? const Color(0xFF27272A)
        : const Color(0xFFE5E7EB);
    double borderWidth = 1;
    if (widget.isFlagged) {
      borderColor = const Color(0xFFFB923C);
      borderWidth = 2;
    }

    final hasExplanation = widget.question.explanation != null &&
        widget.question.explanation!.trim().isNotEmpty;

    return Container(
      margin: widget.margin ?? const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141416) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: borderWidth),
        boxShadow: isDark
            ? []
            : [
                const BoxShadow(
                  color: Color(0x0A000000),
                  blurRadius: 10,
                  offset: Offset(0, 3),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Top section: serial + question + tags + actions ────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Serial number + question text with LaTeX support
                LatexText(
                  text: '${_toBengaliNumeral(widget.serialNumber)}. ${widget.question.question}',
                  style: TextStyle(
                    fontSize: 16.5,
                    fontWeight: FontWeight.normal,
                    color: isDark
                        ? const Color(0xFFF8FAFC)
                        : const Color(0xFF0F172A),
                    height: 1.5,
                  ),
                ),

                if (widget.question.imageUrl != null &&
                    widget.question.imageUrl!.trim().isNotEmpty &&
                    !widget.question.question.contains(widget.question.imageUrl!)) ...[
                  const SizedBox(height: 8),
                  _buildDedicatedWrittenImage(widget.question.imageUrl!, isDark),
                ],

                const SizedBox(height: 10),

                // Tags row (Marks Badge + Source Tag + Flagged + Actions)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(
                      child: Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          // 1. Marks Badge (মান: ৪ / ১০)
                          if (widget.question.points > 0)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3.5,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFF8B5CF6).withValues(alpha: isDark ? 0.22 : 0.12),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: const Color(0xFF8B5CF6).withValues(alpha: isDark ? 0.45 : 0.25),
                                  width: 0.8,
                                ),
                              ),
                              child: Text(
                                'মান: ${_toBengaliNumeral(widget.question.points)}',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w700,
                                  color: isDark
                                      ? const Color(0xFFC4B5FD)
                                      : const Color(0xFF6D28D9),
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ),

                          // 2. Source Tag (BUET '23, DU '22, etc.)
                          () {
                            final sourceText = _formatSourceTag();
                            if (sourceText.isEmpty) return const SizedBox.shrink();
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3.5,
                              ),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0xFF0E3A4A)
                                    : const Color(0xFFE0F7FA),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: isDark
                                      ? const Color(0xFF164E63)
                                      : const Color(0xFFB2EBF2),
                                  width: 0.8,
                                ),
                              ),
                              child: Text(
                                sourceText,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: isDark
                                      ? const Color(0xFFA5F3FC)
                                      : const Color(0xFF006064),
                                  letterSpacing: 0.2,
                                ),
                              ),
                            );
                          }(),

                          // 3. Flagged badge
                          if (widget.isFlagged)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 7,
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
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w600,
                                  color: isDark
                                      ? const Color(0xFFFBBF24)
                                      : const Color(0xFFD97706),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),

                    const SizedBox(width: 8),

                    // Actions: Bookmark & Report
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (widget.onToggleBookmark != null)
                          _ActionIconButton(
                            onTap: widget.onToggleBookmark,
                            tooltip: widget.isBookmarked
                                ? 'বুকমার্ক সরাও'
                                : 'বুকমার্কে রাখো',
                            child: AppIcon(
                              widget.isBookmarked
                                  ? AppIcons.bookmarkFilled
                                  : AppIcons.bookmark,
                              size: 16,
                              color: widget.isBookmarked
                                  ? const Color(0xFFF59E0B)
                                  : (isDark
                                      ? const Color(0xFF71717A)
                                      : const Color(0xFF94A3B8)),
                            ),
                          ),
                        if (widget.onReport != null) ...[
                          const SizedBox(width: 4),
                          _ActionIconButton(
                            onTap: widget.onReport,
                            tooltip: 'রিপোর্ট করো',
                            child: Icon(
                              LucideIcons.flag,
                              size: 14,
                              color: isDark
                                  ? const Color(0xFF71717A)
                                  : const Color(0xFF94A3B8),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ── Solution & Model Answer Panel (সমাধান ও মডেল উত্তর) ───────────
          if (hasExplanation)
            _WrittenSolutionPanel(
              question: widget.question,
              isDark: isDark,
              isOpen: _isExplanationOpen,
              arrowTurns: _arrowTurns,
              onToggle: _toggleExplanation,
              hideExplanation: widget.hideExplanation,
            ),
        ],
      ),
    );
  }

  String _formatSourceTag() {
    if (widget.question.examHistory.isNotEmpty) {
      final tags = <String>[];
      for (final h in widget.question.examHistory) {
        final rawCode = h.code.isNotEmpty
            ? h.code
            : BanglaNameHelper.getInstituteCode(h.institute);
        final yr = (h.year > 0)
            ? "'${(h.year % 100).toString().padLeft(2, '0')}"
            : '';
        final tag = '$rawCode$yr'.trim();
        if (tag.isNotEmpty && !tags.contains(tag)) {
          tags.add(tag);
        }
      }
      return tags.join(', ');
    } else if (widget.question.institutes.isNotEmpty) {
      final tags = <String>[];
      for (var i = 0; i < widget.question.institutes.length; i++) {
        final rawInst = widget.question.institutes[i];
        final rawCode = BanglaNameHelper.getInstituteCode(rawInst);
        final yrNum = i < widget.question.years.length
            ? widget.question.years[i]
            : (widget.question.years.isNotEmpty ? widget.question.years.first : 0);
        final yr = (yrNum > 0)
            ? "'${(yrNum % 100).toString().padLeft(2, '0')}"
            : '';
        final tag = '$rawCode$yr'.trim();
        if (tag.isNotEmpty && !tags.contains(tag)) {
          tags.add(tag);
        }
      }
      return tags.join(', ');
    }
    return '';
  }
}

class _ActionIconButton extends StatelessWidget {
  final VoidCallback? onTap;
  final String tooltip;
  final Widget child;

  const _ActionIconButton({
    required this.onTap,
    required this.tooltip,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return ObhyashTooltip(
      message: tooltip,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap?.call();
        },
        borderRadius: BorderRadius.circular(6),
        child: Padding(
          padding: const EdgeInsets.all(5),
          child: child,
        ),
      ),
    );
  }
}

class _WrittenSolutionPanel extends StatelessWidget {
  final Question question;
  final bool isDark;
  final bool isOpen;
  final Animation<double> arrowTurns;
  final VoidCallback onToggle;
  final bool hideExplanation;

  const _WrittenSolutionPanel({
    required this.question,
    required this.isDark,
    required this.isOpen,
    required this.arrowTurns,
    required this.onToggle,
    this.hideExplanation = false,
  });

  @override
  Widget build(BuildContext context) {
    // Elegant warm book / parchment tones
    final headerBg = isDark
        ? const Color(0xFF1E1E22)
        : const Color(0xFFF3ECE4);
    final headerTextColor = isDark
        ? const Color(0xFFF4F4F5)
        : const Color(0xFF42352B);
    final headerBorderColor = isDark
        ? const Color(0xFF27272A)
        : const Color(0xFFE2D7C9);
    final chevronBg = isDark
        ? const Color(0xFF27272A)
        : const Color(0xFFE7DDD0);

    final bodyBg = isDark
        ? const Color(0xFF09090B)
        : const Color(0xFFFAF7F2);
    final dividerColor = isDark
        ? const Color(0xFF27272A)
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
          // Header Toggle
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
                  AppIcon(
                    AppIcons.bookOpen,
                    size: 15,
                    color: headerTextColor,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'সমাধান ও মডেল উত্তর',
                    style: TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                      color: headerTextColor,
                    ),
                  ),
                  const Spacer(),
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
                        LucideIcons.chevronDown,
                        size: 15,
                        color: headerTextColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Body Content
          if (isOpen) ...[
            Divider(height: 1, thickness: 1, color: dividerColor),
            Padding(
              padding: const EdgeInsets.all(14),
              child: hideExplanation
                  ? _buildProUpgradePrompt(context)
                  : _buildSolutionBody(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSolutionBody() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        LatexText(
          text: question.explanation ?? '',
          style: TextStyle(
            fontSize: 15.5,
            fontWeight: FontWeight.normal,
            color: isDark ? const Color(0xFFF4F4F5) : const Color(0xFF2E2621),
            height: 1.6,
          ),
        ),
        if (question.explanationImageUrl != null &&
            question.explanationImageUrl!.trim().isNotEmpty &&
            !(question.explanation?.contains(question.explanationImageUrl!) ?? false)) ...[
          const SizedBox(height: 8),
          _buildDedicatedWrittenImage(question.explanationImageUrl!, isDark),
        ],
      ],
    );
  }

  Widget _buildProUpgradePrompt(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 4),
        Icon(
          LucideIcons.lock,
          size: 24,
          color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
        ),
        const SizedBox(height: 8),
        Text(
          'মডেল উত্তর দেখতে Pro তে আপগ্রেড করুন',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isDark ? Colors.white : const Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 12),
        ElevatedButton(
          onPressed: () => ProUpgradeModal.show(context),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF004633),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          ),
          child: const Text(
            'Pro তে আপগ্রেড',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(height: 4),
      ],
    );
  }
}

Widget _buildDedicatedWrittenImage(String rawUrl, bool isDark) {
  final url = rawUrl.trim();
  final safeUrl = url.contains('%') ? url : Uri.encodeFull(url);
  final isSvg = safeUrl.toLowerCase().endsWith('.svg') || safeUrl.toLowerCase().contains('.svg');

  return Container(
    margin: const EdgeInsets.symmetric(vertical: 6),
    alignment: Alignment.center,
    decoration: BoxDecoration(
      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(
        color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
      ),
    ),
    padding: const EdgeInsets.all(6),
    child: ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: isSvg
          ? SvgPicture.network(
              safeUrl,
              fit: BoxFit.contain,
              placeholderBuilder: (_) => const SizedBox(
                height: 120,
                child: Center(
                  child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF004633)),
                ),
              ),
            )
          : CachedNetworkImage(
              imageUrl: safeUrl,
              fit: BoxFit.contain,
              placeholder: (ctx, u) => Container(
                height: 120,
                alignment: Alignment.center,
                child: const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF004633)),
                ),
              ),
              errorWidget: (ctx, u, err) => Image.network(
                safeUrl,
                fit: BoxFit.contain,
                errorBuilder: (c, e, s) => Container(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.imageOff, size: 16, color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B)),
                      const SizedBox(width: 8),
                      Text(
                        'চিত্রটি লোড করা যায়নি',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
    ),
  );
}
