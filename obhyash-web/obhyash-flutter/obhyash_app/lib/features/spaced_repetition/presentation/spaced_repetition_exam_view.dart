import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../exam/domain/exam_models.dart';
import '../domain/spaced_repetition_model.dart';
import '../services/spaced_repetition_service.dart';

class SpacedRepetitionExamView extends StatefulWidget {
  const SpacedRepetitionExamView({super.key});

  @override
  State<SpacedRepetitionExamView> createState() => _SpacedRepetitionExamViewState();
}

class _SpacedRepetitionExamViewState extends State<SpacedRepetitionExamView> {
  List<Question> _questions = [];
  int _currentIndex = 0;
  final Map<String, int> _userAnswers = {};
  final Map<String, int> _questionTimes = {};
  
  bool _isLoading = true;
  bool _isSubmitting = false;
  bool _isFinished = false;
  SpacedRepetitionSessionResult? _result;

  int _timeLeft = 600; // 10 minutes = 600 seconds
  Timer? _timer;
  DateTime _questionStartTime = DateTime.now();

  static const Color _emeraldColor = Color(0xFF10B981);

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _loadQuestions() async {
    final qs = await SpacedRepetitionService.getDueQuestions(limit: 10);
    if (!mounted) return;

    if (qs.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('কোনো প্রশ্ন লোড করা যায়নি। পুনরায় চেষ্টা করুন।')),
      );
      Navigator.of(context).pop();
      return;
    }

    setState(() {
      _questions = qs;
      _isLoading = false;
    });

    _startTimer();
    _questionStartTime = DateTime.now();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft <= 1) {
        _timer?.cancel();
        _submitSession();
      } else {
        setState(() {
          _timeLeft--;
        });
      }
    });
  }

  void _recordTime() {
    if (_questions.isEmpty || _currentIndex >= _questions.length) return;
    final qId = _questions[_currentIndex].id;
    final elapsed = DateTime.now().difference(_questionStartTime).inSeconds;
    _questionTimes[qId] = (_questionTimes[qId] ?? 0) + (elapsed > 0 ? elapsed : 1);
    _questionStartTime = DateTime.now();
  }

  void _selectOption(int optionIndex) {
    if (_questions.isEmpty) return;
    final qId = _questions[_currentIndex].id;
    setState(() {
      _userAnswers[qId] = optionIndex;
    });
  }

  void _nextQuestion() {
    _recordTime();
    if (_currentIndex < _questions.length - 1) {
      setState(() {
        _currentIndex++;
      });
    }
  }

  void _prevQuestion() {
    _recordTime();
    if (_currentIndex > 0) {
      setState(() {
        _currentIndex--;
      });
    }
  }

  void _submitSession() async {
    if (_isSubmitting || _isFinished) return;
    _recordTime();
    _timer?.cancel();

    setState(() {
      _isSubmitting = true;
    });

    final List<Map<String, dynamic>> answersPayload = _questions.map((q) {
      final userChoice = _userAnswers[q.id];
      final isCorrect = userChoice == q.correctAnswerIndex;
      return {
        'question_id': q.id,
        'is_correct': isCorrect,
        'time_spent': _questionTimes[q.id] ?? 25,
      };
    }).toList();

    final res = await SpacedRepetitionService.submitSession(answers: answersPayload);

    if (mounted) {
      setState(() {
        _isSubmitting = false;
        _isFinished = true;
        _result = res;
      });
    }
  }

  String _formatTimer(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.x, color: Colors.white70),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.purple.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(LucideIcons.brain, color: Colors.purpleAccent, size: 18),
            ),
            const SizedBox(width: 8),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ডেইলি মেমোরি রিভিশন',
                  style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Leitner SM-2 • ১০টি প্রশ্ন',
                  style: TextStyle(color: Colors.white54, fontSize: 10),
                ),
              ],
            ),
          ],
        ),
        actions: [
          if (!_isFinished && !_isLoading)
            Padding(
              padding: const EdgeInsets.only(right: 14),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _timeLeft <= 60
                        ? Colors.red.withOpacity(0.2)
                        : Colors.purple.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: _timeLeft <= 60 ? Colors.redAccent : Colors.purpleAccent.withOpacity(0.4),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        LucideIcons.clock,
                        size: 14,
                        color: _timeLeft <= 60 ? Colors.redAccent : Colors.purpleAccent,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _formatTimer(_timeLeft),
                        style: TextStyle(
                          color: _timeLeft <= 60 ? Colors.redAccent : Colors.purpleAccent,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Colors.purpleAccent),
                  SizedBox(height: 14),
                  Text('স্মৃতি রিভিশন প্রশ্ন প্রস্তুত হচ্ছে...', style: TextStyle(color: Colors.white70)),
                ],
              ),
            )
          : _isFinished && _result != null
              ? _buildCompletionScreen()
              : _buildQuestionScreen(),
    );
  }

  Widget _buildQuestionScreen() {
    final q = _questions[_currentIndex];
    final progress = (_currentIndex + 1) / _questions.length;

    return Column(
      children: [
        // Progress Bar
        LinearProgressIndicator(
          value: progress,
          backgroundColor: Colors.white10,
          valueColor: const AlwaysStoppedAnimation<Color>(Colors.purpleAccent),
          minHeight: 4,
        ),

        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header Question Counter
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'প্রশ্ন ${_currentIndex + 1} / ${_questions.length}',
                      style: const TextStyle(color: Colors.purpleAccent, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.06),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        q.subject,
                        style: const TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Question Box
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withOpacity(0.08)),
                  ),
                  child: Text(
                    q.question,
                    style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.5, fontWeight: FontWeight.w500),
                  ),
                ),
                const SizedBox(height: 16),

                // Options
                ...List.generate(q.options.length, (optIdx) {
                  final isSelected = _userAnswers[q.id] == optIdx;
                  final prefix = String.fromCharCode(65 + optIdx);

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: InkWell(
                      onTap: () => _selectOption(optIdx),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? Colors.purple.withOpacity(0.2) : const Color(0xFF1E293B).withOpacity(0.6),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? Colors.purpleAccent : Colors.white.withOpacity(0.06),
                            width: isSelected ? 1.5 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 26,
                              height: 26,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: isSelected ? Colors.purpleAccent : Colors.white10,
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                prefix,
                                style: TextStyle(
                                  color: isSelected ? Colors.white : Colors.white70,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                q.options[optIdx],
                                style: TextStyle(
                                  color: isSelected ? Colors.white : Colors.white70,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),

        // Navigation Footer
        Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            color: Color(0xFF1E293B),
            border: Border(top: BorderSide(color: Colors.white10)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton.icon(
                onPressed: _currentIndex > 0 ? _prevQuestion : null,
                icon: const Icon(LucideIcons.arrowLeft, size: 16),
                label: const Text('Previous'),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.white70,
                  disabledForegroundColor: Colors.white24,
                ),
              ),
              if (_currentIndex == _questions.length - 1)
                ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _submitSession,
                  icon: const Icon(LucideIcons.checkCircle2, size: 16),
                  label: Text(_isSubmitting ? 'জমা হচ্ছে...' : 'রিভিশন জমা দিন'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.purpleAccent,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                )
              else
                ElevatedButton.icon(
                  onPressed: _nextQuestion,
                  icon: const Icon(LucideIcons.arrowRight, size: 16),
                  label: const Text('Next'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.purpleAccent,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCompletionScreen() {
    final res = _result!;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 10),
          Center(
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: res.isPerfectScore ? Colors.amber.withOpacity(0.2) : Colors.purple.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(
                res.isPerfectScore ? LucideIcons.award : LucideIcons.checkCircle2,
                color: res.isPerfectScore ? Colors.amber : Colors.purpleAccent,
                size: 48,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            res.isPerfectScore ? '🌟 পারফেক্ট মেমোরি স্কোর!' : '🎉 আজকের রিভিশন সম্পন্ন!',
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600, fontFamily: 'Anek Bangla'),
          ),
          const SizedBox(height: 4),
          const Text(
            'আপনার ফলাফল মেমোরি বক্সে প্রসেস করা হয়েছে।',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white54, fontSize: 12.5, fontFamily: 'HindSiliguri'),
          ),
          const SizedBox(height: 20),

          // Score Summary Cards
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      const Text('SCORE', style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('${res.correctCount}/${res.totalAnswered}', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      const Text('ACCURACY', style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('${res.accuracy.toStringAsFixed(0)}%', style: const TextStyle(color: _emeraldColor, fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.purple.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.purpleAccent.withOpacity(0.3)),
                  ),
                  child: Column(
                    children: [
                      const Text('EARNED XP', style: TextStyle(color: Colors.purpleAccent, fontSize: 10, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('+${res.xpEarned}', style: const TextStyle(color: Colors.purpleAccent, fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Perfect Score Mystery Gift
          if (res.isPerfectScore)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.15),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.amber.withOpacity(0.4)),
              ),
              child: const Row(
                children: [
                  Icon(LucideIcons.gift, color: Colors.amber, size: 28),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('🎁 Special Perfect Score Gift', style: TextStyle(color: Colors.amber, fontSize: 12, fontWeight: FontWeight.bold)),
                        SizedBox(height: 2),
                        Text('Memory Champion Bonus (+100 XP ও স্ক্র্যাচ কার্ড আনলকড!)', style: TextStyle(color: Colors.white, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 16),

          // 5-Box Level Updates
          if (res.statsAfter != null)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Leitner 5-Box মেমোরি আপডেট', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                      if (res.promotedCount > 0)
                        Text('🚀 ${res.promotedCount}টি প্রশ্ন প্রমোটেড', style: const TextStyle(color: _emeraldColor, fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMiniBox('Box 1', '1d', res.statsAfter!.box1Count),
                      _buildMiniBox('Box 2', '3d', res.statsAfter!.box2Count),
                      _buildMiniBox('Box 3', '7d', res.statsAfter!.box3Count),
                      _buildMiniBox('Box 4', '14d', res.statsAfter!.box4Count),
                      _buildMiniBox('Mastered 🏆', '30d', res.statsAfter!.box5Count, isMastered: true),
                    ],
                  ),
                ],
              ),
            ),

          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.purpleAccent,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('ড্যাশবোর্ডে ফিরে যান', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniBox(String name, String interval, int count, {bool isMastered = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
      decoration: BoxDecoration(
        color: isMastered ? Colors.amber.withOpacity(0.1) : Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: isMastered ? Colors.amber.withOpacity(0.3) : Colors.white10),
      ),
      child: Column(
        children: [
          Text(interval, style: const TextStyle(color: Colors.white38, fontSize: 9)),
          const SizedBox(height: 2),
          Text(name, style: TextStyle(color: isMastered ? Colors.amber : Colors.white70, fontSize: 10, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text('$count', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
