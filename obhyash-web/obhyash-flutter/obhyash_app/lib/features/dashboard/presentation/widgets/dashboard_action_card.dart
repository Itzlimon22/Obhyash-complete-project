import 'package:flutter/material.dart';

class DashboardActionCard extends StatefulWidget {
  final String title;
  final IconData icon;
  final Color primaryColor;
  final Color lightColor;
  final VoidCallback onTap;

  const DashboardActionCard({
    super.key,
    required this.title,
    required this.icon,
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
  bool _isHovered = false;

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
      child: MouseRegion(
        onEnter: (_) => setState(() => _isHovered = true),
        onExit: (_) => setState(() => _isHovered = false),
        child: AnimatedBuilder(
          animation: _scaleAnimation,
          builder: (context, child) =>
              Transform.scale(scale: _scaleAnimation.value, child: child),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
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
                      ? Colors.black.withValues(alpha: 0.6) 
                      : const Color(0xFFD1D5DB),
                  blurRadius: 0,
                  offset: const Offset(0, 4), // Solid 3D shadow effect
                ),
                BoxShadow(
                  color: isDark 
                      ? Colors.black.withValues(alpha: 0.2) 
                      : Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(widget.icon, color: widget.primaryColor, size: 28),
                const SizedBox(height: 8),
                Text(
                  widget.title,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : const Color(0xFF374151),
                    fontFamily: 'Anek Bangla',
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
