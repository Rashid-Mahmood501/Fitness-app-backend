const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateCurrentWeight,
  updateFullName,
  uploadProfileImage,
  deleteAccount,
} = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { imageUpload } = require("../middlewares/upload");
const subscriptionMiddleware = require("../middlewares/subscription.middleware");

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.post(
  "/update-weight",
  authMiddleware,
  subscriptionMiddleware,
  updateCurrentWeight
);
router.put("/update-fullname", authMiddleware, updateFullName);

router.post(
  "/upload-profile-image",
  authMiddleware,
  imageUpload.single("profileImage"),
  uploadProfileImage
);

router.delete("/delete-account", authMiddleware, deleteAccount);

module.exports = router;
