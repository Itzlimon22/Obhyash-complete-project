import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class AppDropdownOption<T> {
  final T value;
  final String label;

  const AppDropdownOption({required this.value, required this.label});
}

class AppDropdown<T> extends StatelessWidget {
  final String label;
  final T? value;
  final List<AppDropdownOption<T>> options;
  final ValueChanged<T?>? onChanged;
  final IconData? icon;
  final String? hint;
  final EdgeInsetsGeometry? padding;

  const AppDropdown({
    super.key,
    this.label = '',
    required this.value,
    required this.options,
    required this.onChanged,
    this.icon,
    this.hint,
    this.padding,
  });

  void _showPicker(BuildContext context) {
    if (onChanged == null) return;
    
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF000000) : Colors.white; // Zinc 950
    final borderColor = isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0); // Zinc 800

    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (BuildContext ctx) {
        return Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(ctx).size.height * 0.7,
          ),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
            border: Border(
              top: BorderSide(color: borderColor, width: 1),
            ),
          ),
          padding: const EdgeInsets.only(top: 12, bottom: 24),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Drag handle
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF3F3F46) : Colors.black12, // Zinc 700
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 24),
                if (label.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      label,
                      style: TextStyle(
                        fontFamily: 'Anek Bangla',
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: isDark ? const Color(0xFFFAFAFA) : Colors.black, // Zinc 50
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                Flexible(
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: options.length,
                    itemBuilder: (context, index) {
                      final option = options[index];
                      final isSelected = option.value == value;
                      return InkWell(
                        onTap: () {
                          Navigator.pop(ctx);
                          onChanged!(option.value);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                          decoration: BoxDecoration(
                            color: isSelected 
                                ? const Color(0xFF059669).withValues(alpha: isDark ? 0.2 : 0.1) 
                                : Colors.transparent,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  option.label,
                                  style: TextStyle(
                                    fontFamily: 'Anek Bangla',
                                    fontSize: 18,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                    color: isSelected 
                                        ? (isDark ? const Color(0xFF34D399) : const Color(0xFF059669)) // Emerald 400 for dark mode selected
                                        : (isDark ? const Color(0xFFE4E4E7) : Colors.black87), // Zinc 200
                                  ),
                                ),
                              ),
                              if (isSelected)
                                Icon(
                                  LucideIcons.checkCircle2,
                                  color: isDark ? const Color(0xFF34D399) : const Color(0xFF059669),
                                  size: 20,
                                ),
                            ],
                          ),
                        ),
                      );
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

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5); // Zinc 900
    final borderColor = isDark ? const Color(0xFF27272A) : Colors.black.withValues(alpha: 0.05); // Zinc 800

    String? displayLabel;
    if (value != null) {
      try {
        displayLabel = options.firstWhere((opt) => opt.value == value).label;
      } catch (e) {
        displayLabel = null;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontFamily: 'Anek Bangla',
                fontWeight: FontWeight.w700,
                color: isDark ? const Color(0xFFA1A1AA) : Colors.black87, // Zinc 400
              ),
            ),
          ),
          const SizedBox(height: 8),
        ],
        GestureDetector(
          onTap: () => _showPicker(context),
          child: Container(
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: borderColor,
              ),
            ),
            padding: padding ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              children: [
                if (icon != null) ...[
                  Icon(icon, color: isDark ? const Color(0xFFA1A1AA) : Colors.black54, size: 20), // Zinc 400
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: Text(
                    displayLabel ?? hint ?? 'Select an option',
                    style: TextStyle(
                      fontFamily: 'Anek Bangla',
                      fontSize: 17,
                      fontWeight: displayLabel != null ? FontWeight.w600 : FontWeight.normal,
                      color: displayLabel != null
                          ? (isDark ? const Color(0xFFFAFAFA) : Colors.black) // Zinc 50
                          : (isDark ? const Color(0xFF52525B) : Colors.black38), // Zinc 600
                    ),
                  ),
                ),
                Icon(
                  LucideIcons.chevronDown,
                  color: isDark ? const Color(0xFFA1A1AA) : Colors.black54, // Zinc 400
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
