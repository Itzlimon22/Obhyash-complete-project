import 'package:flutter_test/flutter_test.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:bangla_pdf/bangla_pdf.dart' as bn;

void main() {
  test('BanglaPdf auto shaping renders mixed Bengali and English cleanly', () async {
    bn.BanglaPdf.configure(shapingMode: bn.BanglaShapingMode.auto);
    final doc = pw.Document();

    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (context) {
          return pw.Column(
            children: [
              bn.AutoText(
                'অভ্যাস – KUET 22-23 (৪টি বিষয়)',
                fontSize: 14,
                fontWeight: pw.FontWeight.bold,
              ),
              bn.AutoText(
                '১. Select the correct term for: \'A handwriting that cannot be read easily.\'',
                fontSize: 8.2,
              ),
              bn.AutoText(
                '(ক) Legible  (খ) Illegible  (গ) Audible  (ঘ) Inaudible',
                fontSize: 8.2,
              ),
              bn.AutoText(
                '২. একটি বৃত্তের ব্যাসার্ধ r = (৫ ± ০.২) cm হলে ক্ষেত্রফল নির্ণয় কর।',
                fontSize: 8.2,
              ),
              bn.AutoText(
                'F = G (m₁ m₂ / r²), a = 9.8 ms⁻²',
                fontSize: 8.2,
              ),
              bn.AutoText(
                'যুক্তবর্ণ পরীক্ষা: ক্ষ, জ্ঞ, ঙ্ক, ঙ্গ, ঙ্ঘ, ষ্ণ, ষ্ঠ, ঞ্চ, ঞ্ছ, ঞ্জ, ঞ্ঝ, ত্ত, ত্র, ্য, ্ব, শ্র, হ্ণ, হ্ন, হ্ম, হ্ল',
                fontSize: 9,
              ),
              bn.AutoText(
                'বিশেষ নির্দেশাবলী: প্রতিটি প্রশ্নের সঠিক উত্তরের জন্য ১ নম্বর বরাদ্দ এবং ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা যাবে।',
                fontSize: 8,
              ),
            ],
          );
        },
      ),
    );

    final bytes = await doc.save();
    expect(bytes.isNotEmpty, isTrue);
  });
}
