const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateCurrentWeight,
  updateFullName,
  uploadProfileImage,
} = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { imageUpload } = require("../middlewares/upload");

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware,  updateProfile);
router.post("/update-weight", authMiddleware, updateCurrentWeight);
router.put("/update-fullname", authMiddleware, updateFullName);

router.post("/upload-profile-image", authMiddleware, imageUpload.single("profileImage"), uploadProfileImage);

module.exports = router;
 