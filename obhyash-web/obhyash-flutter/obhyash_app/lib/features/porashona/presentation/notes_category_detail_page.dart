import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../../core/presentation/widgets/app_refresh_indicator.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import '../../../features/formulas/models/formula_models.dart';
import '../services/notes_r2_service.dart';
import '../services/notes_offline_service.dart';
import 'notes_pdf_viewer_page.dart';

class NotesCategoryDetailPage extends ConsumerStatefulWidget {
  final String categoryTitle;

  const NotesCategoryDetailPage({
    super.key,
    required this.categoryTitle,
  });

  @override
  ConsumerState<NotesCategoryDetailPage> createState() =>
      _NotesCategoryDetailPageState();
}

class _NotesCategoryDetailPageState
    extends ConsumerState<NotesCategoryDetailPage> {
  SubjectMeta? _selectedSubject;
  FormulaSubject? _loadedSubjectData;
  bool _isLoadingChapters = false;
  bool _isSyncingManifest = false;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _initData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _initData() async {
    await NotesOfflineService.init();
    await NotesR2Service.loadFromLocalCache();
    if (mounted) {
      _evaluateAndSelectSubject();
    }
    await _fetchManifest(silent: true);
  }

  Future<void> _fetchManifest({bool forceRefresh = false, bool silent = false}) async {
    if (!silent && mounted) {
      setState(() => _isSyncingManifest = true);
    }
    try {
      await NotesR2Service.fetchAvailablePdfs(forceRefresh: forceRefresh);
    } finally {
      if (mounted) {
        setState(() => _isSyncingManifest = false);
        _evaluateAndSelectSubject();
      }
    }
  }

  void _evaluateAndSelectSubject() {
    final userProfile = ref.read(userProfileProvider).value;
    final allSubjects = getPersonalizedFormulaSubjects(
      level: userProfile?.level,
      stream: userProfile?.stream,
      batch: userProfile?.batch,
      division: userProfile?.division,
      target: userProfile?.target,
      examTarget: userProfile?.examTarget,
      optionalSubject: userProfile?.optionalSubject,
    );

    // Filter subjects: ONLY keep subjects that have at least 1 PDF in this category
    final availableSubjects = allSubjects.where((s) {
      return NotesR2Service.hasPdfsForSubject(widget.categoryTitle, s.subjectId);
    }).toList();

    if (availableSubjects.isEmpty) {
      setState(() {
        _selectedSubject = null;
        _loadedSubjectData = null;
      });
      return;
    }

    if (_selectedSubject == null ||
        !availableSubjects.any((s) => s.subjectId == _selectedSubject!.subjectId)) {
      _selectSubject(availableSubjects.first);
    } else {
      _selectSubject(_selectedSubject!);
    }
  }

  Future<void> _selectSubject(SubjectMeta subject) async {
    setState(() {
      _selectedSubject = subject;
      _isLoadingChapters = true;
      _loadedSubjectData = null;
    });

    try {
      final jsonStr = await rootBundle.loadString(subject.assetPath);
      final json = jsonDecode(jsonStr) as Map<String, dynamic>;
      if (mounted) {
        final subjectData = FormulaSubject.fromJson(json);
        setState(() {
          _loadedSubjectData = subjectData;
          _isLoadingChapters = false;
        });

        final availableChapters = subjectData.chapters.where((ch) {
          final r2Path = NotesR2Service.buildPdfPath(
            categoryTitle: widget.categoryTitle,
            subjectId: subject.subjectId,
            chapterId: ch.chapterId,
          );
          return NotesR2Service.isPdfAvailable(r2Path);
        }).toList();

        for (final ch in availableChapters.take(2)) {
          final r2Path = NotesR2Service.buildPdfPath(
            categoryTitle: widget.categoryTitle,
            subjectId: subject.subjectId,
            chapterId: ch.chapterId,
          );
          NotesPdfViewerPage.prefetchPdf(r2Path);
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoadingChapters = false;
        });
      }
    }
  }

  void _openPdfViewer({required String title, required String pdfPath}) {
    context.push(
      '/pdf-viewer',
      extra: {
        'title': title,
        'pdfUrl': pdfPath,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final userProfile = ref.watch(userProfileProvider).value;
    final allSubjects = getPersonalizedFormulaSubjects(
      level: userProfile?.level,
      stream: userProfile?.stream,
      batch: userProfile?.batch,
      division: userProfile?.division,
      target: userProfile?.target,
      examTarget: userProfile?.examTarget,
      optionalSubject: userProfile?.optionalSubject,
    );

    // ONLY show subjects that have PDFs in this category!
    final availableSubjects = allSubjects.where((s) {
      return NotesR2Service.hasPdfsForSubject(widget.categoryTitle, s.subjectId);
    }).toList();

    // Filter chapters: ONLY show chapters whose PDF exists in R2 manifest
    final allChapters = _loadedSubjectData?.chapters ?? [];
    final chaptersWithPdf = allChapters.where((ch) {
      if (_selectedSubject == null) return false;
      final r2Path = NotesR2Service.buildPdfPath(
        categoryTitle: widget.categoryTitle,
        subjectId: _selectedSubject!.subjectId,
        chapterId: ch.chapterId,
      );
      return NotesR2Service.isPdfAvailable(r2Path);
    }).toList();

    // Apply search query to chapters that have PDFs
    final filteredChapters = chaptersWithPdf.where((ch) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return ch.chapterName.toLowerCase().contains(q) ||
          ch.chapterNumber.toString().contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFFAFAF9),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFFAFAF9),
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
          widget.categoryTitle,
          style: TextStyle(
            fontSize: 17.5,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : const Color(0xFF18181B),
          ),
        ),
        actions: [
          IconButton(
            icon: _isSyncingManifest
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Color(0xFF059669),
                    ),
                  )
                : Icon(
                    LucideIcons.rotateCw,
                    size: 18,
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                  ),
            tooltip: 'রিফ্রেশ',
            onPressed: _isSyncingManifest
                ? null
                : () => _fetchManifest(forceRefresh: true),
          ),
        ],
      ),
      body: SafeArea(
        child: AppRefreshIndicator(
          onRefresh: () async {
            await _fetchManifest(forceRefresh: true, silent: true);
          },
          child: availableSubjects.isEmpty
              ? LayoutBuilder(
                  builder: (context, constraints) {
                    return SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          minHeight: constraints.maxHeight,
                        ),
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 32),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 72,
                                  height: 72,
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? const Color(0xFF18181B)
                                        : const Color(0xFFF4F4F5),
                                    shape: BoxShape.circle,
                                  ),
                                  alignment: Alignment.center,
                                  child: Icon(
                                    LucideIcons.bookOpen,
                                    size: 34,
                                    color: isDark
                                        ? const Color(0xFF71717A)
                                        : const Color(0xFFA1A1AA),
                                  ),
                                ),
                                const SizedBox(height: 18),
                                Text(
                                  'কোনো নোট পাওয়া যায়নি',
                                  style: TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w700,
                                    color: isDark
                                        ? Colors.white
                                        : const Color(0xFF18181B),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'বর্তমানে এই ক্যাটাগরিতে কোনো পিডিএফ নোট যুক্ত করা হয়নি। নতুন পিডিএফ আপলোড হলে তা স্বয়ংক্রিয়ভাবে এখানে চলে আসবে।',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 13,
                                    height: 1.4,
                                    color: isDark
                                        ? const Color(0xFFA1A1AA)
                                        : const Color(0xFF71717A),
                                  ),
                                ),
                                const SizedBox(height: 20),
                                OutlinedButton.icon(
                                  onPressed: () =>
                                      _fetchManifest(forceRefresh: true),
                                  icon: const Icon(LucideIcons.rotateCw, size: 15),
                                  label: const Text('পুনরায় পরীক্ষা করুন'),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: const Color(0xFF059669),
                                    side: const BorderSide(
                                      color: Color(0xFF059669),
                                      width: 1.2,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 18,
                                      vertical: 10,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 12),

                    // Search Bar
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Container(
                        height: 42,
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF18181B)
                              : const Color(0xFFF4F4F5),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark
                                ? const Color(0xFF27272A)
                                : const Color(0xFFE4E4E7),
                            width: 0.8,
                          ),
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) {
                            setState(() {
                              _searchQuery = val.trim();
                            });
                          },
                          style: TextStyle(
                            fontSize: 13.5,
                            color:
                                isDark ? Colors.white : const Color(0xFF18181B),
                          ),
                          decoration: InputDecoration(
                            hintText: 'অধ্যায় খুঁজুন...',
                            hintStyle: TextStyle(
                              fontSize: 13,
                              color: isDark
                                  ? const Color(0xFF71717A)
                                  : const Color(0xFFA1A1AA),
                            ),
                            prefixIcon: Icon(
                              LucideIcons.search,
                              size: 16,
                              color: isDark
                                  ? const Color(0xFF71717A)
                                  : const Color(0xFFA1A1AA),
                            ),
                            suffixIcon: _searchQuery.isNotEmpty
                                ? GestureDetector(
                                    onTap: () {
                                      _searchController.clear();
                                      setState(() {
                                        _searchQuery = '';
                                      });
                                    },
                                    child: Icon(
                                      Icons.close_rounded,
                                      size: 16,
                                      color: isDark
                                          ? const Color(0xFF71717A)
                                          : const Color(0xFFA1A1AA),
                                    ),
                                  )
                                : null,
                            border: InputBorder.none,
                            contentPadding:
                                const EdgeInsets.symmetric(vertical: 10),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Chapters List
                    Expanded(
                      child: _isLoadingChapters
                          ? const Center(
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Color(0xFF059669),
                              ),
                            )
                          : filteredChapters.isEmpty
                              ? Center(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        LucideIcons.bookOpen,
                                        size: 40,
                                        color: isDark
                                            ? const Color(0xFF3F3F46)
                                            : const Color(0xFFD4D4D8),
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        _searchQuery.isEmpty
                                            ? 'এই বিষয়ের কোনো নোট এখনো আপলোড হয়নি'
                                            : 'কোনো অধ্যায় পাওয়া যায়নি',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                          color: isDark
                                              ? const Color(0xFFA1A1AA)
                                              : const Color(0xFF71717A),
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : ListView.separated(
                                  physics: const AlwaysScrollableScrollPhysics(
                                    parent: BouncingScrollPhysics(),
                                  ),
                                  padding:
                                      const EdgeInsets.fromLTRB(16, 4, 16, 24),
                                  itemCount: filteredChapters.length,
                                  separatorBuilder: (context, index) =>
                                      const SizedBox(height: 10),
                                  itemBuilder: (context, index) {
                                    final ch = filteredChapters[index];
                                    final subjectId =
                                        _selectedSubject?.subjectId ?? 'subject';
                                    final r2Path = NotesR2Service.buildPdfPath(
                                      categoryTitle: widget.categoryTitle,
                                      subjectId: subjectId,
                                      chapterId: ch.chapterId,
                                    );

                                    return _ChapterNoteCard(
                                      chapterNumber: ch.chapterNumber,
                                      chapterName: ch.chapterName,
                                      categoryTitle: widget.categoryTitle,
                                      subjectName:
                                          _selectedSubject?.subjectName ?? '',
                                      r2Path: r2Path,
                                      isDark: isDark,
                                      onTap: () {
                                        _openPdfViewer(
                                          title:
                                              '${widget.categoryTitle} - ${ch.chapterName}',
                                          pdfPath: r2Path,
                                        );
                                      },
                                    );
                                  },
                                ),
                    ),
                  ],
                ),
        ),
      ),
      bottomNavigationBar: availableSubjects.isEmpty
          ? null
          : Container(
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF111113) : Colors.white,
                border: Border(
                  top: BorderSide(
                    color: isDark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFE4E4E7),
                    width: 0.8,
                  ),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -3),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: SizedBox(
                    height: 42,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      itemCount: availableSubjects.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final s = availableSubjects[index];
                        final isSelected =
                            _selectedSubject?.subjectId == s.subjectId;
                        final count = NotesR2Service.getPdfCountForSubject(
                          widget.categoryTitle,
                          s.subjectId,
                        );

                        return GestureDetector(
                          onTap: () => _selectSubject(s),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? const Color(0xFF059669)
                                  : (isDark
                                      ? const Color(0xFF1F1F23)
                                      : const Color(0xFFF4F4F5)),
                              borderRadius: BorderRadius.circular(22),
                              border: Border.all(
                                color: isSelected
                                    ? const Color(0xFF10B981)
                                    : (isDark
                                        ? const Color(0xFF2E2E33)
                                        : const Color(0xFFE4E4E7)),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(s.emoji,
                                    style: const TextStyle(fontSize: 13.5)),
                                const SizedBox(width: 6),
                                Text(
                                  s.subjectName,
                                  style: TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: isSelected
                                        ? FontWeight.w700
                                        : FontWeight.w500,
                                    color: isSelected
                                        ? Colors.white
                                        : (isDark
                                            ? const Color(0xFFA1A1AA)
                                            : const Color(0xFF52525B)),
                                  ),
                                ),
                                if (count > 0) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 1.5,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? Colors.white.withValues(alpha: 0.25)
                                          : (isDark
                                              ? const Color(0xFF27272A)
                                              : const Color(0xFFE4E4E7)),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      '$count',
                                      style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w700,
                                        color: isSelected
                                            ? Colors.white
                                            : (isDark
                                                ? const Color(0xFFA1A1AA)
                                                : const Color(0xFF71717A)),
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),
            ),
    );
  }
}

class _ChapterNoteCard extends StatelessWidget {
  final int chapterNumber;
  final String chapterName;
  final String categoryTitle;
  final String subjectName;
  final String r2Path;
  final bool isDark;
  final VoidCallback onTap;

  const _ChapterNoteCard({
    required this.chapterNumber,
    required this.chapterName,
    required this.categoryTitle,
    required this.subjectName,
    required this.r2Path,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141416) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
          width: 0.8,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                // Chapter Number Badge
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFF4F4F5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    '$chapterNumber',
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : const Color(0xFF18181B),
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Chapter Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        chapterName,
                        style: TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white : const Color(0xFF18181B),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEF4444).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'PDF',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFFEF4444),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            subjectName,
                            style: TextStyle(
                              fontSize: 11.5,
                              color: isDark
                                  ? const Color(0xFFA1A1AA)
                                  : const Color(0xFF71717A),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 8),

                // In-App Offline Save Button (Leak-proof)
                _OfflineSaveButton(
                  r2Path: r2Path,
                  title: '$categoryTitle - $chapterName',
                  isDark: isDark,
                ),

                const SizedBox(width: 8),

                // Read Button
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        LucideIcons.fileText,
                        size: 14,
                        color: Colors.white,
                      ),
                      SizedBox(width: 5),
                      Text(
                        'পড়ুন',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OfflineSaveButton extends StatefulWidget {
  final String r2Path;
  final String title;
  final bool isDark;

  const _OfflineSaveButton({
    required this.r2Path,
    required this.title,
    required this.isDark,
  });

  @override
  State<_OfflineSaveButton> createState() => _OfflineSaveButtonState();
}

class _OfflineSaveButtonState extends State<_OfflineSaveButton> {
  bool _isDownloading = false;

  Future<void> _handleTap(bool isSaved) async {
    if (_isDownloading) return;

    if (isSaved) {
      final shouldDelete = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: widget.isDark ? const Color(0xFF18181B) : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(
            'অফলাইন নোট',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: widget.isDark ? Colors.white : const Color(0xFF18181B),
            ),
          ),
          content: Text(
            'এই নোটটি তোমার অ্যাপে অফলাইনে সংরক্ষিত আছে। তুমি কি এটি মুছে ফেলতে চাও?',
            style: TextStyle(
              fontSize: 13.5,
              color: widget.isDark ? const Color(0xFFA1A1AA) : const Color(0xFF52525B),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('থাকুক'),
            ),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('মুছুন', style: TextStyle(color: Colors.redAccent)),
            ),
          ],
        ),
      );

      if (shouldDelete == true) {
        await NotesOfflineService.removeOffline(widget.r2Path);
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

    setState(() => _isDownloading = true);
    final success = await NotesOfflineService.saveOffline(
      r2Path: widget.r2Path,
    );
    if (mounted) {
      setState(() => _isDownloading = false);
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

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<Set<String>>(
      valueListenable: NotesOfflineService.offlineSavedPathsNotifier,
      builder: (context, savedSet, _) {
        final isSaved = NotesOfflineService.isSaved(widget.r2Path);

        if (_isDownloading) {
          return const SizedBox(
            width: 32,
            height: 32,
            child: Center(
              child: SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Color(0xFF059669),
                ),
              ),
            ),
          );
        }

        return Tooltip(
          message: isSaved ? 'অফলাইনে সংরক্ষিত' : 'অফলাইনে সেভ করুন',
          child: InkWell(
            onTap: () => _handleTap(isSaved),
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: isSaved
                    ? const Color(0xFF059669).withValues(alpha: 0.12)
                    : (widget.isDark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFF4F4F5)),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                isSaved ? Icons.check_circle_rounded : LucideIcons.download,
                size: 16,
                color: isSaved
                    ? const Color(0xFF059669)
                    : (widget.isDark
                        ? const Color(0xFFA1A1AA)
                        : const Color(0xFF71717A)),
              ),
            ),
          ),
        );
      },
    );
  }
}
