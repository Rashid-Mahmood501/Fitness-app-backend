const RevenuecatSubscription = require("../models/revenuecatSubscription.model");

// Middleware to check if user has active RevenueCat subscription
const checkRevenuecatSubscription = async (req, res, next) => {
  try {
    const userId = req.userId; // Assumes auth middleware sets req.userId

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    // Check for active subscription
    const subscription = await RevenuecatSubscription.findOne({
      user: userId,
      status: "active",
      expiresAt: { $gt: new Date() }
    }).sort({ expiresAt: -1 });

    if (!subscription) {
      return res.status(403).json({
        error: "Active subscription required",
        message: "Please subscribe to access premium features"
      });
    }

    // Attach subscription info to request for use in route handlers
    req.subscription = subscription;

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ error: "Error checking subscription status" });
  }
};

// Middleware to check if user has specific entitlement
const checkEntitlement = (requiredEntitlement = "Pro") => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          error: "Authentication required"
        });
      }

      const subscription = await RevenuecatSubscription.findOne({
        user: userId,
        status: "active",
        expiresAt: { $gt: new Date() },
        entitlementId: requiredEntitlement
      }).sort({ expiresAt: -1 });

      if (!subscription) {
        return res.status(403).json({
          error: `${requiredEntitlement} entitlement required`,
          message: `Please subscribe to access this feature`
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      console.error("Entitlement check error:", error);
      res.status(500).json({ error: "Error checking entitlement" });
    }
  };
};

// Middleware to attach subscription info (doesn't block if no subscription)
const attachSubscriptionInfo = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return next();
    }

    const subscription = await RevenuecatSubscription.findOne({
      user: userId,
      status: "active",
      expiresAt: { $gt: new Date() }
    }).sort({ expiresAt: -1 });

    req.subscription = subscription || null;
    req.hasActiveSubscription = !!subscription;

    next();
  } catch (error) {
    console.error("Attach subscription info error:", error);
    // Don't block the request, just log the error
    req.subscription = null;
    req.hasActiveSubscription = false;
    next();
  }
};

module.exports = {
  checkRevenuecatSubscription,
  checkEntitlement,
  attachSubscriptionInfo
};
