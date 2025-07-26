const Meal = require("../models/meal.model");
const User = require("../models/user.model");
const { generateMealsFromDB } = require("../utils/mealGenerator");
const MealPlan = require("../models/adminMeal.model");

function calculateUserMacros(user) {
  const gender = user.gender?.toLowerCase();
  const activityLevel = user.activityLevel?.toLowerCase();
  const goal = user.goal?.toLowerCase();
  const { weight, height, age } = user;

  if (!weight || !height || !age || !activityLevel || !gender) {
    throw new Error(
      "Missing or invalid user info (weight, height, age, activityLevel, gender)"
    );
  }

  let bmr = 10 * weight + 6.25 * height - 5 * age;
  bmr += gender === "male" ? 5 : gender === "female" ? -161 : 0;

  const multipliers = {
    sedentary: 1.2,
    "lightly active": 1.375,
    "moderately active": 1.55,
    "very active": 1.725,
    "extra active": 1.9,
  };

  const multiplier = multipliers[activityLevel];
  if (!multiplier) {
    throw new Error("Invalid activity level");
  }

  let tdee = bmr * multiplier;

  if (goal === "lose weight") tdee *= 0.8;
  else if (goal === "build muscle mass" || goal === "bulk up") tdee *= 1.15;

  const protein = weight * 2;
  const fat = weight * 1;
  const proteinCal = protein * 4;
  const fatCal = fat * 9;
  const carbCal = tdee - (proteinCal + fatCal);
  const carbs = Math.max(0, carbCal / 4);

  return {
    totalCalories: Math.round(tdee),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
  };
}

const suggestAllMeals = async (req, res) => {
  try {
    const userId = req.userId;
    console.log(userId);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const macros = calculateUserMacros(user);
    const suggestedMeals = await generateMealsFromDB(macros);

    res.json({
      success: true,
      message: "Meal Generated",
      data: {
        macros,
        suggestedMeals,
      },
    });
  } catch (err) {
    console.error("Error suggesting meals:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const saveUserMeals = async (req, res) => {
  try {
    const userId = req.userId;
    const meals = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Normalize user data to match enum values
    user.gender = user.gender?.toLowerCase();
    user.activityLevel = user.activityLevel?.toLowerCase();
    user.goal = user.goal?.toLowerCase();

    if (!Array.isArray(meals)) {
      return res.status(400).json({ error: "Invalid meals data format" });
    }

    const mealsWithUserId = meals.map((meal) => ({
      ...meal,
      userId,
    }));

    const savedMeals = await Meal.insertMany(mealsWithUserId);

    user.mealGenerated = true;
    await user.save();

    res.json({
      success: true,
      message: "Meals saved successfully",
      data: savedMeals,
    });
  } catch (err) {
    console.error("Error saving meals:", err);
    res.status(500).json({
      error: "Something went wrong",
      details: err.message,
    });
  }
};

const getUserMeals = async (req, res) => {
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

    const plans = await MealPlan.find({
      planTitle: userGoal,
    }).lean();

    const transformedData = transformMealPlans(plans);

    res.json({
      success: true,
      data: transformedData,
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

const transformMealPlans = (plans) => {
  const mealTypeMap = {
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
  };

  // Process each plan to find the first occurrence of each meal type
  for (const plan of plans) {
    // Check if this plan contains any specific meal type
    const mealTypeInPlan = getMealTypeFromPlan(plan);

    if (mealTypeInPlan && !mealTypeMap[mealTypeInPlan]) {
      // Clone the plan and add the meal type as key
      const transformedPlan = {
        _id: plan._id,
        planTitle: plan.planTitle,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        __v: plan.__v,
      };

      // Add the days array under the meal type key
      transformedPlan[mealTypeInPlan] = plan.days;

      mealTypeMap[mealTypeInPlan] = transformedPlan;
    }
  }

  // Convert to array, filtering out null values
  return Object.values(mealTypeMap).filter((plan) => plan !== null);
};

const getMealTypeFromPlan = (plan) => {
  // Check the first day's first meal option to determine the meal type of this plan
  if (
    plan.days &&
    plan.days.length > 0 &&
    plan.days[0].mealOptions &&
    plan.days[0].mealOptions.length > 0
  ) {
    return plan.days[0].mealOptions[0].mealType;
  }
  return null;
};

module.exports = {
  suggestAllMeals,
  saveUserMeals,
  getUserMeals,
};
