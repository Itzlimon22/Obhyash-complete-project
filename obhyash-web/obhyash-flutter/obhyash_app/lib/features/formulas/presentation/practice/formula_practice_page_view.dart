import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../models/formula_models.dart';
import '../../utils/formula_practice_generator.dart';
import '../../../../core/presentation/widgets/formula_math_view.dart';
import '../../../../core/presentation/widgets/latex_text.dart';

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

class FormulaPracticePageView extends StatefulWidget {
  final FormulaEntry formula;
  final String? chapterName;
  final String? serialNumber;
  final int paletteIndex;

  const FormulaPracticePageView({
    super.key,
    required this.formula,
    this.chapterName,
    this.serialNumber,
    this.paletteIndex = 0,
  });

  @override
  State<FormulaPracticePageView> createState() => _FormulaPracticePageViewState();
}

class _FormulaPracticePageViewState extends State<FormulaPracticePageView> {
  // Track revealed answers per question index
  final Set<int> _revealedIndices = {};

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

  String _toBengaliNumber(int number) {
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    String result = number.toString();
    for (int i = 0; i < 10; i++) {
      result = result.replaceAll(englishDigits[i], bengaliDigits[i]);
    }
    return result;
  }

  /// Formats the raw answer string into a clean, textbook-styled layout
  /// with proper spacing, line breaks, and step-by-step mathematical flow.
  String _formatTextbookAnswer(String raw) {
    var clean = raw.trim();
    // Strip leading "Ans:" or "উত্তর:"
    clean = clean.replaceFirst(RegExp(r'^(Ans|উত্তর)\s*[:ঃ]?\s*', caseSensitive: false), '').trim();

    // If already formatted with paragraphs/line-breaks, return clean
    if (clean.contains('\n\n')) {
      return clean;
    }

    // Check if the entire answer is enclosed in outer $ ... $
    final isEnclosed = clean.startsWith(r'$') &&
        clean.endsWith(r'$') &&
        clean.indexOf(r'$', 1) == clean.length - 1;
    if (isEnclosed) {
      clean = clean.substring(1, clean.length - 1).trim();
    }

    // If steps are joined via \implies or \quad, format each on a new line
    if (clean.contains(r'\implies') || clean.contains(r'\quad')) {
      Pattern delimiterPattern;
      if (clean.contains(r'\implies')) {
        delimiterPattern = RegExp(r'(?:(?:\$\s*)?\\implies\s*)');
      } else {
        delimiterPattern = RegExp(r'(?:,\s*)?\\quad\s*');
      }

      final rawParts = clean.split(delimiterPattern);
      final formatted = rawParts.map((p) => p.trim()).where((p) => p.isNotEmpty).toList();
      if (formatted.length > 1) {
        final List<String> result = [];
        for (int idx = 0; idx < formatted.length; idx++) {
          var p = formatted[idx];
          final dollarMatches = RegExp(r'\$').allMatches(p).length;
          if (p.endsWith(r'$') && dollarMatches % 2 == 1) {
            p = p.substring(0, p.length - 1).trim();
          }
          if (p.startsWith(r'$') && dollarMatches % 2 == 1) {
            p = p.substring(1).trim();
          }

          final updatedDollarMatches = RegExp(r'\$').allMatches(p).length;
          final bool isPureMath =
              updatedDollarMatches == 0 && !RegExp(r'[\u0980-\u09FF]').hasMatch(p);

          if (isPureMath) {
            if (idx == 0) {
              result.add('\$$p\$');
            } else if (clean.contains(r'\implies')) {
              result.add(r'$\implies ' + p + r'$');
            } else {
              result.add('\$$p\$');
            }
          } else {
            if (idx > 0 &&
                clean.contains(r'\implies') &&
                !p.startsWith('বা,') &&
                !p.startsWith('সুতরাং,') &&
                !p.startsWith(r'$\implies')) {
              result.add('বা, $p');
            } else {
              result.add(p);
            }
          }
        }
        return result.join('\n\n');
      }
    }

    return clean;
  }

  /// Builds the exact equation card matching the previous list screen
  Widget _buildTopEquationCard(bool isDark) {
    final displayTitle = _cleanTitle(widget.formula.title);
    final description = widget.formula.description.trim();
    final theme = _palettes[widget.paletteIndex % _palettes.length];

    final cardBg = isDark ? theme.darkBg : theme.lightBg;
    final cardBorder = isDark ? theme.darkBorder : theme.lightBorder;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
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
          // 1. Heading: Serial + Title (Exact textbook style)
          Text(
            widget.serialNumber != null && widget.serialNumber!.isNotEmpty
                ? '${widget.serialNumber}. $displayTitle'
                : displayTitle,
            style: TextStyle(
              fontSize: 16.5,
              fontWeight: FontWeight.w700,
              height: 1.35,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 16),

          // 2. Math Formula (Centered with generous vertical padding)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Center(
              child: FormulaMathView(
                latex: widget.formula.latex,
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

  /// Builds a serial-wise question card with collapsable textbook answer
  Widget _buildQuestionCard({
    required FormulaPracticeQuestion q,
    required int index,
    required bool isDark,
  }) {
    final isRevealed = _revealedIndices.contains(index);
    final bengaliIndex = _toBengaliNumber(index + 1);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141820) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF242A38) : const Color(0xFFE2E8F0),
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
          // Question Serial Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E2430) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isDark ? const Color(0xFF333D50) : const Color(0xFFCBD5E1),
                width: 0.8,
              ),
            ),
            child: Text(
              'প্রশ্ন $bengaliIndex',
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Problem Statement
          LatexText(
            text: q.question,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              height: 1.6,
              color: isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 14),

          // Collapsable Answer Button
          InkWell(
            onTap: () {
              HapticFeedback.lightImpact();
              setState(() {
                if (isRevealed) {
                  _revealedIndices.remove(index);
                } else {
                  _revealedIndices.add(index);
                }
              });
            },
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isRevealed
                    ? (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9))
                    : const Color(0xFF059669).withValues(alpha: isDark ? 0.12 : 0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isRevealed
                      ? (isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1))
                      : const Color(0xFF059669).withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isRevealed ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                    size: 16,
                    color: isRevealed
                        ? (isDark ? Colors.white70 : const Color(0xFF475569))
                        : const Color(0xFF059669),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    isRevealed ? 'উত্তর লুকান' : 'উত্তর দেখুন',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: isRevealed
                          ? (isDark ? Colors.white70 : const Color(0xFF475569))
                          : const Color(0xFF059669),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Revealed Answer: Textbook style with proper spacing & line breaks
          if (isRevealed) ...[
            const SizedBox(height: 14),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeInOut,
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0D1E16) : const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? const Color(0xFF134E3A) : const Color(0xFFBBF7D0),
                  width: 1.0,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        LucideIcons.checkCircle2,
                        size: 15,
                        color: Color(0xFF059669),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'সমাধান / উত্তর:',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.bold,
                          color: isDark ? const Color(0xFF34D399) : const Color(0xFF047857),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  LatexText(
                    text: _formatTextbookAnswer(q.answer),
                    style: TextStyle(
                      fontSize: 14.5,
                      height: 1.75,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
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

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final questions = FormulaPracticeGenerator.resolvePracticeQuestions(widget.formula);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFFAFAF9),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFFAFAF9),
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: isDark ? Colors.white : const Color(0xFF18181B),
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          _cleanTitle(widget.formula.title),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: isDark ? Colors.white : const Color(0xFF18181B),
          ),
        ),
        centerTitle: false,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(8, 12, 8, 36),
        children: [
          // 1. Exact Equation Card at Top
          _buildTopEquationCard(isDark),

          // 2. Serial Wise Question Cards
          if (questions.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Text(
                  'এই সূত্রের জন্য কোনো অনুশীলন প্রশ্ন পাওয়া যায়নি।',
                  style: TextStyle(
                    fontSize: 15,
                    color: isDark ? Colors.white60 : Colors.black54,
                  ),
                ),
              ),
            )
          else
            ...List.generate(questions.length, (index) {
              return _buildQuestionCard(
                q: questions[index],
                index: index,
                isDark: isDark,
              );
            }),
        ],
      ),
    );
  }
}
