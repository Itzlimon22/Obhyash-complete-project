import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/services/haptics_service.dart';
import '../domain/notification_model.dart';
import '../presentation/notifications_view.dart';

class NotificationRouteResult {
  final String? route;
  final bool isExternal;
  final bool shouldShowDetailModal;

  const NotificationRouteResult({
    this.route,
    this.isExternal = false,
    this.shouldShowDetailModal = false,
  });
}

class NotificationRouter {
  /// Intelligently resolves the destination for any notification
  static NotificationRouteResult resolve(AppNotification notif) {
    // 1. Direct explicit link check
    final rawLink = notif.link?.trim();
    if (rawLink != null && rawLink.isNotEmpty) {
      if (rawLink.startsWith('http://') || rawLink.startsWith('https://')) {
        return NotificationRouteResult(route: rawLink, isExternal: true);
      }
      
      // Normalize internal route
      var internalRoute = rawLink;
      if (!internalRoute.startsWith('/')) {
        internalRoute = '/$internalRoute';
      }
      return NotificationRouteResult(route: internalRoute);
    }

    // 2. Intelligent semantic matching based on Type, Title, and Message
    final text = '${notif.type} ${notif.title} ${notif.message}'.toLowerCase();

    // A. Subscriptions & Payments
    if (text.contains('subscription') ||
        text.contains('payment') ||
        text.contains('approved') ||
        text.contains('প্রো') ||
        text.contains('পেমেন্ট') ||
        text.contains('সাবস্ক্রিপশন') ||
        text.contains('প্ল্যান') ||
        text.contains('মেয়াদ')) {
      return const NotificationRouteResult(route: '/profile/my-subscription');
    }

    // B. Referrals & Rewards
    if (text.contains('referral') ||
        text.contains('refer') ||
        text.contains('bonus') ||
        text.contains('gift') ||
        text.contains('রেফারেল') ||
        text.contains('বোনাস') ||
        text.contains('আমন্ত্রণ')) {
      return const NotificationRouteResult(route: '/profile/referral');
    }

    // C. Live Exams
    if (text.contains('live_exam') ||
        text.contains('live exam') ||
        text.contains('লাইভ এক্সাম') ||
        text.contains('মডেল টেস্ট')) {
      return const NotificationRouteResult(route: '/live_exam');
    }

    // D. Question Reports & Resolution
    if (text.contains('report') ||
        text.contains('সমাধান') ||
        text.contains('রিপোর্ট')) {
      return const NotificationRouteResult(route: '/my-reports');
    }

    // E. Complaints
    if (text.contains('complaint') ||
        text.contains('অভিযোগ')) {
      return const NotificationRouteResult(route: '/profile/complaint');
    }

    // F. Feature Requests
    if (text.contains('feature') ||
        text.contains('ফিচার')) {
      return const NotificationRouteResult(route: '/profile/feature-requests');
    }

    // G. Bookmarks
    if (text.contains('bookmark') ||
        text.contains('বুকমার্ক')) {
      return const NotificationRouteResult(route: '/bookmarks');
    }

    // H. Stats & Performance
    if (text.contains('streak') ||
        text.contains('স্ট্রিক') ||
        text.contains('ব্যাজ') ||
        text.contains('badge') ||
        text.contains('লেভেল')) {
      return const NotificationRouteResult(route: '/profile/stats');
    }

    // Default: General broadcast / system announcement -> Show detailed modal in place without unnecessary redirect
    return const NotificationRouteResult(shouldShowDetailModal: true);
  }

  /// Handles notification tap with intelligent routing and feedback
  static Future<void> handleTap(BuildContext context, AppNotification notif) async {
    AppHaptics.selection();
    final result = resolve(notif);

    if (result.isExternal && result.route != null) {
      final uri = Uri.parse(result.route!);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
      return;
    }

    if (result.route != null) {
      try {
        context.push(result.route!);
      } catch (e) {
        debugPrint('[NotificationRouter] Navigation error: $e');
        _showDetailModal(context, notif);
      }
      return;
    }

    if (result.shouldShowDetailModal) {
      _showDetailModal(context, notif);
    }
  }

  /// Shows full announcement text in a sleek modal bottom sheet
  static void _showDetailModal(BuildContext context, AppNotification notif) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final style = getNotificationStyle(notif.type, isDark);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border.all(
              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.black12,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: style['bg'],
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      style['icon'] as IconData,
                      color: style['color'] as Color,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      notif.title,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF09090B) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Text(
                  notif.message,
                  style: TextStyle(
                    fontSize: 15,
                    height: 1.5,
                    color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF334155),
                    fontFamily: 'HindSiliguri',
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                    foregroundColor: isDark ? Colors.white : const Color(0xFF0F172A),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text(
                    'ঠিক আছে',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'HindSiliguri',
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
