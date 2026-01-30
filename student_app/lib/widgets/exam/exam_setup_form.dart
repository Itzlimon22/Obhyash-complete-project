import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart'; // ✅ Added for DB
import '../../models/exam_types.dart';

class ExamSetupForm extends StatefulWidget {
  final Function(ExamConfig) onStartExam;
  final bool isLoading;

  const ExamSetupForm({
    super.key,
    required this.onStartExam,
    required this.isLoading,
  });

  @override
  State<ExamSetupForm> createState() => _ExamSetupFormState();
}

class _ExamSetupFormState extends State<ExamSetupForm> {
  // --- STATE ---
  String?
  _selectedSubject; // Stores Subject NAME now (for simplicity in config)
  String? _selectedChapter;
  String? _selectedTopic;

  final List<String> _selectedExamTypes = ['Academic'];

  final TextEditingController _questionCountController = TextEditingController(
    text: '20',
  );
  final TextEditingController _durationController = TextEditingController(
    text: '20',
  );

  String _selectedDifficulty = 'Mixed';
  final double _negativeMarking = 0.25;

  // --- DYNAMIC DATA ---
  List<Map<String, dynamic>> _subjectsData = [];
  List<Map<String, dynamic>> _chaptersData = [];
  List<Map<String, dynamic>> _topicsData = [];

  bool _loadingSubjects = true;
  bool _loadingChapters = false;
  bool _loadingTopics = false;

  // --- STATIC OPTIONS ---
  final List<String> _examTypeOptions = [
    'Academic',
    'Medical Admission',
    'Engineering Admission',
    'Varsity Admission',
    'Main Book',
    'Mixed',
  ];

  final List<String> _difficulties = ['Easy', 'Medium', 'Hard', 'Mixed'];

  @override
  void initState() {
    super.initState();
    _fetchSubjects();
  }

  // --- DATA FETCHING ---

  Future<void> _fetchSubjects() async {
    try {
      final response = await Supabase.instance.client
          .from('subjects')
          .select('id, name')
          .order('name', ascending: true);

      if (mounted) {
        setState(() {
          _subjectsData = List<Map<String, dynamic>>.from(response);
          _loadingSubjects = false;
        });
      }
    } catch (e) {
      debugPrint("Error fetching subjects: $e");
      if (mounted) setState(() => _loadingSubjects = false);
    }
  }

  Future<void> _fetchChapters(String subjectName) async {
    setState(() {
      _loadingChapters = true;
      _chaptersData = [];
      _selectedChapter = null;
      _topicsData = [];
      _selectedTopic = null;
    });

    try {
      final subject = _subjectsData.firstWhere(
        (e) => e['name'] == subjectName,
        orElse: () => {},
      );
      if (subject.isEmpty) return;

      final response = await Supabase.instance.client
          .from('chapters')
          .select('id, name')
          .eq('subject_id', subject['id'])
          .order('name', ascending: true);

      if (mounted) {
        setState(() {
          _chaptersData = List<Map<String, dynamic>>.from(response);
          _loadingChapters = false;
        });
      }
    } catch (e) {
      debugPrint("Error fetching chapters: $e");
      if (mounted) setState(() => _loadingChapters = false);
    }
  }

  Future<void> _fetchTopics(String chapterName) async {
    setState(() {
      _loadingTopics = true;
      _topicsData = [];
      _selectedTopic = null;
    });

    try {
      final chapter = _chaptersData.firstWhere(
        (e) => e['name'] == chapterName,
        orElse: () => {},
      );
      if (chapter.isEmpty) return;

      final response = await Supabase.instance.client
          .from('topics')
          .select('id, name')
          .eq('chapter_id', chapter['id'])
          .order('name', ascending: true);

      if (mounted) {
        setState(() {
          _topicsData = List<Map<String, dynamic>>.from(response);
          _loadingTopics = false;
        });
      }
    } catch (e) {
      debugPrint("Error fetching topics: $e");
      if (mounted) setState(() => _loadingTopics = false);
    }
  }

  // --- LOGIC ---
  void _toggleExamType(String type) {
    setState(() {
      if (_selectedExamTypes.contains(type)) {
        if (_selectedExamTypes.length > 1) {
          _selectedExamTypes.remove(type);
        }
      } else {
        _selectedExamTypes.add(type);
      }
    });
  }

  void _handleSubmit() {
    if (_selectedSubject == null) return;

    final config = ExamConfig(
      subject: _selectedSubject!,
      examType: _selectedExamTypes.join(','), // CSV for backend
      chapters: _selectedChapter ?? 'All',
      topics: _selectedTopic ?? 'All',
      difficulty: _selectedDifficulty,
      questionCount: int.tryParse(_questionCountController.text) ?? 20,
      durationMinutes: int.tryParse(_durationController.text) ?? 20,
      negativeMarking: _negativeMarking,
    );

    widget.onStartExam(config);
  }

  // --- UI HELPERS ---
  InputDecoration _inputDecoration(String label, bool isDark) {
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(
        color: isDark ? Colors.grey[400] : Colors.grey[600],
      ),
      filled: true,
      fillColor: isDark ? const Color(0xFF121212) : Colors.grey[50],
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(
          color: isDark ? Colors.white10 : Colors.grey.shade300,
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(
          color: isDark ? Colors.white10 : Colors.grey.shade300,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Colors.indigo, width: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : Colors.black87;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          if (!isDark)
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 4),
            ),
        ],
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.grey.shade100,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Text(
            "কাস্টম এক্সাম তৈরি করুন",
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            "আপনার পছন্দ অনুযায়ী পরীক্ষার সেটিংস কনফিগার করুন",
            style: TextStyle(
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),

          // 1. SUBJECT Dropdown (Fetched from DB)
          _loadingSubjects
              ? const Center(child: CircularProgressIndicator())
              : DropdownButtonFormField<String>(
                  value: _selectedSubject,
                  items: _subjectsData.map((s) {
                    return DropdownMenuItem(
                      value: s['name'].toString(),
                      child: Text(s['name'].toString()),
                    );
                  }).toList(),
                  onChanged: (val) {
                    setState(() => _selectedSubject = val);
                    if (val != null) _fetchChapters(val);
                  },
                  decoration: _inputDecoration("বিষয় (Subject)", isDark),
                  dropdownColor: isDark
                      ? const Color(0xFF121212)
                      : Colors.white,
                  style: TextStyle(color: textColor, fontSize: 16),
                ),
          const SizedBox(height: 24),

          // 2. Chapters & Topics (Dynamic)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Chapter Dropdown
              Expanded(
                child: _loadingChapters
                    ? const Center(
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                    : DropdownButtonFormField<String>(
                        value: _selectedChapter,
                        items: _chaptersData.map((c) {
                          return DropdownMenuItem(
                            value: c['name'].toString(),
                            child: Text(c['name'].toString()),
                          );
                        }).toList(),
                        onChanged: (val) {
                          setState(() => _selectedChapter = val);
                          if (val != null) _fetchTopics(val);
                        },
                        decoration: _inputDecoration("অধ্যায়", isDark),
                        dropdownColor: isDark
                            ? const Color(0xFF121212)
                            : Colors.white,
                        style: TextStyle(color: textColor, fontSize: 14),
                        isExpanded: true,
                      ),
              ),
              const SizedBox(width: 16),

              // Topic Dropdown
              Expanded(
                child: _loadingTopics
                    ? const Center(
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                    : DropdownButtonFormField<String>(
                        value: _selectedTopic,
                        items: _topicsData.map((t) {
                          return DropdownMenuItem(
                            value: t['name'].toString(),
                            child: Text(t['name'].toString()),
                          );
                        }).toList(),
                        onChanged: (val) =>
                            setState(() => _selectedTopic = val),
                        decoration: _inputDecoration("টপিক", isDark),
                        dropdownColor: isDark
                            ? const Color(0xFF121212)
                            : Colors.white,
                        style: TextStyle(color: textColor, fontSize: 14),
                        isExpanded: true,
                      ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // 3. Exam Types
          Text(
            "পরীক্ষার ধরণ",
            style: TextStyle(fontWeight: FontWeight.bold, color: textColor),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _examTypeOptions.map((type) {
              final isSelected = _selectedExamTypes.contains(type);
              return GestureDetector(
                onTap: () => _toggleExamType(type),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? (isDark
                              ? const Color(0xFF312E81)
                              : const Color(0xFFE0E7FF))
                        : (isDark ? const Color(0xFF121212) : Colors.white),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? Colors.indigo
                          : (isDark ? Colors.white10 : Colors.grey.shade300),
                      width: isSelected ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (isSelected) ...[
                        const Icon(Icons.check, size: 14, color: Colors.indigo),
                        const SizedBox(width: 6),
                      ],
                      Text(
                        type,
                        style: TextStyle(
                          color: isSelected
                              ? (isDark ? Colors.white : Colors.indigo[900])
                              : textColor,
                          fontWeight: isSelected
                              ? FontWeight.bold
                              : FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 32),

          // 4. Count & Duration
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _questionCountController,
                  keyboardType: TextInputType.number,
                  style: TextStyle(color: textColor),
                  decoration: _inputDecoration("প্রশ্নের সংখ্যা", isDark),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextField(
                  controller: _durationController,
                  keyboardType: TextInputType.number,
                  style: TextStyle(color: textColor),
                  decoration: _inputDecoration("সময়সীমা (মিনিট)", isDark),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // 5. Difficulty
          DropdownButtonFormField<String>(
            value: _selectedDifficulty,
            items: _difficulties
                .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                .toList(),
            onChanged: (val) => setState(() => _selectedDifficulty = val!),
            decoration: _inputDecoration("কঠিনতার স্তর", isDark),
            dropdownColor: isDark ? const Color(0xFF121212) : Colors.white,
            style: TextStyle(color: textColor, fontSize: 16),
          ),
          const SizedBox(height: 32),

          // 6. Submit Button
          Container(
            height: 48,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: (widget.isLoading || _selectedSubject == null)
                  ? null
                  : const LinearGradient(
                      colors: [Color(0xFF4F46E5), Color(0xFF4338CA)],
                    ),
              boxShadow: (widget.isLoading || _selectedSubject == null)
                  ? []
                  : [
                      BoxShadow(
                        color: const Color(0xFF4F46E5).withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
            ),
            child: ElevatedButton(
              onPressed: (widget.isLoading || _selectedSubject == null)
                  ? null
                  : _handleSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                disabledBackgroundColor: isDark
                    ? Colors.grey[800]
                    : Colors.grey[300],
              ),
              child: widget.isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.play_arrow_rounded, size: 28),
                        SizedBox(width: 8),
                        Text(
                          "পরীক্ষা শুরু করুন",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
