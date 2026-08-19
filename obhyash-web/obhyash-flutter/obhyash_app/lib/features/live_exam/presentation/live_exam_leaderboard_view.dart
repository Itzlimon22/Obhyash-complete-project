import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/models.dart';
import '../providers/live_exam_providers.dart';
import '../../../../core/presentation/widgets/skeleton_loading.dart';

class LiveExamLeaderboardView extends ConsumerStatefulWidget {
  final String examId;
  final LiveExam? exam;

  const LiveExamLeaderboardView({
    super.key,
    required this.examId,
    this.exam,
  });

  @override
  ConsumerState<LiveExamLeaderboardView> createState() =>
      _LiveExamLeaderboardViewState();
}

class _LiveExamLeaderboardViewState
    extends ConsumerState<LiveExamLeaderboardView> {
  String _searchQuery = '';
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final leaderboardAsync =
        ref.watch(liveExamLeaderboardProvider(widget.examId));
    final currentUser = Supabase.instance.client.auth.currentUser;

    return Scaffold(
      backgroundColor:
          isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : Colors.black87,
          ),
          onPressed: () => context.pop(),
        ),
        title: Column(
          children: [
            const Text(
              'অফিসিয়াল মেধা তালিকা',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (widget.exam != null)
              Text(
                widget.exam!.title,
                style: TextStyle(
                  fontSize: 11,
                  color: isDark ? Colors.white54 : Colors.black54,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
          ],
        ),
        centerTitle: true,
      ),
      body: leaderboardAsync.when(
        loading: () => const LeaderboardSkeleton(),
        error: (err, _) => Center(child: Text('Error: $err')),
        data: (entries) {
          if (entries.isEmpty) {
            return const Center(child: Text('কোনো মেধা তালিকা পাওয়া যায়নি'));
          }

          final q = _searchQuery.trim().toLowerCase();
          final filteredEntries = q.isEmpty
              ? entries
              : entries.where((e) {
                  final name = e.userName.toLowerCase();
                  final institute = e.userInstitute.toLowerCase();
                  return name.contains(q) || institute.contains(q);
                }).toList();

          // Find current user entry
          final myIndex = entries.indexWhere((e) =>
              currentUser != null &&
              (e.userName == (currentUser.userMetadata?['full_name'] ?? currentUser.email)));
          final myEntry = myIndex != -1 ? entries[myIndex] : null;
          final myRank = myIndex != -1 ? myIndex + 1 : null;

          final top3 = entries.take(3).toList();

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Notice if leaderboard is in review / unpublished
                if (widget.exam?.isLeaderboardPublished == false)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.clock, color: Color(0xFFD97706), size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'মেধা তালিকা পর্যালোচনাধীন রয়েছে। এডমিন কর্তৃক চূড়ান্ত প্রকাশের পর এখানে সকলের তালিকা দৃশ্যমান হবে।',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? Colors.amber[200] : const Color(0xFF92400E),
                              fontFamily: 'HindSiliguri',
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Current User Spotlight Card in Premium Grey
                if (myEntry != null && myRank != null) ...[
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF18181B) : Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: isDark ? const Color(0xFF27272A) : const Color(0xFFCBD5E1),
                        width: 1.2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: isDark
                              ? Colors.black.withValues(alpha: 0.3)
                              : const Color(0x0A000000),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFCBD5E1),
                            ),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '#$myRank',
                            style: TextStyle(
                              color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Anek Bangla',
                              fontSize: 17,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'আপনার অবস্থান',
                                style: TextStyle(
                                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                                  fontSize: 11,
                                  fontFamily: 'Anek Bangla',
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 1),
                              Text(
                                myEntry.userName,
                                style: TextStyle(
                                  color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                                  fontSize: 15.5,
                                  fontWeight: FontWeight.w900,
                                  fontFamily: 'Anek Bangla',
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                'মোট ${entries.length} জনের মধ্যে $myRankম স্থান',
                                style: TextStyle(
                                  color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
                                  fontSize: 11,
                                  fontFamily: 'Anek Bangla',
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Column(
                            children: [
                              Text(
                                '${myEntry.score}',
                                style: TextStyle(
                                  color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                                  fontWeight: FontWeight.w900,
                                  fontSize: 17,
                                  fontFamily: 'Anek Bangla',
                                ),
                              ),
                              Text(
                                'মার্কস',
                                style: TextStyle(
                                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                                  fontSize: 10,
                                  fontFamily: 'Anek Bangla',
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                // Top 3 Podium
                if (top3.length >= 3) ...[
                  const Center(
                    child: Text(
                      'টপ ৩ স্থানাধিকারী',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // 2nd Place
                      Expanded(
                        child: _buildPodiumItem(
                          rank: 2,
                          name: top3[1].userName,
                          institute: top3[1].userInstitute,
                          score: top3[1].score,
                          color: const Color(0xFF94A3B8),
                          isDark: isDark,
                        ),
                      ),
                      const SizedBox(width: 8),

                      // 1st Place (Champion)
                      Expanded(
                        child: _buildPodiumItem(
                          rank: 1,
                          name: top3[0].userName,
                          institute: top3[0].userInstitute,
                          score: top3[0].score,
                          color: const Color(0xFFF59E0B),
                          isDark: isDark,
                          isChampion: true,
                        ),
                      ),
                      const SizedBox(width: 8),

                      // 3rd Place
                      Expanded(
                        child: _buildPodiumItem(
                          rank: 3,
                          name: top3[2].userName,
                          institute: top3[2].userInstitute,
                          score: top3[2].score,
                          color: const Color(0xFFB45309),
                          isDark: isDark,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],

                // Reduced Size Compact Search Bar
                Container(
                  height: 42,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF141417) : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF27272A)
                          : const Color(0xFFE2E8F0),
                      width: 1.1,
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.search, size: 15, color: Color(0xFF94A3B8)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) {
                            setState(() {
                              _searchQuery = val;
                            });
                          },
                          style: TextStyle(
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                            fontSize: 13,
                            fontFamily: 'Anek Bangla',
                          ),
                          decoration: const InputDecoration(
                            hintText: 'শিক্ষার্থী বা কলেজের নাম দিয়ে খুঁজুন...',
                            hintStyle: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 12.5,
                              fontFamily: 'Anek Bangla',
                            ),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                      ),
                      if (_searchQuery.isNotEmpty)
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _searchController.clear();
                              _searchQuery = '';
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.all(3),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                            ),
                            child: Icon(
                              LucideIcons.x,
                              size: 13,
                              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Empty Search Result Notice
                if (filteredEntries.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(28),
                    alignment: Alignment.center,
                    child: Column(
                      children: [
                        Icon(
                          LucideIcons.searchX,
                          size: 36,
                          color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFCBD5E1),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'কোনো শিক্ষার্থী বা কলেজ পাওয়া যায়নি',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontFamily: 'Anek Bangla',
                            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Candidates List
                ...filteredEntries.asMap().entries.map((entry) {
                  final rank = entry.key + 1;
                  final candidate = entry.value;
                  final isMe = currentUser != null &&
                      (candidate.userName ==
                          (currentUser.userMetadata?['full_name'] ??
                              currentUser.email));

                  final totalAttempted = candidate.correctCount + candidate.wrongCount;
                  final accuracy = totalAttempted > 0
                      ? ((candidate.correctCount / totalAttempted) * 100).round()
                      : (candidate.score > 0 ? 100 : 0);

                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: isMe
                          ? const Color(0xFF059669).withValues(alpha: isDark ? 0.12 : 0.06)
                          : (isDark ? const Color(0xFF141417) : Colors.white),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: isMe
                            ? const Color(0xFF059669).withValues(alpha: isDark ? 0.4 : 0.25)
                            : (isDark
                                ? const Color(0xFF27272A)
                                : const Color(0xFFE2E8F0)),
                        width: 1.2,
                      ),
                      boxShadow: [
                        if (!isDark)
                          BoxShadow(
                            color: const Color(0x06000000),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                      ],
                    ),
                    child: Row(
                      children: [
                        // Rank Badge
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: rank == 1
                                ? const Color(0xFFF59E0B)
                                : (rank == 2
                                    ? const Color(0xFF94A3B8)
                                    : (rank == 3
                                        ? const Color(0xFFB45309)
                                        : (isDark
                                            ? const Color(0xFF27272A)
                                            : const Color(0xFFF1F5F9)))),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '#$rank',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'Anek Bangla',
                              color: rank <= 3
                                  ? Colors.white
                                  : (isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),

                        // Name & Institute
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      candidate.userName,
                                      style: TextStyle(
                                        fontSize: 14.5,
                                        fontWeight: FontWeight.w800,
                                        fontFamily: 'Anek Bangla',
                                        color: isDark
                                            ? const Color(0xFFF8FAFC)
                                            : const Color(0xFF0F172A),
                                      ),
                                      maxLines: 1,
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
                                        color: const Color(0xFF059669)
                                            .withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(5),
                                      ),
                                      child: const Text(
                                        'আপনি',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF059669),
                                          fontFamily: 'Anek Bangla',
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                candidate.userInstitute.isNotEmpty
                                    ? candidate.userInstitute
                                    : 'প্রতিষ্ঠান নেই',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontFamily: 'Anek Bangla',
                                  color: isDark
                                      ? const Color(0xFFA1A1AA)
                                      : const Color(0xFF64748B),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(width: 8),

                        // Accuracy info
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '$accuracy% নির্ভুলতা',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Anek Bangla',
                                color: accuracy >= 80
                                    ? const Color(0xFF10B981)
                                    : (accuracy >= 50
                                        ? const Color(0xFFF59E0B)
                                        : const Color(0xFFEF4444)),
                              ),
                            ),
                            const SizedBox(height: 1),
                            Text(
                              '${candidate.correctCount} সঠিক • ${candidate.wrongCount} ভুল',
                              style: TextStyle(
                                fontSize: 10,
                                fontFamily: 'Anek Bangla',
                                color: isDark
                                    ? const Color(0xFF71717A)
                                    : const Color(0xFF94A3B8),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(width: 10),

                        // Marks Got / Score Pill
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF1F2937)
                                : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF374151)
                                  : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Text(
                            '${candidate.score} মার্কস',
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Anek Bangla',
                              color: isDark
                                  ? const Color(0xFFF8FAFC)
                                  : const Color(0xFF0F172A),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildPodiumItem({
    required int rank,
    required String name,
    required String institute,
    required num score,
    required Color color,
    required bool isDark,
    bool isChampion = false,
  }) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: 8,
        vertical: isChampion ? 16 : 12,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isChampion ? color : (isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7)),
          width: isChampion ? 2 : 1,
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              isChampion ? '👑' : '$rank',
              style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            name,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : Colors.black87,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
          Text(
            institute.isNotEmpty ? institute : 'শিক্ষার্থী',
            style: const TextStyle(fontSize: 10, color: Colors.grey),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '$score',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
