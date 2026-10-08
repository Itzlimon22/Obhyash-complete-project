import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:obhyash_app/core/presentation/widgets/latex_text.dart';
import 'package:obhyash_app/core/utils/question_formatter.dart';
import 'package:obhyash_app/features/exam/domain/exam_models.dart';

void main() {
  test('QuestionFormatter does NOT corrupt R2 image URLs with underscores or Bengali digits', () {
    const raw = r'স্থির চাপে গ্যাসের তাপমাত্রা বনাম ঘনত্বের লেখচিত্র নিচের কোনটি? ![চিত্র](https://pub-6560195307b14ca49f6f183b13bfa841.r2.dev/questions/physics_1st/chapter_১০/ph1_ch10_5_pdf_p2_170_239_pad4.png)';
    final formatted = QuestionFormatter.format(raw);

    expect(formatted.contains('![চিত্র]'), isTrue);
    expect(formatted.contains('https://pub-6560195307b14ca49f6f183b13bfa841.r2.dev/questions/physics_1st/chapter_১০/ph1_ch10_5_pdf_p2_170_239_pad4.png'), isTrue);
    expect(formatted.contains(r'$physics_1st$'), isFalse);
    expect(formatted.contains(r'$ph1_ch10$'), isFalse);
  });

  testWidgets('LatexText builds CachedNetworkImage for Markdown R2 images', (tester) async {
    const raw = r'স্থির চাপে গ্যাসের তাপমাত্রা বনাম ঘনত্বের লেখচিত্র নিচের কোনটি? ![চিত্র](https://pub-6560195307b14ca49f6f183b13bfa841.r2.dev/questions/physics_1st/chapter_১০/ph1_ch10_5_pdf_p2_170_239_pad4.png)';

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: LatexText(text: raw),
        ),
      ),
    );

    final cachedImageFinder = find.byType(CachedNetworkImage);
    expect(cachedImageFinder, findsOneWidget);

    final cachedWidget = tester.widget<CachedNetworkImage>(cachedImageFinder);
    expect(cachedWidget.imageUrl, contains('https://pub-6560195307b14ca49f6f183b13bfa841.r2.dev'));
    expect(cachedWidget.imageUrl, contains('%E0%A7%A7%E0%A7%A6')); // Encoded Bengali digits ১০
  });

  test('Question.fromJson parses image_url and explanation_image_url', () {
    final json = {
      'id': 'test-1',
      'question': 'টেস্ট প্রশ্ন',
      'subject': 'পদার্থবিজ্ঞান',
      'chapter': 'ভেক্টর',
      'image_url': 'https://r2.dev/q.png',
      'explanation_image_url': 'https://r2.dev/exp.png',
      'option_images': ['https://r2.dev/opt1.png', 'https://r2.dev/opt2.png'],
    };

    final q = Question.fromJson(json);
    expect(q.imageUrl, equals('https://r2.dev/q.png'));
    expect(q.explanationImageUrl, equals('https://r2.dev/exp.png'));
    expect(q.optionImages.length, equals(2));
    expect(q.optionImages[0], equals('https://r2.dev/opt1.png'));
  });
}
