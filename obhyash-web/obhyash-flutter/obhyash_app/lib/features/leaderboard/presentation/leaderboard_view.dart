import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import '../../../core/data/college_list.dart';
import '../../../core/presentation/widgets/user_avatar.dart';
import '../../../core/presentation/widgets/skeleton_loading.dart';
import '../../../core/presentation/widgets/app_refresh_indicator.dart';

// ─── Level Data ────────────────────────────────────────────────────────────────
class _LevelInfo {
  final String id;
  final String label;
  final int minXP;
  final String xpRange;
  final Color start, end;
  final IconData icon;

  const _LevelInfo(
    this.id,
    this.label,
    this.minXP,
    this.xpRange,
    this.start,
    this.end,
    this.icon,
  );
}

const _levels = [
  _LevelInfo(
    'Legend',
    'লিজেন্ড',
    15000,
    '15K+ XP',
    Color(0xFFEF4444), // Crimson
    Color(0xFF991B1B),
    LucideIcons.crown,
  ),
  _LevelInfo(
    'Scholar',
    'স্কলার',
    7000,
    '7K–15K XP',
    Color(0xFFF59E0B), // Amber
    Color(0xFFB45309),
    LucideIcons.sparkles,
  ),
  _LevelInfo(
    'Warrior',
    'ওয়ারিয়র',
    3000,
    '3K–7K XP',
    Color(0xFF8B5CF6), // Violet
    Color(0xFF6D28D9),
    LucideIcons.shield,
  ),
  _LevelInfo(
    'Challenger',
    'চ্যালেঞ্জার',
    1000,
    '1K–3K XP',
    Color(0xFF0284C7), // Sky Blue
    Color(0xFF0369A1),
    LucideIcons.zap,
  ),
  _LevelInfo(
    'Explorer',
    'এক্সপ্লোরার',
    0,
    '0–1K XP',
    Color(0xFF10B981), // Emerald
    Color(0xFF047857),
    LucideIcons.sprout,
  ),
];

_LevelInfo _levelById(String id) {
  final cleanId = id.trim().toLowerCase();
  if (cleanId.contains('legend') || cleanId.contains('apex')) {
    return _levels[0]; // Legend
  } else if (cleanId.contains('scholar') || cleanId.contains('titan') || cleanId.contains('luminary')) {
    return _levels[1]; // Scholar
  } else if (cleanId.contains('warrior') || cleanId.contains('conqueror') || cleanId.contains('achiever')) {
    return _levels[2]; // Warrior
  } else if (cleanId.contains('challenger') || cleanId.contains('scout') || cleanId.contains('pioneer')) {
    return _levels[3]; // Challenger
  } else {
    return _levels[4]; // Explorer
  }
}

/// Next higher level (null if already at Legend).
_LevelInfo? _nextLevel(String id) {
  final idx = _levels.indexWhere((l) => l.id == id);
  if (idx > 0) return _levels[idx - 1];
  return null;
}

// ─── User Model ────────────────────────────────────────────────────────────────
class _LBUser {
  final String id, name, institute, level;
  final String? batch;
  final String? avatarUrl;
  final int xp, monthlyXp, examsTaken;
  final bool isCurrentUser;
  final bool isPro;

  const _LBUser({
    required this.id,
    required this.name,
    required this.institute,
    required this.level,
    this.batch,
    this.avatarUrl,
    required this.xp,
    this.monthlyXp = 0,
    required this.examsTaken,
    this.isCurrentUser = false,
    this.isPro = false,
  });

  factory _LBUser.fromJson(Map<String, dynamic> j, {String? me, String timeframe = 'monthly'}) {
    final rawPlan = j['plan']?.toString().toLowerCase();
    final isPro = j['is_pro'] == true ||
        j['is_subscribed'] == true ||
        (rawPlan != null && rawPlan.isNotEmpty && rawPlan != 'free');

    final fullXp = (j['xp'] as num?)?.toInt() ?? 0;
    final mXp = (j['monthly_xp'] as num?)?.toInt() ?? 0;
    final effectiveXp = timeframe == 'monthly' ? mXp : fullXp;
    final calculatedLevel = _calculateLevelFromXp(effectiveXp);

    return _LBUser(
      id: j['id'] ?? '',
      name: j['name'] ?? 'অজানা',
      institute: j['institute'] ?? '',
      level: calculatedLevel,
      batch: j['batch']?.toString(),
      avatarUrl: j['avatar_url'] as String?,
      xp: effectiveXp,
      monthlyXp: mXp,
      examsTaken: (j['exams_taken'] as num?)?.toInt() ?? 0,
      isCurrentUser: j['id'] == me,
      isPro: isPro,
    );
  }
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

(int, int) _getLevelThreshold(String levelId) {
  final lower = levelId.toLowerCase();
  if (lower.contains('explorer') || lower.contains('rookie')) {
    return (0, 999);
  } else if (lower.contains('challenger') || lower.contains('scout')) {
    return (1000, 2999);
  } else if (lower.contains('warrior')) {
    return (3000, 6999);
  } else if (lower.contains('scholar') || lower.contains('titan')) {
    return (7000, 14999);
  } else {
    return (15000, 999999999);
  }
}

String _calculateLevelFromXp(int xp) {
  if (xp >= 15000) return 'Legend';
  if (xp >= 7000) return 'Scholar';
  if (xp >= 3000) return 'Warrior';
  if (xp >= 1000) return 'Challenger';
  return 'Explorer';
}

// ─── View ──────────────────────────────────────────────────────────────────────
class LeaderboardView extends ConsumerStatefulWidget {
  const LeaderboardView({super.key});

  @override
  ConsumerState<LeaderboardView> createState() => _LeaderboardViewState();
}

class _LeaderboardViewState extends ConsumerState<LeaderboardView> {
  String _selectedLevel = 'Explorer';
  String _timeframe = 'monthly'; // 'monthly', 'all_time'
  String _batchFilter = 'all'; // 'all', 'my_batch'
  List<_LBUser> _users = [];
  bool _isLoading = false;
  Map<String, int> _levelCounts = {};
  String _viewMode = 'level'; // 'level', 'college', or 'rankings'
  List<_LBUser> _collegeUsers = [];
  bool _isLoadingCollege = false;
  List<_InstituteRank> _instituteRankings = [];
  bool _isLoadingRankings = false;
  int _myExactRank = 0;

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

      // Count students in each league tier by their lifetime XP
      final futures = _levels.map((lvl) async {
        final (minXp, maxXp) = _getLevelThreshold(lvl.id);
        var query = supabase.from('users').select('id').gte('xp', minXp);
        if (maxXp < 999999999) {
          query = query.lte('xp', maxXp);
        }
        final data = await query.limit(9999);
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
      final (minXp, maxXp) = _getLevelThreshold(_selectedLevel);
      final isMonthly = _timeframe == 'monthly';
      final sortColumn = isMonthly ? 'monthly_xp' : 'xp';

      // 1. Query users who belong to this Tier (Level) by lifetime XP
      PostgrestFilterBuilder<List<Map<String, dynamic>>> query = supabase
          .from('users')
          .select('id, name, institute, xp, monthly_xp, level, exams_taken, avatar_url, batch')
          .gte('xp', minXp);

      if (maxXp < 999999999) {
        query = query.lte('xp', maxXp);
      }

      // Optional Batch filtering
      if (_batchFilter == 'my_batch') {
        final myProfile = ref.read(userProfileProvider).whenOrNull(data: (u) => u);
        final rawUserBatch = myProfile?.batch?.trim();
        if (rawUserBatch != null && rawUserBatch.isNotEmpty) {
          query = query.ilike('batch', '%$rawUserBatch%');
        }
      }

      // 2. Order by timeframe XP: for monthly, sort by monthly_xp DESC then xp DESC; for lifetime, xp DESC
      final PostgrestTransformBuilder<List<Map<String, dynamic>>> orderedQuery;
      if (isMonthly) {
        orderedQuery = query
            .order('monthly_xp', ascending: false, nullsFirst: false)
            .order('xp', ascending: false, nullsFirst: false);
      } else {
        orderedQuery = query
            .order('xp', ascending: false, nullsFirst: false);
      }

      final data = await orderedQuery.range(_offset, _offset + _limit - 1);

      // 3. Compute accurate current user rank in their tier if initial fetch
      int calculatedRank = 0;
      final myProfile = ref.read(userProfileProvider).whenOrNull(data: (u) => u);
      if (myProfile != null && !isLoadMore) {
        try {
          final (myMinXp, myMaxXp) = _getLevelThreshold(myProfile.level ?? _selectedLevel);
          final myXp = isMonthly ? myProfile.monthlyXp : myProfile.xp;
          var countQuery = supabase
              .from('users')
              .select('id')
              .gte('xp', myMinXp);
          if (myMaxXp < 999999999) {
            countQuery = countQuery.lte('xp', myMaxXp);
          }
          if (_batchFilter == 'my_batch' && myProfile.batch != null && myProfile.batch!.isNotEmpty) {
            countQuery = countQuery.ilike('batch', '%${myProfile.batch!.trim()}%');
          }
          countQuery = countQuery.gt(sortColumn, myXp);
          final countRes = await countQuery.count(CountOption.exact);
          calculatedRank = countRes.count + 1;
        } catch (e) {
          debugPrint('[LeaderboardView] Rank count error: $e');
        }
      }

      if (mounted) {
        setState(() {
          final fetchedUsers = (data as List)
              .map((u) => _LBUser.fromJson(u as Map<String, dynamic>, me: me, timeframe: _timeframe))
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
            if (calculatedRank > 0) {
              _myExactRank = calculatedRank;
            }
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
      final isMonthly = _timeframe == 'monthly';

      PostgrestFilterBuilder<List<Map<String, dynamic>>> query = supabase
          .from('users')
          .select('id, name, institute, xp, monthly_xp, level, exams_taken, avatar_url, batch')
          .eq('institute', institute);

      final PostgrestTransformBuilder<List<Map<String, dynamic>>> orderedQuery;
      if (isMonthly) {
        orderedQuery = query
            .order('monthly_xp', ascending: false, nullsFirst: false)
            .order('xp', ascending: false, nullsFirst: false);
      } else {
        orderedQuery = query
            .order('xp', ascending: false, nullsFirst: false);
      }

      final data = await orderedQuery.limit(100);

      if (mounted) {
        setState(() {
          _collegeUsers = (data as List)
              .map((u) => _LBUser.fromJson(u as Map<String, dynamic>, me: me, timeframe: _timeframe))
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

    final rawUserBatch = myProfile?.batch?.trim();
    final userBatchLabel = (rawUserBatch != null && rawUserBatch.isNotEmpty)
        ? rawUserBatch
        : 'HSC 2026';

    // Map displayed XP and users cleanly
    final displayedUsers = _users.map((u) => _LBUser(
      id: u.id,
      name: u.name,
      institute: u.institute,
      level: u.level,
      batch: u.batch,
      avatarUrl: u.avatarUrl,
      xp: _timeframe == 'monthly' ? u.monthlyXp : u.xp,
      monthlyXp: u.monthlyXp,
      examsTaken: u.examsTaken,
      isCurrentUser: u.isCurrentUser,
      isPro: u.isPro,
    )).toList();

    final myRankIdx = myProfile != null
        ? displayedUsers.indexWhere((u) => u.id == myProfile.id)
        : -1;
    final myRank = myRankIdx >= 0 ? myRankIdx + 1 : (_myExactRank > 0 ? _myExactRank : 0);
    final myLvl = _levelById(myProfile?.level ?? 'Explorer');
    final isOnOwnLevel = myLvl.id == lvl.id;

    final isSsc = (myProfile?.stream?.toLowerCase().contains('ssc') ?? false) ||
        (myProfile?.batch?.toLowerCase().contains('ssc') ?? false) ||
        (myProfile?.target?.toLowerCase().contains('ssc') ?? false);

    final instLabel = isSsc ? 'স্কুল' : 'কলেজ';
    final myInstTabLabel = 'আমার $instLabel';
    final allInstTabLabel = 'সব $instLabel';

    return Column(
      children: [
        // ── View Mode Tab Switcher ──────────────────────────────────────────
        Container(
          color: isDark ? const Color(0xFF000000) : Colors.white,
          padding: const EdgeInsets.fromLTRB(10, 12, 10, 8),
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF141416) : const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
              ),
            ),
            child: Row(
              children: [
                _ViewModeTab(
                  label: 'র‍্যাংকিং',
                  isActive: _viewMode == 'level',
                  isDark: isDark,
                  onTap: () => setState(() => _viewMode = 'level'),
                ),
                const SizedBox(width: 4),
                _ViewModeTab(
                  label: myInstTabLabel,
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
                  label: allInstTabLabel,
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
                  onRefresh: _fetchInstituteRankings,
                )
              : _viewMode == 'level'
              ? (_isLoading && _users.isEmpty
                    ? const LeaderboardSkeleton()
                    : AppRefreshIndicator(
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

                          // ── My Batch Badge & Timeframe Filter (Below Level Selector) ──
                          _BatchAndTimelineHeader(
                            userBatchLabel: userBatchLabel,
                            selectedBatchFilter: _batchFilter,
                            timeframe: _timeframe,
                            isDark: isDark,
                            onBatchFilterChanged: (b) {
                              if (_batchFilter != b) {
                                setState(() => _batchFilter = b);
                                _fetch();
                              }
                            },
                            onTimeframeChanged: (t) {
                              if (_timeframe != t) {
                                setState(() => _timeframe = t);
                                _fetchCounts();
                                _fetch();
                              }
                            },
                          ),

                          Padding(
                            padding: const EdgeInsets.fromLTRB(10, 0, 10, 0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                if (myProfile != null && isOnOwnLevel)
                                  _UserProgressCard(
                                    level: myProfile.level ?? 'Explorer',
                                    xp: _timeframe == 'monthly' ? myProfile.monthlyXp : myProfile.xp,
                                    rank: myRank,
                                    isDark: isDark,
                                  ),
                                if (!_isLoading && displayedUsers.length >= 3)
                                  _PodiumSection(
                                    users: displayedUsers.take(3).toList(),
                                    isDark: isDark,
                                    onTap: (id) => context.push(
                                      '/leaderboard/user-profile/$id',
                                    ),
                                  ),
                                _LeaderboardTable(
                                  users: displayedUsers,
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

// ─── Batch and Timeline Header ───────────────────────────────────────────────
class _BatchAndTimelineHeader extends StatelessWidget {
  final String userBatchLabel;
  final String selectedBatchFilter;
  final String timeframe;
  final bool isDark;
  final ValueChanged<String> onBatchFilterChanged;
  final ValueChanged<String> onTimeframeChanged;

  const _BatchAndTimelineHeader({
    required this.userBatchLabel,
    required this.selectedBatchFilter,
    required this.timeframe,
    required this.isDark,
    required this.onBatchFilterChanged,
    required this.onTimeframeChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isMyBatchSelected = selectedBatchFilter == 'my_batch';

    return Container(
      margin: const EdgeInsets.fromLTRB(10, 6, 10, 12),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141416) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Left: Batch Selector Popup
          PopupMenuButton<String>(
            initialValue: selectedBatchFilter,
            onSelected: onBatchFilterChanged,
            offset: const Offset(0, 36),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: BorderSide(
                color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
              ),
            ),
            color: isDark ? const Color(0xFF1E1E22) : Colors.white,
            elevation: 8,
            itemBuilder: (ctx) => [
              PopupMenuItem(
                value: 'all',
                child: Row(
                  children: [
                    const Icon(LucideIcons.users, size: 15, color: Color(0xFF10B981)),
                    const SizedBox(width: 8),
                    Text(
                      'সকল ব্যাচ (All Batches)',
                      style: TextStyle(
                        fontFamily: 'Anek Bangla',
                        fontSize: 13,
                        fontWeight: !isMyBatchSelected ? FontWeight.w800 : FontWeight.w500,
                        color: !isMyBatchSelected
                            ? const Color(0xFF10B981)
                            : (isDark ? Colors.white : const Color(0xFF1F2937)),
                      ),
                    ),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'my_batch',
                child: Row(
                  children: [
                    const Icon(LucideIcons.graduationCap, size: 15, color: Color(0xFF6366F1)),
                    const SizedBox(width: 8),
                    Text(
                      'আমার ব্যাচ ($userBatchLabel)',
                      style: TextStyle(
                        fontFamily: 'Anek Bangla',
                        fontSize: 13,
                        fontWeight: isMyBatchSelected ? FontWeight.w800 : FontWeight.w500,
                        color: isMyBatchSelected
                            ? const Color(0xFF6366F1)
                            : (isDark ? Colors.white : const Color(0xFF1F2937)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1F1F23) : const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isDark ? const Color(0xFF2E2E33) : const Color(0xFFE5E7EB),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isMyBatchSelected ? LucideIcons.graduationCap : LucideIcons.users,
                    size: 13,
                    color: isMyBatchSelected ? const Color(0xFF6366F1) : const Color(0xFF10B981),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    isMyBatchSelected ? userBatchLabel : 'সকল ব্যাচ',
                    style: TextStyle(
                      fontFamily: 'Anek Bangla',
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : const Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    LucideIcons.chevronDown,
                    size: 14,
                    color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280),
                  ),
                ],
              ),
            ),
          ),

          // Right: Timeframe Filter Dropdown
          PopupMenuButton<String>(
            initialValue: timeframe,
            onSelected: onTimeframeChanged,
            offset: const Offset(0, 36),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: BorderSide(
                color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
              ),
            ),
            color: isDark ? const Color(0xFF1E1E22) : Colors.white,
            elevation: 8,
            itemBuilder: (ctx) => [
              PopupMenuItem(
                value: 'monthly',
                child: Row(
                  children: [
                    const Icon(LucideIcons.calendar, size: 15, color: Color(0xFF3B82F6)),
                    const SizedBox(width: 8),
                    Text(
                      'মাসিক (Monthly)',
                      style: TextStyle(
                        fontFamily: 'Anek Bangla',
                        fontSize: 13,
                        fontWeight: timeframe == 'monthly' ? FontWeight.w800 : FontWeight.w500,
                        color: timeframe == 'monthly' 
                            ? const Color(0xFF3B82F6) 
                            : (isDark ? Colors.white : const Color(0xFF1F2937)),
                      ),
                    ),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'all_time',
                child: Row(
                  children: [
                    const Icon(LucideIcons.crown, size: 15, color: Color(0xFFF59E0B)),
                    const SizedBox(width: 8),
                    Text(
                      'লাইফটাইম (Lifetime)',
                      style: TextStyle(
                        fontFamily: 'Anek Bangla',
                        fontSize: 13,
                        fontWeight: timeframe == 'all_time' ? FontWeight.w800 : FontWeight.w500,
                        color: timeframe == 'all_time' 
                            ? const Color(0xFFF59E0B) 
                            : (isDark ? Colors.white : const Color(0xFF1F2937)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1F1F23) : const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isDark ? const Color(0xFF2E2E33) : const Color(0xFFE5E7EB),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    timeframe == 'monthly'
                        ? LucideIcons.calendar
                        : LucideIcons.crown,
                    size: 13,
                    color: timeframe == 'monthly'
                        ? const Color(0xFF3B82F6)
                        : const Color(0xFFF59E0B),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    timeframe == 'monthly'
                        ? 'মাসিক'
                        : 'লাইফটাইম',
                    style: TextStyle(
                      fontFamily: 'Anek Bangla',
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : const Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    LucideIcons.chevronDown,
                    size: 14,
                    color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
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
      return const LeaderboardSkeleton();
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(10, 12, 10, 80),
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
  final Future<void> Function()? onRefresh;

  const _InstituteRankingsBody({
    required this.rankings,
    required this.isLoading,
    required this.isDark,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(10, 16, 10, 80),
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
      Widget emptyContent = Center(
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

      if (onRefresh != null) {
        return AppRefreshIndicator(
          onRefresh: onRefresh!,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            children: [
              SizedBox(
                height: MediaQuery.of(context).size.height * 0.6,
                child: emptyContent,
              ),
            ],
          ),
        );
      }
      return emptyContent;
    }

    Widget list = ListView(
      physics: const AlwaysScrollableScrollPhysics(
        parent: BouncingScrollPhysics(),
      ),
      padding: const EdgeInsets.fromLTRB(10, 8, 10, 80),
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

    if (onRefresh != null) {
      return AppRefreshIndicator(
        onRefresh: onRefresh!,
        child: list,
      );
    }
    return list;
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
        height: 114,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          itemCount: levels.length,
          itemBuilder: (ctx, i) {
            final l = levels[i];
            final isActive = l.id == selectedLevel;
            final isMyLevel = l.id == myLevel;

            return Padding(
              padding: const EdgeInsets.only(right: 12),
              child: GestureDetector(
                onTap: () => onSelect(l.id),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutCubic,
                  width: 94,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: isActive
                          ? [l.start, l.end]
                          : [
                              isDark
                                  ? const Color(0xFF141416)
                                  : const Color(0xFFFAFAFA),
                              isDark
                                  ? const Color(0xFF18181B)
                                  : const Color(0xFFF5F5F5),
                            ],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isActive
                          ? l.start.withValues(alpha: 0.8)
                          : (isDark
                                ? const Color(0xFF27272A)
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
                          vertical: 6,
                          horizontal: 4,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // Icon in a soft circle
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              width: 30,
                              height: 30,
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
                                size: 15,
                                color: isActive ? Colors.white : l.start,
                              ),
                            ),
                            const SizedBox(height: 5),
                            Text(
                              l.label.split(' ').first,
                              style: TextStyle(
                                fontFamily: 'Anek Bangla',
                                fontWeight: FontWeight.w900,
                                fontSize: 13.5,
                                height: 1.1,
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
                            const SizedBox(height: 2),
                            Text(
                              l.xpRange,
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.1,
                                color: isActive
                                    ? Colors.white.withValues(alpha: 0.85)
                                    : (isDark
                                          ? const Color(0xFF737373)
                                          : const Color(0xFF8E8E93)),
                              ),
                              textAlign: TextAlign.center,
                            ),
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
              ? [const Color(0xFF1F1F23), const Color(0xFF141416)]
              : [const Color(0xFFFFFFFF), const Color(0xFFF3F4F6)],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF2E2E33) : const Color(0xFFE5E5E5),
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
                    color: isDark ? const Color(0xFF27272A) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF3F3F46)
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
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'পরবর্তী লেভেল: ${nextLvl.label.split(' ').first}',
                  style: TextStyle(
                    fontFamily: 'Anek Bangla',
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: isDark
                        ? const Color(0xFF9CA3AF)
                        : const Color(0xFF4B5563),
                  ),
                ),
                Text(
                  '${_numFmt.format(nextLvl.minXP - xp)} XP প্রয়োজন',
                  style: TextStyle(
                    fontFamily: 'Anek Bangla',
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
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
        color: isDark ? const Color(0xFF141416) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5),
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
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF18181B) : const Color(0xFFFAFAFA),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(24),
              ),
              border: Border(
                bottom: BorderSide(
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5),
                ),
              ),
            ),
            child: Row(
              children: [
                Text(
                  '$levelLabel র‍্যাঙ্কিং',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                    color: isDark
                        ? const Color(0xFFE5E5E5)
                        : const Color(0xFF1F2937),
                    fontFamily: 'Anek Bangla',
                  ),
                ),
                const Spacer(),
                Icon(
                  LucideIcons.barChart2,
                  size: 17,
                  color: isDark
                      ? const Color(0xFFA3A3A3)
                      : const Color(0xFF737373),
                ),
              ],
            ),
          ),

          // ── Column Headers: Rank, Student, XP ────────────────────────────
          if (users.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(26, 10, 26, 4),
              child: Row(
                children: [
                  SizedBox(
                    width: 36,
                    child: Text(
                      'Rank',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'HindSiliguri',
                        color: isDark
                            ? const Color(0xFF71717A)
                            : const Color(0xFF9CA3AF),
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const SizedBox(width: 40),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Student',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'HindSiliguri',
                        color: isDark
                            ? const Color(0xFF71717A)
                            : const Color(0xFF9CA3AF),
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  Text(
                    'XP',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'HindSiliguri',
                      color: isDark
                          ? const Color(0xFF71717A)
                          : const Color(0xFF9CA3AF),
                      letterSpacing: 0.5,
                    ),
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
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: isMe
                            ? (isDark
                                  ? const Color(
                                      0xFF450a0a,
                                    ).withValues(alpha: 0.5)
                                  : const Color(0xFFFEF2F2))
                            : (isDark ? const Color(0xFF1F1F23) : Colors.white),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isMe
                              ? const Color(0xFFEF4444).withValues(alpha: 0.6)
                              : (isDark
                                    ? const Color(0xFF2E2E33)
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
                          vertical: 10,
                        ),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 36,
                              child: _rankBadge(i + 1, isDark),
                            ),
                            const SizedBox(width: 12),
                            UserAvatar(
                              id: u.id,
                              name: u.name,
                              avatarUrl: u.avatarUrl,
                              size: 40,
                              isPro: u.isPro,
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
                                            fontWeight: FontWeight.w800,
                                            fontSize: 13.5,
                                            fontFamily: 'Anek Bangla',
                                            color: isMe
                                                ? (isDark
                                                      ? const Color(0xFFFCA5A5)
                                                      : const Color(0xFFB91C1C))
                                                : (isDark
                                                      ? Colors.white
                                                      : const Color(
                                                          0xFF111827,
                                                        )),
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      if (isMe) ...[
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 6,
                                            vertical: 1,
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
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800,
                                              fontFamily: 'Anek Bangla',
                                              color: Colors.white,
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
                                            style: TextStyle(
                                              fontSize: 11.5,
                                              fontWeight: FontWeight.w500,
                                              color: isDark
                                                  ? const Color(0xFF9CA3AF)
                                                  : const Color(0xFF6B7280),
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
                            Text(
                              _numFmt.format(u.xp),
                              textAlign: TextAlign.right,
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 14,
                                color: isMe
                                    ? const Color(0xFFEF4444)
                                    : (isDark
                                          ? const Color(0xFFE5E5E5)
                                          : const Color(0xFF1F2937)),
                              ),
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
                    ? const Color(0xFF1C1C1E)
                    : const Color(0xFFF3F4F6),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 12),
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
            const SizedBox(width: 12),
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
    if (rank == 1) {
      return const Center(child: Text('🥇', style: TextStyle(fontSize: 24)));
    }
    if (rank == 2) {
      return const Center(child: Text('🥈', style: TextStyle(fontSize: 24)));
    }
    if (rank == 3) {
      return const Center(child: Text('🥉', style: TextStyle(fontSize: 24)));
    }
    return Container(
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6),
        shape: BoxShape.circle,
      ),
      width: 28,
      height: 28,
      child: Text(
        '$rank',
        style: TextStyle(
          fontWeight: FontWeight.w900,
          fontSize: 13,
          color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
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
            Color startColor,
            Color endColor,
            Color borderColor,
            String medal,
            String rankLabel,
          })
        >[
          if (users.length >= 2)
            (
              user: users[1],
              rank: 2,
              avatarSize: 52.0,
              platformH: 66.0,
              accentColor: const Color(0xFF2563EB),
              startColor: const Color(0xFF3B82F6),
              endColor: const Color(0xFF1D4ED8),
              borderColor: const Color(0xFF60A5FA),
              medal: '🥈',
              rankLabel: '২য়',
            ),
          (
            user: users[0],
            rank: 1,
            avatarSize: 64.0,
            platformH: 86.0,
            accentColor: const Color(0xFFD97706),
            startColor: const Color(0xFFF59E0B),
            endColor: const Color(0xFFB45309),
            borderColor: const Color(0xFFF59E0B),
            medal: '🏆',
            rankLabel: '১ম',
          ),
          if (users.length >= 3)
            (
              user: users[2],
              rank: 3,
              avatarSize: 48.0,
              platformH: 52.0,
              accentColor: const Color(0xFFEA580C),
              startColor: const Color(0xFFF97316),
              endColor: const Color(0xFFC2410C),
              borderColor: const Color(0xFFFB923C),
              medal: '🥉',
              rankLabel: '৩য়',
            ),
        ];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141416) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5),
        ),
        boxShadow: isDark
            ? []
            : [const BoxShadow(color: Color(0x08000000), blurRadius: 4)],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 14, 10, 0),
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
                                isPro: slot.user.isPro,
                                showBorder: true,
                                borderColor: slot.borderColor,
                                borderWidth: slot.rank == 1 ? 2.5 : 2.0,
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
                              fontWeight: FontWeight.w800,
                              fontSize: slot.rank == 1 ? 13.5 : 12.5,
                              fontFamily: 'Anek Bangla',
                              color: isDark
                                  ? Colors.white
                                  : const Color(0xFF111827),
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
                            fontSize: slot.rank == 1 ? 13 : 12,
                            fontWeight: FontWeight.w900,
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
                              colors: isDark
                                  ? [
                                      slot.startColor.withValues(alpha: 0.35),
                                      slot.endColor.withValues(alpha: 0.15),
                                    ]
                                  : [
                                      slot.startColor.withValues(alpha: 0.22),
                                      slot.endColor.withValues(alpha: 0.08),
                                    ],
                            ),
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(12),
                            ),
                            border: Border(
                              top: BorderSide(
                                color: slot.startColor,
                                width: 2.5,
                              ),
                              left: BorderSide(
                                color: slot.startColor.withValues(alpha: 0.4),
                                width: 1,
                              ),
                              right: BorderSide(
                                color: slot.startColor.withValues(alpha: 0.4),
                                width: 1,
                              ),
                            ),
                          ),
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  slot.medal,
                                  style: TextStyle(
                                    fontSize: slot.rank == 1 ? 22 : 18,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  slot.rankLabel,
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w900,
                                    fontFamily: 'Anek Bangla',
                                    color: slot.accentColor,
                                  ),
                                ),
                              ],
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
