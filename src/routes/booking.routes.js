const express = require("express");
const {
  saveBooking,
  getBooking,
  deleteBooking,
} = require("../controllers/booking.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/save", authMiddleware, saveBooking);
router.get("/get", authMiddleware, getBooking);
router.delete("/delete/:bookingId", authMiddleware, deleteBooking);

module.exports = router;
