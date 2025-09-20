const express = require("express");
const {
  getAllUserWorkoutPlans,
  updateWorkoutPlan,
} = require("../controllers/adminUserWorkoutPlan.controller");

const router = express.Router();

router.get("/all", getAllUserWorkoutPlans);
router.put("/update/:id", updateWorkoutPlan);

module.exports = router;
