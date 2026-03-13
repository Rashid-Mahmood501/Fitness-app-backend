const subscriptionModel = require("../models/subscription.model");
const RevenuecatSubscription = require("../models/revenuecatSubscription.model");
const { verifyAndSyncSubscription } = require("../services/revenuecat.service");

require("dotenv").config();

const subscriptionMiddleware = async (req, res, next) => {
  try {
    console.log(`🔒 [Subscription Check] Starting for user: ${req.userId}`);

    // Check RevenueCat subscription first (iOS/Android subscriptions)
    const revenuecatSubscription = await RevenuecatSubscription.findOne({
      user: req.userId,
      status: "active",
      expiresAt: { $gt: new Date() }
    }).sort({ expiresAt: -1 });

    if (revenuecatSubscription) {
      console.log("✅ [Subscription Check] RevenueCat subscription valid (from DB):", revenuecatSubscription.productId);
      req.subscription = revenuecatSubscription;
      req.subscriptionType = "revenuecat";
      return next();
    }

    // Fallback to Stripe subscription (legacy web subscriptions)
    const stripeSubscription = await subscriptionModel.findOne({ user: req.userId });

    if (stripeSubscription && ["active", "trialing"].includes(stripeSubscription.status)) {
      console.log("✅ [Subscription Check] Stripe subscription valid:", stripeSubscription.status);
      req.subscription = stripeSubscription;
      req.subscriptionType = "stripe";
      return next();
    }

    // No subscription found in database - check RevenueCat API directly
    // This handles the race condition where webhook hasn't arrived yet
    console.log(`⚠️ [Subscription Check] No subscription in DB, checking RevenueCat API directly...`);

    const apiResult = await verifyAndSyncSubscription(req.userId);

    if (apiResult.hasActiveSubscription && apiResult.subscription) {
      console.log(`✅ [Subscription Check] Active subscription confirmed via RevenueCat API!`);
      console.log(`   Source: ${apiResult.source}`);
      console.log(`   Product: ${apiResult.subscription.productId}`);
      console.log(`   Expires: ${apiResult.subscription.expiresAt}`);
      req.subscription = apiResult.subscription;
      req.subscriptionType = "revenuecat";
      return next();
    }

    // No valid subscription found anywhere
    console.warn(`⚠️ [Subscription Check] No active subscription found for user: ${req.userId}`);
    console.warn(`   DB check: No active RevenueCat or Stripe subscription`);
    console.warn(`   API check: ${apiResult.source}`);
    return res.status(403).json({
      success: false,
      redirectToSubscription: true,
      message: "Active subscription required to access this feature",
    });
  } catch (err) {
    console.error("❌ [Subscription Check] Error:", err.message);
    console.error(err.stack);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = subscriptionMiddleware;
