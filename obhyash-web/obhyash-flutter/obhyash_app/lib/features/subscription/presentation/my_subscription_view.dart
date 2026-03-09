import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/providers/auth_provider.dart';
import '../domain/models.dart';

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

      // Active subscription
      SubscriptionPlan? activePlan;
      DateTime? expiresAt;
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
          activePlan = SubscriptionPlan.fromJson(
            planJson,
            expiresAt: rawExpires?.substring(0, 10),
          );
          if (rawExpires != null) expiresAt = DateTime.tryParse(rawExpires);
        }
      }

      // Payment history
      final reqData = await supabase
          .from('payment_requests')
          .select('id, plan_name, amount, currency, status, requested_at')
          .eq('user_id', userId)
          .order('requested_at', ascending: false)
          .limit(50);
      final invoices = (reqData as List)
          .map((r) => Invoice.fromJson(r as Map<String, dynamic>))
          .toList();

      if (mounted) {
        setState(() {
          _activePlan = activePlan;
          _expiresAt = expiresAt;
          _invoices = invoices;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _loadData();
    });

    final bg = isDark ? const Color(0xFF0A0A0A) : const Color(0xFFF5F5F5);
    final cardBg = isDark ? const Color(0xFF171717) : Colors.white;

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: const Color(0xFF166534),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'আমার সাবস্ক্রিপশন',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => context.canPop() ? context.pop() : context.go('/'),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw, size: 18),
            onPressed: _loadData,
            tooltip: 'রিফ্রেশ',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          labelStyle: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
          tabs: const [
            Tab(text: 'বর্তমান প্ল্যান'),
            Tab(text: 'ইতিহাস'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF166534)),
            )
          : TabBarView(
              controller: _tabController,
              children: [
                _OverviewTab(
                  isDark: isDark,
                  cardBg: cardBg,
                  activePlan: _activePlan,
                  expiresAt: _expiresAt,
                  daysLeft: _daysLeft,
                  onUpgrade: () => context.go('/subscription'),
                ),
                _HistoryTab(
                  isDark: isDark,
                  cardBg: cardBg,
                  invoices: _invoices,
                  onShowReceipt: _showReceiptSheet,
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
                        color: const Color(0xFF166534),
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
                      value: _statusLabel(invoice.status),
                      valueColor: _statusColor(invoice.status),
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
                            color: Color(0xFF166534),
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
                      'স্ট্যাটাস: ${_statusLabel(invoice.status)}';
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
      padding: const EdgeInsets.all(16),
      children: [
        // Hero card
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF14532D),
            borderRadius: BorderRadius.circular(20),
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
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          activePlan!.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 22,
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
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const Text(
                                'দিন',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 10,
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
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
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
                    color: const Color(0xFFDC2626).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: const Color(0xFFDC2626).withOpacity(0.4),
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
                              ? 'আজই মেয়াদ শেষ হচ্ছে! নবায়ন করুন।'
                              : 'মাত্র $daysLeft দিন বাকি! শীঘ্রই নবায়ন করুন।',
                          style: const TextStyle(
                            color: Color(0xFFFCA5A5),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
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
              fontSize: 15,
              color: isDark ? Colors.white : const Color(0xFF171717),
            ),
          ),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark
                    ? const Color(0xFF262626)
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
                                  ? const Color(0xFF262626)
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
                            fontSize: 13,
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF171717),
                          ),
                        ),
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
            daysLeft <= 30 ? 'প্ল্যান নবায়ন করুন' : 'প্ল্যান আপগ্রেড করুন',
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
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
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
            const SizedBox(height: 20),
            Text(
              'কোনো সক্রিয় সাবস্ক্রিপশন নেই',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : const Color(0xFF171717),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'প্রিমিয়াম প্ল্যান নাও এবং সীমাহীন পড়াশোনা উপভোগ করো',
              style: TextStyle(
                fontSize: 14,
                color: isDark
                    ? const Color(0xFFA3A3A3)
                    : const Color(0xFF737373),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: onUpgrade,
              icon: const Icon(LucideIcons.zap, size: 16),
              label: const Text(
                'প্ল্যান দেখুন ও আপগ্রেড করুন',
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
          ],
        ),
      ),
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
      return Center(
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
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: isDark
                    ? const Color(0xFF737373)
                    : const Color(0xFFA3A3A3),
              ),
            ),
          ],
        ),
      );
    }

    final total = invoices.length;
    final success = invoices.where((i) => i.status == 'paid').length;
    final pending = invoices
        .where((i) => i.status == 'pending' || i.status == 'checking')
        .length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Summary row
        Row(
          children: [
            _SummaryChip(
              label: 'মোট',
              value: '$total',
              color: isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5),
              textColor: isDark ? Colors.white : const Color(0xFF171717),
            ),
            const SizedBox(width: 8),
            _SummaryChip(
              label: 'সফল',
              value: '$success',
              color: const Color(0xFF166534),
              textColor: Colors.white,
            ),
            const SizedBox(width: 8),
            _SummaryChip(
              label: 'অপেক্ষমান',
              value: '$pending',
              color: const Color(0xFFDC2626),
              textColor: Colors.white,
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Invoice list
        Container(
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
            ),
          ),
          child: Column(
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
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.w900,
                fontSize: 18,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                color: textColor.withOpacity(0.8),
                fontSize: 11,
                fontWeight: FontWeight.bold,
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

    return InkWell(
      onTap: invoice.status == 'paid' ? onTap : null,
      borderRadius: BorderRadius.circular(isLast ? 0 : 0).copyWith(
        bottomLeft: isLast ? const Radius.circular(16) : Radius.zero,
        bottomRight: isLast ? const Radius.circular(16) : Radius.zero,
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: isLast
              ? null
              : Border(
                  bottom: BorderSide(
                    color: isDark
                        ? const Color(0xFF262626)
                        : const Color(0xFFE5E5E5),
                  ),
                ),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                invoice.status == 'paid'
                    ? LucideIcons.checkCircle2
                    : invoice.status == 'pending' ||
                          invoice.status == 'checking'
                    ? LucideIcons.clock
                    : LucideIcons.xCircle,
                color: statusColor,
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    invoice.planName,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF171717),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    invoice.date,
                    style: TextStyle(
                      fontSize: 11,
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
                    fontSize: 14,
                    color: isDark ? Colors.white : const Color(0xFF171717),
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
                      fontSize: 10,
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
      return const Color(0xFFDC2626);
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
