import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import '../../models/formula_models.dart';
import '../../../../core/providers/title_provider.dart';

class FormulaDetailView extends ConsumerStatefulWidget {
  final String subjectId;
  final String chapterId;

  const FormulaDetailView({
    super.key,
    required this.subjectId,
    required this.chapterId,
  });

  @override
  ConsumerState<FormulaDetailView> createState() => _FormulaDetailViewState();
}

class _FormulaDetailViewState extends ConsumerState<FormulaDetailView> {
  FormulaChapter? _chapter;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadChapter();
  }

  Future<void> _loadChapter() async {
    try {
      final meta = getAllFormulaSubjects().firstWhere(
        (s) => s.subjectId == widget.subjectId,
      );
      final indexStr = await rootBundle.loadString(meta.assetPath);
      final indexData = json.decode(indexStr);
      final subject = FormulaSubject.fromJson(indexData);
      final chapterMeta = subject.chapters.firstWhere(
        (c) => c.chapterId == widget.chapterId,
      );

      // Load the specific chapter file
      final chapterAssetPath = 'assets/formulas/${widget.subjectId}/${widget.chapterId}.json';
      final formulasStr = await rootBundle.loadString(chapterAssetPath);
      final List<dynamic> data = json.decode(formulasStr);

      final List<FormulaEntry> formulas = data
          .map((e) => FormulaEntry.fromJson(e as Map<String, dynamic>))
          .toList();

      final fullChapter = FormulaChapter(
        chapterId: chapterMeta.chapterId,
        chapterName: chapterMeta.chapterName,
        chapterNumber: chapterMeta.chapterNumber,
        formulas: formulas,
      );

      if (mounted) {
        setState(() {
          _chapter = fullChapter;
          _isLoading = false;
        });

        Future.microtask(() {
          if (!mounted) return;
          final location = GoRouterState.of(context).uri.toString();
          ref.read(locationTitleProvider.notifier).updateTitle(location, fullChapter.chapterName);
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isLoading) {
      return Scaffold(
        backgroundColor: isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAF9),
        body: const Center(child: CircularProgressIndicator(color: Color(0xFF059669))),
      );
    }

    if (_chapter == null) {
      return Scaffold(
        backgroundColor: isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAF9),
        body: Center(
          child: Text(
            'অধ্যায় পাওয়া যায়নি',
            style: TextStyle(
              fontFamily: 'Anek Bangla',
              color: isDark ? Colors.white70 : Colors.black54,
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAF9),
      body: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        itemCount: _chapter!.formulas.length,
        itemBuilder: (context, index) {
          return _FormulaCard(
            formula: _chapter!.formulas[index],
            isDark: isDark,
            index: index,
          );
        },
      ),
    );
  }
}

class _FormulaCard extends StatelessWidget {
  final FormulaEntry formula;
  final bool isDark;
  final int index;

  const _FormulaCard({
    required this.formula,
    required this.isDark,
    required this.index,
  });

  static const List<Color> _cardColors = [
    Color(0xFF0F2818),
    Color(0xFF1A0F2E),
    Color(0xFF1A1205),
    Color(0xFF0F1A2E),
    Color(0xFF1A0F18),
  ];

  static const List<Color> _lightCardColors = [
    Color(0xFFECFDF5),
    Color(0xFFF5F3FF),
    Color(0xFFFFFBEB),
    Color(0xFFEFF6FF),
    Color(0xFFFDF2F8),
  ];

  @override
  Widget build(BuildContext context) {
    final cardBg = isDark
        ? _cardColors[index % _cardColors.length]
        : _lightCardColors[index % _lightCardColors.length];

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.06)
              : Colors.black.withValues(alpha: 0.06),
        ),
        boxShadow: isDark
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ]
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: Color(0xFF059669),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    formula.title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Anek Bangla',
                      color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF374151),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // LaTeX Formula
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            child: Center(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Math.tex(
                  formula.latex,
                  mathStyle: MathStyle.display,
                  textStyle: TextStyle(
                    fontSize: 22,
                    color: isDark ? Colors.white : const Color(0xFF111827),
                  ),
                  onErrorFallback: (err) => SelectableText(
                    formula.latex,
                    style: TextStyle(
                      fontSize: 16,
                      fontFamily: 'monospace',
                      color: isDark ? Colors.white70 : Colors.black87,
                    ),
                  ),
                ),
              ),
            ),
          ),
          // Description
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.black.withValues(alpha: 0.2)
                  : Colors.black.withValues(alpha: 0.04),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
            ),
            child: Text.rich(
              TextSpan(
                children: _parseDescription(formula.description, isDark),
              ),
              style: TextStyle(
                fontSize: 13,
                fontFamily: 'Anek Bangla',
                height: 1.5,
                color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<InlineSpan> _parseDescription(String text, bool isDark) {
    final RegExp regex = RegExp(r'[a-zA-Z0-9_^{}\\]+');
    final Iterable<RegExpMatch> matches = regex.allMatches(text);
    final List<InlineSpan> spans = [];
    int lastMatchEnd = 0;

    for (final match in matches) {
      if (match.start > lastMatchEnd) {
        spans.add(TextSpan(text: text.substring(lastMatchEnd, match.start)));
      }

      final variable = match.group(0)!;
      spans.add(
        WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2.0),
            child: Math.tex(
              variable,
              textStyle: TextStyle(
                fontSize: 14,
                color: isDark ? const Color(0xFFE5E5E5) : const Color(0xFF1F2937),
              ),
              onErrorFallback: (err) => Text(
                variable,
                style: TextStyle(
                  fontSize: 14,
                  fontFamily: 'monospace',
                  color: isDark ? const Color(0xFFE5E5E5) : const Color(0xFF1F2937),
                ),
              ),
            ),
          ),
        ),
      );
      lastMatchEnd = match.end;
    }

    if (lastMatchEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastMatchEnd)));
    }

    return spans;
  }
}
