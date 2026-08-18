import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/shared_prefs_provider.dart';

class AppHaptics {
  static bool _enabled = true;

  static bool get isEnabled => _enabled;

  static void setEnabled(bool value) {
    _enabled = value;
  }

  /// Subtle selection tick (e.g. MCQ option select, Tab bar switch, Radio button)
  static void selection() {
    if (!_enabled) return;
    HapticFeedback.selectionClick();
  }

  /// Gentle tap feedback (e.g. copying text, small icon buttons, checkbox)
  static void light() {
    if (!_enabled) return;
    HapticFeedback.lightImpact();
  }

  /// Medium feedback (e.g. correct answer in practice, secondary action)
  static void medium() {
    if (!_enabled) return;
    HapticFeedback.mediumImpact();
  }

  /// Distinct alert feedback (e.g. wrong answer, danger action)
  static void heavy() {
    if (!_enabled) return;
    HapticFeedback.heavyImpact();
  }

  /// Correct answer feedback
  static void success() {
    if (!_enabled) return;
    HapticFeedback.lightImpact();
  }

  /// Incorrect answer feedback
  static void error() {
    if (!_enabled) return;
    HapticFeedback.heavyImpact();
  }

  /// Celebration feedback for exam submit, streak milestone, badge unlock
  static Future<void> celebrate() async {
    if (!_enabled) return;
    HapticFeedback.mediumImpact();
    await Future.delayed(const Duration(milliseconds: 120));
    if (!_enabled) return;
    HapticFeedback.heavyImpact();
  }
}

final hapticsProvider = NotifierProvider<HapticsNotifier, bool>(
  () => HapticsNotifier(),
);

class HapticsNotifier extends Notifier<bool> {
  static const _key = 'pref_haptics_enabled';

  @override
  bool build() {
    try {
      final prefs = ref.watch(sharedPreferencesProvider);
      final enabled = prefs.getBool(_key) ?? true;
      AppHaptics.setEnabled(enabled);
      return enabled;
    } catch (_) {
      return true;
    }
  }

  void toggle() {
    final next = !state;
    state = next;
    AppHaptics.setEnabled(next);
    if (next) {
      HapticFeedback.mediumImpact();
    }
    try {
      ref.read(sharedPreferencesProvider).setBool(_key, next);
    } catch (_) {}
  }

  void set(bool enabled) {
    state = enabled;
    AppHaptics.setEnabled(enabled);
    if (enabled) {
      HapticFeedback.mediumImpact();
    }
    try {
      ref.read(sharedPreferencesProvider).setBool(_key, enabled);
    } catch (_) {}
  }
}
