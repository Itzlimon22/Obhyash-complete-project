import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/theme_provider.dart';

/// Wraps the root application view to provide an ultra-smooth,
/// cross-fade transition whenever the theme mode is toggled anywhere in the app.
class ThemeAnimationWrapper extends ConsumerStatefulWidget {
  final Widget child;

  const ThemeAnimationWrapper({
    super.key,
    required this.child,
  });

  @override
  ConsumerState<ThemeAnimationWrapper> createState() => _ThemeAnimationWrapperState();
}

class _ThemeAnimationWrapperState extends ConsumerState<ThemeAnimationWrapper>
    with SingleTickerProviderStateMixin {
  final GlobalKey _boundaryKey = GlobalKey();
  late AnimationController _animController;
  late Animation<double> _fadeAnimation;
  ui.Image? _snapshotImage;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 380),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeInOutCubic,
    );
    _animController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _cleanupSnapshot();
      }
    });
  }

  void _cleanupSnapshot() {
    if (_snapshotImage != null) {
      _snapshotImage?.dispose();
      if (mounted) {
        setState(() {
          _snapshotImage = null;
        });
      } else {
        _snapshotImage = null;
      }
    }
  }

  @override
  void dispose() {
    _cleanupSnapshot();
    _animController.dispose();
    super.dispose();
  }

  void _onThemeChanged() {
    try {
      final boundary =
          _boundaryKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary != null && boundary.hasSize && !boundary.size.isEmpty) {
        final pixelRatio = MediaQuery.of(context).devicePixelRatio;
        final image = boundary.toImageSync(pixelRatio: pixelRatio);
        _snapshotImage?.dispose();
        _snapshotImage = image;
        _animController.forward(from: 0.0);
      }
    } catch (_) {
      // Fallback: silently ignore if snapshot cannot be captured
    }
  }

  @override
  Widget build(BuildContext context) {
    // Listen to theme mode changes to capture the previous frame and cross-fade smoothly
    ref.listen<ThemeMode>(themeModeProvider, (prev, next) {
      if (prev != null && prev != next) {
        _onThemeChanged();
      }
    });

    return Stack(
      fit: StackFit.expand,
      children: [
        RepaintBoundary(
          key: _boundaryKey,
          child: widget.child,
        ),
        if (_snapshotImage != null)
          Positioned.fill(
            child: IgnorePointer(
              child: AnimatedBuilder(
                animation: _fadeAnimation,
                builder: (context, _) {
                  return Opacity(
                    opacity: (1.0 - _fadeAnimation.value).clamp(0.0, 1.0),
                    child: RawImage(
                      image: _snapshotImage,
                      fit: BoxFit.cover,
                      alignment: Alignment.center,
                    ),
                  );
                },
              ),
            ),
          ),
      ],
    );
  }
}
