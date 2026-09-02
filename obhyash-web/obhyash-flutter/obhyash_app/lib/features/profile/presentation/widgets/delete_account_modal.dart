import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:obhyash_app/core/utils/app_popups.dart';
import '../../../../services/secure_storage_service.dart';
import '../../../../services/session_monitor_service.dart';
import '../../../dashboard/domain/models.dart';

class DeleteAccountModal extends StatefulWidget {
  final UserProfile user;

  const DeleteAccountModal({super.key, required this.user});

  static Future<void> show(BuildContext context, UserProfile user) {
    return showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.55),
      builder: (context) => DeleteAccountModal(user: user),
    );
  }

  @override
  State<DeleteAccountModal> createState() => _DeleteAccountModalState();
}

class _DeleteAccountModalState extends State<DeleteAccountModal> {
  final _confirmationController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _confirmationController.dispose();
    super.dispose();
  }

  Future<void> _handleDelete() async {
    final input = _confirmationController.text.trim();
    if (input != 'DELETE') {
      setState(() {
        _errorMessage = 'অ্যাকাউন্ট মুছতে নিশ্চিতকরণ বক্সে "DELETE" লিখো।';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final supabase = Supabase.instance.client;
      
      // Call secure RPC
      try {
        await supabase.rpc(
          'delete_user_account',
          params: {
            'p_reason': 'User requested deletion',
          },
        );
      } catch (rpcErr) {
        debugPrint('[DeleteAccountModal] RPC error, attempting fallback: $rpcErr');
        // Fallback: Delete from public.users directly
        try {
          await supabase.from('users').delete().eq('id', widget.user.id);
        } catch (dbErr) {
          rethrow; // If both fail, let user see error
        }
      }

      // Stop session monitor & clear tokens/preferences
      try {
        await SessionMonitorService.stop(userId: widget.user.id);
        await Future.wait([
          SecureStorageService.clearSession().catchError((_) {}),
          SecureStorageService.clearUserMeta().catchError((_) {}),
        ]);
        final prefs = await SharedPreferences.getInstance();
        await prefs.clear();
      } catch (_) {}

      // Sign out from Supabase Auth
      await supabase.auth.signOut();

      if (!mounted) return;
      HapticFeedback.heavyImpact();
      Navigator.of(context).pop(); // Close modal
      
      AppPopups.success(
        context,
        message: 'তোমার অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলা হয়েছে।',
      );

      // Navigate to login / welcome screen
      context.go('/welcome');
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceAll('Exception:', '').replaceAll('PostgrestException', '').trim();
      });
      AppPopups.error(context, message: _errorMessage ?? 'অ্যাকাউন্ট মুছতে সমস্যা হয়েছে।');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? const Color(0xFF13151F) : const Color(0xFFFFFFFF);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final isPro = widget.user.isPro;

    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
      child: Container(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 20,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle bar
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white24 : Colors.black12,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Danger Header Icon & Title
                Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF450A0A) : const Color(0xFFFEE2E2),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isDark ? const Color(0xFF991B1B) : const Color(0xFFFECACA),
                          width: 1.5,
                        ),
                      ),
                      child: const Icon(
                        LucideIcons.alertTriangle,
                        color: Color(0xFFDC2626),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'অ্যাকাউন্ট মুছে ফেলো (Delete Account)',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'HindSiliguri',
                              color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFFB91C1C),
                            ),
                          ),
                          Text(
                            'এই প্রক্রিয়াটি অপরিবর্তনীয় ও স্থায়ী',
                            style: TextStyle(
                              fontSize: 12.5,
                              fontFamily: 'HindSiliguri',
                              color: textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Active Subscription Warning Banner
                if (isPro) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF3B1D04) : const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isDark ? const Color(0xFFB45309) : const Color(0xFFFDE68A),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(LucideIcons.alertCircle, color: Color(0xFFD97706), size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'সতর্কতা: তোমার অ্যাকাউন্টে প্রো সাবস্ক্রিপশন সক্রিয় আছে। অ্যাকাউন্ট মুছে ফেললে সাবস্ক্রিপশন চিরতরে বাতিল হবে এবং এর জন্য কোনো রিফান্ড প্রযোজ্য হবে না।',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              fontFamily: 'HindSiliguri',
                              color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Warning Points
                Text(
                  'অ্যাকাউন্ট মুছে ফেললে যা ঘটবে:',
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'HindSiliguri',
                    color: textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                _buildBulletPoint('তোমার নাম, ইমেইল ও সমস্ত ব্যক্তিগত প্রোফাইল চিরতরে মুছে যাবে।', isDark),
                _buildBulletPoint('সমস্ত পরীক্ষার ইতিহাস, নম্বর, মেধা স্কোর ও স্ট্রিক রেকর্ড নষ্ট হবে।', isDark),
                _buildBulletPoint('সংরক্ষিত বুকমার্ক, স্টাডি নোট ও স্ক্র্যাচ কার্ড মুছে যাবে।', isDark),
                const SizedBox(height: 20),

                // Confirmation Text Box
                Text(
                  'নিশ্চিত করতে নিচে "DELETE" লিখো:',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'HindSiliguri',
                    color: textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _confirmationController,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                    fontFamily: 'monospace',
                    color: isDark ? const Color(0xFFF87171) : const Color(0xFFDC2626),
                  ),
                  decoration: InputDecoration(
                    hintText: 'DELETE',
                    hintStyle: TextStyle(
                      fontSize: 14,
                      letterSpacing: 2,
                      color: isDark ? Colors.white24 : Colors.black26,
                    ),
                    filled: true,
                    fillColor: isDark ? const Color(0xFF1E2235) : const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: isDark ? const Color(0xFF991B1B) : const Color(0xFFFCA5A5),
                      ),
                    ),
                  ),
                ),

                if (_errorMessage != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    _errorMessage!,
                    style: const TextStyle(
                      fontSize: 12,
                      fontFamily: 'HindSiliguri',
                      color: Color(0xFFEF4444),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
                const SizedBox(height: 24),

                // Buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          side: BorderSide(color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE5E7EB)),
                        ),
                        child: Text(
                          'বাতিল করো',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontWeight: FontWeight.w600,
                            fontSize: 13.5,
                            color: textPrimary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleDelete,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF740A03), // Solid Deep Crimson #740A03
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text(
                                'হ্যাঁ, মুছে ফেলো',
                                style: TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBulletPoint(String text, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 6),
            width: 5,
            height: 5,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFFF87171) : const Color(0xFFDC2626),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 12.5,
                fontFamily: 'HindSiliguri',
                color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
