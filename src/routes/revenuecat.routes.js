const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  syncUser,
  verifySubscription,
  getSubscriptionStatus,
  getSubscriptionHistory,
  grantAccess,
  getFailedWebhooks,
  reprocessFailedWebhooks,
  getWebhookStats
} = require("../controllers/revenuecat.controller");

// User sync endpoint - links backend user to RevenueCat subscriber
router.post("/users/sync", authMiddleware, syncUser);

// Subscription verification - check if user has active subscription
router.get("/subscriptions/verify/:userId", authMiddleware, verifySubscription);

// Get detailed subscription status
router.get("/subscriptions/status/:userId", authMiddleware, getSubscriptionStatus);

// Get subscription history
router.get("/subscriptions/history/:userId", authMiddleware, getSubscriptionHistory);

// Admin: Manually grant access (for support/testing)
router.post("/subscriptions/grant-access", authMiddleware, grantAccess);

// Admin: Get webhook statistics
router.get("/webhooks/stats", authMiddleware, getWebhookStats);

// Admin: Get failed webhook events
router.get("/webhooks/failed", authMiddleware, getFailedWebhooks);

// Admin: Reprocess failed webhook events
router.post("/webhooks/reprocess", authMiddleware, reprocessFailedWebhooks);

module.exports = router;
