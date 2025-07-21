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

    res
      .status(201)
      .json({
        success: true,
        message: "Workout plan created successfully",
        plan: newPlan,
      });
  } catch (error) {
    console.error("Error creating workout plan:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { saveWorkoutPlan };
