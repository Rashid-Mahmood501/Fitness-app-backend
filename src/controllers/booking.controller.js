const bookingModel = require("../models/booking.model");

const saveBooking = async (req, res) => {
  try {
    const { date, time, location } = req.body;
    const userId = req.userId;
    const booking = await bookingModel.create({ userId, date, time, location });
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
        message: "Booking not found or you don't have permission to delete this booking" 
      });
    }

    await bookingModel.findByIdAndDelete(bookingId);

    res.status(200).json({ 
      message: "Booking deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { saveBooking, getBooking, deleteBooking };
