import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/models.dart';
import '../domain/coupon_service.dart';
import 'payment_view.dart';
import 'widgets/coupon_bottom_sheet.dart';

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
  int _selectedPlanIndex = 1;

  // ── Coupon state ──────────────────────────────────────────────────────
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
        } else {
          // Fallback to user metadata
          try {
            final userRes = await supabase
                .from('users')
                .select('subscription, subscription_status, subscription_expires_at, is_subscribed')
                .eq('id', userId)
                .maybeSingle();

            if (userRes != null) {
              final isSub = userRes['is_subscribed'] == true ||
                  (userRes['subscription_status'] as String?)?.toLowerCase() == 'active';
              final expStr = userRes['subscription_expires_at'] as String?;
              final parsedExp = expStr != null ? DateTime.tryParse(expStr) : null;

              if (isSub && parsedExp != null && parsedExp.isAfter(DateTime.now())) {
                final subMeta = userRes['subscription'] as Map<String, dynamic>?;
                final planTitle = (subMeta?['plan'] as String?) ?? 'প্রো প্ল্যান';
                final days = parsedExp.difference(DateTime.now()).inDays.clamp(1, 999);

                final matchedPlan = plans.where((p) =>
                    p.id == (subMeta?['plan_id'] as String?) ||
                    p.name.toLowerCase() == planTitle.toLowerCase() ||
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
                  expiresAt: parsedExp.toIso8601String().length >= 10
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
        final premium = plans.where((p) => p.price > 0).toList();
        int defaultIdx = 0;
        if (premium.length >= 2) {
          defaultIdx = 1;
        }

        setState(() {
          _plans = plans;
          _activeSubscription = activeSub;
          _currentPlanId = currentPlanId;
          _expiresAt = expiresAt;
          _selectedPlanIndex = defaultIdx;
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

    // Apply coupon discount if active
    SubscriptionPlan effectivePlan = plan;
    if (_appliedCoupon != null && plan.price > 0) {
      final discountedPrice = CouponService.effectivePrice(plan.price, _appliedCoupon);
      if (discountedPrice != plan.price) {
        effectivePlan = SubscriptionPlan(
          id: plan.id,
          name: plan.name,
          price: discountedPrice,
          billingCycle: plan.billingCycle,
          durationDays: plan.durationDays,
          currency: plan.currency,
          features: plan.features,
          colorTheme: plan.colorTheme,
          expiresAt: plan.expiresAt,
        );
      }
    }

    Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute(
        builder: (_) => PaymentView(
          plan: effectivePlan,
          appliedCouponCode: _appliedCoupon?.code,
        ),
      ),
    );
  }

  /// Opens a bottom sheet for coupon entry.
  void _openCouponSheet([int? planPrice]) {
    final premiumPlans = _plans.where((p) => p.price > 0).toList();
    final selectedPlan = (premiumPlans.isNotEmpty && _selectedPlanIndex < premiumPlans.length)
        ? premiumPlans[_selectedPlanIndex]
        : (premiumPlans.isNotEmpty ? premiumPlans.first : null);
    final refPrice = planPrice ?? selectedPlan?.price ?? 149;

    CouponBottomSheet.show(
      context: context,
      appliedCoupon: _appliedCoupon,
      planPrice: refPrice,
      onApply: (code) {
        final result = CouponService.validate(code, refPrice);
        if (result.isValid && result.appliedCoupon != null) {
          setState(() => _appliedCoupon = result.appliedCoupon);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                "🎉 '${result.appliedCoupon!.code}' কুপন সফলভাবে প্রয়োগ হয়েছে!",
                style: const TextStyle(fontFamily: 'HindSiliguri', fontWeight: FontWeight.w700),
              ),
              backgroundColor: const Color(0xFF004633),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                result.errorMessage ?? 'অকার্যকর কুপন কোড!',
                style: const TextStyle(fontFamily: 'HindSiliguri', fontWeight: FontWeight.w700),
              ),
              backgroundColor: const Color(0xFF991B1B),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          );
        }
      },
      onRemove: () {
        setState(() => _appliedCoupon = null);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'কুপন মুছে ফেলা হয়েছে',
              style: TextStyle(fontFamily: 'HindSiliguri', fontWeight: FontWeight.w700),
            ),
            backgroundColor: Colors.grey[700],
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final premiumPlans = _plans.where((p) => p.price > 0).toList();
    final selectedPlan = (premiumPlans.isNotEmpty && _selectedPlanIndex < premiumPlans.length)
        ? premiumPlans[_selectedPlanIndex]
        : (premiumPlans.isNotEmpty ? premiumPlans.first : null);

    return RefreshIndicator(
      color: const Color(0xFF004633),
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        padding: const EdgeInsets.fromLTRB(10, 20, 10, 48),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
          // ACTIVE SUBSCRIPTION BANNER
          if (!_isLoading && _activeSubscription != null) ...[
            _ActiveSubscriptionBanner(
              planName: _activeSubscription!.name,
              daysRemaining: _daysRemaining,
              expiresAt: _activeSubscription!.expiresAt,
            ),
            const SizedBox(height: 28),
          ],

          // MASTER PRICING & PLAN CARD
          Container(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF141417) : Colors.white,
              borderRadius: BorderRadius.circular(28),
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
                // PRICING HEADER
                Text(
                  'তোমার প্ল্যান বেছে নাও',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'HindSiliguri',
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  'সব প্ল্যানে সম্পূর্ণ প্রিমিয়াম অ্যাক্সেস আনলক হবে',
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                    fontFamily: 'HindSiliguri',
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 18),

                // COMPACT PLAN SELECTOR CARDS
                if (_isLoading)
                  ...[1, 2, 3].map(
                    (i) => Container(
                      height: 84,
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E1E22) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                  )
                else if (premiumPlans.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E1E22) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Center(
                      child: Text(
                        'কোনো প্রিমিয়াম প্ল্যান পাওয়া যায়নি।',
                        style: TextStyle(fontFamily: 'HindSiliguri'),
                      ),
                    ),
                  )
                else ...[
                  // Compact Interactive Selectable Cards
                  ...premiumPlans.asMap().entries.map((entry) {
                    final index = entry.key;
                    final plan = entry.value;
                    final isSelected = _selectedPlanIndex == index;
                    final isCurrent = _currentPlanId == plan.id ||
                        (_activeSubscription != null &&
                            (_activeSubscription!.id == plan.id ||
                                _activeSubscription!.name.toLowerCase().trim() ==
                                    plan.name.toLowerCase().trim()));

                    return _CompactPlanCard(
                      plan: plan,
                      isSelected: isSelected,
                      isCurrent: isCurrent,
                      isDark: isDark,
                      appliedCoupon: _appliedCoupon,
                      onTap: () {
                        setState(() {
                          _selectedPlanIndex = index;
                        });
                      },
                    );
                  }),

                  const SizedBox(height: 4),

                  // ── Coupon prompt / remove coupon text link (no box) ──────────
                  Center(
                    child: GestureDetector(
                      onTap: () {
                        if (_appliedCoupon != null) {
                          setState(() => _appliedCoupon = null);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: const Text(
                                'কুপন মুছে ফেলা হয়েছে',
                                style: TextStyle(fontFamily: 'HindSiliguri', fontWeight: FontWeight.w700),
                              ),
                              backgroundColor: Colors.grey[700],
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                          );
                        } else {
                          _openCouponSheet();
                        }
                      },
                      behavior: HitTestBehavior.opaque,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        child: Text(
                          _appliedCoupon != null ? 'কুপন রিমুভ করুন' : 'কুপন আছে?',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'HindSiliguri',
                            color: _appliedCoupon != null
                                ? (isDark ? const Color(0xFFF87171) : const Color(0xFFDC2626))
                                : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B)),
                            decoration: TextDecoration.underline,
                            decorationColor: _appliedCoupon != null
                                ? (isDark ? const Color(0xFFF87171) : const Color(0xFFDC2626))
                                : (isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8)),
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 6),

                  // PRIMARY CTA BUTTON FOR SELECTED PLAN
                  if (selectedPlan != null)
                    Builder(builder: (ctx) {
                      final effectivePrice = CouponService.effectivePrice(selectedPlan.price, _appliedCoupon);
                      final hasDiscount = effectivePrice != selectedPlan.price;
                      return SizedBox(
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
                          onPressed: () => _handlePlanSelect(selectedPlan),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text(
                                'পেমেন্ট করতে এগিয়ে যান',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  fontFamily: 'HindSiliguri',
                                  letterSpacing: 0.2,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (hasDiscount) ...[
                                      Text(
                                        '৳${selectedPlan.price}',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w500,
                                          fontFamily: 'HindSiliguri',
                                          color: Colors.white60,
                                          decoration: TextDecoration.lineThrough,
                                          decorationColor: Colors.white60,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                    ],
                                    Text(
                                      '৳$effectivePrice',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w900,
                                        fontFamily: 'HindSiliguri',
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Icon(LucideIcons.arrowRight, size: 18),
                            ],
                          ),
                        ),
                      );
                    }),
                ],
              ],
            ),
          ),

          const SizedBox(height: 24),

          // UNIFIED WHAT'S INCLUDED FEATURE SHOWCASE (SHOWN ONCE)
          _UnifiedFeaturesShowcase(isDark: isDark),

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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF27272A) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE2E8F0),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Icon(
                LucideIcons.crown,
                color: isDark ? const Color(0xFFFBBF24) : const Color(0xFFD97706),
                size: 20,
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
                  style: TextStyle(
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                    fontSize: 15.5,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'HindSiliguri',
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'মেয়াদ: $daysRemaining দিন বাকি${expiresAt != null ? ' ($expiresAt)' : ''}',
                  style: TextStyle(
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                    fontSize: 13,
                    fontFamily: 'HindSiliguri',
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF064E3B) : const Color(0xFFE6F4EA),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'সক্রিয়',
              style: TextStyle(
                color: isDark ? const Color(0xFF34D399) : const Color(0xFF004633),
                fontSize: 12.5,
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

class _CompactPlanCard extends StatelessWidget {
  final SubscriptionPlan plan;
  final bool isSelected;
  final bool isCurrent;
  final bool isDark;
  final VoidCallback onTap;
  final AppliedCoupon? appliedCoupon;

  const _CompactPlanCard({
    required this.plan,
    required this.isSelected,
    required this.isCurrent,
    required this.isDark,
    required this.onTap,
    this.appliedCoupon,
  });

  @override
  Widget build(BuildContext context) {
    final bool isMasterPro = plan.durationDays >= 180;

    final activeBorderColor = isSelected
        ? (isMasterPro
            ? (isDark ? const Color(0xFFF59E0B) : const Color(0xFFD97706))
            : (isDark ? const Color(0xFF10B981) : const Color(0xFF059669)))
        : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0));

    final accentBrandColor = isMasterPro
        ? const Color(0xFFD97706)
        : (isDark ? const Color(0xFF10B981) : const Color(0xFF059669));

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        decoration: BoxDecoration(
          color: isDark
              ? (isSelected
                  ? (isMasterPro ? const Color(0xFF271A0A) : const Color(0xFF062319))
                  : const Color(0xFF1C1C20))
              : (isSelected
                  ? (isMasterPro ? const Color(0xFFFFFBEB) : const Color(0xFFF0FDF4))
                  : const Color(0xFFF8FAFC)),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: activeBorderColor,
            width: isSelected ? 2.0 : 1.0,
          ),
          boxShadow: [
            if (isSelected)
              BoxShadow(
                color: (isMasterPro ? const Color(0xFFD97706) : const Color(0xFF059669))
                    .withValues(alpha: isDark ? 0.25 : 0.12),
                blurRadius: 14,
                offset: const Offset(0, 4),
              ),
          ],
        ),
        child: Row(
          children: [
            // Radio selection icon
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected
                      ? accentBrandColor
                      : (isDark ? Colors.white38 : Colors.black26),
                  width: 2,
                ),
                color: isSelected
                    ? accentBrandColor
                    : Colors.transparent,
              ),
              child: isSelected
                  ? const Center(
                      child: Icon(LucideIcons.check, size: 13, color: Colors.white),
                    )
                  : null,
            ),
            const SizedBox(width: 14),

            // Plan Title (Heading only)
            Expanded(
              child: Text(
                plan.name,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),

            // Price Column (with coupon discount if applicable)
            Builder(builder: (context) {
              final effectivePrice = CouponService.effectivePrice(plan.price, appliedCoupon);
              final hasDiscount = plan.price > 0 && effectivePrice != plan.price;
              final priceColor = isDark
                  ? (isSelected
                      ? (isMasterPro ? const Color(0xFFFDE68A) : const Color(0xFF6EE7B7))
                      : Colors.white)
                  : (isSelected
                      ? (isMasterPro ? const Color(0xFFD97706) : const Color(0xFF047857))
                      : const Color(0xFF0F172A));
              return Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (hasDiscount)
                    Text(
                      '৳${plan.price}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white38 : const Color(0xFFCBD5E1),
                        decoration: TextDecoration.lineThrough,
                        decorationColor: isDark ? Colors.white38 : const Color(0xFFCBD5E1),
                      ),
                    ),
                  Text(
                    '৳$effectivePrice',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'HindSiliguri',
                      color: hasDiscount
                          ? (isDark ? const Color(0xFF4ADE80) : const Color(0xFF16A34A))
                          : priceColor,
                    ),
                  ),
                  Text(
                    '/${plan.durationDays} দিন',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'HindSiliguri',
                      color: isDark
                          ? (isSelected ? const Color(0xFFA7F3D0) : const Color(0xFFA1A1AA))
                          : (isSelected ? const Color(0xFF065F46) : const Color(0xFF64748B)),
                    ),
                  ),
                ],
              );
            }),
          ],
        ),
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
                child: const Icon(LucideIcons.sparkles, color: Color(0xFF004633), size: 16),
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
    final cardBg = isDark ? const Color(0xFF141416) : Colors.white;
    final borderColor = isDark
        ? const Color(0xFF27272A)
        : const Color(0xFFE2E8F0);
    final headerBg = isDark
        ? const Color(0xFF1E1E22)
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

