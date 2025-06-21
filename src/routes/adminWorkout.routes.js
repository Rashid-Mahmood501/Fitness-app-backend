const express = require("express");
const { videoUpload } = require("../middlewares/upload");
const { createWorkout } = require("../controllers/adminWorkout.controller");

const router = express.Router();

router.post("/save", videoUpload.single("video"), createWorkout);
module.exports = router;
