import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../../../core/services/download_notification_service.dart';
import '../../services/live_exam_routine_service.dart';

class LiveExamRoutineSheet extends ConsumerStatefulWidget {
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

  static String toBanglaDigits(dynamic number) {
    const en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    String s = number.toString();
    for (int i = 0; i < 10; i++) {
      s = s.replaceAll(en[i], bn[i]);
    }
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
        return 'এসএসসি বোর্ড মডেল';
      case 'ssc_school':
        return 'শীর্ষ স্কুল ও ক্যাডেট';
      case 'ssc_science':
        return 'এসএসসি বিজ্ঞান বিভাগ';
      case 'ssc_business':
        return 'এসএসসি বাণিজ্য বিভাগ';
      case 'ssc_humanities':
        return 'এসএসসি মানবিক বিভাগ';
      case 'ssc_compulsory':
        return 'এসএসসি আবশ্যিক বিষয়';
      default:
        return cat.isNotEmpty ? cat : 'ভর্তি পরীক্ষা';
    }
  }

  @override
  ConsumerState<LiveExamRoutineSheet> createState() => _LiveExamRoutineSheetState();
}

class _LiveExamRoutineSheetState extends ConsumerState<LiveExamRoutineSheet> {
  late String _activeTrack;
  List<GoogleSheetRoutineItem> _items = [];
  bool _isLoading = true;
  String _searchQuery = '';

  static const List<Map<String, String>> _tracks = [
    {'key': 'Medical', 'label': 'মেডিকেল', 'badge': 'MBBS ২০২৬-২৭'},
    {'key': 'Engineering', 'label': 'ইঞ্জিনিয়ারিং', 'badge': 'BUET/CKRUET'},
    {'key': 'Varsity_A', 'label': 'ঢাবি \'ক\' ইউনিট', 'badge': 'DU Science'},
  ];

  @override
  void initState() {
    super.initState();
    _activeTrack = LiveExamGoogleSheetService.getSheetName(widget.categoryTitle);
    _loadRoutineData();
  }

  Future<void> _loadRoutineData() async {
    setState(() => _isLoading = true);
    final data = await LiveExamGoogleSheetService.fetchRoutine(_activeTrack);
    if (mounted) {
      setState(() {
        _items = data;
        _isLoading = false;
      });
    }
  }

  void _switchTrack(String trackKey) {
    if (_activeTrack == trackKey) return;
    setState(() {
      _activeTrack = trackKey;
    });
    _loadRoutineData();
  }

  List<GoogleSheetRoutineItem> get _filteredItems {
    if (_searchQuery.trim().isEmpty) return _items;
    final q = _searchQuery.toLowerCase().trim();
    return _items.where((item) {
      return item.examName.toLowerCase().contains(q) ||
          item.subject.toLowerCase().contains(q) ||
          item.syllabus.toLowerCase().contains(q) ||
          item.date.toLowerCase().contains(q) ||
          item.dayName.toLowerCase().contains(q);
    }).toList();
  }

  Future<void> _downloadPdf(BuildContext context) async {
    if (_items.isEmpty) return;

    final fontRegular = await PdfGoogleFonts.hindSiliguriRegular();
    final fontBold = await PdfGoogleFonts.hindSiliguriBold();

    final theme = pw.ThemeData.withFont(
      base: fontRegular,
      bold: fontBold,
    );

    final pdf = pw.Document(theme: theme);
    final trackName = _tracks.firstWhere(
      (t) => t['key'] == _activeTrack,
      orElse: () => {'label': 'ভর্তি পরীক্ষা'},
    )['label']!;

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 24, vertical: 20),
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
                        'অ',
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
                          'অভ্যাস (Obhyash)',
                          style: pw.TextStyle(
                            fontSize: 18,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('004633'),
                          ),
                        ),
                        pw.Text(
                          'স্মার্ট লাইভ পরীক্ষা প্রস্তুতি প্ল্যাটফর্ম • obhyash.com',
                          style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey700),
                        ),
                      ],
                    ),
                  ],
                ),
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromHex('E8F5E9'),
                    borderRadius: pw.BorderRadius.circular(16),
                    border: pw.Border.all(color: PdfColor.fromHex('A5D6A7')),
                  ),
                  child: pw.Text(
                    'অফিশিয়াল লাইভ রুটিন',
                    style: pw.TextStyle(
                      fontSize: 9.5,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColor.fromHex('004633'),
                    ),
                  ),
                ),
              ],
            ),
            pw.SizedBox(height: 10),
            pw.Divider(color: PdfColor.fromHex('004633'), thickness: 1.2),
            pw.SizedBox(height: 8),

            // Title Banner
            pw.Container(
              width: double.infinity,
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                color: PdfColor.fromHex('F8FAF9'),
                borderRadius: pw.BorderRadius.circular(6),
                border: pw.Border.all(color: PdfColor.fromHex('E0E7E3')),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    '$trackName - সাপ্তাহিক লাইভ পরীক্ষা ও পূর্ণাঙ্গ সিলেবাস ২০২৬-২৭',
                    style: pw.TextStyle(
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColor.fromHex('004633'),
                    ),
                  ),
                  pw.SizedBox(height: 2),
                  pw.Text(
                    'সাপ্তাহিক লাইভ পরীক্ষা প্রতি রবিবার, মঙ্গলবার, বৃহস্পতিবার এবং শুক্রবার রাত ৮:০০ টা থেকে রাত ১১:০০ টা পর্যন্ত লাইভ থাকবে।',
                    style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey800),
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 10),

            // Table
            pw.TableHelper.fromTextArray(
              headers: [
                'ক্রম',
                'তারিখ ও বার',
                'পরীক্ষার নাম ও বিষয়',
                'সিলেবাস (অধ্যায়সমূহ)',
                'নম্বর ও সময়',
              ],
              columnWidths: {
                0: const pw.FixedColumnWidth(24),
                1: const pw.FlexColumnWidth(1.6),
                2: const pw.FlexColumnWidth(2.0),
                3: const pw.FlexColumnWidth(3.8),
                4: const pw.FlexColumnWidth(1.6),
              },
              headerStyle: pw.TextStyle(
                fontSize: 9,
                fontWeight: pw.FontWeight.bold,
                color: PdfColors.white,
              ),
              headerDecoration: pw.BoxDecoration(
                color: PdfColor.fromHex('004633'),
              ),
              cellStyle: const pw.TextStyle(fontSize: 8.5),
              cellAlignment: pw.Alignment.topLeft,
              cellPadding: const pw.EdgeInsets.symmetric(horizontal: 5, vertical: 5),
              data: _items.asMap().entries.map((entry) {
                final idx = entry.key + 1;
                final item = entry.value;
                return [
                  LiveExamRoutineSheet.toBanglaDigits(idx),
                  '${item.date}\n(${item.dayName})',
                  '${item.examName}\n(${item.subject})',
                  item.chapters.join('; '),
                  '${LiveExamRoutineSheet.toBanglaDigits(item.totalMarks)} নম্বর\n${LiveExamRoutineSheet.toBanglaDigits(item.durationMinutes)} মিনিট',
                ];
              }).toList(),
            ),

            pw.SizedBox(height: 12),

            // Notice Box
            pw.Container(
              padding: const pw.EdgeInsets.all(8),
              decoration: pw.BoxDecoration(
                color: PdfColor.fromHex('F3F4F6'),
                borderRadius: pw.BorderRadius.circular(6),
                border: pw.Border.all(color: PdfColor.fromHex('E5E7EB')),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    '📌 নির্দেশাবলী:',
                    style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('004633')),
                  ),
                  pw.SizedBox(height: 2),
                  pw.Text(
                    '১. প্রতিটি ভুল উত্তরের জন্য ০.২৫ নম্বর কর্তন করা হবে।\n২. পরীক্ষা সমাপ্তির পর স্বয়ংক্রিয়ভাবে বিস্তারিত সমাধান ও মেধা তালিকা (Leaderboard) প্রকাশিত হবে।',
                    style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey800),
                  ),
                ],
              ),
            ),
          ];
        },
      ),
    );

    final bytes = await pdf.save();
    final fileName = 'Obhyash_${_activeTrack}_Routine';

    try {
      final file = await DownloadNotificationService().savePdfAndNotify(
        bytes: bytes,
        rawFileName: fileName,
        notificationTitle: '$trackName রুটিন',
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

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final filtered = _filteredItems;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141417) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Handle
          const SizedBox(height: 10),
          Container(
            width: 38,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 10),

          // Header Bar
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
                            child: const Text(
                              'অফিশিয়াল লাইভ রুটিন',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF004633),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '২০২৬-২৭ সেশন',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? Colors.white54 : Colors.black54,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'ভর্তি পরীক্ষা রুটিন ও পূর্ণাঙ্গ সিলেবাস',
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

          // Track Switcher Buttons
          SizedBox(
            height: 38,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 18),
              scrollDirection: Axis.horizontal,
              itemCount: _tracks.length,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final track = _tracks[idx];
                final isSelected = _activeTrack == track['key'];

                return GestureDetector(
                  onTap: () => _switchTrack(track['key']!),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFF004633)
                          : (isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5)),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFF004633)
                            : (isDark ? const Color(0xFF3F3F46) : const Color(0xFFE4E4E7)),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          track['label']!,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? Colors.white.withValues(alpha: 0.2)
                                : (isDark ? const Color(0xFF18181B) : Colors.white),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            track['badge']!,
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w600,
                              color: isSelected ? Colors.white : (isDark ? Colors.white54 : Colors.black54),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 10),

          // Search Field
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18),
            child: Container(
              height: 38,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1F2026) : const Color(0xFFF4F4F5),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isDark ? const Color(0xFF2E303B) : const Color(0xFFE4E4E7),
                ),
              ),
              child: TextField(
                onChanged: (val) => setState(() => _searchQuery = val),
                style: const TextStyle(fontSize: 12.5),
                decoration: InputDecoration(
                  hintText: 'অধ্যায় বা বিষয় খুঁজুন (উদা: ভেক্টর, সমাণুতা)...',
                  hintStyle: TextStyle(
                    fontSize: 11.5,
                    color: isDark ? Colors.white38 : Colors.black38,
                  ),
                  prefixIcon: const Icon(LucideIcons.search, size: 15, color: Colors.grey),
                  contentPadding: const EdgeInsets.symmetric(vertical: 8),
                  border: InputBorder.none,
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          const Divider(height: 1),

          // Items List
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFF004633)),
                  )
                : filtered.isEmpty
                    ? Center(
                        child: Text(
                          'কোনো পরীক্ষা পাওয়া যায়নি',
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark ? Colors.white54 : Colors.black54,
                          ),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: filtered.length,
                        separatorBuilder: (context, index) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final item = filtered[index];
                          final isMega = item.examName.toLowerCase().contains('mega') ||
                              item.examName.toLowerCase().contains('mock');

                          return Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isMega
                                  ? (isDark
                                      ? const Color(0xFF004633).withValues(alpha: 0.15)
                                      : const Color(0xFFF0FDF4))
                                  : (isDark ? const Color(0xFF1C1D24) : Colors.white),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isMega
                                    ? const Color(0xFF004633).withValues(alpha: 0.4)
                                    : (isDark ? const Color(0xFF2E303B) : const Color(0xFFE4E4E7)),
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
                                        color: isMega
                                            ? const Color(0xFF004633)
                                            : (isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5)),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      alignment: Alignment.center,
                                      child: Text(
                                        LiveExamRoutineSheet.toBanglaDigits(index + 1),
                                        style: TextStyle(
                                          color: isMega ? Colors.white : const Color(0xFF004633),
                                          fontWeight: FontWeight.bold,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item.examName,
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          const SizedBox(height: 1),
                                          Text(
                                            '${item.date} (${item.dayName}) • ${item.subject}',
                                            style: TextStyle(
                                              fontSize: 11,
                                              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: isDark ? const Color(0xFF141417) : const Color(0xFFF4F4F5),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(
                                          color: isDark ? const Color(0xFF2E303B) : const Color(0xFFE4E4E7),
                                        ),
                                      ),
                                      child: Text(
                                        '${LiveExamRoutineSheet.toBanglaDigits(item.durationMinutes)} মি. | ${LiveExamRoutineSheet.toBanglaDigits(item.totalMarks)} নম্বর',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF004633),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),

                                // Syllabus Box
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF14151B) : const Color(0xFFF9FAFB),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(LucideIcons.bookOpen, size: 12, color: Color(0xFF004633)),
                                          const SizedBox(width: 5),
                                          Text(
                                            'সিলেবাস:',
                                            style: TextStyle(
                                              fontSize: 10.5,
                                              fontWeight: FontWeight.bold,
                                              color: isDark ? Colors.white70 : const Color(0xFF004633),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Wrap(
                                        spacing: 4,
                                        runSpacing: 4,
                                        children: item.chapters.map((ch) {
                                          return Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: isDark ? const Color(0xFF27272A) : Colors.white,
                                              borderRadius: BorderRadius.circular(4),
                                              border: Border.all(
                                                color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E7EB),
                                              ),
                                            ),
                                            child: Text(
                                              ch,
                                              style: TextStyle(
                                                fontSize: 10,
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
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 14),
              child: Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 44,
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF004633),
                          side: const BorderSide(color: Color(0xFF004633), width: 1.5),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () => _downloadPdf(context),
                        icon: const Icon(LucideIcons.download, size: 16),
                        label: const Text('রুটিন PDF', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SizedBox(
                      height: 44,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF004633),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () => Navigator.pop(context),
                        child: const Text('ঠিক আছে', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
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
