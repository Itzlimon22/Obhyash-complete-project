import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/models.dart';
import '../providers/live_exam_providers.dart';

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
        loading: () => const Center(
          child: CircularProgressIndicator(color: Color(0xFF0B6B42)),
        ),
        error: (err, _) => Center(child: Text('Error: $err')),
        data: (entries) {
          if (entries.isEmpty) {
            return const Center(child: Text('কোনো মেধা তালিকা পাওয়া যায়নি'));
          }

          final filteredEntries = entries.where((e) {
            final name = e.userName.toLowerCase();
            final institute = e.userInstitute.toLowerCase();
            final q = _searchQuery.toLowerCase();
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
                // Current User Spotlight Card (If candidate took the exam)
                if (myEntry != null && myRank != null) ...[
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0B6B42), Color(0xFF0F766E)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0B6B42).withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withOpacity(0.3)),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '#$myRank',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'আপনার অবস্থান',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                myEntry.userName,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                'মোট ${entries.length} জনের মধ্যে $myRankম স্থান',
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 11,
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
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Column(
                            children: [
                              Text(
                                '${myEntry.score}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                ),
                              ),
                              const Text(
                                'নম্বর',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 10,
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

                // Search Bar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF27272A)
                          : const Color(0xFFE4E4E7),
                    ),
                  ),
                  child: TextField(
                    onChanged: (val) {
                      setState(() {
                        _searchQuery = val;
                      });
                    },
                    style: TextStyle(
                      color: isDark ? Colors.white : Colors.black87,
                      fontSize: 13,
                    ),
                    decoration: const InputDecoration(
                      hintText: 'নাম বা প্রতিষ্ঠান দিয়ে খুঁজুন...',
                      hintStyle: TextStyle(color: Colors.grey, fontSize: 13),
                      prefixIcon: Icon(LucideIcons.search, size: 16, color: Colors.grey),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Candidates List
                ...filteredEntries.asMap().entries.map((entry) {
                  final rank = entry.key + 1;
                  final candidate = entry.value;
                  final isMe = currentUser != null &&
                      (candidate.userName ==
                          (currentUser.userMetadata?['full_name'] ??
                              currentUser.email));

                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isMe
                          ? const Color(0xFF0B6B42).withOpacity(0.08)
                          : (isDark ? const Color(0xFF1C1C1E) : Colors.white),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isMe
                            ? const Color(0xFF0B6B42).withOpacity(0.4)
                            : (isDark
                                ? const Color(0xFF27272A)
                                : const Color(0xFFF4F4F5)),
                      ),
                    ),
                    child: Row(
                      children: [
                        // Rank Badge
                        Container(
                          width: 30,
                          height: 30,
                          decoration: BoxDecoration(
                            color: rank == 1
                                ? const Color(0xFFF59E0B)
                                : (rank == 2
                                    ? const Color(0xFF94A3B8)
                                    : (rank == 3
                                        ? const Color(0xFFB45309)
                                        : (isDark
                                            ? const Color(0xFF27272A)
                                            : const Color(0xFFF4F4F5)))),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '$rank',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: rank <= 3
                                  ? Colors.white
                                  : (isDark ? Colors.white : Colors.black87),
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
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: isDark
                                            ? Colors.white
                                            : Colors.black87,
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
                                        color: const Color(0xFF0B6B42)
                                            .withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text(
                                        'আপনি',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF0B6B42),
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              if (candidate.userInstitute.isNotEmpty)
                                Text(
                                  candidate.userInstitute,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark
                                        ? Colors.white54
                                        : Colors.black54,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                            ],
                          ),
                        ),

                        // Correct / Wrong summary
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${candidate.correctCount} সঠিক',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF10B981),
                                ),
                              ),
                              Text(
                                '${candidate.wrongCount} ভুল',
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: Color(0xFFEF4444),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Score
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0B6B42).withOpacity(0.08),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${candidate.score}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0B6B42),
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
              color: color.withOpacity(0.15),
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
