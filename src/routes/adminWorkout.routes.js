const express = require("express");
const { videoUpload } = require("../middlewares/upload");
const {
  createWorkout,
  allWorkouts,
  updateWorkout,
} = require("../controllers/adminWorkout.controller");

const router = express.Router();

router.post("/save", videoUpload.single("video"), createWorkout);
router.put("/update/:id", videoUpload.single("video"), updateWorkout);
router.get("/all", allWorkouts);
module.exports = router;
