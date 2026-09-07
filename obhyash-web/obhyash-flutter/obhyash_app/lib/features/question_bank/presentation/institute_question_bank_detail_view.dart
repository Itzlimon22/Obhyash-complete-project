import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

class InstituteExamSet {
  final String id;
  final String title;
  final String year;
  final int questionCount;
  final String questionLabel;
  final int durationMinutes;
  final String durationLabel;
  final String type; // 'mcq', 'written', 'combined'
  final int? marks;

  const InstituteExamSet({
    required this.id,
    required this.title,
    required this.year,
    required this.questionCount,
    required this.questionLabel,
    required this.durationMinutes,
    required this.durationLabel,
    required this.type,
    this.marks,
  });
}

String formatDurationMinutes(int minutes) {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  final bnStr = minutes.toString().split('').map((c) {
    final idx = int.tryParse(c);
    return idx != null ? bnDigits[idx] : c;
  }).join('');
  return '$bnStr মিনিট';
}

class InstituteQuestionBankDetailView extends StatefulWidget {
  final Map<String, dynamic> institute;

  const InstituteQuestionBankDetailView({
    super.key,
    required this.institute,
  });

  @override
  State<InstituteQuestionBankDetailView> createState() =>
      _InstituteQuestionBankDetailViewState();
}

class _InstituteQuestionBankDetailViewState
    extends State<InstituteQuestionBankDetailView> {
  static List<InstituteExamSet> getInstituteExamSets(String instituteId) {
    final sets = <InstituteExamSet>[];
    final id = instituteId.toLowerCase();

    switch (id) {
      case 'buet':
        sets.add(const InstituteExamSet(
          id: 'buet-25-26-written',
          title: 'BUET 25-26 written',
          year: '2025-26',
          questionCount: 45,
          questionLabel: '৪৫টি প্রশ্ন',
          durationMinutes: 180,
          durationLabel: '৩ ঘন্টা',
          type: 'written',
          marks: 450,
        ));
        for (var yr = 24; yr >= 20; yr--) {
          final nextYr = yr + 1;
          final session = '$yr-$nextYr';
          final fullSession = '20$yr-20$nextYr';
          sets.add(InstituteExamSet(
            id: 'buet-$session-written',
            title: 'BUET $session written',
            year: fullSession,
            questionCount: 40,
            questionLabel: '৪০টি প্রশ্ন',
            durationMinutes: 120,
            durationLabel: '২ ঘন্টা',
            type: 'written',
            marks: 400,
          ));
          sets.add(InstituteExamSet(
            id: 'buet-$session-preli',
            title: 'BUET $session preli',
            year: fullSession,
            questionCount: 100,
            questionLabel: '১০০টি প্রশ্ন',
            durationMinutes: 60,
            durationLabel: '১ ঘন্টা',
            type: 'mcq',
            marks: 100,
          ));
        }
        for (var yr = 19; yr >= 0; yr--) {
          final nextYr = (yr + 1).toString().padLeft(2, '0');
          final curYr = yr.toString().padLeft(2, '0');
          final session = '$curYr-$nextYr';
          sets.add(InstituteExamSet(
            id: 'buet-$session-written',
            title: 'BUET $session written',
            year: '20$session',
            questionCount: 60,
            questionLabel: '৬০টি প্রশ্ন',
            durationMinutes: 120,
            durationLabel: '২ ঘন্টা',
            type: 'written',
            marks: 600,
          ));
        }
        break;

      case 'ckruet':
        for (var yr = 24; yr >= 20; yr--) {
          final nextYr = yr + 1;
          sets.add(InstituteExamSet(
            id: 'ckruet-$yr-$nextYr',
            title: 'CKRUET $yr-$nextYr',
            year: '20$yr-$nextYr',
            questionCount: 100,
            questionLabel: '১০০টি প্রশ্ন',
            durationMinutes: 150,
            durationLabel: '২.৫ ঘন্টা',
            type: 'mcq',
            marks: 500,
          ));
        }
        break;

      case 'medical':
        for (var yr = 24; yr >= 5; yr--) {
          final nextYr = (yr + 1).toString().padLeft(2, '0');
          final curYr = yr.toString().padLeft(2, '0');
          sets.add(InstituteExamSet(
            id: 'medical-$curYr-$nextYr',
            title: 'Medical MBBS $curYr-$nextYr',
            year: '20$curYr-$nextYr',
            questionCount: 100,
            questionLabel: '১০০টি প্রশ্ন',
            durationMinutes: 60,
            durationLabel: '১ ঘন্টা',
            type: 'mcq',
            marks: 100,
          ));
        }
        break;

      case 'du':
      case 'du_ka':
        for (var yr = 24; yr >= 19; yr--) {
          final nextYr = yr + 1;
          sets.add(InstituteExamSet(
            id: 'du-ka-$yr-$nextYr',
            title: 'DU KA $yr-$nextYr (MCQ+Written)',
            year: '20$yr-$nextYr',
            questionCount: 60,
            questionLabel: '৬০টি প্রশ্ন',
            durationMinutes: 90,
            durationLabel: '১.৫ ঘন্টা',
            type: 'combined',
            marks: 100,
          ));
        }
        for (var yr = 18; yr >= 5; yr--) {
          final nextYr = (yr + 1).toString().padLeft(2, '0');
          final curYr = yr.toString().padLeft(2, '0');
          sets.add(InstituteExamSet(
            id: 'du-ka-$curYr-$nextYr',
            title: 'DU KA $curYr-$nextYr',
            year: '20$curYr-$nextYr',
            questionCount: 120,
            questionLabel: '১২০টি প্রশ্ন',
            durationMinutes: 100,
            durationLabel: '১ ঘন্টা ৪০ মি.',
            type: 'mcq',
            marks: 120,
          ));
        }
        break;

      case 'butex':
        for (var yr = 24; yr >= 10; yr--) {
          final nextYr = yr + 1;
          sets.add(InstituteExamSet(
            id: 'butex-$yr-$nextYr',
            title: 'BUTEX $yr-$nextYr',
            year: '20$yr-$nextYr',
            questionCount: 80,
            questionLabel: '৮০টি প্রশ্ন',
            durationMinutes: 120,
            durationLabel: '২ ঘন্টা',
            type: 'mcq',
            marks: 200,
          ));
        }
        break;

      case 'mist':
        for (var yr = 24; yr >= 12; yr--) {
          final nextYr = yr + 1;
          sets.add(InstituteExamSet(
            id: 'mist-$yr-$nextYr',
            title: 'MIST $yr-$nextYr',
            year: '20$yr-$nextYr',
            questionCount: 100,
            questionLabel: '১০০টি প্রশ্ন',
            durationMinutes: 180,
            durationLabel: '৩ ঘন্টা',
            type: 'combined',
            marks: 200,
          ));
        }
        break;

      case 'iut':
        for (var yr = 24; yr >= 12; yr--) {
          final nextYr = yr + 1;
          sets.add(InstituteExamSet(
            id: 'iut-$yr-$nextYr',
            title: 'IUT $yr-$nextYr',
            year: '20$yr-$nextYr',
            questionCount: 100,
            questionLabel: '১০০টি প্রশ্ন',
            durationMinutes: 120,
            durationLabel: '২ ঘন্টা',
            type: 'mcq',
            marks: 100,
          ));
        }
        break;

      case 'ju':
        for (var yr = 24; yr >= 15; yr--) {
          final nextYr = yr + 1;
          sets.add(InstituteExamSet(
            id: 'ju-a-$yr-$nextYr',
            title: 'JU A-Unit $yr-$nextYr',
            year: '20$yr-$nextYr',
            questionCount: 80,
            questionLabel: '৮০টি প্রশ্ন',
            durationMinutes: 55,
            durationLabel: '৫৫ মিনিট',
            type: 'mcq',
            marks: 80,
          ));
        }
        break;

      case 'ru':
        for (var yr = 24; yr >= 15; yr--) {
          final nextYr = yr + 1;
          sets.add(InstituteExamSet(
            id: 'ru-c-$yr-$nextYr',
            title: 'RU C-Unit $yr-$nextYr',
            year: '20$yr-$nextYr',
            questionCount: 80,
            questionLabel: '৮০টি প্রশ্ন',
            durationMinutes: 60,
            durationLabel: '১ ঘন্টা',
            type: 'mcq',
            marks: 100,
          ));
        }
        break;

      case 'cu':
        for (var yr = 24; yr >= 15; yr--) {
          final nextYr = yr + 1;
          sets.add(InstituteExamSet(
            id: 'cu-a-$yr-$nextYr',
            title: 'CU A-Unit $yr-$nextYr',
            year: '20$yr-$nextYr',
            questionCount: 100,
            questionLabel: '১০০টি প্রশ্ন',
            durationMinutes: 60,
            durationLabel: '১ ঘন্টা',
            type: 'mcq',
            marks: 100,
          ));
        }
        break;

      case 'gst':
        for (var yr = 24; yr >= 20; yr--) {
          final nextYr = yr + 1;
          sets.add(InstituteExamSet(
            id: 'gst-a-$yr-$nextYr',
            title: 'GST A-Unit $yr-$nextYr',
            year: '20$yr-$nextYr',
            questionCount: 100,
            questionLabel: '১০০টি প্রশ্ন',
            durationMinutes: 60,
            durationLabel: '১ ঘন্টা',
            type: 'mcq',
            marks: 100,
          ));
        }
        break;

      case 'agri':
        for (var yr = 24; yr >= 19; yr--) {
          final nextYr = yr + 1;
          sets.add(InstituteExamSet(
            id: 'agri-$yr-$nextYr',
            title: 'Agri Cluster $yr-$nextYr',
            year: '20$yr-$nextYr',
            questionCount: 100,
            questionLabel: '১০০টি প্রশ্ন',
            durationMinutes: 60,
            durationLabel: '১ ঘন্টা',
            type: 'mcq',
            marks: 100,
          ));
        }
        break;

      case 'bup':
        for (var yr = 24; yr >= 16; yr--) {
          final nextYr = yr + 1;
          sets.add(InstituteExamSet(
            id: 'bup-fst-$yr-$nextYr',
            title: 'BUP FST $yr-$nextYr',
            year: '20$yr-$nextYr',
            questionCount: 80,
            questionLabel: '৮০টি প্রশ্ন',
            durationMinutes: 60,
            durationLabel: '১ ঘন্টা',
            type: 'mcq',
            marks: 100,
          ));
        }
        break;

      default:
        // Default generic university/engineering format
        for (var yr = 24; yr >= 12; yr--) {
          final nextYr = yr + 1;
          sets.add(InstituteExamSet(
            id: '$id-$yr-$nextYr',
            title: '${instituteId.toUpperCase()} $yr-$nextYr',
            year: '20$yr-$nextYr',
            questionCount: 100,
            questionLabel: '১০০টি প্রশ্ন',
            durationMinutes: 90,
            durationLabel: '১.৫ ঘন্টা',
            type: 'mcq',
            marks: 100,
          ));
        }
        break;
    }

    return sets;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final instId = (widget.institute['id'] ?? '').toString();
    final instName = (widget.institute['name'] ?? 'ইনস্টিটিউট').toString();
    final instLogo = (widget.institute['logo'] ?? '').toString();

    final allSets = getInstituteExamSets(instId);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        backgroundColor: isDark ? const Color(0xFF000000) : Colors.white,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
          onPressed: () {
            HapticFeedback.lightImpact();
            context.pop();
          },
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(3.5),
              child: ClipOval(
                child: Image.asset(
                  instLogo,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) =>
                      const Icon(LucideIcons.graduationCap, size: 18, color: Color(0xFF2563EB)),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              '$instName প্রশ্নব্যাংক',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontFamily: 'HindSiliguri',
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // Exam sets list
            if (allSets.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        LucideIcons.helpCircle,
                        size: 48,
                        color: isDark ? const Color(0xFF475569) : const Color(0xFFCBD5E1),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'কোনো প্রশ্নসেট খুঁজে পাওয়া যায়নি',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final item = allSets[index];
                      return _buildExamSetCard(item, isDark, instName);
                    },
                    childCount: allSets.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildExamSetCard(
    InstituteExamSet item,
    bool isDark,
    String instName,
  ) {
    final isWritten = item.type == 'written';
    final isCombined = item.type == 'combined';
    final isBuet = (widget.institute['id'] ?? '').toString().toLowerCase() == 'buet';

    final String badgeText;
    final Color badgeColor;
    if (isWritten) {
      badgeText = 'লিখিত';
      badgeColor = const Color(0xFF8B5CF6);
    } else if (isCombined) {
      badgeText = 'MCQ + লিখিত';
      badgeColor = const Color(0xFFEA580C);
    } else {
      badgeText = isBuet ? 'প্রিলি (MCQ)' : 'MCQ';
      badgeColor = const Color(0xFF0284C7);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            HapticFeedback.lightImpact();
            context.push('/question-bank/exam-set-details', extra: {
              'institute': widget.institute,
              'examSet': item,
            });
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Title + Type Badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        item.title,
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: badgeColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        badgeText,
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: badgeColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // ── SWAPPED SIDES: Question count on LEFT | Time on RIGHT ──
                Row(
                  children: [
                    // LEFT: Question count - ONLY icon has emerald color, neutral text
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          LucideIcons.fileQuestion,
                          size: 15,
                          color: Color(0xFF10B981),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          item.questionLabel,
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
                          ),
                        ),
                      ],
                    ),

                    // Divider
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Text(
                        '|',
                        style: TextStyle(
                          color: isDark ? const Color(0xFF475569) : const Color(0xFFCBD5E1),
                          fontWeight: FontWeight.w300,
                        ),
                      ),
                    ),

                    // RIGHT: Duration in minutes - ONLY icon has rose color, neutral text
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          LucideIcons.timer,
                          size: 15,
                          color: Color(0xFFF43F5E),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          formatDurationMinutes(item.durationMinutes),
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
                          ),
                        ),
                      ],
                    ),

                    const Spacer(),

                    // Action chevron
                    Icon(
                      LucideIcons.chevronRight,
                      size: 18,
                      color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

}
