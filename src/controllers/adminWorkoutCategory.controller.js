const WorkoutCategory = require("../models/workoutcategory.model");

const saveWorkoutCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const workoutCategory = await WorkoutCategory.create({ name });
    res.status(201).json({
      success: true,
      message: "Workout category saved successfully",
      data: workoutCategory,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllWorkoutCategories = async (req, res) => {
  try {
    const workoutCategories = await WorkoutCategory.find();
    res.status(200).json({ success: true, data: workoutCategories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateWorkoutCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const workoutCategory = await WorkoutCategory.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );
    res.status(200).json({ success: true, data: workoutCategory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  saveWorkoutCategory,
  getAllWorkoutCategories,
  updateWorkoutCategory,
};
