import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// An interactive modal dialog allowing the user to zoom, pan, rotate, and crop
/// an image before saving it as their profile avatar.
class AvatarCropDialog extends StatefulWidget {
  final Uint8List imageBytes;

  const AvatarCropDialog({super.key, required this.imageBytes});

  static Future<Uint8List?> show(BuildContext context, Uint8List imageBytes) {
    return showDialog<Uint8List>(
      context: context,
      barrierDismissible: false,
      builder: (_) => AvatarCropDialog(imageBytes: imageBytes),
    );
  }

  @override
  State<AvatarCropDialog> createState() => _AvatarCropDialogState();
}

class _AvatarCropDialogState extends State<AvatarCropDialog> {
  final GlobalKey _cropKey = GlobalKey();
  final TransformationController _transformController = TransformationController();
  int _quarterTurns = 0;
  bool _isProcessing = false;
  double _currentScale = 1.0;

  @override
  void initState() {
    super.initState();
    _transformController.addListener(_onTransformChanged);
  }

  @override
  void dispose() {
    _transformController.removeListener(_onTransformChanged);
    _transformController.dispose();
    super.dispose();
  }

  void _onTransformChanged() {
    final scale = _transformController.value.getMaxScaleOnAxis();
    if (mounted && scale != _currentScale) {
      setState(() {
        _currentScale = scale;
      });
    }
  }

  void _rotate() {
    HapticFeedback.selectionClick();
    setState(() {
      _quarterTurns = (_quarterTurns + 1) % 4;
      _transformController.value = Matrix4.identity();
    });
  }

  void _reset() {
    HapticFeedback.selectionClick();
    setState(() {
      _quarterTurns = 0;
      _transformController.value = Matrix4.identity();
    });
  }

  void _zoom(double factor) {
    HapticFeedback.selectionClick();
    final matrix = _transformController.value.clone();
    matrix.scaleByDouble(factor, factor, 1.0, 1.0);
    _transformController.value = matrix;
  }

  Future<void> _cropAndDone() async {
    if (_isProcessing) return;
    setState(() => _isProcessing = true);
    HapticFeedback.mediumImpact();

    try {
      // Small delay to ensure render tree is stable
      await Future.delayed(const Duration(milliseconds: 60));

      final boundary = _cropKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) {
        if (mounted) Navigator.pop(context, null);
        return;
      }

      final ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      final ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);

      if (byteData != null && mounted) {
        final croppedBytes = byteData.buffer.asUint8List();
        Navigator.pop(context, croppedBytes);
      } else {
        if (mounted) Navigator.pop(context, null);
      }
    } catch (e) {
      debugPrint('[AvatarCropDialog] Error cropping image: $e');
      if (mounted) Navigator.pop(context, null);
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final cropSize = (size.width * 0.72).clamp(220.0, 300.0);

    return Scaffold(
      backgroundColor: Colors.black.withValues(alpha: 0.92),
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton.icon(
                    onPressed: _isProcessing ? null : () => Navigator.pop(context, null),
                    icon: const Icon(LucideIcons.arrowLeft, size: 18, color: Colors.white70),
                    label: const Text(
                      'বাতিল',
                      style: TextStyle(
                        color: Colors.white70,
                        fontFamily: 'HindSiliguri',
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const Text(
                    'ছবি অ্যাডজাস্ট ও ক্রপ',
                    style: TextStyle(
                      color: Colors.white,
                      fontFamily: 'HindSiliguri',
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  TextButton.icon(
                    onPressed: _isProcessing ? null : _cropAndDone,
                    icon: _isProcessing
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF10B981)),
                          )
                        : const Icon(LucideIcons.check, size: 18, color: Color(0xFF10B981)),
                    label: const Text(
                      'নিশ্চিত',
                      style: TextStyle(
                        color: Color(0xFF10B981),
                        fontFamily: 'HindSiliguri',
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const Spacer(),

            // Hint Text
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.move, size: 15, color: Colors.white.withValues(alpha: 0.6)),
                  const SizedBox(width: 6),
                  Text(
                    'ছবি ড্র্যাগ করে পজিশন করো অথবা জুম করো',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75),
                      fontFamily: 'HindSiliguri',
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Circular Viewport with RepaintBoundary
            Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Croppable Target
                  ClipOval(
                    child: RepaintBoundary(
                      key: _cropKey,
                      child: Container(
                        width: cropSize,
                        height: cropSize,
                        color: Colors.black,
                        child: InteractiveViewer(
                          transformationController: _transformController,
                          minScale: 0.8,
                          maxScale: 4.5,
                          boundaryMargin: const EdgeInsets.all(double.infinity),
                          child: RotatedBox(
                            quarterTurns: _quarterTurns,
                            child: Image.memory(
                              widget.imageBytes,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Overlay circular guide border
                  IgnorePointer(
                    child: Container(
                      width: cropSize,
                      height: cropSize,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: const Color(0xFF10B981),
                          width: 2.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.6),
                            blurRadius: 20,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const Spacer(),

            // Control Bar (Rotate, Zoom slider / buttons, Reset)
            Container(
              margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF18181B),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF27272A)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  // Rotate Button
                  _CropControlBtn(
                    icon: LucideIcons.rotateCw,
                    label: 'ঘোরাও',
                    onTap: _rotate,
                  ),

                  // Zoom Out
                  _CropControlBtn(
                    icon: LucideIcons.zoomOut,
                    label: 'জুম আউট',
                    onTap: () => _zoom(0.85),
                  ),

                  // Zoom In
                  _CropControlBtn(
                    icon: LucideIcons.zoomIn,
                    label: 'জুম ইন',
                    onTap: () => _zoom(1.15),
                  ),

                  // Reset Button
                  _CropControlBtn(
                    icon: LucideIcons.refreshCw,
                    label: 'রিসেট',
                    onTap: _reset,
                  ),
                ],
              ),
            ),

            // Save Confirmation Button
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: _isProcessing ? null : _cropAndDone,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  icon: _isProcessing
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(LucideIcons.checkCheck, size: 19),
                  label: Text(
                    _isProcessing ? 'প্রসেসিং হচ্ছে...' : 'ক্রপ ও সেভ করো',
                    style: const TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CropControlBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _CropControlBtn({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: Colors.white),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontFamily: 'HindSiliguri',
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
