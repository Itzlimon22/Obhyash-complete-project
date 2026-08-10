import 'package:flutter/material.dart';
import 'package:student_app/theme.dart';

class ProgressCard extends StatefulWidget {
  final String subject;
  final double progress;
  final String correct;
  final String wrong;
  final String skipped;
  final VoidCallback? onViewDetails;

  const ProgressCard({
    super.key,
    required this.subject,
    this.progress = 0,
    this.correct = "0",
    this.wrong = "0",
    this.skipped = "0",
    this.onViewDetails,
  });

  @override
  State<ProgressCard> createState() => _ProgressCardState();
}

class _ProgressCardState extends State<ProgressCard> {
  // ✅ State to track if card is open
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // Determine color based on accuracy
    final int accuracy = (widget.progress * 100).round();
    final Color statusColor = accuracy >= 80 
        ? AppTheme.success 
        : (accuracy >= 50 ? AppTheme.cardLive : Colors.grey);
    final Color badgeBgColor = statusColor.withOpacity(isDark ? 0.2 : 0.1);

    return GestureDetector(
      onTap: () {
        setState(() {
          _isExpanded = !_isExpanded;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.surface : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _isExpanded 
                ? statusColor.withOpacity(0.5) 
                : (isDark ? Colors.white10 : Colors.grey.shade200),
            width: 1,
          ),
          boxShadow: [
            if (_isExpanded && !isDark)
              BoxShadow(
                color: statusColor.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            if (!_isExpanded && !isDark)
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 5,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Column(
          children: [
            // Header Row
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Vertical Color Bar
                  Container(
                    width: 6,
                    height: 32,
                    decoration: BoxDecoration(
                      color: _isExpanded ? statusColor : (isDark ? Colors.grey.shade800 : Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Subject Name
                  Expanded(
                    child: Text(
                      widget.subject,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: _isExpanded ? statusColor : (isDark ? Colors.white : Colors.black87),
                      ),
                    ),
                  ),
                  // Accuracy Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: badgeBgColor,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      "$accuracy%",
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Expand Icon
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: _isExpanded ? badgeBgColor : (isDark ? Colors.grey.shade800 : Colors.grey.shade100),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.keyboard_arrow_down,
                      color: _isExpanded ? statusColor : (isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                      size: 20,
                    ),
                  ),
                ],
              ),
            ),
            
            // Expanded Content
            if (_isExpanded)
              Container(
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(
                      color: isDark ? Colors.white10 : Colors.grey.shade100,
                    ),
                  ),
                  color: isDark ? Colors.black12 : Colors.grey.shade50,
                  borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
                ),
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // Grid of Stats
                    Row(
                      children: [
                        _buildStatBox(context, "সঠিক", widget.correct, AppTheme.success, isDark),
                        const SizedBox(width: 8),
                        _buildStatBox(context, "ভুল", widget.wrong, AppTheme.cardLive, isDark),
                        const SizedBox(width: 8),
                        _buildStatBox(context, "স্কিপড", widget.skipped, AppTheme.cardLive, isDark),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Dual colored progress bar
                    _buildDualProgressBar(),
                    
                    if (widget.onViewDetails != null) ...[
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: widget.onViewDetails,
                          style: OutlinedButton.styleFrom(
                            foregroundColor: statusColor,
                            side: BorderSide(color: isDark ? Colors.white12 : Colors.grey.shade300),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "বিস্তারিত রিপোর্ট দেখো",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white70 : Colors.black87,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Icon(Icons.arrow_forward, size: 16, color: statusColor),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatBox(BuildContext context, String label, String value, Color valueColor, bool isDark) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.surface : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
          boxShadow: [
            if (!isDark)
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Column(
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.grey.shade500 : Colors.grey.shade400,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: valueColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDualProgressBar() {
    int correct = int.tryParse(widget.correct) ?? 0;
    int wrong = int.tryParse(widget.wrong) ?? 0;
    int skipped = int.tryParse(widget.skipped) ?? 0;
    int total = correct + wrong + skipped;
    if (total == 0) total = 1;

    double correctFlex = (correct / total) * 100;
    double wrongFlex = (wrong / total) * 100;

    return Container(
      height: 8,
      width: double.infinity,
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade800 : Colors.grey.shade200,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        children: [
          if (correctFlex > 0)
            Container(
              width: correctFlex * (MediaQuery.of(context).size.width - 64) / 100,
              decoration: BoxDecoration(
                color: AppTheme.success,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          if (wrongFlex > 0)
            Container(
              width: wrongFlex * (MediaQuery.of(context).size.width - 64) / 100,
              decoration: BoxDecoration(
                color: AppTheme.cardLive,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
        ],
      ),
    );
  }
}
