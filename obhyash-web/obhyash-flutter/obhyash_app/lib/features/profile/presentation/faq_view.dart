import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';

class FaqItem {
  final String category;
  final String question;
  final String answer;

  FaqItem({
    required this.category,
    required this.question,
    required this.answer,
  });
}

final List<FaqItem> _faqs = [
  FaqItem(
    category: 'General',
    question: 'Obhyash অ্যাপটি কি সম্পূর্ণ ফ্রি?',
    answer: "আমাদের একটি 'বেসিক' প্ল্যান আছে যা সম্পূর্ণ ফ্রি। এর মাধ্যমে তুমি প্রতিদিন ১টি পরীক্ষা দিতে পারবেন এবং বেসিক ফিচারগুলো ব্যবহার করতে পারবেন। তবে আনলিমিটেড এক্সাম এবং অ্যাডভান্সড এনালাইসিসের জন্য প্রিমিয়াম সাবস্ক্রিপশন প্রয়োজন।",
  ),
  FaqItem(
    category: 'Account',
    question: 'আমি কি একাধিক ডিভাইস থেকে ব্যবহার করতে পারবো?',
    answer: 'হ্যাঁ, তুমি একই একাউন্ট দিয়ে মোবাইল, ট্যাবলেট বা ল্যাপটপ - যেকোনো ডিভাইস থেকে লগইন করতে পারবেন। তোমার সব ডাটা সব ডিভাইসে সিঙ্ক করা থাকবে।',
  ),
  FaqItem(
    category: 'Payment',
    question: 'পেমেন্ট পদ্ধতি কি কি?',
    answer: 'বর্তমানে আমরা বিকাশ (bKash), নগদ (Nagad) এবং রকেটের (Rocket) মাধ্যমে পেমেন্ট গ্রহণ করছি। অ্যাপের সাবস্ক্রিপশন পেজ থেকে সরাসরি পেমেন্ট করা যাবে।',
  ),
  FaqItem(
    category: 'Exam',
    question: 'প্রশ্নগুলো কি সিলেবাস অনুযায়ী তৈরি?',
    answer: 'অবশ্যই! আমাদের সব প্রশ্ন সর্বশেষ NCTB সিলেবাস এবং বোর্ড পরীক্ষার মানবন্টন অনুযায়ী তৈরি করা হয়েছে। আমাদের এক্সপার্ট টিচার প্যানেল এবং AI প্রতিনিয়ত প্রশ্ন ব্যাংক আপডেট করে।',
  ),
  FaqItem(
    category: 'Payment',
    question: 'সাবস্ক্রিপশন কি ক্যানসেল করা যায়?',
    answer: 'Obhyash এ অটো-রিনিউয়াল সিস্টেম নেই, তাই সাবস্ক্রিপশন ক্যানসেল করার ঝামেলা নেই। মেয়াদ শেষ হলে তোমার প্যাকেজ স্বয়ংক্রিয়ভাবে ফ্রি প্ল্যানে চলে আসবে, যতক্ষণ না তুমি পুনরায় রিনিউ করছেন।',
  ),
];

class FaqView extends StatefulWidget {
  const FaqView({super.key});

  @override
  State<FaqView> createState() => _FaqViewState();
}

class _FaqViewState extends State<FaqView> {
  String _searchQuery = '';
  int? _openIndex = 0; // First one open by default

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF000000) : const Color(0xFFFAFAFA);
    
    final filteredFaqs = _faqs.where((faq) => 
      faq.question.toLowerCase().contains(_searchQuery.toLowerCase())
    ).toList();

    return Scaffold(
      backgroundColor: bgColor,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF000000) : Colors.white,
                border: Border(
                  bottom: BorderSide(
                    color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
                  ),
                ),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0x33E11D48) : const Color(0xFFFFE4E6),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                      LucideIcons.messageCircle,
                      size: 32,
                      color: Color(0xFFE11D48),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'আমরা কীভাবে সাহায্য করতে পারি?',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : const Color(0xFF000000),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Search Bar
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                      ),
                      boxShadow: [
                        if (!isDark)
                          BoxShadow(
                            color: const Color(0xFFE11D48).withOpacity(0.05),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                      ],
                    ),
                    child: TextField(
                      onChanged: (val) {
                        setState(() {
                          _searchQuery = val;
                          _openIndex = null;
                        });
                      },
                      style: TextStyle(
                        color: isDark ? Colors.white : const Color(0xFF000000),
                        fontWeight: FontWeight.w500,
                      ),
                      decoration: InputDecoration(
                        hintText: 'আপনার প্রশ্ন লেখো... (যেমন: পেমেন্ট, লগইন)',
                        hintStyle: TextStyle(
                          color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                        ),
                        prefixIcon: Icon(
                          LucideIcons.search,
                          color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                        ),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  if (filteredFaqs.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 48),
                      child: Text(
                        'কোনো প্রশ্ন খুঁজে পাওয়া যায়নি। অন্য কিছু লিখে খুঁজুন।',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                          color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                        ),
                      ),
                    );
                  }

                  if (index == filteredFaqs.length) {
                    // Footer contact block
                    return Container(
                      margin: const EdgeInsets.only(top: 32, bottom: 24),
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFE11D48).withOpacity(0.3),
                            blurRadius: 16,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          const Text(
                            'আরও প্রশ্ন আছে?',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'তোমার প্রশ্নের উত্তর এখানে না পেলে আমাদের সাপোর্ট টিমের সাথে সরাসরি কথা বলুন।',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              color: Colors.white.withOpacity(0.9),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'আমাদের মেইল করো',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFE11D48),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  final faq = filteredFaqs[index];
                  final isOpen = _openIndex == index;

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _openIndex = isOpen ? null : index;
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: isOpen 
                            ? (isDark ? const Color(0xFF000000) : Colors.white)
                            : (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF8FAFC)),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isOpen
                              ? const Color(0xFFE11D48).withOpacity(0.5)
                              : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
                        ),
                        boxShadow: isOpen && !isDark
                            ? [
                                BoxShadow(
                                  color: const Color(0xFFE11D48).withOpacity(0.05),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                )
                              ]
                            : [],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    faq.question,
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: isOpen
                                          ? const Color(0xFFE11D48)
                                          : (isDark ? Colors.white : const Color(0xFF000000)),
                                    ),
                                   maxLines: 1, overflow: TextOverflow.ellipsis),
                                ),
                                const SizedBox(width: 16),
                                Icon(
                                  isOpen ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                                  color: isOpen 
                                      ? const Color(0xFFE11D48) 
                                      : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                                  size: 20,
                                ),
                              ],
                            ),
                          ),
                          if (isOpen) ...[
                            Divider(
                              height: 1, 
                              color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9)
                            ),
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Text(
                                faq.answer,
                                style: TextStyle(
                                  fontSize: 16,
                                  height: 1.5,
                                  fontWeight: FontWeight.w500,
                                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
                childCount: filteredFaqs.isEmpty ? 1 : filteredFaqs.length + 1,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
