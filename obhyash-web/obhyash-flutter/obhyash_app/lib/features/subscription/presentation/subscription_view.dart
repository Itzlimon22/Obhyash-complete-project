import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/models.dart';
import '../domain/coupon_service.dart';
import 'plan_selection_view.dart';

class SubscriptionView extends StatefulWidget {
  const SubscriptionView({super.key});

  @override
  State<SubscriptionView> createState() => _SubscriptionViewState();
}

class _SubscriptionViewState extends State<SubscriptionView> {
  bool _isLoading = true;
  List<SubscriptionPlan> _plans = [];
  SubscriptionPlan? _activeSubscription;
  DateTime? _expiresAt;
  AppliedCoupon? _appliedCoupon;

  int get _daysRemaining {
    if (_expiresAt == null) return 0;
    final diff = _expiresAt!.difference(DateTime.now()).inDays;
    return diff > 0 ? diff : 0;
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;

      // 1. Fetch plans with fallback default plans
      List<SubscriptionPlan> plans = [];
      try {
        final plansData = await supabase
            .from('subscription_plans')
            .select()
            .eq('is_active', true)
            .order('price', ascending: true);

        if ((plansData as List).isNotEmpty) {
          plans = (plansData as List)
              .map((p) => SubscriptionPlan.fromJson(p as Map<String, dynamic>))
              .toList();
        }
      } catch (e) {
        debugPrint('[SubscriptionView] Error fetching subscription_plans: $e');
      }

      if (plans.isEmpty) {
        plans = [
          SubscriptionPlan(
            id: 'monthly_plan',
            name: 'মাসিক প্ল্যান (১ মাস)',
            price: 149,
            currency: '৳',
            durationDays: 30,
            billingCycle: 'Monthly',
            features: const [
              'সকল প্রিমিয়াম প্রশ্নের সমাধান',
              'আনলিমিটেড মডেল টেস্ট ও লাইভ এক্সাম',
              'পূর্ণাঙ্গ এনালাইসিস ও পারফরম্যান্স গ্রাফ',
            ],
            colorTheme: 'indigo',
          ),
          SubscriptionPlan(
            id: 'admission_pro_3m',
            name: 'এডমিশন প্যাক (৩ মাস)',
            price: 349,
            currency: '৳',
            durationDays: 90,
            billingCycle: 'Quarterly',
            features: const [
              'সকল প্রিমিয়াম প্রশ্নের সমাধান',
              'আনলিমিটেড মডেল টেস্ট ও লাইভ এক্সাম',
              'পূর্ণাঙ্গ এনালাইসিস ও পারফরম্যান্স গ্রাফ',
              'জাতীয় লাইভ পরীক্ষা ও লিডারবোর্ড',
            ],
            colorTheme: 'emerald',
          ),
          SubscriptionPlan(
            id: 'full_session_6m',
            name: 'ফুল সেশন প্যাক (৬ মাস)',
            price: 599,
            currency: '৳',
            durationDays: 180,
            billingCycle: 'Half-Yearly',
            features: const [
              'সকল প্রিমিয়াম প্রশ্নের সমাধান',
              'আনলিমিটেড মডেল টেস্ট ও লাইভ এক্সাম',
              'পূর্ণাঙ্গ এনালাইসিস ও পারফরম্যান্স গ্রাফ',
              'অধ্যায়ভিত্তিক ফর্মুলা ব্যাংক',
              '২৪/৭ স্পেশাল সাপোর্ট',
            ],
            colorTheme: 'amber',
          ),
        ];
      }

      // 2. Fetch active subscription
      SubscriptionPlan? activeSub;
      DateTime? expiresAt;

      if (userId != null) {
        // Try subscription_history first
        try {
          final histData = await supabase
              .from('subscription_history')
              .select('*')
              .eq('user_id', userId)
              .order('started_at', ascending: false)
              .limit(10);

          final hist = histData as List?;
          if (hist != null && hist.isNotEmpty) {
            for (final item in hist) {
              final h = item as Map<String, dynamic>;
              final rawExpires = h['expires_at'] as String?;
              if (rawExpires != null) {
                final parsed = DateTime.tryParse(rawExpires);
                if (parsed != null && parsed.isAfter(DateTime.now())) {
                  if (activeSub == null || (expiresAt != null && parsed.isAfter(expiresAt))) {
                    expiresAt = parsed;
                    final days = parsed.difference(DateTime.now()).inDays.clamp(1, 999);
                    final planName = h['plan_name']?.toString() ?? 'প্রো সাবস্ক্রিপশন';
                    activeSub = SubscriptionPlan(
                      id: h['id']?.toString() ?? 'sub_hist_active',
                      name: planName,
                      price: (h['amount'] as num?)?.toInt() ?? 0,
                      billingCycle: days >= 365 ? 'Yearly' : days >= 90 ? 'Quarterly' : 'Monthly',
                      durationDays: days,
                      currency: '৳',
                      features: const [
                        'সকল প্রিমিয়াম প্রশ্নের সমাধান',
                        'আনলিমিটেড মডেল টেস্ট ও লাইভ এক্সাম',
                        'পূর্ণাঙ্গ এনালাইসিস ও পারফরম্যান্স গ্রাফ',
                      ],
                      colorTheme: 'emerald',
                      expiresAt: rawExpires.length >= 10 ? rawExpires.substring(0, 10) : rawExpires,
                    );
                  }
                }
              }
            }
          }
        } catch (e) {
          debugPrint('[SubscriptionView] Error querying subscription_history: $e');
        }

        // Fallback to Users table for Pro status / referral bonus
        try {
          final userRes = await supabase
              .from('users')
              .select('subscription, subscription_status, subscription_expires_at, is_subscribed, plan, level')
              .eq('id', userId)
              .maybeSingle();

          if (userRes != null) {
            final subJson = userRes['subscription'] as Map<String, dynamic>?;
            final rawStatus = (subJson?['status'] ?? userRes['subscription_status'])?.toString().toLowerCase().trim();
            final rawExp = userRes['subscription_expires_at'] ?? subJson?['expiry'] ?? subJson?['expires_at'];
            DateTime? parsedExp;
            if (rawExp != null) parsedExp = DateTime.tryParse(rawExp.toString());

            final isPro = userRes['is_subscribed'] == true ||
                rawStatus == 'active' ||
                (userRes['plan'] as String?)?.toLowerCase() == 'pro' ||
                (userRes['level'] as String?)?.toLowerCase() == 'pro' ||
                (subJson?['plan'] as String?)?.toLowerCase() == 'pro';

            if (isPro) {
              if (parsedExp == null || parsedExp.isBefore(DateTime.now())) {
                parsedExp = DateTime.now().add(const Duration(days: 15));
              }

              if (activeSub == null) {
                expiresAt = parsedExp;
                final days = parsedExp.difference(DateTime.now()).inDays.clamp(1, 999);
                final rawPlan = (subJson?['plan'] ?? userRes['plan'] ?? 'প্রো সাবস্ক্রিপশন').toString();
                final planTitle = rawPlan == 'Pro' || rawPlan == 'pro' ? 'প্রো সাবস্ক্রিপশন' : rawPlan;
                final cycle = planTitle.toLowerCase().contains('year') || planTitle.toLowerCase().contains('বছর')
                    ? 'Yearly'
                    : planTitle.toLowerCase().contains('quarter') || planTitle.toLowerCase().contains('ত্রৈমাসিক')
                        ? 'Quarterly'
                        : 'Monthly';

                activeSub = SubscriptionPlan(
                  id: 'user_active_plan',
                  name: planTitle,
                  price: 0,
                  billingCycle: cycle,
                  durationDays: days,
                  currency: '৳',
                  features: const [
                    'সকল প্রিমিয়াম প্রশ্নের সমাধান',
                    'আনলিমিটেড মডেল টেস্ট ও লাইভ এক্সাম',
                    'পূর্ণাঙ্গ এনালাইসিস ও পারফরম্যান্স গ্রাফ',
                  ],
                  colorTheme: 'emerald',
                  expiresAt: parsedExp.toIso8601String().length >= 10
                      ? parsedExp.toIso8601String().substring(0, 10)
                      : null,
                );
              }
            }
          }
        } catch (userSubErr) {
          debugPrint('User profile sub check error: $userSubErr');
        }
      }

      if (mounted) {
        setState(() {
          _plans = plans;
          _activeSubscription = activeSub;
          _expiresAt = expiresAt;
          _isLoading = false;
        });
      }
    } catch (e, stack) {
      debugPrint('Error loading subscription data: $e\n$stack');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _navigateToPlanSelection() {
    Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute(
        builder: (_) => PlanSelectionView(
          initialPlans: _plans,
          activeSubscription: _activeSubscription,
          expiresAt: _expiresAt,
          initialCoupon: _appliedCoupon,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return RefreshIndicator(
      color: const Color(0xFF004633),
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        padding: const EdgeInsets.fromLTRB(14, 18, 14, 48),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. CURRENT SUBSCRIPTION STATUS CARD (TOP)
            if (!_isLoading) ...[
              _CurrentSubscriptionCard(
                activeSubscription: _activeSubscription,
                daysRemaining: _daysRemaining,
                expiresAt: _activeSubscription?.expiresAt,
                isDark: isDark,
              ),
              const SizedBox(height: 16),
            ],

            // 2. UPGRADE CTA HERO CARD (OPENS PLAN SELECTION PAGE)
            _UpgradeHeroCtaCard(
              isDark: isDark,
              onUpgradeTap: _navigateToPlanSelection,
            ),

            const SizedBox(height: 24),

            // 3. UNIFIED WHAT'S INCLUDED FEATURE SHOWCASE
            _UnifiedFeaturesShowcase(isDark: isDark),

            const SizedBox(height: 18),

            // 4. TRUST BADGES
            GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 2.2,
              children: [
                _TrustBadge(
                  icon: LucideIcons.headphones,
                  label: '২৪/৭ সাপোর্ট',
                  iconColor: const Color(0xFFEF4444),
                  isDark: isDark,
                ),
                _TrustBadge(
                  icon: LucideIcons.clock,
                  label: 'তাৎক্ষণিক অ্যাক্সেস',
                  iconColor: const Color(0xFF10B981),
                  isDark: isDark,
                ),
                _TrustBadge(
                  icon: LucideIcons.shieldCheck,
                  label: 'নিরাপদ পেমেন্ট',
                  iconColor: const Color(0xFF3B82F6),
                  isDark: isDark,
                ),
                _TrustBadge(
                  icon: LucideIcons.refreshCw,
                  label: 'রিনিউ সহজ',
                  iconColor: const Color(0xFFA855F7),
                  isDark: isDark,
                ),
              ],
            ),

            const SizedBox(height: 28),

            // 5. COMPARISON TABLE
            _ComparisonTable(isDark: isDark),

            const SizedBox(height: 28),

            // 6. BOTTOM CTA UPGRADE BUTTON
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF004633),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                  elevation: 3,
                  shadowColor: const Color(0xFF004633).withValues(alpha: 0.35),
                ),
                onPressed: _navigateToPlanSelection,
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.crown, size: 20, color: Color(0xFFFBBF24)),
                    SizedBox(width: 10),
                    Text(
                      'আপগ্রেড করুন',
                      style: TextStyle(
                        fontSize: 16.5,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'HindSiliguri',
                        letterSpacing: 0.2,
                      ),
                    ),
                    SizedBox(width: 8),
                    Icon(LucideIcons.arrowRight, size: 18),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _UpgradeHeroCtaCard extends StatelessWidget {
  final bool isDark;
  final VoidCallback onUpgradeTap;

  const _UpgradeHeroCtaCard({
    required this.isDark,
    required this.onUpgradeTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141417) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
          width: 1.0,
        ),
        boxShadow: [
          if (!isDark)
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 18,
              offset: const Offset(0, 6),
            ),
        ],
      ),
      child: Column(
        children: [
          // Crown badge icon
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF004633), Color(0xFF059669)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF059669).withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Center(
              child: Icon(LucideIcons.crown, color: Color(0xFFFDE68A), size: 26),
            ),
          ),
          const SizedBox(height: 14),

          // Title
          Text(
            'প্রো মেম্বারশিপে আপগ্রেড করুন',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),

          // Subtitle
          Text(
            'আনলিমিটেড পরীক্ষা, বিস্তারিত সমাধান ও সম্পূর্ণ প্রশ্নব্যাংক অ্যাক্সেস করতে আজই আপগ্রেড করুন।',
            style: TextStyle(
              fontSize: 13,
              height: 1.4,
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
              fontFamily: 'HindSiliguri',
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 18),

          // Primary Upgrade Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF004633),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 20),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 3,
                shadowColor: const Color(0xFF004633).withValues(alpha: 0.35),
              ),
              onPressed: onUpgradeTap,
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.zap, size: 18, color: Color(0xFFFDE68A)),
                  SizedBox(width: 8),
                  Text(
                    'আপগ্রেড করুন',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'HindSiliguri',
                      letterSpacing: 0.2,
                    ),
                  ),
                  SizedBox(width: 8),
                  Icon(LucideIcons.arrowRight, size: 18),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CurrentSubscriptionCard extends StatelessWidget {
  final SubscriptionPlan? activeSubscription;
  final int daysRemaining;
  final String? expiresAt;
  final bool isDark;

  const _CurrentSubscriptionCard({
    required this.activeSubscription,
    required this.daysRemaining,
    this.expiresAt,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final isPro = activeSubscription != null;
    final planTitle = isPro ? activeSubscription!.name : 'ফ্রি মেম্বারশিপ';
    final subTitle = isPro
        ? 'মেয়াদ: $daysRemaining দিন বাকি${expiresAt != null ? ' ($expiresAt)' : ''}'
        : 'সীমিত অ্যাক্সেস • সকল ফিচার আনলক করতে আপগ্রেড করুন';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: isPro
                  ? const LinearGradient(
                      colors: [Color(0xFF004633), Color(0xFF059669)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    )
                  : null,
              color: isPro
                  ? null
                  : (isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9)),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: Icon(
                isPro ? LucideIcons.crown : LucideIcons.user,
                color: isPro
                    ? const Color(0xFFFDE68A)
                    : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B)),
                size: 22,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'বর্তমান প্ল্যান: ',
                      style: TextStyle(
                        color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                        fontSize: 12.5,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                    Flexible(
                      child: Text(
                        planTitle,
                        style: TextStyle(
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                          fontSize: 14.5,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'HindSiliguri',
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  subTitle,
                  style: TextStyle(
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                    fontSize: 12.5,
                    fontFamily: 'HindSiliguri',
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: isPro
                  ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFE6F4EA))
                  : (isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9)),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              isPro ? 'সক্রিয়' : 'ফ্রি',
              style: TextStyle(
                color: isPro
                    ? (isDark ? const Color(0xFF34D399) : const Color(0xFF004633))
                    : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B)),
                fontSize: 12,
                fontWeight: FontWeight.w800,
                fontFamily: 'HindSiliguri',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UnifiedFeaturesShowcase extends StatelessWidget {
  final bool isDark;
  const _UnifiedFeaturesShowcase({required this.isDark});

  static const _featuresList = [
    (
      icon: LucideIcons.zap,
      title: 'সীমাহীন কাস্টম ও পূর্ণাঙ্গ মডেল টেস্ট',
    ),
    (
      icon: LucideIcons.bookOpen,
      title: 'প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা ও সমাধান',
    ),
    (
      icon: LucideIcons.trophy,
      title: 'জাতীয় লাইভ পরীক্ষা ও লিডারবোর্ড র‍্যাংকিং',
    ),
    (
      icon: LucideIcons.lineChart,
      title: 'স্মার্ট পারফরম্যান্স অ্যানালিটিক্স ও রিপোর্ট',
    ),
    (
      icon: LucideIcons.bookmark,
      title: 'বুকমার্ক প্রশ্ন ও ফ্ল্যাশকার্ড রিভিশন মোড',
    ),
    (
      icon: LucideIcons.binary,
      title: 'সকল বিষয়ের ফর্মুলা ব্যাংক ও চিটশিট',
    ),
    (
      icon: LucideIcons.shieldCheck,
      title: '১০০% বিজ্ঞাপনমুক্ত নিরবচ্ছিন্ন প্র্যাকটিস',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final cardBg = isDark ? const Color(0xFF18181B) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(22),
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
                  color: const Color(0xFF004633).withValues(alpha: isDark ? 0.25 : 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(LucideIcons.crown, color: Color(0xFF004633), size: 16),
              ),
              const SizedBox(width: 10),
              Text(
                'প্রিমিয়াম প্ল্যানে যা যা থাকছে',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'HindSiliguri',
                  color: textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ..._featuresList.asMap().entries.map((entry) {
            final idx = entry.key;
            final f = entry.value;
            final isLast = idx == _featuresList.length - 1;

            return Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: const Color(0xFF004633).withValues(alpha: isDark ? 0.2 : 0.08),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: const Color(0xFF004633).withValues(alpha: isDark ? 0.3 : 0.15),
                      ),
                    ),
                    child: Center(
                      child: Icon(f.icon, size: 15, color: isDark ? const Color(0xFF4ADE80) : const Color(0xFF004633)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      f.title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'HindSiliguri',
                        color: textPrimary,
                      ),
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
}

class _TrustBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color iconColor;
  final bool isDark;

  const _TrustBadge({
    required this.icon,
    required this.label,
    required this.iconColor,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: isDark ? 0.16 : 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 16),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w700,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _ComparisonTable extends StatelessWidget {
  final bool isDark;

  const _ComparisonTable({required this.isDark});

  static const _features = [
    ('দৈনিক পরীক্ষা কোটা', '২টি / দিন', 'সীমাহীন', false),
    ('দৈনিক প্র্যাকটিস সেশন', '১টি / দিন', 'সীমাহীন', false),
    ('প্রতি পরীক্ষায় প্রশ্ন সংখ্যা', 'সর্বোচ্চ ৫০', '১০০+ পূর্ণাঙ্গ', false),
    ('বুকমার্ক প্রশ্ন সংরক্ষণ', 'সর্বোচ্চ ২৫টি', 'সীমাহীন', false),
    ('প্রশ্নের বিস্তারিত ব্যাখ্যা ও ট্রিকস', null, null, true),
    ('পারফরম্যান্স ও ফলাফল অ্যানালিটিক্স', null, null, true),
    ('জাতীয় লাইভ পরীক্ষা ও লিডারবোর্ড', null, null, true),
    ('অধ্যায়ভিত্তিক ফর্মুলা ব্যাংক', null, null, true),
    ('ডেইলি স্ট্রিক ও মিশন রিওয়ার্ড', null, null, true),
    ('১০০% বিজ্ঞাপনমুক্ত পরিবেশ', null, null, false),
  ];

  @override
  Widget build(BuildContext context) {
    final cardBg = isDark ? const Color(0xFF18181B) : Colors.white;
    final borderColor = isDark
        ? const Color(0xFF27272A)
        : const Color(0xFFE2E8F0);
    final headerBg = isDark
        ? const Color(0xFF202024)
        : const Color(0xFFF8FAFC);
    final textMain = isDark ? const Color(0xFFF4F4F5) : const Color(0xFF0F172A);
    final textSub = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);
    final crossColor = isDark ? const Color(0xFF52525B) : const Color(0xFF94A3B8);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Text(
            'ফ্রি বনাম প্রিমিয়াম',
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: borderColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header row
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                decoration: BoxDecoration(
                  color: headerBg,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(20),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      flex: 4,
                      child: Text(
                        'ফিচার',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 14.5,
                          fontWeight: FontWeight.w800,
                          color: textSub,
                        ),
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: Center(
                        child: Text(
                          'ফ্রি',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                            color: textSub,
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: Center(
                        child: Text(
                          'প্রিমিয়াম',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 14.5,
                            fontWeight: FontWeight.w900,
                            color: isDark ? const Color(0xFF4ADE80) : const Color(0xFF004633),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Feature rows
              ..._features.asMap().entries.map((entry) {
                final feature = entry.value;
                final String label = feature.$1;
                final String? freeText = feature.$2;
                final String? paidText = feature.$3;
                final bool isBothTrue = feature.$4;

                Widget buildCellContent(String? text, bool isTrue, bool isPaidColumn) {
                  if (text != null) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isPaidColumn
                            ? (isDark ? const Color(0xFF052E1B) : const Color(0xFFECFDF5))
                            : (isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9)),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        text,
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: isPaidColumn
                              ? (isDark ? const Color(0xFF4ADE80) : const Color(0xFF004633))
                              : textSub,
                        ),
                      ),
                    );
                  }
                  if (isTrue) {
                    return Icon(
                      LucideIcons.check,
                      size: 18,
                      color: isDark ? const Color(0xFF4ADE80) : const Color(0xFF004633),
                    );
                  }
                  return Icon(
                    LucideIcons.xCircle,
                    size: 17,
                    color: crossColor,
                  );
                }

                return Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 13,
                  ),
                  decoration: BoxDecoration(
                    border: Border(top: BorderSide(color: borderColor)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 4,
                        child: Text(
                          label,
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                            color: textMain,
                            height: 1.25,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Center(
                          child: buildCellContent(freeText, isBothTrue, false),
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Center(
                          child: buildCellContent(paidText, true, true),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ],
    );
  }
}
