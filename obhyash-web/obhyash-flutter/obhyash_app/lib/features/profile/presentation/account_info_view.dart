import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../../core/presentation/widgets/app_refresh_indicator.dart';
import '../../../core/providers/app_config_provider.dart';
import '../../../core/utils/app_popups.dart';
import '../../dashboard/domain/models.dart';
import '../../dashboard/providers/dashboard_providers.dart';

class AccountInfoView extends ConsumerStatefulWidget {
  const AccountInfoView({super.key});

  @override
  ConsumerState<AccountInfoView> createState() => _AccountInfoViewState();
}

class _AccountInfoViewState extends ConsumerState<AccountInfoView> {
  PackageInfo? _platformPackageInfo;

  @override
  void initState() {
    super.initState();
    _loadPackageInfo();
  }

  Future<void> _loadPackageInfo() async {
    try {
      final info = await PackageInfo.fromPlatform();
      if (mounted) {
        setState(() => _platformPackageInfo = info);
      }
    } catch (e) {
      debugPrint('[AccountInfoView] PackageInfo load error: $e');
    }
  }

  String _getAppVersionText(WidgetRef ref) {
    if (_platformPackageInfo != null) {
      final ver = _platformPackageInfo!.version;
      return 'v$ver';
    }
    final info = ref.watch(packageInfoProvider);
    if (info != null) {
      return 'v${info.version}';
    }
    final currentVer = ref.watch(currentAppVersionProvider);
    final cleanVer = currentVer.split('+').first;
    return 'v$cleanVer';
  }

  void _copySingle(BuildContext context, String label, String value) {
    if (value.isEmpty) return;
    Clipboard.setData(ClipboardData(text: value));
    HapticFeedback.lightImpact();
    AppPopups.success(context, message: '$label কপি করা হয়েছে!');
  }

  void _copyAll(BuildContext context, UserProfile user, String appVersion) {
    final buffer = StringBuffer();
    buffer.writeln('📋 Obhyash Account Info:');
    buffer.writeln('• Student ID: ${user.displayStudentId}');
    buffer.writeln('• User Name: ${user.name}');
    if (user.email != null && user.email!.isNotEmpty) {
      buffer.writeln('• Email: ${user.email}');
    }
    if (user.phone != null && user.phone!.isNotEmpty) {
      buffer.writeln('• Phone: ${user.phone}');
    }
    if (user.stream != null && user.stream!.isNotEmpty) {
      buffer.writeln('• Stream: ${user.stream}${user.batch != null ? " (${user.batch})" : ""}');
    }
    if (user.institute != null && user.institute!.isNotEmpty) {
      buffer.writeln('• Institute: ${user.institute}');
    }
    buffer.writeln('• App Version: $appVersion');
    buffer.writeln('• System UUID: ${user.id}');

    Clipboard.setData(ClipboardData(text: buffer.toString().trim()));
    HapticFeedback.mediumImpact();
    AppPopups.success(context, message: 'সব অ্যাকাউন্ট ইনফো কপি করা হয়েছে!');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? const Color(0xFF000000) : const Color(0xFFFAFAFA);
    final cardBg = isDark ? const Color(0xFF1E2235) : const Color(0xFFF8FAFC);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final user = ref.watch(userProfileProvider).value;
    final appVersion = _getAppVersionText(ref);

    return Scaffold(
      backgroundColor: bg,
      body: user == null
          ? const Center(
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : AppRefreshIndicator(
              onRefresh: () async {
                ref.invalidate(userProfileProvider);
                await _loadPackageInfo();
                try {
                  await ref.read(userProfileProvider.future);
                } catch (_) {}
              },
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                children: [
                  const SizedBox(height: 8),

                  // Item 1: User Name
                  _buildInfoRow(
                    context: context,
                    svgAsset: 'assets/dashboard-icons/user_profile.svg',
                    fallbackIcon: LucideIcons.user,
                    label: 'User Name',
                    value: user.name,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                    cardBg: cardBg,
                    isDark: isDark,
                  ),
                  const SizedBox(height: 16),

                  // Item 2: Student ID (User ID)
                  _buildInfoRow(
                    context: context,
                    svgAsset: 'assets/dashboard-icons/account_card.svg',
                    fallbackIcon: LucideIcons.hash,
                    label: 'User ID',
                    value: user.displayStudentId,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                    cardBg: cardBg,
                    isDark: isDark,
                    isMonospace: true,
                    showCopyIcon: true,
                  ),
                  const SizedBox(height: 16),

                  // Item 3: Email (if available)
                  if (user.email != null && user.email!.isNotEmpty) ...[
                    _buildInfoRow(
                      context: context,
                      svgAsset: 'assets/dashboard-icons/email_mail.svg',
                      fallbackIcon: LucideIcons.mail,
                      label: 'Email',
                      value: user.email!,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      cardBg: cardBg,
                      isDark: isDark,
                      showCopyIcon: true,
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Item 4: Phone (if available)
                  if (user.phone != null && user.phone!.isNotEmpty) ...[
                    _buildInfoRow(
                      context: context,
                      svgAsset: 'assets/dashboard-icons/phone_call.svg',
                      fallbackIcon: LucideIcons.phone,
                      label: 'Phone',
                      value: user.phone!,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      cardBg: cardBg,
                      isDark: isDark,
                      showCopyIcon: true,
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Item 5: App Version
                  _buildInfoRow(
                    context: context,
                    svgAsset: 'assets/dashboard-icons/app_icon.svg',
                    fallbackIcon: LucideIcons.layers,
                    label: 'App Version',
                    value: appVersion,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                    cardBg: cardBg,
                    isDark: isDark,
                    isMonospace: true,
                    showCopyIcon: true,
                  ),
                  const SizedBox(height: 24),

                  // Copy Button (matching original modal exactly)
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () => _copyAll(context, user, appVersion),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF047857), // Obhyash Emerald
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Copy',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          SizedBox(width: 8),
                          Icon(LucideIcons.copy, size: 16),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  Widget _buildInfoRow({
    required BuildContext context,
    required String svgAsset,
    required IconData fallbackIcon,
    required String label,
    required String value,
    required Color textPrimary,
    required Color textSecondary,
    required Color cardBg,
    required bool isDark,
    bool isMonospace = false,
    bool showCopyIcon = false,
  }) {
    return InkWell(
      onTap: () => _copySingle(context, label, value),
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
        child: Row(
          children: [
            // Real 3D SVG Icon
            SizedBox(
              width: 44,
              height: 44,
              child: SvgPicture.asset(
                svgAsset,
                width: 44,
                height: 44,
                fit: BoxFit.contain,
              ),
            ),
            const SizedBox(width: 16),

            // Text Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: textSecondary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: textPrimary,
                      fontFamily: isMonospace ? 'monospace' : 'HindSiliguri',
                      letterSpacing: isMonospace ? 0.5 : 0,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            if (showCopyIcon) ...[
              IconButton(
                icon: Icon(
                  LucideIcons.copy,
                  size: 16,
                  color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                ),
                onPressed: () => _copySingle(context, label, value),
                tooltip: '$label কপি করো',
              ),
            ],
          ],
        ),
      ),
    );
  }
}
