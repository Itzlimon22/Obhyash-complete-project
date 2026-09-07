import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

class SubjectQuestionBankDetailView extends StatelessWidget {
  final Map<String, dynamic> subject;

  const SubjectQuestionBankDetailView({
    super.key,
    required this.subject,
  });

  static final Map<String, Map<String, dynamic>> _allCategories = {
    'academic': {
      'id': 'academic',
      'title': 'একাডেমিক',
      'subtitle': 'বোর্ড প্রশ্ন ও সমাধান',
      'colors': [Color(0xFF3B82F6), Color(0xFF2563EB), Color(0xFF1D4ED8)],
      'svgPath': 'assets/images/subjects/academic.svg',
      'hasBadge': false,
    },
    'textbook': {
      'id': 'textbook',
      'title': 'মূলবই',
      'subtitle': 'অনুশীলনী ও রেফারেন্স',
      'colors': [Color(0xFF10B981), Color(0xFF059669), Color(0xFF047857)],
      'svgPath': 'assets/images/subjects/textbook.svg',
      'hasBadge': false,
    },
    'engineering': {
      'id': 'engineering',
      'title': 'ইঞ্জিনিয়ারিং',
      'subtitle': 'বুয়েট • চুয়েট • কুয়েট • রুয়েট',
      'colors': [Color(0xFFF97316), Color(0xFFEA580C), Color(0xFFC2410C)],
      'svgPath': 'assets/images/subjects/engineering.svg',
      'hasBadge': true,
      'count': 1,
    },
    'medical': {
      'id': 'medical',
      'title': 'মেডিকেল',
      'subtitle': 'এমবিবিএস ও বিডিএস',
      'colors': [Color(0xFF06B6D4), Color(0xFF0891B2), Color(0xFF0E7490)],
      'svgPath': 'assets/images/subjects/medical.svg',
      'hasBadge': true,
      'count': 1,
    },
    'varsity_ka': {
      'id': 'varsity_ka',
      'title': 'ভার্সিটি \'ক\'',
      'subtitle': 'ঢাবি • জাবি • রাবি • চবি',
      'colors': [Color(0xFF8B5CF6), Color(0xFF7C3AED), Color(0xFF6D28D9)],
      'svgPath': 'assets/images/subjects/varsity_ka.svg',
      'hasBadge': true,
      'count': 1,
    },
    'varsity_kha': {
      'id': 'varsity_kha',
      'title': 'ভার্সিটি \'খ\'',
      'subtitle': 'কলা, আইন ও সামাজিক বিজ্ঞান',
      'colors': [Color(0xFFEC4899), Color(0xFFDB2777), Color(0xFFBE185D)],
      'svgPath': 'assets/images/subjects/varsity_kha.svg',
      'hasBadge': true,
      'count': 1,
    },
    'gst': {
      'id': 'gst',
      'title': 'গুচ্ছ সমন্বিত',
      'subtitle': 'জিএসটি ২৪ বিশ্ববিদ্যালয়',
      'colors': [Color(0xFF6366F1), Color(0xFF4F46E5), Color(0xFF3730A3)],
      'svgPath': 'assets/images/subjects/gst.svg',
      'hasBadge': true,
      'count': 1,
    },
    'iba_bup': {
      'id': 'iba_bup',
      'title': 'আইবিএ ও বিইউপি',
      'subtitle': 'আইবিএ • বিইউপি • অন্যান্য',
      'colors': [Color(0xFFF43F5E), Color(0xFFE11D48), Color(0xFF9F1239)],
      'svgPath': 'assets/images/subjects/iba_bup.svg',
      'hasBadge': true,
      'count': 1,
    },
  };

  static List<Map<String, dynamic>> _getCategoriesForSubject(String subjectId, String subjectName) {
    final id = subjectId.toLowerCase();
    final name = subjectName.toLowerCase();

    // 1. Math: Engineering YES, Varsity Ka YES, Medical NO!
    if (id.contains('math') || name.contains('গণিত')) {
      return [
        _allCategories['academic']!,
        _allCategories['textbook']!,
        _allCategories['engineering']!,
        _allCategories['varsity_ka']!,
        _allCategories['gst']!,
      ];
    }

    // 2. Biology: Medical YES, Varsity Ka YES, Engineering NO!
    if (id.contains('biology') || name.contains('জীব')) {
      return [
        _allCategories['academic']!,
        _allCategories['textbook']!,
        _allCategories['medical']!,
        _allCategories['varsity_ka']!,
        _allCategories['gst']!,
      ];
    }

    // 3. Bangla: Neither Medical nor Engineering
    if (id.contains('bangla') || name.contains('বাংলা')) {
      return [
        _allCategories['academic']!,
        _allCategories['textbook']!,
        _allCategories['varsity_kha']!,
        _allCategories['varsity_ka']!,
        _allCategories['gst']!,
      ];
    }

    // 4. English: Medical YES (Medical syllabus includes English), Engineering NO, IBA/BUP YES
    if (id.contains('english') || name.contains('ইংরেজি')) {
      return [
        _allCategories['academic']!,
        _allCategories['textbook']!,
        _allCategories['medical']!,
        _allCategories['varsity_ka']!,
        _allCategories['iba_bup']!,
      ];
    }

    // 5. Statistics: Academic, Textbook, Varsity Ka, GST
    if (id.contains('stat') || name.contains('পরিসংখ্যান')) {
      return [
        _allCategories['academic']!,
        _allCategories['textbook']!,
        _allCategories['varsity_ka']!,
        _allCategories['gst']!,
      ];
    }

    // 6. ICT: Academic, Textbook, Engineering, Varsity Ka, GST
    if (id.contains('ict') || name.contains('তথ্য') || name.contains('আইসিটি')) {
      return [
        _allCategories['academic']!,
        _allCategories['textbook']!,
        _allCategories['engineering']!,
        _allCategories['varsity_ka']!,
        _allCategories['gst']!,
      ];
    }

    // 7. Physics & Chemistry (Default Science): Academic, Textbook, Engineering, Medical, Varsity Ka
    return [
      _allCategories['academic']!,
      _allCategories['textbook']!,
      _allCategories['engineering']!,
      _allCategories['medical']!,
      _allCategories['varsity_ka']!,
    ];
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final subjectId = (subject['id'] ?? '').toString();
    final subjectName = (subject['name'] ?? 'বিষয়').toString();
    final paper = (subject['paper'] ?? '').toString();
    final paperClean = paper.contains(' ') ? paper.split(' ').first : paper;
    final title = paperClean.isNotEmpty ? '$subjectName $paperClean' : subjectName;

    // Intelligently select categories based on subject
    final categories = _getCategoriesForSubject(subjectId, subjectName);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8F9FA),
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back,
            color: isDark ? Colors.white : const Color(0xFF18181B),
            size: 24,
          ),
          onPressed: () {
            HapticFeedback.lightImpact();
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/question-bank');
            }
          },
        ),
        title: Text(
          title,
          style: TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : const Color(0xFF18181B),
          ),
        ),
      ),
      body: SafeArea(
        child: GridView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 14,
            mainAxisSpacing: 14,
            childAspectRatio: 1.25,
          ),
          itemCount: categories.length,
          itemBuilder: (context, index) {
            final cat = categories[index];
            return _buildCategoryCard(context, cat, isDark, title);
          },
        ),
      ),
    );
  }

  Widget _buildCategoryCard(
    BuildContext context,
    Map<String, dynamic> cat,
    bool isDark,
    String subjectTitle,
  ) {
    final colors = cat['colors'] as List<Color>;
    final categoryTitle = cat['title'] as String;
    final svgPath = cat['svgPath'] as String;

    return GestureDetector(
      onTap: () {
        HapticFeedback.mediumImpact();
        if (cat['id'] == 'academic') {
          context.push('/question-bank/academic-details', extra: subject);
        } else {
          _showCategoryActionSheet(context, cat, isDark, subjectTitle);
        }
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

              // SVG Illustration Art (Bigger)
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
                padding: const EdgeInsets.fromLTRB(14.0, 20.0, 12.0, 12.0),
                child: Text(
                  categoryTitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
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
            ],
          ),
        ),
      ),
    );
  }

  void _showCategoryActionSheet(
    BuildContext context,
    Map<String, dynamic> cat,
    bool isDark,
    String subjectTitle,
  ) {
    final catTitle = cat['title'] as String;
    final svgPath = cat['svgPath'] as String;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF000000) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          border: Border.all(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
          ),
        ),
        padding: const EdgeInsets.all(22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 38,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFD1D5DB),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Center(
              child: SvgPicture.asset(
                svgPath,
                width: 80,
                height: 80,
                fit: BoxFit.contain,
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Text(
                '$subjectTitle - $catTitle',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? Colors.white : const Color(0xFF111827),
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '$catTitle সেগমেন্টের বিগত বছরের বোর্ড ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষার সকল প্রশ্ন সমাধানসহ সাজানো রয়েছে।',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF4B5563),
                fontFamily: 'HindSiliguri',
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      context.push('/practice');
                    },
                    icon: const Icon(LucideIcons.penTool, size: 16),
                    label: const Text('অনুশীলন শুরু করো'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6),
                    foregroundColor: isDark ? Colors.white : const Color(0xFF374151),
                    padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text('বন্ধ করো'),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
