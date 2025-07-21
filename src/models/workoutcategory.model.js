const mongoose = require("mongoose");

const workoutCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WorkoutCategory", workoutCategorySchema);
