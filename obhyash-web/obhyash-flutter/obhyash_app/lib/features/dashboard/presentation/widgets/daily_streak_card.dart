import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/presentation/widgets/obhyash_tooltip.dart';
import '../../../../core/utils/bangla_name_helper.dart';
import '../../services/streak_service.dart';
import '../../providers/dashboard_providers.dart';

class DailyStreakCard extends ConsumerStatefulWidget {
  final int userStreak;
  const DailyStreakCard({super.key, required this.userStreak});

  @override
  ConsumerState<DailyStreakCard> createState() => _DailyStreakCardState();
}

class _DailyStreakCardState extends ConsumerState<DailyStreakCard> {
  List<int> _last30DaysActivity = List.filled(30, 0);
  int _streakCount = 0;
  RealtimeChannel? _realtimeChannel;

  @override
  void initState() {
    super.initState();
    _streakCount = widget.userStreak;
    _fetchData();
    _setupRealtimeSubscription();
  }

  @override
  void dispose() {
    if (_realtimeChannel != null) {
      Supabase.instance.client.removeChannel(_realtimeChannel!);
      _realtimeChannel = null;
    }
    super.dispose();
  }

  void _setupRealtimeSubscription() {
    final supabase = Supabase.instance.client;
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return;

    try {
      _realtimeChannel = supabase.channel('realtime_streak_exams_$userId');
      _realtimeChannel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'exam_results',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'user_id',
          value: userId,
        ),
        callback: (payload) {
          if (mounted) _fetchData();
        },
      );
      _realtimeChannel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'live_exam_attempts',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'user_id',
          value: userId,
        ),
        callback: (payload) {
          if (mounted) _fetchData();
        },
      );
      _realtimeChannel!.subscribe();
    } catch (e) {
      debugPrint('[DailyStreakCard] Realtime setup error: $e');
    }
  }

  @override
  void didUpdateWidget(covariant DailyStreakCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.userStreak != widget.userStreak) {
      _fetchData();
    }
  }

  /// Fetches exam activity using StreakService for the streak count and 30-day heatmap data.
  Future<void> _fetchData() async {
    final supabase = Supabase.instance.client;
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return;

    try {
      final data = await StreakService.syncStreak(userId);
      if (mounted) {
        ref.read(userProfileProvider.notifier).updateStreak(data.streakCount);
        setState(() {
          _streakCount = data.streakCount;
          _last30DaysActivity = data.last30DaysActivity;
        });
      }
    } catch (e) {
      debugPrint('[DailyStreakCard] _fetchData error: $e');
    }
  }

  static String _getBanglaMonth(int month) {
    const months = [
      'জানুয়ারি',
      'ফেব্রুয়ারি',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টেম্বর',
      'অক্টোবর',
      'নভেম্বর',
      'ডিসেম্বর'
    ];
    if (month >= 1 && month <= 12) return months[month - 1];
    return '';
  }

  static String _formatBoxDate(int index) {
    final nowDhaka = DateTime.now().toUtc().add(const Duration(hours: 6));
    final targetDate = nowDhaka.subtract(Duration(days: 29 - index));
    if (index == 29) {
      return 'আজ (${BanglaNameHelper.toBanglaNumeral(targetDate.day)} ${_getBanglaMonth(targetDate.month)})';
    } else if (index == 28) {
      return 'গতকাল (${BanglaNameHelper.toBanglaNumeral(targetDate.day)} ${_getBanglaMonth(targetDate.month)})';
    } else {
      return '${BanglaNameHelper.toBanglaNumeral(targetDate.day)} ${_getBanglaMonth(targetDate.month)}';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currentStreak = _streakCount > 0 ? _streakCount : widget.userStreak;

    final Color surfaceColor =
        isDark ? const Color(0xFF1C1C1E) : Colors.white;
    final Color borderColor =
        isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE2E8F0);
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
            children: [
              const Icon(
                LucideIcons.calendar,
                size: 20,
                color: Color(0xFF059669),
              ),
              const SizedBox(width: 8),
              Text(
                'গত ৩০ দিনের অ্যাক্টিভিটি',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'Anek Bangla',
                  color: isDark ? Colors.white : const Color(0xFF18181B),
                ),
              ),
              const Spacer(),
              // Streak badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('🔥', style: TextStyle(fontSize: 13)),
                    const SizedBox(width: 4),
                    Text(
                      '${BanglaNameHelper.toBanglaNumeral(currentStreak)} দিন',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'Anek Bangla',
                        color: Color(0xFFEF4444),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Heatmap
          _buildHeatmap(isDark, primaryAccent),
        ],
      ),
    );
  }

  Widget _buildHeatmap(bool isDark, Color primaryAccent) {
    final emptyBoxColor =
        isDark ? const Color(0xFF2C2C2E) : const Color(0xFFF1F5F9);

    return LayoutBuilder(
      builder: (context, constraints) {
        final totalSpacing = 9 * 6.0;
        final boxSize =
            ((constraints.maxWidth - totalSpacing) / 10).floorToDouble();

        return Wrap(
          spacing: 6,
          runSpacing: 6,
          children: List.generate(30, (index) {
            final activityCount = _last30DaysActivity[index];
            final dateLabel = _formatBoxDate(index);

            Color boxColor = emptyBoxColor;
            if (activityCount > 0) {
              double opacity = 0.3;
              if (activityCount == 2) opacity = 0.6;
              if (activityCount >= 3) opacity = 1.0;
              boxColor = primaryAccent.withValues(alpha: opacity);
            }

            final tooltipText = activityCount > 0
                ? '$dateLabel: ${BanglaNameHelper.toBanglaNumeral(activityCount)}টি পরীক্ষা দেওয়া হয়েছে'
                : '$dateLabel: কোনো পরীক্ষা দেওয়া হয়নি';

            return GestureDetector(
              onTap: () {
                _fetchData();
              },
              child: ObhyashTooltip(
                message: tooltipText,
                preferredPosition: TooltipPosition.top,
                child: Container(
                  width: boxSize,
                  height: boxSize,
                  decoration: BoxDecoration(
                    color: boxColor,
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ),
            );
          }),
        );
      },
    );
  }
}
