import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'notes_r2_service.dart';

class NotesOfflineService {
  static const String _prefsKey = 'in_app_offline_saved_notes';
  static final ValueNotifier<Set<String>> offlineSavedPathsNotifier =
      ValueNotifier<Set<String>>({});
  static bool _isInitialized = false;

  /// Initializes and loads the set of offline saved paths from SharedPreferences
  static Future<void> init() async {
    if (_isInitialized) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = prefs.getStringList(_prefsKey) ?? [];
      offlineSavedPathsNotifier.value = list.map((e) => _clean(e)).toSet();
      _isInitialized = true;
    } catch (e) {
      debugPrint('NotesOfflineService init error: $e');
    }
  }

  /// Check if a specific note is saved offline
  static bool isSaved(String r2Path) {
    final clean = _clean(r2Path);
    return offlineSavedPathsNotifier.value.contains(clean);
  }

  /// Downloads and saves the PDF into the app's private sandboxed documents directory
  /// (Private to the app sandbox, not accessible by outside file managers)
  static Future<bool> saveOffline({
    required String r2Path,
    Uint8List? existingBytes,
  }) async {
    await init();
    final clean = _clean(r2Path);
    try {
      final docDir = await getApplicationDocumentsDirectory();
      final offlineDir = Directory('${docDir.path}/offline_notes');
      if (!await offlineDir.exists()) {
        await offlineDir.create(recursive: true);
      }

      final fileName = _toSafeFileName(clean);
      final file = File('${offlineDir.path}/$fileName.pdf');

      Uint8List? bytes = existingBytes;
      if (bytes == null || bytes.isEmpty) {
        final url = NotesR2Service.getPublicUrl(clean);
        final res = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 25));
        if (res.statusCode == 200 && res.bodyBytes.isNotEmpty) {
          bytes = res.bodyBytes;
        } else {
          // Fallback to r2.dev domain
          final fbUrl = NotesR2Service.getFallbackUrl(clean);
          final fbRes = await http.get(Uri.parse(fbUrl)).timeout(const Duration(seconds: 25));
          if (fbRes.statusCode == 200 && fbRes.bodyBytes.isNotEmpty) {
            bytes = fbRes.bodyBytes;
          }
        }
      }

      if (bytes != null && bytes.isNotEmpty) {
        await file.writeAsBytes(bytes, flush: true);

        // Update state and persistent cache
        final current = Set<String>.from(offlineSavedPathsNotifier.value)..add(clean);
        offlineSavedPathsNotifier.value = current;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setStringList(_prefsKey, current.toList());
        return true;
      }
    } catch (e) {
      debugPrint('NotesOfflineService save error: $e');
    }
    return false;
  }

  /// Removes a note from offline storage
  static Future<bool> removeOffline(String r2Path) async {
    await init();
    final clean = _clean(r2Path);
    try {
      final docDir = await getApplicationDocumentsDirectory();
      final fileName = _toSafeFileName(clean);
      final file = File('${docDir.path}/offline_notes/$fileName.pdf');
      if (await file.exists()) {
        await file.delete();
      }

      final current = Set<String>.from(offlineSavedPathsNotifier.value)..remove(clean);
      offlineSavedPathsNotifier.value = current;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_prefsKey, current.toList());
      return true;
    } catch (e) {
      debugPrint('NotesOfflineService remove error: $e');
    }
    return false;
  }

  /// Reads bytes from offline storage if available
  static Future<Uint8List?> getOfflineBytes(String r2Path) async {
    final clean = _clean(r2Path);
    try {
      final docDir = await getApplicationDocumentsDirectory();
      final fileName = _toSafeFileName(clean);
      final file = File('${docDir.path}/offline_notes/$fileName.pdf');
      if (await file.exists()) {
        final bytes = await file.readAsBytes();
        if (bytes.isNotEmpty) return bytes;
      }
    } catch (_) {}
    return null;
  }

  static String _clean(String p) {
    var s = p.trim();
    if (s.startsWith('/')) s = s.substring(1);
    return s;
  }

  static String _toSafeFileName(String cleanPath) {
    return cleanPath.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '_');
  }
}
