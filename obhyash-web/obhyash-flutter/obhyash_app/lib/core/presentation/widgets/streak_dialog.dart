import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';

class StreakDialog extends StatefulWidget {
  final int currentStreak;
  final String userId;

  const StreakDialog({
    super.key,
    required this.currentStreak,
    required this.userId,
  });

  @override
  State<StreakDialog> createState() => _StreakDialogState();
}

class _StreakDialogState extends State<StreakDialog> {
  bool _isLoading = true;
  List<bool> _activeDays = List.filled(7, false); // Sun to Sat

  @override
  void initState() {
    super.initState();
    _fetchWeeklyActivity();
  }

  Future<void> _fetchWeeklyActivity() async {
    try {
      final now = DateTime.now();
      // Find the most recent Sunday (Dart weekday: 1=Mon, 7=Sun)
      final daysSinceSunday = now.weekday == DateTime.sunday ? 0 : now.weekday;
      final startOfWeek = DateTime(now.year, now.month, now.day).subtract(Duration(days: daysSinceSunday));
      
      final data = await Supabase.instance.client
          .from('exam_results')
          .select('created_at, date')
          .eq('user_id', widget.userId)
          .gte('created_at', startOfWeek.toUtc().toIso8601String());
          
      final activeDays = List.filled(7, false);
      for (final row in data as List<dynamic>) {
        final dateStr = row['date'] ?? row['created_at'];
        if (dateStr == null) continue;
        final date = DateTime.tryParse(dateStr)?.toLocal();
        if (date != null) {
          final diff = date.difference(startOfWeek).inDays;
          if (diff >= 0 && diff < 7) {
            activeDays[diff] = true;
          }
        }
      }
      
      if (mounted) {
        setState(() {
          _activeDays = activeDays;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final now = DateTime.now();
    final todayIndex = now.weekday == DateTime.sunday ? 0 : now.weekday;

    final dayNames = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(left: 24, right: 24, bottom: 24, top: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag Handle
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              
              // Close button (optional for bottom sheet, but keeping to match)
              Align(
                alignment: Alignment.topRight,
                child: IconButton(
                  icon: Icon(LucideIcons.x, color: isDark ? Colors.white54 : Colors.black54),
                  onPressed: () => Navigator.of(context).pop(),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ),
              
              // Flame Icon
              const Icon(
                Icons.local_fire_department_rounded,
                color: Color(0xFF059669),
                size: 72,
              ),
              const SizedBox(height: 12),
              
              // Title
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '${widget.currentStreak} দিনের স্ট্রাইক',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Anek Bangla',
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    LucideIcons.info,
                    size: 20,
                    color: isDark ? Colors.white54 : Colors.black54,
                  ),
                ],
              ),
              const SizedBox(height: 32),
              
              // Week label
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'এই সপ্তাহ',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Anek Bangla',
                    color: isDark ? Colors.white70 : Colors.black54,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              
              // Days Row
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF2C2C2E) : const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? const Color(0xFF3A3A3C) : const Color(0xFFE5E7EB),
                  ),
                ),
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: List.generate(7, (index) {
                          final isToday = index == todayIndex;
                          final isFuture = index > todayIndex;
                          final isActive = _activeDays[index];
                          
                          Color circleColor;
                          Color? borderColor;
                          Widget? icon;

                          if (isActive) {
                            circleColor = const Color(0xFF059669); // Green
                            icon = const Icon(LucideIcons.check, size: 16, color: Colors.white);
                          } else if (isFuture) {
                            circleColor = Colors.transparent;
                            borderColor = isDark ? const Color(0xFF525252) : const Color(0xFFD1D5DB);
                          } else if (isToday) {
                            circleColor = Colors.transparent;
                            borderColor = const Color(0xFFF43F5E); // Pink/Red for today action needed
                          } else {
                            // Past inactive
                            circleColor = isDark ? const Color(0xFF3A3A3C) : const Color(0xFFE5E7EB);
                          }
                          
                          return Column(
                            children: [
                              Text(
                                dayNames[index],
                                style: TextStyle(
                                  fontSize: 15,
                                  fontFamily: 'Anek Bangla',
                                  fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
                                  color: isDark ? Colors.white70 : Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: circleColor,
                                  border: borderColor != null
                                      ? Border.all(color: borderColor, width: 2)
                                      : null,
                                ),
                                child: icon,
                              ),
                            ],
                          );
                        }),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
