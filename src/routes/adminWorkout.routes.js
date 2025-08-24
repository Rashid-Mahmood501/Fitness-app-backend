const express = require("express");
const { videoUpload } = require("../middlewares/upload");
const {
  createWorkout,
  allWorkouts,
  updateWorkout,
  uploadVideo,
} = require("../controllers/adminWorkout.controller");

const router = express.Router();

router.post("/save",  createWorkout);
router.put("/update/:id", updateWorkout);
router.post("/upload-video", videoUpload.single("video"), uploadVideo);
router.get("/all", allWorkouts);
module.exports = router;
