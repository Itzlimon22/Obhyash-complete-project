import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:open_filex/open_filex.dart';
import 'package:bangla_pdf/bangla_pdf.dart' as bn;
import '../../../core/services/download_notification_service.dart';
import '../../../core/utils/app_popups.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../domain/exam_models.dart';

class PdfDownloadService {
  static String _toBanglaDigits(dynamic number) {
    return BanglaNameHelper.toBanglaNumeral(number);
  }

  static String _toSuperscript(String s) {
    const normal = '0123456789+-=()nNtTyYxX';
    const superChars = '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᴺᵗᵀʸʸˣˣ';
    var res = '';
    for (int i = 0; i < s.length; i++) {
      final idx = normal.indexOf(s[i]);
      if (idx != -1) {
        res += superChars[idx];
      } else if (s[i] == '-') {
        res += '⁻';
      } else {
        res += s[i];
      }
    }
    return res;
  }

  static String _toSubscript(String s) {
    const normal = '0123456789+-=()aehijklmnoprstuvx';
    const subChars = '₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ';
    var res = '';
    for (int i = 0; i < s.length; i++) {
      final idx = normal.indexOf(s[i]);
      if (idx != -1) {
        res += subChars[idx];
      } else {
        res += s[i];
      }
    }
    return res;
  }

  /// Strips institute and exam citations (e.g. [MGCC 2024, BUET 2012], [BUET 24], [বুয়েট ২২-২৩])
  /// to keep question papers clean, authoritative, and uncluttered.
  static String _stripInstituteTags(String text) {
    if (text.isEmpty) return '';
    var s = text.replaceAll(
      RegExp(
        r'\s*\[[^\]]*(?:\d{2,4}|[০-৯]{2,4}|BUET|CUET|RUET|KUET|DU|RU|CU|JU|SUST|BUTEX|CKRUET|MIST|BUP|DRMC|NDCD|BMARPC|MGCC|MCC|AHC|SB|BB|JB|CB|MB|DinB|ComB|MAT|AGRI|HSTU|BOARD|বোর্ড|বুয়েট|ঢাবি|রাবি|চবি|জাবি|মেডিকেল)[^\]]*\]',
        caseSensitive: false,
      ),
      '',
    );
    s = s.replaceAllMapped(RegExp(r'\s+([\?？:!])'), (m) => m.group(1)!);
    return s.trim();
  }

  /// Converts LaTeX, math formulas, units, and markdown into clean, professional Unicode for PDF printing.
  static String formatMathForPdf(String raw) => _formatMathForPdf(raw);

  static String _formatMathForPdf(String raw) {
    if (raw.trim().isEmpty) return '';

    var t = _stripInstituteTags(raw);

    // 0. Normalize newlines & HTML breaks (NEVER use raw string r'\r' which strips \r from LaTeX like \rightarrow)
    t = t
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll('&nbsp;', ' ')
        .replaceAll('\r\n', '\n')
        .replaceAll('\r', '\n');

    // 0.1 Clean KaTeX chemistry wrappers \ce{...}, \pu{...} early
    t = t.replaceAllMapped(
      RegExp(r'\\(?:ce|pu)\{([^{}]*)\}'),
      (m) => m.group(1)!,
    );

    // 0.2 Chemistry reaction arrows with conditions: \xrightarrow[below]{above} -> ──[above]──>
    t = t.replaceAllMapped(
      RegExp(r'\\xrightarrow(?:\[([^\]]*)\])?\{((?:[^{}]*|\{[^{}]*\})*)\}'),
      (m) {
        final below = m.group(1)?.trim();
        final above = m.group(2)?.trim();
        final labelParts = <String>[];
        if (above != null && above.isNotEmpty) labelParts.add(_formatMathForPdf(above));
        if (below != null && below.isNotEmpty) labelParts.add(_formatMathForPdf(below));
        if (labelParts.isNotEmpty) {
          return ' ──(${labelParts.join(', ')})──> ';
        }
        return ' ──> ';
      },
    );

    // 0.3 Degrees Celsius & temperatures
    t = t
        .replaceAll(RegExp(r'\^\{?\\circ\}?\\s*(?:\\text\{C\}|C)'), '°C')
        .replaceAll(RegExp(r'\^\{?\\circ\}?\\s*(?:\\text\{F\}|F)'), '°F')
        .replaceAll(RegExp(r'\^\{?\\circ\}?\\s*(?:\\text\{K\}|K)'), ' K')
        .replaceAll(RegExp(r'\^\{?\\circ\}?'), '°')
        .replaceAll(r'\degree', '°');

    // 1. Matrices: \begin{matrix} a & b \\ c & d \end{matrix} -> [ a  b ; c  d ]
    t = t.replaceAllMapped(
      RegExp(r'\\begin\{(?:matrix|bmatrix|pmatrix|vmatrix|Vmatrix)\}([\s\S]*?)\\end\{(?:matrix|bmatrix|pmatrix|vmatrix|Vmatrix)\}'),
      (m) {
        final inner = m.group(1) ?? '';
        final rows = inner.split(RegExp(r'\\\\|\n')).map((r) => r.trim()).where((r) => r.isNotEmpty).toList();
        final formattedRows = rows.map((r) {
          final cells = r.split('&').map((c) => _formatMathForPdf(c.trim())).join('   ');
          return cells;
        }).join('  ;  ');
        return '[ $formattedRows ]';
      },
    );

    // 2. Inverse trigonometric functions: \tan^{-1} -> tan⁻¹
    t = t.replaceAllMapped(
      RegExp(r'\\?(tan|sin|cos|cot|sec|csc)\^\{?-1\}?', caseSensitive: false),
      (m) => '${m.group(1)}⁻¹',
    );

    // 3. Greek letters & mathematical constants
    final greekMap = {
      r'\alpha': 'α',
      r'\beta': 'β',
      r'\gamma': 'γ',
      r'\Gamma': 'Γ',
      r'\delta': 'δ',
      r'\Delta': 'Δ',
      r'\epsilon': 'ε',
      r'\varepsilon': 'ε',
      r'\zeta': 'ζ',
      r'\eta': 'η',
      r'\theta': 'θ',
      r'\Theta': 'Θ',
      r'\iota': 'ι',
      r'\kappa': 'κ',
      r'\lambda': 'λ',
      r'\Lambda': 'Λ',
      r'\mu': 'µ',
      r'\nu': 'ν',
      r'\xi': 'ξ',
      r'\pi': 'π',
      r'\Pi': 'Π',
      r'\rho': 'ρ',
      r'\sigma': 'σ',
      r'\Sigma': 'Σ',
      r'\tau': 'τ',
      r'\upsilon': 'υ',
      r'\phi': 'φ',
      r'\Phi': 'Φ',
      r'\varphi': 'φ',
      r'\chi': 'χ',
      r'\psi': 'ψ',
      r'\Psi': 'Ψ',
      r'\omega': 'ω',
      r'\Omega': 'Ω',
    };

    greekMap.forEach((k, v) {
      t = t.replaceAll(k, v);
      final bare = k.replaceFirst(r'\', '');
      t = t.replaceAll(RegExp('\\b$bare\\b'), v);
    });

    // 4. Mathematical operators & relations
    final opMap = {
      r'\times': '×',
      r'\div': '÷',
      r'\pm': '±',
      r'\mp': '∓',
      r'\cdot': '·',
      r'\bullet': '•',
      r'\circ': '°',
      r'\degree': '°',
      r'\infty': '∞',
      r'\approx': '≈',
      r'\ne': '≠',
      r'\neq': '≠',
      r'\equiv': '≡',
      r'\le': '≤',
      r'\leq': '≤',
      r'\ge': '≥',
      r'\geq': '≥',
      r'\ll': '≪',
      r'\gg': '≫',
      r'\propto': '∝',
      r'\subset': '⊂',
      r'\supset': '⊃',
      r'\subseteq': '⊆',
      r'\supseteq': '⊇',
      r'\in': '∈',
      r'\notin': '∉',
      r'\cup': '∪',
      r'\cap': '∩',
      r'\forall': '∀',
      r'\exists': '∃',
      r'\nabla': '∇',
      r'\partial': '∂',
      r'\int': '∫',
      r'\sum': '∑',
      r'\prod': '∏',
      r'\angle': '∠',
      r'\perp': '⊥',
      r'\parallel': '∥',
      r'\rightarrow': '→',
      r'\to': '→',
      r'\longrightarrow': '→',
      r'\leftarrow': '←',
      r'\longleftarrow': '←',
      r'\leftrightarrow': '↔',
      r'\Rightarrow': '⇒',
      r'\implies': '⇒',
      r'\Leftarrow': '⇐',
      r'\Leftrightarrow': '⇔',
      r'\iff': '⇔',
      r'\rightleftharpoons': '⇌',
      r'\leftrightharpoons': '⇌',
      '@@CHEM_ARROW': '→',
    };

    opMap.forEach((k, v) {
      t = t.replaceAll(k, v);
    });

    // 5. Fractions: \frac{a}{b} -> (a / b)
    t = t.replaceAllMapped(
      RegExp(r'\\frac\{([^{}]*)\}\{([^{}]*)\}'),
      (m) => '(${m.group(1)} / ${m.group(2)})',
    );

    // 6. Square root: \sqrt{a} -> √a, \sqrt[n]{a} -> ⁿ√a
    t = t.replaceAllMapped(
      RegExp(r'\\sqrt\[([^\]]*)\]\{([^{}]*)\}'),
      (m) => '${_toSuperscript(m.group(1)!)}√(${m.group(2)})',
    );
    t = t.replaceAllMapped(
      RegExp(r'\\sqrt\{([^{}]*)\}'),
      (m) {
        final inner = m.group(1)!.trim();
        if (inner.contains('+') || inner.contains('-') || inner.contains(' ') || inner.contains('/')) {
          return '√($inner)';
        }
        return '√$inner';
      },
    );

    // 7. Unit vectors & vector arrows: \hat{i} -> î, \vec{A} -> A⃗, \vec{AB} -> AB⃗
    t = t
        .replaceAll(r'\hat{i}', 'î')
        .replaceAll(r'\hat{j}', 'ĵ')
        .replaceAll(r'\hat{k}', 'k̂')
        .replaceAll(r'\hat i', 'î')
        .replaceAll(r'\hat j', 'ĵ')
        .replaceAll(r'\hat k', 'k̂');

    t = t.replaceAllMapped(
      RegExp(r'\\(?:vec|overrightarrow)\{?([a-zA-Z0-9]+)\}?'),
      (m) => '${m.group(1)}⃗',
    );
    t = t.replaceAllMapped(
      RegExp(r'\\(?:bar|overline)\{?([a-zA-Z0-9]+)\}?'),
      (m) => '${m.group(1)}̄',
    );

    // 8. Clean \text{...}, \mathrm{...}, \mathbf{...} before exponents so units like \text{ms}^{-1} become ms⁻¹
    t = t.replaceAllMapped(
      RegExp(r'\\(?:text|mathrm|mathbf|mathit|textnormal)\{([^{}]*)\}'),
      (m) => m.group(1)!,
    );

    // 9. Superscripts & powers: x^{2} -> x², 10^{-5} -> 10⁻⁵, ms^-1 -> ms⁻¹
    t = t.replaceAllMapped(
      RegExp(r'\^\{?([0-9\+\-nNxXtyT]+)\}?'),
      (m) => _toSuperscript(m.group(1)!),
    );

    // 10. Subscripts: z_{1} -> z₁, H_2O -> H₂O, CuSO_4 -> CuSO₄
    t = t.replaceAllMapped(
      RegExp(r'\_\{?([0-9\+\-a-zA-Z]+)\}?'),
      (m) => _toSubscript(m.group(1)!),
    );

    // 11. Clean \left, \right delimiters
    t = t
        .replaceAll(r'\left(', '(')
        .replaceAll(r'\right)', ')')
        .replaceAll(r'\left[', '[')
        .replaceAll(r'\right]', ']')
        .replaceAll(r'\left\{', '{')
        .replaceAll(r'\right\}', '}')
        .replaceAll(r'\left|', '|')
        .replaceAll(r'\right|', '|')
        .replaceAll(r'\left.', '')
        .replaceAll(r'\right.', '')
        .replaceAll(r'\left', '')
        .replaceAll(r'\right', '');

    // 12. Clean spacing commands: \quad, \qquad, \;, \,, \!
    t = t.replaceAll(RegExp(r'\\(?:quad|qquad|[,;!])'), ' ');

    // 13. Clean environments \begin{aligned}, etc.
    t = t.replaceAll(RegExp(r'\\(?:begin|end)\{(?:aligned|align\*?|array|gather\*?|split)\}'), '');

    // 14. Clean remaining dollar signs, backticks, asterisks, backslashes
    t = t
        .replaceAll(RegExp(r'\$\$|\$'), '')
        .replaceAll(RegExp(r'\*\*'), '')
        .replaceAll(RegExp(r'`'), '')
        .replaceAll(RegExp(r'\\'), '');

    // Prevent orphan punctuation by removing spaces before punctuation
    t = t.replaceAll(RegExp(r'\s+([?!।,;:])'), r'$1');

    // Prevent split units like "5 ms ⁻¹" -> "5 ms⁻¹"
    t = t.replaceAll(RegExp(r'([A-Za-z0-9])\s+([⁻¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁰]+)'), r'$1$2');

    // Ensure clean spacing between English/math tokens and Bengali text
    t = t.replaceAllMapped(
      RegExp(r'([A-Za-z0-9⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹̂⃗°]+)([\u0980-\u09FF])'),
      (m) => '${m.group(1)} ${m.group(2)}',
    );
    t = t.replaceAllMapped(
      RegExp(r'([\u0980-\u09FF])([A-Za-z0-9⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹̂⃗])'),
      (m) => '${m.group(1)} ${m.group(2)}',
    );

    // Normalize multiple spaces
    t = t.replaceAll(RegExp(r'[ \t]+'), ' ').trim();

    return t;
  }

  /// Builds an adaptive options layout matching authentic competitive examination papers.
  /// Short options (numbers, short formulas) are placed 4-inline;
  /// medium options are arranged in a neat 2x2 grid;
  /// and long descriptive options are stacked vertically (1 per line).
  static pw.Widget _buildOptionsWidget(List<String> rawOptions) {
    if (rawOptions.isEmpty) return pw.SizedBox();

    const optionLetters = ['(ক)', '(খ)', '(গ)', '(ঘ)'];
    final formattedOptions = rawOptions.map((o) => _formatMathForPdf(o)).toList();

    final maxLen = formattedOptions.fold<int>(0, (max, o) => o.length > max ? o.length : max);

    // 1. Very short options (<= 12 chars each): 4 in one row
    if (formattedOptions.length == 4 && maxLen <= 12) {
      return pw.Padding(
        padding: const pw.EdgeInsets.only(left: 12),
        child: pw.Row(
          children: List.generate(4, (i) {
            return pw.Expanded(
              child: bn.AutoText(
                '${optionLetters[i]} ${formattedOptions[i]}',
                fontSize: 7.6,
                color: PdfColor.fromHex('1E293B'),
              ),
            );
          }),
        ),
      );
    }

    // 2. Long options (> 26 chars): Stacked vertically (1 per line)
    if (maxLen > 26) {
      return pw.Padding(
        padding: const pw.EdgeInsets.only(left: 12),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: List.generate(formattedOptions.length, (i) {
            return pw.Padding(
              padding: const pw.EdgeInsets.only(bottom: 1.5),
              child: bn.AutoText(
                '${optionLetters[i]} ${formattedOptions[i]}',
                fontSize: 7.6,
                color: PdfColor.fromHex('1E293B'),
              ),
            );
          }),
        ),
      );
    }

    // 3. Standard medium options: 2x2 Grid
    return pw.Padding(
      padding: const pw.EdgeInsets.only(left: 12),
      child: pw.Column(
        children: [
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              if (formattedOptions.isNotEmpty)
                pw.Expanded(
                  child: bn.AutoText(
                    '${optionLetters[0]} ${formattedOptions[0]}',
                    fontSize: 7.6,
                    color: PdfColor.fromHex('1E293B'),
                  ),
                ),
              if (formattedOptions.length > 1)
                pw.Expanded(
                  child: bn.AutoText(
                    '${optionLetters[1]} ${formattedOptions[1]}',
                    fontSize: 7.6,
                    color: PdfColor.fromHex('1E293B'),
                  ),
                ),
            ],
          ),
          if (formattedOptions.length > 2) ...[
            pw.SizedBox(height: 1.5),
            pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Expanded(
                  child: bn.AutoText(
                    '${optionLetters[2]} ${formattedOptions[2]}',
                    fontSize: 7.6,
                    color: PdfColor.fromHex('1E293B'),
                  ),
                ),
                if (formattedOptions.length > 3)
                  pw.Expanded(
                    child: bn.AutoText(
                      '${optionLetters[3]} ${formattedOptions[3]}',
                      fontSize: 7.6,
                      color: PdfColor.fromHex('1E293B'),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }


  /// Estimates the vertical point height of a question item in the 2-column question paper.
  /// Used for optimal, gap-free page packing.
  static double _estimateQuestionPaperItemHeight(Question q, bool hasHeader) {
    final stem = _formatMathForPdf(q.question);
    final lines = stem.split('\n');
    int totalStemLines = 0;
    for (final line in lines) {
      totalStemLines += (line.trim().length / 42).ceil().clamp(1, 10);
    }
    final stemHeight = totalStemLines * 12.0;

    final formattedOpts = q.options.map((o) => _formatMathForPdf(o)).toList();
    final maxLen = formattedOpts.fold<int>(0, (max, o) => o.length > max ? o.length : max);
    double optHeight = 22.0;
    if (formattedOpts.length == 4 && maxLen <= 12) {
      optHeight = 11.0;
    } else if (maxLen > 26) {
      optHeight = formattedOpts.length * 11.5;
    }

    double total = stemHeight + 2.5 + optHeight + 7.5;
    if (hasHeader) total += 24.0;
    return total;
  }

  /// Estimates the vertical point height of a question item in the 2-column solutions paper.
  static double _estimateSolutionItemHeight(Question q, bool hasHeader) {
    final stem = _formatMathForPdf(q.question);
    final lines = stem.split('\n');
    int totalStemLines = 0;
    for (final line in lines) {
      totalStemLines += (line.trim().length / 40).ceil().clamp(1, 10);
    }
    final stemHeight = totalStemLines * 12.0;

    final formattedOpts = q.options.map((o) => _formatMathForPdf(o)).toList();
    final maxLen = formattedOpts.fold<int>(0, (max, o) => o.length > max ? o.length : max);
    double optHeight = 22.0;
    if (formattedOpts.length == 4 && maxLen <= 12) {
      optHeight = 11.0;
    } else if (maxLen > 26) {
      optHeight = formattedOpts.length * 11.5;
    }

    double expHeight = 26.0;
    final exp = q.explanation?.trim() ?? '';
    if (exp.isNotEmpty) {
      final expLines = (exp.length / 42).ceil().clamp(1, 15);
      expHeight += expLines * 10.5 + 4.0;
    }

    double total = stemHeight + 2.0 + optHeight + 3.0 + expHeight + 9.0;
    if (hasHeader) total += 24.0;
    return total;
  }

  /// Creates a faint repeating background watermark across the page.
  /// Uses the app name "OBHYASH" arranged in rotated rows to give an authentic,
  /// anti-piracy examination paper appearance while remaining completely subtle
  /// so it never interferes with reading question stems and options.
  static pw.Widget _buildPageWatermark() {
    return pw.Positioned.fill(
      child: pw.Transform.rotate(
        angle: -26 * math.pi / 180,
        alignment: pw.Alignment.center,
        child: pw.Column(
          mainAxisAlignment: pw.MainAxisAlignment.spaceEvenly,
          children: List.generate(6, (rowIndex) {
            final isEven = rowIndex % 2 == 0;
            return pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceEvenly,
              children: [
                if (isEven) pw.SizedBox(width: 40),
                pw.Text(
                  'OBHYASH',
                  style: pw.TextStyle(
                    fontSize: 24,
                    fontWeight: pw.FontWeight.bold,
                    color: const PdfColor(0.88, 0.91, 0.95, 0.12),
                    letterSpacing: 5,
                  ),
                ),
                pw.SizedBox(width: 50),
                pw.Text(
                  'OBHYASH',
                  style: pw.TextStyle(
                    fontSize: 24,
                    fontWeight: pw.FontWeight.bold,
                    color: const PdfColor(0.88, 0.91, 0.95, 0.12),
                    letterSpacing: 5,
                  ),
                ),
                if (!isEven) pw.SizedBox(width: 40),
              ],
            );
          }),
        ),
      ),
    );
  }

  /// Directly generates and downloads the Question Paper as a standard 2-Column Print-Ready PDF
  static Future<void> downloadQuestionPaper(
    ExamResult result,
    BuildContext context,
  ) async {
    final examTitle = BanglaNameHelper.deduplicateExamTitle(
      result.subjectLabel?.isNotEmpty == true
          ? result.subjectLabel!
          : BanglaNameHelper.formatSubject(result.subject),
    );
    final filename = '${examTitle}_Question_Paper_${DateTime.now().millisecondsSinceEpoch}';

    try {
      bn.BanglaPdf.configure(shapingMode: bn.BanglaShapingMode.legacy);

      pw.Font? roboto;
      pw.Font? robotoBold;
      pw.Font? notoSans;
      pw.Font? mathFont;
      pw.Font? symbolFont;

      try {
        roboto = await PdfGoogleFonts.robotoRegular();
        robotoBold = await PdfGoogleFonts.robotoBold();
        notoSans = await PdfGoogleFonts.notoSansRegular();
        mathFont = await PdfGoogleFonts.notoSansMathRegular();
        symbolFont = await PdfGoogleFonts.notoSansSymbolsRegular();
      } catch (fontErr) {
        debugPrint('[PdfDownloadService] Font loading fallback: $fontErr');
      }

      final fontFallbacks = <pw.Font>[
        ?notoSans,
        ?mathFont,
        ?symbolFont,
        ?roboto,
        ?robotoBold,
      ];

      final theme = (roboto != null && robotoBold != null)
          ? pw.ThemeData.withFont(
              base: roboto,
              bold: robotoBold,
              fontFallback: fontFallbacks,
            )
          : pw.ThemeData.base();

      final pdf = pw.Document(theme: theme);

      final sortedQuestions = List<Question>.from(result.questions);
      final totalQ = sortedQuestions.length;
      final durationMins = result.timeTaken > 0
          ? (result.timeTaken / 60).ceil()
          : totalQ;

      // Calculate distinct main subjects for multi-subject section dividers
      final distinctMainSubjects = sortedQuestions
          .map((q) => BanglaNameHelper.getMainSubjectName(q.subject, q.subjectLabel))
          .toSet();
      final hasMultipleSubjects = distinctMainSubjects.length > 1;

      // Canonically sort questions by subject priority (Physics -> Chemistry -> Math -> Biology -> etc.)
      if (hasMultipleSubjects) {
        sortedQuestions.sort((a, b) {
          final subA = BanglaNameHelper.getMainSubjectName(a.subject, a.subjectLabel);
          final subB = BanglaNameHelper.getMainSubjectName(b.subject, b.subjectLabel);
          final pA = BanglaNameHelper.getSubjectSortPriority(subA, a.subject);
          final pB = BanglaNameHelper.getSubjectSortPriority(subB, b.subject);
          if (pA != pB) return pA.compareTo(pB);
          return 0;
        });
      }

      // Precompute subject header positions deterministically
      final subjectHeaderMap = <int, String>{};
      String prevSubject = '';
      for (int i = 0; i < sortedQuestions.length; i++) {
        final q = sortedQuestions[i];
        final curSub = BanglaNameHelper.getMainSubjectName(q.subject, q.subjectLabel);
        if (hasMultipleSubjects && curSub != prevSubject) {
          subjectHeaderMap[i] = curSub;
          prevSubject = curSub;
        }
      }

      // Dynamically chunk questions per page to pack each page from top to bottom
      // Page 1 masthead leaves ~640pt column height; Page 2+ leaves ~715pt column height
      final List<List<int>> pages = [];
      int currentIdx = 0;

      while (currentIdx < totalQ) {
        final isFirstPage = pages.isEmpty;
        final maxColHeight = isFirstPage ? 640.0 : 715.0;
        final maxQuestionsPerPage = isFirstPage ? 26 : 30;

        int bestCount = 1;
        final remaining = totalQ - currentIdx;
        final limit = remaining < maxQuestionsPerPage ? remaining : maxQuestionsPerPage;

        for (int candidateCount = 1; candidateCount <= limit; candidateCount++) {
          final half = (candidateCount / 2).ceil();

          double leftH = 0;
          for (int i = 0; i < half; i++) {
            final qIdx = currentIdx + i;
            leftH += _estimateQuestionPaperItemHeight(
              sortedQuestions[qIdx],
              subjectHeaderMap.containsKey(qIdx),
            );
          }

          double rightH = 0;
          for (int i = half; i < candidateCount; i++) {
            final qIdx = currentIdx + i;
            rightH += _estimateQuestionPaperItemHeight(
              sortedQuestions[qIdx],
              subjectHeaderMap.containsKey(qIdx),
            );
          }

          if (leftH <= maxColHeight && rightH <= maxColHeight) {
            bestCount = candidateCount;
          } else {
            break;
          }
        }

        pages.add(List.generate(bestCount, (i) => currentIdx + i));
        currentIdx += bestCount;
      }

      for (int pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        final pageIndices = pages[pageIdx];
        final isFirstPage = pageIdx == 0;

        // Split this page's questions into Left Column & Right Column serially
        final halfCount = (pageIndices.length / 2).ceil();
        final leftIndices = pageIndices.sublist(0, halfCount);
        final rightIndices = pageIndices.sublist(halfCount);

        pdf.addPage(
          pw.Page(
            pageTheme: pw.PageTheme(
              pageFormat: PdfPageFormat.a4,
              margin: const pw.EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              theme: theme,
              buildBackground: (ctx) => _buildPageWatermark(),
            ),
            build: (pw.Context ctx) {
              pw.Widget buildQuestionItem(int qIdx) {
                final q = sortedQuestions[qIdx];
                final showSubjectHeader = subjectHeaderMap.containsKey(qIdx);
                final currentSub = subjectHeaderMap[qIdx] ?? '';
                final number = qIdx + 1;
                final formattedStem = _formatMathForPdf(q.question);

                return pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 7.5),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      if (showSubjectHeader) ...[
                        pw.Container(
                          margin: const pw.EdgeInsets.only(top: 4, bottom: 6),
                          alignment: pw.Alignment.center,
                          child: pw.Row(
                            mainAxisAlignment: pw.MainAxisAlignment.center,
                            children: [
                              pw.Expanded(child: pw.Divider(color: PdfColor.fromHex('CBD5E1'), thickness: 0.5)),
                              pw.Padding(
                                padding: const pw.EdgeInsets.symmetric(horizontal: 8),
                                child: bn.AutoText(
                                  '— $currentSub —',
                                  fontSize: 9,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('334155'),
                                ),
                              ),
                              pw.Expanded(child: pw.Divider(color: PdfColor.fromHex('CBD5E1'), thickness: 0.5)),
                            ],
                          ),
                        ),
                      ],
                      // Question Stem
                      pw.Row(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          bn.AutoText(
                            '${_toBanglaDigits(number)}. ',
                            fontSize: 8.4,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('0F172A'),
                          ),
                          pw.Expanded(
                            child: bn.AutoText(
                              formattedStem,
                              fontSize: 8.4,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('0F172A'),
                              style: const pw.TextStyle(lineSpacing: 1.35),
                            ),
                          ),
                        ],
                      ),
                      pw.SizedBox(height: 2.5),
                      // Options
                      _buildOptionsWidget(q.options),
                    ],
                  ),
                );
              }

              // Build Left Column Items
              final leftWidgets = <pw.Widget>[];
              for (final idx in leftIndices) {
                leftWidgets.add(buildQuestionItem(idx));
              }

              // Build Right Column Items
              final rightWidgets = <pw.Widget>[];
              for (final idx in rightIndices) {
                rightWidgets.add(buildQuestionItem(idx));
              }

              return pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                children: [
                  if (isFirstPage) ...[
                    // Clean Official Masthead
                    pw.Container(
                      alignment: pw.Alignment.center,
                      child: pw.Column(
                        children: [
                          bn.AutoText(
                            'অভ্যাস — $examTitle',
                            fontSize: 14.5,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('0F172A'),
                          ),
                          pw.SizedBox(height: 2),
                          bn.AutoText(
                            'উচ্চ মাধ্যমিক ও ভর্তি পরীক্ষা প্রস্তুতি · obhyash.com',
                            fontSize: 7.5,
                            color: PdfColor.fromHex('475569'),
                          ),
                          pw.SizedBox(height: 5),
                          // Metadata Bar (Clean, rounded container)
                          pw.Container(
                            padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 4.5),
                            decoration: pw.BoxDecoration(
                              color: PdfColor.fromHex('F8FAFC'),
                              border: pw.Border.all(color: PdfColor.fromHex('CBD5E1'), width: 0.7),
                              borderRadius: pw.BorderRadius.circular(4),
                            ),
                            child: pw.Row(
                              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                              children: [
                                bn.AutoText(
                                  'সময়: ${_toBanglaDigits(durationMins)} মিনিট',
                                  fontSize: 8,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('1E293B'),
                                ),
                                bn.AutoText(
                                  'মোট প্রশ্ন: ${_toBanglaDigits(totalQ)}টি',
                                  fontSize: 8,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('1E293B'),
                                ),
                                bn.AutoText(
                                  'পূর্ণমান: ${_toBanglaDigits(result.totalMarks.toInt())}',
                                  fontSize: 8,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('1E293B'),
                                ),
                                bn.AutoText(
                                  'নেগেটিভ মার্ক: ${_toBanglaDigits(result.negativeMarking)}x',
                                  fontSize: 8,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('1E293B'),
                                ),
                              ],
                            ),
                          ),
                          pw.SizedBox(height: 4),
                          bn.AutoText(
                            '[ বিশেষ নির্দেশাবলী: প্রতিটি প্রশ্নের সঠিক উত্তরের জন্য ১ নম্বর বরাদ্দ এবং ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা যাবে। ]',
                            fontSize: 6.8,
                            color: PdfColor.fromHex('64748B'),
                          ),
                          pw.SizedBox(height: 4),
                          pw.Divider(color: PdfColor.fromHex('94A3B8'), thickness: 0.7),
                          pw.SizedBox(height: 4),
                        ],
                      ),
                    ),
                  ] else ...[
                    // Running Minimal Top Header on subsequent pages
                    pw.Container(
                      padding: const pw.EdgeInsets.only(bottom: 5),
                      child: pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          bn.AutoText(
                            '$examTitle — প্রশ্নপত্র',
                            fontSize: 7.8,
                            color: PdfColor.fromHex('64748B'),
                          ),
                          bn.AutoText(
                            'পৃষ্ঠা ${_toBanglaDigits(pageIdx + 1)} / ${_toBanglaDigits(pages.length)}',
                            fontSize: 7.8,
                            color: PdfColor.fromHex('64748B'),
                          ),
                        ],
                      ),
                    ),
                    pw.Divider(color: PdfColor.fromHex('E2E8F0'), thickness: 0.6),
                    pw.SizedBox(height: 5),
                  ],

                  // 2-Column Body
                  pw.Expanded(
                    child: pw.Row(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Expanded(
                          child: pw.Column(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: leftWidgets,
                          ),
                        ),
                        pw.SizedBox(width: 12),
                        // Middle Vertical Divider Line
                        pw.Container(
                          width: 0.6,
                          color: PdfColor.fromHex('E2E8F0'),
                        ),
                        pw.SizedBox(width: 12),
                        pw.Expanded(
                          child: pw.Column(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: rightWidgets,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Minimal Page Footer
                  pw.Container(
                    padding: const pw.EdgeInsets.only(top: 4),
                    child: pw.Column(
                      children: [
                        if (pageIdx == pages.length - 1) ...[
                          pw.Padding(
                            padding: const pw.EdgeInsets.only(bottom: 3),
                            child: bn.AutoText(
                              '— পরীক্ষা সমাপ্ত (End of Question Paper) —',
                              fontSize: 7.5,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('64748B'),
                            ),
                          ),
                        ],
                        pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          children: [
                            bn.AutoText(
                              'obhyash.com · অবিরত অনুশীলনে শ্রেষ্ঠত্ব',
                              fontSize: 7,
                              color: PdfColor.fromHex('94A3B8'),
                            ),
                            bn.AutoText(
                              'পৃষ্ঠা ${_toBanglaDigits(pageIdx + 1)}',
                              fontSize: 7,
                              color: PdfColor.fromHex('94A3B8'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        );
      }

      final bytes = await pdf.save();

      final file = await DownloadNotificationService().savePdfAndNotify(
        bytes: bytes,
        rawFileName: filename,
        notificationTitle: '$examTitle প্রশ্নপত্র PDF ডাউনলোড সম্পন্ন হয়েছে ✅',
        context: context.mounted ? context : null,
      );

      if (file != null) {
        try {
          await OpenFilex.open(file.path);
        } catch (_) {}
      } else {
        await Printing.sharePdf(bytes: bytes, filename: '$filename.pdf');
      }
    } catch (e) {
      debugPrint('[PdfDownloadService] downloadQuestionPaper error: $e');
      if (context.mounted) {
        AppPopups.error(
          context,
          message: 'প্রশ্নপত্র PDF তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        );
      }
    }
  }

  /// Directly generates and downloads Question Paper with Correct Answers & Detailed Explanations
  static Future<void> downloadResultWithExplanations(
    ExamResult result,
    BuildContext context,
  ) async {
    final examTitle = BanglaNameHelper.deduplicateExamTitle(
      result.subjectLabel?.isNotEmpty == true
          ? result.subjectLabel!
          : BanglaNameHelper.formatSubject(result.subject),
    );
    final filename = '${examTitle}_Solution_Explanation_${DateTime.now().millisecondsSinceEpoch}';

    try {
      bn.BanglaPdf.configure(shapingMode: bn.BanglaShapingMode.legacy);

      pw.Font? roboto;
      pw.Font? robotoBold;
      pw.Font? notoSans;
      pw.Font? mathFont;
      pw.Font? symbolFont;

      try {
        roboto = await PdfGoogleFonts.robotoRegular();
        robotoBold = await PdfGoogleFonts.robotoBold();
        notoSans = await PdfGoogleFonts.notoSansRegular();
        mathFont = await PdfGoogleFonts.notoSansMathRegular();
        symbolFont = await PdfGoogleFonts.notoSansSymbolsRegular();
      } catch (fontErr) {
        debugPrint('[PdfDownloadService] Font loading fallback: $fontErr');
      }

      final fontFallbacks = <pw.Font>[
        ?notoSans,
        ?mathFont,
        ?symbolFont,
        ?roboto,
        ?robotoBold,
      ];

      final theme = (roboto != null && robotoBold != null)
          ? pw.ThemeData.withFont(
              base: roboto,
              bold: robotoBold,
              fontFallback: fontFallbacks,
            )
          : pw.ThemeData.base();

      final pdf = pw.Document(theme: theme);
      const optionLetters = ['(ক)', '(খ)', '(গ)', '(ঘ)'];

      final sortedQuestions = List<Question>.from(result.questions);
      final totalQ = sortedQuestions.length;
      final unattemptedCount = totalQ - result.correctCount - result.wrongCount;

      // Calculate distinct main subjects
      final distinctMainSubjects = sortedQuestions
          .map((q) => BanglaNameHelper.getMainSubjectName(q.subject, q.subjectLabel))
          .toSet();
      final hasMultipleSubjects = distinctMainSubjects.length > 1;

      // Canonically sort questions by subject priority (Physics -> Chemistry -> Math -> Biology -> etc.)
      if (hasMultipleSubjects) {
        sortedQuestions.sort((a, b) {
          final subA = BanglaNameHelper.getMainSubjectName(a.subject, a.subjectLabel);
          final subB = BanglaNameHelper.getMainSubjectName(b.subject, b.subjectLabel);
          final pA = BanglaNameHelper.getSubjectSortPriority(subA, a.subject);
          final pB = BanglaNameHelper.getSubjectSortPriority(subB, b.subject);
          if (pA != pB) return pA.compareTo(pB);
          return 0;
        });
      }

      // Precompute subject header positions deterministically
      final subjectHeaderMap = <int, String>{};
      String prevSubject = '';
      for (int i = 0; i < sortedQuestions.length; i++) {
        final q = sortedQuestions[i];
        final curSub = BanglaNameHelper.getMainSubjectName(q.subject, q.subjectLabel);
        if (hasMultipleSubjects && curSub != prevSubject) {
          subjectHeaderMap[i] = curSub;
          prevSubject = curSub;
        }
      }

      // Dynamically chunk questions per page to pack each solution page naturally
      // Page 1 masthead + score summary leaves ~620pt column height; Page 2+ leaves ~715pt column height
      final List<List<int>> pages = [];
      int currentIdx = 0;

      while (currentIdx < totalQ) {
        final isFirstPage = pages.isEmpty;
        final maxColHeight = isFirstPage ? 620.0 : 715.0;
        final maxQuestionsPerPage = isFirstPage ? 14 : 16;

        int bestCount = 1;
        final remaining = totalQ - currentIdx;
        final limit = remaining < maxQuestionsPerPage ? remaining : maxQuestionsPerPage;

        for (int candidateCount = 1; candidateCount <= limit; candidateCount++) {
          final half = (candidateCount / 2).ceil();

          double leftH = 0;
          for (int i = 0; i < half; i++) {
            final qIdx = currentIdx + i;
            leftH += _estimateSolutionItemHeight(
              sortedQuestions[qIdx],
              subjectHeaderMap.containsKey(qIdx),
            );
          }

          double rightH = 0;
          for (int i = half; i < candidateCount; i++) {
            final qIdx = currentIdx + i;
            rightH += _estimateSolutionItemHeight(
              sortedQuestions[qIdx],
              subjectHeaderMap.containsKey(qIdx),
            );
          }

          if (leftH <= maxColHeight && rightH <= maxColHeight) {
            bestCount = candidateCount;
          } else {
            break;
          }
        }

        pages.add(List.generate(bestCount, (i) => currentIdx + i));
        currentIdx += bestCount;
      }

      for (int pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        final pageIndices = pages[pageIdx];
        final isFirstPage = pageIdx == 0;

        // Split this page's questions into Left Column & Right Column serially
        final halfCount = (pageIndices.length / 2).ceil();
        final leftIndices = pageIndices.sublist(0, halfCount);
        final rightIndices = pageIndices.sublist(halfCount);

        pdf.addPage(
          pw.Page(
            pageTheme: pw.PageTheme(
              pageFormat: PdfPageFormat.a4,
              margin: const pw.EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              theme: theme,
              buildBackground: (ctx) => _buildPageWatermark(),
            ),
            build: (ctx) {
              pw.Widget buildSolutionItem(int qIdx) {
                final q = sortedQuestions[qIdx];
                final showSubjectHeader = subjectHeaderMap.containsKey(qIdx);
                final currentSub = subjectHeaderMap[qIdx] ?? '';
                final number = qIdx + 1;

                final userAnsIdx = result.userAnswers[q.id];
                final isCorrect = q.isCorrectAnswer(userAnsIdx);
                final isSkipped = userAnsIdx == null;

                final correctLetter = (q.correctAnswerIndex >= 0 && q.correctAnswerIndex < optionLetters.length)
                    ? optionLetters[q.correctAnswerIndex]
                    : '';
                final correctText = (q.correctAnswerIndex >= 0 && q.correctAnswerIndex < q.options.length)
                    ? _formatMathForPdf(q.options[q.correctAnswerIndex])
                    : '';

                final userAnsLetter = (userAnsIdx != null && userAnsIdx >= 0 && userAnsIdx < optionLetters.length)
                    ? optionLetters[userAnsIdx]
                    : '';

                final formattedStem = _formatMathForPdf(q.question);

                return pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 9),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      if (showSubjectHeader) ...[
                        pw.Container(
                          margin: const pw.EdgeInsets.only(top: 4, bottom: 6),
                          alignment: pw.Alignment.center,
                          child: pw.Row(
                            mainAxisAlignment: pw.MainAxisAlignment.center,
                            children: [
                              pw.Expanded(child: pw.Divider(color: PdfColor.fromHex('CBD5E1'), thickness: 0.5)),
                              pw.Padding(
                                padding: const pw.EdgeInsets.symmetric(horizontal: 8),
                                child: bn.AutoText(
                                  '— $currentSub —',
                                  fontSize: 9,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('334155'),
                                ),
                              ),
                              pw.Expanded(child: pw.Divider(color: PdfColor.fromHex('CBD5E1'), thickness: 0.5)),
                            ],
                          ),
                        ),
                      ],
                      // Question Stem
                      pw.Row(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          bn.AutoText(
                            '${_toBanglaDigits(number)}. ',
                            fontSize: 8.4,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('0F172A'),
                          ),
                          pw.Expanded(
                            child: bn.AutoText(
                              formattedStem,
                              fontSize: 8.4,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('0F172A'),
                              style: const pw.TextStyle(lineSpacing: 1.35),
                            ),
                          ),
                        ],
                      ),
                      pw.SizedBox(height: 2),
                      // Options List
                      _buildOptionsWidget(q.options),
                      pw.SizedBox(height: 3),
                      // Solution & Explanation Box
                      pw.Container(
                        width: double.infinity,
                        margin: const pw.EdgeInsets.only(left: 10),
                        padding: const pw.EdgeInsets.symmetric(horizontal: 7, vertical: 4),
                        decoration: pw.BoxDecoration(
                          color: PdfColor.fromHex('F8FAFC'),
                          border: pw.Border(
                            left: pw.BorderSide(
                              color: isSkipped
                                  ? PdfColor.fromHex('94A3B8')
                                  : isCorrect
                                      ? PdfColor.fromHex('16A34A')
                                      : PdfColor.fromHex('DC2626'),
                              width: 2,
                            ),
                          ),
                          borderRadius: const pw.BorderRadius.horizontal(
                            right: pw.Radius.circular(3),
                          ),
                        ),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            bn.AutoText(
                              'সঠিক উত্তর: $correctLetter $correctText',
                              fontSize: 7.5,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('15803D'),
                            ),
                            if (!isSkipped) ...[
                              pw.SizedBox(height: 1.5),
                              bn.AutoText(
                                'তোমার উত্তর: $userAnsLetter ${isCorrect ? "✓ (সঠিক)" : "✗ (ভুল)"}',
                                fontSize: 7.3,
                                fontWeight: pw.FontWeight.bold,
                                color: isCorrect
                                    ? PdfColor.fromHex('15803D')
                                    : PdfColor.fromHex('DC2626'),
                              ),
                            ],
                            if (q.explanation != null && q.explanation!.trim().isNotEmpty) ...[
                              pw.SizedBox(height: 2),
                              bn.AutoText(
                                'ব্যাখ্যা: ${_formatMathForPdf(q.explanation!)}',
                                fontSize: 7.2,
                                color: PdfColor.fromHex('334155'),
                                style: const pw.TextStyle(lineSpacing: 1.3),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }

              // Build Left Column Items
              final leftWidgets = <pw.Widget>[];
              for (final idx in leftIndices) {
                leftWidgets.add(buildSolutionItem(idx));
              }

              // Build Right Column Items
              final rightWidgets = <pw.Widget>[];
              for (final idx in rightIndices) {
                rightWidgets.add(buildSolutionItem(idx));
              }

              return pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                children: [
                  if (isFirstPage) ...[
                    // Clean Official Solution Header
                    pw.Container(
                      alignment: pw.Alignment.center,
                      child: pw.Column(
                        children: [
                          bn.AutoText(
                            '$examTitle — সমাধান ও ব্যাখ্যা',
                            fontSize: 14.5,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('0F172A'),
                          ),
                          pw.SizedBox(height: 2),
                          bn.AutoText(
                            'উচ্চ মাধ্যমিক ও ভর্তি পরীক্ষা প্রস্তুতি · obhyash.com',
                            fontSize: 7.5,
                            color: PdfColor.fromHex('475569'),
                          ),
                          pw.SizedBox(height: 5),
                          // Results Summary Bar
                          pw.Container(
                            padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 4.5),
                            decoration: pw.BoxDecoration(
                              color: PdfColor.fromHex('F8FAFC'),
                              border: pw.Border.all(color: PdfColor.fromHex('CBD5E1'), width: 0.7),
                              borderRadius: pw.BorderRadius.circular(4),
                            ),
                            child: pw.Row(
                              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                              children: [
                                bn.AutoText(
                                  '🎯 প্রাপ্ত নম্বর: ${_toBanglaDigits(result.score.toStringAsFixed(2))} / ${_toBanglaDigits(result.totalMarks.toInt())}',
                                  fontSize: 8.2,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('0F172A'),
                                ),
                                bn.AutoText(
                                  '✓ সঠিক: ${_toBanglaDigits(result.correctCount)}',
                                  fontSize: 8.2,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('15803D'),
                                ),
                                bn.AutoText(
                                  '✗ ভুল: ${_toBanglaDigits(result.wrongCount)}',
                                  fontSize: 8.2,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('DC2626'),
                                ),
                                bn.AutoText(
                                  '⚪ অনুত্তর: ${_toBanglaDigits(unattemptedCount > 0 ? unattemptedCount : 0)}',
                                  fontSize: 8.2,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('475569'),
                                ),
                              ],
                            ),
                          ),
                          pw.SizedBox(height: 6),
                          pw.Divider(color: PdfColor.fromHex('94A3B8'), thickness: 0.7),
                          pw.SizedBox(height: 4),
                        ],
                      ),
                    ),
                  ] else ...[
                    // Running Minimal Top Header
                    pw.Container(
                      padding: const pw.EdgeInsets.only(bottom: 5),
                      child: pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          bn.AutoText(
                            '$examTitle — সমাধান ও ব্যাখ্যা',
                            fontSize: 7.8,
                            color: PdfColor.fromHex('64748B'),
                          ),
                          bn.AutoText(
                            'পৃষ্ঠা ${_toBanglaDigits(pageIdx + 1)} / ${_toBanglaDigits(pages.length)}',
                            fontSize: 7.8,
                            color: PdfColor.fromHex('64748B'),
                          ),
                        ],
                      ),
                    ),
                    pw.Divider(color: PdfColor.fromHex('E2E8F0'), thickness: 0.6),
                    pw.SizedBox(height: 5),
                  ],

                  // 2-Column Body
                  pw.Expanded(
                    child: pw.Row(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Expanded(
                          child: pw.Column(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: leftWidgets,
                          ),
                        ),
                        pw.SizedBox(width: 12),
                        // Middle Vertical Line
                        pw.Container(
                          width: 0.6,
                          color: PdfColor.fromHex('E2E8F0'),
                        ),
                        pw.SizedBox(width: 12),
                        pw.Expanded(
                          child: pw.Column(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: rightWidgets,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Minimal Page Footer
                  pw.Container(
                    padding: const pw.EdgeInsets.only(top: 4),
                    child: pw.Column(
                      children: [
                        if (pageIdx == pages.length - 1) ...[
                          pw.Padding(
                            padding: const pw.EdgeInsets.only(bottom: 3),
                            child: bn.AutoText(
                              '— উত্তর ও ব্যাখ্যা সমাপ্ত (End of Solutions) —',
                              fontSize: 7.5,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('64748B'),
                            ),
                          ),
                        ],
                        pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          children: [
                            bn.AutoText(
                              'obhyash.com · অবিরত অনুশীলনে শ্রেষ্ঠত্ব',
                              fontSize: 7,
                              color: PdfColor.fromHex('94A3B8'),
                            ),
                            bn.AutoText(
                              'পৃষ্ঠা ${_toBanglaDigits(pageIdx + 1)}',
                              fontSize: 7,
                              color: PdfColor.fromHex('94A3B8'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        );
      }

      final bytes = await pdf.save();

      final file = await DownloadNotificationService().savePdfAndNotify(
        bytes: bytes,
        rawFileName: filename,
        notificationTitle: '$examTitle ফলাফল ও ব্যাখ্যা PDF ডাউনলোড সম্পন্ন ✅',
        context: context.mounted ? context : null,
      );

      if (file != null) {
        try {
          await OpenFilex.open(file.path);
        } catch (_) {}
      } else {
        await Printing.sharePdf(bytes: bytes, filename: '$filename.pdf');
      }
    } catch (e) {
      debugPrint('[PdfDownloadService] downloadResultWithExplanations error: $e');
      if (context.mounted) {
        AppPopups.error(
          context,
          message: 'ফলাফল ও ব্যাখ্যা PDF তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        );
      }
    }
  }
}
