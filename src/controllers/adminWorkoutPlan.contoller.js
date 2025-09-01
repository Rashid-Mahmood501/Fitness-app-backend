const WorkoutPlan = require("../models/workoutPlan.model");

const saveWorkoutPlan = async (req, res) => {
  try {
    const { workoutPlanId, selectedDays, dayCategories, dayExercises } =
      req.body;

    const days = [];

    for (let i = 1; i <= selectedDays; i++) {
      days.push({
        dayNumber: i,
        category: dayCategories[i],
        exercises: dayExercises[i],
      });
    }

    const newPlan = new WorkoutPlan({
      planId: workoutPlanId,
      days,
    });

    await newPlan.save();

    res.status(201).json({
      success: true,
      message: "Workout plan created successfully",
      plan: newPlan,
    });
  } catch (error) {
    console.error("Error creating workout plan:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

const updateWorkoutPlan = async (req, res) => {
  const { id } = req.params;
  const { planId, days } = req.body;
  try {
    const existingPlan = await WorkoutPlan.findById(id);
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

const getAllWorkoutPlans = async (req, res) => {
  try {
    const plans = await WorkoutPlan.find().populate({
      path: "days.exercises",
      model: "Workout",
    });

    res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error("Error fetching workout plans:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

const deleteWorkoutPlan = async (req, res) => {
  const { id } = req.params;

  try {
    const workoutPlan = await WorkoutPlan.findByIdAndDelete(id);
    if (!workoutPlan) {
      return res.status(404).json({ message: "Workout plan not found" });
    }

    res.status(200).json({
      success: true,
      message: "Workout plan deleted successfully",
      data: workoutPlan,
    });
  } catch (error) {
    console.error("Error deleting workout plan:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  saveWorkoutPlan,
  getAllWorkoutPlans,
  updateWorkoutPlan,
  deleteWorkoutPlan,
};
