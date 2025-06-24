const express = require("express");
const { videoUpload } = require("../middlewares/upload");
const {
  createWorkout,
  allWorkouts,
} = require("../controllers/adminWorkout.controller");

const router = express.Router();

router.post("/save", videoUpload.single("video"), createWorkout);
router.get("/all", allWorkouts);
module.exports = router;
