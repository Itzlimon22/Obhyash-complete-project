import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

class OnboardingSlide {
  final String tag;
  final String title;
  final String? description;
  final IconData icon;
  final String? imageAssetPath;
  final Color accentColor;
  final Widget fallbackWidget;

  const OnboardingSlide({
    required this.tag,
    required this.title,
    this.description,
    required this.icon,
    this.imageAssetPath,
    required this.accentColor,
    required this.fallbackWidget,
  });
}

class WelcomeView extends StatefulWidget {
  const WelcomeView({super.key});

  @override
  State<WelcomeView> createState() => _WelcomeViewState();
}

class _WelcomeViewState extends State<WelcomeView> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  Timer? _autoPlayTimer;

  // Luxury Premium Palette (Titanium Slate & Matte Dark)
  static const Color bgDark = Color(0xFF09090B); // Pure Zinc 950
  static const Color surfaceCard = Color(0xFF141417); // Elevated Matte Grey
  static const Color surfaceBorder = Color(0xFF27272A); // Zinc 800
  static const Color textMuted = Color(0xFFA1A1AA); // Zinc 400
  static const Color brandGreen = Color(0xFF004633); // Brand Pine Green
  static const Color accentGreen = Color(0xFF10B981); // Refined Emerald
  static const Color accentRed = Color(0xFFEF4444); // Refined Crimson

  @override
  void initState() {
    super.initState();
    _startAutoPlay();
  }

  void _startAutoPlay() {
    _autoPlayTimer?.cancel();
    _autoPlayTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!mounted) return;
      if (_pageController.hasClients) {
        final nextPage = (_currentPage + 1) % 5;
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeInOutCubic,
        );
      }
    });
  }

  void _onUserSwiped() {
    _startAutoPlay();
  }

  @override
  void dispose() {
    _autoPlayTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final slides = [
      // SLIDE 1: DASHBOARD
      OnboardingSlide(
        tag: 'স্মার্ট ড্যাশবোর্ড',
        title: 'তোমার সম্পূর্ণ প্রস্তুতির এক প্ল্যাটফর্ম',
        icon: LucideIcons.layoutDashboard,
        imageAssetPath: 'assets/images/onboarding/dashboard.png',
        accentColor: accentGreen,
        fallbackWidget: _buildMinimalStreakCard(),
      ),

      // SLIDE 2: EXAM RUNNER
      OnboardingSlide(
        tag: 'রিয়েল-টাইম এক্সাম',
        title: 'লাইভ কাউন্টডাউন ও টাইমড পরীক্ষা',
        icon: LucideIcons.timer,
        imageAssetPath: 'assets/images/onboarding/exam.png',
        accentColor: const Color(0xFF10B981),
        fallbackWidget: _buildMinimalExamCard(),
      ),

      // SLIDE 3: TOPIC PRACTICE & QUESTION SOLVING
      OnboardingSlide(
        tag: 'টপিকভিত্তিক অনুশীলন',
        title: 'হাজারো অধ্যায়ভিত্তিক প্রশ্ন ও নির্ভুল ব্যাখ্যা',
        icon: LucideIcons.bookOpen,
        imageAssetPath: 'assets/images/onboarding/practice.png',
        accentColor: accentGreen,
        fallbackWidget: _buildMinimalExamCard(),
      ),

      // SLIDE 4: FORMULAS HUB & SHORTCUTS
      OnboardingSlide(
        tag: 'ফর্মুলা ব্যাংক',
        title: 'সকল বিষয়ের প্রয়োজনীয় সূত্র ও শর্টকাট',
        icon: LucideIcons.binary,
        imageAssetPath: 'assets/images/onboarding/formulas.png',
        accentColor: const Color(0xFF3B82F6),
        fallbackWidget: _buildMinimalAnalysisCard(),
      ),

      // SLIDE 5: LIVE MODEL TESTS
      OnboardingSlide(
        tag: 'লাইভ মডেল টেস্ট',
        title: 'ইঞ্জিনিয়ারিং, মেডিকেল ও ভার্সিটি প্রস্তুতি',
        icon: LucideIcons.trophy,
        imageAssetPath: 'assets/images/onboarding/live_exam.png',
        accentColor: const Color(0xFFF59E0B),
        fallbackWidget: _buildMinimalLeaderboardCard(),
      ),
    ];

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: bgDark,
      ),
      child: Scaffold(
        backgroundColor: bgDark,
        body: SafeArea(
          child: Column(
            children: [
              // PageView Carousel (Fills upper screen naturally without empty top void)
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  onPageChanged: (index) {
                    setState(() => _currentPage = index);
                    _onUserSwiped();
                  },
                  itemCount: slides.length,
                  itemBuilder: (context, index) {
                    final slide = slides[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Column(
                        children: [
                          const SizedBox(height: 6),

                          // Showcase Image — constrained to 50% screen height
                          Center(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 32.0),
                              child: ConstrainedBox(
                                constraints: BoxConstraints(
                                  maxHeight: MediaQuery.of(context).size.height * 0.50,
                                ),
                                child: _buildShowcaseCard(slide),
                              ),
                            ),
                          ),

                          const SizedBox(height: 14),

                          // Minimal Tag Pill
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 11,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: surfaceCard,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: surfaceBorder),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  slide.icon,
                                  size: 12,
                                  color: slide.accentColor,
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  slide.tag,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    fontFamily: 'Anek Bangla',
                                    color: slide.accentColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),

                          // Slide Title
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8.0),
                            child: Text(
                              slide.title,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'Anek Bangla',
                                height: 1.3,
                                color: Colors.white,
                                letterSpacing: -0.2,
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                        ],
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 10),

              // Minimal Grey Indicator Dots
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(slides.length, (index) {
                  final isSelected = _currentPage == index;

                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: isSelected ? 20 : 6,
                    height: 5,
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.white : const Color(0xFF3F3F46),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  );
                }),
              ),

              // Generous breathing space between upper content & buttons
              const SizedBox(height: 24),

              // Bottom CTA Buttons in a single Row
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10.0),
                child: Column(
                  children: [
                    Row(
                      children: [
                        // Secondary Button: Titanium Slate Login
                        Expanded(
                          flex: 4,
                          child: SizedBox(
                            height: 50,
                            child: OutlinedButton(
                              onPressed: () => context.push('/login'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.white,
                                side: const BorderSide(color: surfaceBorder, width: 1.2),
                                backgroundColor: surfaceCard,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              child: const Text(
                                'লগইন',
                                style: TextStyle(
                                  fontSize: 15.5,
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'Anek Bangla',
                                ),
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(width: 12),

                        // Primary Button: Dark Pine Green with clean glow
                        Expanded(
                          flex: 6,
                          child: Container(
                            height: 50,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [brandGreen, Color(0xFF00664B)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFF059669).withValues(alpha: 0.4)),
                              boxShadow: [
                                BoxShadow(
                                  color: brandGreen.withValues(alpha: 0.35),
                                  blurRadius: 16,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: ElevatedButton(
                              onPressed: () => context.push('/signup'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                foregroundColor: Colors.white,
                                shadowColor: Colors.transparent,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'শুরু করুন',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      fontFamily: 'Anek Bangla',
                                    ),
                                  ),
                                  SizedBox(width: 6),
                                  Icon(LucideIcons.arrowRight, size: 16),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // Brand Slogan Footer Line (Clean Minimal Text)
                    const Center(
                      child: Text(
                        'অভ্যাসে শুরু, সাফল্যে শেষ',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Anek Bangla',
                          color: Color(0xFF71717A),
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),

                    const SizedBox(height: 10),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SHOWCASE CARD (Image Asset Loader with Minimal Fallback)
  // ─────────────────────────────────────────────────────────────
  Widget _buildShowcaseCard(OnboardingSlide slide) {
    if (slide.imageAssetPath != null) {
      return Center(
        child: AspectRatio(
          aspectRatio: 9 / 19.5,
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF09090B),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: const Color(0xFF27272A), width: 1.2),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.5),
                  blurRadius: 20,
                  spreadRadius: 0,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(21),
              child: Image.asset(
                slide.imageAssetPath!,
                fit: BoxFit.cover,
                filterQuality: FilterQuality.high,
                errorBuilder: (context, error, stackTrace) {
                  return slide.fallbackWidget;
                },
              ),
            ),
          ),
        ),
      );
    }
    return slide.fallbackWidget;
  }

  // ─────────────────────────────────────────────────────────────
  // SLEEK MINIMAL FALLBACK 1: EXAM PAGE
  // ─────────────────────────────────────────────────────────────
  Widget _buildMinimalExamCard() {
    return _buildDeviceWrapper(
      headerTitle: 'মডেল টেস্ট',
      headerTrailing: '⏱️ ১৪:২৫',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF27272A),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'পদার্থবিজ্ঞান • কাজ ও শক্তি',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Anek Bangla',
                    color: textMuted,
                  ),
                ),
              ),
              const Text(
                'প্রশ্ন ১২ / ২৫',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: textMuted,
                  fontFamily: 'Anek Bangla',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'একটি বস্তুর বেগ দ্বিগুণ করা হলে এর গতিশক্তি পূর্বের কত গুণ হবে?',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              fontFamily: 'Anek Bangla',
              height: 1.35,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 12),
          _buildMinimalOption('(ক) ২ গুণ', false),
          const SizedBox(height: 6),
          _buildMinimalOption('(খ) ৪ গুণ (সঠিক উত্তর ✓)', true),
          const SizedBox(height: 6),
          _buildMinimalOption('(গ) ৮ গুণ', false),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SLEEK MINIMAL FALLBACK 2: LEADERBOARD PAGE
  // ─────────────────────────────────────────────────────────────
  Widget _buildMinimalLeaderboardCard() {
    return _buildDeviceWrapper(
      headerTitle: 'জাতীয় লিডারবোর্ড',
      headerTrailing: 'HSC 2026',
      child: Column(
        children: [
          _buildLeaderboardRow('১', 'তানভীর আহমেদ', '১৮,৪৫০ XP', true),
          const SizedBox(height: 6),
          _buildLeaderboardRow('২', 'সাদিয়া তাসনিম', '১৬,২০০ XP', false),
          const SizedBox(height: 6),
          _buildLeaderboardRow('৩', 'রাফসান জনি', '১৪,৮০০ XP', false),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '#১৪ তুমি (সাদিকুর)',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Anek Bangla',
                    color: Colors.white,
                  ),
                ),
                Text(
                  '৯,৪৫০ XP',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF38BDF8),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SLEEK MINIMAL FALLBACK 3: ANALYSIS PAGE
  // ─────────────────────────────────────────────────────────────
  Widget _buildMinimalAnalysisCard() {
    return _buildDeviceWrapper(
      headerTitle: 'পারফরম্যান্স অ্যানালিটিক্স',
      headerTrailing: 'AI Report',
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF27272A),
                  border: Border.all(color: accentGreen, width: 2),
                ),
                child: const Center(
                  child: Text(
                    '৯২%',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Anek Bangla',
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'গড় নির্ভুলতা (Accuracy)',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Anek Bangla',
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    'মোট ৪৫টি পরীক্ষায় ৮২০টি সঠিক',
                    style: TextStyle(
                      fontSize: 9,
                      fontFamily: 'Anek Bangla',
                      color: textMuted,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildMinimalProgressBar('পদার্থবিজ্ঞান', 0.94),
          const SizedBox(height: 6),
          _buildMinimalProgressBar('উচ্চতর গণিত', 0.96),
          const SizedBox(height: 6),
          _buildMinimalProgressBar('রসায়ন', 0.88),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SLEEK MINIMAL FALLBACK 4: STREAK CARD
  // ─────────────────────────────────────────────────────────────
  Widget _buildMinimalStreakCard() {
    return _buildDeviceWrapper(
      headerTitle: 'স্ট্রিক ও অ্যাক্টিভিটি',
      headerTrailing: '🔥 ১২ Days',
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF27272A),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.flame, color: accentRed, size: 16),
                    SizedBox(width: 6),
                    Text(
                      '১২ দিনের একটানা স্ট্রিক!',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Anek Bangla',
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                Text(
                  '2x Multiplier ⚡',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFFBBF24),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র']
                .map((day) => Column(
                      children: [
                        Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: const Color(0xFF27272A),
                            shape: BoxShape.circle,
                            border: Border.all(color: accentRed, width: 1),
                          ),
                          child: const Center(
                            child: Icon(LucideIcons.flame, size: 11, color: accentRed),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          day,
                          style: const TextStyle(
                            fontSize: 8,
                            fontFamily: 'Anek Bangla',
                            color: textMuted,
                          ),
                        ),
                      ],
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  // REUSABLE TITANIUM DEVICE WRAPPER
  // ─────────────────────────────────────────────────────────────
  Widget _buildDeviceWrapper({
    required String headerTitle,
    required String headerTrailing,
    required Widget child,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: surfaceCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: surfaceBorder, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: const BoxDecoration(
              color: Color(0xFF1A1A1E),
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
              border: Border(bottom: BorderSide(color: surfaceBorder, width: 0.8)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  headerTitle,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Anek Bangla',
                    color: Colors.white70,
                  ),
                ),
                Text(
                  headerTrailing,
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: textMuted,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: child,
          ),
        ],
      ),
    );
  }

  Widget _buildMinimalOption(String text, bool isSelected) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isSelected ? const Color(0xFF1E293B) : const Color(0xFF1A1A1E),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: isSelected ? const Color(0xFF38BDF8) : surfaceBorder,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isSelected ? LucideIcons.checkCircle2 : LucideIcons.circle,
            color: isSelected ? const Color(0xFF38BDF8) : textMuted,
            size: 13,
          ),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              fontSize: 10,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              fontFamily: 'Anek Bangla',
              color: isSelected ? Colors.white : textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLeaderboardRow(String rank, String name, String xp, bool isFirst) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isFirst ? const Color(0xFF1E293B) : const Color(0xFF1A1A1E),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: isFirst ? const Color(0xFF334155) : surfaceBorder),
      ),
      child: Row(
        children: [
          Text(
            '#$rank',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: isFirst ? const Color(0xFFFBBF24) : textMuted,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              name,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                fontFamily: 'Anek Bangla',
                color: Colors.white,
              ),
            ),
          ),
          Text(
            xp,
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w700,
              color: textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMinimalProgressBar(String subject, double progress) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              subject,
              style: const TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w600,
                fontFamily: 'Anek Bangla',
                color: textMuted,
              ),
            ),
            Text(
              '${(progress * 100).toInt()}%',
              style: const TextStyle(
                fontSize: 8,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        ClipRRect(
          borderRadius: BorderRadius.circular(2),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: const Color(0xFF27272A),
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF52525B)),
            minHeight: 3,
          ),
        ),
      ],
    );
  }
}
