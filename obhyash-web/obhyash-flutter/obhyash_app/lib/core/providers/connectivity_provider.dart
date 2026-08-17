import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum NetworkStatus { online, offline }

final connectivityStreamProvider = StreamProvider<NetworkStatus>((ref) async* {
  final connectivity = Connectivity();

  // Initial status check
  final initialResults = await connectivity.checkConnectivity();
  if (initialResults.contains(ConnectivityResult.none) || initialResults.isEmpty) {
    yield NetworkStatus.offline;
  } else {
    yield NetworkStatus.online;
  }

  // Listen for real-time changes
  await for (final results in connectivity.onConnectivityChanged) {
    if (results.contains(ConnectivityResult.none) || results.isEmpty) {
      yield NetworkStatus.offline;
    } else {
      yield NetworkStatus.online;
    }
  }
});
