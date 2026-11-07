import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../domain/models.dart';
import '../live_exam_routine_page.dart';
import '../gke_leaderboard_page.dart';
import '../gke_practice_page.dart';
import '../gke_doubts_page.dart';
import '../gke_materials_page.dart';

class GkeBatchDashboardWidget extends ConsumerWidget {
  final List<LiveExam> exams;
  final bool isLoading;
  final VoidCallback? onOpenExamList;

  const GkeBatchDashboardWidget({
    super.key,
    required this.exams,
    this.isLoading = false,
    this.onOpenExamList,
  });

  static String _extractExamCode(LiveExam? exam, String fallback) {
    if (exam == null) return fallback;
    final match = RegExp(r'(MT-?\s*\d+)', caseSensitive: false).firstMatch(exam.title);
    if (match != null) return match.group(1)!.toUpperCase().replaceAll(' ', '-');
    final match2 = RegExp(r'gke_mt_(\d+)', caseSensitive: false).firstMatch(exam.id);
    if (match2 != null) return 'MT-${match2.group(1)}';
    final numMatch = RegExp(r'(\d+)').firstMatch(exam.title);
    if (numMatch != null) {
      final n = int.tryParse(numMatch.group(1)!) ?? 1;
      return 'MT-${n.toString().padLeft(2, '0')}';
    }
    return fallback;
  }

  static String _cleanSyllabusPreview(String raw) {
    if (raw.isEmpty) return '';
    String text = raw;
    final lines = text.split(RegExp(r'[\r\n]+')).map((l) => l.trim()).where((l) => l.isNotEmpty).toList();
    for (final line in lines) {
      if (line.startsWith('সিলেবাস:')) {
        text = line.replaceFirst(RegExp(r'^সিলেবাস:\s*'), '').trim();
        break;
      }
    }
    text = text.replaceAll(RegExp(r'^বিষয়:[^\n]+', multiLine: true), '').trim();
    text = text
        .replaceAll(RegExp(r'সাধারণ জ্ঞান:\s*'), '')
        .replaceAll(RegExp(r'ইংরেজি:\s*'), '')
        .replaceAll(';', ', ')
        .replaceAll('\n', ', ');
    text = text.replaceAll(RegExp(r',\s*,'), ',').trim();
    if (text.startsWith(',')) text = text.substring(1).trim();
    return text;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final now = DateTime.now();

    // Dynamically identify Today and Tomorrow's exams if available in list
    LiveExam? todayExam;
    LiveExam? tomorrowExam;

    final todayDateStr = '${now.year}-${now.month}-${now.day}';
    final tomorrow = now.add(const Duration(days: 1));
    final tomorrowDateStr = '${tomorrow.year}-${tomorrow.month}-${tomorrow.day}';

    for (final exam in exams) {
      final s = exam.startTime;
      final eDateStr = '${s.year}-${s.month}-${s.day}';
      if (eDateStr == todayDateStr && todayExam == null) {
        todayExam = exam;
      } else if (eDateStr == tomorrowDateStr && tomorrowExam == null) {
        tomorrowExam = exam;
      }
    }

    if (todayExam == null && exams.isNotEmpty) {
      todayExam = exams.first;
      if (tomorrowExam == null && exams.length > 1) {
        tomorrowExam = exams[1];
      }
    }

    final isLiveNow = todayExam != null &&
        now.isAfter(todayExam.startTime) &&
        now.isBefore(todayExam.endTime);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ── Notice Banner: Exam Paused until 10 Nov ──
        Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF2B1D0E) : const Color(0xFFFFFBEB),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? const Color(0xFF5C3D1D) : const Color(0xFFFDE68A),
              width: 1,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                LucideIcons.clock,
                size: 16,
                color: isDark ? const Color(0xFFFBBF24) : const Color(0xFFB45309),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'মডেল টেস্ট শুরু আগামী ১০ নভেম্বর',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                        color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'জিকে ও ইংলিশ স্পেশাল ব্যাচ ০১-এর মডেল টেস্ট স্থগিত রয়েছে। আগামী ১০ নভেম্বর (মঙ্গলবার) সন্ধ্যা ৬:০০ টা থেকে রুটিন অনুযায়ী পরীক্ষা শুরু হবে।',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? const Color(0xFFFCD34D) : const Color(0xFFB45309),
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // ─────────────────────────────────────────────────────────────
        // 1. TOP ROW: 2 CARDS IN THE SAME ROW ("Today" & "Tomorrow")
        // Matching user's image sketch with Flutter app theme
        // ─────────────────────────────────────────────────────────────
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── CARD 1: TODAY / UPCOMING ──
              Expanded(
                child: _buildTopExamCard(
                  context: context,
                  isDark: isDark,
                  headerLabel: isLiveNow ? 'Today' : '১০ নভেম্বর শুরু',
                  isToday: isLiveNow,
                  code: _extractExamCode(todayExam, 'MT-01'),
                  syllabus: (todayExam != null && todayExam.description.isNotEmpty)
                      ? _cleanSyllabusPreview(todayExam.description)
                      : 'প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস, Noun, Determiners, Article, Number, Gender',
                  dateText: todayExam != null
                      ? '${todayExam.startTime.day} ${_monthName(todayExam.startTime.month)} ${todayExam.startTime.year}'
                      : '10 Nov 2026',
                  timeText: '6 PM - 12 PM',
                  durationText: todayExam != null
                      ? '${todayExam.durationMinutes} min'
                      : '30 min',
                  buttonText: isLiveNow ? 'পরীক্ষা দিন' : 'সিলেবাস ও প্রস্তুতি',
                  onTap: () {
                    if (todayExam != null) {
                      context.push('/live_exam_details/${todayExam.id}', extra: todayExam);
                    } else {
                      context.push('/live_exam_details/gke-mt-01');
                    }
                  },
                ),
              ),

              const SizedBox(width: 10),

              // ── CARD 2: NEXT EXAM ──
              Expanded(
                child: _buildTopExamCard(
                  context: context,
                  isDark: isDark,
                  headerLabel: '১১ নভেম্বর',
                  isToday: false,
                  code: _extractExamCode(tomorrowExam, 'MT-02'),
                  syllabus: (tomorrowExam != null && tomorrowExam.description.isNotEmpty)
                      ? _cleanSyllabusPreview(tomorrowExam.description)
                      : 'ব্রিটিশ শাসন, ভাষা আন্দোলন, Pronoun & Its Classification, Uses of Pronoun',
                  dateText: tomorrowExam != null
                      ? '${tomorrowExam.startTime.day} ${_monthName(tomorrowExam.startTime.month)} ${tomorrowExam.startTime.year}'
                      : '11 Nov 2026',
                  timeText: '6 PM - 12 PM',
                  durationText: tomorrowExam != null
                      ? '${tomorrowExam.durationMinutes} min'
                      : '30 min',
                  buttonText: 'রুটিন দেখুন',
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const LiveExamRoutinePage(categoryTitle: 'GKE'),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 22),

        // ─────────────────────────────────────────────────────────────
        // 2. BOTTOM SECTION: SMALLER CARDS (2 PER ROW)
        // Attend Exam, Leaderboard, Practice, Exam History, Doubts, Model Tests
        // ─────────────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Row(
            children: [
              Icon(
                LucideIcons.sparkles,
                size: 16,
                color: isDark ? const Color(0xFF4ADE80) : const Color(0xFF004633),
              ),
              const SizedBox(width: 6),
              Text(
                'GKE কন্ট্রোল ও কুইক ফিচারসমূহ',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // Grid 2 Per Row
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.45,
          children: [
            // 1. Attend Exam
            _buildQuickActionCard(
              context: context,
              isDark: isDark,
              title: 'Attend Exam',
              titleBn: 'পরীক্ষায় অংশ নিন',
              icon: LucideIcons.zap,
              badgeText: 'Live',
              accentColor: const Color(0xFFE5252A),
              bgColor: isDark ? const Color(0xFF2A1214) : const Color(0xFFFFF1F2),
              borderColor: isDark ? const Color(0xFF5C1D24) : const Color(0xFFFECDD3),
              onTap: () {
                if (onOpenExamList != null) {
                  onOpenExamList!();
                } else if (todayExam != null) {
                  context.push('/live_exam_details/${todayExam.id}', extra: todayExam);
                } else {
                  context.push('/live_exam_details/gke-mt-01');
                }
              },
            ),

            // 2. Leaderboard (New Full Page)
            _buildQuickActionCard(
              context: context,
              isDark: isDark,
              title: 'Leaderboard',
              titleBn: 'মেধা তালিকা',
              icon: LucideIcons.trophy,
              badgeText: 'Rank',
              accentColor: const Color(0xFFD97706),
              bgColor: isDark ? const Color(0xFF2B1D0E) : const Color(0xFFFFFBEB),
              borderColor: isDark ? const Color(0xFF5C3D1D) : const Color(0xFFFDE68A),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => GkeLeaderboardPage(exam: todayExam),
                  ),
                );
              },
            ),

            // 3. Practice (New Full Page)
            _buildQuickActionCard(
              context: context,
              isDark: isDark,
              title: 'Practice',
              titleBn: 'অনুশীলন',
              icon: LucideIcons.rotateCcw,
              badgeText: 'Re-test',
              accentColor: const Color(0xFF059669),
              bgColor: isDark ? const Color(0xFF0C261E) : const Color(0xFFECFDF5),
              borderColor: isDark ? const Color(0xFF165240) : const Color(0xFFA7F3D0),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const GkePracticePage(),
                  ),
                );
              },
            ),

            // 4. Exam History (Full Page)
            _buildQuickActionCard(
              context: context,
              isDark: isDark,
              title: 'Exam History',
              titleBn: 'পরীক্ষার রেকর্ড',
              icon: LucideIcons.history,
              badgeText: 'Score',
              accentColor: const Color(0xFF2563EB),
              bgColor: isDark ? const Color(0xFF0F1E38) : const Color(0xFFEFF6FF),
              borderColor: isDark ? const Color(0xFF1E3A8A) : const Color(0xFFBFDBFE),
              onTap: () {
                context.push('/live_exam_history');
              },
            ),

            // 5. Doubts (New Full Page)
            _buildQuickActionCard(
              context: context,
              isDark: isDark,
              title: 'Doubts',
              titleBn: 'ডাউট সমাধান',
              icon: LucideIcons.helpCircle,
              badgeText: '24/7',
              accentColor: const Color(0xFF9333EA),
              bgColor: isDark ? const Color(0xFF231438) : const Color(0xFFFAF5FF),
              borderColor: isDark ? const Color(0xFF4C1D95) : const Color(0xFFE9D5FF),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const GkeDoubtsPage(),
                  ),
                );
              },
            ),

            // 6. Model Tests
            _buildQuickActionCard(
              context: context,
              isDark: isDark,
              title: 'Model Tests',
              titleBn: '৭০টি মডেল টেস্ট',
              icon: LucideIcons.layers,
              badgeText: '70 Tests',
              accentColor: const Color(0xFF004633),
              bgColor: isDark ? const Color(0xFF0F261E) : const Color(0xFFF0FDF4),
              borderColor: isDark ? const Color(0xFF165240) : const Color(0xFFBBF7D0),
              onTap: () {
                if (onOpenExamList != null) {
                  onOpenExamList!();
                } else {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const LiveExamRoutinePage(categoryTitle: 'GKE'),
                    ),
                  );
                }
              },
            ),

            // 7. Random Test (New Full Page)
            _buildQuickActionCard(
              context: context,
              isDark: isDark,
              title: 'Random Test',
              titleBn: 'র‍্যান্ডম কুইক টেস্ট',
              icon: LucideIcons.shuffle,
              badgeText: 'Quick',
              accentColor: const Color(0xFF4F46E5),
              bgColor: isDark ? const Color(0xFF191838) : const Color(0xFFEEF2FF),
              borderColor: isDark ? const Color(0xFF312E81) : const Color(0xFFC7D2FE),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const GkePracticePage(initialCategory: 'quick'),
                  ),
                );
              },
            ),

            // 8. Materials (New Full Page)
            _buildQuickActionCard(
              context: context,
              isDark: isDark,
              title: 'Materials',
              titleBn: 'লেকচার ও সলভ শিট',
              icon: LucideIcons.book,
              badgeText: 'PDF',
              accentColor: const Color(0xFF65A30D),
              bgColor: isDark ? const Color(0xFF1E260C) : const Color(0xFFF7FEE7),
              borderColor: isDark ? const Color(0xFF3F6212) : const Color(0xFFD9F99D),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const GkeMaterialsPage(),
                  ),
                );
              },
            ),
          ],
        ),
      ],
    );
  }

  // Helper: Builds one of the Top 2 Cards matching user sketch
  Widget _buildTopExamCard({
    required BuildContext context,
    required bool isDark,
    required String headerLabel,
    required bool isToday,
    required String code,
    required String syllabus,
    required String dateText,
    required String timeText,
    required String durationText,
    required String buttonText,
    required VoidCallback onTap,
  }) {
    final cardBg = isDark ? const Color(0xFF13151F) : Colors.white;
    final borderColor = isDark ? const Color(0xFF232738) : const Color(0xFFE2E8F0);
    final textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final subColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Red or Teal Curved Header Banner ──
          Container(
            padding: const EdgeInsets.symmetric(vertical: 7),
            decoration: BoxDecoration(
              color: isToday ? const Color(0xFFBE123C) : const Color(0xFF0F766E),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (isToday) ...[
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 5),
                ],
                Text(
                  headerLabel,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),

          // ── Card Body ──
          Padding(
            padding: const EdgeInsets.all(11),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // MT Code
                Text(
                  code,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: textColor,
                    letterSpacing: -0.5,
                  ),
                ),

                const SizedBox(height: 6),

                // Syllabus Box
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF181A24) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: borderColor,
                      width: 0.8,
                    ),
                  ),
                  child: Text(
                    syllabus,
                    textAlign: TextAlign.center,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      height: 1.35,
                      color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                    ),
                  ),
                ),

                const SizedBox(height: 8),

                // Meta Info
                _buildMetaRow('Date:', dateText, subColor, textColor),
                const SizedBox(height: 2),
                _buildMetaRow('Time:', timeText, subColor, textColor),
                const SizedBox(height: 2),
                _buildMetaRow('Duration:', durationText, subColor, textColor),

                const SizedBox(height: 10),

                // Action Button
                SizedBox(
                  width: double.infinity,
                  height: 32,
                  child: ElevatedButton(
                    onPressed: onTap,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isToday ? const Color(0xFF004633) : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                      foregroundColor: isToday ? Colors.white : (isDark ? Colors.white : const Color(0xFF0F172A)),
                      elevation: 0,
                      padding: EdgeInsets.zero,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      buttonText,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetaRow(String label, String value, Color labelColor, Color valueColor) {
    return Row(
      children: [
        SizedBox(
          width: 52,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: labelColor,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w800,
              color: valueColor,
            ),
          ),
        ),
      ],
    );
  }

  // Helper: Builds one of the Feature Quick Action Cards
  Widget _buildQuickActionCard({
    required BuildContext context,
    required bool isDark,
    required String title,
    required String titleBn,
    required IconData icon,
    required String badgeText,
    required Color accentColor,
    Color? bgColor,
    Color? borderColor,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF13151F) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? const Color(0xFF232738) : const Color(0xFFE2E8F0),
              width: 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.03),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: accentColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, size: 18, color: accentColor),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1A1C28) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isDark ? const Color(0xFF2B3045) : const Color(0xFFE2E8F0),
                        width: 0.8,
                      ),
                    ),
                    child: Text(
                      badgeText,
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        color: accentColor,
                      ),
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    titleBn,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _monthName(int month) {
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (month >= 1 && month <= 12) return m[month - 1];
    return '';
  }
}

