import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:open_filex/open_filex.dart';
import '../../../core/services/download_notification_service.dart';
import '../../../core/utils/app_popups.dart';
import '../domain/exam_models.dart';

class PdfDownloadService {
  static String _toBanglaDigits(dynamic number) {
    const en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    String s = number.toString();
    for (int i = 0; i < 10; i++) {
      s = s.replaceAll(en[i], bn[i]);
    }
    return s;
  }

  static String _cleanMathAndMarkdown(String text) {
    if (text.isEmpty) return '';

    return text
        .replaceAll(r'\^2', '²')
        .replaceAll(r'\^3', '³')
        .replaceAll(r'\^-1', '⁻¹')
        .replaceAll(r'\^-2', '⁻²')
        .replaceAll(r'^2', '²')
        .replaceAll(r'^3', '³')
        .replaceAll(r'^-1', '⁻¹')
        .replaceAll(r'^-2', '⁻²')
        .replaceAll(r'\times', '×')
        .replaceAll(r'\div', '÷')
        .replaceAll(r'\pm', '±')
        .replaceAll(r'\degree', '°')
        .replaceAll(r'\alpha', 'α')
        .replaceAll(r'\beta', 'β')
        .replaceAll(r'\gamma', 'γ')
        .replaceAll(r'\theta', 'θ')
        .replaceAll(r'\pi', 'π')
        .replaceAll(r'\lambda', 'λ')
        .replaceAll(r'\mu', 'µ')
        .replaceAll(r'\le', '≤')
        .replaceAll(r'\ge', '≥')
        .replaceAll(r'\ne', '≠')
        .replaceAll(r'\approx', '≈')
        .replaceAll(r'\infty', '∞')
        .replaceAll(r'\rightarrow', '→')
        .replaceAll(r'\leftarrow', '←')
        .replaceAll(r'\Delta', 'Δ')
        .replaceAll(r'\Omega', 'Ω')
        .replaceAll(r'\text', '')
        .replaceAll(r'\frac', '')
        .replaceAll(r'\sqrt', '√')
        .replaceAll(RegExp(r'\$\$|\$'), '')
        .replaceAll(RegExp(r'\*\*|\*'), '')
        .replaceAll(RegExp(r'`'), '')
        .replaceAll(RegExp(r'[{}]'), '')
        .replaceAll(RegExp(r'\\'), ' ')
        .trim();
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

  /// Directly generates and downloads the Question Paper as a high-quality PDF
  static Future<void> downloadQuestionPaper(
    ExamResult result,
    BuildContext context,
  ) async {
    final subjectName = result.subjectLabel ?? result.subject;
    final filename = '${subjectName}_Question_Paper_${DateTime.now().millisecondsSinceEpoch}';

    try {
      final banglaRegular = await PdfGoogleFonts.notoSerifBengaliRegular();
      final banglaBold = await PdfGoogleFonts.notoSerifBengaliBold();
      final timesRegular = await PdfGoogleFonts.tinosRegular();
      final timesBold = await PdfGoogleFonts.tinosBold();

      final theme = pw.ThemeData.withFont(
        base: banglaRegular,
        bold: banglaBold,
        fontFallback: [banglaRegular, banglaBold, timesRegular, timesBold],
      );

      final pdf = pw.Document(theme: theme);
      const optionLetters = ['(ক)', '(খ)', '(গ)', '(ঘ)'];

      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          theme: theme,
          build: (pw.Context ctx) {
            return [
              // Header Top Bar
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: pw.BoxDecoration(
                  color: PdfColor.fromHex('004633'),
                  borderRadius: const pw.BorderRadius.vertical(top: pw.Radius.circular(6)),
                ),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      'অভ্যাস (Obhyash)',
                      style: pw.TextStyle(
                        color: PdfColors.white,
                        fontSize: 14,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.Text(
                      'EXAM PLATFORM · obhyash.com',
                      style: const pw.TextStyle(
                        color: PdfColors.white,
                        fontSize: 8.5,
                      ),
                    ),
                  ],
                ),
              ),

              // Header Metadata Body
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: pw.BoxDecoration(
                  color: PdfColor.fromHex('F8FAF9'),
                  border: pw.Border.all(color: PdfColor.fromHex('004633'), width: 1.2),
                  borderRadius: const pw.BorderRadius.vertical(bottom: pw.Radius.circular(6)),
                ),
                child: pw.Column(
                  children: [
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text(
                          subjectName,
                          style: pw.TextStyle(
                            fontSize: 14,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('004633'),
                          ),
                        ),
                        pw.Container(
                          padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: pw.BoxDecoration(
                            color: PdfColor.fromHex('E8F5E9'),
                            borderRadius: pw.BorderRadius.circular(4),
                            border: pw.Border.all(color: PdfColor.fromHex('A5D6A7')),
                          ),
                          child: pw.Text(
                            result.examType ?? 'মডেল টেস্ট',
                            style: pw.TextStyle(
                              fontSize: 9,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('004633'),
                            ),
                          ),
                        ),
                      ],
                    ),
                    pw.SizedBox(height: 6),
                    pw.Divider(color: PdfColor.fromHex('D1D5DB'), thickness: 0.8),
                    pw.SizedBox(height: 4),
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text(
                          '⏱️ সময়: ${_toBanglaDigits((result.timeTaken > 0 ? (result.timeTaken / 60).ceil() : result.totalQuestions))} মিনিট',
                          style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold),
                        ),
                        pw.Text(
                          '📄 মোট প্রশ্ন: ${_toBanglaDigits(result.totalQuestions)} টি',
                          style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold),
                        ),
                        pw.Text(
                          '✍️ পূর্ণমান: ${_toBanglaDigits(result.totalMarks.toInt())}',
                          style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 14),

              // Questions List (Strict 2-Column Format)
              ...() {
                final entries = result.questions.asMap().entries.toList();
                final List<List<MapEntry<int, dynamic>>> chunks = [];
                for (var i = 0; i < entries.length; i += 2) {
                  chunks.add(entries.sublist(i, i + 2 > entries.length ? entries.length : i + 2));
                }

                return chunks.map((pair) {
                  pw.Widget buildCard(MapEntry<int, dynamic> entry) {
                    final idx = entry.key + 1;
                    final q = entry.value;
                    final meta = _renderQuestionMeta(q);

                    return pw.Container(
                      margin: const pw.EdgeInsets.only(bottom: 8),
                      padding: const pw.EdgeInsets.all(6),
                      decoration: pw.BoxDecoration(
                        color: PdfColors.white,
                        border: pw.Border.all(color: PdfColor.fromHex('E5E7EB'), width: 0.7),
                        borderRadius: pw.BorderRadius.circular(4),
                      ),
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Row(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: [
                              pw.Container(
                                width: 18,
                                child: pw.Text(
                                  '${_toBanglaDigits(idx)}.',
                                  style: pw.TextStyle(
                                    fontSize: 9,
                                    fontWeight: pw.FontWeight.bold,
                                    color: PdfColor.fromHex('004633'),
                                  ),
                                ),
                              ),
                              pw.Expanded(
                                child: pw.Text(
                                  _cleanMathAndMarkdown(q.question),
                                  style: pw.TextStyle(
                                    fontSize: 9,
                                    fontWeight: pw.FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (meta.isNotEmpty)
                            pw.Padding(
                              padding: const pw.EdgeInsets.only(left: 18, top: 2, bottom: 2),
                              child: pw.Text(
                                meta,
                                style: pw.TextStyle(
                                  fontSize: 7,
                                  color: PdfColors.grey700,
                                  fontStyle: pw.FontStyle.italic,
                                ),
                              ),
                            ),
                          pw.SizedBox(height: 3),
                          pw.Padding(
                            padding: const pw.EdgeInsets.only(left: 18),
                            child: pw.Column(
                              children: [
                                pw.Row(
                                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                                  children: [
                                    if (q.options.isNotEmpty)
                                      pw.Expanded(
                                        child: pw.Text(
                                          '${optionLetters[0]} ${_cleanMathAndMarkdown(q.options[0])}',
                                          style: const pw.TextStyle(fontSize: 8),
                                        ),
                                      ),
                                    if (q.options.length > 1)
                                      pw.Expanded(
                                        child: pw.Text(
                                          '${optionLetters[1]} ${_cleanMathAndMarkdown(q.options[1])}',
                                          style: const pw.TextStyle(fontSize: 8),
                                        ),
                                      ),
                                  ],
                                ),
                                if (q.options.length > 2) ...[
                                  pw.SizedBox(height: 2),
                                  pw.Row(
                                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                                    children: [
                                      pw.Expanded(
                                        child: pw.Text(
                                          '${optionLetters[2]} ${_cleanMathAndMarkdown(q.options[2])}',
                                          style: const pw.TextStyle(fontSize: 8),
                                        ),
                                      ),
                                      if (q.options.length > 3)
                                        pw.Expanded(
                                          child: pw.Text(
                                            '${optionLetters[3]} ${_cleanMathAndMarkdown(q.options[3])}',
                                            style: const pw.TextStyle(fontSize: 8),
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

                  return pw.Row(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Expanded(child: buildCard(pair[0])),
                      pw.SizedBox(width: 8),
                      if (pair.length > 1)
                        pw.Expanded(child: buildCard(pair[1]))
                      else
                        pw.Expanded(child: pw.Container()),
                    ],
                  );
                });
              }(),
            ];
          },
        ),
      );

      final bytes = await pdf.save();

      final file = await DownloadNotificationService().savePdfAndNotify(
        bytes: bytes,
        rawFileName: filename,
        notificationTitle: '$subjectName প্রশ্নপত্র PDF ডাউনলোড সম্পন্ন হয়েছে ✅',
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

  /// Directly generates and downloads Question Paper with Correct Answers & Explanations
  static Future<void> downloadResultWithExplanations(
    ExamResult result,
    BuildContext context,
  ) async {
    final subjectName = result.subjectLabel ?? result.subject;
    final filename = '${subjectName}_Solution_Explanation_${DateTime.now().millisecondsSinceEpoch}';

    try {
      final banglaRegular = await PdfGoogleFonts.notoSerifBengaliRegular();
      final banglaBold = await PdfGoogleFonts.notoSerifBengaliBold();
      final timesRegular = await PdfGoogleFonts.tinosRegular();
      final timesBold = await PdfGoogleFonts.tinosBold();

      final theme = pw.ThemeData.withFont(
        base: banglaRegular,
        bold: banglaBold,
        fontFallback: [banglaRegular, banglaBold, timesRegular, timesBold],
      );

      final pdf = pw.Document(theme: theme);
      const optionLetters = ['(ক)', '(খ)', '(গ)', '(ঘ)'];

      final unattemptedCount = result.totalQuestions - result.correctCount - result.wrongCount;

      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          theme: theme,
          build: (pw.Context ctx) {
            return [
              // Header Top Bar
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: pw.BoxDecoration(
                  color: PdfColor.fromHex('004633'),
                  borderRadius: const pw.BorderRadius.vertical(top: pw.Radius.circular(6)),
                ),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      'অভ্যাস (Obhyash)',
                      style: pw.TextStyle(
                        color: PdfColors.white,
                        fontSize: 14,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.Text(
                      'সমাধান ও বিস্তারিত ব্যাখ্যা · obhyash.com',
                      style: const pw.TextStyle(
                        color: PdfColors.white,
                        fontSize: 8.5,
                      ),
                    ),
                  ],
                ),
              ),

              // Header Metadata Body
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: pw.BoxDecoration(
                  color: PdfColor.fromHex('F8FAF9'),
                  border: pw.Border.all(color: PdfColor.fromHex('004633'), width: 1.2),
                  borderRadius: const pw.BorderRadius.vertical(bottom: pw.Radius.circular(6)),
                ),
                child: pw.Column(
                  children: [
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text(
                          '$subjectName — সমাধান ও ব্যাখ্যা',
                          style: pw.TextStyle(
                            fontSize: 13.5,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('004633'),
                          ),
                        ),
                        pw.Container(
                          padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: pw.BoxDecoration(
                            color: PdfColor.fromHex('E8F5E9'),
                            borderRadius: pw.BorderRadius.circular(4),
                            border: pw.Border.all(color: PdfColor.fromHex('A5D6A7')),
                          ),
                          child: pw.Text(
                            result.examType ?? 'ফলাফল শিট',
                            style: pw.TextStyle(
                              fontSize: 9,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColor.fromHex('004633'),
                            ),
                          ),
                        ),
                      ],
                    ),
                    pw.SizedBox(height: 6),
                    pw.Divider(color: PdfColor.fromHex('D1D5DB'), thickness: 0.8),
                    pw.SizedBox(height: 4),

                    // Results Summary Bar
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text(
                          '🎯 প্রাপ্ত নম্বর: ${_toBanglaDigits(result.score)} / ${_toBanglaDigits(result.totalMarks.toInt())}',
                          style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('004633')),
                        ),
                        pw.Text(
                          '✅ সঠিক: ${_toBanglaDigits(result.correctCount)}',
                          style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('15803D')),
                        ),
                        pw.Text(
                          '❌ ভুল: ${_toBanglaDigits(result.wrongCount)}',
                          style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('B91C1C')),
                        ),
                        pw.Text(
                          '⚪ অনুত্তরিত: ${_toBanglaDigits(unattemptedCount > 0 ? unattemptedCount : 0)}',
                          style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('4B5563')),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 14),

              // Questions with Solutions (Strict 2-Column Format)
              ...() {
                final entries = result.questions.asMap().entries.toList();
                final List<List<MapEntry<int, dynamic>>> chunks = [];
                for (var i = 0; i < entries.length; i += 2) {
                  chunks.add(entries.sublist(i, i + 2 > entries.length ? entries.length : i + 2));
                }

                return chunks.map((pair) {
                  pw.Widget buildSolutionCard(MapEntry<int, dynamic> entry) {
                    final idx = entry.key + 1;
                    final q = entry.value;
                    final userAnsIdx = result.userAnswers[q.id];
                    final isCorrect = userAnsIdx == q.correctAnswerIndex;
                    final isSkipped = userAnsIdx == null;
                    final meta = _renderQuestionMeta(q);

                    final correctLetter = (q.correctAnswerIndex >= 0 && q.correctAnswerIndex < optionLetters.length)
                        ? optionLetters[q.correctAnswerIndex]
                        : '';
                    final correctText = (q.correctAnswerIndex >= 0 && q.correctAnswerIndex < q.options.length)
                        ? q.options[q.correctAnswerIndex]
                        : '';

                    return pw.Container(
                      margin: const pw.EdgeInsets.only(bottom: 8),
                      padding: const pw.EdgeInsets.all(6),
                      decoration: pw.BoxDecoration(
                        color: PdfColors.white,
                        border: pw.Border.all(color: PdfColor.fromHex('E5E7EB'), width: 0.7),
                        borderRadius: pw.BorderRadius.circular(4),
                      ),
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          // Question Title
                          pw.Row(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: [
                              pw.Container(
                                width: 18,
                                child: pw.Text(
                                  '${_toBanglaDigits(idx)}.',
                                  style: pw.TextStyle(
                                    fontSize: 9,
                                    fontWeight: pw.FontWeight.bold,
                                    color: PdfColor.fromHex('004633'),
                                  ),
                                ),
                              ),
                              pw.Expanded(
                                child: pw.Text(
                                  _cleanMathAndMarkdown(q.question),
                                  style: pw.TextStyle(
                                    fontSize: 9,
                                    fontWeight: pw.FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),

                          if (meta.isNotEmpty)
                            pw.Padding(
                              padding: const pw.EdgeInsets.only(left: 18, top: 2, bottom: 2),
                              child: pw.Text(
                                meta,
                                style: pw.TextStyle(
                                  fontSize: 7,
                                  color: PdfColors.grey700,
                                  fontStyle: pw.FontStyle.italic,
                                ),
                              ),
                            ),

                          pw.SizedBox(height: 3),

                          // Options List
                          pw.Padding(
                            padding: const pw.EdgeInsets.only(left: 18),
                            child: pw.Column(
                              children: [
                                pw.Row(
                                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                                  children: [
                                    if (q.options.isNotEmpty)
                                      pw.Expanded(
                                        child: pw.Text(
                                          '${optionLetters[0]} ${_cleanMathAndMarkdown(q.options[0])}',
                                          style: const pw.TextStyle(fontSize: 8),
                                        ),
                                      ),
                                    if (q.options.length > 1)
                                      pw.Expanded(
                                        child: pw.Text(
                                          '${optionLetters[1]} ${_cleanMathAndMarkdown(q.options[1])}',
                                          style: const pw.TextStyle(fontSize: 8),
                                        ),
                                      ),
                                  ],
                                ),
                                if (q.options.length > 2) ...[
                                  pw.SizedBox(height: 2),
                                  pw.Row(
                                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                                    children: [
                                      pw.Expanded(
                                        child: pw.Text(
                                          '${optionLetters[2]} ${_cleanMathAndMarkdown(q.options[2])}',
                                          style: const pw.TextStyle(fontSize: 8),
                                        ),
                                      ),
                                      if (q.options.length > 3)
                                        pw.Expanded(
                                          child: pw.Text(
                                            '${optionLetters[3]} ${_cleanMathAndMarkdown(q.options[3])}',
                                            style: const pw.TextStyle(fontSize: 8),
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),

                          pw.SizedBox(height: 4),

                          // Solution Box
                          pw.Container(
                            width: double.infinity,
                            padding: const pw.EdgeInsets.all(5),
                            margin: const pw.EdgeInsets.only(left: 14),
                            decoration: pw.BoxDecoration(
                              color: PdfColor.fromHex('F9FAFB'),
                              border: pw.Border(
                                left: pw.BorderSide(color: PdfColor.fromHex('004633'), width: 2),
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
                                      'সঠিক: ',
                                      style: pw.TextStyle(fontSize: 7.5, fontWeight: pw.FontWeight.bold),
                                    ),
                                    pw.Expanded(
                                      child: pw.Text(
                                        '$correctLetter ${_cleanMathAndMarkdown(correctText)}',
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
                                  pw.SizedBox(height: 2),
                                  pw.Row(
                                    children: [
                                      pw.Text(
                                        'তোমার: ',
                                        style: pw.TextStyle(fontSize: 7.5, fontWeight: pw.FontWeight.bold),
                                      ),
                                      pw.Expanded(
                                        child: pw.Text(
                                          '${optionLetters[userAnsIdx]} ${isCorrect ? "[সঠিক]" : "[ভুল]"}',
                                          style: pw.TextStyle(
                                            fontSize: 7.5,
                                            fontWeight: pw.FontWeight.bold,
                                            color: isCorrect
                                                ? PdfColor.fromHex('15803D')
                                                : PdfColor.fromHex('B91C1C'),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                                if (q.explanation != null && q.explanation!.trim().isNotEmpty) ...[
                                  pw.SizedBox(height: 2),
                                  pw.Text(
                                    'ব্যাখ্যা: ${_cleanMathAndMarkdown(q.explanation!)}',
                                    style: const pw.TextStyle(
                                      fontSize: 7.5,
                                      color: PdfColors.grey800,
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

                  return pw.Row(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Expanded(child: buildSolutionCard(pair[0])),
                      pw.SizedBox(width: 8),
                      if (pair.length > 1)
                        pw.Expanded(child: buildSolutionCard(pair[1]))
                      else
                        pw.Expanded(child: pw.Container()),
                    ],
                  );
                });
              }(),
            ];
          },
        ),
      );

      final bytes = await pdf.save();

      final file = await DownloadNotificationService().savePdfAndNotify(
        bytes: bytes,
        rawFileName: filename,
        notificationTitle: '$subjectName ফলাফল ও ব্যাখ্যা PDF ডাউনলোড সম্পন্ন ✅',
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
