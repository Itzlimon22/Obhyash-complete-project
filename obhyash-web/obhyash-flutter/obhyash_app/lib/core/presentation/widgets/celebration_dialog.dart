import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';

// ─── Particle Data ─────────────────────────────────────────────────────────────
class _Particle {
  double x;
  double y;
  double vx;
  double vy;
  double size;
  Color color;
  double rotation;
  double rotationSpeed;

  _Particle({
    required this.x,
    required this.y,
    required this.vx,
    required this.vy,
    required this.size,
    required this.color,
    required this.rotation,
    required this.rotationSpeed,
  });
}

class _ConfettiPainter extends CustomPainter {
  final List<_Particle> particles;

  _ConfettiPainter(this.particles);

  @override
  void paint(Canvas canvas, Size size) {
    for (final p in particles) {
      final paint = Paint()..color = p.color;
      canvas.save();
      canvas.translate(p.x, p.y);
      canvas.rotate(p.rotation);
      canvas.drawRect(
        Rect.fromCenter(center: Offset.zero, width: p.size, height: p.size * 0.6),
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiPainter oldDelegate) => true;
}

// ─── Celebration Dialog ────────────────────────────────────────────────────────
class CelebrationDialog extends StatefulWidget {
  final String title;
  final String subtitle;
  final String? badgeLabel;
  final IconData icon;
  final Color primaryColor;
  final Color secondaryColor;
  final int? xpAwarded;

  const CelebrationDialog({
    super.key,
    required this.title,
    required this.subtitle,
    this.badgeLabel,
    this.icon = LucideIcons.sparkles,
    this.primaryColor = const Color(0xFF004633),
    this.secondaryColor = const Color(0xFF10B981),
    this.xpAwarded,
  });

  static Future<void> show(
    BuildContext context, {
    required String title,
    required String subtitle,
    String? badgeLabel,
    IconData icon = LucideIcons.sparkles,
    Color primaryColor = const Color(0xFF004633),
    Color secondaryColor = const Color(0xFF10B981),
    int? xpAwarded,
  }) {
    HapticFeedback.heavyImpact();
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => CelebrationDialog(
        title: title,
        subtitle: subtitle,
        badgeLabel: badgeLabel,
        icon: icon,
        primaryColor: primaryColor,
        secondaryColor: secondaryColor,
        xpAwarded: xpAwarded,
      ),
    );
  }

  @override
  State<CelebrationDialog> createState() => _CelebrationDialogState();
}

class _CelebrationDialogState extends State<CelebrationDialog>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animCtrl;
  final List<_Particle> _particles = [];
  final math.Random _rng = math.Random();

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    )..addListener(_updateParticles);

    _spawnParticles();
    _animCtrl.forward();
  }

  void _spawnParticles() {
    final colors = [
      const Color(0xFF10B981),
      const Color(0xFF3B82F6),
      const Color(0xFFF59E0B),
      const Color(0xFFEC4899),
      const Color(0xFF8B5CF6),
      const Color(0xFFEF4444),
      Colors.amber,
    ];

    for (int i = 0; i < 45; i++) {
      final angle = _rng.nextDouble() * 2 * math.pi;
      final speed = _rng.nextDouble() * 220 + 80;
      _particles.add(
        _Particle(
          x: 160,
          y: 120,
          vx: math.cos(angle) * speed,
          vy: math.sin(angle) * speed - 100,
          size: _rng.nextDouble() * 6 + 5,
          color: colors[_rng.nextInt(colors.length)],
          rotation: _rng.nextDouble() * 2 * math.pi,
          rotationSpeed: (_rng.nextDouble() - 0.5) * 6,
        ),
      );
    }
  }

  void _updateParticles() {
    final dt = 0.016; // Approx 60fps
    for (final p in _particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt; // Gravity
      p.rotation += p.rotationSpeed * dt;
    }
    setState(() {});
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Particle Layer
          Positioned.fill(
            child: IgnorePointer(
              child: CustomPaint(
                painter: _ConfettiPainter(_particles),
              ),
            ),
          ),

          // Main Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF18181B) : Colors.white,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(
                color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
              ),
              boxShadow: [
                BoxShadow(
                  color: widget.primaryColor.withValues(alpha: 0.25),
                  blurRadius: 30,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Glowing Icon Badge
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [widget.primaryColor, widget.secondaryColor],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: widget.primaryColor.withValues(alpha: 0.4),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Icon(
                    widget.icon,
                    color: Colors.white,
                    size: 40,
                  ),
                )
                    .animate()
                    .scale(
                      begin: const Offset(0.3, 0.3),
                      end: const Offset(1, 1),
                      duration: 400.ms,
                      curve: Curves.elasticOut,
                    )
                    .rotate(begin: -0.1, end: 0, duration: 400.ms),

                const SizedBox(height: 20),

                // Badge Label
                if (widget.badgeLabel != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: widget.primaryColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      widget.badgeLabel!,
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: widget.primaryColor,
                      ),
                    ),
                  ),

                // Title
                Text(
                  widget.title,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),

                const SizedBox(height: 8),

                // Subtitle
                Text(
                  widget.subtitle,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 15,
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                    height: 1.4,
                  ),
                ),

                if (widget.xpAwarded != null && widget.xpAwarded! > 0) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.zap, color: Colors.amber, size: 18),
                        const SizedBox(width: 6),
                        Text(
                          '+${widget.xpAwarded} XP অর্জিত!',
                          style: const TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontWeight: FontWeight.w900,
                            color: Colors.amber,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 24),

                // Continue Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: widget.primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'দারুণ! চালিয়ে যাও 🚀',
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
