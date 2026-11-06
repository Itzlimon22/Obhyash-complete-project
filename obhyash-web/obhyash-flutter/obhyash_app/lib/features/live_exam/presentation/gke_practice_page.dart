import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';

class GkePracticePage extends ConsumerStatefulWidget {
  final String? initialCategory;

  const GkePracticePage({super.key, this.initialCategory});

  @override
  ConsumerState<GkePracticePage> createState() => _GkePracticePageState();
}

class _GkePracticePageState extends ConsumerState<GkePracticePage> {
  String _selectedFilter = 'all';

  static String _toBanglaDigits(dynamic number) {
    const en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    String s = number.toString();
    for (int i = 0; i < 10; i++) {
      s = s.replaceAll(en[i], bn[i]);
    }
    return s;
  }

  @override
  void initState() {
    super.initState();
    if (widget.initialCategory != null) {
      _selectedFilter = widget.initialCategory!;
    }
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

    final practiceSets = [
      _PracticeItem(
        id: 'gke_practice_bangladesh',
        title:
            'বাংলাদেশ বিষয়াবলী প্র্যাকটিস টেস্ট (ইতিহাস, মুক্তিযুদ্ধ, সংবিধান ও অর্থনীতি)',
        category: 'gk',
        subject: 'বাংলাদেশ অংশ (৩,৯৮৮ প্রশ্নব্যাংক)',
        durationMins: 30,
        marks: 50,
        questionsCount: 50,
        tag: 'Bangladesh GK',
        tagColor: const Color(0xFFE5252A),
      ),
      _PracticeItem(
        id: 'gke_practice_international',
        title:
            'আন্তর্জাতিক বিষয়াবলী টেস্ট (বিশ্ব পরিচিতি, আন্তর্জাতিক সংস্থা ও বৈশ্বিক কূটনীতি)',
        category: 'gk',
        subject: 'আন্তর্জাতিক অংশ (১,৫২০ প্রশ্নব্যাংক)',
        durationMins: 30,
        marks: 50,
        questionsCount: 50,
        tag: 'International GK',
        tagColor: const Color(0xFFD97706),
      ),
      _PracticeItem(
        id: 'gke_practice_english',
        title:
            'English Grammar & Vocabulary টেস্ট (Parts of Speech, Preposition, Voice, Synonym-Antonym)',
        category: 'english',
        subject: 'ইংরেজি অংশ (১০,৩৯৪ প্রশ্নব্যাংক)',
        durationMins: 30,
        marks: 50,
        questionsCount: 50,
        tag: 'English Booster',
        tagColor: const Color(0xFF2563EB),
      ),
      _PracticeItem(
        id: 'gke_practice_mixed',
        title: 'জিকে ও ইংরেজি মিক্সড স্পিড টেস্ট (মেডিকেল স্ট্যান্ডার্ড র‍্যান্ডম টেস্ট)',
        category: 'quick',
        subject: 'জিকে ও ইংরেজি (১৫,৯০০+ প্রশ্নব্যাংক)',
        durationMins: 25,
        marks: 50,
        questionsCount: 50,
        tag: 'Speed Test',
        tagColor: const Color(0xFF004633),
      ),
      _PracticeItem(
        id: 'gke_practice_bangladesh_quick',
        title: 'বাংলাদেশ স্পেশাল কুইক টেস্ট (সংবিধান ও মুক্তিযুদ্ধ ফোকাস)',
        category: 'quick',
        subject: 'বাংলাদেশ অংশ',
        durationMins: 15,
        marks: 25,
        questionsCount: 25,
        tag: 'High-Yield GK',
        tagColor: const Color(0xFF059669),
      ),
      _PracticeItem(
        id: 'gke_practice_english_quick',
        title: 'ইংরেজি গ্রামার কুইক টেস্ট (Preposition & Vocabulary ফোকাস)',
        category: 'quick',
        subject: 'ইংরেজি অংশ',
        durationMins: 15,
        marks: 25,
        questionsCount: 25,
        tag: 'Grammar Quiz',
        tagColor: const Color(0xFF9333EA),
      ),
    ];

    final filteredSets = practiceSets.where((p) {
      if (_selectedFilter == 'all') return true;
      return p.category == _selectedFilter;
    }).toList();

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
          'GKE অনুশীলন ও প্র্যাকটিস টেস্ট',
          style: TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: primaryTextColor,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: borderColor, height: 1),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Top Hero Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF004633), Color(0xFF047857)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.rotateCcw,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'সীমাহীন সেলফ টেস্ট',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'যেকোনো সময় ইচ্ছামতো পরীক্ষা দিয়ে মেডিকেল জিকে ও ইংরেজির দুর্বলতা দূর করুন।',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: Color(0xFFD1FAE5),
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // Filter Tabs
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip(
                    'all',
                    'সকল টেস্ট (${_toBanglaDigits(practiceSets.length)})',
                    isDark,
                  ),
                  const SizedBox(width: 8),
                  _buildFilterChip('gk', 'সাধারণ জ্ঞান (GK)', isDark),
                  const SizedBox(width: 8),
                  _buildFilterChip('english', 'ইংরেজি (English)', isDark),
                  const SizedBox(width: 8),
                  _buildFilterChip('quick', 'কুইক স্পিড টেস্ট', isDark),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // List of Practice Tests
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filteredSets.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = filteredSets[index];
                return _buildPracticeCard(
                  item,
                  isDark,
                  cardBg,
                  borderColor,
                  primaryTextColor,
                  secondaryTextColor,
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String key, String label, bool isDark) {
    final isActive = _selectedFilter == key;
    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = key),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isActive
              ? const Color(0xFF004633)
              : (isDark ? const Color(0xFF13151F) : Colors.white),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive
                ? const Color(0xFF004633)
                : (isDark ? const Color(0xFF232738) : const Color(0xFFE2E8F0)),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w700,
            color: isActive
                ? Colors.white
                : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
          ),
        ),
      ),
    );
  }

  Widget _buildPracticeCard(
    _PracticeItem item,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color primaryTextColor,
    Color secondaryTextColor,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withValues(alpha: 0.2)
                : Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 9,
                  vertical: 3.5,
                ),
                decoration: BoxDecoration(
                  color: item.tagColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  item.tag,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: item.tagColor,
                  ),
                ),
              ),
              Row(
                children: [
                  Icon(LucideIcons.clock, size: 12, color: secondaryTextColor),
                  const SizedBox(width: 4),
                  Text(
                    '${_toBanglaDigits(item.durationMins)} মিনিট',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: secondaryTextColor,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            item.title,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: primaryTextColor,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildMetaTag(
                LucideIcons.checkSquare,
                '${_toBanglaDigits(item.questionsCount)} টি প্রশ্ন',
                isDark,
              ),
              const SizedBox(width: 8),
              _buildMetaTag(
                LucideIcons.award,
                '${_toBanglaDigits(item.marks)} নম্বর',
                isDark,
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 42,
            child: ElevatedButton(
              onPressed: () {
                context.push('/live_exam_details/${item.id}');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF004633),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.playCircle, size: 16),
                  SizedBox(width: 6),
                  Text(
                    'অনুশীলন শুরু করুন',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetaTag(IconData icon, String text, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2230) : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 12,
            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
          ),
          const SizedBox(width: 5),
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
            ),
          ),
        ],
      ),
    );
  }
}

class _PracticeItem {
  final String id;
  final String title;
  final String category;
  final String subject;
  final int durationMins;
  final int marks;
  final int questionsCount;
  final String tag;
  final Color tagColor;

  _PracticeItem({
    required this.id,
    required this.title,
    required this.category,
    required this.subject,
    required this.durationMins,
    required this.marks,
    required this.questionsCount,
    required this.tag,
    required this.tagColor,
  });
}
