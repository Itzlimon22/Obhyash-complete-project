import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:lucide_icons/lucide_icons.dart';
import 'package:path_provider/path_provider.dart';
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';

import '../services/notes_offline_service.dart';

class NotesPdfViewerPage extends StatefulWidget {
  final String title;
  final String pdfUrl;

  const NotesPdfViewerPage({
    super.key,
    required this.title,
    required this.pdfUrl,
  });

  static String resolveR2Url(String pathOrUrl) {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl;
    }
    final cleanPath =
        pathOrUrl.startsWith('/') ? pathOrUrl.substring(1) : pathOrUrl;
    return 'https://notes.obhyash.com/$cleanPath';
  }

  static final Map<String, Uint8List> _memoryCache = {};

  static Future<void> prefetchPdf(String pathOrUrl) async {
    final cacheKey = pathOrUrl.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '_');
    if (_memoryCache.containsKey(cacheKey)) return;

    try {
      final cacheDir = await getTemporaryDirectory();
      final cacheFile = File('${cacheDir.path}/note_$cacheKey.pdf');
      if (await cacheFile.exists()) {
        final bytes = await cacheFile.readAsBytes();
        if (bytes.isNotEmpty) {
          _memoryCache[cacheKey] = bytes;
          return;
        }
      }

      final targetUrl = resolveR2Url(pathOrUrl);
      final response = await http.get(
        Uri.parse(targetUrl),
        headers: {'Accept-Encoding': 'gzip, deflate, br'},
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
        _memoryCache[cacheKey] = response.bodyBytes;
        await cacheFile.writeAsBytes(response.bodyBytes, flush: true);
      }
    } catch (_) {}
  }

  @override
  State<NotesPdfViewerPage> createState() => _NotesPdfViewerPageState();
}

class _NotesPdfViewerPageState extends State<NotesPdfViewerPage> {
  Uint8List? _pdfBytes;
  bool _isLoading = true;
  String? _errorMessage;

  // Zoom management
  double _zoomLevel = 1.0;
  double _baseZoomLevel = 1.0;

  // Scroll & Page tracking
  final ScrollController _scrollController = ScrollController();
  final ScrollController _horizontalScrollController = ScrollController();
  int _currentPage = 1;
  int _totalPages = 1;

  // State flags
  bool _isFullscreen = false;
  bool _isSavingOffline = false;

  @override
  void initState() {
    super.initState();
    NotesOfflineService.init();
    _scrollController.addListener(_onScroll);
    _downloadAndLoadPdf();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _horizontalScrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_totalPages <= 1 || !_scrollController.hasClients) return;
    final maxScroll = _scrollController.position.maxScrollExtent;
    if (maxScroll <= 0) return;

    final offset = _scrollController.offset.clamp(0.0, maxScroll);
    final ratio = offset / maxScroll;
    final page = (ratio * (_totalPages - 1)).round() + 1;
    if (page != _currentPage && page >= 1 && page <= _totalPages) {
      setState(() {
        _currentPage = page;
      });
    }
  }

  Future<void> _downloadAndLoadPdf() async {
    final cleanPath = widget.pdfUrl.startsWith('/')
        ? widget.pdfUrl.substring(1)
        : widget.pdfUrl;

    // 1. In-App Protected Offline Storage (1ms, zero internet needed)
    final offlineBytes = await NotesOfflineService.getOfflineBytes(cleanPath);
    if (offlineBytes != null && offlineBytes.isNotEmpty) {
      if (mounted) {
        setState(() {
          _pdfBytes = offlineBytes;
          _isLoading = false;
        });
      }
      return;
    }

    final cacheKey = cleanPath.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '_');

    // 2. Instant Memory Cache (<1ms)
    if (NotesPdfViewerPage._memoryCache.containsKey(cacheKey)) {
      final cachedBytes = NotesPdfViewerPage._memoryCache[cacheKey]!;
      if (mounted) {
        setState(() {
          _pdfBytes = cachedBytes;
          _isLoading = false;
        });
      }
      return;
    }

    // 3. Fast Local Disk Cache (~5ms)
    try {
      final cacheDir = await getTemporaryDirectory();
      final cacheFile = File('${cacheDir.path}/note_$cacheKey.pdf');
      if (await cacheFile.exists()) {
        final bytes = await cacheFile.readAsBytes();
        if (bytes.isNotEmpty) {
          NotesPdfViewerPage._memoryCache[cacheKey] = bytes;
          if (mounted) {
            setState(() {
              _pdfBytes = bytes;
              _isLoading = false;
            });
          }
          return;
        }
      }
    } catch (_) {}

    // 4. Network Fetch from R2
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final targetUrl = NotesPdfViewerPage.resolveR2Url(widget.pdfUrl);
    Uint8List? bytes = await _tryFetch(targetUrl);

    // Fallback to r2.dev domain
    if (bytes == null && targetUrl.contains('notes.obhyash.com')) {
      final fallbackUrl = targetUrl.replaceFirst(
        'notes.obhyash.com',
        'pub-49e78b9c501b4794a748d3b91ec15ef8.r2.dev',
      );
      bytes = await _tryFetch(fallbackUrl);
    }

    if (!mounted) return;

    if (bytes != null && bytes.isNotEmpty) {
      NotesPdfViewerPage._memoryCache[cacheKey] = bytes;

      getTemporaryDirectory().then((dir) {
        final file = File('${dir.path}/note_$cacheKey.pdf');
        file.writeAsBytes(bytes!, flush: true);
      }).catchError((_) {});

      setState(() {
        _pdfBytes = bytes;
        _isLoading = false;
      });
    } else {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'এই নোটটি এখনও যুক্ত করা হয়নি';
        });
      }
    }
  }

  Future<Uint8List?> _tryFetch(String url) async {
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {'Accept-Encoding': 'gzip, deflate, br'},
      ).timeout(const Duration(seconds: 25));
      if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
        return response.bodyBytes;
      }
    } catch (_) {}
    return null;
  }

  void _zoomIn() {
    HapticFeedback.selectionClick();
    setState(() {
      _zoomLevel = (_zoomLevel + 0.35).clamp(1.0, 3.0);
    });
  }

  void _zoomOut() {
    HapticFeedback.selectionClick();
    setState(() {
      _zoomLevel = (_zoomLevel - 0.35).clamp(1.0, 3.0);
    });
  }

  void _zoomReset() {
    HapticFeedback.selectionClick();
    setState(() {
      _zoomLevel = 1.0;
    });
  }

  void _handleDoubleTap() {
    HapticFeedback.selectionClick();
    setState(() {
      _zoomLevel = _zoomLevel > 1.15 ? 1.0 : 1.65;
    });
  }

  String _toBanglaNumber(int n) {
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return n.toString().split('').map((char) {
      final digit = int.tryParse(char);
      return digit != null ? bn[digit] : char;
    }).join('');
  }

  Future<void> _toggleOfflineSave(bool isSaved) async {
    if (_isSavingOffline) return;
    HapticFeedback.lightImpact();

    if (isSaved) {
      final shouldDelete = await showDialog<bool>(
        context: context,
        builder: (ctx) {
          final isDark = Theme.of(ctx).brightness == Brightness.dark;
          return AlertDialog(
            backgroundColor:
                isDark ? const Color(0xFF18181B) : Colors.white,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
            title: Text(
              'অফলাইন নোট',
              style: TextStyle(
                fontSize: 16.5,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : const Color(0xFF18181B),
              ),
            ),
            content: Text(
              'এই নোটটি তোমার অ্যাপে অফলাইনে সংরক্ষিত আছে। তুমি কি এটি মুছে ফেলতে চাও?',
              style: TextStyle(
                fontSize: 13.5,
                color: isDark
                    ? const Color(0xFFA1A1AA)
                    : const Color(0xFF52525B),
                height: 1.4,
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('থাকুক'),
              ),
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                child: const Text('মুছুন',
                    style: TextStyle(color: Colors.redAccent)),
              ),
            ],
          );
        },
      );

      if (shouldDelete == true) {
        await NotesOfflineService.removeOffline(widget.pdfUrl);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('অফলাইন সংরক্ষণ থেকে মুছে ফেলা হয়েছে'),
              duration: Duration(seconds: 3),
            ),
          );
        }
      }
      return;
    }

    setState(() => _isSavingOffline = true);
    final success = await NotesOfflineService.saveOffline(
      r2Path: widget.pdfUrl,
      existingBytes: _pdfBytes,
    );
    if (mounted) {
      setState(() => _isSavingOffline = false);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF059669),
            content: Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Text('নোটটি অফলাইনে সফলভাবে সেভ হয়েছে!'),
              ],
            ),
            duration: Duration(seconds: 3),
          ),
        );
      }
    }
  }

  void _sharePdf() {
    final directUrl = NotesPdfViewerPage.resolveR2Url(widget.pdfUrl);
    SharePlus.instance.share(
      ShareParams(
        text: '${widget.title}\n$directUrl',
        subject: widget.title,
      ),
    );
  }

  /// Compact, Centered, Apple-Grade Floating Toolbar
  Widget _buildToolsHeader({required bool isDark}) {
    final borderColor = isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7);
    final dividerColor = isDark ? const Color(0xFF3F3F46) : const Color(0xFFE4E4E7);
    final iconColor = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF52525B);
    final textPrimary = isDark ? Colors.white : const Color(0xFF18181B);

    return Center(
      child: Container(
        margin: const EdgeInsets.only(top: 8, bottom: 8),
        decoration: BoxDecoration(
          color: isDark
              ? const Color(0xFF18181B).withValues(alpha: 0.92)
              : Colors.white.withValues(alpha: 0.94),
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: borderColor, width: 0.9),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.08),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(26),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              child: Row(
                mainAxisSize: MainAxisSize.min, // Clamps tightly around content!
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // 1. Page Indicator
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          LucideIcons.fileText,
                          size: 13,
                          color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          '${_toBanglaNumber(_currentPage)} / ${_toBanglaNumber(_totalPages)}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: textPrimary,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Vertical Divider
                  Container(
                    width: 1,
                    height: 16,
                    color: dividerColor,
                    margin: const EdgeInsets.symmetric(horizontal: 8),
                  ),

                  // 2. Zoom Controls: [ — ]  [ ফিট / ১০০% ]  [ + ]
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Zoom Out
                      _ToolbarIconButton(
                        icon: LucideIcons.minus,
                        size: 13,
                        enabled: _zoomLevel > 1.05,
                        color: iconColor,
                        onTap: _zoomOut,
                      ),
                      const SizedBox(width: 2),
                      // Fit / Percentage Badge
                      GestureDetector(
                        onTap: _zoomReset,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: (_zoomLevel - 1.0).abs() < 0.08
                                ? const Color(0xFF059669).withValues(alpha: 0.14)
                                : (isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5)),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            (_zoomLevel - 1.0).abs() < 0.08
                                ? 'ফিট'
                                : '${(_zoomLevel * 100).toInt()}%',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: (_zoomLevel - 1.0).abs() < 0.08
                                  ? const Color(0xFF10B981)
                                  : iconColor,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 2),
                      // Zoom In
                      _ToolbarIconButton(
                        icon: LucideIcons.plus,
                        size: 13,
                        enabled: _zoomLevel < 2.9,
                        color: iconColor,
                        onTap: _zoomIn,
                      ),
                    ],
                  ),

                  // Vertical Divider
                  Container(
                    width: 1,
                    height: 16,
                    color: dividerColor,
                    margin: const EdgeInsets.symmetric(horizontal: 8),
                  ),

                  // 3. Offline Save Toggle
                  ValueListenableBuilder<Set<String>>(
                    valueListenable: NotesOfflineService.offlineSavedPathsNotifier,
                    builder: (context, savedSet, _) {
                      final isSaved = NotesOfflineService.isSaved(widget.pdfUrl);

                      return _ToolbarIconButton(
                        icon: isSaved ? LucideIcons.check : LucideIcons.download,
                        size: 14,
                        enabled: true,
                        isLoading: _isSavingOffline,
                        activeColor: isSaved ? const Color(0xFF10B981) : iconColor,
                        activeBgColor: isSaved
                            ? const Color(0xFF059669).withValues(alpha: 0.14)
                            : Colors.transparent,
                        tooltip: isSaved ? 'অফলাইনে সংরক্ষিত' : 'অফলাইনে সেভ করুন',
                        onTap: () => _toggleOfflineSave(isSaved),
                      );
                    },
                  ),

                  // Vertical Divider
                  Container(
                    width: 1,
                    height: 16,
                    color: dividerColor,
                    margin: const EdgeInsets.symmetric(horizontal: 8),
                  ),

                  // 4. Fullscreen Toggle
                  _ToolbarIconButton(
                    icon: _isFullscreen ? LucideIcons.minimize2 : LucideIcons.maximize2,
                    size: 14,
                    enabled: true,
                    color: iconColor,
                    tooltip: _isFullscreen ? 'স্বাভাবিক মোড' : 'ফুলস্ক্রিন মোড',
                    onTap: () {
                      HapticFeedback.lightImpact();
                      setState(() => _isFullscreen = !_isFullscreen);
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor:
          isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAF9),
      appBar: _isFullscreen
          ? null
          : AppBar(
              backgroundColor:
                  isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAF9),
              elevation: 0,
              scrolledUnderElevation: 0,
              centerTitle: true,
              leading: IconButton(
                icon: Icon(
                  Icons.arrow_back_ios_new_rounded,
                  size: 20,
                  color: isDark ? Colors.white : const Color(0xFF18181B),
                ),
                onPressed: () => Navigator.of(context).pop(),
              ),
              title: Text(
                widget.title,
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : const Color(0xFF18181B),
                ),
              ),
              actions: [
                IconButton(
                  icon: Icon(
                    Icons.share_rounded,
                    size: 20,
                    color: isDark ? Colors.white : const Color(0xFF18181B),
                  ),
                  onPressed: _sharePdf,
                ),
              ],
            ),
      body: SafeArea(
        top: !_isFullscreen,
        bottom: !_isFullscreen,
        child: Stack(
          children: [
            if (_isLoading)
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(
                      width: 36,
                      height: 36,
                      child: CircularProgressIndicator(
                        strokeWidth: 3,
                        color: Color(0xFF059669),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'নোট লোড হচ্ছে...',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isDark
                            ? const Color(0xFFA1A1AA)
                            : const Color(0xFF71717A),
                      ),
                    ),
                  ],
                ),
              )
            else if (_errorMessage != null)
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF27272A)
                              : const Color(0xFFF4F4F5),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.hourglass_empty_rounded,
                          size: 30,
                          color: isDark
                              ? const Color(0xFFA1A1AA)
                              : const Color(0xFF71717A),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        'শীঘ্রই আসছে',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color:
                              isDark ? Colors.white : const Color(0xFF18181B),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'এই নোটটি এখনও যুক্ত করা হয়নি। খুব শীঘ্রই যুক্ত করা হবে।',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 13.5,
                          color: isDark
                              ? const Color(0xFFA1A1AA)
                              : const Color(0xFF71717A),
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 22),
                      ElevatedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 28,
                            vertical: 11,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'ফিরে যান',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else if (_pdfBytes != null)
              Column(
                children: [
                  // Compact Floating Tools Header
                  if (!_isFullscreen) _buildToolsHeader(isDark: isDark),

                  // Edge-to-Edge Fluid Interactive PDF Viewer using PdfPreview.builder
                  Expanded(
                    child: PdfPreview.builder(
                      build: (format) => _pdfBytes!,
                      useActions: false,
                      canChangeOrientation: false,
                      canChangePageFormat: false,
                      canDebug: false,
                      allowPrinting: false,
                      allowSharing: false,
                      dynamicLayout: false,
                      pdfFileName: '${widget.title}.pdf',
                      scrollViewDecoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF09090B)
                            : const Color(0xFFF4F4F5),
                      ),
                      loadingWidget: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const SizedBox(
                              width: 32,
                              height: 32,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.8,
                                color: Color(0xFF059669),
                              ),
                            ),
                            const SizedBox(height: 14),
                            Text(
                              'নোট রেন্ডার হচ্ছে...',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: isDark
                                    ? const Color(0xFFA1A1AA)
                                    : const Color(0xFF71717A),
                              ),
                            ),
                          ],
                        ),
                      ),
                      pagesBuilder: (context, pages) {
                        if (_totalPages != pages.length) {
                          WidgetsBinding.instance.addPostFrameCallback((_) {
                            if (mounted) {
                              setState(() {
                                _totalPages = pages.length;
                              });
                            }
                          });
                        }

                        return LayoutBuilder(
                          builder: (context, constraints) {
                            final screenWidth = constraints.maxWidth;
                            final contentWidth = screenWidth * _zoomLevel;

                            return GestureDetector(
                              onDoubleTap: _handleDoubleTap,
                              onScaleStart: (details) {
                                _baseZoomLevel = _zoomLevel;
                              },
                              onScaleUpdate: (details) {
                                if (details.pointerCount >= 2) {
                                  final newScale = (_baseZoomLevel * details.scale)
                                      .clamp(1.0, 3.0);
                                  if ((newScale - _zoomLevel).abs() > 0.02) {
                                    setState(() {
                                      _zoomLevel = newScale;
                                    });
                                  }
                                }
                              },
                              child: SingleChildScrollView(
                                controller: _horizontalScrollController,
                                scrollDirection: Axis.horizontal,
                                physics: _zoomLevel > 1.05
                                    ? const BouncingScrollPhysics()
                                    : const NeverScrollableScrollPhysics(),
                                child: SizedBox(
                                  width: contentWidth,
                                  child: ListView.separated(
                                    controller: _scrollController,
                                    physics: const AlwaysScrollableScrollPhysics(
                                      parent: BouncingScrollPhysics(),
                                    ),
                                    padding: EdgeInsets.symmetric(
                                      horizontal: _zoomLevel > 1.05 ? 12 : 4,
                                      vertical: 6,
                                    ),
                                    itemCount: pages.length,
                                    separatorBuilder: (context, index) =>
                                        const SizedBox(height: 10),
                                    itemBuilder: (context, index) {
                                      return Container(
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius:
                                              BorderRadius.circular(4),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withValues(
                                                alpha: isDark ? 0.45 : 0.08,
                                              ),
                                              blurRadius: 8,
                                              offset: const Offset(0, 2),
                                            ),
                                          ],
                                        ),
                                        child: ClipRRect(
                                          borderRadius:
                                              BorderRadius.circular(4),
                                          child: Image(
                                            image: pages[index].image,
                                            fit: BoxFit.fitWidth,
                                            width: contentWidth,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),

            // Floating Exit Fullscreen Button
            if (_isFullscreen)
              Positioned(
                top: 14,
                right: 14,
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      setState(() => _isFullscreen = false);
                    },
                    borderRadius: BorderRadius.circular(24),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 7),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.78),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.25),
                          width: 0.8,
                        ),
                        boxShadow: const [
                          BoxShadow(
                            color: Colors.black45,
                            blurRadius: 8,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            LucideIcons.minimize2,
                            size: 14,
                            color: Colors.white,
                          ),
                          SizedBox(width: 6),
                          Text(
                            'ফুলস্ক্রিন বন্ধ',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ],
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

class _ToolbarIconButton extends StatelessWidget {
  final IconData icon;
  final double size;
  final bool enabled;
  final bool isLoading;
  final Color? color;
  final Color? activeColor;
  final Color? activeBgColor;
  final String? tooltip;
  final VoidCallback? onTap;

  const _ToolbarIconButton({
    required this.icon,
    this.size = 14,
    this.enabled = true,
    this.isLoading = false,
    this.color,
    this.activeColor,
    this.activeBgColor,
    this.tooltip,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = enabled
        ? (activeColor ?? color ?? Theme.of(context).iconTheme.color)
        : (Theme.of(context).brightness == Brightness.dark
            ? const Color(0xFF3F3F46)
            : const Color(0xFFD4D4D8));

    Widget child = InkWell(
      onTap: enabled && !isLoading ? onTap : null,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: activeBgColor ?? Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: isLoading
            ? SizedBox(
                width: size,
                height: size,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: activeColor ?? const Color(0xFF059669),
                ),
              )
            : Icon(
                icon,
                size: size,
                color: effectiveColor,
              ),
      ),
    );

    if (tooltip != null) {
      child = Tooltip(
        message: tooltip!,
        waitDuration: const Duration(milliseconds: 400),
        child: child,
      );
    }

    return child;
  }
}
