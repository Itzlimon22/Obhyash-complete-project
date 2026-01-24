import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:student_app/main.dart'; // Supabase client
import 'package:student_app/theme.dart'; // Theme & Spacing
import 'package:student_app/widgets/primary_button.dart';
import 'package:student_app/widgets/option_card.dart'; // Our new widget

class ExamPage extends StatefulWidget {
  final String examId;
  const ExamPage({super.key, required this.examId});

  @override
  State<ExamPage> createState() => _ExamPageState();
}

class _ExamPageState extends State<ExamPage> {
  // Data
  List<Map<String, dynamic>> _questions = [];
  bool _isLoading = true;

  // State
  int _currentIndex = 0;
  int? _selectedOptionIndex;
  bool _isSubmitted = false;
  int _score = 0;

  @override
  void initState() {
    super.initState();
    _fetchQuestions();
  }

  Future<void> _fetchQuestions() async {
    final data = await supabase
        .from('questions')
        .select()
        .eq('exam_id', widget.examId);

    setState(() {
      _questions = List<Map<String, dynamic>>.from(data);
      _isLoading = false;
    });
  }

  // ---------------------------------------------------------------------------
  // LOGIC: SUBMIT ANSWER
  // ---------------------------------------------------------------------------
  void _submitAnswer() async {
    if (_selectedOptionIndex == null) return;

    final question = _questions[_currentIndex];
    final correctIndex = question['correct_index'] as int;
    final isCorrect = _selectedOptionIndex == correctIndex;

    setState(() {
      _isSubmitted = true;
      if (isCorrect) _score++;
    });

    // If correct, auto-advance after 1.5 seconds
    if (isCorrect) {
      Future.delayed(const Duration(milliseconds: 1500), _nextQuestion);
    }
  }

  // ---------------------------------------------------------------------------
  // LOGIC: NEXT QUESTION
  // ---------------------------------------------------------------------------
  void _nextQuestion() async {
    if (_currentIndex < _questions.length - 1) {
      setState(() {
        _currentIndex++;
        _selectedOptionIndex = null;
        _isSubmitted = false;
      });
    } else {
      // Exam Finished - Save Score
      await supabase.from('exam_results').insert({
        'user_id': supabase.auth.currentUser!.id,
        'exam_id': widget.examId,
        'score': _score,
      });
      if (mounted) Navigator.pop(context); // Go back to home
    }
  }

  // ---------------------------------------------------------------------------
  // LOGIC: ASK AI (The Premium Feature)
  // ---------------------------------------------------------------------------
  Future<void> _askAI() async {
    final question = _questions[_currentIndex];
    final wrongAnswer = question['options'][_selectedOptionIndex];
    final correctAnswer = question['options'][question['correct_index']];

    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      // ✅ USE YOUR ADMIN URL HERE
      final url = Uri.parse('https://obhyash-admin.vercel.app/api/explain');

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'question': question['question_text'],
          'answer': correctAnswer,
          'wrongAnswer': wrongAnswer,
        }),
      );

      Navigator.pop(context); // Close spinner

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _showAIResponse(data['explanation']);
      } else {
        _showAIResponse("AI is sleeping. Please try again.");
      }
    } catch (e) {
      Navigator.pop(context);
      _showAIResponse("Connection error. Check internet.");
    }
  }

  void _showAIResponse(String text) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.auto_awesome, color: AppTheme.secondary),
                const SizedBox(width: 8),
                Text("AI Teacher", style: Theme.of(ctx).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 16),
            Text(text, style: const TextStyle(fontSize: 16, height: 1.5)),
            const SizedBox(height: 24),
            PrimaryButton(text: "Got it!", onPressed: () => Navigator.pop(ctx)),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // UI BUILDER
  // ---------------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_questions.isEmpty) {
      return const Scaffold(body: Center(child: Text("No questions found.")));
    }

    final question = _questions[_currentIndex];
    final options = List<String>.from(question['options']);
    final correctIndex = question['correct_index'] as int;

    return Scaffold(
      appBar: AppBar(
        title: Text("Question ${_currentIndex + 1}/${_questions.length}"),
        actions: [
          // Current Score Badge
          Center(
            child: Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                "Score: $_score",
                style: const TextStyle(
                  color: AppTheme.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. The Question
            Text(
              question['question_text'],
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: AppSpacing.xl),

            // 2. The Options List
            Expanded(
              child: ListView.builder(
                itemCount: options.length,
                itemBuilder: (context, index) {
                  final isSelected = _selectedOptionIndex == index;
                  final isCorrect = index == correctIndex;
                  // Only show 'Wrong' if submitted AND selected AND it's not the correct one
                  final isWrong = _isSubmitted && isSelected && !isCorrect;

                  return OptionCard(
                    text: options[index],
                    isSelected: isSelected,
                    isCorrect: isCorrect, // Pass true to highlight green
                    isWrong: isWrong, // Pass true to highlight red
                    showResult: _isSubmitted,
                    onTap: () {
                      if (!_isSubmitted) {
                        setState(() => _selectedOptionIndex = index);
                      }
                    },
                  );
                },
              ),
            ),

            // 3. Bottom Actions
            if (!_isSubmitted)
              PrimaryButton(
                text: "Check Answer",
                onPressed: _selectedOptionIndex != null ? _submitAnswer : null,
              )
            else
              Column(
                children: [
                  // Only show AI button if they got it wrong
                  if (_selectedOptionIndex != question['correct_index'])
                    TextButton.icon(
                      onPressed: _askAI,
                      icon: const Icon(
                        Icons.auto_awesome,
                        color: AppTheme.secondary,
                      ),
                      label: const Text(
                        "Explain with AI",
                        style: TextStyle(color: AppTheme.secondary),
                      ),
                    ),
                  const SizedBox(height: 8),
                  PrimaryButton(
                    text: _currentIndex == _questions.length - 1
                        ? "Finish Exam"
                        : "Next Question",
                    onPressed: _nextQuestion,
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
