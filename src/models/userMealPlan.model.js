const mongoose = require("mongoose");

const mealOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    foodName: { type: String, required: true },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snacks"],
      required: true,
    },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    fat: { type: Number, required: true },
    carbs: { type: Number, required: true },
    preparation: { type: String },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    mealOptions: {
      type: [mealOptionSchema],
    },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const userMealPlanSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["muscle-mass", "weight-loss", "bulk-up"],
      required: true,
    },
    days: {
      type: [daySchema],
    },
    totalCalories: { type: Number, required: true },
    totalProtein: { type: Number, required: true },
    totalFat: { type: Number, required: true },
    totalCarbs: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserMealPlan", userMealPlanSchema);
