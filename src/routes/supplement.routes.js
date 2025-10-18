const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { getSupplements } = require("../controllers/supplement.controller");
const subscriptionMiddleware = require("../middlewares/subscription.middleware");
const router = express.Router();

router.get("/get", authMiddleware, subscriptionMiddleware, getSupplements);

module.exports = router; 