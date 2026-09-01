import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/utils/app_popups.dart';

class OtpVerificationDialog extends StatefulWidget {
  final String phone;
  final Future<Map<String, dynamic>> Function(String otp) onVerify;
  final Future<Map<String, dynamic>> Function() onResend;
  final int initialCooldown;

  const OtpVerificationDialog({
    super.key,
    required this.phone,
    required this.onVerify,
    required this.onResend,
    this.initialCooldown = 60,
  });

  static Future<bool?> show(
    BuildContext context, {
    required String phone,
    required Future<Map<String, dynamic>> Function(String otp) onVerify,
    required Future<Map<String, dynamic>> Function() onResend,
    int initialCooldown = 60,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => OtpVerificationDialog(
        phone: phone,
        onVerify: onVerify,
        onResend: onResend,
        initialCooldown: initialCooldown,
      ),
    );
  }

  @override
  State<OtpVerificationDialog> createState() => _OtpVerificationDialogState();
}

class _OtpVerificationDialogState extends State<OtpVerificationDialog> {
  final _otpController = TextEditingController();
  final _focusNode = FocusNode();

  int _cooldown = 60;
  Timer? _timer;
  bool _isVerifying = false;
  bool _isResending = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _cooldown = widget.initialCooldown;
    _startTimer();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_cooldown > 0) {
        setState(() => _cooldown--);
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _handleVerify() async {
    final otp = _otpController.text.trim();
    if (otp.length < 6 || otp.length > 8) {
      setState(() => _errorMessage = 'অনুগ্রহ করে সঠিক ওটিপি কোডটি লিখুন');
      return;
    }

    setState(() {
      _isVerifying = true;
      _errorMessage = null;
    });

    try {
      final res = await widget.onVerify(otp);
      if (!mounted) return;

      if (res['success'] == true) {
        Navigator.of(context).pop(true);
      } else {
        setState(() {
          _errorMessage = res['error']?.toString() ?? 'ওটিপি যাচাই করা যায়নি';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMessage = e.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _isVerifying = false);
      }
    }
  }

  Future<void> _handleResend() async {
    if (_cooldown > 0 || _isResending) return;

    setState(() {
      _isResending = true;
      _errorMessage = null;
    });

    try {
      final res = await widget.onResend();
      if (!mounted) return;

      if (res['success'] == true) {
        _otpController.clear();
        setState(() {
          _cooldown = (res['cooldown_seconds'] as num?)?.toInt() ?? 60;
        });
        _startTimer();
        AppPopups.success(context, message: 'নতুন ওটিপি কোড পাঠানো হয়েছে!');
      } else {
        setState(() {
          _errorMessage = res['error']?.toString() ?? 'ওটিপি পাঠানো যায়নি';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMessage = e.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _isResending = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;

    final bgColor = isDark ? const Color(0xFF141414) : Colors.white;
    final cardBg = isDark ? const Color(0xFF1F1F1F) : const Color(0xFFF9FAFB);
    final borderColor = isDark ? const Color(0xFF2E2E2E) : const Color(0xFFE5E7EB);
    final textColor = isDark ? Colors.white : const Color(0xFF111827);
    final subTextColor = isDark ? const Color(0xFF9CA3AF) : const Color(0xFF4B5563);

    final isEmail = widget.phone.contains('@');
    final targetLabel = isEmail ? 'ইমেইল:' : 'নম্বর:';
    final headerTitle = isEmail ? 'ইমেইল যাচাই' : 'মোবাইল নম্বর যাচাই';
    final sentBadgeText = isEmail ? 'কোড পাঠানো হয়েছে' : 'SMS পাঠানো হয়েছে';

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: keyboardHeight + 24,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF374151) : const Color(0xFFD1D5DB),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header Icon + Title
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: (isEmail ? const Color(0xFF3B82F6) : const Color(0xFF059669)).withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isEmail ? LucideIcons.mailCheck : LucideIcons.shieldCheck,
                  size: 22,
                  color: isEmail ? const Color(0xFF3B82F6) : const Color(0xFF059669),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      headerTitle,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'Anek Bangla',
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'নিরাপত্তা স্বার্থে ওটিপি কোডটি যাচাই করো',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontFamily: 'HindSiliguri',
                        color: subTextColor,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => Navigator.of(context).pop(false),
                icon: Icon(
                  LucideIcons.x,
                  size: 18,
                  color: subTextColor,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Sent To Phone / Email Badge (Responsive, No Overflow)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: borderColor),
            ),
            child: Row(
              children: [
                Icon(
                  isEmail ? LucideIcons.mail : LucideIcons.smartphone,
                  size: 17,
                  color: isEmail ? const Color(0xFF3B82F6) : const Color(0xFF059669),
                ),
                const SizedBox(width: 8),
                Text(
                  targetLabel,
                  style: TextStyle(
                    fontSize: 13,
                    fontFamily: 'HindSiliguri',
                    color: subTextColor,
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    widget.phone,
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      fontFamily: isEmail ? 'HindSiliguri' : 'monospace',
                      color: textColor,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: (isEmail ? const Color(0xFF3B82F6) : const Color(0xFF059669)).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    sentBadgeText,
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'HindSiliguri',
                      color: isEmail ? const Color(0xFF3B82F6) : const Color(0xFF059669),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // OTP Input Box (Adaptive 6-8 Digit styling)
          Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0A0A0A) : const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _errorMessage != null
                    ? const Color(0xFFEF4444)
                    : const Color(0xFF059669),
                width: 1.5,
              ),
            ),
            child: TextField(
              controller: _otpController,
              focusNode: _focusNode,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              maxLength: 8,
              style: TextStyle(
                fontSize: _otpController.text.length > 6 ? 22 : 26,
                fontWeight: FontWeight.w900,
                letterSpacing: _otpController.text.length > 6 ? 6 : 10,
                fontFamily: 'monospace',
                color: textColor,
              ),
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
              ],
              onChanged: (val) {
                if (_errorMessage != null) {
                  setState(() => _errorMessage = null);
                } else {
                  setState(() {});
                }
                if (val.length == 6 || val.length == 8) {
                  _handleVerify();
                }
              },
              decoration: InputDecoration(
                counterText: '',
                hintText: '••••••••',
                hintStyle: TextStyle(
                  color: isDark ? const Color(0xFF4B5563) : const Color(0xFF9CA3AF),
                  letterSpacing: 8,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),

          // Error Message Display
          if (_errorMessage != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(
                  LucideIcons.alertCircle,
                  size: 15,
                  color: Color(0xFFEF4444),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(
                      fontSize: 12.5,
                      fontFamily: 'HindSiliguri',
                      fontWeight: FontWeight.w600,
                      color: Color(0xFFEF4444),
                    ),
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: 20),

          // Verify Button
          ElevatedButton(
            onPressed: _isVerifying ? null : _handleVerify,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 15),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
            child: _isVerifying
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: Colors.white,
                    ),
                  )
                : const Text(
                    'যাচাই করে এগিয়ে যাও',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'Anek Bangla',
                    ),
                  ),
          ),

          const SizedBox(height: 16),

          // Cooldown Timer / Resend Button
          Center(
            child: _cooldown > 0
                ? Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        LucideIcons.clock,
                        size: 14,
                        color: subTextColor,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'আবার পাঠানো যাবে: $_cooldown সেকেন্ড পর',
                        style: TextStyle(
                          fontSize: 13,
                          fontFamily: 'HindSiliguri',
                          fontWeight: FontWeight.w600,
                          color: subTextColor,
                        ),
                      ),
                    ],
                  )
                : TextButton.icon(
                    onPressed: _isResending ? null : _handleResend,
                    icon: _isResending
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Color(0xFF059669),
                            ),
                          )
                        : const Icon(
                            LucideIcons.rotateCw,
                            size: 14,
                            color: Color(0xFF059669),
                          ),
                    label: const Text(
                      'ওটিপি পুনরায় পাঠাও',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'HindSiliguri',
                        color: Color(0xFF059669),
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
