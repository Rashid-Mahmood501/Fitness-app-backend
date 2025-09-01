const MealPlan = require("../models/adminMeal.model");
const UserMealPlan = require("../models/userMealPlan.model");

const saveMeal = async (req, res) => {
  try {
    const {
      id,
      title,
      type,
      days,
      totalCalories,
      totalProtein,
      totalFat,
      totalCarbs,
    } = req.body;

    const mealPlan = new MealPlan({
      id,
      title,
      type,
      days,
      totalCalories,
      totalProtein,
      totalFat,
      totalCarbs,
    });

    await mealPlan.save();

    res.status(201).json({
      success: true,
      message: "Meal plan saved successfully",
      data: mealPlan,
    });
  } catch (error) {
    console.error("Error saving meal plan:", error);
    res.status(500).json({
      message: "Server error while saving meal plan",
      error: error.message,
    });
  }
};

const getAllMealsPlans = async (req, res) => {
  try {
    const mealPlans = await MealPlan.find();
    res.status(200).json({
      success: true,
      data: mealPlans,
    });
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    res.status(500).json({
      message: "Server error while fetching meal plans",
      error: error.message,
    });
  }
};

const updateMealInDay = async (req, res) => {
  const {
    mealPlanId,
    day,
    id,
    foodName,
    calories,
    protein,
    fat,
    carbs,
    preparation,
    image,
    mealType,
  } = req.body;

  try {
    console.log(req.body);
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found" });
    }

    const dayObj = mealPlan.days.find((d) => d.day === day);
    if (!dayObj) {
      return res.status(404).json({ message: "Day not found" });
    }

    const meal = dayObj.mealOptions.find((m) => m.id === id);
    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    // Update fields
    Object.assign(meal, {
      foodName,
      calories,
      protein,
      fat,
      carbs,
      preparation,
      image,
      mealType,
    });

    await mealPlan.save();

    res.status(200).json({
      success: true,
      message: "Meal updated successfully",
      data: meal,
    });
  } catch (error) {
    console.error("Update meal error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addMealToDay = async (req, res) => {
  const {
    mealPlanId,
    day,
    id,
    foodName,
    calories,
    protein,
    fat,
    carbs,
    preparation,
    image,
    mealType,
  } = req.body;

  try {
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found" });
    }

    const dayObj = mealPlan.days.find((d) => d.day === day);
    if (!dayObj) {
      return res.status(404).json({ message: "Day not found" });
    }

    const alreadyExists = dayObj.mealOptions.some((m) => m.id === id);
    if (alreadyExists) {
      return res
        .status(400)
        .json({ message: "Meal with this ID already exists" });
    }

    // Add new meal
    dayObj.mealOptions.push({
      id,
      foodName,
      calories,
      protein,
      fat,
      carbs,
      preparation,
      image,
      mealType,
    });

    await mealPlan.save();

    res.status(201).json({
      success: true,
      message: "Meal added successfully",
      data: dayObj.mealOptions,
    });
  } catch (error) {
    console.error("Add meal error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteMealFromDay = async (req, res) => {
  const { mealPlanId, day, id } = req.body;

  try {
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found" });
    }

    const dayObj = mealPlan.days.find((d) => d.day === day);
    if (!dayObj) {
      return res.status(404).json({ message: "Day not found" });
    }

    const initialLength = dayObj.mealOptions.length;
    dayObj.mealOptions = dayObj.mealOptions.filter((m) => m.id !== id);

    if (dayObj.mealOptions.length === initialLength) {
      return res.status(404).json({ message: "Meal not found" });
    }

    await mealPlan.save();

    res.status(200).json({
      success: true,
      message: "Meal deleted successfully",
      data: dayObj.mealOptions,
    });
  } catch (error) {
    console.error("Delete meal error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const uploadImage = async (req, res) => {
  try {
    const imageUrl = req.file?.path;
    console.log(imageUrl);
    if (!imageUrl)
      return res.status(400).json({ error: "Image upload failed" });

    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl,
    });
  } catch (error) {
    console.error("Error saving meal plan:", error);
    res.status(500).json({
      message: "Server error while saving meal plan",
      error: error.message,
    });
  }
};

const getAllUserMealPlans = async (req, res) => {
  try {
    const mealPlans = await UserMealPlan.find().populate("userId").lean();
    res.status(200).json({
      success: true,
      data: mealPlans,
    });
  } catch (error) {
    console.error("Error fetching user meal plans:", error);
    res.status(500).json({
      message: "Server error while fetching user meal plans",
      error: error.message,
    });
  }
};

const updateUserMealInDay = async (req, res) => {
  const {
    mealPlanId,
    day,
    id,
    foodName,
    calories,
    protein,
    fat,
    carbs,
    preparation,
    image,
    mealType,
  } = req.body;

  try {
    console.log(req.body);
    const mealPlan = await UserMealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found" });
    }

    const dayObj = mealPlan.days.find((d) => d.day === day);
    if (!dayObj) {
      return res.status(404).json({ message: "Day not found" });
    }

    const meal = dayObj.mealOptions.find((m) => m.id === id);
    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    Object.assign(meal, {
      foodName,
      calories,
      protein,
      fat,
      carbs,
      preparation,
      image,
      mealType,
    });

    await mealPlan.save();

    res.status(200).json({
      success: true,
      message: "Meal updated successfully",
      data: meal,
    });
  } catch (error) {
    console.error("Update meal error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteUserMealFromDay = async (req, res) => {
  const { mealPlanId, day, id } = req.body;

  try {
    const mealPlan = await UserMealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found" });
    }

    const dayObj = mealPlan.days.find((d) => d.day === day);
    if (!dayObj) {
      return res.status(404).json({ message: "Day not found" });
    }

    const initialLength = dayObj.mealOptions.length;
    dayObj.mealOptions = dayObj.mealOptions.filter((m) => m.id !== id);

    if (dayObj.mealOptions.length === initialLength) {
      return res.status(404).json({ message: "Meal not found" });
    }

    await mealPlan.save();

    res.status(200).json({
      success: true,
      message: "Meal deleted successfully",
      data: dayObj.mealOptions,
    });
  } catch (error) {
    console.error("Delete meal error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addUserMealToDay = async (req, res) => {
  const {
    mealPlanId,
    day,
    id,
    foodName,
    calories,
    protein,
    fat,
    carbs,
    preparation,
    image,
    mealType,
  } = req.body;

  try {
    const mealPlan = await UserMealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found" });
    }

    const dayObj = mealPlan.days.find((d) => d.day === day);
    if (!dayObj) {
      return res.status(404).json({ message: "Day not found" });
    }

    const alreadyExists = dayObj.mealOptions.some((m) => m.id === id);
    if (alreadyExists) {
      return res
        .status(400)
        .json({ message: "Meal with this ID already exists" });
    }

    // Add new meal
    dayObj.mealOptions.push({
      id,
      foodName,
      calories,
      protein,
      fat,
      carbs,
      preparation,
      image,
      mealType,
    });

    await mealPlan.save();

    res.status(201).json({
      success: true,
      message: "Meal added successfully",
      data: dayObj.mealOptions,
    });
  } catch (error) {
    console.error("Add meal error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteUserMealPlan = async (req, res) => {
  const { id } = req.params;

  try {
    const mealPlan = await UserMealPlan.findByIdAndDelete(id);
    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found" });
    }

    res.status(200).json({
      success: true,
      message: "Meal plan deleted successfully",
      data: mealPlan,
    });
  } catch (error) {
    console.error("Delete meal plan error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteMealPlan = async (req, res) => {
  const { id } = req.params;

  try {
    const mealPlan = await MealPlan.findByIdAndDelete(id);
    if (!mealPlan) {
      return res.status(404).json({ message: "Meal plan not found" });
    }

    res.status(200).json({
      success: true,
      message: "Meal plan deleted successfully",
      data: mealPlan,
    });
  } catch (error) {
    console.error("Delete meal plan error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  saveMeal,
  uploadImage,
  getAllMealsPlans,
  updateMealInDay,
  addMealToDay,
  deleteMealFromDay,
  getAllUserMealPlans,
  updateUserMealInDay,
  deleteUserMealFromDay,
  addUserMealToDay,
  deleteUserMealPlan,
  deleteMealPlan,
  // getAllMeals,
  // updateMeal,
  // deleteMeal,
};
