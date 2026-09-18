import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

class DownloadNotificationService {
  static final DownloadNotificationService _instance =
      DownloadNotificationService._internal();
  factory DownloadNotificationService() => _instance;
  DownloadNotificationService._internal();

  static const MethodChannel _downloadChannel =
      MethodChannel('com.obhyash.app/download');

  /// Initialize service
  Future<void> init() async {
    // Native initialization happens automatically
  }

  /// Compact sanitized filename helper
  static String compactFileName(String rawName) {
    var name = rawName
        // Remove file extension if present
        .replaceAll(RegExp(r'\.pdf$', caseSensitive: false), '')
        // Remove parenthetical details like (4টি বিষয়)
        .replaceAll(RegExp(r'\([^)]*\)'), '')
        // Remove timestamps like _1789759772620
        .replaceAll(RegExp(r'_\d{10,}'), '')
        // Replace spaces and special characters with single underscore
        .replaceAll(RegExp(r'[\\/:*?"<>|\s]+'), '_')
        .replaceAll(RegExp(r'_+'), '_')
        .trim();

    if (name.startsWith('_')) name = name.substring(1);
    if (name.endsWith('_')) name = name.substring(0, name.length - 1);
    if (name.length > 35) {
      name = name.substring(0, 35);
    }
    return '$name.pdf';
  }

  /// Clean concise title helper
  static String cleanTitle(String rawTitle) {
    var title = rawTitle
        .replaceAll(RegExp(r'\([^)]*\)'), '')
        .replaceAll(RegExp(r'_\d{10,}'), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
    if (title.length > 40) {
      title = title.substring(0, 40);
    }
    return title;
  }

  /// Saves bytes to device storage and triggers system notification with tap-to-open
  Future<File?> savePdfAndNotify({
    required List<int> bytes,
    required String rawFileName,
    required String notificationTitle,
    BuildContext? context,
  }) async {
    final finalFileName = compactFileName(rawFileName);
    final finalTitle = cleanTitle(notificationTitle);
    final byteData = bytes is Uint8List ? bytes : Uint8List.fromList(bytes);

    if (Platform.isAndroid) {
      // 1. Request notification permission on Android 13+
      try {
        final status = await Permission.notification.status;
        if (status.isDenied) {
          await Permission.notification.request();
        }
      } catch (_) {}

      // 2. Call Native Android MediaStore download & notification with tap-to-open
      try {
        final uriResult = await _downloadChannel.invokeMethod<String>(
          'saveToDownloads',
          {
            'bytes': byteData,
            'fileName': finalFileName,
            'title': finalTitle,
          },
        );
        debugPrint('[DownloadNotificationService] Successfully saved to public Downloads: $uriResult');

        // Silent in-app feedback: standard 2-second floating snackbar without any pop-ups
        if (context != null && context.mounted) {
          ScaffoldMessenger.of(context).hideCurrentSnackBar();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFF065F46),
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 2),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              content: Row(
                children: [
                  const Icon(LucideIcons.checkCircle2, color: Color(0xFF34D399), size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'ডাউনলোড সম্পন্ন: $finalFileName',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        return File(uriResult ?? finalFileName);
      } catch (e) {
        debugPrint('[DownloadNotificationService] Native download error: $e. Falling back to local storage...');
      }
    }

    // iOS / Fallback implementation
    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/$finalFileName');
      await file.writeAsBytes(bytes, flush: true);

      if (context != null && context.mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF065F46),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
            content: Text('সংরক্ষিত হয়েছে: $finalFileName'),
          ),
        );
      }
      return file;
    } catch (e) {
      debugPrint('[DownloadNotificationService] Fallback error: $e');
      return null;
    }
  }
}
