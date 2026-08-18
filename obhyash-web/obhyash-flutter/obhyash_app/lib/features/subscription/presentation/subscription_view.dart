import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/models.dart';
import 'payment_view.dart';

class SubscriptionView extends StatefulWidget {
  const SubscriptionView({super.key});

  @override
  State<SubscriptionView> createState() => _SubscriptionViewState();
}

class _SubscriptionViewState extends State<SubscriptionView> {
  bool _isLoading = true;
  List<SubscriptionPlan> _plans = [];
  SubscriptionPlan? _activeSubscription;
  String _currentPlanId = 'free';
  DateTime? _expiresAt;

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

      // 1. Fetch plans
      final plansData = await supabase
          .from('subscription_plans')
          .select()
          .eq('is_active', true)
          .order('price', ascending: true);

      final plans = (plansData as List)
          .map((p) => SubscriptionPlan.fromJson(p as Map<String, dynamic>))
          .toList();

      // 2. Fetch active subscription
      SubscriptionPlan? activeSub;
      String currentPlanId = 'free';
      DateTime? expiresAt;

      if (userId != null) {
        // Try subscription_history first
        final histData = await supabase
            .from('subscription_history')
            .select('*, subscription_plans(*)')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('started_at', ascending: false)
            .limit(1);

        final hist = histData as List;
        if (hist.isNotEmpty) {
          final h = hist.first as Map<String, dynamic>;
          final planJson = h['subscription_plans'] as Map<String, dynamic>?;
          final rawExpires = h['expires_at'] as String?;
          if (rawExpires != null) {
            expiresAt = DateTime.tryParse(rawExpires);
          }

          if (planJson != null) {
            activeSub = SubscriptionPlan.fromJson(
              planJson,
              expiresAt: rawExpires?.substring(0, 10),
            );
            currentPlanId = activeSub.id;
          } else {
            // Find by plan_id in fetched plans list
            final matched = plans.where((p) => p.id == h['plan_id']).firstOrNull;
            if (matched != null) {
              activeSub = SubscriptionPlan(
                id: matched.id,
                name: matched.name,
                price: matched.price,
                billingCycle: matched.billingCycle,
                durationDays: matched.durationDays,
                currency: matched.currency,
                features: matched.features,
                colorTheme: matched.colorTheme,
                expiresAt: rawExpires?.substring(0, 10),
              );
              currentPlanId = matched.id;
            } else if (expiresAt != null && expiresAt.isAfter(DateTime.now())) {
              // Reward / Custom Plan
              final days = expiresAt.difference(DateTime.now()).inDays.clamp(1, 999);
              activeSub = SubscriptionPlan(
                id: 'active_custom_plan',
                name: 'প্রো সাবস্ক্রিপশন',
                price: 0,
                billingCycle: days >= 365 ? 'Yearly' : days >= 90 ? 'Quarterly' : 'Monthly',
                durationDays: days,
                currency: '৳',
                features: const [
                  'সকল প্রিমিয়াম প্রশ্নের সমাধান',
                  'আনলিমিটেড মডেল টেস্ট ও লাইভ এক্সাম',
                  'পূর্ণাঙ্গ এনালাইসিস ও পারফরম্যান্স গ্রাফ'
                ],
                colorTheme: 'emerald',
                expiresAt: rawExpires?.substring(0, 10),
              );
              currentPlanId = 'pro';
            }
          }
        }

        // Fallback: Check 'users' table
        if (activeSub == null) {
          try {
            final userRes = await supabase
                .from('users')
                .select('subscription, subscription_status, subscription_expires_at, is_subscribed, plan, level')
                .eq('id', userId)
                .maybeSingle();

            if (userRes != null) {
              final subJson = userRes['subscription'] as Map<String, dynamic>?;
              final rawStatus = (subJson?['status'] ?? userRes['subscription_status'])?.toString().toLowerCase().trim();
              final rawExp = subJson?['expiry'] ?? subJson?['expires_at'] ?? userRes['subscription_expires_at'];
              DateTime? parsedExp;
              if (rawExp != null) parsedExp = DateTime.tryParse(rawExp.toString());
              final bool isExpired = parsedExp != null && parsedExp.isBefore(DateTime.now());

              final bool isSub = (userRes['is_subscribed'] == true && !isExpired) ||
                  (rawStatus == 'active' && !isExpired) ||
                  (userRes['plan']?.toString().toLowerCase() == 'pro' && !isExpired) ||
                  (parsedExp != null && parsedExp.isAfter(DateTime.now()) && (subJson != null || userRes['subscription_status'] != null));

              if (isSub) {
                expiresAt = parsedExp;
                final days = parsedExp != null
                    ? parsedExp.difference(DateTime.now()).inDays.clamp(1, 999)
                    : 30;
                final planTitle = (subJson?['plan'] ?? 'প্রো সাবস্ক্রিপশন').toString();
                final matchedPlan = plans.where((p) =>
                    p.id == subJson?['plan_id'] ||
                    p.name.toLowerCase().trim() == planTitle.toLowerCase().trim() ||
                    p.name.toLowerCase().contains(planTitle.toLowerCase()) ||
                    planTitle.toLowerCase().contains(p.name.toLowerCase())).firstOrNull;

                activeSub = SubscriptionPlan(
                  id: matchedPlan?.id ?? 'user_active_sub',
                  name: matchedPlan?.name ?? planTitle,
                  price: matchedPlan?.price ?? 0,
                  billingCycle: matchedPlan?.billingCycle ?? (days >= 365 ? 'Yearly' : days >= 90 ? 'Quarterly' : 'Monthly'),
                  durationDays: days,
                  currency: matchedPlan?.currency ?? '৳',
                  features: matchedPlan?.features ?? const [
                    'সকল প্রিমিয়াম প্রশ্নের সমাধান',
                    'আনলিমিটেড মডেল টেস্ট ও লাইভ এক্সাম',
                    'পূর্ণাঙ্গ এনালাইসিস ও পারফরম্যান্স গ্রাফ'
                  ],
                  colorTheme: 'emerald',
                  expiresAt: parsedExp != null && parsedExp.toIso8601String().length >= 10
                      ? parsedExp.toIso8601String().substring(0, 10)
                      : null,
                );
                currentPlanId = activeSub.id;
              }
            }
          } catch (userSubErr) {
            debugPrint('User profile sub check error: $userSubErr');
          }
        }
      }

      if (mounted) {
        setState(() {
          _plans = plans;
          _activeSubscription = activeSub;
          _currentPlanId = currentPlanId;
          _expiresAt = expiresAt;
          _isLoading = false;
        });
      }
    } catch (e, stack) {
      debugPrint('Error loading subscription data: $e\n$stack');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handlePlanSelect(SubscriptionPlan plan) {
    if (plan.id == _currentPlanId || plan.id == 'free') return;
    Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute(builder: (_) => PaymentView(plan: plan)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final premiumPlans = _plans.where((p) => p.price > 0).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // HERO BANNER
          if (_isLoading)
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF000000)
                    : const Color(0xFF1C1C1E),
                borderRadius: BorderRadius.circular(24),
              ),
            )
          else
            _HeroBanner(isDark: isDark),

          const SizedBox(height: 24),

          // ACTIVE SUBSCRIPTION BANNER
          if (!_isLoading && _activeSubscription != null) ...[
            _ActiveSubscriptionBanner(
              planName: _activeSubscription!.name,
              daysRemaining: _daysRemaining,
              expiresAt: _activeSubscription!.expiresAt,
            ),
            const SizedBox(height: 24),
          ],

          // PRICING HEADER
          const Center(
            child: Text(
              'তোমার প্ল্যান বেছে নাও',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
            ),
          ),
          const SizedBox(height: 4),
          const Center(
            child: Text(
              'যেকোনো সময় বাতিল করা যাবে',
              style: TextStyle(fontSize: 16, color: Color(0xFF737373)),
            ),
          ),
          const SizedBox(height: 24),

          // PRICING CARDS
          if (_isLoading)
            ...[1, 2].map(
              (i) => Container(
                height: 250,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF000000) : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                ),
              ),
            )
          else if (premiumPlans.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF000000) : Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Center(
                child: Text('কোনো প্রিমিয়াম প্ল্যান পাওয়া যায়নি।'),
              ),
            )
          else
            ...premiumPlans.map(
              (plan) {
                final isCurrent = _currentPlanId == plan.id ||
                    (_activeSubscription != null &&
                        (_activeSubscription!.id == plan.id ||
                            _activeSubscription!.name.toLowerCase().trim() ==
                                plan.name.toLowerCase().trim() ||
                            plan.name
                                .toLowerCase()
                                .contains(_activeSubscription!.name.toLowerCase()) ||
                            _activeSubscription!.name
                                .toLowerCase()
                                .contains(plan.name.toLowerCase())));
                return Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: _PricingCard(
                    plan: plan,
                    isCurrent: isCurrent,
                    onSelect: () => _handlePlanSelect(plan),
                    isDark: isDark,
                  ),
                );
              },
            ),

          const SizedBox(height: 16),

          // TRUST BADGES
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
                iconColor: const Color(0xFFB91C1C),
                bgColor: isDark
                    ? const Color(0xFF1A0505)
                    : const Color(0xFFFFF0F0),
                isDark: isDark,
              ),
              _TrustBadge(
                icon: LucideIcons.clock,
                label: 'তাৎক্ষণিক অ্যাক্সেস',
                iconColor: const Color(0xFF16A34A),
                bgColor: isDark
                    ? const Color(0xFF051A0A)
                    : const Color(0xFFF0FFF4),
                isDark: isDark,
              ),
              _TrustBadge(
                icon: LucideIcons.shieldCheck,
                label: 'নিরাপদ পেমেন্ট',
                iconColor: const Color(0xFF000000),
                bgColor: isDark
                    ? const Color(0xFF050B1A)
                    : const Color(0xFFF0F4FF),
                isDark: isDark,
              ),
              _TrustBadge(
                icon: LucideIcons.refreshCw,
                label: 'রিনিউ সহজ',
                iconColor: const Color(0xFF9333EA),
                bgColor: isDark
                    ? const Color(0xFF10051A)
                    : const Color(0xFFF8F0FF),
                isDark: isDark,
              ),
            ],
          ),

          const SizedBox(height: 28),

          // COMPARISON TABLE
          _ComparisonTable(isDark: isDark),

          const SizedBox(height: 48),
        ],
      ),
    );
  }
}

class _HeroBanner extends StatelessWidget {
  final bool isDark;
  const _HeroBanner({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF064E3B), const Color(0xFF022C22)] // Deep emerald gradient
              : [const Color(0xFF059669), const Color(0xFF059669)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF059669).withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
              borderRadius: BorderRadius.circular(30),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.zap, size: 14, color: Color(0xFF6EE7B7)),
                SizedBox(width: 8),
                Text(
                  'প্রিমিয়াম প্ল্যান',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'আরো বেশি পড়ো,\nআরো ভালো প্রস্তুতি নাও',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 30,
              fontWeight: FontWeight.w900,
              height: 1.2,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'সীমাহীন পরীক্ষা, AI সাজেশন, বিস্তারিত এনালাইসিস — সব কিছু এক প্ল্যানে',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.85),
              fontSize: 16,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActiveSubscriptionBanner extends StatelessWidget {
  final String planName;
  final int daysRemaining;
  final String? expiresAt;

  const _ActiveSubscriptionBanner({
    required this.planName,
    required this.daysRemaining,
    this.expiresAt,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF14532D), Color(0xFF166534)],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0x3316A34A),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Center(
              child: Icon(
                LucideIcons.crown,
                color: Color(0xFF4ADE80),
                size: 22,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  planName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'মেয়াদ: $daysRemaining দিন বাকি${expiresAt != null ? ' ($expiresAt)' : ''}',
                  style: const TextStyle(
                    color: Color(0xFF86EFAC),
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF4ADE80),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'সক্রিয়',
              style: TextStyle(
                color: Color(0xFF14532D),
                fontSize: 14,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PricingCard extends StatelessWidget {
  final SubscriptionPlan plan;
  final bool isCurrent;
  final VoidCallback onSelect;
  final bool isDark;

  const _PricingCard({
    required this.plan,
    required this.isCurrent,
    required this.onSelect,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final bool isMasterPro = plan.durationDays >= 180;
    final bool isTopRankers = plan.durationDays >= 90 && plan.durationDays < 180;

    // Accent Colors
    final Color accentColor = isMasterPro
        ? const Color(0xFFD97706) // Amber / Gold
        : isTopRankers
            ? const Color(0xFF059669) // Emerald
            : const Color(0xFF4F46E5); // Indigo

    // Gradient Card Background
    final cardGradient = isDark
        ? LinearGradient(
            colors: isMasterPro
                ? [const Color(0xFF261D0F), const Color(0xFF18130B)]
                : isTopRankers
                    ? [const Color(0xFF142921), const Color(0xFF0E1A15)]
                    : [const Color(0xFF18181B), const Color(0xFF121215)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          )
        : LinearGradient(
            colors: isMasterPro
                ? [const Color(0xFFFFFBEB), Colors.white]
                : isTopRankers
                    ? [const Color(0xFFF0FDF4), Colors.white]
                    : [Colors.white, const Color(0xFFFAFAFA)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          );

    final borderColor = isMasterPro
        ? const Color(0xFFD97706).withValues(alpha: isDark ? 0.8 : 0.6)
        : isTopRankers
            ? const Color(0xFF059669).withValues(alpha: isDark ? 0.8 : 0.6)
            : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0));

    // Badge configuration
    String? badgeText;
    IconData? badgeIcon;
    List<Color>? badgeColors;

    if (isMasterPro) {
      badgeText = 'মেগা সেভার 👑 ৫০% সাশ্রয়';
      badgeIcon = LucideIcons.crown;
      badgeColors = const [Color(0xFFB45309), Color(0xFFD97706)];
    } else if (isTopRankers) {
      badgeText = 'জনপ্রিয় 🌟 ৪১% সাশ্রয়';
      badgeIcon = LucideIcons.sparkles;
      badgeColors = const [Color(0xFF064E3B), Color(0xFF059669)];
    } else {
      badgeText = 'স্টার্টার ⚡';
      badgeIcon = LucideIcons.zap;
      badgeColors = const [Color(0xFF312E81), Color(0xFF4F46E5)];
    }

    // Monthly breakdown calculation
    String monthlyCostText;
    if (isMasterPro) {
      monthlyCostText = 'প্রতি মাসে মাত্র ৳৯৯ • সেরা লং-টার্ম ভ্যালু!';
    } else if (isTopRankers) {
      monthlyCostText = 'প্রতি মাসে মাত্র ৳১১৬ • সিজন স্পেশাল!';
    } else {
      monthlyCostText = '৩০ দিন ফুল এক্সেস • এককালীন পেমেন্ট';
    }

    return Container(
      decoration: BoxDecoration(
        gradient: cardGradient,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: borderColor,
          width: (isMasterPro || isTopRankers) ? 1.6 : 1.2,
        ),
        boxShadow: [
          if (isMasterPro)
            BoxShadow(
              color: const Color(0xFFD97706).withValues(alpha: isDark ? 0.25 : 0.12),
              blurRadius: 24,
              offset: const Offset(0, 8),
            )
          else if (isTopRankers)
            BoxShadow(
              color: const Color(0xFF059669).withValues(alpha: isDark ? 0.25 : 0.12),
              blurRadius: 24,
              offset: const Offset(0, 8),
            )
          else
            BoxShadow(
              color: isDark ? const Color(0x2A000000) : const Color(0x08000000),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
        ],
      ),
      child: Stack(
        children: [
          // Top-right dynamic badge
          Positioned(
            top: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: badgeColors),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: accentColor.withValues(alpha: 0.35),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(badgeIcon, size: 12, color: Colors.white),
                  const SizedBox(width: 4),
                  Text(
                    badgeText,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'HindSiliguri',
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 2),
                Text(
                  plan.name,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'HindSiliguri',
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '৳${plan.price}',
                      style: TextStyle(
                        fontSize: 34,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        height: 1,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '/ ${plan.durationDays} দিন',
                      style: TextStyle(
                        fontSize: 16,
                        color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  monthlyCostText,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'HindSiliguri',
                    color: accentColor,
                  ),
                ),
                const SizedBox(height: 16),
                Divider(
                  height: 1,
                  thickness: 0.8,
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                ),
                const SizedBox(height: 16),
                ...plan.features.map(
                  (feature) => Padding(
                    padding: const EdgeInsets.only(bottom: 11),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 22,
                          height: 22,
                          margin: const EdgeInsets.only(top: 1),
                          decoration: BoxDecoration(
                            color: accentColor.withValues(alpha: isDark ? 0.22 : 0.12),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Icon(
                              LucideIcons.check,
                              size: 13,
                              color: accentColor,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            feature,
                            style: TextStyle(
                              fontSize: 14.5,
                              height: 1.35,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'HindSiliguri',
                              color: isDark
                                  ? const Color(0xFFE4E4E7)
                                  : const Color(0xFF334155),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: isCurrent ? null : onSelect,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isCurrent
                          ? (isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB))
                          : (isMasterPro
                              ? const Color(0xFFB45309)
                              : isTopRankers
                                  ? const Color(0xFF004633)
                                  : const Color(0xFF3730A3)),
                      foregroundColor: isCurrent
                          ? (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A))
                          : Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: !isMasterPro && !isTopRankers && !isCurrent
                            ? BorderSide(
                                color: isDark ? const Color(0xFF3F3F46) : const Color(0xFF4338CA),
                                width: 1,
                              )
                            : BorderSide.none,
                      ),
                      elevation: (isMasterPro || isTopRankers) ? 3 : 0,
                      shadowColor: accentColor.withValues(alpha: 0.35),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          isCurrent ? 'বর্তমান প্ল্যান' : 'এই প্ল্যানটি নাও',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'HindSiliguri',
                            color: isCurrent
                                ? (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A))
                                : Colors.white,
                          ),
                        ),
                        if (!isCurrent) ...[
                          const SizedBox(width: 8),
                          Icon(
                            (isMasterPro || isTopRankers) ? LucideIcons.sparkles : LucideIcons.arrowRight,
                            size: 16,
                            color: Colors.white,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TrustBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color iconColor;
  final Color bgColor;
  final bool isDark;

  const _TrustBadge({
    required this.icon,
    required this.label,
    required this.iconColor,
    required this.bgColor,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? bgColor.withValues(alpha: 0.5) : bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: iconColor.withValues(alpha: isDark ? 0.2 : 0.1),
        ),
        boxShadow: [
          if (!isDark)
            BoxShadow(
              color: iconColor.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 16),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: isDark
                    ? const Color(0xFFE5E5E5)
                    : const Color(0xFF171717),
              ),
             maxLines: 1, overflow: TextOverflow.ellipsis),
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
    ('দৈনিক মক পরীক্ষা', '৩টি', 'সীমাহীন', false),
    ('অনুশীলন প্রশ্ন', '৫০টি/দিন', 'সীমাহীন', false),
    ('প্রশ্নব্যাংক অ্যাক্সেস', null, null, true),
    ('বিস্তারিত ব্যাখ্যা', null, null, false),
    ('বিষয়ভিত্তিক এনালাইসিস', null, null, false),
    ('লিডারবোর্ড', null, null, true),
    ('পেপার স্ক্রিপ্ট আপলোড', null, null, false),
    ('কাস্টম পরীক্ষা', null, null, false),
    ('AI সাজেশন', null, null, false),
    ('ডাউনলোড/প্রিন্ট', null, null, false),
    ('২৪/৭ সাপোর্ট', null, null, false),
  ];

  @override
  Widget build(BuildContext context) {
    final cardBg = isDark ? const Color(0xFF000000) : Colors.white;
    final borderColor = isDark
        ? const Color(0xFF1C1C1E)
        : const Color(0xFFE5E5E5);
    final textMain = isDark ? Colors.white : const Color(0xFF000000);
    final textSub = isDark ? const Color(0xFF737373) : const Color(0xFFA3A3A3);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Center(
          child: Text(
            'ফ্রি বনাম প্রিমিয়াম',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
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
                  color: isDark
                      ? const Color(0xFF000000)
                      : const Color(0xFFF5F5F5),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(20),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: Text(
                        'ফিচার',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: textSub,
                        ),
                       maxLines: 1, overflow: TextOverflow.ellipsis),
                    ),
                    Expanded(
                      child: Center(
                        child: Text(
                          'ফ্রি',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: textSub,
                          ),
                         maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                    ),
                    Expanded(
                      child: Container(
                        alignment: Alignment.center,
                        child: Text(
                          'প্রিমিয়াম',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF059669),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Feature rows
              ..._features.map((feature) {
                final String label = feature.$1;
                final String? freeText = feature.$2;
                final String? paidText = feature.$3;
                final bool isBothTrue = feature.$4;

                Widget buildCellContent(String? text, bool isTrue) {
                  if (text != null) {
                    return Text(
                      text,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: textMain,
                      ),
                    );
                  }
                  if (isTrue) {
                    return const Icon(
                      LucideIcons.check,
                      size: 16,
                      color: Color(0xFF15803D),
                    );
                  }
                  return Icon(
                    LucideIcons.xCircle,
                    size: 16,
                    color: isDark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFD4D4D4),
                  );
                }

                return Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    border: Border(top: BorderSide(color: borderColor)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: Text(
                          label,
                          style: TextStyle(fontSize: 16, color: textMain),
                         maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                      Expanded(
                        child: Center(
                          child: buildCellContent(freeText, isBothTrue),
                        ),
                      ),
                      Expanded(
                        child: Center(child: buildCellContent(paidText, true)),
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
