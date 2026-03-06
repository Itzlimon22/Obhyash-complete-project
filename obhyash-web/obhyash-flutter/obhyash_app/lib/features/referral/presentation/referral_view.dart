import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

class ReferralView extends StatefulWidget {
  const ReferralView({super.key});

  @override
  State<ReferralView> createState() => _ReferralViewState();
}

class _ReferralViewState extends State<ReferralView> {
  String? _code;
  bool _isLoading = true;
  bool _isCopied = false;
  List<Map<String, dynamic>> _history = [];

  @override
  void initState() {
    super.initState();
    _loadReferral();
  }

  Future<void> _loadReferral() async {
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) {
        setState(() => _isLoading = false);
        return;
      }

      // Try fetching existing code
      final existing = await sb
          .from('referrals')
          .select('id, code')
          .eq('owner_id', uid)
          .maybeSingle();

      String code;
      String referralId;

      if (existing == null) {
        // Auto-create code
        final chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        final rand = List.generate(8, (i) {
          return chars[(DateTime.now().millisecondsSinceEpoch + i * 7) %
              chars.length];
        });
        code = rand.join();

        final created = await sb
            .from('referrals')
            .insert({'owner_id': uid, 'code': code})
            .select('id, code')
            .single();
        referralId = created['id'] as String;
        code = created['code'] as String;
      } else {
        code = existing['code'] as String;
        referralId = existing['id'] as String;
      }

      // Fetch redemption history
      final history = await sb
          .from('referral_history')
          .select('redeemed_at, admin_status, redeemed_by')
          .eq('referral_id', referralId)
          .order('redeemed_at', ascending: false)
          .limit(20);

      // Fetch names for redeemed_by users
      final historyList = (history as List).cast<Map<String, dynamic>>();
      final userIds = historyList
          .map((h) => h['redeemed_by'] as String?)
          .where((id) => id != null)
          .toSet()
          .toList();

      Map<String, String> nameMap = {};
      if (userIds.isNotEmpty) {
        final profiles = await sb
            .from('public_profiles')
            .select('id, name')
            .inFilter('id', userIds);
        for (final p in (profiles as List)) {
          nameMap[p['id'] as String] = p['name'] as String? ?? 'ব্যবহারকারী';
        }
      }

      final enriched = historyList.map((h) {
        final userId = h['redeemed_by'] as String?;
        return {
          ...h,
          'name': userId != null
              ? (nameMap[userId] ?? 'ব্যবহারকারী')
              : 'ব্যবহারকারী',
        };
      }).toList();

      if (mounted) {
        setState(() {
          _code = code;
          _history = enriched;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _copyCode() async {
    if (_code == null) return;
    await Clipboard.setData(ClipboardData(text: _code!));
    setState(() => _isCopied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _isCopied = false);
    });
  }

  void _shareCode() async {
    if (_code == null) return;
    final text =
        'অভ্যাস অ্যাপে আমার রেফারেল কোড ব্যবহার করে দুজনেই পাও ১ মাসের ফ্রি প্রিমিয়াম! 🎉\n\nকোড: $_code\n\nএখানে রেজিস্টার করো: https://obhyash.com/signup';
    final encoded = Uri.encodeComponent(text);
    final whatsappUrl = Uri.parse('https://wa.me/?text=$encoded');
    if (await canLaunchUrl(whatsappUrl)) {
      await launchUrl(whatsappUrl, mode: LaunchMode.externalApplication);
    } else {
      // Fallback: copy to clipboard
      await Clipboard.setData(ClipboardData(text: text));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('শেয়ার লিংক ক্লিপবোর্ডে কপি হয়েছে')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAF9);
    final card = isDark ? const Color(0xFF171717) : Colors.white;
    final border = isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5);
    final textPrimary = isDark ? Colors.white : const Color(0xFF171717);
    final textSecondary = isDark
        ? const Color(0xFFA3A3A3)
        : const Color(0xFF737373);

    return Container(
      color: bg,
      child: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ── Hero Banner ──────────────────────────────────────────
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(
                            0xFFE11D48,
                          ).withValues(alpha: 0.25),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(
                                LucideIcons.gift,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'রেফারেল প্রোগ্রাম',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        const Text(
                          'বন্ধুদের আমন্ত্রণ জানাও,\nদুজনেই পাও প্রিমিয়াম!',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'HindSiliguri',
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'তোমার কোড দিয়ে কোনো বন্ধু যুক্ত হলে তুমি ও তোমার বন্ধু—দুজনেই পেয়ে যাবে ১ মাসের ফ্রি প্রিমিয়াম।',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.85),
                            fontSize: 13,
                            fontFamily: 'HindSiliguri',
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── Referral Code Card ───────────────────────────────────
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: card,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: border),
                      boxShadow: isDark
                          ? []
                          : [
                              const BoxShadow(
                                color: Color(0x06000000),
                                blurRadius: 4,
                                offset: Offset(0, 2),
                              ),
                            ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'তোমার রেফারেল কোড',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: textSecondary,
                            letterSpacing: 0.5,
                            fontFamily: 'HindSiliguri',
                          ),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF262626)
                                : const Color(0xFFFAFAF9),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF404040)
                                  : const Color(0xFFE5E5E5),
                              width: 1.5,
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  _code ?? '— — — — — — — —',
                                  style: TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 4,
                                    color: textPrimary,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ),
                              GestureDetector(
                                onTap: _copyCode,
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 7,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _isCopied
                                        ? const Color(0xFF047857)
                                        : (isDark
                                              ? const Color(0xFF404040)
                                              : const Color(0xFFE5E5E5)),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        _isCopied
                                            ? Icons.check_rounded
                                            : LucideIcons.copy,
                                        size: 14,
                                        color: _isCopied
                                            ? Colors.white
                                            : textSecondary,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        _isCopied ? 'কপি হয়েছে' : 'কপি করো',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          fontFamily: 'HindSiliguri',
                                          color: _isCopied
                                              ? Colors.white
                                              : textSecondary,
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
                        // Share Button
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: _shareCode,
                            icon: const Icon(LucideIcons.share2, size: 16),
                            label: const Text(
                              'বন্ধুদের সাথে শেয়ার করো',
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFE11D48),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 13),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 0,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── Benefits ─────────────────────────────────────────────
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: card,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.auto_awesome_rounded,
                              color: Color(0xFFF59E0B),
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'রেফারেল প্রোগ্রামের সুবিধা',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                                color: textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        ...[
                          (
                            '১',
                            '১ মাস ফ্রি প্রিমিয়াম',
                            'তোমার রেফার করা প্রতিটি সফল সাইনআপের জন্য ১ মাসের প্রিমিয়াম সম্পূর্ণ ফ্রি।',
                          ),
                          (
                            '২',
                            'তোমার বন্ধুর জন্যও উপহার',
                            'তোমার লিংকের মাধ্যমে যে যুক্ত হবে, সে নিজেও পাবে দারুণ পুরস্কার।',
                          ),
                          (
                            '৩',
                            'আনলিমিটেড রেফারেল',
                            'যত বেশি বন্ধুকে ইনভাইট করবে, তত বেশি মাসের প্রিমিয়াম অর্জন করবে।',
                          ),
                        ].map(
                          (item) => Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF262626)
                                  : const Color(0xFFFAFAF9),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isDark
                                    ? const Color(0xFF404040)
                                    : const Color(0xFFF5F5F5),
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 28,
                                  height: 28,
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? const Color(
                                            0xFF7F1D1D,
                                          ).withValues(alpha: 0.4)
                                        : const Color(0xFFFFF1F2),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      item.$1,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFFE11D48),
                                        fontFamily: 'HindSiliguri',
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.$2,
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                          fontFamily: 'HindSiliguri',
                                          color: textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        item.$3,
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontFamily: 'HindSiliguri',
                                          color: textSecondary,
                                          height: 1.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── How It Works ─────────────────────────────────────────
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: card,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'কীভাবে শুরু করবে?',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1,
                            fontFamily: 'HindSiliguri',
                            color: textSecondary,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _StepBubble(
                              icon: '🔗',
                              title: 'কোড কপি করো',
                              desc: 'ওপরের কোডটি কপি করো।',
                              isDark: isDark,
                              textPrimary: textPrimary,
                              textSecondary: textSecondary,
                            ),
                            _Arrow(isDark: isDark),
                            _StepBubble(
                              icon: '📤',
                              title: 'শেয়ার করো',
                              desc: 'বন্ধুদের পাঠাও।',
                              isDark: isDark,
                              textPrimary: textPrimary,
                              textSecondary: textSecondary,
                            ),
                            _Arrow(isDark: isDark),
                            _StepBubble(
                              icon: '🎉',
                              title: 'পুরস্কার পাও',
                              desc: 'দুজনেই প্রিমিয়াম পাবে।',
                              isDark: isDark,
                              textPrimary: textPrimary,
                              textSecondary: textSecondary,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // ── Referral History ─────────────────────────────────────
                  if (_history.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: card,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                LucideIcons.users,
                                size: 16,
                                color: textSecondary,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'রেফারেল ইতিহাস (${_history.length} জন)',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'HindSiliguri',
                                  color: textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ..._history.map((h) {
                            final name = h['name'] as String? ?? 'ব্যবহারকারী';
                            final status =
                                h['admin_status'] as String? ?? 'Pending';
                            final date = h['redeemed_at'] as String?;
                            final dateStr = date != null
                                ? _formatDate(date)
                                : '';
                            final statusColor = status == 'Approved'
                                ? const Color(0xFF047857)
                                : status == 'Rejected'
                                ? const Color(0xFFDC2626)
                                : const Color(0xFFF59E0B);
                            final statusLabel = status == 'Approved'
                                ? 'অনুমোদিত'
                                : status == 'Rejected'
                                ? 'বাতিল'
                                : 'অপেক্ষমান';

                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 10,
                              ),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0xFF262626)
                                    : const Color(0xFFFAFAF9),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isDark
                                      ? const Color(0xFF404040)
                                      : const Color(0xFFF5F5F5),
                                ),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundColor: const Color(
                                      0xFFE11D48,
                                    ).withValues(alpha: 0.15),
                                    child: Text(
                                      name.isNotEmpty
                                          ? name[0].toUpperCase()
                                          : 'U',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFFE11D48),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          name,
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            fontFamily: 'HindSiliguri',
                                            color: textPrimary,
                                          ),
                                        ),
                                        if (dateStr.isNotEmpty)
                                          Text(
                                            dateStr,
                                            style: TextStyle(
                                              fontSize: 11,
                                              color: textSecondary,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 3,
                                    ),
                                    decoration: BoxDecoration(
                                      color: statusColor.withValues(
                                        alpha: 0.12,
                                      ),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: statusColor.withValues(
                                          alpha: 0.3,
                                        ),
                                      ),
                                    ),
                                    child: Text(
                                      statusLabel,
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        fontFamily: 'HindSiliguri',
                                        color: statusColor,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '';
    }
  }
}

// ── Helper Widgets ─────────────────────────────────────────────────────────────

class _StepBubble extends StatelessWidget {
  final String icon, title, desc;
  final bool isDark;
  final Color textPrimary, textSecondary;

  const _StepBubble({
    required this.icon,
    required this.title,
    required this.desc,
    required this.isDark,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
              shape: BoxShape.circle,
              border: Border.all(
                color: isDark
                    ? const Color(0xFF404040)
                    : const Color(0xFFE5E5E5),
                width: 2,
              ),
            ),
            child: Center(
              child: Text(icon, style: const TextStyle(fontSize: 20)),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              fontFamily: 'HindSiliguri',
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            desc,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 10,
              fontFamily: 'HindSiliguri',
              color: textSecondary,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _Arrow extends StatelessWidget {
  final bool isDark;
  const _Arrow({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 36),
      child: Icon(
        Icons.arrow_forward_rounded,
        size: 16,
        color: isDark ? const Color(0xFF404040) : const Color(0xFFD4D4D4),
      ),
    );
  }
}
