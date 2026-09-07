import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

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
    final subjectName = (subject['name'] as String?) ?? 'বিষয়';
    final rawPaper = (subject['paper'] as String?) ?? '';
    final paperClean = rawPaper.isNotEmpty ? rawPaper.split(' ')[0] : '';
    final subjectTitle = paperClean.isNotEmpty ? '$subjectName $paperClean' : subjectName;
    final pageTitle = '$subjectTitle - একাডেমিক';

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8F9FA),
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : const Color(0xFF1F2937),
            size: 22,
          ),
          onPressed: () => context.pop(),
        ),
        title: Text(
          pageTitle,
          style: TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : const Color(0xFF111827),
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
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
        ),
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

              // Custom SVG Illustration Art (Bigger)
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

              // Content: Title positioned lower down
              Padding(
                padding: const EdgeInsets.fromLTRB(14.0, 18.0, 12.0, 12.0),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    title,
                    maxLines: 1,
                    style: const TextStyle(
                      fontFamily: 'HindSiliguri',
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
}
