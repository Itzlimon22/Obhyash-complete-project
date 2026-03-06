import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../dashboard/providers/dashboard_providers.dart';

// ─── Level Data ────────────────────────────────────────────────────────────────
class _LevelInfo {
  final String id;
  final String label;
  final int minXP;
  final Color start, end;
  final IconData icon;

  const _LevelInfo(
    this.id,
    this.label,
    this.minXP,
    this.start,
    this.end,
    this.icon,
  );
}

const _levels = [
  _LevelInfo(
    'Legend',
    'লিজেন্ড (Legend)',
    5000,
    Color(0xFFE11D48),
    Color(0xFF881337),
    LucideIcons.flame,
  ),
  _LevelInfo(
    'Titan',
    'টাইটান (Titan)',
    3500,
    Color(0xFFF59E0B),
    Color(0xFFEA580C),
    LucideIcons.zap,
  ),
  _LevelInfo(
    'Warrior',
    'ওয়ারিয়র (Warrior)',
    2000,
    Color(0xFFF43F5E),
    Color(0xFFDC2626),
    LucideIcons.users,
  ),
  _LevelInfo(
    'Scout',
    'স্কাউট (Scout)',
    800,
    Color(0xFF10B981),
    Color(0xFF14B8A6),
    LucideIcons.eye,
  ),
  _LevelInfo(
    'Rookie',
    'রুকি (Rookie)',
    0,
    Color(0xFF94A3B8),
    Color(0xFF475569),
    LucideIcons.mapPin,
  ),
];

_LevelInfo _levelById(String id) =>
    _levels.firstWhere((l) => l.id == id, orElse: () => _levels.last);

/// Next higher level (null if already at Legend).
_LevelInfo? _nextLevel(String id) {
  final idx = _levels.indexWhere((l) => l.id == id);
  if (idx > 0) return _levels[idx - 1];
  return null;
}

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

final _numFmt = NumberFormat('#,##0');

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
  Map<String, int> _levelCounts = {};

  @override
  void initState() {
    super.initState();
    _fetchCounts();
    _fetch();
  }

  Future<void> _fetchCounts() async {
    try {
      final supabase = Supabase.instance.client;
      final futures = _levels.map((lvl) async {
        final data = await supabase
            .from('public_profiles')
            .select('id')
            .eq('level', lvl.id)
            .limit(9999);
        return MapEntry(lvl.id, (data as List).length);
      });
      final results = await Future.wait(futures);
      if (mounted) {
        setState(() => _levelCounts = Map.fromEntries(results));
      }
    } catch (_) {}
  }

  Future<void> _fetch() async {
    setState(() => _isLoading = true);
    try {
      final supabase = Supabase.instance.client;
      final me = supabase.auth.currentUser?.id;
      final data = await supabase
          .from('public_profiles')
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

    final myRankIdx = myProfile != null
        ? _users.indexWhere((u) => u.id == myProfile.id)
        : -1;
    final myRank = myRankIdx >= 0 ? myRankIdx + 1 : 0;
    final isOnOwnLevel = myProfile?.level == _selectedLevel;

    return Column(
      children: [
        // ── Level Selector ──────────────────────────────────────────────────
        _LevelSelector(
          levels: _levels,
          selectedLevel: _selectedLevel,
          myLevel: myProfile?.level,
          levelCounts: _levelCounts,
          onSelect: (id) {
            setState(() => _selectedLevel = id);
            _fetch();
          },
          isDark: isDark,
        ),

        // ── Body ────────────────────────────────────────────────────────────
        Expanded(
          child: _isLoading && _users.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                  children: [
                    // UserProgress card (own level only)
                    if (myProfile != null && isOnOwnLevel)
                      _UserProgressCard(
                        level: myProfile.level ?? 'Rookie',
                        xp: myProfile.xp,
                        rank: myRank,
                        isDark: isDark,
                      ),

                    // Leaderboard table
                    _LeaderboardTable(
                      users: _users,
                      levelLabel: lvl.label.split(' ').first,
                      isLoading: _isLoading,
                      isDark: isDark,
                      onUserTap: (id) => context.push('/user-profile/$id'),
                    ),
                  ],
                ),
        ),
      ],
    );
  }
}

// ─── Level Selector ─────────────────────────────────────────────────────────────
class _LevelSelector extends StatelessWidget {
  final List<_LevelInfo> levels;
  final String selectedLevel;
  final String? myLevel;
  final Map<String, int> levelCounts;
  final void Function(String) onSelect;
  final bool isDark;

  const _LevelSelector({
    required this.levels,
    required this.selectedLevel,
    this.myLevel,
    required this.levelCounts,
    required this.onSelect,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 134,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
        itemCount: levels.length,
        itemBuilder: (ctx, i) {
          final l = levels[i];
          final isActive = l.id == selectedLevel;
          final isMyLevel = l.id == myLevel;
          final count = levelCounts[l.id];

          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: GestureDetector(
              onTap: () => onSelect(l.id),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                width: 106,
                padding: const EdgeInsets.symmetric(
                  vertical: 10,
                  horizontal: 8,
                ),
                decoration: BoxDecoration(
                  color: isActive
                      ? (isDark ? const Color(0xFF262626) : Colors.white)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isActive
                        ? (isDark
                              ? const Color(0xFF404040)
                              : const Color(0xFFE5E5E5))
                        : Colors.transparent,
                    width: 1.5,
                  ),
                  boxShadow: isActive && !isDark
                      ? [
                          const BoxShadow(
                            color: Color(0x14000000),
                            blurRadius: 20,
                            offset: Offset(0, 8),
                          ),
                        ]
                      : [],
                ),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Icon circle
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          width: 46,
                          height: 46,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: isActive
                                ? LinearGradient(
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    colors: [l.start, l.end],
                                  )
                                : null,
                            color: isActive
                                ? null
                                : (isDark
                                      ? const Color(0xFF1F1F1F)
                                      : const Color(0xFFF5F5F5)),
                            boxShadow: isActive
                                ? [
                                    BoxShadow(
                                      color: l.start.withValues(alpha: 0.4),
                                      blurRadius: 12,
                                      offset: const Offset(0, 4),
                                    ),
                                  ]
                                : [],
                          ),
                          child: Icon(
                            l.icon,
                            size: 20,
                            color: isActive
                                ? Colors.white
                                : (isDark
                                      ? const Color(0xFF525252)
                                      : const Color(0xFFBBBBBB)),
                          ),
                        ),
                        const SizedBox(height: 6),
                        // Label
                        Text(
                          l.label.split(' ').first,
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 12,
                            color: isActive
                                ? (isDark
                                      ? Colors.white
                                      : const Color(0xFF171717))
                                : (isDark
                                      ? const Color(0xFF525252)
                                      : const Color(0xFFA3A3A3)),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        if (count != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            '$count জন',
                            style: TextStyle(
                              fontSize: 10,
                              color: isDark
                                  ? const Color(0xFF737373)
                                  : const Color(0xFFA3A3A3),
                            ),
                          ),
                        ],
                      ],
                    ),
                    // "তোমার লেভেল" badge
                    if (isMyLevel)
                      Positioned(
                        top: -8,
                        left: 0,
                        right: 0,
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEF4444),
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: const Text(
                              'তোমার',
                              style: TextStyle(
                                fontSize: 8,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ─── UserProgress Card ──────────────────────────────────────────────────────────
class _UserProgressCard extends StatelessWidget {
  final String level;
  final int xp, rank;
  final bool isDark;

  const _UserProgressCard({
    required this.level,
    required this.xp,
    required this.rank,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final lvlInfo = _levelById(level);
    final nxt = _nextLevel(level);
    final progressPct = nxt == null
        ? 1.0
        : ((xp - lvlInfo.minXP) / (nxt.minXP - lvlInfo.minXP)).clamp(0.0, 1.0);
    final xpNeeded = nxt != null ? (nxt.minXP - xp).clamp(0, nxt.minXP) : 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
        boxShadow: isDark
            ? []
            : [const BoxShadow(color: Color(0x08000000), blurRadius: 4)],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Rank box
          if (rank > 0) ...[
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF3F0F17)
                    : const Color(0xFFFFF1F2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF7F1D2A)
                      : const Color(0xFFFECDD3),
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Rank',
                    style: TextStyle(
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                      color: isDark
                          ? const Color(0xFFFB7185)
                          : const Color(0xFFE11D48),
                    ),
                  ),
                  Text(
                    '#$rank',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      height: 1.1,
                      color: isDark
                          ? const Color(0xFFFB7185)
                          : const Color(0xFFE11D48),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),
          ],

          // Center: level text + XP needed
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  children: [
                    Text(
                      'আপনি বর্তমানে ',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF171717),
                      ),
                    ),
                    Text(
                      lvlInfo.label.split(' ').first,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? const Color(0xFFFB7185)
                            : const Color(0xFFE11D48),
                      ),
                    ),
                    Text(
                      ' লেভেলে আছেন',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF171717),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                if (nxt != null)
                  Text(
                    'আর $xpNeeded XP লাগবে পরের লেভেলে',
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFFA3A3A3),
                    ),
                  )
                else
                  const Text(
                    'অভিনন্দন! সর্বোচ্চ লেভেলে পৌঁছেছেন!',
                    style: TextStyle(
                      fontSize: 11,
                      color: Color(0xFF059669),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
              ],
            ),
          ),

          const SizedBox(width: 14),

          // Right: XP + progress bar
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _numFmt.format(xp),
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'monospace',
                      color: isDark ? Colors.white : const Color(0xFF171717),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'XP',
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark
                          ? const Color(0xFF737373)
                          : const Color(0xFFA3A3A3),
                    ),
                  ),
                ],
              ),
              if (nxt != null) ...[
                const SizedBox(height: 6),
                SizedBox(
                  width: 80,
                  height: 8,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progressPct.toDouble(),
                      backgroundColor: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFF5F5F5),
                      valueColor: AlwaysStoppedAnimation<Color>(
                        isDark
                            ? const Color(0xFFFB7185)
                            : const Color(0xFFE11D48),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Leaderboard Table ──────────────────────────────────────────────────────────
class _LeaderboardTable extends StatelessWidget {
  final List<_LBUser> users;
  final String levelLabel;
  final bool isLoading;
  final bool isDark;
  final void Function(String)? onUserTap;

  const _LeaderboardTable({
    required this.users,
    required this.levelLabel,
    required this.isLoading,
    required this.isDark,
    this.onUserTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
        boxShadow: isDark
            ? []
            : [const BoxShadow(color: Color(0x08000000), blurRadius: 4)],
      ),
      child: Column(
        children: [
          // ── Card title ────────────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF262626).withValues(alpha: 0.5)
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
                Text(
                  '$levelLabel র‍্যাঙ্কিং',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: isDark
                        ? const Color(0xFFE5E5E5)
                        : const Color(0xFF404040),
                  ),
                ),
              ],
            ),
          ),

          // ── Column headers ────────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1A1A1A) : const Color(0xFFF5F5F5),
              border: Border(
                bottom: BorderSide(
                  color: isDark
                      ? const Color(0xFF262626)
                      : const Color(0xFFE5E5E5),
                ),
              ),
            ),
            child: const Row(
              children: [
                SizedBox(width: 40, child: Text('RANK', style: _hdr)),
                SizedBox(width: 12),
                Expanded(child: Text('STUDENT', style: _hdr)),
                Text('TOTAL XP', style: _hdr),
              ],
            ),
          ),

          // ── Rows ─────────────────────────────────────────────────────────
          if (isLoading && users.isEmpty)
            _skeleton()
          else if (users.isEmpty)
            _empty()
          else
            ...users.asMap().entries.map((e) {
              final i = e.key;
              final u = e.value;
              final isMe = u.isCurrentUser;
              final isLast = i == users.length - 1;

              return Container(
                decoration: BoxDecoration(
                  color: isMe
                      ? const Color(
                          0xFFFFF1F2,
                        ).withValues(alpha: isDark ? 0.04 : 1.0)
                      : Colors.transparent,
                  border: !isLast
                      ? Border(
                          bottom: BorderSide(
                            color: isDark
                                ? const Color(0xFF262626)
                                : const Color(0xFFF5F5F5),
                          ),
                        )
                      : null,
                  borderRadius: isLast
                      ? const BorderRadius.vertical(bottom: Radius.circular(20))
                      : null,
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  child: Row(
                    children: [
                      SizedBox(width: 40, child: _rankBadge(i + 1)),
                      const SizedBox(width: 12),
                      _avatar(
                        u.name,
                        ring: isMe
                            ? const Color(0xFFFECDD3)
                            : Colors.transparent,
                        bg: isDark
                            ? const Color(0xFF404040)
                            : const Color(0xFFE5E5E5),
                        textColor: isDark
                            ? Colors.white
                            : const Color(0xFF171717),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
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
                                                ? const Color(0xFFFB7185)
                                                : const Color(0xFFE11D48))
                                          : (isDark
                                                ? Colors.white
                                                : const Color(0xFF171717)),
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (isMe) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFFE4E6),
                                      borderRadius: BorderRadius.circular(100),
                                    ),
                                    child: const Text(
                                      'তুমি',
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
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
                        _numFmt.format(u.xp),
                        style: const TextStyle(
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: Color(0xFF059669),
                        ),
                      ),
                      if (onUserTap != null) ...[
                        const SizedBox(width: 6),
                        GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: () => onUserTap!(u.id),
                          child: Icon(
                            LucideIcons.externalLink,
                            size: 14,
                            color: isDark
                                ? const Color(0xFF737373)
                                : const Color(0xFFA3A3A3),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _empty() => Padding(
    padding: const EdgeInsets.symmetric(vertical: 48),
    child: Column(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            LucideIcons.users,
            size: 30,
            color: Color(0xFFA3A3A3),
          ),
        ),
        const SizedBox(height: 14),
        const Text(
          'এই লেভেলে এখনও কোনো শিক্ষার্থী নেই।',
          style: TextStyle(fontSize: 14, color: Color(0xFFA3A3A3)),
        ),
      ],
    ),
  );

  Widget _skeleton() => Column(
    children: List.generate(
      5,
      (i) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: const BoxDecoration(
                color: Color(0xFFE5E5E5),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 24),
            Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                color: Color(0xFFE5E5E5),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 12,
                    width: 120,
                    color: const Color(0xFFE5E5E5),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    height: 10,
                    width: 80,
                    color: const Color(0xFFE5E5E5),
                  ),
                ],
              ),
            ),
            Container(height: 12, width: 60, color: const Color(0xFFE5E5E5)),
          ],
        ),
      ),
    ),
  );

  Widget _avatar(
    String name, {
    required Color ring,
    required Color bg,
    required Color textColor,
  }) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: bg,
        shape: BoxShape.circle,
        border: Border.all(color: ring, width: 2),
      ),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: textColor,
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
