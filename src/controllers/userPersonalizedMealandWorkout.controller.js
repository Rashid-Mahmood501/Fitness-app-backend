const User = require("../models/user.model");
const UserWorkoutPlan = require("../models/userWorkoutPlan.model");
const workoutPlan = require("../models/workoutPlan.model");
const MealPlan = require("../models/adminMeal.model");
const UserMealPlan = require("../models/userMealPlan.model");

const getUserWorkoutAndMeal = async (req, res) => {
  try {
    const userId = req.userId;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Determine user goal
    let userGoal;
    const goal = user.goal?.toLowerCase();

    if (goal === "build muscle mass") {
      userGoal = "muscle-mass";
    } else if (goal === "lose weight") {
      userGoal = "weight-loss";
    } else if (goal === "bulk up") {
      userGoal = "bulk-up";
    } else {
      return res.status(400).json({
        success: false,
        error: "User goal is not valid or supported.",
      });
    }

    let userWorkoutPlan = await UserWorkoutPlan.findOne({
      userId,
      planId: userGoal,
    })
      .populate("days.exercises")
      .lean();

    let userMealPlan = await UserMealPlan.findOne({
      userId,
    }).lean();

    let workoutCreated = false;
    let mealCreated = false;

    // Create UserWorkoutPlan if it doesn't exist
    if (!userWorkoutPlan) {
      // Find base workout plan (always 7 days as specified)
      const baseWorkoutPlan = await workoutPlan
        .findOne({
          planId: userGoal,
          $expr: { $eq: [{ $size: "$days" }, 7] }, // Always 7 days
        })
        .populate("days.exercises")
        .lean();

      if (!baseWorkoutPlan) {
        return res.status(404).json({
          success: false,
          error: "No matching workout plan found",
        });
      }

      // Create new UserWorkoutPlan
      const newWorkoutPlan = new UserWorkoutPlan({
        planId: baseWorkoutPlan.planId,
        userId,
        days: baseWorkoutPlan.days,
        isCustomized: false, // Default to false
      });

      const savedWorkoutPlan = await newWorkoutPlan.save();
      userWorkoutPlan = await savedWorkoutPlan.populate("days.exercises");
      userWorkoutPlan = userWorkoutPlan.toObject();
      workoutCreated = true;
    }

    // Create UserMealPlan if it doesn't exist
    if (!userMealPlan) {
      const adminMealPlan = await MealPlan.findOne({ type: userGoal }).lean();

      if (!adminMealPlan) {
        return res.status(404).json({
          success: false,
          error: "Admin meal plan not found.",
        });
      }

      userMealPlan = await UserMealPlan.create({
        id: adminMealPlan.id,
        userId,
        title: adminMealPlan.title,
        type: adminMealPlan.type,
        days: adminMealPlan.days,
        totalCalories: adminMealPlan.totalCalories,
        totalProtein: adminMealPlan.totalProtein,
        totalFat: adminMealPlan.totalFat,
        totalCarbs: adminMealPlan.totalCarbs,
        isCustomized: false, // Default to false
      });
      mealCreated = true;
    }

    // If workout plan was created, fetch alternatives for exercises
    if (workoutCreated) {
      // Collect all exercise IDs to fetch alternatives
      const allExerciseIds = [];
      for (const day of userWorkoutPlan.days) {
        for (const exercise of day.exercises) {
          allExerciseIds.push(exercise._id);
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
      for (const day of userWorkoutPlan.days) {
        day.exercises = day.exercises.map((exercise) => ({
          ...exercise,
          alternatives: alternativesMap[exercise._id.toString()] || [],
        }));
      }
    }

    // Determine personalization status
    // Both must be true for overall status to be true
    // If one is false or both are false, return false
    const isPersonalized =
      userWorkoutPlan.isCustomized && userMealPlan.isCustomized;

    res.status(200).json({
      success: true,
      data: {
        workout: userWorkoutPlan,
        meal: userMealPlan,
        isPersonalized: isPersonalized,
      },
      created: {
        workout: workoutCreated,
        meal: mealCreated,
      },
    });
  } catch (err) {
    console.error("Error in getUserWorkoutAndMeal:", err);
    res.status(500).json({
      success: false,
      error: "Something went wrong",
      details: err.message,
    });
  }
};

module.exports = {
  getUserWorkoutAndMeal,
};
