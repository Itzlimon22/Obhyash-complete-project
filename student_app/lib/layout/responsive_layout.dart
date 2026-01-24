import 'package:flutter/material.dart';

class ResponsiveLayout extends StatelessWidget {
  final Widget mobileBody;
  final Widget desktopBody;

  const ResponsiveLayout({
    super.key,
    required this.mobileBody,
    required this.desktopBody,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // If screen is wider than 900px, it's a Desktop/Web view
        if (constraints.maxWidth >= 900) {
          return desktopBody;
        } else {
          return mobileBody;
        }
      },
    );
  }
}
