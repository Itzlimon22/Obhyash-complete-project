import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/device_service.dart';
import '../../utils/app_popups.dart';

class DeviceBlockedScreen extends StatefulWidget {
  final String? deviceId;
  final String? reason;

  const DeviceBlockedScreen({
    super.key,
    this.deviceId,
    this.reason,
  });

  @override
  State<DeviceBlockedScreen> createState() => _DeviceBlockedScreenState();
}

class _DeviceBlockedScreenState extends State<DeviceBlockedScreen> {
  String _currentDeviceId = '';

  @override
  void initState() {
    super.initState();
    _currentDeviceId = widget.deviceId ?? '';
    if (_currentDeviceId.isEmpty) {
      DeviceService.getDeviceId().then((id) {
        if (mounted) setState(() => _currentDeviceId = id);
      });
    }
  }

  Future<void> _contactSupport() async {
    final emailUri = Uri(
      scheme: 'mailto',
      path: 'support@obhyash.com',
      queryParameters: {
        'subject': 'Device Ban Appeal - $_currentDeviceId',
        'body': 'আমার ডিভাইস আইডি: $_currentDeviceId\n\nবিস্তারিত সমস্যা:\n',
      },
    );
    try {
      if (await canLaunchUrl(emailUri)) {
        await launchUrl(emailUri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFF8FAFC),
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Container(
                padding: const EdgeInsets.all(28.0),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF18181B) : Colors.white,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(
                    color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Danger Badge Icon
                    Container(
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: const Color(0xFFEF4444).withValues(alpha: 0.3),
                          width: 1.5,
                        ),
                      ),
                      child: const Icon(
                        LucideIcons.shieldAlert,
                        size: 40,
                        color: Color(0xFFEF4444),
                      ),
                    ),
                    const SizedBox(height: 22),

                    // Title
                    Text(
                      'ডিভাইসটি স্থায়ীভাবে নিষিদ্ধ',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                    ),
                    const SizedBox(height: 10),

                    // Subtitle
                    Text(
                      widget.reason != null && widget.reason!.isNotEmpty
                          ? widget.reason!
                          : 'অভ্যাস প্ল্যাটফর্মের নিরাপত্তা নীতিমালা গুরুতর লঙ্ঘনের কারণে এই ডিভাইসটিকে সম্পূর্ণ নিষিদ্ধ (Device Banned) করা হয়েছে। এই ডিভাইসে আর কোনো অ্যাকাউন্ট ব্যবহার করা সম্ভব নয়।',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.5,
                        color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569),
                        ),
                    ),
                    const SizedBox(height: 24),

                    // Device ID Box with Copy
                    if (_currentDeviceId.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isDark ? Colors.white12 : Colors.grey[300]!,
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              LucideIcons.smartphone,
                              size: 16,
                              color: Colors.grey,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _currentDeviceId,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontFamily: 'monospace',
                                  color: isDark ? Colors.white70 : Colors.black87,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            IconButton(
                              onPressed: () {
                                Clipboard.setData(ClipboardData(text: _currentDeviceId));
                                HapticFeedback.lightImpact();
                                AppPopups.info(context, message: 'ডিভাইস আইডি কপি হয়েছে');
                              },
                              icon: const Icon(LucideIcons.copy, size: 16),
                              visualDensity: VisualDensity.compact,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 24),

                    // Contact Support Button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: _contactSupport,
                        icon: const Icon(LucideIcons.mail, size: 16),
                        label: const Text(
                          'সাপোর্টে যোগাযোগ করুন',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFEF4444),
                          foregroundColor: Colors.white,
                          
                          ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
