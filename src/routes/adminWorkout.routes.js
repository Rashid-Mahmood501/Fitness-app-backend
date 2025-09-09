const express = require("express");
const { videoUpload } = require("../middlewares/upload");
const {
  createWorkout,
  allWorkouts,
  updateWorkout,
  uploadVideo,
  deleteWorkout,
} = require("../controllers/adminWorkout.controller");

const router = express.Router();

router.post("/save",  createWorkout);
router.put("/update/:id", updateWorkout);
router.post("/upload-video", videoUpload.single("video"), uploadVideo);
router.get("/all", allWorkouts);
router.delete("/delete/:id", deleteWorkout);

module.exports = router;
