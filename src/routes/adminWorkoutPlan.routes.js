const express = require("express");
const {
  saveWorkoutPlan,
  getAllWorkoutPlans,
  updateWorkoutPlan,
  deleteWorkoutPlan,
} = require("../controllers/adminWorkoutPlan.contoller");

const router = express.Router();

router.post("/save", saveWorkoutPlan);
router.get("/all", getAllWorkoutPlans);
router.put("/update/:id", updateWorkoutPlan);
router.delete("/delete/:id", deleteWorkoutPlan);

module.exports = router;
