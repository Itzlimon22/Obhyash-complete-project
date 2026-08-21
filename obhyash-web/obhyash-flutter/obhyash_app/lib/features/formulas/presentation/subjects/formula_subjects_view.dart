import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../dashboard/providers/dashboard_providers.dart';
import '../../models/formula_models.dart';
import '../../../../core/presentation/widgets/app_refresh_indicator.dart';

class FormulaSubjectsView extends ConsumerWidget {
  const FormulaSubjectsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // Personalize level based on student profile (level or stream)
    final userProfile = ref.watch(userProfileProvider).value;
    final level = (userProfile?.level?.isNotEmpty == true)
        ? userProfile!.level!
        : (userProfile?.stream?.isNotEmpty == true
            ? userProfile!.stream!
            : 'HSC');
    final subjects = getFormulaSubjectsForLevel(level);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAF9),
      body: Padding(
        padding: const EdgeInsets.fromLTRB(10, 8, 10, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'বিষয় বেছে নিন',
              style: TextStyle(
                fontSize: 16,
                fontFamily: 'Anek Bangla',
                color: isDark ? const Color(0xFF737373) : const Color(0xFF6B7280),
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: AppRefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(userProfileProvider);
                  try {
                    await ref.read(userProfileProvider.future);
                  } catch (_) {}
                },
                child: GridView.builder(
                  physics: const AlwaysScrollableScrollPhysics(
                    parent: BouncingScrollPhysics(),
                  ),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.6,
                  ),
                  itemCount: subjects.length,
                  itemBuilder: (context, index) {
                    final subject = subjects[index];
                    return _SubjectCard(subject: subject, isDark: isDark);
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SubjectCard extends StatefulWidget {
  final SubjectMeta subject;
  final bool isDark;

  const _SubjectCard({required this.subject, required this.isDark});

  @override
  State<_SubjectCard> createState() => _SubjectCardState();
}

class _SubjectCardState extends State<_SubjectCard>
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
    final g = widget.subject.gradientColors;

    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        context.push('/formulas/${widget.subject.subjectId}');
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
              color: const Color(0xFF059669).withValues(alpha: 0.2),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Color(g[1]).withValues(alpha: isDark ? 0.4 : 0.2),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Stack(
            children: [
              // Subtle background glow
              Positioned(
                top: -20,
                right: -20,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF059669).withValues(alpha: 0.08),
                  ),
                ),
              ),
              // Content
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Emoji Icon
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.1),
                        ),
                      ),
                      child: Center(
                        child: Text(
                          widget.subject.emoji,
                          style: const TextStyle(fontSize: 20),
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      widget.subject.subjectName,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Anek Bangla',
                        color: Colors.white,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
