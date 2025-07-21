const express = require("express");
const { getAllMeetings } = require("../controllers/adminMeeting.controller");

const router = express.Router();

router.get("/all", getAllMeetings);

module.exports = router;
