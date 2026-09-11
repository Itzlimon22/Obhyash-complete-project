import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/live_exam_providers.dart';
import '../../../core/presentation/widgets/app_refresh_indicator.dart';

import '../../dashboard/providers/dashboard_providers.dart';
import '../domain/models.dart';

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

    final profile = ref.watch(userProfileProvider).value;
    final isSSC = (profile?.stream?.toLowerCase().contains('ssc') ?? false) ||
        (profile?.level?.toLowerCase().contains('ssc') ?? false);
    final division = (profile?.division ?? '').toLowerCase().trim();

    final isBiz = division.contains('business') ||
        division.contains('commerce') ||
        division.contains('বাণিজ্য') ||
        division.contains('ব্যবসায়');
    final isHum = division.contains('humanities') ||
        division.contains('arts') ||
        division.contains('মানবিক');
    final isSci = division.contains('science') ||
        division.contains('বিজ্ঞান');

    final List<_ObhyashCategoryData> categories;

    if (isSSC) {
      categories = [
        _ObhyashCategoryData(
          key: 'ssc_board',
          tag: 'বোর্ড স্পেশাল',
          title: 'বোর্ড মডেল লাইভ টেস্ট',
          subtitle: 'এসএসসি পূর্ণাঙ্গ মডেল',
          description: 'সকল শিক্ষা বোর্ডের স্ট্যান্ডার্ড প্যাটার্নে মেগা লাইভ পরীক্ষা',
          icon: Icons.assignment_turned_in_rounded,
          gradientColors: isDark
              ? [const Color(0xFF064E3B), const Color(0xFF022C22), const Color(0xFF011812)]
              : [const Color(0xFF059669), const Color(0xFF047857), const Color(0xFF065F46)],
          accentColor: const Color(0xFF34D399),
          shadowColor: const Color(0xFF059669),
          hasLive: _hasLive(exams, 'ssc_board'),
        ),
        _ObhyashCategoryData(
          key: 'ssc_school',
          tag: 'শীর্ষ স্কুল',
          title: 'শীর্ষ স্কুল ও ক্যাডেট',
          subtitle: 'টেস্ট পরীক্ষা স্পেশাল',
          description: 'আইডিয়াল • ভিকারুননিসা • রাজউক • ক্যাডেট টেস্ট পরীক্ষা',
          icon: Icons.school_rounded,
          gradientColors: isDark
              ? [const Color(0xFF1E3A8A), const Color(0xFF172554), const Color(0xFF0F172A)]
              : [const Color(0xFF2563EB), const Color(0xFF1D4ED8), const Color(0xFF1E40AF)],
          accentColor: const Color(0xFF60A5FA),
          shadowColor: const Color(0xFF2563EB),
          hasLive: _hasLive(exams, 'ssc_school'),
        ),
        if (isBiz)
          _ObhyashCategoryData(
            key: 'ssc_business',
            tag: 'ব্যবসায় শিক্ষা',
            title: 'বাণিজ্য লাইভ টেস্ট',
            subtitle: 'হিসাববিজ্ঞান • উদ্যোগ • ফিন্যান্স',
            description: 'ব্যবসায় শিক্ষা বিভাগের শিক্ষার্থীদের স্পেশাল লাইভ পরীক্ষা',
            icon: Icons.account_balance_wallet_rounded,
            gradientColors: isDark
                ? [const Color(0xFF78350F), const Color(0xFF451A03), const Color(0xFF290F02)]
                : [const Color(0xFFD97706), const Color(0xFFB45309), const Color(0xFF92400E)],
            accentColor: const Color(0xFFFBBF24),
            shadowColor: const Color(0xFFD97706),
            hasLive: _hasLive(exams, 'ssc_business'),
          )
        else if (isHum)
          _ObhyashCategoryData(
            key: 'ssc_humanities',
            tag: 'মানবিক বিভাগ',
            title: 'মানবিক লাইভ টেস্ট',
            subtitle: 'ইতিহাস • ভূগোল • পৌরনীতি • অর্থনীতি',
            description: 'মানবিক বিভাগের শিক্ষার্থীদের স্পেশাল লাইভ পরীক্ষা',
            icon: Icons.history_edu_rounded,
            gradientColors: isDark
                ? [const Color(0xFF581C87), const Color(0xFF3B0764), const Color(0xFF240342)]
                : [const Color(0xFF7C3AED), const Color(0xFF6D28D9), const Color(0xFF5B21B6)],
            accentColor: const Color(0xFFA78BFA),
            shadowColor: const Color(0xFF7C3AED),
            hasLive: _hasLive(exams, 'ssc_humanities'),
          )
        else if (isSci)
          _ObhyashCategoryData(
            key: 'ssc_science',
            tag: 'বিজ্ঞান বিভাগ',
            title: 'বিজ্ঞান লাইভ টেস্ট',
            subtitle: 'পদার্থ • রসায়ন • গণিত • জীব',
            description: 'বিজ্ঞান বিভাগের শিক্ষার্থীদের স্পেশাল লাইভ পরীক্ষা',
            icon: Icons.science_rounded,
            gradientColors: isDark
                ? [const Color(0xFF0E7490), const Color(0xFF155E75), const Color(0xFF083344)]
                : [const Color(0xFF0891B2), const Color(0xFF0E7490), const Color(0xFF155E75)],
            accentColor: const Color(0xFF22D3EE),
            shadowColor: const Color(0xFF0891B2),
            hasLive: _hasLive(exams, 'ssc_science'),
          )
        else ...[
          _ObhyashCategoryData(
            key: 'ssc_science',
            tag: 'বিজ্ঞান বিভাগ',
            title: 'বিজ্ঞান লাইভ টেস্ট',
            subtitle: 'পদার্থ • রসায়ন • গণিত • জীব',
            description: 'বিজ্ঞান বিভাগের শিক্ষার্থীদের স্পেশাল লাইভ পরীক্ষা',
            icon: Icons.science_rounded,
            gradientColors: isDark
                ? [const Color(0xFF0E7490), const Color(0xFF155E75), const Color(0xFF083344)]
                : [const Color(0xFF0891B2), const Color(0xFF0E7490), const Color(0xFF155E75)],
            accentColor: const Color(0xFF22D3EE),
            shadowColor: const Color(0xFF0891B2),
            hasLive: _hasLive(exams, 'ssc_science'),
          ),
          _ObhyashCategoryData(
            key: 'ssc_business',
            tag: 'বাণিজ্য ও মানবিক',
            title: 'বাণিজ্য ও মানবিক লাইভ',
            subtitle: 'হিসাববিজ্ঞান • ইতিহাস • পৌরনীতি',
            description: 'ব্যবসায় শিক্ষা ও মানবিক বিভাগের স্পেশাল লাইভ পরীক্ষা',
            icon: Icons.auto_stories_rounded,
            gradientColors: isDark
                ? [const Color(0xFF78350F), const Color(0xFF451A03), const Color(0xFF290F02)]
                : [const Color(0xFFD97706), const Color(0xFFB45309), const Color(0xFF92400E)],
            accentColor: const Color(0xFFFBBF24),
            shadowColor: const Color(0xFFD97706),
            hasLive: _hasLive(exams, 'ssc_business') || _hasLive(exams, 'ssc_humanities'),
          ),
        ],
        _ObhyashCategoryData(
          key: 'ssc_compulsory',
          tag: 'আবশ্যিক বিষয়',
          title: 'আবশ্যিক লাইভ টেস্ট',
          subtitle: 'বাংলা • ইংরেজি • গণিত • আইসিটি',
          description: 'সকল বিভাগের শিক্ষার্থীদের জন্য আবশ্যকীয় বিষয়ের মেগা টেস্ট',
          icon: Icons.menu_book_rounded,
          gradientColors: isDark
              ? [const Color(0xFF881337), const Color(0xFF4C0519), const Color(0xFF2E020D)]
              : [const Color(0xFFE11D48), const Color(0xFFBE123C), const Color(0xFF9F1239)],
          accentColor: const Color(0xFFFB7185),
          shadowColor: const Color(0xFFE11D48),
          hasLive: _hasLive(exams, 'ssc_compulsory'),
        ),
      ];
    } else {
      categories = [
        _ObhyashCategoryData(
          key: 'engineering',
          tag: 'ইঞ্জিনিয়ারিং',
          title: 'ইঞ্জিনিয়ারিং',
          subtitle: 'মডেল টেস্ট',
          description: 'বুয়েট • কুয়েট • রুয়েট • চুয়েট • আইইউটি',
          icon: Icons.architecture_rounded,
          gradientColors: isDark
              ? [const Color(0xFF1E3A8A), const Color(0xFF172554), const Color(0xFF0F172A)]
              : [const Color(0xFF2563EB), const Color(0xFF1D4ED8), const Color(0xFF1E40AF)],
          accentColor: const Color(0xFF60A5FA),
          shadowColor: const Color(0xFF2563EB),
          hasLive: _hasLive(exams, 'engineering'),
        ),
        _ObhyashCategoryData(
          key: 'medical',
          tag: 'মেডিকেল',
          title: 'মেডিকেল',
          subtitle: 'মডেল টেস্ট',
          description: 'মেডিকেল ও ডেন্টাল সরকারি ভর্তি পরীক্ষা',
          icon: Icons.medical_services_rounded,
          gradientColors: isDark
              ? [const Color(0xFF881337), const Color(0xFF4C0519), const Color(0xFF2E020D)]
              : [const Color(0xFFE11D48), const Color(0xFFBE123C), const Color(0xFF9F1239)],
          accentColor: const Color(0xFFFB7185),
          shadowColor: const Color(0xFFE11D48),
          hasLive: _hasLive(exams, 'medical'),
        ),
        _ObhyashCategoryData(
          key: 'varsity',
          tag: 'ভার্সিটি',
          title: 'ভার্সিটি ক-ইউনিট',
          subtitle: 'মডেল টেস্ট',
          description: 'ঢাকা বিশ্ববিদ্যালয় • সমন্বিত গুচ্ছ • জাহাঙ্গীরনগর',
          icon: Icons.school_rounded,
          gradientColors: isDark
              ? [const Color(0xFF581C87), const Color(0xFF3B0764), const Color(0xFF240342)]
              : [const Color(0xFF7C3AED), const Color(0xFF6D28D9), const Color(0xFF5B21B6)],
          accentColor: const Color(0xFFA78BFA),
          shadowColor: const Color(0xFF7C3AED),
          hasLive: _hasLive(exams, 'varsity'),
        ),
        _ObhyashCategoryData(
          key: 'hsc',
          tag: 'এইচএসসি',
          title: 'এইচএসসি স্পেশাল',
          subtitle: 'অধ্যায়ভিত্তিক পরীক্ষা',
          description: 'বিজ্ঞান বিভাগ বোর্ড প্রশ্ন ও পূর্ণাঙ্গ প্রস্তুতি',
          icon: Icons.menu_book_rounded,
          gradientColors: isDark
              ? [const Color(0xFF064E3B), const Color(0xFF022C22), const Color(0xFF011812)]
              : [const Color(0xFF059669), const Color(0xFF047857), const Color(0xFF065F46)],
          accentColor: const Color(0xFF34D399),
          shadowColor: const Color(0xFF059669),
          hasLive: _hasLive(exams, 'hsc'),
        ),
      ];
    }

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFF8FAFC),
      body: AppRefreshIndicator(
        onRefresh: () async {
          ref.invalidate(liveExamsProvider);
          try {
            await ref.read(liveExamsProvider.future);
          } catch (_) {}
        },
        child: ListView.separated(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 16),
          itemCount: categories.length,
          separatorBuilder: (context, index) => const SizedBox(height: 14),
          itemBuilder: (context, index) {
            return _buildPremiumSingleCard(context, isDark, categories[index]);
          },
        ),
      ),
    );
  }

  bool _hasLive(List<dynamic> exams, String category) {
    return exams.any((e) {
      if (e is LiveExam) {
        return matchesLiveExamCategory(e, category) && e.isOngoing == true;
      }
      final cat = (e.category ?? '').toString().toLowerCase();
      final target = category.toLowerCase();
      final match = (cat == target || cat == 'all' || (target == 'varsity' && cat == 'varsity_a'));
      return match && e.isOngoing == true;
    });
  }

  Widget _buildPremiumSingleCard(
    BuildContext context,
    bool isDark,
    _ObhyashCategoryData cat,
  ) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          context.push('/live_exam/${cat.key}');
        },
        borderRadius: BorderRadius.circular(24),
        splashColor: Colors.white.withValues(alpha: 0.15),
        highlightColor: Colors.white.withValues(alpha: 0.08),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: cat.gradientColors,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: Colors.white.withValues(alpha: isDark ? 0.14 : 0.28),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: cat.shadowColor.withValues(alpha: isDark ? 0.35 : 0.22),
                blurRadius: 18,
                spreadRadius: -2,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            children: [
              // Ambient Decorative Light Sphere (Top-Right)
              Positioned(
                right: -25,
                top: -25,
                child: Container(
                  width: 130,
                  height: 130,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Colors.white.withValues(alpha: isDark ? 0.15 : 0.22),
                        Colors.white.withValues(alpha: 0.0),
                      ],
                    ),
                  ),
                ),
              ),

              // Main Card Content
              Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top Header Row: Icon Emblem + Tag + Live Badge
                    Row(
                      children: [
                        // Glass Icon Emblem
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.25),
                              width: 1,
                            ),
                          ),
                          child: Icon(
                            cat.icon,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 12),

                        // Tag Pill
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.15),
                              width: 0.8,
                            ),
                          ),
                          child: Text(
                            cat.tag,
                            style: const TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              ),
                          ),
                        ),

                        const Spacer(),

                        // Live Status Badge
                        if (cat.hasLive)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.25),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 7,
                                  height: 7,
                                  decoration: BoxDecoration(
                                    color: cat.gradientColors.first,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  "LIVE NOW",
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: cat.gradientColors.first,
                                    letterSpacing: 0.6,
                                  ),
                                ),
                              ],
                            ),
                          )
                        else
                          const SizedBox.shrink(),

                        const SizedBox(width: 8),

                        // Sleek Chevron Arrow Indicator
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.14),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.2),
                              width: 0.8,
                            ),
                          ),
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.arrow_forward_ios_rounded,
                            color: Colors.white,
                            size: 12,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // Title and Subtitle Row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          cat.title,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                            letterSpacing: -0.3,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          "• ${cat.subtitle}",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.normal,
                            color: Colors.white.withValues(alpha: 0.85),
                            ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 4),

                    // Target Institutions / Details
                    Text(
                      cat.description,
                      style: TextStyle(
                        fontSize: 12,
                        height: 1.35,
                        color: Colors.white.withValues(alpha: 0.78),
                        ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
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

class _ObhyashCategoryData {
  final String key;
  final String tag;
  final String title;
  final String subtitle;
  final String description;
  final IconData icon;
  final List<Color> gradientColors;
  final Color accentColor;
  final Color shadowColor;
  final bool hasLive;

  const _ObhyashCategoryData({
    required this.key,
    required this.tag,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.icon,
    required this.gradientColors,
    required this.accentColor,
    required this.shadowColor,
    required this.hasLive,
  });
}
