class SubscriptionPlan {
  final String id;
  final String name;
  final int price;
  final String billingCycle;
  final int durationDays;
  final String currency;
  final List<String> features;
  final String colorTheme;
  final String? expiresAt;

  SubscriptionPlan({
    required this.id,
    required this.name,
    required this.price,
    required this.billingCycle,
    required this.durationDays,
    required this.currency,
    required this.features,
    required this.colorTheme,
    this.expiresAt,
  });

  factory SubscriptionPlan.fromJson(
    Map<String, dynamic> j, {
    String? expiresAt,
  }) {
    final days = (j['duration_days'] as num?)?.toInt() ?? 30;
    String cycle;
    if (days >= 365) {
      cycle = 'Yearly';
    } else if (days >= 90) {
      cycle = 'Quarterly';
    } else {
      cycle = 'Monthly';
    }
    final rawFeatures = j['features'];
    List<String> features;
    if (rawFeatures is List) {
      features = rawFeatures.map((f) => f.toString()).toList();
    } else {
      features = [];
    }
    return SubscriptionPlan(
      id: j['id']?.toString() ?? '',
      name: (j['display_name'] ?? j['name'])?.toString() ?? '',
      price: ((j['price'] as num?)?.toInt()) ?? 0,
      billingCycle: cycle,
      durationDays: days,
      currency: (j['currency'] as String?)?.replaceAll('BDT', '৳') ?? '৳',
      features: features,
      colorTheme: days >= 90 ? 'rose' : 'emerald',
      expiresAt: expiresAt,
    );
  }
}

class Invoice {
  final String id;
  final String date;
  final int amount;
  final String currency;
  final String status; // 'paid' | 'Approved' | 'Pending' | 'Rejected'
  final String planName;

  Invoice({
    required this.id,
    required this.date,
    required this.amount,
    required this.currency,
    required this.status,
    required this.planName,
  });

  factory Invoice.fromJson(Map<String, dynamic> j) {
    final rawDate = j['requested_at'] ?? j['created_at'] ?? '';
    String formattedDate = rawDate.toString().substring(0, 10);
    final rawStatus = (j['status'] as String?) ?? 'Pending';
    // Normalize status to match BillingHistoryCard expectations
    final status = rawStatus == 'Approved'
        ? 'paid'
        : rawStatus == 'Pending'
        ? 'pending'
        : rawStatus == 'Rejected'
        ? 'rejected'
        : rawStatus.toLowerCase();
    return Invoice(
      id: j['id']?.toString() ?? '',
      date: formattedDate,
      amount: ((j['amount'] as num?)?.toInt()) ?? 0,
      currency: '৳',
      status: status,
      planName: (j['plan_name'] as String?) ?? '',
    );
  }
}

class PaymentMethod {
  final String id;
  final String type; // 'card' | 'bkash' | 'nagad'
  final String? last4;
  final String? expiry;
  final String? number;
  final bool isDefault;

  PaymentMethod({
    required this.id,
    required this.type,
    this.last4,
    this.expiry,
    this.number,
    required this.isDefault,
  });
}

class PaymentSubmission {
  final String id;
  final String userId;
  final String userName;
  final String planId;
  final String planName;
  final int amount;
  final String paymentMethod;
  final String senderNumber;
  final String transactionId;
  final String status;
  final String submittedAt;

  PaymentSubmission({
    required this.id,
    required this.userId,
    required this.userName,
    required this.planId,
    required this.planName,
    required this.amount,
    required this.paymentMethod,
    required this.senderNumber,
    required this.transactionId,
    required this.status,
    required this.submittedAt,
  });
}
