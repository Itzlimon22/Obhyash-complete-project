import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Base Skeleton building block with smooth shimmer wave animation
class Skeleton extends StatelessWidget {
  final double? width;
  final double? height;
  final double borderRadius;
  final ShapeBorder? shape;
  final EdgeInsetsGeometry? margin;

  const Skeleton({
    super.key,
    this.width,
    this.height,
    this.borderRadius = 12,
    this.shape,
    this.margin,
  });

  const Skeleton.circle({
    super.key,
    required double size,
    this.margin,
  })  : width = size,
        height = size,
        borderRadius = 9999,
        shape = const CircleBorder();

  const Skeleton.card({
    super.key,
    this.width = double.infinity,
    this.height = 100,
    this.borderRadius = 20,
    this.margin,
  }) : shape = null;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final baseColor = isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB);
    final highlightColor = isDark ? const Color(0xFF3F3F46) : const Color(0xFFF3F4F6);

    Widget widget = Container(
      width: width,
      height: height,
      margin: margin,
      decoration: shape == null
          ? BoxDecoration(
              color: baseColor,
              borderRadius: BorderRadius.circular(borderRadius),
            )
          : ShapeDecoration(
              color: baseColor,
              shape: shape!,
            ),
    );

    return widget
        .animate(onPlay: (controller) => controller.repeat())
        .shimmer(
          duration: 1200.ms,
          color: highlightColor.withValues(alpha: 0.8),
        );
  }
}

// ---------------------------------------------------------------------------
// 1. Dashboard Skeleton
// ---------------------------------------------------------------------------
class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner Skeleton
          const Skeleton(height: 110, borderRadius: 24),
          const SizedBox(height: 18),

          // Subjects Grid Skeleton (4 subjects)
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 4,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.3,
            ),
            itemBuilder: (_, __) => const Skeleton(borderRadius: 20),
          ),
          const SizedBox(height: 18),

          // Daily Streak Card Skeleton
          const Skeleton(height: 160, borderRadius: 24),
          const SizedBox(height: 18),

          // Daily Quests Card Skeleton
          const Skeleton(height: 180, borderRadius: 24),
          const SizedBox(height: 18),

          // Leaderboard Preview Skeleton
          const Skeleton(height: 140, borderRadius: 24),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 2. Live Exam List Skeleton
// ---------------------------------------------------------------------------
class LiveExamListSkeleton extends StatelessWidget {
  const LiveExamListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        children: [
          // Filter tabs skeleton
          Row(
            children: const [
              Skeleton(width: 80, height: 36, borderRadius: 20),
              SizedBox(width: 8),
              Skeleton(width: 80, height: 36, borderRadius: 20),
              SizedBox(width: 8),
              Skeleton(width: 80, height: 36, borderRadius: 20),
            ],
          ),
          const SizedBox(height: 16),

          // 3 Exam Cards Skeleton
          ...List.generate(
            3,
            (index) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: Theme.of(context).brightness == Brightness.dark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFF4F4F5),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Skeleton(width: 70, height: 22, borderRadius: 8),
                        Skeleton(width: 90, height: 22, borderRadius: 12),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Skeleton(width: 220, height: 20, borderRadius: 6),
                    const SizedBox(height: 12),
                    Row(
                      children: const [
                        Skeleton(width: 80, height: 16, borderRadius: 6),
                        SizedBox(width: 12),
                        Skeleton(width: 70, height: 16, borderRadius: 6),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Skeleton(height: 46, borderRadius: 16),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Live Exam Details Skeleton
// ---------------------------------------------------------------------------
class LiveExamDetailsSkeleton extends StatelessWidget {
  const LiveExamDetailsSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Hero Card
          const Skeleton(height: 120, borderRadius: 24),
          const SizedBox(height: 16),

          // Schedule Card
          const Skeleton(height: 110, borderRadius: 24),
          const SizedBox(height: 16),

          // 3 Meta Items
          const Skeleton(height: 70, borderRadius: 24),
          const SizedBox(height: 16),

          // Syllabus Card with 2 columns
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF27272A)
                    : const Color(0xFFF4F4F5),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Skeleton(width: 140, height: 18, borderRadius: 6),
                const SizedBox(height: 14),
                Row(
                  children: const [
                    Expanded(child: Skeleton(height: 42, borderRadius: 12)),
                    SizedBox(width: 10),
                    Expanded(child: Skeleton(height: 42, borderRadius: 12)),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: const [
                    Expanded(child: Skeleton(height: 42, borderRadius: 12)),
                    SizedBox(width: 10),
                    Expanded(child: Skeleton(height: 42, borderRadius: 12)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Action Button
          const Skeleton(height: 52, borderRadius: 16),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 4. Notifications List Skeleton
// ---------------------------------------------------------------------------
class NotificationsListSkeleton extends StatelessWidget {
  const NotificationsListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      itemCount: 6,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, __) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: Theme.of(context).brightness == Brightness.dark
                ? const Color(0xFF27272A)
                : const Color(0xFFF4F4F5),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Skeleton(width: 42, height: 42, borderRadius: 13),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Skeleton(width: 160, height: 16, borderRadius: 6),
                  SizedBox(height: 8),
                  Skeleton(width: double.infinity, height: 14, borderRadius: 4),
                  SizedBox(height: 4),
                  Skeleton(width: 200, height: 14, borderRadius: 4),
                  SizedBox(height: 12),
                  Skeleton(width: 70, height: 12, borderRadius: 4),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 5. Leaderboard Skeleton
// ---------------------------------------------------------------------------
class LeaderboardSkeleton extends StatelessWidget {
  const LeaderboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        children: [
          // Top 3 Podium Cards
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: const [
              Expanded(child: Skeleton(height: 130, borderRadius: 20)),
              SizedBox(width: 10),
              Expanded(child: Skeleton(height: 160, borderRadius: 20)),
              SizedBox(width: 10),
              Expanded(child: Skeleton(height: 120, borderRadius: 20)),
            ],
          ),
          const SizedBox(height: 20),

          // List entries (Rank 4 to 8)
          ...List.generate(
            5,
            (index) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: Theme.of(context).brightness == Brightness.dark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFF4F4F5),
                  ),
                ),
                child: Row(
                  children: const [
                    Skeleton(width: 28, height: 28, borderRadius: 8),
                    SizedBox(width: 12),
                    Skeleton.circle(size: 36),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Skeleton(width: 120, height: 14, borderRadius: 4),
                          SizedBox(height: 4),
                          Skeleton(width: 80, height: 10, borderRadius: 4),
                        ],
                      ),
                    ),
                    Skeleton(width: 50, height: 16, borderRadius: 6),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 6. Exam History Skeleton
// ---------------------------------------------------------------------------
class ExamHistorySkeleton extends StatelessWidget {
  const ExamHistorySkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, index) {
        if (index == 0) {
          // Top Stats Summary Row
          return Row(
            children: const [
              Expanded(child: Skeleton(height: 80, borderRadius: 18)),
              SizedBox(width: 10),
              Expanded(child: Skeleton(height: 80, borderRadius: 18)),
              SizedBox(width: 10),
              Expanded(child: Skeleton(height: 80, borderRadius: 18)),
            ],
          );
        }
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0xFF27272A)
                  : const Color(0xFFF4F4F5),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  Skeleton(width: 90, height: 20, borderRadius: 8),
                  Skeleton(width: 60, height: 16, borderRadius: 6),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  Skeleton(width: 140, height: 14, borderRadius: 4),
                  Skeleton(width: 70, height: 20, borderRadius: 8),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// 7. Bookmarks / Questions Skeleton
// ---------------------------------------------------------------------------
class BookmarksListSkeleton extends StatelessWidget {
  const BookmarksListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: 4,
      separatorBuilder: (_, __) => const SizedBox(height: 14),
      itemBuilder: (_, __) => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: Theme.of(context).brightness == Brightness.dark
                ? const Color(0xFF27272A)
                : const Color(0xFFF4F4F5),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                Skeleton(width: 80, height: 20, borderRadius: 8),
                Skeleton.circle(size: 28),
              ],
            ),
            const SizedBox(height: 14),
            const Skeleton(width: double.infinity, height: 16, borderRadius: 4),
            const SizedBox(height: 6),
            const Skeleton(width: 220, height: 16, borderRadius: 4),
            const SizedBox(height: 16),
            ...List.generate(
              4,
              (idx) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: const Skeleton(height: 38, borderRadius: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 8. Profile & Stats Skeleton
// ---------------------------------------------------------------------------
class ProfileStatsSkeleton extends StatelessWidget {
  const ProfileStatsSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        children: [
          // Profile Top Header Skeleton
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF27272A)
                    : const Color(0xFFF4F4F5),
              ),
            ),
            child: Column(
              children: const [
                Skeleton.circle(size: 72),
                SizedBox(height: 12),
                Skeleton(width: 140, height: 18, borderRadius: 6),
                SizedBox(height: 6),
                Skeleton(width: 100, height: 12, borderRadius: 4),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Stats Grid Skeleton
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 4,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.5,
            ),
            itemBuilder: (_, __) => const Skeleton(borderRadius: 20),
          ),
          const SizedBox(height: 16),

          // Streak Calendar Skeleton
          const Skeleton(height: 240, borderRadius: 24),
        ],
      ),
    );
  }
}
