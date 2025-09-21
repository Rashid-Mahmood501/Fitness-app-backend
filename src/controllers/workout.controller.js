const User = require("../models/user.model");
const workoutPlan = require("../models/workoutPlan.model");
const UserWorkoutPlan = require("../models/userWorkoutPlan.model");
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

    // 1. First check if user already has a saved UserWorkoutPlan
    let plans = await UserWorkoutPlan.find({
      userId,
      planId: userGoal,
    })
      .populate("days.exercises")
      .lean();

    // 2. If no UserWorkoutPlan exists, fetch from WorkoutPlan and create one
    if (!plans || plans.length === 0) {
      const basePlans = await workoutPlan
        .find({
          planId: userGoal,
          $expr: { $eq: [{ $size: "$days" }, workoutDays] },
        })
        .populate("days.exercises")
        .lean();

      if (!basePlans || basePlans.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "No matching workout plan found" });
      }

      // Save as UserWorkoutPlan(s) for the user
      const createdPlans = [];
      for (const basePlan of basePlans) {
        const newPlan = new UserWorkoutPlan({
          planId: basePlan.planId,
          userId,
          days: basePlan.days,
        });
        const savedPlan = await newPlan.save();
        createdPlans.push(await savedPlan.populate("days.exercises"));
      }

      plans = createdPlans.map((plan) => plan.toObject());
    }

    // 3. Collect all exercise IDs to fetch alternatives
    const allExerciseIds = [];
    for (const plan of plans) {
      for (const day of plan.days) {
        for (const exercise of day.exercises) {
          allExerciseIds.push(exercise._id);
        }
      }
    }

    // 4. Fetch all alternatives in one query
    const allAlternatives = await Workout.find({
      parentId: { $in: allExerciseIds },
    }).lean();

    // 5. Group alternatives by parentId for quick lookup
    const alternativesMap = {};
    allAlternatives.forEach((alt) => {
      const parentId = alt.parentId.toString();
      if (!alternativesMap[parentId]) {
        alternativesMap[parentId] = [];
      }
      alternativesMap[parentId].push(alt);
    });

    // 6. Add alternatives to each exercise
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
