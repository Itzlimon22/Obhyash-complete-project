class LeaderboardUser {
  final String id;
  final String name;
  final int xp;
  final String? avatarUrl;
  final String? avatarColor;

  LeaderboardUser({
    required this.id,
    required this.name,
    required this.xp,
    this.avatarUrl,
    this.avatarColor,
  });

  factory LeaderboardUser.fromJson(Map<String, dynamic> json) {
    return LeaderboardUser(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Unknown User',
      xp: json['xp'] as int? ?? 0,
      avatarUrl: json['avatar_url'] as String?,
      avatarColor: json['avatar_color'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'xp': xp,
    'avatar_url': avatarUrl,
    'avatar_color': avatarColor,
  };
}

class Subject {
  final String id;
  final String name;
  final String? icon;
  final String? category;
  final String? level;
  final String? division;
  final int? paperNumber;
  final int? sortOrder;

  Subject({
    required this.id,
    required this.name,
    this.icon,
    this.category,
    this.level,
    this.division,
    this.paperNumber,
    this.sortOrder,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      icon: json['icon'] as String?,
      category: json['category'] as String?,
      level: json['level'] as String?,
      division: json['division'] as String?,
      paperNumber: json['paper_number'] as int?,
      sortOrder: json['sort_order'] as int?,
    );
  }
}

class ExamResult {
  final String id;
  final String subject;
  final int totalQuestions;
  final int correctCount;
  final int wrongCount;
  final String? subjectLabel;
  final DateTime? createdAt;

  ExamResult({
    required this.id,
    required this.subject,
    required this.totalQuestions,
    required this.correctCount,
    required this.wrongCount,
    this.subjectLabel,
    this.createdAt,
  });

  factory ExamResult.fromJson(Map<String, dynamic> json) {
    return ExamResult(
      id: json['id'] as String,
      subject: json['subject'] as String,
      totalQuestions: json['total_questions'] as int? ?? 0,
      correctCount: json['correct_count'] as int? ?? 0,
      wrongCount: json['wrong_count'] as int? ?? 0,
      subjectLabel: json['subject_label'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }
}

class SubjectStats {
  final String id;
  final String name;
  final int correct;
  final int wrong;
  final int skipped;
  final int total;

  SubjectStats({
    required this.id,
    required this.name,
    required this.correct,
    required this.wrong,
    required this.skipped,
    required this.total,
  });

  factory SubjectStats.fromJson(Map<String, dynamic> json) {
    return SubjectStats(
      id: json['id'] as String,
      name: json['name'] as String,
      correct: json['correct'] as int,
      wrong: json['wrong'] as int,
      skipped: json['skipped'] as int,
      total: json['total'] as int,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'correct': correct,
    'wrong': wrong,
    'skipped': skipped,
    'total': total,
  };
}

class UserProfile {
  final String id;
  final String? studentId;
  final String name;
  final String? email;
  final int xp;
  final String? level;
  final String? division;
  final String? stream;
  final String? optionalSubject;
  final String? institute;
  final int streakCount;
  final String? phone;
  final String? dob;
  final String? gender;
  final String? address;
  final String? batch;
  final String? target;
  final String? sscRoll;
  final String? sscReg;
  final String? sscBoard;
  final String? sscYear;
  final String? avatarUrl;
  final String? examTarget;
  final int dailyExamsGoal;
  final bool admissionTrackInterest;
  final String? lastStreakDate;
  final bool isSubscribed;
  final String? subscriptionStatus;
  final String? subscriptionExpiresAt;

  UserProfile({
    required this.id,
    this.studentId,
    required this.name,
    this.email,
    required this.xp,
    this.level,
    this.division,
    this.stream,
    this.optionalSubject,
    this.institute,
    this.streakCount = 0,
    this.phone,
    this.dob,
    this.gender,
    this.address,
    this.batch,
    this.target,
    this.sscRoll,
    this.sscReg,
    this.sscBoard,
    this.sscYear,
    this.avatarUrl,
    this.examTarget,
    this.dailyExamsGoal = 3,
    this.admissionTrackInterest = false,
    this.lastStreakDate,
    this.isSubscribed = false,
    this.subscriptionStatus,
    this.subscriptionExpiresAt,
  });

  bool get isPro {
    if (isSubscribed) return true;
    final status = subscriptionStatus?.toString().toLowerCase().trim();
    if (status == 'active') return true;
    if (level != null && level!.toLowerCase().contains('pro')) return true;
    if (subscriptionExpiresAt != null) {
      final exp = DateTime.tryParse(subscriptionExpiresAt!);
      if (exp != null && exp.isAfter(DateTime.now())) return true;
    }
    return false;
  }

  String get displayStudentId {
    if (studentId != null && studentId!.isNotEmpty) {
      return studentId!;
    }
    if (id.length >= 8) {
      return 'OBH-${id.replaceAll('-', '').substring(0, 5).toUpperCase()}';
    }
    return 'OBH-10001';
  }

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final subJson = json['subscription'] as Map<String, dynamic>?;
    final rawStatus = (subJson?['status'] ?? json['subscription_status'])?.toString().toLowerCase().trim();
    final rawExp = subJson?['expiry'] as String? ??
        subJson?['expires_at'] as String? ??
        json['subscription_expires_at'] as String?;
    final expDate = rawExp != null ? DateTime.tryParse(rawExp) : null;
    final bool isExpired = expDate != null && expDate.isBefore(DateTime.now());

    final bool isSub = (json['is_subscribed'] == true && !isExpired) ||
        (rawStatus == 'active' && !isExpired) ||
        (json['plan']?.toString().toLowerCase() == 'pro' && !isExpired) ||
        (expDate != null && expDate.isAfter(DateTime.now()) && (subJson != null || json['subscription_status'] != null));

    return UserProfile(
      id: json['id'] as String,
      studentId: json['student_id'] as String?,
      name: json['name'] as String? ?? 'Unknown User',
      email: json['email'] as String?,
      xp: (json['xp'] as num?)?.toInt() ?? 0,
      level: json['level'] as String?,
      division: json['division'] as String?,
      stream: json['stream'] as String?,
      optionalSubject: json['optional_subject'] as String?,
      institute: json['institute'] as String?,
      streakCount:
          (json['streak'] as num?)?.toInt() ??
          (json['streak_count'] as num?)?.toInt() ??
          0,
      phone: json['phone'] as String?,
      dob: json['dob'] as String?,
      gender: json['gender'] as String?,
      address: json['address'] as String?,
      batch: json['batch'] as String?,
      target: json['target'] as String?,
      sscRoll: json['ssc_roll'] as String?,
      sscReg: json['ssc_reg'] as String?,
      sscBoard: json['ssc_board'] as String?,
      sscYear: json['ssc_passing_year'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      examTarget: json['exam_target'] as String?,
      dailyExamsGoal: (json['daily_exams_goal'] as num?)?.toInt() ?? 3,
      admissionTrackInterest:
          json['admission_track_interest'] as bool? ?? false,
      lastStreakDate: json['last_streak_date'] as String?,
      isSubscribed: isSub,
      subscriptionStatus: subJson?['status'] as String? ?? json['subscription_status'] as String?,
      subscriptionExpiresAt: rawExp,
    );
  }
}
