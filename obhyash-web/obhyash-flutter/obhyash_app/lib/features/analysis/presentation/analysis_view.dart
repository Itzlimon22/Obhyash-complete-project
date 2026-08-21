import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../../../core/presentation/widgets/skeleton_loading.dart';
import '../../../core/presentation/widgets/app_refresh_indicator.dart';

// ─── Domain Models ──────────────────────────────────────────────────────────────

class OverallAnalytics {
  final int totalExams;
  final double avgScore;
  final double avgAccuracy;
  final int totalTime;
  final int totalQuestions;
  final int totalCorrect;
  final int totalWrong;
  final int totalSkipped;
  final double avgTimePerQuestion;
  final double highestScore;
  final double lowestScore;
  final double totalNegativeDeduction;
  final double masteryIndex;
  final String masteryTier;
  final String masterySubtitle;
  final List<SubjectAnalytics> subjectData;
  final List<TimelinePoint> timelineData;
  final List<StudyGuideline> guidelines;
  final List<AchievementBadge> achievements;

  const OverallAnalytics({
    required this.totalExams,
    required this.avgScore,
    required this.avgAccuracy,
    required this.totalTime,
    required this.totalQuestions,
    required this.totalCorrect,
    required this.totalWrong,
    required this.totalSkipped,
    required this.avgTimePerQuestion,
    required this.highestScore,
    required this.lowestScore,
    required this.totalNegativeDeduction,
    required this.masteryIndex,
    required this.masteryTier,
    required this.masterySubtitle,
    required this.subjectData,
    required this.timelineData,
    required this.guidelines,
    required this.achievements,
  });
}

class SubjectAnalytics {
  final String rawName;
  final String displayName;
  final int total;
  final int correct;
  final int wrong;
  final int skipped;
  final double accuracy;

  const SubjectAnalytics({
    required this.rawName,
    required this.displayName,
    required this.total,
    required this.correct,
    required this.wrong,
    required this.skipped,
    required this.accuracy,
  });
}

class TimelinePoint {
  final String label;
  final double score;
  final DateTime date;

  const TimelinePoint({
    required this.label,
    required this.score,
    required this.date,
  });
}

class StudyGuideline {
  final Color color;
  final String tag;
  final String title;
  final String description;
  final IconData icon;
  final String? metric;

  const StudyGuideline({
    required this.color,
    required this.tag,
    required this.title,
    required this.description,
    required this.icon,
    this.metric,
  });
}

class AchievementBadge {
  final String id;
  final String label;
  final String description;
  final bool unlocked;
  final Color accentColor;

  const AchievementBadge({
    required this.id,
    required this.label,
    required this.description,
    required this.unlocked,
    required this.accentColor,
  });
}

// ─── Theme Colors ───────────────────────────────────────────────────────────────

class AppColors {
  // Deepest Blue / Navy
  static const deepestBlue = Color(0xFF0B132B);
  static const navyDark = Color(0xFF1C2541);
  static const deepBlue = Color(0xFF1D4ED8);
  static const vibrantBlue = Color(0xFF2563EB);
  static const softBlue = Color(0xFF3B82F6);

  // Book Deep Green
  static const deepGreen = Color(0xFF004633);
  static const emerald = Color(0xFF059669);
  static const mint = Color(0xFF10B981);

  // Deep Red
  static const deepRed = Color(0xFF991B1B);
  static const crimson = Color(0xFFB91C1C);
  static const softRed = Color(0xFFEF4444);

  // Greys & Neutrals
  static const slateLight = Color(0xFFF8FAFC);
  static const slateBorder = Color(0xFFE2E8F0);
  static const slateGray = Color(0xFF64748B);
  static const slateMuted = Color(0xFF94A3B8);

  static const darkBg = Color(0xFF09090B);
  static const darkCard = Color(0xFF131316);
  static const darkBorder = Color(0xFF26262B);
}

// ─── View ────────────────────────────────────────────────────────────────────────

class AnalysisView extends ConsumerStatefulWidget {
  const AnalysisView({super.key});

  @override
  ConsumerState<AnalysisView> createState() => _AnalysisViewState();
}

class _AnalysisViewState extends ConsumerState<AnalysisView> {
  String _timeFilter = 'all'; // 'week', 'month', 'all'
  OverallAnalytics? _analytics;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchAnalytics();
  }

  String _formatDuration(int seconds) {
    final hrs = seconds ~/ 3600;
    final mins = (seconds % 3600) ~/ 60;
    final secs = seconds % 60;
    if (hrs > 0) {
      return '${BanglaNameHelper.toBanglaNumeral(hrs)} ঘণ্টা ${BanglaNameHelper.toBanglaNumeral(mins)} মি.';
    }
    if (mins > 0) {
      return '${BanglaNameHelper.toBanglaNumeral(mins)} মিনিট ${BanglaNameHelper.toBanglaNumeral(secs)} সে.';
    }
    return '${BanglaNameHelper.toBanglaNumeral(secs)} সেকেন্ড';
  }

  Future<void> _fetchAnalytics() async {
    setState(() => _isLoading = true);
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) {
        setState(() => _isLoading = false);
        return;
      }

      var query = supabase
          .from('exam_results')
          .select(
              'score, total_marks, total_questions, correct_count, wrong_count, time_taken, subject, subject_label, negative_marking, date, created_at')
          .eq('user_id', userId);

      if (_timeFilter == 'week') {
        final weekAgo = DateTime.now().subtract(const Duration(days: 7));
        query = query.gte('date', weekAgo.toIso8601String());
      } else if (_timeFilter == 'month') {
        final monthAgo = DateTime.now().subtract(const Duration(days: 30));
        query = query.gte('date', monthAgo.toIso8601String());
      }

      final data = await query.order('created_at', ascending: true);
      final rows = data as List;

      if (rows.isEmpty) {
        if (mounted) {
          setState(() {
            _analytics = const OverallAnalytics(
              totalExams: 0,
              avgScore: 0,
              avgAccuracy: 0,
              totalTime: 0,
              totalQuestions: 0,
              totalCorrect: 0,
              totalWrong: 0,
              totalSkipped: 0,
              avgTimePerQuestion: 0,
              highestScore: 0,
              lowestScore: 0,
              totalNegativeDeduction: 0,
              masteryIndex: 0,
              masteryTier: 'নতুন অভিযাত্রী',
              masterySubtitle: 'পরীক্ষা দিয়ে তোমার পারফরম্যান্স ট্র্যাক করো',
              subjectData: [],
              timelineData: [],
              guidelines: [],
              achievements: [],
            );
            _isLoading = false;
          });
        }
        return;
      }

      int totalExams = rows.length;
      int totalTime = 0;
      double scoreSum = 0;
      int totalQuestions = 0;
      int totalCorrect = 0;
      int totalWrong = 0;
      double highestScore = 0;
      double lowestScore = 100;
      double totalNegativeDeduction = 0;

      final Map<String, ({int total, int correct, int wrong, String? label})>
          subjectMap = {};
      final List<TimelinePoint> timeline = [];

      for (final row in rows) {
        final total = (row['total_questions'] as num?)?.toInt() ?? 0;
        final correct = (row['correct_count'] as num?)?.toInt() ?? 0;
        final wrong = (row['wrong_count'] as num?)?.toInt() ?? 0;
        final time = (row['time_taken'] as num?)?.toInt() ?? 0;
        final totalMarks = (row['total_marks'] as num?)?.toDouble() ??
            (total > 0 ? total.toDouble() : 1.0);
        final rawDbScore = (row['score'] as num?)?.toDouble();
        final negRate = (row['negative_marking'] as num?)?.toDouble() ?? 0.25;

        // Exact net score with negative marking deduction
        final netScore = rawDbScore ??
            (correct - (wrong * negRate)).clamp(0.0, totalMarks);
        final score = totalMarks > 0
            ? ((netScore / totalMarks) * 100.0).clamp(0.0, 100.0)
            : 0.0;

        final createdAt =
            DateTime.tryParse(row['created_at'] ?? row['date'] ?? '') ??
                DateTime.now();
        final subject = (row['subject'] as String?) ?? 'general';
        final subjectLabel = row['subject_label'] as String?;

        totalTime += time;
        scoreSum += score;
        totalQuestions += total;
        totalCorrect += correct;
        totalWrong += wrong;
        totalNegativeDeduction += (wrong * negRate);

        if (score > highestScore) highestScore = score;
        if (score < lowestScore) lowestScore = score;

        final prev = subjectMap[subject];
        if (prev == null) {
          subjectMap[subject] = (
            total: total,
            correct: correct,
            wrong: wrong,
            label: subjectLabel,
          );
        } else {
          subjectMap[subject] = (
            total: prev.total + total,
            correct: prev.correct + correct,
            wrong: prev.wrong + wrong,
            label: subjectLabel ?? prev.label,
          );
        }

        timeline.add(
          TimelinePoint(
            label: DateFormat('d/M').format(createdAt),
            score: score,
            date: createdAt,
          ),
        );
      }

      final avgScore = totalExams > 0 ? (scoreSum / totalExams) : 0.0;
      final avgAccuracy =
          totalQuestions > 0 ? (totalCorrect / totalQuestions * 100.0) : 0.0;
      final avgTimePerQ =
          totalQuestions > 0 ? (totalTime / totalQuestions.toDouble()) : 0.0;

      final subjectData = subjectMap.entries.map((e) {
        final t = e.value.total;
        final c = e.value.correct;
        final w = e.value.wrong;
        final skipped = (t - c - w).clamp(0, t);
        final acc = t > 0 ? (c / t * 100.0) : 0.0;
        final displayName =
            BanglaNameHelper.formatSubject(e.key, e.value.label);

        return SubjectAnalytics(
          rawName: e.key,
          displayName: displayName,
          total: t,
          correct: c,
          wrong: w,
          skipped: skipped,
          accuracy: acc,
        );
      }).toList()
        ..sort((a, b) => b.accuracy.compareTo(a.accuracy));

      // Mastery Score Algorithm
      final volumeBonus = (totalQuestions / 200.0).clamp(0.0, 1.0) * 10.0;
      final examBonus = (totalExams / 15.0).clamp(0.0, 1.0) * 10.0;
      final masteryIndex =
          ((avgScore * 0.45) + (avgAccuracy * 0.35) + volumeBonus + examBonus)
              .clamp(0.0, 100.0);

      String masteryTier;
      String masterySubtitle;
      if (masteryIndex >= 85) {
        masteryTier = 'বিজয় অভিযাত্রী (Elite)';
        masterySubtitle = 'অসাধারণ ধারাবাহিকতা! তুমি শীর্ষ প্রস্তুতিতে রয়েছো।';
      } else if (masteryIndex >= 70) {
        masteryTier = 'দ্রুত অগ্রগামী (Advanced)';
        masterySubtitle = 'ধারাবাহিক গতি! ভুলগুলো নিয়মিত সংশোধন করলে কাঙ্ক্ষিত ফলাফল নিশ্চিত।';
      } else if (masteryIndex >= 50) {
        masteryTier = 'উন্নতির পথে (Growing)';
        masterySubtitle = 'প্রস্তুতি সন্তোষজনক। দুর্বল অধ্যায়গুলোতে একটু বাড়তি সময় দাও।';
      } else {
        masteryTier = 'নতুন শুরু (Kickstart)';
        masterySubtitle = 'নিয়মিত টেস্ট দিয়ে নিজের বেসিক ও নির্ভুলতা বাড়াও।';
      }

      // Smart Study Guidelines
      final List<StudyGuideline> guidelines = [];

      if (subjectData.isNotEmpty) {
        final best = subjectData.first;
        guidelines.add(
          StudyGuideline(
            color: const Color(0xFF059669),
            icon: LucideIcons.sparkles,
            tag: 'সর্বোচ্চ শক্তি',
            title: best.displayName,
            metric: '${BanglaNameHelper.toBanglaNumeral(best.accuracy.round())}% নির্ভুলতা',
            description:
                'এই বিষয়ে তোমার নির্ভুলতা সবচেয়ে বেশি! নিয়মিত রিভিশন বজায় রেখে এই শক্তিকে ১০০% মার্কসে রূপান্তর করো।',
          ),
        );

        if (subjectData.length > 1) {
          final worst = subjectData.last;
          if (worst.accuracy < 75) {
            guidelines.add(
              StudyGuideline(
                color: const Color(0xFFF59E0B),
                icon: LucideIcons.alertTriangle,
                tag: 'অগ্রাধিকার রিভিশন',
                title: worst.displayName,
                metric: '${BanglaNameHelper.toBanglaNumeral(worst.accuracy.round())}% নির্ভুলতা',
                description:
                    'অধ্যায়ের মূল সূত্র ও গুরুত্বপূর্ণ কনসেপ্টগুলো প্রতিদিন অন্তত ১০ মিনিট অনুশীলন করে দুর্বলতা কাটিয়ে ওঠো।',
              ),
            );
          }
        }
      }

      // Speed guideline
      if (avgTimePerQ > 0) {
        if (avgTimePerQ < 25) {
          guidelines.add(
            StudyGuideline(
              color: const Color(0xFF0284C7),
              icon: LucideIcons.zap,
              tag: 'টাইমিং বিশ্লেষণ',
              title: 'উচ্চ সমাধান গতি',
              metric: '${BanglaNameHelper.toBanglaNumeral(avgTimePerQ.round())} সে./প্রশ্ন',
              description:
                  'প্রশ্নের উত্তর করার গতি চমৎকার। তবে তাড়াহুড়ো এড়িয়ে প্রতিটি প্রশ্নের অপশন মনোযোগ দিয়ে পড়ার অভ্যাস করো।',
            ),
          );
        } else if (avgTimePerQ <= 50) {
          guidelines.add(
            StudyGuideline(
              color: const Color(0xFF059669),
              icon: LucideIcons.timer,
              tag: 'টাইমিং বিশ্লেষণ',
              title: 'আদর্শ গতি ও ব্যালান্স',
              metric: '${BanglaNameHelper.toBanglaNumeral(avgTimePerQ.round())} সে./প্রশ্ন',
              description:
                  'প্রতি প্রশ্নে গড় সময় পরীক্ষার জন্য নিখুঁত ও আদর্শ। এই ইতিবাচক রিদম ধরে রাখো।',
            ),
          );
        } else {
          guidelines.add(
            StudyGuideline(
              color: const Color(0xFF8B5CF6),
              icon: LucideIcons.hourglass,
              tag: 'টাইমিং পরামর্শ',
              title: 'গতি বৃদ্ধির সুযোগ',
              metric: '${BanglaNameHelper.toBanglaNumeral(avgTimePerQ.round())} সে./প্রশ্ন',
              description:
                  'নিয়মিত প্র্যাকটিস ও শর্টকাট টেকনিক কাজে লাগিয়ে প্রশ্ন সমাধানের সময় আরও কিছুটা কমিয়ে আনো।',
            ),
          );
        }
      }

      // Negative Marking Guideline
      if (totalWrong > 0) {
        guidelines.add(
          StudyGuideline(
            color: const Color(0xFFE11D48),
            icon: LucideIcons.target,
            tag: 'স্কোর রিকভারি',
            title: 'নেগেটিভ মার্কিং পুনরুদ্ধার',
            metric: '+${BanglaNameHelper.toBanglaNumeral(totalNegativeDeduction.toStringAsFixed(1))} নম্বর সুযোগ',
            description:
                'ভুল উত্তরের কারণে মোট ${BanglaNameHelper.toBanglaNumeral(totalWrong)}টি প্রশ্নে নম্বর কেটেছে। নিশ্চিত না হয়ে আন্দাজে দাগানো কমালেই স্কোর অনেক বাড়বে।',
          ),
        );
      }

      // Achievements
      final achievements = [
        AchievementBadge(
          id: 'first',
          label: 'প্রথম সূচনা',
          description: 'প্রথম পরীক্ষা সম্পন্ন',
          unlocked: totalExams >= 1,
          accentColor: AppColors.deepGreen,
        ),
        AchievementBadge(
          id: 'ten',
          label: '১০ পরীক্ষা ক্লাব',
          description: '১০টি পরীক্ষায় অংশগ্রহণ',
          unlocked: totalExams >= 10,
          accentColor: AppColors.deepBlue,
        ),
        AchievementBadge(
          id: 'fifty',
          label: '৫০ পরীক্ষা লিজেন্ড',
          description: '৫০টি পরীক্ষা সফল সম্পন্ন',
          unlocked: totalExams >= 50,
          accentColor: AppColors.deepestBlue,
        ),
        AchievementBadge(
          id: 'score80',
          label: '৮০%+ স্কোর',
          description: 'গড়ে ৮০%+ স্কোর অর্জন',
          unlocked: avgScore >= 80,
          accentColor: AppColors.emerald,
        ),
        AchievementBadge(
          id: 'score90',
          label: '৯০%+ জিনিয়াস',
          description: 'গড়ে ৯০%+ উচ্চমান স্কোর',
          unlocked: avgScore >= 90,
          accentColor: AppColors.vibrantBlue,
        ),
        AchievementBadge(
          id: 'perfect',
          label: 'পারফেক্ট ১০০',
          description: '১০০% নির্ভুল স্কোর',
          unlocked: highestScore >= 100,
          accentColor: AppColors.crimson,
        ),
      ];

      if (mounted) {
        setState(() {
          _analytics = OverallAnalytics(
            totalExams: totalExams,
            avgScore: avgScore,
            avgAccuracy: avgAccuracy,
            totalTime: totalTime,
            totalQuestions: totalQuestions,
            totalCorrect: totalCorrect,
            totalWrong: totalWrong,
            totalSkipped: (totalQuestions - totalCorrect - totalWrong)
                .clamp(0, totalQuestions),
            avgTimePerQuestion: avgTimePerQ,
            highestScore: highestScore,
            lowestScore: lowestScore < 100 ? lowestScore : highestScore,
            totalNegativeDeduction: totalNegativeDeduction,
            masteryIndex: masteryIndex,
            masteryTier: masteryTier,
            masterySubtitle: masterySubtitle,
            subjectData: subjectData,
            timelineData: timeline,
            guidelines: guidelines,
            achievements: achievements,
          );
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _fetchAnalytics();
    });

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.darkBg : AppColors.slateLight;

    if (_isLoading && _analytics == null) {
      return Scaffold(
        backgroundColor: bgColor,
        body: const ExamHistorySkeleton(),
      );
    }

    if (_analytics == null || _analytics!.totalExams == 0) {
      return Scaffold(
        backgroundColor: bgColor,
        body: AppRefreshIndicator(
          onRefresh: _fetchAnalytics,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            child: SizedBox(
              height: MediaQuery.of(context).size.height * 0.8,
              child: _buildEmptyState(isDark),
            ),
          ),
        ),
      );
    }

    final a = _analytics!;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: AppRefreshIndicator(
          onRefresh: _fetchAnalytics,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ── 1. HEADER & TIME FILTER ──
                _buildHeader(isDark),
                const SizedBox(height: 16),

                // ── 2. MASTERY HERO CARD ──
                _buildMasteryHero(a, isDark),
                const SizedBox(height: 20),

                // ── 3. FOUR CORE METRICS (CENTER ALIGNED, NO ICONS) ──
                _buildCorePillarsGrid(a, isDark),
                const SizedBox(height: 20),

                // ── 4. SMART GUIDELINES (CENTER-ALIGNED CARDS) ──
                if (a.guidelines.isNotEmpty) ...[
                  _buildSectionTitle('স্মার্ট গাইডলাইন ও উন্নতির সুযোগ', isDark),
                  const SizedBox(height: 12),
                  ...a.guidelines.map((g) => _buildGuidelineCard(g, isDark)),
                  const SizedBox(height: 20),
                ],

                // ── 5. PERFORMANCE TRAJECTORY CHART ──
                _buildTrajectoryChart(a, isDark),
                const SizedBox(height: 20),

                // ── 6. SUBJECT MASTERY BREAKDOWN ──
                _buildSubjectMastery(a, isDark),
                const SizedBox(height: 20),

                // ── 7. ANSWER BREAKDOWN (CENTER ALIGNED 3 CARDS) ──
                _buildAnswerBreakdown(a, isDark),
                const SizedBox(height: 20),

                // ── 8. MILESTONE & ACHIEVEMENT ROOM ──
                _buildAchievementRoom(a, isDark),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Header & Time Filter Bar
  // ─────────────────────────────────────────────────────────────────────────────

  Widget _buildHeader(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF19191D) : const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          _buildTimePill('week', 'গত ৭ দিন', isDark),
          _buildTimePill('month', 'গত ৩০ দিন', isDark),
          _buildTimePill('all', 'সর্বকালীন', isDark),
        ],
      ),
    );
  }

  Widget _buildTimePill(String key, String label, bool isDark) {
    final isSelected = _timeFilter == key;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (_timeFilter != key) {
            setState(() => _timeFilter = key);
            _fetchAnalytics();
          }
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 8.5),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.deepGreen
                : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppColors.deepGreen.withValues(alpha: 0.35),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    )
                  ]
                : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
              fontFamily: 'HindSiliguri',
              color: isSelected
                  ? Colors.white
                  : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569)),
            ),
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Mastery Hero Card (Midnight Navy & Book Deep Green)
  // ─────────────────────────────────────────────────────────────────────────────

  Widget _buildMasteryHero(OverallAnalytics a, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF0B132B), // Deepest Navy
            Color(0xFF004633), // Deep Book Emerald
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: AppColors.mint.withValues(alpha: 0.3),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0B132B).withValues(alpha: isDark ? 0.6 : 0.25),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Tier Pill & Exam Count
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4.5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppColors.mint.withValues(alpha: 0.4),
                    width: 0.8,
                  ),
                ),
                child: Text(
                  a.masteryTier,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'HindSiliguri',
                    color: Colors.white,
                    letterSpacing: 0.4,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${BanglaNameHelper.toBanglaNumeral(a.totalExams)}টি পরীক্ষা সম্পন্ন',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'HindSiliguri',
                    color: AppColors.mint,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Big Score on Left
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                BanglaNameHelper.toBanglaNumeral(a.masteryIndex.round()),
                style: const TextStyle(
                  fontSize: 50,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'HindSiliguri',
                  color: Colors.white,
                  height: 1,
                ),
              ),
              const SizedBox(width: 4),
              const Text(
                '/১০০',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'HindSiliguri',
                  color: Colors.white70,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),

          Text(
            'মাস্টারি সূচক · ${a.masterySubtitle}',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              fontFamily: 'HindSiliguri',
              color: Colors.white.withValues(alpha: 0.9),
              height: 1.35,
            ),
          ),
          const SizedBox(height: 16),

          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: a.masteryIndex / 100.0,
              minHeight: 8,
              backgroundColor: Colors.white.withValues(alpha: 0.18),
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.mint),
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Four Core Pillars Grid (Center Aligned, Minimalist, No Clutter)
  // ─────────────────────────────────────────────────────────────────────────────

  Widget _buildCorePillarsGrid(OverallAnalytics a, bool isDark) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.35,
      children: [
        _buildPillarCard(
          title: 'গড় স্কোর',
          value: '${BanglaNameHelper.toBanglaNumeral(a.avgScore.round())}%',
          subtitle: 'সর্বোচ্চ ${BanglaNameHelper.toBanglaNumeral(a.highestScore.round())}%',
          accentColor: AppColors.deepBlue,
          isDark: isDark,
        ),
        _buildPillarCard(
          title: 'নির্ভুলতার হার',
          value: '${BanglaNameHelper.toBanglaNumeral(a.avgAccuracy.round())}%',
          subtitle: '${BanglaNameHelper.toBanglaNumeral(a.totalCorrect)}টি সঠিক উত্তর',
          accentColor: AppColors.deepGreen,
          isDark: isDark,
        ),
        _buildPillarCard(
          title: 'গড় সমাধান গতি',
          value: '${BanglaNameHelper.toBanglaNumeral(a.avgTimePerQuestion.round())} সে.',
          subtitle: 'প্রতি প্রশ্ন সমাধানে',
          accentColor: AppColors.slateGray,
          isDark: isDark,
        ),
        _buildPillarCard(
          title: 'মোট অধ্যয়ন সময়',
          value: _formatDuration(a.totalTime),
          subtitle: '${BanglaNameHelper.toBanglaNumeral(a.totalQuestions)}টি প্রশ্ন সম্পন্ন',
          accentColor: AppColors.deepestBlue,
          isDark: isDark,
        ),
      ],
    );
  }

  Widget _buildPillarCard({
    required String title,
    required String value,
    required String subtitle,
    required Color accentColor,
    required bool isDark,
  }) {
    final cardBg = isDark ? AppColors.darkCard : AppColors.slateLight;
    final cardBorder = isDark ? AppColors.darkBorder : AppColors.slateBorder;
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSub = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              fontFamily: 'HindSiliguri',
              color: textSub,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              fontFamily: 'HindSiliguri',
              color: textPrimary,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              fontFamily: 'HindSiliguri',
              color: textSub,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Smart Guidelines (Left-Aligned Reading Flow)
  // ─────────────────────────────────────────────────────────────────────────────

  Widget _buildSectionTitle(String title, bool isDark) {
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);

    return Text(
      title,
      style: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w800,
        fontFamily: 'HindSiliguri',
        color: textPrimary,
      ),
    );
  }

  Widget _buildGuidelineCard(StudyGuideline g, bool isDark) {
    final cardBg = isDark ? const Color(0xFF141417) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSub = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? cardBorder : g.color.withValues(alpha: 0.2),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withValues(alpha: 0.25)
                : g.color.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          children: [
            // Left colored accent bar
            Positioned(
              left: 0,
              top: 0,
              bottom: 0,
              width: 4.5,
              child: Container(
                decoration: BoxDecoration(
                  color: g.color,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    bottomLeft: Radius.circular(20),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 16, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Row: Category Tag Pill + Metric Highlight Badge
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: g.color.withValues(alpha: isDark ? 0.2 : 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          g.icon,
                          size: 15,
                          color: g.color,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 9,
                          vertical: 3.5,
                        ),
                        decoration: BoxDecoration(
                          color: g.color.withValues(alpha: isDark ? 0.16 : 0.08),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          g.tag,
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'Anek Bangla',
                            color: g.color,
                          ),
                        ),
                      ),
                      const Spacer(),
                      if (g.metric != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 9,
                            vertical: 3.5,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF1C1C21)
                                : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF2C2C34)
                                  : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Text(
                            g.metric!,
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'Anek Bangla',
                              color: isDark ? Colors.white : const Color(0xFF1E293B),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  // Title
                  Text(
                    g.title,
                    style: TextStyle(
                      fontSize: 16.5,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Anek Bangla',
                      color: textPrimary,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 5),
                  // Description
                  Text(
                    g.description,
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w500,
                      fontFamily: 'Anek Bangla',
                      color: textSub,
                      height: 1.45,
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

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Performance Trajectory Chart
  // ─────────────────────────────────────────────────────────────────────────────

  Widget _buildTrajectoryChart(OverallAnalytics a, bool isDark) {
    final cardBg = isDark ? AppColors.darkCard : AppColors.slateLight;
    final cardBorder = isDark ? AppColors.darkBorder : AppColors.slateBorder;
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'স্কোর ও অগ্রগতির টাইমলাইন',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'HindSiliguri',
                  color: textPrimary,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.deepBlue.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  'সর্বোচ্চ: ${BanglaNameHelper.toBanglaNumeral(a.highestScore.round())}%',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'HindSiliguri',
                    color: AppColors.deepBlue,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          if (a.timelineData.isEmpty)
            const SizedBox(
              height: 160,
              child: Center(
                child: Text(
                  'কোনো টাইমলাইন তথ্য নেই',
                  style: TextStyle(fontFamily: 'HindSiliguri'),
                ),
              ),
            )
          else
            SizedBox(
              height: 180,
              child: LineChart(
                LineChartData(
                  minY: 0,
                  maxY: 100,
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval: 25,
                    getDrawingHorizontalLine: (val) => FlLine(
                      color: isDark
                          ? const Color(0xFF27272A)
                          : const Color(0xFFE2E8F0),
                      strokeWidth: 0.8,
                      dashArray: [4, 4],
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    leftTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        interval: (a.timelineData.length / 5)
                            .ceilToDouble()
                            .clamp(1.0, a.timelineData.length.toDouble()),
                        getTitlesWidget: (val, meta) {
                          final idx = val.toInt();
                          if (idx < 0 || idx >= a.timelineData.length) {
                            return const SizedBox.shrink();
                          }
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              a.timelineData[idx].label,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'HindSiliguri',
                                color: isDark ? Colors.white54 : Colors.black54,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  lineBarsData: [
                    LineChartBarData(
                      spots: a.timelineData
                          .asMap()
                          .entries
                          .map((e) => FlSpot(e.key.toDouble(), e.value.score))
                          .toList(),
                      isCurved: true,
                      curveSmoothness: 0.35,
                      preventCurveOverShooting: true,
                      color: AppColors.deepBlue,
                      barWidth: 3,
                      dotData: FlDotData(
                        show: a.timelineData.length <= 15,
                        getDotPainter: (spot, percent, barData, index) =>
                            FlDotCirclePainter(
                          radius: 3.5,
                          color: AppColors.deepBlue,
                          strokeWidth: 1.5,
                          strokeColor: isDark ? AppColors.darkCard : Colors.white,
                        ),
                      ),
                      belowBarData: BarAreaData(
                        show: true,
                        gradient: LinearGradient(
                          colors: [
                            AppColors.deepBlue.withValues(alpha: 0.25),
                            AppColors.deepBlue.withValues(alpha: 0.0),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Subject Mastery Breakdown (Natural Balanced Alignment)
  // ─────────────────────────────────────────────────────────────────────────────

  Widget _buildSubjectMastery(OverallAnalytics a, bool isDark) {
    final cardBg = isDark ? AppColors.darkCard : AppColors.slateLight;
    final cardBorder = isDark ? AppColors.darkBorder : AppColors.slateBorder;
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSub = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'বিষয়ভিত্তিক দক্ষতা ও পারদর্শিতা',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'HindSiliguri',
                  color: textPrimary,
                ),
              ),
              Text(
                '${BanglaNameHelper.toBanglaNumeral(a.subjectData.length)}টি বিষয়',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'HindSiliguri',
                  color: textSub,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (a.subjectData.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(
                child: Text(
                  'কোনো পরীক্ষা দেওয়া হয়নি',
                  style: TextStyle(fontFamily: 'HindSiliguri'),
                ),
              ),
            )
          else
            ...a.subjectData.map((s) {
              final pct =
                  s.total > 0 ? (s.correct / s.total * 100).round() : 0;
              final badgeColor = pct >= 80
                  ? AppColors.deepGreen
                  : pct >= 60
                      ? AppColors.deepBlue
                      : AppColors.crimson;

              return GestureDetector(
                onTap: () => context.push('/subject/${s.rawName}'),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF19191D)
                        : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF2E2E34)
                          : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              s.displayName,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'HindSiliguri',
                                color: textPrimary,
                              ),
                            ),
                          ),
                          Text(
                            '${BanglaNameHelper.toBanglaNumeral(s.total)}টি প্রশ্ন  ·  ${BanglaNameHelper.toBanglaNumeral(pct)}%',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'HindSiliguri',
                              color: badgeColor,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // Multi-segment progress (Deep Green, Crimson, Slate Gray)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Row(
                          children: [
                            if (s.correct > 0)
                              Expanded(
                                flex: s.correct,
                                child: Container(
                                  height: 7,
                                  color: AppColors.deepGreen,
                                ),
                              ),
                            if (s.wrong > 0)
                              Expanded(
                                flex: s.wrong,
                                child: Container(
                                  height: 7,
                                  color: AppColors.crimson,
                                ),
                              ),
                            if (s.skipped > 0)
                              Expanded(
                                flex: s.skipped,
                                child: Container(
                                  height: 7,
                                  color: isDark
                                      ? const Color(0xFF3F3F46)
                                      : const Color(0xFFCBD5E1),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Answer Breakdown (Center Aligned 3 Cards)
  // ─────────────────────────────────────────────────────────────────────────────

  Widget _buildAnswerBreakdown(OverallAnalytics a, bool isDark) {
    final cardBg = isDark ? AppColors.darkCard : AppColors.slateLight;
    final cardBorder = isDark ? AppColors.darkBorder : AppColors.slateBorder;
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'উত্তরের সামগ্রিক বিভাজন',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              fontFamily: 'HindSiliguri',
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              _buildAnswerStatBox(
                'সঠিক উত্তর',
                BanglaNameHelper.toBanglaNumeral(a.totalCorrect),
                AppColors.deepGreen,
                isDark,
              ),
              const SizedBox(width: 8),
              _buildAnswerStatBox(
                'ভুল উত্তর',
                BanglaNameHelper.toBanglaNumeral(a.totalWrong),
                AppColors.crimson,
                isDark,
              ),
              const SizedBox(width: 8),
              _buildAnswerStatBox(
                'ছেড়ে দেওয়া',
                BanglaNameHelper.toBanglaNumeral(a.totalSkipped),
                AppColors.slateGray,
                isDark,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAnswerStatBox(
      String label, String count, Color color, bool isDark) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: isDark ? 0.12 : 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              count,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                fontFamily: 'HindSiliguri',
                color: color,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white70 : const Color(0xFF334155),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Achievement Room (Natural Header with Centered Grid Tiles)
  // ─────────────────────────────────────────────────────────────────────────────

  Widget _buildAchievementRoom(OverallAnalytics a, bool isDark) {
    final cardBg = isDark ? AppColors.darkCard : AppColors.slateLight;
    final cardBorder = isDark ? AppColors.darkBorder : AppColors.slateBorder;
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSub = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);

    final unlockedCount = a.achievements.where((e) => e.unlocked).length;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'মাইলফলক ও অর্জন',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'HindSiliguri',
                  color: textPrimary,
                ),
              ),
              Text(
                '${BanglaNameHelper.toBanglaNumeral(unlockedCount)}/${BanglaNameHelper.toBanglaNumeral(a.achievements.length)} অর্জিত',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'HindSiliguri',
                  color: AppColors.deepBlue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.1,
            ),
            itemCount: a.achievements.length,
            itemBuilder: (context, index) {
              final ach = a.achievements[index];
              final bool isUnlocked = ach.unlocked;

              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
                decoration: BoxDecoration(
                  color: isUnlocked
                      ? ach.accentColor.withValues(alpha: isDark ? 0.16 : 0.09)
                      : (isDark
                          ? const Color(0xFF19191D)
                          : const Color(0xFFF1F5F9)),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isUnlocked
                        ? ach.accentColor.withValues(alpha: 0.35)
                        : (isDark
                            ? const Color(0xFF27272A)
                            : const Color(0xFFE2E8F0)),
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      ach.label,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'HindSiliguri',
                        color: isUnlocked ? textPrimary : textSub,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isUnlocked ? 'আনলকড' : 'লকড',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                        color: isUnlocked ? ach.accentColor : textSub,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Empty State
  // ─────────────────────────────────────────────────────────────────────────────

  Widget _buildEmptyState(bool isDark) {
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSub = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              'কোনো পারফরম্যান্স রেকর্ড নেই',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 21,
                fontWeight: FontWeight.w800,
                fontFamily: 'HindSiliguri',
                color: textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'বিশ্লেষণ ও স্মার্ট গাইডলাইন দেখতে অন্তত একটি অনলাইন পরীক্ষা সম্পন্ন করো।',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                fontFamily: 'HindSiliguri',
                color: textSub,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.deepGreen,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'পরীক্ষা শুরু করো',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'HindSiliguri',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
