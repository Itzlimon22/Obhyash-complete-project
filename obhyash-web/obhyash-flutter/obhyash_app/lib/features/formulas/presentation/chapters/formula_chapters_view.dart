import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/formula_models.dart';
import '../../../../core/providers/title_provider.dart';
import '../../../../core/presentation/widgets/skeleton_loading.dart';

class FormulaChaptersView extends ConsumerStatefulWidget {
  final String subjectId;

  const FormulaChaptersView({super.key, required this.subjectId});

  @override
  ConsumerState<FormulaChaptersView> createState() => _FormulaChaptersViewState();
}

class _FormulaChaptersViewState extends ConsumerState<FormulaChaptersView> {
  FormulaSubject? _subject;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadSubject();
  }

  Future<void> _loadSubject() async {
    try {
      final meta = getAllFormulaSubjects().firstWhere(
        (s) => s.subjectId == widget.subjectId,
        orElse: () => throw Exception('Subject not found'),
      );
      final jsonStr = await rootBundle.loadString(meta.assetPath);
      final json = jsonDecode(jsonStr) as Map<String, dynamic>;
      if (mounted) {
        setState(() {
          _subject = FormulaSubject.fromJson(json);
          _isLoading = false;
        });
        
        Future.microtask(() {
          if (!mounted) return;
          final location = GoRouterState.of(context).uri.toString();
          ref.read(locationTitleProvider.notifier).updateTitle(location, meta.subjectName);
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isLoading) {
      return Scaffold(
        backgroundColor: isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAF9),
        body: const BookmarksListSkeleton(),
      );
    }

    if (_error != null || _subject == null) {
      return Scaffold(
        backgroundColor: isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAF9),
        body: Center(
          child: Text(
            'ডেটা লোড করা যায়নি',
            style: TextStyle(
              fontFamily: 'Anek Bangla',
              color: isDark ? Colors.white70 : Colors.black54,
            ),
          ),
        ),
      );
    }

    final chapters = _subject!.chapters;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAF9),
      body: ListView.builder(
        padding: const EdgeInsets.fromLTRB(10, 8, 10, 24),
        itemCount: chapters.length,
        itemBuilder: (context, index) {
          final chapter = chapters[index];
          return _ChapterTile(
            chapter: chapter,
            isDark: isDark,
            subjectId: widget.subjectId,
            index: index,
          );
        },
      ),
    );
  }
}

class _ChapterTile extends StatelessWidget {
  final FormulaChapter chapter;
  final bool isDark;
  final String subjectId;
  final int index;

  const _ChapterTile({
    required this.chapter,
    required this.isDark,
    required this.subjectId,
    required this.index,
  });

  static const List<Color> _dotColors = [
    Color(0xFF059669),
    Color(0xFF7C3AED),
    Color(0xFFD97706),
    Color(0xFFDC2626),
    Color(0xFF0891B2),
    Color(0xFF059669),
    Color(0xFFDB2777),
  ];

  @override
  Widget build(BuildContext context) {
    final dotColor = _dotColors[index % _dotColors.length];

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        context.push('/formulas/$subjectId/${chapter.chapterId}');
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE5E7EB),
          ),
          boxShadow: isDark
              ? []
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: dotColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'অধ্যায় ${chapter.chapterNumber}',
                    style: TextStyle(
                      fontSize: 12,
                      fontFamily: 'Anek Bangla',
                      color: isDark ? const Color(0xFF737373) : const Color(0xFF9CA3AF),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    chapter.chapterName,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Anek Bangla',
                      color: isDark ? Colors.white : const Color(0xFF111827),
                    ),
                  ),
                ],
              ),
            ),

            Icon(
              Icons.chevron_right_rounded,
              size: 20,
              color: isDark ? const Color(0xFF525252) : const Color(0xFFD1D5DB),
            ),
          ],
        ),
      ),
    );
  }
}
