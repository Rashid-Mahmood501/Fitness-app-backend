const express = require("express");
const {
  saveMeal,
  uploadImage,
  getAllMealsPlans,
  updateMealInDay,
  addMealToDay,
  deleteMealFromDay,
  getAllUserMealPlans,
  updateUserMealInDay,
  deleteUserMealFromDay,
  addUserMealToDay,
} = require("../controllers/adminMeal.controller");
const { imageUpload } = require("../middlewares/upload");
const router = express.Router();

router.post("/save", saveMeal);
router.put("/update-meal-in-day", updateMealInDay);
router.put("/update-user-meal-in-day", updateUserMealInDay);
router.post("/add-meal-to-day", addMealToDay);
router.post("/add-user-meal-to-day", addUserMealToDay);
router.get("/all", getAllMealsPlans);
router.delete("/delete-meal-from-day", deleteMealFromDay);
router.delete("/delete-user-meal-from-day", deleteUserMealFromDay);
router.get("/all-user-meal-plans", getAllUserMealPlans);


router.post("/upload-image", imageUpload.single("image"), uploadImage);

module.exports = router;
