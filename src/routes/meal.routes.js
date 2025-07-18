const express = require("express");
const router = express.Router();
const {
  suggestAllMeals,
  saveUserMeals,
  getUserMeals,
} = require("../controllers/meal.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/suggest", authMiddleware,  suggestAllMeals);
router.post("/save", authMiddleware, saveUserMeals);
router.get("/user-meals", authMiddleware, getUserMeals);

module.exports = router;
