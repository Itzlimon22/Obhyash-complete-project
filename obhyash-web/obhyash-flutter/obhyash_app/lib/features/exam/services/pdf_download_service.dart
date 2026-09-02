import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:open_filex/open_filex.dart';
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

  /// Converts LaTeX, math formulas, units, and markdown into clean, professional Unicode for PDF printing.
  static String _formatMathForPdf(String raw) {
    if (raw.trim().isEmpty) return '';

    var t = raw;

    // 0. Normalize newlines & HTML breaks
    t = t
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll('&nbsp;', ' ')
        .replaceAll(r'\r\n', '\n')
        .replaceAll(r'\r', '\n');

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
      r'\Leftarrow': '⇐',
      r'\Leftrightarrow': '⇔',
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

    // 6. Square root: \sqrt{a} -> √(a), \sqrt[n]{a} -> ⁿ√(a)
    t = t.replaceAllMapped(
      RegExp(r'\\sqrt\[([^\]]*)\]\{([^{}]*)\}'),
      (m) => '${_toSuperscript(m.group(1)!)}√(${m.group(2)})',
    );
    t = t.replaceAllMapped(
      RegExp(r'\\sqrt\{([^{}]*)\}'),
      (m) => '√(${m.group(1)})',
    );

    // 7. Unit vectors & vector arrows: \hat{i} -> î, \vec{A} -> A⃗
    t = t
        .replaceAll(r'\hat{i}', 'î')
        .replaceAll(r'\hat{j}', 'ĵ')
        .replaceAll(r'\hat{k}', 'k̂')
        .replaceAll(r'\hat i', 'î')
        .replaceAll(r'\hat j', 'ĵ')
        .replaceAll(r'\hat k', 'k̂');

    t = t.replaceAllMapped(
      RegExp(r'\\vec\{?([a-zA-Z])\}?'),
      (m) => '${m.group(1)}⃗',
    );

    // 8. Superscripts & powers: x^{2} -> x², 10^{-5} -> 10⁻⁵
    t = t.replaceAllMapped(
      RegExp(r'\^\{?([0-9\+\-nNxXtyT]+)\}?'),
      (m) => _toSuperscript(m.group(1)!),
    );

    // 9. Subscripts: z_{1} -> z₁, H_2O -> H₂O
    t = t.replaceAllMapped(
      RegExp(r'\_\{?([0-9\+\-a-zA-Z]+)\}?'),
      (m) => _toSubscript(m.group(1)!),
    );

    // 10. Clean \text{...}, \mathrm{...}, \mathbf{...}, \left, \right
    t = t.replaceAllMapped(
      RegExp(r'\\(?:text|mathrm|mathbf|mathit|textnormal)\{([^{}]*)\}'),
      (m) => m.group(1)!,
    );
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

    // 11. Clean remaining dollar signs, backticks, asterisks
    t = t
        .replaceAll(RegExp(r'\$\$|\$'), '')
        .replaceAll(RegExp(r'\*\*'), '')
        .replaceAll(RegExp(r'`'), '')
        .replaceAll(RegExp(r'\\'), '')
        .trim();

    return t;
  }

  static String _renderQuestionMeta(Question q) {
    if (q.examHistory.isNotEmpty) {
      final parts = q.examHistory
          .map((h) {
            final label = h.code.isNotEmpty ? h.code : h.institute;
            final yr = h.year > 0 ? ' ${_toBanglaDigits(h.year)}' : '';
            return '$label$yr'.trim();
          })
          .where((s) => s.isNotEmpty)
          .toList();
      if (parts.isNotEmpty) return '[${parts.join(', ')}]';
    }
    final List<String> parts = [];
    if (q.institutes.isNotEmpty) {
      parts.add(q.institutes.join(', '));
    }
    if (q.years.isNotEmpty) {
      parts.add(q.years.map((y) => _toBanglaDigits(y)).join(', '));
    }
    if (parts.isEmpty) return '';
    return '[${parts.join(' - ')}]';
  }

  /// Directly generates and downloads the Question Paper as a standard 2-Column Print-Ready PDF
  static Future<void> downloadQuestionPaper(
    ExamResult result,
    BuildContext context,
  ) async {
    final examTitle = result.subjectLabel?.isNotEmpty == true
        ? result.subjectLabel!
        : BanglaNameHelper.formatSubject(result.subject);
    final filename = '${examTitle}_Question_Paper_${DateTime.now().millisecondsSinceEpoch}';

    try {
      final banglaRegular = await PdfGoogleFonts.hindSiliguriRegular();
      final banglaBold = await PdfGoogleFonts.hindSiliguriBold();
      final notoSansBn = await PdfGoogleFonts.notoSansBengaliRegular();
      final notoSansBnBold = await PdfGoogleFonts.notoSansBengaliBold();
      final roboto = await PdfGoogleFonts.robotoRegular();
      final robotoBold = await PdfGoogleFonts.robotoBold();

      final theme = pw.ThemeData.withFont(
        base: banglaRegular,
        bold: banglaBold,
        fontFallback: [banglaRegular, banglaBold, notoSansBn, notoSansBnBold, roboto, robotoBold],
      );

      final pdf = pw.Document(theme: theme);
      const optionLetters = ['(ক)', '(খ)', '(গ)', '(ঘ)'];

      final questions = result.questions;
      final totalQ = questions.length;
      final durationMins = result.timeTaken > 0
          ? (result.timeTaken / 60).ceil()
          : totalQ;

      // Calculate distinct main subjects for multi-subject section dividers
      final distinctMainSubjects = questions
          .map((q) => BanglaNameHelper.getMainSubjectName(q.subject, q.subjectLabel))
          .toSet();
      final hasMultipleSubjects = distinctMainSubjects.length > 1;

      // Chunk questions per page (Page 1 fits ~14 questions in 2 columns of 7; Page 2+ fits ~16 questions in 2 columns of 8)
      final List<List<Question>> pages = [];
      int currentIdx = 0;

      while (currentIdx < totalQ) {
        final isFirstPage = pages.isEmpty;
        final countForThisPage = isFirstPage ? 14 : 16;
        final endIdx = (currentIdx + countForThisPage > totalQ)
            ? totalQ
            : currentIdx + countForThisPage;
        pages.add(questions.sublist(currentIdx, endIdx));
        currentIdx = endIdx;
      }

      int globalQuestionNumber = 1;
      String lastSubjectName = '';

      for (int pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        final pageQuestions = pages[pageIdx];
        final isFirstPage = pageIdx == 0;

        // Split this page's questions into Left Column & Right Column serially
        final halfCount = (pageQuestions.length / 2).ceil();
        final leftList = pageQuestions.sublist(0, halfCount);
        final rightList = pageQuestions.sublist(halfCount);

        pdf.addPage(
          pw.Page(
            pageFormat: PdfPageFormat.a4,
            margin: const pw.EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            theme: theme,
            build: (pw.Context ctx) {
              pw.Widget buildQuestionItem(Question q, int number) {
                final currentSub = BanglaNameHelper.getMainSubjectName(q.subject, q.subjectLabel);
                final showSubjectHeader = hasMultipleSubjects && currentSub != lastSubjectName;
                if (showSubjectHeader) {
                  lastSubjectName = currentSub;
                }

                final meta = _renderQuestionMeta(q);
                final formattedStem = _formatMathForPdf(q.question);

                return pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 8),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      if (showSubjectHeader) ...[
                        pw.Container(
                          margin: const pw.EdgeInsets.only(top: 4, bottom: 6),
                          alignment: pw.Alignment.center,
                          child: pw.Text(
                            '— $currentSub —',
                            style: pw.TextStyle(
                              fontSize: 9.5,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('1F2937'),
                            ),
                          ),
                        ),
                      ],
                      // Question Stem (No card border)
                      pw.Row(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(
                            '${_toBanglaDigits(number)}. ',
                            style: pw.TextStyle(
                              fontSize: 8.5,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('111827'),
                            ),
                          ),
                          pw.Expanded(
                            child: pw.Text(
                              formattedStem,
                              style: pw.TextStyle(
                                fontSize: 8.5,
                                fontWeight: pw.FontWeight.bold,
                                color: PdfColor.fromHex('111827'),
                                lineSpacing: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (meta.isNotEmpty)
                        pw.Padding(
                          padding: const pw.EdgeInsets.only(left: 12, top: 1, bottom: 2),
                          child: pw.Text(
                            meta,
                            style: pw.TextStyle(
                              fontSize: 6.5,
                              color: PdfColor.fromHex('6B7280'),
                              fontStyle: pw.FontStyle.italic,
                            ),
                          ),
                        ),
                      pw.SizedBox(height: 2.5),
                      // Options in 2x2 grid
                      pw.Padding(
                        padding: const pw.EdgeInsets.only(left: 12),
                        child: pw.Column(
                          children: [
                            pw.Row(
                              crossAxisAlignment: pw.CrossAxisAlignment.start,
                              children: [
                                if (q.options.isNotEmpty)
                                  pw.Expanded(
                                    child: pw.Text(
                                      '${optionLetters[0]} ${_formatMathForPdf(q.options[0])}',
                                      style: const pw.TextStyle(fontSize: 7.8),
                                    ),
                                  ),
                                if (q.options.length > 1)
                                  pw.Expanded(
                                    child: pw.Text(
                                      '${optionLetters[1]} ${_formatMathForPdf(q.options[1])}',
                                      style: const pw.TextStyle(fontSize: 7.8),
                                    ),
                                  ),
                              ],
                            ),
                            if (q.options.length > 2) ...[
                              pw.SizedBox(height: 1.5),
                              pw.Row(
                                crossAxisAlignment: pw.CrossAxisAlignment.start,
                                children: [
                                  pw.Expanded(
                                    child: pw.Text(
                                      '${optionLetters[2]} ${_formatMathForPdf(q.options[2])}',
                                      style: const pw.TextStyle(fontSize: 7.8),
                                    ),
                                  ),
                                  if (q.options.length > 3)
                                    pw.Expanded(
                                      child: pw.Text(
                                        '${optionLetters[3]} ${_formatMathForPdf(q.options[3])}',
                                        style: const pw.TextStyle(fontSize: 7.8),
                                      ),
                                    ),
                                ],
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
              int leftStartNumber = globalQuestionNumber;
              for (final q in leftList) {
                leftWidgets.add(buildQuestionItem(q, leftStartNumber++));
              }

              // Build Right Column Items
              final rightWidgets = <pw.Widget>[];
              int rightStartNumber = leftStartNumber;
              for (final q in rightList) {
                rightWidgets.add(buildQuestionItem(q, rightStartNumber++));
              }

              // Advance global number for next page
              globalQuestionNumber = rightStartNumber;

              return pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                children: [
                  if (isFirstPage) ...[
                    // Clean Grey Exam Header (Middle Aligned)
                    pw.Container(
                      alignment: pw.Alignment.center,
                      child: pw.Column(
                        children: [
                          pw.Text(
                            'অভ্যাস — $examTitle',
                            style: pw.TextStyle(
                              fontSize: 15,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('1F2937'),
                            ),
                          ),
                          pw.SizedBox(height: 2),
                          pw.Text(
                            'EXAM PLATFORM · obhyash.com',
                            style: pw.TextStyle(
                              fontSize: 8,
                              color: PdfColor.fromHex('4B5563'),
                              letterSpacing: 0.5,
                            ),
                          ),
                          pw.SizedBox(height: 6),
                          // Grey Bordered Metadata Bar
                          pw.Container(
                            padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                            decoration: pw.BoxDecoration(
                              color: PdfColor.fromHex('F9FAFB'),
                              border: pw.Border.all(color: PdfColor.fromHex('D1D5DB'), width: 0.8),
                              borderRadius: pw.BorderRadius.circular(4),
                            ),
                            child: pw.Row(
                              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                              children: [
                                pw.Text(
                                  'সময়: ${_toBanglaDigits(durationMins)} মিনিট',
                                  style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('374151')),
                                ),
                                pw.Text(
                                  'মোট প্রশ্ন: ${_toBanglaDigits(totalQ)}টি',
                                  style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('374151')),
                                ),
                                pw.Text(
                                  'পূর্ণমান: ${_toBanglaDigits(result.totalMarks.toInt())}',
                                  style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('374151')),
                                ),
                                pw.Text(
                                  'নেগেটিভ: ${_toBanglaDigits(result.negativeMarking)}x',
                                  style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('374151')),
                                ),
                              ],
                            ),
                          ),
                          pw.SizedBox(height: 10),
                          pw.Divider(color: PdfColor.fromHex('9CA3AF'), thickness: 0.8),
                          pw.SizedBox(height: 6),
                        ],
                      ),
                    ),
                  ] else ...[
                    // Running Minimal Top Header on subsequent pages
                    pw.Container(
                      padding: const pw.EdgeInsets.only(bottom: 6),
                      child: pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text(
                            '$examTitle — প্রশ্নপত্র',
                            style: pw.TextStyle(fontSize: 8, color: PdfColor.fromHex('6B7280')),
                          ),
                          pw.Text(
                            'পৃষ্ঠা ${_toBanglaDigits(pageIdx + 1)} / ${_toBanglaDigits(pages.length)}',
                            style: pw.TextStyle(fontSize: 8, color: PdfColor.fromHex('6B7280')),
                          ),
                        ],
                      ),
                    ),
                    pw.Divider(color: PdfColor.fromHex('E5E7EB'), thickness: 0.6),
                    pw.SizedBox(height: 6),
                  ],

                  // 2-Column Body: Left Column then Right Column serially
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
                          color: PdfColor.fromHex('E5E7EB'),
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
                    alignment: pw.Alignment.center,
                    child: pw.Text(
                      'obhyash.com · পৃষ্ঠা ${_toBanglaDigits(pageIdx + 1)}',
                      style: pw.TextStyle(fontSize: 7.5, color: PdfColor.fromHex('9CA3AF')),
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
    final examTitle = result.subjectLabel?.isNotEmpty == true
        ? result.subjectLabel!
        : BanglaNameHelper.formatSubject(result.subject);
    final filename = '${examTitle}_Solution_Explanation_${DateTime.now().millisecondsSinceEpoch}';

    try {
      final banglaRegular = await PdfGoogleFonts.hindSiliguriRegular();
      final banglaBold = await PdfGoogleFonts.hindSiliguriBold();
      final notoSansBn = await PdfGoogleFonts.notoSansBengaliRegular();
      final notoSansBnBold = await PdfGoogleFonts.notoSansBengaliBold();
      final roboto = await PdfGoogleFonts.robotoRegular();
      final robotoBold = await PdfGoogleFonts.robotoBold();

      final theme = pw.ThemeData.withFont(
        base: banglaRegular,
        bold: banglaBold,
        fontFallback: [banglaRegular, banglaBold, notoSansBn, notoSansBnBold, roboto, robotoBold],
      );

      final pdf = pw.Document(theme: theme);
      const optionLetters = ['(ক)', '(খ)', '(গ)', '(ঘ)'];

      final questions = result.questions;
      final totalQ = questions.length;
      final unattemptedCount = totalQ - result.correctCount - result.wrongCount;

      // Calculate distinct main subjects
      final distinctMainSubjects = questions
          .map((q) => BanglaNameHelper.getMainSubjectName(q.subject, q.subjectLabel))
          .toSet();
      final hasMultipleSubjects = distinctMainSubjects.length > 1;

      // Solution pages chunking: Page 1 holds ~8 questions (2 cols of 4), Page 2+ holds ~10 questions (2 cols of 5)
      final List<List<Question>> pages = [];
      int currentIdx = 0;

      while (currentIdx < totalQ) {
        final isFirstPage = pages.isEmpty;
        final countForThisPage = isFirstPage ? 8 : 10;
        final endIdx = (currentIdx + countForThisPage > totalQ)
            ? totalQ
            : currentIdx + countForThisPage;
        pages.add(questions.sublist(currentIdx, endIdx));
        currentIdx = endIdx;
      }

      int globalQuestionNumber = 1;
      String lastSubjectName = '';

      for (int pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        final pageQuestions = pages[pageIdx];
        final isFirstPage = pageIdx == 0;

        // Split this page's questions into Left Column & Right Column serially
        final halfCount = (pageQuestions.length / 2).ceil();
        final leftList = pageQuestions.sublist(0, halfCount);
        final rightList = pageQuestions.sublist(halfCount);

        pdf.addPage(
          pw.Page(
            pageFormat: PdfPageFormat.a4,
            margin: const pw.EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            theme: theme,
            build: (pw.Context ctx) {
              pw.Widget buildSolutionItem(Question q, int number) {
                final currentSub = BanglaNameHelper.getMainSubjectName(q.subject, q.subjectLabel);
                final showSubjectHeader = hasMultipleSubjects && currentSub != lastSubjectName;
                if (showSubjectHeader) {
                  lastSubjectName = currentSub;
                }

                final userAnsIdx = result.userAnswers[q.id];
                final isCorrect = q.isCorrectAnswer(userAnsIdx);
                final isSkipped = userAnsIdx == null;
                final meta = _renderQuestionMeta(q);

                final correctLetter = (q.correctAnswerIndex >= 0 && q.correctAnswerIndex < optionLetters.length)
                    ? optionLetters[q.correctAnswerIndex]
                    : '';
                final correctText = (q.correctAnswerIndex >= 0 && q.correctAnswerIndex < q.options.length)
                    ? q.options[q.correctAnswerIndex]
                    : '';

                return pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 10),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      if (showSubjectHeader) ...[
                        pw.Container(
                          margin: const pw.EdgeInsets.only(top: 4, bottom: 6),
                          alignment: pw.Alignment.center,
                          child: pw.Text(
                            '— $currentSub —',
                            style: pw.TextStyle(
                              fontSize: 9.5,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('1F2937'),
                            ),
                          ),
                        ),
                      ],
                      // Question Stem
                      pw.Row(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(
                            '${_toBanglaDigits(number)}. ',
                            style: pw.TextStyle(
                              fontSize: 8.5,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('111827'),
                            ),
                          ),
                          pw.Expanded(
                            child: pw.Text(
                              _formatMathForPdf(q.question),
                              style: pw.TextStyle(
                                fontSize: 8.5,
                                fontWeight: pw.FontWeight.bold,
                                color: PdfColor.fromHex('111827'),
                                lineSpacing: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (meta.isNotEmpty)
                        pw.Padding(
                          padding: const pw.EdgeInsets.only(left: 12, top: 1, bottom: 2),
                          child: pw.Text(
                            meta,
                            style: pw.TextStyle(
                              fontSize: 6.5,
                              color: PdfColor.fromHex('6B7280'),
                              fontStyle: pw.FontStyle.italic,
                            ),
                          ),
                        ),
                      pw.SizedBox(height: 2),
                      // Options List
                      pw.Padding(
                        padding: const pw.EdgeInsets.only(left: 12),
                        child: pw.Column(
                          children: [
                            pw.Row(
                              crossAxisAlignment: pw.CrossAxisAlignment.start,
                              children: [
                                if (q.options.isNotEmpty)
                                  pw.Expanded(
                                    child: pw.Text(
                                      '${optionLetters[0]} ${_formatMathForPdf(q.options[0])}',
                                      style: const pw.TextStyle(fontSize: 7.5),
                                    ),
                                  ),
                                if (q.options.length > 1)
                                  pw.Expanded(
                                    child: pw.Text(
                                      '${optionLetters[1]} ${_formatMathForPdf(q.options[1])}',
                                      style: const pw.TextStyle(fontSize: 7.5),
                                    ),
                                  ),
                              ],
                            ),
                            if (q.options.length > 2) ...[
                              pw.SizedBox(height: 1.5),
                              pw.Row(
                                crossAxisAlignment: pw.CrossAxisAlignment.start,
                                children: [
                                  pw.Expanded(
                                    child: pw.Text(
                                      '${optionLetters[2]} ${_formatMathForPdf(q.options[2])}',
                                      style: const pw.TextStyle(fontSize: 7.5),
                                    ),
                                  ),
                                  if (q.options.length > 3)
                                    pw.Expanded(
                                      child: pw.Text(
                                        '${optionLetters[3]} ${_formatMathForPdf(q.options[3])}',
                                        style: const pw.TextStyle(fontSize: 7.5),
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                      pw.SizedBox(height: 3),
                      // Solution & Explanation Box (Clean Grey Theme)
                      pw.Container(
                        width: double.infinity,
                        margin: const pw.EdgeInsets.only(left: 10),
                        padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                        decoration: pw.BoxDecoration(
                          color: PdfColor.fromHex('F9FAFB'),
                          border: pw.Border(
                            left: pw.BorderSide(color: PdfColor.fromHex('4B5563'), width: 1.5),
                          ),
                          borderRadius: const pw.BorderRadius.horizontal(
                            right: pw.Radius.circular(3),
                          ),
                        ),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Row(
                              children: [
                                pw.Text(
                                  'সঠিক উত্তর: ',
                                  style: pw.TextStyle(fontSize: 7.5, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('374151')),
                                ),
                                pw.Expanded(
                                  child: pw.Text(
                                    '$correctLetter ${_formatMathForPdf(correctText)}',
                                    style: pw.TextStyle(
                                      fontSize: 7.5,
                                      fontWeight: pw.FontWeight.bold,
                                      color: PdfColor.fromHex('15803D'),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            if (!isSkipped) ...[
                              pw.SizedBox(height: 1.5),
                              pw.Row(
                                children: [
                                  pw.Text(
                                    'তোমার উত্তর: ',
                                    style: pw.TextStyle(fontSize: 7.5, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('4B5563')),
                                  ),
                                  pw.Text(
                                    '${optionLetters[userAnsIdx]} ${isCorrect ? "✓ (সঠিক)" : "✗ (ভুল)"}',
                                    style: pw.TextStyle(
                                      fontSize: 7.5,
                                      fontWeight: pw.FontWeight.bold,
                                      color: isCorrect
                                          ? PdfColor.fromHex('15803D')
                                          : PdfColor.fromHex('DC2626'),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                            if (q.explanation != null && q.explanation!.trim().isNotEmpty) ...[
                              pw.SizedBox(height: 2),
                              pw.Text(
                                'ব্যাখ্যা: ${_formatMathForPdf(q.explanation!)}',
                                style: pw.TextStyle(
                                  fontSize: 7.2,
                                  color: PdfColor.fromHex('374151'),
                                  lineSpacing: 1.3,
                                ),
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
              int leftStartNumber = globalQuestionNumber;
              for (final q in leftList) {
                leftWidgets.add(buildSolutionItem(q, leftStartNumber++));
              }

              // Build Right Column Items
              final rightWidgets = <pw.Widget>[];
              int rightStartNumber = leftStartNumber;
              for (final q in rightList) {
                rightWidgets.add(buildSolutionItem(q, rightStartNumber++));
              }

              // Advance global number for next page
              globalQuestionNumber = rightStartNumber;

              return pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                children: [
                  if (isFirstPage) ...[
                    // Clean Grey Solution Header (Middle Aligned)
                    pw.Container(
                      alignment: pw.Alignment.center,
                      child: pw.Column(
                        children: [
                          pw.Text(
                            '$examTitle — সমাধান ও ব্যাখ্যা',
                            style: pw.TextStyle(
                              fontSize: 14.5,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('1F2937'),
                            ),
                          ),
                          pw.SizedBox(height: 2),
                          pw.Text(
                            'EXAM PLATFORM · obhyash.com',
                            style: pw.TextStyle(
                              fontSize: 8,
                              color: PdfColor.fromHex('4B5563'),
                              letterSpacing: 0.5,
                            ),
                          ),
                          pw.SizedBox(height: 6),
                          // Results Summary Bar (Grey)
                          pw.Container(
                            padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                            decoration: pw.BoxDecoration(
                              color: PdfColor.fromHex('F9FAFB'),
                              border: pw.Border.all(color: PdfColor.fromHex('D1D5DB'), width: 0.8),
                              borderRadius: pw.BorderRadius.circular(4),
                            ),
                            child: pw.Row(
                              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                              children: [
                                pw.Text(
                                  '🎯 প্রাপ্ত নম্বর: ${_toBanglaDigits(result.score.toStringAsFixed(2))} / ${_toBanglaDigits(result.totalMarks.toInt())}',
                                  style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('1F2937')),
                                ),
                                pw.Text(
                                  '✓ সঠিক: ${_toBanglaDigits(result.correctCount)}',
                                  style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('15803D')),
                                ),
                                pw.Text(
                                  '✗ ভুল: ${_toBanglaDigits(result.wrongCount)}',
                                  style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('DC2626')),
                                ),
                                pw.Text(
                                  '⚪ অনুত্তর: ${_toBanglaDigits(unattemptedCount > 0 ? unattemptedCount : 0)}',
                                  style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('4B5563')),
                                ),
                              ],
                            ),
                          ),
                          pw.SizedBox(height: 10),
                          pw.Divider(color: PdfColor.fromHex('9CA3AF'), thickness: 0.8),
                          pw.SizedBox(height: 6),
                        ],
                      ),
                    ),
                  ] else ...[
                    // Running Minimal Top Header
                    pw.Container(
                      padding: const pw.EdgeInsets.only(bottom: 6),
                      child: pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text(
                            '$examTitle — সমাধান ও ব্যাখ্যা',
                            style: pw.TextStyle(fontSize: 8, color: PdfColor.fromHex('6B7280')),
                          ),
                          pw.Text(
                            'পৃষ্ঠা ${_toBanglaDigits(pageIdx + 1)} / ${_toBanglaDigits(pages.length)}',
                            style: pw.TextStyle(fontSize: 8, color: PdfColor.fromHex('6B7280')),
                          ),
                        ],
                      ),
                    ),
                    pw.Divider(color: PdfColor.fromHex('E5E7EB'), thickness: 0.6),
                    pw.SizedBox(height: 6),
                  ],

                  // 2-Column Body: Left Column then Right Column serially
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
                          color: PdfColor.fromHex('E5E7EB'),
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
                    alignment: pw.Alignment.center,
                    child: pw.Text(
                      'obhyash.com · পৃষ্ঠা ${_toBanglaDigits(pageIdx + 1)}',
                      style: pw.TextStyle(fontSize: 7.5, color: PdfColor.fromHex('9CA3AF')),
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
