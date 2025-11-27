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
  getRevenueCatStatus,
  syncRevenueCatSubscription,
  revenueCatWebhook,
} = require("../controllers/revenuecat.controller");

// Get subscription status from RevenueCat
router.get("/revenuecat-status", authMiddleware, getRevenueCatStatus);

// Sync RevenueCat subscription with backend
router.post("/sync-revenuecat", authMiddleware, syncRevenueCatSubscription);

// RevenueCat webhook endpoint (no auth middleware - RevenueCat will send events)
// You should verify the webhook signature in production
router.post("/revenuecat-webhook", revenueCatWebhook);

module.exports = router;
