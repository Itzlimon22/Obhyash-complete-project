import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';

import '../../exam/domain/exam_models.dart';
import '../../exam/presentation/widgets/question_card.dart';


class BookmarksView extends StatefulWidget {
  const BookmarksView({super.key});

  @override
  State<BookmarksView> createState() => _BookmarksViewState();
}

class _BookmarkItem {
  final Question question;
  final DateTime createdAt;
  _BookmarkItem(this.question, this.createdAt);
}

class _BookmarksViewState extends State<BookmarksView> {
  bool _isLoading = true;
  bool _hasError = false;
  List<_BookmarkItem> _bookmarks = [];
  
  String _filterSubject = '';
  String _filterChapter = '';
  DateTime? _filterDate;
  int _displayCount = 15;

  @override
  void initState() {
    super.initState();
    _fetchBookmarks();
  }

  Future<void> _fetchBookmarks() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _hasError = false;
    });

    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) {
        setState(() => _isLoading = false);
        return;
      }

      final bData = await sb
          .from('bookmarks')
          .select('question_id, created_at')
          .eq('user_id', uid)
          .order('created_at', ascending: false);

      if ((bData as List).isEmpty) {
        if (mounted) {
          setState(() {
            _bookmarks = [];
            _isLoading = false;
          });
        }
        return;
      }

      final qIds = bData.map((e) => e['question_id'].toString()).toList();
      final dateMap = <String, DateTime>{};
      for (final e in bData) {
        dateMap[e['question_id'].toString()] = DateTime.tryParse(e['created_at'] ?? '') ?? DateTime.now();
      }

      final qData = await sb.from('questions').select().inFilter('id', qIds);

      final questionMap = <String, Question>{};
      for (final q in (qData as List)) {
        final parsed = Question.fromJson(q as Map<String, dynamic>);
        questionMap[parsed.id] = parsed;
      }

      final orderedBookmarks = <_BookmarkItem>[];
      for (final id in qIds) {
        if (questionMap.containsKey(id)) {
          orderedBookmarks.add(_BookmarkItem(questionMap[id]!, dateMap[id]!));
        }
      }

      if (mounted) {
        setState(() {
          _bookmarks = orderedBookmarks;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('[BookmarksView] _fetchBookmarks error: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = true;
        });
      }
    }
  }

  Future<void> _removeBookmark(String questionId) async {
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) return;

      await sb
          .from('bookmarks')
          .delete()
          .eq('user_id', uid)
          .eq('question_id', questionId);

      setState(() {
        _bookmarks.removeWhere((b) => b.question.id == questionId);
      });
    } catch (e) {
      debugPrint('[BookmarksView] _removeBookmark error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('বুকমার্ক রিমুভ করতে সমস্যা হয়েছে!')),
        );
      }
    }
  }

  List<_BookmarkItem> get _filtered {
    return _bookmarks.where((b) {
      if (_filterSubject.isNotEmpty && b.question.subject != _filterSubject) {
        return false;
      }
      if (_filterChapter.isNotEmpty && b.question.chapter != _filterChapter) {
        return false;
      }
      if (_filterDate != null) {
        final d = b.createdAt;
        if (d.year != _filterDate!.year ||
            d.month != _filterDate!.month ||
            d.day != _filterDate!.day) {
          return false;
        }
      }
      return true;
    }).toList();
  }

  void _resetPagination() {
    setState(() {
      _displayCount = 15;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // We remove Scaffold so that MainLayout handles the app bar and bottom nav!
    return Column(
      children: [
        _buildFilters(isDark),
        Expanded(child: _buildBody(isDark)),
      ],
    );
  }

  Widget _buildFilters(bool isDark) {
    // Unique subjects for dropdown
    final subjects = _bookmarks
        .map((b) => b.question.subject)
        .where((s) => s.isNotEmpty)
        .toSet()
        .toList();

    // Unique chapters for dropdown (filtered by selected subject if any)
    final chapters = _bookmarks
        .where((b) => _filterSubject.isEmpty || b.question.subject == _filterSubject)
        .map((b) => b.question.chapter)
        .where((c) => c.isNotEmpty)
        .toSet()
        .toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          // Subject Dropdown
          Expanded(
            child: Container(
              height: 42,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1C1C1C) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
                ),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _filterSubject.isEmpty ? null : _filterSubject,
                  hint: Text(
                    'বিষয়',
                    style: TextStyle(
                      fontSize: 15,
                      color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFFA3A3A3),
                    ),
                  ),
                  isExpanded: true,
                  icon: Icon(
                    LucideIcons.chevronDown,
                    size: 16,
                    color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFFA3A3A3),
                  ),
                  dropdownColor: isDark ? const Color(0xFF1C1C1C) : Colors.white,
                  items: [
                    const DropdownMenuItem<String>(
                      value: '',
                      child: Text('সব বিষয়', style: TextStyle(fontSize: 15)),
                    ),
                    ...subjects.map(
                      (s) => DropdownMenuItem<String>(
                        value: s,
                        child: Text(s.toUpperCase(), style: const TextStyle(fontSize: 15), overflow: TextOverflow.ellipsis),
                      ),
                    ),
                  ],
                  onChanged: (v) {
                    setState(() {
                      _filterSubject = v ?? '';
                      _filterChapter = ''; // Reset chapter when subject changes
                    });
                    _resetPagination();
                  },
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Chapter Dropdown
          Expanded(
            child: Container(
              height: 42,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1C1C1C) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
                ),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _filterChapter.isEmpty ? null : _filterChapter,
                  hint: Text(
                    'অধ্যায়',
                    style: TextStyle(
                      fontSize: 15,
                      color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFFA3A3A3),
                    ),
                  ),
                  isExpanded: true,
                  icon: Icon(
                    LucideIcons.chevronDown,
                    size: 16,
                    color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFFA3A3A3),
                  ),
                  dropdownColor: isDark ? const Color(0xFF1C1C1C) : Colors.white,
                  items: [
                    const DropdownMenuItem<String>(
                      value: '',
                      child: Text('সব অধ্যায়', style: TextStyle(fontSize: 15)),
                    ),
                    ...chapters.map(
                      (c) => DropdownMenuItem<String>(
                        value: c,
                        child: Text(c, style: const TextStyle(fontSize: 15), overflow: TextOverflow.ellipsis),
                      ),
                    ),
                  ],
                  onChanged: (v) {
                    setState(() => _filterChapter = v ?? '');
                    _resetPagination();
                  },
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Date Filter
          GestureDetector(
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: _filterDate ?? DateTime.now(),
                firstDate: DateTime(2023),
                lastDate: DateTime.now(),
              );
              if (picked != null) {
                setState(() => _filterDate = picked);
                _resetPagination();
              }
            },
            child: Container(
              height: 42,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: _filterDate != null
                    ? (isDark
                        ? const Color(0xFF064E3B).withValues(alpha: 0.3)
                        : const Color(0xFFECFDF5))
                    : (isDark ? const Color(0xFF1C1C1C) : Colors.white),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _filterDate != null
                      ? (isDark ? const Color(0xFF047857) : const Color(0xFF34D399))
                      : (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5)),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    LucideIcons.calendar,
                    size: 16,
                    color: _filterDate != null
                        ? (isDark ? const Color(0xFF34D399) : const Color(0xFF047857))
                        : const Color(0xFFA3A3A3),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _filterDate != null
                        ? DateFormat('d/M').format(_filterDate!)
                        : 'তারিখ',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: _filterDate != null
                          ? (isDark ? const Color(0xFF34D399) : const Color(0xFF047857))
                          : const Color(0xFFA3A3A3),
                    ),
                  ),
                  if (_filterDate != null) ...[
                    const SizedBox(width: 6),
                    GestureDetector(
                      onTap: () {
                        setState(() => _filterDate = null);
                        _resetPagination();
                      },
                      child: Icon(
                        LucideIcons.x,
                        size: 14,
                        color: isDark ? const Color(0xFF34D399) : const Color(0xFF047857),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(bool isDark) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_hasError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.alertTriangle, size: 48, color: Colors.red.shade400),
            const SizedBox(height: 16),
            const Text('ডাটা লোড করতে সমস্যা হয়েছে!'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchBookmarks,
              child: const Text('আবার চেষ্টা করুন'),
            ),
          ],
        ),
      );
    }

    final displayList = _filtered;

    if (displayList.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.bookmark, size: 64, color: isDark ? Colors.grey.shade800 : Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(
              'কোনো বুকমার্ক করা প্রশ্ন নেই!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'এক্সাম দেওয়ার সময় গুরুত্বপূর্ণ প্রশ্নগুলো বুকমার্ক করে রাখো।',
              style: TextStyle(
                color: isDark ? Colors.grey.shade500 : Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    final itemCount = displayList.length > _displayCount ? _displayCount + 1 : displayList.length;

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: itemCount,
      itemBuilder: (context, index) {
        if (index == _displayCount) {
          // Load more button
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Center(
              child: ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _displayCount += 15;
                  });
                },
                icon: const Icon(LucideIcons.chevronDown, size: 16),
                label: const Text('আরও লোড করুন'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  backgroundColor: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
                  foregroundColor: isDark ? Colors.white : Colors.black87,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          );
        }

        final b = displayList[index];
        final q = b.question;
        return Dismissible(
          key: Key(q.id),
          direction: DismissDirection.endToStart,
          background: Container(
            alignment: Alignment.centerRight,
            padding: const EdgeInsets.only(right: 20.0),
            decoration: BoxDecoration(
              color: Colors.red.shade500,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(LucideIcons.trash2, color: Colors.white),
          ),
          onDismissed: (direction) => _removeBookmark(q.id),
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: QuestionCard(
              question: q,
              serialNumber: index + 1,
              isFlagged: false,
              readOnly: true,
              showAnswer: true,
              showFeedback: true,
              initiallyExpanded: false,
              isBookmarked: true,
              onSelectOption: (_) {},
              onToggleFlag: () {},
              onReport: () {},
              onToggleBookmark: () => _removeBookmark(q.id),
            ),
          ),
        );
      },
    );
  }
}
