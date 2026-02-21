import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';

// --- Domain Model ---
class AppNotification {
  final String id;
  final String userId;
  final String title;
  final String message;
  final String type;
  final String? link;
  final bool isRead;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.userId,
    required this.title,
    required this.message,
    required this.type,
    this.link,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'],
      userId: json['user_id'],
      title: json['title'],
      message: json['message'],
      type: json['type'],
      link: json['link'],
      isRead: json['is_read'] ?? false,
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

// --- Utils ---
Map<String, dynamic> getNotificationStyle(String type, bool isDark) {
  switch (type.toLowerCase()) {
    case 'success':
      return {
        'icon': LucideIcons.checkCircle2,
        'bg': isDark
            ? const Color(0x33064E3B)
            : const Color(0xFFD1FAE5), // emerald-900/20 : emerald-100
        'color': const Color(0xFF10B981), // emerald-500
      };
    case 'warning':
      return {
        'icon': LucideIcons.alertTriangle,
        'bg': isDark
            ? const Color(0x3378350F)
            : const Color(0xFFFEF3C7), // amber-900/20 : amber-100
        'color': const Color(0xFFF59E0B), // amber-500
      };
    case 'error':
      return {
        'icon': LucideIcons.alertCircle,
        'bg': isDark
            ? const Color(0x33881337)
            : const Color(0xFFFFE4E6), // rose-900/20 : rose-100
        'color': const Color(0xFFF43F5E), // rose-500
      };
    case 'system':
      return {
        'icon': LucideIcons.settings,
        'bg': isDark
            ? const Color(0x334C1D95)
            : const Color(0xFFEDE9FE), // violet-900/20 : violet-100
        'color': const Color(0xFF8B5CF6), // violet-500
      };
    case 'info':
    default:
      return {
        'icon': LucideIcons.info,
        'bg': isDark
            ? const Color(0x331E3A8A)
            : const Color(0xFFDBEAFE), // blue-900/20 : blue-100
        'color': const Color(0xFF3B82F6), // blue-500
      };
  }
}

// --- View ---
class NotificationsView extends StatefulWidget {
  const NotificationsView({super.key});

  @override
  State<NotificationsView> createState() => _NotificationsViewState();
}

class _NotificationsViewState extends State<NotificationsView> {
  List<AppNotification> _notifications = [];
  bool _isLoading = true;
  final supabase = Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    setState(() => _isLoading = true);
    try {
      final user = supabase.auth.currentUser;
      if (user == null) return;

      final response = await supabase
          .from('notifications')
          .select()
          .eq('user_id', user.id)
          .order('created_at', ascending: false)
          .limit(50);

      if (mounted) {
        setState(() {
          _notifications = (response as List)
              .map((e) => AppNotification.fromJson(e))
              .toList();
        });
      }
    } catch (e) {
      debugPrint('Failed to fetch notifications: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _markAsRead(String id) async {
    // Optimistic Update
    setState(() {
      final index = _notifications.indexWhere((n) => n.id == id);
      if (index != -1) {
        final old = _notifications[index];
        _notifications[index] = AppNotification(
          id: old.id,
          userId: old.userId,
          title: old.title,
          message: old.message,
          type: old.type,
          link: old.link,
          isRead: true,
          createdAt: old.createdAt,
        );
      }
    });

    try {
      await supabase
          .from('notifications')
          .update({'is_read': true})
          .eq('id', id);
    } catch (e) {
      debugPrint('Failed to mark notification as read: $e');
    }
  }

  Future<void> _markAllAsRead() async {
    // Optimistic Update
    setState(() {
      _notifications = _notifications
          .map(
            (n) => AppNotification(
              id: n.id,
              userId: n.userId,
              title: n.title,
              message: n.message,
              type: n.type,
              link: n.link,
              isRead: true,
              createdAt: n.createdAt,
            ),
          )
          .toList();
    });

    try {
      final user = supabase.auth.currentUser;
      if (user != null) {
        await supabase
            .from('notifications')
            .update({'is_read': true})
            .eq('user_id', user.id)
            .eq('is_read', false);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('সব বার্তা পঠিত হিসেবে চিহ্নিত করা হয়েছে! 👍'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      debugPrint('Failed to mark all as read: $e');
    }
  }

  Future<void> _deleteNotification(String id) async {
    // Optimistic
    setState(() {
      _notifications.removeWhere((n) => n.id == id);
    });

    try {
      await supabase.from('notifications').delete().eq('id', id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('মুছে ফেলা হয়েছে 🗑️'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      debugPrint('Failed to delete notification: $e');
    }
  }

  String _formatDateDistance(DateTime date) {
    final difference = DateTime.now().difference(date);
    if (difference.inDays > 7) {
      return DateFormat('d MMM', 'en_US').format(
        date,
      ); // Fallback english formatting since bengali takes extra config, fine for now
    } else if (difference.inDays > 0) {
      return '${difference.inDays} দিন আগে';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} ঘন্টা আগে';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} মিনিট আগে';
    } else {
      return 'এইমাত্র';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final unreadCount = _notifications.where((n) => !n.isRead).length;

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF0A0A0A)
          : const Color(0xFFFAFAFA), // neutral-950 : neutral-50/50
      appBar: AppBar(
        title: const Text(
          'নোটিফিকেশন',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFF43F5E)),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'নোটিফিকেশন ',
                                style: TextStyle(
                                  fontSize: 24, // text-3xl
                                  fontWeight: FontWeight.w900, // font-black
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF171717),
                                ),
                              ),
                              const Text('🔔', style: TextStyle(fontSize: 24)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'আপনার সব আপডেট এবং অ্যাক্টিভিটি।',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF737373),
                            ),
                          ),
                        ],
                      ),
                      if (unreadCount > 0)
                        OutlinedButton.icon(
                          onPressed: _markAllAsRead,
                          icon: const Icon(
                            LucideIcons.checkCheck,
                            size: 16,
                            color: Color(0xFF10B981),
                          ), // emerald-500
                          label: const Text('সব পড়ুন'),
                          style: OutlinedButton.styleFrom(
                            backgroundColor: isDark
                                ? const Color(0xFF171717)
                                : Colors.white,
                            foregroundColor: isDark
                                ? const Color(0xFFD4D4D4)
                                : const Color(0xFF525252),
                            side: BorderSide(
                              color: isDark
                                  ? const Color(0xFF262626)
                                  : const Color(0xFFE5E5E5),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(24),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 24),

                  if (_notifications.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 48),
                      child: Column(
                        children: [
                          Container(
                            width: 128,
                            height: 128,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: isDark
                                    ? [
                                        const Color(0xFF262626),
                                        const Color(0xFF171717),
                                      ]
                                    : [
                                        const Color(0xFFEDE9FE),
                                        const Color(0xFFFDF4FF),
                                      ],
                              ),
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: Text('📭', style: TextStyle(fontSize: 64)),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'সবকিছু একদম শান্ত!',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              color: isDark
                                  ? Colors.white
                                  : const Color(0xFF262626),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'আপাতত কোনো নতুন নোটিফিকেশন নেই।',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF737373),
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _notifications.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        final notif = _notifications[index];
                        final style = getNotificationStyle(notif.type, isDark);

                        return GestureDetector(
                          onTap: () {
                            if (!notif.isRead) _markAsRead(notif.id);
                          },
                          child: Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: notif.isRead
                                  ? (isDark
                                        ? const Color(0x66171717)
                                        : const Color(0x66FFFFFF))
                                  : (isDark
                                        ? const Color(0xFF171717)
                                        : Colors.white),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: notif.isRead
                                    ? Colors.transparent
                                    : (isDark
                                          ? const Color(0xFF262626)
                                          : const Color(0xFFE5E5E5)),
                              ),
                              boxShadow: notif.isRead
                                  ? []
                                  : [
                                      if (!isDark)
                                        const BoxShadow(
                                          color: Color(0x80F5F5F5),
                                          blurRadius: 10,
                                          offset: Offset(0, 4),
                                        ),
                                    ],
                            ),
                            child: Stack(
                              children: [
                                if (!notif.isRead)
                                  Positioned(
                                    top: 0,
                                    right: 0,
                                    child: Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFF43F5E),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),

                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        color: style['bg'],
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: Icon(
                                        style['icon'] as IconData,
                                        color: style['color'] as Color,
                                      ),
                                    ),
                                    const SizedBox(width: 20),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            notif.title,
                                            style: TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              color: notif.isRead
                                                  ? (isDark
                                                        ? const Color(
                                                            0xFFA3A3A3,
                                                          )
                                                        : const Color(
                                                            0xFF525252,
                                                          ))
                                                  : (isDark
                                                        ? Colors.white
                                                        : const Color(
                                                            0xFF171717,
                                                          )),
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            notif.message,
                                            style: TextStyle(
                                              fontSize: 14,
                                              color: isDark
                                                  ? const Color(0xFFA3A3A3)
                                                  : const Color(0xFF737373),
                                            ),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 12),
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                _formatDateDistance(
                                                  notif.createdAt,
                                                ),
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w500,
                                                  color: Color(0xFFA3A3A3),
                                                ),
                                              ),
                                              IconButton(
                                                icon: const Icon(
                                                  LucideIcons.trash2,
                                                  size: 16,
                                                ),
                                                color: const Color(0xFFA3A3A3),
                                                padding: EdgeInsets.zero,
                                                constraints:
                                                    const BoxConstraints(),
                                                hoverColor: const Color(
                                                  0x1AF43F5E,
                                                ),
                                                onPressed: () =>
                                                    _deleteNotification(
                                                      notif.id,
                                                    ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
    );
  }
}
