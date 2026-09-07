import 'package:flutter_test/flutter_test.dart';
import 'package:obhyash_app/features/exam/domain/exam_models.dart';
import 'package:obhyash_app/features/question_bank/services/question_bank_service.dart';

void main() {
  group('Written Exam Strict Filter Tests', () {
    test('Question.isStrictWritten identifies authentic written questions', () {
      const qWritten1 = Question(
        id: 'w1',
        subject: 'পদার্থবিজ্ঞান ১ম পত্র',
        question: 'একটি গাড়ি সমত্বরণে চলছে। ৫ সেকেন্ড পর এর বেগ কত?',
        options: [],
        correctAnswerIndex: -1,
        points: 10,
        type: 'Written',
      );

      const qWritten2 = Question(
        id: 'w2',
        subject: 'রসায়ন ১ম পত্র',
        question: 'বাফার দ্রবণের কার্যপদ্ধতি ব্যাখ্যা কর।',
        options: [''],
        correctAnswerIndex: -1,
        points: 10,
        type: 'written',
      );

      expect(qWritten1.isStrictWritten, isTrue);
      expect(qWritten1.isAdmissionStandardMcq, isFalse);
      expect(qWritten2.isStrictWritten, isTrue);
      expect(qWritten2.isAdmissionStandardMcq, isFalse);
    });

    test('Question.isStrictWritten strictly rejects MCQs', () {
      const qMcq = Question(
        id: 'mcq1',
        subject: 'পদার্থবিজ্ঞান ১ম পত্র',
        question: 'নিচের কোনটি ভেক্টর রাশি?',
        options: ['বেগ', 'দ্রুতি', 'কাজ', 'ক্ষমতা'],
        correctAnswerIndex: 0,
        points: 1,
        type: 'MCQ',
      );

      // Even if type is mistakenly written or tags contain written, if it has 4 options, it must not be treated as written
      const qFakeWritten = Question(
        id: 'mcq2',
        subject: 'রসায়ন ২য় পত্র',
        question: 'নিচের কোনটিতে হাইড্রোজেন বন্ধন বিদ্যমান?',
        options: ['H2O', 'CH4', 'HCl', 'H2S'],
        correctAnswerIndex: 0,
        points: 1,
        type: 'written',
      );

      expect(qMcq.isStrictWritten, isFalse);
      expect(qMcq.isStrictMcq, isTrue);
      expect(qMcq.isAdmissionStandardMcq, isTrue);
      expect(qFakeWritten.isStrictWritten, isFalse);
    });

    test('CQ questions must never include MCQs with options', () {
      const qStandardMcq = Question(
        id: 'mcq_bangla',
        subject: 'বাংলা ১ম পত্র',
        question: 'অপরিচিতা গল্পের কথকের নাম কি?',
        options: ['অনুপম', 'হরিশ', 'বিনুদা', 'শম্ভুনাথ'],
        correctAnswerIndex: 0,
        points: 1,
        type: 'MCQ',
      );

      const qRealCq = Question(
        id: 'cq_bangla',
        subject: 'বাংলা ১ম পত্র',
        question: 'উদ্দীপকটি পড়ে নিচের প্রশ্নগুলোর উত্তর দাও...\n(ক) অনুপমের বয়স কত?\n(খ) ব্যাখ্যা কর।',
        options: [],
        correctAnswerIndex: -1,
        points: 10,
        type: 'CQ',
      );

      // Verify MCQ is rejected for written/CQ
      expect(qStandardMcq.isStrictWritten, isFalse);
      expect(qRealCq.isStrictWritten, isTrue);
      expect(qRealCq.isStrictMcq, isFalse);
    });

    test('sortSeriallySubjectwise orders questions canonically by subject and preserves intra-subject order', () {
      const qMath1 = Question(
        id: 'm1',
        subject: 'উচ্চতর গণিত ১ম পত্র',
        question: 'ম্যাট্রিক্সের মান নির্ণয় কর',
        options: [],
        correctAnswerIndex: -1,
        points: 10,
        type: 'written',
      );

      const qChem1 = Question(
        id: 'c1',
        subject: 'রসায়ন ১ম পত্র',
        question: 'পরমাণুর গঠন ব্যাখ্যা কর',
        options: [],
        correctAnswerIndex: -1,
        points: 10,
        type: 'written',
      );

      const qPhys1 = Question(
        id: 'p1',
        subject: 'পদার্থবিজ্ঞান ১ম পত্র',
        question: 'ভেক্টর গুণন নির্ণয় কর',
        options: [],
        correctAnswerIndex: -1,
        points: 10,
        type: 'written',
      );

      const qPhys2 = Question(
        id: 'p2',
        subject: 'পদার্থবিজ্ঞান ২য় পত্র',
        question: 'তাপগতিবিদ্যার ১ম সূত্র',
        options: [],
        correctAnswerIndex: -1,
        points: 10,
        type: 'written',
      );

      const qChem2 = Question(
        id: 'c2',
        subject: 'রসায়ন ২য় পত্র',
        question: 'জৈব যৌগের নামকরণ',
        options: [],
        correctAnswerIndex: -1,
        points: 10,
        type: 'written',
      );

      const qMath2 = Question(
        id: 'm2',
        subject: 'উচ্চতর গণিত ২য় পত্র',
        question: 'জটিল সংখ্যার আর্গুমেন্ট',
        options: [],
        correctAnswerIndex: -1,
        points: 10,
        type: 'written',
      );

      // Shuffled input: Math, Chem 2, Phys 2, Chem 1, Math 2, Phys 1
      final rawList = [qMath1, qChem2, qPhys2, qChem1, qMath2, qPhys1];

      final sorted = QuestionBankService.sortSeriallySubjectwise(rawList);

      // Expected canonical order:
      // Physics (1st then 2nd) -> Chemistry (1st then 2nd) -> Higher Math (1st then 2nd)
      expect(sorted.map((q) => q.id).toList(), ['p1', 'p2', 'c1', 'c2', 'm1', 'm2']);
    });

    test('If a subject has fewer questions, it keeps them without mixing other subjects', () {
      const qPhys1 = Question(
        id: 'p1',
        subject: 'পদার্থবিজ্ঞান ১ম পত্র',
        question: 'ভেক্টর ১',
        options: [],
        correctAnswerIndex: -1,
        points: 10,
        type: 'written',
      );

      const qMath1 = Question(
        id: 'm1',
        subject: 'উচ্চতর গণিত ১ম পত্র',
        question: 'ক্যালকুলাস ১',
        options: [],
        correctAnswerIndex: -1,
        points: 10,
        type: 'written',
      );

      const qMath2 = Question(
        id: 'm2',
        subject: 'উচ্চতর গণিত ১ম পত্র',
        question: 'ক্যালকুলাস ২',
        options: [],
        correctAnswerIndex: -1,
        points: 10,
        type: 'written',
      );

      // Only 1 physics question, 2 math questions, 0 chemistry
      final rawList = [qMath1, qPhys1, qMath2];
      final sorted = QuestionBankService.sortSeriallySubjectwise(rawList);

      // Physics must be first, then Math. No intermixing.
      expect(sorted.map((q) => q.id).toList(), ['p1', 'm1', 'm2']);
      expect(sorted[0].subject, contains('পদার্থবিজ্ঞান'));
      expect(sorted[1].subject, contains('উচ্চতর গণিত'));
      expect(sorted[2].subject, contains('উচ্চতর গণিত'));
    });
  });
}
