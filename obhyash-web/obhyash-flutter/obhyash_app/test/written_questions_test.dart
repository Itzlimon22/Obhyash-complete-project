import 'package:flutter_test/flutter_test.dart';
import 'package:obhyash_app/features/exam/domain/exam_models.dart';
import 'package:obhyash_app/features/question_bank/services/question_bank_service.dart';

void main() {
  group('Written Questions Parsing & Logic Tests', () {
    test('Parses written_questions row into Question model correctly', () {
      final rawRow = {
        'id': 'b4138045-4195-47b1-93db-51072769b017',
        'question': r'$k$-এর মান কত হলে, $y = k(x - 1)(x + 2)$ বক্ররেখার $x = 1$ বিন্দুতে স্পর্শক $x$-অক্ষের সাথে $60^\circ$ কোণ উৎপন্ন করবে?',
        'explanation': r'**সমাধান:** $k = \frac{1}{\sqrt{3}}$',
        'total_marks': 4,
        'difficulty': 'Hard',
        'type': 'Written',
        'subject': 'উচ্চতর গণিত ১ম পত্র',
        'chapter': 'অন্তরীকরণ',
        'institutes': ['BUET'],
        'years': [2013],
      };

      final q = Question.fromJson(rawRow);

      expect(q.id, 'b4138045-4195-47b1-93db-51072769b017');
      expect(q.points, 4);
      expect(q.options, isEmpty);
      expect(q.type, 'Written');
      expect(q.institutes, ['BUET']);
      expect(q.years, [2013]);
      expect(q.explanation, contains(r'k = \frac{1}{\sqrt{3}}'));
    });

    test('extractYearsFromSession correctly identifies session years', () {
      expect(QuestionBankService.extractYearsFromSession('2023-24'), [2023, 2024]);
      expect(QuestionBankService.extractYearsFromSession('2024-2025'), [2024, 2025]);
      expect(QuestionBankService.extractYearsFromSession('2000-01'), [2000, 2001]);
      expect(QuestionBankService.extractYearsFromSession('2023'), [2023]);
    });

    test('matchesSubject matches root subject for written exams', () {
      expect(QuestionBankService.matchesSubject('উচ্চতর গণিত ১ম পত্র', 'উচ্চতর গণিত'), isTrue);
      expect(QuestionBankService.matchesSubject('রসায়ন ১ম পত্র', 'রসায়ন'), isTrue);
      expect(QuestionBankService.matchesSubject('পদার্থবিজ্ঞান ২য় পত্র', 'পদার্থবিজ্ঞান'), isTrue);
    });

    test('Two-way sync: parses exam_history when institutes and years are omitted', () {
      final rawRow = {
        'id': 'test-uuid-1',
        'question': 'Sample question',
        'total_marks': 10,
        'exam_history': [
          {'institute': 'DU', 'year': 2022}
        ],
      };
      final q = Question.fromJson(rawRow);
      expect(q.institutes, ['DU']);
      expect(q.years, [2022]);
      expect(q.examHistory.first.institute, 'DU');
      expect(q.examHistory.first.year, 2022);
    });

    test('Two-way sync: parses institutes and years when exam_history is omitted', () {
      final rawRow = {
        'id': 'test-uuid-2',
        'question': 'Sample question 2',
        'total_marks': 4,
        'institutes': ['BUET'],
        'years': [2024],
      };
      final q = Question.fromJson(rawRow);
      expect(q.institutes, ['BUET']);
      expect(q.years, [2024]);
      expect(q.examHistory.first.institute, 'BUET');
      expect(q.examHistory.first.year, 2024);
    });
  });
}
