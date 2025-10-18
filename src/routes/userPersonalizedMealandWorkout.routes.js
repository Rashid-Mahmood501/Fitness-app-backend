const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getUserWorkoutAndMeal,
} = require("../controllers/userPersonalizedMealandWorkout.controller");

const router = express.Router();

router.get("/get", authMiddleware, getUserWorkoutAndMeal);

module.exports = router;
