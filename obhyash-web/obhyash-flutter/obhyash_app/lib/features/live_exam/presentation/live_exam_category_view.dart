import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../providers/live_exam_providers.dart';
import '../domain/models.dart';

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
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Search Bar
            Container(
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                borderRadius: BorderRadius.circular(30),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF27272A)
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
              child: TextField(
                onChanged: (val) {
                  ref.read(liveExamSearchProvider.notifier).updateSearch(val);
                },
                style: TextStyle(
                  color: isDark ? Colors.white : const Color(0xFF000000),
                ),
                decoration: InputDecoration(
                  hintText: 'Search for exams...',
                  hintStyle: const TextStyle(color: Color(0xFFA3A3A3)),
                  prefixIcon: const Icon(
                    LucideIcons.search,
                    color: Color(0xFFA3A3A3),
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 14,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Filters & Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Filter Chips
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF27272A)
                          : const Color(0xFFE5E5E5),
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
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: isActive
                                ? const Color(
                                    0xFF1D8A43,
                                  ) // web app specific green
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(30),
                            boxShadow: isActive
                                ? const [
                                    BoxShadow(
                                      color: Color(0x331D8A43),
                                      blurRadius: 4,
                                      offset: Offset(0, 2),
                                    ),
                                  ]
                                : [],
                          ),
                          child: Text(
                            f,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: isActive
                                  ? Colors.white
                                  : (isDark
                                        ? const Color(0xFFA3A3A3)
                                        : const Color(0xFF525252)),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                // Routine & Schedule Actions
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF1E3A8A).withOpacity(0.3)
                            : const Color(0xFFE8F0FE),
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            LucideIcons.calendar,
                            size: 14,
                            color: isDark
                                ? const Color(0xFF27272A)
                                : const Color(0xFF1A73E8),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Routine',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: isDark
                                  ? const Color(0xFF27272A)
                                  : const Color(0xFF1A73E8),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Exams Grid
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
                    'No live exams found for this category.',
                    style: TextStyle(
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF737373),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              )
            else
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: MediaQuery.of(context).size.width > 600
                      ? 2
                      : 1,
                  childAspectRatio: 2.2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemCount: filteredExams.length,
                itemBuilder: (context, index) {
                  return _LiveExamCard(exam: filteredExams[index]);
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _LiveExamCard extends StatelessWidget {
  final LiveExam exam;

  const _LiveExamCard({required this.exam});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isTaken = exam.userAttemptStatus == 'submitted';

    String statusText = "Upcoming";
    Color statusColor = isDark
        ? const Color(0xFF27272A)
        : const Color(0xFF000000); // blue
    Color statusBg = isDark
        ? const Color(0xFF1E3A8A).withOpacity(0.3)
        : const Color(0xFFEFF6FF);

    if (exam.isOngoing) {
      statusText = "Ongoing";
      statusColor = isDark
          ? const Color(0xFF4ADE80)
          : const Color(0xFF2CA05A); // green
      statusBg = isDark
          ? const Color(0xFF14532D).withOpacity(0.3)
          : const Color(0xFFEBFAEF);
    } else if (exam.isPast) {
      statusText = "Past";
      statusColor = isDark
          ? const Color(0xFFA3A3A3)
          : const Color(0xFF737373); // gray
      statusBg = isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5);
    }

    final now = DateTime.now();
    final msDiff = (now.difference(exam.startTime).inMilliseconds).abs();
    final daysDiff = (msDiff / (1000 * 60 * 60 * 24)).ceil();
    final timeDisplay = now.isAfter(exam.startTime)
        ? '$daysDiff দিন আগে'
        : 'বাকি - $daysDiff দিন';

    return GestureDetector(
      onTap: () {
        // Navigate to Exam Details
        context.push('/live_exam_details/${exam.id}', extra: exam);
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFF5F5F5),
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
            Text(
              exam.title,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : const Color(0xFF000000),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(
                  LucideIcons.clock,
                  size: 14,
                  color: isDark
                      ? const Color(0xFFA3A3A3)
                      : const Color(0xFF737373),
                ),
                const SizedBox(width: 6),
                Text(
                  '${exam.durationMinutes} মিনিট',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: isDark
                        ? const Color(0xFFA3A3A3)
                        : const Color(0xFF737373),
                  ),
                ),
                const SizedBox(width: 16),
                Icon(
                  LucideIcons.fileText,
                  size: 14,
                  color: isDark
                      ? const Color(0xFFA3A3A3)
                      : const Color(0xFF737373),
                ),
                const SizedBox(width: 6),
                Text(
                  '${exam.totalQuestions} টি প্রশ্ন',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: isDark
                        ? const Color(0xFFA3A3A3)
                        : const Color(0xFF737373),
                  ),
                ),
              ],
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: statusBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(
                        LucideIcons.checkCircle,
                        size: 16,
                        color: statusColor,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        isTaken ? 'Taken' : statusText,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: statusColor,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    timeDisplay,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: isDark
                          ? const Color(0xFFE5E5E5)
                          : const Color(0xFF1C1C1E),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
