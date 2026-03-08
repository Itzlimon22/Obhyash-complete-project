import 'package:cached_network_image/cached_network_image.dart';
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
  final String? avatarUrl;
  final int xp, examsTaken;
  final bool isCurrentUser;

  const _LBUser({
    required this.id,
    required this.name,
    required this.institute,
    required this.level,
    this.avatarUrl,
    required this.xp,
    required this.examsTaken,
    this.isCurrentUser = false,
  });

  factory _LBUser.fromJson(Map<String, dynamic> j, {String? me}) => _LBUser(
    id: j['id'] ?? '',
    name: j['name'] ?? 'অজানা',
    institute: j['institute'] ?? '',
    level: j['level'] ?? 'Rookie',
    avatarUrl: j['avatar_url'] as String?,
    xp: (j['xp'] as num?)?.toInt() ?? 0,
    examsTaken: (j['exams_taken'] as num?)?.toInt() ?? 0,
    isCurrentUser: j['id'] == me,
  );
}

// ─── Institute Rank Model ────────────────────────────────────────────────────
class _InstituteRank {
  final String institute;
  final int avgXp;
  final int studentCount;
  final bool isMyCollege;

  const _InstituteRank({
    required this.institute,
    required this.avgXp,
    required this.studentCount,
    required this.isMyCollege,
  });
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
  String _viewMode = 'level'; // 'level', 'college', or 'rankings'
  List<_LBUser> _collegeUsers = [];
  bool _isLoadingCollege = false;
  List<_InstituteRank> _instituteRankings = [];
  bool _isLoadingRankings = false;

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
    } catch (e) {
      debugPrint('[LeaderboardView] _fetchCounts error: $e');
    }
  }

  Future<void> _fetch() async {
    setState(() => _isLoading = true);
    try {
      final supabase = Supabase.instance.client;
      final me = supabase.auth.currentUser?.id;
      final data = await supabase
          .from('public_profiles')
          .select('id, name, institute, xp, level, exams_taken, avatar_url')
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
    } catch (e) {
      debugPrint('[LeaderboardView] _fetch error: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchCollege(String institute) async {
    if (institute.isEmpty) return;
    setState(() => _isLoadingCollege = true);
    try {
      final supabase = Supabase.instance.client;
      final me = supabase.auth.currentUser?.id;
      final data = await supabase
          .from('public_profiles')
          .select('id, name, institute, xp, level, exams_taken, avatar_url')
          .eq('institute', institute)
          .order('xp', ascending: false)
          .limit(100);

      if (mounted) {
        setState(() {
          _collegeUsers = (data as List)
              .map((u) => _LBUser.fromJson(u as Map<String, dynamic>, me: me))
              .toList();
          _isLoadingCollege = false;
        });
      }
    } catch (e) {
      debugPrint('[LeaderboardView] _fetchCollege error: $e');
      if (mounted) setState(() => _isLoadingCollege = false);
    }
  }

  Future<void> _fetchInstituteRankings() async {
    if (_instituteRankings.isNotEmpty) return; // already loaded
    setState(() => _isLoadingRankings = true);
    try {
      final supabase = Supabase.instance.client;
      final myProfile = ref
          .read(userProfileProvider)
          .whenOrNull(data: (u) => u);
      final myInstitute = myProfile?.institute as String?;

      final data = await supabase
          .from('public_profiles')
          .select('institute, xp')
          .not('institute', 'is', null)
          .neq('institute', '')
          .order('xp', ascending: false)
          .limit(5000);

      // Group by institute
      final groups = <String, List<int>>{};
      for (final row in (data as List).cast<Map<String, dynamic>>()) {
        final inst = row['institute'] as String?;
        if (inst == null || inst.isEmpty) continue;
        groups
            .putIfAbsent(inst, () => [])
            .add((row['xp'] as num?)?.toInt() ?? 0);
      }

      // Top-5 average; require at least 5 students
      final rankings = <_InstituteRank>[];
      for (final entry in groups.entries) {
        if (entry.value.length < 5) continue;
        final top5 = entry.value.take(5).toList(); // already sorted desc
        final avgXp = (top5.reduce((a, b) => a + b) / 5).round();
        rankings.add(
          _InstituteRank(
            institute: entry.key,
            avgXp: avgXp,
            studentCount: entry.value.length,
            isMyCollege: entry.key == myInstitute,
          ),
        );
      }
      rankings.sort((a, b) => b.avgXp.compareTo(a.avgXp));

      if (mounted) {
        setState(() {
          _instituteRankings = rankings;
          _isLoadingRankings = false;
        });
      }
    } catch (e) {
      debugPrint('[LeaderboardView] _fetchInstituteRankings error: $e');
      if (mounted) setState(() => _isLoadingRankings = false);
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
        // ── View Mode Tab Switcher ──────────────────────────────────────────
        Container(
          color: isDark ? const Color(0xFF080808) : Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF141414) : const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                _ViewModeTab(
                  label: 'লেভেল র‍্যাংকিং',
                  isActive: _viewMode == 'level',
                  isDark: isDark,
                  onTap: () => setState(() => _viewMode = 'level'),
                ),
                const SizedBox(width: 4),
                _ViewModeTab(
                  label: 'কলেজ র‍্যাংকিং',
                  isActive: _viewMode == 'college',
                  isDark: isDark,
                  onTap: () {
                    setState(() => _viewMode = 'college');
                    final inst = myProfile?.institute as String?;
                    if (inst != null && inst.isNotEmpty) {
                      _fetchCollege(inst);
                    }
                  },
                ),
                const SizedBox(width: 4),
                _ViewModeTab(
                  label: 'কলেজ প্রতিযোগিতা',
                  isActive: _viewMode == 'rankings',
                  isDark: isDark,
                  onTap: () {
                    setState(() => _viewMode = 'rankings');
                    _fetchInstituteRankings();
                  },
                ),
              ],
            ),
          ),
        ),

        // ── Level Selector (level mode only) ───────────────────────────────
        if (_viewMode == 'level')
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
          child: _viewMode == 'rankings'
              ? _InstituteRankingsBody(
                  rankings: _instituteRankings,
                  isLoading: _isLoadingRankings,
                  isDark: isDark,
                )
              : _viewMode == 'level'
              ? (_isLoading && _users.isEmpty
                    ? const Center(child: CircularProgressIndicator())
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                        children: [
                          if (myProfile != null && isOnOwnLevel)
                            _UserProgressCard(
                              level: myProfile.level ?? 'Rookie',
                              xp: myProfile.xp,
                              rank: myRank,
                              isDark: isDark,
                            ),
                          if (!_isLoading && _users.length >= 3)
                            _PodiumSection(
                              users: _users.take(3).toList(),
                              isDark: isDark,
                              onTap: (id) => context.push('/user-profile/$id'),
                            ),
                          _LeaderboardTable(
                            users: _users,
                            levelLabel: lvl.label.split(' ').first,
                            isLoading: _isLoading,
                            isDark: isDark,
                            onUserTap: (id) =>
                                context.push('/user-profile/$id'),
                          ),
                        ],
                      ))
              : _CollegeLeaderboardBody(
                  institute: (myProfile?.institute as String?) ?? '',
                  users: _collegeUsers,
                  isLoading: _isLoadingCollege,
                  isDark: isDark,
                  onUserTap: (id) => context.push('/user-profile/$id'),
                ),
        ),
      ],
    );
  }
}

// ─── View Mode Tab ─────────────────────────────────────────────────────────────
class _ViewModeTab extends StatelessWidget {
  final String label;
  final bool isActive;
  final bool isDark;
  final VoidCallback onTap;

  const _ViewModeTab({
    required this.label,
    required this.isActive,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isActive
                ? (isDark ? const Color(0xFF059669) : const Color(0xFF059669))
                : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isActive
                ? [
                    BoxShadow(
                      color: const Color(0xFF059669).withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                      spreadRadius: -2,
                    ),
                  ]
                : [],
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: isActive
                  ? Colors.white
                  : (isDark
                        ? const Color(0xFF6B7280)
                        : const Color(0xFF9CA3AF)),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── College Leaderboard Body ────────────────────────────────────────────────
class _CollegeLeaderboardBody extends StatelessWidget {
  final String institute;
  final List<_LBUser> users;
  final bool isLoading;
  final bool isDark;
  final void Function(String) onUserTap;

  const _CollegeLeaderboardBody({
    required this.institute,
    required this.users,
    required this.isLoading,
    required this.isDark,
    required this.onUserTap,
  });

  @override
  Widget build(BuildContext context) {
    if (institute.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('🏫', style: TextStyle(fontSize: 40)),
              const SizedBox(height: 12),
              Text(
                'তোমার প্রোফাইলে কলেজের নাম যোগ করো',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: isDark
                      ? const Color(0xFF737373)
                      : const Color(0xFF9CA3AF),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
      children: [
        // College name header
        Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0A1F17) : const Color(0xFFECFDF5),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? const Color(0xFF059669) : const Color(0xFFBBF7D0),
            ),
          ),
          child: Row(
            children: [
              const Text('🏫', style: TextStyle(fontSize: 18)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  institute,
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: isDark
                        ? const Color(0xFF34D399)
                        : const Color(0xFF047857),
                  ),
                ),
              ),
            ],
          ),
        ),

        if (users.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 32),
            child: Center(
              child: Column(
                children: [
                  const Text('🏫', style: TextStyle(fontSize: 36)),
                  const SizedBox(height: 10),
                  Text(
                    'তোমার কলেজ থেকে এখনো কেউ যোগ দেয়নি',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: isDark
                          ? const Color(0xFF737373)
                          : const Color(0xFF9CA3AF),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'বন্ধুদের আমন্ত্রণ জানাও!',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 12,
                      color: isDark
                          ? const Color(0xFF525252)
                          : const Color(0xFFBBBBBB),
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          _LeaderboardTable(
            users: users,
            levelLabel: 'কলেজ',
            isLoading: false,
            isDark: isDark,
            onUserTap: onUserTap,
          ),
      ],
    );
  }
}

// ─── Institute Rankings Body ─────────────────────────────────────────────────
class _InstituteRankingsBody extends StatelessWidget {
  final List<_InstituteRank> rankings;
  final bool isLoading;
  final bool isDark;

  const _InstituteRankingsBody({
    required this.rankings,
    required this.isLoading,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
        children: List.generate(
          8,
          (_) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            height: 64,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1A1A1A) : const Color(0xFFF5F5F5),
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
      );
    }

    if (rankings.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('🏆', style: TextStyle(fontSize: 40)),
              const SizedBox(height: 12),
              Text(
                'এখনো যথেষ্ট ডেটা নেই',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: isDark
                      ? const Color(0xFF737373)
                      : const Color(0xFF9CA3AF),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'প্রতিটি কলেজ থেকে কমপক্ষে ৫ জন শিক্ষার্থী লাগবে',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 12,
                  color: isDark
                      ? const Color(0xFF525252)
                      : const Color(0xFFBBBBBB),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 12, left: 2),
          child: Text(
            'র‍্যাংকিং: প্রতিটি কলেজের শীর্ষ ৫ শিক্ষার্থীর গড় XP অনুযায়ী',
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isDark ? const Color(0xFF525252) : const Color(0xFF9CA3AF),
            ),
          ),
        ),
        ...rankings.asMap().entries.map((e) {
          final idx = e.key;
          final entry = e.value;
          final rank = idx + 1;
          final isMe = entry.isMyCollege;
          final medal = rank == 1
              ? '🥇'
              : rank == 2
              ? '🥈'
              : rank == 3
              ? '🥉'
              : null;

          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: isMe
                  ? (isDark ? const Color(0xFF0A1F17) : const Color(0xFFECFDF5))
                  : (isDark ? const Color(0xFF111111) : Colors.white),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isMe
                    ? (isDark
                          ? const Color(0xFF059669)
                          : const Color(0xFFBBF7D0))
                    : (isDark
                          ? const Color(0xFF1E1E1E)
                          : const Color(0xFFF0F0F0)),
              ),
            ),
            child: Row(
              children: [
                // Rank / medal
                SizedBox(
                  width: 32,
                  child: Center(
                    child: medal != null
                        ? Text(medal, style: const TextStyle(fontSize: 20))
                        : Text(
                            '$rank',
                            style: TextStyle(
                              fontFamily: 'HindSiliguri',
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              color: isDark
                                  ? const Color(0xFF4A4A4A)
                                  : const Color(0xFFBBBBBB),
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 10),
                // Institute name + student count
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        entry.institute,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: isMe
                              ? (isDark
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFF047857))
                              : (isDark
                                    ? Colors.white
                                    : const Color(0xFF111111)),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        isMe
                            ? 'তোমার কলেজ • ${entry.studentCount} শিক্ষার্থী'
                            : '${entry.studentCount} জন শিক্ষার্থী',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 11,
                          color: isDark
                              ? const Color(0xFF525252)
                              : const Color(0xFF9CA3AF),
                        ),
                      ),
                    ],
                  ),
                ),
                // Avg XP
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: isMe
                        ? (isDark
                              ? const Color(0xFF064E3B)
                              : const Color(0xFFD1FAE5))
                        : (isDark
                              ? const Color(0xFF1A1A1A)
                              : const Color(0xFFF5F5F5)),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${_numFmt.format(entry.avgXp)} XP',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: isMe
                              ? (isDark
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFF047857))
                              : (isDark
                                    ? Colors.white
                                    : const Color(0xFF111111)),
                        ),
                      ),
                      Text(
                        'গড় স্কোর',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 9,
                          color: isDark
                              ? const Color(0xFF525252)
                              : const Color(0xFF9CA3AF),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}

// ─── Level Selector ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
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
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF080808) : Colors.white,
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF1E1E1E) : const Color(0xFFF0F0F0),
          ),
        ),
      ),
      child: SizedBox(
        height: 112,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
          itemCount: levels.length,
          itemBuilder: (ctx, i) {
            final l = levels[i];
            final isActive = l.id == selectedLevel;
            final isMyLevel = l.id == myLevel;
            final count = levelCounts[l.id];

            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: () => onSelect(l.id),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  width: 92,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: isActive
                          ? [l.start, l.end]
                          : [
                              l.start.withValues(alpha: isDark ? 0.13 : 0.07),
                              l.end.withValues(alpha: isDark ? 0.07 : 0.04),
                            ],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isActive
                          ? Colors.transparent
                          : l.start.withValues(alpha: isDark ? 0.22 : 0.15),
                      width: 1.5,
                    ),
                    boxShadow: isActive
                        ? [
                            BoxShadow(
                              color: l.start.withValues(alpha: 0.45),
                              blurRadius: 22,
                              offset: const Offset(0, 8),
                              spreadRadius: -4,
                            ),
                          ]
                        : [],
                  ),
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          vertical: 10,
                          horizontal: 6,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // Icon in a soft circle
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isActive
                                    ? Colors.white.withValues(alpha: 0.22)
                                    : l.start.withValues(
                                        alpha: isDark ? 0.16 : 0.10,
                                      ),
                              ),
                              child: Icon(
                                l.icon,
                                size: 18,
                                color: isActive
                                    ? Colors.white
                                    : l.start.withValues(
                                        alpha: isDark ? 0.65 : 0.55,
                                      ),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              l.label.split(' ').first,
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontWeight: FontWeight.w900,
                                fontSize: 11,
                                color: isActive
                                    ? Colors.white
                                    : l.start.withValues(
                                        alpha: isDark ? 0.72 : 0.62,
                                      ),
                              ),
                              textAlign: TextAlign.center,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (count != null) ...[
                              const SizedBox(height: 3),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 7,
                                  vertical: 1.5,
                                ),
                                decoration: BoxDecoration(
                                  color: isActive
                                      ? Colors.white.withValues(alpha: 0.25)
                                      : l.start.withValues(
                                          alpha: isDark ? 0.18 : 0.10,
                                        ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  '$count',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    color: isActive
                                        ? Colors.white
                                        : l.start.withValues(
                                            alpha: isDark ? 0.80 : 0.65,
                                          ),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      if (isMyLevel)
                        Positioned(
                          top: -6,
                          left: 0,
                          right: 0,
                          child: Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: isActive
                                    ? Colors.white
                                    : const Color(0xFFEF4444),
                                borderRadius: BorderRadius.circular(100),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.18),
                                    blurRadius: 4,
                                    offset: const Offset(0, 1),
                                  ),
                                ],
                              ),
                              child: Text(
                                'তোমার',
                                style: TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  fontSize: 7,
                                  fontWeight: FontWeight.w900,
                                  color: isActive ? l.start : Colors.white,
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
                    '$rank',
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
                SizedBox(width: 36, child: Text('RANK', style: _hdr)),
                SizedBox(width: 62),
                Expanded(child: Text('STUDENT', style: _hdr)),
                Text('TOTAL XP', style: _hdr),
                SizedBox(width: 20),
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
              final isTop3 = i < 3;
              final isLast = i == users.length - 1;
              final top3Color = i == 0
                  ? const Color(0xFFE11D48)
                  : i == 1
                  ? const Color(0xFFF59E0B)
                  : const Color(0xFF94A3B8);

              return GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: onUserTap != null ? () => onUserTap!(u.id) : null,
                child: Container(
                  decoration: BoxDecoration(
                    color: isMe
                        ? (isDark
                              ? const Color(0xFFE11D48).withValues(alpha: 0.04)
                              : const Color(0xFFFFF1F2))
                        : Colors.transparent,
                    border: Border(
                      left: isTop3
                          ? BorderSide(
                              color: top3Color.withValues(alpha: 0.5),
                              width: 3,
                            )
                          : BorderSide.none,
                      bottom: !isLast
                          ? BorderSide(
                              color: isDark
                                  ? const Color(0xFF262626)
                                  : const Color(0xFFF5F5F5),
                            )
                          : BorderSide.none,
                    ),
                    borderRadius: isLast
                        ? const BorderRadius.vertical(
                            bottom: Radius.circular(20),
                          )
                        : null,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    child: Row(
                      children: [
                        SizedBox(width: 36, child: _rankBadge(i + 1)),
                        const SizedBox(width: 10),
                        _ColorAvatar(
                          name: u.name,
                          avatarUrl: u.avatarUrl,
                          size: 42,
                          highlighted: isMe,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      u.name,
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                        fontFamily: 'HindSiliguri',
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
                                    const SizedBox(width: 5),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 5,
                                        vertical: 1,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFFE4E6),
                                        borderRadius: BorderRadius.circular(
                                          100,
                                        ),
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
                              const SizedBox(height: 2),
                              Row(
                                children: [
                                  if (u.institute.isNotEmpty)
                                    Flexible(
                                      child: Text(
                                        u.institute,
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: Color(0xFFA3A3A3),
                                          fontFamily: 'HindSiliguri',
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Text(
                          _numFmt.format(u.xp),
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.w900,
                            fontSize: 14,
                            color: Color(0xFF059669),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          LucideIcons.chevronRight,
                          size: 14,
                          color: isDark
                              ? const Color(0xFF404040)
                              : const Color(0xFFD4D4D4),
                        ),
                      ],
                    ),
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
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF404040)
                    : const Color(0xFFE5E5E5),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 18),
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF404040)
                    : const Color(0xFFE5E5E5),
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
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF404040)
                          : const Color(0xFFE5E5E5),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    height: 10,
                    width: 80,
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF404040)
                          : const Color(0xFFE5E5E5),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              height: 14,
              width: 56,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF404040)
                    : const Color(0xFFE5E5E5),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ],
        ),
      ),
    ),
  );

  Widget _rankBadge(int rank) {
    if (rank == 1) return const Text('🥇', style: TextStyle(fontSize: 20));
    if (rank == 2) return const Text('🥈', style: TextStyle(fontSize: 20));
    if (rank == 3) return const Text('🥉', style: TextStyle(fontSize: 20));
    return Text(
      '$rank',
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

// ─── Avatar Color ─────────────────────────────────────────────────────────────────────────
Color _avatarColor(String name) {
  const colors = <Color>[
    Color(0xFFE11D48),
    Color(0xFF3B82F6),
    Color(0xFF10B981),
    Color(0xFFF59E0B),
    Color(0xFF8B5CF6),
    Color(0xFFF97316),
    Color(0xFF06B6D4),
    Color(0xFFEC4899),
  ];
  if (name.isEmpty) return colors[0];
  int code = 0;
  for (final c in name.runes) {
    code += c;
  }
  return colors[code % colors.length];
}

// ─── Color Avatar ──────────────────────────────────────────────────────────────────────────
class _ColorAvatar extends StatelessWidget {
  final String name;
  final String? avatarUrl;
  final double size;
  final bool highlighted;

  const _ColorAvatar({
    required this.name,
    required this.size,
    this.avatarUrl,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = _avatarColor(name);
    final darker = Color.lerp(color, Colors.black, 0.28) ?? color;
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [color, darker],
        ),
        border: highlighted
            ? Border.all(color: const Color(0xFFFECDD3), width: 2.5)
            : null,
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.35),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: ClipOval(
        child: avatarUrl != null && avatarUrl!.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: avatarUrl!,
                fit: BoxFit.cover,
                errorWidget: (_, _, _) => Center(
                  child: Text(
                    initial,
                    style: TextStyle(
                      fontSize: size * 0.4,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              )
            : Center(
                child: Text(
                  initial,
                  style: TextStyle(
                    fontSize: size * 0.4,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
      ),
    );
  }
}

// ─── Podium Section ──────────────────────────────────────────────────────────────────────
class _PodiumSection extends StatelessWidget {
  final List<_LBUser> users;
  final bool isDark;
  final void Function(String)? onTap;

  const _PodiumSection({required this.users, required this.isDark, this.onTap});

  @override
  Widget build(BuildContext context) {
    if (users.isEmpty) return const SizedBox();

    final slots =
        <
          ({
            _LBUser user,
            int rank,
            double avatarSize,
            double platformH,
            Color accentColor,
            String medal,
          })
        >[
          if (users.length >= 2)
            (
              user: users[1],
              rank: 2,
              avatarSize: 52.0,
              platformH: 60.0,
              accentColor: const Color(0xFFF59E0B),
              medal: '🥈',
            ),
          (
            user: users[0],
            rank: 1,
            avatarSize: 64.0,
            platformH: 80.0,
            accentColor: const Color(0xFFE11D48),
            medal: '🏆',
          ),
          if (users.length >= 3)
            (
              user: users[2],
              rank: 3,
              avatarSize: 48.0,
              platformH: 44.0,
              accentColor: const Color(0xFF94A3B8),
              medal: '🥉',
            ),
        ];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
              children: [
                const Text('🏆', style: TextStyle(fontSize: 16)),
                const SizedBox(width: 8),
                Text(
                  'শীর্ষ ৩',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'HindSiliguri',
                    color: isDark ? Colors.white : const Color(0xFF171717),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 0, 8, 0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: slots.map((slot) {
                return Expanded(
                  child: GestureDetector(
                    onTap: onTap != null ? () => onTap!(slot.user.id) : null,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Stack(
                          clipBehavior: Clip.none,
                          alignment: Alignment.topCenter,
                          children: [
                            if (slot.rank == 1)
                              const Positioned(
                                top: -12,
                                child: Text(
                                  '👑',
                                  style: TextStyle(fontSize: 16),
                                ),
                              ),
                            Padding(
                              padding: EdgeInsets.only(
                                top: slot.rank == 1 ? 8 : 0,
                              ),
                              child: _ColorAvatar(
                                name: slot.user.name,
                                avatarUrl: slot.user.avatarUrl,
                                size: slot.avatarSize,
                                highlighted: slot.rank == 1,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: Text(
                            slot.user.name.split(' ').first,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: slot.rank == 1 ? 13 : 12,
                              fontFamily: 'HindSiliguri',
                              color: isDark
                                  ? Colors.white
                                  : const Color(0xFF171717),
                            ),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${_numFmt.format(slot.user.xp)} XP',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: slot.accentColor,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          height: slot.platformH,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                slot.accentColor.withValues(
                                  alpha: isDark ? 0.2 : 0.12,
                                ),
                                slot.accentColor.withValues(
                                  alpha: isDark ? 0.08 : 0.05,
                                ),
                              ],
                            ),
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(10),
                            ),
                            border: Border(
                              top: BorderSide(
                                color: slot.accentColor.withValues(alpha: 0.4),
                                width: 1.5,
                              ),
                              left: BorderSide(
                                color: slot.accentColor.withValues(alpha: 0.2),
                                width: 1,
                              ),
                              right: BorderSide(
                                color: slot.accentColor.withValues(alpha: 0.2),
                                width: 1,
                              ),
                            ),
                          ),
                          child: Center(
                            child: Text(
                              slot.medal,
                              style: TextStyle(
                                fontSize: slot.rank == 1 ? 24 : 20,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
