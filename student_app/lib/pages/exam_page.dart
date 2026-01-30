// File: lib/pages/exam_page.dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/exam_types.dart';
import 'exam/live_exam_page.dart';
import '../theme.dart';

class ExamPage extends StatefulWidget {
  const ExamPage({super.key});

  @override
  State<ExamPage> createState() => _ExamPageState();
}

class _ExamPageState extends State<ExamPage> {
  // --- Form State ---
  String? _selectedSubject;
  String? _selectedChapter;
  String? _selectedTopic;
  String _selectedDifficulty = 'Mixed';

  // Multi-select for Exam Types
  final List<String> _selectedExamTypes = ['Academic'];

  final TextEditingController _questionCountController = TextEditingController(
    text: '20',
  );
  final TextEditingController _durationController = TextEditingController(
    text: '20',
  );

  // --- Data Source ---
  List<String> _subjects = [];
  List<String> _chapters = [];
  List<String> _topics = [];

  // Static Options
  final List<String> _examTypeOptions = [
    'Academic',
    'Medical Admission',
    'Engineering Admission',
    'Varsity Admission',
    'Main Book',
    'Mixed',
  ];

  final List<String> _difficulties = ['Easy', 'Medium', 'Hard', 'Mixed'];

  // Loading States
  bool _isLoadingSubjects = true;
  bool _isLoadingChapters = false;
  bool _isLoadingTopics = false;
  bool _isStarting = false; // Prevent double taps on start

  @override
  void initState() {
    super.initState();
    _fetchSubjects();
  }

  @override
  void dispose() {
    _questionCountController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  // --- SUPABASE DATA FETCHING ---

  Future<void> _fetchSubjects() async {
    try {
      // Fetch subjects sorted alphabetically
      final response = await Supabase.instance.client
          .from('questions')
          .select('subject')
          .order('subject', ascending: true);

      final List<dynamic> data = response as List<dynamic>;
      final Set<String> uniqueSubjects = data
          .map((e) => e['subject'] as String?)
          .where((s) => s != null && s.isNotEmpty)
          .map((s) => s!)
          .toSet();

      if (mounted) {
        setState(() {
          _subjects = uniqueSubjects.toList();
          _isLoadingSubjects = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching subjects: $e');
      if (mounted) setState(() => _isLoadingSubjects = false);
    }
  }

  Future<void> _fetchChapters(String subject) async {
    setState(() {
      _isLoadingChapters = true;
      _chapters = [];
      _selectedChapter = null;
      _topics = [];
      _selectedTopic = null;
    });

    try {
      final response = await Supabase.instance.client
          .from('questions')
          .select('chapter')
          .eq('subject', subject)
          .order('chapter', ascending: true);

      final List<dynamic> data = response as List<dynamic>;
      final Set<String> uniqueChapters = data
          .map((e) => e['chapter'] as String?)
          .where((s) => s != null && s.isNotEmpty)
          .map((s) => s!)
          .toSet();

      if (mounted) {
        setState(() {
          _chapters = uniqueChapters.toList();
          _isLoadingChapters = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching chapters: $e');
      if (mounted) setState(() => _isLoadingChapters = false);
    }
  }

  Future<void> _fetchTopics(String chapter) async {
    setState(() {
      _isLoadingTopics = true;
      _topics = [];
      _selectedTopic = null;
    });

    try {
      final response = await Supabase.instance.client
          .from('questions')
          .select('topic')
          .eq('subject', _selectedSubject!)
          .eq('chapter', chapter)
          .order('topic', ascending: true);

      final List<dynamic> data = response as List<dynamic>;
      final Set<String> uniqueTopics = data
          .map((e) => e['topic'] as String?)
          .where((s) => s != null && s.isNotEmpty)
          .map((s) => s!)
          .toSet();

      if (mounted) {
        setState(() {
          _topics = uniqueTopics.toList();
          _isLoadingTopics = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching topics: $e');
      if (mounted) setState(() => _isLoadingTopics = false);
    }
  }

  // --- ACTIONS ---

  void _startExam() {
    if (_isStarting) return;

    // Validation
    if (_selectedSubject == null) {
      _showSnack('দয়া করে একটি বিষয় নির্বাচন করুন (Select a Subject)');
      return;
    }

    final int qCount = int.tryParse(_questionCountController.text) ?? 0;
    final int duration = int.tryParse(_durationController.text) ?? 0;

    if (qCount <= 0) {
      _showSnack('প্রশ্নের সংখ্যা অন্তত ১ হতে হবে');
      return;
    }
    if (duration <= 0) {
      _showSnack('সময়সীমা অন্তত ১ মিনিট হতে হবে');
      return;
    }

    setState(() => _isStarting = true);

    // Build Config
    final config = ExamConfig(
      subject: _selectedSubject!,
      examType: _selectedExamTypes.join(','),
      chapters: _selectedChapter ?? 'All',
      topics: _selectedTopic ?? 'All',
      difficulty: _selectedDifficulty,
      questionCount: qCount,
      durationMinutes: duration,
      negativeMarking: 0.25,
    );

    // Simulate slight delay for UI feedback then navigate
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) {
        setState(() => _isStarting = false);
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => LiveExamPage(config: config)),
        );
      }
    });
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // --- UI BUILD ---

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Colors
    final bgColor = isDark ? const Color(0xFF000000) : const Color(0xFFFAF9F6);
    final cardColor = isDark ? const Color(0xFF121212) : Colors.white;
    final textColor = isDark ? Colors.white : Colors.black87;
    final subTextColor = isDark ? Colors.grey[400] : Colors.grey[600];
    final borderColor = isDark ? Colors.white12 : Colors.grey.shade300;
    final primaryColor = AppTheme.primary;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text("Custom Exam Setup"),
        backgroundColor: bgColor,
        foregroundColor: textColor,
        elevation: 0,
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 600),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: cardColor,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: borderColor),
                  boxShadow: [
                    if (!isDark)
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Header
                    Text(
                      "কাস্টম এক্সাম তৈরি করুন",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "আপনার পছন্দ অনুযায়ী পরীক্ষার সেটিংস কনফিগার করুন",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: subTextColor,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // 1. Subject (Required)
                    _buildLabel("বিষয় (Subject)", textColor, isRequired: true),
                    _buildDropdown(
                      value: _selectedSubject,
                      hint: "বিষয় নির্বাচন করুন",
                      items: _subjects,
                      isLoading: _isLoadingSubjects,
                      onChanged: (val) {
                        setState(() => _selectedSubject = val);
                        if (val != null) _fetchChapters(val);
                      },
                      isDark: isDark,
                    ),
                    const SizedBox(height: 20),

                    // 2. Chapter & Topic Row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel("অধ্যায় (Chapter)", textColor),
                              _buildDropdown(
                                value: _selectedChapter,
                                hint: "অধ্যায়",
                                items: _chapters,
                                isLoading: _isLoadingChapters,
                                onChanged: (val) {
                                  setState(() => _selectedChapter = val);
                                  if (val != null) _fetchTopics(val);
                                },
                                isDark: isDark,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel("টপিক (Topic)", textColor),
                              _buildDropdown(
                                value: _selectedTopic,
                                hint: "টপিক",
                                items: _topics,
                                isLoading: _isLoadingTopics,
                                onChanged: (val) =>
                                    setState(() => _selectedTopic = val),
                                isDark: isDark,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // 3. Exam Type (Grid)
                    _buildLabel("পরীক্ষার ধরণ (Exam Type)", textColor),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 10,
                            crossAxisSpacing: 10,
                            childAspectRatio: 3.2,
                          ),
                      itemCount: _examTypeOptions.length,
                      itemBuilder: (context, index) {
                        final type = _examTypeOptions[index];
                        final isSelected = _selectedExamTypes.contains(type);
                        return InkWell(
                          onTap: () {
                            setState(() {
                              if (isSelected) {
                                if (_selectedExamTypes.length > 1) {
                                  _selectedExamTypes.remove(type);
                                }
                              } else {
                                _selectedExamTypes.add(type);
                              }
                            });
                          },
                          borderRadius: BorderRadius.circular(10),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? primaryColor.withOpacity(0.15)
                                  : Colors.transparent,
                              border: Border.all(
                                color: isSelected ? primaryColor : borderColor,
                                width: isSelected ? 1.5 : 1,
                              ),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                if (isSelected) ...[
                                  Icon(
                                    Icons.check,
                                    size: 14,
                                    color: primaryColor,
                                  ),
                                  const SizedBox(width: 6),
                                ],
                                Text(
                                  type,
                                  style: GoogleFonts.poppins(
                                    fontSize: 12,
                                    fontWeight: isSelected
                                        ? FontWeight.w600
                                        : FontWeight.normal,
                                    color: isSelected
                                        ? primaryColor
                                        : textColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 20),

                    // 4. Counts & Time
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel("প্রশ্ন (Qty)", textColor),
                              _buildTextInput(
                                _questionCountController,
                                isDark,
                                suffix: "টি",
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel("সময় (Time)", textColor),
                              _buildTextInput(
                                _durationController,
                                isDark,
                                suffix: "মিনিট",
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // 5. Difficulty
                    _buildLabel("কঠিনতার স্তর (Difficulty)", textColor),
                    _buildDropdown(
                      value: _selectedDifficulty,
                      hint: "Select Difficulty",
                      items: _difficulties,
                      onChanged: (val) =>
                          setState(() => _selectedDifficulty = val!),
                      isDark: isDark,
                    ),
                    const SizedBox(height: 32),

                    // 6. START BUTTON
                    SizedBox(
                      height: 54,
                      child: ElevatedButton(
                        onPressed: _startExam,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          foregroundColor: Colors.white,
                          elevation: 4,
                          shadowColor: primaryColor.withOpacity(0.4),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _isStarting
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2.5,
                                ),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.play_circle_outline),
                                  const SizedBox(width: 10),
                                  Text(
                                    "পরীক্ষা শুরু করুন",
                                    style: GoogleFonts.poppins(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // --- WIDGET HELPERS ---

  Widget _buildLabel(String text, Color color, {bool isRequired = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: RichText(
        text: TextSpan(
          text: text,
          style: GoogleFonts.poppins(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: color,
          ),
          children: [
            if (isRequired)
              const TextSpan(
                text: " *",
                style: TextStyle(color: Colors.redAccent),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required String? value,
    required String hint,
    required List<String> items,
    required ValueChanged<String?> onChanged,
    required bool isDark,
    bool isLoading = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        border: Border.all(
          color: isDark ? Colors.white12 : Colors.grey.shade300,
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: isLoading
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(12),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          : DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: value,
                hint: Text(
                  hint,
                  style: TextStyle(
                    color: isDark ? Colors.grey.shade600 : Colors.grey.shade400,
                    fontSize: 14,
                  ),
                ),
                isExpanded: true,
                dropdownColor: isDark ? const Color(0xFF2C2C2C) : Colors.white,
                style: GoogleFonts.poppins(
                  color: isDark ? Colors.white : Colors.black87,
                  fontSize: 14,
                ),
                icon: Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: isDark ? Colors.white70 : Colors.black54,
                ),
                items: items
                    .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                    .toList(),
                onChanged: onChanged,
              ),
            ),
    );
  }

  Widget _buildTextInput(
    TextEditingController controller,
    bool isDark, {
    String? suffix,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        border: Border.all(
          color: isDark ? Colors.white12 : Colors.grey.shade300,
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: TextField(
        controller: controller,
        keyboardType: TextInputType.number,
        style: GoogleFonts.poppins(
          color: isDark ? Colors.white : Colors.black87,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
          isDense: true,
          suffixText: suffix,
          suffixStyle: TextStyle(
            color: isDark ? Colors.grey : Colors.grey.shade600,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}
