import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/connectivity_provider.dart';

class OfflineBannerWrapper extends ConsumerStatefulWidget {
  final Widget child;

  const OfflineBannerWrapper({super.key, required this.child});

  @override
  ConsumerState<OfflineBannerWrapper> createState() => _OfflineBannerWrapperState();
}

class _OfflineBannerWrapperState extends ConsumerState<OfflineBannerWrapper> {
  bool _wasOffline = false;
  bool _showRestoredBanner = false;
  Timer? _restoredTimer;

  @override
  void dispose() {
    _restoredTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final connectivityAsync = ref.watch(connectivityStreamProvider);
    final isOffline = connectivityAsync.value == NetworkStatus.offline;

    if (isOffline) {
      _wasOffline = true;
      _restoredTimer?.cancel();
      _showRestoredBanner = false;
    } else if (_wasOffline && !isOffline) {
      // Transition from offline to online
      _wasOffline = false;
      _showRestoredBanner = true;
      _restoredTimer?.cancel();
      _restoredTimer = Timer(const Duration(milliseconds: 2500), () {
        if (mounted) {
          setState(() {
            _showRestoredBanner = false;
          });
        }
      });
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Stack(
      children: [
        widget.child,

        // Floating Connection Banner
        AnimatedPositioned(
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeOutCubic,
          top: (isOffline || _showRestoredBanner) ? MediaQuery.of(context).padding.top + 8 : -100,
          left: 16,
          right: 16,
          child: Material(
            color: Colors.transparent,
            child: Center(
              child: Container(
                constraints: const BoxConstraints(maxWidth: 480),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: isOffline
                      ? (isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFEF2F2))
                      : (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5)),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isOffline
                        ? (isDark ? const Color(0xFFDC2626) : const Color(0xFFFECACA))
                        : (isDark ? const Color(0xFF059669) : const Color(0xFFA7F3D0)),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.12),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Icon
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: isOffline
                            ? (isDark ? const Color(0xFF991B1B) : const Color(0xFFFEE2E2))
                            : (isDark ? const Color(0xFF047857) : const Color(0xFFD1FAE5)),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isOffline ? LucideIcons.wifiOff : LucideIcons.wifi,
                        size: 15,
                        color: isOffline
                            ? (isDark ? const Color(0xFFFCA5A5) : const Color(0xFFDC2626))
                            : (isDark ? const Color(0xFF6EE7B7) : const Color(0xFF059669)),
                      ),
                    ),
                    const SizedBox(width: 10),

                    // Text Message
                    Flexible(
                      child: Text(
                        isOffline
                            ? 'ইন্টারনেট সংযোগ বিচ্ছিন্ন, অনুগ্রহ করে নেট কানেকশন চেক করো'
                            : 'ইন্টারনেট সংযোগ ফিরে এসেছে!',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                          color: isOffline
                              ? (isDark ? const Color(0xFFFEE2E2) : const Color(0xFF991B1B))
                              : (isDark ? const Color(0xFFD1FAE5) : const Color(0xFF065F46)),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
