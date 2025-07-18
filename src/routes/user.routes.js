const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateCurrentWeight,
} = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { imageUpload } = require("../middlewares/upload");

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, imageUpload.single("profileImage"), updateProfile);
router.post("/update-weight", authMiddleware, updateCurrentWeight);

module.exports = router;
 