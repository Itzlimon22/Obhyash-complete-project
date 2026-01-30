import 'package:flutter/material.dart';

class ExamHeader extends StatelessWidget {
  final String subject;
  final int timeLeft;
  final int graceTimeLeft;
  final bool isGracePeriod;
  final bool isOmrMode;
  final VoidCallback onToggleOmr;
  final bool isDarkMode;
  final VoidCallback onToggleTheme;
  final VoidCallback? onOpenDrawer; // For Mobile Hamburger

  const ExamHeader({
    super.key,
    required this.subject,
    required this.timeLeft,
    this.graceTimeLeft = 0,
    this.isGracePeriod = false,
    required this.isOmrMode,
    required this.onToggleOmr,
    required this.isDarkMode,
    required this.onToggleTheme,
    this.onOpenDrawer,
  });

  String _formatTime(int seconds) {
    final mins = (seconds ~/ 60).toString().padLeft(2, '0');
    final secs = (seconds % 60).toString().padLeft(2, '0');
    return '$mins:$secs';
  }

  @override
  Widget build(BuildContext context) {
    // 1. Determine Colors based on Theme & Timer State
    // ------------------------------------------------
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final displayTime = isGracePeriod ? graceTimeLeft : timeLeft;

    Color timerBg;
    Color timerBorder;
    Color timerText;
    List<BoxShadow>? timerShadow;

    if (isGracePeriod) {
      // Grace Period (Amber/Pulse style)
      timerBg = Colors.amber.shade500;
      timerBorder = Colors.amber.shade600;
      timerText = Colors.white;
      timerShadow = [
        BoxShadow(
          color: Colors.amber.withOpacity(0.4),
          blurRadius: 10,
          spreadRadius: 2,
        ),
      ];
    } else if (timeLeft < 60) {
      // Low Time (Red/Pulse style)
      timerBg = Colors.red.shade600;
      timerBorder = Colors.red.shade700;
      timerText = Colors.white;
      timerShadow = [
        BoxShadow(
          color: Colors.red.withOpacity(0.5),
          blurRadius: 10,
          spreadRadius: 2,
        ),
      ];
    } else {
      // Normal
      timerBg = isDark
          ? const Color(0xFF1E293B)
          : const Color(0xFFF8FAFC); // slate-800 : slate-50
      timerBorder = isDark
          ? const Color(0xFF334155)
          : const Color(0xFFE2E8F0); // slate-700 : slate-200
      timerText = isDark
          ? const Color(0xFFE2E8F0)
          : const Color(0xFF0F172A); // slate-200 : slate-900
    }

    return Container(
      height: 68, // Match h-16
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          // ------------------------------------------------
          // LEFT SIDE: Menu + Logo + Title
          // ------------------------------------------------

          // Hamburger (Mobile)
          if (onOpenDrawer != null)
            IconButton(
              icon: Icon(
                Icons.menu,
                color: isDark ? Colors.white70 : Colors.black54,
              ),
              onPressed: onOpenDrawer,
              tooltip: "Menu",
            ),

          // Logo Icon
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.indigo,
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.indigo.withOpacity(0.3),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(
              Icons.school_outlined,
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),

          // Text Info
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Zenith পরীক্ষা",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    height: 1.1,
                    color: isDark ? Colors.white : Colors.blueGrey[900],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subject,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: isDark ? Colors.blueGrey[400] : Colors.blueGrey[500],
                  ),
                ),
              ],
            ),
          ),

          // ------------------------------------------------
          // RIGHT SIDE: OMR Toggle + Theme + Timer
          // ------------------------------------------------

          // OMR Switch (Custom Pill Style)
          if (!isGracePeriod) // Hide during upload/grace period
            Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.fromLTRB(10, 4, 4, 4),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF1E293B)
                    : const Color(0xFFF1F5F9), // slate-800 : slate-100
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF334155)
                      : const Color(0xFFE2E8F0),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    "OMR",
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isDark
                          ? Colors.blueGrey[300]
                          : Colors.blueGrey[700],
                    ),
                  ),
                  const SizedBox(width: 6),
                  // Compact Switch
                  SizedBox(
                    width: 32,
                    height: 20,
                    child: Switch(
                      value: isOmrMode,
                      onChanged: (val) => onToggleOmr(),
                      activeColor: Colors.indigo,
                      trackColor: MaterialStateProperty.resolveWith((states) {
                        if (!states.contains(MaterialState.selected)) {
                          return isDark
                              ? Colors.blueGrey[600]
                              : Colors.blueGrey[300];
                        }
                        return null;
                      }),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ],
              ),
            ),

          // Theme Toggle
          IconButton(
            onPressed: onToggleTheme,
            icon: Icon(
              isDarkMode ? Icons.light_mode : Icons.dark_mode,
              color: isDark ? Colors.blueGrey[400] : Colors.blueGrey[500],
              size: 22,
            ),
            tooltip: "Toggle Theme",
          ),

          const SizedBox(width: 4),

          // Timer Display
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: timerBg,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: timerBorder),
              boxShadow: timerShadow,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Hide label on very small screens if needed, otherwise show
                if (!isGracePeriod)
                  Text(
                    "সময় বাকি ",
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: timerText.withOpacity(0.8),
                    ),
                  ),
                const SizedBox(width: 4),
                Text(
                  _formatTime(displayTime),
                  style: TextStyle(
                    fontFamily: 'monospace', // Monospace for steady numbers
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: timerText,
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
