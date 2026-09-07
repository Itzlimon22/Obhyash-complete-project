import 'package:flutter_test/flutter_test.dart';
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
  });
}
