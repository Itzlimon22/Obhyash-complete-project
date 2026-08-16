import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

class FaqItem {
  final String category;
  final String question;
  final String answer;

  const FaqItem({
    required this.category,
    required this.question,
    required this.answer,
  });
}

const List<FaqItem> _kFaqList = [

  FaqItem(
    category: 'পরীক্ষা',
    question: 'নেগেটিভ মার্কিং কীভাবে হিসাব করা হয়?',
    answer:
        'বোর্ড এবং মেডিকেল/ইঞ্জিনিয়ারিং ভর্তি পরীক্ষার আসল নিয়ম অনুসারে প্রতিটি ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা হয়। সঠিক উত্তরের জন্য নির্ধারিত পূর্ণমান যোগ হয়।',
  ),
  FaqItem(
    category: 'পরীক্ষা',
    question: 'ইন্টারনেট ছাড়া কি অফলাইনে পরীক্ষা দেওয়া যায়?',
    answer:
        'হ্যাঁ! একবার পরীক্ষার প্রশ্নপত্র লোড হয়ে গেলে ইন্টারনেট সংযোগ বিচ্ছিন্ন হলেও তুমি নিরবচ্ছিন্নভাবে পরীক্ষা শেষ করতে পারবে। ইন্টারনেট পাওয়ার সাথে সাথে ফলাফল স্বয়ংক্রিয়ভাবে ক্লাউডে সিঙ্ক হয়ে যাবে।',
  ),
  FaqItem(
    category: 'পেমেন্ট',
    question: 'ফ্রি এবং প্রিমিয়ামের মধ্যে পার্থক্য কী?',
    answer:
        'ফ্রি প্ল্যানে প্রতিদিন নির্দিষ্ট সংখ্যক পরীক্ষা ও বেসিক ফিচার ব্যবহার করা যায়। অন্যদিকে প্রিমিয়ামে রয়েছে আনলিমিটেড মক টেস্ট, AI বিস্তারিত ব্যাখ্যা ও ন্যাশনাল লিডারবোর্ড র‍্যাংকিং।',
  ),
  FaqItem(
    category: 'পেমেন্ট',
    question: 'পেমেন্ট করার কতক্ষণ পর প্রিমিয়াম সক্রিয় হয়?',
    answer:
        'বিকাশ বা নগদ নম্বর থেকে টাকা পাঠানোর পর সঠিক Transaction ID (TrxID) অ্যাপে সাবমিট করলে আমাদের অ্যাডমিন প্যানেল দ্রুততম সময়ে ভেরিফাই করে সাবস্ক্রিপশন সক্রিয় করে দেয়।',
  ),
  FaqItem(
    category: 'পেমেন্ট',
    question: 'কোনো অটো-রিনিউয়াল বা গোপন চার্জ আছে কি?',
    answer:
        'না! Obhyash-এ কোনো হিডেন চার্জ বা অটো-রিনিউয়াল সিস্টেম নেই। নির্দিষ্ট মেয়াদের (৩০ দিন / ৯০ দিন) পর সাবস্ক্রিপশন শেষ হলে স্বয়ংক্রিয়ভাবে ফ্রি প্ল্যানে চলে আসবে।',
  ),
  FaqItem(
    category: 'অ্যাকাউন্ট',
    question: 'আমি কি একাধিক ফোন বা ল্যাপটপ থেকে ব্যবহার করতে পারব?',
    answer:
        'হ্যাঁ, তুমি তোমার রেজিস্টার্ড ফোন নম্বর/ইমেইল দিয়ে যেকোনো ডিভাইস থেকে লগইন করতে পারবে। তবে প্ল্যাটফর্মের ফেয়ার ইউজ পলিসি অনুযায়ী আইডি অন্যের সাথে শেয়ার করা সম্পূর্ণ নিষিদ্ধ।',
  ),
  FaqItem(
    category: 'অ্যাকাউন্ট',
    question: 'প্রোফাইল তথ্য বা লক্ষ্য (Target) পরিবর্তন করা যায়?',
    answer:
        'অবশ্যই! সেটিংস ➔ ব্যক্তিগত তথ্য পেজে গিয়ে যেকোনো সময় তোমার নাম, শিক্ষা প্রতিষ্ঠান, ব্যাচ ও টার্গেট (মেডিকেল/ইঞ্জিনিয়ারিং/ভার্সিটি) পরিবর্তন করতে পারবে।',
  ),
];

class FaqView extends StatefulWidget {
  const FaqView({super.key});

  @override
  State<FaqView> createState() => _FaqViewState();
}

class _FaqViewState extends State<FaqView> {
  String _selectedCategory = 'সব';
  String _searchQuery = '';
  int? _expandedIndex;

  final List<String> _categories = const ['সব', 'পরীক্ষা', 'পেমেন্ট', 'অ্যাকাউন্ট'];

  Future<void> _launchUrl(String urlString) async {
    final uri = Uri.parse(urlString);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA);
    final cardBg = isDark ? const Color(0xFF18181B) : Colors.white;
    final borderColor = isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0);

    final filteredList = _kFaqList.where((item) {
      final matchesCategory = _selectedCategory == 'সব' || item.category == _selectedCategory;
      final matchesSearch = _searchQuery.isEmpty ||
          item.question.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: bgColor,
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Hero Search Header ───────────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: isDark
                    ? const LinearGradient(
                        colors: [Color(0xFF1B2320), Color(0xFF121815)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : const LinearGradient(
                        colors: [Color(0xFFECFDF5), Color(0xFFF0FDF4)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: const Color(0xFF059669).withValues(alpha: isDark ? 0.35 : 0.2),
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF059669).withValues(alpha: isDark ? 0.12 : 0.06),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669).withValues(alpha: isDark ? 0.25 : 0.12),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFF059669).withValues(alpha: 0.4),
                        width: 1.5,
                      ),
                    ),
                    child: const Center(
                      child: Icon(
                        LucideIcons.helpCircle,
                        color: Color(0xFF10B981),
                        size: 28,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'কীভাবে সাহায্য করতে পারি?',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'প্রয়োজনীয় প্রশ্নের উত্তর বা সরাসরি সাহায্য নিতে নিচের অপশনগুলো দেখুন।',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13.5,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Search Bar
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF18181B) : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: borderColor),
                    ),
                    child: TextField(
                      onChanged: (val) => setState(() {
                        _searchQuery = val.trim();
                        _expandedIndex = null;
                      }),
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        fontSize: 14.5,
                      ),
                      decoration: InputDecoration(
                        hintText: 'প্রশ্ন খুঁজুন... (যেমন: ওএমআর, পেমেন্ট, রেজাল্ট)',
                        hintStyle: TextStyle(
                          fontFamily: 'HindSiliguri',
                          color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
                          fontSize: 14,
                        ),
                        prefixIcon: Icon(
                          LucideIcons.search,
                          size: 18,
                          color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                        ),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // ── Quick Support Channels ───────────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: _SupportActionCard(
                    icon: LucideIcons.messageSquare,
                    label: 'অভিযোগ বক্স',
                    sublabel: 'সমস্যার বিবরণ পাঠাও',
                    color: const Color(0xFF059669),
                    isDark: isDark,
                    cardBg: cardBg,
                    borderColor: borderColor,
                    onTap: () => context.push('/profile/complaint'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _SupportActionCard(
                    icon: LucideIcons.mail,
                    label: 'ইমেইল সাপোর্ট',
                    sublabel: 'support@obhyash.com',
                    color: const Color(0xFF3B82F6),
                    isDark: isDark,
                    cardBg: cardBg,
                    borderColor: borderColor,
                    onTap: () => _launchUrl('mailto:support@obhyash.com'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // ── Category Filter Chips ────────────────────────────────────────
            Row(
              children: [
                Text(
                  'ক্যাটাগরি:',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'HindSiliguri',
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    child: Row(
                      children: _categories.map((cat) {
                        final isSelected = _selectedCategory == cat;
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: ChoiceChip(
                            label: Text(
                              cat,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                fontFamily: 'HindSiliguri',
                                color: isSelected
                                    ? Colors.white
                                    : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569)),
                              ),
                            ),
                            selected: isSelected,
                            selectedColor: const Color(0xFF004633),
                            backgroundColor: isDark ? const Color(0xFF18181B) : const Color(0xFFF1F5F9),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(18),
                              side: BorderSide(
                                color: isSelected
                                    ? const Color(0xFF059669)
                                    : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
                              ),
                            ),
                            onSelected: (selected) {
                              if (selected) {
                                setState(() {
                                  _selectedCategory = cat;
                                  _expandedIndex = null;
                                });
                              }
                            },
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // ── FAQ Accordion List ───────────────────────────────────────────
            if (filteredList.isEmpty)
              Container(
                padding: const EdgeInsets.all(32),
                alignment: Alignment.center,
                child: Text(
                  'কোনো প্রশ্ন পাওয়া যায়নি!',
                  style: TextStyle(
                    fontSize: 15,
                    fontFamily: 'HindSiliguri',
                    color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
                  ),
                ),
              )
            else
              ...List.generate(filteredList.length, (index) {
                final item = filteredList[index];
                final isExpanded = _expandedIndex == index;

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isExpanded ? const Color(0xFF059669) : borderColor,
                      width: isExpanded ? 1.4 : 1.0,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: isDark ? const Color(0x2A000000) : const Color(0x04000000),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Theme(
                    data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                    child: ExpansionTile(
                      key: Key('faq_$index'),
                      initiallyExpanded: isExpanded,
                      onExpansionChanged: (expanded) {
                        setState(() {
                          _expandedIndex = expanded ? index : null;
                        });
                      },
                      tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      leading: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF059669).withValues(alpha: isDark ? 0.18 : 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '?',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF10B981),
                          ),
                        ),
                      ),
                      title: Text(
                        item.question,
                        style: TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'HindSiliguri',
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      trailing: Icon(
                        isExpanded ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                        size: 18,
                        color: isExpanded
                            ? const Color(0xFF10B981)
                            : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B)),
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              item.answer,
                              style: TextStyle(
                                fontSize: 14,
                                height: 1.5,
                                fontFamily: 'HindSiliguri',
                                color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF334155),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _SupportActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sublabel;
  final Color color;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final VoidCallback onTap;

  const _SupportActionCard({
    required this.icon,
    required this.label,
    required this.sublabel,
    required this.color,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: isDark ? 0.18 : 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: color),
            ),
            const SizedBox(height: 10),
            Text(
              label,
              style: TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w800,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              sublabel,
              style: TextStyle(
                fontSize: 12,
                fontFamily: 'HindSiliguri',
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
