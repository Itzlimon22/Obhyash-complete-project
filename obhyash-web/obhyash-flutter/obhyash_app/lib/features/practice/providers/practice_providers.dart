import 'package:flutter_riverpod/flutter_riverpod.dart';

class PracticeTabNotifier extends Notifier<String> {
  @override
  String build() => 'mistakes';

  void setTab(String tab) {
    state = tab;
  }
}

final practiceTabProvider = NotifierProvider<PracticeTabNotifier, String>(
  () => PracticeTabNotifier(),
);
