import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/providers/auth_provider.dart';
import '../domain/models.dart';
import 'payment_view.dart';
import 'widgets/pricing_card.dart';
import 'widgets/billing_history_card.dart';
import 'widgets/payment_methods_card.dart';

class SubscriptionView extends ConsumerStatefulWidget {
  const SubscriptionView({super.key});

  @override
  ConsumerState<SubscriptionView> createState() => _SubscriptionViewState();
}

class _SubscriptionViewState extends ConsumerState<SubscriptionView> {
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

      // Load payment methods
      List<PaymentMethod> methods = [];
      if (userId != null) {
        try {
          final reqMethods = await supabase
              .from('user_payment_methods')
              .select('id, type, number, is_default')
              .eq('user_id', userId);
          methods = (reqMethods as List)
              .map(
                (m) => PaymentMethod(
                  id: m['id'].toString(),
                  type: (m['type'] as String?) ?? 'bkash',
                  number: m['number'] as String?,
                  isDefault: (m['is_default'] as bool?) ?? false,
                ),
              )
              .toList();
        } catch (_) {}
      }

      if (mounted) {
        setState(() {
          _plans = plans;
          _invoices = invoices;
          _paymentMethods = methods;
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

  void _handleAddPaymentMethod() {
    String selectedType = 'bkash';
    final numberCtrl = TextEditingController();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setInnerState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: Container(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF171717) : Colors.white,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(24),
              ),
            ),
            child: SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 12),
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF525252)
                            : const Color(0xFFD4D4D4),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Text(
                    'পেমেন্ট মেথড যুক্ত করুন',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF171717),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'আপনার মোবাইল ব্যাংকিং নম্বর যুক্ত করুন',
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF737373),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: ['bkash', 'nagad', 'rocket'].asMap().entries.map((
                      e,
                    ) {
                      final type = e.value;
                      final isLast = e.key == 2;
                      final isSelected = selectedType == type;
                      const labels = {
                        'bkash': 'bKash',
                        'nagad': 'Nagad',
                        'rocket': 'Rocket',
                      };
                      return Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(right: isLast ? 0 : 8),
                          child: GestureDetector(
                            onTap: () =>
                                setInnerState(() => selectedType = type),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? (isDark
                                          ? const Color(0xFF052E16)
                                          : const Color(0xFFD1FAE5))
                                    : (isDark
                                          ? const Color(0xFF262626)
                                          : const Color(0xFFF5F5F5)),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isSelected
                                      ? const Color(0xFF059669)
                                      : Colors.transparent,
                                  width: 1.5,
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  labels[type] ?? type,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: isSelected
                                        ? const Color(0xFF059669)
                                        : (isDark
                                              ? const Color(0xFFA3A3A3)
                                              : const Color(0xFF737373)),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: numberCtrl,
                    keyboardType: TextInputType.phone,
                    style: TextStyle(
                      color: isDark ? Colors.white : const Color(0xFF171717),
                      fontWeight: FontWeight.w500,
                    ),
                    decoration: InputDecoration(
                      hintText: 'মোবাইল নম্বর (01xxxxxxxxx)',
                      hintStyle: TextStyle(
                        color: isDark
                            ? const Color(0xFF525252)
                            : const Color(0xFFA3A3A3),
                      ),
                      filled: true,
                      fillColor: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFF5F5F5),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: Color(0xFF059669),
                          width: 1.5,
                        ),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () {
                      final number = numberCtrl.text.trim();
                      if (number.isEmpty) return;
                      final phoneRegex = RegExp(r'^01\d{9}$');
                      if (!phoneRegex.hasMatch(number)) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('সঠিক মোবাইল নম্বর দিন (১১ ডিজিট)'),
                          ),
                        );
                        return;
                      }
                      Navigator.pop(ctx);
                      _savePaymentMethod(selectedType, number);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'সেভ করুন',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ).whenComplete(() => numberCtrl.dispose());
  }

  void _handleDeletePaymentMethod(String id) {
    setState(() {
      _paymentMethods.removeWhere((m) => m.id == id);
    });
  }

  void _handleDownloadInvoice(Invoice invoice) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final shortId = invoice.id.length > 8
        ? invoice.id.substring(0, 8)
        : invoice.id;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF171717) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF525252)
                        : const Color(0xFFD4D4D4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF0A0A0A)
                      : const Color(0xFFFAFAFA),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF262626)
                        : const Color(0xFFE5E5E5),
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: const Color(0xFF059669),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Center(
                        child: Text(
                          'O',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'অভ্যাস',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : const Color(0xFF171717),
                      ),
                    ),
                    Text(
                      'পেমেন্ট রিসিট',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark
                            ? const Color(0xFFA3A3A3)
                            : const Color(0xFF737373),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Divider(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFE5E5E5),
                    ),
                    const SizedBox(height: 16),
                    _receiptRow(
                      isDark,
                      label: 'ইনভয়েস আইডি',
                      value: '#${shortId.toUpperCase()}',
                    ),
                    const SizedBox(height: 12),
                    _receiptRow(
                      isDark,
                      label: 'প্ল্যান',
                      value: invoice.planName,
                    ),
                    const SizedBox(height: 12),
                    _receiptRow(isDark, label: 'তারিখ', value: invoice.date),
                    const SizedBox(height: 12),
                    _receiptRow(
                      isDark,
                      label: 'স্ট্যাটাস',
                      value: 'পরিশোধিত',
                      valueColor: const Color(0xFF059669),
                    ),
                    const SizedBox(height: 16),
                    Divider(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFE5E5E5),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'মোট পরিশোধ',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF171717),
                          ),
                        ),
                        Text(
                          '${invoice.currency} ${invoice.amount}.00',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF059669),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () {
                  final text =
                      'অভ্যাস পেমেন্ট রিসিট\n'
                      'ইনভয়েস: #${invoice.id}\n'
                      'প্ল্যান: ${invoice.planName}\n'
                      'তারিখ: ${invoice.date}\n'
                      'পরিমাণ: ${invoice.currency} ${invoice.amount}.00\n'
                      'স্ট্যাটাস: পরিশোধিত';
                  Clipboard.setData(ClipboardData(text: text));
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('রিসিট কপি করা হয়েছে!')),
                  );
                },
                icon: const Icon(LucideIcons.copy, size: 16),
                label: const Text(
                  'রিসিট কপি করুন',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    // Retry when auth becomes available after cold-start session restore
    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _loadData();
    });
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

  Future<void> _savePaymentMethod(String type, String number) async {
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) return;
      await supabase.from('user_payment_methods').insert({
        'user_id': userId,
        'type': type,
        'number': number,
        'is_default': _paymentMethods.isEmpty,
      });
      if (mounted) _loadData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('ত্রুটি: ${e.toString()}')));
      }
    }
  }

  Widget _receiptRow(
    bool isDark, {
    required String label,
    required String value,
    Color? valueColor,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color:
                valueColor ?? (isDark ? Colors.white : const Color(0xFF171717)),
          ),
        ),
      ],
    );
  }
}
