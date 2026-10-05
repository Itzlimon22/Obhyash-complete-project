import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_icons.dart';
import '../../../core/presentation/widgets/app_icon.dart';

import '../../dashboard/domain/models.dart';
import '../../../core/providers/theme_provider.dart';
import '../../auth/providers/auth_controller.dart';
import 'personal_details_view.dart';
import 'widgets/account_info_modal.dart';
import 'widgets/delete_account_modal.dart';

// ─── Data model ──────────────────────────────────────────────────────────────

enum _ItemType { navigate, action }

class _SettingsItem {
  final String label;
  final String description;
  final IconData icon;
  final String? svgAsset;
  final _ItemType type;
  final String? route;
  final String? actionId;
  final bool danger;

  const _SettingsItem({
    required this.label,
    required this.description,
    required this.icon,
    this.svgAsset,
    required this.type,
    this.route,
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

  List<_SettingsGroup> _buildGroups(
    BuildContext context,
    ThemeMode themeMode,
  ) {
    return [
      _SettingsGroup(
        title: 'কার্যকলাপ',
        items: [
          _SettingsItem(
            label: 'প্রোফাইল',
            description: 'এক্সাম ইতিহাস, বিষয়ভিত্তিক স্কোর',
            icon: LucideIcons.user,
            svgAsset: 'assets/dashboard-icons/analytics.svg',
            type: _ItemType.navigate,
            route: '/profile/stats',
          ),
          _SettingsItem(
            label: 'বুকমার্ক',
            description: 'সংরক্ষণ করা প্রশ্নগুলো',
            icon: LucideIcons.bookmark,
            svgAsset: 'assets/dashboard-icons/bookmarks.svg',
            type: _ItemType.navigate,
            route: '/bookmarks',
          ),
          _SettingsItem(
            label: 'রিপোর্ট',
            description: 'রিপোর্ট করা প্রশ্ন ও অ্যাডমিন ফিডব্যাক',
            icon: LucideIcons.alertTriangle,
            svgAsset: 'assets/dashboard-icons/mistake_review.svg',
            type: _ItemType.navigate,
            route: '/my-reports',
          ),
          _SettingsItem(
            label: 'নোটিফিকেশন',
            description: 'নতুন আপডেট ও বার্তা',
            icon: LucideIcons.bell,
            svgAsset: 'assets/dashboard-icons/bell_notification.svg',
            type: _ItemType.navigate,
            route: '/notifications',
          ),
          _SettingsItem(
            label: 'অভিযোগ ও মতামত',
            description: 'অ্যাপের সমস্যা, বাগ বা ফিচারের পরামর্শ জানাও',
            icon: LucideIcons.messageSquare,
            svgAsset: 'assets/dashboard-icons/feedback_chat.svg',
            type: _ItemType.navigate,
            route: '/profile/complaint',
          ),
          _SettingsItem(
            label: 'ফিচার রিকোয়েস্ট',
            description: 'অ্যাপের জন্য নতুন ফিচারের প্রস্তাব ও আইডিয়া পাঠাও',
            icon: LucideIcons.lightbulb,
            svgAsset: 'assets/dashboard-icons/feature_lightbulb.svg',
            type: _ItemType.navigate,
            route: '/profile/feature-requests',
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
            svgAsset: 'assets/dashboard-icons/pro_crown.svg',
            type: _ItemType.navigate,
            route: '/profile/my-subscription',
          ),
          _SettingsItem(
            label: 'আপগ্রেড',
            description: 'নতুন প্ল্যান কিনুন',
            icon: LucideIcons.trendingUp,
            svgAsset: 'assets/dashboard-icons/leaderboard_trophy.svg',
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
            svgAsset: 'assets/dashboard-icons/app_icon.svg',
            type: _ItemType.action,
            actionId: 'openAbout',
          ),
          _SettingsItem(
            label: 'প্রাইভেসি',
            description: 'তোমার ডেটা কীভাবে ব্যবহার হয়',
            icon: LucideIcons.shield,
            svgAsset: 'assets/dashboard-icons/privacy_shield.svg',
            type: _ItemType.action,
            actionId: 'openPrivacy',
          ),
          _SettingsItem(
            label: 'শর্তাবলী',
            description: 'শর্ত ও বিধিমালা',
            icon: LucideIcons.fileText,
            svgAsset: 'assets/dashboard-icons/terms_doc.svg',
            type: _ItemType.action,
            actionId: 'openTerms',
          ),
          _SettingsItem(
            label: 'রিফান্ড পলিসি',
            description: 'রিফান্ড ও পেমেন্ট বিধিমালা',
            icon: LucideIcons.refreshCw,
            svgAsset: 'assets/dashboard-icons/terms_doc.svg',
            type: _ItemType.action,
            actionId: 'openRefund',
          ),
          _SettingsItem(
            label: 'সাহায্য',
            description: 'সাধারণ প্রশ্নের উত্তর',
            icon: LucideIcons.helpCircle,
            svgAsset: 'assets/dashboard-icons/help_question.svg',
            type: _ItemType.navigate,
            route: '/profile/faq',
          ),
        ],
      ),
      _SettingsGroup(
        title: 'অ্যাকাউন্ট ও সেটিংস',
        items: [
          _SettingsItem(
            label: 'অ্যাকাউন্ট ইনফো',
            description: 'ইউজার আইডি ও সাপোর্টে দেওয়ার জরুরি তথ্য',
            icon: LucideIcons.fingerprint,
            svgAsset: 'assets/dashboard-icons/account_card.svg',
            type: _ItemType.action,
            actionId: 'accountInfo',
          ),
          _SettingsItem(
            label: 'অ্যাকাউন্ট লিংকিং',
            description: 'গুগল ও অন্যান্য অ্যাকাউন্ট সংযুক্ত ও ম্যানেজ করো',
            icon: LucideIcons.link2,
            svgAsset: 'assets/dashboard-icons/settings_gear.svg',
            type: _ItemType.navigate,
            route: '/profile/account-linking',
          ),
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
          _SettingsItem(
            label: 'অ্যাকাউন্ট মুছুন',
            description: 'স্থায়ীভাবে তোমার অ্যাকাউন্ট ও ডেটা ডিলিট করো',
            icon: LucideIcons.trash2,
            type: _ItemType.action,
            actionId: 'deleteAccount',
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
      case _ItemType.action:
        if (item.actionId == 'openAbout') {
          _launchPolicyUrl(context, 'https://obhyash.com/about');
        } else if (item.actionId == 'openPrivacy') {
          _launchPolicyUrl(context, 'https://obhyash.com/privacy');
        } else if (item.actionId == 'openTerms') {
          _launchPolicyUrl(context, 'https://obhyash.com/terms');
        } else if (item.actionId == 'openRefund') {
          _launchPolicyUrl(context, 'https://obhyash.com/refund');
        } else if (item.actionId == 'accountInfo') {
          AccountInfoModal.show(context, user);
        } else if (item.actionId == 'deleteAccount') {
          DeleteAccountModal.show(context, user);
        } else if (item.actionId == 'toggleTheme') {
          ref.read(themeModeProvider.notifier).toggle();
        } else if (item.actionId == 'logout') {
          final confirmed = await showDialog<bool>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('লগ আউট'),
              content: const Text(
                'তুমি কি নিশ্চিতভাবে লগ আউট করতে চাও?',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(false),
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
            try {
              await ref.read(authControllerProvider.notifier).logout();
            } catch (e) {
              debugPrint('[SettingsView] Logout error: $e');
            }
          }
        }
    }
  }

  Future<void> _launchPolicyUrl(
    BuildContext context,
    String url,
  ) async {
    final uri = Uri.parse(url);
    try {
      final launched = await launchUrl(uri, mode: LaunchMode.inAppBrowserView);
      if (!launched) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {
      try {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } catch (e) {
        debugPrint('[SettingsView] Error launching url: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeMode = ref.watch(themeModeProvider);
    final bg = isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA);
    final groups = _buildGroups(context, themeMode);

    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(0, 12, 0, 32),
          children: [
            // ── Premium Profile Card ──────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Container(
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF18181B) : Colors.white,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFE6EBE8),
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: isDark
                          ? Colors.black.withValues(alpha: 0.25)
                          : const Color(0x0A000000),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                    BoxShadow(
                      color: isDark
                          ? Colors.black.withValues(alpha: 0.35)
                          : const Color(0x12063C2A), // Soft, subtle organic shadow
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                      spreadRadius: -4,
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  children: [
                    _HeroBanner(user: user),
                    _CardBody(user: user, isDark: isDark),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          // ── Settings Groups ───────────────────────────────────────────
          ...groups.asMap().entries.map((entry) {
            final gi = entry.key;
            final group = entry.value;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (group.title.isNotEmpty)
                  Padding(
                    padding: EdgeInsets.fromLTRB(20, gi == 0 ? 0 : 18, 20, 8),
                    child: Text(
                      group.title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: isDark
                            ? const Color(0xFFA1A1AA)
                            : const Color(0xFF71717A),
                      ),
                    ),
                  )
                else
                  const SizedBox(height: 18),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
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
        ? const Color(0xFFEF4444)
        : (isDark ? const Color(0xFF34D399) : const Color(0xFF059669));
    final iconBg = item.danger
        ? const Color(0xFFEF4444).withValues(alpha: isDark ? 0.2 : 0.1)
        : (isDark
            ? const Color(0xFF059669).withValues(alpha: 0.2)
            : const Color(0xFF059669).withValues(alpha: 0.1));
    final labelColor = item.danger
        ? const Color(0xFFEF4444)
        : (isDark ? Colors.white : const Color(0xFF111827));

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? const Color(0x1A000000) : const Color(0x05000000),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
            child: Row(
              children: [
                if (item.svgAsset != null)
                  SizedBox(
                    width: 38,
                    height: 38,
                    child: SvgPicture.asset(
                      item.svgAsset!,
                      fit: BoxFit.contain,
                      placeholderBuilder: (_) => Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: iconBg,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(item.icon, color: iconColor, size: 18),
                      ),
                    ),
                  )
                else
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: iconBg,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(item.icon, color: iconColor, size: 18),
                  ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    item.label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: labelColor,
                      ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (item.type != _ItemType.action)
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6),
                      shape: BoxShape.circle,
                    ),
                    child: AppIcon(
                      AppIcons.chevronRight,
                      size: 15,
                      color: isDark
                          ? const Color(0xFFA1A1AA)
                          : const Color(0xFF71717A),
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

// ─── Premium Profile Card Components (from exact HTML design) ─────────────────

class _HeroBanner extends StatelessWidget {
  final UserProfile user;

  const _HeroBanner({required this.user});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // 1. Base Multi-stop Linear Gradient (145deg: #03271c, #065f46 58%, #0a7a57)
        Positioned.fill(
          child: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment(-0.8, -0.6),
                end: Alignment(0.8, 0.6),
                colors: [
                  Color(0xFF03271C),
                  Color(0xFF065F46),
                  Color(0xFF0A7A57),
                ],
                stops: [0.0, 0.58, 1.0],
              ),
            ),
          ),
        ),

        // 2. Gold Radial Glow (at 90% -20%: rgba(201,162,75,.30))
        Positioned.fill(
          child: Container(
            decoration: const BoxDecoration(
              gradient: RadialGradient(
                center: Alignment(0.8, -1.2),
                radius: 1.1,
                colors: [
                  Color(0x4DC9A24B),
                  Colors.transparent,
                ],
                stops: [0.0, 0.55],
              ),
            ),
          ),
        ),

        // 3. Mint Radial Glow (at 0% 110%: rgba(52,211,153,.22))
        Positioned.fill(
          child: Container(
            decoration: const BoxDecoration(
              gradient: RadialGradient(
                center: Alignment(-1.0, 1.1),
                radius: 0.9,
                colors: [
                  Color(0x3834D399),
                  Colors.transparent,
                ],
                stops: [0.0, 0.60],
              ),
            ),
          ),
        ),

        // 4. Subtle Masked Grid Lines (22px spacing)
        Positioned.fill(
          child: ShaderMask(
            shaderCallback: (bounds) {
              return RadialGradient(
                center: const Alignment(0.0, -0.3),
                radius: 0.8,
                colors: [
                  Colors.white.withValues(alpha: 0.16),
                  Colors.white.withValues(alpha: 0.04),
                  Colors.transparent,
                ],
                stops: const [0.0, 0.55, 1.0],
              ).createShader(bounds);
            },
            blendMode: BlendMode.dstIn,
            child: CustomPaint(
              size: Size.infinite,
              painter: _GridPatternPainter(),
            ),
          ),
        ),

        // 5. Content (Avatar Ring + Name + Email)
        Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(20, 32, 20, 28),
          child: Column(
            children: [
              _GoldenAvatarRing(user: user),
              Text(
                user.name.isNotEmpty ? user.name : 'Student',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                (user.email != null && user.email!.isNotEmpty)
                    ? user.email!
                    : 'student@obhyash.com',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 14.5,
                  fontWeight: FontWeight.w400,
                  color: Colors.white.withValues(alpha: 0.74),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _GoldenAvatarRing extends StatelessWidget {
  final UserProfile user;

  const _GoldenAvatarRing({required this.user});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 126,
      height: 126,
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.08),
          width: 7,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.55),
            blurRadius: 28,
            offset: const Offset(0, 14),
            spreadRadius: -8,
          ),
        ],
      ),
      child: Container(
        padding: const EdgeInsets.all(3),
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          gradient: SweepGradient(
            transform: GradientRotation(200 * math.pi / 180),
            colors: [
              Color(0xFFF6E6AE),
              Color(0xFFC9A24B),
              Color(0xFF8A6A1C),
              Color(0xFFECD78F),
              Color(0xFFF6E6AE),
            ],
          ),
        ),
        child: Container(
          padding: const EdgeInsets.all(3),
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: Color(0xFF052E22),
          ),
          child: ClipOval(
            child: (user.avatarUrl != null && user.avatarUrl!.isNotEmpty)
                ? Image.network(
                    user.avatarUrl!,
                    width: 100,
                    height: 100,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        _buildMetallicSphere(),
                  )
                : _buildMetallicSphere(),
          ),
        ),
      ),
    );
  }

  Widget _buildMetallicSphere() {
    return Container(
      width: 100,
      height: 100,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          center: Alignment(-0.04, -0.16),
          radius: 0.85,
          colors: [
            Color(0xFFE4DCCB),
            Color(0xFF6B6F76),
            Color(0xFF171A1F),
          ],
          stops: [0.0, 0.20, 0.65],
        ),
      ),
    );
  }
}

class _GridPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.08)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    const spacing = 22.0;

    for (double x = 0; x <= size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y <= size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _CardBody extends StatelessWidget {
  final UserProfile user;
  final bool isDark;

  const _CardBody({required this.user, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        gradient: isDark
            ? null
            : const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.white, Color(0xFFFBFCFB)],
              ),
      ),
      child: Column(
        children: [
          // Pills row 1 (Phone + College)
          Row(
            children: [
              Expanded(
                child: _PillWidget(
                  icon: LucideIcons.smartphone,
                  label: (user.phone != null && user.phone!.isNotEmpty)
                      ? user.phone!
                      : '01800000000',
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _PillWidget(
                  icon: LucideIcons.landmark,
                  label: (user.institute != null && user.institute!.isNotEmpty)
                      ? user.institute!
                      : 'ঢাকা কলেজ',
                  isDark: isDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Pills row 2 (Centered Batch)
          Center(
            child: _PillWidget(
              icon: LucideIcons.graduationCap,
              label: (user.batch != null && user.batch!.isNotEmpty)
                  ? (user.batch!.toLowerCase().contains('ব্যাচ')
                      ? user.batch!
                      : 'ব্যাচ ${user.batch!}')
                  : 'ব্যাচ HSC 2027',
              isDark: isDark,
            ),
          ),

          const SizedBox(height: 14),

          // 4 Action Buttons
          Row(
            children: [
              Expanded(
                child: _ActButton(
                  icon: LucideIcons.user,
                  label: 'প্রোফাইল',
                  isDark: isDark,
                  onTap: () => context.push('/profile/stats'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ActButton(
                  icon: LucideIcons.edit3,
                  label: 'এডিট',
                  isDark: isDark,
                  onTap: () => Navigator.of(context, rootNavigator: true).push(
                    MaterialPageRoute(
                      builder: (_) => PersonalDetailsView(user: user),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ActButton(
                  icon: LucideIcons.info,
                  label: 'ইনফো',
                  isDark: isDark,
                  onTap: () => AccountInfoModal.show(context, user),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ActButton(
                  icon: LucideIcons.gift,
                  label: 'রেফার',
                  isDark: isDark,
                  isGold: true,
                  onTap: () => context.push('/profile/referral'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PillWidget extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isDark;

  const _PillWidget({
    required this.icon,
    required this.label,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 46,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF222227) : Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: isDark ? const Color(0xFF2E2E33) : const Color(0xFFE6EBE8),
          width: 1,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D06281C), // rgba(6,40,28,.05)
            blurRadius: 2,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 18,
            color: isDark ? const Color(0xFF34D399) : const Color(0xFF065F46),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontFamily: 'HindSiliguri',
                fontSize: 14.5,
                fontWeight: FontWeight.w500,
                color: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF2A3A33),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isDark;
  final bool isGold;
  final VoidCallback onTap;

  const _ActButton({
    required this.icon,
    required this.label,
    required this.isDark,
    this.isGold = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bg = isGold
        ? (isDark ? const Color(0xFF2A2214) : const Color(0xFFFDF6E3))
        : (isDark ? const Color(0xFF222227) : const Color(0xFFF7F9F8));

    final borderColor = isGold
        ? (isDark ? const Color(0xFF6B5324) : const Color(0xFFE6D197))
        : (isDark ? const Color(0xFF2E2E33) : const Color(0xFFE6EBE8));

    final fgColor = isGold
        ? (isDark ? const Color(0xFFF6C453) : const Color(0xFF8A6414))
        : (isDark ? Colors.white : const Color(0xFF10201A));

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 2),
        decoration: BoxDecoration(
          color: bg,
          gradient: isGold && !isDark
              ? const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFFDF6E3), Colors.white],
                )
              : null,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: borderColor, width: 1),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A06281C),
              blurRadius: 2,
              offset: Offset(0, 1),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 22, color: fgColor),
            const SizedBox(height: 7),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontFamily: 'HindSiliguri',
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: fgColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

