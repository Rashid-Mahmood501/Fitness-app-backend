const mongoose = require("mongoose");

const mealOptionSchema = new mongoose.Schema({
  foodName: { type: String, required: true },
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snack"],
    required: true,
  },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  fat: { type: Number, required: true },
  carbs: { type: Number, required: true },
  preparation: { type: String },
  image: { type: String },
  id: { type: String },
});

const daySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  mealOptions: {
    type: [mealOptionSchema],
  },
});

const mealPlanSchema = new mongoose.Schema(
  {
    planTitle: { type: String, required: true },
    days: {
      type: [daySchema],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MealPlan", mealPlanSchema);
