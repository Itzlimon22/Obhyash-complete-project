import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';
import 'package:flutter/material.dart';
import '../domain/exam_models.dart';

class PdfDownloadService {
  static Future<void> downloadQuestionPaper(ExamResult result, BuildContext context) async {
    final htmlContent = _generateQuestionPaperHtml(result);

    try {
      final pdfBytes = await Printing.convertHtml(
        format: PdfPageFormat.a4,
        html: htmlContent,
      );

      await Printing.sharePdf(
        bytes: pdfBytes,
        filename: '${result.subjectLabel ?? result.subject}_Question_Paper.pdf',
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('PDF তৈরি করতে সমস্যা হয়েছে: $e')),
        );
      }
    }
  }

  static Future<void> downloadResultWithExplanations(ExamResult result, BuildContext context) async {
    final htmlContent = _generateResultHtml(result);

    try {
      final pdfBytes = await Printing.convertHtml(
        format: PdfPageFormat.a4,
        html: htmlContent,
      );

      await Printing.sharePdf(
        bytes: pdfBytes,
        filename: '${result.subjectLabel ?? result.subject}_Result_Explanation.pdf',
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('PDF তৈরি করতে সমস্যা হয়েছে: $e')),
        );
      }
    }
  }

  static String _renderLatex(String text) {
    // Basic replacements to make math render properly with KaTeX in HTML
    return text.replaceAll('\n', '<br>');
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
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
            onload="renderMathInElement(document.body, {delimiters: [{left: '\\\$\\\$', right: '\\\$\\\$', display: true}, {left: '\\\$', right: '\\\$', display: false}]});"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700;800&display=swap');
            @page { size: A4; margin: 1.2cm 1cm; }
            body { font-family: 'Noto Serif Bengali', serif; font-size: 10.5pt; color: #000; line-height: 1.4; margin: 0; padding: 0; }
            .header-container { text-align: center; margin-bottom: 14px; }
            .header-top-bar { background: #000; color: #fff; padding: 6px 12px; }
            .institution-name { font-size: 16pt; font-weight: 800; margin: 0; }
            .institution-sub { font-size: 8.5pt; margin-top: 1px; }
            .header-body { border: 2.5px solid #000; border-top: none; padding: 8px 14px 10px; }
            .subject-title { font-size: 15pt; font-weight: 800; margin: 6px 0 2px; }
            .exam-type-badge { display: inline-block; border: 1.5px solid #000; padding: 2px 12px; border-radius: 3px; font-weight: 700; margin-bottom: 8px; }
            .meta-table { width: 100%; border-top: 1px solid #ccc; padding-top: 5px; }
            .meta-table td { font-weight: 700; font-size: 9.5pt; }
            .content-wrapper { column-count: 2; column-gap: 30px; column-rule: 0.5px solid #000; }
            .question-item { break-inside: avoid; margin-bottom: 15px; }
            .q-header { display: flex; font-weight: bold; margin-bottom: 4px; }
            .q-num { min-width: 22px; }
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
              <div class="exam-type-badge">${result.examType ?? 'Practice Exam'}</div>
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
    // Similar to question paper, but showing correct answers, user answers and explanations
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
          color = '#047857'; // green
          weight = 'bold';
        } else if (oIdx == userAnswer && !isCorrect) {
          color = '#B91C1C'; // red
        }
        
        return '''
          <li class="option-item" style="color: $color; font-weight: $weight">
            <span style="margin-right:4px">($prefix)</span><span>${_renderLatex(opt)}</span>
          </li>
        ''';
      }).join('');

      final explanationHtml = q.explanation != null && q.explanation!.isNotEmpty
        ? '''<div style="margin-top: 8px; padding: 8px; background: #f3f4f6; border-radius: 4px; font-size: 9pt;">
              <strong>ব্যাখ্যা:</strong><br/>${_renderLatex(q.explanation!)}
             </div>'''
        : '';

      String statusIcon = isSkipped ? '⚪' : (isCorrect ? '✅' : '❌');

      return '''
        <div class="question-item">
          <div class="q-header">
            <span class="q-num">${idx + 1}.</span>
            <span style="flex:1">[$statusIcon] ${_renderLatex(q.question)}</span>
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
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
            onload="renderMathInElement(document.body, {delimiters: [{left: '\\\$\\\$', right: '\\\$\\\$', display: true}, {left: '\\\$', right: '\\\$', display: false}]});"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700;800&display=swap');
            @page { size: A4; margin: 1.2cm 1cm; }
            body { font-family: 'Noto Serif Bengali', serif; font-size: 10.5pt; color: #000; line-height: 1.4; margin: 0; padding: 0; }
            .header-container { text-align: center; margin-bottom: 14px; }
            .header-top-bar { background: #000; color: #fff; padding: 6px 12px; }
            .institution-name { font-size: 16pt; font-weight: 800; margin: 0; }
            .header-body { border: 2.5px solid #000; border-top: none; padding: 8px 14px 10px; }
            .subject-title { font-size: 15pt; font-weight: 800; margin: 6px 0 2px; }
            .meta-table { width: 100%; border-top: 1px solid #ccc; padding-top: 5px; }
            .meta-table td { font-weight: 700; font-size: 9.5pt; }
            .content-wrapper { column-count: 2; column-gap: 30px; column-rule: 0.5px solid #000; }
            .question-item { break-inside: avoid; margin-bottom: 20px; }
            .q-header { display: flex; font-weight: bold; margin-bottom: 4px; }
            .q-num { min-width: 22px; }
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
