import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/utils/app_popups.dart';

class LoginSupportSheet extends StatefulWidget {
  const LoginSupportSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const LoginSupportSheet(),
    );
  }

  @override
  State<LoginSupportSheet> createState() => _LoginSupportSheetState();
}

class _LoginSupportSheetState extends State<LoginSupportSheet> {
  final _nameController = TextEditingController();
  final _contactController = TextEditingController();
  final _descController = TextEditingController();

  static const _issues = [
    'লগইন করতে পারছি না',
    'ওটিপি কোড পাচ্ছি না',
    'পাসওয়ার্ড রিসেট সমস্যা',
    'পেমেন্ট করেছি কিন্তু অ্যাকাউন্ট চালু হয়নি',
    'নতুন অ্যাকাউন্ট খুলতে সমস্যা',
    'অন্যান্য সমস্যা',
  ];

  String _selectedIssue = _issues[0];
  bool _isLoading = false;
  String? _submittedTicketId;
  String? _whatsappUrl;

  @override
  void dispose() {
    _nameController.dispose();
    _contactController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final name = _nameController.text.trim();
    final contact = _contactController.text.trim();
    final desc = _descController.text.trim();

    if (name.isEmpty) {
      AppPopups.show(context, message: 'অনুগ্রহ করে তোমার নাম লেখো', isError: true);
      return;
    }
    if (contact.isEmpty) {
      AppPopups.show(context, message: 'মোবাইল নম্বর বা ইমেইল লিখুন', isError: true);
      return;
    }
    if (desc.isEmpty) {
      AppPopups.show(context, message: 'সমস্যার বিবরণ লিখুন', isError: true);
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.lightImpact();

    try {
      final refCode = DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase();
      await Supabase.instance.client
          .from('login_support_requests')
          .insert({
            'name': name,
            'contact_info': contact,
            'issue_type': _selectedIssue,
            'description': desc,
            'status': 'Pending',
            'metadata': {
              'platform': 'flutter_app',
              'reference_code': refCode,
              'submitted_at': DateTime.now().toIso8601String(),
            },
          });

      final encodedText = Uri.encodeComponent(
        'হ্যালো অভ্যাশ সাপোর্ট টিম,\n\nআমি লগইন/রেজিস্ট্রেশনে সমস্যায় পড়েছি।\nনাম: $name\nযোগাযোগ: $contact\nসমস্যা: $_selectedIssue\nবিবরণ: $desc\n(রেফারেন্স কোড: #$refCode)',
      );
      final waUrl = 'https://wa.me/8801409583992?text=$encodedText';

      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _submittedTicketId = refCode;
        _whatsappUrl = waUrl;
      });
      HapticFeedback.mediumImpact();
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      AppPopups.show(
        context,
        message: 'অনুরোধটি পাঠানো সম্ভব হয়নি। সরাসরি WhatsApp-এ বার্তা দিন।',
        isError: true,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF141417) : Colors.white;
    final textPrimary = isDark ? Colors.white : const Color(0xFF18181B);
    final textMuted = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A);
    final borderColor = isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7);
    const primaryGreen = Color(0xFF006A4E);

    return Container(
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(top: BorderSide(color: borderColor)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Header
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: primaryGreen.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    LucideIcons.helpCircle,
                    size: 20,
                    color: primaryGreen,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'সহায়তা ও সাপোর্ট',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: textPrimary,
                        ),
                      ),
                      Text(
                        'আমাদের সাপোর্ট টিম দ্রুত যোগাযোগ করবে',
                        style: TextStyle(
                          fontSize: 12,
                          color: textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: Icon(LucideIcons.x, size: 20, color: textMuted),
                ),
              ],
            ),
            const SizedBox(height: 16),

            if (_submittedTicketId != null) ...[
              // Success Screen
              const SizedBox(height: 10),
              Center(
                child: Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: const Color(0xFF006A4E).withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    LucideIcons.checkCircle2,
                    size: 34,
                    color: Color(0xFF34D399),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'অনুরোধ সফলভাবে জমা নেওয়া হয়েছে!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'টিকিট: #${_submittedTicketId!.length >= 8 ? _submittedTicketId!.substring(0, 8) : _submittedTicketId}',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                  color: Color(0xFF006A4E),
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () async {
                  if (_whatsappUrl != null) {
                    final uri = Uri.parse(_whatsappUrl!);
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  }
                },
                icon: const Icon(LucideIcons.messageCircle, size: 18),
                label: const Text(
                  'সরাসরি WhatsApp-এ কথা বলুন',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF25D366),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text('বন্ধ করুন', style: TextStyle(color: textMuted)),
              ),
            ] else ...[
              // Form Fields
              _buildFieldLabel('তোমার নাম', textMuted),
              const SizedBox(height: 6),
              _buildTextField(
                controller: _nameController,
                hint: 'পূর্ণ নাম লিখুন',
                isDark: isDark,
                textPrimary: textPrimary,
                borderColor: borderColor,
              ),
              const SizedBox(height: 12),

              _buildFieldLabel('মোবাইল নম্বর বা ইমেইল', textMuted),
              const SizedBox(height: 6),
              _buildTextField(
                controller: _contactController,
                hint: '01XXXXXXXXX বা example@gmail.com',
                isDark: isDark,
                textPrimary: textPrimary,
                borderColor: borderColor,
                keyboardType: TextInputType.text,
              ),
              const SizedBox(height: 12),

              _buildFieldLabel('সমস্যার ধরন', textMuted),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E1E24) : const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: borderColor),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedIssue,
                    isExpanded: true,
                    dropdownColor: isDark ? const Color(0xFF1E1E24) : Colors.white,
                    style: TextStyle(
                      fontSize: 14,
                      color: textPrimary,
                      fontWeight: FontWeight.w500,
                    ),
                    items: _issues.map((issue) {
                      return DropdownMenuItem<String>(
                        value: issue,
                        child: Text(issue),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedIssue = val);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 12),

              _buildFieldLabel('সমস্যার বিবরণ', textMuted),
              const SizedBox(height: 6),
              _buildTextField(
                controller: _descController,
                hint: 'তোমার সমস্যাটি সংক্ষেপে লেখো...',
                isDark: isDark,
                textPrimary: textPrimary,
                borderColor: borderColor,
                maxLines: 3,
              ),
              const SizedBox(height: 18),

              // Submit Button
              ElevatedButton(
                onPressed: _isLoading ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryGreen,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.2,
                          color: Colors.white,
                        ),
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.send, size: 16),
                          SizedBox(width: 8),
                          Text(
                            'অনুরোধ জমা দিন',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
              ),
              const SizedBox(height: 12),

              // Quick WhatsApp link
              Center(
                child: GestureDetector(
                  onTap: () async {
                    final uri = Uri.parse('https://wa.me/8801409583992');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  },
                  child: const Padding(
                    padding: EdgeInsets.symmetric(vertical: 4),
                    child: Text(
                      'জরুরি হলে সরাসরি WhatsApp-এ বার্তা দিন',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF006A4E),
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFieldLabel(String text, Color color) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: color,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required bool isDark,
    required Color textPrimary,
    required Color borderColor,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: textPrimary,
      ),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(
          fontSize: 13.5,
          color: isDark ? Colors.white38 : Colors.black38,
        ),
        filled: true,
        fillColor: isDark ? const Color(0xFF1E1E24) : const Color(0xFFF9FAFB),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: borderColor),
        ),
        focusedBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(14)),
          borderSide: BorderSide(color: Color(0xFF006A4E), width: 1.5),
        ),
      ),
    );
  }
}
