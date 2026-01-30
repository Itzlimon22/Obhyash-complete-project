import 'package:flutter/material.dart';
import '../../models/exam_types.dart'; // Adjust import path as needed

class InstructionsPage extends StatelessWidget {
  final ExamDetails details;
  final VoidCallback onStart;
  final VoidCallback onBack;

  const InstructionsPage({
    super.key,
    required this.details,
    required this.onStart,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    // Theme Checks
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // Colors matching the Tailwind classes
    final bgColor = Colors.transparent; // min-h-screen bg-transparent
    final cardColor = isDark ? const Color(0xFF0F172A) : Colors.white; // bg-white dark:bg-slate-900
    final borderColor = isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0); // border-slate-200 dark:border-slate-800
    
    final headerBg = isDark ? const Color(0xFF1E293B) : const Color(0xFF0F172A); // bg-slate-900 dark:bg-slate-800
    final headerText = Colors.white;
    final subTextHeader = isDark ? const Color(0xFF94A3B8) : const Color(0xFFCBD5E1); // slate-300 dark:text-slate-400

    return Scaffold(
      backgroundColor: isDark ? Colors.black : const Color(0xFFF1F5F9), // Fallback bg for scaffold
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 768), // max-w-3xl
            decoration: BoxDecoration(
              color: cardColor,
              borderRadius: BorderRadius.circular(8), // rounded-lg
              border: Border.all(color: borderColor),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 2,
                  offset: const Offset(0, 1),
                )
              ],
            ),
            clipBehavior: Clip.antiAlias, // overflow-hidden
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // --- Header ---
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20), // px-5 py-5
                  color: headerBg,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "নির্দেশাবলী",
                        style: TextStyle(
                          fontSize: 24, // text-xl md:text-2xl
                          fontWeight: FontWeight.bold,
                          color: headerText,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "অনুগ্রহ করে পরীক্ষা শুরু করার আগে নিয়মাবলী ভালো করে পড়ে নিন।",
                        style: TextStyle(
                          fontSize: 16, // text-base md:text-lg
                          color: subTextHeader,
                        ),
                      ),
                    ],
                  ),
                ),

                // --- Content ---
                Padding(
                  padding: const EdgeInsets.all(20), // p-5 md:p-8
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Grid Stats
                      LayoutBuilder(
                        builder: (context, constraints) {
                          // Responsive Grid: 1 col on mobile, 2 on desktop
                          final isWide = constraints.maxWidth > 600;
                          return Wrap(
                            spacing: 16, // gap-4
                            runSpacing: 16,
                            children: [
                              _buildStatCard("বিষয়", details.subject, isDark, isWide),
                              _buildStatCard("সময়", "${details.durationMinutes} মিনিট", isDark, isWide),
                              _buildStatCard("মোট প্রশ্ন", "${details.totalQuestions}", isDark, isWide),
                              _buildStatCard("মোট নম্বর", "${details.totalMarks.toInt()}", isDark, isWide),
                            ],
                          );
                        },
                      ),
                      
                      const SizedBox(height: 32), // mb-8

                      // Rules Title
                      Text(
                        "নিয়মাবলী:",
                        style: TextStyle(
                          fontSize: 20, // text-lg md:text-xl
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : const Color(0xFF1E293B), // slate-800
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Rules List
                      _buildRuleItem("পরীক্ষা শুরু করুন বাটনে ক্লিক করার সাথে সাথে টাইমার শুরু হয়ে যাবে।", isDark),
                      _buildRuleItem("পরবর্তীতে দেখার জন্য আপনি প্রশ্ন বুকমার্ক করে রাখতে পারেন।", isDark),
                      _buildRuleItem("ব্রাউজার রিফ্রেশ বা উইন্ডো বন্ধ করবেন না, এতে আপনার প্রোগ্রেস হারিয়ে যেতে পারে।", isDark),
                      _buildRuleItem("সব প্রশ্নের উত্তর দেওয়া শেষ হলে জমা দিন বাটনে ক্লিক করুন। সময় শেষ হলে অটোমেটিক জমা হয়ে যাবে।", isDark),

                      const SizedBox(height: 24),
                      Divider(color: borderColor),
                      const SizedBox(height: 24),

                      // Buttons
                      Flex(
                        direction: Axis.horizontal,
                        // Mobile: Column-reverse logic handles via ordering, here simplified to Row for simplicity
                        // or recreate the flex-col-reverse logic:
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: onBack,
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                side: BorderSide(color: isDark ? const Color(0xFF475569) : const Color(0xFFCBD5E1)),
                                foregroundColor: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text("বাতিল করুন", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            flex: 2, // Make start button wider
                            child: ElevatedButton(
                              onPressed: onStart,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                backgroundColor: const Color(0xFF4F46E5), // indigo-600
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                elevation: 1,
                              ),
                              child: const Text(
                                "আমি নিয়মাবলী পড়েছি। পরীক্ষা শুরু করুন।",
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, bool isDark, bool isWide) {
    // Width calculation for responsive grid
    final width = isWide ? 340.0 : double.infinity; 

    return Container(
      width: width, // grid-cols-1 md:grid-cols-2 simulation
      padding: const EdgeInsets.all(16), // p-4 md:p-5
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC), // bg-slate-50 dark:bg-slate-800
        borderRadius: BorderRadius.circular(6), // rounded-md
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0), // border-slate-200
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), // text-slate-500
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 18, // text-lg
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white : const Color(0xFF0F172A), // text-slate-900
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRuleItem(String text, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12), // space-y-3
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Icon(
              Icons.check_circle_outline, // Using check circle to mimic path
              size: 20,
              color: isDark ? const Color(0xFF818CF8) : const Color(0xFF4F46E5), // text-indigo-600
            ),
          ),
          const SizedBox(width: 12),
          // Text
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 15,
                height: 1.4,
                color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155), // text-slate-700
              ),
            ),
          ),
        ],
      ),
    );
  }
}