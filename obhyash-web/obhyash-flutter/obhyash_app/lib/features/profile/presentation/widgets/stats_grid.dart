import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class StatsGrid extends StatelessWidget {
  final int examsTaken;
  final int avgScore;
  final int xp;
  final int streak;

  const StatsGrid({
    super.key,
    required this.examsTaken,
    required this.avgScore,
    required this.xp,
    required this.streak,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // 2 columns on mobile, 4 columns on desktop/tablet
        final isMobile = constraints.maxWidth < 600;
        final crossAxisCount = isMobile ? 2 : 4;

        return GridView.count(
          crossAxisCount: crossAxisCount,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: isMobile ? 1.65 : 2.1,
          children: [
            _StatCard(
              title: 'মোট পরীক্ষা',
              value: examsTaken.toString(),
            ),
            _StatCard(
              title: 'গড় স্কোর',
              value: '$avgScore%',
            ),
            _StatCard(
              title: 'মোট XP',
              value: xp.toString(),
            ),
            _StatCard(
              title: 'স্ট্রিক',
              value: '$streak দিন',
            ),
          ],
        );
      },
    );
  }
}

class _StatCard extends StatefulWidget {
  final String title;
  final String value;

  const _StatCard({
    required this.title,
    required this.value,
  });

  @override
  State<_StatCard> createState() => _StatCardState();
}

class _StatCardState extends State<_StatCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTapDown: (_) {
        HapticFeedback.lightImpact();
        setState(() => _isPressed = true);
      },
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? 0.93 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOutCubic,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isDark
                  ? const Color(0xFF27272A)
                  : const Color(0xFFE4E4E7),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: isDark ? Colors.black26 : Colors.black.withValues(alpha: 0.03),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                widget.title,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: isDark
                      ? const Color(0xFFA1A1AA)
                      : const Color(0xFF71717A),
                  fontFamily: 'Anek Bangla',
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 3),
              Text(
                widget.value,
                style: TextStyle(
                  fontSize: 21,
                  fontWeight: FontWeight.w900,
                  color: isDark
                      ? Colors.white
                      : const Color(0xFF0F172A),
                  letterSpacing: -0.3,
                  fontFamily: 'Anek Bangla',
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
