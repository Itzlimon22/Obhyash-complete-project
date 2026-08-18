import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/live_exam_providers.dart';

class LiveExamMainView extends ConsumerStatefulWidget {
  const LiveExamMainView({super.key});

  @override
  ConsumerState<LiveExamMainView> createState() => _LiveExamMainViewState();
}

class _LiveExamMainViewState extends ConsumerState<LiveExamMainView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(liveExamCategoryProvider.notifier).updateCategory('all');
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final allExamsAsync = ref.watch(liveExamsProvider);
    final exams = allExamsAsync.value ?? [];

    final categories = [
      _ObhyashCategoryData(
        key: 'engineering',
        tag: 'ইঞ্জিনিয়ারিং',
        title: 'ইঞ্জিনিয়ারিং',
        subtitle: 'উইকলি মডেল টেস্ট',
        description: 'বুয়েট • কুয়েট • রুয়েট • চুয়েট',
        gradientColors: isDark
            ? [const Color(0xFF1E3A8A), const Color(0xFF172554)]
            : [const Color(0xFF2563EB), const Color(0xFF1D4ED8)],
        shadowColor: const Color(0xFF2563EB),
        hasLive: _hasLive(exams, 'engineering'),
      ),
      _ObhyashCategoryData(
        key: 'medical',
        tag: 'মেডিকেল',
        title: 'মেডিকেল',
        subtitle: 'উইকলি মডেল টেস্ট',
        description: 'মেডিকেল ও ডেন্টাল ভর্তি পরীক্ষা',
        gradientColors: isDark
            ? [const Color(0xFF881337), const Color(0xFF4C0519)]
            : [const Color(0xFFE11D48), const Color(0xFFBE123C)],
        shadowColor: const Color(0xFFE11D48),
        hasLive: _hasLive(exams, 'medical'),
      ),
      _ObhyashCategoryData(
        key: 'varsity',
        tag: 'ভার্সিটি',
        title: 'ভার্সিটি ক-ইউনিট',
        subtitle: 'উইকলি মডেল টেস্ট',
        description: 'ঢাকা বিশ্ববিদ্যালয় • সমন্বিত গুচ্ছ',
        gradientColors: isDark
            ? [const Color(0xFF581C87), const Color(0xFF3B0764)]
            : [const Color(0xFF7C3AED), const Color(0xFF6D28D9)],
        shadowColor: const Color(0xFF7C3AED),
        hasLive: _hasLive(exams, 'varsity'),
      ),
      _ObhyashCategoryData(
        key: 'hsc',
        tag: 'এইচএসসি',
        title: 'এইচএসসি স্পেশাল',
        subtitle: 'অধ্যায়ভিত্তিক পরীক্ষা',
        description: 'বিজ্ঞান বিভাগ বোর্ড টেস্ট',
        gradientColors: isDark
            ? [const Color(0xFF064E3B), const Color(0xFF022C22)]
            : [const Color(0xFF059669), const Color(0xFF047857)],
        shadowColor: const Color(0xFF059669),
        hasLive: _hasLive(exams, 'hsc'),
      ),
    ];

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAFA),
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
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 2x2 Grid of Vibrant Colored Cards (No Icons)
              LayoutBuilder(
                builder: (context, constraints) {
                  final isTablet = constraints.maxWidth >= 650;
                  final crossAxisCount = isTablet ? 4 : 2;
                  const spacing = 12.0;
                  final itemWidth = (constraints.maxWidth - (spacing * (crossAxisCount - 1))) / crossAxisCount;

                  return Wrap(
                    spacing: spacing,
                    runSpacing: spacing,
                    children: categories.map((cat) {
                      return SizedBox(
                        width: itemWidth,
                        child: _buildVibrantCard(context, isDark, cat),
                      );
                    }).toList(),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  bool _hasLive(List<dynamic> exams, String category) {
    return exams.any((e) {
      final cat = (e.category ?? '').toString().toLowerCase();
      final target = category.toLowerCase();
      final match = (cat == target || cat == 'all' || (target == 'varsity' && cat == 'varsity_a'));
      return match && e.isOngoing == true;
    });
  }

  Widget _buildVibrantCard(BuildContext context, bool isDark, _ObhyashCategoryData cat) {
    final String key = cat.key;
    final String tag = cat.tag;
    final String title = cat.title;
    final String subtitle = cat.subtitle;
    final String description = cat.description;
    final List<Color> gradientColors = cat.gradientColors;
    final Color shadowColor = cat.shadowColor;
    final bool hasLive = cat.hasLive;

    return GestureDetector(
      onTap: () {
        context.push('/live_exam/$key');
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: gradientColors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: Colors.white.withValues(alpha: isDark ? 0.15 : 0.25),
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: shadowColor.withValues(alpha: isDark ? 0.35 : 0.25),
              blurRadius: 12,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Top Row: Category Tag Pill + Live Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    tag,
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      fontFamily: "HindSiliguri",
                    ),
                  ),
                ),
                if (hasLive)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.2),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: gradientColors.first,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          "LIVE",
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w900,
                            color: gradientColors.first,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 18),

            // Middle: Title, Subtitle, Description
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    fontFamily: "HindSiliguri",
                    letterSpacing: -0.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Colors.white.withValues(alpha: 0.9),
                    fontFamily: "HindSiliguri",
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 11,
                    height: 1.3,
                    color: Colors.white.withValues(alpha: 0.75),
                    fontFamily: "HindSiliguri",
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Bottom: Clean action strip
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 7),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.2),
                ),
              ),
              alignment: Alignment.center,
              child: const Text(
                "পরীক্ষা দেখুন",
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  fontFamily: "HindSiliguri",
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ObhyashCategoryData {
  final String key;
  final String tag;
  final String title;
  final String subtitle;
  final String description;
  final List<Color> gradientColors;
  final Color shadowColor;
  final bool hasLive;

  const _ObhyashCategoryData({
    required this.key,
    required this.tag,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.gradientColors,
    required this.shadowColor,
    required this.hasLive,
  });
}
