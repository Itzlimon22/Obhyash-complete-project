import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/exam_models.dart';
import '../providers/exam_provider.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import 'package:obhyash_app/core/utils/app_popups.dart';

// --- Domain Models ---
class SubjectItem {
  final String id;
  final String name;
  final String label;

  const SubjectItem({
    required this.id,
    required this.name,
    required this.label,
  });
}

class ChapterItem {
  final String id;
  final String name;

  const ChapterItem({required this.id, required this.name});
}

class TopicItem {
  final String id;
  final String name;
  final String chapterId;

  const TopicItem({
    required this.id,
    required this.name,
    required this.chapterId,
  });
}

// --- View ---
class ExamSetupView extends ConsumerStatefulWidget {
  const ExamSetupView({super.key});

  @override
  ConsumerState<ExamSetupView> createState() => _ExamSetupViewState();
}

class _ExamSetupViewState extends ConsumerState<ExamSetupView> {
  // Data
  List<SubjectItem> _subjects = [];
  List<ChapterItem> _chapters = [];
  List<TopicItem> _topics = [];
  bool _isLoadingData = true;

  // Form State
  String? _selectedSubject;
  final Set<String> _selectedChapters = {};
  final Set<String> _selectedTopics = {};
  final Set<String> _examTypes = {'Academic'};
  final Set<String> _difficulties = {'Medium'};
  int _questionCount = 25;
  int _durationMinutes = 25;
  double _negativeMarking = 0.25;

  bool _isStarting = false;

  @override
  void initState() {
    super.initState();
    _fetchSubjects();
  }

  Future<void> _fetchSubjects() async {
    setState(() => _isLoadingData = true);
    try {
      final profile = ref.read(userProfileProvider).value;
      final division = profile?.division;
      final stream = profile?.stream;
      final optionalSubject = profile?.optionalSubject;

      final supabase = Supabase.instance.client;
      var query = supabase.from('subjects').select('*');

      if (division != null && division != 'General') {
        query = query.or('division.eq.$division,division.eq.General');
      }
      if (stream != null) {
        query = query.or('stream.ilike.%$stream%,stream.is.null');
      }

      final data = await query.limit(100);

      final filteredData = (data as List).where((e) {
        final subName = (e['name'] ?? e['name_en'] ?? '')
            .toString()
            .toLowerCase();
        final subId = e['id'].toString().toLowerCase();

        final isBiology =
            subName.contains('biology') || subId.contains('biology');
        final isStatistics =
            subName.contains('statistics') || subId.contains('statistics');

        if (optionalSubject == 'Statistics') {
          if (isBiology) return false;
        } else {
          // If Optional is Biology (or undefined), hide Statistics
          if (isStatistics) return false;
        }
        return true;
      });

      final seen = <String>{};
      final list = <SubjectItem>[];
      for (final e in filteredData) {
        final name = (e['name'] ?? e['name_en'] ?? '').toString();
        if (name.isEmpty || seen.contains(name)) continue;
        seen.add(name);
        final nameEn = (e['name_en'] ?? '').toString();
        final label = nameEn.isNotEmpty && nameEn != name
            ? '$name ($nameEn)'
            : name;
        list.add(SubjectItem(id: e['id'].toString(), name: name, label: label));
      }

      if (mounted) {
        setState(() {
          _subjects = list;
          _isLoadingData = false;
        });
      }
    } catch (e, st) {
      debugPrint('Failed to fetch subjects: $e\n$st');
      if (mounted) {
        setState(() => _isLoadingData = false);
        AppPopups.show(
          context,
          message: 'Failed to load subjects: $e',
          isError: true,
        );
      }
    }
  }

  Future<void> _fetchChapters(String subjectId) async {
    setState(() {
      _chapters = [];
      _topics = [];
      _selectedChapters.clear();
      _selectedTopics.clear();
    });
    try {
      final supabase = Supabase.instance.client;
      final data = await supabase
          .from('chapters')
          .select('id, name')
          .eq('subject_id', subjectId)
          .limit(200);
      if (mounted) {
        setState(() {
          _chapters = (data as List)
              .map(
                (e) =>
                    ChapterItem(id: e['id'].toString(), name: e['name'] ?? ''),
              )
              .toList();
        });
      }
    } catch (e) {
      debugPrint('Failed to fetch chapters: $e');
    }
  }

  Future<void> _fetchTopics() async {
    if (_selectedChapters.isEmpty) {
      if (mounted) {
        setState(() {
          _topics = [];
          _selectedTopics.clear();
        });
      }
      return;
    }
    try {
      final supabase = Supabase.instance.client;
      final data = await supabase
          .from('topics')
          .select('id, name, chapter_id')
          .inFilter('chapter_id', _selectedChapters.toList())
          .limit(500);
      if (mounted) {
        setState(() {
          _topics = (data as List)
              .map(
                (e) => TopicItem(
                  id: e['id'].toString(),
                  name: e['name'] ?? '',
                  chapterId: e['chapter_id'].toString(),
                ),
              )
              .toList();
          // Keep only selected topics that are still in the new list
          _selectedTopics.removeWhere((id) => !_topics.any((t) => t.id == id));
        });
      }
    } catch (e) {
      debugPrint('Failed to fetch topics: $e');
    }
  }

  void _onSubjectChanged(String? id) {
    setState(() => _selectedSubject = id);
    if (id != null) _fetchChapters(id);
  }

  void _showChapterDropdown() {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _MultiSelectDropdownModal(
        title: 'অধ্যায় নির্বাচন করো',
        searchHint: 'অধ্যায় খুঁজুন...',
        items: _chapters,
        selectedIds: _selectedChapters,
        onSave: (newSelection) {
          setState(() {
            _selectedChapters.clear();
            _selectedChapters.addAll(newSelection);
          });
          _fetchTopics();
        },
        getId: (item) => (item as ChapterItem).id,
        getName: (item) => (item as ChapterItem).name,
      ),
    );
  }

  void _showTopicDropdown() {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _MultiSelectDropdownModal(
        title: 'টপিক নির্বাচন করো',
        searchHint: 'টপিক খুঁজুন...',
        items: _topics,
        selectedIds: _selectedTopics,
        onSave: (newSelection) {
          setState(() {
            _selectedTopics.clear();
            _selectedTopics.addAll(newSelection);
          });
        },
        getId: (item) => (item as TopicItem).id,
        getName: (item) {
          final t = item as TopicItem;
          final chapter = _chapters.firstWhere(
            (c) => c.id == t.chapterId,
            orElse: () => const ChapterItem(id: '', name: ''),
          );
          return chapter.name.isNotEmpty
              ? '${chapter.name} - ${t.name}'
              : t.name;
        },
      ),
    );
  }

  void _startExam() async {
    if (_selectedSubject == null) {
      AppPopups.show(
        context,
        message: 'অনুগ্রহ করে একটি বিষয় নির্বাচন করো',
        isError: false,
      );
      return;
    }
    setState(() => _isStarting = true);

    final config = ExamConfig(
      subject: _subjects.firstWhere((s) => s.id == _selectedSubject).name,
      subjectLabel: _subjects.firstWhere((s) => s.id == _selectedSubject).label,
      examType: _examTypes.join('+'),
      chapters: _chapters
          .where((c) => _selectedChapters.contains(c.id))
          .map((c) => c.name)
          .join(','),
      topics: _topics
          .where((t) => _selectedTopics.contains(t.id))
          .map((t) => t.name)
          .join(','),
      difficulty: _difficulties.isNotEmpty ? _difficulties.join('+') : 'Medium',
      questionCount: _questionCount,
      durationMinutes: _durationMinutes,
      negativeMarking: _negativeMarking,
    );

    final success = await ref
        .read(examEngineProvider.notifier)
        .startExam(config);

    if (mounted) {
      setState(() => _isStarting = false);
      if (success) {
        context.push('/exam');
      } else {
        AppPopups.show(
          context,
          message: 'প্রশ্ন প্রস্তুত করতে সমস্যা হয়েছে। আবার চেষ্টা করো।',
          isError: true,
        );
      }
    }
  }

  void _showSubjectDropdown() {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _SubjectDropdownModal(
        subjects: _subjects,
        selectedId: _selectedSubject,
        onSelect: (id) {
          Navigator.pop(context);
          _onSubjectChanged(id);
        },
      ),
    );
  }

  Widget _buildDropdownSelector({
    required String label,
    required String hint,
    required String value,
    required bool isDark,
    required VoidCallback onTap,
    bool disabled = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 15,
            color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
          ),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: disabled ? null : onTap,
          borderRadius: BorderRadius.circular(12),
          child: Opacity(
            opacity: disabled ? 0.5 : 1.0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF1C1C1E)
                    : const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFE5E5E5),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      value.isEmpty ? hint : value,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: value.isEmpty
                            ? FontWeight.normal
                            : FontWeight.bold,
                        color: value.isEmpty
                            ? const Color(0xFFA3A3A3)
                            : (isDark ? Colors.white : const Color(0xFF000000)),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const Icon(
                    LucideIcons.chevronDown,
                    size: 20,
                    color: Color(0xFFA3A3A3),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(
                      0xFF059669,
                    ).withValues(alpha: isDark ? 0.2 : 0.1),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    'EXAM CONFIGURATION',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: isDark
                          ? const Color(0xFF059669)
                          : const Color(0xFF059669),
                      letterSpacing: 1.5,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'পরীক্ষা সেটআপ করো',
                  style: TextStyle(
                    fontSize: 34,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : const Color(0xFF000000),
                  ),
                ),
              ],
            ),
          ),

          // 1. Subject Selector
          _CardContainer(
            isDark: isDark,
            title: 'বিষয় নির্বাচন',
            icon: LucideIcons.bookOpen,
            child: _isLoadingData
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: CircularProgressIndicator(),
                    ),
                  )
                : GestureDetector(
                    onTap: _showSubjectDropdown,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF000000) : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _selectedSubject != null
                              ? const Color(0xFF059669)
                              : (isDark
                                    ? const Color(0xFF27272A)
                                    : const Color(0xFFE5E5E5)),
                          width: _selectedSubject != null ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: _selectedSubject != null
                                  ? const Color(
                                      0xFF059669,
                                    ).withValues(alpha: 0.1)
                                  : (isDark
                                        ? const Color(0xFF1C1C1E)
                                        : const Color(0xFFF5F5F5)),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              LucideIcons.bookOpen,
                              size: 16,
                              color: _selectedSubject != null
                                  ? const Color(0xFF059669)
                                  : const Color(0xFFA3A3A3),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _selectedSubject != null
                                  ? _subjects
                                        .firstWhere(
                                          (s) => s.id == _selectedSubject,
                                        )
                                        .label
                                  : 'বিষয় নির্বাচন করো...',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: _selectedSubject != null
                                    ? (isDark
                                          ? Colors.white
                                          : const Color(0xFF000000))
                                    : const Color(0xFFA3A3A3),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const Icon(
                            LucideIcons.chevronDown,
                            size: 20,
                            color: Color(0xFFA3A3A3),
                          ),
                        ],
                      ),
                    ),
                  ),
          ),
          const SizedBox(height: 16),

          // 2. Chapters & Topics
          Opacity(
            opacity: _selectedSubject == null ? 0.5 : 1.0,
            child: IgnorePointer(
              ignoring: _selectedSubject == null,
              child: _CardContainer(
                isDark: isDark,
                title: 'অধ্যায় ও টপিক',
                icon: LucideIcons.list,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildDropdownSelector(
                      label: 'অধ্যায়',
                      hint: 'সব অধ্যায়',
                      value: _selectedChapters.isEmpty
                          ? ''
                          : _selectedChapters.length == _chapters.length
                          ? 'সব অধ্যায়'
                          : '${_selectedChapters.length}টি অধ্যায় নির্বাচিত',
                      isDark: isDark,
                      onTap: _showChapterDropdown,
                      disabled: _chapters.isEmpty && _selectedSubject != null,
                    ),
                    const SizedBox(height: 16),
                    _buildDropdownSelector(
                      label: 'টপিক',
                      hint: 'সব টপিক',
                      value: _selectedTopics.isEmpty
                          ? ''
                          : _selectedTopics.length == _topics.length
                          ? 'সব টপিক'
                          : '${_selectedTopics.length}টি টপিক নির্বাচিত',
                      isDark: isDark,
                      onTap: _showTopicDropdown,
                      disabled: _selectedChapters.isEmpty || _topics.isEmpty,
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // 3. Exam Tools (Type, Difficulty, Mark, etc)
          _CardContainer(
            isDark: isDark,
            title: 'পরীক্ষার ধরন',
            icon: LucideIcons.settings,
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ['Academic', 'Admission', 'Board']
                  .map(
                    (t) => _ToggleBox(
                      label: t,
                      selected: _examTypes.contains(t),
                      isDark: isDark,
                      onTap: () => setState(() {
                        if (_examTypes.contains(t) && _examTypes.length > 1) {
                          _examTypes.remove(t);
                        } else if (!_examTypes.contains(t)) {
                          _examTypes.add(t);
                        }
                      }),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 16),

          _CardContainer(
            isDark: isDark,
            title: 'কঠিনতা',
            icon: LucideIcons.activity,
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ['Easy', 'Medium', 'Hard']
                  .map(
                    (d) => _ToggleBox(
                      label: d,
                      selected: _difficulties.contains(d),
                      isDark: isDark,
                      onTap: () => setState(() {
                        if (_difficulties.contains(d) &&
                            _difficulties.length > 1) {
                          _difficulties.remove(d);
                        } else if (!_difficulties.contains(d)) {
                          _difficulties.add(d);
                        }
                      }),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 16),

          // 4. Sliders (Questions & Time)
          _CardContainer(
            isDark: isDark,
            title: 'প্রশ্নের সংখ্যা (সর্বোচ্চ ১০০)',
            icon: LucideIcons.helpCircle,
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'মোট প্রশ্ন:',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF000000),
                      ),
                    ),
                    Text(
                      '$_questionCount',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF059669),
                      ),
                    ),
                  ],
                ),
                Slider(
                  value: _questionCount.toDouble(),
                  min: 5,
                  max: 100,
                  divisions: 95,
                  activeColor: const Color(0xFF059669),
                  onChanged: (v) => setState(() {
                    _questionCount = v.round();
                    _durationMinutes =
                        _questionCount; // Sync duration with questions like web app
                  }),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          _CardContainer(
            isDark: isDark,
            title: 'সময় (সর্বোচ্চ ১৮০ মি)',
            icon: LucideIcons.clock,
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'মোট সময়:',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF000000),
                      ),
                    ),
                    Text(
                      '$_durationMinutes মি',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF059669),
                      ),
                    ),
                  ],
                ),
                Slider(
                  value: _durationMinutes.toDouble(),
                  min: 5,
                  max: 180,
                  divisions: 175,
                  activeColor: const Color(0xFF059669),
                  onChanged: (v) =>
                      setState(() => _durationMinutes = v.round()),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          _CardContainer(
            isDark: isDark,
            title: 'নেগেটিভ মার্কিং',
            icon: LucideIcons.minusCircle,
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [0.0, 0.25, 0.5, 1.0]
                  .map(
                    (v) => _ToggleBox(
                      label: v == 0.0 ? '0' : '-$v',
                      selected: _negativeMarking == v,
                      isDark: isDark,
                      onTap: () => setState(() => _negativeMarking = v),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 32),

          // Start Button
          ElevatedButton(
            onPressed: (_isStarting || _selectedSubject == null)
                ? null
                : _startExam,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              disabledBackgroundColor: isDark
                  ? const Color(0xFF1C1C1E)
                  : const Color(0xFFE5E5E5),
              padding: const EdgeInsets.symmetric(vertical: 20),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              elevation: 0,
            ),
            child: _isStarting
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'পরীক্ষা শুরু করো',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Icon(
                        LucideIcons.sparkles,
                        size: 20,
                        color: Colors.white,
                      ),
                    ],
                  ),
          ),
          const SizedBox(height: 60),
        ],
      ),
    );
  }
}

class _CardContainer extends StatelessWidget {
  final bool isDark;
  final String title;
  final IconData icon;
  final Widget child;

  const _CardContainer({
    required this.isDark,
    required this.title,
    required this.icon,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
        ),
        boxShadow: isDark
            ? []
            : [
                const BoxShadow(
                  color: Color(0x05000000),
                  blurRadius: 10,
                  offset: Offset(0, 4),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: const Color(0xFF059669)),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF000000),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          child,
        ],
      ),
    );
  }
}

class _ToggleBox extends StatelessWidget {
  final String label;
  final bool selected;
  final bool isDark;
  final VoidCallback onTap;

  const _ToggleBox({
    required this.label,
    required this.selected,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF059669).withValues(alpha: isDark ? 0.2 : 0.1)
              : (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5)),
          border: Border.all(
            color: selected
                ? const Color(0xFF059669)
                : (isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5)),
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: selected
                    ? const Color(0xFF059669)
                    : (isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF525252)),
              ),
            ),
            if (selected) ...[
              const SizedBox(width: 8),
              Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(
                  color: Color(0xFF059669),
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SubjectDropdownModal extends StatefulWidget {
  final List<SubjectItem> subjects;
  final String? selectedId;
  final void Function(String id) onSelect;

  const _SubjectDropdownModal({
    required this.subjects,
    this.selectedId,
    required this.onSelect,
  });

  @override
  State<_SubjectDropdownModal> createState() => _SubjectDropdownModalState();
}

class _SubjectDropdownModalState extends State<_SubjectDropdownModal> {
  String _searchQuery = '';
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final filteredSubjects = widget.subjects.where((s) {
      return s.label.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          s.name.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (_, scrollController) => Material(
        color: Colors.transparent,
        child: Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF000000) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Drag Handle
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 8),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFE5E5E5),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'বিষয় নির্বাচন করো',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : const Color(0xFF000000),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(LucideIcons.x, size: 20),
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF737373),
                    ),
                  ],
                ),
              ),

              // Search Bar
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
                child: Container(
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF1C1C1E)
                        : const Color(0xFFF5F5F5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF27272A)
                          : const Color(0xFFE5E5E5),
                    ),
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (val) => setState(() => _searchQuery = val),
                    style: TextStyle(
                      color: isDark ? Colors.white : const Color(0xFF000000),
                      fontSize: 16,
                    ),
                    decoration: InputDecoration(
                      hintText: 'বিষয় খুঁজুন...',
                      hintStyle: TextStyle(
                        color: isDark
                            ? const Color(0xFFA3A3A3)
                            : const Color(0xFFA3A3A3),
                      ),
                      prefixIcon: Icon(
                        LucideIcons.search,
                        size: 18,
                        color: isDark
                            ? const Color(0xFFA3A3A3)
                            : const Color(0xFFA3A3A3),
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 8),

              // List
              Expanded(
                child: filteredSubjects.isEmpty
                    ? Center(
                        child: Text(
                          'কোনো বিষয় পাওয়া যায়নি',
                          style: TextStyle(
                            color: isDark
                                ? const Color(0xFFA3A3A3)
                                : const Color(0xFF737373),
                            fontSize: 17,
                          ),
                        ),
                      )
                    : ListView.builder(
                        controller: scrollController,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 8,
                        ),
                        itemCount: filteredSubjects.length,
                        itemBuilder: (context, index) {
                          final subject = filteredSubjects[index];
                          final isSelected = subject.id == widget.selectedId;

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: InkWell(
                              onTap: () => widget.onSelect(subject.id),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(
                                          0xFF059669,
                                        ).withValues(alpha: 0.1)
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isSelected
                                        ? const Color(
                                            0xFF059669,
                                          ).withValues(alpha: 0.3)
                                        : Colors.transparent,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 40,
                                      height: 40,
                                      decoration: BoxDecoration(
                                        color: isSelected
                                            ? const Color(
                                                0xFF059669,
                                              ).withValues(alpha: 0.2)
                                            : (isDark
                                                  ? const Color(0xFF1C1C1E)
                                                  : const Color(0xFFF5F5F5)),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Icon(
                                        LucideIcons.bookOpen,
                                        size: 18,
                                        color: isSelected
                                            ? const Color(0xFF059669)
                                            : (isDark
                                                  ? const Color(0xFFA3A3A3)
                                                  : const Color(0xFF737373)),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        subject.label,
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: isSelected
                                              ? FontWeight.bold
                                              : FontWeight.w600,
                                          color: isSelected
                                              ? const Color(0xFF059669)
                                              : (isDark
                                                    ? Colors.white
                                                    : const Color(0xFF000000)),
                                        ),
                                      ),
                                    ),
                                    if (isSelected)
                                      const Icon(
                                        LucideIcons.checkCircle,
                                        color: Color(0xFF059669),
                                        size: 20,
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MultiSelectDropdownModal extends StatefulWidget {
  final String title;
  final String searchHint;
  final List<dynamic> items; // ChapterItem or TopicItem
  final Set<String> selectedIds;
  final void Function(Set<String>) onSave;
  final String Function(dynamic) getId;
  final String Function(dynamic) getName;

  const _MultiSelectDropdownModal({
    required this.title,
    required this.searchHint,
    required this.items,
    required this.selectedIds,
    required this.onSave,
    required this.getId,
    required this.getName,
  });

  @override
  State<_MultiSelectDropdownModal> createState() =>
      _MultiSelectDropdownModalState();
}

class _MultiSelectDropdownModalState extends State<_MultiSelectDropdownModal> {
  String _searchQuery = '';
  final _searchController = TextEditingController();
  late Set<String> _currentSelected;

  @override
  void initState() {
    super.initState();
    _currentSelected = Set.from(widget.selectedIds);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _toggleSelection(String id) {
    setState(() {
      if (_currentSelected.contains(id)) {
        _currentSelected.remove(id);
      } else {
        _currentSelected.add(id);
      }
    });
  }

  void _toggleSelectAll(List<dynamic> currentList) {
    final allIds = currentList.map((e) => widget.getId(e)).toSet();
    final allSelected = allIds.every((id) => _currentSelected.contains(id));

    setState(() {
      if (allSelected) {
        _currentSelected.removeAll(allIds);
      } else {
        _currentSelected.addAll(allIds);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final filteredItems = widget.items.where((item) {
      final name = widget.getName(item);
      return name.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (_, scrollController) => Material(
        color: Colors.transparent,
        child: Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF000000) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Drag Handle
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 8),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFE5E5E5),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      widget.title,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : const Color(0xFF000000),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(LucideIcons.x, size: 20),
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF737373),
                    ),
                  ],
                ),
              ),

              // Search Bar & Select All
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF1C1C1E)
                              : const Color(0xFFF5F5F5),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark
                                ? const Color(0xFF27272A)
                                : const Color(0xFFE5E5E5),
                          ),
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) =>
                              setState(() => _searchQuery = val),
                          style: TextStyle(
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF000000),
                            fontSize: 16,
                          ),
                          decoration: InputDecoration(
                            hintText: widget.searchHint,
                            hintStyle: TextStyle(
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFFA3A3A3),
                            ),
                            prefixIcon: Icon(
                              LucideIcons.search,
                              size: 18,
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFFA3A3A3),
                            ),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    InkWell(
                      onTap: () => _toggleSelectAll(filteredItems),
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF1C1C1E)
                              : const Color(0xFFF5F5F5),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isDark
                                ? const Color(0xFF27272A)
                                : const Color(0xFFE5E5E5),
                          ),
                        ),
                        child: Text(
                          'সবগুলো',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF000000),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // List
              Expanded(
                child: filteredItems.isEmpty
                    ? Center(
                        child: Text(
                          'কোনো তথ্য পাওয়া যায়নি',
                          style: TextStyle(
                            color: isDark
                                ? const Color(0xFFA3A3A3)
                                : const Color(0xFF737373),
                            fontSize: 17,
                          ),
                        ),
                      )
                    : ListView.builder(
                        controller: scrollController,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 8,
                        ),
                        itemCount: filteredItems.length,
                        itemBuilder: (context, index) {
                          final item = filteredItems[index];
                          final id = widget.getId(item);
                          final name = widget.getName(item);
                          final isSelected = _currentSelected.contains(id);

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: InkWell(
                              onTap: () => _toggleSelection(id),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(
                                          0xFF059669,
                                        ).withValues(alpha: 0.1)
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isSelected
                                        ? const Color(
                                            0xFF059669,
                                          ).withValues(alpha: 0.3)
                                        : Colors.transparent,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 24,
                                      height: 24,
                                      decoration: BoxDecoration(
                                        color: isSelected
                                            ? const Color(0xFF059669)
                                            : Colors.transparent,
                                        border: Border.all(
                                          color: isSelected
                                              ? const Color(0xFF059669)
                                              : (isDark
                                                    ? const Color(0xFF525252)
                                                    : const Color(0xFFA3A3A3)),
                                          width: 2,
                                        ),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: isSelected
                                          ? const Icon(
                                              LucideIcons.check,
                                              size: 16,
                                              color: Colors.white,
                                            )
                                          : null,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        name,
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: isSelected
                                              ? FontWeight.bold
                                              : FontWeight.w600,
                                          color: isSelected
                                              ? const Color(0xFF059669)
                                              : (isDark
                                                    ? Colors.white
                                                    : const Color(0xFF000000)),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
              ),

              // Footer Save Button
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        widget.onSave(_currentSelected);
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        'সংরক্ষণ করো (${_currentSelected.length})',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
