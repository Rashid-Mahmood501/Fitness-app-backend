const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getUserWorkout,
  getAllWorkoutCategories,
} = require("../controllers/workout.controller");
const router = express.Router();

router.get("/get", authMiddleware, getUserWorkout);
router.get("/workout-category", authMiddleware, getAllWorkoutCategories);

module.exports = router;
