import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

class GkeDoubtsPage extends ConsumerStatefulWidget {
  const GkeDoubtsPage({super.key});

  @override
  ConsumerState<GkeDoubtsPage> createState() => _GkeDoubtsPageState();
}

class _GkeDoubtsPageState extends ConsumerState<GkeDoubtsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _questionController = TextEditingController();
  final TextEditingController _referenceController = TextEditingController();
  String _selectedSubject = 'gk'; // gk or english
  bool _isSubmitting = false;

  final List<_FaqDoubt> _faqs = [
    _FaqDoubt(
      question:
          'বাংলা নামের উৎপত্তি কোন ঐতিহাসিক গ্রন্থ থেকে প্রথম জানা যায় এবং এর প্রেক্ষাপট কী?',
      subject: 'সাধারণ জ্ঞান (GK)',
      answer:
          'আবুল ফজলের রচিত "আইন-ই-আকবরী" গ্রন্থে প্রথম "বাঙ্গালাহ" বা "বাংলা" নামের সুস্পষ্ট উল্লেখ পাওয়া যায়। সুলতানি আমলে শামসুদ্দিন ইলিয়াস শাহ প্রথম সমগ্র বাংলাকে ঐক্যবদ্ধ করে নিজেকে "শাহ-ই-বাঙ্গালাহ" উপাধি ধারণ করেন।',
    ),
    _FaqDoubt(
      question:
          'Causative verb "make" এবং "let"-এর ব্যবহারের পার্থক্য ও সঠিক নিয়ম কী?',
      subject: 'ইংরেজি (English)',
      answer:
          'Causative verb "make" কাউকে দিয়ে কোনো কাজ করানো বোঝায় (compulsion/force) এবং "let" কাউকে কোনো কাজ করার অনুমতি দেওয়া বোঝায় (permission)। উভয় ক্ষেত্রে ব্যক্তিবাচক object থাকলে পরবর্তী verb-টির bare infinitive (base form) বসে, কোনো "to" যোগ হয় না। যেমন: He made me do it / She let me go.',
    ),
    _FaqDoubt(
      question:
          'সংবিধানের কোন অনুচ্ছেদে চিন্তা, বিবেক ও বাক-স্বাধীনতার কথা বলা হয়েছে?',
      subject: 'সাধারণ জ্ঞান (GK)',
      answer:
          'গণপ্রজাতন্ত্রী বাংলাদেশের সংবিধানের ৩য় ভাগে মৌলিক অধিকারের অন্তর্গত অনুচ্ছেদ ৩৯-এ চিন্তা ও বিবেকের স্বাধীনতা এবং বাক ও ভাব প্রকাশের স্বাধীনতার নিশ্চয়তা দেওয়া হয়েছে।',
    ),
    _FaqDoubt(
      question:
          'Neither...nor এবং Either...or যুক্ত বাক্যে verb নির্ধারণের সঠিক নিয়ম কী?',
      subject: 'ইংরেজি (English)',
      answer:
          'Neither...nor কিংবা Either...or দ্বারা দুটি ভিন্ন subject যুক্ত হলে verb সর্বদা তার নিকটবর্তী (closest) subject অনুযায়ী পরিবর্তিত হয়। যেমন: Neither the teacher nor the students were present.',
    ),
    _FaqDoubt(
      question: 'মুজিবনগর সরকার কোন তারিখে গঠিত হয় এবং কোথায় শপথ গ্রহণ করে?',
      subject: 'সাধারণ জ্ঞান (GK)',
      answer:
          '১৯৭১ সালের ১০ এপ্রিল সরকার গঠন ও স্বাধীনতার ঘোষণাপত্র অনুমোদিত হয় এবং ১৭ এপ্রিল মেহেরপুরের বৈদ্যনাথতলার আম্রকাননে (পরবর্তীতে মুজিবনগর) আনুষ্ঠানিকভাবে মন্ত্রিসভার শপথ গ্রহণ অনুষ্ঠিত হয়।',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _questionController.dispose();
    _referenceController.dispose();
    super.dispose();
  }

  void _submitQuestion() {
    final text = _questionController.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('অনুগ্রহ করে আপনার প্রশ্নটি লিখুন।')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _questionController.clear();
          _referenceController.clear();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF004633),
            content: Row(
              children: [
                Icon(LucideIcons.checkCircle, color: Colors.white, size: 20),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'আপনার ডাউট সফলভাবে সাবমিট হয়েছে! আমাদের মেডিকেল মেন্টর টিম দ্রুত উত্তর প্রদান করবেন।',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);
    final cardBg = isDark ? const Color(0xFF13151F) : Colors.white;
    final borderColor = isDark
        ? const Color(0xFF232738)
        : const Color(0xFFE2E8F0);

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF0A0C14)
          : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF13151F) : Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: primaryTextColor, size: 22),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'GKE ডাউট সমাধান ও মেন্টর সাপোর্ট',
          style: TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: primaryTextColor,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: borderColor)),
            ),
            child: TabBar(
              controller: _tabController,
              indicatorColor: const Color(0xFF004633),
              indicatorWeight: 3,
              labelColor: const Color(0xFF004633),
              unselectedLabelColor: secondaryTextColor,
              labelStyle: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 14,
              ),
              tabs: const [
                Tab(text: 'নতুন ডাউট জিজ্ঞাসা'),
                Tab(text: 'সমাধানকৃত ডাউট (FAQ)'),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // ── TAB 1: ASK DOUBT FORM ──
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Info Banner
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF9333EA).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: const Color(0xFF9333EA).withValues(alpha: 0.2),
                    ),
                  ),
                  child: const Row(
                    children: [
                      Icon(
                        LucideIcons.sparkles,
                        color: Color(0xFF9333EA),
                        size: 22,
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'মেডিকেল সাধারণ জ্ঞান ও ইংরেজি নিয়ে যেকোনো প্রশ্ন বা কনফিউশন লিখে পাঠান। অভিজ্ঞ মেন্টরগণ সমাধান দেবেন।',
                          style: TextStyle(fontSize: 12.5, height: 1.35),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 18),

                // Subject Select
                Text(
                  'বিষয় নির্বাচন করুন',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: primaryTextColor,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: _buildSubjectOption(
                        key: 'gk',
                        label: 'সাধারণ জ্ঞান (GK)',
                        icon: LucideIcons.globe,
                        isDark: isDark,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildSubjectOption(
                        key: 'english',
                        label: 'ইংরেজি (English)',
                        icon: LucideIcons.bookOpen,
                        isDark: isDark,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 18),

                // Question Reference
                Text(
                  'পরীক্ষা বা প্রশ্ন নম্বর (ঐচ্ছিক)',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: primaryTextColor,
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _referenceController,
                  decoration: InputDecoration(
                    hintText: 'যেমন: MT-01 প্রশ্ন নম্বর ০৭',
                    hintStyle: TextStyle(
                      fontSize: 13,
                      color: secondaryTextColor,
                    ),
                    filled: true,
                    fillColor: cardBg,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: borderColor),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(
                        color: Color(0xFF004633),
                        width: 1.5,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 18),

                // Question Description
                Text(
                  'আপনার প্রশ্ন বা সমস্যা বিস্তারিত লিখুন',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: primaryTextColor,
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _questionController,
                  maxLines: 5,
                  decoration: InputDecoration(
                    hintText:
                        'আপনার প্রশ্ন ও কোন জায়গায় বুঝতে সমস্যা হচ্ছে তা বিস্তারিত লিখুন...',
                    hintStyle: TextStyle(
                      fontSize: 13,
                      color: secondaryTextColor,
                    ),
                    filled: true,
                    fillColor: cardBg,
                    contentPadding: const EdgeInsets.all(14),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: borderColor),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(
                        color: Color(0xFF004633),
                        width: 1.5,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Submit Button
                SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _submitQuestion,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF004633),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: _isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.send, size: 18),
                              SizedBox(width: 8),
                              Text(
                                'প্রশ্ন সাবমিট করুন',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
              ],
            ),
          ),

          // ── TAB 2: RESOLVED DOUBTS & FAQ ──
          ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: _faqs.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final faq = _faqs[index];
              return Container(
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: borderColor),
                ),
                child: Theme(
                  data: Theme.of(
                    context,
                  ).copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    tilePadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 4,
                    ),
                    childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF004633).withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        LucideIcons.helpCircle,
                        color: Color(0xFF004633),
                        size: 18,
                      ),
                    ),
                    title: Text(
                      faq.question,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: primaryTextColor,
                        height: 1.3,
                      ),
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        faq.subject,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF004633),
                        ),
                      ),
                    ),
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF1E2230)
                              : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(
                              LucideIcons.checkCheck,
                              color: Color(0xFF10B981),
                              size: 16,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                faq.answer,
                                style: TextStyle(
                                  fontSize: 12.5,
                                  color: isDark
                                      ? const Color(0xFFE2E8F0)
                                      : const Color(0xFF334155),
                                  height: 1.45,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectOption({
    required String key,
    required String label,
    required IconData icon,
    required bool isDark,
  }) {
    final isSelected = _selectedSubject == key;
    return GestureDetector(
      onTap: () => setState(() => _selectedSubject = key),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF004633)
              : (isDark ? const Color(0xFF13151F) : Colors.white),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF004633)
                : (isDark ? const Color(0xFF232738) : const Color(0xFFE2E8F0)),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected
                  ? Colors.white
                  : (isDark
                        ? const Color(0xFF94A3B8)
                        : const Color(0xFF64748B)),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: isSelected
                    ? Colors.white
                    : (isDark ? Colors.white : const Color(0xFF0F172A)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FaqDoubt {
  final String question;
  final String subject;
  final String answer;

  _FaqDoubt({
    required this.question,
    required this.subject,
    required this.answer,
  });
}
