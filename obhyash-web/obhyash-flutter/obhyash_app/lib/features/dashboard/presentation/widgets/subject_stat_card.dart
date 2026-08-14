import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../domain/models.dart';

class SubjectStatCard extends StatelessWidget {
  final List<SubjectStats> data;
  final bool isLoading;
  final Function(String)? onSubjectClick;

  const SubjectStatCard({
    super.key,
    required this.data,
    this.isLoading = false,
    this.onSubjectClick,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      // Return Skeleton
      return _buildSkeleton(context);
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFEEEEEE),
        ),
        boxShadow: [
          if (!isDark)
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
              spreadRadius: -2,
            ),
          if (isDark)
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF059669).withOpacity(0.25)
                      : const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  LucideIcons.barChart2,
                  size: 16,
                  color: isDark
                      ? const Color(0xFF059669)
                      : const Color(0xFF059669),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'সাবজেক্ট ভিত্তিক রিপোর্ট',
                style: TextStyle(
                  fontFamily: 'Anek Bangla',
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: isDark ? Colors.white : const Color(0xFF1A1A1A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          if (data.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 32),
              width: double.infinity,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF1C1C1E).withOpacity(0.5)
                    : const Color(0xFFFAFAFA),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFE5E5E5),
                  style: BorderStyle.solid,
                ),
              ),
              child: const Text(
                'এখনও কোনো পরীক্ষা দেওয়া হয়নি।',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFFA3A3A3),
                  fontFamily: 'Anek Bangla',
                ),
              ),
            )
          else
            ...data.map(
              (subject) => _SubjectItem(
                subject: subject,
                onClick: onSubjectClick != null
                    ? () => onSubjectClick!(subject.id)
                    : null,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSkeleton(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E5E5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'সাবজেক্ট ভিত্তিক রিপোর্ট',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
          ),
          const SizedBox(height: 24),
          ...List.generate(
            3,
            (index) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              height: 64,
              decoration: BoxDecoration(
                color: const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SubjectItem extends StatefulWidget {
  final SubjectStats subject;
  final VoidCallback? onClick;

  const _SubjectItem({required this.subject, this.onClick});

  @override
  State<_SubjectItem> createState() => _SubjectItemState();
}

class _SubjectItemState extends State<_SubjectItem> {
  bool _isOpen = false;

  @override
  Widget build(BuildContext context) {
    final accuracy = widget.subject.total > 0
        ? ((widget.subject.correct / widget.subject.total) * 100).round()
        : 0;

    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Web-app matching colors (sleek, minimalist)
    Color accTextColor;
    if (accuracy >= 80) {
      accTextColor = isDark ? const Color(0xFF059669) : const Color(0xFF059669);
    } else if (accuracy >= 50) {
      accTextColor = isDark ? const Color(0xFFFBBF24) : const Color(0xFFD97706);
    } else {
      accTextColor = isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373);
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF1A1A1A)
            : Colors.white, // Sleek transparent-like dark background
        borderRadius: BorderRadius.circular(12), // Web-app radius
        border: Border.all(
          color: _isOpen
              ? (isDark
                    ? const Color(0xFF059669)
                    : const Color(0xFF059669)) // Green accent when open
              : (isDark
                    ? const Color(0xFF333333)
                    : const Color(0xFFE5E5E5)), // Thin sleek border
          width: 1,
        ),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _isOpen = !_isOpen),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 14.0,
                vertical: 12.0,
              ), // More compact padding
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        // Web-app style left accent bar
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          width: 4,
                          height: 18, // Shorter and sleeker
                          decoration: BoxDecoration(
                            color: _isOpen
                                ? const Color(0xFF059669) // emerald-500
                                : (accuracy > 0
                                      ? accTextColor
                                      : (isDark
                                            ? const Color(0xFF27272A)
                                            : const Color(0xFFD4D4D4))),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: AnimatedDefaultTextStyle(
                            duration: const Duration(milliseconds: 300),
                            style: TextStyle(
                              fontFamily: 'Anek Bangla',
                              fontWeight:
                                  FontWeight.w600, // Medium weight like webapp
                              fontSize: 16, // Smaller font like webapp
                              color: _isOpen
                                  ? (isDark
                                        ? const Color(0xFF059669)
                                        : const Color(0xFF059669))
                                  : (isDark
                                        ? Colors.white
                                        : const Color(0xFF1F2937)),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            child: Text(widget.subject.name),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      // Web-app style minimalist % badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF1C1C1E)
                              : const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '$accuracy%',
                          style: TextStyle(
                            color: isDark
                                ? const Color(0xFFA3A3A3)
                                : const Color(0xFF4B5563),
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      AnimatedRotation(
                        turns: _isOpen ? 0.5 : 0,
                        duration: const Duration(milliseconds: 300),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF1C1C1E)
                                : const Color(0xFFF3F4F6),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            LucideIcons.chevronDown,
                            size: 14,
                            color: isDark
                                ? const Color(0xFFA3A3A3)
                                : const Color(0xFF4B5563),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          AnimatedCrossFade(
            firstChild: const SizedBox(height: 0, width: double.infinity),
            secondChild: _buildDetailsPanel(isDark),
            crossFadeState: _isOpen
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 300),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailsPanel(bool isDark) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF151515) : const Color(0xFFFAFAFA),
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xFF333333) : const Color(0xFFE5E5E5),
          ),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _StatBox(
                label: 'সঠিক',
                value: widget.subject.correct.toString(),
                color: const Color(0xFF059669),
              ), // emerald-600
              const SizedBox(width: 8),
              _StatBox(
                label: 'ভুল',
                value: widget.subject.wrong.toString(),
                color: const Color(0xFFB91C1C),
              ), // rose-600
              const SizedBox(width: 8),
              _StatBox(
                label: 'স্কিপড',
                value: widget.subject.skipped.toString(),
                color: const Color(0xFFD97706),
              ), // amber-600
            ],
          ),
          const SizedBox(height: 8),
          // Sleek minimalist Progress Bar Component
          ClipRRect(
            borderRadius: BorderRadius.circular(4), // sleek radius
            child: Container(
              height: 6, // ultra-thin sleek bar
              width: double.infinity,
              color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
              child: Row(
                children: [
                  if (widget.subject.correct > 0)
                    Expanded(
                      flex: widget.subject.correct,
                      child: Container(color: const Color(0xFF059669)),
                    ),
                  if (widget.subject.wrong > 0)
                    Expanded(
                      flex: widget.subject.wrong,
                      child: Container(color: const Color(0xFFB91C1C)),
                    ),
                  if (widget.subject.skipped > 0)
                    Expanded(
                      flex: widget.subject.skipped,
                      child: Container(color: const Color(0xFF1E3A8A)),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (widget.onClick != null)
            Align(
              alignment: Alignment.centerRight,
              child: InkWell(
                onTap: widget.onClick,
                borderRadius: BorderRadius.circular(6),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF059669).withValues(alpha: 0.1)
                        : const Color(0xFF059669).withValues(alpha: 0.06),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF059669).withValues(alpha: 0.2)
                          : const Color(0xFF059669).withValues(alpha: 0.15),
                      width: 1,
                    ),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'বিস্তারিত রিপোর্ট',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Anek Bangla',
                          color: isDark
                              ? const Color(0xFF059669)
                              : const Color(0xFF059669),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Icon(
                        LucideIcons.arrowRight,
                        size: 14,
                        color: isDark
                            ? const Color(0xFF059669)
                            : const Color(0xFF059669),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatBox({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    // Force the subject stat card to always use the deep rich dark theme
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Expanded(
      child: Container(
        padding: EdgeInsets.zero,
        child: Column(
          children: [
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Anek Bangla',
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isDark
                    ? const Color(0xFFA3A3A3)
                    : const Color(0xFF6B7280),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight
                    .bold, // Replaced w900 which can fail on some fonts
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
