import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import 'package:obhyash_app/core/utils/app_popups.dart';
import '../domain/notification_model.dart';
import '../providers/notification_providers.dart';
import '../services/notification_router.dart';
import '../../../../core/presentation/widgets/skeleton_loading.dart';
import '../../../../core/presentation/widgets/app_refresh_indicator.dart';

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
        'color': const Color(0xFFD97706), // amber-500
      };
    case 'error':
      return {
        'icon': LucideIcons.alertCircle,
        'bg': isDark
            ? const Color(0x33881337)
            : const Color(0xFFFEF2F2), // rose-900/20 : rose-100
        'color': const Color(0xFFDC2626), // rose-500
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
        'color': const Color(0xFF2563EB), // blue-500
      };
  }
}

// --- View ---
class NotificationsView extends ConsumerStatefulWidget {
  const NotificationsView({super.key});

  @override
  ConsumerState<NotificationsView> createState() => _NotificationsViewState();
}

class _NotificationsViewState extends ConsumerState<NotificationsView> {
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
        _notifications[index] = old.copyWith(isRead: true);
        if (_filter == 'unread') {
          _notifications.removeAt(index);
        }
      }
    });

    ref.read(unreadNotificationCountProvider.notifier).decrement();

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
        _notifications = _notifications.map((n) => n.copyWith(isRead: true)).toList();
      }
    });

    ref.read(unreadNotificationCountProvider.notifier).markAllRead();

    try {
      final user = supabase.auth.currentUser;
      if (user != null) {
        await supabase.from('notifications').update({'is_read': true}).eq('user_id', user.id).eq('is_read', false);
      }
      if (mounted) {
        AppPopups.show(context, message: 'সব বার্তা পঠিত হিসেবে চিহ্নিত করা হয়েছে', isError: false);
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
        AppPopups.show(context, message: 'মুছে ফেলা হয়েছে', isError: false);
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
      return 'এখনই';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Realtime live prepending of new notification into this view
    ref.listen<AppNotification?>(latestNotificationEventProvider, (prev, next) {
      if (next != null && mounted) {
        if (_filter == 'all' || (_filter == 'unread' && !next.isRead)) {
          setState(() {
            _notifications.removeWhere((n) => n.id == next.id);
            _notifications.insert(0, next);
          });
        }
      }
    });

    // MainLayout handles top header and bottom nav bar
    return Column(
      children: [
        // Filter Tabs & Mark All Read Action
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
          child: Row(
            children: [
              _buildFilterTab(
                label: 'সব বার্তা',
                isActive: _filter == 'all',
                onTap: () {
                  if (_filter != 'all') {
                    setState(() => _filter = 'all');
                    _fetchNotifications();
                  }
                },
                isDark: isDark,
              ),
              const SizedBox(width: 8),
              _buildFilterTab(
                label: 'অপঠিত',
                isActive: _filter == 'unread',
                onTap: () {
                  if (_filter != 'unread') {
                    setState(() => _filter = 'unread');
                    _fetchNotifications();
                  }
                },
                isDark: isDark,
              ),
              const Spacer(),
              if (_notifications.any((n) => !n.isRead))
                GestureDetector(
                  onTap: _markAllAsRead,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0x33004633) : const Color(0xFFE6F4EA),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFF004633).withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(LucideIcons.checkCheck, size: 14, color: Color(0xFF004633)),
                        SizedBox(width: 5),
                        Text(
                          'সব পড়ুন',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF004633),
                            fontFamily: 'HindSiliguri',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),

        // Content List
        Expanded(
          child: _isLoading
              ? const NotificationsListSkeleton()
              : _notifications.isEmpty
                  ? AppRefreshIndicator(
                      onRefresh: () => _fetchNotifications(),
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(
                          parent: BouncingScrollPhysics(),
                        ),
                        children: [
                          SizedBox(
                            height: MediaQuery.of(context).size.height * 0.55,
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    width: 72,
                                    height: 72,
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF4F4F5),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      LucideIcons.bellOff,
                                      size: 32,
                                      color: isDark ? const Color(0xFF71717A) : const Color(0xFFA1A1AA),
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                  Text(
                                    _filter == 'unread' ? 'কোনো অপঠিত নোটিফিকেশন নেই' : 'কোনো নোটিফিকেশন নেই',
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                                      fontFamily: 'HindSiliguri',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    )
                  : AppRefreshIndicator(
                      onRefresh: () => _fetchNotifications(),
                      child: ListView.separated(
                        physics: const AlwaysScrollableScrollPhysics(
                          parent: BouncingScrollPhysics(),
                        ),
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                        itemCount: _notifications.length + (_hasMore ? 1 : 0),
                        separatorBuilder: (context, index) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          if (index == _notifications.length) {
                            return Center(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                child: _isLoadingMore
                                    ? const SizedBox(
                                        width: 24,
                                        height: 24,
                                        child: CircularProgressIndicator(strokeWidth: 2),
                                      )
                                    : ElevatedButton(
                                        onPressed: () => _fetchNotifications(isLoadMore: true),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
                                          foregroundColor: isDark ? Colors.white : Colors.black,
                                          elevation: 0,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(16),
                                            side: BorderSide(
                                              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5),
                                            ),
                                          ),
                                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                        ),
                                        child: const Text('আরও দেখুন', style: TextStyle(fontWeight: FontWeight.bold, fontFamily: 'HindSiliguri')),
                                      ),
                              ),
                            );
                          }

                          final notif = _notifications[index];
                          final style = getNotificationStyle(notif.type, isDark);

                          return GestureDetector(
                            onTap: () {
                              if (!notif.isRead) _markAsRead(notif.id);
                              NotificationRouter.handleTap(context, notif);
                            },
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: notif.isRead
                                    ? (isDark ? const Color(0x33171717) : Colors.white)
                                    : (isDark ? const Color(0xFF18181B) : const Color(0xFFFAFAFA)),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: notif.isRead
                                      ? (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF4F4F5))
                                      : (isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E5E5)),
                                  width: notif.isRead ? 1 : 1.3,
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
                                    width: 42,
                                    height: 42,
                                    decoration: BoxDecoration(
                                      color: style['bg'],
                                      borderRadius: BorderRadius.circular(13),
                                    ),
                                    child: Icon(
                                      style['icon'] as IconData,
                                      color: style['color'] as Color,
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 14),
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
                                                  fontSize: 15.5,
                                                  fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.bold,
                                                  color: notif.isRead
                                                      ? (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF525252))
                                                      : (isDark ? Colors.white : const Color(0xFF000000)),
                                                  fontFamily: 'HindSiliguri',
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
                                                  color: Color(0xFFDC2626),
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 5),
                                        Text(
                                          notif.message,
                                          style: TextStyle(
                                            fontSize: 13.5,
                                            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF737373),
                                            height: 1.4,
                                            fontFamily: 'HindSiliguri',
                                          ),
                                        ),
                                        const SizedBox(height: 10),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Row(
                                              children: [
                                                Icon(
                                                  LucideIcons.clock,
                                                  size: 13,
                                                  color: isDark ? const Color(0xFF71717A) : const Color(0xFFA1A1AA),
                                                ),
                                                const SizedBox(width: 4),
                                                Text(
                                                  _formatDateDistance(notif.createdAt),
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color: isDark ? const Color(0xFF71717A) : const Color(0xFFA1A1AA),
                                                    fontFamily: 'HindSiliguri',
                                                  ),
                                                ),
                                              ],
                                            ),
                                            Row(
                                              children: [
                                                if (!notif.isRead)
                                                  GestureDetector(
                                                    onTap: () => _markAsRead(notif.id),
                                                    child: Container(
                                                      padding: const EdgeInsets.all(6),
                                                      decoration: BoxDecoration(
                                                        shape: BoxShape.circle,
                                                        color: isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5),
                                                      ),
                                                      child: Icon(
                                                        LucideIcons.check,
                                                        size: 14,
                                                        color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                                                      ),
                                                    ),
                                                  ),
                                                const SizedBox(width: 8),
                                                GestureDetector(
                                                  onTap: () => _deleteNotification(notif.id),
                                                  child: Container(
                                                    padding: const EdgeInsets.all(6),
                                                    decoration: BoxDecoration(
                                                      shape: BoxShape.circle,
                                                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5),
                                                    ),
                                                    child: const Icon(
                                                      LucideIcons.trash2,
                                                      size: 14,
                                                      color: Color(0xFFDC2626),
                                                    ),
                                                  ),
                                                ),
                                              ],
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
        ),
      ],
    );
  }

  Widget _buildFilterTab({
    required String label,
    required bool isActive,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          color: isActive
              ? (isDark ? Colors.white : Colors.black)
              : (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF4F4F5)),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: isActive
                ? (isDark ? Colors.black : Colors.white)
                : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A)),
            fontFamily: 'HindSiliguri',
          ),
        ),
      ),
    );
  }
}
