import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../../../core/services/download_notification_service.dart';

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

class LiveExamRoutineSheet extends StatelessWidget {
  final String categoryTitle;

  const LiveExamRoutineSheet({
    super.key,
    required this.categoryTitle,
  });

  static void show(BuildContext context, String categoryTitle) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => LiveExamRoutineSheet(categoryTitle: categoryTitle),
    );
  }

  Future<void> _downloadPdf(BuildContext context, List<RoutineItemModel> routineList, bool isHSC) async {
    final pdf = pw.Document();

    final font = await PdfGoogleFonts.hindSiliguriRegular();
    final boldFont = await PdfGoogleFonts.hindSiliguriBold();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(24),
        build: (pw.Context ctx) {
          return [
            // Header
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Row(
                  children: [
                    pw.Container(
                      width: 38,
                      height: 38,
                      decoration: pw.BoxDecoration(
                        color: PdfColor.fromHex('0B6B42'),
                        borderRadius: pw.BorderRadius.circular(10),
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
                            font: boldFont,
                            fontSize: 18,
                            color: PdfColor.fromHex('0B6B42'),
                          ),
                        ),
                        pw.Text(
                          'Smart Exam Preparation Platform',
                          style: pw.TextStyle(
                            font: font,
                            fontSize: 10,
                            color: PdfColors.grey700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromHex('ECFDF5'),
                    border: pw.Border.all(color: PdfColor.fromHex('A7F3D0')),
                    borderRadius: pw.BorderRadius.circular(12),
                  ),
                  child: pw.Text(
                    isHSC ? 'HSC Routine 2025-26' : 'SSC Routine 2025-26',
                    style: pw.TextStyle(
                      font: boldFont,
                      fontSize: 11,
                      color: PdfColor.fromHex('0B6B42'),
                    ),
                  ),
                ),
              ],
            ),
            pw.SizedBox(height: 16),
            pw.Divider(color: PdfColor.fromHex('0B6B42'), thickness: 2),
            pw.SizedBox(height: 12),

            // Title
            pw.Center(
              child: pw.Text(
                '$categoryTitle - Routine & Syllabus',
                style: pw.TextStyle(
                  font: boldFont,
                  fontSize: 15,
                  color: PdfColors.black,
                ),
              ),
            ),
            pw.SizedBox(height: 14),

            // Routine Table
            pw.Table(
              border: pw.TableBorder.all(color: PdfColors.grey400, width: 0.5),
              columnWidths: {
                0: const pw.FixedColumnWidth(28),
                1: const pw.FlexColumnWidth(2.2),
                2: const pw.FlexColumnWidth(2.6),
                3: const pw.FlexColumnWidth(3.8),
                4: const pw.FlexColumnWidth(1.4),
              },
              children: [
                // Table Header
                pw.TableRow(
                  decoration: pw.BoxDecoration(color: PdfColor.fromHex('F1F5F9')),
                  children: [
                    pw.Padding(
                      padding: const pw.EdgeInsets.all(6),
                      child: pw.Text('#', style: pw.TextStyle(font: boldFont, fontSize: 10), textAlign: pw.TextAlign.center),
                    ),
                    pw.Padding(
                      padding: const pw.EdgeInsets.all(6),
                      child: pw.Text('Date & Time', style: pw.TextStyle(font: boldFont, fontSize: 10)),
                    ),
                    pw.Padding(
                      padding: const pw.EdgeInsets.all(6),
                      child: pw.Text('Subject & Paper', style: pw.TextStyle(font: boldFont, fontSize: 10)),
                    ),
                    pw.Padding(
                      padding: const pw.EdgeInsets.all(6),
                      child: pw.Text('Syllabus Chapters', style: pw.TextStyle(font: boldFont, fontSize: 10)),
                    ),
                    pw.Padding(
                      padding: const pw.EdgeInsets.all(6),
                      child: pw.Text('Marks/Time', style: pw.TextStyle(font: boldFont, fontSize: 10), textAlign: pw.TextAlign.center),
                    ),
                  ],
                ),
                // Table Rows
                ...routineList.asMap().entries.map((entry) {
                  final idx = entry.key + 1;
                  final item = entry.value;
                  return pw.TableRow(
                    children: [
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(6),
                        child: pw.Text('$idx', style: pw.TextStyle(font: boldFont, fontSize: 9), textAlign: pw.TextAlign.center),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(6),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text(item.date, style: pw.TextStyle(font: boldFont, fontSize: 9)),
                            pw.Text('(${item.dayName}) ${item.time}', style: pw.TextStyle(font: font, fontSize: 8, color: PdfColors.grey700)),
                          ],
                        ),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(6),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text(item.subject, style: pw.TextStyle(font: boldFont, fontSize: 9)),
                            pw.Text(item.paper, style: pw.TextStyle(font: font, fontSize: 8, color: PdfColors.grey700)),
                          ],
                        ),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(6),
                        child: pw.Text(
                          item.chapters.join(', '),
                          style: pw.TextStyle(font: font, fontSize: 8.5),
                        ),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(6),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.center,
                          children: [
                            pw.Text('${item.totalMarks} Marks', style: pw.TextStyle(font: boldFont, fontSize: 8.5, color: PdfColor.fromHex('0B6B42'))),
                            pw.Text('${item.durationMinutes} Mins', style: pw.TextStyle(font: font, fontSize: 7.5, color: PdfColors.grey700)),
                          ],
                        ),
                      ),
                    ],
                  );
                }),
              ],
            ),
            pw.SizedBox(height: 16),

            // Instructions Box
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                color: PdfColor.fromHex('F8FAFC'),
                border: pw.Border.all(color: PdfColors.grey300),
                borderRadius: pw.BorderRadius.circular(8),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'Special Instructions for Examinees:',
                    style: pw.TextStyle(font: boldFont, fontSize: 10, color: PdfColor.fromHex('0B6B42')),
                  ),
                  pw.SizedBox(height: 4),
                  pw.Text('1. Live exams start at the scheduled time with automated submission upon timeout.', style: pw.TextStyle(font: font, fontSize: 8.5)),
                  pw.Text('2. Standard negative marking (-0.25) applies for wrong answers.', style: pw.TextStyle(font: font, fontSize: 8.5)),
                  pw.Text('3. Solutions and official leaderboard are published immediately when the live exam window ends.', style: pw.TextStyle(font: font, fontSize: 8.5)),
                ],
              ),
            ),
          ];
        },
      ),
    );

    final bytes = await pdf.save();
    final fileName = 'Obhyash_${isHSC ? 'HSC' : 'SSC'}_Live_Exam_Routine.pdf';

    try {
      await DownloadNotificationService().savePdfAndNotify(
        bytes: bytes,
        rawFileName: fileName,
        notificationTitle: 'লাইভ পরীক্ষার রুটিন ডাউনলোড সম্পন্ন হয়েছে ✅',
        context: context,
      );
    } catch (_) {
      // Fallback share if file system writing is restricted
      await Printing.sharePdf(bytes: bytes, filename: fileName);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isHSC = categoryTitle.toLowerCase().contains('hsc') || categoryTitle.contains('এইচএসসি');

    final List<RoutineItemModel> routineList = isHSC
        ? const [
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
            RoutineItemModel(
              id: 'hsc-4',
              date: '২৪ আগস্ট ২০২৬',
              dayName: 'সোমবার',
              time: 'রাত ৮:০০ - ৯:০০',
              subject: 'জীববিজ্ঞান ১ম পত্র',
              paper: 'উদ্ভিদবিজ্ঞান',
              chapters: ['অধ্যায় ১: কোষ ও এর গঠন', 'অধ্যায় ৪: অণুজীব'],
              totalMarks: 50,
              durationMinutes: 45,
            ),
            RoutineItemModel(
              id: 'hsc-5',
              date: '২৬ আগস্ট ২০২৬',
              dayName: 'বুধবার',
              time: 'রাত ৮:০০ - ৯:০০',
              subject: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
              paper: 'আবশ্যিক',
              chapters: ['অধ্যায় ৩: সংখ্যা পদ্ধতি', 'অধ্যায় ৪: HTML ও ওয়েব'],
              totalMarks: 50,
              durationMinutes: 40,
            ),
          ]
        : const [
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
            RoutineItemModel(
              id: 'ssc-3',
              date: '২২ আগস্ট ২০২৬',
              dayName: 'শনিবার',
              time: 'সন্ধ্যা ৭:৩০ - ৮:৩০',
              subject: 'সাধারণ গণিত',
              paper: 'সাধারণ',
              chapters: ['অধ্যায় ২: সেট ও ফাংশন', 'অধ্যায় ৩: বীজগাণিতিক রাশি'],
              totalMarks: 40,
              durationMinutes: 40,
            ),
            RoutineItemModel(
              id: 'ssc-4',
              date: '২৪ আগস্ট ২০২৬',
              dayName: 'সোমবার',
              time: 'সন্ধ্যা ৭:৩০ - ৮:৩০',
              subject: 'জীববিজ্ঞান',
              paper: 'সাধারণ',
              chapters: ['অধ্যায় ১: জীবন পাঠ', 'অধ্যায় ২: জীব কোষ ও টিস্যু'],
              totalMarks: 40,
              durationMinutes: 40,
            ),
            RoutineItemModel(
              id: 'ssc-5',
              date: '২৬ আগস্ট ২০২৬',
              dayName: 'বুধবার',
              time: 'সন্ধ্যা ৭:৩০ - ৮:৩০',
              subject: 'উচ্চতর গণিত',
              paper: 'ঐচ্ছিক',
              chapters: ['অধ্যায় ১: সেট ও ফাংশন', 'অধ্যায় ৭: অসীম ধারা'],
              totalMarks: 40,
              durationMinutes: 40,
            ),
          ];

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Handle
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 12),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0B6B42).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(LucideIcons.calendar, color: Color(0xFF0B6B42), size: 20),
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
                              color: const Color(0xFF0B6B42).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              isHSC ? 'HSC ২০২৫-২৬' : 'SSC ২০২৫-২৬',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0B6B42),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'একাডেমিক রুটিন',
                            style: TextStyle(fontSize: 11, color: isDark ? Colors.white54 : Colors.black54),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$categoryTitle রুটিন ও সিলেবাস',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
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
          const SizedBox(height: 12),
          const Divider(height: 1),

          // Routine Items List
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: routineList.length,
              separatorBuilder: (_, __) => const SizedBox(height: 14),
              itemBuilder: (context, index) {
                final item = routineList[index];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF27272A) : const Color(0xFFFAFAFA),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE4E4E7),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              color: const Color(0xFF0B6B42),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              '${index + 1}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.subject,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? Colors.white : Colors.black87,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${item.date} (${item.dayName}) • ${item.time}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark ? Colors.white60 : Colors.black54,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF18181B) : Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE4E4E7),
                              ),
                            ),
                            child: Text(
                              '${item.durationMinutes} মি. | ${item.totalMarks} নম্বর',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Chapter List
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF18181B) : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(LucideIcons.bookOpen, size: 12, color: Color(0xFF0B6B42)),
                                SizedBox(width: 6),
                                Text(
                                  'সিলেবাস:',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF0B6B42),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: item.chapters.map((ch) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF0B6B42).withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    ch,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                      color: isDark ? Colors.white70 : Colors.black87,
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // Footer Action Buttons
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 48,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF0B6B42),
                        side: const BorderSide(color: Color(0xFF0B6B42), width: 1.5),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () => _downloadPdf(context, routineList, isHSC),
                      icon: const Icon(LucideIcons.download, size: 18),
                      label: const Text('রুটিন PDF', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0B6B42),
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
        ],
      ),
    );
  }
}
