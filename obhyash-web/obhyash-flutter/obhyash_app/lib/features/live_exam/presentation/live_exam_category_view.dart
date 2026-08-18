import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../providers/live_exam_providers.dart';
import '../domain/models.dart';
import 'widgets/live_exam_routine_sheet.dart';

class LiveExamCategoryView extends ConsumerStatefulWidget {
  final String category;

  const LiveExamCategoryView({super.key, required this.category});

  @override
  ConsumerState<LiveExamCategoryView> createState() =>
      _LiveExamCategoryViewState();
}

class _LiveExamCategoryViewState extends ConsumerState<LiveExamCategoryView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(liveExamCategoryProvider.notifier)
          .updateCategory(widget.category);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filteredExams = ref.watch(filteredLiveExamsProvider);
    final isLoading = ref.watch(liveExamsProvider).isLoading;
    final filter = ref.watch(liveExamFilterProvider);

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF0C0A09)
          : const Color(0xFFFAFAFA),
      body: RefreshIndicator(
        color: const Color(0xFF004633),
        onRefresh: () async {
          ref.invalidate(liveExamsProvider);
          try {
            await ref.read(liveExamsProvider.future);
          } catch (_) {}
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Filters & Routine Action Bar
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Filter Chips (All, Ongoing, Upcoming)
                  Container(
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF181A24) : Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF272A38)
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: ['All', 'Ongoing', 'Upcoming'].map((f) {
                        final isActive = filter == f;
                        return GestureDetector(
                          onTap: () {
                            ref
                                .read(liveExamFilterProvider.notifier)
                                .updateFilter(f);
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? const Color(0xFF004633)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              f,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: isActive
                                    ? Colors.white
                                    : (isDark
                                        ? const Color(0xFF94A3B8)
                                        : const Color(0xFF64748B)),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),

                  // Routine Action Button
                  GestureDetector(
                    onTap: () {
                      LiveExamRoutineSheet.show(context, widget.category);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF1E3A8A).withValues(alpha: 0.25)
                            : const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF1E3A8A).withValues(alpha: 0.5)
                              : const Color(0xFFBFDBFE),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            LucideIcons.calendar,
                            size: 13,
                            color: isDark
                                ? const Color(0xFF60A5FA)
                                : const Color(0xFF2563EB),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            'রুটিন',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'Anek Bangla',
                              color: isDark
                                  ? const Color(0xFF60A5FA)
                                  : const Color(0xFF2563EB),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Exams List
              if (isLoading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (filteredExams.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: Text(
                      'এই ক্যাটাগরিতে বর্তমানে কোনো লাইভ পরীক্ষা নেই।',
                      style: TextStyle(
                        color: isDark
                            ? const Color(0xFFA3A3A3)
                            : const Color(0xFF737373),
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Anek Bangla',
                        fontSize: 14,
                      ),
                    ),
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: filteredExams.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 14),
                  itemBuilder: (context, index) {
                    return _LiveExamCard(exam: filteredExams[index]);
                  },
                ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _LiveExamCard extends StatelessWidget {
  final LiveExam exam;

  const _LiveExamCard({required this.exam});

  static String _toBanglaDigits(dynamic number) {
    const en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    String s = number.toString();
    for (int i = 0; i < 10; i++) {
      s = s.replaceAll(en[i], bn[i]);
    }
    return s;
  }

  static String _formatDurationBn(int minutes) {
    if (minutes <= 0) return '২০ মিনিট';
    if (minutes < 60) return '${_toBanglaDigits(minutes)} মিনিট';
    final h = minutes ~/ 60;
    final m = minutes % 60;
    if (m == 0) return '${_toBanglaDigits(h)} ঘণ্টা';
    return '${_toBanglaDigits(h)} ঘণ্টা ${_toBanglaDigits(m)} মিনিট';
  }

  static String _formatTimeRemaining(LiveExam exam) {
    final now = DateTime.now();
    if (exam.isOngoing) {
      final diff = exam.endTime.difference(now);
      if (diff.inDays > 0) return 'সময় বাকি - ${_toBanglaDigits(diff.inDays)} দিন';
      if (diff.inHours > 0) return 'সময় বাকি - ${_toBanglaDigits(diff.inHours)} ঘণ্টা';
      if (diff.inMinutes > 0) return 'সময় বাকি - ${_toBanglaDigits(diff.inMinutes)} মিনিট';
      return 'শীঘ্রই শেষ হবে';
    } else if (exam.isPast) {
      return 'পরীক্ষা সম্পন্ন';
    } else {
      final diff = exam.startTime.difference(now);
      if (diff.inDays > 0) return 'সময় বাকি - ${_toBanglaDigits(diff.inDays)} দিন';
      if (diff.inHours > 0) return 'সময় বাকি - ${_toBanglaDigits(diff.inHours)} ঘণ্টা';
      if (diff.inMinutes > 0) return 'সময় বাকি - ${_toBanglaDigits(diff.inMinutes)} মিনিট';
      return 'আজ শুরু হবে';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isOngoing = exam.isOngoing;
    final isTaken = exam.userAttemptStatus == 'submitted';

    Color cardBg = isDark ? const Color(0xFF13151F) : Colors.white;
    Color borderColor = isDark ? const Color(0xFF232738) : const Color(0xFFE2E8F0);
    Color bottomStripBg;
    Color statusColor;
    String statusText;
    IconData statusIcon;

    if (isTaken) {
      statusText = 'অংশগ্রহণকৃত';
      statusIcon = LucideIcons.checkCircle2;
      statusColor = isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB);
      bottomStripBg = isDark ? const Color(0xFF0E1A2E) : const Color(0xFFEFF6FF);
    } else if (isOngoing) {
      statusText = 'Ongoing';
      statusIcon = LucideIcons.zap;
      statusColor = isDark ? const Color(0xFF4ADE80) : const Color(0xFF15803D);
      bottomStripBg = isDark ? const Color(0xFF0C2419) : const Color(0xFFF0FDF4);
    } else {
      statusText = 'Upcoming';
      statusIcon = LucideIcons.clock;
      statusColor = isDark ? const Color(0xFFF87171) : const Color(0xFFB91C1C);
      bottomStripBg = isDark ? const Color(0xFF260C0E) : const Color(0xFFFEF2F2);
    }

    final durationText = _formatDurationBn(exam.durationMinutes);
    final questionsText = '${_toBanglaDigits(exam.totalQuestions > 0 ? exam.totalQuestions : 25)} টি প্রশ্ন';
    final timeRemainingText = _formatTimeRemaining(exam);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          context.push('/live_exam_details/${exam.id}', extra: exam);
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: borderColor, width: 1.2),
            boxShadow: [
              BoxShadow(
                color: isDark
                    ? Colors.black.withValues(alpha: 0.25)
                    : const Color(0xFF64748B).withValues(alpha: 0.06),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Row 1: Exam Title
              Text(
                exam.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Anek Bangla',
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 10),

              // Row 2: Metadata (Duration | Questions)
              Row(
                children: [
                  Icon(
                    LucideIcons.clock,
                    size: 14,
                    color: const Color(0xFFEF4444),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    durationText,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      fontFamily: 'Anek Bangla',
                      color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8.0),
                    child: Text(
                      '|',
                      style: TextStyle(
                        color: isDark ? const Color(0xFF33384C) : const Color(0xFFCBD5E1),
                        fontSize: 13,
                      ),
                    ),
                  ),
                  Icon(
                    LucideIcons.fileText,
                    size: 14,
                    color: const Color(0xFF10B981),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    questionsText,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      fontFamily: 'Anek Bangla',
                      color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Row 3: Bottom Full Status Strip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: bottomStripBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          statusIcon,
                          color: statusColor,
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          statusText,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: statusColor,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      timeRemainingText,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Anek Bangla',
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
