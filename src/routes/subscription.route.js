const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const {
  createSubscription,
  getSubscriptionStatus,
  cancelSubscription,
} = require("../controllers/subscription.controller");
const subscriptionMiddleware = require("../middlewares/subscription.middleware");

router.post("/create-subscription", authMiddleware, createSubscription);
router.get("/subscription-status", authMiddleware, subscriptionMiddleware, getSubscriptionStatus);
router.post("/cancel-subscription", authMiddleware, cancelSubscription);

module.exports = router;
