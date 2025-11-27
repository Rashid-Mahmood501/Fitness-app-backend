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

    // Bypass subscription check for admin
    if (user.email === "admin@fitness.com") {
      console.log("✅ Admin user, bypassing subscription check");
      return next();
    }

    // Check RevenueCat subscription status
    if (!user.hasActiveSubscription) {
      console.warn("⚠️ No active subscription for user:", req.userId);
      return res.status(403).json({
        success: false,
        redirectToSubscription: true,
        message: "Subscription required",
      });
    }

    // Check if subscription has expired
    if (user.subscriptionExpirationDate && new Date(user.subscriptionExpirationDate) < new Date()) {
      console.warn("⚠️ Subscription expired for user:", req.userId);
      // Update user status
      await UserModel.findByIdAndUpdate(req.userId, {
        hasActiveSubscription: false,
      });
      return res.status(403).json({
        success: false,
        redirectToSubscription: true,
        message: "Subscription expired",
      });
    }

    console.log("✅ Subscription valid for user:", req.userId);
    next();
  } catch (err) {
    console.error("❌ Subscription check error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = subscriptionMiddleware;
