import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../dashboard/domain/models.dart';
import 'package:obhyash_app/core/utils/app_popups.dart';

class AccountInfoModal extends StatelessWidget {
  final UserProfile user;

  const AccountInfoModal({super.key, required this.user});

  static Future<void> show(BuildContext context, UserProfile user) {
    return showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.55),
      builder: (ctx) => AccountInfoModal(user: user),
    );
  }

  void _copySingle(BuildContext context, String label, String value) {
    Clipboard.setData(ClipboardData(text: value));
    HapticFeedback.lightImpact();
    AppPopups.success(context, message: '$label কপি করা হয়েছে!');
  }

  void _copyAll(BuildContext context) {
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
    buffer.writeln('• System UUID: ${user.id}');

    Clipboard.setData(ClipboardData(text: buffer.toString().trim()));
    HapticFeedback.mediumImpact();
    AppPopups.success(context, message: 'সব অ্যাকাউন্ট ইনফো কপি করা হয়েছে!');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? const Color(0xFF13151F) : const Color(0xFFFFFFFF);
    final cardBg = isDark ? const Color(0xFF1E2235) : const Color(0xFFF8FAFC);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final iconBg = const Color(0xFF0D9488); // Teal color matching screenshot

    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 18),

            // Title
            Text(
              'অ্যাকাউন্ট ইনফো',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                fontFamily: 'HindSiliguri',
                color: textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'সাপোর্ট বা অ্যাডমিনের সহায়তার জন্য প্রয়োজনীয় তথ্য',
              style: TextStyle(
                fontSize: 13,
                fontFamily: 'HindSiliguri',
                color: textSecondary,
              ),
            ),
            const SizedBox(height: 24),

            // Item 1: User Name
            _buildInfoRow(
              context: context,
              icon: LucideIcons.user,
              iconBg: iconBg,
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
              icon: LucideIcons.hash,
              iconBg: iconBg,
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

            // Item 3: Email
            if (user.email != null && user.email!.isNotEmpty) ...[
              _buildInfoRow(
                context: context,
                icon: LucideIcons.mail,
                iconBg: iconBg,
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
                icon: LucideIcons.phone,
                iconBg: iconBg,
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

            const SizedBox(height: 10),

            // Copy All Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: () => _copyAll(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF047857), // Green button from screenshot
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Text(
                      'Copy',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                    SizedBox(width: 8),
                    Icon(LucideIcons.copy, size: 18),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    ),
  );
  }

  Widget _buildInfoRow({
    required BuildContext context,
    required IconData icon,
    required Color iconBg,
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
            // Teal circular icon container
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconBg,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: Colors.white,
                size: 20,
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
                      fontFamily: 'HindSiliguri',
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
