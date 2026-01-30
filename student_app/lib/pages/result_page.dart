// File: lib/pages/result_page.dart
import 'package:flutter/material.dart';

class ResultPage extends StatelessWidget {
  final int score;
  final int total;
  final int wrong;
  final String subject;

  // ✅ New Data Fields
  final List<Map<String, dynamic>> questions;
  final Map<String, String> userAnswers;

  const ResultPage({
    super.key,
    required this.score,
    required this.total,
    required this.wrong,
    required this.subject,
    required this.questions,
    required this.userAnswers,
  });

  @override
  Widget build(BuildContext context) {
    final double percentage = total == 0 ? 0 : (score / total);
    final int accuracy = (percentage * 100).toInt();
    final int skipped = total - (score + wrong);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("Exam Analysis"),
        centerTitle: true,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            // ------------------------------------------------
            // 1. SCORE HEADER (Same as before)
            // ------------------------------------------------
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 150,
                  height: 150,
                  child: CircularProgressIndicator(
                    value: percentage,
                    strokeWidth: 12,
                    backgroundColor: Colors.grey.shade100,
                    color: _getScoreColor(percentage),
                  ),
                ),
                Column(
                  children: [
                    Text(
                      "$accuracy%",
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      "Accuracy",
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Stats Row
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildMiniStat("Correct", "$score", Colors.green),
                  _buildMiniStat("Wrong", "$wrong", Colors.red),
                  _buildMiniStat("Skipped", "$skipped", Colors.orange),
                ],
              ),
            ),

            const SizedBox(height: 32),
            const Divider(thickness: 1),
            const SizedBox(height: 16),

            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                "Detailed Solutions",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 16),

            // ------------------------------------------------
            // 2. SOLUTIONS LIST (The New Part)
            // ------------------------------------------------
            ListView.builder(
              shrinkWrap: true, // Important for scrolling inside ScrollView
              physics: const NeverScrollableScrollPhysics(),
              itemCount: questions.length,
              itemBuilder: (context, index) {
                return _buildSolutionCard(index);
              },
            ),

            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blueAccent,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text("Return to Dashboard"),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget to render a single question solution
  Widget _buildSolutionCard(int index) {
    final q = questions[index];
    final qId = q['id'].toString();
    final userAnswerId = userAnswers[qId];

    // Find correct option safely
    final options = List<dynamic>.from(q['options']);
    final correctOpt = options.firstWhere(
      (o) => o['isCorrect'] == true,
      orElse: () => null,
    );
    final correctId = correctOpt != null ? correctOpt['id'] : '';

    // Status Logic
    bool isSkipped = userAnswerId == null;
    bool isCorrect = userAnswerId == correctId;

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.05),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Question Header
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Q${index + 1}.",
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  q['question'] ?? '',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
              ),
              // Status Badge
              Icon(
                isSkipped
                    ? Icons.remove_circle_outline
                    : (isCorrect ? Icons.check_circle : Icons.cancel),
                color: isSkipped
                    ? Colors.orange
                    : (isCorrect ? Colors.green : Colors.red),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Options List
          ...options.map((opt) {
            final isThisCorrect = opt['id'] == correctId;
            final isThisUserWrong = !isCorrect && opt['id'] == userAnswerId;

            Color bgColor = Colors.transparent;
            Color borderColor = Colors.grey.shade300;
            Color textColor = Colors.black87;
            IconData? icon;

            if (isThisCorrect) {
              bgColor = Colors.green.shade50;
              borderColor = Colors.green;
              textColor = Colors.green.shade900;
              icon = Icons.check;
            } else if (isThisUserWrong) {
              bgColor = Colors.red.shade50;
              borderColor = Colors.red;
              textColor = Colors.red.shade900;
              icon = Icons.close;
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: bgColor,
                border: Border.all(color: borderColor),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Text(
                    "${opt['id'].toString().toUpperCase()}.",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      opt['text'] ?? '',
                      style: TextStyle(color: textColor),
                    ),
                  ),
                  if (icon != null) Icon(icon, size: 16, color: textColor),
                ],
              ),
            );
          }).toList(),

          // Explanation Box (Only if explanation exists)
          if (q['explanation'] != null &&
              q['explanation'].toString().isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.amber.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "💡 Explanation:",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: Colors.amber,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(q['explanation'], style: const TextStyle(fontSize: 14)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  Color _getScoreColor(double percentage) {
    if (percentage >= 0.8) return Colors.green;
    if (percentage >= 0.5) return Colors.orange;
    return Colors.red;
  }
}
