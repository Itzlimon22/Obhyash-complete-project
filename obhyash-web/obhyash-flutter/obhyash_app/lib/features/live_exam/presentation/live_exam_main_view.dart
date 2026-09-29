import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
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
          title: 'বোর্ড মডেল টেস্ট',
          subtitle: 'এসএসসি পূর্ণাঙ্গ মডেল',
          description: 'সকল শিক্ষা বোর্ডের স্ট্যান্ডার্ড মেগা লাইভ টেস্ট',
          svgAsset: 'assets/dashboard-icons/exam_pencil.svg',
          fallbackIcon: Icons.assignment_turned_in_rounded,
          solidColor: const Color(0xFF1D4ED8), // Deep Blue
          accentColor: const Color(0xFFDBEAFE),
          hasLive: _hasLive(exams, 'ssc_board'),
        ),
        _ObhyashCategoryData(
          key: 'ssc_school',
          tag: 'শীর্ষ স্কুল',
          title: 'শীর্ষ স্কুল ও ক্যাডেট',
          subtitle: 'টেস্ট পরীক্ষা স্পেশাল',
          description: 'আইডিয়াল • ভিকারুননিসা • রাজউক • ক্যাডেট টেস্ট',
          svgAsset: 'assets/images/subjects/varsity_ka.svg',
          fallbackIcon: Icons.school_rounded,
          solidColor: const Color(0xFF0F766E), // Deep Teal
          accentColor: const Color(0xFFCCFBF1),
          hasLive: _hasLive(exams, 'ssc_school'),
        ),
        if (isBiz)
          _ObhyashCategoryData(
            key: 'ssc_business',
            tag: 'ব্যবসায় শিক্ষা',
            title: 'বাণিজ্য লাইভ টেস্ট',
            subtitle: 'হিসাববিজ্ঞান • ফিন্যান্স',
            description: 'ব্যবসায় শিক্ষা বিভাগের মেগা লাইভ পরীক্ষা',
            svgAsset: 'assets/dashboard-icons/account_card.svg',
            fallbackIcon: Icons.account_balance_wallet_rounded,
            solidColor: const Color(0xFFC2410C), // Deep Amber Orange
            accentColor: const Color(0xFFFFEDD5),
            hasLive: _hasLive(exams, 'ssc_business'),
          )
        else if (isHum)
          _ObhyashCategoryData(
            key: 'ssc_humanities',
            tag: 'মানবিক বিভাগ',
            title: 'মানবিক লাইভ টেস্ট',
            subtitle: 'ইতিহাস • ভূগোল • পৌরনীতি',
            description: 'মানবিক বিভাগের স্পেশাল লাইভ পরীক্ষা',
            svgAsset: 'assets/images/subjects/textbook.svg',
            fallbackIcon: Icons.history_edu_rounded,
            solidColor: const Color(0xFF701A75), // Deep Plum
            accentColor: const Color(0xFFFCE7F3),
            hasLive: _hasLive(exams, 'ssc_humanities'),
          )
        else if (isSci)
          _ObhyashCategoryData(
            key: 'ssc_science',
            tag: 'বিজ্ঞান বিভাগ',
            title: 'বিজ্ঞান লাইভ টেস্ট',
            subtitle: 'পদার্থ • রসায়ন • গণিত • জীব',
            description: 'বিজ্ঞান বিভাগের শিক্ষার্থীদের অধ্যায়ভিত্তিক পরীক্ষা',
            svgAsset: 'assets/images/subjects/engineering.svg',
            fallbackIcon: Icons.science_rounded,
            solidColor: const Color(0xFF047857), // Deep Green
            accentColor: const Color(0xFFD1FAE5),
            hasLive: _hasLive(exams, 'ssc_science'),
          )
        else ...[
          _ObhyashCategoryData(
            key: 'ssc_science',
            tag: 'বিজ্ঞান বিভাগ',
            title: 'বিজ্ঞান লাইভ টেস্ট',
            subtitle: 'পদার্থ • রসায়ন • গণিত • জীব',
            description: 'বিজ্ঞান বিভাগের শিক্ষার্থীদের অধ্যায়ভিত্তিক পরীক্ষা',
            svgAsset: 'assets/images/subjects/engineering.svg',
            fallbackIcon: Icons.science_rounded,
            solidColor: const Color(0xFF047857), // Deep Green
            accentColor: const Color(0xFFD1FAE5),
            hasLive: _hasLive(exams, 'ssc_science'),
          ),
          _ObhyashCategoryData(
            key: 'ssc_business',
            tag: 'বাণিজ্য ও মানবিক',
            title: 'বাণিজ্য ও মানবিক লাইভ',
            subtitle: 'হিসাববিজ্ঞান • ইতিহাস • পৌরনীতি',
            description: 'ব্যবসায় শিক্ষা ও মানবিক বিভাগের লাইভ পরীক্ষা',
            svgAsset: 'assets/images/subjects/textbook.svg',
            fallbackIcon: Icons.auto_stories_rounded,
            solidColor: const Color(0xFFC2410C), // Deep Amber Orange
            accentColor: const Color(0xFFFFEDD5),
            hasLive: _hasLive(exams, 'ssc_business') || _hasLive(exams, 'ssc_humanities'),
          ),
        ],
        _ObhyashCategoryData(
          key: 'ssc_compulsory',
          tag: 'আবশ্যিক বিষয়',
          title: 'আবশ্যিক লাইভ টেস্ট',
          subtitle: 'বাংলা • ইংরেজি • গণিত • আইসিটি',
          description: 'সকল বিভাগের শিক্ষার্থীদের জন্য আবশ্যকীয় মেগা টেস্ট',
          svgAsset: 'assets/images/subjects/academic.svg',
          fallbackIcon: Icons.menu_book_rounded,
          solidColor: const Color(0xFF991B1B), // Deep Red
          accentColor: const Color(0xFFFEE2E2),
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
          svgAsset: 'assets/images/subjects/engineering.svg',
          fallbackIcon: Icons.architecture_rounded,
          solidColor: const Color(0xFF0E7490), // Deep Cyan (cyan-700)
          accentColor: const Color(0xFFCFFAFE),
          hasLive: _hasLive(exams, 'engineering'),
        ),
        _ObhyashCategoryData(
          key: 'medical',
          tag: 'মেডিকেল',
          title: 'মেডিকেল',
          subtitle: 'মডেল টেস্ট',
          description: 'মেডিকেল ও ডেন্টাল সরকারি ভর্তি প্রস্তুতি',
          svgAsset: 'assets/images/subjects/medical.svg',
          fallbackIcon: Icons.medical_services_rounded,
          solidColor: const Color(0xFFBE123C), // Deep Red (rose-700)
          accentColor: const Color(0xFFFFE4E6),
          hasLive: _hasLive(exams, 'medical'),
        ),
        _ObhyashCategoryData(
          key: 'varsity',
          tag: 'ভার্সিটি',
          title: 'ভার্সিটি ক-ইউনিট',
          subtitle: 'মডেল টেস্ট',
          description: 'ঢাকা বিশ্ববিদ্যালয় • জিএসটি গুচ্ছ • জাবি',
          svgAsset: 'assets/images/subjects/varsity_ka.svg',
          fallbackIcon: Icons.school_rounded,
          solidColor: const Color(0xFF6D28D9), // Deep Purple (purple-700)
          accentColor: const Color(0xFFEDE9FE),
          hasLive: _hasLive(exams, 'varsity'),
        ),
        _ObhyashCategoryData(
          key: 'hsc',
          tag: 'এইচএসসি',
          title: 'এইচএসসি স্পেশাল',
          subtitle: 'অধ্যায়ভিত্তিক টেস্ট',
          description: 'বিজ্ঞান বিভাগ বোর্ড প্রশ্ন ও পূর্ণাঙ্গ প্রস্তুতি',
          svgAsset: 'assets/images/subjects/academic.svg',
          fallbackIcon: Icons.menu_book_rounded,
          solidColor: const Color(0xFF047857), // Deep Green (emerald-700)
          accentColor: const Color(0xFFD1FAE5),
          hasLive: _hasLive(exams, 'hsc'),
        ),
      ];
    }

    final hasAnyLive = categories.any((c) => c.hasLive);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC),
      body: AppRefreshIndicator(
        onRefresh: () async {
          ref.invalidate(liveExamsProvider);
          try {
            await ref.read(liveExamsProvider.future);
          } catch (_) {}
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          slivers: [
            // Generous breathing room below the header
            const SliverToBoxAdapter(
              child: SizedBox(height: 24),
            ),

            // Live Status Indicator (Shown only when any live exam is actively running)
            if (hasAnyLive)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: const Color(0xFFEF4444).withValues(alpha: 0.4),
                            width: 0.8,
                          ),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _PulsingDot(),
                            SizedBox(width: 4),
                            Text(
                              'লাইভ চলছে',
                              style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFFEF4444),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // 2-Column Grid of Premium Category Cards
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 32),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.85,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final cat = categories[index];
                    return _PremiumGridCard(
                      cat: cat,
                      isDark: isDark,
                      onTap: () {
                        context.push('/live_exam/${cat.key}');
                      },
                    );
                  },
                  childCount: categories.length,
                ),
              ),
            ),
          ],
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
}

class _PremiumGridCard extends StatefulWidget {
  final _ObhyashCategoryData cat;
  final bool isDark;
  final VoidCallback onTap;

  const _PremiumGridCard({
    required this.cat,
    required this.isDark,
    required this.onTap,
  });

  @override
  State<_PremiumGridCard> createState() => _PremiumGridCardState();
}

class _PremiumGridCardState extends State<_PremiumGridCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _pressController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _pressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.965).animate(
      CurvedAnimation(parent: _pressController, curve: Curves.easeOutCubic),
    );
  }

  @override
  void dispose() {
    _pressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cat = widget.cat;
    final isDark = widget.isDark;

    return GestureDetector(
      onTapDown: (_) => _pressController.forward(),
      onTapUp: (_) {
        _pressController.reverse();
        widget.onTap();
      },
      onTapCancel: () => _pressController.reverse(),
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) =>
            Transform.scale(scale: _scaleAnimation.value, child: child),
        child: Container(
          decoration: BoxDecoration(
            color: cat.solidColor,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: cat.hasLive
                  ? const Color(0xFFFF4D4D)
                  : Colors.white.withValues(alpha: 0.18),
              width: cat.hasLive ? 1.8 : 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color: cat.solidColor.withValues(alpha: isDark ? 0.40 : 0.30),
                blurRadius: cat.hasLive ? 16 : 10,
                spreadRadius: 0,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            children: [
              // Top-Right Ambient Glow for subtle depth
              Positioned(
                right: -20,
                top: -20,
                child: Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Colors.white.withValues(alpha: 0.12),
                        Colors.white.withValues(alpha: 0.0),
                      ],
                    ),
                  ),
                ),
              ),

              // Main Card Body
              Padding(
                padding: const EdgeInsets.all(13),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top Row: Custom SVG Emblem + Tag / Live Badge
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Custom Icon Container
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(13),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.28),
                              width: 1.0,
                            ),
                          ),
                          padding: const EdgeInsets.all(8),
                          child: SvgPicture.asset(
                            cat.svgAsset,
                            fit: BoxFit.contain,
                            placeholderBuilder: (_) => Icon(
                              cat.fallbackIcon,
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                        ),

                        // Status Badge
                        if (cat.hasLive)
                          const _LivePulseBadge()
                        else
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.20),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.32),
                                width: 0.8,
                              ),
                            ),
                            child: Text(
                              cat.tag,
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                          ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    // Title
                    Text(
                      cat.title,
                      style: const TextStyle(
                        fontSize: 15.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.3,
                        color: Colors.white,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 2),

                    // Subtitle
                    Text(
                      cat.subtitle,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: Colors.white.withValues(alpha: 0.90),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 4),

                    // Description (Expanded absorbs remaining height cleanly)
                    Expanded(
                      child: Text(
                        cat.description,
                        style: TextStyle(
                          fontSize: 10.5,
                          height: 1.3,
                          color: Colors.white.withValues(alpha: 0.82),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),

                    // Bottom Action Row
                    Row(
                      children: [
                        Text(
                          cat.hasLive ? 'পরীক্ষায় যাও' : 'পরীক্ষা শুরু',
                          style: const TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.22),
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.arrow_forward_rounded,
                            size: 14,
                            color: Colors.white,
                          ),
                        ),
                      ],
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

class _LivePulseBadge extends StatefulWidget {
  const _LivePulseBadge();

  @override
  State<_LivePulseBadge> createState() => _LivePulseBadgeState();
}

class _LivePulseBadgeState extends State<_LivePulseBadge>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.45, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
          decoration: BoxDecoration(
            color: const Color(0xFFEF4444).withValues(alpha: 0.12 + (_animation.value * 0.08)),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: const Color(0xFFEF4444).withValues(alpha: 0.4 + (_animation.value * 0.4)),
              width: 0.9,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFEF4444).withValues(alpha: _animation.value),
                      blurRadius: 4,
                      spreadRadius: 1,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 4),
              const Text(
                'LIVE',
                style: TextStyle(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                  color: Color(0xFFEF4444),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _PulsingDot extends StatefulWidget {
  const _PulsingDot();

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            color: const Color(0xFFEF4444),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFEF4444).withValues(alpha: _animation.value),
                blurRadius: 4,
                spreadRadius: 1,
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ObhyashCategoryData {
  final String key;
  final String tag;
  final String title;
  final String subtitle;
  final String description;
  final String svgAsset;
  final IconData fallbackIcon;
  final Color solidColor;
  final Color accentColor;
  final bool hasLive;

  const _ObhyashCategoryData({
    required this.key,
    required this.tag,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.svgAsset,
    required this.fallbackIcon,
    required this.solidColor,
    required this.accentColor,
    required this.hasLive,
  });
}
