import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:bangla_pdf/bangla_pdf.dart' as bn;
import '../../../../core/services/download_notification_service.dart';
import '../services/live_exam_routine_service.dart';
import '../providers/live_exam_controls_provider.dart';

class LiveExamRoutinePage extends ConsumerStatefulWidget {
  final String categoryTitle;

  const LiveExamRoutinePage({
    super.key,
    required this.categoryTitle,
  });

  static String toBanglaDigits(dynamic number) {
    const en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    String s = number.toString();
    for (int i = 0; i < 10; i++) {
      s = s.replaceAll(en[i], bn[i]);
    }
    return s;
  }

  static String formatBanglaDate(String rawDate) {
    var s = rawDate;
    s = s.replaceAllMapped(RegExp(r'(\d+)'), (m) => toBanglaDigits(m.group(1)!));
    s = s.replaceAll('Oct', 'অক্টোবর');
    s = s.replaceAll('Nov', 'নভেম্বর');
    s = s.replaceAll('Dec', 'ডিসেম্বর');
    s = s.replaceAll('Jan', 'জানুয়ারি');
    s = s.replaceAll('Feb', 'ফেব্রুয়ারি');
    s = s.replaceAll('Mar', 'মার্চ');
    s = s.replaceAll('Apr', 'এপ্রিল');
    s = s.replaceAll('May', 'মে');
    s = s.replaceAll('Jun', 'জুন');
    s = s.replaceAll('Jul', 'জুলাই');
    s = s.replaceAll('Aug', 'আগস্ট');
    s = s.replaceAll('Sep', 'সেপ্টেম্বর');
    return s;
  }

  static String formatCategoryTitle(String cat) {
    switch (cat.toLowerCase().trim()) {
      case 'medical':
        return 'মেডিকেল ভর্তি';
      case 'engineering':
        return 'ইঞ্জিনিয়ারিং ভর্তি';
      case 'varsity':
      case 'varsity_a':
        return 'ঢাবি ক-ইউনিট ভর্তি';
      case 'ssc_board':
        return 'এসএসসি বোর্ড স্পেশাল';
      case 'ssc_school':
        return 'শীর্ষ স্কুল ও ক্যাডেট';
      case 'ssc_science':
        return 'বিজ্ঞান বিভাগ';
      case 'ssc_business':
        return 'বাণিজ্য বিভাগ';
      case 'ssc_humanities':
        return 'মানবিক বিভাগ';
      case 'ssc_compulsory':
        return 'আবশ্যিক বিষয়';
      default:
        return cat.isNotEmpty ? cat : 'ভর্তি পরীক্ষা';
    }
  }

  @override
  ConsumerState<LiveExamRoutinePage> createState() => _LiveExamRoutinePageState();
}

class _LiveExamRoutinePageState extends ConsumerState<LiveExamRoutinePage> {
  String _sheetName = 'Medical';
  List<GoogleSheetRoutineItem> _items = [];
  bool _isLoading = true;

  static const Map<int, TableColumnWidth> _tableColumnWidths = {
    0: FixedColumnWidth(74), // তারিখ ও বার
    1: FixedColumnWidth(92), // পরীক্ষা ও বিষয়
    2: FlexColumnWidth(1),   // সিলেবাস (অধ্যায়সমূহ)
    3: FixedColumnWidth(66), // নম্বর ও সময়
  };

  @override
  void initState() {
    super.initState();
    _loadRoutineData();
  }

  Future<void> _loadRoutineData() async {
    setState(() => _isLoading = true);
    final controls = ref.read(liveExamControlsProvider);
    final hasRoutine = controls.hasRoutine(widget.categoryTitle);

    if (!hasRoutine) {
      if (mounted) {
        setState(() {
          _items = [];
          _isLoading = false;
        });
      }
      return;
    }

    final targetSheet = controls.getSheetName(widget.categoryTitle);
    _sheetName = targetSheet;

    final data = await LiveExamGoogleSheetService.fetchRoutine(
      targetSheet,
      customSpreadsheetId: controls.routineSpreadsheetId,
    );
    if (mounted) {
      setState(() {
        _items = data;
        _isLoading = false;
      });
    }
  }

  Future<void> _configureBanglaPdf() async {
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
    } catch (_) {}
    bn.BanglaPdf.configure(shapingMode: bn.BanglaShapingMode.auto);
  }

  Future<void> _downloadPdf(BuildContext context) async {
    if (_items.isEmpty) return;

    await _configureBanglaPdf();

    // Load official Obhyash Logo
    pw.MemoryImage? logoImage;
    try {
      final logoData = await rootBundle.load('assets/images/obhyash_full_logo.png');
      logoImage = pw.MemoryImage(logoData.buffer.asUint8List());
    } catch (_) {
      try {
        final logoData = await rootBundle.load('assets/images/app_logo.png');
        logoImage = pw.MemoryImage(logoData.buffer.asUint8List());
      } catch (_) {}
    }

    final pdf = pw.Document();
    final categoryDisplayName = LiveExamRoutinePage.formatCategoryTitle(widget.categoryTitle);

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        build: (pw.Context ctx) {
          return [
            // Top Header: Official Obhyash Logo & Metadata
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              crossAxisAlignment: pw.CrossAxisAlignment.center,
              children: [
                pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  children: [
                    if (logoImage != null)
                      pw.Container(
                        height: 36,
                        margin: const pw.EdgeInsets.only(right: 10),
                        child: pw.Image(logoImage, fit: pw.BoxFit.contain),
                      )
                    else
                      pw.Container(
                        width: 34,
                        height: 34,
                        margin: const pw.EdgeInsets.only(right: 10),
                        decoration: pw.BoxDecoration(
                          color: PdfColor.fromHex('004633'),
                          borderRadius: pw.BorderRadius.circular(6),
                        ),
                        alignment: pw.Alignment.center,
                        child: bn.AutoText(
                          'অ',
                          fontSize: 18,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.white,
                        ),
                      ),
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        bn.AutoText(
                          'অভ্যাস (Obhyash) - লাইভ এক্সাম শিডিউল',
                          fontSize: 13,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColor.fromHex('004633'),
                        ),
                        pw.SizedBox(height: 1),
                        bn.AutoText(
                          'স্মার্ট পরীক্ষা প্রস্তুতি ও লাইভ এক্সাম প্ল্যাটফর্ম • obhyash.com',
                          fontSize: 7.5,
                          color: PdfColor.fromHex('64748B'),
                        ),
                      ],
                    ),
                  ],
                ),
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromHex('E8F5E9'),
                    borderRadius: pw.BorderRadius.circular(6),
                    border: pw.Border.all(color: PdfColor.fromHex('A5D6A7'), width: 0.8),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      bn.AutoText(
                        'অফিশিয়াল লাইভ রুটিন',
                        fontSize: 8.5,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColor.fromHex('004633'),
                      ),
                      bn.AutoText(
                        'Google Sheets লাইভ সিঙ্ক',
                        fontSize: 6.8,
                        color: PdfColor.fromHex('388E3C'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            pw.SizedBox(height: 7),
            pw.Divider(color: PdfColor.fromHex('004633'), thickness: 1.2),
            pw.SizedBox(height: 5),

            // Banner Title matching Google Sheet
            pw.Container(
              width: double.infinity,
              padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              decoration: pw.BoxDecoration(
                color: PdfColor.fromHex('F0FDF4'),
                borderRadius: pw.BorderRadius.circular(5),
                border: pw.Border.all(color: PdfColor.fromHex('BBF7D0'), width: 0.8),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  bn.AutoText(
                    '$categoryDisplayName - সাপ্তাহিক লাইভ পরীক্ষা ও সিলেবাস ২০২৬-২৭',
                    fontSize: 10,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColor.fromHex('004633'),
                  ),
                  bn.AutoText(
                    'পরীক্ষার সময়: রাত ৮:০০ টা - রাত ১১:০০ টা',
                    fontSize: 7.5,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColor.fromHex('166534'),
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 7),

            // 6-Column Spreadsheet Table matching Google Sheet exactly
            pw.Table(
              columnWidths: const {
                0: pw.FixedColumnWidth(64), // Date
                1: pw.FixedColumnWidth(46), // Day
                2: pw.FixedColumnWidth(84), // Exam Name
                3: pw.FixedColumnWidth(74), // Subject
                4: pw.FlexColumnWidth(1),   // Syllabus
                5: pw.FixedColumnWidth(70), // Marks & Time
              },
              defaultVerticalAlignment: pw.TableCellVerticalAlignment.middle,
              border: pw.TableBorder.all(
                color: PdfColor.fromHex('CBD5E1'),
                width: 0.6,
              ),
              children: [
                // Header Row (Matches Google Sheet)
                pw.TableRow(
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromHex('004633'),
                  ),
                  children: [
                    _buildPdfHeaderCell('তারিখ (Date)'),
                    _buildPdfHeaderCell('বার (Day)'),
                    _buildPdfHeaderCell('পরীক্ষার নাম'),
                    _buildPdfHeaderCell('বিষয়'),
                    _buildPdfHeaderCell('সিলেবাস (Syllabus)'),
                    _buildPdfHeaderCell('নম্বর ও সময়'),
                  ],
                ),

                // Data Rows (Direct from Google Sheet)
                ..._items.asMap().entries.map((entry) {
                  final idx = entry.key;
                  final item = entry.value;
                  final isMega = item.examName.toLowerCase().contains('mega') ||
                      item.examName.toLowerCase().contains('mock');

                  final rowColor = isMega
                      ? PdfColor.fromHex('F0FDF4')
                      : (idx % 2 == 0 ? PdfColors.white : PdfColor.fromHex('F8FAFC'));

                  return pw.TableRow(
                    decoration: pw.BoxDecoration(color: rowColor),
                    children: [
                      // 1. Date
                      pw.Padding(
                        padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 4.5),
                        child: bn.AutoText(
                          LiveExamRoutinePage.formatBanglaDate(item.date),
                          fontSize: 7.5,
                          fontWeight: isMega ? pw.FontWeight.bold : pw.FontWeight.normal,
                          color: PdfColor.fromHex('0F172A'),
                        ),
                      ),

                      // 2. Day
                      pw.Padding(
                        padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 4.5),
                        child: bn.AutoText(
                          item.dayName,
                          fontSize: 7.5,
                          color: PdfColor.fromHex('334155'),
                        ),
                      ),

                      // 3. Exam Name
                      pw.Padding(
                        padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 4.5),
                        child: bn.AutoText(
                          item.examName,
                          fontSize: 7.8,
                          fontWeight: pw.FontWeight.bold,
                          color: isMega ? PdfColor.fromHex('004633') : PdfColor.fromHex('0F172A'),
                        ),
                      ),

                      // 4. Subject
                      pw.Padding(
                        padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 4.5),
                        child: bn.AutoText(
                          item.subject,
                          fontSize: 7.5,
                          fontWeight: isMega ? pw.FontWeight.bold : pw.FontWeight.normal,
                          color: isMega ? PdfColor.fromHex('004633') : PdfColor.fromHex('1E293B'),
                        ),
                      ),

                      // 5. Syllabus (Full text without cutting)
                      pw.Padding(
                        padding: const pw.EdgeInsets.symmetric(horizontal: 5, vertical: 4.5),
                        child: bn.AutoText(
                          item.chapters.join(';\n'),
                          fontSize: 7.4,
                          color: PdfColor.fromHex('1E293B'),
                          style: const pw.TextStyle(lineSpacing: 1.25),
                        ),
                      ),

                      // 6. Marks & Time
                      pw.Padding(
                        padding: const pw.EdgeInsets.symmetric(horizontal: 3, vertical: 4.5),
                        child: bn.AutoText(
                          '${LiveExamRoutinePage.toBanglaDigits(item.totalMarks)} মার্কস\n(${LiveExamRoutinePage.toBanglaDigits(item.durationMinutes)} মিনিট)',
                          fontSize: 7.2,
                          fontWeight: isMega ? pw.FontWeight.bold : pw.FontWeight.normal,
                          color: PdfColor.fromHex('0F172A'),
                          textAlign: pw.TextAlign.center,
                        ),
                      ),
                    ],
                  );
                }),
              ],
            ),

            pw.SizedBox(height: 8),

            // Instructions Box
            pw.Container(
              padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              decoration: pw.BoxDecoration(
                color: PdfColor.fromHex('F8FAFC'),
                borderRadius: pw.BorderRadius.circular(5),
                border: pw.Border.all(color: PdfColor.fromHex('E2E8F0'), width: 0.8),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  bn.AutoText(
                    '📌 পরীক্ষার্থীদের জন্য সাধারণ নির্দেশাবলী:',
                    fontSize: 7.5,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColor.fromHex('004633'),
                  ),
                  pw.SizedBox(height: 2),
                  bn.AutoText(
                    '১. প্রতিটি ভুল উত্তরের জন্য ০.২৫ নম্বর নেগেটিভ মার্কিং কর্তন করা হবে।\n২. পরীক্ষা শেষ হওয়ার পর কেন্দ্রীয় মেধা তালিকা (Leaderboard) এবং প্রতিটি প্রশ্নের নিখুঁত সমাধান উন্মুক্ত হবে।',
                    fontSize: 7,
                    color: PdfColor.fromHex('475569'),
                    style: const pw.TextStyle(lineSpacing: 1.2),
                  ),
                ],
              ),
            ),
          ];
        },
      ),
    );

    final bytes = await pdf.save();
    final fileName = 'Obhyash_${_sheetName}_Routine';

    try {
      final file = await DownloadNotificationService().savePdfAndNotify(
        bytes: bytes,
        rawFileName: fileName,
        notificationTitle: '$categoryDisplayName রুটিন',
        subtitle: 'ডাউনলোড সফল হয়েছে • ট্যাপ করে রুটিন দেখুন',
        context: context.mounted ? context : null,
      );

      if (file == null) {
        await Printing.sharePdf(bytes: bytes, filename: fileName);
      }
    } catch (_) {
      await Printing.sharePdf(bytes: bytes, filename: fileName);
    }
  }

  pw.Widget _buildPdfHeaderCell(String title) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 5),
      child: bn.AutoText(
        title,
        fontSize: 8,
        fontWeight: pw.FontWeight.bold,
        color: PdfColors.white,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final categoryDisplayName = LiveExamRoutinePage.formatCategoryTitle(widget.categoryTitle);

    // Strict color rules: ONLY white and black (and neutral gray for secondary)
    final primaryTextColor = isDark ? Colors.white : Colors.black;
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F1015) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF14151B) : Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : Colors.black,
            size: 22,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          '$categoryDisplayName রুটিন ও সিলেবাস',
          style: TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 16.5,
            fontWeight: FontWeight.w400,
            color: primaryTextColor,
          ),
        ),
        actions: [
          // High-contrast, clean Download Button
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: InkWell(
              borderRadius: BorderRadius.circular(10),
              onTap: () => _downloadPdf(context),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF22242E) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isDark ? const Color(0xFF3B4054) : const Color(0xFFCBD5E1),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      LucideIcons.download,
                      color: primaryTextColor,
                      size: 16,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'PDF',
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        color: primaryTextColor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? Center(
              child: CircularProgressIndicator(
                color: isDark ? Colors.white : Colors.black,
              ),
            )
          : _items.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 28.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E2230) : const Color(0xFFEFF6FF),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            LucideIcons.calendar,
                            size: 36,
                            color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB),
                          ),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          '$categoryDisplayName রুটিন শীঘ্রই প্রকাশিত হবে',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: primaryTextColor,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'কর্তৃপক্ষ কর্তৃক এই ক্যাটাগরির রুটিন চূড়ান্ত করার কাজ চলছে। শিডিউল আপলোড হওয়া মাত্রই এখানে দেখতে পাবেন।',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 13,
                            height: 1.4,
                            color: secondaryTextColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : Padding(
                  padding: const EdgeInsets.fromLTRB(10, 10, 10, 20),
                  child: Container(
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF14151B) : Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isDark ? const Color(0xFF2A2D3A) : const Color(0xFFE2E8F0),
                        width: 1,
                      ),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(9),
                      child: Column(
                        children: [
                          // 1. STICKY TABLE HEADER (Fixed outside scroll view)
                          Container(
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E2230) : const Color(0xFF004633),
                            ),
                            child: Table(
                              columnWidths: _tableColumnWidths,
                              defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                              children: [
                                TableRow(
                                  children: [
                                    _buildHeaderCell('তারিখ ও বার'),
                                    _buildHeaderCell('পরীক্ষা ও বিষয়'),
                                    _buildHeaderCell('সিলেবাস (অধ্যায়সমূহ)'),
                                    _buildHeaderCell('নম্বর ও সময়'),
                                  ],
                                ),
                              ],
                            ),
                          ),

                          // 2. SCROLLABLE TABLE BODY (Scrolls underneath the sticky header)
                          Expanded(
                            child: SingleChildScrollView(
                              physics: const BouncingScrollPhysics(),
                              child: Table(
                                columnWidths: _tableColumnWidths,
                                defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                                border: TableBorder(
                                  horizontalInside: BorderSide(
                                    color: isDark ? const Color(0xFF262836) : const Color(0xFFE5E7EB),
                                    width: 0.8,
                                  ),
                                ),
                                children: _items.asMap().entries.map((entry) {
                                  final idx = entry.key;
                                  final item = entry.value;
                                  final isMega = item.examName.toLowerCase().contains('mega') ||
                                      item.examName.toLowerCase().contains('mock');

                                  final rowColor = isMega
                                      ? (isDark
                                          ? const Color(0xFF1C2230)
                                          : const Color(0xFFF1F5F9))
                                      : (idx % 2 == 0
                                          ? (isDark ? const Color(0xFF14151B) : Colors.white)
                                          : (isDark ? const Color(0xFF181A22) : const Color(0xFFF8FAFC)));

                                  return TableRow(
                                    decoration: BoxDecoration(color: rowColor),
                                    children: [
                                      // 1. তারিখ ও বার
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              item.date,
                                              style: TextStyle(
                                                fontFamily: 'HindSiliguri',
                                                fontSize: 11,
                                                fontWeight: FontWeight.w400,
                                                color: primaryTextColor,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              item.dayName,
                                              style: TextStyle(
                                                fontFamily: 'HindSiliguri',
                                                fontSize: 10,
                                                fontWeight: FontWeight.w400,
                                                color: secondaryTextColor,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),

                                      // 2. পরীক্ষা ও বিষয় (Only White/Black text)
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              item.examName,
                                              style: TextStyle(
                                                fontFamily: 'HindSiliguri',
                                                fontSize: 11.5,
                                                fontWeight: FontWeight.w400,
                                                color: primaryTextColor,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              item.subject,
                                              style: TextStyle(
                                                fontFamily: 'HindSiliguri',
                                                fontSize: 10.5,
                                                fontWeight: FontWeight.w400,
                                                color: primaryTextColor,
                                              ),
                                            ),
                                            if (isMega) ...[
                                              const SizedBox(height: 3),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                                decoration: BoxDecoration(
                                                  color: isDark ? Colors.white24 : Colors.black87,
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                                child: Text(
                                                  'মেগা টেস্ট',
                                                  style: TextStyle(
                                                    fontFamily: 'HindSiliguri',
                                                    fontSize: 8.5,
                                                    fontWeight: FontWeight.w400,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),

                                      // 3. সিলেবাস (Clean Multi-Line, No Truncation, HindSiliguri 400)
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
                                        child: Text(
                                          item.chapters.join(';\n'),
                                          style: TextStyle(
                                            fontFamily: 'HindSiliguri',
                                            fontSize: 10.5,
                                            height: 1.4,
                                            color: primaryTextColor,
                                            fontWeight: FontWeight.w400,
                                          ),
                                        ),
                                      ),

                                      // 4. নম্বর ও সময় (Only White/Black text)
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.center,
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: isDark ? const Color(0xFF22242E) : const Color(0xFFF1F5F9),
                                                borderRadius: BorderRadius.circular(4),
                                                border: Border.all(
                                                  color: isDark ? const Color(0xFF33374A) : const Color(0xFFCBD5E1),
                                                  width: 0.8,
                                                ),
                                              ),
                                              child: Text(
                                                '${LiveExamRoutinePage.toBanglaDigits(item.totalMarks)} নম্বর',
                                                style: TextStyle(
                                                  fontFamily: 'HindSiliguri',
                                                  fontSize: 9.5,
                                                  fontWeight: FontWeight.w400,
                                                  color: primaryTextColor,
                                                ),
                                                textAlign: TextAlign.center,
                                              ),
                                            ),
                                            const SizedBox(height: 3),
                                            Text(
                                              '${LiveExamRoutinePage.toBanglaDigits(item.durationMinutes)} মিনিট',
                                              style: TextStyle(
                                                fontFamily: 'HindSiliguri',
                                                fontSize: 9.5,
                                                fontWeight: FontWeight.w400,
                                                color: secondaryTextColor,
                                              ),
                                              textAlign: TextAlign.center,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  );
                                }).toList(),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
    );
  }

  Widget _buildHeaderCell(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
      child: Text(
        text,
        style: const TextStyle(
          fontFamily: 'HindSiliguri',
          color: Colors.white,
          fontWeight: FontWeight.w400,
          fontSize: 11,
        ),
      ),
    );
  }
}
