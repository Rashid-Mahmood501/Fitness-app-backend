const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const {
  createSubscription,
  getSubscriptionStatus,
  cancelSubscription,
} = require("../controllers/subscription.controller");

// router.post("/create-customer", authMiddleware, createCustomer);
// router.post("/create-setup-intent", authMiddleware, createSetupIntent);
router.post("/create-subscription",  createSubscription);
router.get("/subscription-status",  getSubscriptionStatus);
router.post("/cancel-subscription",  cancelSubscription);

module.exports = router;
