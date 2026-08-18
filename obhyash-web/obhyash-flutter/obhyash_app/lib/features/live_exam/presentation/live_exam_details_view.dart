import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../providers/live_exam_providers.dart';
import '../domain/models.dart';

class LiveExamDetailsView extends ConsumerWidget {
  final String examId;
  final LiveExam? preloadedExam;

  const LiveExamDetailsView({
    super.key,
    required this.examId,
    this.preloadedExam,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final detailsAsync = ref.watch(liveExamDetailsProvider(examId));
    final leaderboardAsync = ref.watch(liveExamLeaderboardProvider(examId));
    final practiceHistoryAsync = ref.watch(liveExamPracticeHistoryProvider(examId));

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAFA),
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
        title: Text(
          'পরীক্ষার বিবরণ',
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black87,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: detailsAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: Color(0xFF0B6B42)),
        ),
        error: (err, stack) => Center(
          child: Text(
            'তথ্য লোড করতে সমস্যা হয়েছে',
            style: TextStyle(color: isDark ? Colors.white70 : Colors.black54),
          ),
        ),
        data: (data) {
          final exam = data.exam;
          final attempt = data.attempt;

          final now = DateTime.now();
          final isOngoing = now.isAfter(exam.startTime) && now.isBefore(exam.endTime);
          final isUpcoming = now.isBefore(exam.startTime);
          final isPast = now.isAfter(exam.endTime);
          final isTaken = attempt?.status == 'submitted';

          String statusBadgeText = isOngoing
              ? 'Ongoing Live'
              : isUpcoming
                  ? 'Upcoming'
                  : 'Past Exam';
          Color statusBadgeColor = isOngoing
              ? const Color(0xFF10B981)
              : isUpcoming
                  ? const Color(0xFF3B82F6)
                  : const Color(0xFF71717A);

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5),
                    ),
                    boxShadow: [
                      if (!isDark)
                        const BoxShadow(
                          color: Color(0x06000000),
                          blurRadius: 8,
                          offset: Offset(0, 4),
                        ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              exam.category.toUpperCase(),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0B6B42),
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusBadgeColor.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              statusBadgeText,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: statusBadgeColor,
                              ),
                            ),
                          ),
                        ],
                         Text(
                        exam.title,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : Colors.black87,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Schedule Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5),
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const Icon(LucideIcons.calendar, size: 18, color: Color(0xFF0B6B42)),
                          const SizedBox(width: 8),
                          Text(
                            'পরীক্ষার সময়সূচী',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : Colors.black87,
                              fontFamily: 'HindSiliguri',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('শুরু', style: TextStyle(fontSize: 11, color: isDark ? Colors.white54 : Colors.black54)),
                              const SizedBox(height: 2),
                              Text(
                                '${exam.startTime.day}/${exam.startTime.month}/${exam.startTime.year}',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black87),
                              ),
                              Text(
                                '${exam.startTime.hour.toString().padLeft(2, '0')}:${exam.startTime.minute.toString().padLeft(2, '0')}',
                                style: const TextStyle(fontSize: 12, color: Color(0xFF0B6B42), fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          Icon(LucideIcons.arrowRight, size: 20, color: isDark ? Colors.white24 : Colors.black26),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('সমাপ্তি', style: TextStyle(fontSize: 11, color: isDark ? Colors.white54 : Colors.black54)),
                              const SizedBox(height: 2),
                              Text(
                                '${exam.endTime.day}/${exam.endTime.month}/${exam.endTime.year}',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black87),
                              ),
                              Text(
                                '${exam.endTime.hour.toString().padLeft(2, '0')}:${exam.endTime.minute.toString().padLeft(2, '0')}',
                                style: const TextStyle(fontSize: 12, color: Color(0xFFEF4444), fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Meta 3-Column Info
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMetaItem('সময়', '${exam.durationMinutes} মি.', LucideIcons.clock, isDark),
                      Container(width: 1, height: 32, color: isDark ? Colors.white12 : Colors.black12),
                      _buildMetaItem('মোট প্রশ্ন', '${exam.totalQuestions} টি', LucideIcons.helpCircle, isDark),
                      Container(width: 1, height: 32, color: isDark ? Colors.white12 : Colors.black12),
                      _buildMetaItem('নেগেটিভ মার্ক', '-${exam.negativeMarking}', LucideIcons.alertTriangle, isDark),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Syllabus & Chapter Breakdown Card
                Builder(
                  builder: (context) {
                    final syllabusList = exam.description.trim().isNotEmpty
                        ? exam.description
                            .split(RegExp(r'[\n\r,;•|]+'))
                            .map((s) => s.trim())
                            .where((s) => s.isNotEmpty)
                            .toList()
                        : <String>[];

                    return Container(
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
                          const Row(
                            children: [
                              Icon(LucideIcons.bookOpen, color: Color(0xFF0B6B42), size: 16),
                              SizedBox(width: 8),
                              Text(
                                'সিলেবাস ও অধ্যায়সমূহ',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF0B6B42),
                                  fontFamily: 'HindSiliguri',
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (syllabusList.isNotEmpty)
                            LayoutBuilder(
                              builder: (context, constraints) {
                                final itemWidth = (constraints.maxWidth - 10) / 2;
                                return Wrap(
                                  spacing: 10,
                                  runSpacing: 10,
                                  children: List.generate(syllabusList.length, (idx) {
                                    final item = syllabusList[idx];
                                    final serial = (idx + 1).toString().padLeft(2, '0');

                                    return Container(
                                      width: itemWidth,
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                      decoration: BoxDecoration(
                                        color: isDark ? const Color(0xFF27272A) : const Color(0xFFFAFAFA),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E5E5),
                                          width: 1,
                                        ),
                                      ),
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.center,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF0B6B42).withValues(alpha: 0.15),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              serial,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFF0B6B42),
                                                fontFamily: 'HindSiliguri',
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              item,
                                              style: TextStyle(
                                                fontSize: 12.5,
                                                fontWeight: FontWeight.w600,
                                                color: isDark ? Colors.white : const Color(0xFF0F172A),
                                                fontFamily: 'HindSiliguri',
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
                          else
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF27272A) : const Color(0xFFFAFAFA),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                'এই পরীক্ষার সিলেবাসে বোর্ড পাঠ্যবইয়ের সংশ্লিষ্ট অধ্যায়সমূহ অন্তর্ভুক্ত রয়েছে।',
                                style: TextStyle(
                                  fontSize: 13,
                                  height: 1.4,
                                  color: isDark ? Colors.white70 : Colors.black87,
                                  fontFamily: 'HindSiliguri',
                                ),
                              ),
                            ),
                        ],
                      ),
                    );
                  },
                ),��েছে।',
                          style: TextStyle(
                            fontSize: 13,
                            height: 1.4,
                            color: isDark ? Colors.white70 : Colors.black87,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Anti-Leakage / Pending Results Banner
                if (isTaken && isOngoing && !exam.id.startsWith('mock-')) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFFDE68A)),
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
                                'উত্তরপত্র সফলভাবে জমা হয়েছে!',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF92400E),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'পরীক্ষার সময়সীমা শেষ হওয়ার পর সমাধান ও মেধা তালিকা উন্মুক্ত করা হবে।',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: const Color(0xFFB45309).withOpacity(0.9),
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Action Buttons
                if (!isTaken) ...[
                  if (isOngoing)
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0B6B42),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                        elevation: 4,
                      ),
                      onPressed: () {
                        context.push('/live_exam_session/${exam.id}', extra: exam);
                      },
                      icon: const Icon(LucideIcons.play, size: 18),
                      label: const Text(
                        'পরীক্ষা শুরু করুন',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    )
                  else if (isUpcoming)
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
                        foregroundColor: isDark ? Colors.white38 : Colors.black38,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      onPressed: null,
                      child: const Text('পরীক্ষা এখনো শুরু হয়নি'),
                    )
                  else
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0B6B42),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      onPressed: () {
                        context.push('/live_exam_session/${exam.id}', extra: exam);
                      },
                      icon: const Icon(LucideIcons.rotateCcw, size: 18),
                      label: const Text(
                        'অনুশীলন পরীক্ষা শুরু করুন',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                ] else ...[
                  if (isPast || exam.id.startsWith('mock-')) ...[
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0B6B42),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                        elevation: 4,
                      ),
                      onPressed: () {
                        context.push('/live_exam_solution/${exam.id}', extra: exam);
                      },
                      icon: const Icon(LucideIcons.bookOpen, size: 18),
                      label: const Text(
                        'সমাধান ও ব্যাখ্যা দেখুন',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF0B6B42),
                        side: const BorderSide(color: Color(0xFF0B6B42), width: 1.5),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      onPressed: () {
                        context.push('/live_exam_session/${exam.id}', extra: exam);
                      },
                      icon: const Icon(LucideIcons.rotateCcw, size: 18),
                      label: const Text(
                        'পুনরায় অনুশীলন করুন',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ] else ...[
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
                        foregroundColor: isDark ? Colors.white38 : Colors.black38,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      onPressed: null,
                      icon: const Icon(LucideIcons.clock, size: 18),
                      label: const Text('ফলাফল প্রকাশের অপেক্ষায়...'),
                    ),
                  ],
                ],

                // Official Attempt Result Card
                if (isTaken && (isPast || exam.id.startsWith('mock-')) && attempt != null) ...[
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: const Color(0xFF10B981).withValues(alpha: 0.3),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Row(
                              children: [
                                Icon(LucideIcons.award, color: Color(0xFF10B981), size: 18),
                                SizedBox(width: 8),
                                Text(
                                  'অফিসিয়াল ফলাফল',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'HindSiliguri',
                                  ),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'মেধা তালিকায় অন্তর্ভুক্ত',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF10B981),
                                  fontFamily: 'HindSiliguri',
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildScoreStat('সঠিক', '${attempt.correctCount}', const Color(0xFF10B981), isDark),
                            Container(width: 1, height: 28, color: isDark ? Colors.white12 : Colors.black12),
                            _buildScoreStat('ভুল', '${attempt.wrongCount}', const Color(0xFFEF4444), isDark),
                            Container(width: 1, height: 28, color: isDark ? Colors.white12 : Colors.black12),
                            _buildScoreStat('মোট নম্বর', '${attempt.score}', const Color(0xFF3B82F6), isDark),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],

                // Practice History Section
                practiceHistoryAsync.maybeWhen(
                  data: (history) {
                    if (history.isEmpty) return const SizedBox();
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 20),
                        Row(
                          children: [
                            const Icon(LucideIcons.history, color: Color(0xFF3B82F6), size: 18),
                            const SizedBox(width: 8),
                            Text(
                              'অনুশীলন পরীক্ষার ইতিহাস (${history.length})',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                                color: isDark ? Colors.white : Colors.black87,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: history.length,
                          itemBuilder: (ctx, idx) {
                            final ph = history[idx];
                            final dt = ph.submitTime.toLocal();
                            final timeStr = '${dt.day}/${dt.month}/${dt.year} • ${dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour)}:${dt.minute.toString().padLeft(2, '0')} ${dt.hour >= 12 ? 'PM' : 'AM'}';
                            final durationMins = ph.timeTakenSeconds ~/ 60;
                            final durationSecs = ph.timeTakenSeconds % 60;

                            return Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(
                                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 38,
                                    height: 38,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF3B82F6).withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      '#${history.length - idx}',
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF3B82F6),
                                        fontFamily: 'HindSiliguri',
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          timeStr,
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                            color: isDark ? Colors.white54 : Colors.black54,
                                            fontFamily: 'HindSiliguri',
                                          ),
                                        ),
                                        const SizedBox(height: 3),
                                        Row(
                                          children: [
                                            Text(
                                              'সঠিক: ${ph.correctCount}',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFF10B981),
                                                fontFamily: 'HindSiliguri',
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Text(
                                              '• ভুল: ${ph.wrongCount}',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFFEF4444),
                                                fontFamily: 'HindSiliguri',
                                              ),
                                            ),
                                            if (ph.timeTakenSeconds > 0) ...[
                                              const SizedBox(width: 6),
                                              Text(
                                                '• $durationMins মি. $durationSecs সে.',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: isDark ? Colors.white38 : Colors.black38,
                                                  fontFamily: 'HindSiliguri',
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '${ph.score}',
                                        style: const TextStyle(
                                          fontSize: 17,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFF0B6B42),
                                          fontFamily: 'HindSiliguri',
                                        ),
                                      ),
                                      Text(
                                        '/ ${exam.totalMarks}',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: isDark ? Colors.white38 : Colors.black38,
                                          fontFamily: 'HindSiliguri',
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ],
                    );
                  },
                  orElse: () => const SizedBox(),
                ),

                // Leaderboard Section (when finished / past)
                if (isTaken && (isPast || exam.id.startsWith('mock-'))) ...[
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(LucideIcons.trophy, color: Color(0xFFF59E0B), size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'শীর্ষ মেধা তালিকা',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : Colors.black87,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        'শীর্ষ ৫ জন',
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
                          child: const Center(child: Text('মেধা তালিকার তথ্য এখনও নেই')),
                        );
                      }
                      return Column(
                        children: leaderboard.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final lb = entry.value;
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: idx == 0
                                    ? const Color(0xFFF59E0B).withOpacity(0.5)
                                    : isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5),
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 28,
                                  height: 28,
                                  decoration: BoxDecoration(
                                    color: idx == 0
                                        ? const Color(0xFFF59E0B)
                                        : idx == 1
                                            ? const Color(0xFF94A3B8)
                                            : idx == 2
                                                ? const Color(0xFFB45309)
                                                : isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    '#${idx + 1}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: idx < 3 ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
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
                                          fontWeight: FontWeight.bold,
                                          color: isDark ? Colors.white : Colors.black87,
                                        ),
                                      ),
                                      Text(
                                        lb.userInstitute,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isDark ? Colors.white54 : Colors.black54,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  '${lb.score}',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF0B6B42),
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
                        foregroundColor: const Color(0xFF0B6B42),
                        side: const BorderSide(color: Color(0xFF0B6B42), width: 1.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () {
                        context.push(
                          '/live_exam_leaderboard/${exam.id}',
                          extra: exam,
                        );
                      },
                      icon: const Icon(LucideIcons.trophy, size: 18),
                      label: const Text(
                        'সম্পূর্ণ মেধা তালিকা দেখুন',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
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
            fontSize: 18,
            fontWeight: FontWeight.bold,
            fontFamily: 'HindSiliguri',
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontFamily: 'HindSiliguri',
            color: isDark ? Colors.white54 : Colors.black54,
          ),
        ),
      ],
    );
  }

  Widget _buildMetaItem(String label, String value, IconData icon, bool isDark) {
    return Column(
      children: [
        Icon(icon, size: 18, color: const Color(0xFF0B6B42)),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.black87,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: isDark ? Colors.white54 : Colors.black54,
          ),
        ),
      ],
    );
  }
}
