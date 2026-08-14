import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import 'package:obhyash_app/core/utils/app_popups.dart';

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
            : const Color(0xFFECFDF5), // emerald-900/20 : emerald-100
        'color': const Color(0xFF059669), // emerald-500
      };
    case 'warning':
      return {
        'icon': LucideIcons.alertTriangle,
        'bg': isDark
            ? const Color(0x3378350F)
            : const Color(0xFFFEF3C7), // amber-900/20 : amber-100
        'color': const Color(0xFF1E3A8A), // amber-500
      };
    case 'error':
      return {
        'icon': LucideIcons.alertCircle,
        'bg': isDark
            ? const Color(0x33881337)
            : const Color(0xFFFEF2F2), // rose-900/20 : rose-100
        'color': const Color(0xFFB91C1C), // rose-500
      };
    case 'system':
      return {
        'icon': LucideIcons.settings,
        'bg': isDark
            ? const Color(0x334C1D95)
            : const Color(0xFFEDE9FE), // violet-900/20 : violet-100
        'color': const Color(0xFF000000), // violet-500
      };
    case 'info':
    default:
      return {
        'icon': LucideIcons.info,
        'bg': isDark
            ? const Color(0x331E3A8A)
            : const Color(0xFFDBEAFE), // blue-900/20 : blue-100
        'color': const Color(0xFF000000), // blue-500
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
  bool _isLoadingMore = false;
  bool _hasMore = true;
  String _filter = 'all'; // 'all', 'unread'
  int _offset = 0;
  static const int _limit = 10;
  final supabase = Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications({bool isLoadMore = false}) async {
    if (!isLoadMore) {
      setState(() {
        _isLoading = true;
        _offset = 0;
        _hasMore = true;
        _notifications.clear();
      });
    } else {
      setState(() => _isLoadingMore = true);
    }

    try {
      final user = supabase.auth.currentUser;
      if (user == null) return;

      var query = supabase.from('notifications').select().eq('user_id', user.id);

      if (_filter == 'unread') {
        query = query.eq('is_read', false);
      }

      final response = await query
          .order('created_at', ascending: false)
          .range(_offset, _offset + _limit - 1);

      final newItems = (response as List).map((e) => AppNotification.fromJson(e)).toList();

      if (mounted) {
        setState(() {
          if (isLoadMore) {
            _notifications.addAll(newItems);
          } else {
            _notifications = newItems;
          }
          _offset += newItems.length;
          _hasMore = newItems.length == _limit;
        });
      }
    } catch (e) {
      debugPrint('Failed to fetch notifications: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isLoadingMore = false;
        });
      }
    }
  }

  Future<void> _markAsRead(String id) async {
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
        if (_filter == 'unread') {
          _notifications.removeAt(index);
        }
      }
    });

    try {
      await supabase.from('notifications').update({'is_read': true}).eq('id', id);
    } catch (e) {
      debugPrint('Failed to mark notification as read: $e');
    }
  }

  Future<void> _markAllAsRead() async {
    setState(() {
      if (_filter == 'unread') {
        _notifications.clear();
      } else {
        _notifications = _notifications.map((n) => AppNotification(
          id: n.id, userId: n.userId, title: n.title, message: n.message, type: n.type, link: n.link, isRead: true, createdAt: n.createdAt,
        )).toList();
      }
    });

    try {
      final user = supabase.auth.currentUser;
      if (user != null) {
        await supabase.from('notifications').update({'is_read': true}).eq('user_id', user.id).eq('is_read', false);
      }
      if (mounted) {
        AppPopups.show(context, message: 'সব বার্তা পঠিত হিসেবে চিহ্নিত করা হয়েছে! 👍', isError: false);
      }
    } catch (e) {
      debugPrint('Failed to mark all as read: $e');
    }
  }

  Future<void> _deleteNotification(String id) async {
    setState(() {
      _notifications.removeWhere((n) => n.id == id);
    });

    try {
      await supabase.from('notifications').delete().eq('id', id);
      if (mounted) {
        AppPopups.show(context, message: 'মুছে ফেলা হয়েছে 🗑️', isError: false);
      }
    } catch (e) {
      debugPrint('Failed to delete notification: $e');
    }
  }

  String _formatDateDistance(DateTime date) {
    final difference = DateTime.now().difference(date);
    if (difference.inDays > 7) {
      return DateFormat('d MMM', 'en_US').format(date);
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
    
    return Column(
      children: [
        // Premium Header with Filters
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF000000) : Colors.white,
            border: Border(
              bottom: BorderSide(
                color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
              ),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  _FilterChip(
                    label: 'সবগুলো',
                    isSelected: _filter == 'all',
                    onTap: () {
                      if (_filter != 'all') {
                        setState(() => _filter = 'all');
                        _fetchNotifications();
                      }
                    },
                    isDark: isDark,
                  ),
                  const SizedBox(width: 8),
                  _FilterChip(
                    label: 'অপঠিত',
                    isSelected: _filter == 'unread',
                    onTap: () {
                      if (_filter != 'unread') {
                        setState(() => _filter = 'unread');
                        _fetchNotifications();
                      }
                    },
                    isDark: isDark,
                  ),
                ],
              ),
              OutlinedButton.icon(
                onPressed: _markAllAsRead,
                icon: const Icon(LucideIcons.checkCheck, size: 16, color: Color(0xFF059669)),
                label: const Text('সব পড়ুন'),
                style: OutlinedButton.styleFrom(
                  backgroundColor: isDark ? const Color(0xFF171717) : const Color(0xFFF4F4F5),
                  foregroundColor: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF525252),
                  side: BorderSide.none,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                  minimumSize: const Size(0, 32),
                ),
              ),
            ],
          ),
        ),
        
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator(color: Color(0xFFB91C1C)))
              : _notifications.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF171717) : const Color(0xFFF4F4F5),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              LucideIcons.bellOff,
                              size: 48,
                              color: isDark ? const Color(0xFF525252) : const Color(0xFFA3A3A3),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _filter == 'unread' ? 'কোনো নতুন নোটিফিকেশন নেই' : 'কোনো নোটিফিকেশন নেই',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                      itemCount: _notifications.length + (_hasMore ? 1 : 0),
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        if (index == _notifications.length) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            child: Center(
                              child: _isLoadingMore
                                  ? const CircularProgressIndicator(color: Color(0xFFB91C1C))
                                  : ElevatedButton(
                                      onPressed: () => _fetchNotifications(isLoadMore: true),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: isDark ? const Color(0xFF171717) : Colors.white,
                                        foregroundColor: isDark ? Colors.white : const Color(0xFF000000),
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(16),
                                          side: BorderSide(
                                            color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
                                          ),
                                        ),
                                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                      ),
                                      child: const Text('আরও দেখুন', style: TextStyle(fontWeight: FontWeight.bold)),
                                    ),
                            ),
                          );
                        }

                        final notif = _notifications[index];
                        final style = getNotificationStyle(notif.type, isDark);

                        return GestureDetector(
                          onTap: () {
                            if (!notif.isRead) _markAsRead(notif.id);
                          },
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: notif.isRead
                                  ? (isDark ? const Color(0x33171717) : Colors.white)
                                  : (isDark ? const Color(0xFF171717) : const Color(0xFFFAFAFA)),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: notif.isRead
                                    ? (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF4F4F5))
                                    : (isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E5E5)),
                                width: notif.isRead ? 1 : 1.5,
                              ),
                              boxShadow: notif.isRead
                                  ? []
                                  : [
                                      if (!isDark)
                                        const BoxShadow(
                                          color: Color(0x0D000000),
                                          blurRadius: 8,
                                          offset: Offset(0, 2),
                                        ),
                                    ],
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: style['bg'],
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: Icon(
                                    style['icon'] as IconData,
                                    color: style['color'] as Color,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              notif.title,
                                              style: TextStyle(
                                                fontSize: 17,
                                                fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.bold,
                                                color: notif.isRead
                                                    ? (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF525252))
                                                    : (isDark ? Colors.white : const Color(0xFF000000)),
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          if (!notif.isRead)
                                            Container(
                                              margin: const EdgeInsets.only(left: 8, top: 4),
                                              width: 8,
                                              height: 8,
                                              decoration: const BoxDecoration(
                                                color: Color(0xFFB91C1C),
                                                shape: BoxShape.circle,
                                              ),
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        notif.message,
                                        style: TextStyle(
                                          fontSize: 15,
                                          height: 1.4,
                                          color: isDark ? const Color(0xFF737373) : const Color(0xFF737373),
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 10),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            _formatDateDistance(notif.createdAt),
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w500,
                                              color: isDark ? const Color(0xFF525252) : const Color(0xFFA3A3A3),
                                            ),
                                          ),
                                          GestureDetector(
                                            onTap: () => _deleteNotification(notif.id),
                                            child: Icon(
                                              LucideIcons.trash2,
                                              size: 14,
                                              color: isDark ? const Color(0xFF525252) : const Color(0xFFA3A3A3),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final bool isDark;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFB91C1C)
              : (isDark ? const Color(0xFF171717) : const Color(0xFFF4F4F5)),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 15,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
            color: isSelected
                ? Colors.white
                : (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373)),
          ),
        ),
      ),
    );
  }
}

