import 'package:flutter/material.dart';
import 'app_refresh_indicator.dart';

/// Legacy alias for AppRefreshIndicator providing hardware-accelerated smooth refresh.
class FacebookRefreshIndicator extends StatelessWidget {
  final Widget child;
  final Future<void> Function() onRefresh;
  final double triggerDistance;
  final double maxDragDistance;

  const FacebookRefreshIndicator({
    super.key,
    required this.child,
    required this.onRefresh,
    this.triggerDistance = 64.0,
    this.maxDragDistance = 96.0,
  });

  @override
  Widget build(BuildContext context) {
    return AppRefreshIndicator(
      onRefresh: onRefresh,
      child: child,
    );
  }
}
