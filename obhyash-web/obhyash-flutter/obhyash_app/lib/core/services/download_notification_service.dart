import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:printing/printing.dart';

class DownloadNotificationService {
  static final DownloadNotificationService _instance =
      DownloadNotificationService._internal();
  factory DownloadNotificationService() => _instance;
  DownloadNotificationService._internal();

  final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();
  bool _isInitialized = false;

  static const String _channelId = 'obhyash_downloads';
  static const String _channelName = 'Downloads & Reports';
  static const String _channelDesc =
      'Notifications for downloaded exam papers, results, and routines';

  /// Initialize notifications plugin and channel
  Future<void> init() async {
    if (_isInitialized) return;

    try {
      const androidSettings =
          AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosSettings = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );

      const initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _notificationsPlugin.initialize(
        settings: initSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) async {
          final filePath = response.payload;
          if (filePath != null && filePath.isNotEmpty) {
            final file = File(filePath);
            if (await file.exists()) {
              await OpenFilex.open(filePath);
            }
          }
        },
      );

      // Create Notification Channel for Android 8.0+
      if (Platform.isAndroid) {
        final androidPlugin = _notificationsPlugin.resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
        if (androidPlugin != null) {
          await androidPlugin.createNotificationChannel(
            const AndroidNotificationChannel(
              _channelId,
              _channelName,
              description: _channelDesc,
              importance: Importance.high,
              playSound: true,
              enableVibration: true,
            ),
          );
        }
      }

      _isInitialized = true;
    } catch (e) {
      debugPrint('[DownloadNotificationService] Init error: $e');
    }
  }

  /// Request notification permission on Android 13+ (API 33+)
  Future<bool> requestNotificationPermission() async {
    if (Platform.isAndroid) {
      final status = await Permission.notification.status;
      if (status.isDenied) {
        final result = await Permission.notification.request();
        return result.isGranted;
      }
      return status.isGranted;
    }
    return true;
  }

  /// Writes bytes to the most appropriate and guaranteed writable storage directory
  Future<File> _writeBytesSafely(List<int> bytes, String fileName) async {
    final List<Directory> candidates = [];

    // 1. App Documents directory (standard iOS/Android application documents - guaranteed 100% accessible)
    try {
      candidates.add(await getApplicationDocumentsDirectory());
    } catch (_) {}

    if (Platform.isAndroid) {
      // 2. App-specific external download directory (Guaranteed read/write without special permissions)
      try {
        final extDownloads = await getExternalStorageDirectories(
          type: StorageDirectory.downloads,
        );
        if (extDownloads != null && extDownloads.isNotEmpty) {
          candidates.addAll(extDownloads);
        }
      } catch (_) {}

      // 3. App-specific external files directory
      try {
        final extDir = await getExternalStorageDirectory();
        if (extDir != null) candidates.add(extDir);
      } catch (_) {}
    }

    // 4. Temporary directory fallback
    try {
      candidates.add(await getTemporaryDirectory());
    } catch (_) {}

    for (final dir in candidates) {
      try {
        if (!await dir.exists()) {
          await dir.create(recursive: true);
        }
        final testFile = File('${dir.path}/$fileName');
        await testFile.writeAsBytes(bytes, flush: true);
        if (await testFile.exists() && await testFile.length() > 0) {
          debugPrint('[DownloadNotificationService] Successfully saved PDF at: ${testFile.path}');
          return testFile;
        }
      } catch (e) {
        debugPrint('[DownloadNotificationService] Failed to write to ${dir.path}: $e');
      }
    }

    throw Exception('ডিভাইসে ফাইল সংরক্ষণের জন্য উপযুক্ত মেমোরি পাওয়া যায়নি');
  }

  /// Sanitize filename to avoid illegal characters in filesystem
  String _sanitizeFileName(String name) {
    return name
        .replaceAll(RegExp(r'[\\/:*?"<>|]'), '_')
        .replaceAll(RegExp(r'\s+'), '_');
  }

  /// Saves bytes directly to local storage and triggers notification & in-app feedback
  Future<File?> savePdfAndNotify({
    required List<int> bytes,
    required String rawFileName,
    required String notificationTitle,
    BuildContext? context,
  }) async {
    final sanitizedName = _sanitizeFileName(rawFileName);
    final finalFileName =
        sanitizedName.endsWith('.pdf') ? sanitizedName : '$sanitizedName.pdf';

    try {
      await init();
      try {
        await requestNotificationPermission();
      } catch (_) {}

      final file = await _writeBytesSafely(bytes, finalFileName);

      final notifId = DateTime.now().millisecondsSinceEpoch ~/ 1000;

      // Show System Notification (Safely wrapped)
      try {
        final androidDetails = AndroidNotificationDetails(
          _channelId,
          _channelName,
          channelDescription: _channelDesc,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
          ticker: 'PDF ডাউনলোড সম্পন্ন হয়েছে',
        );
        const iosDetails = DarwinNotificationDetails();

        final notifDetails = NotificationDetails(
          android: androidDetails,
          iOS: iosDetails,
        );

        await _notificationsPlugin.show(
          id: notifId,
          title: notificationTitle,
          body: '$finalFileName\nট্যাপ করে ফাইলটি ওপেন করুন',
          notificationDetails: notifDetails,
          payload: file.path,
        );
      } catch (notifErr) {
        debugPrint('[DownloadNotificationService] Notification error: $notifErr');
      }

      // In-App Toast/SnackBar Feedback with Open Button
      if (context != null && context.mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF065F46), // emerald-800
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            content: Row(
              children: [
                const Icon(
                  LucideIcons.checkCircle2,
                  color: Color(0xFF34D399), // emerald-400
                  size: 22,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'ডাউনলোড সম্পন্ন হয়েছে!',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'সংরক্ষিত: $finalFileName',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFFD1FAE5),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            action: SnackBarAction(
              label: 'ওপেন করুন',
              textColor: Colors.white,
              backgroundColor: const Color(0xFF059669),
              onPressed: () async {
                await OpenFilex.open(file.path);
              },
            ),
            duration: const Duration(seconds: 5),
          ),
        );
      }

      return file;
    } catch (e) {
      debugPrint('[DownloadNotificationService] Error saving file directly: $e. Falling back to sharePdf...');
      try {
        await Printing.sharePdf(
          bytes: bytes is Uint8List ? bytes : Uint8List.fromList(bytes),
          filename: finalFileName,
        );
      } catch (shareErr) {
        if (context != null && context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFFDC2626),
              content: Text('ফাইল সেভ করতে সমস্যা হয়েছে: $shareErr'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
      return null;
    }
  }
}
