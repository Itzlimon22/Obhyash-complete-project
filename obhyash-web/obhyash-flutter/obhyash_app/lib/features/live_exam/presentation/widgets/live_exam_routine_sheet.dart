import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:open_filex/open_filex.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../../../core/services/download_notification_service.dart';
import '../../providers/live_exam_providers.dart';
import '../../domain/models.dart';

class RoutineItemModel {
  final String id;
  final String date;
  final String dayName;
  final String time;
  final String subject;
  final String paper;
  final List<String> chapters;
  final int totalMarks;
  final int durationMinutes;

  const RoutineItemModel({
    required this.id,
    required this.date,
    required this.dayName,
    required this.time,
    required this.subject,
    required this.paper,
    required this.chapters,
    required this.totalMarks,
    required this.durationMinutes,
  });
}

class LiveExamRoutineSheet extends ConsumerWidget {
  final String categoryTitle;

  const LiveExamRoutineSheet({
    super.key,
    required this.categoryTitle,
  });

  static void show(BuildContext context, String categoryTitle) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => LiveExamRoutineSheet(categoryTitle: categoryTitle),
    );
  }

  static String _toBanglaDigits(dynamic number) {
    const en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    String s = number.toString();
    for (int i = 0; i < 10; i++) {
      s = s.replaceAll(en[i], bn[i]);
    }
    return s;
  }

  static List<RoutineItemModel> _convertLiveExamsToRoutine(
      List<LiveExam> exams, String category) {
    if (exams.isEmpty) return [];

    const bnMonths = [
      '',
      'জানুয়ারি',
      'ফেব্রুয়ারি',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টেম্বর',
      'অক্টোবর',
      'নভেম্বর',
      'ডিসেম্বর'
    ];
    const bnDays = [
      '',
      'সোমবার',
      'মঙ্গলবার',
      'বুধবার',
      'বৃহস্পতিবার',
      'শুক্রবার',
      'শনিবার',
      'রবিবার'
    ];

    // Sort upcoming exams chronologically
    final sortedExams = List<LiveExam>.from(exams)
      ..sort((a, b) => a.startTime.compareTo(b.startTime));

    return sortedExams.map((exam) {
      final d = exam.startTime;
      final dateStr =
          '${_toBanglaDigits(d.day)} ${bnMonths[d.month]} ${_toBanglaDigits(d.year)}';
      final dayStr = bnDays[d.weekday];

      final hour = d.hour;
      final minute = d.minute.toString().padLeft(2, '0');
      final period = hour >= 18
          ? 'রাত'
          : (hour >= 12
              ? 'দুপুর'
              : (hour >= 6
                  ? 'সকাল'
                  : 'রাত'));
      final h12 = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
      final timeStr = '$period ${_toBanglaDigits(h12)}:${_toBanglaDigits(minute)}';

      // Parse chapters from description
      List<String> chapters = [];
      if (exam.description.trim().isNotEmpty) {
        chapters = exam.description
            .split(RegExp(r'[,;\n]'))
            .map((c) => c.trim())
            .where((c) => c.isNotEmpty)
            .toList();
      }
      if (chapters.isEmpty) {
        chapters = ['সম্পূর্ণ সিলেবাস'];
      }

      return RoutineItemModel(
        id: exam.id,
        date: dateStr,
        dayName: dayStr,
        time: timeStr,
        subject: exam.title,
        paper: exam.category.toUpperCase(),
        chapters: chapters,
        totalMarks: exam.totalMarks.toInt() > 0
            ? exam.totalMarks.toInt()
            : (exam.totalQuestions > 0 ? exam.totalQuestions : 25),
        durationMinutes: exam.durationMinutes > 0 ? exam.durationMinutes : 30,
      );
    }).toList();
  }

  static const List<RoutineItemModel> _defaultHscRoutineList = [
    RoutineItemModel(
      id: 'hsc-1',
      date: '১৮ আগস্ট ২০২৬',
      dayName: 'মঙ্গলবার',
      time: 'রাত ৮:০০ - ৯:০০',
      subject: 'পদার্থবিজ্ঞান ১ম পত্র',
      paper: '১ম পত্র',
      chapters: ['অধ্যায় ২: ভেক্টর', 'অধ্যায় ৩: গতিবিদ্যা'],
      totalMarks: 50,
      durationMinutes: 45,
    ),
    RoutineItemModel(
      id: 'hsc-2',
      date: '২০ আগস্ট ২০২৬',
      dayName: 'বৃহস্পতিবার',
      time: 'রাত ৮:০০ - ৯:০০',
      subject: 'রসায়ন ১ম পত্র',
      paper: '১ম পত্র',
      chapters: ['অধ্যায় ২: গুণগত রসায়ন', 'অধ্যায় ৩: পর্যায়বৃত্ত ধর্ম'],
      totalMarks: 50,
      durationMinutes: 45,
    ),
    RoutineItemModel(
      id: 'hsc-3',
      date: '২২ আগস্ট ২০২৬',
      dayName: 'শনিবার',
      time: 'রাত ৮:০০ - ৯:০০',
      subject: 'উচ্চতর গণিত ১ম পত্র',
      paper: '১ম পত্র',
      chapters: ['অধ্যায় ১: ম্যাট্রিক্স ও নির্ণায়ক', 'অধ্যায় ৯: অন্তরীকরণ'],
      totalMarks: 50,
      durationMinutes: 45,
    ),
  ];

  static const List<RoutineItemModel> _defaultSscRoutineList = [
    RoutineItemModel(
      id: 'ssc-1',
      date: '১৮ আগস্ট ২০২৬',
      dayName: 'মঙ্গলবার',
      time: 'সন্ধ্যা ৭:৩০ - ৮:৩০',
      subject: 'পদার্থবিজ্ঞান',
      paper: 'সাধারণ',
      chapters: ['অধ্যায় ২: গতি', 'অধ্যায় ৩: বল'],
      totalMarks: 40,
      durationMinutes: 40,
    ),
    RoutineItemModel(
      id: 'ssc-2',
      date: '২০ আগস্ট ২০২৬',
      dayName: 'বৃহস্পতিবার',
      time: 'সন্ধ্যা ৭:৩০ - ৮:৩০',
      subject: 'রসায়ন',
      paper: 'সাধারণ',
      chapters: ['অধ্যায় ৩: পদার্থের গঠন', 'অধ্যায় ৪: পর্যায় সারণি'],
      totalMarks: 40,
      durationMinutes: 40,
    ),
  ];

  Future<void> _downloadPdf(
      BuildContext context, List<RoutineItemModel> routineList, bool isHSC) async {
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

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 28, vertical: 24),
        theme: theme,
        build: (pw.Context ctx) {
          return [
            // Header Bar
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              crossAxisAlignment: pw.CrossAxisAlignment.center,
              children: [
                pw.Row(
                  children: [
                    pw.Container(
                      width: 36,
                      height: 36,
                      decoration: pw.BoxDecoration(
                        color: PdfColor.fromHex('004633'),
                        borderRadius: pw.BorderRadius.circular(8),
                      ),
                      alignment: pw.Alignment.center,
                      child: pw.Text(
                        'O',
                        style: pw.TextStyle(
                          color: PdfColors.white,
                          fontSize: 20,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                    ),
                    pw.SizedBox(width: 10),
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'Obhyash (অভ্যাস)',
                          style: pw.TextStyle(
                            fontSize: 17,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('004633'),
                          ),
                        ),
                        pw.Text(
                          'স্মার্ট অনলাইন পরীক্ষা ও প্রস্তুতি প্ল্যাটফর্ম',
                          style: const pw.TextStyle(
                            fontSize: 9,
                            color: PdfColors.grey700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromHex('E8F5E9'),
                    borderRadius: pw.BorderRadius.circular(20),
                    border: pw.Border.all(color: PdfColor.fromHex('A5D6A7')),
                  ),
                  child: pw.Text(
                    'অফিশিয়াল লাইভ রুটিন',
                    style: pw.TextStyle(
                      fontSize: 10,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColor.fromHex('004633'),
                    ),
                  ),
                ),
              ],
            ),
            pw.SizedBox(height: 14),
            pw.Divider(color: PdfColor.fromHex('004633'), thickness: 1.2),
            pw.SizedBox(height: 10),

            // Category & Routine Info Banner
            pw.Container(
              width: double.infinity,
              padding: const pw.EdgeInsets.all(12),
              decoration: pw.BoxDecoration(
                color: PdfColor.fromHex('F8FAF9'),
                borderRadius: pw.BorderRadius.circular(8),
                border: pw.Border.all(color: PdfColor.fromHex('E0E7E3')),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    isHSC
                        ? 'এইচএসসি (HSC) লাইভ পরীক্ষা ও সিলেবাস রুটিন'
                        : 'এসএসসি (SSC) লাইভ পরীক্ষা ও সিলেবাস রুটিন',
                    style: pw.TextStyle(
                      fontSize: 13,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColor.fromHex('004633'),
                    ),
                  ),
                  pw.SizedBox(height: 3),
                  pw.Text(
                    'পরীক্ষার নির্ধারিত সময়ে অ্যাপে প্রবেশ করে লাইভ পরীক্ষায় অংশ নিন। নিচে প্রতিটি পরীক্ষার তারিখ, সময় ও বিস্তারিত সিলেবাস দেওয়া হলো।',
                    style: const pw.TextStyle(fontSize: 9.5, color: PdfColors.grey800),
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 14),

            // Organized Table of Routine & Syllabus
            pw.TableHelper.fromTextArray(
              headers: [
                'ক্রম',
                'পরীক্ষার নাম ও বিষয়',
                'তারিখ ও বার',
                'সময় ও নম্বর',
                'সিলেবাস ও অধ্যায়সমূহ',
              ],
              columnWidths: {
                0: const pw.FixedColumnWidth(26),
                1: const pw.FlexColumnWidth(2.0),
                2: const pw.FlexColumnWidth(2.0),
                3: const pw.FlexColumnWidth(1.6),
                4: const pw.FlexColumnWidth(3.0),
              },
              headerStyle: pw.TextStyle(
                fontSize: 9.5,
                fontWeight: pw.FontWeight.bold,
                color: PdfColors.white,
              ),
              headerDecoration: pw.BoxDecoration(
                color: PdfColor.fromHex('004633'),
                borderRadius: const pw.BorderRadius.vertical(top: pw.Radius.circular(6)),
              ),
              cellStyle: const pw.TextStyle(fontSize: 9),
              cellAlignment: pw.Alignment.centerLeft,
              cellPadding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 7),
              data: routineList.asMap().entries.map((entry) {
                final idx = entry.key + 1;
                final item = entry.value;
                return [
                  _toBanglaDigits(idx),
                  item.subject,
                  '${item.date}\n(${item.dayName})',
                  '${item.time}\n${_toBanglaDigits(item.durationMinutes)} মি. | ${_toBanglaDigits(item.totalMarks)} নম্বর',
                  item.chapters.join(', '),
                ];
              }).toList(),
            ),

            pw.SizedBox(height: 20),

            // Notice Box
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                color: PdfColor.fromHex('F3F4F6'),
                borderRadius: pw.BorderRadius.circular(6),
                border: pw.Border.all(color: PdfColor.fromHex('E5E7EB')),
              ),
              child: pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text('📌 ', style: const pw.TextStyle(fontSize: 10)),
                  pw.Expanded(
                    child: pw.Text(
                      'পরীক্ষা সমাপ্ত হওয়ার পর স্বয়ংক্রিয়ভাবে বিস্তারিত সমাধান, সঠিক উত্তর ও মেধা তালিকা (Leaderboard) প্রকাশিত হবে। যেকোনো প্রয়োজনে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।',
                      style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey800),
                    ),
                  ),
                ],
              ),
            ),
          ];
        },
      ),
    );

    final bytes = await pdf.save();
    final fileName = 'Obhyash_Live_Exam_Routine_${DateTime.now().millisecondsSinceEpoch}.pdf';

    try {
      final file = await DownloadNotificationService().savePdfAndNotify(
        bytes: bytes,
        rawFileName: fileName,
        notificationTitle: '$categoryTitle রুটিন ও সিলেবাস',
        context: context.mounted ? context : null,
      );

      if (file != null) {
        try {
          await OpenFilex.open(file.path);
        } catch (_) {}
      } else {
        await Printing.sharePdf(bytes: bytes, filename: fileName);
      }
    } catch (_) {
      await Printing.sharePdf(bytes: bytes, filename: fileName);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isHSC = categoryTitle.toLowerCase().contains('hsc') ||
        categoryTitle.contains('এইচএসসি');

    final liveExamsAsync = ref.watch(liveExamsCategoryProvider(categoryTitle));
    final dynamicRoutine = liveExamsAsync.maybeWhen(
      data: (exams) => _convertLiveExamsToRoutine(
        exams,
        categoryTitle,
      ),
      orElse: () => <RoutineItemModel>[],
    );

    final List<RoutineItemModel> routineList = dynamicRoutine.isNotEmpty
        ? dynamicRoutine
        : (isHSC ? _defaultHscRoutineList : _defaultSscRoutineList);

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.65,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Handle
          const SizedBox(height: 10),
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 10),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFF004633).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(LucideIcons.calendar, color: Color(0xFF004633), size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF004633).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              categoryTitle.toUpperCase(),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF004633),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'একাডেমিক রুটিন',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? Colors.white54 : Colors.black54,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$categoryTitle পরীক্ষার রুটিন',
                        style: TextStyle(
                          fontSize: 15.5,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Anek Bangla',
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(LucideIcons.x, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          const Divider(height: 1),

          // Routine Items List (Clean, No bulky syllabus box)
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              itemCount: routineList.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = routineList[index];
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF27272A) : const Color(0xFFFAFAFA),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE4E4E7),
                    ),
                  ),
                  child: Row(
                    children: [
                      // Serial Badge
                      Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: const Color(0xFF004633),
                          borderRadius: BorderRadius.circular(7),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          _toBanglaDigits(index + 1),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Title & Date/Time
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.subject,
                              style: const TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Anek Bangla',
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 3),
                            Text(
                              '${item.date} (${item.dayName}) • ${item.time}',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontFamily: 'Anek Bangla',
                                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Duration & Marks Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF18181B) : Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE4E4E7),
                          ),
                        ),
                        child: Text(
                          '${_toBanglaDigits(item.durationMinutes)} মি. | ${_toBanglaDigits(item.totalMarks)} নম্বর',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Anek Bangla',
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // Footer Action Buttons
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 46,
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF004633),
                          side: const BorderSide(color: Color(0xFF004633), width: 1.5),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        onPressed: () => _downloadPdf(context, routineList, isHSC),
                        icon: const Icon(LucideIcons.download, size: 17),
                        label: const Text('রুটিন PDF', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SizedBox(
                      height: 46,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF004633),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        onPressed: () => Navigator.pop(context),
                        child: const Text('ঠিক আছে', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
