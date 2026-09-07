import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import 'question_bank_tab_provider.dart';

class QuestionBankView extends ConsumerStatefulWidget {
  const QuestionBankView({super.key});

  @override
  ConsumerState<QuestionBankView> createState() => _QuestionBankViewState();
}

class _QuestionBankViewState extends ConsumerState<QuestionBankView> {

  // ── Subject List (2 per row with AI 3D banners) ──
  final List<Map<String, dynamic>> _subjects = [
    {
      'id': 'physics_1',
      'name': 'পদার্থবিজ্ঞান',
      'paper': '১ম পত্র',
      'count': 5,
      'image': 'assets/images/subjects/physics_1.jpg',
      'gradient': [Color(0xFF0A2540), Color(0xFF0D3B66), Color(0xFF14213D)],
    },
    {
      'id': 'physics_2',
      'name': 'পদার্থবিজ্ঞান',
      'paper': '২য় পত্র',
      'count': 5,
      'image': 'assets/images/subjects/physics_2.jpg',
      'gradient': [Color(0xFF033E8C), Color(0xFF00509D), Color(0xFF00296B)],
    },
    {
      'id': 'chemistry_1',
      'name': 'রসায়ন',
      'paper': '১ম পত্র',
      'count': 5,
      'image': 'assets/images/subjects/chemistry_1.jpg',
      'gradient': [Color(0xFF380459), Color(0xFF4A0E78), Color(0xFF25023D)],
    },
    {
      'id': 'chemistry_2',
      'name': 'রসায়ন',
      'paper': '২য় পত্র',
      'count': 5,
      'image': 'assets/images/subjects/chemistry_2.jpg',
      'gradient': [Color(0xFF4C0254), Color(0xFF63046D), Color(0xFF2F0135)],
    },
    {
      'id': 'math_1',
      'name': 'উচ্চতর গণিত',
      'paper': '১ম পত্র',
      'count': 4,
      'image': 'assets/images/subjects/math_1.jpg',
      'gradient': [Color(0xFF7A3602), Color(0xFF8C4303), Color(0xFF542401)],
    },
    {
      'id': 'math_2',
      'name': 'উচ্চতর গণিত',
      'paper': '২য় পত্র',
      'count': 4,
      'image': 'assets/images/subjects/math_2.jpg',
      'gradient': [Color(0xFF8B1E03), Color(0xFF9E2A2B), Color(0xFF540B0E)],
    },
    {
      'id': 'biology_1',
      'name': 'জীববিজ্ঞান',
      'paper': '১ম পত্র',
      'count': 5,
      'image': 'assets/images/subjects/biology_1.jpg',
      'gradient': [Color(0xFF064E3B), Color(0xFF047857), Color(0xFF022C22)],
    },
    {
      'id': 'biology_2',
      'name': 'জীববিজ্ঞান',
      'paper': '২য় পত্র',
      'count': 5,
      'image': 'assets/images/subjects/biology_2.jpg',
      'gradient': [Color(0xFF065F46), Color(0xFF0D9488), Color(0xFF042F2E)],
    },
    {
      'id': 'bangla_1',
      'name': 'বাংলা',
      'paper': '১ম পত্র',
      'count': 5,
      'image': 'assets/images/subjects/bangla_1.jpg',
      'gradient': [Color(0xFF831843), Color(0xFF9D174D), Color(0xFF500724)],
    },
    {
      'id': 'bangla_2',
      'name': 'বাংলা',
      'paper': '২য় পত্র',
      'count': 5,
      'image': 'assets/images/subjects/bangla_2.jpg',
      'gradient': [Color(0xFF701A75), Color(0xFF86198F), Color(0xFF4A044E)],
    },
    {
      'id': 'english_1',
      'name': 'ইংরেজি',
      'paper': '১ম পত্র',
      'count': 4,
      'image': 'assets/images/subjects/english_1.jpg',
      'gradient': [Color(0xFF1E3A8A), Color(0xFF1D4ED8), Color(0xFF172554)],
    },
    {
      'id': 'english_2',
      'name': 'ইংরেজি',
      'paper': '২য় পত্র',
      'count': 4,
      'image': 'assets/images/subjects/english_2.jpg',
      'gradient': [Color(0xFF0F766E), Color(0xFF0D9488), Color(0xFF134E4A)],
    },
    {
      'id': 'statistics_1',
      'name': 'পরিসংখ্যান',
      'paper': '১ম পত্র',
      'count': 4,
      'image': 'assets/images/subjects/statistics_1.jpg',
      'gradient': [Color(0xFF7C2D12), Color(0xFFC2410C), Color(0xFF431407)],
    },
    {
      'id': 'statistics_2',
      'name': 'পরিসংখ্যান',
      'paper': '২য় পত্র',
      'count': 4,
      'image': 'assets/images/subjects/statistics_2.jpg',
      'gradient': [Color(0xFF312E81), Color(0xFF4338CA), Color(0xFF1E1B4B)],
    },
    {
      'id': 'ict',
      'name': 'তথ্য ও যোগাযোগ',
      'paper': 'আইসিটি',
      'count': 6,
      'image': 'assets/images/subjects/ict.jpg',
      'gradient': [Color(0xFF0E4766), Color(0xFF0284C7), Color(0xFF072F44)],
    },
  ];

  // ── Official Admission Institutes matching user reference screenshot ──
  final List<Map<String, dynamic>> _institutes = [
    {
      'id': 'buet',
      'name': 'বুয়েট',
      'fullName': 'বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয়',
      'count': 38,
      'logo': 'assets/images/institutes/buet.png',
      'colors': [Color(0xFFFF4D82), Color(0xFFF43F5E), Color(0xFFE11D48)],
      'textColor': Color(0xFF4C0519),
    },
    {
      'id': 'ckruet',
      'name': 'গুচ্ছ ইঞ্জিঃ',
      'fullName': 'চুয়েট • কুয়েট • রুয়েট গুচ্ছ',
      'count': 4,
      'logo': 'assets/images/institutes/ckruet.png',
      'colors': [Color(0xFF60A5FA), Color(0xFF3B82F6), Color(0xFF2563EB)],
      'textColor': Color(0xFF1E3A8A),
    },
    {
      'id': 'ruet',
      'name': 'রুয়েট',
      'fullName': 'রাজশাহী প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়',
      'count': 15,
      'logo': 'assets/images/institutes/ruet.png',
      'colors': [Color(0xFF8B5CF6), Color(0xFF7C3AED), Color(0xFF6D28D9)],
      'textColor': Color(0xFF2E1065),
    },
    {
      'id': 'kuet',
      'name': 'কুয়েট',
      'fullName': 'খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়',
      'count': 19,
      'logo': 'assets/images/institutes/kuet.png',
      'colors': [Color(0xFFFBBF24), Color(0xFFF59E0B), Color(0xFFD97706)],
      'textColor': Color(0xFF78350F),
    },
    {
      'id': 'cuet',
      'name': 'চুয়েট',
      'fullName': 'চট্টগ্রাম প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়',
      'count': 16,
      'logo': 'assets/images/institutes/cuet.png',
      'colors': [Color(0xFF34D399), Color(0xFF10B981), Color(0xFF059669)],
      'textColor': Color(0xFF064E3B),
    },
    {
      'id': 'iut',
      'name': 'IUT',
      'fullName': 'ইসলামিক ইউনিভার্সিটি অব টেকনোলজি',
      'count': 14,
      'logo': 'assets/images/institutes/iut.png',
      'colors': [Color(0xFF22D3EE), Color(0xFF06B6D4), Color(0xFF0891B2)],
      'textColor': Color(0xFF164E63),
    },
    {
      'id': 'medical',
      'name': 'মেডিকেল',
      'fullName': 'জাতীয় মেডিকেল ও ডেন্টাল ভর্তি পরীক্ষা (DGME)',
      'count': 25,
      'logo': 'assets/images/institutes/medical.png',
      'colors': [Color(0xFFFB7185), Color(0xFFF43F5E), Color(0xFFBE123C)],
      'textColor': Color(0xFF4C0519),
    },
    {
      'id': 'du',
      'name': 'ঢাবি',
      'fullName': 'ঢাকা বিশ্ববিদ্যালয়',
      'count': 22,
      'logo': 'assets/images/institutes/du.png',
      'colors': [Color(0xFF818CF8), Color(0xFF6366F1), Color(0xFF4F46E5)],
      'textColor': Color(0xFF1E1B4B),
    },
    {
      'id': 'ju',
      'name': 'জাবি',
      'fullName': 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়',
      'count': 18,
      'logo': 'assets/images/institutes/ju.png',
      'colors': [Color(0xFFFB923C), Color(0xFFF97316), Color(0xFFC2410C)],
      'textColor': Color(0xFF7C2D12),
    },
    {
      'id': 'ru',
      'name': 'রাবি',
      'fullName': 'রাজশাহী বিশ্ববিদ্যালয়',
      'count': 17,
      'logo': 'assets/images/institutes/ru.png',
      'colors': [Color(0xFFA78BFA), Color(0xFF8B5CF6), Color(0xFF7C3AED)],
      'textColor': Color(0xFF3B0764),
    },
    {
      'id': 'cu',
      'name': 'চবি',
      'fullName': 'চট্টগ্রাম বিশ্ববিদ্যালয়',
      'count': 15,
      'logo': 'assets/images/institutes/cu.png',
      'colors': [Color(0xFF2DD4BF), Color(0xFF14B8A6), Color(0xFF0D9488)],
      'textColor': Color(0xFF134E4A),
    },
    {
      'id': 'sust',
      'name': 'শাবিপ্রবি',
      'fullName': 'শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়',
      'count': 16,
      'logo': 'assets/images/institutes/sust.png',
      'colors': [Color(0xFF4ADE80), Color(0xFF22C55E), Color(0xFF15803D)],
      'textColor': Color(0xFF14532D),
    },
    {
      'id': 'butex',
      'name': 'বুটেক্স',
      'fullName': 'বাংলাদেশ টেক্সটাইল বিশ্ববিদ্যালয়',
      'count': 12,
      'logo': 'assets/images/institutes/butex.png',
      'colors': [Color(0xFF93C5FD), Color(0xFF60A5FA), Color(0xFF3B82F6)],
      'textColor': Color(0xFF1E3A8A),
    },
    {
      'id': 'mist',
      'name': 'এমআইএসটি',
      'fullName': 'মিলিটারি ইনস্টিটিউট অব সায়েন্স অ্যান্ড টেকনোলজি',
      'count': 10,
      'logo': 'assets/images/institutes/mist.png',
      'colors': [Color(0xFF38BDF8), Color(0xFF0284C7), Color(0xFF0369A1)],
      'textColor': Color(0xFF082F49),
    },
    {
      'id': 'bup',
      'name': 'বিইউপি',
      'fullName': 'বাংলাদেশ ইউনিভার্সিটি অব প্রফেশনালস',
      'count': 8,
      'logo': 'assets/images/institutes/bup.png',
      'colors': [Color(0xFF34D399), Color(0xFF059669), Color(0xFF047857)],
      'textColor': Color(0xFF064E3B),
    },
    {
      'id': 'gst',
      'name': 'জিএসটি গুচ্ছ',
      'fullName': 'সমন্বিত সাধারণ ও প্রযুক্তি বিশ্ববিদ্যালয় গুচ্ছ (SUST, JnU, KU...)',
      'count': 5,
      'logo': 'assets/images/institutes/gst.png',
      'colors': [Color(0xFFFCD34D), Color(0xFFF59E0B), Color(0xFFB45309)],
      'textColor': Color(0xFF451A03),
    },
    {
      'id': 'agri',
      'name': 'কৃষি গুচ্ছ',
      'fullName': 'সমন্বিত কৃষি বিশ্ববিদ্যালয় গুচ্ছ (BAU, SAU...)',
      'count': 6,
      'logo': 'assets/images/institutes/agri.png',
      'colors': [Color(0xFFA3E635), Color(0xFF84CC16), Color(0xFF4D7C0F)],
      'textColor': Color(0xFF1A2E05),
    },
  ];

  @override
  Widget build(BuildContext context) {
    final activeTab = ref.watch(questionBankTabProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFFAFAF9),
      body: CustomScrollView(
        slivers: [
          const SliverToBoxAdapter(
            child: SizedBox(height: 8),
          ),

          // ── TAB 1: SUBJECT-WISE GRID ──
          if (activeTab == QuestionBankTab.subject)
            _buildSubjectGrid(isDark)
          else
            _buildInstitutionGrid(isDark),

          // Bottom padding so bottom nav doesn't cover content
          const SliverToBoxAdapter(
            child: SizedBox(height: 100),
          ),
        ],
      ),
    );
  }

  // ── SUBJECT-WISE GRID (2 PER ROW) ──
  Widget _buildSubjectGrid(bool isDark) {
    final user = ref.watch(userProfileProvider).value;
    final optionalSubject = user?.optionalSubject?.trim().toLowerCase();

    final items = _subjects.where((subject) {
      final id = (subject['id'] ?? '').toString().toLowerCase();
      final name = (subject['name'] ?? '').toString().toLowerCase();

      final isBiology = id.contains('biology') || name.contains('জীববিজ্ঞান');
      final isStatistics = id.contains('statistics') || name.contains('পরিসংখ্যান');

      if (optionalSubject != null && optionalSubject.isNotEmpty) {
        if (optionalSubject.contains('stat')) {
          if (isBiology) return false;
        } else if (optionalSubject.contains('bio')) {
          if (isStatistics) return false;
        }
      }
      return true;
    }).toList();

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 14,
          mainAxisSpacing: 14,
          childAspectRatio: 1.0,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final item = items[index];
            return _buildSubjectCard(item, isDark);
          },
          childCount: items.length,
        ),
      ),
    );
  }

  Widget _buildSubjectCard(Map<String, dynamic> item, bool isDark) {
    final name = item['name'] as String;
    final paper = item['paper'] as String;
    final imagePath = item['image'] as String;
    final gradient = item['gradient'] as List<Color>;

    return GestureDetector(
      onTap: () {
        HapticFeedback.mediumImpact();
        context.push('/question-bank/subject-details', extra: item);
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(26),
          boxShadow: [
            BoxShadow(
              color: gradient.first.withValues(alpha: 0.35),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(26),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: gradient,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
              ClipRect(
                child: ImageFiltered(
                  imageFilter: ui.ImageFilter.blur(sigmaX: 0.8, sigmaY: 0.8),
                  child: Transform.scale(
                    scale: 1.02,
                    child: Image.asset(
                      imagePath,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          const SizedBox.shrink(),
                    ),
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.black.withValues(alpha: 0.65),
                      Colors.black.withValues(alpha: 0.15),
                      Colors.black.withValues(alpha: 0.35),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    stops: const [0.0, 0.5, 1.0],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(14.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                            height: 1.15,
                            shadows: [
                              Shadow(
                                color: Colors.black54,
                                offset: Offset(0, 1.5),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          paper,
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Colors.white.withValues(alpha: 0.92),
                            shadows: const [
                              Shadow(
                                color: Colors.black54,
                                offset: Offset(0, 1),
                                blurRadius: 3,
                              ),
                            ],
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

  // ── INSTITUTION-WISE GRID (2 PER ROW WITH REAL LOGOS EXACTLY LIKE USER SCREENSHOT) ──
  Widget _buildInstitutionGrid(bool isDark) {
    final items = _institutes;

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 14,
          mainAxisSpacing: 14,
          childAspectRatio: 0.96,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final inst = items[index];
            return _buildInstitutionCard(inst, isDark);
          },
          childCount: items.length,
        ),
      ),
    );
  }

  Widget _buildInstitutionCard(Map<String, dynamic> inst, bool isDark) {
    final name = inst['name'] as String;
    final logo = inst['logo'] as String;
    final colors = inst['colors'] as List<Color>;
    final textColor = inst['textColor'] as Color;
    final isIut = inst['id'] == 'iut';

    return GestureDetector(
      onTap: () {
        HapticFeedback.mediumImpact();
        context.push('/question-bank/institute-details', extra: inst);
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: LinearGradient(
            colors: colors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: colors.first.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Decorative Soft Corner Bubbles
              Positioned(
                top: -15,
                right: -15,
                child: Container(
                  width: 65,
                  height: 65,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.22),
                  ),
                ),
              ),
              Positioned(
                bottom: -15,
                left: -15,
                child: Container(
                  width: 55,
                  height: 55,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.18),
                  ),
                ),
              ),

              // Card Layout Content
              Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // 1. Center Top: White Circular Emblem with Official Logo
                    Container(
                      width: 54,
                      height: 54,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black12,
                            blurRadius: 6,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(6),
                      child: Center(
                        child: Image.asset(
                          logo,
                          width: 38,
                          height: 38,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) =>
                              const Icon(
                            LucideIcons.graduationCap,
                            color: Colors.grey,
                            size: 24,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // 2. Middle: Large Bold Bengali Institute Name
                    Text(
                      name,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: textColor,
                        height: 1.1,
                      ),
                    ),

                    if (isIut)
                      Align(
                        alignment: Alignment.bottomRight,
                        child: Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.85),
                          ),
                          child: const Icon(
                            LucideIcons.check,
                            size: 13,
                            color: Color(0xFF0891B2),
                          ),
                        ),
                      )
                    else
                      const SizedBox(height: 4),
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

