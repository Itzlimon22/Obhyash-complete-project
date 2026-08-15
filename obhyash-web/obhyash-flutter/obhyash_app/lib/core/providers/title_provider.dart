import 'package:flutter_riverpod/flutter_riverpod.dart';

class LocationTitleNotifier extends Notifier<Map<String, String>> {
  @override
  Map<String, String> build() => {};

  void updateTitle(String location, String title) {
    state = {
      ...state,
      location: title,
    };
  }
}

final locationTitleProvider = NotifierProvider<LocationTitleNotifier, Map<String, String>>(
  () => LocationTitleNotifier(),
);
