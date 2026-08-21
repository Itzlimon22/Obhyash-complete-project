import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/utils/app_popups.dart';

// ─── Domain Models ────────────────────────────────────────────────────────────

class AppFeatureRequest {
  final String id;
  final String userId;
  final String title;
  final String category;
  final String description;
  final String status;
  final String? adminFeedback;
  final int upvotesCount;
  final DateTime createdAt;

  const AppFeatureRequest({
    required this.id,
    required this.userId,
    required this.title,
    required this.category,
    required this.description,
    required this.status,
    this.adminFeedback,
    this.upvotesCount = 0,
    required this.createdAt,
  });

  factory AppFeatureRequest.fromJson(Map<String, dynamic> json) {
    return AppFeatureRequest(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      category: json['category']?.toString() ?? 'Other',
      description: json['description']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Under Review',
      adminFeedback: json['admin_feedback']?.toString(),
      upvotesCount: (json['upvotes_count'] as num?)?.toInt() ?? 0,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

// ─── Categories & Status ───────────────────────────────────────────────────────

class _CategoryItem {
  final String id;
  final String label;

  const _CategoryItem({required this.id, required this.label});
}

const _categories = [
  _CategoryItem(id: 'Exam & Practice', label: 'এক্সাম ও প্র্যাকটিস'),
  _CategoryItem(id: 'Analytics & Tracking', label: 'অ্যানালিটিক্স'),
  _CategoryItem(id: 'Study Tools', label: 'স্টাডি টুলস'),
  _CategoryItem(id: 'UI & Theme', label: 'ইউআই ও ডিজাইন'),
  _CategoryItem(id: 'Other', label: 'অন্যান্য'),
];

class _StatusBadgeConfig {
  final String label;
  final Color bg;
  final Color text;
  final Color darkBg;
  final Color darkText;

  const _StatusBadgeConfig({
    required this.label,
    required this.bg,
    required this.text,
    required this.darkBg,
    required this.darkText,
  });
}

const _statusMap = {
  'Under Review': _StatusBadgeConfig(
    label: 'বিবেচনাধীন',
    bg: Color(0xFFFEF3C7),
    text: Color(0xFFB45309),
    darkBg: Color(0x33B45309),
    darkText: Color(0xFFFCD34D),
  ),
  'Planned': _StatusBadgeConfig(
    label: 'পরিকল্পিত',
    bg: Color(0xFFDBEAFE),
    text: Color(0xFF1D4ED8),
    darkBg: Color(0x331D4ED8),
    darkText: Color(0xFF93C5FD),
  ),
  'In Progress': _StatusBadgeConfig(
    label: 'কাজ চলছে',
    bg: Color(0xFFEDE9FE),
    text: Color(0xFF6D28D9),
    darkBg: Color(0x336D28D9),
    darkText: Color(0xFFC4B5FD),
  ),
  'Completed': _StatusBadgeConfig(
    label: 'যুক্ত হয়েছে',
    bg: Color(0xFFDCFCE7),
    text: Color(0xFF15803D),
    darkBg: Color(0x3315803D),
    darkText: Color(0xFF86EFAC),
  ),
  'Declined': _StatusBadgeConfig(
    label: 'বাতিল',
    bg: Color(0xFFF3F4F6),
    text: Color(0xFF4B5563),
    darkBg: Color(0x334B5563),
    darkText: Color(0xFF9CA3AF),
  ),
};

const _upcomingRoadmap = [
  {
    'title': 'AI স্মার্ট ব্যাখ্যা ও দুর্বলতা বিশ্লেষণ',
    'status': 'কাজ চলছে',
    'statusType': 'In Progress',
    'description': 'ভুল উত্তরের জন্য এআই ভিত্তিক তাৎক্ষণিক ব্যাখ্যা ও কনসেপ্ট রিভিশন গাইড।',
  },
  {
    'title': 'লাইভ কুইজ ব্যাটল',
    'status': 'পরিকল্পিত',
    'statusType': 'Planned',
    'description': 'বন্ধুদের সাথে রিয়েল-টাইমে প্রতিযোগিতামূলক লাইভ কুইজ খেলার সুবিধা।',
  },
  {
    'title': 'অফলাইন রিভিশন মোড',
    'status': 'পরিকল্পিত',
    'statusType': 'Planned',
    'description': 'ইন্টারনেট ছাড়াই সেভ করা প্র্যাকটিস সেট ও বুকমার্ক করা প্রশ্ন রিভিশন।',
  },
  {
    'title': 'অডিও ব্যাখ্যা ও পডকাস্ট লার্নিং',
    'status': 'বিবেচনাধীন',
    'statusType': 'Under Review',
    'description': 'চলাফেরার সময় বা বিশ্রামে শোনার মাধ্যমে কঠিন টপিক রিভিশন।',
  },
];

// ─── Main View ────────────────────────────────────────────────────────────────

class FeatureRequestsView extends ConsumerStatefulWidget {
  const FeatureRequestsView({super.key});

  @override
  ConsumerState<FeatureRequestsView> createState() =>
      _FeatureRequestsViewState();
}

class _FeatureRequestsViewState extends ConsumerState<FeatureRequestsView> {
  int _selectedTabIndex = 0; // 0 = New Request, 1 = My Requests
  String _selectedCategory = 'Exam & Practice';
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  bool _isLoading = false;
  bool _isSuccess = false;

  List<AppFeatureRequest> _myRequests = [];
  bool _isLoadingRequests = false;

  final supabase = Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    _fetchMyRequests();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _fetchMyRequests() async {
    final user = supabase.auth.currentUser;
    if (user == null) return;

    setState(() => _isLoadingRequests = true);
    try {
      final response = await supabase
          .from('app_feature_requests')
          .select()
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _myRequests = (response as List)
              .map((e) => AppFeatureRequest.fromJson(e))
              .toList();
        });
      }
    } catch (e) {
      debugPrint('[FeatureRequestsView] Error fetching requests: $e');
    } finally {
      if (mounted) setState(() => _isLoadingRequests = false);
    }
  }

  Future<void> _handleSubmit() async {
    final title = _titleController.text.trim();
    final description = _descriptionController.text.trim();

    if (title.length < 2) {
      AppPopups.warning(
        context,
        message: 'ফিচারের একটি সংক্ষিপ্ত শিরোনাম লেখো (কমপক্ষে ২ অক্ষর)',
      );
      return;
    }
    if (description.length < 4) {
      AppPopups.warning(
        context,
        message: 'ফিচারটির বিবরণ আরও একটু বিস্তারিত লেখো',
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final user = supabase.auth.currentUser;
      if (user == null) {
        throw Exception('ফিচার প্রস্তাব পাঠাতে প্রথমে লগইন করো');
      }

      await supabase.from('app_feature_requests').insert({
        'user_id': user.id,
        'category': _selectedCategory,
        'title': title,
        'description': description,
        'status': 'Under Review',
      });

      if (mounted) {
        HapticFeedback.mediumImpact();
        setState(() => _isSuccess = true);
        _fetchMyRequests();
        AppPopups.success(
          context,
          message: 'ফিচারের প্রস্তাব সফলভাবে জমা দেওয়া হয়েছে!',
        );
      }
    } catch (e) {
      debugPrint('[FeatureRequestsView] Submit error: $e');
      if (mounted) {
        final rawMsg = e.toString();
        // Check for Bengali backend constraint/trigger messages
        if (rawMsg.contains('কমপক্ষে') ||
            rawMsg.contains('অপেক্ষা') ||
            rawMsg.contains('সীমা') ||
            rawMsg.contains('ইতিপূর্বে') ||
            rawMsg.contains('সর্বোচ্চ')) {
          final cleanMsg = rawMsg
              .replaceAll(RegExp(r'^Exception:\s*|PostgrestException\(message:\s*|,\s*code:.*$'), '')
              .trim();
          AppPopups.warning(context, message: cleanMsg);
        } else if (e is PostgrestException) {
          AppPopups.error(context, message: e.message);
        } else {
          AppPopups.error(
            context,
            message: 'প্রস্তাব পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করো।',
          );
        }
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleReset() {
    setState(() {
      _isSuccess = false;
      _selectedCategory = 'Exam & Practice';
      _titleController.clear();
      _descriptionController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _fetchMyRequests();
    });

    if (_isSuccess) {
      return Scaffold(
        backgroundColor:
            isDark ? const Color(0xFF0F0F11) : const Color(0xFFF9FAFB),
        body: _buildSuccessState(isDark),
      );
    }

    return Scaffold(
      backgroundColor:
          isDark ? const Color(0xFF0F0F11) : const Color(0xFFF9FAFB),
      body: Column(
        children: [
          // Sticky Top Segmented Tabs
          Container(
            color: isDark ? const Color(0xFF0F0F11) : const Color(0xFFF9FAFB),
            padding: const EdgeInsets.fromLTRB(10, 12, 10, 8),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF18181B)
                    : const Color(0xFFE5E7EB),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _buildTabItem(
                      label: 'নতুন প্রস্তাব',
                      isSelected: _selectedTabIndex == 0,
                      onTap: () => setState(() => _selectedTabIndex = 0),
                      isDark: isDark,
                    ),
                  ),
                  Expanded(
                    child: _buildTabItem(
                      label: _myRequests.isEmpty
                          ? 'আমার প্রস্তাব'
                          : 'আমার প্রস্তাব (${_myRequests.length})',
                      isSelected: _selectedTabIndex == 1,
                      onTap: () {
                        setState(() {
                          _selectedTabIndex = 1;
                          _fetchMyRequests();
                        });
                      },
                      isDark: isDark,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Scrollable Content
          Expanded(
            child: RefreshIndicator(
              onRefresh: _fetchMyRequests,
              color: const Color(0xFF059669),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_selectedTabIndex == 0) ...[
                      _buildNewRequestForm(isDark),
                      const SizedBox(height: 28),
                      _buildUpcomingRoadmapSection(isDark),
                    ] else ...[
                      _buildMyRequestsList(isDark),
                    ],
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabItem({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? const Color(0xFF27272A) : Colors.white)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(9),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            fontFamily: 'HindSiliguri',
            color: isSelected
                ? (isDark ? Colors.white : const Color(0xFF111827))
                : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280)),
          ),
        ),
      ),
    );
  }

  // ─── New Request Form ───────────────────────────────────────────────────────

  Widget _buildNewRequestForm(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Clean intro
          Text(
            'অ্যাপে নতুন কী দেখতে চাও?',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : const Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'তোমার আইডিয়া বা ফিচারের প্রস্তাব আমাদের সাথে শেয়ার করো।',
            style: TextStyle(
              fontSize: 13,
              fontFamily: 'HindSiliguri',
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
            ),
          ),
          const SizedBox(height: 18),

          // Category Chips
          Text(
            'ক্যাটাগরি নির্বাচন করো',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              fontFamily: 'HindSiliguri',
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _categories.map((cat) {
              final isSelected = _selectedCategory == cat.id;
              return ChoiceChip(
                label: Text(
                  cat.label,
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected
                        ? Colors.white
                        : (isDark ? const Color(0xFFD4D4D8) : const Color(0xFF4B5563)),
                  ),
                ),
                selected: isSelected,
                onSelected: (selected) {
                  if (selected) {
                    setState(() => _selectedCategory = cat.id);
                  }
                },
                selectedColor: const Color(0xFF059669),
                backgroundColor: isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6),
                side: BorderSide(
                  color: isSelected
                      ? const Color(0xFF059669)
                      : (isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E7EB)),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                showCheckmark: false,
              );
            }).toList(),
          ),
          const SizedBox(height: 18),

          // Title Input
          Text(
            'ফিচারের নাম / সংক্ষিপ্ত বিবরণ',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              fontFamily: 'HindSiliguri',
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _titleController,
            style: TextStyle(
              fontSize: 16,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : Colors.black87,
            ),
            decoration: InputDecoration(
              hintText: 'যেমন: ওএমআর শীটে ভুল উত্তর দ্রুত রিভিউর সুবিধা',
              hintStyle: TextStyle(
                fontSize: 13,
                fontFamily: 'HindSiliguri',
                color: isDark ? const Color(0xFF71717A) : const Color(0xFF9CA3AF),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              filled: true,
              fillColor: isDark ? const Color(0xFF27272A) : const Color(0xFFFAFAFA),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E7EB),
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E7EB),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFF059669), width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Description Input
          Text(
            'বিস্তারিত বিবরণ',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              fontFamily: 'HindSiliguri',
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _descriptionController,
            maxLines: 4,
            style: TextStyle(
              fontSize: 16,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : Colors.black87,
            ),
            decoration: InputDecoration(
              hintText: 'ফিচারটি কীভাবে কাজ করবে এবং এটি কেন দরকার তা লেখো...',
              hintStyle: TextStyle(
                fontSize: 13,
                fontFamily: 'HindSiliguri',
                color: isDark ? const Color(0xFF71717A) : const Color(0xFF9CA3AF),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              filled: true,
              fillColor: isDark ? const Color(0xFF27272A) : const Color(0xFFFAFAFA),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E7EB),
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E7EB),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFF059669), width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Submit Button
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handleSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'প্রস্তাব জমা দাও',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── My Requests List ───────────────────────────────────────────────────────

  Widget _buildMyRequestsList(bool isDark) {
    if (_isLoadingRequests) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: Center(
          child: CircularProgressIndicator(
            color: Color(0xFF059669),
            strokeWidth: 2,
          ),
        ),
      );
    }

    if (_myRequests.isEmpty) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF18181B) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
          ),
        ),
        child: Column(
          children: [
            Text(
              'কোনো প্রস্তাব পাওয়া যায়নি',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white : const Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'তোমার কোনো ফিচারের আইডিয়া থাকলে তা লিখে আমাদের জানাতে পারো।',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                fontFamily: 'HindSiliguri',
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
              ),
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => setState(() => _selectedTabIndex = 0),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFF059669)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              ),
              child: const Text(
                'নতুন প্রস্তাব দাও',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'HindSiliguri',
                  color: Color(0xFF059669),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _myRequests.length,
      separatorBuilder: (_, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final req = _myRequests[index];
        final statusCfg = _statusMap[req.status] ??
            const _StatusBadgeConfig(
              label: 'বিবেচনাধীন',
              bg: Color(0xFFFEF3C7),
              text: Color(0xFFB45309),
              darkBg: Color(0x33B45309),
              darkText: Color(0xFFFCD34D),
            );

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row: Title & Status Badge
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      req.title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF111827),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: isDark ? statusCfg.darkBg : statusCfg.bg,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      statusCfg.label,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? statusCfg.darkText : statusCfg.text,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),

              // Description
              Text(
                req.description,
                style: TextStyle(
                  fontSize: 13,
                  fontFamily: 'HindSiliguri',
                  height: 1.4,
                  color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF4B5563),
                ),
              ),
              const SizedBox(height: 10),

              // Admin Feedback if available
              if (req.adminFeedback != null && req.adminFeedback!.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(10),
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'এডমিন ফিডব্যাক: ',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'HindSiliguri',
                          color: isDark ? Colors.white : const Color(0xFF111827),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          req.adminFeedback!,
                          style: TextStyle(
                            fontSize: 12,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF4B5563),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // Footer: Category & Date
              Text(
                '${req.category} • ${DateFormat('dd MMM, yyyy').format(req.createdAt)}',
                style: TextStyle(
                  fontSize: 12,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? const Color(0xFF71717A) : const Color(0xFF9CA3AF),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ─── Upcoming Roadmap Section ───────────────────────────────────────────────

  Widget _buildUpcomingRoadmapSection(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'আসন্ন ফিচারসমূহ',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            fontFamily: 'HindSiliguri',
            color: isDark ? Colors.white : const Color(0xFF111827),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'যেসব নতুন ফিচার নিয়ে আমরা কাজ করছি:',
          style: TextStyle(
            fontSize: 13,
            fontFamily: 'HindSiliguri',
            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
          ),
        ),
        const SizedBox(height: 12),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _upcomingRoadmap.length,
          separatorBuilder: (_, index) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final item = _upcomingRoadmap[index];
            final statusType = item['statusType'] ?? 'Planned';
            final statusCfg = _statusMap[statusType] ??
                const _StatusBadgeConfig(
                  label: 'পরিকল্পিত',
                  bg: Color(0xFFDBEAFE),
                  text: Color(0xFF1D4ED8),
                  darkBg: Color(0x331D4ED8),
                  darkText: Color(0xFF93C5FD),
                );

            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item['title']!,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? Colors.white : const Color(0xFF111827),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                        decoration: BoxDecoration(
                          color: isDark ? statusCfg.darkBg : statusCfg.bg,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          item['status']!,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? statusCfg.darkText : statusCfg.text,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item['description']!,
                    style: TextStyle(
                      fontSize: 12,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  // ─── Success View ───────────────────────────────────────────────────────────

  Widget _buildSuccessState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Color(0xFFECFDF5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.check,
                color: Color(0xFF059669),
                size: 36,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'প্রস্তাব সফলভাবে জমা হয়েছে!',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white : const Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'আমাদের টিম তোমার আইডিয়াটি পর্যালোচনা করে অ্যাপে যুক্ত করার ব্যবস্থা করবে।',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                fontFamily: 'HindSiliguri',
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _handleReset,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: const Text(
                'আরেকটি প্রস্তাব দাও',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'HindSiliguri',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
