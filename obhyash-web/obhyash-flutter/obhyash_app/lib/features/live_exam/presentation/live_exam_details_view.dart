import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:lucide_icons/lucide_icons.dart";
import "../domain/models.dart";
import "../providers/live_exam_providers.dart";
import "../../../core/presentation/widgets/skeleton_loading.dart";

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

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF09090B) : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : Colors.black87,
          ),
          onPressed: () => context.pop(),
        ),
        title: Text(
          "পরীক্ষার বিবরণ",
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black87,
            fontWeight: FontWeight.bold,
            fontSize: 18,
            fontFamily: "HindSiliguri",
          ),
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
          if (exam == null) {
            return const Center(child: Text("পরীক্ষা পাওয়া যায়নি"));
          }

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
            statusBadgeText = "Ongoing Live";
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
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Unified Big Exam Information Card
                Builder(
                  builder: (context) {
                    final syllabusList = exam.description.trim().isNotEmpty
                        ? exam.description
                            .split(RegExp(r"[\n\r,;•|]+"))
                            .map((s) => s.trim())
                            .where((s) => s.isNotEmpty)
                            .toList()
                        : <String>[];

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
                                    color: isDark && statusBadgeColor == const Color(0xFF0B6B42)
                                        ? const Color(0xFF34D399)
                                        : statusBadgeColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Exam Title
                          Text(
                            exam.title,
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                              fontFamily: "Anek Bangla",
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 18),
                          Divider(height: 1, color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9)),
                          const SizedBox(height: 18),

                          // 2. Schedule Section
                          Row(
                            children: [
                              Icon(
                                LucideIcons.calendar,
                                size: 16,
                                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                "পরীক্ষার সময়সূচী",
                                style: TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155),
                                  fontFamily: "Anek Bangla",
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    "শুরু",
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    "${exam.startTime.day}/${exam.startTime.month}/${exam.startTime.year}",
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                                    ),
                                  ),
                                  Text(
                                    "${exam.startTime.hour.toString().padLeft(2, "0")}:${exam.startTime.minute.toString().padLeft(2, "0")}",
                                    style: TextStyle(
                                      fontSize: 12.5,
                                      color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                              Icon(
                                LucideIcons.arrowRight,
                                size: 18,
                                color: isDark ? const Color(0xFF52525B) : const Color(0xFFCBD5E1),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    "সমাপ্তি",
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    "${exam.endTime.day}/${exam.endTime.month}/${exam.endTime.year}",
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                                    ),
                                  ),
                                  Text(
                                    "${exam.endTime.hour.toString().padLeft(2, "0")}:${exam.endTime.minute.toString().padLeft(2, "0")}",
                                    style: const TextStyle(
                                      fontSize: 12.5,
                                      color: Color(0xFFEF4444),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),

                          // 3. Meta 3-Column Stats (Time, Questions, Negative Marks) - Clean Minimal Data Section
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF18181B) : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                _buildMetaItem("সময়", "${exam.durationMinutes} মি.", isDark),
                                Container(width: 1, height: 28, color: isDark ? const Color(0xFF2E2E32) : const Color(0xFFE2E8F0)),
                                _buildMetaItem("মোট প্রশ্ন", "${exam.totalQuestions} টি", isDark),
                                Container(width: 1, height: 28, color: isDark ? const Color(0xFF2E2E32) : const Color(0xFFE2E8F0)),
                                _buildMetaItem("নেগেটিভ মার্ক", "-${exam.negativeMarking}", isDark),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                          Divider(height: 1, color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9)),
                          const SizedBox(height: 18),

                          // 4. Syllabus Section
                          Row(
                            children: [
                              Icon(
                                LucideIcons.bookOpen,
                                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                size: 16,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                "সিলেবাস ও অধ্যায়সমূহ",
                                style: TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155),
                                  fontFamily: "Anek Bangla",
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF18181B) : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: syllabusList.isNotEmpty
                                ? LayoutBuilder(
                                    builder: (context, constraints) {
                                      final colWidth = (constraints.maxWidth - 12) / 2;
                                      return Wrap(
                                        spacing: 12,
                                        runSpacing: 8,
                                        children: List.generate(syllabusList.length, (idx) {
                                          final item = syllabusList[idx];
                                          final serial = (idx + 1).toString().padLeft(2, "0");

                                          return SizedBox(
                                            width: colWidth,
                                            child: Row(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  "$serial. ",
                                                  style: TextStyle(
                                                    fontSize: 13,
                                                    fontWeight: FontWeight.w700,
                                                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                                    fontFamily: "Anek Bangla",
                                                  ),
                                                ),
                                                Expanded(
                                                  child: Text(
                                                    item,
                                                    style: TextStyle(
                                                      fontSize: 13,
                                                      height: 1.35,
                                                      fontWeight: FontWeight.w500,
                                                      color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B),
                                                      fontFamily: "Anek Bangla",
                                                    ),
                                                    maxLines: 2,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          );
                                        }),
                                      );
                                    },
                                  )
                                : Text(
                                    exam.description.trim().isNotEmpty
                                        ? exam.description.trim()
                                        : "এই পরীক্ষার সিলেবাসে বোর্ড পাঠ্যবইয়ের সংশ্লিষ্ট অধ্যায়সমূহ অন্তর্ভুক্ত রয়েছে।",
                                    style: TextStyle(
                                      fontSize: 13.5,
                                      height: 1.4,
                                      color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                                      fontFamily: "Anek Bangla",
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
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: (isOngoing || isPast || exam.id.startsWith("mock-"))
                            ? const Color(0xFF059669)
                            : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      onPressed: isOngoing
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
                        isOngoing
                            ? "পরীক্ষা শুরু করুন"
                            : (isUpcoming ? "পরীক্ষা এখনও শুরু হয়নি" : "অনুশীলন পরীক্ষা শুরু করুন"),
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: (isOngoing || isPast || exam.id.startsWith("mock-"))
                              ? Colors.white
                              : (isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8)),
                          fontFamily: "Anek Bangla",
                        ),
                      ),
                    ),
                  ),
                ] else ...[
                  // When exam is past, show Solutions & Practice retake buttons
                  if (isPast || exam.id.startsWith("mock-")) ...[
                    // Solutions Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
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
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15.5, fontFamily: "Anek Bangla"),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Retake as Practice Button
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
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, fontFamily: "Anek Bangla"),
                        ),
                      ),
                    ),
                  ],
                ],

                // Score Overview Card (When taken)
                if (isTaken && attempt != null) ...[
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
                          "আপনার ফলাফলের সারসংক্ষেপ (অফিসিয়াল)",
                          style: TextStyle(
                            fontSize: 15.5,
                            fontWeight: FontWeight.w800,
                            fontFamily: "Anek Bangla",
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
                            _buildScoreStat("মোট স্কোর", "${attempt.score}", isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A), isDark),
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
                                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, fontFamily: "HindSiliguri"),
                                  ),
                                ],
                              ),
                              Text(
                                "${practiceHistory.length} বার সম্পন্ন",
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? Colors.white54 : Colors.black54,
                                  fontFamily: "HindSiliguri",
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
                                            fontFamily: "HindSiliguri",
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
                  error: (_, __) => const SizedBox(),
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
                                  fontFamily: "HindSiliguri",
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                "পরীক্ষার গোপনীয়তা ও সমতা বজায় রাখতে, লাইভ পরীক্ষার সময়সীমা (${exam.endTime.hour.toString().padLeft(2, "0")}:${exam.endTime.minute.toString().padLeft(2, "0")}) শেষ হওয়ার পর সম্পূর্ণ সমাধান ও মেধা তালিকা উন্মুক্ত করা হবে।",
                                style: TextStyle(
                                  fontSize: 12.5,
                                  height: 1.4,
                                  color: isDark ? Colors.white70 : const Color(0xFF78350F),
                                  fontFamily: "HindSiliguri",
                                ),
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
                                  fontFamily: "HindSiliguri",
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                "কর্তৃপক্ষ কর্তৃক এই পরীক্ষার মেধা তালিকা সাময়িকভাবে অপ্রকাশিত রাখা হয়েছে।",
                                style: TextStyle(
                                  fontSize: 12.5,
                                  height: 1.4,
                                  color: isDark ? Colors.white70 : const Color(0xFF4B5563),
                                  fontFamily: "HindSiliguri",
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
                    error: (_, __) => const SizedBox(),
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
                                      fontFamily: "Anek Bangla",
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
                                          fontFamily: "Anek Bangla",
                                          color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        lb.userInstitute.isNotEmpty ? lb.userInstitute : "প্রতিষ্ঠান নেই",
                                        style: TextStyle(
                                          fontSize: 11.5,
                                          fontFamily: "Anek Bangla",
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
                                    fontFamily: "Anek Bangla",
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
                                      fontFamily: "Anek Bangla",
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
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, fontFamily: "Anek Bangla"),
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
            fontFamily: "Anek Bangla",
            color: color,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontFamily: "Anek Bangla",
            fontWeight: FontWeight.w500,
            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildMetaItem(String label, String value, bool isDark) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w900,
            fontFamily: "Anek Bangla",
            color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontFamily: "Anek Bangla",
            fontWeight: FontWeight.w500,
            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }
}
