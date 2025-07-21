const MealPlan = require("../models/adminMeal.model");

const saveMeal = async (req, res) => {
  try {
    const { planTitle, days } = req.body;

    const mealPlan = new MealPlan({
      planTitle,
      days,
    });

    await mealPlan.save();

    res.status(201).json({
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

module.exports = {
  saveMeal,
  uploadImage,
  // getAllMeals,
  // updateMeal,
  // deleteMeal,
};
