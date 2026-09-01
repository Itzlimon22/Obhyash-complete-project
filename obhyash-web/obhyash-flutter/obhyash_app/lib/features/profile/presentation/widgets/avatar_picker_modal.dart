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
class _AvatarCategory {
  final String id;
  final String label;
  final IconData icon;

  const _AvatarCategory({
    required this.id,
    required this.label,
    required this.icon,
  });
}

class _PresetItem {
  final String url;
  final String title;
  final String categoryId;

  const _PresetItem({
    required this.url,
    required this.title,
    required this.categoryId,
  });
}

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
  String _selectedCategory = 'all';

  static const List<_AvatarCategory> _categories = [
    _AvatarCategory(id: 'all', label: 'সব', icon: LucideIcons.layers),
    _AvatarCategory(id: 'boys', label: 'ছাত্র', icon: LucideIcons.user),
    _AvatarCategory(id: 'girls', label: 'ছাত্রী', icon: LucideIcons.userCheck),
    _AvatarCategory(id: 'scholars', label: 'টপার ও স্কলার', icon: LucideIcons.glasses),
    _AvatarCategory(id: 'anime', label: 'অ্যানিমে', icon: LucideIcons.zap),
    _AvatarCategory(id: 'mascots', label: 'ম্যাসকট ও বট', icon: LucideIcons.bot),
  ];

  late final List<_PresetItem> _allPresets;

  @override
  void initState() {
    super.initState();
    _selectedAvatarUrl = widget.user.avatarUrl;
    _allPresets = _buildStudentPresets();
  }

  List<_PresetItem> _buildStudentPresets() {
    final seedBase = widget.user.id.isNotEmpty ? widget.user.id.substring(0, 4) : 'obh';
    final userGender = (widget.user.gender ?? 'other').toLowerCase();

    final presets = <_PresetItem>[];

    // 1. Personalized User Dynamic Presets
    if (userGender == 'female') {
      presets.add(_PresetItem(
        url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=${seedBase}_u1&scale=115&radius=0&backgroundColor=ffd5dc',
        title: 'তোমার বিশেষ ১',
        categoryId: 'girls',
      ));
      presets.add(_PresetItem(
        url: 'https://api.dicebear.com/7.x/personas/svg?seed=${seedBase}_u2&scale=115&radius=0&backgroundColor=b6e3f4',
        title: 'তোমার বিশেষ ২',
        categoryId: 'girls',
      ));
    } else {
      presets.add(_PresetItem(
        url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=${seedBase}_u1&scale=115&radius=0&backgroundColor=b6e3f4',
        title: 'তোমার বিশেষ ১',
        categoryId: 'boys',
      ));
      presets.add(_PresetItem(
        url: 'https://api.dicebear.com/7.x/personas/svg?seed=${seedBase}_u2&scale=115&radius=0&backgroundColor=d1d4f9',
        title: 'তোমার বিশেষ ২',
        categoryId: 'boys',
      ));
    }

    // 2. Student Boys Collection (ছাত্র)
    final boys = [
      ('Felix', 'adventurer', 'স্মার্ট ছাত্র', 'b6e3f4'),
      ('Liam', 'personas', 'কলেজ বয়', 'd1d4f9'),
      ('Alexander', 'adventurer', 'কুল স্টুডেন্ট', 'c0aede'),
      ('Ethan', 'micah', 'মডার্ন লুক', 'ffdfbf'),
      ('Aiden', 'adventurer', 'হাসিখুশি', 'bbf7d0'),
      ('Lucas', 'personas', 'ব্রাইট বয়', 'ffd5dc'),
      ('Oliver', 'avataaars', 'স্টাডি বয়', 'b6e3f4'),
      ('Jack', 'adventurer', 'অ্যাক্টিভ ছাত্র', 'd1d4f9'),
      ('Noah', 'personas', 'ভদ্র ছাত্র', 'ffdfbf'),
      ('Leo', 'micah', 'মেধাবী বয়', 'c0aede'),
      ('Caleb', 'adventurer', 'ক্যাম্পাস বয়', 'ffd5dc'),
      ('Ryan', 'personas', 'স্কুল বয়', 'b6e3f4'),
    ];

    for (final (seed, style, title, bg) in boys) {
      presets.add(_PresetItem(
        url: 'https://api.dicebear.com/7.x/$style/svg?seed=$seed&scale=115&radius=0&backgroundColor=$bg',
        title: title,
        categoryId: 'boys',
      ));
    }

    // 3. Student Girls Collection (ছাত্রী)
    final girls = [
      ('Sophia', 'lorelei', 'স্মার্ট ছাত্রী', 'ffd5dc'),
      ('Emma', 'personas', 'কলেজ গার্ল', 'ffdfbf'),
      ('Mia', 'adventurer', 'অ্যাডভেঞ্চারাস', 'b6e3f4'),
      ('Olivia', 'lorelei', 'ব্রিলিয়ান্ট', 'd1d4f9'),
      ('Ava', 'micah', 'কিউট ছাত্রী', 'bbf7d0'),
      ('Isabella', 'personas', 'টপার গার্ল', 'ffd5dc'),
      ('Amelia', 'lorelei', 'মেধাবী ছাত্রী', 'c0aede'),
      ('Harper', 'avataaars', 'স্টুডেন্ট গার্ল', 'b6e3f4'),
      ('Evelyn', 'lorelei', 'শান্ত ছাত্রী', 'ffdfbf'),
      ('Emily', 'adventurer', 'হাসিখুশি', 'd1d4f9'),
      ('Maya', 'lorelei', 'ক্যাম্পাস কুইন', 'bbf7d0'),
      ('Lily', 'personas', 'স্বপ্নবাজ', 'c0aede'),
    ];

    for (final (seed, style, title, bg) in girls) {
      presets.add(_PresetItem(
        url: 'https://api.dicebear.com/7.x/$style/svg?seed=$seed&scale=115&radius=0&backgroundColor=$bg',
        title: title,
        categoryId: 'girls',
      ));
    }

    // 4. Scholars & Toppers (টপার ও স্কলার - চশমা ও সিরিয়াস স্টাডি লুক)
    final scholars = [
      ('Zoe', 'lorelei', 'স্কলার গার্ল', 'b6e3f4', true),
      ('Mason', 'adventurer', 'স্কলার বয়', 'ffd5dc', true),
      ('Daniel', 'personas', 'ক্লাস টপার', 'd1d4f9', false),
      ('James', 'avataaars', 'বুকওয়ার্ম', 'c0aede', false),
      ('Chloe', 'micah', 'সাইন্স ফ্যান', 'bbf7d0', true),
      ('Grace', 'personas', 'স্টাডি স্টার', 'ffdfbf', false),
      ('Benjamin', 'adventurer', 'ম্যাথ জিনিয়াস', 'b6e3f4', true),
      ('Hannah', 'lorelei', 'রিসার্চার', 'ffd5dc', true),
    ];

    for (final (seed, style, title, bg, glasses) in scholars) {
      final extra = glasses ? '&glassesProbability=100' : '';
      presets.add(_PresetItem(
        url: 'https://api.dicebear.com/7.x/$style/svg?seed=$seed$extra&scale=115&radius=0&backgroundColor=$bg',
        title: title,
        categoryId: 'scholars',
      ));
    }

    // 5. Anime & Stylized (অ্যানিমে ও স্টাইলিশ)
    final anime = [
      ('Kaito', 'adventurer', 'অ্যানিমে হিরো', 'd1d4f9'),
      ('Sakura', 'lorelei', 'সাকুরা', 'ffd5dc'),
      ('Ren', 'adventurer', 'অ্যানিমে রেন', 'c0aede'),
      ('Sunny', 'big-smile', 'স্মাইলি স্টার', 'ffdfbf'),
      ('Joy', 'big-smile', 'জয়ফুল', 'bbf7d0'),
      ('Luna', 'adventurer', 'লুনা', 'b6e3f4'),
      ('Kenji', 'adventurer', 'অ্যাকশন বয়', 'ffd5dc'),
      ('Hinata', 'lorelei', 'হিনাটা', 'd1d4f9'),
    ];

    for (final (seed, style, title, bg) in anime) {
      presets.add(_PresetItem(
        url: 'https://api.dicebear.com/7.x/$style/svg?seed=$seed&scale=115&radius=0&backgroundColor=$bg',
        title: title,
        categoryId: 'anime',
      ));
    }

    // 6. Mascots & Bots (ম্যাসকট ও বট)
    final mascots = [
      ('StudyBot', 'bottts', 'স্টাডি বট', 'b6e3f4'),
      ('QuizMaster', 'bottts', 'কুইজ মাস্টার', 'd1d4f9'),
      ('StarStudent', 'fun-emoji', 'স্টার ইমোজি', 'ffd5dc'),
      ('Genius', 'fun-emoji', 'জিনিয়াস', 'ffdfbf'),
      ('CyberChamp', 'bottts', 'সাইবার চ্যাম্প', 'c0aede'),
      ('Champ', 'fun-emoji', 'চ্যাম্পিয়ন', 'bbf7d0'),
    ];

    for (final (seed, style, title, bg) in mascots) {
      presets.add(_PresetItem(
        url: 'https://api.dicebear.com/7.x/$style/svg?seed=$seed&scale=115&radius=0&backgroundColor=$bg',
        title: title,
        categoryId: 'mascots',
      ));
    }

    return presets;
  }

  List<_PresetItem> get _filteredPresets {
    if (_selectedCategory == 'all') {
      return _allPresets;
    }
    return _allPresets.where((p) => p.categoryId == _selectedCategory).toList();
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
    final filtered = _filteredPresets;
    final screenHeight = MediaQuery.of(context).size.height;

    return Container(
      constraints: BoxConstraints(
        maxHeight: screenHeight * 0.88,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F0F11) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header Row
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 12, 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF059669).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          LucideIcons.layers,
                          size: 18,
                          color: Color(0xFF059669),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'অবতার ও প্রোফাইল ছবি',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'HindSiliguri',
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(LucideIcons.x, size: 20),
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                  ),
                ],
              ),
            ),

            // Scrollable Content
            Flexible(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Current Preview with Glow & Active Badge
                    Center(
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            width: 92,
                            height: 92,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF059669).withValues(alpha: isDark ? 0.4 : 0.2),
                                  blurRadius: 22,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: UserAvatar(
                              avatarUrl: _selectedAvatarUrl,
                              name: widget.user.name,
                              gender: widget.user.gender,
                              id: widget.user.id,
                              size: 92,
                              showBorder: true,
                              borderColor: const Color(0xFF059669),
                              borderWidth: 3,
                            ),
                          ),
                          if (_isUploading)
                            Container(
                              width: 92,
                              height: 92,
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
                    const SizedBox(height: 14),

                    // Action Buttons Row (Upload Custom Photo & Random Avatar)
                    Row(
                      children: [
                        Expanded(
                          child: _ActionButton(
                            icon: LucideIcons.camera,
                            label: 'কাস্টম ছবি আপলোড',
                            isDark: isDark,
                            onTap: _isUploading ? null : () => _pickImage(ImageSource.gallery),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _ActionButton(
                            icon: LucideIcons.dices,
                            label: 'র‍্যান্ডম জেনারেট',
                            isDark: isDark,
                            onTap: _isUploading ? null : _generateRandomAvatar,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Category Filter Section Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'শিক্ষার্থী অবতার কালেকশন:',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569),
                          ),
                        ),
                        Text(
                          '${filtered.length} টি অবতার',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'HindSiliguri',
                            color: const Color(0xFF059669),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Horizontal Category Chips
                    SizedBox(
                      height: 36,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        itemCount: _categories.length,
                        separatorBuilder: (_, i) => const SizedBox(width: 8),
                        itemBuilder: (context, idx) {
                          final cat = _categories[idx];
                          final isSelected = _selectedCategory == cat.id;

                          return InkWell(
                            onTap: () => setState(() => _selectedCategory = cat.id),
                            borderRadius: BorderRadius.circular(20),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? const Color(0xFF059669)
                                    : (isDark ? const Color(0xFF18181B) : const Color(0xFFF1F5F9)),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: isSelected
                                      ? const Color(0xFF059669)
                                      : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    cat.icon,
                                    size: 14,
                                    color: isSelected
                                        ? Colors.white
                                        : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B)),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    cat.label,
                                    style: TextStyle(
                                      fontSize: 12.5,
                                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                      fontFamily: 'HindSiliguri',
                                      color: isSelected
                                          ? Colors.white
                                          : (isDark ? const Color(0xFFE4E4E7) : const Color(0xFF334155)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Avatar Grid Gallery
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 4,
                        mainAxisSpacing: 14,
                        crossAxisSpacing: 14,
                        childAspectRatio: 1.0,
                      ),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final preset = filtered[index];
                        final isSelected = _selectedAvatarUrl == preset.url;

                        return Center(
                          child: GestureDetector(
                            onTap: _isUploading
                                ? null
                                : () {
                                    setState(() => _selectedAvatarUrl = preset.url);
                                  },
                            child: Stack(
                              clipBehavior: Clip.none,
                              children: [
                                AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  padding: const EdgeInsets.all(3),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: isSelected
                                          ? const Color(0xFF059669)
                                          : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
                                      width: isSelected ? 3.0 : 1.5,
                                    ),
                                    boxShadow: isSelected
                                        ? [
                                            BoxShadow(
                                              color: const Color(0xFF059669).withValues(alpha: 0.35),
                                              blurRadius: 10,
                                              offset: const Offset(0, 2),
                                            ),
                                          ]
                                        : null,
                                  ),
                                  child: UserAvatar(
                                    avatarUrl: preset.url,
                                    name: widget.user.name,
                                    size: 58,
                                    showBorder: false,
                                  ),
                                ),
                                // Selected Checkmark Badge
                                if (isSelected)
                                  Positioned(
                                    bottom: 0,
                                    right: 0,
                                    child: Container(
                                      padding: const EdgeInsets.all(3),
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF059669),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        LucideIcons.check,
                                        size: 11,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 14),
                  ],
                ),
              ),
            ),

            // Bottom Save Bar
            Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F0F11) : Colors.white,
                border: Border(
                  top: Border(
                    top: BorderSide(
                      color: isDark ? const Color(0xFF1E1E24) : const Color(0xFFF1F5F9),
                    ),
                  ).top,
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
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
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(LucideIcons.checkCircle2, size: 18, color: Colors.white),
                                SizedBox(width: 8),
                                Text(
                                  'অবতার সেভ করো',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    fontFamily: 'HindSiliguri',
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                  if (_selectedAvatarUrl != null) ...[
                    const SizedBox(height: 6),
                    TextButton(
                      onPressed: _isUploading ? null : () => _saveAvatarToDatabase(null),
                      child: const Text(
                        'ছবি মুছে ফেলো (নামের প্রথম অক্ষরে রিসেট)',
                        style: TextStyle(
                          color: Color(0xFFEF4444),
                          fontSize: 12.5,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
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
        padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 10),
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
                  fontSize: 12.5,
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
