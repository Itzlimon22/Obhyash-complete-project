import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'live_exam_routine_page.dart';

class GkeMaterialsPage extends ConsumerStatefulWidget {
  const GkeMaterialsPage({super.key});

  @override
  ConsumerState<GkeMaterialsPage> createState() => _GkeMaterialsPageState();
}

class _GkeMaterialsPageState extends ConsumerState<GkeMaterialsPage> {
  String _selectedCategory = 'all';

  final List<_MaterialItem> _materials = [
    _MaterialItem(
      title: 'MT-01 Solve Sheet: প্রাচীন বাংলা ও English Grammar',
      category: 'solve',
      subtitle: '২৫টি প্রশ্নের শতভাগ বিস্তারিত সমাধান ও ব্যাখ্যা',
      pages: '১২ পৃষ্ঠা',
      fileSize: '২.৪ MB',
      type: 'PDF',
      color: const Color(0xFFE5252A),
    ),
    _MaterialItem(
      title: 'MT-02 Solve Sheet: ব্রিটিশ শাসন, ভাষা আন্দোলন ও Pronoun',
      category: 'solve',
      subtitle: '২৫টি প্রশ্নের শতভাগ বিস্তারিত সমাধান ও ব্যাখ্যা',
      pages: '১৪ পৃষ্ঠা',
      fileSize: '২.৮ MB',
      type: 'PDF',
      color: const Color(0xFFD97706),
    ),
    _MaterialItem(
      title: 'মেডিকেল জিকে হ্যান্ডনোট: প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস',
      category: 'lecture',
      subtitle: 'মৌর্য, গুপ্ত, পাল ও সেন বংশের সকল গুরুত্বপূর্ণ তথ্য',
      pages: '১৮ পৃষ্ঠা',
      fileSize: '৩.২ MB',
      type: 'PDF',
      color: const Color(0xFF004633),
    ),
    _MaterialItem(
      title: 'মেডিকেল ইংরেজি মাস্টার শিট: Parts of Speech, Tense & Preposition',
      category: 'lecture',
      subtitle: 'বিগত ২০ বছরের মেডিকেল ভর্তি পরীক্ষার নিয়ম বিশ্লেষণ',
      pages: '২২ পৃষ্ঠা',
      fileSize: '৪.১ MB',
      type: 'PDF',
      color: const Color(0xFF2563EB),
    ),
    _MaterialItem(
      title: 'জিকে শর্টকাট মেগা চার্ট: বাংলাদেশের সংবিধান ও বীরশ্রেষ্ঠ সমগ্র',
      category: 'lecture',
      subtitle: 'এক নজরে সকল অনুচ্ছেদ, সংশোধনী ও ৭ বীরশ্রেষ্ঠ পরিচিতি',
      pages: '৮ পৃষ্ঠা',
      fileSize: '১.৬ MB',
      type: 'PDF',
      color: const Color(0xFF059669),
    ),
    _MaterialItem(
      title: 'GKE পূর্ণাঙ্গ পরীক্ষার রুটিন ও সিলেবাস ডিরেক্টরি ২০২৬',
      category: 'routine',
      subtitle: '৭০টি মডেল টেস্টের তারিখভিত্তিক সম্পূর্ণ সূচি',
      pages: '৪ পৃষ্ঠা',
      fileSize: '৯৫০ KB',
      type: 'PDF',
      color: const Color(0xFF9333EA),
    ),
  ];

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

    final filtered = _materials.where((m) {
      if (_selectedCategory == 'all') return true;
      return m.category == _selectedCategory;
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
          'GKE লেকচার ও সলভ শিট',
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
                  colors: [Color(0xFF004633), Color(0xFF15803D)],
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
                      LucideIcons.fileText,
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
                          'সম্পূর্ণ ফ্রি স্টাডি রিসোর্স',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'প্রতিটি মডেল টেস্টের সম্পূর্ণ ব্যাখ্যাসহ সলভ শিট ও হ্যান্ডনোট অফলাইনে পড়ার জন্য সংগ্রহ করুন।',
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

            // Category Filter Pills
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterPill('all', 'সকল ম্যাটেরিয়ালস', isDark),
                  const SizedBox(width: 8),
                  _buildFilterPill('solve', 'মডেল টেস্ট সলভ শিট', isDark),
                  const SizedBox(width: 8),
                  _buildFilterPill('lecture', 'লেকচার নোট ও শিট', isDark),
                  const SizedBox(width: 8),
                  _buildFilterPill('routine', 'পরীক্ষার রুটিন', isDark),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Materials List
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filtered.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = filtered[index];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: borderColor),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: item.color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Icon(
                            LucideIcons.fileText,
                            color: item.color,
                            size: 22,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.title,
                              style: TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w800,
                                color: primaryTextColor,
                                height: 1.25,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              item.subtitle,
                              style: TextStyle(
                                fontSize: 11.5,
                                color: secondaryTextColor,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                _buildBadge(item.type, item.color, isDark),
                                const SizedBox(width: 8),
                                Text(
                                  '${item.pages} • ${item.fileSize}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: secondaryTextColor,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      IconButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const LiveExamRoutinePage(
                                categoryTitle: 'GKE',
                              ),
                            ),
                          );
                        },
                        icon: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: const Color(
                              0xFF004633,
                            ).withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            LucideIcons.download,
                            color: Color(0xFF004633),
                            size: 18,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterPill(String key, String label, bool isDark) {
    final isActive = _selectedCategory == key;
    return GestureDetector(
      onTap: () => setState(() => _selectedCategory = key),
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

  Widget _buildBadge(String label, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: color,
        ),
      ),
    );
  }
}

class _MaterialItem {
  final String title;
  final String category;
  final String subtitle;
  final String pages;
  final String fileSize;
  final String type;
  final Color color;

  _MaterialItem({
    required this.title,
    required this.category,
    required this.subtitle,
    required this.pages,
    required this.fileSize,
    required this.type,
    required this.color,
  });
}
