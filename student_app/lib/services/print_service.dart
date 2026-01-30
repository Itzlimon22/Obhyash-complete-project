import 'dart:convert';
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';
import '../models/exam_types.dart'; // Ensure these models exist in your project

class PrintService {
  // Helper to mimic the Katex pre-rendering.
  // Note: In pure Dart, we cannot execute the 'katex' JS library directly to render to string.
  // We return the raw string, but we include the Katex Auto-render script in the HTML
  // so the browser's print engine handles it.
  String _renderLatex(String? text) {
    if (text == null || text.isEmpty) return '';
    // In Dart HTML generation, we will let the browser/print-engine handle the rendering
    // via the script tags included in the HTML head.
    return text;
  }

  // ----------------------------------------------------------------------
  // 1. PRINT QUESTION PAPER
  // ----------------------------------------------------------------------
  Future<void> printQuestionPaper(
    ExamDetails details,
    List<Question> questions,
  ) async {
    final htmlContent =
        '''
      <!DOCTYPE html>
      <html lang="bn">
        <head>
          <meta charset="UTF-8">
          <title>${details.subject} - Question Paper</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
              onload="renderMathInElement(document.body);"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&family=Times+New+Roman:ital,wght@0,400;0,700;1,400&display=swap');
            
            @page {
              size: A4;
              margin: 1.5cm;
            }

            body { 
              font-family: 'Times New Roman', 'Noto Serif Bengali', serif; 
              font-size: 11pt; 
              color: #000;
              line-height: 1.4;
              margin: 0;
              -webkit-print-color-adjust: exact;
            }

            /* Header Styling */
            .header-container {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .institution-name {
              font-size: 22pt;
              font-weight: bold;
              text-transform: uppercase;
              margin: 0;
              letter-spacing: 1px;
            }
            .exam-title {
              font-size: 14pt;
              font-weight: bold;
              margin: 5px 0 15px 0;
              border: 1px solid #000;
              display: inline-block;
              padding: 5px 20px;
              border-radius: 4px;
            }
            
            .meta-table {
              width: 100%;
              margin-top: 15px;
              border-collapse: collapse;
            }
            .meta-table td {
              padding: 4px 0;
              font-weight: bold;
              font-size: 10pt;
              vertical-align: bottom;
            }
            .meta-label {
              white-space: nowrap;
              margin-right: 5px;
            }
            .meta-group-left { text-align: left; width: 35%; }
            .meta-group-center { text-align: center; width: 30%; }
            .meta-group-right { text-align: right; width: 35%; }

            /* Instructions */
            .instructions {
              font-size: 9pt;
              font-style: italic;
              text-align: center;
              margin-top: 5px;
            }

            /* Content Columns */
            .content-wrapper {
              column-count: 2;
              column-gap: 40px;
              column-rule: 1px solid #ccc;
            }

            /* Question Item */
            .question-item {
              break-inside: avoid; 
              page-break-inside: avoid;
              margin-bottom: 12px;
              position: relative;
            }
            .q-header {
              display: flex;
              align-items: baseline;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .q-num {
              min-width: 25px;
            }
            .q-text {
              flex: 1;
            }
            .q-marks {
              font-size: 9pt;
              margin-left: 5px;
              white-space: nowrap;
            }

            /* Options Grid */
            .options-list {
              list-style-type: none;
              padding: 0;
              margin: 0 0 0 25px;
              display: flex;
              flex-wrap: wrap;
            }
            .option-item {
              width: 50%; /* 2 options per row within the column */
              box-sizing: border-box;
              padding-right: 5px;
              margin-bottom: 2px;
            }
            
            .option-item-inner {
              display: flex;
            }
            .opt-label {
              font-weight: bold;
              margin-right: 5px;
              min-width: 20px;
            }

            @media print {
              .content-wrapper { column-count: 2; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1 class="institution-name">Zenith Exam Platform</h1>
            <div class="exam-title">${details.subject}</div>
            <div style="font-size: 10pt; margin-top: -10px; margin-bottom: 10px;">${details.examType}</div>
            
            <table class="meta-table">
              <tr>
                <td class="meta-group-left">
                  <span class="meta-label">Time:</span> ${details.durationMinutes} Minutes
                </td>
                <td class="meta-group-center">
                   <span class="meta-label">Chapter:</span> ${details.chapters}
                </td>
                <td class="meta-group-right">
                  <span class="meta-label">Full Marks:</span> ${details.totalMarks}
                </td>
              </tr>
              <tr>
                <td colspan="3" style="padding-top: 15px;">
                   <span class="meta-label">Student Name:</span> 
                   <span style="border-bottom: 1px dotted #000; width: 60%; display: inline-block;"></span>
                </td>
              </tr>
              <tr>
                <td colspan="3" style="padding-top: 5px;">
                   <span class="meta-label">ID/Roll No:</span>
                   <span style="border-bottom: 1px dotted #000; width: 30%; display: inline-block;"></span>
                   <span class="meta-label" style="margin-left: 20px;">Date:</span>
                   <span style="border-bottom: 1px dotted #000; width: 30%; display: inline-block;"></span>
                </td>
              </tr>
            </table>
            <div class="instructions">
              N.B. – The figures in the right margin indicate full marks. Answer all questions.
            </div>
          </div>

          <div class="content-wrapper">
            ${questions.asMap().entries.map((entry) {
          final idx = entry.key;
          final q = entry.value;
          final labels = ['a', 'b', 'c', 'd'];

          return '''
                <div class="question-item">
                  <div class="q-header">
                    <span class="q-num">${idx + 1}.</span>
                    <span class="q-text">${_renderLatex(q.text)}</span>
                    <span class="q-marks">[${q.points}]</span>
                  </div>
                  <ul class="options-list">
                    ${q.options.asMap().entries.map((optEntry) {
            final oIdx = optEntry.key;
            final opt = optEntry.value;
            return '''
                        <li class="option-item">
                          <div class="option-item-inner">
                            <span class="opt-label">(${labels[oIdx]})</span>
                            <span>${_renderLatex(opt)}</span>
                          </div>
                        </li>
                      ''';
          }).join('')}
                  </ul>
                </div>
              ''';
        }).join('')}
          </div>
        </body>
      </html>
    ''';

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async =>
          await Printing.convertHtml(format: format, html: htmlContent),
    );
  }

  // ----------------------------------------------------------------------
  // 2. PRINT OMR SHEET
  // ----------------------------------------------------------------------
  Future<void> printOMRSheet(ExamDetails details, int totalQuestions) async {
    const QUESTIONS_PER_COL = 25;
    const COLS_PER_PAGE = 4;
    const QUESTIONS_PER_PAGE = QUESTIONS_PER_COL * COLS_PER_PAGE;
    final totalPages = (totalQuestions / QUESTIONS_PER_PAGE).ceil();

    // -- Helper Render Functions --
    String renderNumberColumn() {
      final rows = List.generate(
        10,
        (i) => '<div class="bubble-small">$i</div>',
      ).join('');
      return '<div class="num-col">$rows</div>';
    }

    String renderRollNoBlock(int digits) {
      final cols = List.generate(
        digits,
        (i) =>
            '''
          <div class="roll-col-container">
              <div class="roll-box"></div>
              ${renderNumberColumn()}
          </div>
      ''',
      ).join('');
      return '<div class="roll-grid">$cols</div>';
    }

    String renderQuestionColumn(int startIdx, int endIdx) {
      String html = '';
      for (int i = startIdx; i < endIdx; i++) {
        final qNum = i + 1;
        final exists = i < totalQuestions;
        final opacity = exists ? 1 : 0.15;

        html +=
            '''
            <div class="omr-row" style="opacity: $opacity">
                <span class="q-num">$qNum</span>
                <div class="bubbles-group">
                    <div class="bubble">A</div>
                    <div class="bubble">B</div>
                    <div class="bubble">C</div>
                    <div class="bubble">D</div>
                </div>
            </div>
        ''';
      }
      return '<div class="q-column">$html</div>';
    }

    // Generate pages
    String pagesHtml = '';

    for (int page = 0; page < totalPages; page++) {
      final pageStartQ = page * QUESTIONS_PER_PAGE;

      // QR Data JSON
      final qrDataMap = {
        "sub": details.subject.length > 10
            ? details.subject.substring(0, 10)
            : details.subject,
        "type": (details.examType != null && details.examType!.length > 5)
            ? details.examType!.substring(0, 5)
            : details.examType,
        "pg": page + 1,
        "tot": totalPages,
      };
      final qrData = jsonEncode(qrDataMap);
      final qrUrl =
          "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${Uri.encodeComponent(qrData)}";

      String columnsHtml = '';
      for (int c = 0; c < COLS_PER_PAGE; c++) {
        final colStart = pageStartQ + (c * QUESTIONS_PER_COL);
        final colEnd = colStart + QUESTIONS_PER_COL;
        columnsHtml += renderQuestionColumn(colStart, colEnd);
      }

      pagesHtml +=
          '''
        <div class="page-container">
            <div class="fiducial tl"></div>
            <div class="fiducial tr"></div>
            <div class="fiducial bl"></div>
            <div class="fiducial br"></div>

            <div class="header">
                <div class="header-left">
                    <h1>OMR SHEET</h1>
                    <div class="exam-meta">
                        <div><strong>Subject:</strong> ${details.subject}</div>
                        <div><strong>Exam Type:</strong> ${details.examType}</div>
                    </div>
                </div>
                <div class="header-right">
                    <img src="$qrUrl" class="qr-code" alt="Scan Code" />
                    <div class="page-info">Page ${page + 1} of $totalPages</div>
                </div>
            </div>

            ${page == 0 ? '''
            <div class="identity-section">
                <div class="roll-block">
                    <span class="section-label">STUDENT ID</span>
                    ${renderRollNoBlock(6)}
                </div>
                <div class="instructions-block">
                      <strong>INSTRUCTIONS:</strong><br>
                      1. Use Black/Blue Ball Point Pen.<br>
                      2. Darken circle completely.<br>
                      3. Keep sheet flat. Do not fold.<br>
                      <div class="example-row">
                        <span style="font-size:10px">Correct:</span>
                        <div class="bubble filled" style="width:14px;height:14px;font-size:8px">A</div>
                        <span style="font-size:10px; margin-left:5px">Wrong:</span>
                        <div class="bubble" style="width:14px;height:14px;font-size:8px">A</div>
                      </div>
                </div>
                 <div class="roll-block">
                    <span class="section-label">SET CODE</span>
                    ${renderRollNoBlock(3)}
                </div>
            </div>
            ''' : '<div style="height: 20px;"></div>'}

            <div class="questions-container">
                $columnsHtml
            </div>

            <div class="footer">
                <div class="sig-box">Signature of Candidate</div>
                <div class="sig-box">Signature of Invigilator</div>
            </div>
        </div>
      ''';
    }

    final htmlContent =
        '''
      <!DOCTYPE html>
      <html>
        <head>
          <title>OMR Sheet</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
              
              @page {
                  size: A4;
                  margin: 0;
              }

              body { 
                  font-family: 'Roboto', sans-serif; 
                  margin: 0; padding: 0; 
                  background: white; 
              }

              .page-container {
                  position: relative;
                  width: 210mm;
                  height: 297mm;
                  background: white;
                  margin: 0 auto;
                  margin-bottom: 20px;
                  padding: 10mm; 
                  box-sizing: border-box;
                  page-break-after: always;
                  overflow: hidden;
              }

              /* Fiducial Markers */
              .fiducial {
                  position: absolute;
                  width: 15px;
                  height: 15px;
                  background: black;
                  z-index: 999;
              }
              .tl { top: 10mm; left: 10mm; }
              .tr { top: 10mm; right: 10mm; }
              .bl { bottom: 10mm; left: 10mm; }
              .br { bottom: 10mm; right: 10mm; }

              .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  border-bottom: 2px solid #000;
                  padding-bottom: 10px;
                  margin-bottom: 15px;
                  margin-top: 10px;
              }
              .header h1 {
                  margin: 0;
                  font-size: 24px;
                  font-weight: 900;
                  letter-spacing: 2px;
              }
              .exam-meta { font-size: 12px; margin-top: 5px; }
              .header-right { text-align: right; }
              .qr-code { width: 60px; height: 60px; }
              .page-info { font-size: 10px; font-weight: bold; margin-top: 2px; }

              /* Identity Section */
              .identity-section {
                  display: flex;
                  justify-content: space-between;
                  gap: 10px;
                  margin-bottom: 15px;
                  border-bottom: 1px dashed #aaa;
                  padding-bottom: 15px;
              }
              .roll-block { text-align: center; }
              .section-label { font-size: 10px; font-weight: bold; display: block; margin-bottom: 4px; }
              
              .roll-grid { display: flex; gap: 3px; }
              .roll-col-container { display: flex; flex-direction: column; align-items: center; }
              .roll-box { width: 18px; height: 22px; border: 1px solid #000; margin-bottom: 4px; }
              .num-col { display: flex; flex-direction: column; gap: 2px; }
              .bubble-small {
                  width: 14px; height: 14px; border-radius: 50%; border: 1px solid #000;
                  font-size: 8px; display: flex; align-items: center; justify-content: center; color: #555;
              }

              .instructions-block {
                  flex: 1;
                  font-size: 10px;
                  border: 1px solid #000;
                  padding: 5px;
                  margin: 0 10px;
              }
              .example-row { display: flex; align-items: center; gap: 4px; margin-top: 5px; }

              /* Questions Grid */
              .questions-container {
                  display: flex;
                  justify-content: space-between;
                  height: 75%;
              }
              .q-column {
                  width: 23%;
                  border-right: 1px dotted #ccc;
                  padding-right: 5px;
              }
              .q-column:last-child { border: none; }
              
              .omr-row {
                  display: flex;
                  align-items: center;
                  margin-bottom: 6px; 
              }
              .q-num {
                  width: 20px;
                  font-size: 11px;
                  font-weight: bold;
                  text-align: right;
                  margin-right: 6px;
              }
              .bubbles-group { display: flex; gap: 6px; }
              .bubble {
                  width: 18px; height: 18px;
                  border-radius: 50%;
                  border: 1px solid #000;
                  font-size: 9px;
                  display: flex; align-items: center; justify-content: center;
                  font-weight: bold;
                  color: #444;
              }
              .bubble.filled { background: #000; color: #fff; }

              .footer {
                  position: absolute;
                  bottom: 15mm;
                  left: 10mm; right: 10mm;
                  display: flex;
                  justify-content: space-between;
              }
              .sig-box {
                  width: 40%;
                  border-top: 1px solid #000;
                  text-align: center;
                  font-size: 10px;
                  padding-top: 2px;
              }

              @media print {
                  body { background: none; }
                  .page-container { margin: 0; border: none; box-shadow: none; page-break-after: always; }
              }
          </style>
        </head>
        <body>
          $pagesHtml
        </body>
      </html>
    ''';

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async =>
          await Printing.convertHtml(format: format, html: htmlContent),
    );
  }

  // ----------------------------------------------------------------------
  // 3. PRINT RESULTS WITH EXPLANATIONS
  // ----------------------------------------------------------------------
  Future<void> printResultWithExplanations(
    ExamDetails details,
    List<Question> questions,
    Map<int, int> userAnswers,
  ) async {
    final htmlContent =
        '''
      <!DOCTYPE html>
      <html lang="bn">
        <head>
          <meta charset="UTF-8">
          <title>${details.subject} - Results</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
              onload="renderMathInElement(document.body);"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&family=Times+New+Roman:ital,wght@0,400;0,700;1,400&display=swap');
            
            body { 
              font-family: 'Times New Roman', 'Noto Serif Bengali', serif; 
              padding: 40px; 
              font-size: 10.5pt;
              color: #000;
              line-height: 1.4;
              max-width: 210mm;
              margin: 0 auto;
            }

            /* Header Styling */
            .header-container {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .institution-name {
              font-size: 20pt;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 0;
            }
            .report-title {
              font-size: 16pt;
              font-weight: bold;
              margin: 5px 0;
              text-decoration: underline;
            }
            .exam-subject {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 10px;
            }
            
            .meta-box {
              border: 1px solid #000;
              padding: 8px 15px;
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-weight: bold;
              background: #f9f9f9;
            }
            @media print { .meta-box { background: none; } }

            /* 2 Column Layout */
            .content-wrapper {
              column-count: 2;
              column-gap: 30px;
              column-rule: 1px solid #ccc;
            }

            .question-item {
              break-inside: avoid;
              page-break-inside: avoid;
              margin-bottom: 15px;
              border-bottom: 1px dotted #ccc;
              padding-bottom: 10px;
            }
            
            .q-header {
              display: flex;
              align-items: baseline;
              font-weight: bold;
              margin-bottom: 4px;
              font-size: 11pt;
            }
            .q-num { min-width: 22px; }
            .q-text { flex: 1; }
            
            /* Status Indicator for B/W */
            .status-indicator {
               float: right;
               font-size: 8pt;
               border: 1px solid #000;
               padding: 1px 4px;
               border-radius: 3px;
               margin-left: 5px;
               text-transform: uppercase;
               font-family: sans-serif;
            }

            /* Options */
            .options-list {
              list-style: none;
              padding: 0;
              margin: 5px 0 0 15px;
            }
            .option-row {
              margin-bottom: 2px;
              display: flex;
            }
            .opt-marker {
              width: 22px;
              font-weight: bold;
            }
            .opt-text {
              flex: 1;
            }
            
            /* Styling for answers in B/W */
            .opt-correct-style {
              font-weight: bold;
              text-decoration: underline;
            }
            .opt-wrong-user-style {
              font-style: italic;
            }
            .opt-label-user {
              font-size: 8pt;
              font-weight: bold;
              margin-left: 5px;
              font-family: sans-serif;
            }

            .explanation-box {
              margin-top: 8px;
              padding: 5px 8px;
              border-left: 3px solid #000;
              font-size: 9.5pt;
            }
            .exp-label {
              font-weight: bold;
              text-decoration: underline;
              font-size: 9pt;
              margin-right: 5px;
            }

            @media print {
              body { padding: 0; margin: 1cm; }
              .content-wrapper { column-count: 2; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1 class="institution-name">Zenith Exam Platform</h1>
            <div class="report-title">RESULT SHEET</div>
            <div class="exam-subject">Subject: ${details.subject}</div>
            <div style="font-size:10pt;">${details.examType}</div>
            
            <div class="meta-box">
               <div>Name: ________________</div>
               <div>Total Marks: ${details.totalMarks}</div>
            </div>
          </div>
          
          <div class="content-wrapper">
            ${questions.asMap().entries.map((entry) {
          final idx = entry.key;
          final q = entry.value;
          final userAnswer = userAnswers[q.id];
          final isCorrect = userAnswer == q.correctAnswerIndex;
          final isSkipped = userAnswer == null;

          String statusHtml = '';
          if (isSkipped)
            statusHtml = '<span class="status-indicator">[SKIPPED]</span>';
          else if (isCorrect)
            statusHtml = '<span class="status-indicator" style="background: #eee;">[CORRECT]</span>';
          else
            statusHtml = '<span class="status-indicator">[WRONG]</span>';

          final labels = ['a', 'b', 'c', 'd'];

          return '''
                <div class="question-item">
                  <div class="q-header">
                     <span class="q-num">${idx + 1}.</span>
                     <span class="q-text">${_renderLatex(q.text)}</span>
                     $statusHtml
                  </div>
                  <ul class="options-list">
                     ${q.options.asMap().entries.map((optEntry) {
            final oIdx = optEntry.key;
            final opt = optEntry.value;
            final isCorrectOpt = q.correctAnswerIndex == oIdx;
            final isUserOpt = userAnswer == oIdx;

            String styleClass = '';
            String label = '';

            if (isCorrectOpt) {
              styleClass = 'opt-correct-style';
              label = ' (✔ Correct)';
            }
            if (isUserOpt && !isCorrectOpt) {
              styleClass = 'opt-wrong-user-style';
              label = ' (✘ Your Choice)';
            }
            if (isUserOpt && isCorrectOpt) {
              label = ' (✔ Your Answer)';
            }

            return '''
                          <li class="option-row">
                            <span class="opt-marker">(${labels[oIdx]})</span>
                            <span class="opt-text $styleClass">${_renderLatex(opt)} <span class="opt-label-user">$label</span></span>
                          </li>
                        ''';
          }).join('')}
                  </ul>
                  <div class="explanation-box">
                     <span class="exp-label">Explanation:</span> ${_renderLatex(q.explanation?.isEmpty == true ? 'N/A' : q.explanation)}
                  </div>
                </div>
              ''';
        }).join('')}
          </div>
          
          <div style="margin-top: 30px; border-top: 1px solid #000; padding-top: 5px; font-size: 8pt; text-align: center;">
             Generated by Zenith Exam Platform
          </div>
        </body>
      </html>
    ''';

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async =>
          await Printing.convertHtml(format: format, html: htmlContent),
    );
  }

  // ----------------------------------------------------------------------
  // 4. CONVENIENCE WRAPPERS FOR EXAM RESULT
  // ----------------------------------------------------------------------

  Future<void> generateQuestionPaper(ExamResult result) async {
    final details = _mapResultToDetails(result);
    // If questions are missing in result, we can't print much.
    // Assuming result.questions is populated (which it should be if fetched).
    await printQuestionPaper(details, result.questions ?? []);
  }

  Future<void> generateResultPdf(ExamResult result) async {
    final details = _mapResultToDetails(result);
    await printResultWithExplanations(
      details,
      result.questions ?? [],
      result.userAnswers ?? {},
    );
  }

  ExamDetails _mapResultToDetails(ExamResult result) {
    return ExamDetails(
      subject: result.subject,
      examType: result.examType ?? 'Unknown',
      chapters: 'N/A', // Not stored in result directly
      topics: 'N/A', // Not stored in result directly
      totalQuestions: result.totalQuestions,
      durationMinutes: (result.timeTaken / 60).ceil(), // Approximate
      totalMarks: result.totalMarks,
      negativeMarking: result.negativeMarking,
    );
  }
}
