import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class ForceUpdateScreen extends StatelessWidget {
  final String minVersion;
  final String updateUrl;

  const ForceUpdateScreen({
    super.key,
    required this.minVersion,
    this.updateUrl =
        'https://play.google.com/store/apps/details?id=com.obhyash.app',
  });

  Future<void> _launchUpdateUrl() async {
    final uri = Uri.parse(updateUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Container(
              padding: const EdgeInsets.all(28.0),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFE2E8F0),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: const Color(0xFF8B5CF6).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: const Color(0xFF8B5CF6).withOpacity(0.3),
                      ),
                    ),
                    child: const Icon(
                      Icons.system_update_rounded,
                      size: 38,
                      color: Color(0xFF8B5CF6),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'নতুন ভার্সন আপডেট উপলব্ধ!',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'অভ্যাস অ্যাপের আরও উন্নত ও দ্রুত পারফরম্যান্স উপভোগ করতে অনুগ্রহ করে গুগল প্লে-স্টোর থেকে নতুন ভার্সন (v$minVersion) আপডেট করে নিন।',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.5,
                      color: isDark
                          ? const Color(0xFFA1A1AA)
                          : const Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: _launchUpdateUrl,
                      icon: const Icon(Icons.download_rounded, size: 18),
                      label: const Text(
                        'প্লে-স্টোর থেকে আপডেট করুন',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF004633),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
