const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { getUserWorkout } = require("../controllers/workout.controller");
const router = express.Router();

router.get("/get", authMiddleware, getUserWorkout);

module.exports = router;
