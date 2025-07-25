const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Bookings", bookingSchema);
