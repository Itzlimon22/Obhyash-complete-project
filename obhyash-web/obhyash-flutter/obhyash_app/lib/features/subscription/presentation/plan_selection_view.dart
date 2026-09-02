import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/models.dart';
import '../domain/coupon_service.dart';
import 'payment_view.dart';
import 'widgets/coupon_bottom_sheet.dart';

class PlanSelectionView extends StatefulWidget {
  final List<SubscriptionPlan>? initialPlans;
  final SubscriptionPlan? activeSubscription;
  final DateTime? expiresAt;
  final AppliedCoupon? initialCoupon;

  const PlanSelectionView({
    super.key,
    this.initialPlans,
    this.activeSubscription,
    this.expiresAt,
    this.initialCoupon,
  });

  @override
  State<PlanSelectionView> createState() => _PlanSelectionViewState();
}

class _PlanSelectionViewState extends State<PlanSelectionView> {
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
    _appliedCoupon = widget.initialCoupon;
    if (widget.initialPlans != null && widget.initialPlans!.isNotEmpty) {
      _plans = widget.initialPlans!;
      _activeSubscription = widget.activeSubscription;
      _expiresAt = widget.expiresAt;
      _currentPlanId = widget.activeSubscription?.id ?? 'free';
      final premium = _plans.where((p) => p.price > 0).toList();
      _selectedPlanIndex = premium.length >= 2 ? 1 : 0;
      _isLoading = false;
    } else {
      _loadData();
    }
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
        debugPrint('[PlanSelectionView] Error fetching subscription_plans: $e');
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
      String currentPlanId = 'free';
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
                    currentPlanId = activeSub.id;
                  }
                }
              }
            }
          }
        } catch (e) {
          debugPrint('[PlanSelectionView] Error querying subscription_history: $e');
        }

        // Fallback to Users table for Pro status
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

            final bool isStatusActive = userRes['is_subscribed'] == true ||
                rawStatus == 'active' ||
                (subJson?['status']?.toString().toLowerCase() == 'active');

            final rawPlan = (subJson?['plan'] ?? userRes['plan'] ?? '').toString().toLowerCase().trim();
            final bool isNotFree = rawPlan.isNotEmpty && rawPlan != 'free' && rawPlan != 'inactive';

            final bool isValidActive = isStatusActive &&
                isNotFree &&
                parsedExp != null &&
                parsedExp.isAfter(DateTime.now());

            if (isValidActive && activeSub == null) {
              expiresAt = parsedExp;
              final days = parsedExp.difference(DateTime.now()).inDays.clamp(1, 999);
              final rawPlanName = (subJson?['plan'] ?? userRes['plan'] ?? 'প্রো সাবস্ক্রিপশন').toString();
              final planTitle = rawPlanName.toLowerCase() == 'pro' ? 'প্রো সাবস্ক্রিপশন' : rawPlanName;
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
              currentPlanId = activeSub.id;
            }
          }
        } catch (userSubErr) {
          debugPrint('User profile sub check error: $userSubErr');
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
      debugPrint('Error loading subscription data in PlanSelectionView: $e\n$stack');
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

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAF9),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0C0A09) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'প্ল্যান নির্বাচন',
          style: TextStyle(
            color: isDark ? Colors.white : const Color(0xFF0F172A),
            fontSize: 16,
            fontWeight: FontWeight.w600,
            fontFamily: 'HindSiliguri',
          ),
        ),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        color: const Color(0xFF004633),
        onRefresh: _loadData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // MASTER PRICING & PLAN CARD (MATCHES SCREENSHOT EXACTLY)
              Container(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 20),
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
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'সব প্ল্যানে সম্পূর্ণ প্রিমিয়াম অ্যাক্সেস আনলক হবে',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                        fontFamily: 'HindSiliguri',
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),

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

                        return _PlanSelectionCard(
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

                      // ── Coupon prompt / remove coupon text link ──────────
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
                                  backgroundColor: const Color(0xFF2C2C2C),
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
                                fontSize: 14,
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

                      const SizedBox(height: 10),

                      if (_daysRemaining > 0 && selectedPlan != null)
                        Container(
                          margin: const EdgeInsets.only(bottom: 14),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF092328) : const Color(0xFFF0FDF4),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFF12544F).withValues(alpha: 0.25),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                LucideIcons.calendarCheck,
                                color: Color(0xFF12544F),
                                size: 18,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: RichText(
                                  text: TextSpan(
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontFamily: 'HindSiliguri',
                                      color: isDark ? Colors.white70 : const Color(0xFF334155),
                                      height: 1.4,
                                    ),
                                    children: [
                                      const TextSpan(
                                        text: 'মেয়াদ বৃদ্ধি: ',
                                        style: TextStyle(fontWeight: FontWeight.w600),
                                      ),
                                      TextSpan(text: 'বর্তমান $_daysRemaining দিনের সাথে নতুন ${selectedPlan.durationDays} দিন যোগ হয়ে মোট '),
                                      TextSpan(
                                        text: '${_daysRemaining + selectedPlan.durationDays} দিন ',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          color: Color(0xFF12544F),
                                          decoration: TextDecoration.underline,
                                        ),
                                      ),
                                      const TextSpan(text: 'সক্রিয় থাকবে।'),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                      if (selectedPlan != null)
                        Builder(builder: (ctx) {
                          final effectivePrice = CouponService.effectivePrice(selectedPlan.price, _appliedCoupon);
                          final hasDiscount = effectivePrice != selectedPlan.price;
                          return SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF12544F),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                elevation: 0,
                              ),
                              onPressed: () => _handlePlanSelect(selectedPlan),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Text(
                                    'পেমেন্ট করতে এগিয়ে যান',
                                    style: TextStyle(
                                      fontSize: 15.5,
                                      fontWeight: FontWeight.w600,
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
                                              fontWeight: FontWeight.normal,
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
                                            fontWeight: FontWeight.w600,
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
            ],
          ),
        ),
      ),
    );
  }
}

class _PlanSelectionCard extends StatelessWidget {
  final SubscriptionPlan plan;
  final bool isSelected;
  final bool isCurrent;
  final bool isDark;
  final VoidCallback onTap;
  final AppliedCoupon? appliedCoupon;

  const _PlanSelectionCard({
    required this.plan,
    required this.isSelected,
    required this.isCurrent,
    required this.isDark,
    required this.onTap,
    this.appliedCoupon,
  });

  @override
  Widget build(BuildContext context) {
    final activeBorderColor = isSelected
        ? const Color(0xFF12544F)
        : (isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0));

    const accentBrandColor = Color(0xFF12544F);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        decoration: BoxDecoration(
          color: isDark
              ? (isSelected ? const Color(0xFF092328) : const Color(0xFF1C1C20))
              : (isSelected ? Colors.white : const Color(0xFFF8FAFC)),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: activeBorderColor,
            width: isSelected ? 2.0 : 1.0,
          ),
        ),
        child: Row(
          children: [
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

            Expanded(
              child: Text(
                plan.name,
                style: TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),

            Builder(builder: (context) {
              final effectivePrice = CouponService.effectivePrice(plan.price, appliedCoupon);
              final hasDiscount = plan.price > 0 && effectivePrice != plan.price;
              final priceColor = isDark
                  ? (isSelected ? Colors.white : const Color(0xFFCBD5E1))
                  : (isSelected ? const Color(0xFF12544F) : const Color(0xFF0F172A));
              return Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (hasDiscount)
                    Text(
                      '৳${plan.price}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.normal,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white38 : const Color(0xFFCBD5E1),
                        decoration: TextDecoration.lineThrough,
                        decorationColor: isDark ? Colors.white38 : const Color(0xFFCBD5E1),
                      ),
                    ),
                  Text(
                    '৳$effectivePrice',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'HindSiliguri',
                      color: hasDiscount
                          ? (isDark ? const Color(0xFF4ADE80) : const Color(0xFF16A34A))
                          : priceColor,
                    ),
                  ),
                  Text(
                    '/${plan.durationDays} দিন',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.normal,
                      fontFamily: 'HindSiliguri',
                      color: isDark
                          ? const Color(0xFFA1A1AA)
                          : const Color(0xFF64748B),
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
