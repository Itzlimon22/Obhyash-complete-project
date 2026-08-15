import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'user_avatar.dart';

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
  List<bool> _activeDays = List.generate(7, (index) => false);
  int _tabIndex = 0;
  
  static List<dynamic>? _cachedTopStreaks;
  static DateTime? _lastFetchTime;
  List<dynamic> _topStreaks = [];
  bool _isLoadingLeaderboard = false;

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

  Future<void> _fetchTopStreaks() async {
    // Client-side cache: Only fetch if empty or older than 24 hours
    if (_cachedTopStreaks != null && _lastFetchTime != null) {
      if (DateTime.now().difference(_lastFetchTime!).inHours < 24) {
        if (mounted) {
          setState(() {
            _topStreaks = _cachedTopStreaks!;
          });
        }
        return;
      }
    }

    if (!mounted) return;
    setState(() => _isLoadingLeaderboard = true);
    try {
      final supabase = Supabase.instance.client;
      final response = await supabase
          .from('public_profiles')
          .select('id, name, avatar_url, streak')
          .order('streak', ascending: false)
          .limit(5);
          
      _cachedTopStreaks = response as List<dynamic>;
      _lastFetchTime = DateTime.now();
      
      if (mounted) {
        setState(() {
          _topStreaks = _cachedTopStreaks!;
        });
      }
    } catch (e) {
      debugPrint("Error fetching leaderboard: $e");
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
                              _fetchTopStreaks();
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
                                                    fontSize: 15,
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

