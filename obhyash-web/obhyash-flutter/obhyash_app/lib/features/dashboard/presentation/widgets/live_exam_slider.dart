import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../live_exam/domain/models.dart';
import '../../providers/dashboard_providers.dart';

class LiveExamSlider extends ConsumerWidget {
  const LiveExamSlider({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final liveExamsAsync = ref.watch(dashboardLiveExamsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final displayExams = liveExamsAsync.when(
      data: (exams) => exams.isNotEmpty ? exams : _getDemoExams(),
      loading: () => _getDemoExams(),
      error: (_, _) => _getDemoExams(),
    );

    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 0),
      child: CarouselSlider(
        options: CarouselOptions(
          height: 155.0,
          autoPlay: displayExams.length > 1,
          autoPlayInterval: const Duration(seconds: 5),
          enlargeCenterPage: true,
          viewportFraction: 0.92,
          aspectRatio: 2.3,
        ),
        items: displayExams.map((exam) {
          return Builder(
            builder: (BuildContext context) {
              return _buildExamCard(context, exam, isDark);
            },
          );
        }).toList(),
      ),
    );
  }

  static List<LiveExam> _getDemoExams() {
    final now = DateTime.now();
    return [
      LiveExam(
        id: 'demo-1',
        title: 'HSC পদার্থবিজ্ঞান ১ম পত্র পূর্ণাঙ্গ লাইভ মক',
        description: 'অধ্যায় ১-১০ সমন্বিত স্পেশাল মডেল টেস্ট',
        startTime: now.subtract(const Duration(minutes: 30)),
        endTime: now.add(const Duration(hours: 3)),
        durationMinutes: 45,
        totalQuestions: 50,
        totalMarks: 50,
        negativeMarking: 0.25,
        status: 'published',
        category: 'HSC',
      ),
      LiveExam(
        id: 'demo-2',
        title: 'মেডিকেল স্পেশাল বায়োলজি মেগা লাইভ এক্সাম',
        description: 'প্রাণীবিজ্ঞান ও উদ্ভিদবিজ্ঞান সমন্বিত টেস্ট',
        startTime: now.add(const Duration(hours: 4)),
        endTime: now.add(const Duration(hours: 9)),
        durationMinutes: 60,
        totalQuestions: 100,
        totalMarks: 100,
        negativeMarking: 0.25,
        status: 'published',
        category: 'Medical',
      ),
      LiveExam(
        id: 'demo-3',
        title: 'রসায়ন ২য় পত্র: জৈব রসায়ন স্পেশাল এক্সাম',
        description: 'জৈব যৌগ ও পরিবেশ রসায়ন অধ্যায়ভিত্তিক পরীক্ষা',
        startTime: now.add(const Duration(days: 1, hours: 2)),
        endTime: now.add(const Duration(days: 1, hours: 6)),
        durationMinutes: 30,
        totalQuestions: 30,
        totalMarks: 30,
        negativeMarking: 0.25,
        status: 'published',
        category: 'HSC',
      ),
    ];
  }

  Widget _buildExamCard(BuildContext context, LiveExam exam, bool isDark) {
    final isOngoing = exam.isOngoing;
    final formatter = DateFormat('dd MMM, hh:mm a');

    final bgGradient = isOngoing
        ? LinearGradient(
            colors: isDark
                ? [const Color(0xFF047857), const Color(0xFF064E3B)]
                : [const Color(0xFF10B981), const Color(0xFF059669)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          )
        : LinearGradient(
            colors: isDark
                ? [const Color(0xFFD97706), const Color(0xFF92400E)]
                : [const Color(0xFFF59E0B), const Color(0xFFD97706)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          );

    return Container(
      width: MediaQuery.of(context).size.width,
      margin: const EdgeInsets.symmetric(horizontal: 4.0),
      decoration: BoxDecoration(
        gradient: bgGradient,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: (isOngoing ? const Color(0xFF059669) : const Color(0xFFD97706))
                .withValues(alpha: 0.25),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -10,
            bottom: -15,
            child: Icon(
              isOngoing ? LucideIcons.radio : LucideIcons.calendarClock,
              size: 110,
              color: Colors.white.withValues(alpha: 0.12),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 13.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Top Tag
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.22),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isOngoing ? LucideIcons.radio : LucideIcons.clock,
                        color: Colors.white,
                        size: 11,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        isOngoing ? 'LIVE NOW' : 'UPCOMING',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                ),

                // Exam Title
                Text(
                  exam.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'Anek Bangla',
                    height: 1.25,
                  ),
                ),

                // Bottom Timing & Button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isOngoing ? 'শেষ হবে:' : 'শুরু হবে:',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.8),
                            fontSize: 12,
                            fontFamily: 'Anek Bangla',
                          ),
                        ),
                        Text(
                          formatter.format(isOngoing ? exam.endTime : exam.startTime),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    ElevatedButton(
                      onPressed: () {
                        context.go('/live-exams');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: isOngoing
                            ? const Color(0xFF059669)
                            : const Color(0xFFD97706),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        minimumSize: const Size(0, 30),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'অংশগ্রহণ করুন',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'Anek Bangla',
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
