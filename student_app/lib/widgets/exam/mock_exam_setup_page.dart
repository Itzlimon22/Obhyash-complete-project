// File: lib/pages/exam/mock_exam_setup_page.dart
import 'package:flutter/material.dart';
import '../../widgets/exam/exam_setup_form.dart';
import '../../pages/exam/live_exam_page.dart';
import '../../models/exam_types.dart';

class MockExamSetupPage extends StatefulWidget {
  const MockExamSetupPage({super.key});

  @override
  State<MockExamSetupPage> createState() => _MockExamSetupPageState();
}

class _MockExamSetupPageState extends State<MockExamSetupPage> {
  bool _isLoading = false;

  void _handleStartExam(ExamConfig config) async {
    setState(() {
      _isLoading = true;
    });

    // Simulate a brief delay for UX (showing the "Preparing..." spinner)
    // In a real app, you might pre-fetch questions here to ensure they exist before navigating
    await Future.delayed(const Duration(milliseconds: 1500));

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    // Navigate to the Live Exam
    // We use pushReplacement so the user can't press "Back" to return to the setup screen while the exam is running
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => LiveExamPage(config: config)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      // Use a slightly off-white/dark background to make the white Form card pop
      backgroundColor: isDark
          ? const Color(0xFF000000)
          : const Color(0xFFF1F5F9), // slate-900 : slate-100
      appBar: AppBar(
        title: const Text("Mock Exam Setup"),
        backgroundColor: isDark ? const Color(0xFF121212) : Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: isDark ? Colors.white : Colors.black87),
        titleTextStyle: TextStyle(
          color: isDark ? Colors.white : Colors.black87,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(
              maxWidth: 800,
            ), // Limit width on tablets/web
            child: ExamSetupForm(
              isLoading: _isLoading,
              onStartExam: _handleStartExam,
            ),
          ),
        ),
      ),
    );
  }
}
