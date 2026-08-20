import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'user_avatar.dart';
import 'obhyash_tooltip.dart';
import '../../../features/dashboard/services/streak_service.dart';
import '../../../features/dashboard/providers/dashboard_providers.dart';


class StreakDialog extends ConsumerStatefulWidget {
  final int currentStreak;
  final String userId;

  const StreakDialog({
    super.key,
    required this.currentStreak,
    required this.userId,
  });

  @override
  ConsumerState<StreakDialog> createState() => _StreakDialogState();
}

class _StreakDialogState extends ConsumerState<StreakDialog> {
  bool _isLoading = true;
  List<bool> _activeDays = List.generate(7, (index) => false);
  late int _streakCount;
  int _tabIndex = 0;
  
  List<dynamic> _topStreaks = [];
  bool _isLoadingLeaderboard = false;

  @override
  void initState() {
    super.initState();
    _streakCount = widget.currentStreak;
    // Load both tabs' data in parallel so leaderboard is ready immediately
    _fetchWeeklyActivity();
    _fetchTopStreaks();
  }

  Future<void> _fetchWeeklyActivity() async {
    try {
      // Single call — streak count and week circles from same data source.
      final data = await StreakService.syncStreak(widget.userId);

      if (mounted) {
        ref.read(userProfileProvider.notifier).updateStreak(data.streakCount);
        setState(() {
          _activeDays = data.weekActiveDays;
          _streakCount = data.streakCount;
          _isLoading = false;

          // Patch current user's row in the leaderboard if already loaded
          final idx = _topStreaks.indexWhere((u) => u['id'] == widget.userId);
          if (idx != -1) {
            final updated = Map<String, dynamic>.from(
                _topStreaks[idx] as Map<String, dynamic>);
            updated['streak'] = data.streakCount;
            _topStreaks[idx] = updated;
            // Re-sort
            _topStreaks.sort((a, b) =>
                ((b['streak'] as int?) ?? 0)
                    .compareTo((a['streak'] as int?) ?? 0));
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _fetchTopStreaks() async {
    if (!mounted) return;
    setState(() => _isLoadingLeaderboard = true);
    try {
      final supabase = Supabase.instance.client;
      final response = await supabase
          .from('public_profiles')
          .select('id, name, avatar_url, streak')
          .order('streak', ascending: false)
          .limit(10);

      final List<Map<String, dynamic>> rows = (response as List<dynamic>)
          .map((r) => Map<String, dynamic>.from(r as Map))
          .toList();

      // Override current user's entry with freshly-computed streak
      for (int i = 0; i < rows.length; i++) {
        if (rows[i]['id'] == widget.userId) {
          rows[i] = {...rows[i], 'streak': _streakCount};
          break;
        }
      }

      // Re-sort and take top 5
      rows.sort((a, b) =>
          ((b['streak'] as num?)?.toInt() ?? 0)
              .compareTo((a['streak'] as num?)?.toInt() ?? 0));

      if (mounted) {
        setState(() => _topStreaks = rows.take(5).toList());
      }
    } catch (e) {
      debugPrint('[StreakDialog] leaderboard fetch error: $e');
    } finally {
      if (mounted) setState(() => _isLoadingLeaderboard = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final now = DateTime.now();
    final todayIndex = now.weekday == DateTime.sunday ? 0 : now.weekday;

    final dayNames = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];

    return Container(
      height: 500,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(left: 24, right: 24, bottom: 24, top: 16),
          child: Column(
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
              
              // Close button & Tab Switcher Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const SizedBox(width: 40), // Balance close button
                  // Tab Switcher
                  Container(
                    width: 220,
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF2C2C2E) : const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _tabIndex = 0),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              decoration: BoxDecoration(
                                color: _tabIndex == 0 ? (isDark ? const Color(0xFF1C1C1E) : Colors.white) : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: _tabIndex == 0 ? [const BoxShadow(color: Colors.black12, blurRadius: 4)] : [],
                              ),
                              child: Center(
                                child: Text(
                                  'আমার',
                                  style: TextStyle(
                                    fontFamily: 'Anek Bangla',
                                    fontWeight: _tabIndex == 0 ? FontWeight.bold : FontWeight.w500,
                                    color: _tabIndex == 0 ? (isDark ? Colors.white : Colors.black87) : (isDark ? Colors.white54 : Colors.black54),
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() => _tabIndex = 1);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              decoration: BoxDecoration(
                                color: _tabIndex == 1 ? (isDark ? const Color(0xFF1C1C1E) : Colors.white) : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: _tabIndex == 1 ? [const BoxShadow(color: Colors.black12, blurRadius: 4)] : [],
                              ),
                              child: Center(
                                child: Text(
                                  'টপ ৫',
                                  style: TextStyle(
                                    fontFamily: 'Anek Bangla',
                                    fontWeight: _tabIndex == 1 ? FontWeight.bold : FontWeight.w500,
                                    color: _tabIndex == 1 ? (isDark ? Colors.white : Colors.black87) : (isDark ? Colors.white54 : Colors.black54),
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(LucideIcons.x, color: isDark ? Colors.white54 : Colors.black54),
                    onPressed: () => Navigator.of(context).pop(),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              if (_tabIndex == 0) ...[
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
                      '$_streakCount দিনের স্ট্রাইক',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Anek Bangla',
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                    const SizedBox(width: 8),
                    ObhyashTooltipIcon(
                      message:
                          'প্রতিদিন অন্তত একটি পরীক্ষা দিলে স্ট্রাইক বাড়তে থাকে।\nএকদিন বিরতি দিলে স্ট্রাইক রিসেট হয়ে যাবে।',
                      icon: LucideIcons.info,
                      preferredPosition: TooltipPosition.bottom,
                      size: 20,
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
                                    fontSize: 16,
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
              ] else ...[
                // Leaderboard view (Top 5 - adjusted to fit screen without scroll)
                Expanded(
                  child: _isLoadingLeaderboard
                      ? const Center(child: CircularProgressIndicator())
                      : _topStreaks.isEmpty
                          ? const Center(
                              child: Text(
                                "কোন তথ্য পাওয়া যায়নি",
                                style: TextStyle(fontFamily: 'Anek Bangla', fontSize: 16),
                              ),
                            )
                          : ListView.builder(
                              itemCount: math.min(_topStreaks.length, 5),
                              physics: const NeverScrollableScrollPhysics(),
                              padding: const EdgeInsets.only(top: 4),
                              itemBuilder: (context, index) {
                                final u = _topStreaks[index];
                                final isMe = u['id'] == widget.userId;
                                final rank = index + 1;

                                Widget rankWidget;
                                if (rank == 1) {
                                  rankWidget = const Text('🥇', style: TextStyle(fontSize: 20));
                                } else if (rank == 2) {
                                  rankWidget = const Text('🥈', style: TextStyle(fontSize: 20));
                                } else if (rank == 3) {
                                  rankWidget = const Text('🥉', style: TextStyle(fontSize: 20));
                                } else {
                                  rankWidget = Container(
                                    width: 24,
                                    height: 24,
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE4E4E7),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Text(
                                      '$rank',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w900,
                                        color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF52525B),
                                      ),
                                    ),
                                  );
                                }

                                return GestureDetector(
                                  onTap: () {
                                    Navigator.of(context).pop();
                                    context.push('/leaderboard/user-profile/${u['id']}');
                                  },
                                  child: Container(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(
                                      gradient: isMe
                                          ? LinearGradient(
                                              colors: isDark
                                                  ? [const Color(0xFF064E3B).withValues(alpha: 0.7), const Color(0xFF022C22).withValues(alpha: 0.85)]
                                                  : [const Color(0xFFECFDF5), const Color(0xFFD1FAE5)],
                                            )
                                          : null,
                                      color: isMe
                                          ? null
                                          : (isDark ? const Color(0xFF27272A).withValues(alpha: 0.8) : Colors.white),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(
                                        color: isMe
                                            ? const Color(0xFF10B981).withValues(alpha: 0.6)
                                            : (isDark ? const Color(0xFF3F3F46).withValues(alpha: 0.5) : const Color(0xFFE4E4E7)),
                                        width: isMe ? 1.5 : 1.0,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: isMe
                                              ? const Color(0xFF10B981).withValues(alpha: 0.15)
                                              : (isDark ? Colors.black26 : const Color(0x08000000)),
                                          blurRadius: isMe ? 6 : 3,
                                          offset: const Offset(0, 1.5),
                                        ),
                                      ],
                                    ),
                                    child: Row(
                                      children: [
                                        // Rank badge
                                        Container(
                                          width: 26,
                                          alignment: Alignment.center,
                                          child: rankWidget,
                                        ),
                                        const SizedBox(width: 8),

                                        // Character Avatar
                                        UserAvatar(
                                          id: u['id']?.toString(),
                                          name: u['name']?.toString() ?? 'U',
                                          avatarUrl: u['avatar_url']?.toString(),
                                          size: 34,
                                          showBorder: true,
                                          borderColor: isMe
                                              ? const Color(0xFF10B981)
                                              : (isDark ? const Color(0xFF3F3F46) : Colors.white),
                                          borderWidth: 1.5,
                                        ),
                                        const SizedBox(width: 10),

                                        // User Name & 'তুমি' Badge
                                        Expanded(
                                          child: Row(
                                            children: [
                                              Flexible(
                                                child: Text(
                                                  u['name'] ?? 'অজানা',
                                                  style: TextStyle(
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 16,
                                                    fontFamily: 'Anek Bangla',
                                                    color: isMe
                                                        ? (isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857))
                                                        : (isDark ? Colors.white : const Color(0xFF18181B)),
                                                  ),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                              if (isMe) ...[
                                                const SizedBox(width: 6),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFF10B981),
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  child: const Text(
                                                    'তুমি',
                                                    style: TextStyle(
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.w900,
                                                      color: Colors.white,
                                                      fontFamily: 'Anek Bangla',
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                        ),

                                        // Streak Pill with 🔥
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: isDark ? const Color(0xFF1C1917) : const Color(0xFFFFF7ED),
                                            borderRadius: BorderRadius.circular(16),
                                            border: Border.all(
                                              color: isDark ? const Color(0xFF44200E) : const Color(0xFFFFEDD5),
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Text('🔥', style: TextStyle(fontSize: 12)),
                                              const SizedBox(width: 3),
                                              Text(
                                                '${u['streak'] ?? 0}',
                                                style: const TextStyle(
                                                  fontFamily: 'Anek Bangla',
                                                  fontWeight: FontWeight.w900,
                                                  fontSize: 14,
                                                  color: Color(0xFFEA580C),
                                                ),
                                              ),
                                              const SizedBox(width: 2),
                                              Text(
                                                'দিন',
                                                style: TextStyle(
                                                  fontFamily: 'Anek Bangla',
                                                  fontWeight: FontWeight.w700,
                                                  fontSize: 11,
                                                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF9A3412),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

