class LiveExamTrackInfo {
  final String key;
  final String label;
  final String badge;
  final String color;
  final bool hasRoutine;

  const LiveExamTrackInfo({
    required this.key,
    required this.label,
    required this.badge,
    required this.color,
    this.hasRoutine = true,
  });

  factory LiveExamTrackInfo.fromJson(Map<String, dynamic> json) {
    return LiveExamTrackInfo(
      key: json['key']?.toString() ?? '',
      label: json['label']?.toString() ?? '',
      badge: json['badge']?.toString() ?? '',
      color: json['color']?.toString() ?? 'from-blue-500 to-indigo-600',
      hasRoutine: json['has_routine'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'key': key,
    'label': label,
    'badge': badge,
    'color': color,
    'has_routine': hasRoutine,
  };
}

class LiveExamControlsModel {
  final String id;
  final bool isEnabled;
  final String maintenanceMessage;
  final String routineSpreadsheetId;
  final Map<String, String> routineSheetMapping;
  final List<LiveExamTrackInfo> availableTracks;
  final bool antiCheatEnabled;
  final int maxTabSwitches;
  final double defaultNegativeMarking;
  final bool allowPracticeMode;
  final bool showRoutineButton;
  final bool activeAnnouncementEnabled;
  final String activeAnnouncementText;

  const LiveExamControlsModel({
    this.id = 'global_live_exam_controls',
    this.isEnabled = true,
    this.maintenanceMessage = 'লাইভ এক্সাম সিস্টেম সাময়িকভাবে রক্ষণাবেক্ষণে রয়েছে। শীঘ্রই পরীক্ষা পুনরায় চালু হবে।',
    this.routineSpreadsheetId = '1b9YeiVz89q0dSisDg1kpK8peO-FA6G9Y4K4UVQ7Tvug',
    this.routineSheetMapping = const {
      'medical': 'Medical',
      'engineering': 'Engineering',
      'varsity': 'Varsity_A',
      'hsc': 'HSC',
      'ssc': 'SSC',
    },
    this.availableTracks = const [
      LiveExamTrackInfo(key: 'Medical', label: 'মেডিকেল ভর্তি', badge: 'MBBS ২০২৬-২৭', color: 'from-emerald-500 to-teal-600', hasRoutine: true),
      LiveExamTrackInfo(key: 'Engineering', label: 'ইঞ্জিনিয়ারিং', badge: 'BUET/CKRUET', color: 'from-blue-500 to-indigo-600', hasRoutine: true),
      LiveExamTrackInfo(key: 'Varsity_A', label: "ঢাবি 'ক' ইউনিট", badge: 'DU Science', color: 'from-amber-500 to-orange-600', hasRoutine: true),
      LiveExamTrackInfo(key: 'HSC', label: 'এইচএসসি স্পেশাল', badge: 'HSC Board Prep', color: 'from-purple-500 to-indigo-600', hasRoutine: false),
      LiveExamTrackInfo(key: 'SSC', label: 'এসএসসি স্পেশাল', badge: 'SSC Board Prep', color: 'from-rose-500 to-red-600', hasRoutine: false),
    ],
    this.antiCheatEnabled = true,
    this.maxTabSwitches = 2,
    this.defaultNegativeMarking = 0.25,
    this.allowPracticeMode = true,
    this.showRoutineButton = true,
    this.activeAnnouncementEnabled = false,
    this.activeAnnouncementText = '',
  });

  factory LiveExamControlsModel.fromJson(Map<String, dynamic> json) {
    Map<String, String> mapping = {
      'medical': 'Medical',
      'engineering': 'Engineering',
      'varsity': 'Varsity_A',
      'hsc': 'HSC',
      'ssc': 'SSC',
    };
    if (json['routine_sheet_mapping'] is Map) {
      mapping = (json['routine_sheet_mapping'] as Map)
          .map((k, v) => MapEntry(k.toString(), v.toString()));
    }

    List<LiveExamTrackInfo> tracks = [];
    if (json['available_tracks'] is List) {
      tracks = (json['available_tracks'] as List)
          .whereType<Map<String, dynamic>>()
          .map((t) => LiveExamTrackInfo.fromJson(t))
          .toList();
    }
    if (tracks.isEmpty) {
      tracks = const [
        LiveExamTrackInfo(key: 'Medical', label: 'মেডিকেল ভর্তি', badge: 'MBBS ২০২৬-২৭', color: 'from-emerald-500 to-teal-600', hasRoutine: true),
        LiveExamTrackInfo(key: 'Engineering', label: 'ইঞ্জিনিয়ারিং', badge: 'BUET/CKRUET', color: 'from-blue-500 to-indigo-600', hasRoutine: true),
        LiveExamTrackInfo(key: 'Varsity_A', label: "ঢাবি 'ক' ইউনিট", badge: 'DU Science', color: 'from-amber-500 to-orange-600', hasRoutine: true),
        LiveExamTrackInfo(key: 'HSC', label: 'এইচএসসি স্পেশাল', badge: 'HSC Board Prep', color: 'from-purple-500 to-indigo-600', hasRoutine: false),
        LiveExamTrackInfo(key: 'SSC', label: 'এসএসসি স্পেশাল', badge: 'SSC Board Prep', color: 'from-rose-500 to-red-600', hasRoutine: false),
      ];
    }

    return LiveExamControlsModel(
      id: json['id']?.toString() ?? 'global_live_exam_controls',
      isEnabled: json['is_enabled'] as bool? ?? true,
      maintenanceMessage: json['maintenance_message']?.toString() ??
          'লাইভ এক্সাম সিস্টেম সাময়িকভাবে রক্ষণাবেক্ষণে রয়েছে। শীঘ্রই পরীক্ষা পুনরায় চালু হবে।',
      routineSpreadsheetId: json['routine_spreadsheet_id']?.toString() ??
          '1b9YeiVz89q0dSisDg1kpK8peO-FA6G9Y4K4UVQ7Tvug',
      routineSheetMapping: mapping,
      availableTracks: tracks,
      antiCheatEnabled: json['anti_cheat_enabled'] as bool? ?? true,
      maxTabSwitches: (json['max_tab_switches'] as num?)?.toInt() ?? 2,
      defaultNegativeMarking: (json['default_negative_marking'] as num?)?.toDouble() ?? 0.25,
      allowPracticeMode: json['allow_practice_mode'] as bool? ?? true,
      showRoutineButton: json['show_routine_button'] as bool? ?? true,
      activeAnnouncementEnabled: json['active_announcement_enabled'] as bool? ?? false,
      activeAnnouncementText: json['active_announcement_text']?.toString() ?? '',
    );
  }

  /// Helper to get sheet name for a category with safe fallback
  String getSheetName(String category) {
    final cat = category.toLowerCase().trim();
    for (final entry in routineSheetMapping.entries) {
      if (cat.contains(entry.key)) {
        return entry.value;
      }
    }
    return 'Medical';
  }

  /// Helper to check if a track has an active routine sheet
  bool hasRoutine(String category) {
    final cat = category.toLowerCase().trim();
    for (final track in availableTracks) {
      if (cat.contains(track.key.toLowerCase())) {
        return track.hasRoutine;
      }
    }
    // Check mapping
    for (final entry in routineSheetMapping.entries) {
      if (cat.contains(entry.key)) {
        final track = availableTracks.firstWhere(
          (t) => t.key.toLowerCase() == entry.value.toLowerCase(),
          orElse: () => const LiveExamTrackInfo(key: '', label: '', badge: '', color: '', hasRoutine: true),
        );
        return track.hasRoutine;
      }
    }
    return false;
  }
}
