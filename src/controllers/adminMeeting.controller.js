const bookingModel = require("../models/booking.model");

const getAllMeetings = async (req, res) => {
  try {
    const meetings = await bookingModel
      .find()
      .populate("userId", "profilePicture fullname email");
    res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllMeetings };
