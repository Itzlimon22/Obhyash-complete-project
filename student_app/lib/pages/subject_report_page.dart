import 'package:flutter/material.dart';

class SubjectReportPage extends StatefulWidget {
  final String subjectName; // e.g. "Chemistry" or "Physics"

  const SubjectReportPage({super.key, required this.subjectName});

  @override
  State<SubjectReportPage> createState() => _SubjectReportPageState();
}

class _SubjectReportPageState extends State<SubjectReportPage> {
  // Toggle state for "1st Paper" vs "2nd Paper"
  int _selectedPaper = 1;

  // Mock Data mimicking the screenshot
  // In Phase 5, we will fetch this from Supabase 'exam_results' table
  final List<Map<String, dynamic>> _chapters = [
    {'name': 'গুণগত রসায়ন', 'progress': 0.0},
    {'name': 'মৌলের পর্যায়বৃত্ত ধর্ম', 'progress': 0.0},
    {'name': 'রাসায়নিক পরিবর্তন', 'progress': 0.0},
    {'name': 'পরিবেশ রসায়ন', 'progress': 0.0},
    {'name': 'জৈব যৌগ', 'progress': 0.0},
    {'name': 'পরিমাণগত রসায়ন', 'progress': 0.0},
  ];

  @override
  Widget build(BuildContext context) {
    // Determine if Dark Mode is active
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark
        ? const Color(0xFF000000)
        : const Color(0xFFFAF9F6); // Pure Black
    final cardColor = isDark
        ? const Color(0xFF121212)
        : Colors.white; // Neutral Grey
    final textColor = isDark ? Colors.white : Colors.black87;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        backgroundColor: bgColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: textColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "প্রোগ্রেস/${_translateSubject(widget.subjectName)}",
          style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Chip(
              label: const Text("0 🔥"),
              backgroundColor: Colors.red.withOpacity(0.2),
              labelStyle: const TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // ------------------------------------------------
            // 1. TOP STATS ROW (Chart & Wrong Qs)
            // ------------------------------------------------
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // LEFT CARD: ACCURACY CHART
                Expanded(
                  flex: 5,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: cardColor,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            // Donut Chart
                            SizedBox(
                              width: 80,
                              height: 80,
                              child: Stack(
                                children: [
                                  CircularProgressIndicator(
                                    value: 1.0, // Background ring
                                    color: isDark
                                        ? Colors.grey[800]
                                        : Colors.grey[200],
                                    strokeWidth: 12,
                                  ),
                                  const CircularProgressIndicator(
                                    value: 0.15, // Actual progress (dummy)
                                    color: Colors.orange,
                                    strokeWidth: 12,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 16),
                            // Legend
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "অ্যাকুরেসি",
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: textColor,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                _buildLegendDot("সঠিক", Colors.green),
                                _buildLegendDot("ভুল", Colors.red),
                                _buildLegendDot("স্কিপড", Colors.amber),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Text(
                          "মোট এটেম্পটেড প্রশ্ন",
                          style: TextStyle(
                            color: Colors.grey[500],
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.green,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                "0.0%",
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                            Text(
                              "0/12.8K টি প্রশ্ন",
                              style: TextStyle(
                                color: textColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        LinearProgressIndicator(
                          value: 0.0,
                          backgroundColor: isDark
                              ? Colors.grey[800]
                              : Colors.grey[200],
                          color: Colors.green,
                          minHeight: 6,
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // RIGHT CARD: WRONG QUESTIONS
                Expanded(
                  flex: 4,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: cardColor,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        Text(
                          "ভুল প্রশ্ন",
                          style: TextStyle(
                            color: textColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Paper Toggles
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            _buildPaperToggle(1, "১ম পত্র", isDark),
                            const SizedBox(width: 8),
                            _buildPaperToggle(2, "২য় পত্র", isDark),
                          ],
                        ),
                        const SizedBox(height: 24),
                        // Empty State Image
                        Icon(
                          Icons.assignment_late_outlined,
                          size: 48,
                          color: Colors.blue[200],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          "No Questions Found",
                          style: TextStyle(
                            color: Colors.grey[500],
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // ------------------------------------------------
            // 2. CHAPTER LIST (Expansion Tiles)
            // ------------------------------------------------
            ..._chapters.map(
              (chapter) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: cardColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Theme(
                  data: Theme.of(
                    context,
                  ).copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    collapsedIconColor: Colors.grey,
                    iconColor: Colors.green,
                    title: Text(
                      chapter['name'],
                      style: TextStyle(
                        color: textColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          "0%",
                          style: TextStyle(
                            color: Colors.green.withOpacity(0.7),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.keyboard_arrow_down),
                      ],
                    ),
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        color: isDark ? Colors.black12 : Colors.grey[50],
                        child: const Center(
                          child: Text("অধ্যায়ের বিস্তারিত তথ্য নেই"),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- Helpers ---

  Widget _buildLegendDot(String label, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10)),
        ],
      ),
    );
  }

  Widget _buildPaperToggle(int id, String label, bool isDark) {
    final isSelected = _selectedPaper == id;
    return GestureDetector(
      onTap: () => setState(() => _selectedPaper = id),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? Colors.grey[700] : Colors.grey[300])
              : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.withOpacity(0.3)),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: isSelected
                ? (isDark ? Colors.white : Colors.black)
                : Colors.grey,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  String _translateSubject(String eng) {
    // Simple translation map
    const map = {
      'Physics': 'পদার্থবিজ্ঞান',
      'Chemistry': 'রসায়ন',
      'Math': 'গণিত',
      'Biology': 'জীববিজ্ঞান',
      'ICT': 'আইসিটি',
    };
    return map[eng] ?? eng;
  }
}
