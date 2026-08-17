import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/providers/auth_provider.dart';
import 'package:obhyash_app/core/utils/app_popups.dart';
import 'widgets/scratch_card_dialog.dart';

class ReferralView extends ConsumerStatefulWidget {
  const ReferralView({super.key});

  @override
  ConsumerState<ReferralView> createState() => _ReferralViewState();
}

class _ReferralViewState extends ConsumerState<ReferralView> {
  String? _code;
  bool _isLoading = true;
  bool _isCopied = false;
  List<Map<String, dynamic>> _history = [];
  List<Map<String, dynamic>> _scratchCards = [];
  List<Map<String, dynamic>> _leaderboard = [];
  int _totalReferrals = 0;

  // Referral Claim & Anti-Brute-Force Lockout State
  final TextEditingController _claimCodeController = TextEditingController();
  bool _isClaiming = false;
  bool _hasUsedReferral = true;
  Timer? _lockoutTimer;
  int _lockoutSeconds = 0;
  int _remainingAttempts = 3;

  @override
  void initState() {
    super.initState();
    _loadReferral();
  }

  @override
  void dispose() {
    _lockoutTimer?.cancel();
    _claimCodeController.dispose();
    super.dispose();
  }

  void _startLockoutTimer(int seconds) {
    _lockoutTimer?.cancel();
    setState(() => _lockoutSeconds = seconds);
    _lockoutTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_lockoutSeconds <= 1) {
        timer.cancel();
        setState(() {
          _lockoutSeconds = 0;
          _remainingAttempts = 3;
        });
      } else {
        setState(() => _lockoutSeconds--);
      }
    });
  }

  Future<void> _loadReferral() async {
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) {
        setState(() => _isLoading = false);
        return;
      }

      // Check if user already used a referral code
      final usedCheck = await sb
          .from('referral_history')
          .select('id')
          .eq('redeemed_by', uid)
          .maybeSingle();

      // Check existing lockout or attempt logs
      try {
        final log = await sb
            .from('referral_attempt_logs')
            .select('failed_attempts, locked_until')
            .eq('user_id', uid)
            .maybeSingle();

        if (log != null) {
          final lockedUntilStr = log['locked_until']?.toString();
          if (lockedUntilStr != null) {
            final lockedUntil = DateTime.tryParse(lockedUntilStr);
            if (lockedUntil != null && lockedUntil.isAfter(DateTime.now())) {
              final diff = lockedUntil.difference(DateTime.now()).inSeconds;
              _startLockoutTimer(diff);
            }
          }
          final failed = (log['failed_attempts'] as num?)?.toInt() ?? 0;
          _remainingAttempts = (3 - failed).clamp(1, 3);
        }
      } catch (_) {}

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

      // Fetch scratch cards
      final cards = await sb
          .from('scratch_cards')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', ascending: false);

      // Get exact count of successful referrals
      final countRes = await sb
          .from('referral_history')
          .select('id')
          .eq('referral_id', referralId)
          .eq('admin_status', 'Approved')
          .count(CountOption.exact);

      // Get leaderboard
      final leaderboardRes = await sb.rpc('get_monthly_leaderboard');

      if (mounted) {
        setState(() {
          _code = code;
          _history = enriched;
          _hasUsedReferral = usedCheck != null;
          _scratchCards = (cards as List).cast<Map<String, dynamic>>();
          _leaderboard = (leaderboardRes as List).cast<Map<String, dynamic>>();
          _totalReferrals = countRes.count;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleClaimReferral() async {
    final input = _claimCodeController.text.trim().toUpperCase();
    if (input.isEmpty) {
      AppPopups.warning(context, message: 'রেফারেল কোডটি লিখুন');
      return;
    }

    if (_lockoutSeconds > 0) {
      final min = _lockoutSeconds ~/ 60;
      final sec = _lockoutSeconds % 60;
      AppPopups.warning(
        context,
        message: 'ভুল কোড দেওয়ার কারণে ইনপুট সাময়িকভাবে লক আছে। আর $min মিনিট $sec সেকেন্ড অপেক্ষা করুন।',
      );
      return;
    }

    setState(() => _isClaiming = true);
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) throw Exception('User not logged in');

      final res = await sb.rpc('redeem_referral_by_code', params: {
        'p_code': input,
        'p_user_id': uid,
      });

      if (mounted) {
        HapticFeedback.mediumImpact();
        _claimCodeController.clear();
        setState(() {
          _hasUsedReferral = true;
          _isClaiming = false;
          _remainingAttempts = 3;
        });
        AppPopups.success(
          context,
          message: (res != null && res['message'] != null)
              ? res['message'].toString()
              : 'রেফারেল কোড সফলভাবে ক্লেইম করা হয়েছে! 🎉',
        );
        _loadReferral();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isClaiming = false);
        final err = e.toString();
        if (err.contains('১০ মিনিট') || err.contains('লক')) {
          _startLockoutTimer(600); // 10 mins lockout
          AppPopups.error(
            context,
            message: 'পর পর ৩ বার ভুল কোড দেওয়া হয়েছে! আগামী ১০ মিনিটের জন্য রেফারেল ক্লেইম লক করা হলো।',
          );
        } else if (err.contains('চেষ্টা করা যাবে')) {
          final match = RegExp(r'আর (\d+) বার').firstMatch(err);
          if (match != null) {
            setState(() => _remainingAttempts = int.tryParse(match.group(1)!) ?? 1);
          }
          AppPopups.warning(context, message: err.replaceAll('Exception:', '').trim());
        } else {
          AppPopups.warning(context, message: err.replaceAll('Exception:', '').trim());
        }
      }
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
        'অভ্যাস অ্যাপে আমার রেফারেল কোড ব্যবহার করে ফ্রি তে পাও ১ মাসের প্রিমিয়াম সাবস্ক্রিপশন! 🎉\n\nকোড: $_code\n\nএখানে রেজিস্টার করো: https://obhyash.com/signup?ref=$_code';
    final encoded = Uri.encodeComponent(text);
    final whatsappUrl = Uri.parse('https://wa.me/?text=$encoded');
    if (await canLaunchUrl(whatsappUrl)) {
      await launchUrl(whatsappUrl, mode: LaunchMode.externalApplication);
    } else {
      // Fallback: copy to clipboard
      await Clipboard.setData(ClipboardData(text: text));
      if (mounted) {
        AppPopups.show(
          context,
          message: 'শেয়ার লিংক ক্লিপবোর্ডে কপি হয়েছে',
          isError: false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    // Retry when auth becomes available after cold-start session restore
    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _loadReferral();
    });
    final bg = isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAF9);
    final card = isDark ? const Color(0xFF000000) : Colors.white;
    final border = isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5);
    final textPrimary = isDark ? Colors.white : const Color(0xFF000000);
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
                        colors: [Color(0xFFB91C1C), Color(0xFFBE123C)],
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(
                            0xFFB91C1C,
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
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Anek Bangla',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        const Text(
                          'বন্ধুদের আমন্ত্রণ জানাও,\nপ্রতি ৩ রেফারে পাও একটি স্ক্র্যাচ কার্ড!',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Anek Bangla',
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'তোমার কোড দিয়ে কোনো বন্ধু যুক্ত হলে সে পাবে ১ মাসের ফ্রি প্রিমিয়াম, আর তুমি প্রতি ৩ জন বন্ধুর জন্য পাবে একটি দারুণ স্ক্র্যাচ কার্ড!',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 16,
                            fontFamily: 'Anek Bangla',
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── Claim Friend's Referral Code Card (If not used yet) ──
                  if (!_hasUsedReferral) ...[
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: card,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF059669).withValues(alpha: 0.3)
                              : const Color(0xFFA7F3D0),
                        ),
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
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(7),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0xFF064E3B).withValues(alpha: 0.4)
                                      : const Color(0xFFECFDF5),
                                  borderRadius: BorderRadius.circular(9),
                                ),
                                child: const Icon(
                                  LucideIcons.gift,
                                  size: 16,
                                  color: Color(0xFF059669),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'বন্ধুর রেফারেল কোড ক্লেইম করো',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: textPrimary,
                                        fontFamily: 'HindSiliguri',
                                      ),
                                    ),
                                    Text(
                                      '১ মাসের ফ্রি প্রিমিয়াম উপভোগ করো',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: textSecondary,
                                        fontFamily: 'HindSiliguri',
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Lockout Banner if user reached 3 attempts
                          if (_lockoutSeconds > 0) ...[
                            Container(
                              padding: const EdgeInsets.all(12),
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0xFF451A03).withValues(alpha: 0.4)
                                    : const Color(0xFFFFFBEB),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isDark
                                      ? const Color(0xFFD97706).withValues(alpha: 0.4)
                                      : const Color(0xFFFDE68A),
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(LucideIcons.lock, size: 16, color: Color(0xFFD97706)),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      '৩ বার ভুল কোড দেওয়ায় ইনপুট লক করা হয়েছে। আর ${_lockoutSeconds ~/ 60}:${(_lockoutSeconds % 60).toString().padLeft(2, '0')} মিনিট অপেক্ষা করো।',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        fontFamily: 'HindSiliguri',
                                        color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ] else ...[
                            Text(
                              '⚠️ সর্বোচ্চ ৩ বার ভুল কোড দেওয়া যাবে (অবশিষ্ট: $_remainingAttempts টি চেষ্টা)',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'HindSiliguri',
                                color: _remainingAttempts < 3 ? const Color(0xFFD97706) : textSecondary,
                              ),
                            ),
                            const SizedBox(height: 8),
                          ],

                          Row(
                            children: [
                              Expanded(
                                child: Container(
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFFAFAF9),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5),
                                    ),
                                  ),
                                  child: TextField(
                                    controller: _claimCodeController,
                                    textCapitalization: TextCapitalization.characters,
                                    enabled: _lockoutSeconds == 0 && !_isClaiming,
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 2,
                                      fontFamily: 'monospace',
                                      color: textPrimary,
                                    ),
                                    decoration: InputDecoration(
                                      hintText: 'CODE1234',
                                      hintStyle: TextStyle(
                                        fontSize: 13,
                                        letterSpacing: 1,
                                        fontFamily: 'monospace',
                                        color: isDark ? const Color(0xFF52525B) : const Color(0xFFA1A1AA),
                                      ),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                      border: InputBorder.none,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              SizedBox(
                                height: 48,
                                child: ElevatedButton(
                                  onPressed: (_lockoutSeconds > 0 || _isClaiming)
                                      ? null
                                      : _handleClaimReferral,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF059669),
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    padding: const EdgeInsets.symmetric(horizontal: 16),
                                  ),
                                  child: _isClaiming
                                      ? const SizedBox(
                                          width: 18,
                                          height: 18,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Text(
                                          'ক্লেইম করো',
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                            fontFamily: 'HindSiliguri',
                                          ),
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

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
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: textSecondary,
                            letterSpacing: 0.5,
                            fontFamily: 'Anek Bangla',
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
                                ? const Color(0xFF1C1C1E)
                                : const Color(0xFFFAFAF9),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF27272A)
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
                                    fontSize: 26,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 4,
                                    color: textPrimary,
                                    fontFamily: 'monospace',
                                  ),
                                 maxLines: 1, overflow: TextOverflow.ellipsis),
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
                                        ? const Color(0xFF059669)
                                        : (isDark
                                              ? const Color(0xFF27272A)
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
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          fontFamily: 'Anek Bangla',
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
                                fontFamily: 'Anek Bangla',
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFB91C1C),
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

                  // ── Gamification ─────────────────────────────────────────
                  _buildProgressSection(isDark),
                  const SizedBox(height: 16),
                  
                  if (_scratchCards.isNotEmpty) ...[
                    _buildScratchCardsSection(isDark),
                    const SizedBox(height: 16),
                  ],

                  // Always show leaderboard (with empty state if no one is on it yet)
                  _buildLeaderboardSection(isDark),
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
                              color: Color(0xFF1E3A8A),
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'রেফারেল প্রোগ্রামের সুবিধা',
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Anek Bangla',
                                color: textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        ...[
                          (
                            '১',
                            'বন্ধুর জন্য ১ মাস ফ্রি প্রিমিয়াম',
                            'তোমার রেফারেল কোড দিয়ে যুক্ত হলেই তোমার বন্ধু পাবে ১ মাসের প্রিমিয়াম সম্পূর্ণ ফ্রি।',
                          ),
                          (
                            '২',
                            'তোমার জন্য স্ক্র্যাচ কার্ড',
                            'প্রতি ৩ জন বন্ধুকে সফলভাবে যুক্ত করলে তুমি পাবে একটি স্ক্র্যাচ কার্ড, যেখানে থাকতে পারে ফ্রি প্রিমিয়াম।',
                          ),
                          (
                            '৩',
                            'আনলিমিটেড রেফারেল',
                            'যত বেশি বন্ধুকে ইনভাইট করবে, তত বেশি স্ক্র্যাচ কার্ড জেতার সুযোগ পাবে।',
                          ),
                        ].map(
                          (item) => Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF1C1C1E)
                                  : const Color(0xFFFAFAF9),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isDark
                                    ? const Color(0xFF27272A)
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
                                        fontSize: 16,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFFB91C1C),
                                        fontFamily: 'Anek Bangla',
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
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          fontFamily: 'Anek Bangla',
                                          color: textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        item.$3,
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontFamily: 'Anek Bangla',
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
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1,
                            fontFamily: 'Anek Bangla',
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
                              desc: 'বন্ধু পাবে প্রিমিয়াম, তুমি পাবে কার্ড।',
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
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'Anek Bangla',
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
                                ? const Color(0xFF059669)
                                : status == 'Rejected'
                                ? const Color(0xFFB91C1C)
                                : const Color(0xFF1E3A8A);
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
                                    ? const Color(0xFF1C1C1E)
                                    : const Color(0xFFFAFAF9),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isDark
                                      ? const Color(0xFF27272A)
                                      : const Color(0xFFF5F5F5),
                                ),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundColor: const Color(
                                      0xFFB91C1C,
                                    ).withValues(alpha: 0.15),
                                    child: Text(
                                      name.isNotEmpty
                                          ? name[0].toUpperCase()
                                          : 'U',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFFB91C1C),
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
                                            fontSize: 16,
                                            fontWeight: FontWeight.w600,
                                            fontFamily: 'Anek Bangla',
                                            color: textPrimary,
                                          ),
                                        ),
                                        if (dateStr.isNotEmpty)
                                          Text(
                                            dateStr,
                                            style: TextStyle(
                                              fontSize: 14,
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
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        fontFamily: 'Anek Bangla',
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

  Widget _buildProgressSection(bool isDark) {
    final nextMilestone = ((_totalReferrals ~/ 3) + 1) * 3;
    final progress = (_totalReferrals % 3) / 3.0;
    final needed = 3 - (_totalReferrals % 3);

    final bg = isDark ? const Color(0xFF1C1C1E) : Colors.white;
    final border = isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'স্ক্র্যাচ কার্ড প্রগ্রেস',
                style: TextStyle(
                  fontFamily: 'Anek Bangla',
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$_totalReferrals / $nextMilestone',
                  style: const TextStyle(
                    fontFamily: 'Anek Bangla',
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFF59E0B),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress == 0 && _totalReferrals > 0 && _totalReferrals % 3 == 0 ? 1.0 : progress,
              minHeight: 12,
              backgroundColor: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFF59E0B)),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            needed == 3 && _totalReferrals > 0
                ? 'অভিনন্দন! আপনি একটি নতুন স্ক্র্যাচ কার্ড পেয়েছেন!'
                : 'আর মাত্র $needed টি সফল রেফারেল করলে পাবেন একটি স্ক্র্যাচ কার্ড!',
            style: TextStyle(
              fontFamily: 'Anek Bangla',
              fontSize: 14,
              color: isDark ? Colors.white70 : Colors.black54,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScratchCardsSection(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'আপনার স্ক্র্যাচ কার্ডসমূহ',
          style: TextStyle(
            fontFamily: 'Anek Bangla',
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.black87,
          ),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.5,
          ),
          itemCount: _scratchCards.length,
          itemBuilder: (context, index) {
            final card = _scratchCards[index];
            final isScratched = card['is_scratched'] == true;

            return InkWell(
              onTap: isScratched
                  ? null
                  : () {
                      showDialog(
                        context: context,
                        barrierDismissible: false,
                        builder: (ctx) => ScratchCardDialog(
                          cardId: card['id'],
                          onScratched: () {
                            _loadReferral(); // reload to update UI
                          },
                        ),
                      );
                    },
              borderRadius: BorderRadius.circular(16),
              child: Container(
                decoration: BoxDecoration(
                  gradient: isScratched
                      ? LinearGradient(
                          colors: isDark
                              ? [const Color(0xFF1C1C1E), const Color(0xFF1C1C1E)]
                              : [const Color(0xFFF3F4F6), const Color(0xFFE5E7EB)],
                        )
                      : const LinearGradient(
                          colors: [Color(0xFFFBBF24), Color(0xFFF59E0B)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? Colors.white10 : Colors.black12,
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        isScratched ? LucideIcons.checkCircle2 : LucideIcons.gift,
                        color: isScratched
                            ? (isDark ? Colors.white54 : Colors.black54)
                            : Colors.white,
                        size: 32,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        isScratched ? 'ব্যবহৃত' : 'খুলতে ক্লিক করুন',
                        style: TextStyle(
                          fontFamily: 'Anek Bangla',
                          fontWeight: FontWeight.bold,
                          color: isScratched
                              ? (isDark ? Colors.white54 : Colors.black54)
                              : Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildLeaderboardSection(bool isDark) {
    final bg = isDark ? const Color(0xFF1C1C1E) : Colors.white;
    final border = isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5);

    String getPrizeText(int rank) {
      if (rank == 1) return 'টি-শার্ট + ১০০০ টাকা';
      if (rank == 2) return 'টি-শার্ট + ৫০০ টাকা';
      if (rank == 3) return 'টি-শার্ট + ১০০ টাকা';
      return 'টি-শার্ট';
    }

    Widget getRankIcon(int rank) {
      if (rank == 1) return const Icon(Icons.emoji_events, color: Color(0xFFEAB308), size: 24);
      if (rank == 2) return const Icon(Icons.emoji_events, color: Color(0xFF9CA3AF), size: 24);
      if (rank == 3) return const Icon(Icons.emoji_events, color: Color(0xFFB45309), size: 24);
      return const Icon(LucideIcons.award, color: Color(0xFFFB7185), size: 20);
    }

    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
              ),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
            ),
            child: const Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.emoji_events, color: Color(0xFFFDE047), size: 28),
                    SizedBox(width: 8),
                    Text(
                      'এই মাসের সেরা রেফারার',
                      style: TextStyle(
                        fontFamily: 'Anek Bangla',
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 4),
                Text(
                  'সবচেয়ে বেশি বন্ধুদের ইনভাইট করুন এবং জিতে নিন দারুণ সব পুরস্কার!',
                  style: TextStyle(
                    fontFamily: 'Anek Bangla',
                    fontSize: 13,
                    color: Color(0xFFFFE4E6),
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: _leaderboard.isEmpty
                ? Padding(
                    padding: const EdgeInsets.symmetric(vertical: 32),
                    child: Column(
                      children: [
                        Icon(LucideIcons.trophy, size: 48, color: isDark ? Colors.white24 : Colors.black12),
                        const SizedBox(height: 12),
                        Text(
                          'এই মাসে এখনও কেউ লিডারবোর্ডে নেই!\nপ্রথম হওয়ার সুযোগ তোমারই!',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: 'Anek Bangla',
                            fontSize: 16,
                            color: isDark ? Colors.white54 : Colors.black54,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _leaderboard.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final user = _leaderboard[index];
                      final rank = index + 1;
                      final isTop3 = rank <= 3;
                      
                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: rank == 1 ? const Color(0xFFFEF9C3).withValues(alpha: isDark ? 0.1 : 1) :
                                 rank == 2 ? const Color(0xFFF3F4F6).withValues(alpha: isDark ? 0.1 : 1) :
                                 rank == 3 ? const Color(0xFFFEF3C7).withValues(alpha: isDark ? 0.1 : 1) :
                                 (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFFAFAFA)),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: rank == 1 ? const Color(0xFFFDE047) :
                                   rank == 2 ? const Color(0xFFD1D5DB) :
                                   rank == 3 ? const Color(0xFFFDE68A) :
                                   (isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5)),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: isTop3 ? (isDark ? Colors.black : Colors.white) : (isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5)),
                                shape: BoxShape.circle,
                                boxShadow: isTop3 && !isDark ? [
                                  BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))
                                ] : [],
                              ),
                              child: Center(
                                child: isTop3 ? getRankIcon(rank) : Text(
                                  '$rank',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18,
                                    color: isDark ? Colors.white70 : Colors.black54,
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
                                    user['name'] ?? 'ব্যবহারকারী',
                                    style: TextStyle(
                                      fontFamily: 'Anek Bangla',
                                      fontWeight: FontWeight.bold,
                                      fontSize: isTop3 ? 16 : 15,
                                      color: isDark ? Colors.white : Colors.black87,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Row(
                                    children: [
                                      const Icon(LucideIcons.gift, size: 12, color: Color(0xFF64748B)),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          getPrizeText(rank),
                                          style: const TextStyle(
                                            fontFamily: 'Anek Bangla',
                                            fontSize: 12,
                                            color: Color(0xFF64748B),
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${user['total_referrals']}',
                                  style: const TextStyle(
                                    fontFamily: 'Anek Bangla',
                                    fontWeight: FontWeight.w900,
                                    fontSize: 20,
                                    color: Color(0xFFE11D48),
                                  ),
                                ),
                                const Text(
                                  'রেফারেল',
                                  style: TextStyle(
                                    fontFamily: 'Anek Bangla',
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF94A3B8),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
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
              color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
              shape: BoxShape.circle,
              border: Border.all(
                color: isDark
                    ? const Color(0xFF27272A)
                    : const Color(0xFFE5E5E5),
                width: 2,
              ),
            ),
            child: Center(
              child: Text(icon, style: const TextStyle(fontSize: 22)),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              fontFamily: 'Anek Bangla',
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            desc,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontFamily: 'Anek Bangla',
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
        color: isDark ? const Color(0xFF27272A) : const Color(0xFFD4D4D4),
      ),
    );
  }
}
