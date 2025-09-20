const UserWorkoutPlan = require("../models/userWorkoutPlan.model");

const updateWorkoutPlan = async (req, res) => {
  const { id } = req.params;
  const { planId, days } = req.body;
  try {
    const existingPlan = await UserWorkoutPlan.findById(id);
    if (!existingPlan) {
      return res.status(404).json({ message: "Workout plan not found" });
    }

    existingPlan.planId = planId;
    existingPlan.days = days;

    await existingPlan.save();

    res.status(200).json({
      success: true,
      message: "Workout plan updated successfully",
      plan: existingPlan,
    });
  } catch (error) {
    console.error("Error updating workout plan:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllUserWorkoutPlans = async (req, res) => {
  try {
    const plans = await UserWorkoutPlan.find()
      .populate({
        path: "userId",
        model: "User",
      })
      .populate({
        path: "days.exercises",
        model: "Workout",
      });

    res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error("Error fetching workout plans:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  updateWorkoutPlan,
  getAllUserWorkoutPlans,
};
