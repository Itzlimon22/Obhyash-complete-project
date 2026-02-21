import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import '../../notifications/presentation/notifications_view.dart';
import 'my_profile_view.dart';
import 'settings_view.dart';

class ProfileRouteView extends ConsumerWidget {
  const ProfileRouteView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userProfileAsync = ref.watch(userProfileProvider);
    // TODO: implement real endpoints for these later. Using empty for now.

    return userProfileAsync.when(
      data: (user) {
        if (user == null) {
          return const Center(child: Text('User not found.'));
        }

        return MyProfileView(
          user: user,
          history: const [], // MOCK
          subjectStats: const [], // MOCK
          calendarData: const [], // MOCK
          onEditProfile: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => SettingsView(user: user)),
            );
          },
          onViewNotifications: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const NotificationsView(),
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(child: Text('Error: $error')),
    );
  }
}
