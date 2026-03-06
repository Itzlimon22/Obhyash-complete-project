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
        color: isDark ? const Color(0xFF171717) : Colors.white,
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
                      ? const Color(0xFF064E3B).withOpacity(0.25)
                      : const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  LucideIcons.barChart2,
                  size: 16,
                  color: isDark
                      ? const Color(0xFF34D399)
                      : const Color(0xFF059669),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'সাবজেক্ট ভিত্তিক রিপোর্ট',
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
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
                    ? const Color(0xFF262626).withOpacity(0.5)
                    : const Color(0xFFFAFAFA),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF404040)
                      : const Color(0xFFE5E5E5),
                  style: BorderStyle.solid,
                ),
              ),
              child: const Text(
                'এখনও কোনো পরীক্ষা দেওয়া হয়নি।',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFFA3A3A3),
                  fontFamily: 'HindSiliguri',
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
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
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

    // Accuracy Colors
    Color accBgColor;
    Color accTextColor;
    if (accuracy >= 80) {
      accBgColor = isDark
          ? const Color(0xFF064E3B).withOpacity(0.2)
          : const Color(0xFFECFDF5);
      accTextColor = isDark ? const Color(0xFF34D399) : const Color(0xFF059669);
    } else if (accuracy >= 50) {
      accBgColor = isDark
          ? const Color(0xFF78350F).withOpacity(0.2)
          : const Color(0xFFFFFBEB);
      accTextColor = isDark ? const Color(0xFFFBBF24) : const Color(0xFFD97706);
    } else {
      accBgColor = isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5);
      accTextColor = isDark ? const Color(0xFFA3A3A3) : const Color(0xFF525252);
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF262626).withOpacity(0.5) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _isOpen
              ? (isDark
                    ? const Color(0xFF881337)
                    : const Color(0xFFFECDD3)) // rose-900 or rose-200
              : (isDark
                    ? const Color(0xFF404040)
                    : const Color(0xFFE5E5E5)), // neutral-700 or neutral-200
        ),
        boxShadow: _isOpen
            ? [
                BoxShadow(
                  color: isDark
                      ? const Color(0xFF4C0519).withOpacity(0.5)
                      : const Color(0xFFFFE4E6),
                  blurRadius: 4,
                  spreadRadius: 1,
                ),
              ]
            : [],
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _isOpen = !_isOpen),
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        width: 6,
                        height: 32,
                        decoration: BoxDecoration(
                          color: _isOpen
                              ? const Color(0xFFF43F5E) // rose-500
                              : (isDark
                                    ? const Color(0xFF404040)
                                    : const Color(0xFFE5E5E5)),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(width: 12),
                      AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 300),
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: _isOpen
                              ? (isDark
                                    ? const Color(0xFFFB7185)
                                    : const Color(0xFFE11D48))
                              : (isDark
                                    ? const Color(0xFFE5E5E5)
                                    : const Color(0xFF262626)),
                        ),
                        child: Text(widget.subject.name),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: accBgColor,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '$accuracy%',
                          style: TextStyle(
                            color: accTextColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      AnimatedRotation(
                        turns: _isOpen ? 0.5 : 0,
                        duration: const Duration(milliseconds: 300),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: _isOpen
                                ? (isDark
                                      ? const Color(0xFF881337).withOpacity(0.2)
                                      : const Color(0xFFFFF1F2))
                                : (isDark
                                      ? const Color(0xFF262626)
                                      : const Color(0xFFFAFAFA)),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            LucideIcons.chevronDown,
                            size: 16,
                            color: _isOpen
                                ? (isDark
                                      ? const Color(0xFFFB7185)
                                      : const Color(0xFFE11D48))
                                : (isDark
                                      ? const Color(0xFFA3A3A3)
                                      : const Color(0xFF737373)),
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
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF262626).withOpacity(0.1)
            : const Color(0xFFFAFAFA).withOpacity(0.5),
        border: Border(
          top: BorderSide(
            color: isDark
                ? const Color(0xFF404040).withOpacity(0.5)
                : const Color(0xFFF5F5F5),
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
                color: const Color(0xFFF43F5E),
              ), // rose-500
              const SizedBox(width: 8),
              _StatBox(
                label: 'স্কিপড',
                value: widget.subject.skipped.toString(),
                color: const Color(0xFFF59E0B),
              ), // amber-500
            ],
          ),
          const SizedBox(height: 16),
          // Progress Bar Component
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: Container(
              height: 12,
              width: double.infinity,
              color: isDark ? const Color(0xFF333333) : const Color(0xFFF0F0F0),
              child: Row(
                children: [
                  if (widget.subject.correct > 0)
                    Expanded(
                      flex: widget.subject.correct,
                      child: Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFF34D399), Color(0xFF059669)],
                          ),
                        ),
                      ),
                    ),
                  if (widget.subject.wrong > 0)
                    Expanded(
                      flex: widget.subject.wrong,
                      child: Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFFFB7185), Color(0xFFE11D48)],
                          ),
                        ),
                      ),
                    ),
                  if (widget.subject.skipped > 0)
                    Expanded(
                      flex: widget.subject.skipped,
                      child: Container(
                        color: isDark
                            ? const Color(0xFF4B4B20)
                            : const Color(0xFFFEF3C7),
                      ),
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
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isDark
                          ? [
                              const Color(0xFF064E3B).withOpacity(0.4),
                              const Color(0xFF065F46).withOpacity(0.3),
                            ]
                          : [const Color(0xFFECFDF5), const Color(0xFFD1FAE5)],
                    ),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF059669).withOpacity(0.4)
                          : const Color(0xFFA7F3D0),
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'বিস্তারিত রিপোর্ট',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                          color: isDark
                              ? const Color(0xFF34D399)
                              : const Color(0xFF059669),
                        ),
                      ),
                      const SizedBox(width: 5),
                      Icon(
                        LucideIcons.arrowRight,
                        size: 13,
                        color: isDark
                            ? const Color(0xFF34D399)
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Expanded(
      child: Container(
        padding: const EdgeInsets.fromLTRB(10, 10, 10, 10),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border(
            top: BorderSide(color: color, width: 2.5),
            left: BorderSide(
              color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF0F0F0),
            ),
            right: BorderSide(
              color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF0F0F0),
            ),
            bottom: BorderSide(
              color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF0F0F0),
            ),
          ),
          boxShadow: [
            if (!isDark)
              BoxShadow(
                color: color.withOpacity(0.08),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Column(
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: isDark
                    ? const Color(0xFF737373)
                    : const Color(0xFFA3A3A3),
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
