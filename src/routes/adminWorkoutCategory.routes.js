const express = require("express");
const {
  saveWorkoutCategory,
  deleteWorkoutCategory,
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
router.delete("/delete/:id", deleteWorkoutCategory);

module.exports = router;
