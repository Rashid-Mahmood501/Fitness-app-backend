const express = require("express");
const {
  saveMeal,
  getAllMeals,
  updateMeal,
  deleteMeal,
  uploadImage,
} = require("../controllers/adminMeal.controller");
const { imageUpload } = require("../middlewares/upload");
const router = express.Router();

router.post("/save", saveMeal);

router.post("/upload-image", imageUpload.single("image"), uploadImage);

module.exports = router;
