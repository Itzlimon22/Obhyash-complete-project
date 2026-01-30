// File: lib/pages/exam_history_page.dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart'; // Add intl to pubspec.yaml for date formatting
import '../services/exam_service.dart';
import '../models/exam_types.dart';
import 'exam/result_summary_page.dart'; // To view details

class ExamHistoryPage extends StatefulWidget {
  const ExamHistoryPage({super.key});

  @override
  State<ExamHistoryPage> createState() => _ExamHistoryPageState();
}

class _ExamHistoryPageState extends State<ExamHistoryPage> {
  final ExamService _examService = ExamService();
  bool _isLoading = true;
  List<Map<String, dynamic>> _allExams = [];
  List<Map<String, dynamic>> _filteredExams = [];

  // Filter Controllers
  final TextEditingController _searchController = TextEditingController();
  DateTime? _selectedDate;

  // Stats
  int _totalExams = 0;
  double _averageScore = 0.0;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final data = await _examService.fetchExamHistory();
    if (mounted) {
      setState(() {
        _allExams = data;
        _filteredExams = data;
        _calculateStats();
        _isLoading = false;
      });
    }
  }

  void _calculateStats() {
    if (_filteredExams.isEmpty) {
      _totalExams = 0;
      _averageScore = 0.0;
      return;
    }

    _totalExams = _filteredExams.length;
    double totalPercentage = 0;

    for (var exam in _filteredExams) {
      double score = (exam['score'] as num).toDouble();
      double total = (exam['total_marks'] as num).toDouble();
      if (total > 0) {
        totalPercentage += (score / total) * 100;
      }
    }

    _averageScore = totalPercentage / _totalExams;
  }

  void _filterData(String query) {
    setState(() {
      _filteredExams = _allExams.where((exam) {
        final subject = (exam['subject'] ?? '').toString().toLowerCase();
        final matchesSearch = subject.contains(query.toLowerCase());

        // Date Logic (Optional implementation)
        // final date = DateTime.parse(exam['submitted_at']);
        // final matchesDate = _selectedDate == null || isSameDay(date, _selectedDate);

        return matchesSearch;
      }).toList();
      _calculateStats();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB), // Light Gray Background
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. Header Section
                    _buildHeader(),
                    const SizedBox(height: 24),

                    // 2. Filter Section
                    _buildFilters(),
                    const SizedBox(height: 24),

                    // 3. Stats Cards
                    _buildStatsRow(),
                    const SizedBox(height: 24),

                    // 4. History List
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _filteredExams.length,
                      itemBuilder: (context, index) {
                        return _HistoryCard(
                          data: _filteredExams[index],
                          onTap: () => _navigateToResult(_filteredExams[index]),
                        );
                      },
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "পরীক্ষার ইতিহাস",
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              "আপনার পূর্ববর্তী সকল পরীক্ষার ফলাফল",
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
          ],
        ),
        Row(
          children: [
            OutlinedButton(
              onPressed: () {}, // Clear logic if needed
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.grey[700],
                side: BorderSide(color: Colors.grey[300]!),
              ),
              child: const Text("ইতিহাস মুছুন"),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
              ),
              child: const Text("ফিরে যান"),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFilters() {
    return Row(
      children: [
        Expanded(
          flex: 2,
          child: TextField(
            controller: _searchController,
            onChanged: _filterData,
            decoration: InputDecoration(
              hintText: "বিষয় অনুযায়ী খুঁজুন... (Subject)",
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey[300]!),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey[300]!),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 1,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("mm/dd/yyyy", style: TextStyle(color: Colors.grey)),
                Icon(Icons.calendar_today, size: 16, color: Colors.grey),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatsRow() {
    return Row(
      children: [
        _StatCard(
          title: "মোট পরীক্ষা (মূল্যায়িত)",
          value: "$_totalExams",
          icon: Icons.menu_book,
          color: Colors.blue,
        ),
        const SizedBox(width: 16),
        _StatCard(
          title: "গড় স্কোর (মূল্যায়িত)",
          value: "${_averageScore.toStringAsFixed(0)}%",
          icon: Icons.bolt,
          color: Colors.green,
        ),
      ],
    );
  }

  void _navigateToResult(Map<String, dynamic> item) {
    // Reconstruct ExamResult to reuse the details page
    final result = ExamResult(
      id: item['id'],
      subject: item['subject'] ?? '',
      examType: 'Practice',
      date: DateTime.parse(item['submitted_at']),
      score: (item['score'] as num).toDouble(),
      totalMarks: (item['total_marks'] as num).toDouble(),
      totalQuestions: (item['total_questions'] as num?)?.toInt() ?? 0,
      correctCount: (item['correct_count'] as num).toInt(),
      wrongCount: (item['wrong_count'] as num).toInt(),
      // Load user answers if available
      userAnswers: item['user_answers'] != null
          ? Map<int, int>.from(item['user_answers'])
          : {},
      submissionType: item['submission_type'] ?? 'digital',
      scriptImageData: item['script_r2_url'],
      status: item['status'],
      timeTaken: (item['time_taken'] as num?)?.toInt() ?? 0,
      negativeMarking: (item['negative_marking'] as num?)?.toDouble() ?? 0.0,
    );

    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => ResultSummaryPage(result: result)),
    );
  }
}

// --- Helper Widgets ---

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  final Map<String, dynamic> data;
  final VoidCallback onTap;

  const _HistoryCard({required this.data, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final String subject = data['subject'] ?? 'Unknown';
    final DateTime date = DateTime.parse(data['submitted_at']);
    final double score = (data['score'] as num).toDouble();
    final double total = (data['total_marks'] as num).toDouble();
    final int correct = (data['correct_count'] as num).toInt();
    final bool isOmr = data['submission_type'] == 'script';

    // Calculate percentage for badge color
    double percentage = total > 0 ? (score / total) * 100 : 0;
    Color badgeColor = percentage < 33
        ? Colors.red
        : (percentage < 70 ? Colors.amber : Colors.green);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Left: Subject & Date
              Expanded(
                flex: 3,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          subject,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: badgeColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            "${percentage.toInt()}%",
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: badgeColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.calendar_today,
                          size: 14,
                          color: Colors.grey[500],
                        ),
                        const SizedBox(width: 6),
                        Text(
                          DateFormat('dd MMMM, yyyy  hh:mm a').format(date),
                          style: TextStyle(
                            color: Colors.grey[500],
                            fontSize: 13,
                          ),
                        ),
                        if (isOmr) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              border: Border.all(color: Colors.grey[300]!),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.description_outlined,
                                  size: 12,
                                  color: Colors.grey[600],
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  "OMR Script",
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey[700],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),

              // Middle: Stats
              Expanded(
                flex: 2,
                child: Column(
                  children: [
                    _buildStatItem(
                      "স্কোর",
                      "$score / $total",
                      isBold: true,
                      valueColor: Colors.red,
                    ),
                    // You can add more stats here if needed like time taken
                  ],
                ),
              ),

              Expanded(
                flex: 2,
                child: Column(
                  children: [
                    _buildStatItem("সঠিক", "$correct / $total", isBold: true),
                  ],
                ),
              ),

              // Right: Button
              ElevatedButton(
                onPressed: onTap,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF3F4F6), // Light gray btn
                  foregroundColor: const Color(0xFF4F46E5), // Indigo text
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text("ফলাফল দেখুন"), // View Result
                    SizedBox(width: 4),
                    Icon(Icons.arrow_forward, size: 16),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(
    String label,
    String value, {
    bool isBold = false,
    Color? valueColor,
  }) {
    return Column(
      children: [
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            color: valueColor ?? Colors.black87,
          ),
        ),
      ],
    );
  }
}
