const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const {
  createSubscription,
  getSubscriptionStatus,
  cancelSubscription,
  completeApplePaySubscription,
} = require("../controllers/subscription.controller");

router.post("/create-subscription", authMiddleware, createSubscription);
router.get("/subscription-status", authMiddleware, getSubscriptionStatus);
router.post("/cancel-subscription", authMiddleware, cancelSubscription);
router.post(
  "/complete-apple-pay-subscription",
  authMiddleware,
  completeApplePaySubscription
);

module.exports = router;
