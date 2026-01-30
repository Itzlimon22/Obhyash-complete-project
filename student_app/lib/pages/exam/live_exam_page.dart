// File: lib/pages/exam/live_exam_page.dart
import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/exam_types.dart';
import '../../services/exam_service.dart';
import '../../services/print_service.dart'; // ✅ Added PrintService
import '../../widgets/exam/question_card.dart';
import '../../widgets/exam/exam_header.dart'; // ✅ Using the new Header
import '../../widgets/exam/question_palette.dart';
import 'result_summary_page.dart';
import 'instructions_page.dart';
import 'script_uploader_page.dart';
import '../../widgets/exam/timeout_modal.dart';
import '../../widgets/skeleton_loader.dart';

class LiveExamPage extends StatefulWidget {
  final ExamConfig config;

  const LiveExamPage({super.key, required this.config});

  @override
  State<LiveExamPage> createState() => _LiveExamPageState();
}

class _LiveExamPageState extends State<LiveExamPage> {
  // --- Services & State ---
  final ExamService _examService = ExamService();
  final PrintService _printService = PrintService(); // ✅ Service for downloads
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // Data
  AppState _appState = AppState.loading;
  List<Question> _questions = [];
  Map<int, int> _userAnswers = {}; // {questionId: optionIndex}
  Set<int> _flaggedQuestions = {};

  // OMR State
  bool _isOmrMode = false;
  String? _uploadedScriptData; // Base64 string

  // UI State
  bool _isDarkMode = false; // Local state for header toggle

  // Scroll Controller
  final ScrollController _scrollController = ScrollController();
  final Map<int, GlobalKey> _questionKeys = {};

  // Timer
  Timer? _timer;
  int _timeLeftSeconds = 0;
  int _timeTakenSeconds = 0;

  @override
  void initState() {
    super.initState();
    _startExamFlow();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  // --- LOGIC ---

  Future<void> _startExamFlow() async {
    try {
      final questions = await _examService.fetchExamQuestions(widget.config);

      for (var q in questions) {
        _questionKeys[q.id] = GlobalKey();
      }

      if (mounted) {
        setState(() {
          _questions = questions;
          _timeLeftSeconds = widget.config.durationMinutes * 60;
          _appState = AppState.instructions;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _appState = AppState.error);
        debugPrint("Error starting exam: $e");
      }
    }
  }

  void _beginActualExam() {
    setState(() {
      _appState = AppState.active;
    });
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeftSeconds > 0) {
        setState(() {
          _timeLeftSeconds--;
          _timeTakenSeconds++;
        });
      } else {
        _timer?.cancel();
        _showTimeoutModal();
      }
    });
  }

  void _showTimeoutModal() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => TimeoutModal(
        onReattempt: () {
          Navigator.pop(context);
          _restartExam();
        },
        onCancel: () {
          Navigator.pop(context);
          Navigator.pop(context);
        },
      ),
    );
  }

  void _restartExam() {
    setState(() {
      _userAnswers.clear();
      _flaggedQuestions.clear();
      _timeLeftSeconds = widget.config.durationMinutes * 60;
      _timeTakenSeconds = 0;
      _isOmrMode = false;
      _uploadedScriptData = null;
    });
    _startTimer();
  }

  Future<void> _handleUpload() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const ScriptUploaderPage()),
    );

    if (result != null && result is String) {
      setState(() {
        _uploadedScriptData = result;
        _isOmrMode = true; // Auto-enable OMR mode on upload
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("OMR Script Uploaded Successfully!")),
      );
    }
  }

  // ✅ New: Download Question Paper (Matches React Prop)
  Future<void> _handleDownloadQuestionPaper() async {
    final details = ExamDetails(
      subject: widget.config.subject,
      examType: widget.config.examType,
      chapters: widget.config.chapters,
      topics: widget.config.topics,
      totalQuestions: _questions.length,
      durationMinutes: widget.config.durationMinutes,
      totalMarks: _questions.fold(0, (sum, q) => sum + q.points),
      negativeMarking: widget.config.negativeMarking,
    );

    await _printService.printQuestionPaper(details, _questions);
  }

  void _submitExam() {
    _timer?.cancel();

    double score = 0;
    int correct = 0;
    int wrong = 0;

    if (!_isOmrMode) {
      for (var q in _questions) {
        final selected = _userAnswers[q.id];
        if (selected != null) {
          if (selected == q.correctAnswerIndex) {
            score += q.points;
            correct++;
          } else {
            score -= widget.config.negativeMarking;
            wrong++;
          }
        }
      }
    }

    final result = ExamResult(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      subject: widget.config.subject,
      examType: widget.config.examType,
      date: DateTime.now(),
      score: _isOmrMode ? 0 : (score < 0 ? 0 : score),
      totalMarks: _questions.fold(0, (sum, q) => sum + q.points),
      totalQuestions: _questions.length,
      correctCount: _isOmrMode ? 0 : correct,
      wrongCount: _isOmrMode ? 0 : wrong,
      timeTaken: _timeTakenSeconds,
      negativeMarking: widget.config.negativeMarking,
      questions: _questions,
      userAnswers: _userAnswers,
      submissionType: _isOmrMode ? 'script' : 'digital',
      scriptImageData: _uploadedScriptData,
      status: _isOmrMode ? 'pending' : 'evaluated',
    );

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => ResultSummaryPage(result: result)),
    );
  }

  void _scrollToQuestion(int questionId) {
    final key = _questionKeys[questionId];
    if (key?.currentContext != null) {
      Scrollable.ensureVisible(
        key!.currentContext!,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
        alignment: 0.1,
      );
    }
  }

  void _onOptionSelected(int questionId, int optionIndex) {
    if (_isOmrMode) return;
    setState(() {
      _userAnswers[questionId] = optionIndex;
    });
  }

  void _onToggleFlag(int questionId) {
    setState(() {
      if (_flaggedQuestions.contains(questionId)) {
        _flaggedQuestions.remove(questionId);
      } else {
        _flaggedQuestions.add(questionId);
      }
    });
  }

  // --- BUILD ---

  @override
  Widget build(BuildContext context) {
    // We use local state _isDarkMode if set, else system
    // In a real app, this would toggle a global ThemeProvider
    final systemDark = Theme.of(context).brightness == Brightness.dark;
    final isDark = _isDarkMode || systemDark;

    final width = MediaQuery.of(context).size.width;
    final isDesktop = width > 900;

    // 1. Loading
    if (_appState == AppState.loading) {
      return Scaffold(
        backgroundColor: isDark
            ? const Color(0xFF000000)
            : const Color(0xFFFAF9F6),
        body: const SkeletonLoader(),
      );
    }

    // 2. Error
    if (_appState == AppState.error) {
      return Scaffold(
        appBar: AppBar(title: const Text("Error")),
        body: const Center(child: Text("Failed to load exam.")),
      );
    }

    // 3. Instructions
    if (_appState == AppState.instructions) {
      return InstructionsPage(
        details: ExamDetails(
          subject: widget.config.subject,
          examType: widget.config.examType,
          chapters: widget.config.chapters,
          topics: widget.config.topics,
          totalQuestions: _questions.length,
          durationMinutes: widget.config.durationMinutes,
          totalMarks: _questions.fold(0, (sum, q) => sum + q.points),
          negativeMarking: widget.config.negativeMarking,
        ),
        onStart: _beginActualExam,
        onBack: () => Navigator.pop(context),
      );
    }

    // --- 4. ACTIVE EXAM UI ---

    final paletteWidget = QuestionPalette(
      questions: _questions,
      userAnswers: _userAnswers,
      flaggedQuestions: _flaggedQuestions,
      onQuestionClick: (id) {
        if (!isDesktop) Navigator.pop(context);
        _scrollToQuestion(id);
      },
    );

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: isDark
          ? const Color(0xFF0F172A)
          : const Color(0xFFFAF9F6),

      // ✅ Custom Header placement (No AppBar)
      body: SafeArea(
        child: Column(
          children: [
            // 1. HEADER
            ExamHeader(
              subject: widget.config.subject,
              timeLeft: _timeLeftSeconds,
              isOmrMode: _isOmrMode,
              isDarkMode: isDark,
              // ✅ OMR Toggle Logic
              onToggleOmr: () {
                setState(() => _isOmrMode = !_isOmrMode);
              },
              // ✅ Theme Toggle Logic
              onToggleTheme: () {
                setState(() => _isDarkMode = !_isDarkMode);
              },
              // ✅ Mobile Drawer Logic
              onOpenDrawer: !isDesktop
                  ? () => _scaffoldKey.currentState?.openDrawer()
                  : null,
            ),

            // 2. MAIN CONTENT AREA
            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Left: Questions List
                  Expanded(
                    flex: 3,
                    child: Column(
                      children: [
                        // OMR Info Banner
                        if (_isOmrMode)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                              vertical: 12,
                              horizontal: 16,
                            ),
                            color: Colors.blue.withOpacity(0.1),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.camera_alt,
                                  color: Colors.blue,
                                ),
                                const SizedBox(width: 12),
                                const Expanded(
                                  child: Text(
                                    "OMR Mode Active. Upload script image to submit.",
                                    style: TextStyle(
                                      color: Colors.blue,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                TextButton.icon(
                                  onPressed: _handleDownloadQuestionPaper,
                                  icon: const Icon(Icons.download, size: 16),
                                  label: const Text("Question Paper"),
                                ),
                              ],
                            ),
                          ),

                        Expanded(
                          child: Center(
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(maxWidth: 800),
                              child: ListView.builder(
                                controller: _scrollController,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 24,
                                ),
                                itemCount: _questions.length + 1,
                                itemBuilder: (context, index) {
                                  if (index == 0)
                                    return _buildExamDetailsCard(isDark);

                                  final qIndex = index - 1;
                                  final q = _questions[qIndex];
                                  return Container(
                                    key: _questionKeys[q.id],
                                    padding: const EdgeInsets.only(bottom: 16),
                                    child: IgnorePointer(
                                      ignoring:
                                          _isOmrMode, // Disable clicks in OMR mode
                                      child: Opacity(
                                        opacity: _isOmrMode ? 0.6 : 1.0,
                                        child: QuestionCard(
                                          question: q,
                                          selectedOptionIndex:
                                              _userAnswers[q.id],
                                          isFlagged: _flaggedQuestions.contains(
                                            q.id,
                                          ),
                                          onSelectOption: (idx) =>
                                              _onOptionSelected(q.id, idx),
                                          onToggleFlag: () =>
                                              _onToggleFlag(q.id),
                                          onReport: () {},
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Right: Palette (Desktop Only)
                  if (isDesktop)
                    Expanded(
                      flex: 1,
                      child: Container(
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF1E293B)
                              : Colors.white,
                          border: Border(
                            left: BorderSide(
                              color: Colors.grey.withOpacity(0.2),
                            ),
                          ),
                        ),
                        padding: const EdgeInsets.all(16),
                        child: paletteWidget,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),

      // Left-side Drawer (Mobile)
      drawer: isDesktop
          ? null
          : Drawer(
              width: 300,
              backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: paletteWidget,
                ),
              ),
            ),

      // Bottom Bar
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          border: Border(top: BorderSide(color: Colors.grey.withOpacity(0.2))),
        ),
        child: SafeArea(
          child: Row(
            children: [
              OutlinedButton.icon(
                onPressed: _handleUpload,
                icon: const Icon(Icons.upload_file),
                label: const Text("আপলোড (Upload)"),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  side: BorderSide(color: Colors.grey.shade400),
                  foregroundColor: isDark ? Colors.white : Colors.black87,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: () => _showSubmitConfirmation(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  "জমা দিন (Submit)",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExamDetailsCard(bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.grey.shade200,
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.config.subject,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "Exam Type: ${widget.config.examType}",
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark ? Colors.grey[400] : Colors.grey[600],
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.indigo.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.school, color: Colors.indigo, size: 28),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Divider(),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildDetailItem(
                Icons.timer_outlined,
                "${widget.config.durationMinutes} Min",
                "Duration",
                isDark,
              ),
              _buildDetailItem(
                Icons.list_alt,
                _questions.length.toString(),
                "Questions",
                isDark,
              ),
              _buildDetailItem(
                Icons.star_outline,
                _questions.fold(0.0, (s, q) => s + q.points).toString(),
                "Marks",
                isDark,
              ),
              _buildDetailItem(
                Icons.remove_circle_outline,
                "-${widget.config.negativeMarking}",
                "Neg. Mark",
                isDark,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDetailItem(
    IconData icon,
    String value,
    String label,
    bool isDark,
  ) {
    return Column(
      children: [
        Icon(
          icon,
          size: 20,
          color: isDark ? Colors.grey[400] : Colors.grey[600],
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.black87,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isDark ? Colors.grey[500] : Colors.grey[500],
          ),
        ),
      ],
    );
  }

  void _showSubmitConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("পরীক্ষা জমা দিন"),
        content: Text(
          _isOmrMode
              ? "আপনি একটি OMR স্ক্রিপ্ট আপলোড করেছেন। এটি জমা দিতে চান?"
              : "আপনি ${_userAnswers.length} টি প্রশ্নের উত্তর দিয়েছেন। আপনি কি নিশ্চিত যে আপনি জমা দিতে চান?",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("বাতিল"),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _submitExam();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text("জমা দিন"),
          ),
        ],
      ),
    );
  }
}
