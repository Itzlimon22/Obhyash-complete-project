import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/app_config_provider.dart';

class GlobalAnnouncementBanner extends ConsumerStatefulWidget {
  const GlobalAnnouncementBanner({super.key});

  @override
  ConsumerState<GlobalAnnouncementBanner> createState() =>
      _GlobalAnnouncementBannerState();
}

class _GlobalAnnouncementBannerState
    extends ConsumerState<GlobalAnnouncementBanner> {
  bool _isDismissed = false;
  String? _lastAnnouncementText;

  @override
  Widget build(BuildContext context) {
    final configAsync = ref.watch(appConfigStreamProvider);

    return configAsync.maybeWhen(
      data: (config) {
        if (!config.globalAnnouncementEnabled ||
            config.globalAnnouncementText.trim().isEmpty) {
          return const SizedBox.shrink();
        }

        // Reset dismissal if text changed
        if (_lastAnnouncementText != config.globalAnnouncementText) {
          _lastAnnouncementText = config.globalAnnouncementText;
          _isDismissed = false;
        }

        if (_isDismissed) return const SizedBox.shrink();

        Color bgColor;
        Color textColor;
        IconData icon;

        switch (config.globalAnnouncementType) {
          case 'warning':
            bgColor = const Color(0xFFF59E0B);
            textColor = Colors.black87;
            icon = Icons.warning_amber_rounded;
            break;
          case 'success':
            bgColor = const Color(0xFF10B981);
            textColor = Colors.white;
            icon = Icons.check_circle_outline_rounded;
            break;
          case 'danger':
            bgColor = const Color(0xFFEF4444);
            textColor = Colors.white;
            icon = Icons.campaign_rounded;
            break;
          case 'info':
          default:
            bgColor = const Color(0xFF2563EB);
            textColor = Colors.white;
            icon = Icons.info_outline_rounded;
            break;
        }

        return Container(
          width: double.infinity,
          margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: bgColor.withValues(alpha: 0.3),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(icon, size: 20, color: textColor),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  config.globalAnnouncementText,
                  style: TextStyle(
                    color: textColor,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    height: 1.3,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () => setState(() => _isDismissed = true),
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Icon(Icons.close_rounded, size: 16, color: textColor),
                ),
              ),
            ],
          ),
        );
      },
      orElse: () => const SizedBox.shrink(),
    );
  }
}
