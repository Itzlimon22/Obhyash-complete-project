// File: lib/pages/exam/exam_history_page.dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/exam_types.dart';
import 'result_summary_page.dart';

class ExamHistoryPage extends StatefulWidget {
  final List<ExamResult> history;
  final Function(ExamResult) onViewResult;
  final VoidCallback onClearHistory;
  final Function(String) onRecheckRequest; // id

  const ExamHistoryPage({
    super.key,
    required this.history,
    required this.onViewResult,
    required this.onClearHistory,
    required this.onRecheckRequest,
  });

  @override
  State<ExamHistoryPage> createState() => _ExamHistoryPageState();
}

class _ExamHistoryPageState extends State<ExamHistoryPage> {
  // Filters
  String _filterSubject = '';
  DateTime? _filterDate;
  int _visibleCount = 5;

  // Computed Properties
  List<ExamResult> get _filteredHistory {
    return widget.history
        .where((item) {
          final matchSubject =
              _filterSubject.isEmpty ||
              item.subject.toLowerCase().contains(_filterSubject.toLowerCase());

          final matchDate =
              _filterDate == null ||
              (item.date.year == _filterDate!.year &&
                  item.date.month == _filterDate!.month &&
                  item.date.day == _filterDate!.day);

          return matchSubject && matchDate;
        })
        .toList()
        .reversed
        .toList(); // Newest first
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark
        ? const Color(0xFF000000)
        : const Color(0xFFF8FAFC); // slate-950 : slate-50
    final cardColor = isDark ? const Color(0xFF121212) : Colors.white;

    final displayedHistory = _filteredHistory.take(_visibleCount).toList();
    final hasMore = _visibleCount < _filteredHistory.length;

    // Calc Stats
    final evaluatedExams = _filteredHistory
        .where((h) => h.status == 'evaluated')
        .toList();
    final totalExams = evaluatedExams.length;
    double averageScore = 0;
    if (totalExams > 0) {
      final totalPercent = evaluatedExams.fold(
        0.0,
        (sum, curr) => sum + (curr.score / curr.totalMarks) * 100,
      );
      averageScore = totalPercent / totalExams;
    }

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text("Exam History"),
        backgroundColor: isDark ? const Color(0xFF121212) : Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: isDark ? Colors.white : Colors.black87),
        titleTextStyle: TextStyle(
          color: isDark ? Colors.white : Colors.black87,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.red),
            onPressed: widget.history.isEmpty ? null : widget.onClearHistory,
            tooltip: "Clear History",
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // 1. FILTERS
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.grey.shade200,
                ),
              ),
              child: Column(
                children: [
                  TextField(
                    onChanged: (val) => setState(() {
                      _filterSubject = val;
                      _visibleCount = 5; // Reset pagination
                    }),
                    decoration: InputDecoration(
                      hintText: "Search by Subject...",
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now(),
                      );
                      if (picked != null) {
                        setState(() {
                          _filterDate = picked;
                          _visibleCount = 5;
                        });
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey.shade400),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.calendar_today,
                            size: 20,
                            color: Colors.grey,
                          ),
                          const SizedBox(width: 12),
                          Text(
                            _filterDate == null
                                ? "Filter by Date"
                                : DateFormat('yyyy-MM-dd').format(_filterDate!),
                            style: TextStyle(
                              color: isDark ? Colors.white : Colors.black87,
                            ),
                          ),
                          if (_filterDate != null) ...[
                            const Spacer(),
                            IconButton(
                              icon: const Icon(Icons.clear, size: 20),
                              onPressed: () =>
                                  setState(() => _filterDate = null),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // 2. STATS CARDS
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    "Total Exams",
                    totalExams.toString(),
                    Colors.indigo,
                    isDark,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    "Avg Score",
                    "${averageScore.toStringAsFixed(1)}%",
                    Colors.green,
                    isDark,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // 3. HISTORY LIST
            if (displayedHistory.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 40),
                child: Column(
                  children: [
                    Icon(
                      Icons.history_toggle_off,
                      size: 64,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      "No exams found",
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: displayedHistory.length + (hasMore ? 1 : 0),
                separatorBuilder: (c, i) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  if (index == displayedHistory.length) {
                    return Center(
                      child: TextButton(
                        onPressed: () => setState(() => _visibleCount += 5),
                        child: const Text("Load More"),
                      ),
                    );
                  }
                  return _buildHistoryItem(
                    displayedHistory[index],
                    isDark,
                    cardColor,
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  // --- WIDGET HELPERS ---

  Widget _buildStatCard(
    String label,
    String value,
    MaterialColor color,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF121212) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.grey.shade200,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.analytics, color: color, size: 24),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.grey[400] : Colors.grey[600],
                ),
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryItem(ExamResult item, bool isDark, Color cardColor) {
    final isPending = item.status == 'pending';
    final isRejected = item.status == 'rejected';
    final percentage = (item.score / item.totalMarks) * 100;

    Color scoreColor = Colors.red;
    if (percentage >= 80) {
      scoreColor = Colors.green;
    } else if (percentage >= 50) {
      scoreColor = Colors.orange;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.grey.shade200,
        ),
        boxShadow: [
          if (!isDark)
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
        ],
      ),
      child: Column(
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.subject,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        size: 12,
                        color: Colors.grey.shade500,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        DateFormat('MMM d, yyyy • h:mm a').format(item.date),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              // Status Badge
              if (isPending)
                _buildBadge("Pending", Colors.amber)
              else if (isRejected)
                _buildBadge("Rejected", Colors.red)
              else
                _buildBadge("${percentage.toInt()}%", scoreColor),
            ],
          ),

          const Divider(height: 24),

          // Details Row
          if (isPending)
            const Text(
              "Waiting for manual review...",
              style: TextStyle(
                color: Colors.amber,
                fontStyle: FontStyle.italic,
              ),
            )
          else if (isRejected)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Reason: ${item.rejectionReason ?? 'Unknown'}",
                  style: const TextStyle(color: Colors.red),
                ),
                TextButton.icon(
                  onPressed: () => widget.onRecheckRequest(item.id),
                  icon: const Icon(Icons.refresh, size: 16),
                  label: const Text("Request Recheck"),
                ),
              ],
            )
          else
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildMiniStat(
                  "Score",
                  "${item.score}/${item.totalMarks}",
                  isDark,
                ),
                _buildMiniStat(
                  "Correct",
                  "${item.correctCount}/${item.totalQuestions}",
                  isDark,
                ),
                _buildMiniStat(
                  "Time",
                  "${(item.timeTaken / 60).floor()}m",
                  isDark,
                ),

                ElevatedButton(
                  onPressed: () => widget.onViewResult(item),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark
                        ? Colors.grey[800]
                        : Colors.grey[100],
                    foregroundColor: isDark ? Colors.white : Colors.black87,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                  ),
                  child: const Text("View"),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey.shade500,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.black87,
          ),
        ),
      ],
    );
  }
}
