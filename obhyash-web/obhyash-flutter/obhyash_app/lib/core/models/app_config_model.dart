class AppConfigModel {
  final bool maintenanceMode;
  final String maintenanceMessage;
  final bool liveExamsEnabled;
  final bool registrationEnabled;
  final bool freeTrialEnabled;
  final String minAppVersion;
  final String latestAppVersion;
  final bool forceUpdate;
  final String updateUrl;
  final bool globalAnnouncementEnabled;
  final String globalAnnouncementText;
  final String globalAnnouncementType;
  final String globalAnnouncementTarget;

  const AppConfigModel({
    this.maintenanceMode = false,
    this.maintenanceMessage =
        'অভ্যাস প্ল্যাটফর্মের নিয়মিত রক্ষণাবেক্ষণ চলছে। শীঘ্রই আমরা ফিরে আসছি।',
    this.liveExamsEnabled = true,
    this.registrationEnabled = true,
    this.freeTrialEnabled = true,
    this.minAppVersion = '1.0.0',
    this.latestAppVersion = '1.0.0',
    this.forceUpdate = false,
    this.updateUrl =
        'https://play.google.com/store/apps/details?id=com.obhyash.app',
    this.globalAnnouncementEnabled = false,
    this.globalAnnouncementText = '',
    this.globalAnnouncementType = 'info',
    this.globalAnnouncementTarget = 'all',
  });

  factory AppConfigModel.fromJson(Map<String, dynamic> json) {
    return AppConfigModel(
      maintenanceMode: json['maintenance_mode'] as bool? ?? false,
      maintenanceMessage: json['maintenance_message'] as String? ??
          'অভ্যাস প্ল্যাটফর্মের নিয়মিত রক্ষণাবেক্ষণ চলছে। শীঘ্রই আমরা ফিরে আসছি।',
      liveExamsEnabled: json['live_exams_enabled'] as bool? ?? true,
      registrationEnabled: json['registration_enabled'] as bool? ?? true,
      freeTrialEnabled: json['free_trial_enabled'] as bool? ?? true,
      minAppVersion: json['min_app_version'] as String? ?? '1.0.0',
      latestAppVersion: json['latest_app_version'] as String? ?? '1.0.0',
      forceUpdate: json['force_update'] as bool? ?? false,
      updateUrl: json['update_url'] as String? ??
          'https://play.google.com/store/apps/details?id=com.obhyash.app',
      globalAnnouncementEnabled:
          json['global_announcement_enabled'] as bool? ?? false,
      globalAnnouncementText:
          json['global_announcement_text'] as String? ?? '',
      globalAnnouncementType:
          json['global_announcement_type'] as String? ?? 'info',
      globalAnnouncementTarget:
          json['global_announcement_target'] as String? ?? 'all',
    );
  }

  Map<String, dynamic> toJson() => {
        'maintenance_mode': maintenanceMode,
        'maintenance_message': maintenanceMessage,
        'live_exams_enabled': liveExamsEnabled,
        'registration_enabled': registrationEnabled,
        'free_trial_enabled': freeTrialEnabled,
        'min_app_version': minAppVersion,
        'latest_app_version': latestAppVersion,
        'force_update': forceUpdate,
        'update_url': updateUrl,
        'global_announcement_enabled': globalAnnouncementEnabled,
        'global_announcement_text': globalAnnouncementText,
        'global_announcement_type': globalAnnouncementType,
        'global_announcement_target': globalAnnouncementTarget,
      };
}
