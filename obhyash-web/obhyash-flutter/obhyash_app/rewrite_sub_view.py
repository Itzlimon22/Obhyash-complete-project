import os

content = """import 'package:flutter/material.dart';
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
    } catch (e, stack) {
      debugPrint('Error loading subscription data: $e\\n$stack');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handlePlanSelect(SubscriptionPlan plan) {
    if (plan.id == _currentPlanId || plan.id == 'free') return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PaymentView(plan: plan),
      ),
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
                color: isDark ? const Color(0xFF171717) : const Color(0xFF262626),
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
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
            ),
          ),
          const SizedBox(height: 4),
          const Center(
            child: Text(
              'যেকোনো সময় বাতিল করা যাবে',
              style: TextStyle(fontSize: 13, color: Color(0xFF737373)),
            ),
          ),
          const SizedBox(height: 24),

          // PRICING CARDS
          if (_isLoading)
            ...[1, 2].map((i) => Container(
                  height: 250,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF171717) : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                  ),
                ))
          else if (premiumPlans.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF171717) : Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Center(
                child: Text('কোনো প্রিমিয়াম প্ল্যান পাওয়া যায়নি।'),
              ),
            )
          else
            ...premiumPlans.map(
              (plan) => Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: _PricingCard(
                  plan: plan,
                  isCurrent: _currentPlanId == plan.id,
                  onSelect: () => _handlePlanSelect(plan),
                  isDark: isDark,
                ),
              ),
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
                iconColor: const Color(0xFFEF4444),
                bgColor: isDark ? const Color(0xFF1A0505) : const Color(0xFFFFF0F0),
                isDark: isDark,
              ),
              _TrustBadge(
                icon: LucideIcons.clock,
                label: 'তাৎক্ষণিক অ্যাক্সেস',
                iconColor: const Color(0xFF16A34A),
                bgColor: isDark ? const Color(0xFF051A0A) : const Color(0xFFF0FFF4),
                isDark: isDark,
              ),
              _TrustBadge(
                icon: LucideIcons.shieldCheck,
                label: 'নিরাপদ পেমেন্ট',
                iconColor: const Color(0xFF2563EB),
                bgColor: isDark ? const Color(0xFF050B1A) : const Color(0xFFF0F4FF),
                isDark: isDark,
              ),
              _TrustBadge(
                icon: LucideIcons.refreshCw,
                label: 'রিনিউ সহজ',
                iconColor: const Color(0xFF9333EA),
                bgColor: isDark ? const Color(0xFF10051A) : const Color(0xFFF8F0FF),
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
        color: isDark ? Colors.black : const Color(0xFF171717),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0x1A10B981),
              border: Border.all(color: const Color(0x8016A34A)),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.zap, size: 12, color: Color(0xFF4ADE80)),
                SizedBox(width: 6),
                Text(
                  'প্রিমিয়াম প্ল্যান',
                  style: TextStyle(
                    color: Color(0xFF4ADE80),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'আরো বেশি পড়ো,\\nআরো ভালো প্রস্তুতি নাও',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w900,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'সীমাহীন পরীক্ষা, AI সাজেশন, বিস্তারিত এনালাইসিস — সব কিছু এক প্ল্যানে',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFFA3A3A3), fontSize: 13, height: 1.5),
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
              child: Icon(LucideIcons.crown, color: Color(0xFF4ADE80), size: 22),
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
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'মেয়াদ: $daysRemaining দিন বাকি${expiresAt != null ? ' ($expiresAt)' : ''}',
                  style: const TextStyle(color: Color(0xFF86EFAC), fontSize: 12),
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
                fontSize: 11,
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
    final bool isEmerald = plan.colorTheme == 'emerald';
    final Color mainColor = isEmerald ? const Color(0xFF10B981) : const Color(0xFFF43F5E);
    final Color bgLight = isEmerald ? const Color(0xFFF0FDF4) : const Color(0xFFFFF1F2);
    final Color bgDark = isEmerald ? const Color(0xFF064E3B) : const Color(0xFF881337);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isDark ? bgDark.withOpacity(0.2) : bgLight,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              border: Border(
                bottom: BorderSide(
                  color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
                ),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      plan.name,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : const Color(0xFF171717),
                      ),
                    ),
                    if (plan.durationDays >= 90)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: mainColor,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'জনপ্রিয়',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${plan.currency} ${plan.price}',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : const Color(0xFF171717),
                        height: 1,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '/ ${plan.durationDays} দিন',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF737373),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Features
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ...plan.features.map((feature) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          Icon(LucideIcons.checkCircle2, size: 18, color: mainColor),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              feature,
                              style: TextStyle(
                                fontSize: 14,
                                color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF404040),
                              ),
                            ),
                          ),
                        ],
                      ),
                    )),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: isCurrent ? null : onSelect,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isCurrent ? (isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5)) : mainColor,
                    foregroundColor: isCurrent ? (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373)) : Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    isCurrent ? 'বর্তমান প্ল্যান' : 'আপগ্রেড করো',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF404040),
              ),
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
    final borderColor = isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5);
    final textMain = isDark ? Colors.white : const Color(0xFF171717);
    final textSub = isDark ? const Color(0xFF737373) : const Color(0xFFA3A3A3);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Center(
          child: Text(
            'ফ্রি বনাম প্রিমিয়াম',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
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
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF0A0A0A) : const Color(0xFFF5F5F5),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: Text('ফিচার', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textSub)),
                    ),
                    Expanded(
                      child: Center(child: Text('ফ্রি', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: textSub))),
                    ),
                    Expanded(
                      child: Container(
                        alignment: Alignment.center,
                        child: Text('প্রিমিয়াম', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: const Color(0xFF10B981))),
                      ),
                    ),
                  ],
                ),
              ),
              // Feature rows
              ..._features.map((feature) {
                final String label = feature.\$1;
                final String? freeText = feature.\$2;
                final String? paidText = feature.\$3;
                final bool isBothTrue = feature.\$4;

                Widget buildCellContent(String? text, bool isTrue) {
                  if (text != null) {
                    return Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textMain));
                  }
                  if (isTrue) {
                    return const Icon(LucideIcons.check, size: 16, color: Color(0xFF15803D));
                  }
                  return Icon(LucideIcons.xCircle, size: 16, color: isDark ? const Color(0xFF404040) : const Color(0xFFD4D4D4));
                }

                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    border: Border(top: BorderSide(color: borderColor)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: Text(label, style: TextStyle(fontSize: 13, color: textMain)),
                      ),
                      Expanded(
                        child: Center(child: buildCellContent(freeText, isBothTrue)),
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
"""

with open("lib/features/subscription/presentation/subscription_view.dart", "w") as f:
    f.write(content)
