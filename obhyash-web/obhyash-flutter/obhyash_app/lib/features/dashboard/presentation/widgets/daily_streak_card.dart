import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class DailyStreakCard extends ConsumerStatefulWidget {
  final int userStreak;
  const DailyStreakCard({super.key, required this.userStreak});

  @override
  ConsumerState<DailyStreakCard> createState() => _DailyStreakCardState();
}

class _DailyStreakCardState extends ConsumerState<DailyStreakCard> {
  bool _isLoading = true;
  List<int> _last30DaysActivity = List.filled(30, 0); // 0 = no activity, 1+ = activity count

  @override
  void initState() {
    super.initState();
    _fetchActivityData();
  }

  Future<void> _fetchActivityData() async {
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) {
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      final today = DateTime.now();
      final thirtyDaysAgo = today.subtract(const Duration(days: 29));
      // Reset hours to start of day
      final startDate = DateTime(thirtyDaysAgo.year, thirtyDaysAgo.month, thirtyDaysAgo.day);

      final data = await supabase
          .from('exam_results')
          .select('created_at, date')
          .eq('user_id', userId)
          .gte('date', startDate.toIso8601String())
          .order('date', ascending: false);

      final rows = data as List;
      
      // Compute activity per day (index 0 is oldest, 29 is today)
      final List<int> activity = List.filled(30, 0);
      Set<String> activeDates = {};

      for (final row in rows) {
        final dateStr = row['date'] ?? row['created_at'];
        if (dateStr == null) continue;
        
        final date = DateTime.tryParse(dateStr);
        if (date == null) continue;

        // Strip time
        final d = DateTime(date.year, date.month, date.day);
        final diff = d.difference(startDate).inDays;
        
        if (diff >= 0 && diff < 30) {
          activity[diff]++;
        }
        
        activeDates.add(d.toIso8601String());
      }

      if (mounted) {
        setState(() {
          _last30DaysActivity = activity;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final Color surfaceColor = isDark ? const Color(0xFF1C1C1E) : Colors.white;
    final Color borderColor = isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE2E8F0);
    const Color primaryAccent = Color(0xFFEF4444); // Red

    if (_isLoading) {
      return Container(
        height: 160,
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: borderColor),
        ),
        child: const Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(primaryAccent),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: borderColor),
        boxShadow: [
          if (!isDark) BoxShadow(
            color: Colors.black.withValues(alpha: 0.02), 
            blurRadius: 10, 
            offset: const Offset(0, 4)
          )
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
                  Icon(LucideIcons.flame, size: 28, color: widget.userStreak > 0 ? const Color(0xFF047857) : (isDark ? Colors.white54 : Colors.black54)),
                  const SizedBox(width: 12),
                  Text(
                    '${widget.userStreak} দিনের স্ট্রাইক',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                ],
              ),
              if (widget.userStreak > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF047857).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'অসাধারণ! 🔥',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF047857),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            widget.userStreak == 0 
                ? 'আজকের পরীক্ষা দিয়ে স্ট্রাইক শুরু করো!' 
                : 'স্ট্রাইক ধরে রাখতে প্রতিদিন অন্তত একটি পরীক্ষা দাও।',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: isDark ? Colors.white54 : Colors.black54,
            ),
          ),
          const SizedBox(height: 24),
          
          // Heatmap
          _buildHeatmap(isDark, primaryAccent),
        ],
      ),
    );
  }

  Widget _buildHeatmap(bool isDark, Color primaryAccent) {
    final emptyBoxColor = isDark ? const Color(0xFF2C2C2E) : const Color(0xFFF1F5F9);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'গত ৩০ দিনের অ্যাক্টিভিটি',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white70 : Colors.black87,
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
                
                return Tooltip(
                  message: activityCount > 0 ? '$activityCount পরীক্ষা দেওয়া হয়েছে' : 'কোনো পরীক্ষা দেওয়া হয়নি',
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
