const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getUserWorkout,
  getAllWorkoutCategories,
} = require("../controllers/workout.controller");
const subscriptionMiddleware = require("../middlewares/subscription.middleware");
const router = express.Router();

router.get("/get", authMiddleware, subscriptionMiddleware, getUserWorkout);
router.get("/workout-category", authMiddleware, getAllWorkoutCategories);

module.exports = router;
