import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../domain/models.dart';

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

  static const _merchantNumber = '01946855793';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('নম্বর কপি করা হয়েছে!'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _submit() async {
    final sender = _senderController.text.trim();
    final trxId = _trxController.text.trim().toUpperCase();

    final phoneRegex = RegExp(r'^01\d{9}$');
    if (!phoneRegex.hasMatch(sender)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'সঠিক মোবাইল নম্বর দিন (১১ ডিজিট, শুরু হতে হবে ০১ দিয়ে)',
          ),
        ),
      );
      return;
    }

    final trxRegex = RegExp(r'^[A-Z0-9]{5,20}$');
    if (!trxRegex.hasMatch(trxId)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('সঠিক ট্রানজেকশন আইডি দিন (৫–২০ অক্ষর)')),
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
          'payment_method': _selectedMethod,
          'transaction_id': trxId,
          'sender_number': sender,
          'status': 'Pending',
          'requested_at': DateTime.now().toIso8601String(),
        });
      }
      if (mounted) {
        Navigator.pop(context, true); // signal success to caller
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'পেমেন্ট তথ্য জমা নেওয়া হয়েছে। যাচাই করার পর ${widget.plan.name} প্ল্যান চালু হবে।',
            ),
            backgroundColor: const Color(0xFF059669),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('ত্রুটি হয়েছে। আবার চেষ্টা করুন।')),
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
          ? const Color(0xFF0A0A0A)
          : const Color(0xFFFAFAFA),
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ──────────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0A0A0A) : Colors.white,
                border: Border(
                  bottom: BorderSide(
                    color: isDark
                        ? const Color(0xFF262626)
                        : const Color(0xFFF5F5F5),
                  ),
                ),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF171717)
                            : const Color(0xFFF5F5F5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        LucideIcons.arrowLeft,
                        size: 20,
                        color: isDark ? Colors.white : const Color(0xFF171717),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'পেমেন্ট প্রসেসিং',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF171717),
                    ),
                  ),
                ],
              ),
            ),

            // ── Tab Bar ─────────────────────────────────────────────────
            Container(
              color: isDark ? const Color(0xFF0A0A0A) : Colors.white,
              child: TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(text: 'বিস্তারিত'),
                  Tab(text: 'সাপোর্ট'),
                  Tab(text: 'তথ্য'),
                ],
                labelColor: const Color(0xFF059669),
                unselectedLabelColor: const Color(0xFFA3A3A3),
                indicatorColor: const Color(0xFF059669),
                indicatorWeight: 2,
                labelStyle: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
                unselectedLabelStyle: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),

            // ── Tab Views ───────────────────────────────────────────────
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
                      ? const Color(0xFF262626)
                      : const Color(0xFFF5F5F5),
                  valueColor: isDark ? Colors.white : const Color(0xFF171717),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _summaryCard(
                  isDark,
                  label: 'পরিশোধ করতে হবে',
                  value: '৳ ${widget.plan.price}.00',
                  bgColor: isDark
                      ? const Color(0xFF3F1515)
                      : const Color(0xFFFFF1F2),
                  valueColor: const Color(0xFFE11D48),
                  labelColor: const Color(0xFFE11D48),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Merchant number instruction card
          Container(
            decoration: BoxDecoration(
              color: isDark ? Colors.black : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark
                    ? const Color(0xFF14532D)
                    : const Color(0xFFBBF7D0),
                width: 2,
              ),
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'অনুগ্রহ করে নিচের নির্দেশনা অনুসরণ করো',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isDark
                        ? const Color(0xFFD4D4D4)
                        : const Color(0xFF404040),
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
                          ? const Color(0xFF262626)
                          : const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'bKash/Nagad (Send Money)',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark
                                      ? const Color(0xFFA3A3A3)
                                      : const Color(0xFF737373),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _merchantNumber,
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 2,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF171717),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          LucideIcons.copy,
                          size: 18,
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
                  'Reference হিসেবে আপনার মোবাইল নম্বর দাও।',
                  'নিচের ফর্মে পেমেন্ট মেথড, মোবাইল নম্বর ও TrxID দাও।',
                ].map(
                  (step) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          margin: const EdgeInsets.only(top: 5, right: 8),
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
                              fontSize: 12,
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF737373),
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

          // Payment method selector
          Text(
            'পেমেন্ট পদ্ধতি',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF404040),
            ),
          ),
          const SizedBox(height: 8),
          _MethodSelector(
            selected: _selectedMethod,
            isDark: isDark,
            onChanged: (m) => setState(() => _selectedMethod = m),
          ),
          const SizedBox(height: 16),

          // Sender number
          Text(
            'আপনার মোবাইল নম্বর',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF404040),
            ),
          ),
          const SizedBox(height: 6),
          _inputField(
            controller: _senderController,
            hint: 'যেমন: 01xxxxxxxxx',
            keyboardType: TextInputType.phone,
            isDark: isDark,
          ),
          const SizedBox(height: 16),

          // TrxID
          Text(
            'ট্রানজেকশন আইডি (TrxID)',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF404040),
            ),
          ),
          const SizedBox(height: 6),
          _inputField(
            controller: _trxController,
            hint: 'TrxID লিখুন',
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
                elevation: 0,
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'পেমেন্ট নিশ্চিত করুন',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  // ── Support Tab ─────────────────────────────────────────────────────────

  Widget _buildSupportTab(bool isDark) {
    final items = [
      ('📞', 'সরাসরি কথা বলুন', 'কল করতে ক্লিক করো', 'tel:+8801946855793'),
      (
        '💬',
        'লাইভ চ্যাট (Messenger)',
        'এখানে ক্লিক করো',
        'https://m.me/obhyash',
      ),
      (
        '📱',
        'লাইভ চ্যাট (WhatsApp)',
        'এখানে ক্লিক করো',
        'https://wa.me/8801946855793',
      ),
      ('✉️', 'সাপোর্টে ইমেইল', 'এখানে ক্লিক করো', 'mailto:support@obhyash.com'),
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
                    color: isDark ? const Color(0xFF171717) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF262626)
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
                              ? const Color(0xFF262626)
                              : const Color(0xFFF0FDF4),
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
                                fontSize: 14,
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF171717),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              item.$3,
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFFA3A3A3),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        LucideIcons.chevronRight,
                        size: 18,
                        color: isDark
                            ? const Color(0xFF525252)
                            : const Color(0xFFD4D4D4),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => _tabController.animateTo(0),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: const Text(
                'পেমেন্টে যান',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
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
        a: '১. আপনার বিকাশ/নগদ অ্যাপে যাও। ২. সেন্ড মানি অপশনে যাও। ৩. আমাদের নম্বর দাও। ৪. রেফারেন্সে আপনার নম্বর দাও। ৫. পেমেন্ট শেষে TrxID ফর্মে জমা দাও।',
      ),
      (
        q: 'পেমেন্ট করার কতক্ষণ পর একাউন্ট আপগ্রেড হবে?',
        a: 'আমাদের টিম আপনার তথ্য যাচাই করে ৩০ মিনিট থেকে ২ ঘন্টার মধ্যে আপনার একাউন্ট আপগ্রেড করে দিবে।',
      ),
      (
        q: 'ট্রানজেকশন আইডি (TrxID) খুঁজে না পেলে কী করব?',
        a: 'আপনার পেমেন্ট অ্যাপের স্টেটমেন্ট অথবা মেসেজ অপশন চেক করো। তবুও না পেলে আমাদের সাপোর্টে যোগাযোগ করো।',
      ),
      (
        q: 'ভুল নম্বরে টাকা পাঠালে কী হবে?',
        a: 'ভুল নম্বরে টাকা পাঠালে আমরা দায়ী থাকবো না। দয়া করে নম্বরটি দুইবার যাচাই করো।',
      ),
      (
        q: 'প্রিমিয়াম প্যাকেজে কী কী থাকছে?',
        a: 'আনলিমিটেড এক্সাম, OMR চেকিং, এবং বিস্তারিত এনালাইসিস রিপোর্ট।',
      ),
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: faqs
            .map(
              (faq) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _FaqTile(q: faq.q, a: faq.a, isDark: isDark),
              ),
            )
            .toList(),
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
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
              color:
                  labelColor ??
                  (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373)),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: valueColor,
            ),
            maxLines: 2,
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
        color: isDark ? Colors.white : const Color(0xFF171717),
        fontWeight: FontWeight.w500,
      ),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(
          color: isDark ? const Color(0xFF525252) : const Color(0xFFA3A3A3),
        ),
        filled: true,
        fillColor: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
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

// ── Method Selector ─────────────────────────────────────────────────────────

class _MethodSelector extends StatelessWidget {
  final String selected;
  final bool isDark;
  final ValueChanged<String> onChanged;

  const _MethodSelector({
    required this.selected,
    required this.isDark,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: ['bKash', 'Nagad', 'Rocket'].asMap().entries.map((entry) {
        final method = entry.value;
        final isLast = entry.key == 2;
        final isSelected = selected == method;

        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: isLast ? 0 : 8),
            child: GestureDetector(
              onTap: () => onChanged(method),
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
                    method,
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
            ? const Color(0xFF171717)
            : const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: widget.isDark
              ? const Color(0xFF262626)
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
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.q,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: widget.isDark
                            ? Colors.white
                            : const Color(0xFF171717),
                      ),
                    ),
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
                  ? const Color(0xFF262626)
                  : const Color(0xFFE5E5E5),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
              child: Text(
                widget.a,
                style: const TextStyle(
                  fontSize: 12,
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
