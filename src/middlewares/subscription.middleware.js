const subscriptionModel = require("../models/subscription.model");
const UserModel = require("../models/user.model");

require("dotenv").config();

const subscriptionMiddleware = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      console.warn("⚠️ User not found:", req.userId);
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.email === "admin@fitness.com") {
      console.log("✅ Admin user, bypassing subscription check");
      return next();
    }
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
