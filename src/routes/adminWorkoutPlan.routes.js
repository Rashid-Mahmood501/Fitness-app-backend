const express = require("express");
const { saveWorkoutPlan } = require("../controllers/adminWorkoutPlan.contoller");

const router = express.Router();

router.post("/save", saveWorkoutPlan);

module.exports = router;
