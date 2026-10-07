import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

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

const List<FaqItem> _kFullFaqList = [
  // ── 1 to 16 Core QnAs ───────────────────────────────────────────────────────
  FaqItem(
    category: 'পরীক্ষা',
    question: 'প্র্যাকটিস কিভাবে করব?',
    answer:
        'নিচের মেনু বা হোম থেকে "অনুশীলন"-এ যাও। সেখানে বিষয়, অধ্যায় ও প্রশ্নের ধরন নির্বাচন করে নিজের সুবিধামতো কাস্টম টেস্ট বা ফ্ল্যাশ কার্ড মোডে অনুশীলন শুরু করতে পারবে।',
  ),
  FaqItem(
    category: 'ফিচার',
    question: 'আমার প্রগ্রেস ও দুর্বলতা কীভাবে দেখব?',
    answer:
        'হোম পেজের "অ্যানালিটিক্স" বা প্রোফাইল সেকশনে তোমার প্রতিটি বিষয়ের সঠিক/ভুল উত্তরের হার, দুর্বল অধ্যায়সমূহ এবং সময় ব্যবস্থাপনার বিস্তারিত গ্রাফ দেখতে পাবে। এছাড়াও \'ভুলসমূহ\' ট্যাবে গিয়ে পূর্বে ভুল করা প্রশ্নগুলো রিভিশন দেওয়া যায়।',
  ),
  FaqItem(
    category: 'অ্যাকাউন্ট',
    question: 'আমি কীভাবে আমার অ্যাকাউন্ট লিঙ্ক করব?',
    answer:
        'সেটিংস ➔ "অ্যাকাউন্ট লিঙ্ক" অপশনে যাও। সেখানে তোমার গুগল অ্যাকাউন্ট বা মোবাইল নম্বর লিঙ্ক করে রাখতে পারবে, যাতে যেকোনো ডিভাইস থেকে নিরাপদে লগইন করা যায়।',
  ),
  FaqItem(
    category: 'পেমেন্ট ও প্ল্যান',
    question: 'অভ্যাস প্রিমিয়াম কী এবং এতে কী কী সুবিধা রয়েছে?',
    answer:
        'অভ্যাস প্রিমিয়াম হলো আমাদের ফুল-অ্যাক্সেস মেম্বারশিপ। এতে পাবে আনলিমিটেড মক টেস্ট, প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা, সব বিষয়ের হ্যান্ডনোট ও প্রশ্নব্যাংক PDF ডাউনলোড, জাতীয় লাইভ পরীক্ষা এবং লেজেন্ডস লিগ মেধা তালিকায় অংশগ্রহণের পূর্ণ সুযোগ।',
  ),
  FaqItem(
    category: 'অ্যাকাউন্ট',
    question: 'অভ্যাস হেল্পলাইন ও কাস্টমার সাপোর্ট কীভাবে পাব?',
    answer:
        'সেটিংস ➔ "সাপোর্ট" পেজে গিয়ে সরাসরি টিকিট পাঠাতে পারো অথবা আমাদের অফিশিয়াল হোয়াটসঅ্যাপ হেল্পলাইন (+880 1409-583992) ও ইমেইলে (support@obhyash.com) যোগাযোগ করতে পারো। আমাদের সাপোর্ট টিম দ্রুত সমাধান দিয়ে থাকে।',
  ),
  FaqItem(
    category: 'পরীক্ষা',
    question: 'জাতীয় লাইভ পরীক্ষায় কীভাবে অংশ নেব?',
    answer:
        'হোম পেজ বা নিচের মেনু থেকে "লাইভ পরীক্ষা" সেকশনে যাও। নির্ধারিত সময়ে লাইভ পরীক্ষা শুরু হলে \'পরীক্ষা দিন\' বাটনে ক্লিক করে সারা দেশের শিক্ষার্থীদের সাথে রিয়েল-টাইমে পরীক্ষা দিতে পারবে। পরীক্ষা শেষ হওয়ার ১৫ মিনিট পর মেধা তালিকা ও ফলাফল উন্মুক্ত হয়।',
  ),
  FaqItem(
    category: 'অ্যাকাউন্ট',
    question: 'অ্যাভাটার (Avatar) ও প্রোফাইল ছবি কীভাবে পরিবর্তন করব?',
    answer:
        'সেটিংস ➔ "ব্যক্তিগত তথ্য"-এ গিয়ে তোমার প্রোফাইল আইকনে ট্যাপ করো। সেখানে থাকা বিভিন্ন স্টাইলিশ অ্যাভাটার থেকে পছন্দেরটি বেছে নিতে পারো অথবা তোমার নিজের ছবি আপলোড করতে পারো।',
  ),
  FaqItem(
    category: 'অ্যাকাউন্ট',
    question: 'আমি কি আমার প্রগ্রেস বা অ্যাকাউন্ট ডিলিট করতে পারি?',
    answer:
        'হ্যাঁ, সেটিংসের নিচে থাকা "অ্যাকাউন্ট মুছুন" বা ডাটা রিসেট অপশনের মাধ্যমে তুমি তোমার অ্যাকাউন্ট ও সকল তথ্য স্থায়ীভাবে মুছে ফেলার আবেদন করতে পারো।',
  ),
  FaqItem(
    category: 'পেমেন্ট ও প্ল্যান',
    question: 'আমি কীভাবে সাবস্ক্রিপশন কিনব অথবা রিনিউ করব?',
    answer:
        'সেটিংস ➔ "আপগ্রেড" বা প্রোফাইল থেকে প্রিমিয়াম পেজে যাও। সেখানে নিরাপদে ও তাৎক্ষণিকভাবে যেকোনো প্ল্যান বেছে নিয়ে সাবস্ক্রিপশন চালু বা মেয়াদ বাড়াতে পারবে।',
  ),
  FaqItem(
    category: 'ফিচার',
    question: 'আমাদের সোশ্যাল মিডিয়া ও কমিউনিটি চ্যানেলসমূহ',
    answer:
        'আমাদের ফেসবুক অফিসিয়াল পেজ, ইউটিউব চ্যানেল এবং শিক্ষার্থীদের গ্রুপে যুক্ত হয়ে নিয়মিত পরীক্ষার আপডেট, স্টাডি টিপস ও বিভিন্ন প্রতিযোগিতায় অংশ নিতে পারো।',
  ),
  FaqItem(
    category: 'পরীক্ষা',
    question: 'প্রশ্ন ব্যাংকে কী কী আছে এবং PDF ডাউনলোড করা যায়?',
    answer:
        'প্রশ্ন ব্যাংকে রয়েছে বিগত বছরের সকল শিক্ষা বোর্ডের SSC ও HSC প্রশ্ন এবং ঢাকা বিশ্ববিদ্যালয়, বুয়েট ও মেডিকেল ভর্তি পরীক্ষার প্রশ্নব্যাংক। প্রিমিয়াম ইউজাররা প্রতিটি পরীক্ষার স্ট্যান্ডার্ড প্রশ্নপত্র ও সমাধান ওএমআর শিট PDF আকারে ডাউনলোড করতে পারবে।',
  ),
  FaqItem(
    category: 'ফিচার',
    question: 'পড়াশোনা (নোটস) ও ফর্মুলা ব্যাংক কীভাবে ব্যবহার করব?',
    answer:
        'নিচের মেনু বা ড্রয়ার থেকে "পড়াশোনা"-এ গেলে সব বিষয়ের শর্ট নোটস ও সাজেশন পাবে। আর "ফর্মুলা" সেকশনে ক্লিক করলে পদার্থবিজ্ঞান, রসায়ন ও উচ্চতর গণিতের গুরুত্বপূর্ণ সূত্রগুলো অধ্যায়ভিত্তিক এক ক্লিকে রিভিশন দিতে পারবে।',
  ),
  FaqItem(
    category: 'অ্যাকাউন্ট',
    question: 'প্রোফাইল তথ্য বা ব্যাচ/টার্গেট কীভাবে আপডেট করব?',
    answer:
        'সেটিংস ➔ "ব্যক্তিগত তথ্য" পেজে গিয়ে যেকোনো সময় তোমার নাম, শিক্ষা প্রতিষ্ঠান, শিক্ষাবর্ষ (ব্যাচ) এবং টার্গেট (মেডিকেল/ইঞ্জিনিয়ারিং/ভার্সিটি) পরিবর্তন করতে পারবে।',
  ),
  FaqItem(
    category: 'পেমেন্ট ও প্ল্যান',
    question: 'কুপন কোড ব্যবহার বা রিফান্ড পলিসি কী?',
    answer:
        'পেমেন্ট করার সময় "কুপন কোড আছে?" বক্সে তোমার প্রোমো কোড বসালে ছাড় পাওয়া যাবে। আর কোনো টেকনিক্যাল সমস্যার কারণে সাবস্ক্রিপশন চালু না হলে ২৪ ঘণ্টার মধ্যে সাপোর্ট জানালে রিফান্ড পলিসি অনুযায়ী ব্যবস্থা নেওয়া হয়।',
  ),
  FaqItem(
    category: 'পরীক্ষা',
    question: 'লিডারবোর্ড (মেধা তালিকা) কীভাবে কাজ করে?',
    answer:
        'প্রতিদিনের পরীক্ষা, সঠিক উত্তর এবং অ্যাক্টিভিটির ভিত্তিতে অর্জিত পয়েন্ট দিয়ে ডেইলি, উইকলি ও অল-টাইম লিডারবোর্ড তৈরি হয়। শীর্ষস্থান অধিকারীরা আকর্ষণীয় লেজেন্ডস ব্যাজ পায়।',
  ),
  FaqItem(
    category: 'ফিচার',
    question: 'ডেইলি স্ট্রিক (Streak) কী এবং কীভাবে ধরে রাখব?',
    answer:
        'প্রতিদিন অন্তত একটি পরীক্ষা বা কুইজ সম্পন্ন করলে তোমার স্ট্রিক কাউন্ট ১ দিন করে বাড়বে। কোনো দিন পরীক্ষা না দিলে স্ট্রিক ০ হয়ে যাবে, তাই ধারাবাহিক পড়াশোনার অভ্যাস গড়তে প্রতিদিন স্ট্রিক বজায় রাখো।',
  ),

  // ── Extra Important Questions (17 to 21 from Help Page) ───────────────────────
  FaqItem(
    category: 'পরীক্ষা',
    question: 'নেগেটিভ মার্কিং কীভাবে হিসাব করা হয়?',
    answer:
        'বোর্ড এবং মেডিকেল/ইঞ্জিনিয়ারিং ভর্তি পরীক্ষার আসল নিয়ম অনুসারে প্রতিটি ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা হয়। সঠিক উত্তরের জন্য নির্ধারিত পূর্ণমান যোগ হয়।',
  ),
  FaqItem(
    category: 'পরীক্ষা',
    question: 'ইন্টারনেট সংযোগ চলে গেলে কি পরীক্ষা দেওয়া যাবে?',
    answer:
        'হ্যাঁ! একবার পরীক্ষার প্রশ্নপত্র লোড হয়ে গেলে ইন্টারনেট সংযোগ বিচ্ছিন্ন হলেও তুমি নিরবচ্ছিন্নভাবে পরীক্ষা শেষ করতে পারবে। ইন্টারনেট সংযোগ পাওয়ার সাথে সাথে ফলাফল স্বয়ংক্রিয়ভাবে সিঙ্ক হয়ে যাবে।',
  ),
  FaqItem(
    category: 'পরীক্ষা',
    question: 'কাস্টম টেস্ট ও পূর্ণাঙ্গ মডেল টেস্টের মধ্যে পার্থক্য কী?',
    answer:
        'কাস্টম টেস্টে তুমি নিজের পছন্দমতো বিষয়, এক বা একাধিক অধ্যায় ও সময় বেছে নিয়ে পরীক্ষা দিতে পারবে। আর মডেল টেস্টে পূর্ণ সিলেবাসের উপর স্ট্যান্ডার্ড ৫০ বা ১০০ নম্বরের ফুল টেস্ট নেওয়া হয়।',
  ),
  FaqItem(
    category: 'পেমেন্ট ও প্ল্যান',
    question: 'কোনো অটো-রিনিউয়াল বা লুকানো চার্জ আছে কি?',
    answer:
        'না! Obhyash-এ কোনো হিডেন চার্জ বা অটো-রিনিউয়াল সিস্টেম নেই। নির্দিষ্ট মেয়াদের (যেমন: ১ মাস, ৩ মাস বা ৬ মাস) পর সাবস্ক্রিপশন শেষ হলে স্বয়ংক্রিয়ভাবে ফ্রি প্ল্যানে ফিরে আসবে, অতিরিক্ত কোনো টাকা কাটা হবে না।',
  ),
  FaqItem(
    category: 'অ্যাকাউন্ট',
    question: 'আমি কি একাধিক ফোন বা ল্যাপটপ থেকে ব্যবহার করতে পারব?',
    answer:
        'হ্যাঁ, তুমি তোমার রেজিস্টার্ড মোবাইল নম্বর/ইমেইল দিয়ে যেকোনো স্মার্টফোন বা কম্পিউটার থেকে লগইন করতে পারবে। তবে প্ল্যাটফর্মের ফেয়ার ইউজ পলিসি অনুযায়ী আইডি অন্যের সাথে শেয়ার করা নিষিদ্ধ।',
  ),
];

class FaqView extends StatefulWidget {
  const FaqView({super.key});

  @override
  State<FaqView> createState() => _FaqViewState();
}

class _FaqViewState extends State<FaqView> {
  String _selectedCategory = 'সব';
  int? _expandedIndex;

  final List<String> _categories = const [
    'সব',
    'পরীক্ষা',
    'পেমেন্ট ও প্ল্যান',
    'অ্যাকাউন্ট',
    'ফিচার',
  ];

  void _toggleExpand(int index) {
    HapticFeedback.lightImpact();
    setState(() {
      if (_expandedIndex == index) {
        _expandedIndex = null;
      } else {
        _expandedIndex = index;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF09090B) : const Color(0xFFF9FAFB);

    final filteredList = _kFullFaqList.where((item) {
      return _selectedCategory == 'সব' || item.category == _selectedCategory;
    }).toList();

    return Scaffold(
      backgroundColor: bgColor,
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Category Chips ───────────────────────────────────────────────
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: _categories.map((cat) {
                  final isSelected = _selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(
                        cat,
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected
                              ? Colors.white
                              : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569)),
                        ),
                      ),
                      selected: isSelected,
                      selectedColor: const Color(0xFF004633), // Deepest green
                      backgroundColor:
                          isDark ? const Color(0xFF18181B) : const Color(0xFFF1F5F9),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
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

            const SizedBox(height: 18),

            // ── Questions Counter / Section Header ────────────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'পপুলার প্রশ্ন ও উত্তর',
                  style: TextStyle(
                    fontSize: 16.5,
                    fontWeight: FontWeight.w700,
                    color: isDark ? const Color(0xFFF4F4F5) : const Color(0xFF1E293B),
                    letterSpacing: -0.2,
                  ),
                ),
                Text(
                  '${filteredList.length}টি প্রশ্ন',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // ── FAQ Items List ───────────────────────────────────────────────
            if (filteredList.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Center(
                  child: Column(
                    children: [
                      Icon(
                        LucideIcons.searchX,
                        size: 44,
                        color: isDark ? const Color(0xFF52525B) : const Color(0xFF94A3B8),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'কোনো ফলাফল পাওয়া যায়নি',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'অন্য কোনো শব্দ দিয়ে আবার চেষ্টা করুন',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? const Color(0xFF71717A) : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: filteredList.length,
                separatorBuilder: (context, index) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final item = filteredList[index];
                  final isExpanded = _expandedIndex == index;

                  return _FaqCard(
                    item: item,
                    index: index + 1,
                    isExpanded: isExpanded,
                    isDark: isDark,
                    onTap: () => _toggleExpand(index),
                  );
                },
              ),

            const SizedBox(height: 24),

            // ── Bottom Need More Help Card ────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                ),
                boxShadow: [
                  BoxShadow(
                    color: isDark ? const Color(0x1A000000) : const Color(0x06000000),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3B82F6).withValues(alpha: isDark ? 0.2 : 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.headphones,
                      color: Color(0xFF3B82F6),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'প্রশ্নের উত্তর খুঁজে পাননি?',
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'আমাদের সাপোর্ট টিম সবসময় তোমার পাশে আছে',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () => context.push('/profile/support'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF004633), // Deepest green
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'সাপোর্ট',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 36),
          ],
        ),
      ),
    );
  }
}

class _FaqCard extends StatelessWidget {
  final FaqItem item;
  final int index;
  final bool isExpanded;
  final bool isDark;
  final VoidCallback onTap;

  const _FaqCard({
    required this.item,
    required this.index,
    required this.isExpanded,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final borderColor = isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeInOut,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isExpanded ? const Color(0xFF059669) : borderColor,
          width: isExpanded ? 1.4 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? const Color(0x1A000000) : const Color(0x06000000),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top row: Question title & Chevron
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Question text
                    Expanded(
                      child: Text(
                        item.question,
                        style: TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w700,
                          color: isDark ? const Color(0xFFF4F4F5) : const Color(0xFF1E293B),
                          height: 1.35,
                          letterSpacing: -0.1,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Animated Chevron
                    AnimatedRotation(
                      turns: isExpanded ? 0.5 : 0.0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(
                        LucideIcons.chevronDown,
                        size: 19,
                        color: isExpanded
                            ? const Color(0xFF10B981)
                            : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B)),
                      ),
                    ),
                  ],
                ),

                // Expanded Answer body with clean divider
                if (isExpanded) ...[
                  const SizedBox(height: 12),
                  Divider(
                    height: 1,
                    thickness: 1,
                    color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    item.answer,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.55,
                      color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF475569),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
