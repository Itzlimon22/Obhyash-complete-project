import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/utils/app_popups.dart';

class LoginSupportView extends StatefulWidget {
  const LoginSupportView({super.key});

  @override
  State<LoginSupportView> createState() => _LoginSupportViewState();
}

class _LoginSupportViewState extends State<LoginSupportView> {
  final _phoneController = TextEditingController();
  final _descController = TextEditingController();

  final List<String> _issueTypes = const [
    'লগইন হচ্ছে না (Login Issue)',
    'ওটিপি কোড পাচ্ছি না (OTP Issue)',
    'পাসওয়ার্ড ভুলে গেছি / রিসেট হচ্ছে না',
    'নতুন অ্যাকাউন্ট খুলতে সমস্যা (Registration Issue)',
    'পেমেন্ট বা সাবস্ক্রিপশন সমস্যা',
    'অন্যান্য সমস্যা',
  ];

  String? _selectedIssue;
  bool _isLoading = false;
  String? _submittedTicketId;
  String? _whatsappUrl;
  String? _uploadedImageUrl;

  XFile? _selectedImage;

  @override
  void dispose() {
    _phoneController.dispose();
    _descController.dispose();
    super.dispose();
  }

  void _showCategoryPicker() {
    const bgColor = Colors.white;
    const textPrimary = Color(0xFF18181B);

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: bgColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Text(
                    'ক্যাটাগরি নির্বাচন করো',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: textPrimary,
                    ),
                  ),
                ),
                const Divider(),
                ..._issueTypes.map(
                  (cat) => ListTile(
                    title: Text(
                      cat,
                      style: TextStyle(
                        fontSize: 14.5,
                        fontWeight: _selectedIssue == cat ? FontWeight.w700 : FontWeight.w500,
                        color: _selectedIssue == cat ? const Color(0xFF006A4E) : textPrimary,
                      ),
                    ),
                    trailing: _selectedIssue == cat
                        ? const Icon(Icons.check_circle, color: Color(0xFF006A4E), size: 20)
                        : null,
                    onTap: () {
                      setState(() => _selectedIssue = cat);
                      Navigator.pop(ctx);
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1920,
      );
      if (file != null) {
        setState(() => _selectedImage = file);
        HapticFeedback.lightImpact();
      }
    } catch (e) {
      debugPrint('[LoginSupportView] Pick image error: $e');
    }
  }

  Future<String?> _uploadImageToR2(XFile file) async {
    try {
      final uri = Uri.parse('https://obhyash.com/api/r2-upload');
      final request = http.MultipartRequest('POST', uri);
      request.fields['folder'] = 'support';

      final bytes = await file.readAsBytes();
      request.files.add(
        http.MultipartFile.fromBytes(
          'file',
          bytes,
          filename: file.name,
        ),
      );

      final streamedResponse =
          await request.send().timeout(const Duration(seconds: 35));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final publicUrl =
            (data['publicUrl'] as String?) ?? (data['url'] as String?);
        return publicUrl;
      } else {
        debugPrint(
            '[LoginSupportView] R2 upload response status ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      debugPrint('[LoginSupportView] R2 upload exception: $e');
    }
    return null;
  }

  Future<void> _handleSubmit() async {
    final contact = _phoneController.text.trim();
    final desc = _descController.text.trim();

    if (_selectedIssue == null) {
      AppPopups.show(
        context,
        message: 'দয়া করে সমস্যার ক্যাটাগরি নির্বাচন করুন',
        isError: true,
      );
      return;
    }

    if (contact.isEmpty) {
      AppPopups.show(
        context,
        message: 'তোমার ফোন নাম্বার উল্লেখ করা আবশ্যক',
        isError: true,
      );
      return;
    }

    if (desc.isEmpty) {
      AppPopups.show(
        context,
        message: 'তোমার সমস্যা লিখে পাঠাও',
        isError: true,
      );
      return;
    }

    if (desc.length < 20) {
      AppPopups.show(
        context,
        message: 'সমস্যাটি কমপক্ষে ২০ অক্ষরে বিস্তারিত লিখুন',
        isError: true,
      );
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.lightImpact();

    try {
      String? r2ImageUrl;
      if (_selectedImage != null) {
        r2ImageUrl = await _uploadImageToR2(_selectedImage!);
        if (r2ImageUrl == null) {
          if (!mounted) return;
          setState(() => _isLoading = false);
          AppPopups.show(
            context,
            message: 'ছবিটি আপলোড হতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
            isError: true,
          );
          return;
        }
      }

      final refCode =
          DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase();

      await Supabase.instance.client.from('login_support_requests').insert({
        'name': 'Student',
        'contact_info': contact,
        'issue_type': _selectedIssue,
        'description': desc,
        'status': 'Pending',
        'metadata': {
          'platform': 'flutter_app',
          'reference_code': refCode,
          'has_attachment': r2ImageUrl != null,
          'attachment_url': r2ImageUrl,
          'image_url': r2ImageUrl,
          'attachment_name': _selectedImage?.name,
          'submitted_at': DateTime.now().toIso8601String(),
        },
      });

      var waMessage =
          'হ্যালো অভ্যাশ সাপোর্ট টিম,\n\nআমি লগইন/অ্যাপ ব্যবহারে সমস্যায় পড়েছি।\nফোন: $contact\nক্যাটাগরি: $_selectedIssue\nবিবরণ: $desc\n(রেফারেন্স কোড: #$refCode)';
      if (r2ImageUrl != null) {
        waMessage += '\nসংযুক্ত ছবি: $r2ImageUrl';
      }

      final encodedText = Uri.encodeComponent(waMessage);
      final waUrl = 'https://wa.me/8801409583992?text=$encodedText';

      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _submittedTicketId = refCode;
        _whatsappUrl = waUrl;
        _uploadedImageUrl = r2ImageUrl;
      });
      HapticFeedback.mediumImpact();
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      AppPopups.show(
        context,
        message: 'অনুরোধটি পাঠানো সম্ভব হয়নি। সরাসরি WhatsApp-এ বার্তা দাও।',
        isError: true,
      );
    }
  }

  Future<void> _launchWhatsApp() async {
    if (_whatsappUrl == null) return;
    final uri = Uri.parse(_whatsappUrl!);
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(uri, mode: LaunchMode.platformDefault);
      }
    } catch (e) {
      debugPrint('[LoginSupport] WhatsApp launch error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: ThemeData.light(),
      child: Builder(
        builder: (context) {
          const isDark = false;
          const bgColor = Colors.white;
          const inputBg = Color(0xFFF3F4F6);
          const textPrimary = Color(0xFF18181B);
          const textMuted = Color(0xFF6B7280);

          return AnnotatedRegion<SystemUiOverlayStyle>(
            value: SystemUiOverlayStyle.dark.copyWith(
              statusBarColor: Colors.transparent,
              systemNavigationBarColor: Colors.white,
            ),
            child: Scaffold(
              backgroundColor: bgColor,
              appBar: AppBar(
                backgroundColor: bgColor,
                elevation: 0,
                leading: IconButton(
                  icon: const Icon(LucideIcons.arrowLeft, color: textPrimary),
                  onPressed: () => context.pop(),
                ),
                title: const Text(
                  'সাপোর্টে যোগাযোগ',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: textPrimary,
                  ),
                ),
                centerTitle: true,
              ),
              body: SafeArea(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: _submittedTicketId != null
                      ? _buildSuccessView(
                          textPrimary: textPrimary,
                          textMuted: textMuted,
                          inputBg: inputBg,
                          isDark: isDark,
                        )
                      : _buildFormView(
                          textPrimary: textPrimary,
                          textMuted: textMuted,
                          inputBg: inputBg,
                          isDark: isDark,
                        ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFormView({
    required Color textPrimary,
    required Color textMuted,
    required Color inputBg,
    required bool isDark,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. সমস্যার ক্যাটাগরি
        Text(
          'সমস্যার ক্যাটাগরি',
          style: TextStyle(
            fontSize: 14.5,
            fontWeight: FontWeight.w700,
            color: textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _isLoading ? null : _showCategoryPicker,
          behavior: HitTestBehavior.opaque,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
            decoration: BoxDecoration(
              color: inputBg,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _selectedIssue ?? 'ক্যাটাগরি নির্বাচন করো',
                  style: TextStyle(
                    fontSize: 14.5,
                    color: _selectedIssue != null ? textPrimary : textMuted,
                    fontWeight:
                        _selectedIssue != null ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
                Icon(
                  LucideIcons.chevronDown,
                  size: 20,
                  color: textPrimary,
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 20),

        // 2. তোমার ফোন নাম্বার
        Text(
          'তোমার ফোন নাম্বার',
          style: TextStyle(
            fontSize: 14.5,
            fontWeight: FontWeight.w700,
            color: textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: inputBg,
            borderRadius: BorderRadius.circular(14),
          ),
          child: TextField(
            controller: _phoneController,
            enabled: !_isLoading,
            keyboardType: TextInputType.phone,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: textPrimary,
            ),
            decoration: InputDecoration(
              hintText: '০১XXXXXXXXX',
              hintStyle: TextStyle(
                fontSize: 14.5,
                color: textMuted,
                fontWeight: FontWeight.normal,
              ),
              border: InputBorder.none,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
            ),
          ),
        ),

        const SizedBox(height: 20),

        // 3. তোমার সমস্যা
        Text(
          'তোমার সমস্যা',
          style: TextStyle(
            fontSize: 14.5,
            fontWeight: FontWeight.w700,
            color: textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: inputBg,
            borderRadius: BorderRadius.circular(14),
          ),
          child: TextField(
            controller: _descController,
            enabled: !_isLoading,
            maxLines: 6,
            minLines: 4,
            style: TextStyle(
              fontSize: 14.5,
              color: textPrimary,
            ),
            decoration: InputDecoration(
              hintText: 'এখানে লিখে পাঠাও',
              hintStyle: TextStyle(
                fontSize: 14.5,
                color: textMuted,
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.all(16),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'কমপক্ষে ২০ অক্ষর লিখতে হবে',
          style: TextStyle(
            fontSize: 12.5,
            color: textMuted,
          ),
        ),

        const SizedBox(height: 22),

        // 4. ছবি আপলোড করো (Strictly Image, No Video)
        Text(
          'ছবি আপলোড করো',
          style: TextStyle(
            fontSize: 14.5,
            fontWeight: FontWeight.w700,
            color: textPrimary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'সমস্যার স্ক্রিনশট বা ছবি থাকলে যুক্ত করো (ঐচ্ছিক)',
          style: TextStyle(
            fontSize: 12.5,
            color: textMuted,
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _isLoading ? null : _pickImage,
          behavior: HitTestBehavior.opaque,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF064E3B).withValues(alpha: 0.25)
                  : const Color(0xFFECFDF5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? const Color(0xFF059669) : const Color(0xFFA7F3D0),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  LucideIcons.image,
                  size: 18,
                  color: isDark ? const Color(0xFF34D399) : const Color(0xFF006A4E),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    _selectedImage == null
                        ? 'ছবি যুক্ত করো'
                        : 'ছবি সিলেক্টেড (${_selectedImage!.name})',
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color:
                          isDark ? const Color(0xFF34D399) : const Color(0xFF006A4E),
                    ),
                  ),
                ),
                if (_selectedImage != null && !_isLoading) ...[
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => setState(() => _selectedImage = null),
                    child: Icon(
                      LucideIcons.x,
                      size: 16,
                      color: isDark
                          ? const Color(0xFF34D399)
                          : const Color(0xFF006A4E),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),

        const SizedBox(height: 28),

        // 5. Submit Button
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleSubmit,
            style: ElevatedButton.styleFrom(
              backgroundColor:
                  isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6),
              foregroundColor: textPrimary,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: _isLoading
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.2,
                          color: textPrimary,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        _selectedImage != null
                            ? 'ছবি আপলোড ও জমা হচ্ছে...'
                            : 'জমা হচ্ছে...',
                        style: TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w700,
                          color: textPrimary,
                        ),
                      ),
                    ],
                  )
                : Text(
                    'সাপোর্ট রিকোয়েস্ট পাঠাও',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: textPrimary,
                    ),
                  ),
          ),
        ),

        const SizedBox(height: 30),
      ],
    );
  }

  Widget _buildSuccessView({
    required Color textPrimary,
    required Color textMuted,
    required Color inputBg,
    required bool isDark,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const SizedBox(height: 24),
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: const Color(0xFF006A4E).withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            LucideIcons.checkCircle2,
            color: Color(0xFF006A4E),
            size: 32,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'রিকোয়েস্ট জমা হয়েছে!',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            color: textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'আমাদের টিম দ্রুত তোমার ফোন নম্বরে যোগাযোগ করবে।',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13.5,
            color: textMuted,
          ),
        ),
        const SizedBox(height: 24),

        // Ticket info flat box
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: inputBg,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('রেফারেন্স আইডি',
                      style: TextStyle(fontSize: 13, color: textMuted)),
                  Text(
                    '#${_submittedTicketId ?? ''}',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: textPrimary,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('ক্যাটাগরি',
                      style: TextStyle(fontSize: 13, color: textMuted)),
                  Text(
                    _selectedIssue ?? '',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: textPrimary,
                    ),
                  ),
                ],
              ),
              if (_uploadedImageUrl != null) ...[
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('সংযুক্ত ছবি',
                        style: TextStyle(fontSize: 13, color: textMuted)),
                    Row(
                      children: const [
                        Icon(LucideIcons.image,
                            size: 14, color: Color(0xFF006A4E)),
                        SizedBox(width: 4),
                        Text(
                          'R2 ক্লাউডে সংরক্ষিত',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF006A4E),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),

        const SizedBox(height: 24),

        // WhatsApp direct button
        if (_whatsappUrl != null)
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: _launchWhatsApp,
              icon: const Icon(LucideIcons.messageCircle, size: 20, color: Colors.white),
              label: const Text(
                'সরাসরি WhatsApp-এ কথা বলুন',
                style: TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF25D366),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),

        const SizedBox(height: 12),

        // Back to login button
        SizedBox(
          width: double.infinity,
          height: 48,
          child: TextButton(
            onPressed: () => context.pop(),
            child: Text(
              'ফিরে যান',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: textMuted,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
