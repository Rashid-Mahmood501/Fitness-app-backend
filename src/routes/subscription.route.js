const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const {
  createSubscription,
  getSubscriptionStatus,
  cancelSubscription,
} = require("../controllers/subscription.controller");

router.post("/create", authMiddleware, createSubscription);
router.get("/status", authMiddleware, getSubscriptionStatus);
router.post("/cancel", authMiddleware, cancelSubscription);

module.exports = router;
