import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/providers/auth_provider.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import '../domain/models.dart';
import 'widgets/official_receipt_document.dart';
import 'package:obhyash_app/core/utils/app_popups.dart';

class MySubscriptionView extends ConsumerStatefulWidget {
  const MySubscriptionView({super.key});

  @override
  ConsumerState<MySubscriptionView> createState() => _MySubscriptionViewState();
}

class _MySubscriptionViewState extends ConsumerState<MySubscriptionView>
    with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  SubscriptionPlan? _activePlan;
  DateTime? _expiresAt;
  List<Invoice> _invoices = [];
  late TabController _tabController;

  int get _daysLeft {
    if (_expiresAt == null) return 0;
    return _expiresAt!.difference(DateTime.now()).inDays.clamp(0, 9999);
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) {
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      SubscriptionPlan? activePlan;
      DateTime? expiresAt;
      final List<Invoice> invoices = [];

      // 1. Subscription History (All subscriptions including referral bonuses)
      try {
        final subHistData = await supabase
            .from('subscription_history')
            .select('*')
            .eq('user_id', userId)
            .order('started_at', ascending: false)
            .limit(50);

        final subHistList = subHistData as List;
        for (final item in subHistList) {
          final h = item as Map<String, dynamic>;
          final rawStarted = h['started_at']?.toString() ?? h['created_at']?.toString() ?? '';
          final dateStr = rawStarted.length >= 10 ? rawStarted.substring(0, 10) : rawStarted;
          final isCompleted = (h['status'] as String?)?.toLowerCase() == 'completed' || h['is_active'] == true;
          
          invoices.add(Invoice(
            id: h['id']?.toString() ?? '',
            date: dateStr,
            amount: (h['amount'] as num?)?.toInt() ?? 0,
            currency: '৳',
            status: isCompleted ? 'paid' : (h['status']?.toString() ?? 'paid'),
            planName: h['plan_name']?.toString() ?? 'প্রো সাবস্ক্রিপশন',
          ));

          // Check if active
          final rawExp = h['expires_at'] as String?;
          if (rawExp != null) {
            final parsed = DateTime.tryParse(rawExp);
            if (parsed != null && parsed.isAfter(DateTime.now())) {
              if (activePlan == null || (expiresAt != null && parsed.isAfter(expiresAt))) {
                expiresAt = parsed;
                final days = parsed.difference(DateTime.now()).inDays.clamp(1, 999);
                final planName = h['plan_name']?.toString() ?? 'প্রো সাবস্ক্রিপশন';
                activePlan = SubscriptionPlan(
                  id: h['id']?.toString() ?? 'sub_hist_active',
                  name: planName,
                  price: (h['amount'] as num?)?.toInt() ?? 0,
                  billingCycle: days >= 365 ? 'Yearly Plan' : days >= 90 ? 'Quarterly Plan' : 'Monthly Plan',
                  durationDays: days,
                  currency: '৳',
                  features: const [
                    'সকল প্রিমিয়াম ফিচার আনলকড',
                    'লাইভ এক্সাম ও আনলিমিটেড প্র্যাকটিস',
                    'পূর্ণাঙ্গ এনালাইসিস ও র‍্যাঙ্ক প্রেডিকশন',
                  ],
                  colorTheme: 'emerald',
                  expiresAt: rawExp.length >= 10 ? rawExp.substring(0, 10) : rawExp,
                );
              }
            }
          }
        }
      } catch (e) {
        debugPrint('[MySubscriptionView] Error fetching subscription_history: $e');
      }

      // 2. Fallback to Users table for Pro status / referral bonus
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

            if (activePlan == null) {
              expiresAt = parsedExp;
              final days = parsedExp.difference(DateTime.now()).inDays.clamp(1, 999);
              final rawPlan = (subJson?['plan'] ?? userRes['plan'] ?? 'প্রো সাবস্ক্রিপশন').toString();
              final planTitle = rawPlan == 'Pro' || rawPlan == 'pro' ? 'প্রো সাবস্ক্রিপশন' : rawPlan;
              final cycle = planTitle.toLowerCase().contains('year') || planTitle.toLowerCase().contains('বছর')
                  ? 'Yearly Plan'
                  : planTitle.toLowerCase().contains('quarter') || planTitle.toLowerCase().contains('ত্রৈমাসিক')
                      ? 'Quarterly Plan'
                      : 'Monthly Plan';

              activePlan = SubscriptionPlan(
                id: 'user_active_plan',
                name: planTitle,
                price: 0,
                billingCycle: cycle,
                durationDays: days,
                currency: '৳',
                features: const [
                  'সকল প্রিমিয়াম ফিচার আনলকড',
                  'লাইভ এক্সাম ও আনলিমিটেড প্র্যাকটিস',
                  'পূর্ণাঙ্গ এনালাইসিস ও র‍্যাঙ্ক প্রেডিকশন',
                ],
                colorTheme: 'emerald',
                expiresAt: parsedExp.toIso8601String().length >= 10
                    ? parsedExp.toIso8601String().substring(0, 10)
                    : null,
              );
            }
          }
        }
      } catch (e) {
        debugPrint('[MySubscriptionView] Error fetching user profile: $e');
      }

      // 3. Payment Requests
      try {
        final reqData = await supabase
            .from('payment_requests')
            .select('id, plan_name, amount, currency, status, requested_at, transaction_id')
            .eq('user_id', userId)
            .order('requested_at', ascending: false)
            .limit(50);

        for (final r in (reqData as List)) {
          final m = r as Map<String, dynamic>;
          final id = m['id']?.toString() ?? '';
          final exists = invoices.any((i) => i.id == id);
          if (!exists) {
            invoices.add(Invoice.fromJson(m));
          }
        }
      } catch (_) {}

      // 4. Referral rewards history
      try {
        final myReferralRes = await supabase
            .from('referrals')
            .select('id')
            .eq('owner_id', userId)
            .maybeSingle();
        final myReferralId = myReferralRes?['id'] as String?;

        final query = supabase
            .from('referral_history')
            .select('id, redeemed_at, admin_status, reward_given, redeemed_by, referral_id');

        final refHistList = myReferralId != null
            ? await query.or('redeemed_by.eq.$userId,referral_id.eq.$myReferralId').limit(20)
            : await query.eq('redeemed_by', userId).limit(20);

        for (final r in refHistList) {
          final m = r;
          final id = m['id']?.toString() ?? '';
          final exists = invoices.any((i) => i.id == id);
          if (!exists) {
            final rawDate = m['redeemed_at']?.toString() ?? '';
            final dateStr = rawDate.length >= 10 ? rawDate.substring(0, 10) : rawDate;
            invoices.add(Invoice(
              id: id,
              date: dateStr,
              amount: 0,
              currency: '৳',
              status: 'paid',
              planName: '🎁 রেফারেল রিওয়ার্ড বোনাস',
            ));
          }
        }
      } catch (_) {}

      // 5. Scratch card gifts history
      try {
        final cardRes = await supabase
            .from('scratch_cards')
            .select('id, scratched_at, reward_type, is_scratched')
            .eq('user_id', userId)
            .eq('is_scratched', true)
            .order('scratched_at', ascending: false)
            .limit(20);

        for (final c in (cardRes as List)) {
          final m = c as Map<String, dynamic>;
          final id = m['id']?.toString() ?? '';
          final exists = invoices.any((i) => i.id == id);
          if (!exists) {
            final rawDate = m['scratched_at']?.toString() ?? '';
            final dateStr = rawDate.length >= 10 ? rawDate.substring(0, 10) : rawDate;
            final rewardType = m['reward_type']?.toString() ?? '';
            String label = '🎁 স্ক্র্যাচ কার্ড গিফট বোনাস';
            if (rewardType == '1_month_free') {
              label = '🎁 স্ক্র্যাচ কার্ড গিফট (১ মাস ফ্রি)';
            } else if (rewardType == '2_months_free') {
              label = '🎁 স্ক্র্যাচ কার্ড গিফট (২ মাস ফ্রি)';
            } else if (rewardType == '3_months_free') {
              label = '🎁 স্ক্র্যাচ কার্ড গিফট (৩ মাস ফ্রি)';
            } else if (rewardType == '50_percent_off') {
              label = '🎁 স্ক্র্যাচ কার্ড গিফট (৫০% ছাড় কুপন)';
            }
            invoices.add(Invoice(
              id: id,
              date: dateStr,
              amount: 0,
              currency: '৳',
              status: 'paid',
              planName: label,
            ));
          }
        }
      } catch (_) {}

      // Sort all invoices by date descending
      invoices.sort((a, b) => b.date.compareTo(a.date));

      if (mounted) {
        setState(() {
          _activePlan = activePlan;
          _expiresAt = expiresAt;
          _invoices = invoices;
          _isLoading = false;
        });
      }
    } catch (err) {
      debugPrint('[MySubscriptionView] Unexpected loadData error: $err');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _loadData();
    });

    final bg = isDark ? const Color(0xFF000000) : const Color(0xFFF5F5F5);
    final cardBg = isDark ? const Color(0xFF000000) : Colors.white;

    return Scaffold(
      backgroundColor: bg,
      body: Column(
        children: [
          Container(
            margin: const EdgeInsets.fromLTRB(10, 16, 10, 8),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF4F4F5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(4),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [
                    if (!isDark)
                      const BoxShadow(
                        color: Color(0x1A000000),
                        blurRadius: 4,
                        offset: Offset(0, 2),
                      ),
                  ],
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelColor: isDark ? Colors.white : const Color(0xFF166534),
                unselectedLabelColor: isDark
                    ? const Color(0xFFA3A3A3)
                    : const Color(0xFF71717A),
                labelStyle: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
                tabs: const [
                  Tab(text: 'বর্তমান প্ল্যান'),
                  Tab(text: 'ইতিহাস'),
                ],
              ),
            ),
          ),
          Expanded(
            child: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF166534)),
            )
          : TabBarView(
              controller: _tabController,
              children: [
                RefreshIndicator(
                  color: const Color(0xFF166534),
                  onRefresh: _loadData,
                  child: _OverviewTab(
                    isDark: isDark,
                    cardBg: cardBg,
                    activePlan: _activePlan,
                    expiresAt: _expiresAt,
                    daysLeft: _daysLeft,
                    onUpgrade: () => context.push('/profile/subscription'),
                  ),
                ),
                RefreshIndicator(
                  color: const Color(0xFF166534),
                  onRefresh: _loadData,
                  child: _HistoryTab(
                    isDark: isDark,
                    cardBg: cardBg,
                    invoices: _invoices,
                    onShowReceipt: _showReceiptSheet,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showReceiptSheet(Invoice invoice) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final shortId = invoice.id.length > 8
        ? invoice.id.substring(0, 8)
        : invoice.id;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(10, 8, 10, 0),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF000000) : Colors.white,
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
                      ? const Color(0xFF000000)
                      : const Color(0xFFFAFAFA),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF1C1C1E)
                        : const Color(0xFFE5E5E5),
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: const Color(0xFF166534),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Center(
                        child: Text(
                          'O',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 30,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'অভ্যাস',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Anek Bangla',
                        color: isDark ? Colors.white : const Color(0xFF000000),
                      ),
                    ),
                    Text(
                      'পেমেন্ট রিসিট',
                      style: TextStyle(
                        fontSize: 13,
                        fontFamily: 'HindSiliguri',
                        color: isDark
                            ? const Color(0xFFA3A3A3)
                            : const Color(0xFF737373),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Divider(
                      color: isDark
                          ? const Color(0xFF1C1C1E)
                          : const Color(0xFFE5E5E5),
                    ),
                    const SizedBox(height: 14),
                    _receiptRow(
                      isDark,
                      label: 'ইনভয়েস আইডি',
                      value: '#${shortId.toUpperCase()}',
                    ),
                    const SizedBox(height: 10),
                    _receiptRow(
                      isDark,
                      label: 'প্ল্যান',
                      value: invoice.planName,
                    ),
                    const SizedBox(height: 10),
                    _receiptRow(isDark, label: 'তারিখ', value: invoice.date),
                    const SizedBox(height: 10),
                    _receiptRow(
                      isDark,
                      label: 'স্ট্যাটাস',
                      value: _statusLabel(invoice.status),
                      valueColor: _statusColor(invoice.status),
                    ),
                    const SizedBox(height: 14),
                    Divider(
                      color: isDark
                          ? const Color(0xFF1C1C1E)
                          : const Color(0xFFE5E5E5),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'মোট পরিশোধ',
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'HindSiliguri',
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF000000),
                          ),
                        ),
                        Text(
                          '${invoice.currency} ${invoice.amount}.00',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF166534),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  final user = ref.read(userProfileProvider).value;
                  final authUser = ref.read(authProvider);
                  OfficialReceiptService.downloadReceipt(
                    context: context,
                    invoice: invoice,
                    userName: user?.name ?? '',
                    userEmail: authUser?.email ?? '',
                    userInstitute: user?.institute ?? '',
                  );
                },
                icon: const Icon(LucideIcons.download, size: 18),
                label: const Text(
                  'অফিসিয়াল রিসিট ডাউনলোড করুন',
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: () {
                  final text =
                      'অভ্যাস পেমেন্ট রিসিট\n'
                      'ইনভয়েস: #${invoice.id}\n'
                      'প্ল্যান: ${invoice.planName}\n'
                      'তারিখ: ${invoice.date}\n'
                      'পরিমাণ: ${invoice.currency} ${invoice.amount}.00\n'
                      'স্ট্যাটাস: ${_statusLabel(invoice.status)}';
                  Clipboard.setData(ClipboardData(text: text));
                  Navigator.pop(ctx);
                  AppPopups.show(
                    context,
                    message: 'রিসিটের তথ্য কপি করা হয়েছে!',
                    isError: false,
                  );
                },
                icon: Icon(
                  LucideIcons.copy,
                  size: 14,
                  color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF64748B),
                ),
                label: Text(
                  'রিসিটের বিবরণ কপি করুন',
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF64748B),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
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
            fontSize: 16,
            color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color:
                valueColor ?? (isDark ? Colors.white : const Color(0xFF000000)),
          ),
        ),
      ],
    );
  }
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

class _OverviewTab extends StatelessWidget {
  final bool isDark;
  final Color cardBg;
  final SubscriptionPlan? activePlan;
  final DateTime? expiresAt;
  final int daysLeft;
  final VoidCallback onUpgrade;

  const _OverviewTab({
    required this.isDark,
    required this.cardBg,
    required this.activePlan,
    required this.expiresAt,
    required this.daysLeft,
    required this.onUpgrade,
  });

  @override
  Widget build(BuildContext context) {
    if (activePlan == null) {
      return _FreePlanCard(
        isDark: isDark,
        cardBg: cardBg,
        onUpgrade: onUpgrade,
      );
    }

    final totalDays = activePlan!.durationDays;
    final progress = totalDays > 0
        ? (daysLeft / totalDays).clamp(0.0, 1.0)
        : 0.0;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(
        parent: BouncingScrollPhysics(),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      children: [
        // Hero card
        Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF022C22), Color(0xFF064E3B)],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: const Color(0xFF065F46).withValues(alpha: 0.6),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF022C22).withValues(alpha: 0.5),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'সক্রিয় সাবস্ক্রিপশন',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          activePlan!.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${activePlan!.currency} ${activePlan!.price} / ${activePlan!.billingCycle}',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  SizedBox(
                    width: 72,
                    height: 72,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        CustomPaint(painter: _RingPainter(progress: progress)),
                        Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '$daysLeft',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const Text(
                                'দিন',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Divider(color: Colors.white.withOpacity(0.15)),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(
                    LucideIcons.calendar,
                    color: Colors.white54,
                    size: 14,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    expiresAt != null
                        ? 'মেয়াদ শেষ: ${expiresAt!.toLocal().toString().substring(0, 10)}'
                        : 'মেয়াদ অনির্ধারিত',
                    style: const TextStyle(color: Colors.white70, fontSize: 13.5),
                  ),
                ],
              ),
              if (daysLeft <= 7 && daysLeft >= 0) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFB91C1C).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: const Color(0xFFB91C1C).withOpacity(0.4),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        LucideIcons.alertTriangle,
                        color: Color(0xFFFCA5A5),
                        size: 14,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          daysLeft == 0
                              ? 'আজই মেয়াদ শেষ হচ্ছে! নবায়ন করো।'
                              : 'মাত্র $daysLeft দিন বাকি! শীঘ্রই নবায়ন করো।',
                          style: const TextStyle(
                            color: Color(0xFFFCA5A5),
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                         maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Features
        if (activePlan!.features.isNotEmpty) ...[
          Text(
            'অন্তর্ভুক্ত সুবিধা',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 17,
              color: isDark ? Colors.white : const Color(0xFF000000),
            ),
          ),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark
                    ? const Color(0xFF1C1C1E)
                    : const Color(0xFFE5E5E5),
              ),
            ),
            child: Column(
              children: activePlan!.features.asMap().entries.map((e) {
                final isLast = e.key == activePlan!.features.length - 1;
                return Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    border: isLast
                        ? null
                        : Border(
                            bottom: BorderSide(
                              color: isDark
                                  ? const Color(0xFF1C1C1E)
                                  : const Color(0xFFE5E5E5),
                            ),
                          ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          color: const Color(0xFF166534),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          LucideIcons.check,
                          color: Colors.white,
                          size: 12,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          e.value,
                          style: TextStyle(
                            fontSize: 16,
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF000000),
                          ),
                         maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Renew CTA
        ElevatedButton.icon(
          onPressed: onUpgrade,
          icon: const Icon(LucideIcons.zap, size: 16),
          label: Text(
            daysLeft <= 30 ? 'প্ল্যান নবায়ন করো' : 'প্ল্যান আপগ্রেড করো',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF166534),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            minimumSize: const Size.fromHeight(48),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

class _FreePlanCard extends StatelessWidget {
  final bool isDark;
  final Color cardBg;
  final VoidCallback onUpgrade;

  const _FreePlanCard({
    required this.isDark,
    required this.cardBg,
    required this.onUpgrade,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(
        parent: BouncingScrollPhysics(),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      children: [
        Center(
          child: Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: const Color(0xFF166534).withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(
              LucideIcons.crown,
              color: Color(0xFF166534),
              size: 32,
            ),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'কোনো সক্রিয় সাবস্ক্রিপশন নেই',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : const Color(0xFF000000),
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'প্রিমিয়াম প্ল্যান নাও এবং সীমাহীন পড়াশোনা উপভোগ করো',
          style: TextStyle(
            fontSize: 16,
            color: isDark
                ? const Color(0xFFA3A3A3)
                : const Color(0xFF737373),
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        Center(
          child: ElevatedButton.icon(
            onPressed: onUpgrade,
            icon: const Icon(LucideIcons.zap, size: 16),
            label: const Text(
              'প্ল্যান দেখো ও আপগ্রেড করো',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF166534),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 14,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ─── History Tab ──────────────────────────────────────────────────────────────

class _HistoryTab extends StatelessWidget {
  final bool isDark;
  final Color cardBg;
  final List<Invoice> invoices;
  final void Function(Invoice) onShowReceipt;

  const _HistoryTab({
    required this.isDark,
    required this.cardBg,
    required this.invoices,
    required this.onShowReceipt,
  });

  @override
  Widget build(BuildContext context) {
    if (invoices.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        padding: const EdgeInsets.symmetric(vertical: 60),
        children: [
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  LucideIcons.receipt,
                  size: 48,
                  color: isDark ? const Color(0xFF525252) : const Color(0xFFD4D4D4),
                ),
                const SizedBox(height: 16),
                Text(
                  'কোনো পেমেন্ট ইতিহাস নেই',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: isDark
                        ? const Color(0xFF737373)
                        : const Color(0xFFA3A3A3),
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    }

    final total = invoices.length;
    final success = invoices.where((i) => i.status == 'paid').length;
    final pending = invoices
        .where((i) => i.status == 'pending' || i.status == 'checking')
        .length;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(
        parent: BouncingScrollPhysics(),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      children: [
        // Summary row
        Row(
          children: [
            _SummaryChip(
              label: 'মোট',
              value: '$total',
              color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF525252),
              textColor: isDark ? Colors.white : const Color(0xFF000000), // Unused now but kept for interface
            ),
            const SizedBox(width: 8),
            _SummaryChip(
              label: 'সফল',
              value: '$success',
              color: const Color(0xFF16A34A),
              textColor: Colors.white, // Unused
            ),
            const SizedBox(width: 8),
            _SummaryChip(
              label: 'অপেক্ষমাণ',
              value: '$pending',
              color: const Color(0xFFDC2626),
              textColor: Colors.white, // Unused
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Invoice list
        Column(
          children: invoices.asMap().entries.map((e) {
            final inv = e.value;
            final isLast = e.key == invoices.length - 1;
            return _InvoiceRow(
              invoice: inv,
              isDark: isDark,
              isLast: isLast,
              onTap: () => onShowReceipt(inv),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

class _SummaryChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final Color textColor;

  const _SummaryChip({
    required this.label,
    required this.value,
    required this.color,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF000000) : Colors.white;
    final borderColor = isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5);
    final shadowColor = isDark ? Colors.black.withValues(alpha: 0.2) : const Color(0x0A000000);
    
    // Total uses a neutral color, success/pending use their respective colors
    final accentColor = label == 'মোট' ? (isDark ? Colors.white : const Color(0xFF000000)) : color;

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor),
          boxShadow: [
            BoxShadow(
              color: shadowColor,
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                color: accentColor,
                fontWeight: FontWeight.w600,
                fontSize: 16,
                height: 1,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
                fontSize: 11.5,
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InvoiceRow extends StatelessWidget {
  final Invoice invoice;
  final bool isDark;
  final bool isLast;
  final VoidCallback onTap;

  const _InvoiceRow({
    required this.invoice,
    required this.isDark,
    required this.isLast,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(invoice.status);
    final statusLabel = _statusLabel(invoice.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF4F4F5),
        ),
        boxShadow: [
          if (!isDark)
            const BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
        ],
      ),
      child: InkWell(
        onTap: invoice.status == 'paid' ? onTap : null,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  invoice.status == 'paid'
                      ? LucideIcons.checkCircle2
                      : invoice.status == 'pending' ||
                            invoice.status == 'checking'
                      ? LucideIcons.clock
                      : LucideIcons.xCircle,
                  color: statusColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    invoice.planName,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF000000),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    invoice.date,
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark
                          ? const Color(0xFF737373)
                          : const Color(0xFFA3A3A3),
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${invoice.currency} ${invoice.amount}',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                    color: isDark ? Colors.white : const Color(0xFF000000),
                  ),
                ),
                const SizedBox(height: 3),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    statusLabel,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            if (invoice.status == 'paid') ...[
              const SizedBox(width: 8),
              Icon(
                LucideIcons.externalLink,
                size: 14,
                color: isDark
                    ? const Color(0xFF525252)
                    : const Color(0xFFD4D4D4),
              ),
            ],
          ],
        ),
      ),
    ),
  );
}
}

// ─── Progress Ring Painter ────────────────────────────────────────────────────

class _RingPainter extends CustomPainter {
  final double progress;
  const _RingPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - 8) / 2;
    final trackPaint = Paint()
      ..color = Colors.white.withOpacity(0.15)
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final progressPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, trackPaint);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.progress != progress;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

Color _statusColor(String status) {
  switch (status) {
    case 'paid':
      return const Color(0xFF166534);
    case 'pending':
    case 'checking':
      return const Color(0xFFB91C1C);
    case 'rejected':
    case 'failed':
      return const Color(0xFF525252);
    default:
      return const Color(0xFF737373);
  }
}

String _statusLabel(String status) {
  switch (status) {
    case 'paid':
      return 'সফল';
    case 'pending':
      return 'অপেক্ষমান';
    case 'checking':
      return 'যাচাইরত';
    case 'rejected':
      return 'বাতিল';
    case 'failed':
      return 'ব্যর্থ';
    default:
      return status;
  }
}
