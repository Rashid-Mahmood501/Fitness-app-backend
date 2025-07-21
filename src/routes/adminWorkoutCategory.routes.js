const express = require("express");
const {
  saveWorkoutCategory,
} = require("../controllers/adminWorkoutCategory.controller");
const {
  getAllWorkoutCategories,
} = require("../controllers/adminWorkoutCategory.controller");
const {
  updateWorkoutCategory,
} = require("../controllers/adminWorkoutCategory.controller");
const router = express.Router();

router.post("/save", saveWorkoutCategory);
router.get("/all", getAllWorkoutCategories);
router.put("/update/:id", updateWorkoutCategory);

module.exports = router;
