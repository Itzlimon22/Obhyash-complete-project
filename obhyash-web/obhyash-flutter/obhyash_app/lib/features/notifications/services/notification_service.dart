import 'dart:convert';
import 'dart:math';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _localNotif = FlutterLocalNotificationsPlugin();
  bool _isInitialized = false;

  // Callback to navigate to deep link route
  static void Function(String route)? onNotificationTapped;

  // Channels
  static const String channelLiveExams = 'obhyash_live_exams';
  static const String channelStreak = 'obhyash_streak_channel';
  static const String channelGeneral = 'obhyash_general';

  // ── Witty / Chorcha-style Notification Copy Pools ────────────────────────
  static const List<Map<String, String>> wittyStreakSaviorTemplates = [
    {
      'title': '🚨 {name}, তোমার {streak} দিনের স্ট্রিক পুড়ছে!',
      'body': 'আর মাত্র কয়েক ঘণ্টা বাকি! ১টি ৫ মিনিটের কুইজ দিয়ে আগুনটা বাঁচাও 🚒🔥',
    },
    {
      'title': 'টানা {streak} দিন! {name}, আমি কি তোমাকে বিরক্ত করছি?',
      'body': 'ঠিক আছে, আর কখনও পড়তে বলবো না... নিজের স্ট্রিকের যত্ন নিও 😢',
    },
    {
      'title': 'ফোন স্ক্রল করতে করতে স্ট্রিক ভুলে গেলে? 👀',
      'body': 'রিলস কালও থাকবে, কিন্তু তোমার সাধের {streak} দিনের স্ট্রিক আজ রাতেই শেষ হবে! ⏳',
    },
    {
      'title': 'ঘুমিয়ে পড়লে নাকি {name}? 😱',
      'body': 'মাত্র ১টা ছোট এক্সাম দাও, নয়তো কাল সকালে স্ট্রিক ০ দেখে কাঁদবে 😭',
    },
    {
      'title': 'শেষ ডাক {name}! 🏃‍♂️💨',
      'body': 'দেরি হওয়ার আগেই ১টি প্র্যাকটিস শুরু করো! স্ট্রিকটা বাঁচাও প্লিজ! ⚡',
    },
  ];

  static const List<Map<String, String>> wittyMorningTemplates = [
    {
      'title': 'ঘুম থেকে উঠো {name}, বুয়েট/মেডিকেল ডাকছে! 🩺⚡',
      'body': 'মাত্র ৫ মিনিটের আজকের স্পেশাল টেস্ট লাইভ হয়েছে। দেখা যাক কত পাও! ☕',
    },
    {
      'title': 'চা খাওয়ার ফাঁকে একটা কুইজ হয়ে যাক? 🍵',
      'body': 'চা ঠান্ডা হওয়ার আগেই ১০টা এমসিকিউ সলভ করে লিডারবোর্ডে উঠে এসো! ⏱️',
    },
  ];

  /// Initialize Firebase & local notification plugin and channels
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // 1. Initialize Firebase
      try {
        await Firebase.initializeApp();
        FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      } catch (e) {
        debugPrint('[NotificationService] Firebase init warning: $e');
      }

      // 2. Initialize Timezone
      tz.initializeTimeZones();
      try {
        tz.setLocalLocation(tz.getLocation('Asia/Dhaka'));
      } catch (_) {}

      // 3. Local notification settings
      const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosSettings = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );

      const initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _localNotif.initialize(
        settings: initSettings,
        onDidReceiveNotificationResponse: (response) {
          final payload = response.payload;
          if (payload != null && payload.isNotEmpty) {
            try {
              final data = jsonDecode(payload) as Map<String, dynamic>;
              final route = data['route']?.toString();
              if (route != null && onNotificationTapped != null) {
                onNotificationTapped!(route);
              }
            } catch (e) {
              debugPrint('[NotificationService] payload parse error: $e');
            }
          }
        },
      );

      // 4. Create Android Notification Channels
      final androidPlugin = _localNotif.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();

      if (androidPlugin != null) {
        await androidPlugin.createNotificationChannel(
          const AndroidNotificationChannel(
            channelLiveExams,
            'লাইভ পরীক্ষা ও ফলাফল',
            description: 'লাইভ পরীক্ষা শুরু ও রেজাল্ট প্রকাশের জরুরি নোটিফিকেশন',
            importance: Importance.max,
            playSound: true,
            enableVibration: true,
          ),
        );

        await androidPlugin.createNotificationChannel(
          const AndroidNotificationChannel(
            channelStreak,
            'স্ট্রিক ও পড়ার রিমাইন্ডার',
            description: 'দৈনিক স্ট্রিক বাঁচানো এবং পড়াশোনার রিমাইন্ডার',
            importance: Importance.high,
            playSound: true,
            enableVibration: true,
          ),
        );

        await androidPlugin.createNotificationChannel(
          const AndroidNotificationChannel(
            channelGeneral,
            'সাধারণ নোটিশ ও টিপস',
            description: 'নতুন ফিচার, আপডেট ও একাডেমিক নোটিশ',
            importance: Importance.defaultImportance,
            playSound: true,
          ),
        );
      }

      // 5. Foreground FCM Message Handler
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        final notif = message.notification;
        if (notif != null) {
          showNotification(
            id: message.hashCode,
            title: notif.title ?? 'অভ্যাস',
            body: notif.body ?? '',
            route: message.data['route']?.toString(),
            channelId: message.data['channel_id']?.toString() ?? channelGeneral,
          );
        }
      });

      // 6. Notification Tap (App in background opened by tap)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        final route = message.data['route']?.toString();
        if (route != null && onNotificationTapped != null) {
          onNotificationTapped!(route);
        }
      });

      _isInitialized = true;
      debugPrint('[NotificationService] initialized successfully with Firebase FCM');
    } catch (e) {
      debugPrint('[NotificationService] initialize error: $e');
    }
  }

  /// Request runtime permissions (Android 13+ & iOS)
  Future<bool> requestPermission() async {
    try {
      // Local notification permission
      final androidPlugin = _localNotif.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      if (androidPlugin != null) {
        await androidPlugin.requestNotificationsPermission();
      }

      // Firebase permission
      final fcmSettings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      return fcmSettings.authorizationStatus == AuthorizationStatus.authorized;
    } catch (e) {
      debugPrint('[NotificationService] requestPermission error: $e');
    }
    return true;
  }

  /// Syncs Device FCM Token with Supabase user_fcm_tokens table
  Future<void> syncFCMToken(String userId) async {
    if (userId.isEmpty) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null && token.isNotEmpty) {
        final sb = Supabase.instance.client;
        await sb.from('user_fcm_tokens').upsert(
          {
            'user_id': userId,
            'fcm_token': token,
            'platform': defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android',
            'is_active': true,
            'last_seen_at': DateTime.now().toIso8601String(),
          },
          onConflict: 'fcm_token',
        );
        debugPrint('[NotificationService] FCM token successfully registered to Supabase');
      }
    } catch (e) {
      debugPrint('[NotificationService] syncFCMToken warning: $e');
    }
  }

  /// Displays an instant heads-up / local notification
  Future<void> showNotification({
    required int id,
    required String title,
    required String body,
    String channelId = channelGeneral,
    String? route,
    Map<String, dynamic>? extraData,
  }) async {
    if (!_isInitialized) await initialize();

    final payloadData = {
      if (route != null) 'route': route,
      if (extraData != null) ...extraData,
    };

    final androidDetails = AndroidNotificationDetails(
      channelId,
      channelId == channelLiveExams
          ? 'লাইভ পরীক্ষা'
          : (channelId == channelStreak ? 'স্ট্রিক রিমাইন্ডার' : 'সাধারণ'),
      importance: channelId == channelLiveExams
          ? Importance.max
          : (channelId == channelStreak ? Importance.high : Importance.defaultImportance),
      priority: channelId == channelLiveExams
          ? Priority.max
          : (channelId == channelStreak ? Priority.high : Priority.defaultPriority),
      playSound: true,
      enableVibration: true,
      color: const Color(0xFF059669),
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    await _localNotif.show(
      id: id,
      title: title,
      body: body,
      notificationDetails: NotificationDetails(android: androidDetails, iOS: iosDetails),
      payload: jsonEncode(payloadData),
    );
  }

  /// Schedule Daily Witty Evening Streak Reminder (e.g. 8:30 PM & 10:15 PM)
  Future<void> scheduleDailyStreakReminders({
    required String userName,
    required int currentStreak,
  }) async {
    if (!_isInitialized) await initialize();

    try {
      // Pick a random witty template
      final random = Random();
      final template = wittyStreakSaviorTemplates[random.nextInt(wittyStreakSaviorTemplates.length)];
      final name = userName.isNotEmpty ? userName : 'শিক্ষার্থী';
      final streakStr = currentStreak > 0 ? currentStreak.toString() : '১';

      final title = template['title']!
          .replaceAll('{name}', name)
          .replaceAll('{streak}', streakStr);
      final body = template['body']!
          .replaceAll('{name}', name)
          .replaceAll('{streak}', streakStr);

      final now = tz.TZDateTime.now(tz.local);
      
      // Schedule at 8:30 PM
      var scheduled830 = tz.TZDateTime(
        tz.local,
        now.year,
        now.month,
        now.day,
        20, // 8 PM
        30, // 30 Min
      );
      if (scheduled830.isBefore(now)) {
        scheduled830 = scheduled830.add(const Duration(days: 1));
      }

      await _localNotif.zonedSchedule(
        id: 830,
        title: title,
        body: body,
        scheduledDate: scheduled830,
        notificationDetails: const NotificationDetails(
          android: AndroidNotificationDetails(
            channelStreak,
            'স্ট্রিক ও পড়ার রিমাইন্ডার',
            importance: Importance.high,
            priority: Priority.high,
            color: Color(0xFFEF4444),
          ),
          iOS: DarwinNotificationDetails(),
        ),
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        matchDateTimeComponents: DateTimeComponents.time,
        payload: jsonEncode({'route': '/exam-setup', 'type': 'streak'}),
      );

      debugPrint('[NotificationService] Daily 8:30 PM streak saver reminder scheduled successfully');
    } catch (e) {
      debugPrint('[NotificationService] scheduleDailyStreakReminders error: $e');
    }
  }

  /// Cancel all scheduled alarms
  Future<void> cancelAll() async {
    await _localNotif.cancelAll();
  }
}
