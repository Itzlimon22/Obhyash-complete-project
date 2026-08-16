import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/presentation/widgets/app_dropdown.dart';

import 'package:url_launcher/url_launcher.dart';

import '../domain/models.dart';
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

  const PaymentView({super.key, required this.plan});

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

  static const _merchantNumber = '01946855793';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchSavedMethods();
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
      AppPopups.show(context, message: 'নম্বর কপি করা হয়েছে!', isError: false);
    }
  }

  Future<void> _submit() async {
    final sender = _senderController.text.trim();
    final trxId = _trxController.text.trim().toUpperCase();

    final phoneRegex = RegExp(r'^01\d{9}$');
    if (!phoneRegex.hasMatch(sender)) {
      AppPopups.show(
        context,
        message: 'সঠিক মোবাইল নম্বর দাও (১১ ডিজিট, শুরু হতে হবে ০১ দিয়ে)',
        isError: true,
      );
      return;
    }

    final trxRegex = RegExp(r'^[A-Z0-9]{5,20}$');
    if (!trxRegex.hasMatch(trxId)) {
      AppPopups.show(
        context,
        message: 'সঠিক ট্রানজেকশন আইডি দাও',
        isError: true,
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;
      if (userId != null) {
        await supabase.from('payment_requests').insert({
          'user_id': userId,
          'plan_name': widget.plan.name,
          'amount': widget.plan.price,
          'currency': 'BDT',
          'payment_method': '$_selectedMethod ($sender)',
          'transaction_id': trxId,
          'status': 'Pending',
          'requested_at': DateTime.now().toIso8601String(),
        });
      }

      // Simulate validation delay for UI effect like web
      await Future.delayed(const Duration(milliseconds: 1500));

      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _showSuccess = true;
        });

        AppPopups.show(
          context,
          message:
              'পেমেন্ট তথ্য জমা নেওয়া হয়েছে। যাচাই করার পর ${widget.plan.name} প্ল্যান চালু হবে।',
          isError: false,
        );

        // Auto pop after a delay
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) Navigator.pop(context, true);
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        AppPopups.show(
          context,
          message: 'ত্রুটি হয়েছে। আবার চেষ্টা করো।',
          isError: true,
        );
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
      padding: const EdgeInsets.all(20),
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
                  value: widget.plan.name,
                  bgColor: isDark
                      ? const Color(0xFF1C1C1E)
                      : const Color(0xFFF5F5F5),
                  valueColor: isDark ? Colors.white : const Color(0xFF000000),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _summaryCard(
                  isDark,
                  label: 'পরিশোধ করতে হবে',
                  value: '৳ ${widget.plan.price}.00',
                  bgColor: isDark
                      ? const Color(0xFF3F1515) // red-900/20 approx
                      : const Color(0xFFFEF2F2), // red-50
                  borderColor: isDark
                      ? const Color(0xFF7F1D1D).withValues(alpha: 0.3)
                      : const Color(0xFFFEE2E2),
                  valueColor: isDark
                      ? const Color(0xFFF87171)
                      : const Color(0xFFB91C1C), // red-400 : red-600
                  labelColor: isDark
                      ? const Color(0xFFF87171)
                      : const Color(0xFFB91C1C),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Merchant number instruction card
          Container(
            decoration: BoxDecoration(
              color: isDark ? Colors.black : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark
                    ? const Color(0xFF059669)
                    : const Color(0xFFA7F3D0), // emerald-200
                width: 2,
              ),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'অনুগ্রহ করে নিচের নির্দেশনা অনুসরণ করো',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDark
                        ? const Color(0xFFD4D4D4)
                        : const Color(0xFF27272A),
                  ),
                ),
                const SizedBox(height: 12),

                // Copyable merchant number
                GestureDetector(
                  onTap: _copyNumber,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF1C1C1E)
                          : const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'bKash/Nagad (Send Money)',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF737373),
                            ),
                           maxLines: 1, overflow: TextOverflow.ellipsis),
                        ),
                        Text(
                          '01946855793', // Web uses 01234567890 in display but let's put real one
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2,
                            fontFamily: 'monospace',
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF000000),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Icon(
                          LucideIcons.copy,
                          size: 16,
                          color: isDark
                              ? const Color(0xFFA3A3A3)
                              : const Color(0xFF737373),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Step instructions
                ...[
                  'উপরের নম্বরে Send Money করো।',
                  'Reference হিসেবে তোমার মোবাইল নম্বর দাও।',
                  'নিচের ফর্মে তোমার পেমেন্ট মেথড, মোবাইল নম্বর এবং TrxID দাও।',
                ].map(
                  (step) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          margin: const EdgeInsets.only(
                            top: 6,
                            right: 8,
                            left: 4,
                          ),
                          width: 4,
                          height: 4,
                          decoration: const BoxDecoration(
                            color: Color(0xFFA3A3A3),
                            shape: BoxShape.circle,
                          ),
                        ),
                        Expanded(
                          child: Text(
                            step,
                            style: TextStyle(
                              fontSize: 15,
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF737373),
                            ),
                           maxLines: 1, overflow: TextOverflow.ellipsis),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Saved Payment Methods
          if (_savedMethods.isNotEmpty) ...[
            Text(
              'SAVED PAYMENT METHODS',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
                color: isDark
                    ? const Color(0xFF737373)
                    : const Color(0xFFA3A3A3),
              ),
            ),
            const SizedBox(height: 8),
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
                                ? const Color(0xFF059669).withValues(alpha: 0.2)
                                : const Color(0xFFECFDF5))
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFF059669)
                            : (isDark
                                  ? const Color(0xFF1C1C1E)
                                  : const Color(0xFFE5E5E5)),
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: method.type.toLowerCase() == 'bkash'
                                ? const Color(0xFFB91C1C)
                                : method.type.toLowerCase() == 'nagad'
                                ? const Color(0xFFB91C1C)
                                : const Color(0xFF737373),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(
                              method.type.toLowerCase() == 'bkash'
                                  ? 'bK'
                                  : method.type.toLowerCase() == 'nagad'
                                  ? 'N'
                                  : 'C',
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
                                method.type,
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF000000),
                                ),
                              ),
                              Text(
                                method.number,
                                style: TextStyle(
                                  fontSize: 15,
                                  fontFamily: 'monospace',
                                  color: isDark
                                      ? const Color(0xFFA3A3A3)
                                      : const Color(0xFF737373),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
            const SizedBox(height: 16),
          ],

          // Payment method selector
          Text(
            'Payment Method',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF27272A),
            ),
          ),
          const SizedBox(height: 8),
          AppDropdown<String>(
            value: _selectedMethod,
            options: ['bKash', 'Nagad', 'Rocket']
                .map((m) => AppDropdownOption(value: m, label: m))
                .toList(),
            onChanged: (val) {
              if (val != null) setState(() => _selectedMethod = val);
            },
          ),
          const SizedBox(height: 16),

          // Sender number
          Text(
            'Your Mobile Number',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF27272A),
            ),
          ),
          const SizedBox(height: 6),
          _inputField(
            controller: _senderController,
            hint: 'e.g., 01xxxxxxxxx',
            keyboardType: TextInputType.phone,
            isDark: isDark,
          ),
          const SizedBox(height: 16),

          // TrxID
          Text(
            'Transaction ID (TrxID)',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF27272A),
            ),
          ),
          const SizedBox(height: 6),
          _inputField(
            controller: _trxController,
            hint: 'Enter the TrxID',
            isDark: isDark,
            textCapitalization: TextCapitalization.characters,
          ),
          const SizedBox(height: 24),

          // Submit button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                disabledBackgroundColor: const Color(
                  0xFF059669,
                ).withValues(alpha: 0.5),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 4,
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
                  : const Text(
                      'Verify Payment',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
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
        'tel:+8801946855793',
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
        'https://wa.me/8801946855793',
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
                                fontWeight: FontWeight.bold,
                                fontSize: 17,
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF000000),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              item.$3,
                              style: const TextStyle(
                                fontSize: 15,
                                color: Color(0xFFA3A3A3),
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
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: const Text(
                'Go to Payment',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
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
        q: 'কিভাবে পেমেন্ট করবেন?',
        a: '১. তোমার বিকাশ/নগদ অ্যাপে যাও। ২. সেন্ড মানি অপশনে যাও। ৩. আমাদের নম্বর দাও। ৪. রেফারেন্সে তোমার নম্বর দাও। ৫. পেমেন্ট শেষে TrxID ফর্মে জমা দাও।',
      ),
      (
        q: 'পেমেন্ট করার কতক্ষণ পর একাউন্ট আপগ্রেড হবে?',
        a: 'আমাদের টিম তোমার তথ্য যাচাই করে ৩০ মিনিট থেকে ২ ঘন্টার মধ্যে তোমার একাউন্ট আপগ্রেড করে দিবে।',
      ),
      (
        q: 'ট্রানজেকশন আইডি (TrxID) খুঁজে না পেলে কী করব?',
        a: 'তোমার পেমেন্ট অ্যাপের স্টেটমেন্ট অথবা মেসেজ অপশন চেক করো। তবুও না পেলে আমাদের সাপোর্টে যোগাযোগ করো।',
      ),
      (
        q: 'ভুল নম্বরে টাকা পাঠালে কী হবে?',
        a: 'ভুল নম্বরে টাকা পাঠালে আমরা দায়ী থাকবো না। দয়া করে নম্বরটি দুইবার যাচাই করো।',
      ),
      (
        q: 'প্রিমিয়াম প্যাকেজে কী কী থাকছে?',
        a: 'আনলিমিটেড এক্সাম, AI বিস্তারিত ব্যাখ্যা, এবং পারফরম্যান্স এনালাইসিস রিপোর্ট।',
      ),
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          ...faqs.map(
            (faq) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _FaqTile(q: faq.q, a: faq.a, isDark: isDark),
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
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: const Text(
                'Go to Payment',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
              ),
            ),
          ),
        ],
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
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: borderColor != null
            ? Border.all(color: borderColor)
            : Border.all(
                color: isDark
                    ? const Color(0xFF1C1C1E)
                    : const Color(0xFFE5E5E5),
              ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
              color:
                  labelColor ??
                  (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373)),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: valueColor,
            ),
            maxLines: 2,
            textAlign: TextAlign.center,
            overflow: TextOverflow.ellipsis,
          ),
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
        color: isDark ? Colors.white : const Color(0xFF000000),
        fontWeight: FontWeight.w600,
        fontFamily: 'monospace',
      ),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(
          color: isDark ? const Color(0xFF525252) : const Color(0xFFA3A3A3),
          fontFamily: 'sans-serif',
          fontWeight: FontWeight.normal,
        ),
        filled: true,
        fillColor: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5),
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
            ? const Color(0xFF1C1C1E)
            : const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: widget.isDark
              ? const Color(0xFF27272A)
              : const Color(0xFFE5E5E5),
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
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: widget.isDark
                            ? Colors.white
                            : const Color(0xFF000000),
                      ),
                     maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                  Icon(
                    _open ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                    size: 18,
                    color: const Color(0xFFA3A3A3),
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
                  : const Color(0xFFE5E5E5),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: Text(
                widget.a,
                style: const TextStyle(
                  fontSize: 15,
                  color: Color(0xFFA3A3A3),
                  height: 1.6,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
