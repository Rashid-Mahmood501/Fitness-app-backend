const Workout = require("../models/workout.model");

const createWorkout = async (req, res) => {
  try {
    console.dir(req.file, { depth: null });
    console.dir(req.body, { depth: null });

    const { name, muscleGroup, setType, reps, comments, suggestion } = req.body;

    const equipments = Array.isArray(req.body.equipments)
      ? req.body.equipments
      : [req.body.equipments];

    const videoUrl = req.file?.path;
    if (!videoUrl)
      return res.status(400).json({ error: "Video upload failed" });

    const workout = await Workout.create({
      name,
      muscleGroup,
      setType,
      reps,
      equipments,
      comments,
      suggestion,
      video: videoUrl,
    });

    console.log("Workout saved:", workout);

    res.json({ success: true, workout });
  } catch (error) {
    console.error("Error saving workout:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateWorkout = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, muscleGroup, setType, reps, comments, suggestion } = req.body;
    const videoUrl = req.file?.path;

    // Fetch the existing workout first
    const existingWorkout = await Workout.findById(id);
    if (!existingWorkout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    // Update with new or existing video
    const updatedWorkout = await Workout.findByIdAndUpdate(
      id,
      {
        name,
        muscleGroup,
        setType,
        reps,
        comments,
        suggestion,
        video: videoUrl || existingWorkout.video,
      },
      { new: true }
    );

    res.json({ success: true, workout: updatedWorkout });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const allWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find().sort({ createdAt: -1 });
    res.json({ success: true, workouts });
  } catch (error) {
    console.error("Error retrieving workouts:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createWorkout,
  allWorkouts,
  updateWorkout,
};
