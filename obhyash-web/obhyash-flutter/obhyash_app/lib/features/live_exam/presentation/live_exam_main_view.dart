import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/live_exam_providers.dart';
import '../../../core/presentation/widgets/app_refresh_indicator.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import '../domain/models.dart';

/// A deep base colour per category. The card fades from a slightly lighter
/// top to a slightly deeper bottom of the SAME hue, so it feels dimensional
/// without a glossy highlight. White text on every tone is >= 5:1.
class ExamTone {
  const ExamTone(this.base);
  final Color base;

  Color get top => Color.lerp(base, Colors.white, 0.06)!;
  Color get bottom => Color.lerp(base, Colors.black, 0.12)!;

  static const cyan = ExamTone(Color(0xFF0B5F73));
  static const red = ExamTone(Color(0xFF8F1D32));
  static const blue = ExamTone(Color(0xFF27409C));
  static const green = ExamTone(Color(0xFF0D6040));
}

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
    final scale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.4);
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
          title: 'বোর্ড মডেল টেস্ট',
          kind: 'এসএসসি পূর্ণাঙ্গ মডেল',
          description: 'সকল শিক্ষা বোর্ডের স্ট্যান্ডার্ড মেগা লাইভ টেস্ট',
          icon: Icons.assignment_turned_in_rounded,
          tone: ExamTone.blue,
          hasLive: _hasLive(exams, 'ssc_board'),
        ),
        _ObhyashCategoryData(
          key: 'ssc_school',
          title: 'শীর্ষ স্কুল ও ক্যাডেট',
          kind: 'টেস্ট পরীক্ষা স্পেশাল',
          description: 'আইডিয়াল • ভিকারুননিসা • রাজউক • ক্যাডেট টেস্ট',
          icon: Icons.school_rounded,
          tone: ExamTone.cyan,
          hasLive: _hasLive(exams, 'ssc_school'),
        ),
        if (isBiz)
          _ObhyashCategoryData(
            key: 'ssc_business',
            title: 'বাণিজ্য লাইভ টেস্ট',
            kind: 'মেগা লাইভ পরীক্ষা',
            description: 'ব্যবসায় শিক্ষা বিভাগের মেগা লাইভ পরীক্ষা',
            icon: Icons.account_balance_wallet_rounded,
            tone: const ExamTone(Color(0xFFC2410C)),
            hasLive: _hasLive(exams, 'ssc_business'),
          )
        else if (isHum)
          _ObhyashCategoryData(
            key: 'ssc_humanities',
            title: 'মানবিক লাইভ টেস্ট',
            kind: 'স্পেশাল লাইভ পরীক্ষা',
            description: 'মানবিক বিভাগের স্পেশাল লাইভ পরীক্ষা',
            icon: Icons.history_edu_rounded,
            tone: const ExamTone(Color(0xFF701A75)),
            hasLive: _hasLive(exams, 'ssc_humanities'),
          )
        else if (isSci)
          _ObhyashCategoryData(
            key: 'ssc_science',
            title: 'বিজ্ঞান লাইভ টেস্ট',
            kind: 'অধ্যায়ভিত্তিক টেস্ট',
            description: 'বিজ্ঞান বিভাগের শিক্ষার্থীদের অধ্যায়ভিত্তিক পরীক্ষা',
            icon: Icons.science_rounded,
            tone: ExamTone.green,
            hasLive: _hasLive(exams, 'ssc_science'),
          )
        else ...[
          _ObhyashCategoryData(
            key: 'ssc_science',
            title: 'বিজ্ঞান লাইভ টেস্ট',
            kind: 'অধ্যায়ভিত্তিক টেস্ট',
            description: 'বিজ্ঞান বিভাগের শিক্ষার্থীদের অধ্যায়ভিত্তিক পরীক্ষা',
            icon: Icons.science_rounded,
            tone: ExamTone.green,
            hasLive: _hasLive(exams, 'ssc_science'),
          ),
          _ObhyashCategoryData(
            key: 'ssc_business',
            title: 'বাণিজ্য ও মানবিক',
            kind: 'মেগা লাইভ পরীক্ষা',
            description: 'ব্যবসায় শিক্ষা ও মানবিক বিভাগের লাইভ পরীক্ষা',
            icon: Icons.auto_stories_rounded,
            tone: const ExamTone(Color(0xFFC2410C)),
            hasLive: _hasLive(exams, 'ssc_business') || _hasLive(exams, 'ssc_humanities'),
          ),
        ],
        _ObhyashCategoryData(
          key: 'ssc_compulsory',
          title: 'আবশ্যিক লাইভ টেস্ট',
          kind: 'আবশ্যকীয় মেগা টেস্ট',
          description: 'সকল বিভাগের শিক্ষার্থীদের জন্য আবশ্যকীয় মেগা টেস্ট',
          icon: Icons.menu_book_rounded,
          tone: ExamTone.red,
          hasLive: _hasLive(exams, 'ssc_compulsory'),
        ),
      ];
    } else {
      categories = [
        _ObhyashCategoryData(
          key: 'engineering',
          title: 'ইঞ্জিনিয়ারিং',
          kind: 'মডেল টেস্ট',
          description: 'বুয়েট, কুয়েট, রুয়েট, চুয়েট, আইইউটি',
          icon: Icons.engineering_rounded,
          tone: ExamTone.cyan,
          hasLive: _hasLive(exams, 'engineering'),
        ),
        _ObhyashCategoryData(
          key: 'medical',
          title: 'মেডিকেল',
          kind: 'মডেল টেস্ট',
          description: 'মেডিকেল ও ডেন্টাল সরকারি ভর্তি প্রস্তুতি',
          icon: Icons.biotech_rounded,
          tone: ExamTone.red,
          hasLive: _hasLive(exams, 'medical'),
        ),
        _ObhyashCategoryData(
          key: 'varsity',
          title: 'ভার্সিটি ক-ইউনিট',
          kind: 'মডেল টেস্ট',
          description: 'ঢাকা বিশ্ববিদ্যালয়, জিএসটি গুচ্ছ, জাবি',
          icon: Icons.school_rounded,
          tone: ExamTone.blue,
          hasLive: _hasLive(exams, 'varsity'),
        ),
        _ObhyashCategoryData(
          key: 'hsc',
          title: 'এইচএসসি স্পেশাল',
          kind: 'অধ্যায়ভিত্তিক টেস্ট',
          description: 'বিজ্ঞান বিভাগ বোর্ড প্রশ্ন ও পূর্ণাঙ্গ প্রস্তুতি',
          icon: Icons.menu_book_rounded,
          tone: ExamTone.green,
          hasLive: _hasLive(exams, 'hsc'),
        ),
      ];
    }

    final hasAnyLive = categories.any((c) => c.hasLive);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0E1110) : const Color(0xFFF5F6F4),
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
              child: SizedBox(height: 16),
            ),

            // Live Status Indicator (Shown only when any live exam is actively running)
            if (hasAnyLive)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
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
                            SizedBox(width: 5),
                            Text(
                              'লাইভ চলছে',
                              style: TextStyle(
                                fontSize: 11,
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

            // 2-Column Grid of Exam Category Cards
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
              sliver: SliverGrid(
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  mainAxisExtent: 204 * scale,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final cat = categories[index];
                    return ExamCategoryCard(
                      title: cat.title,
                      kind: cat.kind,
                      description: cat.description,
                      icon: cat.icon,
                      tone: cat.tone,
                      hasLive: cat.hasLive,
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

/// The whole card is the button. [progress] is optional (0..1): pass the
/// learner's real completion to show a thin bar, or leave it null.
class ExamCategoryCard extends StatefulWidget {
  const ExamCategoryCard({
    super.key,
    required this.title,
    required this.kind,
    required this.description,
    required this.icon,
    required this.tone,
    required this.onTap,
    this.hasLive = false,
    this.progress,
  });

  final String title;
  final String kind;
  final String description;
  final IconData icon;
  final ExamTone tone;
  final VoidCallback onTap;
  final bool hasLive;
  final double? progress;

  @override
  State<ExamCategoryCard> createState() => _ExamCategoryCardState();
}

class _ExamCategoryCardState extends State<ExamCategoryCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.4);

    // Bengali needs generous line height or matras and conjuncts get clipped.
    final titleMedium = theme.textTheme.titleMedium ?? const TextStyle();
    final labelLarge = theme.textTheme.labelLarge ?? const TextStyle();
    final bodySmall = theme.textTheme.bodySmall ?? const TextStyle();

    final titleStyle = titleMedium.copyWith(
      fontSize: 18,
      fontWeight: FontWeight.w700,
      height: 1.4,
      letterSpacing: 0,
      color: Colors.white,
      leadingDistribution: TextLeadingDistribution.even,
    );
    final kindStyle = labelLarge.copyWith(
      fontSize: 13.5,
      fontWeight: FontWeight.w600,
      height: 1.4,
      color: Colors.white.withValues(alpha: 0.95),
    );
    final bodyStyle = bodySmall.copyWith(
      fontSize: 12.5,
      height: 1.5,
      color: Colors.white.withValues(alpha: 0.86),
    );

    return Semantics(
      button: true,
      excludeSemantics: true,
      label: '${widget.title}, ${widget.kind}. ${widget.description}',
      child: AnimatedScale(
        scale: _pressed ? 0.98 : 1,
        duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: Material(
          color: Colors.transparent,
          clipBehavior: Clip.antiAlias,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(
              color: widget.hasLive
                  ? const Color(0xFFFF4D4D).withValues(alpha: 0.6)
                  : Colors.white.withValues(alpha: 0.08),
              width: widget.hasLive ? 1.2 : 1.0,
            ),
          ),
          child: Ink(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [widget.tone.top, widget.tone.bottom],
              ),
            ),
            child: InkWell(
              onTap: () {
                HapticFeedback.selectionClick();
                widget.onTap();
              },
              onHighlightChanged: (v) => setState(() => _pressed = v),
              splashColor: Colors.white.withValues(alpha: 0.10),
              highlightColor: Colors.white.withValues(alpha: 0.06),
              child: Stack(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: Icon(widget.icon, size: 26, color: Colors.white),
                        ),
                        const SizedBox(height: 14),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            widget.title,
                            style: titleStyle,
                            maxLines: 1,
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.kind,
                          style: kindStyle,
                          maxLines: 1,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 6),
                        // Reserve exactly two lines so icons and titles line up
                        // across cards even when a description is one line.
                        SizedBox(
                          height: 2 * 12.5 * 1.5 * textScale,
                          child: Align(
                            alignment: Alignment.topCenter,
                            child: Text(
                              widget.description,
                              style: bodyStyle,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),
                        if (widget.progress != null) ...[
                          const SizedBox(height: 12),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(3),
                            child: LinearProgressIndicator(
                              value: widget.progress!.clamp(0.0, 1.0),
                              minHeight: 3,
                              color: Colors.white,
                              backgroundColor: Colors.white.withValues(alpha: 0.2),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (widget.hasLive)
                    const Positioned(
                      top: 10,
                      right: 10,
                      child: _LivePulseBadge(),
                    ),
                ],
              ),
            ),
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
            color: const Color(0xFFEF4444).withValues(alpha: 0.20 + (_animation.value * 0.10)),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFFEF4444).withValues(alpha: 0.6 + (_animation.value * 0.4)),
              width: 0.9,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 5.5,
                height: 5.5,
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
              const SizedBox(width: 3.5),
              const Text(
                'LIVE',
                style: TextStyle(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                  color: Colors.white,
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
  final String title;
  final String kind;
  final String description;
  final IconData icon;
  final ExamTone tone;
  final bool hasLive;

  const _ObhyashCategoryData({
    required this.key,
    required this.title,
    required this.kind,
    required this.description,
    required this.icon,
    required this.tone,
    required this.hasLive,
  });
}

