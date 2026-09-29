import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/live_exam_controls_model.dart';

/// Realtime Stream Provider for Live Exam Controls
final liveExamControlsStreamProvider =
    StreamProvider<LiveExamControlsModel>((ref) {
  final supabase = Supabase.instance.client;

  try {
    return supabase
        .from('live_exam_controls')
        .stream(primaryKey: ['id'])
        .eq('id', 'global_live_exam_controls')
        .map((data) {
          if (data.isEmpty) {
            return const LiveExamControlsModel();
          }
          return LiveExamControlsModel.fromJson(data.first);
        })
        .handleError((e) {
          return const LiveExamControlsModel();
        });
  } catch (_) {
    return Stream.value(const LiveExamControlsModel());
  }
});

/// Convenience provider returning the current live exam controls or defaults
final liveExamControlsProvider = Provider<LiveExamControlsModel>((ref) {
  final controlsAsync = ref.watch(liveExamControlsStreamProvider);
  return controlsAsync.maybeWhen(
    data: (controls) => controls,
    orElse: () => const LiveExamControlsModel(),
  );
});
