class SubscriptionPlan {
  final String id;
  final String name;
  final int price;
  final String billingCycle;
  final String currency;
  final List<String> features;
  final String colorTheme;
  final String? expiresAt;

  SubscriptionPlan({
    required this.id,
    required this.name,
    required this.price,
    required this.billingCycle,
    required this.currency,
    required this.features,
    required this.colorTheme,
    this.expiresAt,
  });
}

class Invoice {
  final String id;
  final String date;
  final int amount;
  final String currency;
  final String
  status; // 'paid' | 'valid' | 'pending' | 'checking' | 'failed' | 'rejected'
  final String planName;

  Invoice({
    required this.id,
    required this.date,
    required this.amount,
    required this.currency,
    required this.status,
    required this.planName,
  });
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
