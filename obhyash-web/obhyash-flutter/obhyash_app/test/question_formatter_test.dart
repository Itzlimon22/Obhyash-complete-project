import 'package:flutter_test/flutter_test.dart';
import 'package:obhyash_app/core/utils/bangla_name_helper.dart';
import 'package:obhyash_app/core/utils/question_formatter.dart';

void main() {
  group('QuestionFormatter Auto-Healing Tests', () {
    test('Heals Question 8: Vertical tab (\\u000b) and \\vec corruption with pipes', () {
      const raw = 'যদি |\u000bec{A} + \u000bec{B}| = |\u000bec{A} - \u000bec{B}| হয়, তবে ভেক্টরদ্বয়ের মধ্যবর্তী কোণ কত?';
      final formatted = QuestionFormatter.format(raw);

      expect(formatted.contains('\u000b'), isFalse);
      expect(formatted.contains(r'\vec{A}'), isTrue);
      expect(formatted.contains(r'\vec{B}'), isTrue);
      expect(formatted.contains(r'$|\vec{A} + \vec{B}| = |\vec{A} - \vec{B}|$'), isTrue);
      expect(formatted.contains('\n'), isFalse, reason: 'Should not have sudden line breaks');
    });

    test('Heals Question 26: Ratio and daari spacing after math', () {
      const raw = r'বলদ্বয়ের অনুপাত 3 : 5 এবং মধ্যবর্তী কোণ 60° হলে লব্ধি $35\text{ N}$। ছোট বলটির মান কত?';
      final formatted = QuestionFormatter.format(raw);

      expect(formatted.contains(r'$3:5$'), isTrue);
      expect(formatted.contains(r'$35\text{ N}$' + '\u2009' + '।'), isTrue,
          reason: 'Daari should have narrow space so it does not look like pipe |');
    });

    test('Heals Question 28: \$R\$ and daari without breaking sentence prematurely', () {
      const raw = r'দুটি বল $P$ ও $Q$-এর লব্ধি $R$। $Q$-কে দ্বিগুণ করলে লব্ধি $P$-এর উপর লম্ব হয়। কোনটি সঠিক?';
      final formatted = QuestionFormatter.format(raw);

      expect(formatted.contains(r'$R$' + '\u2009' + '।'), isTrue);
      expect(formatted.contains('\n\nকোনটি সঠিক?'), isFalse,
          reason: 'Sentence should flow continuously without artificial line break');
    });

    test('Heals unescaped control characters: alpha, beta, approx', () {
      const raw = 'যদি একটি ভেক্টর তিনটি অক্ষের সাথেই সমান কোণ (\u0007lpha = \u0008eta = \\gamma) উৎপন্ন করে';
      final formatted = QuestionFormatter.format(raw);

      expect(formatted.contains('\u0007'), isFalse);
      expect(formatted.contains('\u0008'), isFalse);
      expect(formatted.contains(r'\alpha'), isTrue);
      expect(formatted.contains(r'\beta'), isTrue);
    });

    test('Preserves multi-part Roman list questions with clean linebreaks', () {
      const raw = 'তিনটি ভেক্টর-\ni. (3/14)i - (2/7)j + (2/7)k\nii. i + j + k\niii. A/|A|\nনিচের কোনটি সঠিক?';
      final formatted = QuestionFormatter.format(raw);

      expect(formatted.contains('**i.**'), isTrue);
      expect(formatted.contains('**ii.**'), isTrue);
      expect(formatted.contains('\n\nনিচের কোনটি সঠিক?'), isTrue,
          reason: 'Multi-statement questions should keep concluding question on new line');
    });

    test('Explanation auto-formatting: transitions and math healing', () {
      const rawExp = 'ধরি, বেগ v = 5 ms^-1। শর্তমতে ec{v} লম্ব। সুতরাং, θ = 90°।';
      final formatted = QuestionFormatter.format(rawExp);

      expect(formatted.contains(r'\vec{v}'), isTrue);
      expect(formatted.contains('ms⁻¹'), isTrue);
    });

    test('Topic search variants generate clean stripped prefixes and conjunctions', () {
      final variants = BanglaNameHelper.getTopicSearchVariants(
        'টপিক ০১: ভেক্টর রাশির যোজন ও বিয়োজন (সামান্তরিক সূত্র)',
      );

      expect(variants.contains('টপিক ০১: ভেক্টর রাশির যোজন ও বিয়োজন (সামান্তরিক সূত্র)'), isTrue);
      expect(variants.any((v) => v.contains('সামান্তরিক সূত্র')), isTrue);
      expect(variants.any((v) => v.contains('ভেক্টর রাশির যোজন')), isTrue);
      expect(variants.any((v) => v.contains('বিয়োজন') || v.contains('বিয়োজন')), isTrue);
    });
    test('Does not wrap English prose sentences in dollar math mode', () {
      const raw =
          'The temperature of an open room of volume 30 m^3 increases from 17 °C to 27 °C due to the sunshine. The atmospheric pressure in the room is 1 x 10^5 Pa.';
      final formatted = QuestionFormatter.format(raw);

      expect(formatted.startsWith(r'$The temperature'), isFalse);
      expect(formatted.contains('The temperature of an open room'), isTrue);
    });

    test('Deduplicates repetitive institute names in QB exam titles', () {
      expect(
        BanglaNameHelper.formatSubject('বুয়েট', 'বুয়েট BUET 24-25 preli'),
        'BUET 24-25 preli',
      );
      expect(
        BanglaNameHelper.formatSubject('রুয়েট', 'রুয়েট RUET 24-25'),
        'RUET 24-25',
      );
      expect(
        BanglaNameHelper.formatSubject('বুয়েট', 'বুয়েট BUET 25-26 written'),
        'BUET 25-26 written',
      );
      expect(
        BanglaNameHelper.formatSubject('medical', 'মেডিকেল Medical MBBS 24-25'),
        'Medical MBBS 24-25',
      );
      expect(
        BanglaNameHelper.formatSubject('bangla_1st', 'বাংলা ১ম পত্র'),
        'বাংলা ১ম পত্র',
      );
      expect(
        BanglaNameHelper.formatSubject('physics_1st'),
        'পদার্থবিজ্ঞান ১ম পত্র',
      );
      expect(
        BanglaNameHelper.formatSubject('hsc_bangla_1', 'hsc_bangla_1'),
        'বাংলা ১ম পত্র',
      );
      expect(
        BanglaNameHelper.formatSubject('hsc_bangla_1'),
        'বাংলা ১ম পত্র',
      );
      expect(
        BanglaNameHelper.formatSubject('hsc_bangla_2', 'hsc_bangla_2'),
        'বাংলা ২য় পত্র',
      );
      expect(
        BanglaNameHelper.formatSubject('hsc_physics_1', 'hsc_physics_1'),
        'পদার্থবিজ্ঞান ১ম পত্র',
      );
      expect(
        BanglaNameHelper.formatSubject('hsc_ict', 'hsc_ict'),
        'তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি)',
      );
    });

    test('Strips SSC and HSC prefixes completely from all subject names', () {
      expect(BanglaNameHelper.cleanSubjectTitle('SSC বাংলা ১ম পত্র'), 'বাংলা ১ম পত্র');
      expect(BanglaNameHelper.cleanSubjectTitle('SSC পদার্থবিজ্ঞান'), 'পদার্থবিজ্ঞান');
      expect(BanglaNameHelper.cleanSubjectTitle('HSC উচ্চতর গণিত ১ম পত্র'), 'উচ্চতর গণিত ১ম পত্র');
      expect(BanglaNameHelper.cleanSubjectTitle('সাধারণ গণিত (SSC)'), 'সাধারণ গণিত');
      expect(BanglaNameHelper.cleanSubjectTitle('SSC - রসায়ন'), 'রসায়ন');

      // formatSubject cleans inputs and labels
      expect(BanglaNameHelper.formatSubject('SSC বাংলা ১ম পত্র'), 'বাংলা ১ম পত্র');
      expect(BanglaNameHelper.formatSubject('ssc_physics', 'SSC পদার্থবিজ্ঞান'), 'পদার্থবিজ্ঞান');
      expect(BanglaNameHelper.formatSubject('ssc_chemistry', 'SSC রসায়ন'), 'রসায়ন');
      expect(BanglaNameHelper.formatSubject('ssc_math', 'SSC সাধারণ গণিত'), 'সাধারণ গণিত');
      expect(BanglaNameHelper.formatSubject('ssc_higher_math', 'SSC উচ্চতর গণিত'), 'উচ্চতর গণিত');
      expect(BanglaNameHelper.formatSubject('ssc_bgs', 'SSC বাংলাদেশ ও বিশ্বপরিচয়'), 'বাংলাদেশ ও বিশ্বপরিচয়');
      expect(BanglaNameHelper.formatSubject('ssc_religion', 'SSC ধর্ম ও নৈতিক শিক্ষা'), 'ধর্ম ও নৈতিক শিক্ষা');
    });

    test('getSubjectPaperSplitVariants accurately treats SSC subjects as single-paper', () {
      final phySplit = BanglaNameHelper.getSubjectPaperSplitVariants('পদার্থবিজ্ঞান', 'পদার্থবিজ্ঞান', true);
      expect(phySplit.paper2.isEmpty, isTrue, reason: 'SSC Physics has no 2nd paper');
      expect(phySplit.paper1.contains('ssc_physics'), isTrue);
      expect(phySplit.paper1.contains('পদার্থবিজ্ঞান'), isTrue);

      final mathSplit = BanglaNameHelper.getSubjectPaperSplitVariants('সাধারণ গণিত', 'সাধারণ গণিত', true);
      expect(mathSplit.paper2.isEmpty, isTrue);
      expect(mathSplit.paper1.contains('ssc_math') || mathSplit.paper1.contains('ssc_general_math'), isTrue);

      final ictSplit = BanglaNameHelper.getSubjectPaperSplitVariants('আইসিটি', 'তথ্য ও যোগাযোগ প্রযুক্তি', true);
      expect(ictSplit.paper2.isEmpty, isTrue);
      expect(ictSplit.paper1.contains('ssc_ict'), isTrue);

      // Business Studies subjects
      final accSplit = BanglaNameHelper.getSubjectPaperSplitVariants('হিসাববিজ্ঞান', 'হিসাববিজ্ঞান', true);
      expect(accSplit.paper2.isEmpty, isTrue);
      expect(accSplit.paper1.contains('ssc_accounting'), isTrue);

      final bizSplit = BanglaNameHelper.getSubjectPaperSplitVariants('ব্যবসায় উদ্যোগ', 'ব্যবসায় উদ্যোগ', true);
      expect(bizSplit.paper2.isEmpty, isTrue);
      expect(bizSplit.paper1.contains('ssc_business_ent'), isTrue);

      final finSplit = BanglaNameHelper.getSubjectPaperSplitVariants('ফিন্যান্স ও ব্যাংকিং', 'ফিন্যান্স ও ব্যাংকিং', true);
      expect(finSplit.paper2.isEmpty, isTrue);
      expect(finSplit.paper1.contains('ssc_finance_banking'), isTrue);

      // Humanities subjects
      final histSplit = BanglaNameHelper.getSubjectPaperSplitVariants('ইতিহাস ও বিশ্ব সভ্যতা', 'ইতিহাস ও বিশ্ব সভ্যতা', true);
      expect(histSplit.paper2.isEmpty, isTrue);
      expect(histSplit.paper1.contains('ssc_history_bd'), isTrue);

      final geoSplit = BanglaNameHelper.getSubjectPaperSplitVariants('ভূগোল ও পরিবেশ', 'ভূগোল ও পরিবেশ', true);
      expect(geoSplit.paper2.isEmpty, isTrue);
      expect(geoSplit.paper1.contains('ssc_geography'), isTrue);

      final civSplit = BanglaNameHelper.getSubjectPaperSplitVariants('পৌরনীতি ও নাগরিকতা', 'পৌরনীতি ও নাগরিকতা', true);
      expect(civSplit.paper2.isEmpty, isTrue);
      expect(civSplit.paper1.contains('ssc_civics'), isTrue);

      final econSplit = BanglaNameHelper.getSubjectPaperSplitVariants('অর্থনীতি', 'অর্থনীতি', true);
      expect(econSplit.paper2.isEmpty, isTrue);
      expect(econSplit.paper1.contains('ssc_economics'), isTrue);

      final sciSplit = BanglaNameHelper.getSubjectPaperSplitVariants('সাধারণ বিজ্ঞান', 'সাধারণ বিজ্ঞান', true);
      expect(sciSplit.paper2.isEmpty, isTrue);
      expect(sciSplit.paper1.contains('ssc_general_science'), isTrue);
    });
  });
}
