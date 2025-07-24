const Workout = require("../models/workout.model");

const createWorkout = async (req, res) => {
  try {
    const {
      workoutName,
      setType,
      video,
      muscleGroup,
      reps,
      additionalComments,
      workoutSuggestion,
      alternativeExercises = [],
    } = req.body;

    const mainWorkout = new Workout({
      name: workoutName,
      muscleGroup,
      setType,
      reps,
      comments: additionalComments,
      suggestion: workoutSuggestion,
      video,
    });
    await mainWorkout.save();

    let alternatives = [];
    if (
      Array.isArray(alternativeExercises) &&
      alternativeExercises.length > 0
    ) {
      alternatives = await Promise.all(
        alternativeExercises.map(async (alt) => {
          const ex = alt.exercise || {};
          const altWorkout = new Workout({
            name: ex.workoutName,
            muscleGroup: ex.muscleGroup,
            setType: ex.setType,
            reps: ex.reps,
            comments: ex.additionalComments,
            suggestion: ex.workoutSuggestion,
            video: ex.video,
            parentId: mainWorkout._id,
          });
          await altWorkout.save();
          return altWorkout;
        })
      );
    }

    res.status(201).json({
      success: true,
      workout: mainWorkout,
      alternatives,
    });
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

const uploadVideo = async (req, res) => {
  try {
    const videoUrl = req.file?.path;
    if (!videoUrl)
      return res.status(400).json({ error: "Video upload failed" });
    res.json({ success: true, videoUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const allWorkouts = async (req, res) => {
  try {
    const mainWorkouts = await Workout.find({ parentId: null }).sort({
      createdAt: -1,
    });

    const workoutsWithAlternatives = await Promise.all(
      mainWorkouts.map(async (workout) => {
        const alternatives = await Workout.find({ parentId: workout._id });
        return {
          ...workout.toObject(),
          alternatives,
        };
      })
    );

    res.json({ success: true, workouts: workoutsWithAlternatives });
  } catch (error) {
    console.error("Error retrieving workouts:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createWorkout,
  allWorkouts,
  updateWorkout,
  uploadVideo,
};
