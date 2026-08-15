import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../dashboard/domain/models.dart';
import '../../../core/providers/theme_provider.dart';
import 'personal_details_view.dart';
import '../../../core/presentation/widgets/user_avatar.dart';

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

  const _SettingsItem({
    required this.label,
    required this.description,
    required this.icon,
    required this.type,
    this.route,
    this.url,
    this.actionId,
    this.danger = false,
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

  List<_SettingsGroup> _buildGroups(BuildContext context, ThemeMode themeMode) {
    return [
      _SettingsGroup(
        title: 'কার্যকলাপ',
        items: [
          _SettingsItem(
            label: 'প্রোফাইল',
            description: 'এক্সাম ইতিহাস, বিষয়ভিত্তিক স্কোর',
            icon: LucideIcons.user,
            type: _ItemType.navigate,
            route: '/profile/stats',
          ),
          _SettingsItem(
            label: 'বুকমার্ক',
            description: 'সংরক্ষণ করা প্রশ্নগুলো',
            icon: LucideIcons.bookmark,
            type: _ItemType.navigate,
            route: '/bookmarks',
          ),
          _SettingsItem(
            label: 'রিপোর্ট',
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
            route: '/notifications',
          ),
        ],
      ),
      _SettingsGroup(
        title: 'সাবস্ক্রিপশন',
        items: [
          _SettingsItem(
            label: 'সাবস্ক্রিপশন',
            description: 'বর্তমান প্ল্যান, ইতিহাস ও লেনদেন',
            icon: LucideIcons.crown,
            type: _ItemType.navigate,
            route: '/profile/my-subscription',
          ),
          _SettingsItem(
            label: 'আপগ্রেড',
            description: 'নতুন প্ল্যান কিনুন',
            icon: LucideIcons.trendingUp,
            type: _ItemType.navigate,
            route: '/profile/subscription',
          ),
        ],
      ),

      _SettingsGroup(
        title: 'অ্যাপ ও আইনি',
        items: [
          _SettingsItem(
            label: 'পরিচিতি',
            description: 'Obhyash সম্পর্কে জানো',
            icon: LucideIcons.info,
            type: _ItemType.navigate,
            route: '/profile/about',
          ),
          _SettingsItem(
            label: 'প্রাইভেসি',
            description: 'তোমার ডেটা কীভাবে ব্যবহার হয়',
            icon: LucideIcons.shield,
            type: _ItemType.navigate,
            route: '/profile/privacy',
          ),
          _SettingsItem(
            label: 'শর্তাবলী',
            description: 'শর্ত ও বিধিমালা',
            icon: LucideIcons.fileText,
            type: _ItemType.navigate,
            route: '/profile/terms',
          ),
          _SettingsItem(
            label: 'সাহায্য',
            description: 'সাধারণ প্রশ্নের উত্তর',
            icon: LucideIcons.helpCircle,
            type: _ItemType.navigate,
            route: '/profile/faq',
          ),
        ],
      ),
      _SettingsGroup(
        title: 'অ্যাকাউন্ট ও সেটিংস',
        items: [
          _SettingsItem(
            label: themeMode == ThemeMode.dark ? 'লাইট মোড চালু করো' : 'ডার্ক মোড চালু করো',
            description: 'অ্যাপের কালার থিম পরিবর্তন করো',
            icon: themeMode == ThemeMode.dark ? LucideIcons.sun : LucideIcons.moon,
            type: _ItemType.action,
            actionId: 'toggleTheme',
          ),
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
        if (item.route != null) {
          context.push(item.route!);
        }
      case _ItemType.external:
        if (item.url != null) {
          final uri = Uri.parse(item.url!);
          if (await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          }
        }
      case _ItemType.action:
        if (item.actionId == 'toggleTheme') {
          ref.read(themeModeProvider.notifier).toggle();
        } else if (item.actionId == 'logout') {
          final confirmed = await showDialog<bool>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('লগ আউট?'),
              content: const Text('তুমি কি সত্যিই বের হতে চাও?'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('বাতিল'),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFFB91C1C),
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
    final bg = isDark ? const Color(0xFF000000) : const Color(0xFFFAFAFA);
    final cardBg = isDark ? const Color(0xFF1C1C1E) : Colors.white;
    final groups = _buildGroups(context, themeMode);

    final nameParts = user.name.trim().split(' ');
    final initials = nameParts.length >= 2
        ? '${nameParts[0][0]}${nameParts[1][0]}'.toUpperCase()
        : (nameParts[0].isNotEmpty ? nameParts[0][0].toUpperCase() : '?');

    return Scaffold(
      backgroundColor: bg,
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
                      ? const Color(0xFF1C1C1E)
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
                        UserAvatar(
                          id: user.id,
                          name: user.name,
                          avatarUrl: user.avatarUrl,
                          gender: user.gender,
                          size: 80,
                          showBorder: true,
                          borderColor: Colors.white.withOpacity(0.3),
                          borderWidth: 3,
                        ),
                        const SizedBox(height: 12),
                        // Name
                        Text(
                          user.name,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            fontFamily: 'Anek Bangla',
                          ),
                        ),
                        if (user.email != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            user.email!,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 15,
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
                        // Info chips (2-column first row + centered batch)
                        Column(
                          children: [
                            if ((user.phone != null && user.phone!.isNotEmpty) ||
                                (user.institute != null && user.institute!.isNotEmpty))
                              Row(
                                children: [
                                  if (user.phone != null && user.phone!.isNotEmpty)
                                    Expanded(
                                      child: _InfoChip(
                                        emoji: '📞',
                                        label: user.phone!,
                                        isDark: isDark,
                                      ),
                                    ),
                                  if (user.phone != null &&
                                      user.phone!.isNotEmpty &&
                                      user.institute != null &&
                                      user.institute!.isNotEmpty)
                                    const SizedBox(width: 8),
                                  if (user.institute != null && user.institute!.isNotEmpty)
                                    Expanded(
                                      child: _InfoChip(
                                        emoji: '🏫',
                                        label: user.institute!,
                                        isDark: isDark,
                                      ),
                                    ),
                                ],
                              ),
                            if (user.batch != null && user.batch!.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              _InfoChip(
                                emoji: '📅',
                                label: user.batch!.toLowerCase().contains('ব্যাচ')
                                    ? user.batch!
                                    : 'ব্যাচ ${user.batch!}',
                                isDark: isDark,
                              ),
                            ],
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
                              onTap: () => Navigator.of(context, rootNavigator: true).push(
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
                              onTap: () => context.push('/notifications'),
                            ),
                            _ActionBtn(
                              icon: LucideIcons.alertTriangle,
                              label: 'রিপোর্ট',
                              isDark: isDark,
                              onTap: () => context.push('/my-reports'),
                            ),
                            _ActionBtn(
                              icon: LucideIcons.gift,
                              label: 'রেফার',
                              isDark: isDark,
                              isAccent: true,
                              onTap: () => context.push('/profile/referral'),
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
                        fontSize: 15,
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
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: group.items.map((item) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _NavItem(
                          item: item,
                          isDark: isDark,
                          onTap: () => _handleItem(context, ref, item),
                        ),
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
  final VoidCallback onTap;

  const _NavItem({
    required this.item,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final iconColor = item.danger
        ? const Color(0xFFB91C1C)
        : const Color(0xFF166534);
    final iconBg = item.danger
        ? const Color(0xFFB91C1C).withOpacity(0.1)
        : const Color(0xFF166534).withOpacity(0.1);
    final labelColor = item.danger
        ? const Color(0xFFB91C1C)
        : (isDark ? Colors.white : const Color(0xFF000000));

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.transparent : const Color(0x08000000),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(item.icon, color: iconColor, size: 20),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    item.label,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: labelColor,
                      fontFamily: 'Anek Bangla',
                    ),
                   maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
            if (item.type != _ItemType.action)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  item.type == _ItemType.external
                      ? LucideIcons.externalLink
                      : LucideIcons.chevronRight,
                  size: 16,
                  color: isDark
                      ? const Color(0xFFA3A3A3)
                      : const Color(0xFF737373),
                ),
              ),
          ],
        ),
      ),
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6.5),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 5),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w600,
                fontFamily: 'Anek Bangla',
                color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF27272A),
              ),
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
        ? (isDark ? const Color(0xFFB91C1C) : const Color(0xFFB91C1C))
        : (isDark ? const Color(0xFFD4D4D4) : const Color(0xFF27272A));

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
                        ? const Color(0xFF1C1C1E)
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
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Anek Bangla',
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

