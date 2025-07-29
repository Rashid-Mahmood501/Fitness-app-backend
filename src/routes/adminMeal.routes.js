const express = require("express");
const {
  saveMeal,
  uploadImage,
  getAllMealsPlans,
  updateMealInDay,
  addMealToDay,
  deleteMealFromDay,
} = require("../controllers/adminMeal.controller");
const { imageUpload } = require("../middlewares/upload");
const router = express.Router();

router.post("/save", saveMeal);
router.put("/update-meal-in-day", updateMealInDay);
router.post("/add-meal-to-day", addMealToDay);
router.get("/all", getAllMealsPlans);
router.delete("/delete-meal-from-day", deleteMealFromDay);

router.post("/upload-image", imageUpload.single("image"), uploadImage);

module.exports = router;
