import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:obhyash_app/core/presentation/screens/maintenance_screen.dart';
import 'package:obhyash_app/core/presentation/screens/force_update_screen.dart';

void main() {
  testWidgets('MaintenanceScreen renders without crashing', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: MaintenanceScreen(
          message: 'আমাদের প্রকৌশলীরা কাজ করছেন',
          onRetry: () {},
        ),
      ),
    );

    expect(find.text('আমাদের প্রকৌশলীরা কাজ করছেন'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('ForceUpdateScreen renders without crashing', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: ForceUpdateScreen(
          minVersion: '1.2.0',
          updateUrl: 'https://play.google.com',
        ),
      ),
    );

    expect(find.textContaining('1.2.0'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
