import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../dashboard/providers/dashboard_providers.dart';

// ─── Level Data ────────────────────────────────────────────────────────────────
class _LevelInfo {
  final String id;
  final String label;
  final int minXP;
  final Color start, end;

  const _LevelInfo(this.id, this.label, this.minXP, this.start, this.end);
}

const _levels = [
  _LevelInfo(
    'Legend',
    'লিজেন্ড (Legend)',
    5000,
    Color(0xFFE11D48),
    Color(0xFF881337),
  ),
  _LevelInfo(
    'Titan',
    'টাইটান (Titan)',
    3500,
    Color(0xFFF59E0B),
    Color(0xFFEA580C),
  ),
  _LevelInfo(
    'Warrior',
    'ওয়ারিয়র (Warrior)',
    2000,
    Color(0xFFF43F5E),
    Color(0xFFDC2626),
  ),
  _LevelInfo(
    'Scout',
    'স্কাউট (Scout)',
    800,
    Color(0xFF10B981),
    Color(0xFF14B8A6),
  ),
  _LevelInfo(
    'Rookie',
    'রুকি (Rookie)',
    0,
    Color(0xFF94A3B8),
    Color(0xFF475569),
  ),
];

_LevelInfo _levelById(String id) =>
    _levels.firstWhere((l) => l.id == id, orElse: () => _levels.last);

// ─── User Model ────────────────────────────────────────────────────────────────
class _LBUser {
  final String id, name, institute, level;
  final int xp, examsTaken;
  final bool isCurrentUser;

  const _LBUser({
    required this.id,
    required this.name,
    required this.institute,
    required this.level,
    required this.xp,
    required this.examsTaken,
    this.isCurrentUser = false,
  });

  factory _LBUser.fromJson(Map<String, dynamic> j, {String? me}) => _LBUser(
    id: j['id'] ?? '',
    name: j['name'] ?? 'অজানা',
    institute: j['institute'] ?? '',
    level: j['level'] ?? 'Rookie',
    xp: (j['xp'] as num?)?.toInt() ?? 0,
    examsTaken: (j['exams_taken'] as num?)?.toInt() ?? 0,
    isCurrentUser: j['id'] == me,
  );
}

// ─── View ──────────────────────────────────────────────────────────────────────
class LeaderboardView extends ConsumerStatefulWidget {
  const LeaderboardView({super.key});

  @override
  ConsumerState<LeaderboardView> createState() => _LeaderboardViewState();
}

class _LeaderboardViewState extends ConsumerState<LeaderboardView> {
  String _selectedLevel = 'Rookie';
  List<_LBUser> _users = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _isLoading = true);
    try {
      final supabase = Supabase.instance.client;
      final me = supabase.auth.currentUser?.id;
      final data = await supabase
          .from('profiles')
          .select('id, name, institute, xp, level, exams_taken')
          .eq('level', _selectedLevel)
          .order('xp', ascending: false)
          .limit(50);

      if (mounted) {
        setState(() {
          _users = (data as List)
              .map((u) => _LBUser.fromJson(u as Map<String, dynamic>, me: me))
              .toList();
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currentUserAsync = ref.watch(userProfileProvider);
    final myProfile = currentUserAsync.whenOrNull(data: (u) => u);
    final lvl = _levelById(_selectedLevel);

    // My rank in current list
    final myRank = myProfile != null
        ? _users.indexWhere((u) => u.id == myProfile.id) + 1
        : 0;

    return Column(
      children: [
        // ── Level Selector ──────────────────────────────────────────────────
        SizedBox(
          height: 52,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: _levels.length,
            itemBuilder: (ctx, i) {
              final l = _levels[i];
              final isActive = l.id == _selectedLevel;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () {
                    setState(() => _selectedLevel = l.id);
                    _fetch();
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      gradient: isActive
                          ? LinearGradient(colors: [l.start, l.end])
                          : null,
                      color: isActive
                          ? null
                          : (isDark ? const Color(0xFF262626) : Colors.white),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isActive
                            ? Colors.transparent
                            : (isDark
                                  ? const Color(0xFF404040)
                                  : const Color(0xFFE5E5E5)),
                      ),
                      boxShadow: isActive
                          ? [
                              BoxShadow(
                                color: l.start.withOpacity(0.35),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : [],
                    ),
                    child: Text(
                      l.label.split(' ').first,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: isActive
                            ? Colors.white
                            : (isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF525252)),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _users.isEmpty
              ? _empty(isDark)
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                  children: [
                    // ── Current user progress panel ──
                    if (myProfile != null && myRank > 0)
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [lvl.start, lvl.end],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: lvl.start.withOpacity(0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            _avatar(
                              myProfile.name,
                              ring: Colors.white.withOpacity(0.4),
                              bg: Colors.white.withOpacity(0.2),
                              textColor: Colors.white,
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        myProfile.name,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 15,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                        child: const Text(
                                          'আপনি',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${myProfile.xp} XP',
                                    style: TextStyle(
                                      color: Colors.white.withOpacity(0.85),
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              children: [
                                Text(
                                  '#$myRank',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 28,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                Text(
                                  'র‍্যাঙ্ক',
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.7),
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                    // ── Table card ──
                    Container(
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF171717) : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF262626)
                              : const Color(0xFFE5E5E5),
                        ),
                        boxShadow: isDark
                            ? []
                            : [
                                const BoxShadow(
                                  color: Color(0x08000000),
                                  blurRadius: 4,
                                ),
                              ],
                      ),
                      child: Column(
                        children: [
                          // Table header
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 12,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF262626).withOpacity(0.5)
                                  : const Color(0xFFFAFAFA),
                              border: Border(
                                bottom: BorderSide(
                                  color: isDark
                                      ? const Color(0xFF262626)
                                      : const Color(0xFFE5E5E5),
                                ),
                              ),
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(20),
                              ),
                            ),
                            child: Row(
                              children: [
                                const SizedBox(
                                  width: 40,
                                  child: Text('RANK', style: _hdr),
                                ),
                                const SizedBox(width: 12),
                                const Expanded(
                                  child: Text('STUDENT', style: _hdr),
                                ),
                                const Text('TOTAL XP', style: _hdr),
                              ],
                            ),
                          ),
                          // Rows
                          ..._users.asMap().entries.map((entry) {
                            final i = entry.key;
                            final u = entry.value;
                            final isMe = u.isCurrentUser;
                            final rank = i + 1;

                            return Container(
                              decoration: BoxDecoration(
                                color: isMe
                                    ? const Color(
                                        0xFFFFF1F2,
                                      ).withOpacity(isDark ? 0.04 : 1)
                                    : Colors.transparent,
                                border: i < _users.length - 1
                                    ? Border(
                                        bottom: BorderSide(
                                          color: isDark
                                              ? const Color(0xFF262626)
                                              : const Color(0xFFF5F5F5),
                                        ),
                                      )
                                    : null,
                                borderRadius: i == _users.length - 1
                                    ? const BorderRadius.vertical(
                                        bottom: Radius.circular(20),
                                      )
                                    : null,
                              ),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                                child: Row(
                                  children: [
                                    SizedBox(
                                      width: 40,
                                      child: _rankBadge(rank),
                                    ),
                                    const SizedBox(width: 12),
                                    _avatar(
                                      u.name,
                                      ring: isMe
                                          ? const Color(0xFFFECDD3)
                                          : Colors.transparent,
                                      bg: isDark
                                          ? const Color(0xFF404040)
                                          : const Color(0xFFE5E5E5),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Flexible(
                                                child: Text(
                                                  u.name,
                                                  style: TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 14,
                                                    color: isMe
                                                        ? (isDark
                                                              ? const Color(
                                                                  0xFFFB7185,
                                                                )
                                                              : const Color(
                                                                  0xFFE11D48,
                                                                ))
                                                        : (isDark
                                                              ? Colors.white
                                                              : const Color(
                                                                  0xFF171717,
                                                                )),
                                                  ),
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                ),
                                              ),
                                              if (isMe) ...[
                                                const SizedBox(width: 6),
                                                Container(
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        horizontal: 6,
                                                        vertical: 2,
                                                      ),
                                                  decoration: BoxDecoration(
                                                    color: const Color(
                                                      0xFFFFE4E6,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          100,
                                                        ),
                                                  ),
                                                  child: const Text(
                                                    'তুমি',
                                                    style: TextStyle(
                                                      fontSize: 9,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      color: Color(0xFFE11D48),
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                          if (u.institute.isNotEmpty)
                                            Text(
                                              u.institute,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: Color(0xFFA3A3A3),
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      '${u.xp}',
                                      style: const TextStyle(
                                        fontFamily: 'monospace',
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                        color: Color(0xFF059669),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ],
                ),
        ),
      ],
    );
  }

  Widget _empty(bool isDark) => Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            LucideIcons.users,
            size: 36,
            color: Color(0xFFA3A3A3),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'এই লেভেলে কোনো শিক্ষার্থী নেই',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: isDark ? Colors.white : const Color(0xFF171717),
          ),
        ),
      ],
    ),
  );

  Widget _avatar(String name, {Color? ring, Color? bg, Color? textColor}) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: bg ?? const Color(0xFFE5E5E5),
        shape: BoxShape.circle,
        border: Border.all(color: ring ?? Colors.transparent, width: 2),
      ),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: textColor ?? const Color(0xFF171717),
          ),
        ),
      ),
    );
  }

  Widget _rankBadge(int rank) {
    if (rank == 1) return const Text('🥇', style: TextStyle(fontSize: 20));
    if (rank == 2) return const Text('🥈', style: TextStyle(fontSize: 20));
    if (rank == 3) return const Text('🥉', style: TextStyle(fontSize: 20));
    return Text(
      '#$rank',
      style: const TextStyle(
        fontWeight: FontWeight.bold,
        fontSize: 14,
        color: Color(0xFFA3A3A3),
      ),
    );
  }
}

const _hdr = TextStyle(
  fontSize: 10,
  fontWeight: FontWeight.w900,
  color: Color(0xFFA3A3A3),
  letterSpacing: 1.0,
);
