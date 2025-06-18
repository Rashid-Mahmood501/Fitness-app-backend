const User = require("../models/user.model");
const Workout = require("../models/workout.model");

const getUserWorkout = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const workout = await Workout.find();
    res.json({
      success: true,
      data: workout,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Something went wrong",
      details: err.message,
    });
  }
};

module.exports = { getUserWorkout };
