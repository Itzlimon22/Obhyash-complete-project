import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../models/formula_models.dart';
import '../../../../core/providers/title_provider.dart';
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
        body: const Center(
          child: CircularProgressIndicator(color: Color(0xFF059669)),
        ),
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
                    fontFamily: 'Anek Bangla',
                    color: isDark ? Colors.white70 : Colors.black87,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: _loadChapter,
                  icon: const Icon(LucideIcons.refreshCw, size: 16),
                  label: const Text('পুনরায় চেষ্টা করুন', style: TextStyle(fontFamily: 'Anek Bangla')),
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
                        fontFamily: 'Anek Bangla',
                        color: isDark ? Colors.white : const Color(0xFF111827),
                      ),
                      decoration: InputDecoration(
                        hintText: 'সূত্র বা টপিক খুঁজুন...',
                        hintStyle: TextStyle(
                          fontSize: 13.5,
                          fontFamily: 'Anek Bangla',
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
                        fontFamily: 'Anek Bangla',
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
                              fontSize: 15,
                              fontFamily: 'Anek Bangla',
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
                      return _FormulaCard(
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

class _FormulaCard extends StatefulWidget {
  final FormulaEntry formula;
  final bool isDark;
  final int index;
  final String serialNumber;

  const _FormulaCard({
    required this.formula,
    required this.isDark,
    required this.index,
    required this.serialNumber,
  });

  @override
  State<_FormulaCard> createState() => _FormulaCardState();
}

class _FormulaCardState extends State<_FormulaCard> {
  bool _copied = false;

  void _copyFormula() {
    HapticFeedback.lightImpact();
    Clipboard.setData(ClipboardData(text: widget.formula.latex));
    setState(() => _copied = true);

    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(LucideIcons.checkCircle2, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                '${_cleanTitle(widget.formula.title)} কপি করা হয়েছে',
                style: const TextStyle(fontFamily: 'Anek Bangla', fontSize: 13),
              ),
            ),
          ],
        ),
        duration: const Duration(milliseconds: 1400),
        behavior: SnackBarBehavior.floating,
        backgroundColor: const Color(0xFF059669),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  String _cleanTitle(String raw) {
    return raw.replaceAll(RegExp(r'\[.*?\]'), '').trim();
  }

  _TitleBadge? _extractBadge(String raw) {
    final lower = raw.toLowerCase();
    if (lower.contains('admission hack') ||
        lower.contains('magic hack') ||
        lower.contains('mcq hack') ||
        lower.contains('shortcut')) {
      return _TitleBadge(
        text: 'এডমিশন হ্যাক',
        icon: LucideIcons.zap,
        color: const Color(0xFFF59E0B),
      );
    }
    if (lower.contains('cq important') || lower.contains('most important cq')) {
      return _TitleBadge(
        text: 'বোর্ড CQ স্পেশাল',
        icon: LucideIcons.target,
        color: const Color(0xFF8B5CF6),
      );
    }
    if (lower.contains('most important pyq') || lower.contains('pyq hot')) {
      return _TitleBadge(
        text: 'টপ PYQ',
        icon: LucideIcons.flame,
        color: const Color(0xFFEC4899),
      );
    }
    if (lower.contains('must known') || lower.contains('must know')) {
      return _TitleBadge(
        text: 'মাস্ট নো',
        icon: LucideIcons.star,
        color: const Color(0xFF059669),
      );
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final badge = _extractBadge(widget.formula.title);
    final displayTitle = _cleanTitle(widget.formula.title);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131316) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : Colors.black.withValues(alpha: 0.06),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Header: Serial Badge + Title + Highlight Tag + Copy Action
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 12, 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Serial Chip
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669).withValues(alpha: isDark ? 0.25 : 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '#${widget.serialNumber}',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Anek Bangla',
                      color: Color(0xFF059669),
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Title + Badge
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        displayTitle,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Anek Bangla',
                          height: 1.3,
                          color: isDark ? const Color(0xFFF3F4F6) : const Color(0xFF111827),
                        ),
                      ),
                      if (badge != null) ...[
                        const SizedBox(height: 5),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: badge.color.withValues(alpha: isDark ? 0.18 : 0.1),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: badge.color.withValues(alpha: 0.3),
                              width: 0.8,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(badge.icon, size: 11, color: badge.color),
                              const SizedBox(width: 4),
                              Text(
                                badge.text,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'Anek Bangla',
                                  color: badge.color,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                // Copy Action Button
                IconButton(
                  onPressed: _copyFormula,
                  icon: Icon(
                    _copied ? LucideIcons.check : LucideIcons.copy,
                    size: 16,
                    color: _copied
                        ? const Color(0xFF059669)
                        : (isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280)),
                  ),
                  tooltip: 'সূত্র কপি করুন',
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  padding: EdgeInsets.zero,
                  splashRadius: 18,
                ),
              ],
            ),
          ),

          // 2. Elevated Math Formula Chamber (The Centerpiece)
          Container(
            width: double.infinity,
            margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF09090B) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.06)
                    : const Color(0xFFE2E8F0),
              ),
            ),
            child: FormulaMathView(
              latex: widget.formula.latex,
              isDark: isDark,
              fontSize: 19,
            ),
          ),

          const SizedBox(height: 10),

          // 3. Structured Educational Insights (Breakdown into Concept, Shortcuts, Notes)
          if (widget.formula.description.isNotEmpty)
            _FormulaInsightView(
              description: widget.formula.description,
              isDark: isDark,
            ),
        ],
      ),
    );
  }
}

class _TitleBadge {
  final String text;
  final IconData icon;
  final Color color;

  _TitleBadge({required this.text, required this.icon, required this.color});
}

/// A structured educational breakdown widget that turns a flat paragraph into:
/// - Core Definition / Explanation
/// - Type Classification & Examples (AB, AB2, etc.)
/// - Shortcuts & Exam Hacks
/// - Important Notes & CQ Tips
class _FormulaInsightView extends StatelessWidget {
  final String description;
  final bool isDark;

  const _FormulaInsightView({
    required this.description,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final sections = _parseDescription(description);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF17171C)
            : const Color(0xFFFAFAFA),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
        border: Border(
          top: BorderSide(
            color: isDark
                ? Colors.white.withValues(alpha: 0.05)
                : Colors.black.withValues(alpha: 0.04),
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Core Concept / Definition
          if (sections.concept.isNotEmpty) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 2.5, right: 8),
                  child: Icon(
                    LucideIcons.bookOpen,
                    size: 14,
                    color: isDark ? const Color(0xFF10B981) : const Color(0xFF059669),
                  ),
                ),
                Expanded(
                  child: LatexText(
                    text: sections.concept,
                    style: TextStyle(
                      fontSize: 13.5,
                      fontFamily: 'HindSiliguri',
                      height: 1.55,
                      fontWeight: FontWeight.w500,
                      color: isDark ? const Color(0xFFD1D5DB) : const Color(0xFF374151),
                    ),
                  ),
                ),
              ],
            ),
          ],

          // 2. Structured Types & Examples (e.g. AB type, AB2 type)
          if (sections.bulletPoints.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF202028)
                    : const Color(0xFFEEF2F6),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.06)
                      : Colors.black.withValues(alpha: 0.05),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        LucideIcons.layers,
                        size: 13,
                        color: isDark ? const Color(0xFF818CF8) : const Color(0xFF4F46E5),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'লবণের টাইপ ও শর্টকাট রূপ',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Anek Bangla',
                          color: isDark ? const Color(0xFF818CF8) : const Color(0xFF4F46E5),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ...sections.bulletPoints.map((bp) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 5),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            margin: const EdgeInsets.only(top: 6, right: 8),
                            width: 5,
                            height: 5,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isDark ? const Color(0xFFA5B4FC) : const Color(0xFF6366F1),
                            ),
                          ),
                          Expanded(
                            child: LatexText(
                              text: bp,
                              style: TextStyle(
                                fontSize: 13,
                                fontFamily: 'HindSiliguri',
                                height: 1.5,
                                color: isDark ? const Color(0xFFE5E7EB) : const Color(0xFF1F2937),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],

          // 3. Shortcuts / Exam Hacks Box
          if (sections.shortcuts.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withValues(alpha: isDark ? 0.12 : 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFFF59E0B).withValues(alpha: isDark ? 0.3 : 0.25),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 2, right: 8),
                    child: Icon(
                      LucideIcons.zap,
                      size: 14,
                      color: Color(0xFFF59E0B),
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'শর্টকাট ও ট্রিকস',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Anek Bangla',
                            color: Color(0xFFF59E0B),
                          ),
                        ),
                        const SizedBox(height: 2),
                        LatexText(
                          text: sections.shortcuts,
                          style: TextStyle(
                            fontSize: 13,
                            fontFamily: 'HindSiliguri',
                            height: 1.5,
                            fontWeight: FontWeight.w500,
                            color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],

          // 4. Important Notes & CQ Tips
          if (sections.notes.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF059669).withValues(alpha: isDark ? 0.12 : 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFF059669).withValues(alpha: isDark ? 0.25 : 0.2),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 2, right: 8),
                    child: Icon(
                      LucideIcons.sparkles,
                      size: 14,
                      color: Color(0xFF059669),
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'মনে রাখুন / পরীক্ষার সতর্কতা',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Anek Bangla',
                            color: Color(0xFF059669),
                          ),
                        ),
                        const SizedBox(height: 2),
                        LatexText(
                          text: sections.notes,
                          style: TextStyle(
                            fontSize: 13,
                            fontFamily: 'HindSiliguri',
                            height: 1.5,
                            color: isDark ? const Color(0xFFA7F3D0) : const Color(0xFF065F46),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  _ParsedSections _parseDescription(String raw) {
    // 1. Normalize spaces in math delimiters
    String clean = raw
        .replaceAllMapped(RegExp(r'\$\s+([^\$]+?)\s+\$'), (m) => '\$${m.group(1)!.trim()}\$')
        .replaceAllMapped(RegExp(r'\$\s+([^\$]+?)\$'), (m) => '\$${m.group(1)!.trim()}\$')
        .replaceAllMapped(RegExp(r'\$([^\$]+?)\s+\$'), (m) => '\$${m.group(1)!.trim()}\$');

    // 2. Check for type breakdown (e.g. "AB টাইপ ... AB₂ টাইপ ...")
    final List<String> bulletPoints = [];
    if (clean.contains('AB টাইপ') || clean.contains('AB₂ টাইপ') || clean.contains('টাইপ (')) {
      final typePattern = RegExp(r'(?:এবং\s+)?(A[B\d_]+(?:\s+বা\s+A[B\d_]+)?\s*টাইপ[^,।!]+(?:,\s*)?)');
      final matches = typePattern.allMatches(clean);
      if (matches.length >= 2) {
        for (final m in matches) {
          final pt = m.group(1)!.trim().replaceAll(RegExp(r'[,।!]$'), '');
          if (pt.isNotEmpty) {
            bulletPoints.add(pt);
          }
        }
        // Remove matched bullet points from running clean text
        clean = clean.replaceAll(typePattern, '');
      }
    }

    // 3. Split sentences by Bengali danda (।) or exclamation (!)
    final parts = clean.split(RegExp(r'(?<=[।!])\s*'));
    final List<String> conceptList = [];
    final List<String> shortcutList = [];
    final List<String> noteList = [];

    for (final s in parts) {
      final trimmed = s.trim();
      if (trimmed.isEmpty) continue;

      if (trimmed.contains('শর্টকাট') ||
          trimmed.contains('হ্যাক') ||
          trimmed.contains('জাদুকরী') ||
          trimmed.contains('এক লাইনে') ||
          trimmed.contains('কয়েক সেকেন্ড') ||
          trimmed.contains('সরাসরি বের') ||
          trimmed.contains('সহজেই বের')) {
        shortcutList.add(trimmed);
      } else if (trimmed.contains('মনে রাখবেন') ||
          trimmed.contains('মনে রাখুন') ||
          trimmed.contains('মনে রাখা') ||
          trimmed.contains('সতর্কতা') ||
          trimmed.contains('ভুল হয়') ||
          trimmed.contains('বাধ্যতামূলক') ||
          trimmed.contains('মাস্ট') ||
          trimmed.contains('Must Known') ||
          trimmed.contains('গ্যারান্টিড') ||
          trimmed.contains('হট টপিক') ||
          trimmed.contains('বোর্ড পরীক্ষার')) {
        noteList.add(trimmed);
      } else {
        conceptList.add(trimmed);
      }
    }

    // Fallback: If everything went to shortcuts or notes and concept is empty
    String finalConcept = conceptList.join(' ');
    if (finalConcept.isEmpty && shortcutList.isNotEmpty && noteList.isNotEmpty) {
      finalConcept = shortcutList.removeAt(0);
    }

    return _ParsedSections(
      concept: finalConcept,
      bulletPoints: bulletPoints,
      shortcuts: shortcutList.join(' '),
      notes: noteList.join(' '),
    );
  }
}

class _ParsedSections {
  final String concept;
  final List<String> bulletPoints;
  final String shortcuts;
  final String notes;

  _ParsedSections({
    required this.concept,
    required this.bulletPoints,
    required this.shortcuts,
    required this.notes,
  });
}
