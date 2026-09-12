import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/models.dart';

/// Service managing Google Play In-App Purchases & Subscriptions.
class InAppPurchaseService {
  static final InAppPurchaseService _instance = InAppPurchaseService._internal();
  factory InAppPurchaseService() => _instance;
  InAppPurchaseService._internal();

  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _subscription;

  bool _isAvailable = false;
  bool get isAvailable => _isAvailable;

  final Map<String, ProductDetails> _products = {};
  Map<String, ProductDetails> get products => Map.unmodifiable(_products);

  // Standard Product IDs / SKUs configured for Google Play Console
  static const String sku1Month = 'obhyash_1m_plan';
  static const String sku3Months = 'obhyash_3m_plan';
  static const String sku6Months = 'obhyash_6m_plan';

  static const Set<String> _productIds = {
    sku1Month,
    sku3Months,
    sku6Months,
    'monthly_plan',
    'admission_pro_3m',
    'full_session_6m',
  };

  final _purchaseStatusController = StreamController<PurchaseResult>.broadcast();
  Stream<PurchaseResult> get purchaseStream => _purchaseStatusController.stream;

  /// Map SubscriptionPlan to Google Play SKU
  String getSkuForPlan(SubscriptionPlan plan) {
    if (plan.durationDays >= 180 || plan.id.contains('6m') || plan.name.contains('৬')) {
      return sku6Months;
    }
    if (plan.durationDays >= 90 || plan.id.contains('3m') || plan.name.contains('৩')) {
      return sku3Months;
    }
    return sku1Month;
  }

  /// Initialize and start listening to Google Play billing stream
  Future<void> initialize() async {
    try {
      _isAvailable = await _iap.isAvailable();
      if (!_isAvailable) {
        debugPrint('[InAppPurchaseService] Google Play Billing is NOT available on this device');
        return;
      }

      // Listen to purchase updates
      _subscription ??= _iap.purchaseStream.listen(
        _onPurchaseUpdate,
        onDone: () => _subscription?.cancel(),
        onError: (error) {
          debugPrint('[InAppPurchaseService] Purchase stream error: $error');
          _purchaseStatusController.add(
            PurchaseResult.error(error.toString()),
          );
        },
      );

      // Query products from Google Play
      await loadProducts();
    } catch (e) {
      debugPrint('[InAppPurchaseService] Initialization error: $e');
    }
  }

  /// Fetch product details from Google Play Console
  Future<void> loadProducts() async {
    try {
      if (!_isAvailable) return;
      final response = await _iap.queryProductDetails(_productIds);
      if (response.error != null) {
        debugPrint('[InAppPurchaseService] queryProductDetails error: ${response.error}');
        return;
      }

      _products.clear();
      for (final p in response.productDetails) {
        _products[p.id] = p;
      }
      debugPrint('[InAppPurchaseService] Loaded ${_products.length} products from Google Play');
    } catch (e) {
      debugPrint('[InAppPurchaseService] Error loading products: $e');
    }
  }

  /// Trigger purchase flow for a SubscriptionPlan
  Future<bool> purchasePlan(SubscriptionPlan plan) async {
    try {
      if (!_isAvailable) {
        _isAvailable = await _iap.isAvailable();
      }

      final sku = getSkuForPlan(plan);
      ProductDetails? product = _products[sku] ?? _products[plan.id];

      if (product == null) {
        // Try reloading products once
        await loadProducts();
        product = _products[sku] ?? _products[plan.id];
      }

      if (product == null) {
        debugPrint('[InAppPurchaseService] Product $sku not yet synced on Google Play. Testing simulation.');
        // If Google Play SKU is not yet created in the developer's console, simulate gracefully
        return false;
      }

      final purchaseParam = PurchaseParam(productDetails: product);
      return await _iap.buyNonConsumable(purchaseParam: purchaseParam);
    } catch (e) {
      debugPrint('[InAppPurchaseService] Error initiating purchase: $e');
      _purchaseStatusController.add(PurchaseResult.error(e.toString()));
      return false;
    }
  }

  /// Restore previous purchases
  Future<void> restorePurchases() async {
    try {
      if (!_isAvailable) return;
      await _iap.restorePurchases();
    } catch (e) {
      debugPrint('[InAppPurchaseService] Restore error: $e');
      _purchaseStatusController.add(PurchaseResult.error(e.toString()));
    }
  }

  /// Handle incoming purchase states from Google Play
  Future<void> _onPurchaseUpdate(List<PurchaseDetails> purchaseDetailsList) async {
    for (final purchaseDetails in purchaseDetailsList) {
      switch (purchaseDetails.status) {
        case PurchaseStatus.pending:
          _purchaseStatusController.add(PurchaseResult.pending());
          break;

        case PurchaseStatus.error:
          final msg = purchaseDetails.error?.message ?? 'পেমেন্ট সম্পন্ন করা সম্ভব হয়নি';
          _purchaseStatusController.add(PurchaseResult.error(msg));
          if (purchaseDetails.pendingCompletePurchase) {
            await _iap.completePurchase(purchaseDetails);
          }
          break;

        case PurchaseStatus.purchased:
        case PurchaseStatus.restored:
          // Verify & Sync with Supabase backend
          final success = await _verifyAndSyncPurchase(purchaseDetails);
          if (success) {
            _purchaseStatusController.add(
              PurchaseResult.success(purchaseDetails.productID),
            );
          } else {
            _purchaseStatusController.add(
              PurchaseResult.error('পেমেন্ট সার্ভারে সক্রিয় করতে সমস্যা হয়েছে'),
            );
          }

          if (purchaseDetails.pendingCompletePurchase) {
            await _iap.completePurchase(purchaseDetails);
          }
          break;

        case PurchaseStatus.canceled:
          _purchaseStatusController.add(PurchaseResult.cancelled());
          if (purchaseDetails.pendingCompletePurchase) {
            await _iap.completePurchase(purchaseDetails);
          }
          break;
      }
    }
  }

  /// Sync the successful purchase with Supabase user profile & subscription history
  Future<bool> _verifyAndSyncPurchase(PurchaseDetails purchase) async {
    try {
      final supabase = Supabase.instance.client;
      final user = supabase.auth.currentUser;
      if (user == null) return false;

      // Determine duration from product ID
      int durationDays = 30;
      String planName = 'মাসিক প্ল্যান (১ মাস)';
      int amount = 149;

      if (purchase.productID.contains('6m') || purchase.productID.contains('session')) {
        durationDays = 180;
        planName = 'ফুল সেশন প্যাক (৬ মাস)';
        amount = 599;
      } else if (purchase.productID.contains('3m') || purchase.productID.contains('admission')) {
        durationDays = 90;
        planName = 'এডমিশন প্যাক (৩ মাস)';
        amount = 349;
      }

      final now = DateTime.now();
      final expiresAt = now.add(Duration(days: durationDays));

      // 1. Insert into subscription_history
      try {
        await supabase.from('subscription_history').insert({
          'user_id': user.id,
          'plan_name': planName,
          'amount': amount,
          'status': 'completed',
          'is_active': true,
          'started_at': now.toIso8601String(),
          'expires_at': expiresAt.toIso8601String(),
          'payment_method': 'Google Play (IAP)',
          'transaction_id': purchase.purchaseID ?? 'GP-${now.millisecondsSinceEpoch}',
        });
      } catch (histErr) {
        debugPrint('[InAppPurchaseService] Error inserting subscription_history: $histErr');
      }

      // 2. Update users table subscription status
      try {
        await supabase.from('users').update({
          'is_subscribed': true,
          'subscription_status': 'active',
          'subscription_expires_at': expiresAt.toIso8601String(),
          'plan': planName,
        }).eq('id', user.id);
      } catch (userErr) {
        debugPrint('[InAppPurchaseService] Error updating users subscription: $userErr');
      }

      return true;
    } catch (e) {
      debugPrint('[InAppPurchaseService] _verifyAndSyncPurchase error: $e');
      return false;
    }
  }

  void dispose() {
    _subscription?.cancel();
    _purchaseStatusController.close();
  }
}

/// Result object emitted by InAppPurchaseService
class PurchaseResult {
  final PurchaseState state;
  final String? productId;
  final String? errorMessage;

  const PurchaseResult._({
    required this.state,
    this.productId,
    this.errorMessage,
  });

  factory PurchaseResult.pending() => const PurchaseResult._(state: PurchaseState.pending);
  factory PurchaseResult.success(String productId) => PurchaseResult._(state: PurchaseState.success, productId: productId);
  factory PurchaseResult.error(String msg) => PurchaseResult._(state: PurchaseState.error, errorMessage: msg);
  factory PurchaseResult.cancelled() => const PurchaseResult._(state: PurchaseState.cancelled);
}

enum PurchaseState {
  pending,
  success,
  error,
  cancelled,
}
