import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_icons.dart';
import '../../../core/presentation/widgets/app_icon.dart';

class AcademicCategoryDetailView extends StatelessWidget {
  final Map<String, dynamic> subject;

  const AcademicCategoryDetailView({
    super.key,
    required this.subject,
  });

  static final List<Map<String, dynamic>> _academicSections = [
    {
      'id': 'mcq',
      'title': 'MCQ',
      'subtitle': 'বহুনির্বাচনী প্রশ্ন',
      'colors': [Color(0xFFF59E0B), Color(0xFFEAB308), Color(0xFFD97706)],
      'svgPath': 'assets/images/subjects/academic_mcq.svg',
      'count': 180,
    },
    {
      'id': 'cq',
      'title': 'CQ',
      'subtitle': 'সৃজনশীল প্রশ্ন',
      'colors': [Color(0xFFEF4444), Color(0xFFDC2626), Color(0xFFB91C1C)],
      'svgPath': 'assets/images/subjects/academic_cq.svg',
      'count': 187,
    },
    {
      'id': 'ka_bhandar',
      'title': 'ক প্রশ্নাবলী',
      'subtitle': 'জ্ঞানমূলক প্রশ্ন ও উত্তর',
      'colors': [Color(0xFF3B82F6), Color(0xFF2563EB), Color(0xFF1D4ED8)],
      'svgPath': 'assets/images/subjects/academic_ka.svg',
      'count': 116,
    },
    {
      'id': 'kha_bhandar',
      'title': 'খ প্রশ্নাবলী',
      'subtitle': 'অনুধাবনমূলক প্রশ্ন ও উত্তর',
      'colors': [Color(0xFF10B981), Color(0xFF059669), Color(0xFF047857)],
      'svgPath': 'assets/images/subjects/academic_kha.svg',
      'count': 116,
    },
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final subjectId = (subject['id'] ?? '').toString().toLowerCase();
    final subjectName = (subject['name'] as String?) ?? 'বিষয়';
    final rawPaper = (subject['paper'] as String?) ?? '';
    final paperClean = rawPaper.trim();
    final subjectTitle = paperClean.isNotEmpty ? '$subjectName $paperClean' : subjectName;
    final pageTitle = '$subjectTitle - একাডেমিক';

    final isEnglishFirstPaper = subjectId == 'english_1' ||
        subjectId == 'hsc_english_1' ||
        ((subjectId.contains('english') || subjectName.contains('ইংরেজি')) &&
            (paperClean.contains('১ম') || paperClean.contains('1st') || subjectId.contains('1')));

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8F9FA),
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: AppIcon(
            AppIcons.arrowLeft,
            color: isDark ? Colors.white : const Color(0xFF1F2937),
            size: 22,
          ),
          onPressed: () => context.pop(),
        ),
        title: Text(
          pageTitle,
          style: TextStyle(
            fontSize: 17.5,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : const Color(0xFF111827),
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: isEnglishFirstPaper
            ? _buildComingSoonBody(context, isDark, subjectTitle)
            : _buildGridBody(context, isDark, subjectTitle),
      ),
    );
  }

  Widget _buildGridBody(BuildContext context, bool isDark, String subjectTitle) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      child: GridView.builder(
        physics: const BouncingScrollPhysics(),
        itemCount: _academicSections.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 14,
          mainAxisSpacing: 14,
          childAspectRatio: 1.25,
        ),
        itemBuilder: (context, index) {
          final sec = _academicSections[index];
          return _buildAcademicCard(context, sec, isDark, subjectTitle);
        },
      ),
    );
  }

  Widget _buildAcademicCard(
    BuildContext context,
    Map<String, dynamic> sec,
    bool isDark,
    String subjectTitle,
  ) {
    final title = sec['title'] as String;
    final colors = sec['colors'] as List<Color>;
    final svgPath = sec['svgPath'] as String;

    return GestureDetector(
      onTap: () {
        HapticFeedback.mediumImpact();
        context.push(
          '/question-bank/academic-section',
          extra: {
            'subject': subject,
            'section': sec,
          },
        );
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(26),
          gradient: LinearGradient(
            colors: colors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: colors.first.withValues(alpha: 0.35),
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
              // Ambient glow circle
              Positioned(
                right: -20,
                bottom: -20,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.12),
                  ),
                ),
              ),

              // Custom SVG Illustration Art
              Positioned(
                right: -4,
                bottom: -4,
                child: SvgPicture.asset(
                  svgPath,
                  width: 96,
                  height: 96,
                  fit: BoxFit.contain,
                ),
              ),

              // Content: Title
              Padding(
                padding: const EdgeInsets.fromLTRB(14.0, 18.0, 12.0, 12.0),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    title,
                    maxLines: 1,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      height: 1.15,
                      shadows: [
                        Shadow(
                          color: Colors.black26,
                          offset: Offset(0, 1.5),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildComingSoonBody(BuildContext context, bool isDark, String subjectTitle) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Modern glowing rocket container
            Container(
              width: 110,
              height: 110,
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF2563EB).withValues(alpha: 0.35),
                        blurRadius: 18,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.rocket_launch_rounded,
                    color: Colors.white,
                    size: 40,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 28),

            // Coming Soon Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: const Color(0xFF3B82F6).withValues(alpha: 0.35),
                  width: 1,
                ),
              ),
              child: const Text(
                'শীঘ্রই আসছে',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF3B82F6),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Main Heading
            Text(
              '$subjectTitle এর একাডেমিক অংশ প্রস্তুত হচ্ছে',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : const Color(0xFF18181B),
                height: 1.3,
              ),
            ),
            const SizedBox(height: 10),

            // Subtitle
            Text(
              'আমরা এই বিষয়ের বোর্ড প্রশ্ন (MCQ, CQ, ক ও খ প্রশ্নাবলী) সাজানোর কাজ করছি। খুব শীঘ্রই ফিচারটি সবার জন্য উন্মুক্ত করা হবে!',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),

            // Return button
            OutlinedButton.icon(
              onPressed: () {
                HapticFeedback.lightImpact();
                context.pop();
              },
              icon: const Icon(Icons.arrow_back_rounded, size: 18),
              label: const Text(
                'ফিরে যান',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: isDark ? Colors.white : const Color(0xFF18181B),
                side: BorderSide(
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
