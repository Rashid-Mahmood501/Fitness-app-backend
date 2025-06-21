const express = require("express");
const {
  saveMeal,
  getAllMeals,
  updateMeal,
  deleteMeal,
} = require("../controllers/adminMeal.controller");
const { imageUpload } = require("../middlewares/upload");
const router = express.Router();

router.post("/save", imageUpload.single("image"), saveMeal);
router.get("/all", getAllMeals);
router.put("update/:id", imageUpload.single("image"), updateMeal);
router.delete("/delete/:id", deleteMeal);
module.exports = router;
