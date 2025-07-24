const User = require("../models/user.model");
const workoutPlan = require("../models/workoutPlan.model");
const Workout = require("../models/workout.model");
const WorkoutCategory = require("../models/workoutcategory.model");

const getUserWorkout = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const workoutDays = parseInt(user.workoutDays);
    let userGoal;
    const goal = user.goal;

    if (goal === "build muscle mass") {
      userGoal = "muscle-mass";
    } else if (goal === "lose weight") {
      userGoal = "weight-loss";
    } else if (goal === "bulk up") {
      userGoal = "bulk-up";
    }

    console.log(userGoal, workoutDays);

    // Find workout plans matching planId and number of days
    const plans = await workoutPlan
      .find({
        planId: userGoal,
        $expr: { $eq: [{ $size: "$days" }, workoutDays] },
      })
      .populate("days.exercises")
      .lean(); // Use lean() for better performance since we're modifying the data

    // Collect all exercise IDs to fetch alternatives in bulk
    const allExerciseIds = [];
    for (const plan of plans) {
      for (const day of plan.days) {
        for (const exercise of day.exercises) {
          allExerciseIds.push(exercise._id);
        }
      }
    }

    // Fetch all alternatives in one query
    const allAlternatives = await Workout.find({
      parentId: { $in: allExerciseIds },
    }).lean();

    // Group alternatives by parentId for quick lookup
    const alternativesMap = {};
    allAlternatives.forEach((alt) => {
      const parentId = alt.parentId.toString();
      if (!alternativesMap[parentId]) {
        alternativesMap[parentId] = [];
      }
      alternativesMap[parentId].push(alt);
    });

    // Add alternatives to each exercise
    for (const plan of plans) {
      for (const day of plan.days) {
        day.exercises = day.exercises.map((exercise) => ({
          ...exercise,
          alternatives: alternativesMap[exercise._id.toString()] || [],
        }));
      }
    }

    res.json({
      success: true,
      data: plans,
    });
  } catch (err) {
    console.error("Error in getUserWorkout:", err);
    res.status(500).json({
      success: false,
      error: "Something went wrong",
      details: err.message,
    });
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

module.exports = { getUserWorkout, getAllWorkoutCategories };
