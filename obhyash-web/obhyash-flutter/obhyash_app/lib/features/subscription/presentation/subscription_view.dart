import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/providers/auth_provider.dart';
import '../domain/models.dart';
import 'payment_view.dart';
import 'widgets/pricing_card.dart';

class SubscriptionView extends ConsumerStatefulWidget {
  const SubscriptionView({super.key});

  @override
  ConsumerState<SubscriptionView> createState() => _SubscriptionViewState();
}

class _SubscriptionViewState extends ConsumerState<SubscriptionView> {
  bool _isLoading = true;
  List<SubscriptionPlan> _plans = [];
  String _currentPlanId = '';
  SubscriptionPlan? _activeSubscription;

  DateTime? _expiresAt;

  int get _daysRemaining {
    if (_expiresAt == null) return 0;
    return _expiresAt!.difference(DateTime.now()).inDays.clamp(0, 9999);
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

      // Load active subscription plans
      final plansData = await supabase
          .from('subscription_plans')
          .select()
          .eq('is_active', true)
          .order('price');
      final plans = (plansData as List)
          .map((p) => SubscriptionPlan.fromJson(p as Map<String, dynamic>))
          .toList();

      // Load user's active subscription
      SubscriptionPlan? activeSub;
      String currentPlanId = '';
      DateTime? expiresAt;
      if (userId != null) {
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
          if (planJson != null) {
            activeSub = SubscriptionPlan.fromJson(
              planJson,
              expiresAt: rawExpires?.substring(0, 10),
            );
            currentPlanId = activeSub.id;
            if (rawExpires != null) {
              expiresAt = DateTime.tryParse(rawExpires);
            }
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
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handlePlanSelect(SubscriptionPlan plan) {
    if (plan.id == _currentPlanId) return;
    _openPaymentPage(plan);
  }

  Future<void> _openPaymentPage(SubscriptionPlan plan) async {
    final submitted = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => PaymentView(plan: plan),
      ),
    );
    if (submitted == true && mounted) {
      _loadData(); // refresh billing history
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    // Retry when auth becomes available after cold-start session restore
    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _loadData();
    });

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Banner / Current Plan Section
          if (_isLoading)
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF171717) : Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              // mock loading
            )
          else ...[
            // Top Banner for new users or upgrades
            Container(
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.black
                    : const Color(0xFF171717), // neutral-900
                borderRadius: BorderRadius.circular(24), // rounded-3xl
              ),
              padding: const EdgeInsets.all(32), // p-8
              child: Stack(
                children: [
                  // Decorative Blobs
                  Positioned(
                    top: -64,
                    right: -64,
                    child: Container(
                      width: 160,
                      height: 160,
                      decoration: const BoxDecoration(
                        color: Color(0x1a10b981), // emerald-500/10
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  const Center(
                    child: Text(
                      'আপগ্রেড করুন',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.5,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 32),

          // Pricing Plans Header
          Center(
            child: Text(
              'আপনার প্ল্যান বেছে নিন',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : const Color(0xFF171717),
                fontFamily: 'HindSiliguri',
              ),
            ),
          ),
          const SizedBox(height: 24), // mb-8
          // Pricing Plans Grid
          if (_isLoading)
            ...[1, 2].map(
              (i) => Container(
                height: 300,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF171717) : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                ),
              ),
            )
          else
            LayoutBuilder(
              builder: (context, constraints) {
                final isDesktop = constraints.maxWidth > 768;
                final premiumPlans = _plans.where((p) => p.price > 0).toList()
                  ..sort((a, b) => a.price.compareTo(b.price));

                if (isDesktop) {
                  return IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: premiumPlans
                          .map(
                            (plan) => Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                ),
                                child: PricingCard(
                                  plan: plan,
                                  isCurrent: _currentPlanId == plan.id,
                                  onSelect: () => _handlePlanSelect(plan),
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  );
                }

                // Mobile
                return Column(
                  children: premiumPlans
                      .map(
                        (plan) => Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: PricingCard(
                            plan: plan,
                            isCurrent: _currentPlanId == plan.id,
                            onSelect: () => _handlePlanSelect(plan),
                          ),
                        ),
                      )
                      .toList(),
                );
              },
            ),

          const SizedBox(height: 32),

          // Trust Badges
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF171717) : Colors.white,
                    borderRadius: BorderRadius.circular(12), // rounded-xl
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFF5F5F5),
                    ),
                  ),
                  child: const Column(
                    children: [
                      Icon(
                        LucideIcons.headphones,
                        color: Color(0xFFF43F5E),
                        size: 24,
                      ), // rose-500
                      SizedBox(height: 8),
                      Text(
                        '২৪/৭ সাপোর্ট',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF171717) : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFF5F5F5),
                    ),
                  ),
                  child: const Column(
                    children: [
                      Icon(
                        LucideIcons.clock,
                        color: Color(0xFF10B981),
                        size: 24,
                      ),
                      SizedBox(height: 8),
                      Text(
                        'তাৎক্ষণিক অ্যাক্সেস',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF171717) : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFF5F5F5),
                    ),
                  ),
                  child: const Column(
                    children: [
                      Icon(
                        LucideIcons.shieldCheck,
                        color: Color(0xFF3B82F6),
                        size: 24,
                      ),
                      SizedBox(height: 8),
                      Text(
                        'নিরাপদ পেমেন্ট',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF171717) : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFF5F5F5),
                    ),
                  ),
                  child: const Column(
                    children: [
                      Icon(
                        LucideIcons.refreshCw,
                        color: Color(0xFFA855F7),
                        size: 24,
                      ),
                      SizedBox(height: 8),
                      Text(
                        'রিনিউ সহজ',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 32),

          // Comparison Table
          _ComparisonTable(isDark: isDark),

          const SizedBox(height: 48), // Bottom padding
        ],
      ),
    );
  }
}

// ─── Comparison Table ─────────────────────────────────────────────────────────

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
    final cardBg = isDark ? const Color(0xFF171717) : Colors.white;
    final borderColor = isDark
        ? const Color(0xFF262626)
        : const Color(0xFFE5E5E5);
    final textMain = isDark ? Colors.white : const Color(0xFF171717);
    final textSub = isDark ? const Color(0xFF737373) : const Color(0xFFA3A3A3);

    return Container(
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
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0A0A0A) : const Color(0xFFF5F5F5),
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
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: textSub,
                      fontFamily: 'HindSiliguri',
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      'ফ্রি',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: textSub,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      'প্রিমিয়াম',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF166534),
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Feature rows
          ..._features.asMap().entries.map((e) {
            final idx = e.key;
            final (label, freeVal, premiumVal, bothHave) = e.value;
            final isLast = idx == _features.length - 1;
            final hasFree = bothHave || (freeVal != null);
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                border: isLast
                    ? null
                    : Border(bottom: BorderSide(color: borderColor)),
              ),
              child: Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: Text(
                      label,
                      style: TextStyle(
                        fontSize: 13,
                        color: textMain,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                  ),
                  Expanded(
                    child: Center(
                      child: hasFree
                          ? (freeVal != null
                                ? Text(
                                    freeVal,
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: textSub,
                                      fontWeight: FontWeight.bold,
                                      fontFamily: 'HindSiliguri',
                                    ),
                                  )
                                : const Icon(
                                    LucideIcons.check,
                                    size: 14,
                                    color: Color(0xFF166534),
                                  ))
                          : const Icon(
                              LucideIcons.x,
                              size: 14,
                              color: Color(0xFFDC2626),
                            ),
                    ),
                  ),
                  Expanded(
                    child: Center(
                      child: premiumVal != null
                          ? Text(
                              premiumVal,
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF166534),
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                              ),
                            )
                          : const Icon(
                              LucideIcons.check,
                              size: 14,
                              color: Color(0xFF166534),
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
