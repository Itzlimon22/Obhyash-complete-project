import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../../core/presentation/widgets/user_avatar.dart';
import '../../../../core/providers/shared_prefs_provider.dart';
import '../../../../core/utils/app_popups.dart';
import '../../../dashboard/domain/models.dart';
import '../../../dashboard/providers/dashboard_providers.dart';
import 'avatar_crop_dialog.dart';

/// Modal bottom sheet for changing profile image (Upload custom photo with crop or select DiceBear preset)
class AvatarPickerModal extends ConsumerStatefulWidget {
  final UserProfile user;

  const AvatarPickerModal({super.key, required this.user});

  static Future<void> show(BuildContext context, UserProfile user) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AvatarPickerModal(user: user),
    );
  }

  @override
  ConsumerState<AvatarPickerModal> createState() => _AvatarPickerModalState();
}

class _AvatarPickerModalState extends ConsumerState<AvatarPickerModal> {
  late String? _selectedAvatarUrl;
  bool _isUploading = false;
  final ImagePicker _picker = ImagePicker();

  // Curated list of DiceBear cartoon presets matching the web app
  late final List<String> _presets;

  @override
  void initState() {
    super.initState();
    _selectedAvatarUrl = widget.user.avatarUrl;
    _presets = _generatePresets();
  }

  List<String> _generatePresets() {
    final seedBase = widget.user.id.isNotEmpty ? widget.user.id.substring(0, 4) : 'obhyash';
    final gender = (widget.user.gender ?? 'other').toLowerCase();

    final list = <String>[];

    // Primary gender-based styles
    final styles = gender == 'female'
        ? ['lorelei', 'adventurer', 'avataaars', 'personas', 'fun-emoji', 'micah', 'bottts']
        : ['adventurer', 'lorelei', 'avataaars', 'personas', 'fun-emoji', 'micah', 'bottts'];

    for (int i = 0; i < styles.length; i++) {
      final style = styles[i];
      list.add('https://api.dicebear.com/7.x/$style/svg?seed=${seedBase}_$i&scale=120&radius=0&backgroundColor=b6e3f4,c0aede,d1d4f9');
      list.add('https://api.dicebear.com/7.x/$style/svg?seed=${seedBase}_alt_$i&scale=120&radius=0&backgroundColor=ffd5dc,ffdfbf,d1d4f9');
    }

    return list;
  }

  void _generateRandomAvatar() {
    final randomSeed = 'rnd_${DateTime.now().millisecondsSinceEpoch}';
    final newUrl = getRandomAvatar(gender: widget.user.gender, seed: randomSeed);
    setState(() {
      _selectedAvatarUrl = newUrl;
    });
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? picked = await _picker.pickImage(
        source: source,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 92,
      );

      if (picked == null) return;
      final rawBytes = await picked.readAsBytes();

      if (!mounted) return;
      // Launch interactive crop & adjustment dialog
      final Uint8List? croppedBytes = await AvatarCropDialog.show(context, rawBytes);

      if (croppedBytes == null || !mounted) return;

      setState(() => _isUploading = true);

      final supabase = Supabase.instance.client;
      final userId = widget.user.id;
      final fileName = '${userId}_${DateTime.now().millisecondsSinceEpoch}.png';

      // 1. Upload cropped bytes to Supabase Storage
      await supabase.storage.from('avatars').uploadBinary(
            fileName,
            croppedBytes,
            fileOptions: const FileOptions(upsert: true, contentType: 'image/png'),
          );

      // 2. Get Public URL
      final publicUrl = supabase.storage.from('avatars').getPublicUrl(fileName);

      // 3. Save to database
      await _saveAvatarToDatabase(publicUrl);
    } catch (e) {
      debugPrint('Avatar upload error: $e');
      if (mounted) {
        AppPopups.error(
          context,
          message: 'ছবি আপলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করো।',
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  Future<void> _saveAvatarToDatabase(String? avatarUrl) async {
    setState(() => _isUploading = true);
    try {
      final supabase = Supabase.instance.client;
      final userId = widget.user.id;

      await supabase.from('users').update({
        'avatar_url': avatarUrl,
      }).eq('id', userId);

      // Invalidate cache
      final prefs = ref.read(sharedPreferencesProvider);
      await prefs.remove('profile_$userId');
      ref.invalidate(userProfileProvider);

      if (mounted) {
        Navigator.pop(context);
        AppPopups.success(
          context,
          message: 'প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে!',
        );
      }
    } catch (e) {
      if (mounted) {
        AppPopups.error(
          context,
          message: 'প্রোফাইল ছবি পরিবর্তন করা যায়নি। আবার চেষ্টা করো।',
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F0F11) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Title Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'প্রোফাইল ছবি পরিবর্তন',
                    style: TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(LucideIcons.x, size: 20),
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Current Preview with Glow
              Center(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF059669).withValues(alpha: isDark ? 0.35 : 0.15),
                            blurRadius: 20,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: UserAvatar(
                        avatarUrl: _selectedAvatarUrl,
                        name: widget.user.name,
                        gender: widget.user.gender,
                        id: widget.user.id,
                        size: 96,
                        showBorder: true,
                        borderColor: const Color(0xFF059669),
                        borderWidth: 3,
                      ),
                    ),
                    if (_isUploading)
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.black.withValues(alpha: 0.5),
                        ),
                        child: const Center(
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Action Buttons Row (Upload Image & Random Avatar)
              Row(
                children: [
                  Expanded(
                    child: _ActionButton(
                      icon: LucideIcons.image,
                      label: 'ছবি আপলোড করো',
                      isDark: isDark,
                      onTap: _isUploading ? null : () => _pickImage(ImageSource.gallery),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _ActionButton(
                      icon: LucideIcons.sparkles,
                      label: 'র‍্যান্ডম কার্টুন',
                      isDark: isDark,
                      onTap: _isUploading ? null : _generateRandomAvatar,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Cartoon Presets Title
              Text(
                'অথবা কার্টুন ছবি বেছে নাও:',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 10),

              // Preset Avatars Grid
              SizedBox(
                height: 72,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  itemCount: _presets.length,
                  separatorBuilder: (_, index) => const SizedBox(width: 10),
                  itemBuilder: (context, index) {
                    final presetUrl = _presets[index];
                    final isSelected = _selectedAvatarUrl == presetUrl;

                    return GestureDetector(
                      onTap: _isUploading
                          ? null
                          : () {
                              setState(() => _selectedAvatarUrl = presetUrl);
                            },
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isSelected ? const Color(0xFF059669) : Colors.transparent,
                            width: 2.5,
                          ),
                        ),
                        child: UserAvatar(
                          avatarUrl: presetUrl,
                          name: widget.user.name,
                          size: 58,
                          showBorder: false,
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 22),

              // Save Selected Button
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _isUploading ? null : () => _saveAvatarToDatabase(_selectedAvatarUrl),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: _isUploading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'প্রোফাইল ছবি সেভ করো',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'HindSiliguri',
                            color: Colors.white,
                          ),
                        ),
                ),
              ),

              // Optional: Reset to initials
              if (_selectedAvatarUrl != null) ...[
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _isUploading ? null : () => _saveAvatarToDatabase(null),
                  child: const Text(
                    'ছবি মুছে ফেলো (রিসেট)',
                    style: TextStyle(
                      color: Color(0xFFEF4444),
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'HindSiliguri',
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isDark;
  final VoidCallback? onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF18181B) : const Color(0xFFFAFAFA),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: const Color(0xFF059669)),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? Colors.white : const Color(0xFF1E293B),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
