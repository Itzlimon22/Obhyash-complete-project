import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../dashboard/providers/dashboard_providers.dart';

class LegendsLeagueView extends ConsumerWidget {
  const LegendsLeagueView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final myProfile = ref.watch(userProfileProvider).whenOrNull(data: (u) => u);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAF9),
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            const SliverToBoxAdapter(
              child: SizedBox(height: 12),
            ),

            // ── Main Content ────────────────────────────────────────────────
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // 1. Hero Golden Championship Card
                  _buildHeroChampionshipCard(isDark, myProfile?.name),
                  const SizedBox(height: 18),

                  // 2. Tournament Bracket Stages
                  _buildTournamentBracket(isDark),
                  const SizedBox(height: 18),

                  // 3. How Qualification Works
                  _buildQualificationRules(isDark),
                  const SizedBox(height: 18),

                  // 4. Perks and Rewards
                  _buildChampionPerks(isDark),
                  const SizedBox(height: 24),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Hero Platinum Championship Card
  // ─────────────────────────────────────────────────────────────────────────────

  Widget _buildHeroChampionshipCard(bool isDark, String? userName) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? const [
                  Color(0xFF0F172A), // Deep platinum slate
                  Color(0xFF1E293B),
                  Color(0xFF182232),
                ]
              : const [
                  Color(0xFFF8FAFC),
                  Color(0xFFF1F5F9),
                  Color(0xFFE2E8F0),
                ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Tag & Crown
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isDark ? const Color(0xFF475569) : const Color(0xFFCBD5E1),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('🏆', style: TextStyle(fontSize: 12)),
                    const SizedBox(width: 6),
                    Text(
                      'সিজন ১ · আসছে শীঘ্রই',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'Anek Bangla',
                        color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B),
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                LucideIcons.crown,
                color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF475569),
                size: 22,
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Title & Description
          Text(
            'লেজেন্ডস চ্যাম্পিয়নশিপ ২০২৬',
            style: TextStyle(
              fontSize: 21,
              fontWeight: FontWeight.w900,
              fontFamily: 'Anek Bangla',
              color: isDark ? Colors.white : const Color(0xFF0F172A),
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '১লা তারিখ সিলেবাস ঘোষণা ও প্রস্তুতি ➔ ২য় সপ্তাহ নকআউট মেধা যুদ্ধ ➔ ১৫ই তারিখ গ্র্যান্ড রেজাল্ট ও সেলিব্রেশন।',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              fontFamily: 'Anek Bangla',
              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),

          // 4 Highlights Timeline Row
          Container(
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
            decoration: BoxDecoration(
              color: isDark ? Colors.black.withValues(alpha: 0.25) : Colors.white.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
              ),
            ),
            child: Row(
              children: [
                _buildHeroHighlightItem('১ তারিখ', 'সিলেবাস', isDark),
                Container(width: 1, height: 24, color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                _buildHeroHighlightItem('১ম সপ্তাহ', 'প্রস্তুতি', isDark),
                Container(width: 1, height: 24, color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                _buildHeroHighlightItem('২য় সপ্তাহ', 'নকআউট', isDark),
                Container(width: 1, height: 24, color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                _buildHeroHighlightItem('১৫ তারিখ', 'ফলাফল', isDark),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Personalized CTA Pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  LucideIcons.ticket,
                  color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                  size: 16,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    userName != null
                        ? '$userName, এই মাসে নিয়মিত পরীক্ষা দিয়ে শীর্ষ ৩০-এ কোয়ালিফাই করো!'
                        : 'এই মাসে নিয়মিত পরীক্ষা দিয়ে শীর্ষ ৩০-এ কোয়ালিফাই করো!',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Anek Bangla',
                      color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05, end: 0);
  }

  Widget _buildHeroHighlightItem(String title, String subtitle, bool isDark) {
    return Expanded(
      child: Column(
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              fontFamily: 'Anek Bangla',
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 1),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.w500,
              fontFamily: 'Anek Bangla',
              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Tournament Bracket Flow Diagram
  // ─────────────────────────────────────────────────────────────────────────────

  Widget _buildTournamentBracket(bool isDark) {
    final cardBg = isDark ? const Color(0xFF111418) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF1E242C) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF111827);
    final textSub = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);

    final stages = [
      (
        step: '১',
        title: 'কোয়ার্টার ফাইনাল (Round 1)',
        desc: 'সেরা ৩০ জন কোয়ালিফায়ারের মধ্যে প্রথম স্পেশাল মক টেস্ট।',
        qualifyText: 'টপ ১৫ জন সেমিফাইনালে উত্তীর্ণ হবে',
        flowLabel: '১৫ জন সেমিফাইনালে',
        color: const Color(0xFF3B82F6),
        icon: LucideIcons.swords,
      ),
      (
        step: '২',
        title: 'সেমিফাইনাল (Semi-Finals)',
        desc: 'টপ ১৫ জনের মধ্যে হাই-ইল্ড ট্রিকি কনসেপ্ট টেস্ট।',
        qualifyText: 'টপ ৫ জন গ্র্যান্ড ফিনালেতে যাবে',
        flowLabel: '৫ জন গ্র্যান্ড ফিনালেতে',
        color: const Color(0xFF8B5CF6),
        icon: LucideIcons.zap,
      ),
      (
        step: '৩',
        title: 'গ্র্যান্ড ফিনালে (Grand Finale)',
        desc: 'চূড়ান্ত ৫ জনের লড়াই—জাতীয় পর্যায়ে শ্রেষ্ঠত্বের পরীক্ষা।',
        qualifyText: '১ জন হবে ন্যাশনাল লেজেন্ডস চ্যাম্পিয়ন 👑',
        flowLabel: '১ম স্থান চ্যাম্পিয়ন',
        color: const Color(0xFFF59E0B),
        icon: LucideIcons.trophy,
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.gitFork, size: 18, color: Color(0xFFF59E0B)),
              const SizedBox(width: 8),
              Text(
                'টুর্নামেন্ট নকআউট ব্র্যাকেট (২য় সপ্তাহ)',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'Anek Bangla',
                  color: textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Connected Flow Diagram
          ...stages.asMap().entries.map((entry) {
            final idx = entry.key;
            final st = entry.value;
            final isLast = idx == stages.length - 1;

            return Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Left Node
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            st.color,
                            st.color.withValues(alpha: 0.8),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: st.color.withValues(alpha: 0.35),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Center(
                        child: Icon(st.icon, color: Colors.white, size: 19),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Right Card
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF19191D) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isDark
                                ? const Color(0xFF2E2E34)
                                : st.color.withValues(alpha: 0.25),
                            width: 1.2,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    st.title,
                                    style: TextStyle(
                                      fontSize: 14.5,
                                      fontWeight: FontWeight.w800,
                                      fontFamily: 'Anek Bangla',
                                      color: textPrimary,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: st.color.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'ধাপ ${st.step}',
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w800,
                                      fontFamily: 'Anek Bangla',
                                      color: st.color,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              st.desc,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                fontFamily: 'Anek Bangla',
                                color: textSub,
                                height: 1.35,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: st.color.withValues(alpha: isDark ? 0.16 : 0.08),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                st.qualifyText,
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w800,
                                  fontFamily: 'Anek Bangla',
                                  color: st.color,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                // Connecting Flow Pipe & Transition Label
                if (!isLast)
                  Row(
                    children: [
                      Container(
                        width: 40,
                        alignment: Alignment.center,
                        child: Column(
                          children: [
                            Container(
                              width: 3,
                              height: 10,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [st.color, stages[idx + 1].color],
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                ),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                            Icon(
                              LucideIcons.chevronDown,
                              size: 16,
                              color: stages[idx + 1].color,
                            ),
                            Container(
                              width: 3,
                              height: 6,
                              color: stages[idx + 1].color.withValues(alpha: 0.6),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Row(
                            children: [
                              Container(
                                width: 8,
                                height: 1.5,
                                color: stages[idx + 1].color.withValues(alpha: 0.4),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'এলিমিনেশন ফিল্টার ➔ ${st.flowLabel}',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'Anek Bangla',
                                  color: stages[idx + 1].color,
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
              ],
            );
          }),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. How Qualification Works (Organized Timeline Rules)
  // ─────────────────────────────────────────────────────────────────────────────

  Widget _buildQualificationRules(bool isDark) {
    final cardBg = isDark ? const Color(0xFF111418) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF1E242C) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF111827);

    final rules = [
      (
        title: '১. মাসব্যাপী প্র্যাকটিস ও টপ ৩০ র‍্যাংক',
        desc: 'মাসের ১ থেকে শেষ দিন পর্যন্ত পরীক্ষা দিয়ে মাসিক লিডারবোর্ডে লিজেন্ড লেভেলে সেরা ৩০ জনের মধ্যে অবস্থান নিশ্চিত করো।',
        icon: LucideIcons.trophy,
      ),
      (
        title: '২. ১লা তারিখ: গোল্ডেন টিকেট ও সিলেবাস প্রকাশ',
        desc: 'মাস শেষ হতেই কোয়ালিফায়ারদের প্রোফাইলে স্পেশাল গোল্ডেন টিকেট আনলক হবে এবং টুর্নামেন্টের নির্দিষ্ট সিলেবাস প্রকাশিত হবে।',
        icon: LucideIcons.bookOpen,
      ),
      (
        title: '৩. ১ম সপ্তাহ (১–৭ তারিখ): প্রস্তুতি পর্ব',
        desc: 'সিলেবাস অনুযায়ী পরীক্ষার জন্য নিজেকে চূড়ান্তভাবে প্রস্তুত করার জন্য পুরো ১ সপ্তাহ ডেডিকেটেড সময় পাওয়া যাবে।',
        icon: LucideIcons.calendar,
      ),
      (
        title: '৪. ২য় সপ্তাহ (৮–১৪ তারিখ): ৩ ধাপের নকআউট লড়াই',
        desc: 'কোয়ার্টার ফাইনাল, সেমিফাইনাল ও গ্র্যান্ড ফিনালের স্পেশাল লাইভ পরীক্ষা অনুষ্ঠিত হবে (নির্দিষ্ট সময়সূচীতে একবারই সুযোগ, কোনো রি-টেক নেই)।',
        icon: LucideIcons.swords,
      ),
      (
        title: '৫. টাইব্রেকার ও নির্ভুলতা লজিক',
        desc: 'নম্বর সমান হলে কম সময় (Completion Time) ও উচ্চ নির্ভুলতার (Accuracy) ভিত্তিতে চূড়ান্ত র‍্যাংক নির্ধারিত হবে।',
        icon: LucideIcons.clock,
      ),
      (
        title: '৬. ১৫ই তারিখ: গ্র্যান্ড রেজাল্ট ও সেলিব্রেশন',
        desc: 'চূড়ান্ত ফলাফল প্রকাশ, বিজয়ীদের প্রোফাইলে সুপ্রিম ব্যাজ আনলক, নগদ প্রাইজ মানি এবং কুরিয়ারে এক্সক্লুসিভ অভ্যাস টি-শার্ট প্রেরণ।',
        icon: LucideIcons.gift,
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  LucideIcons.checkSquare,
                  size: 16,
                  color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'কোয়ালিফাই ও টুর্নামেন্ট নিয়মাবলী',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'Anek Bangla',
                  color: textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...rules.map((rule) {
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF181C22) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? const Color(0xFF242C36) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 2),
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Icon(
                      rule.icon,
                      size: 12,
                      color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          rule.title,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'Anek Bangla',
                            color: textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          rule.desc,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            fontFamily: 'Anek Bangla',
                            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Champion Perks and Mega Rewards (Platinum, Deep Green, Deep Red, Deep Purple)
  // ─────────────────────────────────────────────────────────────────────────────

  Widget _buildChampionPerks(bool isDark) {
    final cardBg = isDark ? const Color(0xFF111418) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF1E242C) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header (No Overflow)
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  LucideIcons.award,
                  size: 16,
                  color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'বিশেষ সম্মাননা ও পুরস্কার',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'Anek Bangla',
                    color: textPrimary,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
                  ),
                ),
                child: Text(
                  'সিজন ১',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Anek Bangla',
                    color: textSecondary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // ── Tier 1: Top 1-3 Grand Champions (Deep Emerald Green + Platinum Accent) ──
          _buildRewardTierCard(
            isDark: isDark,
            badgeEmoji: '👑',
            badgeGradient: const [Color(0xFF064E3B), Color(0xFF047857)],
            cardBgGradient: isDark
                ? const [Color(0xFF06281E), Color(0xFF0C1917)]
                : const [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
            borderColor: isDark ? const Color(0xFF059669).withValues(alpha: 0.45) : const Color(0xFF86EFAC),
            rankTitle: '১ম, ২য় ও ৩য় স্থান',
            tagText: 'গ্র্যান্ড চ্যাম্পিয়ন',
            tagColor: const Color(0xFF059669),
            subtitle: 'প্রাইজ মানি + ব্র্যান্ডেড টি-শার্ট ও সুপ্রিম সম্মাননা',
            perks: [
              '💰 নগদ প্রাইজ মানি (Cash Prize)',
              '👕 এক্সক্লুসিভ অভ্যাস টি-শার্ট',
              '🎖️ প্রোফাইলে সুপ্রিম চ্যাম্পিয়ন ব্যাজ',
              '✨ লিডারবোর্ডে গোল্ডেন হ্যালো ফ্রেম',
            ],
            accentColor: const Color(0xFF10B981),
          ),
          const SizedBox(height: 12),

          // ── Tier 2: Top 4-5 Finalists (Deep Crimson Red + Slate) ──
          _buildRewardTierCard(
            isDark: isDark,
            badgeEmoji: '👕',
            badgeGradient: const [Color(0xFF881337), Color(0xFFBE123C)],
            cardBgGradient: isDark
                ? const [Color(0xFF280B14), Color(0xFF180A0F)]
                : const [Color(0xFFFFF1F2), Color(0xFFFFE4E6)],
            borderColor: isDark ? const Color(0xFFE11D48).withValues(alpha: 0.4) : const Color(0xFFFECDD3),
            rankTitle: '৪র্থ ও ৫ম স্থান',
            tagText: 'টপ ৫ ফাইনালিস্ট',
            tagColor: const Color(0xFFE11D48),
            subtitle: 'এক্সক্লুসিভ টি-শার্ট ও ফাইনালিস্ট মেডেল',
            perks: [
              '👕 এক্সক্লুসিভ অভ্যাস টি-শার্ট',
              '🎖️ টপ ৫ ফাইনালিস্ট প্রোফাইল ব্যাজ',
              '📜 ডিজিটাল মেরিট সার্টিফিকেট',
            ],
            accentColor: const Color(0xFFF43F5E),
          ),
          const SizedBox(height: 12),

          // ── Tier 3: All 30 Qualifiers (Deep Purple + Platinum) ──
          _buildRewardTierCard(
            isDark: isDark,
            badgeEmoji: '🎫',
            badgeGradient: const [Color(0xFF4C1D95), Color(0xFF6D28D9)],
            cardBgGradient: isDark
                ? const [Color(0xFF190D2E), Color(0xFF110B1E)]
                : const [Color(0xFFFAF5FF), Color(0xFFF3E8FF)],
            borderColor: isDark ? const Color(0xFF7C3AED).withValues(alpha: 0.4) : const Color(0xFFE9D5FF),
            rankTitle: 'সকল ৩০ জন কোয়ালিফায়ার',
            tagText: 'অংশগ্রহণকারী',
            tagColor: const Color(0xFF7C3AED),
            subtitle: 'লেজেন্ডস লিগ সিজন ১ পার্টিসিপেশন স্বীকৃতি',
            perks: [
              '🎫 অফিসিয়াল পার্টিসিপেশন সার্টিফিকেট',
              '🎖️ সিজন ১ এক্সক্লুসিভ ব্যাজ ও টাইটেল',
            ],
            accentColor: const Color(0xFFA855F7),
          ),
        ],
      ),
    );
  }

  Widget _buildRewardTierCard({
    required bool isDark,
    required String badgeEmoji,
    required List<Color> badgeGradient,
    required List<Color> cardBgGradient,
    required Color borderColor,
    required String rankTitle,
    required String tagText,
    required Color tagColor,
    required String subtitle,
    required List<String> perks,
    required Color accentColor,
  }) {
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSub = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: cardBgGradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: badgeGradient,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: badgeGradient.first.withValues(alpha: 0.35),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(badgeEmoji, style: const TextStyle(fontSize: 18)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            rankTitle,
                            style: TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'Anek Bangla',
                              color: textPrimary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: tagColor.withValues(alpha: isDark ? 0.25 : 0.15),
                            borderRadius: BorderRadius.circular(5),
                            border: Border.all(
                              color: tagColor.withValues(alpha: isDark ? 0.6 : 0.4),
                            ),
                          ),
                          child: Text(
                            tagText,
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'Anek Bangla',
                              color: isDark ? Colors.white : tagColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w500,
                        fontFamily: 'Anek Bangla',
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Perk Items
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.black.withValues(alpha: 0.3)
                  : Colors.white.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.05)
                    : Colors.black.withValues(alpha: 0.04),
              ),
            ),
            child: Column(
              children: perks.map((p) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2.5),
                  child: Row(
                    children: [
                      Icon(
                        LucideIcons.checkCircle,
                        size: 12,
                        color: accentColor,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          p,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'Anek Bangla',
                            color: textSub,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
