import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:obhyash_app/features/exam/services/local_exam_cache_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('LocalExamCacheService User Scoping Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    test('User A cached questions are never visible to User B (new user)', () async {
      const userA = 'user-uuid-1111';
      const userB = 'user-uuid-2222'; // New user

      final questionsUserA = [
        {
          'id': 'q-101',
          'subject': 'physics',
          'question': 'What is velocity?',
          'options': ['A', 'B', 'C', 'D'],
          'correct_answer_index': 0,
        },
      ];

      // Cache questions for user A
      await LocalExamCacheService.cacheQuestionsList(questionsUserA, userId: userA);

      // Verify User A can read their questions
      final cachedA = await LocalExamCacheService.getCachedQuestionsList(userId: userA);
      expect(cachedA, isNotNull);
      expect(cachedA!.length, 1);
      expect(cachedA.first['id'], 'q-101');

      // Verify User B (new user) receives null and no questions
      final cachedB = await LocalExamCacheService.getCachedQuestionsList(userId: userB);
      expect(cachedB, isNull);
    });

    test('User A cached exam history is never visible to User B', () async {
      const userA = 'user-uuid-1111';
      const userB = 'user-uuid-2222'; // New user

      final historyUserA = [
        {
          'id': 'exam-1',
          'subject': 'chemistry',
          'score': 100,
        },
      ];

      await LocalExamCacheService.cacheHistoryList(historyUserA, userId: userA);

      final cachedA = await LocalExamCacheService.getCachedHistoryList(userId: userA);
      expect(cachedA, isNotNull);
      expect(cachedA!.length, 1);

      final cachedB = await LocalExamCacheService.getCachedHistoryList(userId: userB);
      expect(cachedB, isNull);
    });

    test('clearAll wipes all cached exam data across users', () async {
      const userA = 'user-uuid-1111';
      const userB = 'user-uuid-2222';

      await LocalExamCacheService.cacheQuestionsList([{'id': 'q1'}], userId: userA);
      await LocalExamCacheService.cacheQuestionsList([{'id': 'q2'}], userId: userB);

      await LocalExamCacheService.clearAll();

      final cachedA = await LocalExamCacheService.getCachedQuestionsList(userId: userA);
      final cachedB = await LocalExamCacheService.getCachedQuestionsList(userId: userB);

      expect(cachedA, isNull);
      expect(cachedB, isNull);
    });
  });
}
