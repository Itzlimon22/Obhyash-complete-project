import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../dashboard/domain/models.dart';
import '../../notifications/presentation/notifications_view.dart';
import '../../subscription/presentation/my_subscription_view.dart';
import '../../subscription/presentation/subscription_view.dart';
import '../../../core/providers/theme_provider.dart';
import 'personal_details_view.dart';
import 'profile_stats_page.dart';

// ─── Data model ──────────────────────────────────────────────────────────────

enum _ItemType { navigate, external, action }

class _SettingsItem {
  final String label;
  final String description;
  final IconData icon;
  final _ItemType type;
  final String? route;
  final String? url;
  final String? actionId;
  final bool danger;
  final Widget? destination;

  const _SettingsItem({
    required this.label,
    required this.description,
    required this.icon,
    required this.type,
    this.route,
    this.url,
    this.actionId,
    this.danger = false,
    this.destination,
  });
}

class _SettingsGroup {
  final String title;
  final List<_SettingsItem> items;
  const _SettingsGroup({required this.title, required this.items});
}

// ─── View ─────────────────────────────────────────────────────────────────────

class SettingsView extends ConsumerWidget {
  final UserProfile user;

  const SettingsView({super.key, required this.user});

  List<_SettingsGroup> _buildGroups(BuildContext context) {
    return [
      _SettingsGroup(
        title: 'কার্যকলাপ',
        items: [
          _SettingsItem(
            label: 'পরিসংখ্যান',
            description: 'এক্সাম ইতিহাস, বিষয়ভিত্তিক স্কোর',
            icon: LucideIcons.barChart2,
            type: _ItemType.navigate,
            destination: const ProfileStatsPage(),
          ),
          _SettingsItem(
            label: 'আমার রিপোর্ট',
            description: 'রিপোর্ট করা প্রশ্ন ও অ্যাডমিন ফিডব্যাক',
            icon: LucideIcons.alertTriangle,
            type: _ItemType.navigate,
            route: '/my-reports',
          ),
          _SettingsItem(
            label: 'নোটিফিকেশন',
            description: 'নতুন আপডেট ও বার্তা',
            icon: LucideIcons.bell,
            type: _ItemType.navigate,
            destination: const NotificationsView(),
          ),
        ],
      ),
      _SettingsGroup(
        title: 'সাবস্ক্রিপশন',
        items: [
          _SettingsItem(
            label: 'আমার সাবস্ক্রিপশন',
            description: 'বর্তমান প্ল্যান, ইতিহাস ও লেনদেন',
            icon: LucideIcons.crown,
            type: _ItemType.navigate,
            destination: const MySubscriptionView(),
          ),
          _SettingsItem(
            label: 'আপগ্রেড করুন',
            description: 'প্রিমিয়াম প্ল্যান দেখো ও আপগ্রেড করো',
            icon: LucideIcons.creditCard,
            type: _ItemType.navigate,
            destination: const _UpgradePage(),
          ),
        ],
      ),
      _SettingsGroup(
        title: 'কন্টেন্ট',
        items: [
          _SettingsItem(
            label: 'ব্লগ',
            description: 'আর্টিকেল ও গাইড পড়ো',
            icon: LucideIcons.bookOpen,
            type: _ItemType.navigate,
            route: '/blog',
          ),
        ],
      ),
      _SettingsGroup(
        title: 'অ্যাপ ও আইনি',
        items: [
          _SettingsItem(
            label: 'আমাদের সম্পর্কে',
            description: 'Obhyash সম্পর্কে জানো',
            icon: LucideIcons.info,
            type: _ItemType.navigate,
            route: '/about',
          ),
          _SettingsItem(
            label: 'প্রাইভেসি পলিসি',
            description: 'তোমার ডেটা কীভাবে ব্যবহার হয়',
            icon: LucideIcons.shield,
            type: _ItemType.external,
            url: 'https://obhyash.com/privacy',
          ),
          _SettingsItem(
            label: 'ব্যবহারের নিয়মাবলী',
            description: 'শর্ত ও বিধিমালা',
            icon: LucideIcons.fileText,
            type: _ItemType.external,
            url: 'https://obhyash.com/terms',
          ),
          _SettingsItem(
            label: 'সাহায্য ও FAQ',
            description: 'সাধারণ প্রশ্নের উত্তর',
            icon: LucideIcons.helpCircle,
            type: _ItemType.external,
            url: 'https://obhyash.com/faq',
          ),
        ],
      ),
      _SettingsGroup(
        title: '',
        items: [
          _SettingsItem(
            label: 'লগ আউট',
            description: 'অ্যাকাউন্ট থেকে বের হও',
            icon: LucideIcons.logOut,
            type: _ItemType.action,
            actionId: 'logout',
            danger: true,
          ),
        ],
      ),
    ];
  }

  Future<void> _handleItem(
    BuildContext context,
    WidgetRef ref,
    _SettingsItem item,
  ) async {
    switch (item.type) {
      case _ItemType.navigate:
        if (item.destination != null) {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => item.destination!),
          );
        } else if (item.route != null) {
          context.go(item.route!);
        }
      case _ItemType.external:
        if (item.url != null) {
          final uri = Uri.parse(item.url!);
          if (await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          }
        }
      case _ItemType.action:
        if (item.actionId == 'logout') {
          final confirmed = await showDialog<bool>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('লগ আউট?'),
              content: const Text('আপনি কি সত্যিই বের হতে চান?'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('বাতিল'),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFFDC2626),
                  ),
                  child: const Text(
                    'লগ আউট',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          );
          if (confirmed == true) {
            await Supabase.instance.client.auth.signOut();
            if (context.mounted) context.go('/login');
          }
        }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeMode = ref.watch(themeModeProvider);
    final bg = isDark ? const Color(0xFF0A0A0A) : const Color(0xFFF5F5F5);
    final cardBg = isDark ? const Color(0xFF171717) : Colors.white;
    final groups = _buildGroups(context);

    final nameParts = user.name.trim().split(' ');
    final initials = nameParts.length >= 2
        ? '${nameParts[0][0]}${nameParts[1][0]}'.toUpperCase()
        : (nameParts[0].isNotEmpty ? nameParts[0][0].toUpperCase() : '?');

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: const Color(0xFF166534),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'সেটিংস',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: Icon(
              themeMode == ThemeMode.dark ? LucideIcons.sun : LucideIcons.moon,
              size: 18,
            ),
            onPressed: () => ref.read(themeModeProvider.notifier).toggle(),
            tooltip: themeMode == ThemeMode.dark ? 'লাইট মোড' : 'ডার্ক মোড',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 12),
        children: [
          // ── Profile Card ──────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF262626)
                      : const Color(0xFFE5E5E5),
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x08000000),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  // Green gradient header
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF166534), Color(0xFF14532D)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Column(
                      children: [
                        // Avatar
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFFE11D48),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.3),
                              width: 3,
                            ),
                            image: user.avatarUrl != null
                                ? DecorationImage(
                                    image: NetworkImage(user.avatarUrl!),
                                    fit: BoxFit.cover,
                                  )
                                : null,
                          ),
                          child: user.avatarUrl == null
                              ? Center(
                                  child: Text(
                                    initials,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 28,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                )
                              : null,
                        ),
                        const SizedBox(height: 12),
                        // Name
                        Text(
                          user.name,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            fontFamily: 'HindSiliguri',
                          ),
                        ),
                        if (user.email != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            user.email!,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withOpacity(0.7),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  // Info chips + action buttons
                  Container(
                    color: cardBg,
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                    child: Column(
                      children: [
                        // Info chips
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          alignment: WrapAlignment.center,
                          children: [
                            if (user.phone != null && user.phone!.isNotEmpty)
                              _InfoChip(
                                emoji: '📞',
                                label: user.phone!,
                                isDark: isDark,
                              ),
                            if (user.institute != null &&
                                user.institute!.isNotEmpty)
                              _InfoChip(
                                emoji: '🏫',
                                label: user.institute!,
                                isDark: isDark,
                              ),
                            if (user.batch != null && user.batch!.isNotEmpty)
                              _InfoChip(
                                emoji: '📅',
                                label: 'ব্যাচ ${user.batch!}',
                                isDark: isDark,
                              ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // Action buttons row
                        Row(
                          children: [
                            _ActionBtn(
                              icon: LucideIcons.pencil,
                              label: 'এডিট',
                              isDark: isDark,
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      PersonalDetailsView(user: user),
                                ),
                              ),
                            ),
                            _ActionBtn(
                              icon: LucideIcons.bell,
                              label: 'নোটিফি',
                              isDark: isDark,
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const NotificationsView(),
                                ),
                              ),
                            ),
                            _ActionBtn(
                              icon: LucideIcons.alertTriangle,
                              label: 'রিপোর্ট',
                              isDark: isDark,
                              onTap: () => context.go('/my-reports'),
                            ),
                            _ActionBtn(
                              icon: LucideIcons.gift,
                              label: 'রেফার',
                              isDark: isDark,
                              isAccent: true,
                              onTap: () {},
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          // ── Settings Groups ───────────────────────────────────────────
          ...groups.asMap().entries.map((entry) {
            final gi = entry.key;
            final group = entry.value;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (group.title.isNotEmpty)
                  Padding(
                    padding: EdgeInsets.fromLTRB(20, gi == 0 ? 0 : 20, 20, 8),
                    child: Text(
                      group.title,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                        color: isDark
                            ? const Color(0xFF737373)
                            : const Color(0xFFA3A3A3),
                      ),
                    ),
                  )
                else
                  const SizedBox(height: 20),
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFE5E5E5),
                    ),
                  ),
                  child: Column(
                    children: group.items.asMap().entries.map((e) {
                      final idx = e.key;
                      final item = e.value;
                      final isLast = idx == group.items.length - 1;
                      return _NavItem(
                        item: item,
                        isDark: isDark,
                        isLast: isLast,
                        onTap: () => _handleItem(context, ref, item),
                      );
                    }).toList(),
                  ),
                ),
              ],
            );
          }),
        ],
      ),
    );
  }
}

// ─── Nav Item Widget ──────────────────────────────────────────────────────────

class _NavItem extends StatelessWidget {
  final _SettingsItem item;
  final bool isDark;
  final bool isLast;
  final VoidCallback onTap;

  const _NavItem({
    required this.item,
    required this.isDark,
    required this.isLast,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final iconColor = item.danger
        ? const Color(0xFFDC2626)
        : const Color(0xFF166534);
    final iconBg = item.danger
        ? const Color(0xFFDC2626).withOpacity(0.1)
        : const Color(0xFF166534).withOpacity(0.1);
    final labelColor = item.danger
        ? const Color(0xFFDC2626)
        : (isDark ? Colors.white : const Color(0xFF171717));

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.vertical(
        bottom: isLast ? const Radius.circular(16) : Radius.zero,
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: isLast
              ? null
              : Border(
                  bottom: BorderSide(
                    color: isDark
                        ? const Color(0xFF262626)
                        : const Color(0xFFE5E5E5),
                  ),
                ),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(item.icon, color: iconColor, size: 16),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: labelColor,
                    ),
                  ),
                  Text(
                    item.description,
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark
                          ? const Color(0xFF737373)
                          : const Color(0xFFA3A3A3),
                    ),
                  ),
                ],
              ),
            ),
            if (item.type != _ItemType.action)
              Icon(
                item.type == _ItemType.external
                    ? LucideIcons.externalLink
                    : LucideIcons.chevronRight,
                size: 14,
                color: isDark
                    ? const Color(0xFF525252)
                    : const Color(0xFFD4D4D4),
              ),
          ],
        ),
      ),
    );
  }
}

// ─── Info Chip ────────────────────────────────────────────────────────────────

class _InfoChip extends StatelessWidget {
  final String emoji;
  final String label;
  final bool isDark;

  const _InfoChip({
    required this.emoji,
    required this.label,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 13)),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              fontFamily: 'HindSiliguri',
              color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF404040),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Action Button ────────────────────────────────────────────────────────────

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isDark;
  final bool isAccent;
  final VoidCallback onTap;

  const _ActionBtn({
    required this.icon,
    required this.label,
    required this.isDark,
    required this.onTap,
    this.isAccent = false,
  });

  @override
  Widget build(BuildContext context) {
    final bg = isAccent
        ? (isDark ? const Color(0x33881337) : const Color(0xFFFFF1F2))
        : (isDark ? const Color(0xFF1A1A1A) : const Color(0xFFF5F5F5));
    final fg = isAccent
        ? (isDark ? const Color(0xFFFB7185) : const Color(0xFFE11D48))
        : (isDark ? const Color(0xFFD4D4D4) : const Color(0xFF404040));

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 3),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isAccent
                  ? (isDark ? const Color(0x887f1d1d) : const Color(0xFFfecdd3))
                  : (isDark
                        ? const Color(0xFF262626)
                        : const Color(0xFFE5E5E5)),
            ),
          ),
          child: Column(
            children: [
              Icon(icon, size: 18, color: fg),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'HindSiliguri',
                  color: fg,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Upgrade Page Wrapper ─────────────────────────────────────────────────────

class _UpgradePage extends StatelessWidget {
  const _UpgradePage();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF0A0A0A)
          : const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: const Color(0xFF166534),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'আপগ্রেড করুন',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 18,
            fontFamily: 'HindSiliguri',
          ),
        ),
      ),
      body: const SubscriptionView(),
    );
  }
}
