const subscriptionModel = require("../models/subscription.model");
const RevenuecatSubscription = require("../models/revenuecatSubscription.model");

require("dotenv").config();

const subscriptionMiddleware = async (req, res, next) => {
  try {
    // Check RevenueCat subscription first (iOS subscriptions)
    const revenuecatSubscription = await RevenuecatSubscription.findOne({
      user: req.userId,
      status: "active",
      expiresAt: { $gt: new Date() }
    }).sort({ expiresAt: -1 });

    if (revenuecatSubscription) {
      console.log("✅ RevenueCat subscription valid:", revenuecatSubscription.productId);
      req.subscription = revenuecatSubscription;
      req.subscriptionType = "revenuecat";
      return next();
    }

    // Fallback to Stripe subscription (legacy web subscriptions)
    const stripeSubscription = await subscriptionModel.findOne({ user: req.userId });

    if (stripeSubscription && ["active", "trialing"].includes(stripeSubscription.status)) {
      console.log("✅ Stripe subscription valid:", stripeSubscription.status);
      req.subscription = stripeSubscription;
      req.subscriptionType = "stripe";
      return next();
    }

    // No valid subscription found
    console.warn("⚠️ No active subscription found for user:", req.userId);
    return res.status(403).json({
      success: false,
      redirectToSubscription: true,
      message: "Active subscription required to access this feature",
    });
  } catch (err) {
    console.error("❌ Subscription check error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = subscriptionMiddleware;
