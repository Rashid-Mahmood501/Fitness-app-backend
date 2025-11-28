const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

// DEPRECATED: Stripe subscription routes (kept for reference)
// const {
//   createSubscription,
//   getSubscriptionStatus,
//   cancelSubscription,
//   reactivateSubscription,
// } = require("../controllers/subscription.controller");
// const subscriptionMiddleware = require("../middlewares/subscription.middleware");

// router.post("/create-subscription", authMiddleware, createSubscription);
// router.get("/subscription-status", authMiddleware, subscriptionMiddleware, getSubscriptionStatus);
// router.post("/cancel-subscription", authMiddleware, cancelSubscription);
// router.post("/reactivate-subscription", authMiddleware, reactivateSubscription);

// RevenueCat subscription routes
const {
  getSubscriptionStatus,
  syncUser,
} = require("../controllers/revenuecat.controller");

// Get subscription status from RevenueCat
router.get("/revenuecat-status", authMiddleware, getSubscriptionStatus);

// DEPRECATED: Manual sync endpoint (no longer needed - webhook handles this automatically)
// Kept for backwards compatibility but not recommended to use
router.post("/sync-revenuecat", authMiddleware, syncUser);

module.exports = router;
