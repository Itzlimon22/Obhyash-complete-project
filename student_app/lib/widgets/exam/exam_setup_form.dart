// File: lib/widgets/exam/exam_setup_form.dart
import 'package:flutter/material.dart';
import '../../models/exam_types.dart'; // Ensure this path is correct

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
  String? _selectedSubject;
  final List<String> _selectedExamTypes = ['Academic'];

  final TextEditingController _chaptersController = TextEditingController();
  final TextEditingController _topicsController = TextEditingController();
  final TextEditingController _questionCountController = TextEditingController(
    text: '20',
  );
  final TextEditingController _durationController = TextEditingController(
    text: '20',
  );

  String _selectedDifficulty = 'Mixed'; // Maps to Difficulty enum
  final double _negativeMarking = 0.25;

  // --- DATA ---
  final List<Map<String, String>> _subjects = [
    {'id': 'Physics', 'label': 'পদার্থবিজ্ঞান (Physics)'},
    {'id': 'Chemistry', 'label': 'রসায়ন (Chemistry)'},
    {'id': 'Math', 'label': 'উচ্চতর গণিত (Higher Math)'},
    {'id': 'Biology', 'label': 'জীববিজ্ঞান (Biology)'},
    {'id': 'Bangla', 'label': 'বাংলা (Bangla)'},
    {'id': 'English', 'label': 'English'},
    {'id': 'GK', 'label': 'সাধারণ জ্ঞান (General Knowledge)'},
  ];

  final List<String> _examTypeOptions = [
    'Academic',
    'Medical Admission',
    'Engineering Admission',
    'Varsity Admission',
    'Main Book',
    'Mixed',
  ];

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

    // Find the label for the subject ID
    final subjectLabel = _subjects.firstWhere(
      (s) => s['id'] == _selectedSubject,
      orElse: () => {'label': _selectedSubject!},
    )['label'];

    final config = ExamConfig(
      subject: subjectLabel!,
      examType: _selectedExamTypes.join(' + '),
      chapters: _chaptersController.text.isNotEmpty
          ? _chaptersController.text
          : 'All',
      topics: _topicsController.text.isNotEmpty
          ? _topicsController.text
          : 'General',
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
      fillColor: isDark
          ? const Color(0xFF121212)
          : Colors.grey[50], // slate-800/50 : slate-50
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 14,
        vertical: 12,
      ), // Reduced Padding
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10), // 12 -> 10
        borderSide: BorderSide(
          color: isDark ? Colors.white10 : Colors.grey.shade300,
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10), // 12 -> 10
        borderSide: BorderSide(
          color: isDark ? Colors.white10 : Colors.grey.shade300,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10), // 12 -> 10
        borderSide: const BorderSide(color: Colors.indigo, width: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : Colors.black87;

    return Container(
      padding: const EdgeInsets.all(20), // 24 -> 20
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

          // 1. Subject Dropdown
          DropdownButtonFormField<String>(
            value: _selectedSubject,
            items: _subjects.map((s) {
              return DropdownMenuItem(value: s['id'], child: Text(s['label']!));
            }).toList(),
            onChanged: (val) => setState(() => _selectedSubject = val),
            decoration: _inputDecoration("বিষয়", isDark),
            dropdownColor: isDark ? const Color(0xFF121212) : Colors.white,
            style: TextStyle(color: textColor, fontSize: 16),
          ),
          const SizedBox(height: 24),

          // 2. Chapters & Topics
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _chaptersController,
                  style: TextStyle(color: textColor),
                  decoration: _inputDecoration("অধ্যায় (উদাঃ গতি)", isDark),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextField(
                  controller: _topicsController,
                  style: TextStyle(color: textColor),
                  decoration: _inputDecoration("টপিক (ঐচ্ছিক)", isDark),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // 3. Exam Types (Multi-select Chips)
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
                    horizontal: 12, // 16 -> 12
                    vertical: 8, // 12 -> 8
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? (isDark
                              ? const Color(0xFF312E81) // Indigo 900
                              : const Color(0xFFE0E7FF)) // Indigo 100
                        : (isDark ? const Color(0xFF121212) : Colors.white),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? Colors.indigo
                          : (isDark ? Colors.white10 : Colors.grey.shade300),
                      width: isSelected ? 1.5 : 1,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: Colors.indigo.withOpacity(0.2),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : [],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Checkbox visual
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 20,
                        height: 20,
                        margin: const EdgeInsets.only(right: 8),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? Colors.indigo
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(
                            6,
                          ), // Softer corners
                          border: Border.all(
                            color: isSelected
                                ? Colors.indigo
                                : (isDark
                                      ? Colors.grey[600]!
                                      : Colors.grey[400]!),
                            width: 1.5,
                          ),
                        ),
                        child: isSelected
                            ? const Icon(
                                Icons.check,
                                size: 14,
                                color: Colors.white,
                              )
                            : null,
                      ),
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
            items: const [
              DropdownMenuItem(value: 'Mixed', child: Text('মিশ্র (Mixed)')),
              DropdownMenuItem(value: 'Easy', child: Text('সহজ (Easy)')),
              DropdownMenuItem(value: 'Medium', child: Text('মধ্যম (Medium)')),
              DropdownMenuItem(value: 'Hard', child: Text('কঠিন (Hard)')),
            ],
            onChanged: (val) => setState(() => _selectedDifficulty = val!),
            decoration: _inputDecoration("কঠিনতার স্তর", isDark),
            dropdownColor: isDark ? const Color(0xFF121212) : Colors.white,
            style: TextStyle(color: textColor, fontSize: 16),
          ),
          const SizedBox(height: 32),

          // 6. Submit Button
          // 6. Submit Button (Gradient)
          Container(
            height: 48, // 56 -> 48
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient:
                  (widget.isLoading ||
                      _selectedSubject == null ||
                      _selectedExamTypes.isEmpty)
                  ? null
                  : const LinearGradient(
                      colors: [
                        Color(0xFF4F46E5),
                        Color(0xFF4338CA),
                      ], // Indigo 600 -> 700
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
              boxShadow:
                  (widget.isLoading ||
                      _selectedSubject == null ||
                      _selectedExamTypes.isEmpty)
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
              onPressed:
                  (widget.isLoading ||
                      _selectedSubject == null ||
                      _selectedExamTypes.isEmpty)
                  ? null
                  : _handleSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent, // Transparent for Gradient
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
                            fontSize: 16, // 18 -> 16
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
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
