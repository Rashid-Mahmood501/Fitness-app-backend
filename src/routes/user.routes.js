const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateCurrentWeight,
} = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.post("/update-weight", authMiddleware, updateCurrentWeight);

module.exports = router;
 