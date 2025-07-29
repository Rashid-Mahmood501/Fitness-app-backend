const express = require("express");
const {
  saveWorkoutPlan,
  getAllWorkoutPlans,
  updateWorkoutPlan,
} = require("../controllers/adminWorkoutPlan.contoller");

const router = express.Router();

router.post("/save", saveWorkoutPlan);
router.get("/all", getAllWorkoutPlans);
router.put("/update/:id", updateWorkoutPlan);

module.exports = router;
