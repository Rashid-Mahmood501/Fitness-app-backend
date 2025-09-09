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

const deleteWorkoutCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const workoutCategory = await WorkoutCategory.findByIdAndDelete(id);
    if (!workoutCategory) {
      return res.status(404).json({ message: "Workout category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Workout category deleted successfully",
      data: workoutCategory,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  saveWorkoutCategory,
  getAllWorkoutCategories,
  updateWorkoutCategory,
  deleteWorkoutCategory,
};
