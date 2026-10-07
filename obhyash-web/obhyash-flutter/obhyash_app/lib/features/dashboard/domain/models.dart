import 'dart:convert';

class LeaderboardUser {
  final String id;
  final String name;
  final int xp;
  final String? avatarUrl;
  final String? avatarColor;
  final String? gender;

  LeaderboardUser({
    required this.id,
    required this.name,
    required this.xp,
    this.avatarUrl,
    this.avatarColor,
    this.gender,
  });

  factory LeaderboardUser.fromJson(Map<String, dynamic> json) {
    return LeaderboardUser(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Unknown User',
      xp: json['xp'] as int? ?? 0,
      avatarUrl: json['avatar_url'] as String?,
      avatarColor: json['avatar_color'] as String?,
      gender: json['gender'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'xp': xp,
    'avatar_url': avatarUrl,
    'avatar_color': avatarColor,
    'gender': gender,
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
  final int examsCount;

  SubjectStats({
    required this.id,
    required this.name,
    required this.correct,
    required this.wrong,
    required this.skipped,
    required this.total,
    this.examsCount = 0,
  });

  factory SubjectStats.fromJson(Map<String, dynamic> json) {
    return SubjectStats(
      id: json['id'] as String,
      name: json['name'] as String,
      correct: json['correct'] as int,
      wrong: json['wrong'] as int,
      skipped: json['skipped'] as int,
      total: json['total'] as int,
      examsCount: (json['exams_count'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'correct': correct,
    'wrong': wrong,
    'skipped': skipped,
    'total': total,
    'exams_count': examsCount,
  };
}

class UserProfile {
  final String id;
  final String? studentId;
  final String name;
  final String? email;
  final int xp;
  final int monthlyXp;
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
  final int batchChangeCount;
  final bool requiresPhoneVerification;
  final bool isEmailVerified;
  final bool requiresEmailVerification;
  final bool isSubscribed;
  final String? subscriptionStatus;
  final String? subscriptionExpiresAt;
  final String? plan;
  final String? role;
  final String status;

  UserProfile({
    required this.id,
    this.studentId,
    required this.name,
    this.email,
    required this.xp,
    this.monthlyXp = 0,
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
    this.batchChangeCount = 0,
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
    this.requiresPhoneVerification = false,
    this.isEmailVerified = false,
    this.requiresEmailVerification = false,
    this.isSubscribed = false,
    this.subscriptionStatus,
    this.subscriptionExpiresAt,
    this.plan,
    this.role,
    this.status = 'Active',
  });

  bool get isBatchLocked => false; // For now user is not restricted to change batch

  bool get isSscLocked => false; // SSC exam details can now be edited anytime

  bool get isPhoneLocked =>
      (phone != null && phone!.trim().isNotEmpty) && !requiresPhoneVerification;

  bool get isEmailLocked =>
      (email != null && email!.trim().isNotEmpty) &&
      isEmailVerified &&
      !requiresEmailVerification;

  int get batchChangesRemaining => 999;

  bool get isBlocked {
    final s = status.trim().toLowerCase();
    return s == 'blocked' || s == 'suspended' || s == 'banned';
  }

  bool get isPro {
    // 1. Role-based bypass for Admins, Moderators, Teachers
    final r = (role ?? '').toString().toLowerCase().trim();
    if (r == 'admin' ||
        r == 'super admin' ||
        r == 'superadmin' ||
        r == 'moderator' ||
        r == 'teacher') {
      return true;
    }

    // 2. Cancellation / explicit expired status check
    final s = (subscriptionStatus ?? '').toString().toLowerCase().trim();
    if (s == 'expired' || s == 'cancelled' || s == 'canceled') {
      return false;
    }

    // 3. Expiration date check: if provided, must not be expired
    DateTime? expDate;
    if (subscriptionExpiresAt != null && subscriptionExpiresAt!.trim().isNotEmpty) {
      expDate = DateTime.tryParse(subscriptionExpiresAt!.trim());
    }
    final now = DateTime.now();
    if (expDate != null && expDate.isBefore(now)) {
      return false;
    }

    // 4. Plan check: Explicitly free or inactive plans are NEVER pro
    final p = (plan ?? '').toString().toLowerCase().trim();
    final bool isExplicitlyFree = p.isEmpty ||
        p == 'free' ||
        p == 'inactive' ||
        p == 'rookie' ||
        p == 'basic' ||
        p == 'explorer';

    if (isExplicitlyFree) {
      // If plan is explicitly free, ONLY pro if user has an active future expiry
      // and is explicitly marked subscribed
      if (isSubscribed && expDate != null && expDate.isAfter(now)) {
        return true;
      }
      return false;
    }

    final bool isPlanPro = p.contains('pro') ||
        p.contains('premium') ||
        p.contains('ranker') ||
        p.contains('booster') ||
        p.contains('master');

    if (isSubscribed && (expDate == null || expDate.isAfter(now))) {
      return true;
    }

    if (isPlanPro && (expDate == null || expDate.isAfter(now))) {
      return true;
    }

    if (s == 'active' && expDate != null && expDate.isAfter(now)) {
      return true;
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
    return 'OBH-${id.hashCode.abs().toString().padLeft(5, '0').substring(0, 5)}';
  }

  UserProfile copyWith({
    String? id,
    String? studentId,
    String? name,
    String? email,
    int? xp,
    int? monthlyXp,
    String? level,
    String? division,
    String? stream,
    String? optionalSubject,
    String? institute,
    int? streakCount,
    String? phone,
    String? dob,
    String? gender,
    String? address,
    String? batch,
    int? batchChangeCount,
    String? target,
    String? sscRoll,
    String? sscReg,
    String? sscBoard,
    String? sscYear,
    String? avatarUrl,
    String? examTarget,
    int? dailyExamsGoal,
    bool? admissionTrackInterest,
    String? lastStreakDate,
    bool? requiresPhoneVerification,
    bool? isEmailVerified,
    bool? requiresEmailVerification,
    bool? isSubscribed,
    String? subscriptionStatus,
    String? subscriptionExpiresAt,
    String? plan,
    String? role,
    String? status,
  }) {
    return UserProfile(
      id: id ?? this.id,
      studentId: studentId ?? this.studentId,
      name: name ?? this.name,
      email: email ?? this.email,
      xp: xp ?? this.xp,
      monthlyXp: monthlyXp ?? this.monthlyXp,
      level: level ?? this.level,
      division: division ?? this.division,
      stream: stream ?? this.stream,
      optionalSubject: optionalSubject ?? this.optionalSubject,
      institute: institute ?? this.institute,
      streakCount: streakCount ?? this.streakCount,
      phone: phone ?? this.phone,
      dob: dob ?? this.dob,
      gender: gender ?? this.gender,
      address: address ?? this.address,
      batch: batch ?? this.batch,
      batchChangeCount: batchChangeCount ?? this.batchChangeCount,
      target: target ?? this.target,
      sscRoll: sscRoll ?? this.sscRoll,
      sscReg: sscReg ?? this.sscReg,
      sscBoard: sscBoard ?? this.sscBoard,
      sscYear: sscYear ?? this.sscYear,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      examTarget: examTarget ?? this.examTarget,
      dailyExamsGoal: dailyExamsGoal ?? this.dailyExamsGoal,
      admissionTrackInterest: admissionTrackInterest ?? this.admissionTrackInterest,
      lastStreakDate: lastStreakDate ?? this.lastStreakDate,
      requiresPhoneVerification: requiresPhoneVerification ?? this.requiresPhoneVerification,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
      requiresEmailVerification: requiresEmailVerification ?? this.requiresEmailVerification,
      isSubscribed: isSubscribed ?? this.isSubscribed,
      subscriptionStatus: subscriptionStatus ?? this.subscriptionStatus,
      subscriptionExpiresAt: subscriptionExpiresAt ?? this.subscriptionExpiresAt,
      plan: plan ?? this.plan,
      role: role ?? this.role,
      status: status ?? this.status,
    );
  }

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? subJson;
    if (json['subscription'] is Map<String, dynamic>) {
      subJson = json['subscription'] as Map<String, dynamic>;
    } else if (json['subscription'] is Map) {
      subJson = Map<String, dynamic>.from(json['subscription'] as Map);
    } else if (json['subscription'] is String && (json['subscription'] as String).trim().startsWith('{')) {
      try {
        final decoded = jsonDecode(json['subscription'] as String);
        if (decoded is Map) {
          subJson = Map<String, dynamic>.from(decoded);
        }
      } catch (_) {}
    }

    final rawSubStatus = (json['subscription_status'] ?? '').toString().trim();
    final rawStatus = (subJson?['status'] ?? json['subscription_status'])?.toString().trim();
    final rawExp = subJson?['expiry']?.toString() ??
        subJson?['expires_at']?.toString() ??
        json['subscription_expires_at']?.toString() ??
        json['expires_at']?.toString() ??
        json['subscription_end_date']?.toString();
    final expDate = rawExp != null && rawExp.trim().isNotEmpty ? DateTime.tryParse(rawExp.trim()) : null;
    final now = DateTime.now();
    final bool isExpired = expDate != null && expDate.isBefore(now);
    final bool hasValidFutureExpiry = expDate != null && expDate.isAfter(now);

    final rawPlan = (subJson?['plan'] ??
        subJson?['plan_name'] ??
        json['plan'] ??
        json['subscription_tier'] ??
        '')
        .toString()
        .trim();

    final rawPlanLower = rawPlan.toLowerCase().trim();
    final bool isExplicitlyFree = rawPlanLower.isEmpty ||
        rawPlanLower == 'free' ||
        rawPlanLower == 'inactive' ||
        rawPlanLower == 'rookie' ||
        rawPlanLower == 'basic' ||
        rawPlanLower == 'explorer';

    final bool isPlanPro = rawPlanLower.contains('pro') ||
        rawPlanLower.contains('premium') ||
        rawPlanLower.contains('ranker') ||
        rawPlanLower.contains('booster') ||
        rawPlanLower.contains('master');

    final roleStr = (json['role'] ?? '').toString().toLowerCase().trim();
    final bool isAdmin = roleStr == 'admin' ||
        roleStr == 'super admin' ||
        roleStr == 'superadmin' ||
        roleStr == 'moderator' ||
        roleStr == 'teacher';

    final bool isMarkedSubscribed = json['is_subscribed'] == true ||
        rawSubStatus.toLowerCase() == 'active' ||
        json['is_pro'] == true ||
        (subJson?['is_pro'] == true);

    bool isSub = false;
    if (isAdmin) {
      isSub = true;
    } else if (isExpired) {
      isSub = false;
    } else if (isExplicitlyFree) {
      // An explicitly Free plan is NEVER Pro unless they have a verified active future subscription
      isSub = isMarkedSubscribed && hasValidFutureExpiry;
    } else if (isPlanPro) {
      isSub = !isExpired;
    } else if (isMarkedSubscribed && hasValidFutureExpiry) {
      isSub = true;
    }

    int monthlyXpVal = (json['monthly_xp'] as num?)?.toInt() ?? 0;
    final rawResetAt = json['monthly_xp_reset_at'] as String?;
    if (rawResetAt != null) {
      final resetDate = DateTime.tryParse(rawResetAt);
      final now = DateTime.now().toUtc();
      if (resetDate != null && (now.year > resetDate.year || now.month > resetDate.month)) {
        monthlyXpVal = 0;
      }
    }

    return UserProfile(
      id: json['id'] as String,
      studentId: json['student_id'] as String?,
      name: json['name'] as String? ?? 'Unknown User',
      email: json['email'] as String?,
      xp: (json['xp'] as num?)?.toInt() ?? 0,
      monthlyXp: monthlyXpVal,
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
      batchChangeCount: (json['batch_change_count'] as num?)?.toInt() ?? 0,
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
      requiresPhoneVerification:
          json['requires_phone_verification'] == true ||
          json['is_phone_verified'] == false,
      isEmailVerified: json['is_email_verified'] == true,
      requiresEmailVerification: json['requires_email_verification'] == true,
      isSubscribed: isSub,
      subscriptionStatus: rawStatus,
      subscriptionExpiresAt: rawExp,
      plan: rawPlan.isNotEmpty ? rawPlan : (isSub ? 'Pro' : 'Free'),
      role: json['role'] as String?,
      status: json['status'] as String? ?? 'Active',
    );
  }
}
