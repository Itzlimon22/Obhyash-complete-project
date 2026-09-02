import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../domain/notification_model.dart';
import '../providers/notification_providers.dart';

class NotificationCenterModal extends ConsumerStatefulWidget {
  const NotificationCenterModal({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const NotificationCenterModal(),
    );
  }

  @override
  ConsumerState<NotificationCenterModal> createState() => _NotificationCenterModalState();
}

class _NotificationCenterModalState extends ConsumerState<NotificationCenterModal> {
  int _selectedFilter = 0; // 0: All, 1: Unread, 2: Exams

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final notificationsAsync = ref.watch(notificationsProvider);
    final unreadCount = ref.watch(unreadNotificationCountProvider);

    return Container(
      height: MediaQuery.of(context).size.height * 0.82,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        children: [
          // ── Drag Handle ──────────────────────────────────────────────────
          const SizedBox(height: 12),
          Container(
            width: 44,
            height: 4.5,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE4E4E7),
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(height: 14),

          // ── Header ───────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    LucideIcons.bell,
                    color: Color(0xFF059669),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  'নোটিফিকেশন',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Anek Bangla',
                    color: isDark ? Colors.white : const Color(0xFF111827),
                  ),
                ),
                if (unreadCount > 0) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      unreadCount.toString(),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
                const Spacer(),
                if (unreadCount > 0)
                  TextButton.icon(
                    onPressed: () => ref.read(notificationsProvider.notifier).markAllAsRead(),
                    icon: const Icon(LucideIcons.checkCheck, size: 16),
                    label: const Text(
                      'সব পড়া হয়েছে',
                      style: TextStyle(
                        fontSize: 13,
                        fontFamily: 'Anek Bangla',
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFF059669),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // ── Filter Tabs ──────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                _buildFilterChip(0, 'সকল', isDark),
                const SizedBox(width: 8),
                _buildFilterChip(1, 'অপঠিত', isDark),
                const SizedBox(width: 8),
                _buildFilterChip(2, 'পরীক্ষা ও ফলাফল', isDark),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Divider(height: 1, color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9)),

          // ── Notification List ────────────────────────────────────────────
          Expanded(
            child: notificationsAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: Color(0xFF059669)),
              ),
              error: (err, _) => Center(
                child: Text(
                  'নোটিফিকেশন লোড করা যায়নি',
                  style: TextStyle(
                    fontFamily: 'Anek Bangla',
                    color: isDark ? Colors.white60 : Colors.black54,
                  ),
                ),
              ),
              data: (list) {
                final filtered = list.where((n) {
                  if (_selectedFilter == 1) return !n.isRead;
                  if (_selectedFilter == 2) {
                    return n.type == 'live_exam' || n.type == 'result';
                  }
                  return true;
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          LucideIcons.bellOff,
                          size: 48,
                          color: isDark ? const Color(0xFF52525B) : const Color(0xFFA1A1AA),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _selectedFilter == 1
                              ? 'কোনো অপঠিত নোটিফিকেশন নেই'
                              : 'আপাতত কোনো নোটিফিকেশন নেই',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'Anek Bangla',
                            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (ctx, index) {
                    final item = filtered[index];
                    return _NotificationCard(
                      notification: item,
                      isDark: isDark,
                      onTap: () {
                        if (!item.isRead) {
                          ref.read(notificationsProvider.notifier).markAsRead(item.id);
                        }
                        final route = item.data?['route']?.toString() ?? item.link;
                        if (route != null && route.isNotEmpty) {
                          Navigator.pop(context);
                          context.push(route);
                        }
                      },
                      onDismiss: () {
                        ref.read(notificationsProvider.notifier).deleteNotification(item.id);
                      },
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(int index, String label, bool isDark) {
    final isSelected = _selectedFilter == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF059669)
              : (isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5)),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
            fontFamily: 'Anek Bangla',
            color: isSelected
                ? Colors.white
                : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A)),
          ),
        ),
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final AppNotification notification;
  final bool isDark;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const _NotificationCard({
    required this.notification,
    required this.isDark,
    required this.onTap,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final iconData = _getIcon(notification.type);
    final color = _getColor(notification.type);

    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDismiss(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: const Color(0xFFEF4444),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(LucideIcons.trash2, color: Colors.white, size: 20),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: notification.isRead
                ? (isDark ? const Color(0xFF1E1E22) : const Color(0xFFF9FAFB))
                : (isDark ? const Color(0xFF242730) : const Color(0xFFF0FDF4)),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: notification.isRead
                  ? (isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB))
                  : const Color(0xFF059669).withValues(alpha: 0.35),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Type Icon
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(iconData, color: color, size: 18),
              ),
              const SizedBox(width: 12),

              // Text Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.bold,
                              fontFamily: 'Anek Bangla',
                              color: isDark ? Colors.white : const Color(0xFF111827),
                            ),
                          ),
                        ),
                        if (!notification.isRead) ...[
                          const SizedBox(width: 6),
                          Container(
                            width: 7,
                            height: 7,
                            decoration: const BoxDecoration(
                              color: Color(0xFF059669),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      notification.body,
                      style: TextStyle(
                        fontSize: 13.5,
                        fontFamily: 'HindSiliguri',
                        height: 1.4,
                        color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF4B5563),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _formatTime(notification.createdAt),
                      style: TextStyle(
                        fontSize: 11.5,
                        fontFamily: 'Anek Bangla',
                        color: isDark ? const Color(0xFF71717A) : const Color(0xFF9CA3AF),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getIcon(String type) {
    switch (type) {
      case 'streak':
        return LucideIcons.flame;
      case 'live_exam':
        return LucideIcons.timer;
      case 'result':
        return LucideIcons.trophy;
      case 'milestone':
        return LucideIcons.zap;
      case 'leaderboard':
        return LucideIcons.award;
      default:
        return LucideIcons.bell;
    }
  }

  Color _getColor(String type) {
    switch (type) {
      case 'streak':
        return const Color(0xFFEF4444);
      case 'live_exam':
        return const Color(0xFF3B82F6);
      case 'result':
        return const Color(0xFFEAB308);
      case 'milestone':
        return const Color(0xFF8B5CF6);
      default:
        return const Color(0xFF059669);
    }
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return 'এইমাত্র';
    if (diff.inMinutes < 60) return '${diff.inMinutes} মিনিট আগে';
    if (diff.inHours < 24) return '${diff.inHours} ঘণ্টা আগে';
    if (diff.inDays == 1) return 'গতকাল ${DateFormat('h:mm a').format(dt)}';
    return DateFormat('d MMM, h:mm a').format(dt);
  }
}
