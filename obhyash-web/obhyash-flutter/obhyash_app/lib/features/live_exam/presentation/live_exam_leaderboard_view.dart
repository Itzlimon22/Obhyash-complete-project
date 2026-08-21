import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/models.dart';
import '../providers/live_exam_providers.dart';
import '../../../../core/presentation/widgets/skeleton_loading.dart';
import '../../../../core/presentation/widgets/user_avatar.dart';

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

  String _formatTime(int? seconds, DateTime? start, DateTime? submit) {
    if (seconds != null && seconds > 0) {
      final mins = seconds ~/ 60;
      final secs = seconds % 60;
      return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')} মি.';
    }
    if (start != null && submit != null) {
      final diff = submit.difference(start).inSeconds;
      if (diff > 0 && diff <= 86400) {
        final mins = diff ~/ 60;
        final secs = diff % 60;
        return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')} মি.';
      }
    }
    if (submit != null) {
      final local = submit.toLocal();
      final hour = local.hour > 12
          ? local.hour - 12
          : (local.hour == 0 ? 12 : local.hour);
      final period = local.hour >= 12 ? 'PM' : 'AM';
      return '${hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')} $period';
    }
    return '--';
  }

  Widget _buildRankBadge(int rank, bool isDark) {
    if (rank == 1) {
      return Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: const Color(0xFFF59E0B),
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFF59E0B).withValues(alpha: 0.35),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        alignment: Alignment.center,
        child: const Text(
          '1',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w900,
            color: Colors.white,
            fontFamily: 'Anek Bangla',
          ),
        ),
      );
    } else if (rank == 2) {
      return Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: const Color(0xFF94A3B8),
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.center,
        child: const Text(
          '2',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w900,
            color: Colors.white,
            fontFamily: 'Anek Bangla',
          ),
        ),
      );
    } else if (rank == 3) {
      return Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: const Color(0xFFB45309),
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.center,
        child: const Text(
          '3',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w900,
            color: Colors.white,
            fontFamily: 'Anek Bangla',
          ),
        ),
      );
    }
    return Text(
      '#$rank',
      style: TextStyle(
        fontSize: 12.5,
        fontWeight: FontWeight.w800,
        fontFamily: 'Anek Bangla',
        color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
      ),
    );
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
              ((e.userId != null && e.userId == currentUser.id) ||
                  e.userName ==
                      (currentUser.userMetadata?['full_name'] ??
                          currentUser.email)));
          final myEntry = myIndex != -1 ? entries[myIndex] : null;
          final myRank = myIndex != -1 ? myIndex + 1 : null;

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
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
                      border: Border.all(
                          color: const Color(0xFFF59E0B)
                              .withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.clock,
                            color: Color(0xFFD97706), size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'মেধা তালিকা পর্যালোচনাধীন রয়েছে। এডমিন কর্তৃক চূড়ান্ত প্রকাশের পর এখানে সকলের তালিকা দৃশ্যমান হবে।',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark
                                  ? Colors.amber[200]
                                  : const Color(0xFF92400E),
                              fontFamily: 'HindSiliguri',
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Current User Spotlight Card
                if (myEntry != null && myRank != null) ...[
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF18181B) : Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF27272A)
                            : const Color(0xFFCBD5E1),
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
                            color: isDark
                                ? const Color(0xFF27272A)
                                : const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF3F3F46)
                                  : const Color(0xFFCBD5E1),
                            ),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '#$myRank',
                            style: TextStyle(
                              color: isDark
                                  ? const Color(0xFFF8FAFC)
                                  : const Color(0xFF0F172A),
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
                                  color: isDark
                                      ? const Color(0xFFA1A1AA)
                                      : const Color(0xFF64748B),
                                  fontSize: 11,
                                  fontFamily: 'Anek Bangla',
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 1),
                              Text(
                                myEntry.userName,
                                style: TextStyle(
                                  color: isDark
                                      ? const Color(0xFFF8FAFC)
                                      : const Color(0xFF0F172A),
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
                                  color: isDark
                                      ? const Color(0xFF71717A)
                                      : const Color(0xFF94A3B8),
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
                            color: isDark
                                ? const Color(0xFF27272A)
                                : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF3F3F46)
                                  : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Column(
                            children: [
                              Text(
                                myEntry.score % 1 == 0
                                    ? '${myEntry.score.toInt()}'
                                    : '${myEntry.score}',
                                style: TextStyle(
                                  color: isDark
                                      ? const Color(0xFFF8FAFC)
                                      : const Color(0xFF0F172A),
                                  fontWeight: FontWeight.w900,
                                  fontSize: 17,
                                  fontFamily: 'Anek Bangla',
                                ),
                              ),
                              Text(
                                'মার্কস',
                                style: TextStyle(
                                  color: isDark
                                      ? const Color(0xFFA1A1AA)
                                      : const Color(0xFF64748B),
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
                  const SizedBox(height: 18),
                ],

                // Search Bar
                Container(
                  height: 44,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF141417) : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF27272A)
                          : const Color(0xFFE2E8F0),
                      width: 1.1,
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.search,
                          size: 16, color: Color(0xFF94A3B8)),
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
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF0F172A),
                            fontSize: 13.5,
                            fontFamily: 'Anek Bangla',
                          ),
                          decoration: const InputDecoration(
                            hintText:
                                'শিক্ষার্থী বা কলেজের নাম দিয়ে খুঁজুন...',
                            hintStyle: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 13,
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
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isDark
                                  ? const Color(0xFF27272A)
                                  : const Color(0xFFE2E8F0),
                            ),
                            child: Icon(
                              LucideIcons.x,
                              size: 13,
                              color: isDark
                                  ? const Color(0xFFA1A1AA)
                                  : const Color(0xFF64748B),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Empty Search Result Notice
                if (filteredEntries.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(32),
                    alignment: Alignment.center,
                    child: Column(
                      children: [
                        Icon(
                          LucideIcons.searchX,
                          size: 40,
                          color: isDark
                              ? const Color(0xFF3F3F46)
                              : const Color(0xFFCBD5E1),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'কোনো শিক্ষার্থী বা কলেজ পাওয়া যায়নি',
                          style: TextStyle(
                            fontSize: 14,
                            fontFamily: 'Anek Bangla',
                            color: isDark
                                ? const Color(0xFFA1A1AA)
                                : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  // ── LEADERBOARD TABLE ──────────────────────────────────
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF141417) : Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF27272A)
                            : const Color(0xFFE2E8F0),
                        width: 1.1,
                      ),
                      boxShadow: [
                        if (!isDark)
                          BoxShadow(
                            color: const Color(0x06000000),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Table Header Row
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 12),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF1C1C20)
                                  : const Color(0xFFF8FAFC),
                              border: Border(
                                bottom: BorderSide(
                                  color: isDark
                                      ? const Color(0xFF27272A)
                                      : const Color(0xFFE2E8F0),
                                  width: 1,
                                ),
                              ),
                            ),
                            child: Row(
                              children: [
                                // Rank
                                SizedBox(
                                  width: 44,
                                  child: Text(
                                    'র‍্যাংক',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontFamily: 'Anek Bangla',
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: isDark
                                          ? const Color(0xFFA1A1AA)
                                          : const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),

                                // Profile Image
                                SizedBox(
                                  width: 36,
                                  child: Text(
                                    'ছবি',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontFamily: 'Anek Bangla',
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: isDark
                                          ? const Color(0xFFA1A1AA)
                                          : const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),

                                // Name & Institute
                                Expanded(
                                  child: Text(
                                    'নাম ও প্রতিষ্ঠান',
                                    style: TextStyle(
                                      fontFamily: 'Anek Bangla',
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: isDark
                                          ? const Color(0xFFA1A1AA)
                                          : const Color(0xFF64748B),
                                    ),
                                  ),
                                ),

                                // Time
                                SizedBox(
                                  width: 65,
                                  child: Text(
                                    'সময়',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontFamily: 'Anek Bangla',
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: isDark
                                          ? const Color(0xFFA1A1AA)
                                          : const Color(0xFF64748B),
                                    ),
                                  ),
                                ),

                                // Marks
                                SizedBox(
                                  width: 50,
                                  child: Text(
                                    'মার্কস',
                                    textAlign: TextAlign.right,
                                    style: TextStyle(
                                      fontFamily: 'Anek Bangla',
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: isDark
                                          ? const Color(0xFFA1A1AA)
                                          : const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Table Body Rows (Student Results)
                          ...filteredEntries.asMap().entries.map((entry) {
                            final rank = entry.key + 1;
                            final candidate = entry.value;
                            final isMe = currentUser != null &&
                                ((candidate.userId != null &&
                                        candidate.userId == currentUser.id) ||
                                    candidate.userName ==
                                        (currentUser.userMetadata?[
                                                'full_name'] ??
                                            currentUser.email));
                            final isLast =
                                entry.key == filteredEntries.length - 1;

                            final timeText = _formatTime(
                              candidate.timeTakenSeconds,
                              candidate.startTime,
                              candidate.submitTime,
                            );

                            return Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: isMe
                                    ? const Color(0xFF059669).withValues(
                                        alpha: isDark ? 0.16 : 0.08)
                                    : (entry.key.isEven
                                        ? Colors.transparent
                                        : (isDark
                                            ? const Color(0xFF18181D)
                                            : const Color(0xFFFAFAFC))),
                                border: isLast
                                    ? null
                                    : Border(
                                        bottom: BorderSide(
                                          color: isDark
                                              ? const Color(0xFF1F1F24)
                                              : const Color(0xFFF1F5F9),
                                          width: 1,
                                        ),
                                      ),
                              ),
                              child: Row(
                                children: [
                                  // 1. Rank
                                  SizedBox(
                                    width: 44,
                                    child: Center(
                                      child: _buildRankBadge(rank, isDark),
                                    ),
                                  ),
                                  const SizedBox(width: 8),

                                  // 2. Profile Image
                                  SizedBox(
                                    width: 36,
                                    child: Center(
                                      child: UserAvatar(
                                        avatarUrl: candidate.avatarUrl,
                                        name: candidate.userName,
                                        id: candidate.userId,
                                        size: 34,
                                        useDiceBearFallback: true,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),

                                  // 3. Name & Institute
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Row(
                                          children: [
                                            Flexible(
                                              child: Text(
                                                candidate.userName,
                                                style: TextStyle(
                                                  fontSize: 13.5,
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
                                              const SizedBox(width: 4),
                                              Container(
                                                padding: const EdgeInsets
                                                    .symmetric(
                                                  horizontal: 5,
                                                  vertical: 1.5,
                                                ),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFF059669)
                                                      .withValues(alpha: 0.2),
                                                  borderRadius:
                                                      BorderRadius.circular(4),
                                                ),
                                                child: const Text(
                                                  'আপনি',
                                                  style: TextStyle(
                                                    fontSize: 9.5,
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
                                            fontSize: 11,
                                            fontFamily: 'Anek Bangla',
                                            fontWeight: FontWeight.w500,
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

                                  // 4. Time
                                  SizedBox(
                                    width: 65,
                                    child: Text(
                                      timeText,
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w600,
                                        fontFamily: 'Anek Bangla',
                                        color: isDark
                                            ? const Color(0xFFCBD5E1)
                                            : const Color(0xFF475569),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),

                                  // 5. Marks
                                  SizedBox(
                                    width: 50,
                                    child: Text(
                                      candidate.score % 1 == 0
                                          ? '${candidate.score.toInt()}'
                                          : '${candidate.score}',
                                      textAlign: TextAlign.right,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w900,
                                        fontFamily: 'Anek Bangla',
                                        color: isDark
                                            ? const Color(0xFF34D399)
                                            : const Color(0xFF059669),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }
}
