import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/presentation/widgets/app_dropdown.dart';

import 'package:url_launcher/url_launcher.dart';

import '../domain/models.dart';
import '../domain/coupon_service.dart';
import 'widgets/coupon_bottom_sheet.dart';
import 'package:obhyash_app/core/utils/app_popups.dart';

class SavedPaymentMethod {
  final String id;
  final String type;
  final String number;

  SavedPaymentMethod({
    required this.id,
    required this.type,
    required this.number,
  });

  factory SavedPaymentMethod.fromJson(Map<String, dynamic> json) {
    return SavedPaymentMethod(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      number: json['number']?.toString() ?? '',
    );
  }
}

class PaymentView extends StatefulWidget {
  final SubscriptionPlan plan;
  final String? appliedCouponCode;

  const PaymentView({super.key, required this.plan, this.appliedCouponCode});

  @override
  State<PaymentView> createState() => _PaymentViewState();
}

class _PaymentViewState extends State<PaymentView>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  String _selectedMethod = 'bKash';
  final _senderController = TextEditingController();
  final _trxController = TextEditingController();
  bool _isSubmitting = false;
  List<SavedPaymentMethod> _savedMethods = [];
  bool _showSuccess = false;

  static const _merchantNumber = '01749591456';

  bool _hasPendingPayment = false;
  String? _pendingTrxId;
  String? _pendingRequestId;
  bool _isCancellingPending = false;

  // Coupon state
  late SubscriptionPlan _currentPlan;
  AppliedCoupon? _appliedCoupon;

  @override
  void initState() {
    super.initState();
    _currentPlan = widget.plan;
    if (widget.appliedCouponCode != null && widget.appliedCouponCode!.isNotEmpty) {
      final res = CouponService.validate(widget.appliedCouponCode!, widget.plan.price);
      if (res.isValid && res.appliedCoupon != null) {
        _appliedCoupon = res.appliedCoupon;
      }
    }
    _tabController = TabController(length: 3, vsync: this);
    _fetchSavedMethods();
    _checkPendingPayment();
  }

  void _openCouponSheet() {
    CouponBottomSheet.show(
      context: context,
      appliedCoupon: _appliedCoupon,
      planPrice: widget.plan.price,
      onApply: (code) {
        final res = CouponService.validate(code, widget.plan.price);
        if (res.isValid && res.appliedCoupon != null) {
          setState(() {
            _appliedCoupon = res.appliedCoupon;
            _currentPlan = SubscriptionPlan(
              id: widget.plan.id,
              name: widget.plan.name,
              price: res.appliedCoupon!.finalPrice,
              billingCycle: widget.plan.billingCycle,
              durationDays: widget.plan.durationDays,
              currency: widget.plan.currency,
              features: widget.plan.features,
              colorTheme: widget.plan.colorTheme,
              expiresAt: widget.plan.expiresAt,
            );
          });
          Navigator.pop(context);
          AppPopups.success(
            context,
            message: "🎉 '${res.appliedCoupon!.code}' কুপন সফলভাবে প্রয়োগ হয়েছে!",
          );
        } else {
          AppPopups.warning(
            context,
            message: res.errorMessage ?? 'অকার্যকর কুপন কোড!',
          );
        }
      },
      onRemove: () {
        setState(() {
          _appliedCoupon = null;
          _currentPlan = widget.plan;
        });
        Navigator.pop(context);
        AppPopups.info(context, message: 'কুপন মুছে ফেলা হয়েছে');
      },
    );
  }

  Future<void> _checkPendingPayment() async {
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) return;

      final pending = await supabase
          .from('payment_requests')
          .select('id, transaction_id, plan_name, requested_at')
          .eq('user_id', userId)
          .eq('status', 'Pending')
          .maybeSingle();

      if (mounted && pending != null) {
        setState(() {
          _hasPendingPayment = true;
          _pendingTrxId = pending['transaction_id']?.toString();
          _pendingRequestId = pending['id']?.toString();
        });
      }
    } catch (_) {}
  }

  Future<void> _cancelPendingPayment() async {
    if (_pendingRequestId == null || _isCancellingPending) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(
          'আবেদন বাতিল করবেন?',
          style: TextStyle(
            fontFamily: 'HindSiliguri',
            fontWeight: FontWeight.bold,
          ),
        ),
        content: const Text(
          'ভুল তথ্য দেওয়া হয়ে থাকলে বর্তমান আবেদনটি বাতিল করে আপনি নতুন সঠিক TrxID ও মোবাইল নম্বর দিয়ে পুনরায় আবেদন করতে পারবেন।',
          style: TextStyle(fontFamily: 'HindSiliguri'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('না, থাক'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
            ),
            child: const Text('হ্যাঁ, বাতিল করো'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isCancellingPending = true);
    try {
      final supabase = Supabase.instance.client;
      await supabase
          .from('payment_requests')
          .update({'status': 'Cancelled'})
          .eq('id', _pendingRequestId!)
          .eq('status', 'Pending');

      if (mounted) {
        HapticFeedback.mediumImpact();
        setState(() {
          _hasPendingPayment = false;
          _pendingTrxId = null;
          _pendingRequestId = null;
          _isCancellingPending = false;
        });
        AppPopups.success(
          context,
          message: 'পূর্বের আবেদন বাতিল করা হয়েছে। এখন সঠিক তথ্য দিয়ে সাবমিট করুন।',
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isCancellingPending = false);
        AppPopups.error(
          context,
          message: 'আবেদন বাতিল করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।',
        );
      }
    }
  }

  Future<void> _fetchSavedMethods() async {
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) {
        return;
      }

      final data = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      final methods = (data as List)
          .map(
            (item) => SavedPaymentMethod.fromJson(item as Map<String, dynamic>),
          )
          .toList();

      if (mounted) {
        setState(() {
          _savedMethods = methods;
        });
      }
    } catch (e) {
      // Ignored
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _senderController.dispose();
    _trxController.dispose();
    super.dispose();
  }

  Future<void> _copyNumber() async {
    await Clipboard.setData(const ClipboardData(text: _merchantNumber));
    if (mounted) {
      AppPopups.success(context, message: 'নম্বর কপি করা হয়েছে!');
    }
  }

  Future<void> _submit() async {
    if (_hasPendingPayment) {
      AppPopups.warning(
        context,
        message: 'আপনার একটি পেমেন্ট রিকোয়েস্ট (TrxID: ${_pendingTrxId ?? ""}) ইতিমধ্যে প্রক্রিয়াধীন আছে। সেটি যাচাই সম্পন্ন হওয়া পর্যন্ত অপেক্ষা করুন।',
      );
      return;
    }

    final sender = _senderController.text.trim();
    final trxId = _trxController.text.trim().toUpperCase();

    // 1. Phone number validation (exact 11-digit BD mobile starting with 013-019)
    final phoneRegex = RegExp(r'^01[3-9]\d{8}$');
    if (!phoneRegex.hasMatch(sender)) {
      AppPopups.warning(
        context,
        message: 'সঠিক মোবাইল নম্বর দিন (১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর)',
      );
      return;
    }

    // 2. TrxID Format validation (6 to 25 alphanumeric chars)
    final trxRegex = RegExp(r'^[A-Z0-9]{6,25}$');
    if (!trxRegex.hasMatch(trxId)) {
      AppPopups.warning(
        context,
        message: 'সঠিক ট্রানজেকশন আইডি দিন (ন্যূনতম ৬ ও সর্বোচ্চ ২৫ অক্ষর)',
      );
      return;
    }

    // 3. Block known dummy / fake TrxIDs
    const dummyTrx = {
      '123456',
      '12345678',
      '00000000',
      'AAAAAAAA',
      'TEST1234',
      'ASDFGHJK',
      'ABCDEF1234',
      '11111111',
      '1234567890',
      'TRANSACTION',
    };
    if (dummyTrx.contains(trxId)) {
      AppPopups.warning(
        context,
        message: 'অনুগ্রহ করে পেমেন্ট করার পর প্রাপ্ত আসল ট্রানজেকশন আইডি (TrxID) দিন।',
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('User not logged in');

      // 4. Duplicate TrxID check
      final dup = await supabase
          .from('payment_requests')
          .select('id')
          .eq('transaction_id', trxId)
          .inFilter('status', ['Approved', 'Pending'])
          .maybeSingle();

      if (dup != null) {
        if (mounted) {
          setState(() => _isSubmitting = false);
          AppPopups.warning(
            context,
            message: 'এই ট্রানজেকশন আইডিটি (TrxID) ইতিপূর্বে ব্যবহার করা হয়েছে। সঠিক TrxID দিন।',
          );
        }
        return;
      }

      await supabase.from('payment_requests').insert({
        'user_id': userId,
        'plan_name': _currentPlan.name,
        'amount': _currentPlan.price,
        'currency': 'BDT',
        'payment_method': '$_selectedMethod ($sender)',
        'transaction_id': trxId,
        'status': 'Pending',
        'requested_at': DateTime.now().toIso8601String(),
      });

      // Simulate validation delay for UI effect
      await Future.delayed(const Duration(milliseconds: 1200));

      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _showSuccess = true;
          _hasPendingPayment = true;
          _pendingTrxId = trxId;
        });

        AppPopups.success(
          context,
          message:
              'পেমেন্ট তথ্য জমা নেওয়া হয়েছে। দ্রুত যাচাই করে ${widget.plan.name} প্ল্যান চালু করা হবে।',
        );

        // Auto pop after a delay
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) Navigator.pop(context, true);
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        final err = e.toString();
        if (err.contains('ইতিমধ্যে') || err.contains('সীমা') || err.contains('সঠিক')) {
          AppPopups.warning(context, message: err.replaceAll('Exception:', '').trim());
        } else {
          AppPopups.error(
            context,
            message: 'পেমেন্ট রিকোয়েস্ট জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করো।',
          );
        }
      }
    }
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  // ── Build ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF000000)
          : const Color(0xFFFAFAFA),
      body: SafeArea(
        child: Column(
          children: [
            // Top Header with Back Button
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF000000).withValues(alpha: 0.8)
                    : Colors.white.withValues(alpha: 0.8),
                border: Border(
                  bottom: BorderSide(
                    color: isDark
                        ? const Color(0xFF1C1C1E)
                        : const Color(0xFFF5F5F5),
                  ),
                ),
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(
                      LucideIcons.arrowLeft,
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF737373),
                    ),
                    splashRadius: 24,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'পেমেন্ট প্রসেসিং',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF000000),
                    ),
                  ),
                ],
              ),
            ),

            if (_showSuccess)
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: const Color(0xFF059669).withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          LucideIcons.checkCircle2,
                          size: 64,
                          color: Color(0xFF059669),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'পেমেন্ট সফলভাবে জমা হয়েছে',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: isDark
                              ? Colors.white
                              : const Color(0xFF000000),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          'আমাদের টিম যাচাই করার পর দ্রুত তোমার প্ল্যানটি চালু করে দিবে।',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 16,
                            color: isDark
                                ? const Color(0xFFA3A3A3)
                                : const Color(0xFF737373),
                            height: 1.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else ...[
              // Tab Bar
              Container(
                color: isDark ? const Color(0xFF000000) : Colors.white,
                child: TabBar(
                  controller: _tabController,
                  tabs: [
                    Tab(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(LucideIcons.info, size: 16),
                          SizedBox(width: 6),
                          Text('বিস্তারিত'),
                        ],
                      ),
                    ),
                    Tab(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(LucideIcons.headphones, size: 16),
                          SizedBox(width: 6),
                          Text('সাপোর্ট'),
                        ],
                      ),
                    ),
                    Tab(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(LucideIcons.helpCircle, size: 16),
                          SizedBox(width: 6),
                          Text('তথ্য'),
                        ],
                      ),
                    ),
                  ],
                  labelColor: const Color(0xFF059669),
                  unselectedLabelColor: const Color(0xFFA3A3A3),
                  indicatorColor: const Color(0xFF059669),
                  indicatorWeight: 2,
                  labelStyle: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                  unselectedLabelStyle: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),

              // Tab Views
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildDetailsTab(isDark),
                    _buildSupportTab(isDark),
                    _buildInfoTab(isDark),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ── Details Tab ─────────────────────────────────────────────────────────

  Widget _buildDetailsTab(bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Plan summary row
          Row(
            children: [
              Expanded(
                child: _summaryCard(
                  isDark,
                  label: 'প্যাকেজ',
                  value: _currentPlan.name,
                  bgColor: isDark
                      ? const Color(0xFF18181B)
                      : const Color(0xFFF8FAFC),
                  borderColor: isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFE2E8F0),
                  valueColor: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _summaryCard(
                  isDark,
                  label: 'পরিশোধ করতে হবে',
                  value: '৳ ${_currentPlan.price}.00',
                  bgColor: isDark
                      ? const Color(0xFF0D2506)
                      : const Color(0xFFF0FDF4),
                  borderColor: isDark
                      ? const Color(0xFF16A34A).withValues(alpha: 0.5)
                      : const Color(0xFFBBF7D0),
                  valueColor: isDark
                      ? const Color(0xFF4ADE80)
                      : const Color(0xFF16A34A),
                  labelColor: isDark
                      ? const Color(0xFF4ADE80)
                      : const Color(0xFF16A34A),
                  badge: _appliedCoupon != null
                      ? '🏷️ ${_appliedCoupon!.code}'
                      : null,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // ── Coupon prompt / remove coupon text link (no box) ──────────
          Center(
            child: Padding(
              padding: const EdgeInsets.only(top: 2, bottom: 4),
              child: GestureDetector(
                onTap: () {
                  if (_appliedCoupon != null) {
                    setState(() {
                      _appliedCoupon = null;
                      _currentPlan = widget.plan;
                    });
                    AppPopups.info(context, message: 'কুপন মুছে ফেলা হয়েছে');
                  } else {
                    _openCouponSheet();
                  }
                },
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Text(
                    _appliedCoupon != null ? 'কুপন রিমুভ করুন' : 'কুপন আছে?',
                    style: TextStyle(
                      fontSize: 13,
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
          ),
          const SizedBox(height: 16),

          // Merchant number instruction card
          Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF141416) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark
                    ? const Color(0xFF059669)
                    : const Color(0xFFA7F3D0),
                width: 1.5,
              ),
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'অনুগ্রহ করে নিচের নির্দেশনা অনুসরণ করুন',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: isDark
                        ? const Color(0xFFF4F4F5)
                        : const Color(0xFF18181B),
                  ),
                ),
                const SizedBox(height: 12),

                // Copyable merchant number container
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF1F1F23)
                        : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF2E2E33)
                          : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'bKash / Nagad (Send Money)',
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                                color: isDark
                                    ? const Color(0xFFA1A1AA)
                                    : const Color(0xFF64748B),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _merchantNumber,
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.2,
                                fontFamily: 'monospace',
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                      ),
                      InkWell(
                        onTap: _copyNumber,
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF27272A)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF3F3F46)
                                  : const Color(0xFFCBD5E1),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                LucideIcons.copy,
                                size: 14,
                                color: isDark
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFF059669),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'কপি',
                                style: TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? const Color(0xFF34D399)
                                      : const Color(0xFF059669),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Step instructions
                ...[
                  'উপরের নম্বরে Send Money করুন।',
                  'Reference হিসেবে আপনার মোবাইল নম্বর দিন।',
                  'নিচের ফর্মে আপনার পেমেন্ট মেথড, প্রেরকের মোবাইল নম্বর এবং TrxID দিন।',
                ].map(
                  (step) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          margin: const EdgeInsets.only(
                            top: 7,
                            right: 8,
                            left: 4,
                          ),
                          width: 4.5,
                          height: 4.5,
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFFA1A1AA)
                                : const Color(0xFF71717A),
                            shape: BoxShape.circle,
                          ),
                        ),
                        Expanded(
                          child: Text(
                            step,
                            style: TextStyle(
                              fontFamily: 'HindSiliguri',
                              fontSize: 13.5,
                              height: 1.4,
                              color: isDark
                                  ? const Color(0xFFD4D4D8)
                                  : const Color(0xFF334155),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Saved Payment Methods Header with Edit / Add Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'SAVED PAYMENT METHODS',
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                  color: isDark
                      ? const Color(0xFFA1A1AA)
                      : const Color(0xFF64748B),
                ),
              ),
              InkWell(
                onTap: () => _openManagePaymentMethodsSheet(isDark),
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _savedMethods.isEmpty ? LucideIcons.plusCircle : LucideIcons.edit3,
                        size: 14,
                        color: isDark
                            ? const Color(0xFF34D399)
                            : const Color(0xFF059669),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _savedMethods.isEmpty ? 'মেথড যোগ করুন' : 'এডিট / যোগ করুন',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: isDark
                              ? const Color(0xFF34D399)
                              : const Color(0xFF059669),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          if (_savedMethods.isNotEmpty)
            ..._savedMethods.map((method) {
              final isSelected =
                  _selectedMethod.toLowerCase() == method.type.toLowerCase() &&
                  _senderController.text == method.number;

              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedMethod = method.type.toLowerCase() == 'bkash'
                          ? 'bKash'
                          : method.type.toLowerCase() == 'nagad'
                              ? 'Nagad'
                              : method.type;
                      _senderController.text = method.number;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? (isDark
                                ? const Color(0xFF059669).withValues(alpha: 0.15)
                                : const Color(0xFFECFDF5))
                          : (isDark ? const Color(0xFF141416) : Colors.white),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFF059669)
                            : (isDark
                                  ? const Color(0xFF27272A)
                                  : const Color(0xFFE2E8F0)),
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            color: method.type.toLowerCase() == 'bkash'
                                ? const Color(0xFFD11559)
                                : method.type.toLowerCase() == 'nagad'
                                    ? const Color(0xFFE11D48)
                                    : const Color(0xFF6B21A8),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(
                              method.type.toLowerCase() == 'bkash'
                                  ? 'bK'
                                  : method.type.toLowerCase() == 'nagad'
                                      ? 'N'
                                      : 'R',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                method.type.toUpperCase(),
                                style: TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF0F172A),
                                ),
                              ),
                              Text(
                                method.number,
                                style: TextStyle(
                                  fontSize: 14.5,
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.w600,
                                  color: isDark
                                      ? const Color(0xFFA1A1AA)
                                      : const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (isSelected)
                          const Icon(
                            LucideIcons.checkCircle2,
                            size: 18,
                            color: Color(0xFF059669),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            })
          else
            GestureDetector(
              onTap: () => _openManagePaymentMethodsSheet(isDark),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF141416) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                    style: BorderStyle.solid,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      LucideIcons.plusCircle,
                      size: 18,
                      color: isDark ? const Color(0xFF34D399) : const Color(0xFF059669),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'ভবিষ্যতে সহজে পেমেন্ট করতে আপনার বিকাশ/নগদ নম্বর যোগ করুন',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 12.5,
                          color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 16),

          // Payment method selector
          Text(
            'পেমেন্ট মেথড (Payment Method)',
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF27272A),
            ),
          ),
          const SizedBox(height: 6),
          AppDropdown<String>(
            value: _selectedMethod,
            options: ['bKash', 'Nagad']
                .map((m) => AppDropdownOption(value: m, label: m))
                .toList(),
            onChanged: (val) {
              if (val != null) setState(() => _selectedMethod = val);
            },
          ),
          const SizedBox(height: 16),

          // Sender number
          Text(
            'প্রেরকের মোবাইল নম্বর (Your Mobile Number)',
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF27272A),
            ),
          ),
          const SizedBox(height: 6),
          _inputField(
            controller: _senderController,
            hint: 'যেমন: 017xxxxxxxx',
            keyboardType: TextInputType.phone,
            isDark: isDark,
          ),
          const SizedBox(height: 16),

          // TrxID
          Text(
            'ট্রানজেকশন আইডি (TrxID)',
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF27272A),
            ),
          ),
          const SizedBox(height: 6),
          _inputField(
            controller: _trxController,
            hint: 'SMS থেকে প্রাপ্ত TrxID দিন',
            isDark: isDark,
            textCapitalization: TextCapitalization.characters,
          ),
          const SizedBox(height: 20),

          // Pending Payment Status Alert
          if (_hasPendingPayment) ...[
            Container(
              padding: const EdgeInsets.all(14),
              margin: const EdgeInsets.only(bottom: 18),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF451A03).withValues(alpha: 0.4)
                    : const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFFD97706).withValues(alpha: 0.4)
                      : const Color(0xFFFDE68A),
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    LucideIcons.clock,
                    size: 20,
                    color: Color(0xFFD97706),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'পেমেন্ট যাচাই প্রক্রিয়াধীন',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                            color: Color(0xFFD97706),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'আপনার পূর্বে পাঠানো TrxID (${_pendingTrxId ?? "..."}) যাচাই করা হচ্ছে। অনুমোদিত হলে স্বয়ংক্রিয়ভাবে প্ল্যান চালু হবে।',
                          style: TextStyle(
                            fontSize: 12,
                            fontFamily: 'HindSiliguri',
                            color: isDark
                                ? const Color(0xFFFDE68A)
                                : const Color(0xFF92400E),
                          ),
                        ),
                        const SizedBox(height: 10),
                        InkWell(
                          onTap: _isCancellingPending
                              ? null
                              : _cancelPendingPayment,
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFFD97706).withValues(alpha: 0.2)
                                  : const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isDark
                                    ? const Color(0xFFD97706).withValues(alpha: 0.5)
                                    : const Color(0xFFFCD34D),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (_isCancellingPending)
                                  const SizedBox(
                                    width: 12,
                                    height: 12,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Color(0xFFD97706),
                                    ),
                                  )
                                else
                                  const Icon(
                                    LucideIcons.refreshCw,
                                    size: 13,
                                    color: Color(0xFFD97706),
                                  ),
                                const SizedBox(width: 6),
                                Text(
                                  _isCancellingPending
                                      ? 'বাতিল হচ্ছে...'
                                      : 'ভুল তথ্য দিয়েছেন? বাতিল করে পুনরায় দিন',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark
                                        ? const Color(0xFFFDE68A)
                                        : const Color(0xFF92400E),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Submit button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: (_isSubmitting || _hasPendingPayment) ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: _hasPendingPayment
                    ? (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0))
                    : const Color(0xFF059669),
                foregroundColor: _hasPendingPayment
                    ? (isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8))
                    : Colors.white,
                disabledBackgroundColor: _hasPendingPayment
                    ? (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0))
                    : const Color(0xFF059669).withValues(alpha: 0.5),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: _hasPendingPayment ? 0 : 4,
                shadowColor: const Color(0xFF059669).withValues(alpha: 0.4),
              ),
              child: _isSubmitting
                  ? Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'যাচাই করা হচ্ছে...',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    )
                  : Text(
                      _hasPendingPayment
                          ? 'পেমেন্ট যাচাই প্রক্রিয়াধীন'
                          : 'Verify Payment',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'HindSiliguri',
                        color: _hasPendingPayment
                            ? (isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8))
                            : Colors.white,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // ── Support Tab ─────────────────────────────────────────────────────────

  Widget _buildSupportTab(bool isDark) {
    final items = [
      (
        '📞',
        'সরাসরি কথা বলুন',
        'কল করতে ক্লিক করো',
        'tel:+8801409583992',
        const Color(0xFFECFDF5),
        const Color(0xFF059669),
      ),
      (
        '💬',
        'লাইভ চ্যাট (Messenger)',
        'এখানে ক্লিক করো',
        'https://m.me/obhyash',
        const Color(0xFFECFDF5),
        const Color(0xFF059669),
      ),
      (
        '📱',
        'লাইভ চ্যাট (WhatsApp)',
        'এখানে ক্লিক করো',
        'https://wa.me/8801409583992',
        const Color(0xFFECFDF5),
        const Color(0xFF059669),
      ),
      (
        '✉️',
        'সাপোর্টে ইমেইল',
        'এখানে ক্লিক করো',
        'mailto:support@obhyash.com',
        const Color(0xFFFEF2F2),
        const Color(0xFFB91C1C),
      ),
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: GestureDetector(
                onTap: () => _launchUrl(item.$4),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF27272A)
                          : const Color(0xFFE5E5E5),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: isDark
                              ? item.$5.withValues(alpha: 0.1)
                              : item.$5,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            item.$1,
                            style: const TextStyle(fontSize: 22),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.$2,
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF000000),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              item.$3,
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontSize: 13,
                                color: isDark
                                    ? const Color(0xFFA1A1AA)
                                    : const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => _tabController.animateTo(0),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'পেমেন্ট করতে এগিয়ে যান',
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
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

  // ── Info / FAQ Tab ───────────────────────────────────────────────────────

  Widget _buildInfoTab(bool isDark) {
    final faqs = [
      (
        q: 'কিভাবে পেমেন্ট সম্পন্ন করবেন?',
        a: '১. আপনার বিকাশ বা নগদ অ্যাপে গিয়ে "Send Money" করুন।\n২. আমাদের অফিসিয়াল মার্চেন্ট নম্বর 01749591456 দিন।\n৩. প্যাকেজের নির্ধারিত সঠিক টাকা পাঠান।\n৪. পেমেন্ট সম্পন্ন হলে ফিরতি SMS বা অ্যাপ থেকে TrxID কপি করে "বিস্তারিত" ফর্মে সাবমিট করুন।',
      ),
      (
        q: 'পেমেন্ট করার কতক্ষণ পর একাউন্ট প্রিমিয়াম হবে?',
        a: 'তথ্য সাবমিট করার পর সাধারণত ৫ থেকে ৩০ মিনিটের মধ্যে আমাদের ভেরিফিকেশন টিম যাচাই করে আপনার একাউন্ট স্বয়ংক্রিয়ভাবে প্রিমিয়াম করে দেয়। সর্বোচ্চ ১-২ ঘণ্টার মধ্যে নিশ্চিতভাবে এক্টিভেশন সম্পন্ন হয়।',
      ),
      (
        q: 'ট্রানজেকশন আইডি (TrxID) কোথায় পাব?',
        a: '• বিকাশ: পেমেন্ট সফল হওয়ার পর স্ক্রিনে, ইনবক্স স্টেটমেন্টে অথবা আসা SMS-এ TrxID (যেমন: BLA7X8Y9Z) দেখতে পাবেন।\n• নগদ: নগদ অ্যাপের "লেনদেন" হিস্ট্রি বা ফিরতি SMS-এ TxnID দেখতে পাবেন।',
      ),
      (
        q: 'ভুল TrxID বা ভুল নম্বর সাবমিট করলে কি করব?',
        a: 'ভুল তথ্য দেওয়া হয়ে থাকলে "বিস্তারিত" ট্যাবে থাকা পেন্ডিং রিকোয়েস্ট থেকে "আবেদন বাতিল" বাটনে ক্লিক করে সাথে সাথে সঠিক তথ্য দিয়ে পুনরায় আবেদন করতে পারবেন। অথবা আমাদের হোয়াটসঅ্যাপ সাপোর্টে যোগাযোগ করতে পারেন।',
      ),
      (
        q: 'রেফারেন্সে (Reference) কিছু না দিলে কি সমস্যা হবে?',
        a: 'না, কোনো সমস্যা নেই। রেফারেন্সে আপনার নম্বর দেওয়া সুবিধাজনক, তবে রেফারেন্স না দিলেও সঠিক TrxID ফর্মে সাবমিট করলেই পেমেন্ট সফলভাবে শনাক্ত করা যাবে।',
      ),
      (
        q: 'প্যাকেজের মেয়াদ শেষ হলে কি স্বয়ংক্রিয়ভাবে টাকা কাটবে?',
        a: 'না, এখানে কোনো অটো-রিনিউ বা স্বয়ংক্রিয় টাকা কাটার সুযোগ নেই। মেয়াদ শেষ হলে আপনি নিজের সুবিধাজনক সময়ে পুনরায় রিনিউ করতে পারবেন।',
      ),
      (
        q: 'টাকা কেটে নিয়েছে কিন্তু কনফার্মেশন পাইনি?',
        a: 'কখনও নেটওয়ার্ক সমস্যার কারণে SMS আসতে দেরি হতে পারে। আপনার বিকাশ/নগদ অ্যাপের স্টেটমেন্ট চেক করে প্রাপ্ত TrxID ফর্মে সাবমিট করুন অথবা সরাসরি সাপোর্টে যোগাযোগ করুন।',
      ),
      (
        q: 'যেকোনো প্রয়োজনে জরুরি সহায়তা কোথায় পাব?',
        a: '"সাপোর্ট" ট্যাবে গিয়ে সরাসরি আমাদের হোয়াটসঅ্যাপে (01409583992) মেসেজ দিন অথবা হেল্পলাইনে কল করুন। আমাদের সাপোর্ট টিম দ্রুত সহায়তা প্রদান করবে।',
      ),
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF141416) : const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isDark ? const Color(0xFF27272A) : const Color(0xFFBBF7D0),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  LucideIcons.helpCircle,
                  size: 20,
                  color: Color(0xFF059669),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'পেমেন্ট সংক্রান্ত যেকোনো প্রশ্নে নিচের উত্তরগুলো দেখে নিন',
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 13.5,
                      fontWeight: FontWeight.bold,
                      color: isDark
                          ? const Color(0xFFE4E4E7)
                          : const Color(0xFF166534),
                    ),
                  ),
                ),
              ],
            ),
          ),
          ...faqs.map(
            (faq) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _FaqTile(q: faq.q, a: faq.a, isDark: isDark),
            ),
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => _tabController.animateTo(0),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'পেমেন্ট করতে এগিয়ে যান',
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
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

  void _openManagePaymentMethodsSheet(bool isDark) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _PaymentMethodsBottomSheet(
        isDark: isDark,
        savedMethods: _savedMethods,
        selectedMethod: _selectedMethod,
        selectedNumber: _senderController.text,
        onSelectMethod: (method) {
          setState(() {
            _selectedMethod = method.type.toLowerCase() == 'nagad'
                ? 'Nagad'
                : 'bKash';
            _senderController.text = method.number;
          });
        },
        onMethodsChanged: _fetchSavedMethods,
      ),
    );
  }

  // ── Helper widgets ───────────────────────────────────────────────────────

  Widget _summaryCard(
    bool isDark, {
    required String label,
    required String value,
    required Color bgColor,
    required Color valueColor,
    Color? labelColor,
    Color? borderColor,
    String? badge,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        border: borderColor != null
            ? Border.all(color: borderColor)
            : Border.all(
                color: isDark
                    ? const Color(0xFF27272A)
                    : const Color(0xFFE2E8F0),
              ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.4,
              color:
                  labelColor ??
                  (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B)),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 15.5,
              fontWeight: FontWeight.w900,
              color: valueColor,
              height: 1.2,
            ),
            maxLines: 2,
            textAlign: TextAlign.center,
            overflow: TextOverflow.ellipsis,
          ),
          if (badge != null) ...[
            const SizedBox(height: 5),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFF004633).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                badge,
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                  color: isDark ? const Color(0xFF4ADE80) : const Color(0xFF004633),
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _inputField({
    required TextEditingController controller,
    required String hint,
    required bool isDark,
    TextInputType keyboardType = TextInputType.text,
    TextCapitalization textCapitalization = TextCapitalization.none,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      style: TextStyle(
        color: isDark ? Colors.white : const Color(0xFF0F172A),
        fontWeight: FontWeight.w600,
        fontFamily: 'monospace',
      ),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(
          color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
          fontFamily: 'HindSiliguri',
          fontWeight: FontWeight.normal,
        ),
        filled: true,
        fillColor: isDark ? const Color(0xFF18181B) : const Color(0xFFF8FAFC),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF059669), width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
    );
  }
}

// ── Saved Payment Methods Bottom Sheet (Max 50% Height) ──────────────────────

class _PaymentMethodsBottomSheet extends StatefulWidget {
  final bool isDark;
  final List<SavedPaymentMethod> savedMethods;
  final String selectedMethod;
  final String selectedNumber;
  final ValueChanged<SavedPaymentMethod> onSelectMethod;
  final VoidCallback onMethodsChanged;

  const _PaymentMethodsBottomSheet({
    required this.isDark,
    required this.savedMethods,
    required this.selectedMethod,
    required this.selectedNumber,
    required this.onSelectMethod,
    required this.onMethodsChanged,
  });

  @override
  State<_PaymentMethodsBottomSheet> createState() =>
      _PaymentMethodsBottomSheetState();
}

class _PaymentMethodsBottomSheetState extends State<_PaymentMethodsBottomSheet> {
  int _currentTab = 0; // 0 = List, 1 = Add New
  String _newType = 'bKash';
  final _phoneController = TextEditingController();
  bool _isSaving = false;
  late List<SavedPaymentMethod> _localMethods;

  @override
  void initState() {
    super.initState();
    _localMethods = List.from(widget.savedMethods);
    if (_localMethods.isEmpty) {
      _currentTab = 1; // Default to Add if none saved
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _saveMethod() async {
    final phone = _phoneController.text.trim();
    final phoneRegex = RegExp(r'^01[3-9]\d{8}$');
    if (!phoneRegex.hasMatch(phone)) {
      AppPopups.warning(
        context,
        message: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)',
      );
      return;
    }

    setState(() => _isSaving = true);
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('User not authenticated');

      final dbType = _newType.toLowerCase();

      final res = await supabase
          .from('payment_methods')
          .insert({
            'user_id': userId,
            'type': dbType,
            'number': phone,
            'is_default': false,
          })
          .select()
          .single();

      final newMethod = SavedPaymentMethod.fromJson(res);

      if (mounted) {
        widget.onMethodsChanged();
        widget.onSelectMethod(newMethod);
        Navigator.pop(context);
        AppPopups.success(
          context,
          message: 'পেমেন্ট মেথড সফলভাবে যোগ করা হয়েছে!',
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        AppPopups.error(
          context,
          message: 'পেমেন্ট মেথড সংরক্ষণে সমস্যা হয়েছে।',
        );
      }
    }
  }

  Future<void> _deleteMethod(SavedPaymentMethod method) async {
    try {
      final supabase = Supabase.instance.client;
      await supabase.from('payment_methods').delete().eq('id', method.id);

      if (mounted) {
        setState(() {
          _localMethods.removeWhere((m) => m.id == method.id);
          if (_localMethods.isEmpty) {
            _currentTab = 1;
          }
        });
        widget.onMethodsChanged();
        AppPopups.success(context, message: 'পেমেন্ট মেথড মুছে ফেলা হয়েছে');
      }
    } catch (e) {
      if (mounted) {
        AppPopups.error(context, message: 'মুছে ফেলতে সমস্যা হয়েছে');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final maxHeight = MediaQuery.of(context).size.height * 0.5;

    return Container(
      constraints: BoxConstraints(maxHeight: maxHeight),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141416) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 10, bottom: 8),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'পেমেন্ট মেথড ম্যানেজমেন্ট',
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(
                      LucideIcons.x,
                      size: 20,
                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),

            // Tab bar switcher
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E1E22) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _currentTab = 0),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          decoration: BoxDecoration(
                            color: _currentTab == 0
                                ? (isDark ? const Color(0xFF27272A) : Colors.white)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: _currentTab == 0
                                ? [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.05),
                                      blurRadius: 4,
                                    ),
                                  ]
                                : null,
                          ),
                          child: Center(
                            child: Text(
                              'সংরক্ষিত নম্বর (${_localMethods.length})',
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontSize: 13,
                                fontWeight: _currentTab == 0
                                    ? FontWeight.w800
                                    : FontWeight.w600,
                                color: _currentTab == 0
                                    ? (isDark ? Colors.white : const Color(0xFF0F172A))
                                    : (isDark
                                        ? const Color(0xFFA1A1AA)
                                        : const Color(0xFF64748B)),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _currentTab = 1),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          decoration: BoxDecoration(
                            color: _currentTab == 1
                                ? (isDark ? const Color(0xFF27272A) : Colors.white)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: _currentTab == 1
                                ? [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.05),
                                      blurRadius: 4,
                                    ),
                                  ]
                                : null,
                          ),
                          child: Center(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(LucideIcons.plus, size: 13),
                                const SizedBox(width: 4),
                                Text(
                                  'নতুন যোগ করুন',
                                  style: TextStyle(
                                    fontFamily: 'HindSiliguri',
                                    fontSize: 13,
                                    fontWeight: _currentTab == 1
                                        ? FontWeight.w800
                                        : FontWeight.w600,
                                    color: _currentTab == 1
                                        ? (isDark ? Colors.white : const Color(0xFF0F172A))
                                        : (isDark
                                            ? const Color(0xFFA1A1AA)
                                            : const Color(0xFF64748B)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Content Area
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: _currentTab == 0
                    ? (_localMethods.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  LucideIcons.creditCard,
                                  size: 36,
                                  color: isDark
                                      ? const Color(0xFF3F3F46)
                                      : const Color(0xFFCBD5E1),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'কোনো সেভ করা মেথড নেই',
                                  style: TextStyle(
                                    fontFamily: 'HindSiliguri',
                                    fontSize: 14,
                                    color: isDark
                                        ? const Color(0xFFA1A1AA)
                                        : const Color(0xFF64748B),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                TextButton.icon(
                                  onPressed: () => setState(() => _currentTab = 1),
                                  icon: const Icon(LucideIcons.plus, size: 16),
                                  label: const Text('নতুন মেথড যোগ করুন'),
                                  style: TextButton.styleFrom(
                                    foregroundColor: const Color(0xFF059669),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
                            itemCount: _localMethods.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 8),
                            itemBuilder: (ctx, i) {
                              final m = _localMethods[i];
                              final isSelected = widget.selectedMethod.toLowerCase() ==
                                      m.type.toLowerCase() &&
                                  widget.selectedNumber == m.number;

                              return Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0xFF1C1C1E)
                                      : const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isSelected
                                        ? const Color(0xFF059669)
                                        : (isDark
                                            ? const Color(0xFF27272A)
                                            : const Color(0xFFE2E8F0)),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 32,
                                      height: 32,
                                      decoration: BoxDecoration(
                                        color: m.type.toLowerCase() == 'bkash'
                                            ? const Color(0xFFD11559)
                                            : m.type.toLowerCase() == 'nagad'
                                                ? const Color(0xFFE11D48)
                                                : const Color(0xFF6B21A8),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Center(
                                        child: Text(
                                          m.type.toLowerCase() == 'bkash'
                                              ? 'bK'
                                              : m.type.toLowerCase() == 'nagad'
                                                  ? 'N'
                                                  : 'R',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w900,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            m.type.toUpperCase(),
                                            style: TextStyle(
                                              fontFamily: 'HindSiliguri',
                                              fontWeight: FontWeight.bold,
                                              fontSize: 13,
                                              color: isDark
                                                  ? Colors.white
                                                  : const Color(0xFF0F172A),
                                            ),
                                          ),
                                          Text(
                                            m.number,
                                            style: TextStyle(
                                              fontSize: 13.5,
                                              fontFamily: 'monospace',
                                              color: isDark
                                                  ? const Color(0xFFA1A1AA)
                                                  : const Color(0xFF64748B),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    TextButton(
                                      onPressed: () {
                                        widget.onSelectMethod(m);
                                        Navigator.pop(context);
                                      },
                                      style: TextButton.styleFrom(
                                        foregroundColor: const Color(0xFF059669),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 6,
                                        ),
                                        minimumSize: Size.zero,
                                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      ),
                                      child: const Text(
                                        'ব্যবহার করুন',
                                        style: TextStyle(
                                          fontFamily: 'HindSiliguri',
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    IconButton(
                                      onPressed: () => _deleteMethod(m),
                                      icon: Icon(
                                        LucideIcons.trash2,
                                        size: 16,
                                        color: isDark
                                            ? const Color(0xFF71717A)
                                            : const Color(0xFF94A3B8),
                                      ),
                                      padding: const EdgeInsets.all(6),
                                      constraints: const BoxConstraints(),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ))
                    : SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Provider select
                            Row(
                              children: ['bKash', 'Nagad'].map((prov) {
                                final isSel = _newType == prov;
                                return Expanded(
                                  child: GestureDetector(
                                    onTap: () => setState(() => _newType = prov),
                                    child: Container(
                                      margin: const EdgeInsets.symmetric(horizontal: 4),
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                      decoration: BoxDecoration(
                                        color: isSel
                                            ? const Color(0xFF059669)
                                            : (isDark
                                                ? const Color(0xFF1E1E22)
                                                : const Color(0xFFF1F5F9)),
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(
                                          color: isSel
                                              ? const Color(0xFF059669)
                                              : (isDark
                                                  ? const Color(0xFF27272A)
                                                  : const Color(0xFFE2E8F0)),
                                        ),
                                      ),
                                      child: Center(
                                        child: Text(
                                          prov,
                                          style: TextStyle(
                                            fontFamily: 'HindSiliguri',
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                            color: isSel
                                                ? Colors.white
                                                : (isDark
                                                    ? Colors.white
                                                    : const Color(0xFF0F172A)),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 12),

                            // Phone Number Input
                            TextField(
                              controller: _phoneController,
                              keyboardType: TextInputType.phone,
                              style: TextStyle(
                                color: isDark ? Colors.white : const Color(0xFF0F172A),
                                fontWeight: FontWeight.bold,
                                fontFamily: 'monospace',
                                fontSize: 15,
                              ),
                              decoration: InputDecoration(
                                hintText: '১১ ডিজিটের মোবাইল নম্বর দিন (01xxxxxxxxx)',
                                hintStyle: TextStyle(
                                  color: isDark
                                      ? const Color(0xFF71717A)
                                      : const Color(0xFF94A3B8),
                                  fontFamily: 'HindSiliguri',
                                  fontSize: 13,
                                ),
                                filled: true,
                                fillColor: isDark
                                    ? const Color(0xFF18181B)
                                    : const Color(0xFFF8FAFC),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                    color: isDark
                                        ? const Color(0xFF27272A)
                                        : const Color(0xFFE2E8F0),
                                  ),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                    color: isDark
                                        ? const Color(0xFF27272A)
                                        : const Color(0xFFE2E8F0),
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(
                                    color: Color(0xFF059669),
                                    width: 1.5,
                                  ),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 12,
                                ),
                              ),
                            ),
                            const SizedBox(height: 14),

                            // Save button
                            ElevatedButton(
                              onPressed: _isSaving ? null : _saveMethod,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF059669),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 0,
                              ),
                              child: _isSaving
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Text(
                                      'সংরক্ষণ ও ব্যবহার করুন',
                                      style: TextStyle(
                                        fontFamily: 'HindSiliguri',
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                          ],
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── FAQ Tile ─────────────────────────────────────────────────────────────────

class _FaqTile extends StatefulWidget {
  final String q;
  final String a;
  final bool isDark;

  const _FaqTile({required this.q, required this.a, required this.isDark});

  @override
  State<_FaqTile> createState() => _FaqTileState();
}

class _FaqTileState extends State<_FaqTile> {
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: widget.isDark
            ? const Color(0xFF18181B)
            : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: _open
              ? (widget.isDark ? const Color(0xFF059669) : const Color(0xFF10B981))
              : (widget.isDark
                  ? const Color(0xFF27272A)
                  : const Color(0xFFE2E8F0)),
          width: _open ? 1.2 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          GestureDetector(
            onTap: () => setState(() => _open = !_open),
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.q,
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: widget.isDark
                            ? Colors.white
                            : const Color(0xFF0F172A),
                      ),
                    ),
                  ),
                  Icon(
                    _open ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                    size: 18,
                    color: _open
                        ? const Color(0xFF059669)
                        : (widget.isDark
                            ? const Color(0xFFA1A1AA)
                            : const Color(0xFF64748B)),
                  ),
                ],
              ),
            ),
          ),
          if (_open) ...[
            Divider(
              height: 1,
              color: widget.isDark
                  ? const Color(0xFF27272A)
                  : const Color(0xFFF1F5F9),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
              child: Text(
                widget.a,
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 14,
                  color: widget.isDark
                      ? const Color(0xFFD4D4D8)
                      : const Color(0xFF334155),
                  height: 1.55,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
