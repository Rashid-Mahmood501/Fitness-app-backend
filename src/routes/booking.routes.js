const express = require("express");
const {
  saveBooking,
  getBooking,
} = require("../controllers/booking.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/save", authMiddleware, saveBooking);
router.get("/get", authMiddleware, getBooking);

module.exports = router;
