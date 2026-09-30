import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/utils/bangla_name_helper.dart';
import '../../../../core/utils/app_popups.dart';

class LiveExamHistoryRecord {
  final String attemptId;
  final String liveExamId;
  final String examTitle;
  final String category;
  final double score;
  final double totalMarks;
  final int correctCount;
  final int wrongCount;
  final DateTime submitTime;
  final int durationSeconds;
  final int rank;
  final int totalParticipants;
  final DateTime? endTime;
  final bool isLeaderboardPublished;
  final bool isAnswerPublished;

  const LiveExamHistoryRecord({
    required this.attemptId,
    required this.liveExamId,
    required this.examTitle,
    required this.category,
    required this.score,
    required this.totalMarks,
    required this.correctCount,
    required this.wrongCount,
    required this.submitTime,
    required this.durationSeconds,
    required this.rank,
    required this.totalParticipants,
    this.endTime,
    this.isLeaderboardPublished = true,
    this.isAnswerPublished = false,
  });

  bool get isResultPublished {
    if (liveExamId.startsWith('mock-')) return true;
    final now = DateTime.now();
    final isEnded = endTime != null && now.isAfter(endTime!);
    return isEnded && isLeaderboardPublished;
  }
}

class LiveExamHistoryPage extends ConsumerStatefulWidget {
  const LiveExamHistoryPage({super.key});

  static String toBanglaDigits(dynamic number) {
    return BanglaNameHelper.toBanglaNumeral(number);
  }

  static String formatBanglaDate(DateTime dt) {
    const months = [
      'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'
    ];
    final day = toBanglaDigits(dt.day.toString().padLeft(2, '0'));
    final month = months[dt.month - 1];
    final year = toBanglaDigits(dt.year.toString().substring(2));
    return '$day $month $year';
  }

  static String getCategoryDisplayName(String cat) {
    switch (cat.toLowerCase().trim()) {
      case 'medical':
        return 'মেডিকেল';
      case 'engineering':
        return 'ইঞ্জিনিয়ারিং';
      case 'varsity':
      case 'varsity_a':
        return 'ভার্সিটি ক';
      case 'ssc_science':
        return 'বিজ্ঞান বিভাগ';
      case 'ssc_business':
        return 'বাণিজ্য ও মানবিক';
      case 'ssc_humanities':
        return 'মানবিক';
      case 'ssc_board':
        return 'বোর্ড স্পেশাল';
      case 'ssc_school':
        return 'শীর্ষ স্কুল';
      case 'hsc':
        return 'এইচএসসি';
      default:
        return cat.isNotEmpty ? cat : 'অন্যান্য';
    }
  }

  @override
  ConsumerState<LiveExamHistoryPage> createState() => _LiveExamHistoryPageState();
}

class _LiveExamHistoryPageState extends ConsumerState<LiveExamHistoryPage> {
  List<LiveExamHistoryRecord> _allRecords = [];
  bool _isLoading = true;
  String _selectedSection = 'all';
  bool _isTableView = false;

  static const Map<int, TableColumnWidth> _tableColumnWidths = {
    0: FixedColumnWidth(85),  // তারিখ
    1: FixedColumnWidth(170), // পরীক্ষা ও বিষয়
    2: FixedColumnWidth(85),  // স্কোর
    3: FixedColumnWidth(80),  // মেধাক্রম
    4: FixedColumnWidth(75),  // সময়
    5: FixedColumnWidth(85),  // সমাধান বাটন
  };

  @override
  void initState() {
    super.initState();
    _loadUserLiveExamHistory();
  }

  Future<void> _loadUserLiveExamHistory() async {
    setState(() => _isLoading = true);
    final supabase = Supabase.instance.client;
    final user = supabase.auth.currentUser;

    if (user == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    try {
      final attempts = await supabase
          .from('live_exam_attempts')
          .select('id, live_exam_id, score, correct_count, wrong_count, start_time, submit_time, live_exams(id, title, category, total_marks, duration_minutes, start_time, end_time, is_leaderboard_published, is_answer_published, status)')
          .eq('user_id', user.id)
          .eq('status', 'submitted')
          .order('submit_time', ascending: false);

      final List<LiveExamHistoryRecord> records = [];

      for (final a in (attempts as List)) {
        final rawMap = a as Map<String, dynamic>;
        final examData = rawMap['live_exams'] as Map<String, dynamic>?;
        final examId = rawMap['live_exam_id'] as String;
        final userScore = (rawMap['score'] as num?)?.toDouble() ?? 0.0;

        DateTime? start = rawMap['start_time'] != null ? DateTime.tryParse(rawMap['start_time']) : null;
        DateTime? submit = rawMap['submit_time'] != null ? DateTime.tryParse(rawMap['submit_time']) : null;
        DateTime? examEnd = examData?['end_time'] != null ? DateTime.tryParse(examData!['end_time'].toString())?.toLocal() : null;
        bool isLbPub = examData?['is_leaderboard_published'] as bool? ?? true;
        bool isAnsPub = examData?['is_answer_published'] as bool? ?? false;

        final isEnded = examId.startsWith('mock-') || (examEnd != null && DateTime.now().isAfter(examEnd));
        final isResultPub = isEnded && isLbPub;

        int durationSecs = 0;
        if (start != null && submit != null) {
          durationSecs = submit.difference(start).inSeconds;
        }

        // Rank count & Total count (Only calculate when result is officially published)
        int rank = 1;
        int total = 1;
        if (isResultPub) {
          try {
            final higherCount = await supabase
                .from('live_exam_attempts')
                .select('id')
                .eq('live_exam_id', examId)
                .eq('status', 'submitted')
                .gt('score', userScore)
                .count(CountOption.exact);
            rank = (higherCount.count) + 1;

            final totalCount = await supabase
                .from('live_exam_attempts')
                .select('id')
                .eq('live_exam_id', examId)
                .eq('status', 'submitted')
                .count(CountOption.exact);
            total = totalCount.count;
          } catch (_) {}
        }

        records.add(
          LiveExamHistoryRecord(
            attemptId: rawMap['id'] as String,
            liveExamId: examId,
            examTitle: examData?['title'] as String? ?? 'লাইভ পরীক্ষা',
            category: examData?['category'] as String? ?? 'admission',
            score: userScore,
            totalMarks: (examData?['total_marks'] as num?)?.toDouble() ?? 50.0,
            correctCount: (rawMap['correct_count'] as num?)?.toInt() ?? 0,
            wrongCount: (rawMap['wrong_count'] as num?)?.toInt() ?? 0,
            submitTime: submit ?? DateTime.now(),
            durationSeconds: durationSecs,
            rank: rank,
            totalParticipants: total,
            endTime: examEnd,
            isLeaderboardPublished: isLbPub,
            isAnswerPublished: isAnsPub,
          ),
        );
      }

      if (mounted) {
        setState(() {
          _allRecords = records;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('[LiveExamHistoryPage] Error loading history: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _formatDuration(int seconds) {
    final clamped = seconds < 0 ? 0 : (seconds > 86400 ? 86400 : seconds);
    final mins = clamped ~/ 60;
    final secs = clamped % 60;
    return '${LiveExamHistoryPage.toBanglaDigits(mins.toString().padLeft(2, '0'))}:${LiveExamHistoryPage.toBanglaDigits(secs.toString().padLeft(2, '0'))}';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : Colors.black;
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    // Filter distinct categories where the user participated
    final distinctCategories = _allRecords
        .map((r) => r.category.toLowerCase().trim())
        .toSet()
        .toList();

    final filteredRecords = _selectedSection == 'all'
        ? _allRecords
        : _allRecords.where((r) => r.category.toLowerCase().trim() == _selectedSection).toList();

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F1015) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF14151B) : Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : Colors.black,
            size: 22,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'আমার লাইভ পরীক্ষার ফলাফল',
          style: TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 16.5,
            fontWeight: FontWeight.w400,
            color: primaryTextColor,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isTableView ? LucideIcons.layoutList : LucideIcons.table,
              color: primaryTextColor,
              size: 20,
            ),
            tooltip: _isTableView ? 'কার্ড ভিউ' : 'টেবিল ভিউ',
            onPressed: () {
              setState(() => _isTableView = !_isTableView);
            },
          ),
          IconButton(
            icon: Icon(
              LucideIcons.refreshCw,
              color: primaryTextColor,
              size: 18,
            ),
            tooltip: 'রিফ্রেশ করুন',
            onPressed: _loadUserLiveExamHistory,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? Center(
              child: CircularProgressIndicator(
                color: isDark ? Colors.white : const Color(0xFF004633),
              ),
            )
          : _allRecords.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          LucideIcons.award,
                          size: 48,
                          color: secondaryTextColor.withValues(alpha: 0.5),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'আপনি এখনো কোনো লাইভ পরীক্ষায় অংশগ্রহণ করেননি',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                            color: secondaryTextColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : _isTableView
                  ? _buildTableView(filteredRecords, isDark, primaryTextColor, secondaryTextColor)
                  : ListView.builder(
                      physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                      padding: const EdgeInsets.fromLTRB(8, 10, 8, 24),
                      itemCount: filteredRecords.length,
                      itemBuilder: (context, index) {
                        final record = filteredRecords[index];
                        return _buildResultCard(record, isDark, primaryTextColor, secondaryTextColor);
                      },
                    ),

      // Bottom Tabs for Sections: Only shown if user participated in MORE THAN 1 section!
      bottomNavigationBar: (distinctCategories.length > 1)
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF14151B) : Colors.white,
                border: Border(
                  top: BorderSide(
                    color: isDark ? const Color(0xFF232738) : const Color(0xFFE2E8F0),
                    width: 1,
                  ),
                ),
              ),
              child: SafeArea(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: [
                      _buildBottomTab(
                        id: 'all',
                        label: 'সবগুলো (${LiveExamHistoryPage.toBanglaDigits(_allRecords.length)})',
                        isSelected: _selectedSection == 'all',
                        isDark: isDark,
                      ),
                      ...distinctCategories.map((cat) {
                        final count = _allRecords.where((r) => r.category.toLowerCase().trim() == cat).length;
                        return _buildBottomTab(
                          id: cat,
                          label: '${LiveExamHistoryPage.getCategoryDisplayName(cat)} (${LiveExamHistoryPage.toBanglaDigits(count)})',
                          isSelected: _selectedSection == cat,
                          isDark: isDark,
                        );
                      }),
                    ],
                  ),
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildBottomTab({
    required String id,
    required String label,
    required bool isSelected,
    required bool isDark,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => setState(() => _selectedSection = id),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: BoxDecoration(
            color: isSelected
                ? (isDark ? Colors.white : Colors.black)
                : (isDark ? const Color(0xFF1F2230) : const Color(0xFFF1F5F9)),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected
                  ? (isDark ? Colors.white : Colors.black)
                  : (isDark ? const Color(0xFF33374A) : const Color(0xFFCBD5E1)),
              width: 0.8,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 11.5,
              fontWeight: FontWeight.w400,
              color: isSelected
                  ? (isDark ? Colors.black : Colors.white)
                  : (isDark ? Colors.white70 : const Color(0xFF475569)),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildResultCard(
    LiveExamHistoryRecord record,
    bool isDark,
    Color primaryTextColor,
    Color secondaryTextColor,
  ) {
    final scoreFormatted =
        '${LiveExamHistoryPage.toBanglaDigits(record.score.toStringAsFixed(record.score.truncateToDouble() == record.score ? 0 : 2))} / ${LiveExamHistoryPage.toBanglaDigits(record.totalMarks.toInt())}';
    final hasScore = record.score > 0;
    final scoreColor = hasScore
        ? (isDark ? const Color(0xFF4ADE80) : const Color(0xFF16A34A))
        : primaryTextColor;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF14151B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF272A38) : const Color(0xFFE2E8F0),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            if (record.isResultPublished) {
              context.push('/live_exam_solution/${record.liveExamId}');
            } else {
              AppPopups.info(
                context,
                title: 'ফলাফল অপেক্ষমাণ ⏱️',
                message: record.endTime != null && DateTime.now().isBefore(record.endTime!)
                    ? 'পরীক্ষার গোপনীয়তা রক্ষার্থে সময়সীমা শেষ (${record.endTime!.hour.toString().padLeft(2, '0')}:${record.endTime!.minute.toString().padLeft(2, '0')}) ও ফলাফল প্রকাশের পর পূর্ণাঙ্গ সমাধান দেখতে পারবেন।'
                    : 'কর্তৃপক্ষ কর্তৃক এই পরীক্ষার ফলাফল ও সমাধান সাময়িকভাবে অপ্রকাশিত রাখা হয়েছে। প্রকাশিত হওয়ামাত্রই দেখতে পারবেন।',
              );
            }
          },
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Category Pill & Submission Date
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF1E2230)
                            : const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF2E344A)
                              : const Color(0xFFA7F3D0),
                          width: 0.8,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            LucideIcons.tag,
                            size: 11,
                            color: isDark
                                ? const Color(0xFF4ADE80)
                                : const Color(0xFF047857),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            LiveExamHistoryPage.getCategoryDisplayName(record.category),
                            style: TextStyle(
                              fontFamily: 'HindSiliguri',
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? const Color(0xFF4ADE80)
                                  : const Color(0xFF047857),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Row(
                      children: [
                        Icon(
                          LucideIcons.calendar,
                          size: 12.5,
                          color: secondaryTextColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          LiveExamHistoryPage.formatBanglaDate(record.submitTime),
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: secondaryTextColor,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                // Exam Title (Takes full width, clean Bengali HindSiliguri)
                Text(
                  record.examTitle,
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 15.5,
                    fontWeight: FontWeight.w600,
                    color: primaryTextColor,
                    height: 1.25,
                  ),
                ),

                const SizedBox(height: 12),

                // 3 Metrics in a clean cohesive box
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8.5),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1A1C24) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isDark ? const Color(0xFF262836) : const Color(0xFFF1F5F9),
                    ),
                  ),
                  child: Row(
                    children: [
                      // 1. স্কোর
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'স্কোর',
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontSize: 10.5,
                                color: secondaryTextColor,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              scoreFormatted,
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: scoreColor,
                              ),
                            ),
                            const SizedBox(height: 1),
                            Text(
                              '✓ ${LiveExamHistoryPage.toBanglaDigits(record.correctCount)}  ✗ ${LiveExamHistoryPage.toBanglaDigits(record.wrongCount)}',
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontSize: 9.5,
                                color: secondaryTextColor,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Divider
                      Container(
                        width: 1,
                        height: 38,
                        color: isDark ? const Color(0xFF2E3242) : const Color(0xFFE2E8F0),
                      ),

                      // 2. মেধাক্রম
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(left: 10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'মেধাক্রম',
                                style: TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  fontSize: 10.5,
                                  color: secondaryTextColor,
                                ),
                              ),
                              const SizedBox(height: 2),
                              if (record.isResultPublished) ...[
                                Text(
                                  '${LiveExamHistoryPage.toBanglaDigits(record.rank)} তম',
                                  style: TextStyle(
                                    fontFamily: 'HindSiliguri',
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: primaryTextColor,
                                  ),
                                ),
                                const SizedBox(height: 1),
                                Text(
                                  '${LiveExamHistoryPage.toBanglaDigits(record.totalParticipants)} জন',
                                  style: TextStyle(
                                    fontFamily: 'HindSiliguri',
                                    fontSize: 9.5,
                                    color: secondaryTextColor,
                                  ),
                                ),
                              ] else ...[
                                Text(
                                  'অপেক্ষমাণ',
                                  style: TextStyle(
                                    fontFamily: 'HindSiliguri',
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w600,
                                    color: secondaryTextColor,
                                  ),
                                ),
                                const SizedBox(height: 1),
                                Text(
                                  'মেধাতালিকা স্থগিত',
                                  style: TextStyle(
                                    fontFamily: 'HindSiliguri',
                                    fontSize: 9,
                                    color: secondaryTextColor,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),

                      // Divider
                      Container(
                        width: 1,
                        height: 38,
                        color: isDark ? const Color(0xFF2E3242) : const Color(0xFFE2E8F0),
                      ),

                      // 3. সময়
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(left: 10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'সময়',
                                style: TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  fontSize: 10.5,
                                  color: secondaryTextColor,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${_formatDuration(record.durationSeconds)} মি.',
                                style: TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: primaryTextColor,
                                ),
                              ),
                              const SizedBox(height: 1),
                              Text(
                                'মোট ব্যয়',
                                style: TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  fontSize: 9.5,
                                  color: secondaryTextColor,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // Action Button: 'সমাধান ও ব্যাখ্যা দেখুন'
                SizedBox(
                  width: double.infinity,
                  height: 38,
                  child: record.isResultPublished
                      ? ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isDark
                                ? const Color(0xFF1E2433)
                                : const Color(0xFF004633),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(9),
                              side: BorderSide(
                                color: isDark ? const Color(0xFF2E374D) : const Color(0xFF004633),
                                width: 0.8,
                              ),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                          ),
                          icon: const Icon(LucideIcons.fileCheck2, size: 15),
                          label: const Text(
                            'সমাধান ও সঠিক উত্তর দেখুন',
                            style: TextStyle(
                              fontFamily: 'HindSiliguri',
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          onPressed: () {
                            context.push('/live_exam_solution/${record.liveExamId}');
                          },
                        )
                      : OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: secondaryTextColor,
                            backgroundColor: isDark ? const Color(0xFF14151B) : const Color(0xFFF8FAFC),
                            side: BorderSide(
                              color: isDark ? const Color(0xFF2E3242) : const Color(0xFFE2E8F0),
                              width: 0.8,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(9),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                          ),
                          icon: const Icon(LucideIcons.lock, size: 14),
                          label: const Text(
                            'ফলাফল ও সমাধান অপেক্ষমাণ (লক করা)',
                            style: TextStyle(
                              fontFamily: 'HindSiliguri',
                              fontSize: 12.5,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          onPressed: () {
                            AppPopups.info(
                              context,
                              title: 'ফলাফল অপেক্ষমাণ ⏱️',
                              message: record.endTime != null && DateTime.now().isBefore(record.endTime!)
                                  ? 'পরীক্ষার গোপনীয়তা রক্ষার্থে সময়সীমা শেষ (${record.endTime!.hour.toString().padLeft(2, '0')}:${record.endTime!.minute.toString().padLeft(2, '0')}) ও ফলাফল প্রকাশের পর পূর্ণাঙ্গ সমাধান দেখতে পারবেন।'
                                  : 'কর্তৃপক্ষ কর্তৃক এই পরীক্ষার ফলাফল ও সমাধান সাময়িকভাবে অপ্রকাশিত রাখা হয়েছে। প্রকাশিত হওয়ামাত্রই দেখতে পারবেন।',
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTableView(
    List<LiveExamHistoryRecord> filteredRecords,
    bool isDark,
    Color primaryTextColor,
    Color secondaryTextColor,
  ) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 80),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF14151B) : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isDark ? const Color(0xFF2A2D3A) : const Color(0xFFE2E8F0),
            width: 1,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(9),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: SizedBox(
              width: 580,
              child: Column(
                children: [
                  // 1. STICKY TABLE HEADER
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E2230) : const Color(0xFF004633),
                    ),
                    child: Table(
                      columnWidths: _tableColumnWidths,
                      defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                      children: [
                        TableRow(
                          children: [
                            _buildHeaderCell('তারিখ'),
                            _buildHeaderCell('পরীক্ষার নাম ও বিষয়'),
                            _buildHeaderCell('স্কোর'),
                            _buildHeaderCell('মেধাক্রম'),
                            _buildHeaderCell('সময়'),
                            _buildHeaderCell('সমাধান'),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // 2. SCROLLABLE TABLE BODY
                  Expanded(
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      child: Table(
                        columnWidths: _tableColumnWidths,
                        defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                        border: TableBorder(
                          horizontalInside: BorderSide(
                            color: isDark ? const Color(0xFF262836) : const Color(0xFFE5E7EB),
                            width: 0.8,
                          ),
                        ),
                        children: filteredRecords.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final record = entry.value;

                          final rowColor = idx % 2 == 0
                              ? (isDark ? const Color(0xFF14151B) : Colors.white)
                              : (isDark ? const Color(0xFF181A22) : const Color(0xFFF8FAFC));

                          return TableRow(
                            decoration: BoxDecoration(color: rowColor),
                            children: [
                              // 1. তারিখ
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                                child: Text(
                                  LiveExamHistoryPage.formatBanglaDate(record.submitTime),
                                  style: TextStyle(
                                    fontFamily: 'HindSiliguri',
                                    fontSize: 11,
                                    fontWeight: FontWeight.w400,
                                    color: primaryTextColor,
                                  ),
                                ),
                              ),

                              // 2. পরীক্ষার নাম ও ট্র্যাক
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      record.examTitle,
                                      style: TextStyle(
                                        fontFamily: 'HindSiliguri',
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: primaryTextColor,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isDark ? const Color(0xFF22242E) : const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(
                                          color: isDark ? const Color(0xFF33374A) : const Color(0xFFCBD5E1),
                                          width: 0.6,
                                        ),
                                      ),
                                      child: Text(
                                        LiveExamHistoryPage.getCategoryDisplayName(record.category),
                                        style: TextStyle(
                                          fontFamily: 'HindSiliguri',
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w500,
                                          color: secondaryTextColor,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // 3. স্কোর
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      '${LiveExamHistoryPage.toBanglaDigits(record.score.toStringAsFixed(record.score.truncateToDouble() == record.score ? 0 : 2))} / ${LiveExamHistoryPage.toBanglaDigits(record.totalMarks.toInt())}',
                                      style: TextStyle(
                                        fontFamily: 'HindSiliguri',
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w600,
                                        color: record.score > 0
                                            ? (isDark ? const Color(0xFF4ADE80) : const Color(0xFF16A34A))
                                            : primaryTextColor,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '✓ ${LiveExamHistoryPage.toBanglaDigits(record.correctCount)}  ✗ ${LiveExamHistoryPage.toBanglaDigits(record.wrongCount)}',
                                      style: TextStyle(
                                        fontFamily: 'HindSiliguri',
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.w400,
                                        color: secondaryTextColor,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // 4. মেধাক্রম
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                                child: record.isResultPublished
                                    ? Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            '${LiveExamHistoryPage.toBanglaDigits(record.rank)} তম',
                                            style: TextStyle(
                                              fontFamily: 'HindSiliguri',
                                              fontSize: 11.5,
                                              fontWeight: FontWeight.w600,
                                              color: primaryTextColor,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '(${LiveExamHistoryPage.toBanglaDigits(record.totalParticipants)} জন)',
                                            style: TextStyle(
                                              fontFamily: 'HindSiliguri',
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.w400,
                                              color: secondaryTextColor,
                                            ),
                                          ),
                                        ],
                                      )
                                    : Text(
                                        'অপেক্ষমাণ',
                                        style: TextStyle(
                                          fontFamily: 'HindSiliguri',
                                          fontSize: 11,
                                          fontWeight: FontWeight.w500,
                                          color: secondaryTextColor,
                                        ),
                                      ),
                              ),

                              // 5. সময়
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
                                child: Text(
                                  '${_formatDuration(record.durationSeconds)} মি.',
                                  style: TextStyle(
                                    fontFamily: 'HindSiliguri',
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w500,
                                    color: secondaryTextColor,
                                  ),
                                ),
                              ),

                              // 6. অ্যাকশন (সমাধান বাটন)
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(6),
                                  onTap: () {
                                    if (record.isResultPublished) {
                                      context.push('/live_exam_solution/${record.liveExamId}');
                                    } else {
                                      AppPopups.info(
                                        context,
                                        title: 'ফলাফল অপেক্ষমাণ ⏱️',
                                        message: record.endTime != null && DateTime.now().isBefore(record.endTime!)
                                            ? 'পরীক্ষার গোপনীয়তা রক্ষার্থে সময়সীমা শেষ (${record.endTime!.hour.toString().padLeft(2, '0')}:${record.endTime!.minute.toString().padLeft(2, '0')}) ও ফলাফল প্রকাশের পর পূর্ণাঙ্গ সমাধান দেখতে পারবেন।'
                                            : 'কর্তৃপক্ষ কর্তৃক এই পরীক্ষার ফলাফল ও সমাধান সাময়িকভাবে অপ্রকাশিত রাখা হয়েছে। প্রকাশিত হওয়ামাত্রই দেখতে পারবেন।',
                                      );
                                    }
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF22242E) : const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                        color: isDark ? const Color(0xFF33374A) : const Color(0xFFCBD5E1),
                                        width: 0.8,
                                      ),
                                    ),
                                    alignment: Alignment.center,
                                    child: record.isResultPublished
                                        ? Text(
                                            'সমাধান',
                                            style: TextStyle(
                                              fontFamily: 'HindSiliguri',
                                              fontSize: 11,
                                              fontWeight: FontWeight.w500,
                                              color: isDark ? const Color(0xFF4ADE80) : const Color(0xFF004633),
                                            ),
                                          )
                                        : Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(LucideIcons.lock, size: 10, color: secondaryTextColor),
                                              const SizedBox(width: 3),
                                              Text(
                                                'লক করা',
                                                style: TextStyle(
                                                  fontFamily: 'HindSiliguri',
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w500,
                                                  color: secondaryTextColor,
                                                ),
                                              ),
                                            ],
                                          ),
                                  ),
                                ),
                              ),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderCell(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      child: Text(
        text,
        style: const TextStyle(
          fontFamily: 'HindSiliguri',
          color: Colors.white,
          fontWeight: FontWeight.w600,
          fontSize: 11.5,
        ),
      ),
    );
  }
}
