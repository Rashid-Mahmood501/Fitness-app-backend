const MealStore = require("../models/mealStore.model");

const saveMeal = async (req, res) => {
  try {
    const { name, mealType, calories, protein, fat, carbs } = req.body;
    const imageUrl = req.file?.path;
    if (!imageUrl) {
      return res.status(400).json({ error: "Image upload failed" });
    }
    const meal = await MealStore.create({
      name,
      type: mealType,
      calories,
      protein,
      fat,
      carbs,
      image: imageUrl,
    });
    res.status(200).json({
      message: "Meal saved successfully",
      data: meal,
    });
  } catch (err) {
    console.error("Error saving meals:", err);
    res.status(500).json({
      error: "Something went wrong",
      details: err.message,
    });
  }
};

const getAllMeals = async (req, res) => {
  try {
    const meals = await MealStore.find();
    res.status(200).json({
      message: "Meals retrieved successfully",
      data: meals,
    });
  } catch (err) {
    console.error("Error retrieving meals:", err);
    res.status(500).json({
      error: "Something went wrong",
      details: err.message,
    });
  }
};

const updateMeal = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, mealType, calories, protein, fat, carbs } = req.body;
    const imageUrl = req.file?.path;

    const updateData = {
      name,
      type: mealType,
      calories,
      protein,
      fat,
      carbs,
    };

    if (imageUrl) {
      updateData.image = imageUrl;
    }

    const updatedMeal = await MealStore.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedMeal) {
      return res.status(404).json({ error: "Meal not found" });
    }

    res.status(200).json({
      message: "Meal updated successfully",
      data: updatedMeal,
    });
  } catch (err) {
    console.error("Error retrieving meals:", err);
    res.status(500).json({
      error: "Something went wrong",
      details: err.message,
    });
  }
};

const deleteMeal = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedMeal = await MealStore.findByIdAndDelete(id);
    if (!deletedMeal) {
      return res.status(404).json({ error: "Meal not found" });
    }
    res.status(200).json({
      message: "Meal deleted successfully",
      data: deletedMeal,
    });
  } catch (err) {
    console.error("Error retrieving meals:", err);
    res.status(500).json({
      error: "Something went wrong",
      details: err.message,
    });
  }
};

module.exports = {
  saveMeal,
  getAllMeals,
  updateMeal,
  deleteMeal,
};
