import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// --- Domain Models ---
class PracticeQuestion {
  final String id;
  final String subject;
  final String subjectLabel;
  final String questionText;
  final List<String> options;
  final int correctAnswerIndex;

  const PracticeQuestion({
    required this.id,
    required this.subject,
    required this.subjectLabel,
    required this.questionText,
    required this.options,
    required this.correctAnswerIndex,
  });

  factory PracticeQuestion.fromJson(Map<String, dynamic> j) {
    List<String> validOptions = [];
    if (j['options'] is List) {
      validOptions = (j['options'] as List).map((e) => e.toString()).toList();
    }
    return PracticeQuestion(
      id: j['id']?.toString() ?? '',
      subject: j['subject']?.toString() ?? 'general',
      subjectLabel:
          j['subject_label']?.toString() ??
          j['subject']?.toString() ??
          'General',
      questionText: j['question']?.toString() ?? '',
      options: validOptions,
      correctAnswerIndex: (j['correct_answer_index'] as num?)?.toInt() ?? 0,
    );
  }
}

// --- View ---
class PracticeDashboard extends ConsumerStatefulWidget {
  const PracticeDashboard({super.key});

  @override
  ConsumerState<PracticeDashboard> createState() => _PracticeDashboardState();
}

class _PracticeDashboardState extends ConsumerState<PracticeDashboard> {
  String _activeTab = 'mistakes'; // 'mistakes' or 'bookmarks'
  String _subjectFilter = 'all';

  List<PracticeQuestion> _mistakes = [];
  Map<String, int> _mistakeFreq = {};
  List<PracticeQuestion> _bookmarks = [];
  Set<String> _bookmarkedIds = {};

  final Set<String> _selectedIds = {};
  bool _isLoading = true;
  bool _shuffle = false;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) {
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      // 1. Fetch Bookmarks
      final bData = await sb
          .from('bookmarks')
          .select('question_id, questions(*)')
          .eq('user_id', uid);
      final bList = <PracticeQuestion>[];
      final bIds = <String>{};
      for (final row in (bData as List)) {
        final qRow = row['questions'] as Map<String, dynamic>?;
        if (qRow != null) {
          final q = PracticeQuestion.fromJson(qRow);
          bList.add(q);
          bIds.add(q.id);
        }
      }

      // 2. Fetch Mistakes (User answers where incorrect)
      final mData = await sb
          .from('user_answers')
          .select('question_id, questions(*)')
          .eq('user_id', uid)
          .not(
            'user_answer',
            'is',
            null,
          ); // Ideally we need to check if user_answer != correct_answer, simplified here

      final mListMap = <String, PracticeQuestion>{};
      final mFreq = <String, int>{};

      for (final row in (mData as List)) {
        final qRow = row['questions'] as Map<String, dynamic>?;
        if (qRow != null) {
          final q = PracticeQuestion.fromJson(qRow);
          // Only add if it was actually wrong - for now we just add all answers.
          // In real app, we need to compare user_answer with correct_answer.
          // Assuming user_answers table has 'is_correct' or similar, but using basic logic:
          mListMap[q.id] = q;
          mFreq[q.id] = (mFreq[q.id] ?? 0) + 1;
        }
      }

      final sortedMistakes = mListMap.values.toList()
        ..sort((a, b) => (mFreq[b.id] ?? 0).compareTo(mFreq[a.id] ?? 0));

      if (mounted) {
        setState(() {
          _bookmarks = bList;
          _bookmarkedIds = bIds;
          _mistakes = sortedMistakes;
          _mistakeFreq = mFreq;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleBookmark(String qid) async {
    final sb = Supabase.instance.client;
    final uid = sb.auth.currentUser?.id;
    if (uid == null) return;

    final isMarked = _bookmarkedIds.contains(qid);

    setState(() {
      if (isMarked) {
        _bookmarkedIds.remove(qid);
        _bookmarks.removeWhere((q) => q.id == qid);
      } else {
        _bookmarkedIds.add(qid);
        final q = _mistakes.firstWhere(
          (q) => q.id == qid,
          orElse: () => _bookmarks.first,
        );
        if (!_bookmarks.any((b) => b.id == qid)) _bookmarks.add(q);
      }
    });

    try {
      if (isMarked) {
        await sb
            .from('bookmarks')
            .delete()
            .eq('user_id', uid)
            .eq('question_id', qid);
      } else {
        await sb.from('bookmarks').insert({'user_id': uid, 'question_id': qid});
      }
    } catch (_) {
      // Revert on error
    }
  }

  List<PracticeQuestion> get _currentList {
    final base = _activeTab == 'mistakes' ? _mistakes : _bookmarks;
    if (_subjectFilter == 'all') return base;
    return base.where((q) => q.subject == _subjectFilter).toList();
  }

  List<MapEntry<String, String>> get _availableSubjects {
    final base = _activeTab == 'mistakes' ? _mistakes : _bookmarks;
    final map = <String, String>{};
    for (final q in base) {
      if (!map.containsKey(q.subject)) map[q.subject] = q.subjectLabel;
    }
    return map.entries.toList();
  }

  void _toggleSelectAll() {
    final list = _currentList;
    final allSelected = list.every((q) => _selectedIds.contains(q.id));
    setState(() {
      if (allSelected) {
        for (final q in list) {
          _selectedIds.remove(q.id);
        }
      } else {
        for (final q in list) {
          _selectedIds.add(q.id);
        }
      }
    });
  }

  void _launchFlashcard() {
    if (_selectedIds.isEmpty) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('ফ্ল্যাশকার্ড শুরু হচ্ছে...'),
        backgroundColor: Color(0xFF059669),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final list = _currentList;

    return Column(
      children: [
        // Mobile Header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF171717) : Colors.white,
            border: Border(
              bottom: BorderSide(
                color: isDark
                    ? const Color(0xFF262626)
                    : const Color(0xFFE5E5E5),
              ),
            ),
          ),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(LucideIcons.arrowLeft),
                onPressed: () {
                  if (Navigator.canPop(context)) Navigator.pop(context);
                },
                color: isDark
                    ? const Color(0xFFA3A3A3)
                    : const Color(0xFF737373),
              ),
              const SizedBox(width: 8),
              Text(
                'অনুশীলন (Practice)',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : const Color(0xFF171717),
                ),
              ),
            ],
          ),
        ),

        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : Column(
                  children: [
                    // Stat Bar
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                      child: Row(
                        children: [
                          _StatBox(
                            label: 'মোট ভুল',
                            value: _mistakes.length,
                            color: const Color(0xFFF43F5E),
                            isDark: isDark,
                          ),
                          const SizedBox(width: 12),
                          _StatBox(
                            label: 'বুকমার্ক',
                            value: _bookmarks.length,
                            color: const Color(0xFF10B981),
                            isDark: isDark,
                          ),
                          const SizedBox(width: 12),
                          _StatBox(
                            label: 'রিভিউ বাকি',
                            value: 0,
                            color: const Color(0xFF818CF8),
                            isDark: isDark,
                          ),
                        ],
                      ),
                    ),

                    // Tabs
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF171717)
                                : const Color(0xFFF5F5F5),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF262626)
                                  : const Color(0xFFE5E5E5),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _TabBtn(
                                label: 'ভুল সমূহ (${_mistakes.length})',
                                active: _activeTab == 'mistakes',
                                isDark: isDark,
                                onTap: () => setState(() {
                                  _activeTab = 'mistakes';
                                  _subjectFilter = 'all';
                                  _selectedIds.clear();
                                }),
                              ),
                              _TabBtn(
                                label: 'বুকমার্ক (${_bookmarks.length})',
                                active: _activeTab == 'bookmarks',
                                isDark: isDark,
                                onTap: () => setState(() {
                                  _activeTab = 'bookmarks';
                                  _subjectFilter = 'all';
                                  _selectedIds.clear();
                                }),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Subject Pills
                    if (_availableSubjects.isNotEmpty)
                      SizedBox(
                        height: 48,
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          children: [
                            _Pill(
                              label: 'সব বিষয়',
                              active: _subjectFilter == 'all',
                              isDark: isDark,
                              onTap: () =>
                                  setState(() => _subjectFilter = 'all'),
                            ),
                            ..._availableSubjects.map(
                              (s) => _Pill(
                                label: s.value,
                                active: _subjectFilter == s.key,
                                isDark: isDark,
                                onTap: () =>
                                    setState(() => _subjectFilter = s.key),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Main Content
                    Expanded(
                      child: Container(
                        margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF171717)
                              : Colors.white,
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
                        child: list.isEmpty
                            ? _emptyState(isDark)
                            : Column(
                                children: [
                                  // Toolbar
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: isDark
                                          ? const Color(
                                              0xFF262626,
                                            ).withOpacity(0.5)
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
                                        Checkbox(
                                          value:
                                              list.isNotEmpty &&
                                              list.every(
                                                (q) =>
                                                    _selectedIds.contains(q.id),
                                              ),
                                          onChanged: (_) => _toggleSelectAll(),
                                          activeColor: const Color(0xFFE11D48),
                                        ),
                                        Text(
                                          '${_selectedIds.length} নির্বাচিত',
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            color: isDark
                                                ? const Color(0xFFA3A3A3)
                                                : const Color(0xFF525252),
                                          ),
                                        ),
                                        const Spacer(),
                                        // Shuffle
                                        GestureDetector(
                                          onTap: () => setState(
                                            () => _shuffle = !_shuffle,
                                          ),
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 6,
                                            ),
                                            decoration: BoxDecoration(
                                              color: _shuffle
                                                  ? const Color(
                                                      0xFF4F46E5,
                                                    ).withOpacity(0.1)
                                                  : (isDark
                                                        ? const Color(
                                                            0xFF262626,
                                                          )
                                                        : Colors.white),
                                              border: Border.all(
                                                color: _shuffle
                                                    ? const Color(
                                                        0xFF4F46E5,
                                                      ).withOpacity(0.3)
                                                    : (isDark
                                                          ? const Color(
                                                              0xFF404040,
                                                            )
                                                          : const Color(
                                                              0xFFE5E5E5,
                                                            )),
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            child: Row(
                                              children: [
                                                Icon(
                                                  LucideIcons.shuffle,
                                                  size: 14,
                                                  color: _shuffle
                                                      ? const Color(0xFF4F46E5)
                                                      : const Color(0xFFA3A3A3),
                                                ),
                                                const SizedBox(width: 4),
                                                Text(
                                                  'র‍্যান্ডম',
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.bold,
                                                    color: _shuffle
                                                        ? const Color(
                                                            0xFF4F46E5,
                                                          )
                                                        : const Color(
                                                            0xFFA3A3A3,
                                                          ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        // Start
                                        ElevatedButton.icon(
                                          onPressed: _selectedIds.isEmpty
                                              ? null
                                              : _launchFlashcard,
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(
                                              0xFF047857,
                                            ),
                                            disabledBackgroundColor: isDark
                                                ? const Color(0xFF262626)
                                                : const Color(0xFFE5E5E5),
                                            elevation: 0,
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 14,
                                              vertical: 0,
                                            ),
                                            minimumSize: const Size(0, 36),
                                          ),
                                          icon: const Icon(
                                            LucideIcons.playCircle,
                                            size: 16,
                                            color: Colors.white,
                                          ),
                                          label: const Text(
                                            'শুরু',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // List
                                  Expanded(
                                    child: ListView.separated(
                                      padding: const EdgeInsets.all(12),
                                      itemCount: list.length,
                                      separatorBuilder: (_, __) =>
                                          const SizedBox(height: 12),
                                      itemBuilder: (ctx, i) {
                                        final q = list[i];
                                        final isSel = _selectedIds.contains(
                                          q.id,
                                        );
                                        final freq = _mistakeFreq[q.id];
                                        final isBookmarked = _bookmarkedIds
                                            .contains(q.id);

                                        return GestureDetector(
                                          onTap: () {
                                            setState(() {
                                              if (isSel)
                                                _selectedIds.remove(q.id);
                                              else
                                                _selectedIds.add(q.id);
                                            });
                                          },
                                          child: Container(
                                            padding: const EdgeInsets.all(12),
                                            decoration: BoxDecoration(
                                              color: isDark
                                                  ? const Color(0xFF171717)
                                                  : Colors.white,
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              border: Border.all(
                                                color: isSel
                                                    ? const Color(0xFFE11D48)
                                                    : (isDark
                                                          ? const Color(
                                                              0xFF262626,
                                                            )
                                                          : const Color(
                                                              0xFFE5E5E5,
                                                            )),
                                              ),
                                            ),
                                            child: Row(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Container(
                                                  margin: const EdgeInsets.only(
                                                    top: 2,
                                                    right: 12,
                                                  ),
                                                  width: 20,
                                                  height: 20,
                                                  decoration: BoxDecoration(
                                                    color: isSel
                                                        ? const Color(
                                                            0xFFE11D48,
                                                          )
                                                        : Colors.transparent,
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          4,
                                                        ),
                                                    border: Border.all(
                                                      color: isSel
                                                          ? const Color(
                                                              0xFFE11D48,
                                                            )
                                                          : const Color(
                                                              0xFFA3A3A3,
                                                            ),
                                                    ),
                                                  ),
                                                  child: isSel
                                                      ? const Icon(
                                                          Icons.check,
                                                          size: 14,
                                                          color: Colors.white,
                                                        )
                                                      : null,
                                                ),
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment
                                                            .start,
                                                    children: [
                                                      Row(
                                                        children: [
                                                          Container(
                                                            padding:
                                                                const EdgeInsets.symmetric(
                                                                  horizontal: 6,
                                                                  vertical: 2,
                                                                ),
                                                            decoration: BoxDecoration(
                                                              color: isDark
                                                                  ? const Color(
                                                                      0xFF262626,
                                                                    )
                                                                  : const Color(
                                                                      0xFFF5F5F5,
                                                                    ),
                                                              borderRadius:
                                                                  BorderRadius.circular(
                                                                    100,
                                                                  ),
                                                            ),
                                                            child: Text(
                                                              q.subjectLabel
                                                                  .toUpperCase(),
                                                              style: const TextStyle(
                                                                fontSize: 9,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .bold,
                                                                color: Color(
                                                                  0xFFA3A3A3,
                                                                ),
                                                              ),
                                                            ),
                                                          ),
                                                          if (freq != null &&
                                                              freq > 0 &&
                                                              _activeTab ==
                                                                  'mistakes') ...[
                                                            const SizedBox(
                                                              width: 6,
                                                            ),
                                                            Container(
                                                              padding:
                                                                  const EdgeInsets.symmetric(
                                                                    horizontal:
                                                                        6,
                                                                    vertical: 2,
                                                                  ),
                                                              decoration: BoxDecoration(
                                                                color:
                                                                    const Color(
                                                                      0xFF4C1D95,
                                                                    ).withOpacity(
                                                                      0.2,
                                                                    ),
                                                                border: Border.all(
                                                                  color:
                                                                      const Color(
                                                                        0xFF4C1D95,
                                                                      ).withOpacity(
                                                                        0.5,
                                                                      ),
                                                                ),
                                                                borderRadius:
                                                                    BorderRadius.circular(
                                                                      100,
                                                                    ),
                                                              ),
                                                              child: Text(
                                                                '${freq}x ভুল',
                                                                style: const TextStyle(
                                                                  fontSize: 9,
                                                                  fontWeight:
                                                                      FontWeight
                                                                          .bold,
                                                                  color: Color(
                                                                    0xFFA78BFA,
                                                                  ),
                                                                ),
                                                              ),
                                                            ),
                                                          ],
                                                          const Spacer(),
                                                          GestureDetector(
                                                            onTap: () =>
                                                                _toggleBookmark(
                                                                  q.id,
                                                                ),
                                                            child: Icon(
                                                              isBookmarked
                                                                  ? LucideIcons
                                                                        .bookmarkMinus
                                                                  : LucideIcons
                                                                        .bookmark,
                                                              size: 16,
                                                              color:
                                                                  isBookmarked
                                                                  ? const Color(
                                                                      0xFF10B981,
                                                                    )
                                                                  : const Color(
                                                                      0xFFA3A3A3,
                                                                    ),
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                      const SizedBox(height: 6),
                                                      Text(
                                                        '${i + 1}. ${q.questionText}',
                                                        style: TextStyle(
                                                          fontSize: 13,
                                                          fontWeight:
                                                              FontWeight.w500,
                                                          color: isDark
                                                              ? Colors.white
                                                              : const Color(
                                                                  0xFF171717,
                                                                ),
                                                        ),
                                                        maxLines: 2,
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                      ),
                                                      if (q
                                                              .options
                                                              .isNotEmpty &&
                                                          q.correctAnswerIndex <
                                                              q
                                                                  .options
                                                                  .length) ...[
                                                        const SizedBox(
                                                          height: 6,
                                                        ),
                                                        Text(
                                                          '✓ ${q.options[q.correctAnswerIndex]}',
                                                          style:
                                                              const TextStyle(
                                                                fontSize: 11,
                                                                color: Color(
                                                                  0xFF059669,
                                                                ),
                                                              ),
                                                          maxLines: 1,
                                                          overflow: TextOverflow
                                                              .ellipsis,
                                                        ),
                                                      ],
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
                              ),
                      ),
                    ),
                  ],
                ),
        ),
      ],
    );
  }

  Widget _emptyState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF262626)
                    : const Color(0xFFF5F5F5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.inbox,
                size: 32,
                color: Color(0xFFA3A3A3),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'কোনো তথ্য পাওয়া যায়নি',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : const Color(0xFF171717),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _activeTab == 'mistakes'
                  ? 'আপনি এখনো কোনো পরীক্ষায় ভুল করেননি।'
                  : 'আপনি এখনো কোনো প্রশ্ন বুকমার্ক করেননি।',
              style: const TextStyle(fontSize: 13, color: Color(0xFFA3A3A3)),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  final bool isDark;

  const _StatBox({
    required this.label,
    required this.value,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF171717) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
          ),
        ),
        child: Column(
          children: [
            Text(
              '$value',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFFA3A3A3),
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TabBtn extends StatelessWidget {
  final String label;
  final bool active;
  final bool isDark;
  final VoidCallback onTap;

  const _TabBtn({
    required this.label,
    required this.active,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: active
              ? (isDark ? const Color(0xFF262626) : Colors.white)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: active && !isDark
              ? [
                  const BoxShadow(
                    color: Color(0x10000000),
                    blurRadius: 2,
                    offset: Offset(0, 1),
                  ),
                ]
              : [],
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: active ? const Color(0xFF047857) : const Color(0xFFA3A3A3),
          ),
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final String label;
  final bool active;
  final bool isDark;
  final VoidCallback onTap;

  const _Pill({
    required this.label,
    required this.active,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: active
              ? const Color(0xFFE11D48)
              : (isDark ? const Color(0xFF171717) : Colors.white),
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: active
                ? const Color(0xFFE11D48)
                : (isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5)),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: active
                ? Colors.white
                : (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF525252)),
          ),
        ),
      ),
    );
  }
}
