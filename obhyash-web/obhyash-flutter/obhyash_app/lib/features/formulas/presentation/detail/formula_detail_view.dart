import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../models/formula_models.dart';
import '../../../../core/providers/title_provider.dart';
import '../../../../core/presentation/widgets/skeleton_loading.dart';
import '../../../../core/presentation/widgets/formula_math_view.dart';
import '../../../../core/presentation/widgets/latex_text.dart';

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
  String? _errorMessage;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadChapter();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadChapter() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

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
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString();
        });
      }
    }
  }

  List<FormulaEntry> _getFilteredFormulas() {
    if (_chapter == null) return [];
    if (_searchQuery.trim().isEmpty) return _chapter!.formulas;

    final query = _searchQuery.toLowerCase().trim();
    return _chapter!.formulas.where((f) {
      return f.title.toLowerCase().contains(query) ||
          f.latex.toLowerCase().contains(query) ||
          f.description.toLowerCase().contains(query);
    }).toList();
  }

  String _toBengaliNumber(int number) {
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    String result = number.toString();
    for (int i = 0; i < 10; i++) {
      result = result.replaceAll(englishDigits[i], bengaliDigits[i]);
    }
    return result;
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

    if (_errorMessage != null || _chapter == null) {
      return Scaffold(
        backgroundColor: isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAF9),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  LucideIcons.alertCircle,
                  size: 48,
                  color: isDark ? Colors.white38 : Colors.black38,
                ),
                const SizedBox(height: 12),
                Text(
                  'অধ্যায়ের সূত্র লোড করা সম্ভব হয়নি',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'HindSiliguri',
                    color: isDark ? Colors.white70 : Colors.black87,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: _loadChapter,
                  icon: const Icon(LucideIcons.refreshCw, size: 16),
                  label: const Text('পুনরায় চেষ্টা করুন', style: TextStyle(fontFamily: 'HindSiliguri')),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final filteredFormulas = _getFilteredFormulas();
    final totalCount = _chapter!.formulas.length;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAF9),
      body: Column(
        children: [
          // Search and Filter Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 44,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.08)
                            : Colors.black.withValues(alpha: 0.08),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: TextField(
                      controller: _searchController,
                      onChanged: (val) => setState(() => _searchQuery = val),
                      style: TextStyle(
                        fontSize: 14,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF111827),
                      ),
                      decoration: InputDecoration(
                        hintText: 'সূত্র বা টপিক খুঁজুন...',
                        hintStyle: TextStyle(
                          fontSize: 13,
                          fontFamily: 'HindSiliguri',
                          color: isDark ? const Color(0xFF737373) : const Color(0xFF9CA3AF),
                        ),
                        prefixIcon: Icon(
                          LucideIcons.search,
                          size: 18,
                          color: isDark ? const Color(0xFF737373) : const Color(0xFF9CA3AF),
                        ),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(LucideIcons.x, size: 16),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchQuery = '');
                                },
                              )
                            : null,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                // Count Badge
                Container(
                  height: 44,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669).withValues(alpha: isDark ? 0.15 : 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFF059669).withValues(alpha: 0.25),
                    ),
                  ),
                  child: Center(
                    child: Text(
                      _searchQuery.isEmpty
                          ? '${_toBengaliNumber(totalCount)}টি সূত্র'
                          : '${_toBengaliNumber(filteredFormulas.length)}/${_toBengaliNumber(totalCount)}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'HindSiliguri',
                        color: Color(0xFF059669),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Formula List
          Expanded(
            child: filteredFormulas.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            LucideIcons.searchX,
                            size: 40,
                            color: isDark ? Colors.white30 : Colors.black26,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'কোনো সূত্র পাওয়া যায়নি',
                            style: TextStyle(
                              fontSize: 16,
                              fontFamily: 'HindSiliguri',
                              color: isDark ? Colors.white60 : Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                    itemCount: filteredFormulas.length,
                    itemBuilder: (context, index) {
                      final formula = filteredFormulas[index];
                      return _BookFormulaCard(
                        formula: formula,
                        isDark: isDark,
                        index: index,
                        serialNumber: _toBengaliNumber(index + 1),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

/// A clean, textbook-styled, minimalist formula card as requested:
/// - Simple textbook flow without excessive nested boxes or icons.
/// - No copy buttons.
/// - Balanced LaTeX and text typography matching app's HindSiliguri font.
/// - Soft subtle academic tinted backgrounds to naturally differentiate cards.
class _BookFormulaCard extends StatelessWidget {
  final FormulaEntry formula;
  final bool isDark;
  final int index;
  final String serialNumber;

  const _BookFormulaCard({
    required this.formula,
    required this.isDark,
    required this.index,
    required this.serialNumber,
  });

  static const List<_CardTheme> _palettes = [
    // 1. Soft Sky Slate
    _CardTheme(
      lightBg: Color(0xFFF8FAFC),
      lightBorder: Color(0xFFE2E8F0),
      darkBg: Color(0xFF141820),
      darkBorder: Color(0xFF1E293B),
    ),
    // 2. Soft Sage Mint
    _CardTheme(
      lightBg: Color(0xFFF3FAF6),
      lightBorder: Color(0xFFD5EFE3),
      darkBg: Color(0xFF101C16),
      darkBorder: Color(0xFF18382A),
    ),
    // 3. Soft Warm Sand / Ivory
    _CardTheme(
      lightBg: Color(0xFFFDFBF7),
      lightBorder: Color(0xFFF5EADA),
      darkBg: Color(0xFF1B1813),
      darkBorder: Color(0xFF332B20),
    ),
    // 4. Soft Lavender
    _CardTheme(
      lightBg: Color(0xFFF9F7FD),
      lightBorder: Color(0xFFEAE3F7),
      darkBg: Color(0xFF181422),
      darkBorder: Color(0xFF2C223E),
    ),
    // 5. Soft Muted Blush
    _CardTheme(
      lightBg: Color(0xFFFDF7F8),
      lightBorder: Color(0xFFF6E0E3),
      darkBg: Color(0xFF1B1316),
      darkBorder: Color(0xFF352026),
    ),
  ];

  String _cleanTitle(String raw) {
    return raw.replaceAll(RegExp(r'\[.*?\]'), '').trim();
  }

  @override
  Widget build(BuildContext context) {
    final displayTitle = _cleanTitle(formula.title);
    final description = formula.description.trim();
    final theme = _palettes[index % _palettes.length];

    final cardBg = isDark ? theme.darkBg : theme.lightBg;
    final cardBorder = isDark ? theme.darkBorder : theme.lightBorder;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: cardBorder,
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Heading: Serial + Title (Clean Textbook style, No Icons)
          Text(
            '$serialNumber. $displayTitle',
            style: TextStyle(
              fontSize: 16.5,
              fontWeight: FontWeight.w700,
              fontFamily: 'HindSiliguri',
              height: 1.35,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 16),

          // 2. Math Formula (Centered with generous vertical padding, no overscreen cutoff)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Center(
              child: FormulaMathView(
                latex: formula.latex,
                isDark: isDark,
                fontSize: 17,
              ),
            ),
          ),

          // 3. Explanation / Description (Generous spacing and clean textbook text)
          if (description.isNotEmpty) ...[
            const SizedBox(height: 16),
            LatexText(
              text: description,
              style: TextStyle(
                fontSize: 14.5,
                fontFamily: 'HindSiliguri',
                height: 1.6,
                fontWeight: FontWeight.w500,
                color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF334155),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _CardTheme {
  final Color lightBg;
  final Color lightBorder;
  final Color darkBg;
  final Color darkBorder;

  const _CardTheme({
    required this.lightBg,
    required this.lightBorder,
    required this.darkBg,
    required this.darkBorder,
  });
}

