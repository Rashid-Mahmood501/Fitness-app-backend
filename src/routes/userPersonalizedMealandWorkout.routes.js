const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const subscriptionMiddleware = require("../middlewares/subscription.middleware");
const {
  getUserWorkoutAndMeal,
} = require("../controllers/userPersonalizedMealandWorkout.controller");

const router = express.Router();

// Personalized plans require active subscription
router.get("/get", authMiddleware, subscriptionMiddleware, getUserWorkoutAndMeal);

module.exports = router;
