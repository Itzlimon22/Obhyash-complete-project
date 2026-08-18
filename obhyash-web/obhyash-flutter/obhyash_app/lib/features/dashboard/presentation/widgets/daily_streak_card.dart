import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/presentation/widgets/obhyash_tooltip.dart';

class DailyStreakCard extends ConsumerStatefulWidget {
  final int userStreak;
  const DailyStreakCard({super.key, required this.userStreak});

  @override
  ConsumerState<DailyStreakCard> createState() => _DailyStreakCardState();
}

class _DailyStreakCardState extends ConsumerState<DailyStreakCard> {
  static List<int>? _cachedActivity;
  late List<int> _last30DaysActivity;

  @override
  void initState() {
    super.initState();
    _last30DaysActivity = _cachedActivity ?? List.filled(30, 0);
    _fetchActivityData();
  }

  @override
  void didUpdateWidget(covariant DailyStreakCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.userStreak != widget.userStreak) {
      _fetchActivityData();
    }
  }

  Future<void> _fetchActivityData() async {
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) return;

      final today = DateTime.now();
      final thirtyDaysAgo = today.subtract(const Duration(days: 29));
      final startDate = DateTime(thirtyDaysAgo.year, thirtyDaysAgo.month, thirtyDaysAgo.day);

      final data = await supabase
          .from('exam_results')
          .select('created_at, date')
          .eq('user_id', userId)
          .gte('created_at', startDate.toUtc().toIso8601String())
          .order('created_at', ascending: false);

      final rows = (data as List).toList();

      // Also include live exam attempts
      try {
        final liveData = await supabase
            .from('live_exam_attempts')
            .select('submit_time')
            .eq('user_id', userId)
            .eq('status', 'submitted')
            .gte('submit_time', startDate.toUtc().toIso8601String());

        for (final row in (liveData as List)) {
          if (row['submit_time'] != null) {
            rows.add({'created_at': row['submit_time']});
          }
        }
      } catch (_) {}

      // Compute activity per day (index 0 is oldest, 29 is today)
      final List<int> activity = List.filled(30, 0);

      for (final row in rows) {
        final dateStr = (row['created_at'] ?? row['date']) as String?;
        if (dateStr == null) continue;

        final date = DateTime.tryParse(dateStr)?.toLocal();
        if (date == null) continue;

        final d = DateTime(date.year, date.month, date.day);
        final diff = d.difference(startDate).inDays;

        if (diff >= 0 && diff < 30) {
          activity[diff]++;
        }
      }

      _cachedActivity = activity;
      if (mounted) {
        setState(() {
          _last30DaysActivity = activity;
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final Color surfaceColor = isDark ? const Color(0xFF1C1C1E) : Colors.white;
    final Color borderColor = isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE2E8F0);
    const Color primaryAccent = Color(0xFFEF4444); // Red

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: borderColor),
        boxShadow: [
          if (!isDark)
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    LucideIcons.flame,
                    size: 26,
                    color: widget.userStreak > 0
                        ? const Color(0xFF059669)
                        : (isDark ? Colors.white54 : Colors.black54),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    '${widget.userStreak} দিনের স্ট্রাইক',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Anek Bangla',
                      color: isDark ? Colors.white : const Color(0xFF18181B),
                    ),
                  ),
                ],
              ),
              if (widget.userStreak > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'অসাধারণ! 🔥',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Anek Bangla',
                      color: Color(0xFF059669),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 18),

          // Heatmap
          _buildHeatmap(isDark, primaryAccent),
        ],
      ),
    );
  }

  Widget _buildHeatmap(bool isDark, Color primaryAccent) {
    final emptyBoxColor =
        isDark ? const Color(0xFF2C2C2E) : const Color(0xFFF1F5F9);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'গত ৩০ দিনের অ্যাক্টিভিটি',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            fontFamily: 'Anek Bangla',
            color: isDark ? Colors.white70 : const Color(0xFF3F3F46),
          ),
        ),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            // Find ideal box size for 10 columns (3 rows of 10)
            final totalSpacing = 9 * 6.0; 
            final boxSize = ((constraints.maxWidth - totalSpacing) / 10).floorToDouble();
            
            return Wrap(
              spacing: 6,
              runSpacing: 6,
              children: List.generate(30, (index) {
                final activityCount = _last30DaysActivity[index];
                
                Color boxColor = emptyBoxColor;
                if (activityCount > 0) {
                  double opacity = 0.3;
                  if (activityCount == 2) opacity = 0.6;
                  if (activityCount >= 3) opacity = 1.0;
                  boxColor = primaryAccent.withValues(alpha: opacity);
                }
                
                return ObhyashTooltip(
                  message: activityCount > 0 ? '$activityCountটি পরীক্ষা দেওয়া হয়েছে' : 'কোনো পরীক্ষা দেওয়া হয়নি',
                  preferredPosition: TooltipPosition.top,
                  child: Container(
                    width: boxSize,
                    height: boxSize,
                    decoration: BoxDecoration(
                      color: boxColor,
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                );
              }),
            );
          }
        ),
      ],
    );
  }
}
