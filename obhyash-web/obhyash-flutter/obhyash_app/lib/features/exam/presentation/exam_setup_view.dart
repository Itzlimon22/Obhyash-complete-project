import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/exam_models.dart';
import '../providers/exam_provider.dart';

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
  Set<String> _selectedChapters = {};
  Set<String> _selectedTopics = {};
  Set<String> _examTypes = {'Academic'};
  Set<String> _difficulties = {'Medium'};
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
      final supabase = Supabase.instance.client;
      // Fetching all distinct subjects grouped by division temporarily
      final data = await supabase
          .from('subjects')
          .select('id, name, name_en, name_bn')
          .limit(100);

      final list = (data as List).map((e) {
        final nameBn = e['name_bn'] ?? e['name'];
        final nameEn = e['name'] ?? e['name_en'];
        final label =
            (nameEn != null && nameBn != null && !nameBn.contains(nameEn))
            ? '$nameBn ($nameEn)'
            : nameBn ?? 'Unknown';
        return SubjectItem(
          id: e['id'].toString(),
          name: nameBn ?? '',
          label: label,
        );
      }).toList();

      if (mounted) {
        setState(() {
          _subjects = list;
          _isLoadingData = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingData = false);
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
    } catch (_) {}
  }

  Future<void> _fetchTopics() async {
    if (_selectedChapters.isEmpty) {
      if (mounted)
        setState(() {
          _topics = [];
          _selectedTopics.clear();
        });
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
    } catch (_) {}
  }

  void _onSubjectChanged(String? id) {
    setState(() => _selectedSubject = id);
    if (id != null) _fetchChapters(id);
  }

  void _toggleChapter(String id) {
    setState(() {
      if (_selectedChapters.contains(id))
        _selectedChapters.remove(id);
      else
        _selectedChapters.add(id);
    });
    _fetchTopics();
  }

  void _toggleTopic(String id) {
    setState(() {
      if (_selectedTopics.contains(id))
        _selectedTopics.remove(id);
      else
        _selectedTopics.add(id);
    });
  }

  void _startExam() async {
    if (_selectedSubject == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('অনুগ্রহ করে একটি বিষয় নির্বাচন করুন')),
      );
      return;
    }
    setState(() => _isStarting = true);

    final config = ExamConfig(
      subject: _selectedSubject!,
      subjectLabel: _subjects.firstWhere((s) => s.id == _selectedSubject).label,
      examType: _examTypes.join(','),
      chapters: _selectedChapters.join(','),
      topics: _selectedTopics.join(','),
      difficulty: _difficulties.isNotEmpty ? _difficulties.first : 'Medium',
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
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'প্রশ্ন প্রস্তুত করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
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
                    ).withOpacity(isDark ? 0.2 : 0.1),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    'EXAM CONFIGURATION',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: isDark
                          ? const Color(0xFF34D399)
                          : const Color(0xFF047857),
                      letterSpacing: 1.5,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'পরীক্ষা সেটআপ করুন',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : const Color(0xFF171717),
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
                : Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _subjects.map((s) {
                      final isSelected = _selectedSubject == s.id;
                      return GestureDetector(
                        onTap: () => _onSubjectChanged(s.id),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFF059669)
                                : (isDark
                                      ? const Color(0xFF262626)
                                      : const Color(0xFFF5F5F5)),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFF059669)
                                  : (isDark
                                        ? const Color(0xFF404040)
                                        : const Color(0xFFE5E5E5)),
                            ),
                            boxShadow: isSelected
                                ? [
                                    const BoxShadow(
                                      color: Color(0x66059669),
                                      blurRadius: 8,
                                      offset: Offset(0, 4),
                                    ),
                                  ]
                                : [],
                          ),
                          child: Text(
                            s.label,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: isSelected
                                  ? Colors.white
                                  : (isDark
                                        ? Colors.white
                                        : const Color(0xFF171717)),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
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
                    Text(
                      'অধ্যায়',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: isDark
                            ? const Color(0xFFA3A3A3)
                            : const Color(0xFF737373),
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (_chapters.isEmpty && _selectedSubject != null)
                      const Text(
                        'কোনো অধ্যায় পাওয়া যায়নি',
                        style: TextStyle(fontSize: 13, color: Colors.grey),
                      )
                    else
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: _chapters
                            .map(
                              (c) => _ChipBtn(
                                label: c.name,
                                selected: _selectedChapters.contains(c.id),
                                isDark: isDark,
                                onTap: () => _toggleChapter(c.id),
                              ),
                            )
                            .toList(),
                      ),

                    const SizedBox(height: 24),
                    Text(
                      'টপিক',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: isDark
                            ? const Color(0xFFA3A3A3)
                            : const Color(0xFF737373),
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (_selectedChapters.isEmpty)
                      const Text(
                        'আগে অধ্যায় নির্বাচন করুন',
                        style: TextStyle(fontSize: 13, color: Colors.grey),
                      )
                    else if (_topics.isEmpty)
                      const Text(
                        'কোনো টপিক পাওয়া যায়নি',
                        style: TextStyle(fontSize: 13, color: Colors.grey),
                      )
                    else
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: _topics
                            .map(
                              (t) => _ChipBtn(
                                label: t.name,
                                selected: _selectedTopics.contains(t.id),
                                isDark: isDark,
                                onTap: () => _toggleTopic(t.id),
                              ),
                            )
                            .toList(),
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
                        if (_examTypes.contains(t) && _examTypes.length > 1)
                          _examTypes.remove(t);
                        else if (!_examTypes.contains(t))
                          _examTypes.add(t);
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
                            _difficulties.length > 1)
                          _difficulties.remove(d);
                        else if (!_difficulties.contains(d))
                          _difficulties.add(d);
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
            title: 'প্রশ্নের সংখ্যা ($max 100)',
            icon: LucideIcons.helpCircle,
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'মোট প্রশ্ন:',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF171717),
                      ),
                    ),
                    Text(
                      '$_questionCount',
                      style: const TextStyle(
                        fontSize: 20,
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
            title: 'সময় ($max 180 min)',
            icon: LucideIcons.clock,
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'মোট সময়:',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF171717),
                      ),
                    ),
                    Text(
                      '$_durationMinutes মি',
                      style: const TextStyle(
                        fontSize: 20,
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
              backgroundColor: const Color(0xFF047857),
              disabledBackgroundColor: isDark
                  ? const Color(0xFF262626)
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
                        'পরীক্ষা শুরু করুন',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
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
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
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
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF171717),
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

class _ChipBtn extends StatelessWidget {
  final String label;
  final bool selected;
  final bool isDark;
  final VoidCallback onTap;

  const _ChipBtn({
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
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF10B981).withOpacity(isDark ? 0.2 : 0.1)
              : (isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5)),
          border: Border.all(
            color: selected
                ? const Color(0xFF10B981)
                : (isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5)),
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: selected
                ? const Color(0xFF10B981)
                : (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF525252)),
          ),
        ),
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
              ? const Color(0xFF059669).withOpacity(isDark ? 0.2 : 0.1)
              : (isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5)),
          border: Border.all(
            color: selected
                ? const Color(0xFF059669)
                : (isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5)),
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
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
