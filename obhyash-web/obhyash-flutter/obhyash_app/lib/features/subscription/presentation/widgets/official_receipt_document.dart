import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import '../../domain/models.dart';
import '../../../../core/services/download_notification_service.dart';

/// Service to generate, capture, and download official payment receipts
/// with 100% accurate Bengali font rendering and professional invoice layout.
class OfficialReceiptService {
  static Future<void> downloadReceipt({
    required BuildContext context,
    required Invoice invoice,
    required String userName,
    required String userEmail,
    required String userInstitute,
  }) async {
    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(
        child: Card(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF059669)),
                ),
                SizedBox(width: 16),
                Text(
                  'রিসিট প্রস্তুত হচ্ছে...',
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    try {
      final receiptKey = GlobalKey();

      // Render offscreen widget overlay to capture crisp 3x image
      final overlayState = Overlay.of(context);
      final overlayEntry = OverlayEntry(
        builder: (ctx) => Positioned(
          left: -2000,
          top: -2000,
          child: RepaintBoundary(
            key: receiptKey,
            child: SizedBox(
              width: 595, // Standard A4 width in points
              child: OfficialReceiptCard(
                invoice: invoice,
                userName: userName,
                userEmail: userEmail,
                userInstitute: userInstitute,
              ),
            ),
          ),
        ),
      );

      overlayState.insert(overlayEntry);

      // Allow Flutter engine to layout and paint the widget
      await Future.delayed(const Duration(milliseconds: 250));

      final boundary =
          receiptKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;

      if (boundary == null) {
        throw Exception('রিসিট রেন্ডার করা যায়নি');
      }

      final ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      final ByteData? byteData =
          await image.toByteData(format: ui.ImageByteFormat.png);

      overlayEntry.remove();

      if (byteData == null) {
        throw Exception('রিসিট ইমেজ তৈরি করা যায়নি');
      }

      final pngBytes = byteData.buffer.asUint8List();

      // Convert captured high-res image into an official A4 PDF Document
      final pdfDoc = pw.Document();
      final pdfImage = pw.MemoryImage(pngBytes);

      pdfDoc.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(16),
          build: (pw.Context pwContext) {
            return pw.Center(
              child: pw.Image(pdfImage, fit: pw.BoxFit.contain),
            );
          },
        ),
      );

      final pdfBytes = await pdfDoc.save();

      // Dismiss loading dialog
      if (context.mounted) {
        Navigator.of(context, rootNavigator: true).pop();
      }

      final shortId = invoice.id.length > 8
          ? invoice.id.substring(0, 8).toUpperCase()
          : invoice.id.toUpperCase();

      // Save PDF and notify user with tap-to-open
      if (context.mounted) {
        await DownloadNotificationService().savePdfAndNotify(
          bytes: pdfBytes,
          rawFileName: 'obhyash_receipt_$shortId',
          notificationTitle: 'অফিসিয়াল পেমেন্ট রিসিট (#$shortId)',
          context: context,
        );
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.of(context, rootNavigator: true).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text('রিসিট ডাউনলোডে সমস্যা হয়েছে: $e'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }
}

/// The Official Purchase Receipt Document Widget
class OfficialReceiptCard extends StatelessWidget {
  final Invoice invoice;
  final String userName;
  final String userEmail;
  final String userInstitute;

  const OfficialReceiptCard({
    super.key,
    required this.invoice,
    required this.userName,
    required this.userEmail,
    required this.userInstitute,
  });

  String _statusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'approved':
        return 'পরিশোধিত (PAID)';
      case 'pending':
        return 'প্রক্রিয়াধীন (PENDING)';
      case 'rejected':
        return 'বাতিল (REJECTED)';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final shortId = invoice.id.length > 8
        ? invoice.id.substring(0, 8).toUpperCase()
        : invoice.id.toUpperCase();
    final displayName = userName.isNotEmpty ? userName : 'সম্মানিত শিক্ষার্থী';

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── 1. Header with Branding & Title ─────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF059669),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'অভ্যাস',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'OBHYASH',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'স্মার্ট এডুকেশন ও এক্সাম প্রিপারেশন প্ল্যাটফর্ম',
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 12,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const Text(
                    'web: obhyash.com • support@obhyash.com',
                    style: TextStyle(
                      fontSize: 11,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'পেমেন্ট রিসিট',
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF059669),
                    ),
                  ),
                  const Text(
                    'OFFICIAL RECEIPT',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.0,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'রিসিট নং: #$shortId',
                    style: const TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 24),
          const Divider(color: Color(0xFFE2E8F0), thickness: 1.5),
          const SizedBox(height: 16),

          // ── 2. Billed To & Payment Metadata ─────────────────────────────────
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 5,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'গ্রাহকের তথ্য (BILLED TO):',
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      displayName,
                      style: const TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    if (userEmail.isNotEmpty)
                      Text(
                        userEmail,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF475569),
                        ),
                      ),
                    if (userInstitute.isNotEmpty)
                      Text(
                        userInstitute,
                        style: const TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 12,
                          color: Color(0xFF475569),
                        ),
                      ),
                  ],
                ),
              ),
              Expanded(
                flex: 4,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _metaRow('প্রদানের তারিখ:', invoice.date),
                    const SizedBox(height: 4),
                    _metaRow(
                      'পেমেন্ট স্ট্যাটাস:',
                      _statusLabel(invoice.status),
                      valueColor: const Color(0xFF059669),
                      isBold: true,
                    ),
                    const SizedBox(height: 4),
                    _metaRow(
                      'পেমেন্ট মেথড:',
                      invoice.amount == 0 ? 'রেফারেল রিওয়ার্ড' : 'অনলাইন পেমেন্ট',
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // ── 3. Itemized Table ───────────────────────────────────────────────
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                // Table Header
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: const BoxDecoration(
                    color: Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
                  ),
                  child: const Row(
                    children: [
                      SizedBox(
                        width: 30,
                        child: Text(
                          'নং',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                            color: Color(0xFF475569),
                          ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          'সেবার বিবরণ (Description)',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                            color: Color(0xFF475569),
                          ),
                        ),
                      ),
                      SizedBox(
                        width: 80,
                        child: Text(
                          'মূল্য',
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                            color: Color(0xFF475569),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: Color(0xFFE2E8F0)),

                // Table Row
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                  child: Row(
                    children: [
                      const SizedBox(
                        width: 30,
                        child: Text(
                          '০১',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 13,
                            color: Color(0xFF334155),
                          ),
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              invoice.planName,
                              style: const TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'অভ্যাস প্রিমিয়াম অ্যাক্সেস ও লাইভ এক্সাম ফিচারসমূহ',
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontSize: 11,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(
                        width: 80,
                        child: Text(
                          '${invoice.currency} ${invoice.amount}.00',
                          textAlign: TextAlign.right,
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ── 4. Total Calculation ────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Container(
                width: 220,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    _summaryRow('সাবটোটাল:', '${invoice.currency} ${invoice.amount}.00'),
                    const SizedBox(height: 4),
                    _summaryRow('ডিসকাউন্ট:', '৳ 0.00'),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 6),
                      child: Divider(height: 1, color: Color(0xFFCBD5E1)),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'সর্বমোট পরিশোধ:',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          '${invoice.currency} ${invoice.amount}.00',
                          style: const TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF059669),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // ── 5. Official Verification Stamp & Footer ─────────────────────────
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFECFDF5),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFA7F3D0)),
            ),
            child: Row(
              children: [
                const Icon(
                  LucideIcons.checkCheck,
                  size: 24,
                  color: Color(0xFF059669),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'পেমেন্ট নিশ্চিত ও ভেরিফাইড (VERIFIED & CONFIRMED)',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF065F46),
                        ),
                      ),
                      Text(
                        'এটি একটি ইলেকট্রনিক জেনারেটেড অফিসিয়াল মানি রিসিট। কোনো স্বাক্ষর বা সিলমোহরের প্রয়োজন নেই।',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 10.5,
                          color: Color(0xFF047857),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),
          const Center(
            child: Text(
              'অভ্যাস (Obhyash) প্ল্যাটফর্ম ব্যবহার করার জন্য আপনাকে ধন্যবাদ!',
              style: TextStyle(
                fontFamily: 'HindSiliguri',
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: Color(0xFF64748B),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _metaRow(String label, String value, {Color? valueColor, bool isBold = false}) {
    return Row(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 12,
            color: Color(0xFF64748B),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          value,
          style: TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 12,
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w600,
            color: valueColor ?? const Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }

  Widget _summaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 12,
            color: Color(0xFF64748B),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Color(0xFF334155),
          ),
        ),
      ],
    );
  }
}
