const { sendEmail } = require("../config/email");
const bookingModel = require("../models/booking.model");
const User = require("../models/user.model");

const saveBooking = async (req, res) => {
  try {
    const { date, time, location } = req.body;
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const booking = await bookingModel.create({ userId, date, time, location });
    await sendEmail(
      "Jairsfitness7@gmail.com",
      "d-84e91982385d4243bc663cadc011780c",
      {
        NAME: user.fullname,
        EMAIL: user.email,
        MEETING_TYPE: location,
        DATE: date,
        TIME: time,
      }
    );
    res
      .status(200)
      .json({ message: "Booking saved successfully", data: booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBooking = async (req, res) => {
  try {
    const userId = req.userId;
    const booking = await bookingModel.find({ userId });
    res
      .status(200)
      .json({ message: "Booking fetched successfully", data: booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    const booking = await bookingModel.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({
        message:
          "Booking not found or you don't have permission to delete this booking",
      });
    }

    await bookingModel.findByIdAndDelete(bookingId);

    res.status(200).json({
      message: "Booking deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { saveBooking, getBooking, deleteBooking };
