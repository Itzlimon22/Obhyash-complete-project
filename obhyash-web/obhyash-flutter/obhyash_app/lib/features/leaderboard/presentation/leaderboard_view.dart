import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import '../../../core/data/college_list.dart';
import '../../../core/presentation/widgets/user_avatar.dart';

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
    'শীর্ষসেনা (Apex)',
    5000,
    Color(0xFFEF4444), // Crimson
    Color(0xFF991B1B),
    LucideIcons.crown,
  ),
  _LevelInfo(
    'Titan',
    'মেধাবী (Luminary)',
    3500,
    Color(0xFFF59E0B), // Amber
    Color(0xFFB45309),
    LucideIcons.sparkles,
  ),
  _LevelInfo(
    'Warrior',
    'দিগ্বিজয়ী (Conqueror)',
    2000,
    Color(0xFF8B5CF6), // Violet
    Color(0xFF6D28D9),
    LucideIcons.shield,
  ),
  _LevelInfo(
    'Scout',
    'অগ্রপথিক (Pioneer)',
    800,
    Color(0xFF0284C7), // Sky Blue
    Color(0xFF0369A1),
    LucideIcons.zap,
  ),
  _LevelInfo(
    'Rookie',
    'অনুসন্ধিৎসু (Seeker)',
    0,
    Color(0xFF10B981), // Emerald
    Color(0xFF047857),
    LucideIcons.sprout,
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

  // Pagination state for level rankings
  int _offset = 0;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  static const int _limit = 20;

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

  Future<void> _fetch({bool isLoadMore = false}) async {
    if (isLoadMore) {
      setState(() => _isLoadingMore = true);
    } else {
      setState(() {
        _isLoading = true;
        _offset = 0;
        _hasMore = true;
      });
    }

    try {
      final supabase = Supabase.instance.client;
      final me = supabase.auth.currentUser?.id;
      final data = await supabase
          .from('public_profiles')
          .select('id, name, institute, xp, level, exams_taken, avatar_url')
          .eq('level', _selectedLevel)
          .order('xp', ascending: false)
          .range(_offset, _offset + _limit - 1);

      if (mounted) {
        setState(() {
          final fetchedUsers = (data as List)
              .map((u) => _LBUser.fromJson(u as Map<String, dynamic>, me: me))
              .toList();

          if (fetchedUsers.length < _limit) {
            _hasMore = false;
          }

          if (isLoadMore) {
            _users.addAll(fetchedUsers);
            _isLoadingMore = false;
          } else {
            _users = fetchedUsers;
            _isLoading = false;
          }
          _offset += fetchedUsers.length;
        });
      }
    } catch (e) {
      debugPrint('[LeaderboardView] _fetch error: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isLoadingMore = false;
        });
      }
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
      final rawMyInstitute = myProfile?.institute;
      final myInstitute = rawMyInstitute != null
          ? normalizeCollegeName(rawMyInstitute)
          : null;

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
        final rawInst = row['institute'] as String?;
        if (rawInst == null || rawInst.isEmpty) continue;
        final inst = normalizeCollegeName(rawInst);
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
                    final inst = myProfile?.institute;
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
                    : RefreshIndicator(
                        color: const Color(0xFF004633),
                        onRefresh: () async {
                          await _fetchCounts();
                          await _fetch();
                        },
                        child: ListView(
                          physics: const AlwaysScrollableScrollPhysics(
                            parent: BouncingScrollPhysics(),
                          ),
                          padding: const EdgeInsets.only(bottom: 80),
                          children: [
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
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
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
                                    onTap: (id) => context.push(
                                      '/leaderboard/user-profile/$id',
                                    ),
                                  ),
                                _LeaderboardTable(
                                  users: _users,
                                  levelLabel: lvl.label.split(' ').first,
                                  isLoading: _isLoading,
                                  isDark: isDark,
                                  onUserTap: (id) => context.push(
                                    '/leaderboard/user-profile/$id',
                                  ),
                                ),
                                if (_hasMore && !_isLoading)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 16),
                                    child: ElevatedButton(
                                      onPressed: _isLoadingMore
                                          ? null
                                          : () => _fetch(isLoadMore: true),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: isDark
                                            ? const Color(0xFF141414)
                                            : const Color(0xFFFAFAFA),
                                        foregroundColor: isDark
                                            ? Colors.white
                                            : Colors.black,
                                        side: BorderSide(
                                          color: isDark
                                              ? const Color(0xFF1C1C1E)
                                              : const Color(0xFFE5E5E5),
                                        ),
                                        padding: const EdgeInsets.symmetric(
                                          vertical: 14,
                                        ),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            16,
                                          ),
                                        ),
                                        elevation: 0,
                                      ),
                                      child: _isLoadingMore
                                          ? const SizedBox(
                                              height: 20,
                                              width: 20,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                              ),
                                            )
                                          : const Text(
                                              'আরও লোড করুন',
                                              style: TextStyle(
                                                fontFamily: 'Anek Bangla',
                                                fontWeight: FontWeight.w700,
                                                fontSize: 17,
                                              ),
                                            ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ))
              : _CollegeLeaderboardBody(
                  institute: myProfile?.institute ?? '',
                  users: _collegeUsers,
                  isLoading: _isLoadingCollege,
                  isDark: isDark,
                  onUserTap: (id) =>
                      context.push('/leaderboard/user-profile/$id'),
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
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              label,
              style: TextStyle(
                fontFamily: 'Anek Bangla',
                fontSize: 14,
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
              const Text('🏫', style: TextStyle(fontSize: 42)),
              const SizedBox(height: 12),
              Text(
                'তোমার প্রোফাইলে কলেজের নাম যোগ করো',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Anek Bangla',
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
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
              const Text('🏫', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  institute,
                  style: TextStyle(
                    fontFamily: 'Anek Bangla',
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: isDark
                        ? const Color(0xFF059669)
                        : const Color(0xFF059669),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
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
                  const Text('🏫', style: TextStyle(fontSize: 38)),
                  const SizedBox(height: 10),
                  Text(
                    'তোমার কলেজ থেকে এখনো কেউ যোগ দেয়নি',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'Anek Bangla',
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
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
                      fontFamily: 'Anek Bangla',
                      fontSize: 16,
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
              const Text('🏆', style: TextStyle(fontSize: 42)),
              const SizedBox(height: 12),
              Text(
                'এখনো যথেষ্ট ডেটা নেই',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Anek Bangla',
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
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
                  fontFamily: 'Anek Bangla',
                  fontSize: 16,
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
              fontFamily: 'Anek Bangla',
              fontSize: 14,
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
                  : (isDark ? const Color(0xFF1C1C1E) : Colors.white),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isMe
                    ? (isDark
                          ? const Color(0xFF059669)
                          : const Color(0xFFBBF7D0))
                    : (isDark
                          ? const Color(0xFF1C1C1E)
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
                        ? Text(medal, style: const TextStyle(fontSize: 22))
                        : Text(
                            '$rank',
                            style: TextStyle(
                              fontFamily: 'Anek Bangla',
                              fontSize: 16,
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
                          fontFamily: 'Anek Bangla',
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: isMe
                              ? (isDark
                                    ? const Color(0xFF059669)
                                    : const Color(0xFF059669))
                              : (isDark
                                    ? Colors.white
                                    : const Color(0xFF1C1C1E)),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        isMe
                            ? 'তোমার কলেজ • ${entry.studentCount} শিক্ষার্থী'
                            : '${entry.studentCount} জন শিক্ষার্থী',
                        style: TextStyle(
                          fontFamily: 'Anek Bangla',
                          fontSize: 14,
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
                              ? const Color(0xFF059669)
                              : const Color(0xFFECFDF5))
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
                          fontFamily: 'Anek Bangla',
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: isMe
                              ? (isDark
                                    ? const Color(0xFF059669)
                                    : const Color(0xFF059669))
                              : (isDark
                                    ? Colors.white
                                    : const Color(0xFF1C1C1E)),
                        ),
                      ),
                      Text(
                        'গড় স্কোর',
                        style: TextStyle(
                          fontFamily: 'Anek Bangla',
                          fontSize: 12,
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
        color: isDark ? const Color(0xFF000000) : Colors.white,
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
          ),
        ),
      ),
      child: SizedBox(
        height: 136,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutCubic,
                  width: 96,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: isActive
                          ? [l.start, l.end]
                          : [
                              isDark
                                  ? const Color(0xFF141414)
                                  : const Color(0xFFFAFAFA),
                              isDark
                                  ? const Color(0xFF0F0F0F)
                                  : const Color(0xFFF5F5F5),
                            ],
                    ),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isActive
                          ? l.start.withValues(alpha: 0.8)
                          : (isDark
                                ? const Color(0xFF1C1C1E)
                                : const Color(0xFFE5E5E5)),
                      width: isActive ? 2.0 : 1.0,
                    ),
                    boxShadow: isActive
                        ? [
                            BoxShadow(
                              color: l.start.withValues(
                                alpha: isDark ? 0.4 : 0.3,
                              ),
                              blurRadius: 16,
                              offset: const Offset(0, 6),
                              spreadRadius: -2,
                            ),
                          ]
                        : [],
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    clipBehavior: Clip.none,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          vertical: 8,
                          horizontal: 4,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // Icon in a soft circle
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              width: 34,
                              height: 34,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isActive
                                    ? Colors.white.withValues(alpha: 0.2)
                                    : l.start.withValues(
                                        alpha: isDark ? 0.15 : 0.1,
                                      ),
                                border: isActive
                                    ? Border.all(
                                        color: Colors.white.withValues(
                                          alpha: 0.3,
                                        ),
                                        width: 1,
                                      )
                                    : null,
                              ),
                              child: Icon(
                                l.icon,
                                size: 16,
                                color: isActive ? Colors.white : l.start,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              l.label.split(' ').first,
                              style: TextStyle(
                                fontFamily: 'Anek Bangla',
                                fontWeight: FontWeight.w900,
                                fontSize: 16,
                                height: 1.1, // Constrain vertical height
                                color: isActive
                                    ? Colors.white
                                    : (isDark
                                          ? const Color(0xFFE5E5E5)
                                          : const Color(0xFF1F2937)),
                              ),
                              textAlign: TextAlign.center,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (count != null) ...[
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: isActive
                                      ? Colors.white.withValues(alpha: 0.25)
                                      : (isDark
                                            ? const Color(0xFF1C1C1E)
                                            : const Color(0xFFE5E5E5)),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  '$count',
                                  style: TextStyle(
                                    fontSize: 13,
                                    height: 1.1,
                                    fontWeight: FontWeight.w900,
                                    color: isActive
                                        ? Colors.white
                                        : (isDark
                                              ? const Color(0xFFA3A3A3)
                                              : const Color(0xFF4B5563)),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      if (isMyLevel)
                        Positioned(
                          top: -8,
                          left: 0,
                          right: 0,
                          child: Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [l.start, l.end],
                                ),
                                borderRadius: BorderRadius.circular(100),
                                border: Border.all(
                                  color: isDark
                                      ? const Color(0xFF000000)
                                      : Colors.white,
                                  width: 1.5,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: l.start.withValues(alpha: 0.4),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: const Text(
                                'তোমার',
                                style: TextStyle(
                                  fontFamily: 'Anek Bangla',
                                  fontSize: 8,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                  height: 1.1,
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
  final int xp;
  final int rank;
  final bool isDark;

  const _UserProgressCard({
    required this.level,
    required this.xp,
    required this.rank,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final lvl = _levelById(level);
    final nextLvl = _nextLevel(level);

    double progress = 1.0;
    if (nextLvl != null) {
      final denom = (nextLvl.minXP - lvl.minXP).toDouble();
      if (denom > 0) {
        progress = ((xp - lvl.minXP) / denom).clamp(0.0, 1.0);
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [const Color(0xFF1F2937), const Color(0xFF111827)]
              : [const Color(0xFFFFFFFF), const Color(0xFFF3F4F6)],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF374151) : const Color(0xFFE5E5E5),
          width: 1,
        ),
        boxShadow: isDark
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.4),
                  blurRadius: 16,
                  offset: const Offset(0, 8),
                ),
              ]
            : [
                BoxShadow(
                  color: const Color(0xFF000000).withValues(alpha: 0.05),
                  blurRadius: 16,
                  offset: const Offset(0, 8),
                ),
              ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [lvl.start, lvl.end],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: lvl.start.withValues(alpha: 0.4),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(lvl.icon, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lvl.label,
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 22,
                        fontFamily: 'Anek Bangla',
                        color: isDark ? Colors.white : const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_numFmt.format(xp)} XP',
                      style: TextStyle(
                        color: lvl.start,
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                      ),
                    ),
                  ],
                ),
              ),
              if (rank > 0)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF374151) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF4B5563)
                          : const Color(0xFFE5E5E5),
                    ),
                    boxShadow: [
                      if (!isDark)
                        const BoxShadow(
                          color: Color(0x0A000000),
                          blurRadius: 4,
                          offset: Offset(0, 2),
                        ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Text(
                        '#$rank',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 22,
                          color: isDark
                              ? Colors.white
                              : const Color(0xFF111827),
                        ),
                      ),
                      Text(
                        'তোমার র‍্যাঙ্ক',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? const Color(0xFF9CA3AF)
                              : const Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          if (nextLvl != null) ...[
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'পরবর্তী লেভেল: ${nextLvl.label.split(' ').first}',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? const Color(0xFF9CA3AF)
                        : const Color(0xFF4B5563),
                  ),
                ),
                Text(
                  '${_numFmt.format(nextLvl.minXP - xp)} XP প্রয়োজন',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? const Color(0xFF9CA3AF)
                        : const Color(0xFF4B5563),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Stack(
              children: [
                Container(
                  height: 12,
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF374151)
                        : const Color(0xFFE5E5E5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 800),
                  curve: Curves.easeOutCubic,
                  height: 12,
                  width: MediaQuery.of(context).size.width * progress,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [lvl.start, lvl.end]),
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: lvl.start.withValues(alpha: 0.5),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
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
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
        ),
        boxShadow: isDark
            ? []
            : [
                const BoxShadow(
                  color: Color(0x0A000000),
                  blurRadius: 12,
                  offset: Offset(0, 4),
                ),
              ],
      ),
      child: Column(
        children: [
          // ── Card title ────────────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF141414) : const Color(0xFFFAFAFA),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(24),
              ),
            ),
            child: Row(
              children: [
                Text(
                  '$levelLabel র‍্যাঙ্কিং',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                    color: isDark
                        ? const Color(0xFFE5E5E5)
                        : const Color(0xFF1F2937),
                    fontFamily: 'Anek Bangla',
                  ),
                ),
                const Spacer(),
                Icon(
                  LucideIcons.barChart2,
                  size: 18,
                  color: isDark
                      ? const Color(0xFFA3A3A3)
                      : const Color(0xFF737373),
                ),
              ],
            ),
          ),

          // ── List items ──────────────────────────────────────────────────
          if (isLoading && users.isEmpty)
            _skeleton()
          else if (users.isEmpty)
            _empty()
          else
            ...users.asMap().entries.map((entry) {
              final i = entry.key;
              final u = entry.value;
              final isMe = u.isCurrentUser;
              return InkWell(
                    onTap: onUserTap != null ? () => onUserTap!(u.id) : null,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: isMe
                            ? (isDark
                                  ? const Color(
                                      0xFF450a0a,
                                    ).withValues(alpha: 0.4)
                                  : const Color(0xFFFEF2F2))
                            : (isDark ? const Color(0xFF000000) : Colors.white),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isMe
                              ? const Color(0xFFEF4444).withValues(alpha: 0.5)
                              : (isDark
                                    ? const Color(0xFF1C1C1E)
                                    : const Color(0xFFF5F5F5)),
                          width: isMe ? 1.5 : 1,
                        ),
                        boxShadow: isMe
                            ? [
                                BoxShadow(
                                  color: const Color(
                                    0xFFEF4444,
                                  ).withValues(alpha: 0.1),
                                  blurRadius: 8,
                                  spreadRadius: 1,
                                ),
                              ]
                            : [],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 40,
                              child: _rankBadge(i + 1, isDark),
                            ),
                            const SizedBox(width: 12),
                            UserAvatar(
                              id: u.id,
                              name: u.name,
                              avatarUrl: u.avatarUrl,
                              size: 46,
                              showBorder: isMe,
                              borderColor: const Color(0xFFFECDD3),
                              borderWidth: 2.5,
                            ),
                            const SizedBox(width: 12),
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
                                            fontWeight: FontWeight.w900,
                                            fontSize: 17,
                                            fontFamily: 'Anek Bangla',
                                            color: isMe
                                                ? (isDark
                                                      ? const Color(0xFFFCA5A5)
                                                      : const Color(0xFFB91C1C))
                                                : (isDark
                                                      ? Colors.white
                                                      : const Color(
                                                          0xFF000000,
                                                        )),
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      if (isMe) ...[
                                        const SizedBox(width: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            gradient: const LinearGradient(
                                              colors: [
                                                Color(0xFFEF4444),
                                                Color(0xFFB91C1C),
                                              ],
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              100,
                                            ),
                                            boxShadow: [
                                              BoxShadow(
                                                color: const Color(
                                                  0xFFEF4444,
                                                ).withValues(alpha: 0.4),
                                                blurRadius: 4,
                                                offset: const Offset(0, 2),
                                              ),
                                            ],
                                          ),
                                          child: const Text(
                                            'তুমি',
                                            style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w900,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      if (u.institute.isNotEmpty)
                                        Flexible(
                                          child: Text(
                                            u.institute,
                                            style: const TextStyle(
                                              fontSize: 16,
                                              color: Color(0xFFA3A3A3),
                                              fontFamily: 'Anek Bangla',
                                            ),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '${_numFmt.format(u.xp)}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 18,
                                    color: isMe
                                        ? const Color(0xFFEF4444)
                                        : (isDark
                                              ? const Color(0xFFE5E5E5)
                                              : const Color(0xFF1F2937)),
                                  ),
                                ),
                                const Text(
                                  'XP',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFFA3A3A3),
                                    letterSpacing: 1.0,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                  .animate()
                  .fade(delay: (i * 50).ms, duration: 400.ms)
                  .slideY(begin: 0.1, end: 0.0);
            }),
        ],
      ),
    );
  }

  Widget _empty() => Padding(
    padding: const EdgeInsets.symmetric(vertical: 40),
    child: Column(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            LucideIcons.users,
            size: 36,
            color: Color(0xFFA3A3A3),
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'এই লেভেলে এখনও কোনো শিক্ষার্থী নেই।',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w600,
            color: Color(0xFFA3A3A3),
          ),
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
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF27272A)
                    : const Color(0xFFE5E5E5),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 18),
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF27272A)
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
                    height: 14,
                    width: 140,
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF27272A)
                          : const Color(0xFFE5E5E5),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 12,
                    width: 90,
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF27272A)
                          : const Color(0xFFE5E5E5),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              height: 16,
              width: 60,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF27272A)
                    : const Color(0xFFE5E5E5),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ],
        ),
      ),
    ),
  );

  Widget _rankBadge(int rank, bool isDark) {
    if (rank == 1)
      return const Center(child: Text('🥇', style: TextStyle(fontSize: 28)));
    if (rank == 2)
      return const Center(child: Text('🥈', style: TextStyle(fontSize: 28)));
    if (rank == 3)
      return const Center(child: Text('🥉', style: TextStyle(fontSize: 28)));
    return Container(
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF3F4F6),
        shape: BoxShape.circle,
      ),
      width: 32,
      height: 32,
      child: Text(
        '$rank',
        style: TextStyle(
          fontWeight: FontWeight.w900,
          fontSize: 16,
          color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
        ),
      ),
    );
  }
}

// ─── Avatar Color ─────────────────────────────────────────────────────────────────────────// ─── Avatar Color ─────────────────────────────────────────────────────────────────────────
Color _avatarColor(String name) {
  const colors = <Color>[
    Color(0xFFB91C1C),
    Color(0xFF000000),
    Color(0xFF059669),
    Color(0xFF1E3A8A),
    Color(0xFF000000),
    Color(0xFF1E3A8A),
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
  final String? id;
  final String? avatarUrl;
  final double size;
  final bool highlighted;

  const _ColorAvatar({
    required this.name,
    required this.size,
    this.id,
    this.avatarUrl,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    return UserAvatar(
      id: id,
      name: name,
      avatarUrl: avatarUrl,
      size: size,
      showBorder: highlighted,
      borderColor: const Color(0xFFFECDD3),
      borderWidth: 2.5,
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
              accentColor: const Color(0xFF1E3A8A),
              medal: '🥈',
            ),
          (
            user: users[0],
            rank: 1,
            avatarSize: 64.0,
            platformH: 80.0,
            accentColor: const Color(0xFFB91C1C),
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
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
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
                const Text('🏆', style: TextStyle(fontSize: 18)),
                const SizedBox(width: 8),
                Text(
                  'শীর্ষ ৩',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Anek Bangla',
                    color: isDark ? Colors.white : const Color(0xFF000000),
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
                                  style: TextStyle(fontSize: 18),
                                ),
                              ),
                            Padding(
                              padding: EdgeInsets.only(
                                top: slot.rank == 1 ? 8 : 0,
                              ),
                              child: UserAvatar(
                                id: slot.user.id,
                                name: slot.user.name,
                                avatarUrl: slot.user.avatarUrl,
                                size: slot.avatarSize,
                                showBorder: slot.rank == 1,
                                borderColor: const Color(0xFFFDE047),
                                borderWidth: 2.5,
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
                              fontFamily: 'Anek Bangla',
                              color: isDark
                                  ? Colors.white
                                  : const Color(0xFF000000),
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
                            fontSize: 14,
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
