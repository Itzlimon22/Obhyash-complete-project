// File: lib/pages/result_summary_page.dart
import 'package:flutter/material.dart';
import '../../models/exam_types.dart';
import '../../widgets/exam/latex_text.dart';
import '../../services/print_service.dart';
import '../../services/exam_service.dart'; // ✅ Add this import

class ResultSummaryPage extends StatefulWidget {
  final ExamResult result;
  final VoidCallback? onRestart;

  const ResultSummaryPage({super.key, required this.result, this.onRestart});

  @override
  State<ResultSummaryPage> createState() => _ResultSummaryPageState();
}

class _ResultSummaryPageState extends State<ResultSummaryPage> {
  final PrintService _printService = PrintService();
  final ExamService _examService = ExamService(); // ✅ Service to fetch details

  late Future<List<Question>> _questionsFuture;
  late ExamResult _fullResult; // To hold result with questions

  @override
  void initState() {
    super.initState();
    _fullResult = widget.result;

    // Check if we need to fetch questions (History View Scenario)
    if (widget.result.questions == null || widget.result.questions!.isEmpty) {
      _questionsFuture = _fetchMissingQuestions();
    } else {
      _questionsFuture = Future.value(widget.result.questions);
    }
  }

  // ✅ New Method: Fetch questions if opening from History
  Future<List<Question>> _fetchMissingQuestions() async {
    // We use the same config to fetch questions for this subject
    // In a real app, you might use 'exam_id' to get the EXACT questions.
    // Here we re-fetch by subject as a fallback for the MVP.
    final questions = await _examService.fetchExamQuestions(
      ExamConfig(
        subject: widget.result.subject,
        examType: widget.result.examType ?? 'Daily',
        chapters: 'All', // Defaulting to All
        topics: '', // Defaulting to empty
        difficulty: 'Mixed',
        questionCount: widget.result.totalQuestions,
        durationMinutes: 0, // Corrected parameter name
        negativeMarking: widget.result.negativeMarking,
      ),
    );

    // Update local result object so we can use it
    _fullResult = widget.result.copyWith(questions: questions);
    return questions;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : Colors.black87;

    // Calculate percentages
    final double percentage =
        (widget.result.score / widget.result.totalMarks) * 100;

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF000000)
          : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text("ফলাফল পর্যালোচনা"),
        centerTitle: true,
        backgroundColor: isDark ? const Color(0xFF121212) : Colors.white,
        foregroundColor: textColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close, color: textColor),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // 1. TITLE & DOWNLOAD BUTTONS
            Text(
              "ফলাফল পর্যালোচনা",
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "আপনার পূর্ববর্তী পরীক্ষার বিস্তারিত ফলাফল",
              style: TextStyle(
                fontSize: 14,
                color: isDark ? Colors.grey[400] : Colors.grey[600],
              ),
            ),
            const SizedBox(height: 24),

            // Download Buttons (Same as before)
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      _printService.generateQuestionPaper(_fullResult);
                    },
                    icon: const Icon(Icons.download, size: 18),
                    label: const Text("প্রশ্নপত্র ডাউনলোড"),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      foregroundColor: Colors.indigo,
                      side: BorderSide(color: Colors.indigo.withOpacity(0.3)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      backgroundColor: Colors.indigo.withOpacity(0.05),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      _printService.generateResultPdf(_fullResult);
                    },
                    icon: const Icon(Icons.description, size: 18),
                    label: const Text("ফলাফল ও ব্যাখ্যা"),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      foregroundColor: Colors.indigo,
                      side: BorderSide(color: Colors.indigo.withOpacity(0.3)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      backgroundColor: Colors.indigo.withOpacity(0.05),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // 2. STATS GRID
            _buildStatsGrid(percentage, isDark),
            const SizedBox(height: 32),

            // 3. SUMMARY TABLE
            _buildSummaryDetails(isDark),
            const SizedBox(height: 32),

            // 4. DETAILED REVIEW SECTION HEADER
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "উত্তরপত্র পর্যালোচনা",
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                Row(
                  children: [
                    _buildLegendDot(Colors.green, "সঠিক", isDark),
                    const SizedBox(width: 12),
                    _buildLegendDot(Colors.red, "ভুল", isDark),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ✅ RENDER REVIEW CARDS (With FutureBuilder)
            FutureBuilder<List<Question>>(
              future: _questionsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(
                    child: Text("Error loading questions: ${snapshot.error}"),
                  );
                } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  // Fallback for OMR scripts or if fetch fails
                  return Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.orange),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            "Detailed question data is not available for this exam history.",
                          ),
                        ),
                      ],
                    ),
                  );
                }

                // Render the cards
                return Column(
                  children: snapshot.data!
                      .map((q) => _buildReviewCard(q, isDark))
                      .toList(),
                );
              },
            ),

            const SizedBox(height: 32),

            // 5. RESTART BUTTON
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: widget.onRestart ?? () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back),
                label: const Text("Back to Home"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // ... (Keep the rest of your Helper Widgets: _buildStatsGrid, _buildReviewCard, etc. EXACTLY as they are) ...
  // Paste all your helper functions (_buildLegendDot, _buildStatsGrid, _formatDurationBangla, _buildStatCard, _buildSummaryDetails, _buildDetailRow, _buildReviewCard, _getColorForScore) here.

  Widget _buildLegendDot(Color color, String label, bool isDark) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isDark ? Colors.grey[400] : Colors.grey[700],
          ),
        ),
      ],
    );
  }

  // Matches the Screenshot's Stats Row
  Widget _buildStatsGrid(double percentage, bool isDark) {
    return Row(
      children: [
        // Accuracy
        Expanded(
          child: _buildStatCard(
            isDark: isDark,
            content: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 60,
                  height: 60,
                  child: CircularProgressIndicator(
                    value: percentage / 100,
                    strokeWidth: 6,
                    backgroundColor: Colors.grey[200],
                    color: _getColorForScore(percentage),
                  ),
                ),
                Text(
                  "${percentage.toInt()}%",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
              ],
            ),
            label: "সঠিকতা",
          ),
        ),
        const SizedBox(width: 12),

        // Score
        Expanded(
          child: _buildStatCard(
            isDark: isDark,
            content: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.emoji_events_outlined,
                  color: Colors.indigo,
                  size: 32,
                ),
                const SizedBox(height: 4),
                RichText(
                  text: TextSpan(
                    style: TextStyle(
                      fontFamily:
                          'Bangla', // Assuming font support, otherwise default
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                    children: [
                      TextSpan(
                        text: widget.result.score.toStringAsFixed(2),
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextSpan(
                        text: " /${widget.result.totalMarks.toInt()}",
                        style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            label: "প্রাপ্ত নম্বর",
          ),
        ),
        const SizedBox(width: 12),

        // Time
        Expanded(
          child: _buildStatCard(
            isDark: isDark,
            content: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.access_time, color: Colors.blue, size: 32),
                const SizedBox(height: 8),
                Text(
                  _formatDurationBangla(widget.result.timeTaken),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
              ],
            ),
            label: "সময় লেগেছে",
          ),
        ),
      ],
    );
  }

  String _formatDurationBangla(int seconds) {
    final int min = seconds ~/ 60;
    final int sec = seconds % 60;
    return "$min মি $sec সেকেন্ড";
  }

  Widget _buildStatCard({
    required bool isDark,
    required Widget content,
    required String label,
  }) {
    return Container(
      height: 150,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF121212) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.grey.shade200,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Expanded(child: Center(child: content)),
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: isDark ? Colors.grey[400] : Colors.grey[600],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Matches the Detailed Table Screenshot
  Widget _buildSummaryDetails(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF121212) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.grey.shade200,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              "ফলাফল বিস্তারিত",
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
          ),
          const Divider(height: 1),
          _buildDetailRow(
            "মোট প্রশ্ন",
            "${widget.result.totalQuestions}",
            "সঠিক উত্তর",
            "${widget.result.correctCount}",
            Colors.green,
            isDark,
          ),
          const Divider(height: 1),
          _buildDetailRow(
            "উত্তর দেওয়া হয়েছে",
            "${widget.result.userAnswers?.length ?? 0}",
            "ভুল উত্তর",
            "${widget.result.wrongCount}",
            Colors.red,
            isDark,
          ),
          const Divider(height: 1),
          _buildDetailRow(
            "উত্তর দেওয়া হয়নি",
            "${widget.result.totalQuestions - (widget.result.userAnswers?.length ?? 0)}",
            "নেগেটিভ মার্কিং (0.25x)",
            "-${(widget.result.wrongCount * widget.result.negativeMarking).toStringAsFixed(2)}",
            Colors.redAccent,
            isDark,
          ),
          const Divider(height: 1),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.indigo.withOpacity(0.1)
                  : Colors.indigo.withOpacity(0.05),
              borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(16),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  "মোট প্রাপ্ত নম্বর",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Text(
                  "${widget.result.score.toStringAsFixed(2)} / ${widget.result.totalMarks.toInt()}",
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: Colors.indigo,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(
    String label1,
    String value1,
    String label2,
    String value2,
    Color value2Color,
    bool isDark,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  label1,
                  style: TextStyle(
                    color: isDark ? Colors.grey[300] : Colors.grey[700],
                    fontSize: 13,
                  ),
                ),
                Text(
                  value1,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 32), // Gap between columns
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  label2,
                  style: TextStyle(
                    color: value2Color,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  value2,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: value2Color,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- REVIEW CARD (Mostly same, minor styling tweaks) ---
  Widget _buildReviewCard(Question q, bool isDark) {
    final userAnswer = widget.result.userAnswers?[q.id];
    final isSkipped = userAnswer == null;
    final isCorrect = userAnswer == q.correctAnswerIndex;
    final banglaIndices = ['ক', 'খ', 'গ', 'ঘ'];

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF121212) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.grey.shade200,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? Colors.black26 : Colors.grey[50],
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "প্রশ্ন ${q.id}",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.grey[400] : Colors.grey[600],
                  ),
                ),
                Icon(
                  isSkipped
                      ? Icons.help_outline
                      : (isCorrect ? Icons.check_circle : Icons.cancel),
                  color: isSkipped
                      ? Colors.orange
                      : (isCorrect ? Colors.green : Colors.red),
                  size: 20,
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LatexText(
                  text: q.text,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
                const SizedBox(height: 16),
                ...q.options.asMap().entries.map((entry) {
                  final idx = entry.key;
                  final text = entry.value;
                  final isSelected = userAnswer == idx;
                  final isRealCorrect = q.correctAnswerIndex == idx;

                  Color tileColor = Colors.transparent;
                  Color borderColor = isDark
                      ? Colors.grey[800]!
                      : Colors.grey[300]!;

                  if (isRealCorrect) {
                    tileColor = Colors.green.withOpacity(0.1);
                    borderColor = Colors.green;
                  } else if (isSelected && !isRealCorrect) {
                    tileColor = Colors.red.withOpacity(0.1);
                    borderColor = Colors.red;
                  }

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: tileColor,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: borderColor),
                    ),
                    child: Row(
                      children: [
                        Text(
                          "${banglaIndices[idx % 4]}. ",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.grey[400] : Colors.grey[700],
                          ),
                        ),
                        Expanded(child: LatexText(text: text)),
                      ],
                    ),
                  );
                }),

                // Explanation
                if (q.explanation.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark
                          ? Colors.blue.withOpacity(0.1)
                          : Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border(
                        left: BorderSide(color: Colors.blue, width: 4),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "ব্যাখ্যা:",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ), // Explanation
                        const SizedBox(height: 4),
                        LatexText(text: q.explanation),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getColorForScore(double percentage) {
    if (percentage >= 80) return Colors.green;
    if (percentage >= 50) return Colors.orange;
    return Colors.red;
  }
}
