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

    return liveExamsAsync.when(
      data: (exams) {
        if (exams.isEmpty) {
          return const SizedBox(height: 20);
        }

        return Padding(
          padding: const EdgeInsets.only(top: 10, bottom: 0),
          child: CarouselSlider(
            options: CarouselOptions(
              height: 180.0,
              autoPlay: exams.length > 1,
              autoPlayInterval: const Duration(seconds: 4),
              enlargeCenterPage: true,
              viewportFraction: 0.92,
              aspectRatio: 2.0,
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
      loading: () => const SizedBox(
        height: 200,
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => const SizedBox(height: 20),
    );
  }

  Widget _buildExamCard(BuildContext context, LiveExam exam, bool isDark) {
    final isOngoing = exam.isOngoing;
    final formatter = DateFormat('dd MMM, hh:mm a');
    
    final bgGradient = isOngoing
        ? LinearGradient(
            colors: isDark
                ? [const Color(0xFF047857).withValues(alpha: 0.8), const Color(0xFF065F46).withValues(alpha: 0.8)]
                : [const Color(0xFF10B981), const Color(0xFF047857)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          )
        : LinearGradient(
            colors: isDark
                ? [const Color(0xFFD97706).withValues(alpha: 0.8), const Color(0xFFB45309).withValues(alpha: 0.8)]
                : [const Color(0xFF1E3A8A), const Color(0xFFD97706)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          );

    return Container(
      width: MediaQuery.of(context).size.width,
      margin: const EdgeInsets.symmetric(horizontal: 5.0),
      decoration: BoxDecoration(
        gradient: bgGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: (isOngoing ? const Color(0xFF047857) : const Color(0xFFD97706))
                .withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -20,
            bottom: -20,
            child: Icon(
              isOngoing ? LucideIcons.radio : LucideIcons.calendarClock,
              size: 140,
              color: Colors.white.withValues(alpha: 0.1),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isOngoing ? LucideIcons.radio : LucideIcons.clock,
                            color: Colors.white,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isOngoing ? 'LIVE NOW' : 'UPCOMING',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                Text(
                  exam.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Anek Bangla',
                  ),
                ),
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
                            fontSize: 15,
                            fontFamily: 'Anek Bangla',
                          ),
                        ),
                        Text(
                          formatter.format(isOngoing ? exam.endTime : exam.startTime),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
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
                        foregroundColor: isOngoing ? const Color(0xFF047857) : const Color(0xFFD97706),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        minimumSize: const Size(0, 36),
                      ),
                      child: const Text(
                        'অংশগ্রহণ করুন',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
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
