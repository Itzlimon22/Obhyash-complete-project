import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/models.dart';
import 'payment_view.dart';
import 'widgets/pricing_card.dart';
import 'widgets/billing_history_card.dart';
import 'widgets/payment_methods_card.dart';

class SubscriptionView extends StatefulWidget {
  const SubscriptionView({super.key});

  @override
  State<SubscriptionView> createState() => _SubscriptionViewState();
}

class _SubscriptionViewState extends State<SubscriptionView> {
  bool _isLoading = true;
  List<SubscriptionPlan> _plans = [];
  List<Invoice> _invoices = [];
  List<PaymentMethod> _paymentMethods = [];
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

      // Load payment history
      List<Invoice> invoices = [];
      if (userId != null) {
        final reqData = await supabase
            .from('payment_requests')
            .select('id, plan_name, amount, currency, status, requested_at')
            .eq('user_id', userId)
            .order('requested_at', ascending: false)
            .limit(20);
        invoices = (reqData as List)
            .map((r) => Invoice.fromJson(r as Map<String, dynamic>))
            .toList();
      }

      if (mounted) {
        setState(() {
          _plans = plans;
          _invoices = invoices;
          _paymentMethods = [];
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

  void _handleAddPaymentMethod() {}

  void _handleDeletePaymentMethod(String id) {
    setState(() {
      _paymentMethods.removeWhere((m) => m.id == id);
    });
  }

  void _handleDownloadInvoice(Invoice invoice) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '\u0987\u09a8\u09ad\u09af\u09bc\u09c7\u09b8: ${invoice.planName} \u2014 ${invoice.status}',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isFreeUser = _currentPlanId == 'free' || _currentPlanId.isEmpty;

    final currentPlan =
        _activeSubscription ??
        _plans.firstWhere(
          (p) => p.id == _currentPlanId,
          orElse: () => _plans.first,
        );

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
                      'প্রিমিয়াম সাবস্ক্রিপশন',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24, // text-3xl
                        fontWeight: FontWeight.w900, // font-black
                        letterSpacing: -0.5, // tracking-tight
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Active Subscription Details Card
            if (!isFreeUser)
              Container(
                padding: const EdgeInsets.all(24), // p-6 md:p-8
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF171717)
                      : Colors.white, // neutral-900 : white
                  borderRadius: BorderRadius.circular(24), // rounded-3xl
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF262626)
                        : const Color(0xFFE5E5E5),
                  ), // neutral-800 : neutral-200
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x05000000),
                      blurRadius: 2,
                      offset: Offset(0, 1),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 64,
                      height: 64, // w-16 h-16
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0x33064E3B)
                            : const Color(
                                0xFFECFDF5,
                              ), // emerald-900/20 : emerald-50
                        borderRadius: BorderRadius.circular(16), // rounded-2xl
                      ),
                      child: Center(
                        child: Icon(
                          LucideIcons.crown,
                          size: 32, // w-8 h-8
                          color: isDark
                              ? const Color(0xFF34D399)
                              : const Color(
                                  0xFF059669,
                                ), // emerald-400 : emerald-600
                        ),
                      ),
                    ),
                    const SizedBox(width: 16), // gap-4
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                currentPlan.name,
                                style: TextStyle(
                                  fontSize: 20, // text-xl
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(
                                          0xFF171717,
                                        ), // white : neutral-900
                                ),
                              ),
                              const SizedBox(width: 8), // gap-2
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ), // px-2 py-0.5
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0x4D064E3B)
                                      : const Color(
                                          0xFFD1FAE5,
                                        ), // emerald-900/30 : emerald-100
                                  borderRadius: BorderRadius.circular(
                                    16,
                                  ), // rounded-full
                                ),
                                child: Text(
                                  'ACTIVE',
                                  style: TextStyle(
                                    fontSize: 10, // text-xs
                                    fontWeight: FontWeight.bold,
                                    color: isDark
                                        ? const Color(0xFF34D399)
                                        : const Color(
                                            0xFF059669,
                                          ), // emerald-400 : emerald-600
                                    letterSpacing: 1, // tracking-wider
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4), // space-y-1
                          Text(
                            'মেয়াদ শেষ হবে: ${currentPlan.expiresAt ?? '(অ্যাক্টিভ)'}',
                            style: TextStyle(
                              fontSize: 14, // text-sm
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(
                                      0xFF737373,
                                    ), // neutral-400 : neutral-500
                            ),
                          ),
                          if (currentPlan.expiresAt != null)
                            Row(
                              children: [
                                Icon(
                                  LucideIcons.clock,
                                  size: 12,
                                  color: isDark
                                      ? const Color(0xFF34D399)
                                      : const Color(0xFF059669),
                                ), // emerald-400 : emerald-600
                                const SizedBox(width: 4),
                                Text(
                                  'বাকি আছে: $_daysRemaining দিন',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w500,
                                    color: isDark
                                        ? const Color(0xFF34D399)
                                        : const Color(
                                            0xFF059669,
                                          ), // emerald-400 : emerald-600
                                  ),
                                ),
                              ],
                            ),
                        ],
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
                fontSize: 24, // text-2xl
                fontWeight: FontWeight.w900, // font-black
                color: isDark
                    ? Colors.white
                    : const Color(0xFF171717), // white : neutral-900
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
                        LucideIcons.clock,
                        color: Color(0xFF10B981),
                        size: 24,
                      ), // emerald-500
                      SizedBox(height: 8),
                      Text(
                        'তাৎক্ষণিক অ্যাক্সেস',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 32),

          // Billing History and Payment Methods section
          LayoutBuilder(
            builder: (context, constraints) {
              final isDesktop = constraints.maxWidth > 1024;

              if (isDesktop) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 1,
                      child: _isLoading
                          ? Container(height: 160, color: Colors.grey)
                          : PaymentMethodsCard(
                              methods: _paymentMethods,
                              onAddMethod: _handleAddPaymentMethod,
                              onDelete: _handleDeletePaymentMethod,
                            ),
                    ),
                    const SizedBox(width: 24),
                    Expanded(
                      flex: 2,
                      child: _isLoading
                          ? Container(height: 250, color: Colors.grey)
                          : BillingHistoryCard(
                              invoices: _invoices,
                              onDownload: _handleDownloadInvoice,
                            ),
                    ),
                  ],
                );
              }

              // Mobile
              return Column(
                children: [
                  if (_isLoading)
                    Container(height: 160, color: Colors.grey)
                  else
                    PaymentMethodsCard(
                      methods: _paymentMethods,
                      onAddMethod: _handleAddPaymentMethod,
                      onDelete: _handleDeletePaymentMethod,
                    ),
                  const SizedBox(height: 24),
                  if (_isLoading)
                    Container(height: 250, color: Colors.grey)
                  else
                    BillingHistoryCard(
                      invoices: _invoices,
                      onDownload: _handleDownloadInvoice,
                    ),
                ],
              );
            },
          ),

          const SizedBox(height: 48), // Bottom padding
        ],
      ),
    );
  }
}
