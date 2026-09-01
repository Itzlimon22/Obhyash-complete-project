import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class DashboardActionCard extends StatefulWidget {
  final String title;
  final IconData icon;
  final String? svgAsset;
  final Color primaryColor;
  final Color lightColor;
  final VoidCallback onTap;

  const DashboardActionCard({
    super.key,
    required this.title,
    required this.icon,
    this.svgAsset,
    required this.primaryColor,
    required this.lightColor,
    required this.onTap,
  });

  @override
  State<DashboardActionCard> createState() => _DashboardActionCardState();
}

class _DashboardActionCardState extends State<DashboardActionCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.96,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap();
      },
      onTapCancel: () => _controller.reverse(),
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) =>
            Transform.scale(scale: _scaleAnimation.value, child: child),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE5E7EB),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: isDark
                    ? Colors.black.withValues(alpha: 0.35)
                    : const Color(0xFFE4E4E7),
                blurRadius: 0,
                offset: const Offset(0, 2),
              ),
              BoxShadow(
                color: isDark
                    ? Colors.black.withValues(alpha: 0.15)
                    : const Color(0x0A000000),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.svgAsset != null)
                SizedBox(
                  width: 42,
                  height: 42,
                  child: SvgPicture.asset(
                    widget.svgAsset!,
                    fit: BoxFit.contain,
                    placeholderBuilder: (_) => Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isDark
                            ? widget.primaryColor.withValues(alpha: 0.18)
                            : widget.lightColor,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        widget.icon,
                        color: widget.primaryColor,
                        size: 24,
                      ),
                    ),
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isDark
                        ? widget.primaryColor.withValues(alpha: 0.18)
                        : widget.lightColor,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    widget.icon,
                    color: widget.primaryColor,
                    size: 24,
                  ),
                ),
              const SizedBox(height: 5),
              Text(
                widget.title,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : const Color(0xFF18181B),
                  fontFamily: 'Anek Bangla',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
