const express = require("express");
const {
  saveBooking,
  getBooking,
  deleteBooking,
} = require("../controllers/booking.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const subscriptionMiddleware = require("../middlewares/subscription.middleware");

const router = express.Router();

router.post("/save", authMiddleware, subscriptionMiddleware, saveBooking);
router.get("/get", authMiddleware, subscriptionMiddleware, getBooking);
router.delete("/delete/:bookingId", authMiddleware, subscriptionMiddleware, deleteBooking);

module.exports = router;
