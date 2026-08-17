import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';
import '../../../core/services/download_notification_service.dart';
import '../../../core/utils/app_popups.dart';
import '../domain/exam_models.dart';

import 'package:open_filex/open_filex.dart';

class PdfDownloadService {
  /// Directly exports/downloads the question paper as a PDF file
  static Future<void> downloadQuestionPaper(
    ExamResult result,
    BuildContext context,
  ) async {
    final filename =
        '${result.subjectLabel ?? result.subject}_Question_Paper';
    final htmlContent = _generateQuestionPaperHtml(result);

    try {
      final pdfBytes = await Printing.convertHtml(
        format: PdfPageFormat.a4,
        html: htmlContent,
      );

      final file = await DownloadNotificationService().savePdfAndNotify(
        bytes: pdfBytes,
        rawFileName: filename,
        notificationTitle: 'প্রশ্নপত্র PDF ডাউনলোড সম্পন্ন হয়েছে ✅',
        context: context.mounted ? context : null,
      );

      if (file != null) {
        try {
          await OpenFilex.open(file.path);
        } catch (_) {}
      } else {
        await Printing.sharePdf(bytes: pdfBytes, filename: '$filename.pdf');
      }
    } catch (e) {
      debugPrint('[PdfDownloadService] downloadQuestionPaper direct save failed: $e. Falling back to layoutPdf...');
      try {
        await Printing.layoutPdf(
          name: '$filename.pdf',
          format: PdfPageFormat.a4,
          onLayout: (PdfPageFormat format) async {
            return await Printing.convertHtml(
              format: format,
              html: htmlContent,
            );
          },
        );
      } catch (innerError) {
        debugPrint('[PdfDownloadService] layoutPdf error: $innerError');
        if (context.mounted) {
          AppPopups.error(
            context,
            message: 'PDF তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করো।',
          );
        }
      }
    }
  }

  /// Directly exports/downloads the result & explanation as a PDF file
  static Future<void> downloadResultWithExplanations(
    ExamResult result,
    BuildContext context,
  ) async {
    final filename =
        '${result.subjectLabel ?? result.subject}_Result_Explanation';
    final htmlContent = _generateResultHtml(result);

    try {
      final pdfBytes = await Printing.convertHtml(
        format: PdfPageFormat.a4,
        html: htmlContent,
      );

      final file = await DownloadNotificationService().savePdfAndNotify(
        bytes: pdfBytes,
        rawFileName: filename,
        notificationTitle: 'ফলাফল ও ব্যাখ্যা PDF ডাউনলোড সম্পন্ন হয়েছে ✅',
        context: context.mounted ? context : null,
      );

      if (file != null) {
        try {
          await OpenFilex.open(file.path);
        } catch (_) {}
      } else {
        await Printing.sharePdf(bytes: pdfBytes, filename: '$filename.pdf');
      }
    } catch (e) {
      debugPrint('[PdfDownloadService] downloadResultWithExplanations direct save failed: $e. Falling back to layoutPdf...');
      try {
        await Printing.layoutPdf(
          name: '$filename.pdf',
          format: PdfPageFormat.a4,
          onLayout: (PdfPageFormat format) async {
            return await Printing.convertHtml(
              format: format,
              html: htmlContent,
            );
          },
        );
      } catch (innerError) {
        debugPrint('[PdfDownloadService] layoutPdf error: $innerError');
        if (context.mounted) {
          AppPopups.error(
            context,
            message: 'PDF তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করো।',
          );
        }
      }
    }
  }

  static String _renderLatex(String text) {
    // Replace common LaTeX superscripts & subscripts and equations for clean HTML rendering
    var rendered = text
        .replaceAll(r'\^2', '²')
        .replaceAll(r'\^3', '³')
        .replaceAll(r'\^-1', '⁻¹')
        .replaceAll(r'\^-2', '⁻²')
        .replaceAll(r'\^-3', '⁻³')
        .replaceAll(r'^2', '²')
        .replaceAll(r'^3', '³')
        .replaceAll(r'^-1', '⁻¹')
        .replaceAll(r'^-2', '⁻²')
        .replaceAll(r'^-3', '⁻³')
        .replaceAll(r'\times', '×')
        .replaceAll(r'\div', '÷')
        .replaceAll(r'\pm', '±')
        .replaceAll(r'\degree', '°')
        .replaceAll(r'\alpha', 'α')
        .replaceAll(r'\beta', 'β')
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
        .replaceAll(r'\Delta', 'Δ')
        .replaceAll(r'\Omega', 'Ω')
        .replaceAll(r'\text', '')
        .replaceAll(r'\textbf', '')
        .replaceAll(r'\mathbf', '')
        .replaceAll(r'\rm', '')
        .replaceAll(r'\frac', '')
        .replaceAll('\$', '')
        .replaceAll('{', '')
        .replaceAll('}', '')
        .replaceAll(r'\', '')
        .replaceAll('\n', '<br>');
    return rendered;
  }

  static String _generateQuestionPaperHtml(ExamResult result) {
    final questionsHtml = result.questions.asMap().entries.map((entry) {
      final idx = entry.key;
      final q = entry.value;

      final optionsHtml = q.options.asMap().entries.map((optEntry) {
        final oIdx = optEntry.key;
        final opt = optEntry.value;
        final prefix = ['ক', 'খ', 'গ', 'ঘ'][oIdx];
        return '''
          <li class="option-item">
            <span style="font-weight:bold;margin-right:4px">($prefix)</span><span>${_renderLatex(opt)}</span>
          </li>
        ''';
      }).join('');

      return '''
        <div class="question-item">
          <div class="q-header">
            <span class="q-num">${idx + 1}.</span>
            <span style="flex:1">${_renderLatex(q.question)}</span>
          </div>
          <ul class="options-list">
            $optionsHtml
          </ul>
        </div>
      ''';
    }).join('');

    return '''
      <!DOCTYPE html>
      <html lang="bn">
        <head>
          <meta charset="UTF-8">
          <title>${result.subject} - Question Paper</title>
          <style>
            @page { size: A4; margin: 1.2cm 1cm; }
            body { 
              font-family: 'Hind Siliguri', 'Noto Serif Bengali', 'Anek Bangla', 'SolaimanLipi', 'Kalpurush', sans-serif; 
              font-size: 10.5pt; 
              color: #000; 
              line-height: 1.4; 
              margin: 0; 
              padding: 0; 
            }
            .header-container { text-align: center; margin-bottom: 14px; }
            .header-top-bar { background: #004633; color: #fff; padding: 6px 12px; border-radius: 4px 4px 0 0; }
            .institution-name { font-size: 16pt; font-weight: 800; margin: 0; }
            .institution-sub { font-size: 8.5pt; margin-top: 1px; }
            .header-body { border: 2px solid #004633; border-top: none; padding: 8px 14px 10px; border-radius: 0 0 4px 4px; }
            .subject-title { font-size: 15pt; font-weight: 800; margin: 6px 0 2px; }
            .exam-type-badge { display: inline-block; border: 1.5px solid #004633; color: #004633; padding: 2px 12px; border-radius: 3px; font-weight: 700; margin-bottom: 8px; }
            .meta-table { width: 100%; border-top: 1px solid #ccc; padding-top: 5px; }
            .meta-table td { font-weight: 700; font-size: 9.5pt; }
            .content-wrapper { column-count: 2; column-gap: 30px; column-rule: 0.5px solid #ddd; }
            .question-item { break-inside: avoid; margin-bottom: 15px; }
            .q-header { display: flex; font-weight: bold; margin-bottom: 4px; }
            .q-num { min-width: 22px; font-weight: 800; }
            .options-list { list-style-type: none; padding: 0; margin: 0 0 0 22px; display: flex; flex-wrap: wrap; }
            .option-item { width: 50%; padding-right: 4px; margin-bottom: 2px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="header-top-bar">
              <div class="institution-name">অভ্যাস (Obhyash)</div>
              <div class="institution-sub">EXAM PLATFORM &nbsp;·&nbsp; obhyash.com</div>
            </div>
            <div class="header-body">
              <div class="subject-title">${result.subjectLabel ?? result.subject}</div>
              <div class="exam-type-badge">${result.examType?.isNotEmpty == true ? result.examType! : 'Practice Exam'}</div>
              <table class="meta-table">
                <tr>
                  <td width="33%">সময়: ${result.timeTaken ~/ 60} মিনিট</td>
                  <td width="33%" align="center">মোট প্রশ্ন: ${result.totalQuestions}</td>
                  <td width="33%" align="right">পূর্ণমান: ${result.totalMarks}</td>
                </tr>
              </table>
            </div>
          </div>
          <div class="content-wrapper">
            $questionsHtml
          </div>
        </body>
      </html>
    ''';
  }

  static String _generateResultHtml(ExamResult result) {
    final questionsHtml = result.questions.asMap().entries.map((entry) {
      final idx = entry.key;
      final q = entry.value;
      final userAnswer = result.userAnswers[q.id];
      final isSkipped = userAnswer == null;
      final isCorrect = !isSkipped && userAnswer == q.correctAnswerIndex;

      final optionsHtml = q.options.asMap().entries.map((optEntry) {
        final oIdx = optEntry.key;
        final opt = optEntry.value;
        final prefix = ['ক', 'খ', 'গ', 'ঘ'][oIdx];

        String color = '#000';
        String weight = 'normal';
        if (oIdx == q.correctAnswerIndex) {
          color = '#004633';
          weight = 'bold';
        } else if (oIdx == userAnswer && !isCorrect) {
          color = '#B91C1C';
        }

        return '''
          <li class="option-item" style="color: $color; font-weight: $weight">
            <span style="margin-right:4px">($prefix)</span><span>${_renderLatex(opt)}</span>
          </li>
        ''';
      }).join('');

      final explanationHtml =
          q.explanation != null && q.explanation!.isNotEmpty
              ? '''<div style="margin-top: 8px; padding: 8px; background: #f3f4f6; border-radius: 4px; font-size: 9pt;">
              <strong>ব্যাখ্যা:</strong><br/>${_renderLatex(q.explanation!)}
             </div>'''
              : '';

      String statusBadge = isSkipped
          ? '<span style="color:#6b7280">[অনুত্তর]</span>'
          : (isCorrect
              ? '<span style="color:#004633">[সঠিক]</span>'
              : '<span style="color:#b91c1c">[ভুল]</span>');

      return '''
        <div class="question-item">
          <div class="q-header">
            <span class="q-num">${idx + 1}.</span>
            <span style="flex:1">$statusBadge ${_renderLatex(q.question)}</span>
          </div>
          <ul class="options-list">
            $optionsHtml
          </ul>
          $explanationHtml
        </div>
      ''';
    }).join('');

    return '''
      <!DOCTYPE html>
      <html lang="bn">
        <head>
          <meta charset="UTF-8">
          <title>${result.subject} - Result & Explanation</title>
          <style>
            @page { size: A4; margin: 1.2cm 1cm; }
            body { 
              font-family: 'Hind Siliguri', 'Noto Serif Bengali', 'Anek Bangla', 'SolaimanLipi', 'Kalpurush', sans-serif; 
              font-size: 10.5pt; 
              color: #000; 
              line-height: 1.4; 
              margin: 0; 
              padding: 0; 
            }
            .header-container { text-align: center; margin-bottom: 14px; }
            .header-top-bar { background: #004633; color: #fff; padding: 6px 12px; border-radius: 4px 4px 0 0; }
            .institution-name { font-size: 16pt; font-weight: 800; margin: 0; }
            .header-body { border: 2px solid #004633; border-top: none; padding: 8px 14px 10px; border-radius: 0 0 4px 4px; }
            .subject-title { font-size: 15pt; font-weight: 800; margin: 6px 0 2px; }
            .meta-table { width: 100%; border-top: 1px solid #ccc; padding-top: 5px; }
            .meta-table td { font-weight: 700; font-size: 9.5pt; }
            .content-wrapper { column-count: 2; column-gap: 30px; column-rule: 0.5px solid #ddd; }
            .question-item { break-inside: avoid; margin-bottom: 20px; }
            .q-header { display: flex; font-weight: bold; margin-bottom: 4px; }
            .q-num { min-width: 22px; font-weight: 800; }
            .options-list { list-style-type: none; padding: 0; margin: 0 0 0 22px; display: flex; flex-wrap: wrap; }
            .option-item { width: 100%; padding-right: 4px; margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="header-top-bar">
              <div class="institution-name">অভ্যাস (Obhyash) - ফলাফল ও ব্যাখ্যা</div>
            </div>
            <div class="header-body">
              <div class="subject-title">${result.subjectLabel ?? result.subject}</div>
              <table class="meta-table">
                <tr>
                  <td width="33%">প্রাপ্ত নম্বর: ${result.score.toStringAsFixed(2)} / ${result.totalMarks}</td>
                  <td width="33%" align="center">সঠিক: ${result.correctCount} | ভুল: ${result.wrongCount}</td>
                  <td width="33%" align="right">সময়: ${result.timeTaken ~/ 60} মি ${result.timeTaken % 60} সে</td>
                </tr>
              </table>
            </div>
          </div>
          <div class="content-wrapper">
            $questionsHtml
          </div>
        </body>
      </html>
    ''';
  }
}
