import 'package:flutter_test/flutter_test.dart';
import 'package:obhyash_app/features/exam/domain/exam_models.dart';

void main() {
  group('Question Model & Correct Answer Evaluation Tests', () {
    test('Parses Supabase correct_answer_indices [2] properly without defaulting to 0', () {
      final supabaseRow = {
        'id': 'test-q-1',
        'subject': 'chemistry',
        'question': 'Which catalyst is used in Haber process?',
        'options': ['Nickel', 'Platinum', 'Iron (Fe)', 'Copper'],
        'correct_answer_indices': [2], // Option index 2 = 'Iron (Fe)'
        'points': 1,
      };

      final q = Question.fromJson(supabaseRow);
      expect(q.correctAnswerIndex, 2);
      expect(q.correctAnswerIndices, [2]);

      // User picking option 0 should be WRONG
      expect(q.isCorrectAnswer(0), isFalse);

      // User picking option 2 should be CORRECT
      expect(q.isCorrectAnswer(2), isTrue);
    });

    test('Parses string/legacy correct_answer formats properly', () {
      final letterRow = {
        'id': 'test-q-2',
        'subject': 'physics',
        'question': 'Unit of force?',
        'options': ['Joule', 'Newton', 'Watt', 'Pascal'],
        'correct_answer': 'B', // Option index 1
        'points': 1,
      };

      final q = Question.fromJson(letterRow);
      expect(q.correctAnswerIndex, 1);
      expect(q.isCorrectAnswer(1), isTrue);
      expect(q.isCorrectAnswer(0), isFalse);
    });

    test('Supports multiple correct answers if present in correct_answer_indices', () {
      final multiRow = {
        'id': 'test-q-3',
        'subject': 'biology',
        'question': 'Which are warm blooded?',
        'options': ['Fish', 'Bird', 'Reptile', 'Mammal'],
        'correct_answer_indices': [1, 3],
        'points': 1,
      };

      final q = Question.fromJson(multiRow);
      expect(q.isCorrectAnswer(1), isTrue);
      expect(q.isCorrectAnswer(3), isTrue);
      expect(q.isCorrectAnswer(0), isFalse);
      expect(q.isCorrectAnswer(2), isFalse);
    });
  });
}
