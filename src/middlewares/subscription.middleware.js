const subscriptionModel = require("../models/subscription.model");

require("dotenv").config();

const subscriptionMiddleware = async (req, res, next) => {
  try {
    const subscription = await subscriptionModel.findOne({ user: req.userId });

    if (!subscription) {
      console.warn("⚠️ No subscription found for user:", req.userId);
      return res.status(403).json({
        success: false,
        redirectToSubscription: true,
        message: "Subscription required",
      });
    }

    if (!["active", "trialing"].includes(subscription.status)) {
      console.warn("⚠️ Subscription not active/trialing:", subscription.status);
      return res.status(403).json({
        success: false,
        redirectToSubscription: true,
        message: "Subscription expired or inactive",
      });
    }

    console.log("✅ Subscription valid:", subscription.status);
    next();
  } catch (err) {
    console.error("❌ Subscription check error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = subscriptionMiddleware;
