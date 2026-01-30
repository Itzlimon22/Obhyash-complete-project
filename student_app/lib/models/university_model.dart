class University {
  final String id;
  final String name;
  final String website;
  final DateTime applicationDate;
  final List<UniversityUnit> units;

  University({
    required this.id,
    required this.name,
    required this.website,
    required this.applicationDate,
    required this.units,
  });

  factory University.fromJson(Map<String, dynamic> json) {
    var unitsList = json['university_units'] as List<dynamic>? ?? [];
    List<UniversityUnit> units = unitsList
        .map((i) => UniversityUnit.fromJson(i))
        .toList();

    return University(
      id: json['id'],
      name: json['name'],
      website: json['website'],
      applicationDate: DateTime.parse(json['application_date']),
      units: units,
    );
  }
}

class UniversityUnit {
  final String unitName;
  final double minSSC;
  final double minHSC;
  final double minTotal;
  final bool secondTime;
  final List<String> allowedGroups;

  UniversityUnit({
    required this.unitName,
    required this.minSSC,
    required this.minHSC,
    required this.minTotal,
    required this.secondTime,
    required this.allowedGroups,
  });

  factory UniversityUnit.fromJson(Map<String, dynamic> json) {
    return UniversityUnit(
      unitName: json['unit_name'],
      minSSC: (json['min_ssc_gpa'] as num).toDouble(),
      minHSC: (json['min_hsc_gpa'] as num).toDouble(),
      minTotal: (json['min_total_gpa'] as num).toDouble(),
      secondTime: json['second_time_allowed'],
      allowedGroups: List<String>.from(json['allowed_groups'] ?? []),
    );
  }
}
