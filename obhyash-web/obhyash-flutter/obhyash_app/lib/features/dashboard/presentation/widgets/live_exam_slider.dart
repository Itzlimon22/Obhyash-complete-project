import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../live_exam/domain/models.dart';
import '../../providers/dashboard_providers.dart';

class LiveExamSlider extends ConsumerWidget {
  const LiveExamSlider({super.key});

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
  Widget build(BuildContext context, WidgetRef ref) {
    final liveExamsAsync = ref.watch(dashboardLiveExamsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return liveExamsAsync.when(
      data: (exams) {
        if (exams.isEmpty) {
          return const SizedBox.shrink();
        }

        return Padding(
          padding: const EdgeInsets.only(top: 14, bottom: 6),
          child: CarouselSlider(
            options: CarouselOptions(
              height: 100.0,
              autoPlay: exams.length > 1,
              autoPlayInterval: const Duration(seconds: 5),
              enlargeCenterPage: false,
              viewportFraction: 0.95,
              enableInfiniteScroll: exams.length > 1,
            ),
            items: exams.map((exam) {
              return Builder(
                builder: (BuildContext context) {
                  return _buildExamCard(context, exam, isDark);
                },
              );
            }).toList(),
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }

  Widget _buildExamCard(BuildContext context, LiveExam exam, bool isDark) {
    final isOngoing = exam.isOngoing;
    final isTaken = exam.userAttemptStatus == 'submitted';

    Color cardBg = isDark ? const Color(0xFF18181B) : Colors.white;
    Color borderColor = isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0);
    Color bottomStripBg;
    Color statusColor;
    String statusText;
    IconData statusIcon;

    if (isTaken) {
      statusText = 'অংশগ্রহণকৃত';
      statusIcon = LucideIcons.checkCircle2;
      statusColor = isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB);
      bottomStripBg = isDark ? const Color(0xFF27272A) : const Color(0xFFEFF6FF);
    } else if (isOngoing) {
      statusText = 'Ongoing';
      statusIcon = LucideIcons.zap;
      statusColor = isDark ? const Color(0xFF34D399) : const Color(0xFF12544F);
      bottomStripBg = isDark ? const Color(0xFF12544F).withValues(alpha: 0.25) : const Color(0xFFE6F0EC);
    } else {
      statusText = 'Upcoming';
      statusIcon = LucideIcons.clock;
      statusColor = const Color(0xFF740A03);
      bottomStripBg = isDark ? const Color(0xFF740A03).withValues(alpha: 0.18) : const Color(0xFFFEF2F2);
    }

    final timeRemainingText = _formatTimeRemaining(exam);
    final durationText = _formatDurationBn(exam.durationMinutes);
    final questionsText = '${_toBanglaDigits(exam.totalQuestions > 0 ? exam.totalQuestions : 25)} টি প্রশ্ন';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          final cat = exam.category.isNotEmpty ? exam.category : 'hsc';
          context.go('/live_exam/$cat');
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: MediaQuery.of(context).size.width,
          margin: const EdgeInsets.symmetric(horizontal: 4.0),
          padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 9.0),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: borderColor, width: 1.0),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Row 1: Exam Title & Arrow
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Text(
                      exam.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Anek Bangla',
                        letterSpacing: -0.2,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Icon(
                    LucideIcons.chevronRight,
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                    size: 14,
                  ),
                ],
              ),

              // Row 2: Metadata (Duration | Questions)
              Row(
                children: [
                  Icon(
                    LucideIcons.clock,
                    size: 12,
                    color: const Color(0xFFEF4444),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    durationText,
                    style: TextStyle(
                      color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155),
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                      fontFamily: 'Anek Bangla',
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 7.0),
                    child: Text(
                      '|',
                      style: TextStyle(
                        color: isDark ? const Color(0xFF33384C) : const Color(0xFFCBD5E1),
                        fontSize: 11.5,
                      ),
                    ),
                  ),
                  Icon(
                    LucideIcons.fileText,
                    size: 12,
                    color: const Color(0xFF10B981),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    questionsText,
                    style: TextStyle(
                      color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155),
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                      fontFamily: 'Anek Bangla',
                    ),
                  ),
                ],
              ),

              // Row 3: Bottom Status Bar Strip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                decoration: BoxDecoration(
                  color: bottomStripBg,
                  borderRadius: BorderRadius.circular(10),
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
                          size: 13,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          statusText,
                          style: TextStyle(
                            color: statusColor,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      timeRemainingText,
                      style: TextStyle(
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Anek Bangla',
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
