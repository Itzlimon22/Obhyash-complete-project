import 'package:flutter_test/flutter_test.dart';
import 'package:obhyash_app/core/utils/bangla_name_helper.dart';
import 'package:obhyash_app/features/exam/domain/exam_models.dart';
import 'package:obhyash_app/features/exam/services/pdf_download_service.dart';

void main() {
  group('PdfDownloadService Math Formatting Tests', () {
    test('Formats chemical reaction without ightarrow bug', () {
      const raw = r'2\text{CuSO}_4 + 4\text{KI} \rightarrow 2\text{K}_2\text{SO}_4 + \text{Cu}_2\text{I}_2 + \text{I}_2';
      final formatted = PdfDownloadService.formatMathForPdf(raw);

      expect(formatted.contains('ightarrow'), isFalse);
      expect(formatted.contains('→'), isTrue);
      expect(formatted.contains('CuSO₄'), isTrue);
      expect(formatted.contains('K₂SO₄'), isTrue);
      expect(formatted.contains('Cu₂I₂'), isTrue);
      expect(formatted.contains('I₂'), isTrue);
    });

    test('Formats chemical reaction with condition over arrow', () {
      const raw = r'\text{C}_2\text{H}_5\text{OH} \xrightarrow{\text{গাঢ় } \text{H}_2\text{SO}_4, 165-170^\circ\text{C}} \text{CH}_2=\text{CH}_2 + \text{H}_2\text{O}';
      final formatted = PdfDownloadService.formatMathForPdf(raw);

      expect(formatted.contains('xrightarrow'), isFalse);
      expect(formatted.contains('165-170°C'), isTrue);
      expect(formatted.contains('H₂SO₄'), isTrue);
      expect(formatted.contains('──>'), isTrue);
    });

    test('Formats vectors and inverse trigonometry', () {
      const raw = r'|\vec{A} + \vec{B}| = |\vec{A} - \vec{B}|, \quad \theta = \tan^{-1}(1/2)';
      final formatted = PdfDownloadService.formatMathForPdf(raw);

      expect(formatted.contains(r'\vec'), isFalse);
      expect(formatted.contains('A⃗'), isTrue);
      expect(formatted.contains('B⃗'), isTrue);
      expect(formatted.contains('θ'), isTrue);
      expect(formatted.contains('tan⁻¹'), isTrue);
    });

    test('Formats units with negative powers and dimensions', () {
      const raw = r'\text{ত্বরণ } a = 9.8\text{ ms}^{-2}, \text{ মাত্রা } [MLT^{-2}]';
      final formatted = PdfDownloadService.formatMathForPdf(raw);

      expect(formatted.contains('ms⁻²'), isTrue);
      expect(formatted.contains('[MLT⁻²]'), isTrue);
    });

    test('Strips institute tags and preserves physics dimensions', () {
      const q1 = 'নিচের কোনটি আয়নিক এবং সমযোজী বন্ধনের উদাহরণ? [MGCC ২০২৪, BMARPC ২০২৩, BUET ২০১২]';
      final f1 = PdfDownloadService.formatMathForPdf(q1);
      expect(f1, 'নিচের কোনটি আয়নিক এবং সমযোজী বন্ধনের উদাহরণ?');

      const q2 = 'টর্কের মাত্রা কী? [BUET ২০২৪]';
      final f2 = PdfDownloadService.formatMathForPdf(q2);
      expect(f2, 'টর্কের মাত্রা কী?');

      const dim = '[MLT⁻²]';
      final fDim = PdfDownloadService.formatMathForPdf(dim);
      expect(fDim, '[MLT⁻²]');
    });

    test('Strips complex multi-institute tags and cleans punctuation', () {
      const q = 'নিচের কোন জলীয় দ্রবণটির pH এর মান সবচেয়ে বেশি? [DRMC ২০২৪, NDCD ২০২৩, CTG BOARD ২০২১, RU ২০২০, CCC ২০১৫, ComB ২০০৫, MAT ২০১৭, BUET ২০০৮, DU ২০০৭, CU ২০০৪, DRMC ২০১৮]';
      final formatted = PdfDownloadService.formatMathForPdf(q);
      expect(formatted, 'নিচের কোন জলীয় দ্রবণটির pH এর মান সবচেয়ে বেশি?');

      const qPunct = 'বিক্রিয়াটিতে বিজারক কোনটি ? [DU ২০২৪, BUET ২০২৬, RU ২০২২]';
      final formattedPunct = PdfDownloadService.formatMathForPdf(qPunct);
      expect(formattedPunct, 'বিক্রিয়াটিতে বিজারক কোনটি?');
    });

    test('Canonical subject priority places Physics before Chemistry and Math', () {
      final pPhysics = BanglaNameHelper.getSubjectSortPriority('পদার্থবিজ্ঞান');
      final pChemistry = BanglaNameHelper.getSubjectSortPriority('রসায়ন');
      final pMath = BanglaNameHelper.getSubjectSortPriority('উচ্চতর গণিত');

      expect(pPhysics < pChemistry, isTrue);
      expect(pChemistry < pMath, isTrue);
    });

    test('Sorts multi-subject questions canonically: Physics before Chemistry', () {
      final qChem = Question(
        id: '1',
        subject: 'রসায়ন ১ম পত্র',
        subjectLabel: 'রসায়ন',
        chapter: 'অধ্যায় ১',
        topic: 'টপিক ১',
        question: 'রসায়ন প্রশ্ন',
        options: ['ক', 'খ', 'গ', 'ঘ'],
        correctAnswerIndex: 0,
        points: 1,
      );
      final qPhys = Question(
        id: '2',
        subject: 'পদার্থবিজ্ঞান ১ম পত্র',
        subjectLabel: 'পদার্থবিজ্ঞান',
        chapter: 'অধ্যায় ১',
        topic: 'টপিক ১',
        question: 'পদার্থবিজ্ঞান প্রশ্ন',
        options: ['ক', 'খ', 'গ', 'ঘ'],
        correctAnswerIndex: 0,
        points: 1,
      );

      final list = [qChem, qPhys];
      list.sort((a, b) {
        final subA = BanglaNameHelper.getMainSubjectName(a.subject, a.subjectLabel);
        final subB = BanglaNameHelper.getMainSubjectName(b.subject, b.subjectLabel);
        final pA = BanglaNameHelper.getSubjectSortPriority(subA, a.subject);
        final pB = BanglaNameHelper.getSubjectSortPriority(subB, b.subject);
        if (pA != pB) return pA.compareTo(pB);
        return 0;
      });

      expect(list.first.subjectLabel, 'পদার্থবিজ্ঞান');
      expect(list.last.subjectLabel, 'রসায়ন');
    });
  });
}

