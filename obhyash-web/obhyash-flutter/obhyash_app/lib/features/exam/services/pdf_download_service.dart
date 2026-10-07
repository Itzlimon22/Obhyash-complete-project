import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:http/http.dart' as http;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:bangla_pdf/bangla_pdf.dart' as bn;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/download_notification_service.dart';
import '../../../core/utils/app_popups.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../../../core/utils/question_formatter.dart';
import '../domain/exam_models.dart';

class PdfDownloadService {
  /// Weekly download limit for question papers for free users
  static const int maxFreeWeeklyDownloads = 3;

  /// Helper to get weekly key format: weekly_pdf_q_YYYY_WW_userId
  static String _getWeeklyKey() {
    final now = DateTime.now().toUtc();
    final user = Supabase.instance.client.auth.currentUser;
    final userId = user?.id ?? 'guest';
    final firstDayOfYear = DateTime.utc(now.year, 1, 1);
    final weekNumber = ((now.difference(firstDayOfYear).inDays) / 7).floor();
    return 'weekly_pdf_q_${now.year}_${weekNumber}_$userId';
  }

  /// Get how many question papers the user downloaded this week
  static Future<int> getWeeklyDownloadCount() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(_getWeeklyKey()) ?? 0;
  }

  /// Increment weekly download count
  static Future<void> incrementWeeklyDownloadCount() async {
    final prefs = await SharedPreferences.getInstance();
    final key = _getWeeklyKey();
    final current = prefs.getInt(key) ?? 0;
    await prefs.setInt(key, current + 1);
  }

  /// Unified body font size for Question Stems and Answer Options.
  /// Ensures perfectly equal, harmonious, and readable typography across all generated PDFs.
  static const double _fontSizeBody = 8.2;

  /// Pre-configures BanglaPdf with HindSiliguri if available in assets to guarantee
  /// native rendering of math symbols (√, ≤, ≥, ≠, ∞, ∫, ∑, °, ², ³, ¹, ±, π, •).
  static Future<void> _configureBanglaPdf() async {
    try {
      final fontData = await rootBundle.load('assets/fonts/HindSiliguri-Regular.ttf');
      final customFont = bn.BanglaPdf.loadFont(fontData);
      if (customFont != null) {
        bn.BanglaPdf.configure(
          shapingMode: bn.BanglaShapingMode.auto,
          defaultFont: customFont,
        );
        return;
      }
    } catch (e) {
      debugPrint('[PdfDownloadService] Font loading fallback: $e');
    }
    bn.BanglaPdf.configure(shapingMode: bn.BanglaShapingMode.auto);
  }

  static String _toBanglaDigits(dynamic number) {
    return BanglaNameHelper.toBanglaNumeral(number);
  }

  static String _toSuperscript(String s) {
    const normal = '0123456789+-=()abcdefghijklmnoprstuvwxyzABDEGHIJKLMNOPRTUVWxX';
    const superChars = '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻᴬᴮᴰᴱᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᴿᵀᵁⱽᵂˣˣ';
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

    // First auto-heal control characters, unescaped LaTeX, and formatting via QuestionFormatter
    var t = QuestionFormatter.autoHealRawLatex(raw);
    t = _stripInstituteTags(t);

    // 0. Clean math delimiters early so expressions and arrows like \xrightarrow remain contiguous
    t = t.replaceAll(RegExp(r'\$\$|\$'), '');

    // 0. Normalize newlines & HTML breaks
    t = t
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll('&nbsp;', ' ')
        .replaceAll('\r\n', '\n')
        .replaceAll('\r', '\n');

    // 0.1 Clean KaTeX chemistry wrappers \ce{...}, \pu{...} early
    t = t.replaceAllMapped(
      RegExp(r'\\(?:ce|pu)\{([^{}]*)\}'),
      (m) {
        var inner = m.group(1)!;
        inner = inner.replaceAllMapped(
          RegExp(r'([A-Za-z\)])_?(\d+)'),
          (cm) => '${cm.group(1)}${cm.group(2)}',
        );
        inner = inner.replaceAll(r'^+', '+').replaceAll(r'^-', '-');
        return inner;
      },
    );

    // 0.2 Chemistry reaction arrows with conditions: \xrightarrow[below]{above} -> ──[above]──>
    t = t.replaceAllMapped(
      RegExp(r'\\?xrightarrow(?:\[([^\]]*)\])?\{((?:[^{}]*|\{[^{}]*\})*)\}'),
      (m) {
        final below = m.group(1)?.trim();
        final above = m.group(2)?.trim();
        final labelParts = <String>[];
        if (above != null && above.isNotEmpty) labelParts.add(_formatMathForPdf(above));
        if (below != null && below.isNotEmpty) labelParts.add(_formatMathForPdf(below));
        if (labelParts.isNotEmpty) {
          return ' -> (${labelParts.join(', ')}) -> ';
        }
        return ' -> ';
      },
    );

    // 0.3 Degrees Celsius & temperatures & angles
    t = t
        .replaceAll(RegExp(r'\^\{?\\circ\}?\s*(?:\\text\{C\}|C)'), '°C')
        .replaceAll(RegExp(r'\^\{?\\circ\}?\s*(?:\\text\{F\}|F)'), '°F')
        .replaceAll(RegExp(r'\^\{?\\circ\}?\s*(?:\\text\{K\}|K)'), ' K')
        .replaceAll(RegExp(r'\^\{?\\circ\}?'), '°')
        .replaceAll(r'\degree', '°');
    // Ensure "২৭ C" or "১০ C" or "৪ C" followed by তাপমাত্রা becomes "২৭°C", "১০°C", "৪°C"
    t = t.replaceAllMapped(
      RegExp(r'([০-৯0-9]+)\s*°?\s*C\s+(?=তাপমাত্রা)'),
      (m) => '${m.group(1)}°C ',
    );
    // Ensure degree in bond angles like "বন্ধন কোণ ১৮০" -> "বন্ধন কোণ ১৮০°"
    t = t.replaceAllMapped(
      RegExp(r'(কোণ\s+[০-৯0-9]+)\s*(?=[,\)\s]|\$)'),
      (m) => '${m.group(1)}°',
    );

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

    // 2.1 Limits, calculus functions, and binomial coefficients
    t = t.replaceAllMapped(
      RegExp(r'\\lim_\{?([^{}]+)\}?'),
      (m) => 'lim(${m.group(1)})',
    );
    t = t.replaceAllMapped(
      RegExp(r'\\binom\{([^{}]+)\}\{([^{}]+)\}'),
      (m) => '(${m.group(1)} C ${m.group(2)})',
    );
    t = t
        .replaceAll(r'\ln', 'ln')
        .replaceAll(r'\log', 'log')
        .replaceAll(r'\det', 'det')
        .replaceAll(r'\max', 'max')
        .replaceAll(r'\min', 'min');

    // 3. Greek letters & mathematical constants
    // Note: Bengali fonts (Kalpurush & HindSiliguri) lack Greek block glyphs (U+0370-U+03FF) except π.
    // We map Greek characters to clear, universal phonetic notation so questions NEVER render blank gaps.
    final greekMap = {
      r'\theta': 'theta',
      r'\Theta': 'Theta',
      r'\lambda': 'lambda',
      r'\Lambda': 'Lambda',
      r'\alpha': 'alpha',
      r'\beta': 'beta',
      r'\gamma': 'gamma',
      r'\Gamma': 'Gamma',
      r'\delta': 'delta',
      r'\Delta': 'Delta',
      r'\omega': 'omega',
      r'\Omega': 'Omega',
      r'\sigma': 'sigma',
      r'\Sigma': 'Sigma',
      r'\phi': 'phi',
      r'\Phi': 'Phi',
      r'\varphi': 'phi',
      r'\mu': 'mu',
      r'\nu': 'nu',
      r'\tau': 'tau',
      r'\rho': 'rho',
      r'\eta': 'eta',
      r'\zeta': 'zeta',
      r'\epsilon': 'epsilon',
      r'\varepsilon': 'epsilon',
      r'\iota': 'iota',
      r'\kappa': 'kappa',
      r'\xi': 'xi',
      r'\psi': 'psi',
      r'\Psi': 'Psi',
      r'\upsilon': 'upsilon',
      r'\chi': 'chi',
      r'\pi': 'π', // HindSiliguri has native π (U+03C0)
      r'\Pi': 'Pi',
    };

    greekMap.forEach((k, v) {
      t = t.replaceAll(RegExp(RegExp.escape(k) + r'(?![a-zA-Z])'), v);
      final bare = k.replaceFirst(r'\', '');
      t = t.replaceAll(RegExp('\\b$bare\\b'), v);
    });

    // 4. Mathematical operators & relations (Sorted longest-first to prevent prefix collisions like \in vs \int)
    final opList = [
      (r'\longrightarrow', '->'),
      (r'\longleftarrow', '<-'),
      (r'\rightleftharpoons', '<=>'),
      (r'\leftrightharpoons', '<=>'),
      (r'\leftrightarrow', '<->'),
      (r'\Leftrightarrow', '<=>'),
      (r'\Rightarrow', '=>'),
      (r'\Leftarrow', '<='),
      (r'\rightarrow', '->'),
      (r'\leftarrow', '<-'),
      (r'\implies', '=>'),
      (r'\iff', '<=>'),
      (r'\to', '->'),
      (r'\subseteq', '⊆'),
      (r'\supseteq', '⊇'),
      (r'\subset', '⊂'),
      (r'\supset', '⊃'),
      (r'\notin', '∉'),
      (r'\int', '∫'),
      (r'\infty', '∞'),
      (r'\in', '∈'),
      (r'\approx', '≈'),
      (r'\equiv', '≡'),
      (r'\neq', '≠'),
      (r'\ne', '≠'),
      (r'\leq', '≤'),
      (r'\le', '≤'),
      (r'\geq', '≥'),
      (r'\ge', '≥'),
      (r'\ll', '≪'),
      (r'\gg', '≫'),
      (r'\propto', '∝'),
      (r'\times', '×'),
      (r'\div', '÷'),
      (r'\pm', '±'),
      (r'\mp', '∓'),
      (r'\cdot', '·'),
      (r'\bullet', '•'),
      (r'\circ', '°'),
      (r'\degree', '°'),
      (r'\sum', '∑'),
      (r'\prod', '∏'),
      (r'\nabla', '∇'),
      (r'\partial', '∂'),
      (r'\forall', '∀'),
      (r'\exists', '∃'),
      (r'\emptyset', '∅'),
      (r'\angle', '∠'),
      (r'\triangle', '△'),
      (r'\perp', '⊥'),
      (r'\parallel', '∥'),
      ('@@CHEM_ARROW', '->'),
    ];

    for (final pair in opList) {
      t = t.replaceAll(RegExp(RegExp.escape(pair.$1) + r'(?![a-zA-Z])'), pair.$2);
    }

    // 4.1 Clean text wrappers \text{...}, \mathrm{...} before parsing fractions
    int textPasses = 0;
    while (t.contains(r'\text') || t.contains(r'\mathrm') || t.contains(r'\mathbf')) {
      final replaced = t.replaceAllMapped(
        RegExp(r'\\(?:text|mathrm|mathbf|mathit|textnormal|textbf|textit)\{([^{}]*)\}'),
        (m) => m.group(1)!,
      );
      if (replaced == t || ++textPasses > 5) break;
      t = replaced;
    }

    // 5. Roots & Fractions (iteratively resolve innermost roots and fractions together)
    final sqrtNRegex = RegExp(r'\\sqrt\[([^\]]*)\]\{([^{}]+)\}');
    final sqrtRegex = RegExp(r'\\sqrt\{([^{}]+)\}');
    final fracRegex = RegExp(r'\\(?:d|t)?frac\{([^{}]+)\}\{([^{}]+)\}');

    int mathPasses = 0;
    while ((t.contains(r'\sqrt') || t.contains(r'\frac') || t.contains(r'\dfrac') || t.contains(r'\tfrac')) &&
        mathPasses < 10) {
      final prev = t;
      // Resolve roots first
      if (t.contains(r'\sqrt[')) {
        t = t.replaceAllMapped(sqrtNRegex, (m) {
          return '${_toSuperscript(m.group(1)!)}√(${m.group(2)})';
        });
      }
      if (t.contains(r'\sqrt')) {
        t = t.replaceAllMapped(sqrtRegex, (m) {
          final inner = m.group(1)!.trim();
          if (inner.contains('+') || inner.contains('-') || inner.contains(' ') || inner.contains('/')) {
            return '√($inner)';
          }
          return '√$inner';
        });
      }
      // Resolve fractions
      if (t.contains(r'\frac') || t.contains(r'\dfrac') || t.contains(r'\tfrac')) {
        t = t.replaceAllMapped(fracRegex, (m) {
          final num = m.group(1)!.trim();
          final den = m.group(2)!.trim();
          return '($num / $den)';
        });
      }
      if (t == prev) break;
      mathPasses++;
    }

    // Bare fractions without braces like \frac 1 2
    t = t.replaceAllMapped(
      RegExp(r'\\(?:d|t)?frac\s*([0-9a-zA-Z])\s*([0-9a-zA-Z])'),
      (m) => '(${m.group(1)} / ${m.group(2)})',
    );

    // 7. Unit vectors & vector arrows: \hat{i} -> i, \hat{j} -> j, \hat{k} -> k, \vec{A} -> A
    // (Bengali fonts cannot render combining diacritics î/ĵ/k̂/⃗, resulting in blank gaps)
    t = t
        .replaceAll(r'\hat{i}', 'i')
        .replaceAll(r'\hat{j}', 'j')
        .replaceAll(r'\hat{k}', 'k')
        .replaceAll(r'\hat i', 'i')
        .replaceAll(r'\hat j', 'j')
        .replaceAll(r'\hat k', 'k');

    t = t.replaceAllMapped(
      RegExp(r'\\(?:vec|overrightarrow)\{?([a-zA-Z0-9]+)\}?'),
      (m) => m.group(1)!,
    );
    t = t.replaceAllMapped(
      RegExp(r'\\(?:bar|overline)\{?([a-zA-Z0-9]+)\}?'),
      (m) => m.group(1)!,
    );

    // 8. Clean \text{...}, \mathrm{...}, \mathbf{...} before exponents so units like \text{ms}^{-1} become ms⁻¹
    t = t.replaceAllMapped(
      RegExp(r'\\(?:text|mathrm|mathbf|mathit|textnormal|textbf|textit)\{([^{}]*)\}'),
      (m) => m.group(1)!,
    );

    // 9. Superscripts & powers:
    // 9a. Standard single powers: x^2 -> x², x^3 -> x³, x^1 -> x¹ (Latin-1 chars natively supported)
    t = t.replaceAllMapped(
      RegExp(r'\^\{?([123])\}?'),
      (m) {
        final d = m.group(1)!;
        if (d == '2') return '²';
        if (d == '3') return '³';
        if (d == '1') return '¹';
        return '^$d';
      },
    );

    // 9b. Multi-digit exponents, negative powers, scientific powers of 10:
    // 10^{-14} -> 10^-14, 10^{23} -> 10^23, ms^{-1} -> ms^-1, H^+ -> H+, OH^- -> OH-
    t = t.replaceAllMapped(
      RegExp(r'\^\{?([\+\-]?[0-9a-zA-Z\+\-]+)\}?'),
      (m) {
        final exp = m.group(1)!;
        if (exp == '+' || exp == '-') return exp;
        return '^$exp';
      },
    );

    // 10. Subscripts:
    // In chemistry and physics formulas, keep digits and indices clean, standard and visible:
    // H_2O -> H2O, CuSO_4 -> CuSO4, [H_2O] -> [H2O], C_2H_2 -> C2H2, 2pz_z -> 2pz
    t = t.replaceAllMapped(
      RegExp(r'([A-Za-z\)])\_\{?([0-9]+)\}?'),
      (m) => '${m.group(1)}${m.group(2)}',
    );
    t = t.replaceAllMapped(
      RegExp(r'\_\{?([0-9a-zA-Z]+)\}?'),
      (m) => '${m.group(1)}',
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
    t = t.replaceAllMapped(RegExp(r'\s+([?!।,;:])'), (m) => m.group(1)!);

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
  /// All options use the exact same font size as the question stem (_fontSizeBody) for visual parity.
  static pw.Widget _buildOptionsWidget(List<String> rawOptions) {
    if (rawOptions.isEmpty) return pw.SizedBox();

    const optionLetters = ['(ক)', '(খ)', '(গ)', '(ঘ)'];
    final formattedOptions = rawOptions.map((o) => _formatMathForPdf(o)).toList();

    final maxLen = formattedOptions.fold<int>(0, (max, o) => o.length > max ? o.length : max);

    // 1. Very short options (<= 14 chars each): 4 in one row
    if (formattedOptions.length == 4 && maxLen <= 14) {
      return pw.Padding(
        padding: const pw.EdgeInsets.only(left: 6),
        child: pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: List.generate(4, (i) {
            return pw.Expanded(
              child: bn.AutoText(
                '${optionLetters[i]} ${formattedOptions[i]}',
                fontSize: _fontSizeBody,
                color: PdfColor.fromHex('1E293B'),
              ),
            );
          }),
        ),
      );
    }

    // 2. Standard medium options (<= 42 chars): 2x2 Grid
    if (maxLen <= 42) {
      return pw.Padding(
        padding: const pw.EdgeInsets.only(left: 6),
        child: pw.Column(
          children: [
            pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                if (formattedOptions.isNotEmpty)
                  pw.Expanded(
                    child: bn.AutoText(
                      '${optionLetters[0]} ${formattedOptions[0]}',
                      fontSize: _fontSizeBody,
                      color: PdfColor.fromHex('1E293B'),
                    ),
                  ),
                if (formattedOptions.length > 1)
                  pw.Expanded(
                    child: bn.AutoText(
                      '${optionLetters[1]} ${formattedOptions[1]}',
                      fontSize: _fontSizeBody,
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
                      fontSize: _fontSizeBody,
                      color: PdfColor.fromHex('1E293B'),
                    ),
                  ),
                  if (formattedOptions.length > 3)
                    pw.Expanded(
                      child: bn.AutoText(
                        '${optionLetters[3]} ${formattedOptions[3]}',
                        fontSize: _fontSizeBody,
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

    // 3. Long options (> 42 chars): Stacked vertically (1 per line)
    return pw.Padding(
      padding: const pw.EdgeInsets.only(left: 6),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: List.generate(formattedOptions.length, (i) {
          return pw.Padding(
            padding: const pw.EdgeInsets.only(bottom: 1.5),
            child: bn.AutoText(
              '${optionLetters[i]} ${formattedOptions[i]}',
              fontSize: _fontSizeBody,
              color: PdfColor.fromHex('1E293B'),
            ),
          );
        }),
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
    if (formattedOpts.length == 4 && maxLen <= 14) {
      optHeight = 11.0;
    } else if (maxLen > 42) {
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
    if (formattedOpts.length == 4 && maxLen <= 14) {
      optHeight = 11.0;
    } else if (maxLen > 42) {
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
                    fontSize: 18,
                    fontWeight: pw.FontWeight.bold,
                    color: const PdfColor(0.80, 0.85, 0.90, 0.035),
                    letterSpacing: 4,
                  ),
                ),
                pw.SizedBox(width: 50),
                pw.Text(
                  'OBHYASH',
                  style: pw.TextStyle(
                    fontSize: 18,
                    fontWeight: pw.FontWeight.bold,
                    color: const PdfColor(0.80, 0.85, 0.90, 0.035),
                    letterSpacing: 4,
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

  static String _escapeHtml(String s) {
    return s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
  }

  /// Fetches pre-rendered KaTeX HTML from Obhyash web's PDF generator endpoint
  static Future<String?> _fetchHtmlFromGenerator({
    required String type, // 'question_paper' or 'solution'
    required ExamResult result,
  }) async {
    http.Client? client;
    try {
      client = http.Client();
      final url = Uri.parse('https://obhyash.com/api/pdf/generate');

      final formattedSubject = BanglaNameHelper.formatSubject(
        result.subject,
        result.subjectLabel,
      );
      final examTitle = BanglaNameHelper.deduplicateExamTitle(formattedSubject);
      final subjectCode = BanglaNameHelper.getSubjectCode(result.subject, result.subjectLabel);

      final chaptersSet = result.questions
          .map((q) => q.chapter.trim())
          .where((c) => c.isNotEmpty && c.toLowerCase() != 'general')
          .toSet();
      final chaptersStr = chaptersSet.isNotEmpty ? chaptersSet.join(', ') : '';

      final totalQ = result.questions.length;
      final durationMins = (result.totalMarks > 0 && result.totalMarks != totalQ)
          ? result.totalMarks.toInt()
          : (totalQ > 0 ? totalQ : 40);

      final questionsPayload = result.questions.asMap().entries.map((entry) {
        final idx = entry.key;
        final q = entry.value;
        return {
          'id': q.id,
          'serial': idx + 1,
          'question': q.question,
          'options': q.options,
          'correctAnswerIndex': q.correctAnswerIndex,
          'correct_answer_indices': q.correctAnswerIndices,
          'explanation': q.explanation,
          'passage': q.passage,
          'subject': q.subject,
          'subjectLabel': q.subjectLabel,
          'chapter': q.chapter,
        };
      }).toList();

      final body = jsonEncode({
        'type': type,
        'examDetails': {
          'title': examTitle,
          'category': chaptersStr.isNotEmpty ? 'অধ্যায় ভিত্তিক' : 'মডেল টেস্ট',
          'subject': formattedSubject,
          'subjectLabel': result.subjectLabel ?? formattedSubject,
          'subjectCode': subjectCode,
          'chapters': chaptersStr,
          'durationMinutes': durationMins,
          'totalMarks': result.totalMarks.toInt(),
          'examType': result.examType,
        },
        'questions': questionsPayload,
        'userAnswers': result.userAnswers,
      });

      final response = await client
          .post(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: body,
          )
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map && data['success'] == true && data['html'] is String) {
          final html = data['html'] as String;
          if (html.trim().isNotEmpty) {
            return html;
          }
        }
      }
    } catch (e) {
      debugPrint('[PdfDownloadService] API HTML fetch error: $e');
    } finally {
      client?.close();
    }
    return null;
  }

  /// Builds local Question Paper HTML matching the user's authentic 2-column model test image
  static String _generateLocalQuestionPaperHtml(ExamResult result) {
    final formattedSubject = BanglaNameHelper.formatSubject(
      result.subject,
      result.subjectLabel,
    );
    final examTitle = BanglaNameHelper.deduplicateExamTitle(formattedSubject);
    final cleanTitle = examTitle.replaceAll(RegExp(r'\([^)]*\)'), '').trim();

    final chaptersSet = result.questions
        .map((q) => q.chapter.trim())
        .where((c) => c.isNotEmpty && c.toLowerCase() != 'general')
        .toSet();
    final chaptersStr = chaptersSet.isNotEmpty
        ? _toBanglaDigits(chaptersSet.join(', '))
        : 'সম্পূর্ণ সিলেবাস';

    final totalQ = result.questions.length;
    final durationMins = (result.totalMarks > 0 && result.totalMarks != totalQ)
        ? result.totalMarks.toInt()
        : (totalQ > 0 ? totalQ : 40);

    final questions = result.questions;
    const banglaLetters = ['(ক)', '(খ)', '(গ)', '(ঘ)'];

    final qHtmlBuffer = StringBuffer();
    for (int i = 0; i < questions.length; i++) {
      final q = questions[i];
      final qNum = _toBanglaDigits(i + 1);
      final stem = _escapeHtml(q.question);

      final optBuffers = <String>[];
      for (int oi = 0; oi < q.options.length && oi < 4; oi++) {
        final optText = _escapeHtml(q.options[oi]);
        final lbl = oi < banglaLetters.length ? banglaLetters[oi] : '(${oi + 1})';
        optBuffers.add('<div class="opt-col"><span class="opt-lbl">$lbl</span><span class="opt-val">$optText</span></div>');
      }

      final passageHtml = (q.passage != null && q.passage!.trim().isNotEmpty)
          ? '<div class="passage-box">${_escapeHtml(q.passage!)}</div>'
          : '';

      qHtmlBuffer.write('''
        <div class="q-block">
          $passageHtml
          <div class="q-row">
            <span class="q-num">$qNum।</span>
            <div class="q-text">$stem</div>
          </div>
          <div class="opt-grid">
            ${optBuffers.join('')}
          </div>
        </div>
      ''');
    }

    return '''<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>${_escapeHtml(cleanTitle)} — প্রশ্নপত্র</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css" crossorigin="anonymous">
<style>
@font-face {
  font-family: 'Kalpurush';
  src: url('/fonts/Kalpurush.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
@page {
  size: 210mm 297mm;
  margin: 10mm 12mm 12mm 12mm;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body {
  font-family: 'Times New Roman', 'Liberation Serif', 'Kalpurush', 'SolaimanLipi', 'Kohinoor Bangla', 'FreeSans', serif;
  font-size: 9.4pt;
  color: #000000;
  line-height: 1.35;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.watermark-bg {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 110pt;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.045);
  pointer-events: none;
  z-index: 9999;
  user-select: none;
  white-space: nowrap;
  letter-spacing: 4px;
  font-family: 'Times New Roman', 'Liberation Serif', 'Kalpurush', 'SolaimanLipi', 'Kohinoor Bangla', 'FreeSans', serif;
}
.header-box { position: relative; text-align: center; margin-bottom: 6px; padding-bottom: 2px; }
.brand-badge { position: absolute; top: 0; right: 0; border: 1.2px solid #006A4E; background: #E8F5E9; color: #006A4E; font-size: 8pt; font-weight: bold; padding: 2px 7px; border-radius: 4px; }
.cat-title { font-size: 10.5pt; font-weight: 700; color: #222222; margin-bottom: 1px; }
.main-title { font-size: 13pt; font-weight: 800; color: #000000; margin-bottom: 1px; }
.sub-title { font-size: 11pt; font-weight: 700; color: #000000; margin-bottom: 5px; }
.meta-row { display: flex; justify-content: space-between; align-items: center; font-size: 9pt; font-weight: 700; color: #111111; margin-bottom: 4px; padding: 0 2px; }
.meta-item { display: inline-flex; align-items: center; }
.student-row { display: flex; justify-content: space-between; align-items: baseline; font-size: 8.8pt; font-weight: 600; color: #222222; margin-bottom: 3px; padding: 0 2px; }
.name-dots { display: inline-block; flex: 1; border-bottom: 1px dotted #333333; margin: 0 10px 0 6px; height: 11px; }
.roll-dots { display: inline-block; width: 140px; border-bottom: 1px dotted #333333; margin-left: 6px; height: 11px; }
.note-line { font-size: 7.8pt; font-weight: 500; color: #333333; text-align: center; margin: 3px 0 5px 0; letter-spacing: 0.1px; }
.header-hr { border: 0; border-top: 1px solid #000000; margin: 0 0 9px 0; }
.passage-box { background: #f8fafc; border-left: 2.5px solid #475569; padding: 3px 6px; margin-bottom: 4px; font-size: 8.8pt; font-weight: 500; color: #1e293b; border-radius: 2px; }
.columns-wrapper { column-count: 2; column-gap: 22px; column-rule: 0.7px solid #444444; -webkit-column-count: 2; -webkit-column-gap: 22px; -webkit-column-rule: 0.7px solid #444444; text-align: justify; }
.q-block { break-inside: avoid; -webkit-column-break-inside: avoid; page-break-inside: avoid; margin-bottom: 8.5px; overflow-wrap: break-word; word-break: break-word; }
.q-row { display: flex; align-items: flex-start; font-size: 9.4pt; line-height: 1.34; color: #000000; }
.q-num { font-weight: 700; min-width: 20px; flex-shrink: 0; padding-right: 2px; font-size: 9.4pt; }
.q-text { flex: 1; font-weight: 500; }
.opt-grid { display: flex; flex-wrap: wrap; margin-top: 2.5px; margin-left: 20px; }
.opt-col { width: 50%; padding-right: 4px; margin-bottom: 1.5px; font-size: 9.1pt; line-height: 1.3; display: flex; align-items: flex-start; }
.opt-lbl { font-weight: 700; margin-right: 3px; flex-shrink: 0; font-size: 9pt; }
.opt-val { flex: 1; }
.katex { font-size: 1.02em; text-rendering: auto; }
</style>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.js" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
<script>
document.addEventListener("DOMContentLoaded", function() {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        {left: "\$\$", right: "\$\$", display: true},
        {left: "\$", right: "\$", display: false}
      ],
      throwOnError: false
    });
  }
});
</script>
</head>
<body>
<div class="watermark-bg">অভ্যাস</div>
<div class="header-box">
  <div class="brand-badge">অভ্যাস</div>
  <div class="cat-title">${chaptersSet.isNotEmpty ? 'অধ্যায় ভিত্তিক' : 'মডেল টেস্ট'}</div>
  <div class="main-title">${_escapeHtml(cleanTitle)}</div>
  <div class="sub-title">বিষয়ঃ ${_escapeHtml(formattedSubject)} (MCQ)</div>
  <div class="meta-row">
    <div class="meta-item">অধ্যায়: $chaptersStr</div>
    <div class="meta-item">মোট প্রশ্ন: ${_toBanglaDigits(totalQ)}টি</div>
    <div class="meta-item">সময়: ${_toBanglaDigits(durationMins)} মিনিট</div>
    <div class="meta-item">পূর্ণমান: ${_toBanglaDigits(result.totalMarks > 0 ? result.totalMarks.toInt() : totalQ)}</div>
    <div class="meta-item">প্রাপ্ত নম্বর: ________</div>
  </div>
  <div class="student-row">
    <span style="white-space:nowrap;">শিক্ষার্থীর নাম:</span>
    <span class="name-dots"></span>
    <span style="white-space:nowrap;">রোল নং:</span>
    <span class="roll-dots"></span>
  </div>
  <div class="note-line">[বি:দ্র: সঠিক উত্তরের বৃত্তটি বল পয়েন্ট কলম দ্বারা সম্পূর্ণ ভরাট কর। প্রতিটি প্রশ্নের মান-১]</div>
  <hr class="header-hr">
</div>
<div class="columns-wrapper">
  $qHtmlBuffer
</div>
</body>
</html>''';
  }

  /// Builds local Solution HTML with explanations matching Obhyash solutions layout
  static String _generateLocalSolutionHtml(ExamResult result) {
    final formattedSubject = BanglaNameHelper.formatSubject(
      result.subject,
      result.subjectLabel,
    );
    final examTitle = BanglaNameHelper.deduplicateExamTitle(formattedSubject);
    final cleanTitle = examTitle.replaceAll(RegExp(r'\([^)]*\)'), '').trim();

    final questions = result.questions;
    final totalQ = questions.length;
    final unattempted = totalQ - result.correctCount - result.wrongCount;
    const banglaLetters = ['(ক)', '(খ)', '(গ)', '(ঘ)'];

    final itemsHtml = StringBuffer();
    for (int i = 0; i < questions.length; i++) {
      final q = questions[i];
      final qNum = _toBanglaDigits(i + 1);
      final stem = _escapeHtml(q.question);
      final userAnsIdx = result.userAnswers[q.id];
      final isAnswered = userAnsIdx != null && userAnsIdx >= 0;
      final isCorrect = q.isCorrectAnswer(userAnsIdx);

      final optBuffers = <String>[];
      for (int oi = 0; oi < q.options.length && oi < 4; oi++) {
        final optText = _escapeHtml(q.options[oi]);
        final lbl = oi < banglaLetters.length ? banglaLetters[oi] : '(${oi + 1})';
        final isCorrectOpt = oi == q.correctAnswerIndex;
        String optClass = 'opt-col';
        if (isCorrectOpt) optClass += ' is-correct';

        optBuffers.add('<div class="$optClass"><span class="opt-lbl">$lbl</span><span class="opt-val">$optText</span></div>');
      }

      final correctLetter = (q.correctAnswerIndex >= 0 && q.correctAnswerIndex < banglaLetters.length)
          ? banglaLetters[q.correctAnswerIndex]
          : '';
      final correctText = (q.correctAnswerIndex >= 0 && q.correctAnswerIndex < q.options.length)
          ? _escapeHtml(q.options[q.correctAnswerIndex])
          : '';

      final userChoiceLetter = (userAnsIdx != null && userAnsIdx >= 0 && userAnsIdx < banglaLetters.length)
          ? banglaLetters[userAnsIdx]
          : '';

      final explanationText = (q.explanation != null && q.explanation!.trim().isNotEmpty)
          ? '<div class="exp-text"><strong>ব্যাখ্যা:</strong> ${_escapeHtml(q.explanation!)}</div>'
          : '';

      final passageHtml = (q.passage != null && q.passage!.trim().isNotEmpty)
          ? '<div class="passage-box">${_escapeHtml(q.passage!)}</div>'
          : '';

      itemsHtml.write('''
        <div class="q-block">
          $passageHtml
          <div class="q-row">
            <span class="q-num">$qNum।</span>
            <div class="q-text">$stem</div>
          </div>
          <div class="opt-grid">
            ${optBuffers.join('')}
          </div>
          <div class="sol-box">
            <div class="sol-correct">সঠিক উত্তর: <strong>$correctLetter $correctText</strong></div>
            $explanationText
          </div>
        </div>
      ''');
    }

    return '''<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>${_escapeHtml(cleanTitle)} — সমাধান ও ব্যাখ্যা</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css" crossorigin="anonymous">
<style>
@font-face {
  font-family: 'Kalpurush';
  src: url('/fonts/Kalpurush.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
@page { size: 210mm 297mm; margin: 10mm 12mm 12mm 12mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body {
  font-family: 'Times New Roman', 'Liberation Serif', 'Kalpurush', 'SolaimanLipi', 'Kohinoor Bangla', 'FreeSans', serif;
  font-size: 9.2pt;
  color: #0f172a;
  line-height: 1.35;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.header-box { text-align: center; margin-bottom: 8px; }
.main-title { font-size: 13.5pt; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
.sub-badge { display: inline-block; font-size: 9pt; font-weight: 700; color: #0f766e; background: #f0fdfa; border: 1px solid #99f6e4; padding: 1.5px 8px; border-radius: 4px; margin-bottom: 3px; }
.sub-title { font-size: 8pt; color: #475569; margin-bottom: 6px; }
.summary-bar {
  display: flex; justify-content: space-around; align-items: center;
  background: #f8fafc; border: 0.8px solid #cbd5e1; border-radius: 5px;
  padding: 4px 12px; font-size: 8.4pt; font-weight: 700; margin-bottom: 8px;
}
.summary-item { color: #0f172a; }
.columns-wrapper {
  column-count: 2; column-gap: 20px; column-rule: 0.7px solid #cbd5e1;
  -webkit-column-count: 2; -webkit-column-gap: 20px; -webkit-column-rule: 0.7px solid #cbd5e1;
}
.q-block { break-inside: avoid; -webkit-column-break-inside: avoid; page-break-inside: avoid; margin-bottom: 9px; }
.q-row { display: flex; align-items: flex-start; font-size: 9.3pt; font-weight: 700; color: #0f172a; line-height: 1.34; }
.q-num { min-width: 20px; flex-shrink: 0; padding-right: 2px; }
.q-text { flex: 1; }
.opt-grid { display: flex; flex-wrap: wrap; margin-top: 2.5px; margin-left: 20px; }
.opt-col { width: 50%; padding-right: 4px; margin-bottom: 1.5px; font-size: 9pt; line-height: 1.3; display: flex; align-items: flex-start; }
.opt-col.is-correct { color: #15803d; font-weight: 700; }
.opt-col.is-wrong { color: #dc2626; font-weight: 600; }
.opt-lbl { font-weight: 700; margin-right: 3px; flex-shrink: 0; }
.opt-val { flex: 1; }
.sol-box {
  margin-top: 3.5px; margin-left: 18px; padding: 4px 7px;
  background: #f8fafc; border-left: 2.5px solid #94a3b8; border-radius: 2px;
  font-size: 8pt; line-height: 1.32;
}
.sol-box.correct { border-left-color: #16a34a; }
.sol-box.wrong { border-left-color: #dc2626; }
.sol-correct { color: #15803d; font-weight: 700; }
.sol-user { color: #334155; font-weight: 600; margin-top: 1.5px; }
.exp-text { color: #334155; margin-top: 2.5px; }
.passage-box { background: #f8fafc; border-left: 2.5px solid #475569; padding: 3px 6px; margin-bottom: 4px; font-size: 8.8pt; font-weight: 500; color: #1e293b; border-radius: 2px; }
.katex { font-size: 1.02em; }
</style>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.js" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
<script>
document.addEventListener("DOMContentLoaded", function() {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        {left: "\$\$", right: "\$\$", display: true},
        {left: "\$", right: "\$", display: false}
      ],
      throwOnError: false
    });
  }
});
</script>
</head>
<body>
<div class="header-box">
  <div class="main-title">${_escapeHtml(cleanTitle)}</div>
  <div class="sub-badge">সমাধান ও ব্যাখ্যা</div>
  <div class="sub-title">উচ্চ মাধ্যমিক ও ভর্তি পরীক্ষা প্রস্তুতি · মোট প্রশ্ন: ${_toBanglaDigits(totalQ)}টি · পূর্ণমান: ${_toBanglaDigits(result.totalMarks.toInt())}</div>
  <div class="summary-bar">
    <span class="summary-item">মোট প্রশ্ন: ${_toBanglaDigits(totalQ)}টি</span>
    <span class="summary-item">পূর্ণমান: ${_toBanglaDigits(result.totalMarks.toInt())}</span>
    <span class="summary-item">সময়: ${_toBanglaDigits(result.timeTaken > 0 ? (result.timeTaken / 60).ceil() : 25)} মিনিট</span>
  </div>
</div>
<div class="columns-wrapper">
  $itemsHtml
</div>
</body>
</html>''';
  }

  /// Directly generates and downloads the Question Paper as a standard 2-Column Print-Ready PDF
  static Future<void> downloadQuestionPaper(
    ExamResult result,
    BuildContext context,
  ) async {
    final formattedSubject = BanglaNameHelper.formatSubject(
      result.subject,
      result.subjectLabel,
    );
    final examTitle = BanglaNameHelper.deduplicateExamTitle(formattedSubject);
    final cleanTitle = examTitle.replaceAll(RegExp(r'\([^)]*\)'), '').trim();
    final filename = '${cleanTitle}_প্রশ্নপত্র';

    try {
      // 1. Fetch pre-rendered HTML with KaTeX from our web generator API
      String? html = await _fetchHtmlFromGenerator(
        type: 'question_paper',
        result: result,
      );

      // Fallback to local HTML generator if offline or network error
      html ??= _generateLocalQuestionPaperHtml(result);

      // 2. Render to vector PDF using native WebKit / Android WebView
      Uint8List? bytes;
      try {
        // ignore: deprecated_member_use
        bytes = await Printing.convertHtml(
          html: html,
          format: PdfPageFormat.a4,
          baseUrl: 'https://www.obhyash.com',
        );
      } catch (convErr) {
        debugPrint('[PdfDownloadService] convertHtml error: $convErr');
      }

      if (bytes != null && bytes.isNotEmpty) {
        final file = await DownloadNotificationService().savePdfAndNotify(
          bytes: bytes,
          rawFileName: filename,
          notificationTitle: '$cleanTitle — প্রশ্নপত্র',
          subtitle: 'ডাউনলোড সফল হয়েছে • ট্যাপ করে পিডিএফ দেখুন',
          context: context.mounted ? context : null,
        );

        if (file == null) {
          await Printing.sharePdf(bytes: bytes, filename: '$filename.pdf');
        }
        return;
      }

      // 3. Fallback to native pw.Document generator if convertHtml fails
      if (context.mounted) {
        await _downloadQuestionPaperFallbackPw(result, context);
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
    final formattedSubject = BanglaNameHelper.formatSubject(
      result.subject,
      result.subjectLabel,
    );
    final examTitle = BanglaNameHelper.deduplicateExamTitle(formattedSubject);
    final cleanTitle = examTitle.replaceAll(RegExp(r'\([^)]*\)'), '').trim();
    final filename = '${cleanTitle}_সমাধান';

    try {
      // 1. Fetch pre-rendered HTML with KaTeX from our web generator API
      String? html = await _fetchHtmlFromGenerator(
        type: 'solution',
        result: result,
      );

      // Fallback to local HTML generator if offline or network error
      html ??= _generateLocalSolutionHtml(result);

      // 2. Render to vector PDF using native WebKit / Android WebView
      Uint8List? bytes;
      try {
        // ignore: deprecated_member_use
        bytes = await Printing.convertHtml(
          html: html,
          format: PdfPageFormat.a4,
          baseUrl: 'https://www.obhyash.com',
        );
      } catch (convErr) {
        debugPrint('[PdfDownloadService] convertHtml error: $convErr');
      }

      if (bytes != null && bytes.isNotEmpty) {
        final file = await DownloadNotificationService().savePdfAndNotify(
          bytes: bytes,
          rawFileName: filename,
          notificationTitle: '$cleanTitle — সমাধান ও ব্যাখ্যা',
          subtitle: 'ডাউনলোড সফল হয়েছে • ট্যাপ করে পিডিএফ দেখুন',
          context: context.mounted ? context : null,
        );

        if (file == null) {
          await Printing.sharePdf(bytes: bytes, filename: '$filename.pdf');
        }
        return;
      }

      // 3. Fallback to native pw.Document generator if convertHtml fails
      if (context.mounted) {
        await _downloadResultFallbackPw(result, context);
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

  /// Fallback pw.Document implementation for Question Paper
  static Future<void> _downloadQuestionPaperFallbackPw(
    ExamResult result,
    BuildContext context,
  ) async {
    final formattedSubject = BanglaNameHelper.formatSubject(
      result.subject,
      result.subjectLabel,
    );
    final examTitle = BanglaNameHelper.deduplicateExamTitle(formattedSubject);
    final cleanTitle = examTitle.replaceAll(RegExp(r'\([^)]*\)'), '').trim();
    final filename = '${cleanTitle}_প্রশ্নপত্র';

    final subjectCode = BanglaNameHelper.getSubjectCode(result.subject, result.subjectLabel);

    try {
      await _configureBanglaPdf();

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
        bn.BanglaPdf.defaultFont,
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
                      // Question Stem (Same font size as options for visual parity)
                      pw.Row(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          bn.AutoText(
                            '${_toBanglaDigits(number)}. ',
                            fontSize: _fontSizeBody,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('0F172A'),
                          ),
                          pw.Expanded(
                            child: bn.AutoText(
                              formattedStem,
                              fontSize: _fontSizeBody,
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
                    // Clean Official Masthead matching authentic Board Question Papers
                    pw.Container(
                      alignment: pw.Alignment.center,
                      child: pw.Column(
                        children: [
                          pw.Row(
                            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: pw.CrossAxisAlignment.end,
                            children: [
                              pw.Container(
                                width: 90,
                                child: bn.AutoText(
                                  subjectCode != null ? 'বিষয় কোড: $subjectCode' : 'মডেল টেস্ট',
                                  fontSize: 8,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('334155'),
                                ),
                              ),
                              pw.Column(
                                children: [
                                  bn.AutoText(
                                    '$examTitle (বহুনির্বাচনি অভীক্ষা)',
                                    fontSize: 13,
                                    fontWeight: pw.FontWeight.bold,
                                    color: PdfColor.fromHex('0F172A'),
                                  ),
                                  pw.SizedBox(height: 1.5),
                                  bn.AutoText(
                                    'উচ্চ মাধ্যমিক ও ভর্তি পরীক্ষা প্রস্তুতি · obhyash.com',
                                    fontSize: 7.2,
                                    color: PdfColor.fromHex('475569'),
                                  ),
                                ],
                              ),
                              pw.Container(
                                width: 90,
                                alignment: pw.Alignment.centerRight,
                                child: bn.AutoText(
                                  'সেট কোড: ক',
                                  fontSize: 8,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('334155'),
                                ),
                              ),
                            ],
                          ),
                          pw.SizedBox(height: 4.5),
                          // Metadata Bar (Clean, rounded container)
                          pw.Container(
                            padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 4),
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
                                  result.negativeMarking > 0
                                      ? 'নেগেটিভ মার্ক: -${_toBanglaDigits(result.negativeMarking)}'
                                      : 'নেগেটিভ মার্ক: নেই',
                                  fontSize: 8,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('1E293B'),
                                ),
                              ],
                            ),
                          ),
                          pw.SizedBox(height: 3.5),
                          bn.AutoText(
                            result.negativeMarking > 0
                                ? '[ বিশেষ দ্রষ্টব্য: সরবরাহকৃত বহুনির্বাচনি অভীক্ষার উত্তরপত্রে প্রশ্নের ক্রমিক নম্বরের বিপরীতে সঠিক উত্তরের বৃত্তটি বল পয়েন্ট কলম দ্বারা ভরাট করো। সকল প্রশ্নের মান সমান। প্রতিটি সঠিক উত্তরের জন্য ১ নম্বর বরাদ্দ এবং ভুল উত্তরের জন্য -${_toBanglaDigits(result.negativeMarking)} নম্বর কাটা যাবে। ]'
                                : '[ বিশেষ দ্রষ্টব্য: সরবরাহকৃত বহুনির্বাচনি অভীক্ষার উত্তরপত্রে প্রশ্নের ক্রমিক নম্বরের বিপরীতে সঠিক উত্তরের বৃত্তটি বল পয়েন্ট কলম দ্বারা ভরাট করো। সকল প্রশ্নের মান সমান (প্রতিটি ১ নম্বর)। ]',
                            fontSize: 6.4,
                            color: PdfColor.fromHex('475569'),
                            textAlign: pw.TextAlign.center,
                          ),
                          pw.SizedBox(height: 3.5),
                          pw.Divider(color: PdfColor.fromHex('94A3B8'), thickness: 0.7),
                          pw.SizedBox(height: 3),
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
                            '$examTitle — বহুনির্বাচনি অভীক্ষা (সেট: ক)',
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
                        if (pageIdx < pages.length - 1) ...[
                          pw.Padding(
                            padding: const pw.EdgeInsets.only(bottom: 2),
                            child: bn.AutoText(
                              '[ অপর পৃষ্ঠায় দ্রষ্টব্য / চলমান পাতা - ${_toBanglaDigits(pageIdx + 2)} ]',
                              fontSize: 7,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('475569'),
                            ),
                          ),
                        ] else ...[
                          pw.Padding(
                            padding: const pw.EdgeInsets.only(bottom: 2),
                            child: bn.AutoText(
                              '— প্রশ্নপত্র সমাপ্ত (End of Question Paper) —',
                              fontSize: 7.5,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('475569'),
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
        notificationTitle: '$cleanTitle — প্রশ্নপত্র',
        subtitle: 'ডাউনলোড সফল হয়েছে • ট্যাপ করে পিডিএফ দেখুন',
        context: context.mounted ? context : null,
      );

      if (file == null) {
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

  /// Fallback pw.Document implementation for Solutions
  static Future<void> _downloadResultFallbackPw(
    ExamResult result,
    BuildContext context,
  ) async {
    final formattedSubject = BanglaNameHelper.formatSubject(
      result.subject,
      result.subjectLabel,
    );
    final examTitle = BanglaNameHelper.deduplicateExamTitle(formattedSubject);
    final cleanTitle = examTitle.replaceAll(RegExp(r'\([^)]*\)'), '').trim();
    final filename = '${cleanTitle}_সমাধান';
    final subjectCode = BanglaNameHelper.getSubjectCode(result.subject, result.subjectLabel);

    try {
      await _configureBanglaPdf();

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
        bn.BanglaPdf.defaultFont,
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
                      // Question Stem (Same font size as options for visual parity)
                      pw.Row(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          bn.AutoText(
                            '${_toBanglaDigits(number)}. ',
                            fontSize: _fontSizeBody,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('0F172A'),
                          ),
                          pw.Expanded(
                            child: bn.AutoText(
                              formattedStem,
                              fontSize: _fontSizeBody,
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
                              fontSize: 7.8,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('15803D'),
                            ),
                            if (!isSkipped) ...[
                              pw.SizedBox(height: 1.5),
                              bn.AutoText(
                                'তোমার উত্তর: $userAnsLetter ${isCorrect ? "✓ (সঠিক)" : "✗ (ভুল)"}',
                                fontSize: 7.6,
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
                                fontSize: 7.4,
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
                          pw.Row(
                            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: pw.CrossAxisAlignment.end,
                            children: [
                              pw.Container(
                                width: 85,
                                child: bn.AutoText(
                                  subjectCode != null ? 'বিষয় কোড: $subjectCode' : 'মডেল টেস্ট',
                                  fontSize: 8,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('334155'),
                                ),
                              ),
                              pw.Column(
                                children: [
                                  bn.AutoText(
                                    '$examTitle — সমাধান ও ব্যাখ্যা',
                                    fontSize: 13.5,
                                    fontWeight: pw.FontWeight.bold,
                                    color: PdfColor.fromHex('0F172A'),
                                  ),
                                  pw.SizedBox(height: 1.5),
                                  bn.AutoText(
                                    'উচ্চ মাধ্যমিক ও ভর্তি পরীক্ষা প্রস্তুতি · obhyash.com',
                                    fontSize: 7.2,
                                    color: PdfColor.fromHex('475569'),
                                  ),
                                ],
                              ),
                              pw.Container(
                                width: 85,
                                alignment: pw.Alignment.centerRight,
                                child: bn.AutoText(
                                  'সেট কোড: ক',
                                  fontSize: 8,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColor.fromHex('334155'),
                                ),
                              ),
                            ],
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
                        if (pageIdx < pages.length - 1) ...[
                          pw.Padding(
                            padding: const pw.EdgeInsets.only(bottom: 2),
                            child: bn.AutoText(
                              '[ অপর পৃষ্ঠায় দ্রষ্টব্য / চলমান পাতা - ${_toBanglaDigits(pageIdx + 2)} ]',
                              fontSize: 7,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('475569'),
                            ),
                          ),
                        ] else ...[
                          pw.Padding(
                            padding: const pw.EdgeInsets.only(bottom: 2),
                            child: bn.AutoText(
                              '— উত্তর ও ব্যাখ্যা সমাপ্ত (End of Solutions) —',
                              fontSize: 7.5,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('475569'),
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
        notificationTitle: '$cleanTitle — সমাধান ও ব্যাখ্যা',
        subtitle: 'ডাউনলোড সফল হয়েছে • ট্যাপ করে পিডিএফ দেখুন',
        context: context.mounted ? context : null,
      );

      if (file == null) {
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
