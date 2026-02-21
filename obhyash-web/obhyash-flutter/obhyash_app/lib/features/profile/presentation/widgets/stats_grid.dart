import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class StatsGrid extends StatelessWidget {
  final int examsTaken;
  final int avgScore;
  final int xp;
  final int streak;

  const StatsGrid({
    super.key,
    required this.examsTaken,
    required this.avgScore,
    required this.xp,
    required this.streak,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // use 2 columns on mobile, 4 columns on tablet/desktop
        final isMobile = constraints.maxWidth < 600;
        final crossAxisCount = isMobile ? 2 : 4;

        return GridView.count(
          crossAxisCount: crossAxisCount,
          crossAxisSpacing: 12, // sm:gap-4
          mainAxisSpacing: 12,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: isMobile ? 1.4 : 1.2,
          children: [
            _buildStatCard(
              context,
              title: 'মোট পরীক্ষা',
              value: examsTaken.toString(),
              icon: LucideIcons.fileEdit,
              color: const Color(0xFFE11D48), // rose-600
              bgColor: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0x33e11d48) // rose-900/20
                  : const Color(0xFFFFF1F2), // rose-50
            ),
            _buildStatCard(
              context,
              title: 'গড় স্কোর',
              value: '$avgScore%',
              icon: LucideIcons.crosshair,
              color: const Color(0xFF059669), // emerald-600
              bgColor: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0x33059669) // emerald-900/20
                  : const Color(0xFFECFDF5), // emerald-50
            ),
            _buildStatCard(
              context,
              title: 'মোট XP',
              value: xp.toString(),
              icon: LucideIcons.target,
              color: const Color(0xFFD97706), // amber-600
              bgColor: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0x33b45309) // amber-900/20
                  : const Color(0xFFFFFBEB), // amber-50
            ),
            _buildStatCard(
              context,
              title: 'স্ট্রিক',
              value: '$streak দিন',
              icon: LucideIcons.flame,
              color: const Color(0xFFEA580C), // orange-600
              bgColor: Theme.of(context).brightness == Brightness.dark
                  ? const Color(0x339a3412) // orange-900/20
                  : const Color(0xFFFFF7ED), // orange-50
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required Color bgColor,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16), // sm:p-6
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white, // neutral-900
        borderRadius: BorderRadius.circular(20), // sm:rounded-3xl
        border: Border.all(
          color: isDark
              ? const Color(0xFF262626)
              : const Color(0xFFE5E5E5), // neutral-800 : neutral-200
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x05000000), // shadow-sm
            blurRadius: 2,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8), // sm:p-2.5
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(10), // sm:rounded-xl
                ),
                child: Icon(icon, color: color, size: 20), // sm:w-6
              ),
              const SizedBox(width: 8), // gap-2
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 12, // sm:text-sm
                    fontWeight: FontWeight.bold,
                    color: isDark
                        ? const Color(0xFFA3A3A3)
                        : const Color(0xFF737373), // neutral-400 : neutral-500
                    letterSpacing: 0.5,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 24, // sm:text-3xl
              fontWeight: FontWeight.w900, // font-black
              color: isDark
                  ? Colors.white
                  : const Color(0xFF171717), // neutral-900
              letterSpacing: -0.5,
            ),
          ),
        ],
      ),
    );
  }
}
