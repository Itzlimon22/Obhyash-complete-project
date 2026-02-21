import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

// --- Domain Models ---
class PolicySection {
  final int? id;
  final String title;
  final dynamic content; // String or List<String>
  final String? warning;
  final IconData? icon;
  final Color? iconColor;

  const PolicySection({
    this.id,
    required this.title,
    required this.content,
    this.warning,
    this.icon,
    this.iconColor,
  });
}

class PolicyContent {
  final String id;
  final String title;
  final String subtitle;
  final IconData icon;
  final Color iconColor;
  final String description;
  final List<PolicySection> sections;

  const PolicyContent({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.iconColor,
    required this.description,
    required this.sections,
  });
}

// --- Data ---
const List<PolicyContent> appPolicies = [
  PolicyContent(
    id: 'about',
    title: 'আমাদের সম্পর্কে',
    subtitle: 'Obhyash: আপনার স্বপ্নের পথে সঙ্গী',
    icon: LucideIcons.flame,
    iconColor: Color(0xFF10B981), // emerald-500
    description:
        'Obhyash একটি আধুনিক ও AI-চালিত প্ল্যাটফর্ম যা শিক্ষার্থীদের একাডেমিক ও ভর্তি পরীক্ষার প্রস্তুতিকে আরও সহজ এবং কার্যকর করতে তৈরি করা হয়েছে। আমাদের লক্ষ্য হলো সুলভ মূল্যে মানসম্মত শিক্ষা ও প্রযুক্তির সমন্বয় ঘটানো।',
    sections: [
      PolicySection(
        title: 'আমাদের লক্ষ্য',
        content:
            'বাংলাদেশের শিক্ষা ব্যবস্থাকে ডিজিটাল ও স্মার্ট করার লক্ষে আমরা কাজ করে যাচ্ছি। আমাদের AI-চালিত সিস্টেম আপনার দুর্বলতাগুলো চিহ্নিত করে এবং আপনাকে আরও ভালো ফলাফল অর্জনে সহায়তা করে।',
      ),
      PolicySection(
        title: 'কেন Obhyash?',
        content:
            'স্মার্ট ওএমআর স্ক্যানার, বিস্তারিত এনালাইটিক্স, এবং বিষয়ভিত্তিক পরীক্ষার মাধ্যমে আমরা শিক্ষার্থীদের একধাপ এগিয়ে রাখি।',
      ),
    ],
  ),
  PolicyContent(
    id: 'privacy',
    title: 'গোপনীয়তা নীতি',
    subtitle: 'আপনার তথ্যের সুরক্ষা আমাদের অগ্রাধিকার',
    icon: LucideIcons.shieldCheck,
    iconColor: Color(0xFF10B981), // emerald-500
    description:
        'আপনার তথ্যের সুরক্ষা আমাদের কাছে অত্যন্ত গুরুত্বপূর্ণ। আমরা কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত রাখি তা বিস্তারিত এখানে আলোচনা করা হলো।',
    sections: [
      PolicySection(
        id: 1,
        title: 'আমরা কী তথ্য সংগ্রহ করি?',
        content: [
          'ব্যক্তিগত তথ্য: নাম, ইমেইল ঠিকানা, ফোন নাম্বার।',
          'একাডেমিক তথ্য: ক্লাস, গ্রুপ এবং পরীক্ষার ফলাফল।',
          'ব্যবহারের তথ্য: লগইন সেশন এবং ফিচার ব্যবহারের ধরণ।',
        ],
      ),
      PolicySection(
        id: 2,
        title: 'আপনার তথ্য কীভাবে ব্যবহার করা হয়?',
        content: [
          'আপনার একাউন্ট পরিচালনা করতে।',
          'আই-এর মাধ্যমে পারসোনালাইজড সাজেশন তৈরি করতে।',
          'লিডারবোর্ড এবং ফলাফল আপডেট করতে।',
        ],
        warning:
            'আমরা কখনোই আপনার ব্যক্তিগত তথ্য তৃতীয় কোনো পক্ষের কাছে বিক্রি করি না।',
      ),
    ],
  ),
  PolicyContent(
    id: 'terms',
    title: 'ব্যবহারের শর্তাবলী',
    subtitle: 'প্ল্যাটফর্ম ব্যবহারের নিয়ম ও শর্তাবলী',
    icon: LucideIcons.scale,
    iconColor: Color(0xFF059669), // emerald-600
    description:
        'Obhyash প্ল্যাটফর্ম ব্যবহার করার মাধ্যমে আপনি আমাদের শর্তাবলীর সাথে একমত পোষণ করছেন। দয়া করে ব্যবহারের পূর্বে এই শর্তাবলী মনোযোগ সহকারে পড়ুন।',
    sections: [
      PolicySection(
        id: 1,
        title: 'শর্তাবলী গ্রহণ',
        content:
            'Obhyash অ্যাপ বা ওয়েবসাইট ব্যবহার করে একাউন্ট তৈরি বা সাবস্ক্রিপশন কেনার মাধ্যমে আপনি আমাদের Terms of Service-র সাথে আইনিভাবে চুক্তিবদ্ধ হচ্ছেন।',
      ),
      PolicySection(
        id: 2,
        title: 'একাউন্ট নিরাপত্তা',
        content: [
          'প্রদানকৃত তথ্য অবশ্যই সঠিক হতে হবে।',
          'পাসওয়ার্ড শেয়ার করা সম্পূর্ণ নিষিদ্ধ।',
          'একই একাউন্ট একাধিক ব্যক্তি ব্যবহার করা দণ্ডনীয় অপরাধ।',
        ],
      ),
    ],
  ),
  PolicyContent(
    id: 'refund',
    title: 'রিফান্ড পলিসি',
    subtitle: 'সাবস্ক্রিপশন ও রিফান্ড সংক্রান্ত নিয়মাবলী',
    icon: LucideIcons.refreshCw,
    iconColor: Color(0xFF10B981), // emerald-500
    description:
        'Obhyash এর সাবস্ক্রিপশন এবং রিফান্ড সংক্রান্ত নিয়মাবলী নিচে পরিষ্কারভাবে উল্লেখ করা হলো।',
    sections: [
      PolicySection(
        title: 'সাধারণ রিফান্ড নিয়ম',
        icon: LucideIcons.alertCircle,
        iconColor: Color(0xFFE11D48), // rose-600
        content:
            'যেহেতু এটি একটি ডিজিটাল সেবা, তাই সাধারণত কোনো সাবস্ক্রিপশন ক্রয় করার পর তার জন্য কোনো রিফান্ড প্রদান করা হয় না। তবে বিশেষ কারিগরি ত্রুটির ক্ষেত্রে আমরা এটি বিবেচনা করি।',
      ),
      PolicySection(
        title: 'রিফান্ডের ক্ষেত্রসমূহ',
        icon: LucideIcons.checkCircle2,
        iconColor: Color(0xFF059669), // emerald-600
        content: [
          'ডাবল পেমেন্ট (বিনা কারণে দুবার টাকা কেটে নেওয়া)।',
          'পেমেন্টের পর ২৪ ঘন্টার মধ্যে প্রিমিয়াম এক্সেস না পাওয়া।',
        ],
      ),
    ],
  ),
];

// --- View ---
class AboutUsView extends StatefulWidget {
  const AboutUsView({super.key});

  @override
  State<AboutUsView> createState() => _AboutUsViewState();
}

class _AboutUsViewState extends State<AboutUsView> {
  String _activePolicyId = 'about';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activePolicy = appPolicies.firstWhere((p) => p.id == _activePolicyId);

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFFFAFAFA)
          : const Color(
              0xFFFAFAFA,
            ), // We'll keep it slightly off-white on light similar to web
      body: Builder(
        builder: (context) {
          // Adjust background for dark mode properly
          final bgColor = isDark ? Colors.black : const Color(0xFFFAFAFA);

          return Container(
            color: bgColor,
            child: Column(
              children: [
                AppBar(
                  title: const Text(
                    'আমাদের সম্পর্কে',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  backgroundColor: Colors.transparent,
                  elevation: 0,
                  scrolledUnderElevation: 0,
                ),
                // Mobile Tabs (Chips)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: Row(
                    children: appPolicies.map((policy) {
                      final isActive = policy.id == _activePolicyId;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () =>
                              setState(() => _activePolicyId = policy.id),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? const Color(0xFF059669) // emerald-600
                                  : (isDark
                                        ? const Color(0xFF262626)
                                        : Colors.white),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: isActive
                                    ? const Color(0xFF059669)
                                    : (isDark
                                          ? const Color(0xFF404040)
                                          : const Color(0xFFF5F5F5)),
                              ),
                              boxShadow: isActive
                                  ? [
                                      const BoxShadow(
                                        color: Color(0x66A7F3D0),
                                        blurRadius: 4,
                                        offset: Offset(0, 2),
                                      ), // shadow-emerald-200
                                    ]
                                  : [],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  policy.icon,
                                  size: 16,
                                  color: isActive
                                      ? Colors.white
                                      : (isDark
                                            ? Colors.white
                                            : policy.iconColor),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  policy.title,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: isActive
                                        ? Colors.white
                                        : (isDark
                                              ? const Color(0xFFA3A3A3)
                                              : const Color(0xFF525252)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),

                // Content Area
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Header Card
                        Container(
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF171717)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF262626)
                                  : const Color(0xFFF5F5F5),
                            ),
                            boxShadow: [
                              if (!isDark)
                                const BoxShadow(
                                  color: Color(0x33000000),
                                  blurRadius: 4,
                                  offset: Offset(0, 1),
                                ),
                            ],
                          ),
                          child: Column(
                            children: [
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0x4D064E3B)
                                      : const Color(
                                          0xFFECFDF5,
                                        ), // emerald-950/30 : emerald-50
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(
                                    color: const Color(0x33059669),
                                    width: 2,
                                  ), // emerald-600/20
                                ),
                                child: Center(
                                  child: Icon(
                                    activePolicy.icon,
                                    size: 40,
                                    color: activePolicy.iconColor,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),
                              Text(
                                activePolicy.title,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 24, // text-3xl
                                  fontWeight: FontWeight.w900, // font-black
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF171717),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                activePolicy.subtitle,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 16, // text-lg
                                  fontStyle: FontStyle.italic,
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? const Color(0xFFA3A3A3)
                                      : const Color(0xFF737373),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),

                        // Description Section
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF171717)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF262626)
                                  : const Color(0xFFF5F5F5),
                            ),
                            boxShadow: [
                              if (!isDark)
                                const BoxShadow(
                                  color: Color(0x33000000),
                                  blurRadius: 4,
                                  offset: Offset(0, 1),
                                ),
                            ],
                          ),
                          child: Text(
                            activePolicy.description,
                            style: TextStyle(
                              fontSize: 16,
                              height: 1.5,
                              fontWeight: FontWeight.w500,
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF525252),
                            ),
                          ),
                        ),

                        const SizedBox(height: 24),

                        // Policy Sections list
                        ...activePolicy.sections.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final section = entry.value;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF171717)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: isDark
                                    ? const Color(0xFF262626)
                                    : const Color(0xFFF5F5F5),
                              ),
                              boxShadow: [
                                if (!isDark)
                                  const BoxShadow(
                                    color: Color(0x33000000),
                                    blurRadius: 4,
                                    offset: Offset(0, 1),
                                  ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        color: isDark
                                            ? const Color(0x4D064E3B)
                                            : const Color(0xFFECFDF5),
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: Center(
                                        child: section.icon != null
                                            ? Icon(
                                                section.icon,
                                                size: 24,
                                                color: section.iconColor,
                                              )
                                            : Text(
                                                '${section.id ?? idx + 1}',
                                                style: const TextStyle(
                                                  fontSize: 20,
                                                  fontWeight: FontWeight.w900,
                                                  color: Color(0xFF059669),
                                                ),
                                              ),
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            section.title,
                                            style: TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.w900,
                                              color: isDark
                                                  ? Colors.white
                                                  : const Color(0xFF171717),
                                            ),
                                          ),
                                          const SizedBox(height: 16),
                                          if (section.content is String)
                                            Text(
                                              section.content,
                                              style: TextStyle(
                                                fontSize: 14,
                                                height: 1.5,
                                                color: isDark
                                                    ? const Color(0xFFA3A3A3)
                                                    : const Color(0xFF525252),
                                              ),
                                            ),
                                          if (section.content is List)
                                            Column(
                                              children: (section.content as List)
                                                  .map(
                                                    (val) => Padding(
                                                      padding:
                                                          const EdgeInsets.only(
                                                            bottom: 12,
                                                          ),
                                                      child: Row(
                                                        crossAxisAlignment:
                                                            CrossAxisAlignment
                                                                .start,
                                                        children: [
                                                          Container(
                                                            margin:
                                                                const EdgeInsets.only(
                                                                  top: 6,
                                                                ),
                                                            width: 6,
                                                            height: 6,
                                                            decoration:
                                                                const BoxDecoration(
                                                                  color: Color(
                                                                    0xFF34D399,
                                                                  ),
                                                                  shape: BoxShape
                                                                      .circle,
                                                                ), // emerald-400
                                                          ),
                                                          const SizedBox(
                                                            width: 12,
                                                          ),
                                                          Expanded(
                                                            child: Text(
                                                              val,
                                                              style: TextStyle(
                                                                fontSize: 14,
                                                                height: 1.5,
                                                                color: isDark
                                                                    ? const Color(
                                                                        0xFFA3A3A3,
                                                                      )
                                                                    : const Color(
                                                                        0xFF525252,
                                                                      ),
                                                              ),
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                  )
                                                  .toList(),
                                            ),

                                          if (section.warning != null) ...[
                                            const SizedBox(height: 16),
                                            Container(
                                              padding: const EdgeInsets.all(16),
                                              decoration: BoxDecoration(
                                                color: isDark
                                                    ? const Color(0x33064E3B)
                                                    : const Color(
                                                        0xFFECFDF5,
                                                      ), // emerald-900/20 : emerald-50
                                                borderRadius:
                                                    BorderRadius.circular(16),
                                                border: Border.all(
                                                  color: isDark
                                                      ? const Color(0x80064E3B)
                                                      : const Color(0xFFD1FAE5),
                                                ), // emerald-900/50 : emerald-100
                                              ),
                                              child: Row(
                                                children: [
                                                  const Text(
                                                    '⚠️',
                                                    style: TextStyle(
                                                      fontSize: 18,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Expanded(
                                                    child: Text(
                                                      section.warning!,
                                                      style: const TextStyle(
                                                        fontSize: 14,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                        color: Color(
                                                          0xFF047857,
                                                        ), // emerald-700
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        }),

                        const SizedBox(height: 48),
                        // Footer
                        Center(
                          child: Column(
                            children: [
                              const Text(
                                '© ${2026} Obhyash Exam Platform - Built for Excellence',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFA3A3A3),
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'সর্বশেষ আপডেট: ০৪ ফেব্রুয়ারি, ২০২৬',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFA3A3A3),
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 48),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
