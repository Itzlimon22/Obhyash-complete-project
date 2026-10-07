import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';


import '../../../../core/constants/app_icons.dart';
import '../../../../core/presentation/widgets/app_icon.dart';
import '../../../../core/presentation/widgets/app_refresh_indicator.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import '../../formulas/models/formula_models.dart';
import '../services/notes_r2_service.dart';

class PorashonaView extends ConsumerStatefulWidget {
  final String initialTab;

  const PorashonaView({super.key, this.initialTab = 'formula'});

  @override
  ConsumerState<PorashonaView> createState() => _PorashonaViewState();
}

class _PorashonaViewState extends ConsumerState<PorashonaView> {
  late String _activeTab;

  @override
  void initState() {
    super.initState();
    _activeTab = widget.initialTab;
    _initNotesManifest();
  }

  Future<void> _initNotesManifest() async {
    await NotesR2Service.loadFromLocalCache();
    if (mounted) setState(() {});
    await NotesR2Service.fetchAvailablePdfs();
    if (mounted) setState(() {});
  }


  void _handleNoteCategoryTap(String title) {
    context.push(
      '/notes-category',
      extra: {'categoryTitle': title},
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final userProfile = ref.watch(userProfileProvider).value;
    final subjects = getPersonalizedFormulaSubjects(
      level: userProfile?.level,
      stream: userProfile?.stream,
      batch: userProfile?.batch,
      division: userProfile?.division,
      target: userProfile?.target,
      examTarget: userProfile?.examTarget,
      optionalSubject: userProfile?.optionalSubject,
    );

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFFAFAF9),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFFAFAF9),
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: isDark ? Colors.white : const Color(0xFF18181B),
          ),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
        title: Text(
          _activeTab == 'notes'
              ? 'নোটস'
              : (_activeTab == 'concepts' ? 'কনসেপ্টস' : 'ফর্মুলা'),
          style: TextStyle(
            fontSize: 17.5,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : const Color(0xFF18181B),
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        bottom: false,
        child: _activeTab == 'formula'
            ? Padding(
                padding: const EdgeInsets.fromLTRB(10, 14, 10, 0),
                child: AppRefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(userProfileProvider);
                    try {
                      await ref.read(userProfileProvider.future);
                    } catch (_) {}
                  },
                  child: GridView.builder(
                    padding: const EdgeInsets.only(bottom: 12),
                    physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics(),
                    ),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                      childAspectRatio: 1.15,
                    ),
                    itemCount: subjects.length,
                    itemBuilder: (context, index) {
                      final subject = subjects[index];
                      return _PorashonaSubjectCard(
                        key: ValueKey(subject.subjectId),
                        subject: subject,
                        isDark: isDark,
                      );
                    },
                  ),
                ),
              )
            : (_activeTab == 'notes'
                ? Padding(
                    padding: const EdgeInsets.fromLTRB(10, 14, 10, 0),
                    child: AppRefreshIndicator(
                      onRefresh: () async {
                        await NotesR2Service.fetchAvailablePdfs(forceRefresh: true);
                        if (mounted) setState(() {});
                      },
                      child: GridView.count(
                        padding: const EdgeInsets.only(bottom: 12),
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 1.15,
                        physics: const AlwaysScrollableScrollPhysics(
                          parent: BouncingScrollPhysics(),
                        ),
                        children: [
                          _NoteCategoryCard(
                            title: 'দ্রুত রিভিশন শিট',
                            svgAsset: 'assets/dashboard-icons/note_revision.svg',
                            count: NotesR2Service.getPdfCountForCategory('দ্রুত রিভিশন শিট'),
                            gradientColors: const [
                              Color(0xFF4F46E5),
                              Color(0xFF3730A3),
                            ],
                            glowColor: const Color(0xFF6366F1),
                            isDark: isDark,
                            onTap: () => _handleNoteCategoryTap('দ্রুত রিভিশন শিট'),
                          ),
                          _NoteCategoryCard(
                            title: 'অনুশীলনী সমাধান',
                            svgAsset: 'assets/dashboard-icons/note_exercise.svg',
                            count: NotesR2Service.getPdfCountForCategory('অনুশীলনী সমাধান'),
                            gradientColors: const [
                              Color(0xFF0D9488),
                              Color(0xFF115E59),
                            ],
                            glowColor: const Color(0xFF14B8A6),
                            isDark: isDark,
                            onTap: () => _handleNoteCategoryTap('অনুশীলনী সমাধান'),
                          ),
                          _NoteCategoryCard(
                            title: 'হ্যান্ডরিটেন',
                            svgAsset: 'assets/dashboard-icons/note_handwritten.svg',
                            count: NotesR2Service.getPdfCountForCategory('হ্যান্ডরিটেন'),
                            gradientColors: const [
                              Color(0xFFE11D48),
                              Color(0xFF881337),
                            ],
                            glowColor: const Color(0xFFFB7185),
                            isDark: isDark,
                            onTap: () => _handleNoteCategoryTap('হ্যান্ডরিটেন'),
                          ),
                          _NoteCategoryCard(
                            title: 'মাইন্ড ম্যাপস',
                            svgAsset: 'assets/dashboard-icons/note_mindmaps.svg',
                            count: NotesR2Service.getPdfCountForCategory('মাইন্ড ম্যাপস'),
                            gradientColors: const [
                              Color(0xFF7C3AED),
                              Color(0xFF581C87),
                            ],
                            glowColor: const Color(0xFFA855F7),
                            isDark: isDark,
                            onTap: () => _handleNoteCategoryTap('মাইন্ড ম্যাপস'),
                          ),
                        ],
                      ),
                    ),
                  )
                : _buildConceptsTab(isDark: isDark)),


      ),
      bottomNavigationBar: PorashonaBottomNav(
        activeTab: _activeTab,
        onTabChange: (tab) {
          setState(() {
            _activeTab = tab;
          });
        },
        onDashboardClick: () {
          if (context.canPop()) {
            context.pop();
          } else {
            context.go('/');
          }
        },
        onUpgradeClick: () {
          context.push('/plan-selection');
        },
      ),
    );
  }

  Widget _buildConceptsTab({required bool isDark}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF1F1F24)
                    : const Color(0xFFF3F4F6),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: const Icon(
                LucideIcons.lightbulb,
                size: 38,
                color: Color(0xFFF59E0B),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'কনসেপ্টস শীঘ্রই আসছে',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : const Color(0xFF18181B),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'গুরুত্বপূর্ণ কনসেপ্ট, শর্টকাট টেকনিক ও অ্যানিমেটেড ভিজ্যুয়াল নিয়ে আমাদের কাজ চলছে। খুব শীঘ্রই এটি সবার জন্য উন্মুক্ত করা হবে।',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13.5,
                height: 1.45,
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PorashonaSubjectCard extends StatefulWidget {
  final SubjectMeta subject;
  final bool isDark;

  const _PorashonaSubjectCard({
    super.key,
    required this.subject,
    required this.isDark,
  });

  @override
  State<_PorashonaSubjectCard> createState() => _PorashonaSubjectCardState();
}

class _PorashonaSubjectCardState extends State<_PorashonaSubjectCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 120),
      vsync: this,
    );
    _scaleAnim = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTap() {
    context.push('/formulas/${widget.subject.subjectId}');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final g = widget.subject.gradientColors;

    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        _handleTap();
      },
      onTapCancel: () => _controller.reverse(),
      child: ScaleTransition(
        scale: _scaleAnim,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(g[0]), Color(g[1])],
            ),
            border: Border.all(
              color: const Color(0xFF059669).withValues(alpha: 0.25),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Color(g[0]).withValues(alpha: isDark ? 0.45 : 0.25),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    if (widget.subject.svgIcon != null)
                      SizedBox(
                        width: 56,
                        height: 56,
                        child: SvgPicture.asset(
                          widget.subject.svgIcon!,
                          fit: BoxFit.contain,
                          placeholderBuilder: (_) => Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              widget.subject.emoji,
                              style: const TextStyle(fontSize: 26),
                            ),
                          ),
                        ),
                      )
                    else
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          widget.subject.emoji,
                          style: const TextStyle(fontSize: 26),
                        ),
                      ),
                    const SizedBox(height: 12),
                    Text(
                      widget.subject.subjectName,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                        height: 1.25,
                      ),
                    ),
                  ],
                ),
              ),
        ),
      ),
    );
  }
}

class PorashonaBottomNav extends StatelessWidget {
  final String activeTab;
  final ValueChanged<String> onTabChange;
  final VoidCallback onDashboardClick;
  final VoidCallback onUpgradeClick;

  const PorashonaBottomNav({
    super.key,
    required this.activeTab,
    required this.onTabChange,
    required this.onDashboardClick,
    required this.onUpgradeClick,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final items = [
      {
        'id': 'dashboard',
        'label': 'ড্যাশবোর্ড',
        'icon': AppIcons.navHome,
        'iconFilled': AppIcons.navHomeFilled,
        'action': 'dashboard',
      },
      {
        'id': 'formula',
        'label': 'ফর্মুলা',
        'icon': AppIcons.navFormula,
        'iconFilled': AppIcons.navFormulaFilled,
        'action': 'tab',
      },
      {
        'id': 'notes',
        'label': 'নোটস',
        'icon': AppIcons.navNotes,
        'iconFilled': AppIcons.navNotesFilled,
        'action': 'tab',
      },
      {
        'id': 'concepts',
        'label': 'কনসেপ্টস',
        'icon': AppIcons.navConcepts,
        'iconFilled': AppIcons.navConceptsFilled,
        'action': 'tab',
      },
      {
        'id': 'upgrade',
        'label': 'Upgrade',
        'icon': AppIcons.navUpgrade,
        'iconFilled': AppIcons.navUpgradeFilled,
        'action': 'upgrade',
      },
    ];

    final activeColor = isDark
        ? const Color(0xFF059669)
        : const Color(0xFF047857);

    final inactiveColor = isDark
        ? const Color(0xFF9CA3AF)
        : const Color(0xFF6B7280);

    final bgColor = isDark
        ? const Color(0xFF0A0D10).withValues(alpha: 0.94)
        : Colors.white.withValues(alpha: 0.95);

    final borderColor = isDark
        ? const Color(0xFF1E232B)
        : const Color(0xFFE5E7EB);

    final bottomInset = MediaQuery.of(context).padding.bottom;
    final safeBottom = bottomInset > 0
        ? (bottomInset * 0.6).clamp(8.0, 22.0)
        : 6.0;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
            border: Border(top: BorderSide(color: borderColor, width: 1.0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.40 : 0.08),
                blurRadius: 20,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: Padding(
            padding: EdgeInsets.only(bottom: safeBottom, top: 4),
            child: SizedBox(
              height: 58,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: items.map((item) {
                  final id = item['id'] as String;
                  final icon = item['icon'] as String;
                  final iconFilled = item['iconFilled'] as String;
                  final label = item['label'] as String;
                  final action = item['action'] as String;

                  final isActive = action == 'tab' && activeTab == id;

                  void handleTap() {
                    if (action == 'dashboard') {
                      onDashboardClick();
                    } else if (action == 'upgrade') {
                      onUpgradeClick();
                    } else {
                      onTabChange(id);
                    }
                  }

                  return Expanded(
                    child: GestureDetector(
                      onTap: handleTap,
                      behavior: HitTestBehavior.opaque,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          AnimatedScale(
                            duration: const Duration(milliseconds: 200),
                            scale: isActive ? 1.08 : 1.0,
                            child: AppIcon(
                              isActive ? iconFilled : icon,
                              size: 23,
                              color: isActive ? activeColor : inactiveColor,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: isActive
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: isActive ? activeColor : inactiveColor,
                              letterSpacing: 0.1,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NoteCategoryCard extends StatefulWidget {
  final String title;
  final String svgAsset;
  final int count;
  final List<Color> gradientColors;
  final Color glowColor;
  final bool isDark;
  final VoidCallback onTap;

  const _NoteCategoryCard({
    required this.title,
    required this.svgAsset,
    this.count = 0,
    required this.gradientColors,
    required this.glowColor,
    required this.isDark,
    required this.onTap,
  });

  @override
  State<_NoteCategoryCard> createState() => _NoteCategoryCardState();
}

class _NoteCategoryCardState extends State<_NoteCategoryCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 120),
      vsync: this,
    );
    _scaleAnim = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final g = widget.gradientColors;
    final glow = widget.glowColor;

    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap();
      },
      onTapCancel: () => _controller.reverse(),
      child: ScaleTransition(
        scale: _scaleAnim,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: g,
            ),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.22),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: glow.withValues(alpha: isDark ? 0.40 : 0.25),
                blurRadius: 14,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Custom 3D Vector SVG Illustration
              SizedBox(
                width: 50,
                height: 50,
                child: SvgPicture.asset(
                  widget.svgAsset,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Text(
                  widget.title,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    height: 1.25,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}



