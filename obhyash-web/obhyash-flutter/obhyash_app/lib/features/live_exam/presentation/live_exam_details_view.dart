import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:lucide_icons/lucide_icons.dart";
import "../domain/models.dart";
import "../providers/live_exam_providers.dart";
import "../../../core/presentation/widgets/skeleton_loading.dart";
import "../../../core/providers/app_config_provider.dart";
import "../../../core/utils/bangla_name_helper.dart";

class LiveExamDetailsView extends ConsumerStatefulWidget {
  final String examId;
  final LiveExam? preloadedExam;

  const LiveExamDetailsView({
    super.key,
    required this.examId,
    this.preloadedExam,
  });

  @override
  ConsumerState<LiveExamDetailsView> createState() => _LiveExamDetailsViewState();
}

class _LiveExamDetailsViewState extends ConsumerState<LiveExamDetailsView> {
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final examAsync = ref.watch(liveExamDetailsProvider(widget.examId));
    final isLiveExamsEnabled = ref.watch(isLiveExamsEnabledProvider);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF09090B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : Colors.black87,
          ),
          onPressed: () => context.pop(),
        ),
        title: Text(
          examAsync.value?.exam.title ?? widget.preloadedExam?.title ?? "পরীক্ষার বিবরণ",
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black87,
            fontWeight: FontWeight.bold,
            fontSize: 17,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: examAsync.when(
        loading: () => const LiveExamDetailsSkeleton(),
        error: (err, stack) => Center(
          child: Text(
            "লোড করতে সমস্যা হয়েছে: $err",
            style: const TextStyle(color: Colors.red),
          ),
        ),
        data: (data) {
          final exam = data.exam;
          final attempt = data.attempt;

          final now = DateTime.now();
          final isUpcoming = now.isBefore(exam.startTime);
          final isPast = now.isAfter(exam.endTime);
          final isOngoing = !isUpcoming && !isPast;

          
          final isTaken = attempt != null;

          String statusBadgeText;
          Color statusBadgeColor;
          if (isTaken) {
            statusBadgeText = "অংশগ্রহণ সম্পন্ন";
            statusBadgeColor = const Color(0xFF0B6B42);
          } else if (isOngoing) {
            statusBadgeText = "চলমান লাইভ";
            statusBadgeColor = const Color(0xFF0B6B42);
          } else if (isUpcoming) {
            statusBadgeText = "আসন্ন পরীক্ষা";
            statusBadgeColor = const Color(0xFF3B82F6);
          } else {
            statusBadgeText = "পরীক্ষা শেষ";
            statusBadgeColor = const Color(0xFF6B7280);
          }

          final leaderboardAsync = ref.watch(liveExamLeaderboardProvider(exam.id));

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Unified Big Exam Information Card
                Builder(
                  builder: (context) {
                    final syllabusGroups = _parseSyllabusGroups(exam.description, exam.totalMarks, exam.totalQuestions);
                    final displayQuestions = exam.totalQuestions > 0 ? exam.totalQuestions : (exam.totalMarks > 0 ? exam.totalMarks.toInt() : 50);

                    return Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF141417) : Colors.white,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(
                          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                          width: 1.2,
                        ),
                        boxShadow: [
                          if (!isDark)
                            BoxShadow(
                              color: const Color(0x0A000000),
                              blurRadius: 16,
                              offset: const Offset(0, 4),
                            ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Category Tag & Status Badge
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE2E8F0),
                                  ),
                                ),
                                child: Text(
                                  exam.category.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.5,
                                    color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                                decoration: BoxDecoration(
                                  color: statusBadgeColor.withValues(alpha: isDark ? 0.15 : 0.1),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: statusBadgeColor.withValues(alpha: isDark ? 0.3 : 0.25),
                                  ),
                                ),
                                child: Text(
                                  statusBadgeText,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark && statusBadgeColor == const Color(0xFF0B6B42)
                                        ? const Color(0xFF34D399)
                                        : statusBadgeColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // 2. Schedule Section - Matching Reference Image Exactly
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF18181B) : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: Column(
                              children: [
                                // Centered Header
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Text("🗓️", style: TextStyle(fontSize: 18)),
                                    const SizedBox(width: 8),
                                    Text(
                                      "সময়সূচী",
                                      style: TextStyle(
                                        fontSize: 16.5,
                                        fontWeight: FontWeight.w700,
                                        fontFamily: 'HindSiliguri',
                                        color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),

                                // 2-Column Schedule with Dash
                                FittedBox(
                                  fit: BoxFit.scaleDown,
                                  alignment: Alignment.center,
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      // Left: Start Date & Time
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            _formatDateShortEng(exam.startTime),
                                            style: TextStyle(
                                              fontSize: 17,
                                              fontWeight: FontWeight.w700,
                                              fontFamily: 'HindSiliguri',
                                              color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                                            ),
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            _formatTime12Hour(exam.startTime),
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w600,
                                              fontFamily: 'HindSiliguri',
                                              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                            ),
                                          ),
                                        ],
                                      ),

                                      // Center Dash
                                      Container(
                                        margin: const EdgeInsets.symmetric(horizontal: 20),
                                        width: 28,
                                        height: 2,
                                        decoration: BoxDecoration(
                                          color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFCBD5E1),
                                          borderRadius: BorderRadius.circular(2),
                                        ),
                                      ),

                                      // Right: End Date & Time
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            _formatDateShortEng(exam.endTime),
                                            style: TextStyle(
                                              fontSize: 17,
                                              fontWeight: FontWeight.w700,
                                              fontFamily: 'HindSiliguri',
                                              color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                                            ),
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            _formatTime12Hour(exam.endTime),
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w600,
                                              fontFamily: 'HindSiliguri',
                                              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 14),

                          // 3. Meta Stats Pill Row Matching Reference Image
                          Container(
                            width: double.infinity,
                            alignment: Alignment.center,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF18181B) : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.center,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text("⏱️", style: TextStyle(fontSize: 16)),
                                  const SizedBox(width: 5),
                                  Text(
                                    _formatDurationBangla(exam.durationMinutes),
                                    style: TextStyle(
                                      fontSize: 14.5,
                                      fontWeight: FontWeight.w600,
                                      fontFamily: 'HindSiliguri',
                                      color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                                    ),
                                  ),
                                  Container(
                                    margin: const EdgeInsets.symmetric(horizontal: 10),
                                    width: 1,
                                    height: 16,
                                    color: isDark ? const Color(0xFF2E2E32) : const Color(0xFFE2E8F0),
                                  ),
                                  const Text("📝", style: TextStyle(fontSize: 16)),
                                  const SizedBox(width: 5),
                                  Text(
                                    "${BanglaNameHelper.toBanglaNumeral(displayQuestions)}টি প্রশ্ন",
                                    style: TextStyle(
                                      fontSize: 14.5,
                                      fontWeight: FontWeight.w600,
                                      fontFamily: 'HindSiliguri',
                                      color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                                    ),
                                  ),
                                  if (exam.negativeMarking > 0) ...[
                                    Container(
                                      margin: const EdgeInsets.symmetric(horizontal: 10),
                                      width: 1,
                                      height: 16,
                                      color: isDark ? const Color(0xFF2E2E32) : const Color(0xFFE2E8F0),
                                    ),
                                    const Text("🎯", style: TextStyle(fontSize: 15)),
                                    const SizedBox(width: 5),
                                    Text(
                                      "-${BanglaNameHelper.toBanglaNumeral(exam.negativeMarking)} মার্ক",
                                      style: const TextStyle(
                                        fontSize: 14.5,
                                        fontWeight: FontWeight.w600,
                                        fontFamily: 'HindSiliguri',
                                        color: Color(0xFFEF4444),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // 4. Syllabus Section
                          Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF18181B) : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Column(
                                children: [
                                  for (int i = 0; i < syllabusGroups.length; i++) ...[
                                    if (i > 0)
                                      Divider(
                                        height: 1,
                                        thickness: 1,
                                        color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                                      ),
                                    _SyllabusAccordionCard(
                                      group: syllabusGroups[i],
                                      isDark: isDark,
                                      initiallyExpanded: i < 2,
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                const SizedBox(height: 20),

                // Main CTA Action Button
                if (!isTaken) ...[
                  if (!isLiveExamsEnabled) ...[
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF3B1E08) : const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFFD97706).withValues(alpha: 0.6)
                              : const Color(0xFFFDE68A),
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.alertTriangle, size: 20, color: Color(0xFFD97706)),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'লাইভ এক্সাম সাময়িক স্থগিত রয়েছে। অ্যাডমিন কর্তৃক পুনরায় চালু করা হলে পরীক্ষা দেওয়া যাবে।',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: (isLiveExamsEnabled && (isOngoing || isPast || exam.id.startsWith("mock-")))
                            ? const Color(0xFF004633)
                            : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      onPressed: !isLiveExamsEnabled
                          ? () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'লাইভ এক্সাম বর্তমানে সাময়িক স্থগিত রয়েছে।',
                                    style: TextStyle(),
                                  ),
                                  backgroundColor: Color(0xFFDC2626),
                                ),
                              );
                            }
                          : isOngoing
                              ? () {
                                  context.push(
                                    "/live_exam_session/${exam.id}",
                                    extra: exam,
                                  );
                                }
                              : (isPast || exam.id.startsWith("mock-"))
                                  ? () {
                                      context.push(
                                        "/live_exam_session/${exam.id}?practice=true",
                                        extra: exam,
                                      );
                                    }
                                  : null,
                      child: Text(
                        !isLiveExamsEnabled
                            ? "লাইভ এক্সাম সাময়িক বন্ধ রয়েছে"
                            : isOngoing
                                ? "পরীক্ষা শুরু করুন"
                                : (isUpcoming ? "পরীক্ষা এখনও শুরু হয়নি (⏱️ আর ${_formatRemainingTime(exam.startTime)} বাকি)" : "অনুশীলন পরীক্ষা শুরু করুন"),
                        style: TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                          color: (isLiveExamsEnabled && (isOngoing || isPast || exam.id.startsWith("mock-")))
                              ? Colors.white
                              : (isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8)),
                        ),
                      ),
                    ),
                  ),
                ] else ...[
                  // When results are published, show Solutions button
                  if (exam.isResultPublished) ...[
                    // Solutions Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF004633),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                        ),
                        onPressed: () {
                          context.push(
                            "/live_exam_solution/${exam.id}",
                            extra: exam,
                          );
                        },
                        icon: const Icon(LucideIcons.bookOpen, size: 18),
                        label: const Text(
                          "সমাধান ও ব্যাখ্যা দেখুন",
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15.5, fontFamily: 'HindSiliguri'),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  // Retake as Practice Button
                  if (isPast || exam.id.startsWith("mock-")) ...[
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF0F172A),
                          backgroundColor: isDark ? const Color(0xFF141417) : Colors.white,
                          side: BorderSide(
                            color: isDark ? const Color(0xFF27272A) : const Color(0xFFCBD5E1),
                            width: 1.2,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        onPressed: () {
                          context.push(
                            "/live_exam_session/${exam.id}?practice=true",
                            extra: exam,
                          );
                        },
                        icon: const Icon(LucideIcons.rotateCcw, size: 18),
                        label: const Text(
                          "অনুশীলন পরীক্ষা দিন (Practice)",
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, fontFamily: 'HindSiliguri'),
                        ),
                      ),
                    ),
                  ],
                ],

                // Score Overview Card (When taken)
                if (isTaken) ...[
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF141417) : Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                        width: 1.2,
                      ),
                      boxShadow: [
                        if (!isDark)
                          BoxShadow(
                            color: const Color(0x0A000000),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "তোমার ফলাফলের সারসংক্ষেপ (অফিসিয়াল)",
                          style: TextStyle(
                            fontSize: 15.5,
                            fontWeight: FontWeight.w800,
                            color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildScoreStat("সঠিক", "${attempt.correctCount}", const Color(0xFF10B981), isDark),
                            Container(width: 1, height: 28, color: isDark ? const Color(0xFF2E2E32) : const Color(0xFFE2E8F0)),
                            _buildScoreStat("ভুল", "${attempt.wrongCount}", const Color(0xFFEF4444), isDark),
                            Container(width: 1, height: 28, color: isDark ? const Color(0xFF2E2E32) : const Color(0xFFE2E8F0)),
                            Builder(
                              builder: (context) {
                                final calcScore = (((attempt.correctCount) - (attempt.wrongCount * exam.negativeMarking)) * 10000).round() / 10000.0;
                                final effectiveScore = (attempt.score == 0 && calcScore < 0) ? calcScore : attempt.score;
                                return _buildScoreStat("মোট স্কোর", "$effectiveScore", isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A), isDark);
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],

                // Practice Attempts History Section
                ref.watch(liveExamPracticeHistoryProvider(exam.id)).when(
                  data: (practiceHistory) {
                    if (practiceHistory.isEmpty) return const SizedBox();
                    return Container(
                      margin: const EdgeInsets.only(top: 20),
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: const [
                                  Icon(LucideIcons.history, color: Color(0xFF3B82F6), size: 18),
                                  SizedBox(width: 8),
                                  Text(
                                    "অনুশীলন পরীক্ষার ইতিহাস",
                                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, ),
                                  ),
                                ],
                              ),
                              Text(
                                "${practiceHistory.length} বার সম্পন্ন",
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? Colors.white54 : Colors.black54,
                                  ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          ...practiceHistory.asMap().entries.map((entry) {
                            final idx = entry.key;
                            final ph = entry.value;
                            final attemptNum = practiceHistory.length - idx;
                            final date = ph.submitTime.toLocal();
                            final dateStr = "${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}";
                            final mins = (ph.timeTakenSeconds / 60).floor();

                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF141416) : const Color(0xFFF9FAFB),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF3B82F6).withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      "অনুশীলন #$attemptNum",
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF3B82F6),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          dateStr,
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: isDark ? Colors.white70 : Colors.black87,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          "সঠিক: ${ph.correctCount} • ভুল: ${ph.wrongCount}${mins > 0 ? ' • সময়: $mins মি.' : ''}",
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: isDark ? Colors.white38 : Colors.black45,
                                            ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    "${ph.score}",
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF0B6B42),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ),
                    );
                  },
                  loading: () => const SizedBox(),
                  error: (err, stack) => const SizedBox(),
                ),

                // Anti-Leakage / Pending Results Banner (When ongoing)
                if (isTaken && isOngoing && !exam.id.startsWith("mock-")) ...[
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: const Color(0xFFF59E0B).withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(LucideIcons.alertCircle, color: Color(0xFFD97706), size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                "উত্তরপত্র সফলভাবে জমা নেওয়া হয়েছে!",
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFD97706),
                                  ),
                              ),
                              const SizedBox(height: 4),
                              Builder(
                                builder: (context) {
                                  final pub = exam.endTime.add(const Duration(minutes: 15));
                                  final pubStr = "${pub.hour.toString().padLeft(2, '0')}:${pub.minute.toString().padLeft(2, '0')}";
                                  return Text(
                                    "পরীক্ষার গোপনীয়তা ও সমতা বজায় রাখতে, লাইভ পরীক্ষা শেষ হওয়ার পর রাত $pubStr মিনিটে সম্পূর্ণ সমাধান ও মেধা তালিকা উন্মুক্ত করা হবে।",
                                    style: TextStyle(
                                      fontSize: 12.5,
                                      height: 1.4,
                                      color: isDark ? Colors.white70 : const Color(0xFF78350F),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Admin Hidden Leaderboard Banner (When exam ended but admin toggled leaderboard hidden)
                if (isTaken && (isPast || exam.id.startsWith("mock-")) && !exam.isLeaderboardPublished) ...[
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E7EB),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(LucideIcons.eyeOff, color: isDark ? Colors.white70 : const Color(0xFF4B5563), size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "মেধা তালিকা প্রকাশ স্থগিত",
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white : const Color(0xFF1F2937),
                                  ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                "কর্তৃপক্ষ কর্তৃক এই পরীক্ষার মেধা তালিকা সাময়িকভাবে অপ্রকাশিত রাখা হয়েছে।",
                                style: TextStyle(
                                  fontSize: 12.5,
                                  height: 1.4,
                                  color: isDark ? Colors.white70 : const Color(0xFF4B5563),
                                  ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Leaderboard Section (When Past/Ended and Published by Admin)
                if (isTaken && (isPast || exam.id.startsWith("mock-")) && exam.isLeaderboardPublished) ...[
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: const [
                          Icon(LucideIcons.trophy, color: Color(0xFFF59E0B), size: 18),
                          SizedBox(width: 8),
                          Text(
                            "শীর্ষ মেধা তালিকা (Top Rankers)",
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        "শীর্ষ ৫ জন",
                        style: TextStyle(fontSize: 12, color: isDark ? Colors.white54 : Colors.black54),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  leaderboardAsync.when(
                    loading: () => const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24.0),
                        child: CircularProgressIndicator(color: Color(0xFF0B6B42)),
                      ),
                    ),
                    error: (err, stack) => const SizedBox(),
                    data: (leaderboard) {
                      if (leaderboard.isEmpty) {
                        return Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Center(child: Text("মেধা তালিকার তথ্য এখনও নেই")),
                        );
                      }
                      return Column(
                        children: leaderboard.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final lb = entry.value;
                          final totalAttempted = lb.correctCount + lb.wrongCount;
                          final accuracy = totalAttempted > 0
                              ? ((lb.correctCount / totalAttempted) * 100).round()
                              : (lb.score > 0 ? 100 : 0);

                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF141417) : Colors.white,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: idx == 0
                                    ? const Color(0xFFF59E0B).withValues(alpha: 0.5)
                                    : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
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
                                Container(
                                  width: 30,
                                  height: 30,
                                  decoration: BoxDecoration(
                                    color: idx == 0
                                        ? const Color(0xFFF59E0B)
                                        : idx == 1
                                            ? const Color(0xFF94A3B8)
                                            : idx == 2
                                                ? const Color(0xFFB45309)
                                                : isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(9),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    "#${idx + 1}",
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: idx < 3 ? Colors.white : (isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569)),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        lb.userName,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w800,
                                          color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        "${lb.userInstitute.isNotEmpty ? lb.userInstitute : "প্রতিষ্ঠান নেই"} • ⏱️ ${lb.formattedDuration}",
                                        style: TextStyle(
                                          fontSize: 11.5,
                                          color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  "$accuracy% নির্ভুলতা",
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: accuracy >= 80
                                        ? const Color(0xFF10B981)
                                        : (accuracy >= 50 ? const Color(0xFFF59E0B) : const Color(0xFFEF4444)),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF1F2937) : const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: isDark ? const Color(0xFF374151) : const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: Text(
                                    "${lb.score} মার্কস",
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w900,
                                      color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF0F172A),
                        backgroundColor: isDark ? const Color(0xFF141417) : Colors.white,
                        side: BorderSide(
                          color: isDark ? const Color(0xFF27272A) : const Color(0xFFCBD5E1),
                          width: 1.2,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () {
                        context.push(
                          "/live_exam_leaderboard/${exam.id}",
                          extra: exam,
                        );
                      },
                      icon: const Icon(LucideIcons.trophy, size: 18),
                      label: const Text(
                        "সম্পূর্ণ মেধা তালিকা দেখুন",
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, ),
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 40),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildScoreStat(String label, String value, Color color, bool isDark) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 19,
            fontWeight: FontWeight.w900,
            color: color,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  static List<String> _splitRespectingParens(String str, [String delimiter = ","]) {
    final List<String> result = [];
    String current = "";
    int parenDepth = 0;
    for (int i = 0; i < str.length; i++) {
      final char = str[i];
      if (char == "(" || char == "（") {
        parenDepth++;
      } else if (char == ")" || char == "）") {
        if (parenDepth > 0) parenDepth--;
      }

      if (char == delimiter && parenDepth == 0) {
        if (current.trim().isNotEmpty) result.add(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim().isNotEmpty) result.add(current.trim());
    return result;
  }

  static String _toEnglishDigits(String str) {
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    var result = str;
    for (int i = 0; i < 10; i++) {
      result = result.replaceAll(bn[i], i.toString());
    }
    return result;
  }

  static List<_SyllabusSubjectGroup> _parseSyllabusGroups(String description, num totalMarks, int totalQuestions) {
    if (description.trim().isEmpty) {
      return [
        _SyllabusSubjectGroup(
          title: "পূর্ণাঙ্গ সিলেবাস",
          iconEmoji: "📚",
          questionCountText: "${BanglaNameHelper.toBanglaNumeral(totalQuestions > 0 ? totalQuestions : totalMarks.toInt())} টি প্রশ্ন",
          topics: const ["বোর্ড পাঠ্যবইয়ের সংশ্লিষ্ট সম্পূর্ণ অধ্যায়সমূহ"],
        )
      ];
    }

    String rawSyllabus = description;
    String? subjectLine;

    final lines = description.split(RegExp(r"[\r\n]+")).map((l) => l.trim()).where((l) => l.isNotEmpty).toList();
    for (final line in lines) {
      if (line.startsWith("বিষয়:") || line.startsWith("বিষয়:")) {
        subjectLine = line.replaceFirst(RegExp(r"^(?:বিষয়|বিষয়):\s*"), "").trim();
      } else if (line.startsWith("সিলেবাস:")) {
        rawSyllabus = line.replaceFirst(RegExp(r"^(?:সিলেবাস):\s*"), "").trim();
      }
    }

    rawSyllabus = rawSyllabus.replaceAll(RegExp(r"^(?:বিষয়|বিষয়):[^\n]+(?:\n|$)", caseSensitive: false), "").trim();
    rawSyllabus = rawSyllabus.replaceFirst(RegExp(r"^(?:সিলেবাস):\s*", caseSensitive: false), "").trim();

    // Check for marks distribution in parens, e.g. (জীব ৩০ + রস ২৫ + পদ ২০ + ইং ১৫ + জিকে ১০)
    final distributionMatch = RegExp(r"\(([^)]*(?:\+|\b(?:মার্ক|নম্বর|টি))\b[^)]*)\)").firstMatch(rawSyllabus);
    final Map<String, int> subjectMarksMap = {};
    if (distributionMatch != null) {
      final distStr = distributionMatch.group(1) ?? "";
      final parts = distStr.split("+").map((p) => p.trim());
      for (final p in parts) {
        final m = RegExp(r"([^\d]+)\s*(\d+|[০-৯]+)").firstMatch(p);
        if (m != null) {
          final sub = m.group(1)?.trim() ?? "";
          final cnt = int.tryParse(_toEnglishDigits(m.group(2) ?? "0")) ?? 0;
          if (sub.isNotEmpty && cnt > 0) {
            subjectMarksMap[sub] = cnt;
          }
        }
      }
    }

    final blocks = rawSyllabus.split(RegExp(r"[;\n]+")).map((b) => b.trim()).where((b) => b.isNotEmpty).toList();
    final List<_SyllabusSubjectGroup> result = [];

    for (final block in blocks) {
      if (block.contains(":")) {
        final idx = block.indexOf(":");
        final rawHeader = block.substring(0, idx).trim();
        final rawTopics = block.substring(idx + 1).trim();

        final headerInfo = _normalizeSubjectHeader(rawHeader);
        final topics = _splitRespectingParens(rawTopics, ",")
            .map((t) => t.replaceFirst(RegExp(r"^[•\s\d.-]+"), "").trim())
            .where((t) => t.isNotEmpty)
            .toList();

        result.add(_SyllabusSubjectGroup(
          title: headerInfo.name,
          iconEmoji: headerInfo.icon,
          questionCountText: rawHeader, // temporary stash of raw header
          topics: topics.isNotEmpty ? topics : [rawTopics],
        ));
      }
    }

    if (result.isEmpty) {
      final headerInfo = _normalizeSubjectHeader(subjectLine ?? "সিলেবাস");
      final topics = _splitRespectingParens(rawSyllabus, ",")
          .map((t) => t.replaceFirst(RegExp(r"^[•\s\d.-]+"), "").trim())
          .where((t) => t.isNotEmpty)
          .toList();

      result.add(_SyllabusSubjectGroup(
        title: headerInfo.name,
        iconEmoji: headerInfo.icon,
        questionCountText: subjectLine ?? "",
        topics: topics.isNotEmpty ? topics : [rawSyllabus],
      ));
    }

    final effectiveTotal = totalQuestions > 0 ? totalQuestions : (totalMarks > 0 ? totalMarks.toInt() : 50);
    final countPerSubject = (effectiveTotal / (result.isEmpty ? 1 : result.length)).round();

    return result.map((group) {
      int qCount = countPerSubject;
      for (final entry in subjectMarksMap.entries) {
        if (group.title.contains(entry.key) || group.questionCountText.contains(entry.key)) {
          qCount = entry.value;
          break;
        }
      }
      final bnCount = BanglaNameHelper.toBanglaNumeral(qCount);
      return _SyllabusSubjectGroup(
        title: group.title,
        iconEmoji: group.iconEmoji,
        questionCountText: "$bnCount টি প্রশ্ন",
        topics: group.topics,
      );
    }).toList();
  }

  static ({String name, String icon}) _normalizeSubjectHeader(String raw) {
    final clean = raw.trim();
    final lower = clean.toLowerCase();

    if (lower.contains('পদার্থ') || lower.contains('পদ')) {
      if (clean.contains('২') || clean.contains('2') || lower.contains('২য়') || lower.contains('২য়')) {
        return (name: 'পদার্থবিজ্ঞান ২য় পত্র', icon: '🧲');
      }
      if (clean.contains('১') || clean.contains('1') || lower.contains('১ম')) {
        return (name: 'পদার্থবিজ্ঞান ১ম পত্র', icon: '🧲');
      }
      return (name: 'পদার্থবিজ্ঞান', icon: '🧲');
    }

    if (lower.contains('রসায়ন') || lower.contains('রসায়ন') || lower.contains('chem')) {
      if (clean.contains('২') || clean.contains('2') || lower.contains('২য়') || lower.contains('২য়')) {
        return (name: 'রসায়ন ২য় পত্র', icon: '🧪');
      }
      if (clean.contains('১') || clean.contains('1') || lower.contains('১ম')) {
        return (name: 'রসায়ন ১ম পত্র', icon: '🧪');
      }
      return (name: 'রসায়ন', icon: '🧪');
    }

    if (lower.contains('গণিত') || lower.contains('ম্যাথ') || lower.contains('math')) {
      if (clean.contains('২') || clean.contains('2') || lower.contains('২য়') || lower.contains('২য়')) {
        return (name: 'উচ্চতর গণিত ২য় পত্র', icon: '📐');
      }
      if (clean.contains('১') || clean.contains('1') || lower.contains('১ম')) {
        return (name: 'উচ্চতর গণিত ১ম পত্র', icon: '📐');
      }
      return (name: 'উচ্চতর গণিত', icon: '📐');
    }

    if (lower.contains('প্রাণি') || lower.contains('প্রাণী') || lower.contains('জুলো')) {
      return (name: 'প্রাণিবিজ্ঞান', icon: '🧬');
    }

    if (lower.contains('উদ্ভিদ') || lower.contains('বোটানি')) {
      return (name: 'উদ্ভিদবিজ্ঞান', icon: '🌿');
    }

    if (lower.contains('জীব') || lower.contains('bio')) {
      return (name: 'জীববিজ্ঞান', icon: '🧬');
    }

    if (lower.contains('gk') || lower.contains('সাধারণ জ্ঞান') || lower.contains('সাধারণজ্ঞান')) {
      return (name: 'সাধারণ জ্ঞান (GK)', icon: '🌍');
    }

    if (lower.contains('english') || lower.contains('ইংরেজি') || lower.contains('ইংলিশ')) {
      return (name: 'ইংরেজি (English)', icon: '🔤');
    }

    return (name: clean, icon: '📖');
  }

  static String _formatDateShortEng(DateTime dt) {
    const months = [
      "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    final day = dt.day.toString().padLeft(2, "0");
    final month = months[dt.month];
    final year = dt.year.toString();
    return "$day $month $year";
  }

  static String _formatRemainingTime(DateTime startTime) {
    final now = DateTime.now();
    if (startTime.isBefore(now)) return "শীঘ্রই";
    final diff = startTime.difference(now);
    final days = diff.inDays;
    final hours = diff.inHours % 24;
    final minutes = diff.inMinutes % 60;

    if (days > 0) {
      final bnDays = BanglaNameHelper.toBanglaNumeral(days);
      if (hours > 0) {
        final bnHours = BanglaNameHelper.toBanglaNumeral(hours);
        return "$bnDays দিন $bnHours ঘণ্টা";
      }
      return "$bnDays দিন";
    }
    if (hours > 0) {
      final bnHours = BanglaNameHelper.toBanglaNumeral(hours);
      if (minutes > 0) {
        final bnMinutes = BanglaNameHelper.toBanglaNumeral(minutes);
        return "$bnHours ঘণ্টা $bnMinutes মিনিট";
      }
      return "$bnHours ঘণ্টা";
    }
    if (minutes > 0) {
      final bnMinutes = BanglaNameHelper.toBanglaNumeral(minutes);
      return "$bnMinutes মিনিট";
    }
    return "কিছুক্ষণ";
  }



  static String _formatTime12Hour(DateTime dt) {
    int hour = dt.hour;
    final minute = dt.minute;
    final ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour == 0 ? 12 : hour;
    final minStr = minute < 10 ? '0$minute' : '$minute';
    return '$hour:$minStr $ampm';
  }

  static String _formatDurationBangla(int minutes) {
    if (minutes == 60) return "১ ঘণ্টা";
    if (minutes == 120) return "২ ঘণ্টা";
    if (minutes < 60) return "${BanglaNameHelper.toBanglaNumeral(minutes)} মিনিট";
    final h = minutes ~/ 60;
    final m = minutes % 60;
    if (m == 0) return "${BanglaNameHelper.toBanglaNumeral(h)} ঘণ্টা";
    return "${BanglaNameHelper.toBanglaNumeral(h)} ঘণ্টা ${BanglaNameHelper.toBanglaNumeral(m)} মিনিট";
  }
}

class _SyllabusSubjectGroup {
  final String title;
  final String iconEmoji;
  final String questionCountText;
  final List<String> topics;

  _SyllabusSubjectGroup({
    required this.title,
    required this.iconEmoji,
    required this.questionCountText,
    required this.topics,
  });
}


class _SyllabusAccordionCard extends StatefulWidget {
  final _SyllabusSubjectGroup group;
  final bool isDark;
  final bool initiallyExpanded;

  const _SyllabusAccordionCard({
    required this.group,
    required this.isDark,
    this.initiallyExpanded = true,
  });

  @override
  State<_SyllabusAccordionCard> createState() => _SyllabusAccordionCardState();
}

class _SyllabusAccordionCardState extends State<_SyllabusAccordionCard> {
  late bool _isExpanded;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;
  }

  @override
  Widget build(BuildContext context) {
    final group = widget.group;
    final isDark = widget.isDark;

    return Column(
      children: [
        InkWell(
          onTap: () {
            setState(() {
              _isExpanded = !_isExpanded;
            });
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
            child: Row(
              children: [
                Text(
                  group.iconEmoji,
                  style: const TextStyle(fontSize: 19),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    group.title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                    ),
                  ),
                ),
                if (group.questionCountText.isNotEmpty)
                  Text(
                    group.questionCountText,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
                    ),
                  ),
                const SizedBox(width: 8),
                AnimatedRotation(
                  turns: _isExpanded ? 0.5 : 0.0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    LucideIcons.chevronDown,
                    size: 18,
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ),
        AnimatedCrossFade(
          firstChild: Padding(
            padding: const EdgeInsets.only(left: 45, right: 16, bottom: 14, top: 2),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: group.topics.map((topic) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3.5),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "• ",
                        style: TextStyle(
                          fontSize: 15,
                          height: 1.2,
                          fontWeight: FontWeight.w900,
                          color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF334155),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          topic,
                          style: TextStyle(
                            fontSize: 13.5,
                            height: 1.4,
                            fontWeight: FontWeight.w500,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          secondChild: const SizedBox.shrink(),
          crossFadeState: _isExpanded ? CrossFadeState.showFirst : CrossFadeState.showSecond,
          duration: const Duration(milliseconds: 200),
        ),
      ],
    );
  }
}
